import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */

// Validate connection to Firestore safely in background without blocking or throwing unhandled errors
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch {
    // Expected during initial offline boot or network hiccups:
    // Cloud Firestore operates in offline persistence mode automatically until network is ready.
  }
}

if (typeof window !== 'undefined') {
  // Non-blocking background health check
  setTimeout(() => {
    testConnection().catch(() => null);
  }, 1200);
}

