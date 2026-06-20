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
      <div className="bg-surface-container-lowest rounded-2xl shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-outline-variant p-stack-lg md:p-gutter flex flex-col md:flex-row justify-between items-start md:items-center gap-stack-lg relative overflow-hidden">
        {/* Decorative blur background element */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-container rounded-full blur-[80px] opacity-20 pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-stack-lg z-10 w-full md:w-auto flex-1">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-surface shadow-md bg-surface-container-high flex items-center justify-center relative z-10">
              {user.photoURL ? (
                <img className="w-full h-full object-cover" alt={user.displayName || 'User Avatar'} src={user.photoURL} />
              ) : (
                <span className="text-3xl md:text-5xl text-on-surface-variant font-bold">
                  {user.displayName?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
            {isOwnProfile && (
              <div className="absolute bottom-1 right-1 bg-secondary-container text-on-secondary-container rounded-full p-1 shadow-sm border-2 border-surface flex items-center justify-center z-20">
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              </div>
            )}
          </div>
          
          {/* User Meta */}
          <div className="flex flex-col gap-1 flex-1">
            <h1 className="text-headline-xl-mobile md:text-headline-xl font-headline-xl-mobile md:font-headline-xl text-on-surface">{user.displayName || 'Student User'}</h1>
            
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-body-md font-body-md text-on-surface-variant">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px]">school</span>
                {user.school || 'Unverified School'}
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px]">location_on</span>
                {user.district || 'Unverified Area'}
              </span>
            </div>

            {/* Ratings Summary */}
            <div className="flex items-center gap-2 mt-stack-xs">
              <div className="flex items-center">
                {renderStars()}
              </div>
              <span className="text-label-md font-label-md text-on-surface font-semibold">
                {ratingVal > 0 ? ratingVal.toFixed(1) : 'No reviews'}
              </span>
              <span className="text-body-sm font-body-sm text-outline">
                ({reviewsCount} {reviewsCount === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic CTAs & Stats */}
        <div className="w-full md:w-auto flex flex-col md:flex-row md:items-center gap-stack-md pt-stack-md md:pt-0 border-t md:border-t-0 md:border-l border-outline-variant md:pl-stack-lg z-10">
          
          {/* Stats section */}
          <div className="flex justify-around md:justify-end md:flex-col gap-stack-sm md:gap-stack-md w-full md:w-auto mb-4 md:mb-0">
            <div className="text-center md:text-right">
              <div className="text-headline-md font-headline-md text-primary">{listings.length}</div>
              <div className="text-label-sm font-label-sm text-outline uppercase tracking-wider">Items</div>
            </div>
            <div className="hidden md:block w-8 h-[1px] bg-outline-variant ml-auto"></div>
            <div className="text-center md:text-right">
              <div className="text-headline-md font-headline-md text-on-surface">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'New'}
              </div>
              <div className="text-label-sm font-label-sm text-outline uppercase tracking-wider">Joined</div>
            </div>
          </div>

          <div className="flex gap-stack-sm flex-shrink-0 w-full md:w-auto">
            {isOwnProfile ? (
              <button 
                onClick={() => navigate('/profile')} 
                className="w-full md:w-auto px-6 py-2.5 bg-surface-container-high hover:bg-surface-dim border border-outline-variant text-on-surface text-label-md font-label-md rounded-xl transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Edit Profile
              </button>
            ) : (
              <button 
                onClick={() => navigate(`/chat?user=${user.uid}`)}
                className="w-full md:w-auto px-6 py-2.5 bg-primary text-on-primary hover:bg-primary/95 text-label-md font-label-md rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">chat</span>
                Contact
              </button>
            )}
          </div>
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
