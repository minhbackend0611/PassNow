import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { User } from '../types';

const USERS_COLLECTION = 'users';

export const getUserById = async (uid: string): Promise<User | null> => {
  try {
    const docRef = doc(db, USERS_COLLECTION, uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { uid: docSnap.id, ...docSnap.data() } as User;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};
