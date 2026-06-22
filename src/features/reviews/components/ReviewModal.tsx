import { useState } from 'react';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
  revieweeName?: string;
  isSubmitting?: boolean;
}

export default function ReviewModal({
  isOpen,
  onClose,
  onSubmit,
  revieweeName,
  isSubmitting = false
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    await onSubmit(rating, comment);
    // Reset state after successful submit is handled by parent closing modal
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={!isSubmitting ? onClose : undefined}
      />
      
      {/* Modal Content */}
      <div className="relative bg-surface dark:bg-surface-container rounded-3xl shadow-2xl w-full max-w-md p-stack-md border border-outline-variant/30 transform transition-all">
        <button 
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-variant/50 flex items-center justify-center text-on-surface-variant hover:bg-surface-variant hover:text-on-surface transition-colors disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        <div className="text-center mb-6 mt-2">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[32px] text-primary">star</span>
          </div>
          <h2 className="text-title-lg font-title-lg text-on-surface">
            Rate your experience
          </h2>
          {revieweeName && (
            <p className="text-body-md text-on-surface-variant mt-1">
              with {revieweeName}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Star Rating */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
                disabled={isSubmitting}
              >
                <span 
                  className={`material-symbols-outlined text-[40px] drop-shadow-sm transition-colors duration-200 ${
                    (hoverRating || rating) >= star 
                      ? 'text-yellow-400' 
                      : 'text-outline-variant'
                  }`}
                  style={{ fontVariationSettings: (hoverRating || rating) >= star ? "'FILL' 1" : "'FILL' 0" }}
                >
                  star
                </span>
              </button>
            ))}
          </div>

          {/* Comment */}
          <div className="flex flex-col gap-2">
            <label className="text-label-md font-label-md text-on-surface-variant">
              Leave a comment (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isSubmitting}
              placeholder="How was the item? How was the communication?"
              className="w-full bg-surface-variant/30 border border-outline-variant/50 rounded-xl p-4 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none h-28"
              maxLength={500}
            />
            <div className="text-right text-label-sm text-on-surface-variant">
              {comment.length}/500
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl border border-outline-variant/50 text-on-surface font-label-md hover:bg-surface-variant/50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={rating === 0 || isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-primary/90 text-on-primary font-label-md shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {isSubmitting && <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>}
              Submit Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
