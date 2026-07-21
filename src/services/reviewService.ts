import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  where
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import type { ReceiptStatus, Review, Transaction, User } from '../types';

const REVIEWS_COLLECTION = 'reviews';
const TRANSACTIONS_COLLECTION = 'transactions';
const USERS_COLLECTION = 'users';

const isReceiptStatus = (value: string): value is ReceiptStatus =>
  value === 'received' || value === 'not_received';

export const submitReview = async (
  transactionId: string,
  listingId: string,
  reviewerId: string,
  revieweeId: string,
  rating: number,
  comment?: string,
  receiptStatus: ReceiptStatus = 'received'
): Promise<boolean> => {
  if (
    auth.currentUser?.uid !== reviewerId
    || !Number.isInteger(rating)
    || rating < 1
    || rating > 5
    || (comment?.length ?? 0) > 500
    || !isReceiptStatus(receiptStatus)
  ) {
    return false;
  }

  try {
    // Existing reviews used auto-generated IDs, so check them before switching to
    // the deterministic ID used for new reviews.
    const legacyDuplicateQuery = query(
      collection(db, REVIEWS_COLLECTION),
      where('transactionId', '==', transactionId),
      where('reviewerId', '==', reviewerId)
    );
    const legacyDuplicates = await getDocs(legacyDuplicateQuery);
    if (!legacyDuplicates.empty) return false;

    const transactionRef = doc(db, TRANSACTIONS_COLLECTION, transactionId);
    const reviewRef = doc(db, REVIEWS_COLLECTION, `${transactionId}_${reviewerId}`);
    const userRef = doc(db, USERS_COLLECTION, revieweeId);
    const normalizedComment = comment?.trim();

    await runTransaction(db, async (firestoreTransaction) => {
      const [transactionDoc, reviewDoc, userDoc] = await Promise.all([
        firestoreTransaction.get(transactionRef),
        firestoreTransaction.get(reviewRef),
        firestoreTransaction.get(userRef)
      ]);

      if (!transactionDoc.exists()) throw new Error('Transaction does not exist');
      if (reviewDoc.exists()) throw new Error('Transaction has already been reviewed');
      if (!userDoc.exists()) throw new Error('Reviewee does not exist');

      const transactionData = transactionDoc.data() as Transaction;
      const sellerHasConfirmed = transactionData.sellerConfirmed
        || transactionData.status === 'completed';
      if (
        !sellerHasConfirmed
        || transactionData.buyerId !== reviewerId
        || transactionData.sellerId !== revieweeId
        || transactionData.listingId !== listingId
      ) {
        throw new Error('User is not eligible to review this transaction');
      }

      const userData = userDoc.data() as User;
      const currentTotal = userData.totalReviews || 0;
      const currentRating = userData.rating || 0;
      const newTotal = currentTotal + 1;
      const newRating = ((currentRating * currentTotal) + rating) / newTotal;

      const newReview: Omit<Review, 'id'> = {
        transactionId,
        listingId: transactionData.listingId,
        reviewerId,
        revieweeId: transactionData.sellerId,
        rating,
        receiptStatus,
        createdAt: Date.now(),
        ...(normalizedComment ? { comment: normalizedComment } : {})
      };

      firestoreTransaction.set(reviewRef, newReview);
      firestoreTransaction.update(userRef, {
        rating: newRating,
        totalReviews: newTotal
      });
    });

    return true;
  } catch (error) {
    console.error('Error submitting review:', error);
    return false;
  }
};

export const checkIfReviewed = async (
  transactionId: string,
  reviewerId: string
): Promise<boolean> => {
  try {
    const reviewQuery = query(
      collection(db, REVIEWS_COLLECTION),
      where('transactionId', '==', transactionId),
      where('reviewerId', '==', reviewerId)
    );
    const snapshot = await getDocs(reviewQuery);
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking review status:', error);
    return false;
  }
};

export const getUserReviews = async (userId: string): Promise<Review[]> => {
  try {
    const reviewQuery = query(
      collection(db, REVIEWS_COLLECTION),
      where('revieweeId', '==', userId)
    );
    const snapshot = await getDocs(reviewQuery);
    const reviews = snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data()
    } as Review));
    return reviews.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    return [];
  }
};

export const getReviewsByReviewer = async (reviewerId: string): Promise<Review[]> => {
  try {
    const reviewQuery = query(
      collection(db, REVIEWS_COLLECTION),
      where('reviewerId', '==', reviewerId)
    );
    const snapshot = await getDocs(reviewQuery);
    return snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data()
    } as Review));
  } catch (error) {
    console.error('Error fetching reviews by reviewer:', error);
    return [];
  }
};
