import { useState, useEffect, useRef } from 'react';
import { Bell, ShieldAlert, Sparkles, AlertCircle, CheckCircle, Flame, Gift } from 'lucide-react';
import { useAppStore } from '../store';
import { collection, query, where, orderBy, limit, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { registerForPushNotifications } from '../lib/pushNotifications';
import { cn } from '../lib/utils';
import { toast } from '../toastStore';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'system' | 'billing' | 'feature' | 'alert';
  read: boolean;
}

export default function NotificationDropdown() {
  const { user } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [permState, setPermState] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'default';
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync notification permission state when dropdown opens
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermState(Notification.permission);
    }
  }, [isOpen]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Subscribe to real-time notifications from Firestore
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbNotifications: NotificationItem[] = snapshot.docs.map((d) => {
        const data = d.data();
        let formattedTime = 'مؤخراً';
        if (data.createdAt) {
          const diffMs = Date.now() - data.createdAt;
          const diffMins = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMins / 60);
          const diffDays = Math.floor(diffHours / 24);
          if (diffMins < 1) formattedTime = 'الآن';
          else if (diffMins < 60) formattedTime = `منذ ${diffMins} دقيقة`;
          else if (diffHours < 24) formattedTime = `منذ ${diffHours} ساعة`;
          else formattedTime = `منذ ${diffDays} يوم`;
        }
        return {
          id: d.id,
          title: data.title || 'تنبيه جديد',
          message: data.message || '',
          time: formattedTime,
          type: data.type || 'system',
          read: data.read || false,
        };
      });

      // Combine with local base notifications for onboarding
      const welcomeNotification: NotificationItem = {
        id: 'welcome',
        title: 'أهلاً بك في استوديو ناجي الذكي!',
        message: 'تم تفعيل حسابك بنجاح مع 5 نقاط ترحيبية مجانية لتجربة التوليد.',
        time: 'منذ التسجيل',
        type: 'feature',
        read: localStorage.getItem(`naje_read_welcome_${user.uid}`) === 'true',
      };

      const securityNotification: NotificationItem = {
        id: 'security',
        title: 'تأمين حماية توازن العمليات',
        message: 'تم تفعيل بروتوكول منع الازدواج المالي للحسابات والخصم الآمن.',
        time: 'نشط الآن',
        type: 'system',
        read: localStorage.getItem(`naje_read_security_${user.uid}`) === 'true',
      };

      let finalNotifications = [...dbNotifications];
      if (!finalNotifications.some(n => n.id === 'welcome')) {
        finalNotifications.push(welcomeNotification);
      }
      if (!finalNotifications.some(n => n.id === 'security')) {
        finalNotifications.push(securityNotification);
      }

      setNotifications(finalNotifications);
    }, (error) => {
      console.error("Failed to fetch notifications:", error);
      // Fallback
      const baseNotifications: NotificationItem[] = [
        {
          id: 'welcome',
          title: 'أهلاً بك في استوديو ناجي الذكي!',
          message: 'تم تفعيل حسابك بنجاح مع 5 نقاط ترحيبية مجانية لتجربة التوليد.',
          time: 'منذ التسجيل',
          type: 'feature',
          read: localStorage.getItem(`naje_read_welcome_${user.uid}`) === 'true',
        },
        {
          id: 'security',
          title: 'تأمين حماية توازن العمليات',
          message: 'تم تفعيل بروتوكول منع الازدواج المالي للحسابات والخصم الآمن.',
          time: 'نشط الآن',
          type: 'system',
          read: localStorage.getItem(`naje_read_security_${user.uid}`) === 'true',
        }
      ];
      setNotifications(baseNotifications);
    });

    return () => unsubscribe();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    if (!user) return;
    
    localStorage.setItem(`naje_read_welcome_${user.uid}`, 'true');
    localStorage.setItem(`naje_read_security_${user.uid}`, 'true');

    try {
      const unreadDbNotifications = notifications.filter(n => !n.read && n.id !== 'welcome' && n.id !== 'security');
      if (unreadDbNotifications.length > 0) {
        const batch = writeBatch(db);
        unreadDbNotifications.forEach(n => {
          const ref = doc(db, 'notifications', n.id);
          batch.update(ref, { read: true });
        });
        await batch.commit();
      }
    } catch (e) {
      console.error("Failed to mark notifications read in Firestore:", e);
    }

    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleToggleRead = async (id: string) => {
    if (!user) return;
    if (id === 'welcome' || id === 'security') {
      localStorage.setItem(`naje_read_${id}_${user.uid}`, 'true');
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      return;
    }

    try {
      const ref = doc(db, 'notifications', id);
      await updateDoc(ref, { read: true });
    } catch (e) {
      console.error("Failed to update notification read status:", e);
    }

    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <div className="relative text-right" ref={dropdownRef}>
      {/* Bell Icon Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl transition hover:bg-white dark:hover:bg-gray-800 cursor-pointer text-gray-800 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
        title="التنبيهات"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-600 text-[9px] font-extrabold text-white rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div className="fixed inset-x-4 top-16 sm:absolute sm:inset-x-auto sm:left-0 sm:top-auto sm:mt-2 w-auto sm:w-96 naje-notifications-panel shadow-2xl z-50 overflow-hidden flex flex-col max-h-[480px]">
          {/* Header */}
          <div className="p-4 border-b bg-transparent flex items-center justify-between">
            <button
              onClick={handleMarkAllRead}
              className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold hover:underline cursor-pointer"
            >
              قراءة الكل
            </button>
            <h5 className="text-xs font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
              <span>التنبيهات والعمليات</span>
              <Bell className="w-3.5 h-3.5 text-indigo-500" />
            </h5>
          </div>

          {permState !== 'granted' && (
            <div className="bg-indigo-600/10 border-b border-indigo-500/20 px-4 py-2.5 flex items-center justify-between text-[11px]">
              <span className="text-gray-700 dark:text-gray-300 font-medium">تفعيل التنبيهات الفورية</span>
              <button
                type="button"
                onClick={async () => {
                  if (typeof window === 'undefined' || !('Notification' in window)) {
                    toast.error('بيئة العرض الحالية أو المتصفح لا تدعم التنبيهات الفورية.');
                    return;
                  }
                  try {
                    const res = await Notification.requestPermission();
                    setPermState(res);
                    if (res === 'granted') {
                      toast.success('تم تفعيل التنبيهات الفورية بنجاح!');
                      if (auth.currentUser) {
                        registerForPushNotifications(auth.currentUser.uid).catch(() => {});
                      }
                      try {
                        new Notification('استوديو ناجي الذكي Naje AI', {
                          body: 'أهلاً بك! تم تفعيل الإشعارات الفورية بنجاح على هذا المتصفح.',
                          icon: '/favicon.ico',
                        });
                      } catch (err) {
                        console.log('Test notification error:', err);
                      }
                    } else if (res === 'denied') {
                      toast.error('التنبيهات محظورة من المتصفح! يمكنك تفعيلها من إعدادات الموقع بجانب شريط العنوان.');
                    } else {
                      toast.info('لم يتم تأكيد إذن التنبيهات.');
                    }
                  } catch (e) {
                    console.error('Notification permission failed:', e);
                    toast.error('تعذّر طلب إذن التنبيهات الفورية (قد تكون الإشعارات محظورة في الإطار الحالي).');
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1 rounded-lg transition active:scale-95 cursor-pointer shadow-sm"
              >
                تفعيل
              </button>
            </div>
          )}

          {permState === 'granted' && (
            <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2 flex items-center justify-between text-[11px]">
              <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>التنبيهات الفورية مفعلة</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                    try {
                      new Notification('استوديو ناجي الذكي Naje AI', {
                        body: 'إشعار تجريبي اختباري من استوديو ناجي!',
                        icon: '/favicon.ico',
                      });
                      toast.success('تم إرسال إشعار تجريبي لنظام التشغيل');
                    } catch (e) {
                      toast.error('تعذّر إرسال الإشعار الفوري المباشر.');
                    }
                  } else {
                    toast.error('الرجاء تفعيل إذن الإشعارات أولاً.');
                  }
                }}
                className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>تجربة إشعار</span>
              </button>
            </div>
          )}

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-xs">لا توجد تنبيهات حالياً.</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleToggleRead(n.id)}
                  className={cn(
                    "p-4 transition cursor-pointer flex gap-3 text-right items-start",
                    n.read ? "bg-transparent opacity-75" : "bg-indigo-500/5 dark:bg-indigo-500/5"
                  )}
                >
                  {/* Icon indicator */}
                  <div className="mt-1 flex-shrink-0">
                    {n.type === 'system' ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : n.type === 'alert' ? (
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                    ) : n.type === 'billing' ? (
                      <Gift className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] text-gray-800 dark:text-gray-500 font-medium">{n.time}</span>
                      <span className={cn(
                        "text-xs font-bold truncate",
                        n.read ? "text-gray-800 dark:text-gray-300" : "text-gray-900 dark:text-white"
                      )}>
                        {n.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-800 dark:text-gray-400 leading-relaxed break-words">
                      {n.message}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {!n.read && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0 mt-2" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
