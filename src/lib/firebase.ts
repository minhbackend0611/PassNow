import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || `https://${import.meta.env.VITE_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const rtdb = getDatabase(app);

// Connect to emulators if flag is set
if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
  console.log('Connecting to Firebase Local Emulators...');
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectDatabaseEmulator(rtdb, '127.0.0.1', 9000);
}

export default app;
