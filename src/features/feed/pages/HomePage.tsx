import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { getListings } from '../../../services/listingService';
import type { Listing, ListingFilter } from '../../../types';
import ListingCard from '../components/ListingCard';
import FeedSidebar from '../components/FeedSidebar';

export default function HomePage() {
  const { user } = useAuthStore();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<ListingFilter>({});
  const [activeTab, setActiveTab] = useState<'all' | 'free'>('all');

  useEffect(() => {
    const fetchListings = async () => {
      setIsLoading(true);
      const data = await getListings({
        ...filter,
        isFree: activeTab === 'free' ? true : undefined
      });
      setListings(data);
      setIsLoading(false);
    };

    fetchListings();
  }, [filter, activeTab]);

  return (
    <>
      <FeedSidebar onFilterChange={(newFilters) => setFilter({ ...filter, ...newFilters })} />
      
      <main className="flex-1 overflow-y-auto bg-surface-bright px-margin-mobile md:px-gutter py-stack-lg">
        {/* Campus Context Header */}
        <div className="mb-stack-lg flex flex-col md:flex-row md:items-end justify-between gap-stack-md bg-surface-container-low p-stack-md rounded-2xl border border-outline-variant/50">
          <div>
            <h1 className="text-headline-xl-mobile md:text-headline-xl font-headline-xl-mobile md:font-headline-xl text-on-surface mb-1">Campus Feed</h1>
            <div className="flex items-center gap-2 text-body-sm font-body-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
              <span>{user?.displayName || 'Student'}</span>
              <span className="w-1 h-1 rounded-full bg-outline"></span>
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
              <span className="font-medium text-primary">{user?.school || 'All Schools'}</span>
            </div>
          </div>
          <div className="flex bg-surface-container rounded-lg p-1 border border-outline-variant w-fit">
            <button 
              onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 rounded text-label-md font-label-md transition-all ${
                activeTab === 'all' 
                  ? 'bg-surface shadow-sm text-primary' 
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              All Items
            </button>
            <button 
              onClick={() => setActiveTab('free')}
              className={`px-4 py-1.5 rounded text-label-md font-label-md transition-all ${
                activeTab === 'free' 
                  ? 'bg-surface shadow-sm text-primary' 
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Free Only
            </button>
          </div>
        </div>

        {/* Bento Grid / Listing Cards */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : listings.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-stack-md md:gap-gutter">
            {listings.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="mt-stack-lg py-12 flex flex-col items-center justify-center text-center bg-surface-container-low rounded-2xl border border-dashed border-outline-variant">
            <span className="material-symbols-outlined text-4xl text-outline mb-2" style={{ fontVariationSettings: "'wght' 200" }}>shopping_basket</span>
            <p className="text-body-md font-body-md text-on-surface-variant mb-4">No items found matching your criteria.</p>
            <button 
              onClick={() => { setFilter({}); setActiveTab('all'); }}
              className="text-primary font-label-md text-label-md hover:underline"
            >
              Clear Filters
            </button>
          </div>
        )}
      </main>
    </>
  );
}
