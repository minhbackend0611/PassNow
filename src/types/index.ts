export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  school: string | null;
  province: string | null;
  district: string | null;
  photoURL?: string | null;
  isProfileComplete: boolean;
  createdAt?: string;
  rating?: number;
  totalReviews?: number;
}

export type ItemCondition = 'New' | 'Like New' | 'Used' | 'Fair';

export type ListingStatus = 'available' | 'reserved' | 'sold' | 'completed';

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: ItemCondition;
  usageTime?: string;
  images: string[];
  sellerId: string;
  sellerEmail?: string; // Optional for backward compatibility, used for verification badges
  school: string; // Used for broad filtering
  province: string; // Used for broad filtering
  district: string; // Used for broad filtering
  specificAddress?: string; // Exact pickup location
  coordinates?: { lat: number; lng: number };
  category: string;
  status: ListingStatus;
  isFree: boolean;
  createdAt: string | number;
  updatedAt: string;
  views?: number;
  quantity?: number;
  completedCount?: number;
}

export interface ListingFilter {
  school?: string;
  province?: string;
  district?: string;
  category?: string;
  isFree?: boolean;
  condition?: ItemCondition;
  searchQuery?: string;
  minPrice?: number;
  maxPrice?: number;
  sellerId?: string;
  radiusKm?: number;
  userLat?: number;
  userLng?: number;
}

export type TransactionStatus = 'pending' | 'completed' | 'cancelled';

export interface Transaction {
  id: string;
  listingId: string;
  listingTitle: string;
  sellerId: string;
  buyerId: string;
  sellerConfirmed: boolean;
  buyerConfirmed: boolean;
  status: TransactionStatus;
  createdAt: number;
  completedAt?: number | null;
}

export interface Review {
  id: string;
  transactionId: string;
  listingId: string;
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
  createdAt: number;
}

export interface Conversation {
  id: string;
  metadata: {
    participants: Record<string, boolean>; // e.g., { [userId1]: true, [userId2]: true }
    unreadCount?: Record<string, number>; // e.g., { [userId1]: 0, [userId2]: 1 }
    listingId: string;
    lastMessage: string;
    lastMessageAt: number; // unix timestamp
  };
}

export interface Message {
  id: string; // key from Realtime DB
  senderId: string;
  text: string;
  createdAt: number; // unix timestamp
}
