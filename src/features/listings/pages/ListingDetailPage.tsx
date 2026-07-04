import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getListingById, deleteListing, toggleListingReservedStatus } from '../../../services/listingService';
import { requestTransaction, cancelTransaction, getTransactionByListingAndBuyer } from '../../../services/transactionService';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { useToastStore } from '../../../store/useToastStore';
import { startConversation } from '../../../services/chatService';
import type { Listing, User, Transaction } from '../../../types';
import { Button } from '../../../components/ui/button';
import { useAuthStore } from '../../../store/useAuthStore';
import StudentBadge from '../../../components/ui/StudentBadge';
import { formatRelativeTime } from '../../../utils/formatTime';

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const { addToast } = useToastStore();
  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<User | null>(null);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingTransaction, setIsProcessingTransaction] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      setIsLoading(true);
      const data = await getListingById(id);
      if (data) {
        setListing(data.listing);
        setSeller(data.seller);
        if (currentUser) {
           const tx = await getTransactionByListingAndBuyer(data.listing.id, currentUser.uid);
           if (tx) setTransaction(tx);
        }
      }
      setIsLoading(false);
    };

    fetchDetail();
  }, [id, currentUser]);

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
    const success = await cancelTransaction(transaction.id);
    if (success) {
      setTransaction(null);
    }
    setIsProcessingTransaction(false);
  };

  const handleContactSeller = async () => {
    if (!currentUser || !listing || !seller) {
      navigate('/login');
      return;
    }
    try {
      setIsProcessingTransaction(true);
      const conversationId = await startConversation(listing.id, seller.uid, currentUser.uid);
      navigate(`/chat/${conversationId}`);
    } catch (error) {
      console.error("Failed to start chat", error);
      addToast("Failed to start conversation. Please try again.", 'error');
    } finally {
      setIsProcessingTransaction(false);
    }
  };

  const handleToggleReserved = async () => {
    if (!listing) return;
    setIsProcessingTransaction(true);
    try {
      const success = await toggleListingReservedStatus(listing.id, listing.status);
      if (success) {
        setListing({ ...listing, status: listing.status === 'reserved' ? 'available' : 'reserved' });
        addToast(`Listing marked as ${listing.status === 'reserved' ? 'available' : 'pending'}`, 'success');
      } else {
        addToast("Failed to update status", 'error');
      }
    } finally {
      setIsProcessingTransaction(false);
    }
  };

  const handleDeleteListing = async () => {
    if (!listing) return;
    setIsDeleting(true);
    try {
      const success = await deleteListing(listing.id);
      if (success) {
        navigate('/browse');
      } else {
        addToast('Failed to delete listing.', 'error');
      }
    } catch (error) {
      console.error('Error deleting listing:', error);
      addToast('Failed to delete listing.', 'error');
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const displayImage = listing.images && listing.images.length > 0 
    ? listing.images[currentImageIndex] 
    : 'https://via.placeholder.com/600?text=No+Image';

  return (
    <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-gutter py-stack-lg pb-24 md:pb-stack-lg flex flex-col gap-stack-lg bg-gradient-to-br from-surface-container-low/50 via-surface to-primary/5">
      {/* Breadcrumb & Actions Row */}
      <div className="flex justify-between items-center text-body-sm font-body-sm text-on-surface-variant">
        <div className="flex items-center gap-stack-xs flex-wrap">
          <button onClick={() => navigate('/')} className="hover:text-primary transition-colors">Browse</button>
          <span className="material-symbols-outlined text-[16px] opacity-50">chevron_right</span>
          <span className="text-on-surface bg-surface-container px-3 py-1 rounded-full shadow-sm border border-outline-variant/20">{listing.category || 'Category'}</span>
          <span className="material-symbols-outlined text-[16px] opacity-50">chevron_right</span>
          <span className="text-on-surface truncate max-w-[150px] sm:max-w-xs font-medium">{listing.title}</span>
        </div>
        <div className="flex items-center gap-stack-sm">
          <button className="flex items-center gap-stack-xs px-3 py-1.5 rounded-full hover:bg-surface-variant hover:text-primary transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">share</span>
            <span className="hidden sm:inline">Share</span>
          </button>
          <button className="flex items-center gap-stack-xs px-3 py-1.5 rounded-full hover:bg-tertiary-container hover:text-tertiary transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-[20px]">favorite_border</span>
            <span className="hidden sm:inline">Save</span>
          </button>
        </div>
      </div>

      {/* Listing Core Details Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Image Carousel Area (Left) */}
        <div className="lg:col-span-7 flex flex-col gap-stack-sm">
          <div className="w-full aspect-[4/3] rounded-[32px] overflow-hidden bg-surface-container-highest relative shadow-md border border-outline-variant/30 group">
            <img 
              src={displayImage} 
              alt={listing.title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
            />
            {listing.images && listing.images.length > 1 && (
              <div className="absolute inset-0 flex justify-between items-center px-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button 
                  onClick={handlePrevImage} 
                  className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xl border border-white/40 flex items-center justify-center text-white hover:bg-white/40 shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[28px]">chevron_left</span>
                </button>
                <button 
                  onClick={handleNextImage} 
                  className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xl border border-white/40 flex items-center justify-center text-white hover:bg-white/40 shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[28px]">chevron_right</span>
                </button>
              </div>
            )}
          </div>
          
          {/* Thumbnails */}
          {listing.images && listing.images.length > 1 && (
            <div className="flex gap-stack-sm overflow-x-auto snap-x pb-4 pt-1 px-1 custom-scrollbar">
              {listing.images.map((img, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden snap-start cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-md active:scale-95 box-border ${
                    idx === currentImageIndex 
                      ? 'border-[3px] border-primary scale-[0.98] shadow-sm' 
                      : 'border border-outline-variant/50 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          {/* Description Card (Desktop Only - Left Column) */}
          <div className="hidden lg:flex glass-panel bg-surface-container-lowest/80 backdrop-blur-xl border border-white/60 rounded-[32px] p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-primary/30 transition-all duration-500 hover:-translate-y-1 flex-col gap-stack-sm group mt-2">
            <h3 className="text-headline-md font-headline-md text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary bg-primary/10 p-1.5 rounded-xl group-hover:scale-110 transition-transform duration-300">description</span>
              Description
            </h3>
            <p className="text-body-md font-body-md text-on-surface-variant leading-relaxed whitespace-pre-wrap">
              {listing.description}
            </p>
          </div>
        </div>

        {/* Detail Info & Action Area (Right) */}
        <div className="lg:col-span-5 relative">
          <div className="sticky top-24 flex flex-col gap-stack-md">
          {/* Header Info */}
          <div className="flex flex-col gap-stack-xs px-2">
            <div className="flex items-center gap-stack-xs mb-1 flex-wrap">
              {listing.status === 'completed' && (
                <span className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-label-sm font-bold px-3 py-1.5 rounded-full shadow-[0_2px_10px_rgba(16,185,129,0.3)] flex items-center gap-1 border border-emerald-400/50">
                  <span className="material-symbols-outlined text-[16px]">verified</span> Sold / Completed
                </span>
              )}
              <span className="bg-primary-container text-on-primary-container text-label-sm font-bold px-3 py-1.5 rounded-full border border-primary/20 shadow-sm">
                {listing.condition}
              </span>
              {listing.usageTime && (
                <span className="bg-secondary-container text-on-secondary-container text-label-sm font-bold px-3 py-1.5 rounded-full border border-secondary/20 shadow-sm">
                  {listing.usageTime}
                </span>
              )}
              <span className="text-on-surface-variant text-label-sm font-label-sm flex items-center gap-1 bg-surface-container-low px-3 py-1.5 rounded-full border border-outline-variant/30">
                <span className="material-symbols-outlined text-[16px]">category</span> {listing.category}
              </span>
              {(listing.quantity && listing.quantity > 1) && (
                <span className="bg-tertiary-container text-on-tertiary-container text-label-sm font-bold px-3 py-1.5 rounded-full border border-tertiary/20 shadow-sm flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">inventory_2</span>
                  {Math.max(0, listing.quantity - (listing.completedCount || 0))} available
                </span>
              )}
            </div>
            <h1 className="text-headline-xl-mobile md:text-headline-xl font-headline-xl-mobile md:font-headline-xl text-on-surface tracking-tight">
              {listing.title}
            </h1>
            <div className="text-[40px] md:text-[48px] font-black tracking-tighter leading-none bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mt-4 mb-2 inline-block drop-shadow-sm">
              {listing.isFree ? 'FREE' : `${listing.price.toLocaleString('vi-VN')} ₫`}
            </div>
            <div className="flex items-center gap-1.5 text-on-surface-variant text-body-sm font-medium">
              <span className="material-symbols-outlined text-[18px]">schedule</span>
              Posted {formatRelativeTime(listing.createdAt)}
            </div>
          </div>

          {/* Description Card (Mobile Only) */}
          <div className="lg:hidden glass-panel bg-surface-container-lowest/80 backdrop-blur-xl border border-white/60 rounded-[32px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] flex flex-col gap-stack-sm">
            <h3 className="text-headline-sm font-headline-sm text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary bg-primary/10 p-1.5 rounded-xl">description</span>
              Description
            </h3>
            <p className="text-body-md font-body-md text-on-surface-variant leading-relaxed whitespace-pre-wrap">
              {listing.description}
            </p>
          </div>

          {/* Location & Logistics Card */}
          <div className="glass-panel bg-surface-container-lowest/80 backdrop-blur-xl border border-white/60 rounded-[32px] p-6 md:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:border-primary/30 transition-all duration-500 hover:-translate-y-1 flex flex-col gap-stack-sm group">
            <h3 className="text-label-md font-label-md text-on-surface uppercase tracking-wider flex items-center gap-2 opacity-80">
              <span className="material-symbols-outlined text-primary">local_shipping</span>
              Logistics
            </h3>
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex items-start gap-4 text-body-md font-body-md text-on-surface-variant p-4 bg-surface/50 rounded-2xl border border-outline-variant/20 hover:border-primary/30 transition-colors">
                <span className="material-symbols-outlined text-[24px] text-primary shrink-0 bg-primary/10 p-2 rounded-xl group-hover:scale-110 transition-transform duration-300">location_on</span>
                <div>
                  <span className="block font-bold text-on-surface mb-1">Meetup Location</span>
                  <span>{listing.specificAddress || listing.district || "Address not provided"}</span>
                </div>
              </div>
              {!listing.isFree && (
                <div className="flex items-start gap-4 text-body-md font-body-md text-on-surface-variant p-4 bg-surface/50 rounded-2xl border border-outline-variant/20 hover:border-primary/30 transition-colors">
                  <span className="material-symbols-outlined text-[24px] text-primary shrink-0 bg-primary/10 p-2 rounded-xl group-hover:scale-110 transition-transform duration-300">payments</span>
                  <div>
                    <span className="block font-bold text-on-surface mb-1">Payment Method</span>
                    <span>Cash / Transfer on meetup</span>
                  </div>
                </div>
              )}
            </div>
          </div>          {/* Seller Profile Card */}
          <div className="glass-panel bg-surface-container-lowest/80 backdrop-blur-xl rounded-[32px] p-6 md:p-8 border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] flex flex-col gap-4 group hover:border-primary/30 transition-all duration-500 hover:-translate-y-1 cursor-pointer" onClick={() => seller && navigate(`/profile/${seller.uid}`)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="relative w-16 h-16 rounded-full overflow-hidden bg-primary/10 border-2 border-primary/20 flex items-center justify-center font-bold text-primary shadow-sm group-hover:scale-105 group-hover:border-primary/50 transition-all duration-500">
                  {seller?.photoURL ? (
                    <img src={seller.photoURL} alt={seller.displayName || 'Seller'} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">{seller?.displayName?.charAt(0).toUpperCase() || 'S'}</span>
                  )}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-title-md font-title-md text-on-surface group-hover:text-primary transition-colors">{seller?.displayName || 'Unknown Seller'}</span>
                    <StudentBadge email={seller?.email} variant="full" />
                  </div>
                  {seller?.school && (
                    <span className="text-body-sm font-medium text-on-surface-variant mt-1 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-primary">school</span>
                      {seller.school}
                    </span>
                  )}
                  {seller?.totalReviews && seller.totalReviews > 0 ? (
                    <div className="flex items-center gap-1 text-amber-400 mt-1.5">
                      <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span className="text-body-sm font-bold text-on-surface ml-1">{seller.rating?.toFixed(1) || "5.0"}</span>
                      <span className="text-body-sm text-on-surface-variant ml-1 font-medium">({seller.totalReviews} {seller.totalReviews === 1 ? 'Review' : 'Reviews'})</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-on-surface-variant mt-1.5 opacity-80">
                      <span className="material-symbols-outlined text-[16px]">hotel_class</span>
                      <span className="text-body-sm font-medium">No reviews yet</span>
                    </div>
                  )}
                </div>
              </div>
              <button 
                className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm group-hover:shadow-md group-hover:translate-x-1"
              >
                <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* Primary Action */}
          <div className="mt-auto pt-stack-sm pb-4">
            {currentUser?.uid === listing.sellerId ? (
              <div className="flex flex-col gap-3">
                {listing.status === 'completed' ? (
                  <div className="w-full bg-surface-variant/50 border border-outline-variant/30 text-on-surface-variant text-label-lg font-label-lg py-4 rounded-2xl flex justify-center items-center gap-2 shadow-inner">
                    <span className="material-symbols-outlined text-[20px]">lock</span>
                    Completed Listing (Locked)
                  </div>
                ) : (
                  <>
                    <button 
                      onClick={handleToggleReserved}
                      disabled={isProcessingTransaction}
                      className="w-full border border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 text-label-lg font-label-lg py-4 rounded-2xl flex justify-center items-center gap-2 transition-all hover:-translate-y-0.5 active:scale-95 cursor-pointer disabled:opacity-50 disabled:transform-none"
                    >
                      <span className="material-symbols-outlined text-[20px]">{listing.status === 'reserved' ? 'visibility' : 'visibility_off'}</span>
                      {listing.status === 'reserved' ? 'Mark as Available' : 'Mark as Pending (Hide)'}
                    </button>
                    <button 
                      onClick={() => navigate(`/listings/${listing.id}/edit`)}
                      className="w-full bg-secondary text-on-secondary text-label-lg font-label-lg py-4 rounded-2xl hover:bg-secondary/90 shadow-sm hover:shadow-md transition-all flex justify-center items-center gap-2 hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                      Edit Listing
                    </button>
                    <button 
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="w-full border-2 border-error/20 bg-error/5 text-error hover:bg-error/10 hover:border-error/40 text-label-lg font-label-lg py-4 rounded-2xl transition-all flex justify-center items-center gap-2 hover:-translate-y-0.5 active:scale-95 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                      Delete Listing
                    </button>
                  </>
                )}
                <div className="bg-surface-container-low rounded-xl py-3 px-4 flex items-center justify-center gap-2 mt-2">
                  <span className="material-symbols-outlined text-[18px] text-primary">visibility</span>
                  <span className="text-body-sm font-bold text-on-surface">{listing.views || 0}</span>
                  <span className="text-body-sm text-on-surface-variant">views</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {listing.status === 'completed' || listing.status === 'sold' ? (
                  <div className="w-full bg-surface-variant text-on-surface-variant text-title-md font-bold py-4 rounded-2xl flex justify-center items-center gap-2 shadow-inner">
                    <span className="material-symbols-outlined">lock</span>
                    Completed
                  </div>
                ) : transaction && transaction.status === 'pending' ? (
                  <button 
                    onClick={handleCancelRequest}
                    disabled={isProcessingTransaction}
                    className="w-full border-2 border-error/20 bg-error/5 text-error hover:bg-error/10 hover:border-error/40 text-label-lg font-label-lg py-4 rounded-2xl transition-all flex justify-center items-center gap-2 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined">
                      {isProcessingTransaction ? 'hourglass_empty' : 'cancel'}
                    </span>
                    Cancel Request
                  </button>
                ) : listing.status === 'reserved' ? (
                  <div className="w-full bg-surface-variant text-on-surface-variant text-title-md font-bold py-4 rounded-2xl flex justify-center items-center gap-2 shadow-inner">
                    <span className="material-symbols-outlined">lock</span>
                    Reserved by Seller
                  </div>
                ) : (
                  <button 
                    onClick={handleRequestTransaction}
                    disabled={isProcessingTransaction || !currentUser}
                    className="relative overflow-hidden group w-full bg-gradient-to-r from-primary to-secondary text-white text-title-md font-bold py-4 rounded-2xl shadow-[0_4px_14px_rgba(0,166,126,0.3)] hover:shadow-[0_8px_25px_rgba(0,166,126,0.5)] transition-all duration-300 flex justify-center items-center gap-2 hover:-translate-y-1 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <span className="material-symbols-outlined text-[24px] group-hover:rotate-12 transition-transform duration-300">
                      {isProcessingTransaction ? 'hourglass_empty' : 'shopping_cart'}
                    </span>
                    {listing.isFree ? 'Request Free Item' : 'Request to Buy'}
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:animate-shimmer" />
                  </button>
                )}
                
                <button 
                  onClick={handleContactSeller}
                  disabled={isProcessingTransaction}
                  className="w-full border-2 border-outline-variant text-on-surface text-label-lg font-label-lg py-3.5 rounded-2xl hover:bg-surface-variant hover:border-primary/30 transition-all flex justify-center items-center gap-2 hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[22px] text-primary">chat</span>
                  Contact Seller
                </button>
                <div className="flex items-center justify-center gap-1.5 mt-2 text-on-surface-variant">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  <p className="text-center text-label-sm font-label-sm">Typically replies within 1 hour</p>
                </div>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Listing"
        message={`Are you sure you want to delete "${listing.title}"? This action cannot be undone and will cancel any pending transactions.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteListing}
        onCancel={() => setIsDeleteModalOpen(false)}
        isDestructive={true}
        isLoading={isDeleting}
      />
    </main>
  );
}
