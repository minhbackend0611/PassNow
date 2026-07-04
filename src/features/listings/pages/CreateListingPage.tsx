import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { createListing, uploadListingImages, getListingById, updateListing } from '../../../services/listingService';
import type { ItemCondition } from '../../../types';
import MapPickerModal from '../../../components/MapPickerModal';
import { CustomSelect } from '../../../components/ui/CustomSelect';
import { useToastStore } from '../../../store/useToastStore';

const createListingSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }).max(100),
  category: z.string().min(1, { message: 'Category is required' }),
  condition: z.string().min(1, { message: 'Condition is required' }),
  description: z.string(),
  listingType: z.enum(['sell', 'free']),
  price: z.coerce.number().min(0).optional(),
  quantity: z.coerce.number().min(1, { message: 'Quantity must be at least 1' }).default(1),
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
  const { addToast } = useToastStore();

  const { id } = useParams();
  const isEditMode = !!id;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },

  } = useForm<CreateListingValues>({
    resolver: zodResolver(createListingSchema) as any,
    defaultValues: {
      listingType: 'sell',
      description: '',
      specificAddress: '',
      quantity: 1,
    }
  });

  const listingType = watch('listingType');
  const [isLocating, setIsLocating] = useState(false);
  const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | undefined>(undefined);
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const imageSectionRef = useRef<HTMLElement>(null);
  
  // Autocomplete state
  const [searchQuery, setSearchQuery] = useState('');
  interface OSMSuggestion { display_name: string; lat: string; lon: string; }
  const [suggestions, setSuggestions] = useState<OSMSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeout = useRef<number | null>(null);
  
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  useEffect(() => {
    if (isEditMode && id) {
      setIsLoading(true);
      getListingById(id).then(result => {
        if (result && result.listing) {
          const { listing } = result;
          reset({
            title: listing.title,
            category: listing.category,
            condition: listing.condition,
            description: listing.description,
            listingType: listing.isFree ? 'free' : 'sell',
            price: listing.isFree ? undefined : listing.price,
            quantity: listing.quantity || 1,
            specificAddress: listing.specificAddress || '',
          });
          setSearchQuery(listing.specificAddress || '');
          if (listing.coordinates) setCoordinates(listing.coordinates);
          setExistingImages(listing.images || []);
        } else {
          addToast('Listing not found', 'error');
          navigate(-1);
        }
      }).catch(err => {
        console.error(err);
        addToast('Error fetching listing', 'error');
      }).finally(() => setIsLoading(false));
    }
  }, [id, isEditMode, reset, navigate]);


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImageError(false);
      const newFiles = Array.from(e.target.files);
      if (existingImages.length + imageFiles.length + newFiles.length > 5) {
        addToast('You can only have up to 5 photos total.', 'error');
        return;
      }
      
      const newFilePreviews = newFiles.map(file => URL.createObjectURL(file));
      
      setImageFiles([...imageFiles, ...newFiles]);
      setImagePreviews([...imagePreviews, ...newFilePreviews]);
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

  const removeExistingImage = (index: number) => {
    const newExisting = [...existingImages];
    newExisting.splice(index, 1);
    setExistingImages(newExisting);
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
    
    searchTimeout.current = window.setTimeout(async () => {
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

  const handleSelectSuggestion = (suggestion: OSMSuggestion) => {
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
    if (!user || !user.school) {
      addToast("You haven't set a school in your profile yet.", 'error');
      setIsLocating(false);
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
          addToast("Could not find exact coordinates for your school. Please select manually from the suggestions if needed.", 'info');
        }
      })
      .catch(err => {
        console.error(err);
        addToast("Could not find coordinates for your school.", 'error');
      })
      .finally(() => setIsLocating(false));
  };





  const formatCurrency = (val: number | string | undefined) => {
    if (val === undefined || val === null || val === '') return '';
    const num = parseInt(val.toString().replace(/\D/g, ''), 10);
    if (isNaN(num)) return '';
    return num.toLocaleString('vi-VN');
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericString = rawValue.replace(/\D/g, '');
    if (numericString === '') {
      setValue('price', undefined, { shouldValidate: true });
    } else {
      setValue('price', parseInt(numericString, 10), { shouldValidate: true });
    }
  };

  const handlePriceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') {
      const rawValue = e.currentTarget.value;
      const numericString = rawValue.replace(/\D/g, '');
      if (numericString) {
        const newValue = parseInt(numericString + '000', 10);
        setValue('price', newValue, { shouldValidate: true });
      }
    }
  };

  const onSubmit = async (data: CreateListingValues) => {
    if (!user) return;
    if (imageFiles.length === 0 && existingImages.length === 0) {
      setImageError(true);
      addToast("Please upload at least one photo.", 'error');
      setTimeout(() => {
        imageSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return;
    }
    
    setIsLoading(true);
    try {
      const isFree = data.listingType === 'free';
      
      let finalImages = [...existingImages];
      if (imageFiles.length > 0) {
        const uploadedImages = await uploadListingImages(user.uid, imageFiles);
        finalImages = [...finalImages, ...uploadedImages];
      }

      if (isEditMode && id) {
        const success = await updateListing(id, {
          title: data.title,
          description: data.description,
          price: isFree ? 0 : (data.price || 0),
          isFree,
          condition: data.condition as ItemCondition,
          category: data.category,
          quantity: data.quantity,
          images: finalImages,
          specificAddress: data.specificAddress,
          coordinates,
        });

        if (success) {
          addToast("Listing updated successfully!", 'success');
          navigate(`/listings/${id}`);
        } else {
          addToast("Failed to update listing.", 'error');
        }
      } else {
        const listingId = await createListing({
          title: data.title,
          description: data.description,
          price: isFree ? 0 : (data.price || 0),
          isFree,
          condition: data.condition as ItemCondition,
          category: data.category,
          quantity: data.quantity,
          images: finalImages,
          school: user.school || 'Unknown',
          province: user.province || 'Unknown',
          district: user.district || 'Unknown',
          specificAddress: data.specificAddress,
          coordinates,
          sellerId: user.uid,
        });

        if (listingId) {
          addToast("Listing created successfully!", 'success');
          navigate(`/listings/${listingId}`);
        } else {
          addToast("Failed to create listing.", 'error');
        }
      }
    } catch (error) {
      console.error(error);
      addToast(isEditMode ? "Failed to update listing." : "Failed to create listing.", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-grow flex items-start justify-center p-gutter pb-28 md:p-stack-lg bg-surface-container-low/50">
      <div className="w-full max-w-3xl flex flex-col gap-6">
        
        {/* Header Area */}
        <div className="flex items-center gap-stack-md">
          <button onClick={() => navigate(-1)} className="w-12 h-12 rounded-full flex items-center justify-center bg-surface hover:bg-surface-variant shadow-sm border border-outline-variant/50 transition-all text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}>close</span>
          </button>
          <div>
            <h1 className="text-headline-lg font-bold text-on-surface">{isEditMode ? 'Edit Listing' : 'List an Item'}</h1>
            <p className="text-body-md text-on-surface-variant">{isEditMode ? 'Update your item details.' : 'Share your unneeded items with the campus community.'}</p>
          </div>
        </div>

        {/* Form Canvas */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
          
          {/* Section: Photos */}
          <section ref={imageSectionRef} className="glass-panel bg-gradient-to-br from-surface-container-low/80 to-primary/5 rounded-[32px] p-6 md:p-8 hover:shadow-lg transition-shadow duration-500">
            <h2 className="text-label-md font-label-md text-on-surface mb-stack-xs">Photos (up to 5) <span className="text-error">*</span></h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-stack-sm">
              {existingImages.map((imgUrl, index) => (
                <div key={`existing-${index}`} className="aspect-square relative rounded-2xl border border-outline-variant/30 overflow-hidden group hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                  <img src={imgUrl} alt={`Existing ${index}`} className="w-full h-full object-cover" />
                  <button 
                    type="button" 
                    onClick={() => removeExistingImage(index)}
                    className="absolute top-1 right-1 bg-surface-container-highest/80 text-on-surface-variant hover:text-error rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              ))}
              {imagePreviews.map((preview, index) => (
                <div key={index} className="aspect-square relative rounded-2xl border border-outline-variant/30 overflow-hidden group hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
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
              {(existingImages.length + imagePreviews.length) < 5 && (
                <label className="aspect-square border-2 border-dashed border-outline-variant/60 rounded-2xl flex flex-col items-center justify-center gap-stack-xs text-outline hover:border-primary hover:text-primary hover:-translate-y-1 hover:shadow-md active:scale-95 transition-all duration-300 cursor-pointer bg-surface/50 dark:bg-black/20 backdrop-blur-md">
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                  <span className="material-symbols-outlined text-headline-lg">add_photo_alternate</span>
                  <span className="text-label-sm font-label-sm text-center px-1">Add Photo</span>
                </label>
              )}
              {Array.from({ length: Math.max(0, 4 - existingImages.length - imagePreviews.length) }).map((_, i) => (
                <div key={`placeholder-${i}`} className="aspect-square bg-surface/30 dark:bg-black/10 backdrop-blur-md rounded-2xl border border-outline-variant/30 hidden sm:block"></div>
              ))}
            </div>
            <div className={`transition-all duration-300 overflow-hidden ${imageError ? 'max-h-10 opacity-100 mt-3' : 'max-h-0 opacity-0 mt-0'}`}>
              <p className="text-error text-label-sm font-label-sm flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">error</span>
                Please add at least one photo for your listing.
              </p>
            </div>
          </section>

          {/* Section: Details */}
          <section className="glass-panel bg-gradient-to-br from-surface-container-low/80 to-primary/5 rounded-[32px] p-6 md:p-8 hover:shadow-lg transition-shadow duration-500 flex flex-col gap-stack-md">
            <div>
              <label className="block text-label-md font-label-md text-on-surface mb-stack-xs" htmlFor="title">Title <span className="text-error">*</span></label>
              <input 
                id="title" 
                maxLength={100} 
                className={`w-full rounded-2xl border bg-surface/50 dark:bg-black/20 backdrop-blur-md px-4 py-3 text-body-md font-body-md transition-all duration-300 placeholder:text-on-surface-variant/50 ${errors.title ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant/50 focus:border-primary hover:border-primary/50 focus:ring-primary/20'} focus:outline-none focus:ring-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 focus:-translate-y-1`} 
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
                <div className="relative z-20">
                  <CustomSelect
                    value={watch('category') || ""}
                    onChange={(val) => setValue('category', val, { shouldValidate: true, shouldDirty: true })}
                    options={[
                      { value: 'Books', label: 'Textbooks' },
                      { value: 'Electronics', label: 'Electronics' },
                      { value: 'Furniture', label: 'Furniture' },
                      { value: 'Clothing', label: 'Clothing' },
                      { value: 'Other', label: 'Other' },
                    ]}
                    placeholder="Select Category"
                    error={!!errors.category}
                  />
                </div>
                {errors.category && <span className="text-label-sm font-label-sm text-error mt-1 block">{errors.category.message}</span>}
              </div>

              <div>
                <label className="block text-label-md font-label-md text-on-surface mb-stack-xs" htmlFor="condition">Condition <span className="text-error">*</span></label>
                <div className="relative z-10">
                  <CustomSelect
                    value={watch('condition') || ""}
                    onChange={(val) => setValue('condition', val, { shouldValidate: true, shouldDirty: true })}
                    options={[
                      { value: 'New', label: 'New' },
                      { value: 'Like New', label: 'Like New' },
                      { value: 'Used', label: 'Used' },
                      { value: 'Fair', label: 'Fair' },
                    ]}
                    placeholder="Select Condition"
                    error={!!errors.condition}
                  />
                </div>
                {errors.condition && <span className="text-label-sm font-label-sm text-error mt-1 block">{errors.condition.message}</span>}
              </div>

              <div className="relative group/qty">
                <label className="flex items-center gap-2 text-label-md font-label-md text-on-surface mb-stack-xs w-fit cursor-help" htmlFor="quantity">
                  Stock / Allowed Sales <span className="text-error">*</span>
                  <span className="material-symbols-outlined text-[18px] text-on-surface-variant group-hover/qty:text-primary transition-colors">info</span>
                </label>
                
                {/* Beautiful Tooltip */}
                <div className="absolute left-0 md:-left-4 bottom-full mb-2 w-72 p-4 opacity-0 invisible group-hover/qty:opacity-100 group-hover/qty:visible translate-y-2 group-hover/qty:translate-y-0 transition-all duration-300 z-50 rounded-[24px] bg-surface-container-highest/95 backdrop-blur-xl border border-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.15)] pointer-events-none">
                  <div className="flex items-start gap-3 relative z-10">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 border border-primary/10">
                      <span className="material-symbols-outlined text-primary text-[20px]">inventory_2</span>
                    </div>
                    <div>
                      <h4 className="text-label-md font-bold text-on-surface mb-1">Allowed Transactions</h4>
                      <p className="text-body-sm text-on-surface-variant leading-relaxed">
                        This is the maximum number of successful sales allowed. The item will remain visible and open to new requests until this limit is fully reached.
                      </p>
                    </div>
                  </div>
                  {/* Tooltip Arrow */}
                  <div className="absolute left-8 md:left-12 -bottom-2 w-4 h-4 bg-surface-container-highest/95 border-b border-r border-white/20 transform rotate-45 z-0"></div>
                </div>

                <input 
                  id="quantity" 
                  type="number"
                  min="1"
                  className={`w-full rounded-2xl border bg-surface/50 dark:bg-black/20 backdrop-blur-md px-4 py-3 text-body-md font-body-md transition-all duration-300 ${errors.quantity ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant/50 focus:border-primary hover:border-primary/50 focus:ring-primary/20'} focus:outline-none focus:ring-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 focus:-translate-y-1`} 
                  placeholder="1" 
                  {...register('quantity')}
                />
                {errors.quantity && <span className="text-label-sm font-label-sm text-error mt-1 block">{errors.quantity.message}</span>}
              </div>
            </div>

            <div>
              <label className="block text-label-md font-label-md text-on-surface mb-stack-xs" htmlFor="description">Description</label>
              <textarea 
                id="description" 
                rows={4} 
                className="w-full rounded-2xl border border-outline-variant/50 bg-surface/50 dark:bg-black/20 backdrop-blur-md px-4 py-3 text-body-md font-body-md focus:border-primary hover:border-primary/50 focus:ring-primary/20 focus:outline-none focus:ring-4 transition-all duration-300 resize-y placeholder:text-on-surface-variant/50 shadow-sm hover:shadow-md hover:-translate-y-0.5 focus:-translate-y-1" 
                placeholder="Describe any wear and tear, history, or reasons for giving it away..."
                {...register('description')}
              ></textarea>
            </div>
          </section>

          {/* Section: Pricing */}
          <section className="glass-panel bg-gradient-to-br from-surface-container-low/80 to-primary/5 rounded-[32px] p-6 md:p-8 hover:shadow-lg transition-shadow duration-500 flex flex-col gap-stack-md">
            <h2 className="text-label-md font-label-md text-on-surface">Listing Type</h2>
            <div className="flex gap-stack-md">
              <label className="flex-1 cursor-pointer">
                <input type="radio" value="sell" className="peer sr-only" {...register('listingType')} />
                <div className="h-full rounded-2xl border border-outline-variant/50 p-stack-md flex flex-col gap-stack-xs items-center text-center peer-checked:border-primary peer-checked:bg-primary-container/20 peer-checked:text-primary hover:-translate-y-1 hover:shadow-md active:scale-95 transition-all duration-300 bg-surface/50 dark:bg-black/20 backdrop-blur-md">
                  <span className="material-symbols-outlined">payments</span>
                  <span className="text-label-md font-label-md">Sell Item</span>
                </div>
              </label>

              <label className="flex-1 cursor-pointer">
                <input type="radio" value="free" className="peer sr-only" {...register('listingType')} />
                <div className="h-full rounded-2xl border border-outline-variant/50 p-stack-md flex flex-col gap-stack-xs items-center text-center peer-checked:border-primary peer-checked:bg-primary-container/20 peer-checked:text-primary hover:-translate-y-1 hover:shadow-md active:scale-95 transition-all duration-300 bg-surface/50 dark:bg-black/20 backdrop-blur-md">
                  <span className="material-symbols-outlined">volunteer_activism</span>
                  <span className="text-label-md font-label-md">Give Away Free</span>
                </div>
              </label>
            </div>

            <div 
              className={`transition-all duration-300 ease-in-out grid ${listingType === 'sell' ? 'grid-rows-[1fr] opacity-100 mt-stack-xs' : 'grid-rows-[0fr] opacity-0 mt-0'} -mx-2 -mt-2`}
            >
              <div className="overflow-hidden px-2 pt-2 pb-4">
                <label className="block text-label-md font-label-md text-on-surface mb-stack-xs" htmlFor="price">Giá (VNĐ) <span className="text-error">*</span></label>
                <div className={`relative w-full md:w-1/2 rounded-2xl border ${errors.price ? 'border-error focus-within:border-error focus-within:ring-error/20' : 'border-outline-variant/50 focus-within:border-primary hover:border-primary/50 focus-within:ring-primary/20'} bg-surface/50 dark:bg-black/20 backdrop-blur-md transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 focus-within:-translate-y-1 focus-within:ring-4`}>
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-body-md z-20 pointer-events-none">₫</span>
                  
                  {/* Background hint for Tab */}
                  <div className="absolute inset-0 pl-10 pr-4 flex items-center pointer-events-none z-20 overflow-hidden text-body-md font-body-md whitespace-pre">
                    <span className="text-transparent">{formatCurrency(watch('price'))}</span>
                    {watch('price') !== undefined && watch('price') !== null && String(watch('price')).length > 0 && !String(watch('price')).endsWith('000') && (
                      <span className="text-on-surface-variant/40 flex items-center gap-1 animate-fade-in">
                        .000 <kbd className="text-[10px] bg-surface-variant text-on-surface-variant px-1 rounded ml-1 font-sans">Tab ⇥</kbd>
                      </span>
                    )}
                  </div>

                  <input 
                    id="price" 
                    type="text" 
                    className="w-full h-full bg-transparent pl-10 pr-4 py-3 text-body-md font-body-md focus:outline-none z-10 relative rounded-2xl autofill:transition-colors autofill:duration-[5000s]" 
                    placeholder="0"
                    value={formatCurrency(watch('price'))}
                    onChange={handlePriceChange}
                    onKeyDown={handlePriceKeyDown}
                    disabled={listingType === 'free'}
                  />
                </div>
                {errors.price && <span className="text-label-sm font-label-sm text-error mt-1 block">{errors.price.message}</span>}
              </div>
            </div>
          </section>

          {/* Section: Location */}
          <section className="glass-panel bg-gradient-to-br from-surface-container-low/80 to-primary/5 rounded-[32px] p-6 md:p-8 hover:shadow-lg transition-shadow duration-500">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-stack-xs gap-2">
              <label className="block text-label-md font-label-md text-on-surface" htmlFor="searchQuery">Transaction Address (Địa chỉ hẹn giao dịch) <span className="text-error">*</span></label>
              
              <div className="flex items-center gap-2 flex-wrap">
                <button 
                  type="button" 
                  onClick={handleUseMyUniversity}
                  disabled={isLocating}
                  className="flex items-center gap-1 text-label-sm font-label-sm text-secondary-container hover:text-secondary disabled:opacity-50 transition-all duration-300 bg-secondary-container/10 px-3 py-1.5 rounded-xl border border-secondary-container/30 hover:-translate-y-0.5 hover:shadow-sm active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">school</span>
                  Use My University
                </button>


                <button 
                  type="button" 
                  onClick={() => setIsMapPickerOpen(true)}
                  disabled={isLocating}
                  className="flex items-center gap-1 text-label-sm font-label-sm text-tertiary hover:text-tertiary-container hover:bg-tertiary/10 px-3 py-1.5 rounded-xl transition-all duration-300 disabled:opacity-50 hover:-translate-y-0.5 hover:shadow-sm active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">map</span>
                  Open Map
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
                className={`w-full rounded-2xl border bg-surface/50 dark:bg-black/20 backdrop-blur-md px-4 py-3 text-body-md font-body-md transition-all duration-300 placeholder:text-on-surface-variant/50 ${errors.specificAddress ? 'border-error focus:border-error focus:ring-error/20' : 'border-outline-variant/50 focus:border-primary hover:border-primary/50 focus:ring-primary/20'} focus:outline-none focus:ring-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 focus:-translate-y-1 mt-stack-xs`} 
                placeholder="Search for an address or place..." 
              />
              
              {/* Hidden input to store validated address for react-hook-form */}
              <input type="hidden" {...register('specificAddress')} />

              {/* Suggestions Dropdown */}
              {showSuggestions && (searchQuery.length > 0) && (
                <div className="absolute z-50 w-full mt-2 bg-surface/95 backdrop-blur-xl border border-outline-variant/40 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden animate-fade-in origin-top">
                  <div className="max-h-48 overflow-y-auto custom-scrollbar">
                    <ul className="py-2">
                      {isSearching ? (
                        <div className="p-4 text-body-sm text-on-surface-variant text-center flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-primary/50 border-t-primary rounded-full animate-spin"></div>
                          Searching...
                        </div>
                      ) : suggestions.length > 0 ? (
                        suggestions.map((s, i) => (
                          <li 
                            key={i} 
                            onMouseDown={() => handleSelectSuggestion(s)}
                            className="px-5 py-3 hover:bg-surface-container-high hover:pl-7 cursor-pointer border-b border-outline-variant/20 last:border-0 transition-all duration-300 group"
                          >
                            <div className="text-body-sm font-body-sm text-on-surface truncate group-hover:text-primary transition-colors">{s.display_name}</div>
                          </li>
                        ))
                      ) : (
                        <div className="p-4 text-body-sm text-on-surface-variant text-center">No results found</div>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </div>
            {errors.specificAddress && <span className="text-label-sm font-label-sm text-error mt-1 block">{errors.specificAddress.message}</span>}
          </section>

          {/* Actions */}
          <div className="pt-2 flex gap-4 items-center justify-end">
            <button type="button" onClick={() => navigate(-1)} className="px-6 py-3.5 rounded-xl text-label-lg font-bold text-on-surface-variant hover:bg-surface-variant border border-transparent transition-colors">Cancel</button>
            <button 
              type="submit" 
              disabled={isLoading}
              className="px-8 py-3.5 rounded-xl text-label-lg font-bold bg-primary text-white hover:bg-primary/90 shadow-[0_4px_14px_rgba(0,166,126,0.3)] hover:shadow-[0_6px_20px_rgba(0,166,126,0.4)] transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? 'Posting...' : 'Post Listing'}
            </button>
          </div>

        </form>
      </div>
      {/* Map Picker Modal */}
      <MapPickerModal
        isOpen={isMapPickerOpen}
        onClose={() => setIsMapPickerOpen(false)}
        initialLat={coordinates?.lat}
        initialLng={coordinates?.lng}
        onSelect={(lat, lng, address) => {
          setCoordinates({ lat, lng });
          setSearchQuery(address);
          setValue('specificAddress', address, { shouldValidate: true });
        }}
      />
    </main>
  );
}
