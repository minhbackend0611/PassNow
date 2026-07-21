import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  where
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { sendSystemMessage } from './chatService';
import {
  sendSellerConfirmedEmail,
  sendTransactionCancelledEmail,
  sendTransactionCompletedEmail,
  sendTransactionRequestedEmail
} from './emailService';
import { getUserById } from './userService';
import type { Listing, Transaction } from '../types';

const TRANSACTIONS_COLLECTION = 'transactions';
const LISTINGS_COLLECTION = 'listings';
const legacyReconciliationsInFlight = new Set<string>();

export const requestTransaction = async (
  listingId: string,
  listingTitle: string,
  sellerId: string,
  buyerId: string
): Promise<string | null> => {
  if (auth.currentUser?.uid !== buyerId || buyerId === sellerId) return null;

  try {
    // This also catches active legacy requests that used auto-generated IDs.
    const existing = await getTransactionByListingAndBuyer(listingId, buyerId);
    if (existing) {
      console.warn('User already has an active transaction for this listing');
      return null;
    }

    // A deterministic ID makes concurrent requests from the same buyer converge
    // on one document. The transaction also prevents requests after sell-out.
    const transactionRef = doc(
      db,
      TRANSACTIONS_COLLECTION,
      `${listingId}_${buyerId}`
    );
    const listingRef = doc(db, LISTINGS_COLLECTION, listingId);
    const created = await runTransaction(db, async (firestoreTransaction) => {
      const [listingSnap, existingTransactionSnap] = await Promise.all([
        firestoreTransaction.get(listingRef),
        firestoreTransaction.get(transactionRef)
      ]);
      if (!listingSnap.exists()) return false;

      const listing = listingSnap.data() as Listing;
      const completedCount = Math.max(0, Number(listing.completedCount) || 0);
      const quantity = Math.max(1, Number(listing.quantity) || 1);
      const hasActiveDeterministicRequest = existingTransactionSnap.exists()
        && (existingTransactionSnap.data() as Transaction).status !== 'cancelled';
      if (
        listing.sellerId !== sellerId
        || listing.status !== 'available'
        || completedCount >= quantity
        || hasActiveDeterministicRequest
      ) {
        return false;
      }

      const newTransaction: Omit<Transaction, 'id'> = {
        listingId,
        listingTitle: listing.title || listingTitle,
        sellerId: listing.sellerId,
        buyerId,
        sellerConfirmed: false,
        status: 'pending',
        createdAt: Date.now()
      };
      firestoreTransaction.set(transactionRef, newTransaction);
      return true;
    });

    if (!created) return null;

    try {
      await sendSystemMessage(
        listingId,
        sellerId,
        buyerId,
        'A buyer has requested to buy this item. Please check your Transactions page to manage requests.'
      );
    } catch (error) {
      console.error('Error sending transaction request notification:', error);
    }

    void getUserById(buyerId).then((buyer) =>
      sendTransactionRequestedEmail(
        sellerId,
        buyer?.displayName || 'A user',
        listingTitle,
        transactionRef.id
      )
    );

    return transactionRef.id;
  } catch (error) {
    console.error('Error requesting transaction:', error);
    return null;
  }
};

export const cancelTransaction = async (
  transactionId: string
): Promise<boolean> => {
  try {
    const transactionRef = doc(db, TRANSACTIONS_COLLECTION, transactionId);
    const transactionData = await runTransaction(db, async (firestoreTransaction) => {
      const transactionSnap = await firestoreTransaction.get(transactionRef);
      if (!transactionSnap.exists()) return null;

      const data = transactionSnap.data() as Transaction;
      if (
        auth.currentUser?.uid !== data.buyerId
        || data.status !== 'pending'
        || data.sellerConfirmed
      ) return null;

      firestoreTransaction.update(transactionRef, { status: 'cancelled' });
      return data;
    });

    if (!transactionData) return false;

    void getUserById(transactionData.buyerId).then((buyer) =>
      sendTransactionCancelledEmail(
        transactionData.sellerId,
        buyer?.displayName || 'The buyer',
        transactionData.listingTitle
      )
    );

    return true;
  } catch (error) {
    console.error('Error canceling transaction:', error);
    return false;
  }
};

const cancelRemainingPendingTransactions = async (
  listingId: string,
  completedTransactionId: string
): Promise<void> => {
  const pendingQuery = query(
    collection(db, TRANSACTIONS_COLLECTION),
    where('listingId', '==', listingId),
    where('status', '==', 'pending')
  );
  const pendingSnaps = await getDocs(pendingQuery);

  await Promise.all(pendingSnaps.docs.map(async (pendingSnap) => {
    if (pendingSnap.id === completedTransactionId) return;

    const cancelledTransaction = await runTransaction(db, async (firestoreTransaction) => {
      const freshSnap = await firestoreTransaction.get(pendingSnap.ref);
      if (!freshSnap.exists()) return null;

      const transactionData = freshSnap.data() as Transaction;
      if (transactionData.status !== 'pending' || transactionData.sellerConfirmed) return null;

      firestoreTransaction.update(freshSnap.ref, { status: 'cancelled' });
      return transactionData;
    });

    if (!cancelledTransaction) return;

    try {
      await sendSystemMessage(
        listingId,
        cancelledTransaction.sellerId,
        cancelledTransaction.buyerId,
        'The seller has sold out of this item. Your request is canceled.'
      );
    } catch (error) {
      console.error('Error sending sold-out notification:', error);
    }
  }));
};

export const sellerConfirmTransaction = async (
  transactionId: string
): Promise<boolean> => {
  try {
    const transactionRef = doc(db, TRANSACTIONS_COLLECTION, transactionId);
    const confirmationResult = await runTransaction(db, async (firestoreTransaction) => {
      const transactionSnap = await firestoreTransaction.get(transactionRef);
      if (!transactionSnap.exists()) return { outcome: 'invalid' as const };

      const transactionData = transactionSnap.data() as Transaction;
      if (auth.currentUser?.uid !== transactionData.sellerId) {
        return { outcome: 'invalid' as const };
      }

      if (transactionData.status === 'completed') {
        const listingRef = doc(db, LISTINGS_COLLECTION, transactionData.listingId);
        const listingSnap = await firestoreTransaction.get(listingRef);
        if (!listingSnap.exists()) {
          return {
            outcome: 'already-completed' as const,
            transactionData,
            soldOut: false
          };
        }

        const listing = listingSnap.data() as Listing;
        const completedCount = Math.max(0, Number(listing.completedCount) || 0);
        const quantity = Math.max(1, Number(listing.quantity) || 1);
        return {
          outcome: 'already-completed' as const,
          transactionData,
          soldOut: listing.status === 'completed' || completedCount >= quantity
        };
      }
      if (transactionData.status !== 'pending') {
        return { outcome: 'invalid' as const };
      }

      const listingRef = doc(db, LISTINGS_COLLECTION, transactionData.listingId);
      const listingSnap = await firestoreTransaction.get(listingRef);
      if (!listingSnap.exists()) return { outcome: 'invalid' as const };

      const listing = listingSnap.data() as Listing;
      const currentCompleted = Math.max(0, Number(listing.completedCount) || 0);
      const quantity = Math.max(1, Number(listing.quantity) || 1);
      if (currentCompleted >= quantity) return { outcome: 'invalid' as const };

      const newCompleted = currentCompleted + 1;
      const soldOut = newCompleted >= quantity;

      firestoreTransaction.update(transactionRef, {
        sellerConfirmed: true,
        status: 'completed',
        completedAt: Date.now()
      });
      firestoreTransaction.update(listingRef, {
        completedCount: newCompleted,
        ...(soldOut ? { status: 'completed' } : {})
      });

      return {
        outcome: 'completed' as const,
        transactionData,
        soldOut
      };
    });

    if (confirmationResult.outcome === 'invalid') return false;

    const { transactionData, soldOut } = confirmationResult;
    if (soldOut) {
      try {
        await cancelRemainingPendingTransactions(transactionData.listingId, transactionId);
      } catch (error) {
        // The transaction/inventory commit already succeeded. Report success and
        // let an idempotent retry attempt the sold-out cleanup again.
        console.error('Error canceling remaining sold-out requests:', error);
      }
    }

    if (confirmationResult.outcome === 'already-completed') return true;

    try {
      await sendSystemMessage(
        transactionData.listingId,
        transactionData.sellerId,
        transactionData.buyerId,
        'Transaction completed. The buyer can now review the handover.'
      );
    } catch (error) {
      console.error('Error sending completion notification:', error);
    }

    void getUserById(transactionData.sellerId).then((seller) =>
      sendSellerConfirmedEmail(
        transactionData.buyerId,
        seller?.displayName || 'The seller',
        transactionData.listingTitle,
        transactionId
      )
    );
    void sendTransactionCompletedEmail(
      transactionData.sellerId,
      transactionData.listingTitle,
      transactionId
    );

    return true;
  } catch (error) {
    console.error('Error seller confirming transaction:', error);
    return false;
  }
};

export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
  try {
    const transactions: Transaction[] = [];

    const buyerQuery = query(
      collection(db, TRANSACTIONS_COLLECTION),
      where('buyerId', '==', userId)
    );
    const buyerSnap = await getDocs(buyerQuery);
    buyerSnap.forEach((snapshot) => {
      transactions.push({ id: snapshot.id, ...snapshot.data() } as Transaction);
    });

    const sellerQuery = query(
      collection(db, TRANSACTIONS_COLLECTION),
      where('sellerId', '==', userId)
    );
    const sellerSnap = await getDocs(sellerQuery);
    sellerSnap.forEach((snapshot) => {
      if (!transactions.find((transaction) => transaction.id === snapshot.id)) {
        transactions.push({ id: snapshot.id, ...snapshot.data() } as Transaction);
      }
    });

    return transactions.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    return [];
  }
};

export const subscribeToUserTransactions = (
  userId: string,
  callback: (transactions: Transaction[]) => void
): (() => void) => {
  const buyerQuery = query(
    collection(db, TRANSACTIONS_COLLECTION),
    where('buyerId', '==', userId)
  );
  const sellerQuery = query(
    collection(db, TRANSACTIONS_COLLECTION),
    where('sellerId', '==', userId)
  );

  let buyerTransactions: Transaction[] = [];
  let sellerTransactions: Transaction[] = [];

  const updateAndNotify = () => {
    const merged = [...buyerTransactions, ...sellerTransactions];
    const uniqueMap = new Map<string, Transaction>();
    merged.forEach((transaction) => uniqueMap.set(transaction.id, transaction));
    callback(Array.from(uniqueMap.values()).sort((a, b) => b.createdAt - a.createdAt));
  };

  const unsubBuyer = onSnapshot(buyerQuery, (snapshot) => {
    buyerTransactions = snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data()
    } as Transaction));
    updateAndNotify();
  });

  const unsubSeller = onSnapshot(sellerQuery, (snapshot) => {
    sellerTransactions = snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data()
    } as Transaction));
    updateAndNotify();

    // Backfill transactions created by the old two-confirmation flow. Only the
    // seller subscription performs this write, and sellerConfirmTransaction is
    // idempotent so concurrent tabs cannot double-increment inventory.
    sellerTransactions
      .filter((transaction) =>
        transaction.status === 'pending'
        && transaction.sellerConfirmed
        && transaction.sellerId === userId
      )
      .forEach((transaction) => {
        if (legacyReconciliationsInFlight.has(transaction.id)) return;
        legacyReconciliationsInFlight.add(transaction.id);
        void sellerConfirmTransaction(transaction.id)
          .finally(() => legacyReconciliationsInFlight.delete(transaction.id));
      });
  });

  return () => {
    unsubBuyer();
    unsubSeller();
  };
};

export const getTransactionByListingAndBuyer = async (
  listingId: string,
  buyerId: string
): Promise<Transaction | null> => {
  try {
    const transactionQuery = query(
      collection(db, TRANSACTIONS_COLLECTION),
      where('listingId', '==', listingId),
      where('buyerId', '==', buyerId)
    );
    const snapshot = await getDocs(transactionQuery);
    if (snapshot.empty) return null;

    const transactions = snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data()
    } as Transaction));
    return transactions.find((transaction) => transaction.status !== 'cancelled') || null;
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return null;
  }
};
