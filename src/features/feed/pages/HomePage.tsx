import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { getListings } from '../../../services/listingService';
import type { Listing, ListingFilter } from '../../../types';
import ListingCard from '../components/ListingCard';
import FeedSidebar from '../components/FeedSidebar';
import { UserCircle, School, ShoppingBasket } from 'lucide-react';

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
      
      <main className="flex-1 overflow-y-auto bg-surface-bright px-4 md:px-6 py-8">
        {/* Campus Context Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 bg-surface-container-low p-4 rounded-2xl border border-outline-variant/50">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-on-surface mb-1">Campus Feed</h1>
            <div className="flex items-center gap-2 text-sm text-on-surface-variant">
              <UserCircle className="w-4 h-4" />
              <span>{user?.displayName || 'Student'}</span>
              <span className="w-1 h-1 rounded-full bg-outline"></span>
              <School className="w-4 h-4" />
              <span className="font-medium text-primary">{user?.school || 'All Schools'}</span>
            </div>
          </div>
          <div className="flex bg-surface-container rounded-lg p-1 border border-outline-variant w-fit">
            <button 
              onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-all ${
                activeTab === 'all' 
                  ? 'bg-surface shadow-sm text-primary' 
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              All Items
            </button>
            <button 
              onClick={() => setActiveTab('free')}
              className={`px-4 py-1.5 rounded text-sm font-medium transition-all ${
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {listings.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="mt-8 py-12 flex flex-col items-center justify-center text-center bg-surface-container-low rounded-2xl border border-dashed border-outline-variant">
            <ShoppingBasket className="w-10 h-10 text-outline mb-2 opacity-50" />
            <p className="text-on-surface-variant mb-4">No items found matching your criteria.</p>
            <button 
              onClick={() => { setFilter({}); setActiveTab('all'); }}
              className="text-primary text-sm font-medium hover:underline"
            >
              Clear Filters
            </button>
          </div>
        )}
      </main>
    </>
  );
}
