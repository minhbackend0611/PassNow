import { collection, doc, query, where, getDocs, writeBatch, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { sendSystemMessage } from './chatService';
import type { Transaction } from '../types';

const TRANSACTIONS_COLLECTION = 'transactions';
const LISTINGS_COLLECTION = 'listings';

export const requestTransaction = async (
  listingId: string,
  listingTitle: string,
  sellerId: string,
  buyerId: string
): Promise<string | null> => {
  try {
    const batch = writeBatch(db);
    
    // Create new transaction doc
    const transactionRef = doc(collection(db, TRANSACTIONS_COLLECTION));
    const newTransaction: Omit<Transaction, 'id'> = {
      listingId,
      listingTitle,
      sellerId,
      buyerId,
      sellerConfirmed: false,
      buyerConfirmed: false,
      status: 'pending',
      createdAt: Date.now()
    };
    
    batch.set(transactionRef, newTransaction);

    await batch.commit();

    await sendSystemMessage(
      listingId, 
      sellerId, 
      buyerId, 
      '👋 A buyer has requested to buy this item! Please check your Transactions page to manage requests.'
    );

    return transactionRef.id;
  } catch (error) {
    console.error("Error requesting transaction:", error);
    return null;
  }
};

export const cancelTransaction = async (
  transactionId: string,
  listingId: string
): Promise<boolean> => {
  try {
    const batch = writeBatch(db);
    
    const transactionRef = doc(db, TRANSACTIONS_COLLECTION, transactionId);
    batch.delete(transactionRef);

    await batch.commit();
    return true;
  } catch (error) {
    console.error("Error canceling transaction:", error);
    return false;
  }
};

export const sellerConfirmTransaction = async (
  transactionId: string,
  listingId: string
): Promise<boolean> => {
  try {
    const transactionRef = doc(db, TRANSACTIONS_COLLECTION, transactionId);
    const transactionSnap = await getDoc(transactionRef);
    
    if (!transactionSnap.exists()) return false;
    
    const transactionData = transactionSnap.data() as Transaction;
    const batch = writeBatch(db);

    batch.update(transactionRef, { sellerConfirmed: true });

    let sysPromises: Promise<void>[] = [];

    // If buyer already confirmed, complete the transaction
    if (transactionData.buyerConfirmed) {
      batch.update(transactionRef, { 
        status: 'completed',
        completedAt: Date.now()
      });
      
      const listingRef = doc(db, LISTINGS_COLLECTION, listingId);
      const listingSnap = await getDoc(listingRef);
      if (listingSnap.exists()) {
        const listing = listingSnap.data() as any;
        const currentCompleted = listing.completedCount || 0;
        const newCompleted = currentCompleted + 1;
        const quantity = listing.quantity || 1;
        
        batch.update(listingRef, { completedCount: newCompleted });

        if (newCompleted >= quantity) {
          batch.update(listingRef, { status: 'completed' });

          // Cancel all other pending transactions for this listing
          const q = query(collection(db, TRANSACTIONS_COLLECTION), where('listingId', '==', listingId), where('status', '==', 'pending'));
          const pendingSnaps = await getDocs(q);
          
          pendingSnaps.forEach(docSnap => {
            if (docSnap.id !== transactionId) {
              batch.update(docSnap.ref, { status: 'cancelled' });
              const txData = docSnap.data() as Transaction;
              sysPromises.push(
                sendSystemMessage(listingId, txData.sellerId, txData.buyerId, 'The seller has sold out of this item. Your request is canceled.')
              );
            }
          });
        }
      }
    }

    await batch.commit();
    await Promise.all(sysPromises);

    if (transactionData.buyerConfirmed) {
      await sendSystemMessage(listingId, transactionData.sellerId, transactionData.buyerId, '🎉 Transaction completed! Thank you for using PassNow.');
    }

    return true;
  } catch (error) {
    console.error("Error seller confirming transaction:", error);
    return false;
  }
};

export const buyerConfirmTransaction = async (
  transactionId: string,
  listingId: string
): Promise<boolean> => {
  try {
    const transactionRef = doc(db, TRANSACTIONS_COLLECTION, transactionId);
    const transactionSnap = await getDoc(transactionRef);
    
    if (!transactionSnap.exists()) return false;
    
    const transactionData = transactionSnap.data() as Transaction;
    const batch = writeBatch(db);

    batch.update(transactionRef, { buyerConfirmed: true });

    let sysPromises: Promise<void>[] = [];

    // If seller already confirmed, complete the transaction
    if (transactionData.sellerConfirmed) {
      batch.update(transactionRef, { 
        status: 'completed',
        completedAt: Date.now()
      });
      
      const listingRef = doc(db, LISTINGS_COLLECTION, listingId);
      const listingSnap = await getDoc(listingRef);
      if (listingSnap.exists()) {
        const listing = listingSnap.data() as any;
        const currentCompleted = listing.completedCount || 0;
        const newCompleted = currentCompleted + 1;
        const quantity = listing.quantity || 1;
        
        batch.update(listingRef, { completedCount: newCompleted });

        if (newCompleted >= quantity) {
          batch.update(listingRef, { status: 'completed' });

          // Cancel all other pending transactions for this listing
          const q = query(collection(db, TRANSACTIONS_COLLECTION), where('listingId', '==', listingId), where('status', '==', 'pending'));
          const pendingSnaps = await getDocs(q);
          
          pendingSnaps.forEach(docSnap => {
            if (docSnap.id !== transactionId) {
              batch.update(docSnap.ref, { status: 'cancelled' });
              const txData = docSnap.data() as Transaction;
              sysPromises.push(
                sendSystemMessage(listingId, txData.sellerId, txData.buyerId, 'The seller has sold out of this item. Your request is canceled.')
              );
            }
          });
        }
      }
    }

    await batch.commit();
    await Promise.all(sysPromises);

    if (transactionData.sellerConfirmed) {
      await sendSystemMessage(listingId, transactionData.sellerId, transactionData.buyerId, '🎉 Transaction completed! Thank you for using PassNow.');
    }

    return true;
  } catch (error) {
    console.error("Error buyer confirming transaction:", error);
    return false;
  }
};

export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
  try {
    const transactions: Transaction[] = [];
    
    // Firestore requires compound indexes for OR queries or we can just do two separate queries
    // Query where user is buyer
    const buyerQuery = query(
      collection(db, TRANSACTIONS_COLLECTION),
      where('buyerId', '==', userId)
    );
    const buyerSnap = await getDocs(buyerQuery);
    buyerSnap.forEach(doc => {
      transactions.push({ id: doc.id, ...doc.data() } as Transaction);
    });

    // Query where user is seller
    const sellerQuery = query(
      collection(db, TRANSACTIONS_COLLECTION),
      where('sellerId', '==', userId)
    );
    const sellerSnap = await getDocs(sellerQuery);
    sellerSnap.forEach(doc => {
      // Prevent duplicates just in case (though a user usually isn't both buyer and seller)
      if (!transactions.find(t => t.id === doc.id)) {
        transactions.push({ id: doc.id, ...doc.data() } as Transaction);
      }
    });

    // Sort by createdAt descending
    return transactions.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Error fetching user transactions:", error);
    return [];
  }
};

export const subscribeToUserTransactions = (userId: string, callback: (transactions: Transaction[]) => void): () => void => {
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
    // Merge, deduplicate (just in case), and sort
    const merged = [...buyerTransactions, ...sellerTransactions];
    const uniqueMap = new Map<string, Transaction>();
    merged.forEach(tx => uniqueMap.set(tx.id, tx));
    
    const sorted = Array.from(uniqueMap.values()).sort((a, b) => b.createdAt - a.createdAt);
    callback(sorted);
  };

  const unsubBuyer = onSnapshot(buyerQuery, (snap) => {
    buyerTransactions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
    updateAndNotify();
  });

  const unsubSeller = onSnapshot(sellerQuery, (snap) => {
    sellerTransactions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
    updateAndNotify();
  });

  return () => {
    unsubBuyer();
    unsubSeller();
  };
};

export const getTransactionByListingAndBuyer = async (listingId: string, buyerId: string): Promise<Transaction | null> => {
  try {
    const q = query(
      collection(db, TRANSACTIONS_COLLECTION),
      where('listingId', '==', listingId),
      where('buyerId', '==', buyerId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));
      const activeTx = docs.find(t => t.status !== 'cancelled');
      if (activeTx) return activeTx;
    }
    return null;
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return null;
  }
};
