import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  memoryLocalCache,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

/** Disk cache so chats, messages, and the user profile reopen with no network. */
function openFirestore() {
  const databaseId = firebaseConfig.firestoreDatabaseId;
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
        cacheSizeBytes: 80 * 1024 * 1024,
      }),
    }, databaseId);
  } catch {
    try {
      return getFirestore(app, databaseId);
    } catch {
      return initializeFirestore(app, { localCache: memoryLocalCache() }, databaseId);
    }
  }
}

export const db = openFirestore();

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch {
    // Expected while offline. Persistent cache still serves previously read docs.
  }
}

if (typeof window !== 'undefined') {
  setTimeout(() => {
    testConnection().catch(() => null);
  }, 1200);
}
