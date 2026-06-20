import { useState } from 'react';
import type { ListingFilter, ItemCondition } from '../../../types';

interface FeedSidebarProps {
  onFilterChange?: (filters: ListingFilter) => void;
  initialFilters?: ListingFilter;
}

const CATEGORIES = [
  { id: 'books', name: 'Books & Documents', icon: 'book' },
  { id: 'electronics', name: 'Electronics', icon: 'devices' },
  { id: 'furniture', name: 'Furniture & Appliances', icon: 'chair' },
  { id: 'clothing', name: 'Clothing & Accessories', icon: 'apparel' },
  { id: 'vehicles', name: 'Vehicles', icon: 'directions_car' },
  { id: 'other', name: 'Other', icon: 'more_horiz' },
];

const CONDITIONS: ItemCondition[] = ['New', 'Like New', 'Used', 'Fair'];

export default function FeedSidebar({ onFilterChange, initialFilters = {} }: FeedSidebarProps) {
  const [searchQuery, setSearchQuery] = useState(initialFilters.searchQuery || '');
  const [selectedCategory, setSelectedCategory] = useState(initialFilters.category || '');
  const [selectedCondition, setSelectedCondition] = useState<ItemCondition | ''>(initialFilters.condition || '');
  const [minPrice, setMinPrice] = useState<string>(initialFilters.minPrice !== undefined ? initialFilters.minPrice.toString() : '');
  const [maxPrice, setMaxPrice] = useState<string>(initialFilters.maxPrice !== undefined ? initialFilters.maxPrice.toString() : '');
  const [school, setSchool] = useState(initialFilters.school || '');
  const [district, setDistrict] = useState(initialFilters.district || '');

  // Propagate filters up when states change
  const handleApplyFilters = () => {
    if (!onFilterChange) return;

    const filters: ListingFilter = {};
    if (searchQuery.trim()) filters.searchQuery = searchQuery;
    if (selectedCategory) filters.category = selectedCategory;
    if (selectedCondition) filters.condition = selectedCondition;
    if (minPrice && !isNaN(Number(minPrice))) filters.minPrice = Number(minPrice);
    if (maxPrice && !isNaN(Number(maxPrice))) filters.maxPrice = Number(maxPrice);
    if (school.trim()) filters.school = school;
    if (district.trim()) filters.district = district;

    onFilterChange(filters);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedCondition('');
    setMinPrice('');
    setMaxPrice('');
    setSchool('');
    setDistrict('');
    if (onFilterChange) {
      onFilterChange({});
    }
  };



  return (
    <aside className="h-screen w-64 hidden lg:flex flex-col bg-surface-container-low border-r border-outline-variant flex-shrink-0 sticky top-16">
      <div className="p-stack-md border-b border-outline-variant">
        <div className="flex items-center gap-stack-sm mb-1">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>tune</span>
          <h2 className="text-headline-md font-headline-md text-on-surface">Filters</h2>
        </div>
        <div className="flex justify-between items-center">
          <p className="text-body-sm font-body-sm text-on-surface-variant">Narrow your search</p>
          <button onClick={handleClearFilters} className="text-label-sm font-label-sm text-primary hover:underline">Reset All</button>
        </div>
      </div>

      <nav className="flex flex-col h-full gap-stack-md p-stack-md overflow-y-auto">
        {/* Search Input */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="search" className="text-label-sm font-label-sm text-on-surface-variant">Keyword Search</label>
          <div className="relative">
            <input 
              id="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
              className="w-full bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-0 px-3 py-2 pl-9 text-body-sm font-body-sm focus:outline-none transition-colors"
              placeholder="Search items..."
              type="text"
            />
            <span className="material-symbols-outlined absolute left-2.5 top-2 text-on-surface-variant text-[18px]">search</span>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-on-surface-variant hover:text-on-surface flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Categories Section */}
        <div className="flex items-center gap-stack-sm bg-primary-container text-on-primary-container rounded-lg p-stack-sm opacity-80 transition-opacity">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>category</span>
          <span className="text-label-md font-label-md">Categories</span>
        </div>
        <div className="pl-8 flex flex-col gap-2 mb-2">
          {CATEGORIES.map(cat => {
            const isActive = selectedCategory === cat.id;
            return (
              <label key={cat.id} className="flex items-center gap-2 text-body-sm font-body-sm text-on-surface hover:text-primary cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isActive} 
                  onChange={() => setSelectedCategory(isActive ? '' : cat.id)} 
                  className="rounded border-outline-variant text-primary focus:ring-primary bg-surface"
                /> {cat.name}
              </label>
            );
          })}
        </div>

        {/* Price Range */}
        <div className="flex items-center gap-stack-sm text-on-surface-variant p-stack-sm hover:bg-surface-container-high transition-all rounded-lg">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>payments</span>
          <span className="text-label-md font-label-md">Price Range (kVND)</span>
        </div>
        <div className="pl-8 flex items-center gap-2">
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Min"
            className="w-full bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-0 px-2 py-1.5 text-body-sm font-body-sm focus:outline-none"
          />
          <span className="text-outline-variant">—</span>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max"
            className="w-full bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-0 px-2 py-1.5 text-body-sm font-body-sm focus:outline-none"
          />
        </div>

        {/* Condition Section */}
        <div className="flex items-center gap-stack-sm text-on-surface-variant p-stack-sm hover:bg-surface-container-high transition-all rounded-lg">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>verified</span>
          <span className="text-label-md font-label-md">Condition</span>
        </div>
        <div className="pl-8 relative">
          <select
            id="condition"
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value as ItemCondition | '')}
            className="w-full bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-0 px-3 py-2 pr-8 text-body-sm font-body-sm focus:outline-none appearance-none"
          >
            <option value="">Any Condition</option>
            {CONDITIONS.map(cond => (
              <option key={cond} value={cond}>{cond}</option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-on-surface-variant text-[20px] pointer-events-none">expand_more</span>
        </div>

        {/* Location Section */}
        <div className="flex items-center gap-stack-sm text-on-surface-variant p-stack-sm hover:bg-surface-container-high transition-all rounded-lg">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>school</span>
          <span className="text-label-md font-label-md">Location</span>
        </div>
        <div className="pl-8 flex flex-col gap-3">
          <input
            id="school"
            type="text"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            placeholder="School (e.g. Bách Khoa)"
            className="w-full bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-0 px-3 py-2 text-body-sm font-body-sm focus:outline-none"
          />
          <input
            id="district"
            type="text"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            placeholder="District (e.g. Cầu Giấy)"
            className="w-full bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-0 px-3 py-2 text-body-sm font-body-sm focus:outline-none"
          />
        </div>

        {/* Apply Button */}
        <div className="mt-auto pt-4">
          <button
            onClick={handleApplyFilters}
            className="w-full bg-surface-container-high text-on-surface text-label-md font-label-md py-2 rounded-lg hover:bg-surface-dim transition-colors border border-outline-variant"
          >
            Apply Filters
          </button>
        </div>
      </nav>
    </aside>
  );
}
