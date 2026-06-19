import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { getUserById } from '../../../services/userService';
import { getListings } from '../../../services/listingService';
import type { User, Listing } from '../../../types';
import ListingCard from '../../feed/components/ListingCard';

export default function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();

  const [user, setUser] = useState<User | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;
      setIsLoading(true);
      try {
        const [userData, userListings] = await Promise.all([
          getUserById(userId),
          getListings({ sellerId: userId })
        ]);
        
        if (userData) {
          setUser(userData);
          setListings(userListings);
        }
      } catch (err) {
        console.error("Failed to load public profile data", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex-1 flex justify-center items-center py-20 bg-surface">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 bg-surface px-margin-mobile">
        <span className="material-symbols-outlined text-5xl text-outline mb-2">person_off</span>
        <h2 className="text-headline-md font-headline-md text-on-surface mb-2">User Not Found</h2>
        <p className="text-body-sm font-body-sm text-on-surface-variant mb-6 text-center max-w-sm">
          The user profile you are trying to view does not exist or may have been deleted.
        </p>
        <button 
          onClick={() => navigate('/')} 
          className="px-6 py-2 bg-primary text-on-primary rounded-lg text-label-md font-label-md hover:bg-surface-tint transition-colors"
        >
          Back to Home
        </button>
      </div>
    );
  }

  const isOwnProfile = currentUser?.uid === user.uid;
  const ratingVal = user.rating || 0;
  const reviewsCount = user.totalReviews || 0;

  // Generate stars based on rating ratingVal
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(ratingVal);
    const hasHalf = ratingVal % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <span key={i} className="material-symbols-outlined text-[18px] text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
            star
          </span>
        );
      } else if (i === fullStars + 1 && hasHalf) {
        stars.push(
          <span key={i} className="material-symbols-outlined text-[18px] text-secondary" style={{ fontVariationSettings: "'FILL' 0.5" }}>
            star_half
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

  return (
    <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-gutter py-stack-lg pb-24 md:pb-stack-lg flex flex-col gap-stack-lg bg-surface">
      {/* Profile Header Block */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-[0_2px_4px_rgba(0,0,0,0.04)] border border-outline-variant p-stack-lg md:p-gutter flex flex-col md:flex-row justify-between items-start md:items-center gap-stack-md">
        <div className="flex items-center gap-stack-md">
          {/* Avatar */}
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-primary-container relative bg-surface-container-high flex items-center justify-center">
            {user.photoURL ? (
              <img className="w-full h-full object-cover" alt={user.displayName || 'User Avatar'} src={user.photoURL} />
            ) : (
              <span className="text-3xl md:text-4xl text-on-surface-variant font-bold">
                {user.displayName?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            )}
          </div>
          
          {/* User Meta */}
          <div className="flex flex-col gap-1">
            <h1 className="text-headline-lg font-headline-lg text-on-surface">{user.displayName || 'Student User'}</h1>
            
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm font-body-sm text-on-surface-variant">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px]">school</span>
                {user.school || 'Unverified School'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-outline-variant hidden sm:inline"></span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px]">location_on</span>
                {user.district || 'Unverified Area'}
              </span>
            </div>

            {/* Ratings Summary */}
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center">
                {renderStars()}
              </div>
              <span className="text-label-sm font-label-sm text-on-surface font-semibold">
                {ratingVal > 0 ? ratingVal.toFixed(1) : 'No reviews'}
              </span>
              <span className="text-body-sm font-body-sm text-on-surface-variant">
                ({reviewsCount} {reviewsCount === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic CTAs */}
        <div className="w-full md:w-auto mt-2 md:mt-0 flex gap-stack-sm flex-shrink-0">
          {isOwnProfile ? (
            <button 
              onClick={() => navigate('/profile')} 
              className="w-full md:w-auto px-6 py-2.5 bg-surface-container-high hover:bg-surface-dim border border-outline-variant text-on-surface text-label-md font-label-md rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Edit Profile Settings
            </button>
          ) : (
            <button 
              onClick={() => navigate(`/chat?user=${user.uid}`)}
              className="w-full md:w-auto px-6 py-2.5 bg-primary text-on-primary hover:bg-primary/95 text-label-md font-label-md rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">chat</span>
              Contact Seller
            </button>
          )}
        </div>
      </div>

      {/* User Listings Section */}
      <section className="flex flex-col gap-stack-md">
        <h2 className="text-headline-md font-headline-md text-on-surface">
          Active Listings ({listings.length})
        </h2>

        {listings.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-stack-md md:gap-gutter">
            {listings.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="py-16 flex flex-col items-center justify-center text-center bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant">
            <span className="material-symbols-outlined text-4xl text-outline mb-2" style={{ fontVariationSettings: "'wght' 200" }}>shopping_basket</span>
            <p className="text-body-md font-body-md text-on-surface-variant">This user hasn't posted any active listings yet.</p>
          </div>
        )}
      </section>
    </main>
  );
}
