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
}

export type ItemCondition = 'New' | 'Like New' | 'Used' | 'Fair';

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: ItemCondition;
  images: string[];
  sellerId: string;
  school: string;
  district: string;
  category: string;
  status: 'available' | 'sold';
  isFree: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListingFilter {
  school?: string;
  district?: string;
  category?: string;
  isFree?: boolean;
  condition?: ItemCondition;
  searchQuery?: string;
}
