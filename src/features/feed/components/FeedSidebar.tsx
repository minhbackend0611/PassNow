import type { ListingFilter } from '../../../types';

interface FeedSidebarProps {
  onFilterChange?: (filters: ListingFilter) => void;
}

export default function FeedSidebar({ onFilterChange }: FeedSidebarProps) {
  return (
    <aside className="h-screen w-64 hidden lg:flex flex-col bg-surface-container-low border-r border-outline-variant flex-shrink-0 sticky top-16">
      <div className="p-stack-md border-b border-outline-variant">
        <div className="flex items-center gap-stack-sm mb-1">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>tune</span>
          <h2 className="text-headline-md font-headline-md text-on-surface">Filters</h2>
        </div>
        <p className="text-body-sm font-body-sm text-on-surface-variant">Narrow your search</p>
      </div>

      <nav className="flex flex-col h-full gap-stack-md p-stack-md overflow-y-auto">
        <a className="flex items-center gap-stack-sm bg-primary-container text-on-primary-container rounded-lg p-stack-sm opacity-80 transition-opacity" href="#">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>category</span>
          <span className="text-label-md font-label-md">Categories</span>
        </a>
        <div className="pl-8 flex flex-col gap-2 mb-2">
          <label className="flex items-center gap-2 text-body-sm font-body-sm text-on-surface hover:text-primary cursor-pointer">
            <input className="rounded border-outline-variant text-primary focus:ring-primary bg-surface" type="checkbox" defaultChecked /> Books
          </label>
          <label className="flex items-center gap-2 text-body-sm font-body-sm text-on-surface hover:text-primary cursor-pointer">
            <input className="rounded border-outline-variant text-primary focus:ring-primary bg-surface" type="checkbox" /> Electronics
          </label>
          <label className="flex items-center gap-2 text-body-sm font-body-sm text-on-surface hover:text-primary cursor-pointer">
            <input className="rounded border-outline-variant text-primary focus:ring-primary bg-surface" type="checkbox" /> Furniture
          </label>
          <label className="flex items-center gap-2 text-body-sm font-body-sm text-on-surface hover:text-primary cursor-pointer">
            <input className="rounded border-outline-variant text-primary focus:ring-primary bg-surface" type="checkbox" /> Clothing
          </label>
        </div>

        <a className="flex items-center gap-stack-sm text-on-surface-variant p-stack-sm hover:bg-surface-container-high transition-all rounded-lg" href="#">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>payments</span>
          <span className="text-label-md font-label-md">Price Range</span>
        </a>
        <a className="flex items-center gap-stack-sm text-on-surface-variant p-stack-sm hover:bg-surface-container-high transition-all rounded-lg" href="#">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>verified</span>
          <span className="text-label-md font-label-md">Condition</span>
        </a>
        <a className="flex items-center gap-stack-sm text-on-surface-variant p-stack-sm hover:bg-surface-container-high transition-all rounded-lg" href="#">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>location_on</span>
          <span className="text-label-md font-label-md">Location</span>
        </a>
        <a className="flex items-center gap-stack-sm text-on-surface-variant p-stack-sm hover:bg-surface-container-high transition-all rounded-lg" href="#">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>school</span>
          <span className="text-label-md font-label-md">School</span>
        </a>

        <div className="mt-auto pt-4">
          <button 
            onClick={() => onFilterChange && onFilterChange({})} 
            className="w-full bg-surface-container-high text-on-surface text-label-md font-label-md py-2 rounded-lg hover:bg-surface-dim transition-colors border border-outline-variant"
          >
            Apply Filters
          </button>
        </div>
      </nav>
    </aside>
  );
}
