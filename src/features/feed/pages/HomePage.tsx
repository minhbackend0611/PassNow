import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/useAuthStore';
import { getListings } from '../../../services/listingService';
import type { Listing, ListingFilter } from '../../../types';
import ListingCard from '../components/ListingCard';
import FeedSidebar from '../components/FeedSidebar';

// Sort listings client-side by same school, then same district, then others
const sortListingsByPreference = (listings: Listing[], school?: string | null, district?: string | null): Listing[] => {
  if (!school && !district) return listings;
  
  const sameSchool: Listing[] = [];
  const sameDistrict: Listing[] = [];
  const otherListings: Listing[] = [];

  listings.forEach(item => {
    if (school && item.school === school) {
      sameSchool.push(item);
    } else if (district && item.district === district) {
      sameDistrict.push(item);
    } else {
      otherListings.push(item);
    }
  });

  const sortByDate = (a: Listing, b: Listing) => {
    const timeA = typeof a.createdAt === 'number' ? a.createdAt : new Date(a.createdAt).getTime();
    const timeB = typeof b.createdAt === 'number' ? b.createdAt : new Date(b.createdAt).getTime();
    return timeB - timeA;
  };

  sameSchool.sort(sortByDate);
  sameDistrict.sort(sortByDate);
  otherListings.sort(sortByDate);

  return [...sameSchool, ...sameDistrict, ...otherListings];
};

export default function HomePage() {
  const { user } = useAuthStore();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<ListingFilter>({});
  const [activeTab, setActiveTab] = useState<'all' | 'free'>('all');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    const fetchListings = async () => {
      setIsLoading(true);
      const data = await getListings({
        ...filter,
        isFree: activeTab === 'free' ? true : undefined
      });
      
      // Apply location-preference sorting
      const sorted = sortListingsByPreference(data, user?.school, user?.district);
      setListings(sorted);
      setIsLoading(false);
    };

    fetchListings();
  }, [filter, activeTab, user]);

  return (
    <div className="flex-1 flex w-full relative">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <FeedSidebar 
          key={JSON.stringify(filter)}
          initialFilters={filter}
          onFilterChange={(newFilters) => setFilter(newFilters)} 
        />
      </div>
      
      <main className="flex-1 overflow-y-auto bg-surface px-margin-mobile md:px-gutter py-stack-lg min-h-0">
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
              className={`px-4 py-1.5 rounded text-label-md font-label-md transition-all cursor-pointer ${
                activeTab === 'all' 
                  ? 'bg-surface shadow-sm text-primary font-bold' 
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              All Items
            </button>
            <button 
              onClick={() => setActiveTab('free')}
              className={`px-4 py-1.5 rounded text-label-md font-label-md transition-all cursor-pointer ${
                activeTab === 'free' 
                  ? 'bg-surface shadow-sm text-primary font-bold' 
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
          <div className="mt-stack-lg py-12 flex flex-col items-center justify-center text-center bg-surface-container-low rounded-2xl border border-dashed border-outline-variant px-4">
            <span className="material-symbols-outlined text-4xl text-outline mb-2" style={{ fontVariationSettings: "'wght' 200" }}>shopping_basket</span>
            <h3 className="text-headline-md font-headline-md text-on-surface mb-1">No results found</h3>
            <p className="text-body-sm font-body-sm text-on-surface-variant mb-4 max-w-xs">No listings match your selected filters.</p>
            <button 
              onClick={() => setFilter({})}
              className="px-4 py-2 bg-primary text-on-primary rounded-lg text-label-md font-label-md hover:bg-surface-tint transition-colors cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        )}
      </main>

      {/* Floating Mobile Filter Button */}
      <div className="lg:hidden fixed bottom-20 right-6 z-40">
        <button 
          onClick={() => setShowMobileFilters(true)}
          className="flex items-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-full shadow-lg text-label-md font-label-md hover:bg-surface-tint active:scale-95 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">tune</span>
          Filter Results
        </button>
      </div>

      {/* Mobile Filters Drawer Overlay */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end lg:hidden">
          <div className="w-80 max-w-[85vw] h-full bg-surface-container-low shadow-2xl flex flex-col animate-slide-in relative">
            <div className="p-stack-md border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
              <span className="font-headline-md text-headline-md text-on-surface">Filter Results</span>
              <button 
                onClick={() => setShowMobileFilters(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-container-high hover:bg-surface-variant transition-colors cursor-pointer text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <FeedSidebar 
                key={JSON.stringify(filter)}
                initialFilters={filter} 
                onFilterChange={(newFilters) => {
                  setFilter(newFilters);
                  setShowMobileFilters(false);
                }} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
