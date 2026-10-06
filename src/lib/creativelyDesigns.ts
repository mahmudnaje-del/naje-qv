import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase.ts';
import { ensurePermanentMediaUrl } from './studioMediaSync.ts';

export interface CreativelyDesign {
  id?: string;
  url: string;
  type?: string;
  prompt?: string;
  aspectRatio?: string;
  ownerId?: string;
  userId?: string;
  createdAt?: string;
}

export async function saveDesign(designInput: any): Promise<string | null> {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return null;

    let designObj: any = {};
    if (typeof designInput === 'string') {
      designObj = { url: designInput, type: 'image' };
    } else if (designInput instanceof Blob) {
      // Convert blob to base64 or upload to server so it's accessible across all devices
      const reader = new FileReader();
      const b64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(designInput);
      const b64 = await b64Promise;
      const isVid = designInput.type.includes('video') || designInput.type.includes('mp4');
      const permanentUrl = await ensurePermanentMediaUrl(b64, isVid ? 'video' : 'image');
      designObj = { url: permanentUrl, type: isVid ? 'video' : 'image' };
    } else if (typeof designInput === 'object' && designInput !== null) {
      designObj = { ...designInput };
    } else {
      designObj = { url: String(designInput) };
    }

    if (designObj.url && (designObj.url.startsWith('data:') || designObj.url.length > 50000)) {
      const isVid = designObj.type === 'video' || designObj.type === 'video_ad';
      designObj.url = await ensurePermanentMediaUrl(designObj.url, isVid ? 'video' : 'image');
    }

    const docRef = await addDoc(collection(db, 'creatively_designs'), {
      ...designObj,
      ownerId: userId,
      userId: userId,
      createdAt: designObj.createdAt || new Date().toISOString()
    });

    // Also sync to generated_media collection so it immediately appears in the user's Gallery (معرض الصور & معرض الفيديو)
    if (designObj.url && (designObj.url.startsWith('http') || designObj.url.startsWith('/api/') || designObj.url.startsWith('data:'))) {
      const isVideo = designObj.type === 'video' || designObj.type === 'video_ad' || designObj.type === 'blob';
      addDoc(collection(db, 'generated_media'), {
        ownerId: userId,
        userId: userId,
        type: isVideo ? 'video' : 'image',
        mediaType: isVideo ? 'video' : 'image',
        mediaUrl: designObj.url,
        prompt: designObj.prompt || designObj.conceptTitle || '',
        studio: 'creativelyAI',
        createdAt: Date.now()
      }).catch(e => console.warn('Failed to add design to generated_media:', e));
    }

    return docRef.id || null;
  } catch (err) {
    console.warn('Failed to save design to Firestore creatively_designs:', err);
    return null;
  }
}

export async function getAllDesigns(): Promise<CreativelyDesign[]> {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) return [];

    let snap;
    try {
      const q = query(
        collection(db, 'creatively_designs'),
        where('ownerId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      snap = await getDocs(q);
    } catch (orderErr) {
      console.warn('getAllDesigns ordered query notice, using unindexed fallback:', orderErr);
      const fallbackQ = query(
        collection(db, 'creatively_designs'),
        where('ownerId', '==', userId)
      );
      snap = await getDocs(fallbackQ);
    }

    const items = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<CreativelyDesign, 'id'>)
    }));
    items.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    return items;
  } catch (err) {
    console.warn('Failed to fetch designs from Firestore:', err);
    return [];
  }
}
