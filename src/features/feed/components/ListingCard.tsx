import type { Listing } from '../../../types';
import { useNavigate } from 'react-router-dom';

interface ListingCardProps {
  listing: Listing;
}

export default function ListingCard({ listing }: ListingCardProps) {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate(`/listings/${listing.id}`);
  };

  const isFree = listing.isFree || listing.price === 0;

  if (isFree) {
    return (
      <div 
        onClick={handleClick}
        className="group bg-surface-container-lowest rounded-2xl overflow-hidden border border-primary/30 shadow-[0_2px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_15px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col cursor-pointer ring-1 ring-primary-container/20"
      >
        <div className="relative aspect-[4/3] w-full bg-surface-container overflow-hidden">
          <img 
            src={listing.images?.[0] || 'https://via.placeholder.com/300?text=No+Image'} 
            alt={listing.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          />
          <div className="absolute top-2 left-2">
            <span className="bg-secondary-container text-on-secondary-container text-label-sm font-label-sm px-2.5 py-1 rounded-lg shadow-sm font-bold tracking-wide">
              FREE
            </span>
          </div>
          <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
            <span className="bg-surface-dim text-on-surface text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm uppercase tracking-wider border border-outline-variant">
              {listing.condition}
            </span>
          </div>
        </div>
        <div className="p-stack-sm flex flex-col flex-1 gap-1 bg-primary/5">
          <div className="flex items-center gap-1 text-on-surface-variant text-[10px] font-bold uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 0" }}>category</span> {listing.category || 'Item'}
          </div>
          <div className="flex justify-between items-start">
            <h3 className="text-label-md font-label-md text-on-surface line-clamp-2 leading-tight">
              {listing.title}
            </h3>
          </div>
          <div className="mt-auto pt-2 flex items-center justify-between">
            <span className="text-label-md font-label-md text-secondary font-bold">0k</span>
            <span className="flex items-center gap-1 text-[10px] text-on-surface-variant bg-surface px-2 py-1 rounded border border-outline-variant/30">
              <span className="material-symbols-outlined text-[12px]">school</span> {listing.school}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Normal Card
  return (
    <div 
      onClick={handleClick}
      className="group bg-surface-container-lowest rounded-2xl overflow-hidden border border-outline-variant/60 shadow-[0_2px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_15px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col cursor-pointer"
    >
      <div className="relative aspect-[4/3] w-full bg-surface-container overflow-hidden">
        <img 
          src={listing.images?.[0] || 'https://via.placeholder.com/300?text=No+Image'} 
          alt={listing.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
        />
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm uppercase tracking-wider ${
            listing.condition === 'New' || listing.condition === 'Like New'
              ? 'bg-primary text-on-primary'
              : 'bg-surface-dim text-on-surface border border-outline-variant'
          }`}>
            {listing.condition}
          </span>
        </div>
      </div>
      <div className="p-stack-sm flex flex-col flex-1 gap-1">
        <div className="flex items-center gap-1 text-on-surface-variant text-[10px] font-bold uppercase tracking-wider mb-1">
          <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 0" }}>category</span> {listing.category || 'Item'}
        </div>
        <div className="flex justify-between items-start">
          <h3 className="text-label-md font-label-md text-on-surface line-clamp-2 leading-tight">
            {listing.title}
          </h3>
        </div>
        <div className="mt-auto pt-2 flex items-center justify-between">
          <span className="text-headline-md font-headline-md text-on-surface font-bold">
            {listing.price.toLocaleString('vi-VN')}k
          </span>
          <span className="flex items-center gap-1 text-[10px] text-on-surface-variant bg-surface-container px-2 py-1 rounded">
            <span className="material-symbols-outlined text-[12px]">school</span> {listing.school}
          </span>
        </div>
      </div>
    </div>
  );
}
