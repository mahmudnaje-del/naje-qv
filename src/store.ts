import { create } from 'zustand';
import { UserData } from './types';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { toast } from './toastStore';
import { registerForPushNotifications } from './lib/pushNotifications';
import {
  applyThemeToDocument,
  DEFAULT_THEME_ID,
  isThemeColorId,
  isThemeUnlocked,
  type ThemeColorId,
} from './lib/themes';
import {
  type SupportedLocale,
  applyLocaleToDocument,
  detectInitialLocale,
  SUPPORTED_LOCALES,
} from './i18n';

let userUnsubscribe: (() => void) | null = null;
const starterBalanceRequested = new Set<string>();
let requestStarterBalance = (_uid: string) => {};

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
  markThemeUnlocked: (id: ThemeColorId, newBalance?: number) => void;
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  newChatModalOpen: boolean;
  setNewChatModalOpen: (open: boolean) => void;
  themeMode: 'light' | 'dark';
  setThemeMode: (mode: 'light' | 'dark') => void;
  themeColor: ThemeColorId;
  setThemeColor: (color: ThemeColorId) => void;
  language: SupportedLocale;
  setLanguage: (lang: SupportedLocale) => void;
  maintenanceDismissed: boolean;
  setMaintenanceDismissed: (dismissed: boolean) => void;
}

let statusUnsubscribe: (() => void) | null = null;

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  loadingAuth: true,
  systemStatus: null,
  userGalleriesOpen: 'none',
  setUserGalleriesOpen: (userGalleriesOpen) => set({ userGalleriesOpen }),
  sidebarOpen: false,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setUser: (user) => set({ user }),
  updateBalance: (balance) => set((state) => ({ user: state.user ? { ...state.user, balance } : null })),
  markThemeUnlocked: (id, newBalance) => set((state) => {
    if (!state.user) return {};
    const prevA = Array.isArray(state.user.unlockedThemes) ? state.user.unlockedThemes : [];
    const prevB = Array.isArray(state.user.themeUnlocks) ? state.user.themeUnlocks : [];
    const unlockedThemes = prevA.includes(id) ? prevA : [...prevA, id];
    const themeUnlocks = prevB.includes(id) ? prevB : [...prevB, id];
    localStorage.setItem('naje_theme_color', id);
    applyThemeToDocument(id, state.themeMode);
    return {
      themeColor: id,
      user: {
        ...state.user,
        selectedThemeColor: id,
        unlockedThemes,
        themeUnlocks,
        balance: typeof newBalance === 'number' ? newBalance : state.user.balance,
      },
    };
  }),
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
    applyThemeToDocument(get().themeColor, themeMode);
    set({ themeMode });
  },
  themeColor: (typeof localStorage !== 'undefined' && isThemeColorId(localStorage.getItem('naje_theme_color')))
    ? (localStorage.getItem('naje_theme_color') as ThemeColorId)
    : DEFAULT_THEME_ID,
  setThemeColor: (themeColor) => {
    localStorage.setItem('naje_theme_color', themeColor);
    applyThemeToDocument(themeColor, get().themeMode);
    set({ themeColor });
  },
  language: (() => {
    const initial = detectInitialLocale();
    applyLocaleToDocument(initial);
    return initial;
  })(),
  setLanguage: (language: SupportedLocale) => {
    try {
      localStorage.setItem('naje_language', language);
    } catch {}
    applyLocaleToDocument(language);
    const currentUser = get().user;
    if (currentUser?.uid) {
      setDoc(doc(db, 'users', currentUser.uid), { preferredLanguage: language }, { merge: true }).catch(() => null);
    }
    set({ language });
  },
  maintenanceDismissed: false,
  setMaintenanceDismissed: (maintenanceDismissed) => set({ maintenanceDismissed }),
  initializeAuth: () => {
    // Safety timeout: Never leave user stuck on the full-screen loading spinner
    const authWait = typeof navigator !== 'undefined' && navigator.onLine === false ? 2000 : 6000;
    const authTimeout = setTimeout(() => {
      if (get().loadingAuth) {
        console.warn("[Auth] Auth resolution reached 15s timeout - releasing loading lock");
        const fbUser = auth.currentUser;
        if (fbUser) {
          set((state) => ({
            user: state.user || ({
              uid: fbUser.uid,
              email: fbUser.email || '',
              displayName: fbUser.displayName || 'User',
              balance: 0,
              isAdmin: false,
              emailVerified: Boolean(fbUser.emailVerified),
              hasAcceptedTerms: true,
              hasCompletedOnboarding: true,
            } as unknown as UserData),
            loadingAuth: false,
          }));
        } else {
          set({ loadingAuth: false });
        }
      }
    }, authWait);

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
          clearTimeout(authTimeout);
          if (snapshot.exists()) {
            const userData = snapshot.data();

            // If Firestore displayName is missing/empty but firebaseUser has a displayName, sync it
            if ((!userData.displayName || userData.displayName.trim() === '') && firebaseUser.displayName) {
              await setDoc(userRef, { displayName: firebaseUser.displayName }, { merge: true }).catch(() => null);
              userData.displayName = firebaseUser.displayName;
            }

            const lastProjectId = localStorage.getItem('naje_last_project_' + firebaseUser.uid);
            const incomingColor = isThemeColorId(userData.selectedThemeColor) ? userData.selectedThemeColor : get().themeColor;
            const resolvedColor = isThemeUnlocked(userData as any, incomingColor) ? incomingColor : DEFAULT_THEME_ID;
            if (resolvedColor !== get().themeColor) {
              localStorage.setItem('naje_theme_color', resolvedColor);
            }
            applyThemeToDocument(resolvedColor, get().themeMode);

            const localSaved = (typeof localStorage !== 'undefined' ? localStorage.getItem('naje_language') : null) as SupportedLocale | null;
            const savedLanguage = userData.preferredLanguage as SupportedLocale | undefined;
            if (localSaved && SUPPORTED_LOCALES.includes(localSaved)) {
              if (savedLanguage !== localSaved && firebaseUser?.uid) {
                setDoc(userRef, { preferredLanguage: localSaved }, { merge: true }).catch(() => null);
              }
              if (get().language !== localSaved) {
                get().setLanguage(localSaved);
              }
            } else if (savedLanguage && SUPPORTED_LOCALES.includes(savedLanguage) && savedLanguage !== get().language) {
              get().setLanguage(savedLanguage);
            } else if (!savedLanguage && get().language !== 'ar') {
              get().setLanguage('ar');
            }

            if (typeof userData.balance !== 'number') {
              requestStarterBalance(firebaseUser.uid);
            }

            set({ 
              user: { 
                ...userData, 
                uid: firebaseUser.uid,
                email: firebaseUser.email || userData.email,
                emailVerified: Boolean(firebaseUser.emailVerified || userData.emailVerified),
                hasAcceptedTerms: Boolean(userData.hasAcceptedTerms)
              } as unknown as UserData, 
              loadingAuth: false, 
              activeProjectId: lastProjectId,
              themeColor: resolvedColor,
            });

            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              registerForPushNotifications(firebaseUser.uid).catch(() => {});
            }
          } else {
            // Cached "missing" is not proof the user is new.
            if (snapshot.metadata.fromCache) {
              setTimeout(() => {
                if (get().loadingAuth) {
                  set({ loadingAuth: false });
                }
              }, 1200);
              return;
            }

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

            const fallbackName = firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : '');
            // NEVER write balance / isAdmin / hasRecharged from the client.
            const newUser: any = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: fallbackName,
              hasAcceptedTerms: false,
              hasCompletedOnboarding: false,
            };
            try {
              await setDoc(userRef, newUser, { merge: true });
              set({ user: { ...newUser, balance: 0 }, loadingAuth: false, activeProjectId: null });
              requestStarterBalance(firebaseUser.uid);
            } catch (e) {
              console.error('Failed to create user document:', e);
              set({ loadingAuth: false });
            }
          }
        }, (error) => {
          clearTimeout(authTimeout);
          console.error("Failed to load user profile via snapshot:", error);
          set({
            user: {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'User',
              balance: 0,
              isAdmin: false,
              emailVerified: Boolean(firebaseUser.emailVerified)
            },
            loadingAuth: false
          });
        });
      } else {
        clearTimeout(authTimeout);
        set({ user: null, loadingAuth: false });
      }
    });
  },
}));

requestStarterBalance = (uid: string) => {
  if (!uid || starterBalanceRequested.has(uid)) return;
  starterBalanceRequested.add(uid);
  const fb = auth.currentUser;
  if (!fb || fb.uid !== uid) return;
  fb.getIdToken()
    .then((token) => {
      if (!token) return;
      return fetch('/api/user/balance', { headers: { Authorization: `Bearer ${token}` } });
    })
    .then((res) => (res ? res.json() : null))
    .then((data) => {
      if (!data?.success || typeof data.balance !== 'number') return;
      const cur = useAppStore.getState().user;
      if (cur && cur.uid === uid) useAppStore.getState().updateBalance(data.balance);
    })
    .catch(() => {});
};
