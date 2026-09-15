import { useEffect, useRef } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAppStore } from '../store';
import { toast } from '../toastStore';

export default function RealtimeNotificationListener() {
  const { user } = useAppStore();
  const isInitialMount = useRef(true);
  const knownNotifIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Prompt for notification permission on first load if default
    if ('Notification' in window && Notification.permission === 'default') {
      const askPermission = async () => {
        try {
          await Notification.requestPermission();
        } catch (e) {
          // ignore permission request refusal
        }
      };
      // Delay prompt slightly so it doesn't interrupt initial page load
      const timer = setTimeout(askPermission, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    isInitialMount.current = true;
    knownNotifIds.current.clear();

    const q = query(
      collection(db, 'notifications'),
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(15)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (isInitialMount.current) {
          // On first snapshot load, remember existing IDs so we don't trigger push alerts for old notifications
          snapshot.docs.forEach((docSnap) => {
            knownNotifIds.current.add(docSnap.id);
          });
          isInitialMount.current = false;
          return;
        }

        // Process changes
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const id = change.doc.id;
            const data = change.doc.data();

            if (!knownNotifIds.current.has(id)) {
              knownNotifIds.current.add(id);

              const title = data.title || 'إشعار جديد من ناجي الذكي';
              const message = data.message || '';

              // 1. Trigger Compact Toast Notification in app
              toast.info(`${title}: ${message.length > 60 ? message.substring(0, 60) + '...' : message}`);

              // 2. Trigger Device Haptic Vibration (on supported mobile devices)
              if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                try {
                  navigator.vibrate([150, 80, 150]);
                } catch (e) {
                  // ignore
                }
              }

              // 3. Trigger Real Mobile / Desktop Browser Native Notification Tray Push
              if ('Notification' in window && Notification.permission === 'granted') {
                try {
                  const options: NotificationOptions & { renotify?: boolean } = {
                    body: message,
                    icon: '/logo-192.png',
                    badge: '/favicon.svg',
                    tag: id,
                    renotify: true,
                    data: { url: window.location.origin },
                  };

                  // If service worker is active, use service worker showNotification for mobile background tray reliability
                  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.ready.then((reg) => {
                      reg.showNotification(title, options);
                    }).catch(() => {
                      new Notification(title, options);
                    });
                  } else {
                    new Notification(title, options);
                  }
                } catch (err) {
                  console.error('Failed to trigger native notification:', err);
                }
              }
            }
          }
        });
      },
      (error) => {
        console.error('Realtime notification subscription error:', error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return null;
}
