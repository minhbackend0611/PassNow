import { SlidersHorizontal, BookOpen, DollarSign, Verified, MapPin, School } from 'lucide-react';
import type { ListingFilter } from '../../../types';

interface FeedSidebarProps {
  onFilterChange?: (filters: ListingFilter) => void;
}

export default function FeedSidebar({ onFilterChange }: FeedSidebarProps) {
  return (
    <aside className="h-screen w-64 hidden lg:flex flex-col bg-surface-container-low border-r border-outline-variant flex-shrink-0 sticky top-16">
      <div className="p-4 border-b border-outline-variant">
        <div className="flex items-center gap-2 mb-1">
          <SlidersHorizontal className="text-primary w-5 h-5" />
          <h2 className="text-lg font-semibold text-on-surface">Filters</h2>
        </div>
        <p className="text-sm text-on-surface-variant">Narrow your search</p>
      </div>

      <nav className="flex flex-col h-full gap-4 p-4 overflow-y-auto">
        <div className="flex items-center gap-2 bg-primary-container text-on-primary-container rounded-lg p-2">
          <BookOpen className="w-5 h-5" />
          <span className="font-medium text-sm">Categories</span>
        </div>
        <div className="pl-8 flex flex-col gap-2 mb-2">
          <label className="flex items-center gap-2 text-sm text-on-surface hover:text-primary cursor-pointer">
            <input type="checkbox" className="rounded border-outline-variant text-primary focus:ring-primary bg-surface" defaultChecked /> 
            Books
          </label>
          <label className="flex items-center gap-2 text-sm text-on-surface hover:text-primary cursor-pointer">
            <input type="checkbox" className="rounded border-outline-variant text-primary focus:ring-primary bg-surface" /> 
            Electronics
          </label>
          <label className="flex items-center gap-2 text-sm text-on-surface hover:text-primary cursor-pointer">
            <input type="checkbox" className="rounded border-outline-variant text-primary focus:ring-primary bg-surface" /> 
            Furniture
          </label>
          <label className="flex items-center gap-2 text-sm text-on-surface hover:text-primary cursor-pointer">
            <input type="checkbox" className="rounded border-outline-variant text-primary focus:ring-primary bg-surface" /> 
            Clothing
          </label>
        </div>

        <a href="#" className="flex items-center gap-2 text-on-surface-variant p-2 hover:bg-surface-container-high transition-all rounded-lg">
          <DollarSign className="w-5 h-5" />
          <span className="font-medium text-sm">Price Range</span>
        </a>
        <a href="#" className="flex items-center gap-2 text-on-surface-variant p-2 hover:bg-surface-container-high transition-all rounded-lg">
          <Verified className="w-5 h-5" />
          <span className="font-medium text-sm">Condition</span>
        </a>
        <a href="#" className="flex items-center gap-2 text-on-surface-variant p-2 hover:bg-surface-container-high transition-all rounded-lg">
          <MapPin className="w-5 h-5" />
          <span className="font-medium text-sm">Location</span>
        </a>
        <a href="#" className="flex items-center gap-2 text-on-surface-variant p-2 hover:bg-surface-container-high transition-all rounded-lg">
          <School className="w-5 h-5" />
          <span className="font-medium text-sm">School</span>
        </a>

        <div className="mt-auto pt-4">
          <button 
            onClick={() => onFilterChange && onFilterChange({})} 
            className="w-full bg-surface-container-high text-on-surface font-medium py-2 rounded-lg hover:bg-surface-dim transition-colors border border-outline-variant text-sm"
          >
            Apply Filters
          </button>
        </div>
      </nav>
    </aside>
  );
}
