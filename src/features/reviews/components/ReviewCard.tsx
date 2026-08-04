import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Review, User, Listing } from '../../../types';
import { getUserById } from '../../../services/userService';
import { getListingById } from '../../../services/listingService';

interface ReviewCardProps {
  review: Review;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const [reviewer, setReviewer] = useState<User | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [userData, listingData] = await Promise.all([
          getUserById(review.reviewerId),
          getListingById(review.listingId)
        ]);
        
        if (userData) setReviewer(userData);
        if (listingData && listingData.listing) setListing(listingData.listing);
      } catch (err) {
        console.error("Error loading review details:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [review]);

  // Render Stars
  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= review.rating) {
        stars.push(
          <span key={i} className="material-symbols-outlined text-[18px] text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
            star
          </span>
        );
      } else {
        stars.push(
          <span key={i} className="material-symbols-outlined text-[18px] text-outline-variant">
            star
          </span>
        );
      }
    }
    return stars;
  };

  const dateStr = new Date(review.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });

  return (
    <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex justify-between items-start mb-3">
        {/* Reviewer Info */}
        <Link to={`/profile/${review.reviewerId}`} className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-variant flex items-center justify-center border border-outline-variant group-hover:border-primary transition-colors">
            {reviewer?.photoURL ? (
              <img src={reviewer.photoURL} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-outline font-light">person</span>
            )}
          </div>
          <div>
            <div className="text-label-md font-bold text-on-surface group-hover:text-primary transition-colors">
              {isLoading ? 'Loading...' : (reviewer?.displayName || 'Unknown User')}
            </div>
            <div className="text-body-sm text-outline flex items-center gap-1">
              {dateStr}
            </div>
          </div>
        </Link>
        
        {/* Stars */}
        <div className="flex">
          {renderStars()}
        </div>
      </div>

      {/* Comment */}
      <div className="mb-3 pl-13">
        {review.comment ? (
          <p className="text-body-md text-on-surface italic">"{review.comment}"</p>
        ) : (
          <p className="text-body-md text-outline italic">No comment provided.</p>
        )}
      </div>

      {/* Context Tags */}
      <div className="pl-13 flex flex-wrap gap-2 items-center">
        {/* Listing Title */}
        <div className="bg-surface-variant/50 px-2 py-1 rounded-md flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px] text-on-surface-variant">shopping_bag</span>
          <span className="text-label-sm text-on-surface-variant truncate max-w-[200px]">
            {isLoading ? 'Loading item...' : (listing?.title || 'Unknown Item')}
          </span>
        </div>
        
        {/* Receipt Status */}
        {review.receiptStatus && (
          <div className={`px-2 py-1 rounded-md flex items-center gap-1 border ${
            review.receiptStatus === 'received' 
              ? 'bg-primary/10 border-primary/20 text-primary' 
              : 'bg-error/10 border-error/20 text-error'
          }`}>
            <span className="material-symbols-outlined text-[14px]">
              {review.receiptStatus === 'received' ? 'check_circle' : 'cancel'}
            </span>
            <span className="text-label-sm font-bold">
              {review.receiptStatus === 'received' ? 'Item Received' : 'Item Not Received'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
