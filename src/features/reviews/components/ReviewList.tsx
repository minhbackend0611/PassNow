import { useEffect, useState } from 'react';
import type { Review } from '../../../types';
import { getUserReviews } from '../../../services/reviewService';
import ReviewCard from './ReviewCard';

interface ReviewListProps {
  userId: string;
}

export default function ReviewList({ userId }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      setIsLoading(true);
      try {
        const data = await getUserReviews(userId);
        setReviews(data);
      } catch (err) {
        console.error("Failed to load reviews", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="py-16 flex flex-col items-center justify-center text-center glass-panel border-dashed rounded-[32px] bg-gradient-to-br from-surface-container-low/50 to-primary/5">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-3xl text-primary" style={{ fontVariationSettings: "'wght' 300" }}>rate_review</span>
        </div>
        <h3 className="text-title-lg font-title-lg text-on-surface mb-2">No reviews yet</h3>
        <p className="text-body-md font-body-md text-on-surface-variant max-w-xs">This user hasn't received any reviews from transactions yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  );
}
