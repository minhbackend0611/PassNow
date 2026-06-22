import { useMemo } from 'react';
import type { Listing, User } from '../../../types';
import ListingCard from './ListingCard';

interface HomeDiscoveryViewProps {
  listings: Listing[];
  user: User | null;
  onNavigateToSearch: (filters: any) => void;
}

const CATEGORIES = [
  { id: 'Books', name: 'Textbooks', icon: 'book', color: 'from-blue-500 to-indigo-500' },
  { id: 'Electronics', name: 'Electronics', icon: 'devices', color: 'from-purple-500 to-pink-500' },
  { id: 'Furniture', name: 'Furniture', icon: 'chair', color: 'from-orange-500 to-red-500' },
  { id: 'Clothing', name: 'Clothing', icon: 'apparel', color: 'from-emerald-500 to-teal-500' },
  { id: 'Other', name: 'Other', icon: 'more_horiz', color: 'from-gray-500 to-slate-500' },
];

export default function HomeDiscoveryView({ listings, user, onNavigateToSearch }: HomeDiscoveryViewProps) {

  // Partition listings for discovery sections
  const { hotDeals, recentlyAdded, freeItems, suggestedItems } = useMemo(() => {
    // 1. Hot Deals: under 100k OR condition is 'New'
    const deals = listings.filter(l => l.price < 100000 || l.condition === 'New').slice(0, 8);
    
    // 2. Recently Added: The newest 8 items overall
    const recent = listings.slice(0, 8);
    
    // 3. Free Corner: Free items
    const free = listings.filter(l => l.isFree).slice(0, 8);
    
    // 4. Suggested: Same school or district
    const suggestions = listings.filter(l => 
      (user?.school && l.school === user.school) || 
      (user?.district && l.district === user.district)
    ).slice(0, 8);

    return { hotDeals: deals, recentlyAdded: recent, freeItems: free, suggestedItems: suggestions };
  }, [listings, user]);

  return (
    <div className="flex-1 overflow-y-auto px-margin-mobile md:px-8 lg:px-10 py-6 md:py-8 space-y-12">
      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes float-fast {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-15px) scale(1.05); }
        }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-float-fast { animation: float-fast 6s ease-in-out infinite; }
      `}</style>
      
      {/* 1. Enhanced Hero Banner */}
      <section className="relative w-full h-[240px] md:h-[300px] rounded-[32px] overflow-hidden flex items-center shadow-lg group cursor-pointer transition-transform duration-500 hover:shadow-[0_16px_40px_rgba(0,166,126,0.15)]">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-secondary/90 z-0"></div>
        
        {/* Abstract animated shapes */}
        <div className="absolute top-0 right-10 w-72 h-72 bg-white/20 rounded-full blur-3xl -translate-y-1/2 group-hover:scale-125 transition-transform duration-1000 ease-out z-0 animate-float-slow"></div>
        <div className="absolute bottom-10 left-20 w-48 h-48 bg-secondary/40 rounded-full blur-2xl group-hover:translate-x-10 group-hover:-translate-y-4 transition-transform duration-1000 ease-out z-0 animate-float-fast"></div>
        
        <div className="relative z-10 px-8 md:px-12 w-full max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-label-sm font-bold mb-4 border border-white/20">
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
            Welcome to PassNow
          </div>
          <h1 className="text-display-md md:text-display-lg font-bold text-white mb-3 tracking-tight leading-tight">
            Discover Campus <br className="hidden md:block"/> <span className="text-secondary-container">Steals & Deals</span>
          </h1>
          <p className="text-body-lg text-white/90 mb-6 max-w-lg font-medium">
            Join thousands of students buying and selling safely within the university network.
          </p>
          <button 
            onClick={() => {
              const el = document.getElementById('recent-items');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-6 py-3 bg-white text-primary rounded-xl font-bold hover:bg-white/90 hover:shadow-[0_8px_24px_rgba(255,255,255,0.3)] hover:-translate-y-1 active:scale-95 transition-all duration-300 shadow-sm"
          >
            Start Exploring
          </button>
        </div>
        
        {/* Hero Decorative Image Overlay (Glassmorphism card) */}
        <div className="hidden lg:flex absolute right-12 top-1/2 -translate-y-1/2 w-64 h-64 bg-white/10 backdrop-blur-md rounded-2xl border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.1)] rotate-6 group-hover:rotate-12 group-hover:scale-105 transition-all duration-500 items-center justify-center animate-float-slow">
          <span className="material-symbols-outlined text-[120px] text-white/50" style={{ fontVariationSettings: "'wght' 200" }}>shopping_bag</span>
        </div>
      </section>

      {/* 2. Quick Categories */}
      <section>
        <div className="flex items-center justify-between mb-4 px-2">
          <h2 className="text-title-lg font-bold text-on-surface">Categories</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto snap-x pb-4 pt-4 -mt-4 custom-scrollbar px-2 -mx-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => onNavigateToSearch({ category: cat.id })}
              className="snap-start flex-shrink-0 w-[96px] md:w-[110px] flex flex-col items-center gap-3 group outline-none"
            >
              <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-surface-container-low border border-outline-variant/30 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex items-center justify-center overflow-hidden transition-all duration-500 group-hover:shadow-[0_12px_24px_rgba(0,0,0,0.08)] group-hover:-translate-y-2 group-hover:border-transparent group-focus-visible:ring-4 group-focus-visible:ring-primary/30">
                {/* Hover Gradient Background (subtle tint) */}
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                
                {/* Inner Icon Pill */}
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 z-10`}>
                  <span className="material-symbols-outlined text-white text-[24px] md:text-[28px]">{cat.icon}</span>
                </div>
              </div>
              <span className="text-label-md font-bold text-on-surface-variant group-hover:text-on-surface transition-colors text-center w-full px-1">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 3. Hot Deals Section */}
      {hotDeals.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-error text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
              <h2 className="text-headline-sm font-bold text-on-surface">Hot Deals</h2>
            </div>
            <button onClick={() => onNavigateToSearch({ minPrice: 0, maxPrice: 100000 })} className="text-label-md font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
              See all <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
          <div className="flex gap-stack-md md:gap-gutter overflow-x-auto snap-x pb-6 custom-scrollbar px-2 -mx-2">
            {hotDeals.map(listing => (
              <div key={listing.id} className="snap-start w-[160px] md:w-[220px] flex-shrink-0">
                <ListingCard listing={listing} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Suggested for You */}
      {suggestedItems.length > 0 && (
        <section className="bg-surface-container-low/50 -mx-margin-mobile md:-mx-8 lg:-mx-10 px-margin-mobile md:px-8 lg:px-10 py-10 rounded-t-[40px] md:rounded-[40px]">
          <div className="flex items-center justify-between mb-6 px-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>recommend</span>
              <h2 className="text-headline-sm font-bold text-on-surface">Suggested For You</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-stack-md md:gap-gutter">
            {suggestedItems.slice(0, 4).map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>
      )}

      {/* 5. Recently Added */}
      {recentlyAdded.length > 0 && (
        <section id="recent-items">
          <div className="flex items-center justify-between mb-6 px-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>new_releases</span>
              <h2 className="text-headline-sm font-bold text-on-surface">Fresh Finds</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-stack-md md:gap-gutter">
            {recentlyAdded.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </section>
      )}

      {/* 6. Free Corner */}
      {freeItems.length > 0 && (
        <section className="pb-10">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-500 text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>volunteer_activism</span>
              <h2 className="text-headline-sm font-bold text-on-surface">Free Corner</h2>
            </div>
          </div>
          <div className="flex gap-stack-md md:gap-gutter overflow-x-auto snap-x pb-6 custom-scrollbar px-2 -mx-2">
            {freeItems.map(listing => (
              <div key={listing.id} className="snap-start w-[160px] md:w-[220px] flex-shrink-0">
                <ListingCard listing={listing} />
              </div>
            ))}
          </div>
        </section>
      )}

    </div>
  );
}
