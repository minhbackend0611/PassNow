import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { 
  sellerConfirmTransaction, 
  buyerConfirmTransaction,
  cancelTransaction
} from '../../../services/transactionService';
import { useTransactionStore } from '../../../store/useTransactionStore';
import { submitReview, getReviewsByReviewer } from '../../../services/reviewService';
import { startConversation } from '../../../services/chatService';
import { getUserById } from '../../../services/userService';
import { getListingById, getListings } from '../../../services/listingService';
import ReviewModal from '../../reviews/components/ReviewModal';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { useToastStore } from '../../../store/useToastStore';
import type { Transaction } from '../../../types';

function TransactionItem({
  tx, user, isBuyer, navigate, processingId, reviewedTxIds,
  handleCancel, handleBuyerConfirm, handleSellerConfirm, setReviewModalTx,
  hideListingInfo = false
}: any) {
  const [partner, setPartner] = useState<any>(null);
  const [listing, setListing] = useState<any>(null);
  const [isStartingChat, setIsStartingChat] = useState(false);

  useEffect(() => {
    const partnerId = isBuyer ? tx.sellerId : tx.buyerId;
    getUserById(partnerId).then(p => {
      if (p) setPartner(p);
    });
    
    getListingById(tx.listingId).then(res => {
      if (res && res.listing) {
        setListing(res.listing);
      }
    });
  }, [tx.sellerId, tx.buyerId, isBuyer, tx.listingId]);

  const isCompleted = tx.status === 'completed';
  const handoverText = isCompleted ? "Handover Done" : (tx.sellerConfirmed ? "Seller Confirmed" : (tx.buyerConfirmed ? "Buyer Confirmed" : "Meetup Pending"));

  const handleChat = async () => {
    if (!partner || !user) return;
    setIsStartingChat(true);
    try {
      const conversationId = await startConversation(tx.listingId, tx.sellerId, tx.buyerId);
      navigate(`/chat/${conversationId}`);
    } catch (err) {
      console.error(err);
      useToastStore.getState().addToast('Failed to open chat.', 'error');
    } finally {
      setIsStartingChat(false);
    }
  };

  return (
    <div id={`tx-${tx.id}`} className="glass-panel bg-surface-container-lowest/80 backdrop-blur-xl border border-white/60 rounded-[32px] p-6 md:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-500 hover:-translate-y-1 flex flex-col gap-6 group">
      
      {/* Header & Title */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div className="flex flex-col gap-2 flex-grow min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-label-sm font-label-sm px-3 py-1 rounded-full font-bold tracking-wider ${
              tx.status === 'completed' 
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' 
                : tx.status === 'cancelled'
                ? 'bg-error/10 text-error border border-error/20 shadow-sm'
                : 'bg-secondary/10 text-secondary border border-secondary/20 shadow-sm'
            }`}>
              {tx.status.toUpperCase()}
            </span>
            <span className="text-label-sm text-on-surface-variant bg-surface-variant/30 px-3 py-1 rounded-full border border-outline-variant/20">
              {new Date(tx.createdAt).toLocaleDateString()}
            </span>
          </div>
          
          {!hideListingInfo && (
            <div 
              onClick={() => navigate(`/listings/${tx.listingId}`)}
              className="flex items-start gap-4 mt-2 mb-2 p-4 bg-surface-container-low/50 hover:bg-surface-container-low rounded-2xl border border-outline-variant/30 transition-all duration-300 group/listing cursor-pointer"
            >
              {listing && listing.images && listing.images.length > 0 ? (
                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-sm border border-outline-variant/30">
                  <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover group-hover/listing:scale-110 transition-transform duration-500" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl shrink-0 shadow-sm bg-surface-variant/50 flex items-center justify-center text-on-surface-variant border border-outline-variant/30">
                  <span className="material-symbols-outlined text-2xl">image</span>
                </div>
              )}
              
              <div className="flex flex-col min-w-0 justify-center">
                <h3 
                  className="text-title-md font-bold text-on-surface group-hover/listing:text-primary transition-colors truncate"
                >
                  {tx.listingTitle}
                </h3>

                {/* Listing Details (Price & Location) */}
                {listing && (
                  <>
                    <span className="text-label-md font-bold text-primary mt-0.5">
                      {listing.isFree ? 'Free' : `${Number(listing.price || 0).toLocaleString('vi-VN')} ₫`}
                    </span>
                    <div className="flex items-center gap-1 text-on-surface-variant text-label-sm mt-1">
                      <span className="material-symbols-outlined text-[14px] text-primary/80">location_on</span>
                      <span className="line-clamp-1">{[listing.specificAddress, listing.district, listing.province].filter(Boolean).join(', ')}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Partner Info */}
          <div className="flex items-center gap-3 mt-2 mb-1 cursor-pointer hover:bg-surface-variant/30 p-2 -ml-2 rounded-xl transition-colors w-fit" onClick={() => partner && navigate(`/profile/${partner.uid}`)}>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shadow-inner border border-primary/20 text-sm">
              {partner?.displayName?.[0] || 'U'}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider leading-none mb-1">{isBuyer ? 'Seller' : 'Buyer'}</span>
              <span className="text-label-md font-label-md text-on-surface leading-none">{partner?.displayName || 'Loading...'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Stepper */}
      <div className="relative flex items-center justify-between w-full max-w-2xl mt-2 mb-2 self-center">
        {/* Background Line */}
        <div className="absolute left-6 right-6 top-[24px] -translate-y-1/2 h-1.5 bg-surface-variant rounded-full z-0"></div>
        {/* Progress Line */}
        <div 
          className="absolute left-6 top-[24px] -translate-y-1/2 h-1.5 bg-gradient-to-r from-primary to-secondary rounded-full z-0 transition-all duration-1000"
          style={{ width: isCompleted ? 'calc(100% - 48px)' : (tx.sellerConfirmed || tx.buyerConfirmed ? '50%' : '15%') }}
        ></div>

        {/* Step 1: Requested */}
        <div className="relative z-10 flex flex-col items-center gap-2 px-1">
          <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
            <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <span className="text-label-sm font-bold text-on-surface bg-surface-container-lowest/80 px-2 py-0.5 rounded-xl text-center leading-tight">Requested</span>
        </div>

        {/* Step 2: Handover */}
        <div className="relative z-10 flex flex-col items-center gap-2 px-1">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm transition-colors duration-500 ${
            isCompleted ? 'bg-primary text-white' : 'bg-surface-variant border-[3px] border-primary text-primary bg-surface'
          }`}>
            <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: isCompleted ? "'FILL' 1" : "'FILL' 0" }}>
              handshake
            </span>
          </div>
          <span className={`text-label-sm font-bold bg-surface-container-lowest/80 px-2 py-0.5 rounded-xl text-center leading-tight ${isCompleted ? 'text-on-surface' : 'text-primary'}`}>
            {handoverText}
          </span>
        </div>

        {/* Step 3: Completed / Cancelled */}
        <div className="relative z-10 flex flex-col items-center gap-2 px-1">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm transition-colors duration-500 ${
            isCompleted ? 'bg-primary text-white' : tx.status === 'cancelled' ? 'bg-error text-white' : 'bg-surface-variant text-on-surface-variant border-2 border-outline-variant/30 bg-surface'
          }`}>
            <span className="material-symbols-outlined text-[24px]" style={{ fontVariationSettings: (isCompleted || tx.status === 'cancelled') ? "'FILL' 1" : "'FILL' 0" }}>
              {tx.status === 'cancelled' ? 'cancel' : 'verified'}
            </span>
          </div>
          <span className={`text-label-sm font-bold bg-surface-container-lowest/80 px-2 py-0.5 rounded-xl text-center leading-tight max-w-[80px] sm:max-w-none ${isCompleted ? 'text-primary' : tx.status === 'cancelled' ? 'text-error' : 'text-on-surface-variant'}`}>
            {tx.status === 'cancelled' ? 'Failed / Cancelled' : 'Completed'}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-row items-stretch justify-end gap-2 pt-3 w-full border-t border-outline-variant/20 mt-2">
        <button 
          onClick={handleChat}
          disabled={isStartingChat}
          className="flex-1 sm:flex-none px-2 py-2.5 bg-secondary/10 text-secondary hover:bg-secondary/20 border border-secondary/20 hover:border-secondary/40 rounded-xl text-[11px] sm:text-label-md font-bold transition-all disabled:opacity-50 active:scale-[0.98] cursor-pointer flex flex-col sm:flex-row justify-center items-center gap-1 sm:gap-1.5 text-center leading-tight"
        >
          <span className="material-symbols-outlined text-[20px]">chat</span>
          <span className="whitespace-normal sm:whitespace-nowrap">{isStartingChat ? 'Opening...' : `Chat with ${isBuyer ? 'Seller' : 'Buyer'}`}</span>
        </button>
        {tx.status === 'pending' && isBuyer && (
          <button 
            onClick={() => handleCancel(tx)}
            disabled={processingId === tx.id}
            className="flex-1 sm:flex-none px-2 py-2.5 bg-error/5 text-error hover:bg-error/10 border border-error/20 hover:border-error/40 rounded-xl text-[11px] sm:text-label-md font-bold transition-all disabled:opacity-50 active:scale-[0.98] cursor-pointer flex flex-col sm:flex-row justify-center items-center gap-1 sm:gap-1.5 text-center leading-tight"
          >
            <span className="material-symbols-outlined text-[20px]">cancel</span>
            <span className="whitespace-normal sm:whitespace-nowrap">Cancel Request</span>
          </button>
        )}

        {tx.status === 'pending' && isBuyer && !tx.buyerConfirmed && tx.sellerConfirmed && (
          <button 
            onClick={() => handleBuyerConfirm(tx)}
            disabled={processingId === tx.id}
            className="flex-1 sm:flex-none px-2 py-2.5 bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl text-[11px] sm:text-label-md font-bold shadow-[0_4px_14px_rgba(0,166,126,0.3)] hover:shadow-[0_8px_25px_rgba(0,166,126,0.4)] hover:-translate-y-0.5 active:scale-95 transition-all flex flex-col sm:flex-row justify-center items-center gap-1 sm:gap-1.5 text-center leading-tight disabled:opacity-50 disabled:transform-none disabled:shadow-none cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">inventory_2</span>
            <span className="whitespace-normal sm:whitespace-nowrap">Confirm Receipt</span>
          </button>
        )}
        
        {tx.status === 'pending' && !isBuyer && !tx.sellerConfirmed && (
          <button 
            onClick={() => handleSellerConfirm(tx)}
            disabled={processingId === tx.id}
            className="flex-1 sm:flex-none px-2 py-2.5 bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl text-[11px] sm:text-label-md font-bold shadow-[0_4px_14px_rgba(0,166,126,0.3)] hover:shadow-[0_8px_25px_rgba(0,166,126,0.4)] hover:-translate-y-0.5 active:scale-95 transition-all flex flex-col sm:flex-row justify-center items-center gap-1 sm:gap-1.5 text-center leading-tight disabled:opacity-50 disabled:transform-none disabled:shadow-none cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">local_shipping</span>
            <span className="whitespace-normal sm:whitespace-nowrap">Confirm Delivery</span>
          </button>
        )}
        
        {tx.status === 'completed' && !reviewedTxIds.has(tx.id) && (
          <button 
            onClick={() => setReviewModalTx(tx)}
            className="flex-1 sm:flex-none px-2 py-2.5 bg-amber-500/10 text-amber-600 border border-amber-500/30 hover:bg-amber-500 hover:text-white rounded-xl text-[11px] sm:text-label-md font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-95 flex flex-col sm:flex-row justify-center items-center gap-1 sm:gap-1.5 text-center leading-tight group/review cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px] group-hover/review:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="whitespace-normal sm:whitespace-nowrap">Leave Review</span>
          </button>
        )}

        {tx.status === 'completed' && reviewedTxIds.has(tx.id) && (
          <div className="flex-1 sm:flex-none px-2 py-2.5 bg-surface-variant/50 text-on-surface-variant rounded-xl text-[11px] sm:text-label-md font-bold border border-outline-variant/30 flex flex-col sm:flex-row justify-center items-center gap-1 sm:gap-1.5 text-center leading-tight">
            <span className="material-symbols-outlined text-[20px] text-primary">done_all</span>
            <span className="whitespace-normal sm:whitespace-nowrap">Reviewed</span>
          </div>
        )}
      </div>
    </div>
  );
}

function CancelledTransactionItem({ tx, isBuyer }: { tx: any, isBuyer: boolean }) {
  const [partnerName, setPartnerName] = useState<string>('Loading...');
  useEffect(() => {
    const partnerId = isBuyer ? tx.sellerId : tx.buyerId;
    getUserById(partnerId).then(p => {
      if (p) setPartnerName(p.displayName || 'Unknown');
    });
  }, [tx, isBuyer]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-lowest/50 p-4 rounded-2xl border border-error/10 hover:border-error/20 transition-colors">
      <div className="flex items-center gap-3">
         <div className="w-10 h-10 rounded-full bg-error/10 text-error flex items-center justify-center font-bold text-sm border border-error/20">
            <span className="material-symbols-outlined text-[18px]">person_off</span>
         </div>
         <div className="flex flex-col">
           <span className="text-label-md text-on-surface line-through opacity-70">{partnerName}</span>
           <span className="text-label-sm text-error/80 font-bold">Failed / Cancelled</span>
         </div>
      </div>
      <span className="text-label-sm text-on-surface-variant bg-surface-variant/40 px-3 py-1 rounded-full self-start sm:self-auto border border-outline-variant/20">{new Date(tx.createdAt).toLocaleDateString()}</span>
    </div>
  );
}

function CancelledRequestsList({ txs, isBuyer }: { txs: any[], isBuyer: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);
  if (txs.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-outline-variant/20">
      <button 
        onClick={() => setIsExpanded(!isExpanded)} 
        className="flex items-center gap-2 text-label-sm font-bold text-on-surface-variant hover:text-on-surface transition-colors w-fit px-3 py-1.5 rounded-lg hover:bg-surface-variant/30"
      >
        <span className="material-symbols-outlined text-[18px]">history</span>
        {txs.length} Cancelled Request{txs.length > 1 ? 's' : ''}
        <span className="material-symbols-outlined text-[18px] transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }}>expand_more</span>
      </button>
      
      {isExpanded && (
        <div className="flex flex-col gap-3 mt-4 animate-in slide-in-from-top-2 fade-in duration-300">
          {txs.map(tx => (
            <CancelledTransactionItem key={tx.id} tx={tx} isBuyer={isBuyer} />
          ))}
        </div>
      )}
    </div>
  );
}

function ListingQueueHeader({ listingId, firstTx, fallbackListing, activeCount }: { listingId: string, firstTx?: any, fallbackListing?: any, activeCount: number }) {
  const [listing, setListing] = useState<any>(fallbackListing || null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!fallbackListing) {
      getListingById(listingId).then(res => {
        if (res && res.listing) setListing(res.listing);
      });
    }
  }, [listingId, fallbackListing]);

  return (
    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 px-2 border-b border-outline-variant/20 pb-6">
      <div 
        className="flex items-start gap-4 cursor-pointer group/header"
        onClick={() => navigate(`/listings/${listingId}`)}
      >
        {listing && listing.images && listing.images.length > 0 ? (
          <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-outline-variant/30 shadow-sm bg-surface-variant/30 group-hover/header:shadow-md transition-shadow">
            <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover group-hover/header:scale-110 transition-transform duration-500" />
          </div>
        ) : (
          <div className="w-20 h-20 rounded-2xl shrink-0 border border-outline-variant/30 shadow-sm bg-surface-variant/30 flex items-center justify-center text-on-surface-variant group-hover/header:shadow-md transition-shadow">
            <span className="material-symbols-outlined text-3xl group-hover/header:scale-110 transition-transform duration-500">image</span>
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-title-lg font-bold text-on-surface group-hover/header:text-primary transition-colors truncate max-w-[150px] sm:max-w-[200px] md:max-w-md" title={firstTx?.listingTitle || listing?.title}>
              {firstTx?.listingTitle || listing?.title || 'Loading...'}
            </h2>
            {listing && listing.status === 'pending' && (
              <span className="bg-warning/10 text-warning px-2 py-0.5 rounded-md text-label-sm font-bold border border-warning/20 whitespace-nowrap">
                Meetup Pending
              </span>
            )}
            {listing && listing.status === 'active' && (
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md text-label-sm font-bold border border-primary/20 whitespace-nowrap">
                Available
              </span>
            )}
          </div>
          {listing && (
            <div className="flex flex-col gap-1.5">
              <span className="text-title-md font-bold text-primary">
                {listing.isFree ? 'Free' : `${Number(listing.price || 0).toLocaleString('vi-VN')} ₫`}
              </span>
              <div className="flex items-center gap-1 text-on-surface-variant text-label-md">
                <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
                <span className="line-clamp-1">{[listing.specificAddress, listing.district, listing.province].filter(Boolean).join(', ')}</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-label-sm text-on-surface-variant font-medium mt-1">
                <span className="flex items-center gap-1.5 bg-surface-variant/40 px-2 py-0.5 rounded-md">
                  <span className="material-symbols-outlined text-[16px]">people</span>
                  {activeCount} active request{activeCount !== 1 && 's'}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-outline-variant/40"></span>
                <span className="flex items-center gap-1.5 text-tertiary bg-tertiary/10 px-2 py-0.5 rounded-md border border-tertiary/20">
                  <span className="material-symbols-outlined text-[16px]">inventory_2</span>
                  {Math.max(0, (listing.quantity || 1) - (listing.completedCount || 0))} allowed sales left
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {!listing && (
        <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-label-sm font-bold border border-primary/20 shadow-sm self-start md:self-auto">
          {activeCount} in queue
        </span>
      )}
    </div>
  );
}

export default function TransactionsPage() {
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetTxId = searchParams.get('id');
  const { transactions, buyingActionRequiredCount, sellingActionRequiredCount } = useTransactionStore();
  
  const [activeTab, setActiveTab] = useState<'buying' | 'selling'>('buying');
  const [showActionRequiredOnly, setShowActionRequiredOnly] = useState(false);
  const [sellingFilter, setSellingFilter] = useState<'all' | 'active' | 'pending'>('all');
  
  const [myListings, setMyListings] = useState<any[]>([]);

  useEffect(() => {
    if (user && activeTab === 'selling') {
      getListings({ sellerId: user.uid }).then(setMyListings);
    }
  }, [user, activeTab]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Review state
  const [reviewModalTx, setReviewModalTx] = useState<Transaction | null>(null);
  const [reviewedTxIds, setReviewedTxIds] = useState<Set<string>>(new Set());
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    isDestructive: false,
    onConfirm: () => {},
  });

  useEffect(() => {
    if (!user) return;
    
    // Transactions are already loaded by MainLayout's listener into the store
    // We just need to fetch the reviews for these transactions
    const fetchReviews = async () => {
      setIsLoading(true);
      const myReviews = await getReviewsByReviewer(user.uid);
      const reviewedSet = new Set(myReviews.map(r => r.transactionId));
      setReviewedTxIds(reviewedSet);
      setIsLoading(false);
    };

    fetchReviews();
  }, [user]);

  // Handle auto-scroll and highlight for target transaction from URL
  useEffect(() => {
    if (targetTxId && !isLoading && transactions.length > 0) {
      const tx = transactions.find(t => t.id === targetTxId);
      if (tx) {
        // Auto switch tab if necessary
        if (tx.sellerId === user?.uid && activeTab !== 'selling') {
          setActiveTab('selling');
        } else if (tx.buyerId === user?.uid && activeTab !== 'buying') {
          setActiveTab('buying');
        }

        // Wait for render then scroll & highlight
        setTimeout(() => {
          const el = document.getElementById(`tx-${targetTxId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Add highlight class briefly
            el.classList.add('ring-4', 'ring-primary', 'ring-offset-4');
            setTimeout(() => {
              el.classList.remove('ring-4', 'ring-primary', 'ring-offset-4');
            }, 3000);
          }
          
          // Remove the ?id= parameter from the URL to keep it clean
          navigate('/transactions', { replace: true });
        }, 500);
      }
    }
  }, [targetTxId, isLoading, transactions, user, activeTab, navigate]);

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20">
        <h2 className="text-2xl font-bold mb-4">Please log in to view your transactions</h2>
        <button onClick={() => navigate('/login')} className="bg-primary text-on-primary px-4 py-2 rounded-lg">Login</button>
      </div>
    );
  }

  const handleCancel = (tx: Transaction) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Cancel Request',
      message: 'Are you sure you want to cancel this request?',
      confirmText: 'Cancel Request',
      isDestructive: true,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        setProcessingId(tx.id);
        try {
          await cancelTransaction(tx.id);
        } finally {
          setProcessingId(null);
        }
      }
    });
  };

  const handleBuyerConfirm = (tx: Transaction) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Confirm Receipt',
      message: 'Confirm you have received this item?',
      confirmText: 'Confirm Receipt',
      isDestructive: false,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        setProcessingId(tx.id);
        try {
          await buyerConfirmTransaction(tx.id, tx.listingId);
        } finally {
          setProcessingId(null);
        }
      }
    });
  };

  const handleSellerConfirm = (tx: Transaction) => {
    setConfirmConfig({
      isOpen: true,
      title: 'Confirm Delivery',
      message: 'Confirm you have delivered this item?',
      confirmText: 'Confirm Delivery',
      isDestructive: false,
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isOpen: false }));
        setProcessingId(tx.id);
        try {
          await sellerConfirmTransaction(tx.id, tx.listingId);
        } finally {
          setProcessingId(null);
        }
      }
    });
  };

  const handleReviewSubmit = async (rating: number, comment: string) => {
    if (!user || !reviewModalTx) return;
    setIsSubmittingReview(true);
    
    const revieweeId = reviewModalTx.buyerId === user.uid 
      ? reviewModalTx.sellerId 
      : reviewModalTx.buyerId;

    const success = await submitReview(
      reviewModalTx.id,
      reviewModalTx.listingId,
      user.uid,
      revieweeId,
      rating,
      comment
    );

    if (success) {
      setReviewedTxIds(prev => {
        const newSet = new Set(prev);
        newSet.add(reviewModalTx.id);
        return newSet;
      });
      setReviewModalTx(null);
    } else {
      addToast("Failed to submit review. Please try again.", 'error');
    }
    setIsSubmittingReview(false);
  };

  // Include 'cancelled' transactions so they don't disappear, allowing the user to see them fail
  // Filter based on showActionRequiredOnly and activeTab
  const filteredTransactions = showActionRequiredOnly 
    ? transactions.filter(tx => {
        if (tx.status !== 'pending') return false;
        if (activeTab === 'buying' && tx.buyerId === user?.uid && tx.sellerConfirmed && !tx.buyerConfirmed) return true;
        if (activeTab === 'selling' && tx.sellerId === user?.uid && !tx.sellerConfirmed) return true;
        return false;
      })
    : transactions;

  const buyingTxs = filteredTransactions.filter(t => t.buyerId === user?.uid);
  const sellingTxs = filteredTransactions.filter(t => t.sellerId === user?.uid);

  const activeBuyingTxs = buyingTxs.filter(t => t.status !== 'cancelled');
  const cancelledBuyingTxs = buyingTxs.filter(t => t.status === 'cancelled');

  const activeActionCount = activeTab === 'buying' ? buyingActionRequiredCount : sellingActionRequiredCount;

  // Group selling transactions by listing to show queues
  const groupedSellingTxs = sellingTxs.reduce((acc, tx) => {
    if (!acc[tx.listingId]) acc[tx.listingId] = { active: [], cancelled: [], fallbackListing: null };
    if (tx.status === 'cancelled') {
      acc[tx.listingId].cancelled.push(tx);
    } else {
      acc[tx.listingId].active.push(tx);
    }
    return acc;
  }, {} as Record<string, { active: Transaction[], cancelled: Transaction[], fallbackListing: any | null }>);

  // Inject empty queues for active/pending listings with no requests
  myListings.forEach(listing => {
    if (listing.status !== 'sold' && !groupedSellingTxs[listing.id]) {
      groupedSellingTxs[listing.id] = { active: [], cancelled: [], fallbackListing: listing };
    }
  });

  // Sort each group ascending (oldest first = highest priority in queue)
  Object.values(groupedSellingTxs).forEach(group => {
    group.active.sort((a, b) => a.createdAt - b.createdAt);
    group.cancelled.sort((a, b) => b.createdAt - a.createdAt); // newest cancelled first
  });

  const displayTxsLength = activeTab === 'buying' ? buyingTxs.length : sellingTxs.length;

  return (
    <main className="flex-grow w-full max-w-container-max mx-auto px-margin-mobile md:px-gutter py-stack-lg pb-24 md:pb-stack-lg flex flex-col gap-stack-lg relative">
      {/* Animated abstract background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-secondary/5 blur-[100px] animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }}></div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-stack-md border-b border-outline-variant/20 pb-stack-md">
        <div className="flex flex-col gap-1">
          <h1 className="text-headline-xl font-headline-xl text-on-surface tracking-tight">My Transactions</h1>
          <p className="text-body-lg font-body-lg text-on-surface-variant">Track your purchases and sales progress</p>
        </div>
        
        {/* Actions Required Quick Filter */}
        {activeActionCount > 0 && (
          <button
            onClick={() => setShowActionRequiredOnly(!showActionRequiredOnly)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-label-md font-bold transition-all ${
              showActionRequiredOnly 
                ? 'bg-error text-white shadow-[0_4px_14px_rgba(200,0,0,0.3)]' 
                : 'bg-error/10 text-error border border-error/20 hover:bg-error/20'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {showActionRequiredOnly ? 'filter_alt_off' : 'notification_important'}
            </span>
            {showActionRequiredOnly ? 'Show All' : `${activeActionCount} Action${activeActionCount > 1 ? 's' : ''} Required`}
          </button>
        )}
        
        {/* Segmented Control iOS Style */}
        <div className="relative flex bg-surface-container-highest/50 p-1.5 rounded-2xl border border-outline-variant/30 w-full md:w-auto shadow-inner backdrop-blur-md">
          {/* Animated background pill */}
          <div 
            className="absolute top-1.5 bottom-1.5 rounded-xl bg-surface shadow-sm border border-outline-variant/20 transition-all duration-300 ease-out"
            style={{ 
              left: activeTab === 'buying' ? '6px' : 'calc(50% + 3px)',
              width: 'calc(50% - 9px)'
            }}
          />
          
          <button
            onClick={() => { setActiveTab('buying'); setShowActionRequiredOnly(false); }}
            className={`relative flex-1 flex justify-center items-center gap-2 py-2.5 px-6 rounded-xl text-label-lg font-bold transition-colors duration-300 z-10 ${
              activeTab === 'buying' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
            Buying
            {buyingActionRequiredCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full ring-2 ring-surface"></span>
            )}
          </button>
          
          <button
            onClick={() => { setActiveTab('selling'); setShowActionRequiredOnly(false); }}
            className={`relative flex-1 flex justify-center items-center gap-2 py-2.5 px-6 rounded-xl text-label-lg font-bold transition-colors duration-300 z-10 ${
              activeTab === 'selling' ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">storefront</span>
            Selling
            {sellingActionRequiredCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full ring-2 ring-surface"></span>
            )}
          </button>
        </div>
      </div>

      {/* Transaction List */}
      <div className="flex flex-col gap-4">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : displayTxsLength === 0 ? (
          <div className="glass-panel bg-surface-container-lowest/50 backdrop-blur-xl rounded-[32px] p-12 text-center border border-white/60 shadow-sm flex flex-col items-center justify-center min-h-[400px]">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 shadow-inner border border-primary/20">
              <span className="material-symbols-outlined text-[48px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                {activeTab === 'buying' ? 'shopping_bag' : 'storefront'}
              </span>
            </div>
            <h3 className="text-headline-sm font-headline-sm text-on-surface mb-3">
              No {activeTab === 'buying' ? 'purchases' : 'sales'} yet
            </h3>
            <p className="text-body-lg text-on-surface-variant max-w-md mx-auto mb-8">
              {activeTab === 'buying' 
                ? "You haven't requested to buy any items yet. Start exploring to find great deals!"
                : "You don't have any active sales right now. List an item to get started!"}
            </p>
            <button 
              onClick={() => navigate(activeTab === 'buying' ? '/browse' : '/list')} 
              className="bg-gradient-to-r from-primary to-secondary text-white px-8 py-3.5 rounded-2xl font-bold shadow-[0_4px_14px_rgba(0,166,126,0.3)] hover:shadow-[0_8px_25px_rgba(0,166,126,0.5)] hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">
                {activeTab === 'buying' ? 'search' : 'add_circle'}
              </span>
              {activeTab === 'buying' ? 'Browse Listings' : 'Create a Listing'}
            </button>
          </div>
        ) : activeTab === 'selling' ? (
          <div className="flex flex-col w-full">
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 -mx-2 px-2 md:mx-0 md:px-0 scrollbar-hide">
               <button 
                 onClick={() => setSellingFilter('all')} 
                 className={`px-4 py-1.5 rounded-full text-label-md font-bold whitespace-nowrap transition-colors ${sellingFilter === 'all' ? 'bg-on-surface text-surface' : 'bg-surface-variant/30 text-on-surface-variant hover:bg-surface-variant/50 border border-outline-variant/20'}`}
               >
                 All Listings
               </button>
               <button 
                 onClick={() => setSellingFilter('active')} 
                 className={`px-4 py-1.5 rounded-full text-label-md font-bold whitespace-nowrap transition-colors ${sellingFilter === 'active' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-surface-variant/30 text-on-surface-variant hover:bg-surface-variant/50 border border-outline-variant/20'}`}
               >
                 Available
               </button>
               <button 
                 onClick={() => setSellingFilter('pending')} 
                 className={`px-4 py-1.5 rounded-full text-label-md font-bold whitespace-nowrap transition-colors ${sellingFilter === 'pending' ? 'bg-warning/10 text-warning border border-warning/20' : 'bg-surface-variant/30 text-on-surface-variant hover:bg-surface-variant/50 border border-outline-variant/20'}`}
               >
                 Meetup Pending
               </button>
            </div>
            
            {Object.entries(groupedSellingTxs)
              .filter(([listingId, group]) => {
                if (sellingFilter === 'all') return true;
                const finalStatus = group.fallbackListing?.status || myListings.find(l => l.id === listingId)?.status;
                return finalStatus === sellingFilter;
              })
              .map(([listingId, group]) => {
            const firstTx = group.active[0] || group.cancelled[0];
            return (
              <div key={listingId} className="flex flex-col gap-4 mb-4 bg-surface-container-lowest/30 p-6 rounded-[32px] border border-outline-variant/30 shadow-inner">
                <ListingQueueHeader 
                  listingId={listingId} 
                  firstTx={firstTx} 
                  fallbackListing={group.fallbackListing}
                  activeCount={group.active.length} 
                />
                
                <div className="flex flex-col gap-4 mt-2">
                  {group.active.length === 0 ? (
                    <p className="text-body-md text-on-surface-variant italic py-4 text-center bg-surface-variant/20 rounded-2xl">
                      No active requests for this listing.
                    </p>
                  ) : (
                    group.active.map((tx, index) => {
                      const isBuyer = tx.buyerId === user.uid;
                      return (
                        <div key={tx.id} className="relative group/queue">
                          <div className="absolute -left-3 -top-3 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center font-bold shadow-[0_2px_10px_rgba(0,166,126,0.3)] z-10 border-2 border-surface transition-transform group-hover/queue:scale-110">
                            #{index + 1}
                          </div>
                          <TransactionItem
                            tx={tx}
                            user={user}
                            isBuyer={isBuyer}
                            navigate={navigate}
                            processingId={processingId}
                            reviewedTxIds={reviewedTxIds}
                            handleCancel={handleCancel}
                            handleBuyerConfirm={handleBuyerConfirm}
                            handleSellerConfirm={handleSellerConfirm}
                            setReviewModalTx={setReviewModalTx}
                            hideListingInfo={true}
                          />
                        </div>
                      );
                    })
                  )}
                </div>

                <CancelledRequestsList txs={group.cancelled} isBuyer={false} />
              </div>
            );
          })}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {activeBuyingTxs.length === 0 && cancelledBuyingTxs.length > 0 && (
               <p className="text-body-md text-on-surface-variant italic py-10 text-center bg-surface-variant/20 rounded-[32px] border border-outline-variant/20">
                 You have no active purchases.
               </p>
            )}
            {activeBuyingTxs.map(tx => (
              <TransactionItem
                key={tx.id}
                tx={tx}
                user={user}
                isBuyer={true}
                navigate={navigate}
                processingId={processingId}
                reviewedTxIds={reviewedTxIds}
                handleCancel={handleCancel}
                handleBuyerConfirm={handleBuyerConfirm}
                handleSellerConfirm={handleSellerConfirm}
                setReviewModalTx={setReviewModalTx}
              />
            ))}
            
            {cancelledBuyingTxs.length > 0 && (
              <div className="mt-8 bg-surface-container-lowest/30 p-6 rounded-[32px] border border-outline-variant/30 shadow-sm">
                 <h3 className="text-title-md font-bold text-on-surface-variant mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">history</span>
                    Cancelled / Failed Purchases
                 </h3>
                 <div className="flex flex-col gap-3">
                   {cancelledBuyingTxs.map(tx => (
                     <CancelledTransactionItem key={tx.id} tx={tx} isBuyer={true} />
                   ))}
                 </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ReviewModal 
        isOpen={!!reviewModalTx}
        onClose={() => setReviewModalTx(null)}
        onSubmit={handleReviewSubmit}
        revieweeName={reviewModalTx ? (reviewModalTx.buyerId === user?.uid ? 'the Seller' : 'the Buyer') : undefined}
        isSubmitting={isSubmittingReview}
      />
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig(prev => ({ ...prev, isOpen: false }))}
        isDestructive={confirmConfig.isDestructive}
      />
    </main>
  );
}
