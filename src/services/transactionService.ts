import { collection, doc, query, where, getDocs, writeBatch, getDoc, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
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

    // Update listing status to 'reserved'
    const listingRef = doc(db, LISTINGS_COLLECTION, listingId);
    batch.update(listingRef, { status: 'reserved' });

    await batch.commit();
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

    const listingRef = doc(db, LISTINGS_COLLECTION, listingId);
    batch.update(listingRef, { status: 'available' });

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

    // If buyer already confirmed, complete the transaction
    if (transactionData.buyerConfirmed) {
      batch.update(transactionRef, { 
        status: 'completed',
        completedAt: Date.now()
      });
      const listingRef = doc(db, LISTINGS_COLLECTION, listingId);
      batch.update(listingRef, { status: 'completed' });
    }

    await batch.commit();
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

    // If seller already confirmed, complete the transaction
    if (transactionData.sellerConfirmed) {
      batch.update(transactionRef, { 
        status: 'completed',
        completedAt: Date.now()
      });
      const listingRef = doc(db, LISTINGS_COLLECTION, listingId);
      batch.update(listingRef, { status: 'completed' });
    }

    await batch.commit();
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

export const getTransactionByListingAndBuyer = async (listingId: string, buyerId: string): Promise<Transaction | null> => {
  try {
    const q = query(
      collection(db, TRANSACTIONS_COLLECTION),
      where('listingId', '==', listingId),
      where('buyerId', '==', buyerId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const doc = snap.docs[0];
      return { id: doc.id, ...doc.data() } as Transaction;
    }
    return null;
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return null;
  }
};
