import { useState, useEffect } from 'react';
import type { ListingFilter, ItemCondition } from '../../../types';
import { CustomSelect } from '../../../components/ui/CustomSelect';

interface FeedSidebarProps {
  onFilterChange?: (filters: ListingFilter) => void;
  initialFilters?: ListingFilter;
}

const CATEGORIES = [
  { id: 'Books', name: 'Textbooks & Books', icon: 'book' },
  { id: 'Electronics', name: 'Electronics', icon: 'devices' },
  { id: 'Furniture', name: 'Furniture', icon: 'chair' },
  { id: 'Clothing', name: 'Clothing', icon: 'apparel' },
  { id: 'Other', name: 'Other', icon: 'more_horiz' },
];

const CONDITIONS: ItemCondition[] = ['New', 'Like New', 'Used', 'Fair'];

const PRICE_RANGES = [
  { id: 'any', label: 'Any Price', min: undefined, max: undefined },
  { id: 'under_100k', label: 'Under 100,000 ₫', min: 0, max: 100000 },
  { id: '100k_500k', label: '100,000 ₫ - 500,000 ₫', min: 100000, max: 500000 },
  { id: '500k_1m', label: '500,000 ₫ - 1,000,000 ₫', min: 500000, max: 1000000 },
  { id: 'over_1m', label: 'Over 1,000,000 ₫', min: 1000000, max: undefined },
];

export default function FeedSidebar({ onFilterChange, initialFilters = {} }: FeedSidebarProps) {
  const [selectedCategory, setSelectedCategory] = useState(initialFilters.category || '');
  const [selectedCondition, setSelectedCondition] = useState<ItemCondition | ''>(initialFilters.condition || '');
  
  // Find initial price range
  const initPriceRange = PRICE_RANGES.find(pr => pr.min === initialFilters.minPrice && pr.max === initialFilters.maxPrice)?.id || 'any';
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>(initPriceRange);
  
  const [school, setSchool] = useState(initialFilters.school || '');
  const [schoolsList, setSchoolsList] = useState<string[]>([]);

  useEffect(() => {
    fetch('https://raw.githubusercontent.com/Hipo/university-domains-list/master/world_universities_and_domains.json')
      .then(res => res.json())
      .then((data: { country: string, name: string }[]) => {
        const vnUnis = data.filter(u => u.country === "Viet Nam").map(u => u.name);
        setSchoolsList(Array.from(new Set(vnUnis)).sort((a, b) => a.localeCompare(b)));
      })
      .catch(err => console.error("Failed to fetch universities", err));
  }, []);

  const handleApplyFilters = () => {
    if (!onFilterChange) return;

    const filters: ListingFilter = {};
    if (selectedCategory) filters.category = selectedCategory;
    if (selectedCondition) filters.condition = selectedCondition;
    
    const range = PRICE_RANGES.find(r => r.id === selectedPriceRange);
    if (range) {
      if (range.min !== undefined) filters.minPrice = range.min;
      if (range.max !== undefined) filters.maxPrice = range.max;
    }
    
    if (school.trim()) filters.school = school;

    onFilterChange(filters);
  };

  const handleClearFilters = () => {
    setSelectedCategory('');
    setSelectedCondition('');
    setSelectedPriceRange('any');
    setSchool('');
    if (onFilterChange) {
      onFilterChange({});
    }
  };

  return (
    <aside className="h-full w-full lg:h-[calc(100vh-4.5rem)] lg:w-[260px] flex flex-col flex-shrink-0 lg:sticky lg:top-[4.5rem] py-4 lg:py-6 lg:border-r border-outline-variant/30 bg-surface">
      <div className="px-6 pb-4 border-b border-outline-variant/30">
        <div className="flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined text-primary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>tune</span>
          <h2 className="text-title-lg font-bold text-on-surface tracking-tight">Filters</h2>
        </div>
        <div className="flex justify-between items-center mt-3">
          <p className="text-body-sm text-on-surface-variant font-medium">Narrow your search</p>
          <button onClick={handleClearFilters} className="text-label-sm text-error hover:bg-error/10 hover:shadow-sm hover:-translate-y-0.5 px-3 py-1.5 rounded-lg transition-all duration-300 font-medium active:scale-95">Clear Filters</button>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-1 px-4 py-4 overflow-y-auto custom-scrollbar">
        
        {/* Categories Section */}
        <div className="flex items-center gap-2 text-on-surface-variant px-3 py-2 mt-1">
          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 0" }}>category</span>
          <span className="text-label-md font-bold uppercase tracking-wider">Categories</span>
        </div>
        <div className="pl-8 flex flex-col gap-2 mb-2">
          {CATEGORIES.map(cat => {
            const isActive = selectedCategory === cat.id;
            return (
              <label key={cat.id} className="flex items-center gap-3 text-body-sm font-medium text-on-surface hover:text-primary cursor-pointer group py-1 hover:translate-x-1 transition-transform">
                <div className="relative flex items-center justify-center">
                  <input 
                    type="checkbox" 
                    checked={isActive} 
                    onChange={() => setSelectedCategory(isActive ? '' : cat.id)} 
                    className="appearance-none w-5 h-5 rounded-full border border-outline-variant checked:border-[6px] checked:border-primary hover:border-primary transition-all cursor-pointer"
                  />
                </div>
                <span className="group-hover:translate-x-1 transition-transform">{cat.name}</span>
              </label>
            );
          })}
        </div>

        {/* Price Range Section */}
        <div className="flex items-center gap-2 text-on-surface-variant px-3 py-2 mt-4">
          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 0" }}>payments</span>
          <span className="text-label-md font-bold uppercase tracking-wider">Price Range</span>
        </div>
        <div className="pl-8 flex flex-col gap-2">
          {PRICE_RANGES.map(range => (
            <label key={range.id} className="flex items-center gap-3 text-body-sm font-medium text-on-surface hover:text-primary cursor-pointer group py-1">
              <input
                type="radio"
                name="priceRange"
                value={range.id}
                checked={selectedPriceRange === range.id}
                onChange={(e) => setSelectedPriceRange(e.target.value)}
                className="appearance-none w-5 h-5 rounded-full border border-outline-variant checked:border-[6px] checked:border-primary hover:border-primary transition-all cursor-pointer"
              />
              <span className="group-hover:translate-x-1 transition-transform">{range.label}</span>
            </label>
          ))}
        </div>

        {/* Condition Section */}
        <div className="flex items-center gap-2 text-on-surface-variant px-3 py-2 mt-4">
          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 0" }}>verified</span>
          <span className="text-label-md font-bold uppercase tracking-wider">Condition</span>
        </div>
        <div className="pl-8 relative">
          <CustomSelect
            value={selectedCondition}
            onChange={(val) => setSelectedCondition(val as ItemCondition | '')}
            options={[
              { value: '', label: 'Any Condition' },
              ...CONDITIONS.map(c => ({ value: c, label: c }))
            ]}
          />
        </div>

        {/* University Section */}
        <div className="flex items-center gap-2 text-on-surface-variant px-3 py-2 mt-4">
          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 0" }}>school</span>
          <span className="text-label-md font-bold uppercase tracking-wider">University</span>
        </div>
        <div className="pl-8 relative pb-4">
          <CustomSelect
            value={school}
            onChange={setSchool}
            options={[
              { value: '', label: 'All Universities' },
              ...schoolsList.map(s => ({ value: s, label: s }))
            ]}
          />
        </div>
      </nav>

      {/* Apply Button */}
      <div className="px-6 pt-4 mt-auto border-t border-outline-variant/30 relative z-10 pb-4">
        <button
          onClick={handleApplyFilters}
          className="group relative w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white text-label-md font-bold py-3.5 rounded-xl shadow-[0_4px_12px_rgba(0,166,126,0.25)] hover:shadow-[0_8px_24px_rgba(0,166,126,0.4)] transition-all duration-300 hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
          <span className="material-symbols-outlined text-[20px] relative z-10 group-hover:rotate-180 transition-transform duration-500">tune</span>
          <span className="relative z-10">Apply Filters</span>
        </button>
      </div>
    </aside>
  );
}
