import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import { updateDoc } from 'firebase/firestore';
import { app } from '../firebase';

import { auth } from '../firebase';

export async function uploadBase64ToStorage(path: string, base64Data: string, mediaType: string): Promise<string> {
  const prefix = mediaType === 'video' ? 'data:video/mp4;base64,' : mediaType === 'voice' ? 'data:audio/wav;base64,' : 'data:image/png;base64,';
  const fallbackDataUri = base64Data.startsWith('data:') ? base64Data : `${prefix}${base64Data}`;

  // 1. Primary: Server-side upload via Admin SDK (bypasses client Storage Security Rules)
  try {
    const user = auth.currentUser;
    let headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (user) {
      const token = await user.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch('/api/upload-media', {
      method: 'POST',
      headers,
      body: JSON.stringify({ path, base64Data, mediaType }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json && json.url) {
        return json.url;
      }
    }
  } catch {
    // Fall back to client storage
  }

  // 2. Secondary: Client-side Firebase Storage
  try {
    const storage = getStorage(app);
    const storageRef = ref(storage, path);
    const cleanBase64 = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    const contentType = mediaType === 'video' ? 'video/mp4' : mediaType === 'voice' ? 'audio/wav' : 'image/png';
    await uploadString(storageRef, cleanBase64, 'base64', { contentType });
    return await getDownloadURL(storageRef);
  } catch (e) {
    console.warn('Cloud storage client upload warning, using local data URI fallback:', e);
    return fallbackDataUri;
  }
}

export async function uploadWithRetry(path: string, base64Data: string, mediaType: string, mRef: any, attempts = 2): Promise<string | null> {
  for (let i = 0; i < attempts; i++) {
    try {
      const storedUrl = await uploadBase64ToStorage(path, base64Data, mediaType);
      if (storedUrl && (storedUrl.startsWith('http://') || storedUrl.startsWith('https://')) && storedUrl.length < 500000) {
        if (mRef) {
          await updateDoc(mRef, { mediaUrl: storedUrl });
        }
        return storedUrl;
      }
    } catch (e) {
      if (i === attempts - 1) {
        console.error("Cloud upload failed after retries:", e);
      } else {
        await new Promise(r => setTimeout(r, 1500));
      }
    }
  }
  return null;
}

