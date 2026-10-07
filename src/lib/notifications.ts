import { addDoc, collection } from 'firebase/firestore';
import { db, auth } from '../firebase';

export interface AppNotificationPayload {
  title: string;
  message: string;
  type?: 'feature' | 'system' | 'billing' | 'alert';
  studio?: 'naje_ad' | 'chat' | 'creatively' | 'naje_cv' | 'naje_ident' | 'naje_motion' | 'system';
  url?: string;
  metadata?: Record<string, any>;
  ownerId?: string;
  userId?: string;
}

/**
 * Pushes a real-time notification to the Firestore 'notifications' collection.
 * This integrates directly with RealtimeNotificationListener & NotificationDropdown
 * to trigger native browser/device push notifications, haptic feedback, and toast alerts.
 */
export async function pushAppNotification(payload: AppNotificationPayload): Promise<string | null> {
  const uid = payload.ownerId || payload.userId || auth.currentUser?.uid;
  if (!uid) return null;

  try {
    const docRef = await addDoc(collection(db, 'notifications'), {
      ownerId: uid,
      userId: uid,
      title: payload.title,
      message: payload.message,
      type: payload.type || 'feature',
      studio: payload.studio || 'system',
      url: payload.url || '',
      read: false,
      createdAt: Date.now(),
      metadata: payload.metadata || {},
    });
    return docRef.id;
  } catch (err) {
    console.warn('[pushAppNotification error]', err);
    return null;
  }
}
