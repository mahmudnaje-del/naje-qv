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

/** Disk cache so chats, messages, and the user profile reopen with no network.
 *  A full localStorage makes Firestore throw QuotaExceeded and crash the app,
 *  so fall back to a memory cache instead of dying on the splash. */
function storageCanWrite(): boolean {
  try {
    localStorage.setItem('__naje_probe__', '1');
    localStorage.removeItem('__naje_probe__');
    return true;
  } catch {
    return false;
  }
}

function freeStorageForFirestore(): boolean {
  if (typeof localStorage === 'undefined') return false;
  if (storageCanWrite()) return true;
  const keep = (key: string) =>
    key.startsWith('firebase:') ||
    key.startsWith('naje_theme') ||
    key.startsWith('naje_language') ||
    key.startsWith('naje_locale') ||
    key.startsWith('naje_onboarding') ||
    key.startsWith('naje_terms');
  const keys: { key: string; size: number }[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || keep(key)) continue;
    keys.push({ key, size: (localStorage.getItem(key) || '').length });
  }
  keys.sort((a, b) => b.size - a.size);
  for (const entry of keys) {
    try { localStorage.removeItem(entry.key); } catch { /* already gone */ }
    if (storageCanWrite()) return true;
  }
  return storageCanWrite();
}

function openFirestore() {
  const databaseId = firebaseConfig.firestoreDatabaseId;
  const memory = () => initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
    localCache: memoryLocalCache(),
  }, databaseId);
  if (!freeStorageForFirestore()) {
    try { return memory(); } catch { return getFirestore(app, databaseId); }
  }
  try {
    return initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
        cacheSizeBytes: 80 * 1024 * 1024,
      }),
    }, databaseId);
  } catch {
    try {
      return memory();
    } catch {
      return getFirestore(app, databaseId);
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
