import { collection, doc, query, where, getDocs, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Review, User } from '../types';

const REVIEWS_COLLECTION = 'reviews';
const USERS_COLLECTION = 'users';

export const submitReview = async (
  transactionId: string,
  listingId: string,
  reviewerId: string,
  revieweeId: string,
  rating: number,
  comment?: string
): Promise<boolean> => {
  try {
    const reviewRef = doc(collection(db, REVIEWS_COLLECTION));
    const userRef = doc(db, USERS_COLLECTION, revieweeId);

    await runTransaction(db, async (transaction) => {
      // 1. Get the current user data to recalculate rating
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) {
        throw new Error("Reviewee does not exist!");
      }
      
      const userData = userDoc.data() as User;
      const currentTotal = userData.totalReviews || 0;
      const currentRating = userData.rating || 0;

      const newTotal = currentTotal + 1;
      const newRating = ((currentRating * currentTotal) + rating) / newTotal;

      // 2. Write the new review document
      const newReview: Omit<Review, 'id'> = {
        transactionId,
        listingId,
        reviewerId,
        revieweeId,
        rating,
        comment,
        createdAt: Date.now()
      };
      transaction.set(reviewRef, newReview);

      // 3. Update the user's rating and totalReviews
      transaction.update(userRef, {
        rating: newRating,
        totalReviews: newTotal
      });
    });

    return true;
  } catch (error) {
    console.error("Error submitting review:", error);
    return false;
  }
};

export const checkIfReviewed = async (
  transactionId: string,
  reviewerId: string
): Promise<boolean> => {
  try {
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where('transactionId', '==', transactionId),
      where('reviewerId', '==', reviewerId)
    );
    const snap = await getDocs(q);
    return !snap.empty;
  } catch (error) {
    console.error("Error checking review status:", error);
    return false;
  }
};

export const getUserReviews = async (userId: string): Promise<Review[]> => {
  try {
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where('revieweeId', '==', userId)
    );
    const snap = await getDocs(q);
    const reviews: Review[] = [];
    snap.forEach(doc => {
      reviews.push({ id: doc.id, ...doc.data() } as Review);
    });
    return reviews.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    return [];
  }
};

export const getReviewsByReviewer = async (reviewerId: string): Promise<Review[]> => {
  try {
    const q = query(
      collection(db, REVIEWS_COLLECTION),
      where('reviewerId', '==', reviewerId)
    );
    const snap = await getDocs(q);
    const reviews: Review[] = [];
    snap.forEach(doc => {
      reviews.push({ id: doc.id, ...doc.data() } as Review);
    });
    return reviews;
  } catch (error) {
    console.error("Error fetching reviews by reviewer:", error);
    return [];
  }
};
