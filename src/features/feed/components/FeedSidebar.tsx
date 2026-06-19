import { useState } from 'react';
import type { ListingFilter, ItemCondition } from '../../../types';

interface FeedSidebarProps {
  onFilterChange?: (filters: ListingFilter) => void;
  initialFilters?: ListingFilter;
}

const CATEGORIES = [
  { id: 'books', name: 'Sách & Tài liệu', icon: 'book' },
  { id: 'electronics', name: 'Điện tử', icon: 'devices' },
  { id: 'furniture', name: 'Nội thất & Gia dụng', icon: 'chair' },
  { id: 'clothing', name: 'Quần áo & Phụ kiện', icon: 'apparel' },
  { id: 'vehicles', name: 'Xe cộ', icon: 'directions_car' },
  { id: 'other', name: 'Khác', icon: 'more_horiz' },
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
    <aside className="w-full lg:w-64 flex flex-col bg-surface-container-low border-r border-outline-variant flex-shrink-0 h-auto lg:h-[calc(100vh-4rem)] lg:sticky lg:top-16 overflow-y-auto">
      <div className="p-stack-md border-b border-outline-variant flex justify-between items-center bg-surface-container-low/80 backdrop-blur-sm sticky top-0 z-10">
        <div>
          <div className="flex items-center gap-stack-sm mb-0.5">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>tune</span>
            <h2 className="text-headline-md font-headline-md text-on-surface">Filters</h2>
          </div>
          <p className="text-body-sm font-body-sm text-on-surface-variant">Narrow your search</p>
        </div>
        <button 
          onClick={handleClearFilters}
          className="text-label-sm font-label-sm text-primary hover:underline px-2 py-1"
        >
          Reset All
        </button>
      </div>

      <div className="flex flex-col gap-stack-md p-stack-md">
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

        {/* Categories Badges */}
        <div className="flex flex-col gap-2">
          <span className="text-label-sm font-label-sm text-on-surface-variant">Category</span>
          <div className="flex flex-col gap-1.5">
            {CATEGORIES.map(cat => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(isActive ? '' : cat.id)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all ${
                    isActive 
                      ? 'bg-primary-container text-on-primary-container font-semibold ring-1 ring-primary/20' 
                      : 'hover:bg-surface-container-high text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{cat.icon}</span>
                  <span className="text-body-sm font-body-sm flex-1">{cat.name}</span>
                  {isActive && <span className="material-symbols-outlined text-[16px] text-primary">check</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Price Range */}
        <div className="flex flex-col gap-2">
          <span className="text-label-sm font-label-sm text-on-surface-variant">Price Range (kđ)</span>
          <div className="flex items-center gap-2">
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
        </div>

        {/* Condition Dropdown */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="condition" className="text-label-sm font-label-sm text-on-surface-variant">Condition</label>
          <div className="relative">
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
        </div>

        {/* School & District Text Search */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="school" className="text-label-sm font-label-sm text-on-surface-variant">School / University</label>
            <input
              id="school"
              type="text"
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              placeholder="e.g. Bách Khoa"
              className="w-full bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-0 px-3 py-2 text-body-sm font-body-sm focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="district" className="text-label-sm font-label-sm text-on-surface-variant">District / Area</label>
            <input
              id="district"
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="e.g. Cầu Giấy"
              className="w-full bg-surface rounded-lg border border-outline-variant focus:border-primary focus:ring-0 px-3 py-2 text-body-sm font-body-sm focus:outline-none"
            />
          </div>
        </div>

        {/* Apply Button */}
        <button
          onClick={handleApplyFilters}
          className="w-full mt-2 bg-primary text-on-primary text-label-md font-label-md py-2.5 rounded-lg hover:bg-surface-tint transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">done</span>
          Apply Filters
        </button>
      </div>
    </aside>
  );
}
