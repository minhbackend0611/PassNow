import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { getListings } from '../../../services/listingService';
import type { Listing, ListingFilter, ItemCondition } from '../../../types';
import ListingCard from '../components/ListingCard';
import FeedSidebar from '../components/FeedSidebar';
import HomeDiscoveryView from '../components/HomeDiscoveryView';
import SearchResultsView from '../components/SearchResultsView';

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
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const browseMode = searchParams.get('browse') === 'true';
  const activeTab = searchParams.get('free') === 'true' ? 'free' : 'all';

  const filter: ListingFilter = useMemo(() => {
    return {
      category: searchParams.get('category') || undefined,
      condition: searchParams.get('condition') as ItemCondition || undefined,
      minPrice: searchParams.has('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.has('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      school: searchParams.get('school') || undefined,
    };
  }, [searchParams]);

  const isDiscoveryMode = !searchQuery && 
                          !filter.category && !filter.condition && filter.minPrice === undefined && filter.maxPrice === undefined && !filter.school && 
                          activeTab === 'all' && 
                          !browseMode;

  const updateFiltersInURL = (newFilters: ListingFilter) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.delete('category');
      next.delete('condition');
      next.delete('minPrice');
      next.delete('maxPrice');
      next.delete('school');

      if (newFilters.category) next.set('category', newFilters.category);
      if (newFilters.condition) next.set('condition', newFilters.condition);
      if (newFilters.minPrice !== undefined) next.set('minPrice', newFilters.minPrice.toString());
      if (newFilters.maxPrice !== undefined) next.set('maxPrice', newFilters.maxPrice.toString());
      if (newFilters.school) next.set('school', newFilters.school);

      return next;
    });
  };

  const handleSetActiveTab = (tab: 'all' | 'free') => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (tab === 'free') next.set('free', 'true');
      else next.delete('free');
      return next;
    });
  };

  useEffect(() => {
    const fetchListings = async () => {
      setIsLoading(true);
      const data = await getListings({
        ...filter,
        searchQuery: searchQuery,
        isFree: activeTab === 'free' ? true : undefined
      });
      
      // Apply location-preference sorting
      const sorted = sortListingsByPreference(data, user?.school, user?.district);
      setListings(sorted);
      setIsLoading(false);
    };

    fetchListings();
  }, [filter, activeTab, user, searchQuery]);

  return (
    <div className="flex-1 flex w-full relative bg-surface">
      {/* Desktop Sidebar - Hidden in Discovery Mode */}
      {!isDiscoveryMode && (
        <div className="hidden lg:block">
          <FeedSidebar 
            key={JSON.stringify(filter)}
            initialFilters={filter}
            onFilterChange={updateFiltersInURL} 
          />
        </div>
      )}
      
      {isDiscoveryMode ? (
        <HomeDiscoveryView 
          listings={listings} 
          user={user} 
          onNavigateToSearch={(filters) => {
            setSearchParams(prev => {
              const next = new URLSearchParams(prev);
              next.set('browse', 'true');
              if (filters.category) next.set('category', filters.category);
              if (filters.condition) next.set('condition', filters.condition);
              if (filters.minPrice !== undefined) next.set('minPrice', filters.minPrice.toString());
              if (filters.maxPrice !== undefined) next.set('maxPrice', filters.maxPrice.toString());
              if (filters.school) next.set('school', filters.school);
              return next;
            });
          }} 
        />
      ) : (
        <main className="flex-1 overflow-y-auto px-margin-mobile md:px-8 lg:px-10 py-8 min-h-0">
          <SearchResultsView 
            listings={listings}
            isLoading={isLoading}
            searchQuery={searchQuery}
            activeTab={activeTab}
            setActiveTab={handleSetActiveTab}
            setFilter={updateFiltersInURL}
          />
        </main>
      )}

      {/* Floating Mobile Filter Button */}
      {!isDiscoveryMode && (
        <div className="lg:hidden fixed bottom-20 right-6 z-40">
          <button 
            onClick={() => setShowMobileFilters(true)}
            className="flex items-center gap-2 bg-primary text-on-primary px-5 py-3 rounded-full shadow-lg text-label-md font-label-md hover:bg-surface-tint active:scale-95 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">tune</span>
            Filter Results
          </button>
        </div>
      )}

      {/* Mobile Filters Drawer Overlay */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-[100] bg-black/40 flex justify-end lg:hidden">
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
                  updateFiltersInURL(newFilters);
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
