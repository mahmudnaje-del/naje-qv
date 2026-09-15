import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';

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
      designObj = { url: URL.createObjectURL(designInput), type: 'blob' };
    } else if (typeof designInput === 'object' && designInput !== null) {
      designObj = { ...designInput };
    } else {
      designObj = { url: String(designInput) };
    }

    const docRef = await addDoc(collection(db, 'creatively_designs'), {
      ...designObj,
      ownerId: userId,
      userId: userId,
      createdAt: designObj.createdAt || new Date().toISOString()
    });

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

    const q = query(
      collection(db, 'creatively_designs'),
      where('ownerId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<CreativelyDesign, 'id'>)
    }));
  } catch (err) {
    console.warn('Failed to fetch designs from Firestore:', err);
    return [];
  }
}
