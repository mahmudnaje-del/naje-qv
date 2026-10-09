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

/** A full localStorage makes Firestore throw QuotaExceeded and then crash
 *  the whole app with internal assertion b815. One spare byte is not enough:
 *  the client-state write is larger, so require real room and never let a
 *  Firestore storage write take the UI down. */
function hardenLocalStorage() {
  if (typeof window === 'undefined' || typeof Storage === 'undefined') return;
  const proto = Storage.prototype as Storage & { __najeHardened?: boolean };
  if (proto.__najeHardened) return;
  const raw = proto.setItem;
  proto.setItem = function (this: Storage, key: string, value: string) {
    try {
      raw.call(this, key, value);
    } catch (err) {
      const name = (err as { name?: string })?.name || '';
      if (name !== 'QuotaExceededError' && name !== 'NS_ERROR_DOM_QUOTA_REACHED') throw err;
      const keep = (k: string) =>
        k.startsWith('firebase:') ||
        k.startsWith('naje_theme') ||
        k.startsWith('naje_language') ||
        k.startsWith('naje_locale') ||
        k.startsWith('naje_onboarding') ||
        k.startsWith('naje_terms');
      const keys: string[] = [];
      for (let i = 0; i < this.length; i++) {
        const k = this.key(i);
        if (k && !keep(k)) keys.push(k);
      }
      keys.sort((a, b) => (this.getItem(b)?.length || 0) - (this.getItem(a)?.length || 0));
      for (const k of keys) {
        try { this.removeItem(k); } catch { /* already gone */ }
        try {
          raw.call(this, key, value);
          return;
        } catch { /* keep freeing */ }
      }
      if (String(key).includes('firestore')) return;
      throw err;
    }
  };
  proto.__najeHardened = true;
}

function storageHasRoom(): boolean {
  try {
    localStorage.setItem('__naje_probe__', 'x'.repeat(8192));
    localStorage.removeItem('__naje_probe__');
    return true;
  } catch {
    return false;
  }
}

function openFirestore() {
  const databaseId = firebaseConfig.firestoreDatabaseId;
  const memory = () => initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
    localCache: memoryLocalCache(),
  }, databaseId);
  hardenLocalStorage();
  if (!storageHasRoom()) {
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
    try { return memory(); } catch { return getFirestore(app, databaseId); }
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
