import { collection, addDoc, doc, getDoc, getDocs, query, where, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { sendSystemMessage } from './chatService';
import type { Listing, ListingFilter, User } from '../types';

const LISTINGS_COLLECTION = 'listings';
const USERS_COLLECTION = 'users';

export const getListings = async (filter?: ListingFilter): Promise<Listing[]> => {
  // Only query by status to avoid complex composite index requirements from Firebase
  const q = query(collection(db, LISTINGS_COLLECTION), where('status', '==', 'available'));
  
  try {
    const querySnapshot = await getDocs(q);
    let listings: Listing[] = [];
    querySnapshot.forEach((doc) => {
      listings.push({ id: doc.id, ...doc.data() } as Listing);
    });
    
    // Sort by createdAt desc
    listings.sort((a, b) => {
      const timeA = typeof a.createdAt === 'number' ? a.createdAt : new Date(a.createdAt).getTime();
      const timeB = typeof b.createdAt === 'number' ? b.createdAt : new Date(b.createdAt).getTime();
      return timeB - timeA;
    });

    if (filter) {
      if (filter.school) {
        listings = listings.filter(l => l.school === filter.school);
      }
      if (filter.province) {
        listings = listings.filter(l => l.province === filter.province);
      }
      if (filter.district) {
        listings = listings.filter(l => l.district === filter.district);
      }
      if (filter.category) {
        listings = listings.filter(l => l.category === filter.category);
      }
      if (filter.isFree !== undefined) {
        listings = listings.filter(l => l.isFree === filter.isFree);
      }
      if (filter.condition) {
        listings = listings.filter(l => l.condition === filter.condition);
      }
      if (filter.sellerId) {
        listings = listings.filter(l => l.sellerId === filter.sellerId);
      }
      if (filter.minPrice !== undefined) {
        listings = listings.filter(l => l.price >= filter.minPrice!);
      }
      if (filter.maxPrice !== undefined) {
        listings = listings.filter(l => l.price <= filter.maxPrice!);
      }
      if (filter.searchQuery) {
        const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const searchTerms = normalize(filter.searchQuery).split(/\s+/).filter(Boolean);
        
        listings = listings.filter(l => {
          const searchableText = normalize((l.title || "") + " " + (l.description || ""));
          return searchTerms.every(term => searchableText.includes(term));
        });
      }
    }
    
    return listings;
  } catch (error) {
    console.error("Error fetching listings:", error);
    // For demo purposes, if it fails (like index missing or permissions), return empty array
    return [];
  }
};

export const getDistinctSchools = async (): Promise<string[]> => {
  try {
    const q = query(collection(db, LISTINGS_COLLECTION), where('status', '==', 'available'));
    const querySnapshot = await getDocs(q);
    const schools = new Set<string>();
    querySnapshot.forEach((doc) => {
      const school = doc.data().school;
      if (school) schools.add(school);
    });
    return Array.from(schools).sort((a, b) => a.localeCompare(b));
  } catch (error) {
    console.error("Error fetching distinct schools:", error);
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
  listingData: Omit<Listing, 'id' | 'createdAt' | 'status' | 'updatedAt'>
): Promise<string | null> => {
  try {
    const docRef = await addDoc(collection(db, LISTINGS_COLLECTION), {
      ...listingData,
      status: 'available',
      createdAt: Date.now(),
      quantity: listingData.quantity ?? 1,
      completedCount: 0
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating listing:", error);
    return null;
  }
};

export const uploadListingImages = async (userId: string, files: File[]): Promise<string[]> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    console.error("Missing Cloudinary configuration. Please check your .env file.");
    throw new Error("Cloudinary configuration is missing");
  }

  try {
    const uploadPromises = files.map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      // Optional: Store inside a specific folder structure
      formData.append('folder', `passnow/listings/${userId}`);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Cloudinary error response:", errorData);
        throw new Error(errorData.error?.message || "Upload failed");
      }

      const data = await response.json();
      return data.secure_url as string;
    });
    
    return Promise.all(uploadPromises);
  } catch (error) {
    console.error("Error uploading images to Cloudinary:", error);
    throw new Error("Failed to upload images", { cause: error });
  }
};

export const updateListing = async (listingId: string, updates: Partial<Listing>): Promise<boolean> => {
  try {
    const listingRef = doc(db, LISTINGS_COLLECTION, listingId);
    const snap = await getDoc(listingRef);
    if (snap.exists() && snap.data().status === 'completed') {
      console.warn("Cannot update a completed listing.");
      return false;
    }
    await updateDoc(listingRef, updates);
    return true;
  } catch (error) {
    console.error("Error updating listing:", error);
    return false;
  }
};

export const deleteListing = async (listingId: string): Promise<boolean> => {
  try {
    const listingRef = doc(db, LISTINGS_COLLECTION, listingId);
    const snap = await getDoc(listingRef);
    if (!snap.exists()) return false;

    const listingData = snap.data() as Listing;
    if (listingData.status === 'completed') {
      console.warn("Cannot delete a completed listing.");
      return false;
    }

    const batch = writeBatch(db);
    
    // 1. Delete the listing itself
    batch.delete(listingRef);

    // 2. Find any pending transactions for this listing and update their status to 'cancelled'
    const q = query(collection(db, 'transactions'), where('listingId', '==', listingId), where('status', '==', 'pending'));
    const querySnapshot = await getDocs(q);
    
    const sysPromises: Promise<void>[] = [];
    
    querySnapshot.forEach((docSnap) => {
      batch.update(docSnap.ref, { status: 'cancelled' });
      const txData = docSnap.data();
      sysPromises.push(
        sendSystemMessage(listingId, txData.sellerId, txData.buyerId, 'The listing has been deleted by the seller. This transaction is canceled.')
      );
    });

    await batch.commit();
    await Promise.all(sysPromises);
    return true;
  } catch (error) {
    console.error("Error deleting listing:", error);
    return false;
  }
};

export const toggleListingReservedStatus = async (listingId: string, currentStatus: string): Promise<boolean> => {
  try {
    const listingRef = doc(db, LISTINGS_COLLECTION, listingId);
    const snap = await getDoc(listingRef);
    if (!snap.exists()) return false;

    if (snap.data().status === 'completed') {
      console.warn("Cannot change status of a completed listing.");
      return false;
    }

    const newStatus = currentStatus === 'reserved' ? 'available' : 'reserved';
    await updateDoc(listingRef, { status: newStatus });
    return true;
  } catch (error) {
    console.error("Error toggling reserved status:", error);
    return false;
  }
};
