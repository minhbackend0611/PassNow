import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getListingById } from '../../../services/listingService';
import type { Listing, User } from '../../../types';
import { Button } from '../../../components/ui/button';
import { ChevronLeft, ChevronRight, Share, Heart, MapPin, DollarSign, MessageCircle, Star } from 'lucide-react';

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [seller, setSeller] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      setIsLoading(true);
      const data = await getListingById(id);
      if (data) {
        setListing(data.listing);
        setSeller(data.seller);
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

  const displayImage = listing.images && listing.images.length > 0 
    ? listing.images[currentImageIndex] 
    : 'https://via.placeholder.com/600?text=No+Image';

  return (
    <main className="flex-grow w-full max-w-7xl mx-auto px-4 md:px-6 py-8 flex flex-col gap-8">
      {/* Breadcrumb & Actions */}
      <div className="flex justify-between items-center text-sm text-on-surface-variant">
        <div className="flex items-center gap-1">
          <button onClick={() => navigate('/')} className="hover:text-primary">Browse</button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-on-surface">{listing.category || 'Category'}</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-on-surface truncate max-w-[150px] sm:max-w-xs">{listing.title}</span>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1 hover:text-primary transition-colors">
            <Share className="w-5 h-5" />
            <span className="hidden sm:inline">Share</span>
          </button>
          <button className="flex items-center gap-1 hover:text-tertiary transition-colors">
            <Heart className="w-5 h-5" />
            <span className="hidden sm:inline">Save</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Images */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-surface-container-highest relative shadow-sm border border-outline-variant/30 group">
            <img src={displayImage} alt={listing.title} className="w-full h-full object-cover" />
            
            {listing.images && listing.images.length > 1 && (
              <div className="absolute inset-0 flex justify-between items-center px-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button onClick={handlePrevImage} className="w-10 h-10 rounded-full bg-surface/80 backdrop-blur-sm flex items-center justify-center text-on-surface hover:bg-surface shadow-sm">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button onClick={handleNextImage} className="w-10 h-10 rounded-full bg-surface/80 backdrop-blur-sm flex items-center justify-center text-on-surface hover:bg-surface shadow-sm">
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>
            )}
          </div>
          
          {/* Thumbnails */}
          {listing.images && listing.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {listing.images.map((img, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 cursor-pointer ${
                    idx === currentImageIndex ? 'border-primary' : 'border-outline-variant opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Details */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-full border border-primary/20">
                {listing.condition}
              </span>
              <span className="text-on-surface-variant text-xs font-medium flex items-center gap-1">
                {listing.category}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-on-surface">{listing.title}</h1>
            <div className="text-2xl font-bold text-primary mt-2">
              {listing.isFree ? 'FREE' : `${listing.price.toLocaleString('vi-VN')}k`}
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/30 flex flex-col gap-2">
            <h3 className="text-lg font-semibold text-on-surface">Description</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap">
              {listing.description}
            </p>
          </div>

          <div className="bg-surface-container-lowest rounded-xl p-4 shadow-sm border border-outline-variant/30 flex flex-col gap-3">
            <h3 className="text-sm font-medium text-on-surface uppercase tracking-wider">Logistics</h3>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                <MapPin className="w-5 h-5 text-primary" />
                <span>{listing.school} - {listing.district}</span>
              </div>
              {!listing.isFree && (
                <div className="flex items-center gap-3 text-sm text-on-surface-variant">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <span>Cash / Transfer on meetup</span>
                </div>
              )}
            </div>
          </div>

          {/* Seller Info */}
          <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/50 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-variant border-2 border-surface flex items-center justify-center font-bold text-primary">
                  {seller?.photoURL ? (
                    <img src={seller.photoURL} alt={seller.displayName || 'Seller'} className="w-full h-full object-cover" />
                  ) : (
                    seller?.displayName?.charAt(0).toUpperCase() || 'S'
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-on-surface">{seller?.displayName || 'Unknown Seller'}</span>
                  <div className="flex items-center gap-1 text-secondary-container">
                    <Star className="w-3 h-3 fill-current" />
                    <Star className="w-3 h-3 fill-current" />
                    <Star className="w-3 h-3 fill-current" />
                    <Star className="w-3 h-3 fill-current" />
                    <Star className="w-3 h-3 fill-current" />
                  </div>
                </div>
              </div>
              <button className="text-primary text-xs font-medium hover:underline">View Profile</button>
            </div>
          </div>

          <div className="mt-auto pt-2">
            <Button className="w-full py-6 text-base font-medium flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Contact Seller
            </Button>
            <p className="text-center text-xs text-on-surface-variant mt-2">Typically replies within 1 hour</p>
          </div>
        </div>
      </div>
    </main>
  );
}
