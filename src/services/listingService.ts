import { collection, doc, getDoc, getDocs, query, where, orderBy, QueryConstraint, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Listing, ListingFilter, User } from '../types';

const LISTINGS_COLLECTION = 'listings';
const USERS_COLLECTION = 'users';

export const getListings = async (filter?: ListingFilter): Promise<Listing[]> => {
  let q = query(collection(db, LISTINGS_COLLECTION));
  const constraints: QueryConstraint[] = [];

  if (filter) {
    if (filter.school) {
      constraints.push(where('school', '==', filter.school));
    }
    if (filter.district) {
      constraints.push(where('district', '==', filter.district));
    }
    if (filter.category) {
      constraints.push(where('category', '==', filter.category));
    }
    if (filter.isFree !== undefined) {
      constraints.push(where('isFree', '==', filter.isFree));
    }
    if (filter.condition) {
      constraints.push(where('condition', '==', filter.condition));
    }
    if (filter.sellerId) {
      constraints.push(where('sellerId', '==', filter.sellerId));
    }
    // Note: status 'available' is implicitly filtered for feed
    constraints.push(where('status', '==', 'available'));
    
    // orderBy createdAt desc
    constraints.push(orderBy('createdAt', 'desc'));
  } else {
    constraints.push(where('status', '==', 'available'));
    constraints.push(orderBy('createdAt', 'desc'));
  }

  q = query(q, ...constraints);
  
  try {
    const querySnapshot = await getDocs(q);
    const listings: Listing[] = [];
    querySnapshot.forEach((doc) => {
      listings.push({ id: doc.id, ...doc.data() } as Listing);
    });
    
    let filteredListings = listings;

    if (filter?.minPrice !== undefined) {
      filteredListings = filteredListings.filter(l => l.price >= filter.minPrice!);
    }
    if (filter?.maxPrice !== undefined) {
      filteredListings = filteredListings.filter(l => l.price <= filter.maxPrice!);
    }
    
    // Client-side search filtering since Firestore doesn't support full-text search out of the box
    if (filter?.searchQuery) {
      const lowerQuery = filter.searchQuery.toLowerCase();
      filteredListings = filteredListings.filter(l => 
        l.title.toLowerCase().includes(lowerQuery) || 
        l.description.toLowerCase().includes(lowerQuery)
      );
    }
    
    return filteredListings;
  } catch (error) {
    console.error("Error fetching listings:", error);
    // For demo purposes, if it fails (like index missing or permissions), return empty array
    return [];
  }
};

export const getListingById = async (id: string): Promise<{ listing: Listing, seller: User | null } | null> => {
  try {
    const docRef = doc(db, LISTINGS_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const listing = { id: docSnap.id, ...docSnap.data() } as Listing;
      
      // Fetch seller info
      const sellerRef = doc(db, USERS_COLLECTION, listing.sellerId);
      const sellerSnap = await getDoc(sellerRef);
      const seller = sellerSnap.exists() ? { uid: sellerSnap.id, ...sellerSnap.data() } as User : null;
      
      return { listing, seller };
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error fetching listing detail:", error);
    return null;
  }
};

export const createListing = async (
  listingData: Omit<Listing, 'id' | 'createdAt' | 'status'>
): Promise<string | null> => {
  try {
    const docRef = await addDoc(collection(db, LISTINGS_COLLECTION), {
      ...listingData,
      status: 'available',
      createdAt: Date.now()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating listing:", error);
    return null;
  }
};
