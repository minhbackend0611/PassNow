import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getListingById } from '../../../services/listingService';
import { requestTransaction, cancelTransaction, getTransactionByListingAndBuyer } from '../../../services/transactionService';
import type { Listing, User, Transaction } from '../../../types';
import { Button } from '../../../components/ui/button';
import { useAuthStore } from '../../../store/useAuthStore';

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<User | null>(null);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingTransaction, setIsProcessingTransaction] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      setIsLoading(true);
      const data = await getListingById(id);
      if (data) {
        setListing(data.listing);
        setSeller(data.seller);
        if (currentUser && data.listing.status !== 'available') {
           const tx = await getTransactionByListingAndBuyer(data.listing.id, currentUser.uid);
           if (tx) setTransaction(tx);
        }
      }
      setIsLoading(false);
    };

    fetchDetail();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex-1 flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20">
        <h2 className="text-2xl font-bold mb-4">Listing not found</h2>
        <Button onClick={() => navigate('/')}>Back to Home</Button>
      </div>
    );
  }

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? listing.images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === listing.images.length - 1 ? 0 : prev + 1));
  };

  const handleRequestTransaction = async () => {
    if (!currentUser || !listing) return;
    setIsProcessingTransaction(true);
    const txId = await requestTransaction(listing.id, listing.title, listing.sellerId, currentUser.uid);
    if (txId) {
      setListing({ ...listing, status: 'reserved' });
      setTransaction({
        id: txId,
        listingId: listing.id,
        listingTitle: listing.title,
        sellerId: listing.sellerId,
        buyerId: currentUser.uid,
        sellerConfirmed: false,
        buyerConfirmed: false,
        status: 'pending',
        createdAt: Date.now()
      });
    }
    setIsProcessingTransaction(false);
  };

  const handleCancelRequest = async () => {
    if (!transaction || !listing) return;
    setIsProcessingTransaction(true);
    const success = await cancelTransaction(transaction.id, listing.id);
    if (success) {
      setListing({ ...listing, status: 'available' });
      setTransaction(null);
    }
    setIsProcessingTransaction(false);
  };

  const displayImage = listing.images && listing.images.length > 0 
    ? listing.images[currentImageIndex] 
    : 'https://via.placeholder.com/600?text=No+Image';

  return (
    <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-gutter py-stack-lg pb-24 md:pb-stack-lg flex flex-col gap-stack-lg">
      {/* Breadcrumb & Actions Row */}
      <div className="flex justify-between items-center text-body-sm font-body-sm text-on-surface-variant">
        <div className="flex items-center gap-stack-xs">
          <button onClick={() => navigate('/')} className="hover:text-primary">Browse</button>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-on-surface">{listing.category || 'Category'}</span>
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          <span className="text-on-surface truncate max-w-[150px] sm:max-w-xs">{listing.title}</span>
        </div>
        <div className="flex items-center gap-stack-sm">
          <button className="flex items-center gap-stack-xs hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-[20px]">share</span>
            <span className="hidden sm:inline">Share</span>
          </button>
          <button className="flex items-center gap-stack-xs hover:text-tertiary transition-colors">
            <span className="material-symbols-outlined text-[20px]">favorite_border</span>
            <span className="hidden sm:inline">Save</span>
          </button>
        </div>
      </div>

      {/* Listing Core Details Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Image Carousel Area (Left) */}
        <div className="lg:col-span-7 flex flex-col gap-stack-sm">
          <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-surface-container-highest relative shadow-sm border border-outline-variant/30 group">
            <img 
              src={displayImage} 
              alt={listing.title} 
              className="w-full h-full object-cover" 
            />
            {listing.images && listing.images.length > 1 && (
              <div className="absolute inset-0 flex justify-between items-center px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button 
                  onClick={handlePrevImage} 
                  className="w-10 h-10 rounded-full bg-surface/80 backdrop-blur-sm flex items-center justify-center text-on-surface hover:bg-surface shadow-sm"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <button 
                  onClick={handleNextImage} 
                  className="w-10 h-10 rounded-full bg-surface/80 backdrop-blur-sm flex items-center justify-center text-on-surface hover:bg-surface shadow-sm"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            )}
          </div>
          
          {/* Thumbnails */}
          {listing.images && listing.images.length > 1 && (
            <div className="flex gap-stack-sm overflow-x-auto snap-x pb-2 scrollbar-hide">
              {listing.images.map((img, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden snap-start cursor-pointer transition-all ${
                    idx === currentImageIndex 
                      ? 'border-2 border-primary' 
                      : 'border border-outline-variant opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Detail Info & Action Area (Right) */}
        <div className="lg:col-span-5 flex flex-col gap-stack-md">
          {/* Header Info */}
          <div className="flex flex-col gap-stack-xs">
            <div className="flex items-center gap-stack-xs mb-1">
              <span className="bg-primary/10 text-primary text-label-sm font-label-sm px-2 py-1 rounded-full border border-primary/20">
                {listing.condition}
              </span>
              <span className="text-on-surface-variant text-label-sm font-label-sm flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">category</span> {listing.category}
              </span>
            </div>
            <h1 className="text-headline-xl-mobile md:text-headline-xl font-headline-xl-mobile md:font-headline-xl text-on-surface">
              {listing.title}
            </h1>
            <div className="text-headline-lg font-headline-lg text-primary mt-2">
              {listing.isFree ? 'FREE' : `${listing.price.toLocaleString('vi-VN')}k`}
            </div>
          </div>

          {/* Description Card */}
          <div className="bg-surface-container-lowest rounded-xl p-stack-md shadow-[0_2px_4px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col gap-stack-sm">
            <h3 className="text-headline-md font-headline-md text-on-surface">Description</h3>
            <p className="text-body-md font-body-md text-on-surface-variant leading-relaxed whitespace-pre-wrap">
              {listing.description}
            </p>
          </div>

          {/* Location & Logistics Card */}
          <div className="bg-surface-container-lowest rounded-xl p-stack-md shadow-[0_2px_4px_rgba(0,0,0,0.04)] border border-outline-variant/30 flex flex-col gap-stack-sm">
            <h3 className="text-label-md font-label-md text-on-surface uppercase tracking-wider">Logistics</h3>
            <div className="flex flex-col gap-stack-xs">
              <div className="flex items-center gap-stack-sm text-body-sm font-body-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-[20px] text-primary">location_on</span>
                <span>{listing.specificAddress || `${listing.school} - ${listing.district}`}</span>
              </div>
              {!listing.isFree && (
                <div className="flex items-center gap-stack-sm text-body-sm font-body-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-[20px] text-primary">payments</span>
                  <span>Cash / Transfer on meetup</span>
                </div>
              )}
            </div>
          </div>

          {/* Seller Profile Card */}
          <div className="bg-surface-container-low rounded-xl p-stack-md border border-outline-variant/50 flex flex-col gap-stack-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-stack-sm">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-variant border-2 border-surface flex items-center justify-center font-bold text-primary">
                  {seller?.photoURL ? (
                    <img src={seller.photoURL} alt={seller.displayName || 'Seller'} className="w-full h-full object-cover" />
                  ) : (
                    seller?.displayName?.charAt(0).toUpperCase() || 'S'
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-label-md font-label-md text-on-surface">{seller?.displayName || 'Unknown Seller'}</span>
                  <div className="flex items-center gap-1 text-secondary-container">
                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-[14px]">star_half</span>
                    <span className="text-body-sm font-body-sm text-on-surface-variant ml-1">({seller?.totalReviews || 0} Reviews)</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => seller && navigate(`/profile/${seller.uid}`)}
                className="text-primary text-label-sm font-label-sm hover:underline cursor-pointer"
              >
                View Profile
              </button>
            </div>
          </div>

          {/* Primary Action */}
          <div className="mt-auto pt-stack-sm">
            {currentUser?.uid === listing.sellerId ? (
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => navigate(`/listings/${listing.id}/edit`)}
                  className="w-full bg-secondary text-on-secondary text-label-md font-label-md py-4 rounded-xl hover:bg-secondary/90 transition-all flex justify-center items-center gap-stack-xs active:scale-[0.98] cursor-pointer"
                >
                  <span className="material-symbols-outlined">edit</span>
                  Edit Listing
                </button>
                <button 
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete this listing?")) {
                      navigate('/');
                    }
                  }}
                  className="w-full border border-error text-error hover:bg-error/5 text-label-md font-label-md py-4 rounded-xl transition-all flex justify-center items-center gap-stack-xs active:scale-[0.98] cursor-pointer"
                >
                  <span className="material-symbols-outlined">delete</span>
                  Delete Listing
                </button>
                <p className="text-center text-label-sm font-label-sm text-on-surface-variant mt-2 flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                  {listing.views || 0} views
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {listing.status === 'available' ? (
                  <button 
                    onClick={handleRequestTransaction}
                    disabled={isProcessingTransaction || !currentUser}
                    className="w-full bg-primary text-on-primary text-label-md font-label-md py-4 rounded-xl hover:bg-primary/90 hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.08)] transition-all flex justify-center items-center gap-stack-xs active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined">
                      {isProcessingTransaction ? 'hourglass_empty' : 'shopping_cart'}
                    </span>
                    {listing.isFree ? 'Request Free Item' : 'Request to Buy'}
                  </button>
                ) : listing.status === 'reserved' && transaction ? (
                  <button 
                    onClick={handleCancelRequest}
                    disabled={isProcessingTransaction}
                    className="w-full border border-error text-error hover:bg-error/5 text-label-md font-label-md py-4 rounded-xl transition-all flex justify-center items-center gap-stack-xs active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined">
                      {isProcessingTransaction ? 'hourglass_empty' : 'cancel'}
                    </span>
                    Cancel Request
                  </button>
                ) : (
                  <div className="w-full bg-surface-variant text-on-surface-variant text-label-md font-label-md py-4 rounded-xl flex justify-center items-center gap-stack-xs">
                    <span className="material-symbols-outlined">lock</span>
                    {listing.status === 'completed' || listing.status === 'sold' ? 'Completed' : 'Reserved by someone else'}
                  </div>
                )}
                
                <button 
                  onClick={() => navigate(`/chat?user=${seller?.uid}`)}
                  className="w-full border border-outline text-on-surface text-label-md font-label-md py-3 rounded-xl hover:bg-surface-variant/50 transition-all flex justify-center items-center gap-stack-xs active:scale-[0.98] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">chat</span>
                  Contact Seller
                </button>
                <p className="text-center text-label-sm font-label-sm text-on-surface-variant mt-2">Typically replies within 1 hour</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
