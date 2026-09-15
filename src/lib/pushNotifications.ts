import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { app, db } from '../firebase';

export async function isPushNotificationSupported(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('Notification' in window)) {
    return false;
  }
  return await isSupported().catch(() => false);
}

export async function registerForPushNotifications(uid: string): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const supported = await isPushNotificationSupported();
    if (!supported) {
      return { success: false, error: 'إشعارات الجوال غير مدعومة في هذا المتصفح' };
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'تم رفض الإذن بإرسال الإشعارات' };
    }

    const swReg = await navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(async () => {
      return await navigator.serviceWorker.ready;
    });

    const messaging = getMessaging(app);

    const vapidKey = (import.meta as any).env?.VITE_FIREBASE_VAPID_KEY || undefined;
    const token = await getToken(messaging, {
      serviceWorkerRegistration: swReg,
      ...(vapidKey ? { vapidKey } : {})
    });

    if (token && uid) {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        fcmTokens: arrayUnion(token),
        pushNotificationsEnabled: true
      }).catch(async () => {});
      return { success: true, token };
    }

    return { success: false, error: 'تعذر الحصول على توكين الإشعارات' };
  } catch (err: any) {
    console.warn('[Push Notification Registration Error]', err);
    return { success: false, error: err?.message || 'فشل تسجيل إشعارات الجوال' };
  }
}

export async function disablePushNotifications(uid: string): Promise<boolean> {
  try {
    if (!uid) return false;
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      pushNotificationsEnabled: false
    }).catch(() => {});
    return true;
  } catch (err) {
    console.warn('[Push Notification Disable Error]', err);
    return false;
  }
}
