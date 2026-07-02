import { useSearchParams } from 'react-router-dom';
import type { Listing, ListingFilter } from '../../../types';
import ListingCard from './ListingCard';

interface SearchResultsViewProps {
  listings: Listing[];
  isLoading: boolean;
  searchQuery: string;
  activeTab: 'all' | 'free';
  setActiveTab: (tab: 'all' | 'free') => void;
  setFilter: (filter: ListingFilter) => void;
  userLat?: number;
  userLng?: number;
}

export default function SearchResultsView({
  listings,
  isLoading,
  searchQuery,
  activeTab,
  setActiveTab,
  setFilter,
  userLat,
  userLng,
}: SearchResultsViewProps) {
  const [, setSearchParams] = useSearchParams();

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Search Header Context */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-title-lg md:text-headline-sm font-bold text-on-surface">
            {searchQuery ? (
              <span>Results for <span className="text-primary">"{searchQuery}"</span></span>
            ) : (
              <span>All Items</span>
            )}
          </h1>
          <p className="text-body-sm text-on-surface-variant mt-1">
            {listings.length} {listings.length === 1 ? 'item' : 'items'} found
          </p>
        </div>

        <div className="flex bg-surface-variant/40 backdrop-blur-md rounded-xl p-1.5 border border-outline-variant/50 w-fit">
          <button 
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg text-label-sm font-bold transition-all duration-300 cursor-pointer ${
              activeTab === 'all' 
                ? 'bg-surface shadow-md text-primary scale-100' 
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface/50 hover:scale-95 active:scale-90 scale-95'
            }`}
          >
            All Items
          </button>
          <button 
            onClick={() => setActiveTab('free')}
            className={`px-4 py-2 rounded-lg text-label-sm font-bold transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'free' 
                ? 'bg-surface shadow-md text-primary scale-100' 
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface/50 hover:scale-95 active:scale-90 scale-95'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">volunteer_activism</span>
            Free Only
          </button>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : listings.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-stack-md md:gap-gutter pb-8">
          {listings.map(listing => (
            <ListingCard key={listing.id} listing={listing} userLat={userLat} userLng={userLng} />
          ))}
        </div>
      ) : (
        <div className="mt-stack-md py-16 flex flex-col items-center justify-center text-center bg-gradient-to-br from-surface-container-low to-primary/5 rounded-2xl border border-dashed border-outline-variant px-4 shadow-sm">
          <span className="material-symbols-outlined text-[48px] text-outline mb-3" style={{ fontVariationSettings: "'wght' 200" }}>search_off</span>
          <h3 className="text-headline-md font-bold text-on-surface mb-2">No results found</h3>
          <p className="text-body-md text-on-surface-variant mb-6 max-w-sm">
            {searchQuery ? `We couldn't find anything matching "${searchQuery}". Try adjusting your keywords or filters.` : 'No listings match your selected filters. Try broadening your search.'}
          </p>
          <div className="flex gap-3">
            <button 
              onClick={() => {
                setSearchParams({});
                setFilter({});
                setActiveTab('all');
              }}
              className="px-5 py-2.5 bg-primary text-on-primary rounded-xl text-label-md font-bold hover:bg-primary/90 hover:shadow-md transition-all hover:-translate-y-0.5 active:scale-95 shadow-sm shadow-primary/20 cursor-pointer flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">home</span>
              Back to Home Page
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
