import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { createListing, uploadListingImages } from '../../../services/listingService';
import type { ItemCondition } from '../../../types';

const createListingSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }).max(100),
  category: z.string().min(1, { message: 'Category is required' }),
  condition: z.string().min(1, { message: 'Condition is required' }),
  description: z.string(),
  listingType: z.enum(['sell', 'free']),
  price: z.coerce.number().min(0).optional(),
  specificAddress: z.string().min(1, { message: 'Address is required' }),
}).refine((data) => {
  if (data.listingType === 'sell' && (!data.price || data.price <= 0)) {
    return false;
  }
  return true;
}, {
  message: "Price must be greater than 0 when selling",
  path: ["price"],
});

type CreateListingValues = z.infer<typeof createListingSchema>;

export default function CreateListingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateListingValues>({
    resolver: zodResolver(createListingSchema),
    defaultValues: {
      listingType: 'sell',
      description: '',
      specificAddress: '',
    }
  });

  const listingType = watch('listingType');
  const [isLocating, setIsLocating] = useState(false);
  const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | undefined>(undefined);
  
  // Autocomplete state
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (imageFiles.length + newFiles.length > 5) {
        alert("You can only upload up to 5 photos.");
        return;
      }
      const combinedFiles = [...imageFiles, ...newFiles].slice(0, 5);
      setImageFiles(combinedFiles);
      
      const newPreviews = combinedFiles.map(file => URL.createObjectURL(file));
      setImagePreviews(newPreviews);
    }
  };

  const removeImage = (index: number) => {
    const newFiles = [...imageFiles];
    newFiles.splice(index, 1);
    setImageFiles(newFiles);

    const newPreviews = [...imagePreviews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);
  };

  const handleSearchQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSuggestions(true);
    
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&countrycodes=vn&limit=5`);
        const data = await res.json();
        setSuggestions(data || []);
      } catch (err) {
        console.error("Error fetching suggestions:", err);
      } finally {
        setIsSearching(false);
      }
    }, 500);
  };

  const handleSelectSuggestion = (suggestion: any) => {
    setSearchQuery(suggestion.display_name);
    setValue('specificAddress', suggestion.display_name, { shouldValidate: true });
    setCoordinates({ lat: parseFloat(suggestion.lat), lng: parseFloat(suggestion.lon) });
    setShowSuggestions(false);
  };

  const handleBlur = () => {
    // Delay hiding so click event on suggestion can fire
    setTimeout(() => {
      setShowSuggestions(false);
      // Strict constraint: if they typed something but didn't select, revert to the last valid selection or empty
      const currentAddress = watch('specificAddress');
      if (searchQuery !== currentAddress) {
        setSearchQuery(currentAddress || '');
      }
    }, 200);
  };

  const handleUseMyUniversity = () => {
    if (!user?.school) {
      alert("You haven't set a school in your profile yet.");
      return;
    }
    
    setIsLocating(true);
    // Simulate typing the school
    setSearchQuery(user.school);
    setValue('specificAddress', user.school, { shouldValidate: true });
    
    // Fetch coordinates for it
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(user.school)}&countrycodes=vn&limit=1`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          const suggestion = data[0];
          setSearchQuery(suggestion.display_name);
          setValue('specificAddress', suggestion.display_name, { shouldValidate: true });
          setCoordinates({ lat: parseFloat(suggestion.lat), lng: parseFloat(suggestion.lon) });
        } else {
          alert("Could not find exact coordinates for your school. Please select manually from the suggestions if needed.");
        }
      })
      .catch(err => {
        console.error(err);
        alert("Could not find coordinates for your school.");
      })
      .finally(() => setIsLocating(false));
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    let hasResolved = false; // Flag to prevent race conditions

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        if (hasResolved) return;
        hasResolved = true;
        
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude });
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          if (data && data.display_name) {
            setSearchQuery(data.display_name);
            setValue('specificAddress', data.display_name, { shouldValidate: true });
          }
        } catch (error) {
          console.error("Error fetching address:", error);
          alert("Could not fetch address for this location.");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        if (hasResolved) return;
        hasResolved = true;
        console.error(error);
        alert(`Could not get your location automatically (${error.message}). Please enter your pickup location manually.`);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const onSubmit = async (data: CreateListingValues) => {
    if (!user) return;
    if (imageFiles.length === 0) {
      alert("Please upload at least one photo.");
      return;
    }
    
    setIsLoading(true);
    try {
      const isFree = data.listingType === 'free';
      const uploadedImageUrls = await uploadListingImages(user.uid, imageFiles);

      const listingId = await createListing({
        title: data.title,
        description: data.description,
        price: isFree ? 0 : (data.price || 0),
        isFree,
        condition: data.condition as ItemCondition,
        category: data.category,
        images: uploadedImageUrls,
        school: user.school || 'Unknown',
        district: user.district || 'Unknown',
        specificAddress: data.specificAddress,
        coordinates,
        sellerId: user.uid,
      });

      if (listingId) {
        navigate(`/listings/${listingId}`);
      } else {
        alert("Failed to create listing.");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to create listing.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-grow flex items-start justify-center p-gutter md:p-stack-lg bg-surface-container-lowest">
      <div className="w-full max-w-3xl bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
        
        {/* Header Area */}
        <div className="px-gutter py-stack-md border-b border-outline-variant/30 flex items-center gap-stack-md bg-surface-container-low/50">
          <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-high hover:bg-surface-variant transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>close</span>
          </button>
          <div>
            <h1 className="text-headline-md font-headline-md text-on-surface">List an Item</h1>
            <p className="text-body-sm font-body-sm text-on-surface-variant">Share your unneeded items with the campus community.</p>
          </div>
        </div>

        {/* Form Canvas */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-gutter md:p-stack-lg flex flex-col gap-stack-lg">
          
          {/* Section: Photos */}
          <section>
            <h2 className="text-label-md font-label-md text-on-surface mb-stack-xs">Photos (up to 5) <span className="text-error">*</span></h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-stack-sm">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="aspect-square relative rounded-xl border border-outline-variant/30 overflow-hidden group">
                  <img src={preview} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                  <button 
                    type="button" 
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-surface-container-highest/80 text-on-surface-variant hover:text-error rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              ))}
              {imagePreviews.length < 5 && (
                <label className="aspect-square border-2 border-dashed border-outline-variant rounded-xl flex flex-col items-center justify-center gap-stack-xs text-outline hover:border-primary hover:text-primary transition-colors cursor-pointer bg-surface-container-lowest">
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                  <span className="material-symbols-outlined text-headline-lg">add_photo_alternate</span>
                  <span className="text-label-sm font-label-sm text-center px-1">Add Photo</span>
                </label>
              )}
              {Array.from({ length: Math.max(0, 4 - imagePreviews.length) }).map((_, i) => (
                <div key={`placeholder-${i}`} className="aspect-square bg-surface-container-low rounded-xl border border-outline-variant/30 hidden sm:block"></div>
              ))}
            </div>
          </section>

          <div className="h-px bg-outline-variant/20 w-full"></div>

          {/* Section: Details */}
          <section className="flex flex-col gap-stack-md">
            <div>
              <label className="block text-label-md font-label-md text-on-surface mb-stack-xs" htmlFor="title">Title <span className="text-error">*</span></label>
              <input 
                id="title" 
                maxLength={100} 
                className={`w-full rounded-lg bg-surface-container-lowest px-4 py-3 text-body-md font-body-md transition-all placeholder:text-on-surface-variant/50 ${errors.title ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/20'} focus:outline-none focus:ring-4 shadow-sm`} 
                placeholder="e.g., Biology 101 Textbook, 4th Ed." 
                {...register('title')}
              />
              <div className="flex justify-between mt-1 px-1">
                {errors.title ? (
                  <span className="text-label-sm font-label-sm text-error">{errors.title.message}</span>
                ) : (
                  <span className="text-label-sm font-label-sm text-error hidden"></span>
                )}
                <span className="text-label-sm font-label-sm text-on-surface-variant/70 ml-auto">
                  {watch('title')?.length || 0}/100
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
              <div>
                <label className="block text-label-md font-label-md text-on-surface mb-stack-xs" htmlFor="category">Category <span className="text-error">*</span></label>
                <div className="relative">
                  <select 
                    id="category" 
                    className={`w-full appearance-none rounded-lg bg-surface-container-lowest px-4 py-3 text-body-md font-body-md transition-all ${errors.category ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/20'} focus:outline-none focus:ring-4 shadow-sm`} 
                    {...register('category')}
                  >
                    <option disabled value="">Select Category</option>
                    <option value="Books">Textbooks</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Other">Other</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                </div>
                {errors.category && <span className="text-label-sm font-label-sm text-error mt-1 block">{errors.category.message}</span>}
              </div>

              <div>
                <label className="block text-label-md font-label-md text-on-surface mb-stack-xs" htmlFor="condition">Condition <span className="text-error">*</span></label>
                <div className="relative">
                  <select 
                    id="condition" 
                    className={`w-full appearance-none rounded-lg bg-surface-container-lowest px-4 py-3 text-body-md font-body-md transition-all ${errors.condition ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/20'} focus:outline-none focus:ring-4 shadow-sm`} 
                    {...register('condition')}
                  >
                    <option disabled value="">Select Condition</option>
                    <option value="New">New</option>
                    <option value="Like New">Like New</option>
                    <option value="Used">Used</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                </div>
                {errors.condition && <span className="text-label-sm font-label-sm text-error mt-1 block">{errors.condition.message}</span>}
              </div>
            </div>

            <div>
              <label className="block text-label-md font-label-md text-on-surface mb-stack-xs" htmlFor="description">Description</label>
              <textarea 
                id="description" 
                rows={4} 
                className="w-full rounded-lg border-outline-variant bg-surface-container-lowest px-4 py-3 text-body-md font-body-md focus:border-primary focus:ring-primary/20 focus:outline-none focus:ring-4 transition-all resize-y placeholder:text-on-surface-variant/50 shadow-sm" 
                placeholder="Describe any wear and tear, history, or reasons for giving it away..."
                {...register('description')}
              ></textarea>
            </div>
          </section>

          <div className="h-px bg-outline-variant/20 w-full"></div>

          {/* Section: Pricing */}
          <section className="flex flex-col gap-stack-md">
            <h2 className="text-label-md font-label-md text-on-surface">Listing Type</h2>
            <div className="flex gap-stack-md">
              <label className="flex-1 cursor-pointer">
                <input type="radio" value="sell" className="peer sr-only" {...register('listingType')} />
                <div className="h-full rounded-xl border border-outline-variant p-stack-md flex flex-col gap-stack-xs items-center text-center peer-checked:border-primary peer-checked:bg-primary-container/10 peer-checked:text-primary transition-all">
                  <span className="material-symbols-outlined">payments</span>
                  <span className="text-label-md font-label-md">Sell Item</span>
                </div>
              </label>

              <label className="flex-1 cursor-pointer">
                <input type="radio" value="free" className="peer sr-only" {...register('listingType')} />
                <div className="h-full rounded-xl border border-outline-variant p-stack-md flex flex-col gap-stack-xs items-center text-center peer-checked:border-primary peer-checked:bg-primary-container/10 peer-checked:text-primary transition-all">
                  <span className="material-symbols-outlined">volunteer_activism</span>
                  <span className="text-label-md font-label-md">Give Away Free</span>
                </div>
              </label>
            </div>

            <div 
              className="transition-all duration-300 overflow-hidden mt-stack-xs" 
              style={{ height: listingType === 'sell' ? '84px' : '0px', opacity: listingType === 'sell' ? 1 : 0 }}
            >
              <label className="block text-label-md font-label-md text-on-surface mb-stack-xs" htmlFor="price">Price ($) <span className="text-error">*</span></label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-body-md">VND</span>
                <input 
                  id="price" 
                  type="number" 
                  step="1000"
                  min="0"
                  className={`w-full md:w-1/2 rounded-lg bg-surface-container-lowest pl-14 pr-4 py-3 text-body-md font-body-md transition-all ${errors.price ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/20'} focus:outline-none focus:ring-4 shadow-sm`} 
                  placeholder="0"
                  {...register('price')}
                  disabled={listingType === 'free'}
                />
              </div>
              {errors.price && <span className="text-label-sm font-label-sm text-error mt-1 block">{errors.price.message}</span>}
            </div>
          </section>

          <div className="h-px bg-outline-variant/20 w-full"></div>

          {/* Section: Location */}
          <section>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-stack-xs gap-2">
              <label className="block text-label-md font-label-md text-on-surface" htmlFor="searchQuery">Pickup Location <span className="text-error">*</span></label>
              
              <div className="flex items-center gap-4">
                <button 
                  type="button" 
                  onClick={handleUseMyUniversity}
                  disabled={isLocating}
                  className="flex items-center gap-1 text-label-sm font-label-sm text-secondary-container hover:text-secondary disabled:opacity-50 transition-colors bg-secondary-container/10 px-2 py-1 rounded-md border border-secondary-container/30"
                >
                  <span className="material-symbols-outlined text-[16px]">school</span>
                  Use My University
                </button>

                <button 
                  type="button" 
                  onClick={handleDetectLocation}
                  disabled={isLocating}
                  className="flex items-center gap-1 text-label-sm font-label-sm text-primary hover:text-surface-tint disabled:opacity-50 transition-colors"
                >
                  <span className={`material-symbols-outlined text-[16px] ${isLocating ? 'animate-spin' : ''}`}>
                    {isLocating ? 'refresh' : 'my_location'}
                  </span>
                  {isLocating ? 'Locating...' : 'Detect Location'}
                </button>
              </div>
            </div>

            <div className="relative">
              <input 
                id="searchQuery" 
                value={searchQuery}
                onChange={handleSearchQueryChange}
                onFocus={() => setShowSuggestions(true)}
                onBlur={handleBlur}
                className={`w-full rounded-lg bg-surface-container-lowest px-4 py-3 text-body-md font-body-md transition-all placeholder:text-on-surface-variant/50 ${errors.specificAddress ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant focus:border-primary focus:ring-primary/20'} focus:outline-none focus:ring-4 shadow-sm mt-stack-xs`} 
                placeholder="Search for an address or place..." 
              />
              
              {/* Hidden input to store validated address for react-hook-form */}
              <input type="hidden" {...register('specificAddress')} />

              {/* Suggestions Dropdown */}
              {showSuggestions && (searchQuery.length > 0) && (
                <div className="absolute z-10 w-full mt-1 bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg overflow-hidden max-h-60 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-3 text-body-sm text-on-surface-variant text-center">Searching...</div>
                  ) : suggestions.length > 0 ? (
                    <ul>
                      {suggestions.map((s, i) => (
                        <li 
                          key={i} 
                          onMouseDown={() => handleSelectSuggestion(s)}
                          className="px-4 py-3 hover:bg-surface-container cursor-pointer border-b border-outline-variant/20 last:border-0"
                        >
                          <div className="text-body-sm font-body-sm text-on-surface truncate">{s.display_name}</div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-3 text-body-sm text-on-surface-variant text-center">No results found</div>
                  )}
                </div>
              )}
            </div>
            {errors.specificAddress && <span className="text-label-sm font-label-sm text-error mt-1 block">{errors.specificAddress.message}</span>}
          </section>

          {/* Actions */}
          <div className="pt-stack-md flex gap-stack-md items-center justify-end">
            <button type="button" onClick={() => navigate(-1)} className="px-6 py-3 rounded-lg text-label-md font-label-md text-on-surface-variant hover:bg-surface-variant transition-colors">Cancel</button>
            <button 
              type="submit" 
              disabled={isLoading}
              className="px-8 py-3 rounded-lg text-label-md font-label-md bg-primary text-on-primary hover:bg-surface-tint shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Posting...' : 'Post Listing'}
            </button>
          </div>

        </form>
      </div>
    </main>
  );
}
