import { create } from 'zustand';
import { UserData } from './types';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { toast } from './toastStore';
import { registerForPushNotifications } from './lib/pushNotifications';

let userUnsubscribe: (() => void) | null = null;

export interface SystemStatusData {
  isMaintenance: boolean;
  title?: string;
  intro?: string;
  explanation?: string;
  solutions?: string[];
  updatedAt?: number;
  updatedBy?: string;
}

interface AppState {
  user: UserData | null;
  loadingAuth: boolean;
  systemStatus: SystemStatusData | null;
  userGalleriesOpen: 'none' | 'images' | 'videos';
  setUserGalleriesOpen: (type: 'none' | 'images' | 'videos') => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  setUser: (user: UserData | null) => void;
  initializeAuth: () => void;
  updateBalance: (newBalance: number) => void;
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  newChatModalOpen: boolean;
  setNewChatModalOpen: (open: boolean) => void;
  themeMode: 'light' | 'dark';
  setThemeMode: (mode: 'light' | 'dark') => void;
  maintenanceDismissed: boolean;
  setMaintenanceDismissed: (dismissed: boolean) => void;
}

let statusUnsubscribe: (() => void) | null = null;

export const useAppStore = create<AppState>((set) => ({
  user: null,
  loadingAuth: true,
  systemStatus: null,
  userGalleriesOpen: 'none',
  setUserGalleriesOpen: (userGalleriesOpen) => set({ userGalleriesOpen }),
  sidebarOpen: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setUser: (user) => set({ user }),
  updateBalance: (balance) => set((state) => ({ user: state.user ? { ...state.user, balance } : null })),
  activeProjectId: null,
  setActiveProjectId: (activeProjectId) => set((state) => {
    if (state.user && activeProjectId) {
      localStorage.setItem('naje_last_project_' + state.user.uid, activeProjectId);
    }
    return { activeProjectId };
  }),
  newChatModalOpen: false,
  setNewChatModalOpen: (newChatModalOpen) => set({ newChatModalOpen }),
  themeMode: (typeof localStorage !== 'undefined' 
    ? (localStorage.getItem('naje_theme') || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')) as 'light'|'dark' 
    : 'dark'),
  setThemeMode: (themeMode) => {
    localStorage.setItem('naje_theme', themeMode);
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ themeMode });
  },
  maintenanceDismissed: false,
  setMaintenanceDismissed: (maintenanceDismissed) => set({ maintenanceDismissed }),
  initializeAuth: () => {
    // Listen to system_status doc for emergency maintenance mode
    if (!statusUnsubscribe) {
      statusUnsubscribe = onSnapshot(doc(db, 'config', 'system_status'), (docSnap) => {
        if (docSnap.exists()) {
          set({ systemStatus: docSnap.data() as SystemStatusData });
        } else {
          set({ systemStatus: null });
        }
      }, (err) => console.error("Failed to load system_status:", err));
    }

    onAuthStateChanged(auth, (firebaseUser) => {
      // Wipe cached media when the signed-in user changes, so cached blobs never cross accounts.
      try {
        const prevUid = (window as any).__najeUid || null;
        const nextUid = firebaseUser ? firebaseUser.uid : null;
        if (prevUid && prevUid !== nextUid) {
          indexedDB.deleteDatabase('NajeAI_Docs');
          indexedDB.deleteDatabase('naje-docs');
        }
        (window as any).__najeUid = nextUid;
      } catch {}

      if (userUnsubscribe) {
        userUnsubscribe();
        userUnsubscribe = null;
      }

      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);

        userUnsubscribe = onSnapshot(userRef, async (snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.data();

            // If Firestore displayName is missing/empty but firebaseUser has a displayName, sync it
            if ((!userData.displayName || userData.displayName.trim() === '') && firebaseUser.displayName) {
              await setDoc(userRef, { displayName: firebaseUser.displayName }, { merge: true }).catch(() => null);
              userData.displayName = firebaseUser.displayName;
            }

            const lastProjectId = localStorage.getItem('naje_last_project_' + firebaseUser.uid);

            set({ 
              user: { 
                ...userData, 
                uid: firebaseUser.uid,
                email: firebaseUser.email || userData.email,
                emailVerified: Boolean(firebaseUser.emailVerified || userData.emailVerified),
                hasAcceptedTerms: Boolean(userData.hasAcceptedTerms)
              } as unknown as UserData, 
              loadingAuth: false, 
              activeProjectId: lastProjectId 
            });

            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              registerForPushNotifications(firebaseUser.uid).catch(() => {});
            }
          } else {
            // Check system capacity limit before creating new user doc
            try {
              const statusSnap = await getDoc(doc(db, 'config', 'system_status')).catch(() => null);
              if (statusSnap && statusSnap.exists()) {
                const sysData = statusSnap.data();
                const rawLimit = String(sysData.maxUsersLimit ?? '').trim();
                const currentCount = Number(sysData.registeredUsersCount || 0);

                let isBlocked = false;
                let errorMsg = sysData.maxUsersMessage;

                if (rawLimit === '00') {
                  isBlocked = true;
                  if (!errorMsg) {
                    errorMsg = 'عذراً، التسجيل مغلق حالياً ومتاح فقط للمستخدمين المسجلين سابقاً.';
                  }
                } else {
                  const numLimit = Number(rawLimit) || 0;
                  if (numLimit > 0 && currentCount >= numLimit) {
                    isBlocked = true;
                    if (!errorMsg) {
                      errorMsg = 'عذراً، وصلنا للحد الأقصى من المستخدمين المسجّلين حالياً. حاول لاحقاً أو تواصل معنا.';
                    }
                  }
                }

                if (isBlocked) {
                  toast.error(errorMsg);
                  await auth.signOut();
                  set({ user: null, loadingAuth: false });
                  return;
                }
              }
            } catch (limitErr) {
              console.error('Error checking user limit:', limitErr);
            }

            // Values here MUST match the firestore.rules constraints exactly,
            // otherwise creation is rejected.
            const fallbackName = firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : '');
            const newUser: any = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: fallbackName,
              balance: 5,
              isAdmin: false,
              canAddAdmins: false,
              hasAcceptedTerms: false,
              hasCompletedOnboarding: false,
            };
            try {
              await setDoc(userRef, newUser);
              set({ user: newUser, loadingAuth: false, activeProjectId: null });
            } catch (e) {
              console.error('Failed to create user document:', e);
              set({ loadingAuth: false });
            }
          }
        }, (error) => {
          console.error("Failed to load user profile via snapshot:", error);
          // Fallback if offline or failed
          set({ 
            user: {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'User',
              balance: firebaseUser.email === 'google-play-console@qelvaai.com' ? 15 : 0,
              isAdmin: false,
              emailVerified: Boolean(firebaseUser.emailVerified)
            }, 
            loadingAuth: false 
          });
        });
      } else {
        set({ user: null, loadingAuth: false });
      }
    });
  },
}));
