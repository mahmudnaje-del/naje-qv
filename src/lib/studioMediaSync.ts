import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase.ts';

export interface RecordMediaParams {
  type: 'image' | 'video' | 'audio';
  mediaUrl: string;
  prompt?: string;
  title?: string;
  studio?: string;
  chatId?: string;
  aspectRatio?: string;
  metadata?: Record<string, any>;
}

/**
 * Uploads a base64 string or blob to the server if needed, returning a permanent URL
 */
export async function ensurePermanentMediaUrl(
  rawUrlOrBase64: string,
  mediaType: 'image' | 'video' | 'audio',
  hintPath?: string
): Promise<string> {
  if (!rawUrlOrBase64) return '';

  // Already a permanent server or cloud URL
  if (
    rawUrlOrBase64.startsWith('http://') ||
    rawUrlOrBase64.startsWith('https://') ||
    rawUrlOrBase64.startsWith('/api/')
  ) {
    return rawUrlOrBase64;
  }

  // If it's a huge base64 or data URI, upload to server cache
  if (rawUrlOrBase64.startsWith('data:') || rawUrlOrBase64.length > 50000) {
    try {
      const user = auth.currentUser;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (user) {
        const token = await user.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
      }
      const ext = mediaType === 'video' ? 'mp4' : mediaType === 'audio' ? 'wav' : 'png';
      const cleanPath = hintPath || `generated_media/${user?.uid || 'anon'}/media_${Date.now()}.${ext}`;
      
      const res = await fetch('/api/upload-media', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          path: cleanPath,
          base64Data: rawUrlOrBase64,
          mediaType
        })
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.url) {
          return json.url;
        }
      }
    } catch (err) {
      console.warn('[StudioMediaSync] Server upload notice:', err);
    }
  }

  return rawUrlOrBase64;
}

/**
 * Centrally records any user-generated media across all studios into Firestore generated_media collection.
 * Guarantees cross-device visibility in user galleries (معرض الصور & معرض الفيديو).
 */
export async function recordGeneratedMedia(params: RecordMediaParams): Promise<string | null> {
  try {
    const user = auth.currentUser;
    const uid = user?.uid;
    if (!uid) return null;

    const permanentUrl = await ensurePermanentMediaUrl(params.mediaUrl, params.type);
    if (!permanentUrl) return null;

    const mediaDoc = {
      ownerId: uid,
      userId: uid,
      type: params.type,
      mediaType: params.type,
      mediaUrl: permanentUrl,
      prompt: params.prompt || params.title || '',
      title: params.title || '',
      studio: params.studio || 'general',
      chatId: params.chatId || null,
      aspectRatio: params.aspectRatio || null,
      createdAt: Date.now(),
      ...(params.metadata || {})
    };

    const docRef = await addDoc(collection(db, 'generated_media'), mediaDoc);

    // If it's an image or design, also record into creatively_designs for backward compatibility
    if (params.type === 'image' && (params.studio === 'creativelyAI' || params.studio === 'chat_designer' || params.studio === 'creative_pro')) {
      addDoc(collection(db, 'creatively_designs'), {
        ownerId: uid,
        userId: uid,
        url: permanentUrl,
        type: 'image',
        prompt: params.prompt || '',
        createdAt: new Date().toISOString()
      }).catch(e => console.warn('[StudioMediaSync] creatively_designs sync notice:', e));
    }

    return docRef.id;
  } catch (err) {
    console.error('[StudioMediaSync] Failed to record generated media:', err);
    return null;
  }
}
