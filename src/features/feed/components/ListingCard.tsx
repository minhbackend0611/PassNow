import type { Listing } from '../../../types';
import { useNavigate } from 'react-router-dom';
import { calculateDistanceKm } from '../../../utils/geo';
import StudentBadge from '../../../components/ui/StudentBadge';
import { formatRelativeTime } from '../../../utils/formatTime';

interface ListingCardProps {
  listing: Listing;
  userLat?: number;
  userLng?: number;
}

export default function ListingCard({ listing, userLat, userLng }: ListingCardProps) {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate(`/listings/${listing.id}`);
  };

  const isFree = listing.isFree || listing.price === 0;
  const formattedPrice = Number(listing.price || 0).toLocaleString('vi-VN');
  
  let distanceDisplay = null;
  if (userLat !== undefined && userLng !== undefined && listing.coordinates) {
    // If we already sorted by distance, we might have _tempDistance, but we can safely recalculate for display.
    const dist = calculateDistanceKm(userLat, userLng, listing.coordinates.lat, listing.coordinates.lng);
    distanceDisplay = dist < 1 ? '< 1 km away' : `${dist.toFixed(1)} km away`;
  }

  return (
    <div 
      onClick={handleClick}
      className="group relative h-full bg-gradient-to-br from-surface-container-low/80 to-primary/5 dark:bg-surface-container-lowest/40 backdrop-blur-xl rounded-[32px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-surface-variant/50 hover:border-primary/20 dark:border-outline-variant/40 hover:shadow-[0_20px_40px_-15px_rgba(0,166,126,0.15)] hover:-translate-y-1 transition-all duration-400 cursor-pointer flex flex-col"
    >
      {/* Image Section */}
      <div className="relative aspect-[4/3] sm:aspect-square w-full overflow-hidden bg-surface-variant/30">
        <img 
          src={listing.images?.[0] || 'https://via.placeholder.com/400?text=No+Image'} 
          alt={listing.title} 
          className={`w-full h-full object-cover transition-transform duration-700 ease-out ${
            listing.status === 'completed' ? 'grayscale-[0.5] group-hover:scale-105 opacity-90' : 'group-hover:scale-110'
          }`} 
        />
        
        {/* Badges container */}
        <div className="absolute top-3 inset-x-3 flex justify-between items-start z-10">
          {/* Left Badges */}
          <div className="flex flex-col gap-1.5">
            {listing.status === 'completed' && (
              <span className="bg-emerald-500/95 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-[0_2px_10px_rgba(16,185,129,0.3)] uppercase tracking-widest backdrop-blur-sm border border-emerald-400/50 flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">verified</span> SOLD
              </span>
            )}
            {listing.status === 'reserved' && (
              <span className="bg-amber-500/95 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-widest backdrop-blur-sm border border-amber-400/50 flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">lock</span> RESERVED
              </span>
            )}
            {isFree && listing.status !== 'completed' && (
              <span className="bg-primary/95 text-on-primary text-[10px] font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-widest backdrop-blur-sm border border-primary-container/20 w-fit">
                FREE
              </span>
            )}
            {listing.sellerEmail && (
              <StudentBadge email={listing.sellerEmail} variant="minimal" className="shadow-lg backdrop-blur-sm" />
            )}
          </div>

          {/* Right Badges */}
          <div className="flex flex-col gap-1.5 items-end">
            {distanceDisplay && (
              <span className="bg-surface/90 text-on-surface text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm backdrop-blur-md border border-outline-variant/30 flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px] text-primary">location_on</span>
                {distanceDisplay}
              </span>
            )}
            <span className={`text-[10px] font-bold px-3 py-1 rounded-full shadow-md uppercase tracking-wider backdrop-blur-sm border ${
              listing.condition === 'New' || listing.condition === 'Like New'
                ? 'bg-secondary/95 text-on-secondary border-secondary-container/20'
                : 'bg-surface-container-lowest/95 text-on-surface border-outline-variant/30'
            }`}>
              {listing.condition}
            </span>
          </div>
        </div>

        {/* Bottom Gradient Overlay for School/Location */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-3 sm:p-4 flex items-end z-10 pointer-events-none opacity-90 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex flex-col gap-1 text-white/95 text-[11px] sm:text-xs font-medium w-full">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px] sm:text-[16px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">school</span>
              <span className="truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] leading-tight">{listing.school || 'Unknown School'}</span>
            </div>
            {listing.district && (
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] sm:text-[16px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] text-primary">location_on</span>
                <span className="truncate drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] leading-tight">{listing.district}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-primary text-[10px] sm:text-[11px] font-bold uppercase tracking-widest">
            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {listing.category === 'Books' ? 'book' :
               listing.category === 'Electronics' ? 'devices' :
               listing.category === 'Furniture' ? 'chair' :
               listing.category === 'Clothing' ? 'apparel' :
               listing.category === 'Other' ? 'more_horiz' : 'category'}
            </span> 
            <span className="truncate">{listing.category || 'Item'}</span>
          </div>
          <div className="flex items-center gap-1 text-on-surface-variant text-[10px] font-medium opacity-80 group-hover:opacity-100 transition-opacity">
            <span className="material-symbols-outlined text-[12px]">schedule</span>
            {formatRelativeTime(listing.createdAt)}
          </div>
        </div>
        
        <h3 className="text-body-lg font-bold text-on-surface line-clamp-2 min-h-[3rem] leading-snug group-hover:text-primary transition-colors duration-300 drop-shadow-sm">
          {listing.title}
        </h3>
        
        <div className="mt-auto pt-3 flex items-center justify-between border-t border-outline-variant/30 mt-2">
          <span className={`text-title-lg font-black tracking-tight ${isFree ? 'text-primary drop-shadow-[0_2px_10px_rgba(0,166,126,0.2)]' : 'text-on-surface'}`}>
            {isFree ? '0 ₫' : `${formattedPrice} ₫`}
          </span>
          <div className="w-9 h-9 rounded-full bg-white/60 dark:bg-black/20 flex items-center justify-center text-on-surface-variant group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm border border-outline-variant/20 group-hover:scale-110">
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </div>
        </div>
      </div>
    </div>
  );
}
