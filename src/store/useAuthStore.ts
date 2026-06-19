import { create } from 'zustand';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  school: string | null;
  district: string | null;
  photoURL?: string | null;
  isProfileComplete: boolean;
}

interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (isLoading: boolean) => void;
  initializeAuthListener: () => () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  
  initializeAuthListener: () => {
    set({ isLoading: true });
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch additional user profile data from Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            set({
              user: {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: userData.displayName || firebaseUser.displayName,
                school: userData.school || null,
                district: userData.district || null,
                isProfileComplete: !!(userData.school && userData.district),
              },
              isLoading: false,
            });
          } else {
            // Document doesn't exist yet (just registered)
            set({
              user: {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                school: null,
                district: null,
                isProfileComplete: false,
              },
              isLoading: false,
            });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          // Fallback to basic auth user info to avoid blocking login entirely on db permission errors
          set({
            user: {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              school: null,
              district: null,
              isProfileComplete: false,
            },
            isLoading: false,
          });
        }
      } else {
        set({ user: null, isLoading: false });
      }
    });

    return unsubscribe;
  },
}));
