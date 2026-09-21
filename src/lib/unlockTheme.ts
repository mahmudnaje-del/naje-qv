import { auth, db } from '../firebase';
import { arrayUnion, doc, runTransaction } from 'firebase/firestore';
import {
  DEFAULT_THEME_ID,
  THEME_UNLOCK_COST,
  isThemeColorId,
  isThemeUnlocked,
  type ThemeColorId,
} from './themes';
import type { UserData } from '../types';

export type UnlockThemeResult = {
  themeId: ThemeColorId;
  newBalance: number;
  already: boolean;
  cost: number;
};

function assertThemeId(id: string): ThemeColorId {
  if (!isThemeColorId(id)) throw new Error('ثيم غير صالح');
  return id;
}

async function unlockViaApi(themeId: ThemeColorId, token: string): Promise<UnlockThemeResult | 'missing'> {
  const res = await fetch('/api/themes/unlock', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ themeId }),
  });
  const raw = await res.text();
  let data: any = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = {};
  }
  if (res.status === 404 || res.status === 405) return 'missing';
  if (!res.ok) {
    if (res.status === 401) throw new Error('انتهت الجلسة. أعد تسجيل الدخول.');
    throw new Error(data.error || `تعذر فتح الثيم (${res.status})`);
  }
  return {
    themeId,
    newBalance: typeof data.newBalance === 'number' ? data.newBalance : NaN,
    already: Boolean(data.already),
    cost: typeof data.cost === 'number' ? data.cost : 0,
  };
}

async function unlockViaFirestore(user: UserData, themeId: ThemeColorId): Promise<UnlockThemeResult> {
  const userRef = doc(db, 'users', user.uid);
  try {
    return await runTransaction(db, async (tx) => {
      const snap = await tx.get(userRef);
      if (!snap.exists()) throw new Error('تعذر قراءة الحساب');
      const d = snap.data() as any;
      const current = typeof d.balance === 'number' ? d.balance : Number(d.balance);
      if (!Number.isFinite(current)) throw new Error('تعذر قراءة الرصيد');
      const unlocked: string[] = Array.isArray(d.unlockedThemes) ? d.unlockedThemes : [];
      if (d.isAdmin === true || unlocked.includes(themeId) || themeId === DEFAULT_THEME_ID) {
        tx.update(userRef, { selectedThemeColor: themeId });
        return { themeId, newBalance: current, already: true, cost: 0 };
      }
      if (current < THEME_UNLOCK_COST) {
        throw new Error(`رصيد غير كافٍ. فتح الثيم يحتاج ${THEME_UNLOCK_COST} نقطة.`);
      }
      const next = parseFloat((current - THEME_UNLOCK_COST).toFixed(4));
      tx.update(userRef, {
        balance: next,
        isNegativeBalance: next < 0,
        unlockedThemes: arrayUnion(themeId),
        selectedThemeColor: themeId,
      });
      return { themeId, newBalance: next, already: false, cost: THEME_UNLOCK_COST };
    });
  } catch (err: any) {
    if (err?.message?.includes('رصيد') || err?.message?.includes('تعذر قراءة')) throw err;
    const code = String(err?.code || '');
    if (code.includes('permission-denied') || code.includes('PERMISSION_DENIED')) {
      throw new Error('تعذر حفظ الثيم. حدّث الصفحة وحاول مرة أخرى.');
    }
    throw new Error(err?.message || 'تعذر فتح الثيم');
  }
}

export async function unlockThemeForUser(user: UserData, themeIdRaw: string): Promise<UnlockThemeResult> {
  const themeId = assertThemeId(themeIdRaw);
  if (isThemeUnlocked(user, themeId) || themeId === DEFAULT_THEME_ID) {
    return { themeId, newBalance: Number(user.balance || 0), already: true, cost: 0 };
  }
  const token = await auth.currentUser?.getIdToken();
  if (token) {
    try {
      const viaApi = await unlockViaApi(themeId, token);
      if (viaApi !== 'missing') {
        return {
          ...viaApi,
          newBalance: Number.isFinite(viaApi.newBalance) ? viaApi.newBalance : Number(user.balance || 0) - (viaApi.already ? 0 : THEME_UNLOCK_COST),
        };
      }
    } catch (err: any) {
      if (err?.message?.includes('رصيد غير كاف') || err?.message?.includes('انتهت الجلسة') || err?.message?.includes('ثيم غير صالح')) {
        throw err;
      }
      // Fall through to Firestore if the running server is old.
    }
  }
  return unlockViaFirestore(user, themeId);
}
