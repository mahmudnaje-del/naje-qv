import React, { useState } from 'react';
import { Check, Lock, Moon, Sun, Palette, Coins } from 'lucide-react';
import { useAppStore } from '../store';
import { useI18n } from '../i18n';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { toast } from '../toastStore';
import NajeSpinner from './NajeSpinner';
import {
  THEMES,
  THEME_UNLOCK_COST,
  isThemeUnlocked,
  type ThemeColorId,
  type ThemeDef,
} from '../lib/themes';
import { unlockThemeForUser } from '../lib/unlockTheme';

function ThemePie({
  primary,
  secondary,
  canvas,
  size = 52,
}: {
  primary: string;
  secondary: string;
  canvas: string;
  size?: number;
}) {
  return (
    <span
      className="inline-block rounded-full shadow-[inset_0_0_0_1.5px_rgba(0,0,0,0.12)]"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(from 210deg, ${primary} 0 120deg, ${secondary} 120deg 240deg, ${canvas} 240deg 360deg)`,
      }}
      aria-hidden
    />
  );
}

export default function ThemeStudio() {
  const { user, themeMode, setThemeMode, themeColor, setThemeColor, markThemeUnlocked } = useAppStore();
  const { t, isRtl } = useI18n();
  const [pendingId, setPendingId] = useState<ThemeColorId | null>(null);
  const [busy, setBusy] = useState(false);

  const persistSelection = async (id: ThemeColorId) => {
    if (!user?.uid) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { selectedThemeColor: id });
    } catch {
      /* preference only */
    }
  };

  const selectTheme = async (id: ThemeColorId) => {
    setThemeColor(id);
    await persistSelection(id);
  };

  const handlePick = async (theme: ThemeDef) => {
    if (busy) return;
    if (isThemeUnlocked(user, theme.id)) {
      await selectTheme(theme.id);
      return;
    }
    setPendingId(theme.id);
  };

  const confirmUnlock = async () => {
    if (!pendingId || busy) return;
    const theme = THEMES.find((t) => t.id === pendingId);
    if (!theme) return;
    const balance = Number(user?.balance || 0);
    if (!user?.isAdmin && balance < THEME_UNLOCK_COST) {
      toast.error(t('themeStudio.deductNotice', { cost: THEME_UNLOCK_COST }));
      setPendingId(null);
      return;
    }
    const previousColor = themeColor;
    setThemeColor(pendingId);
    setPendingId(null);
    setBusy(true);
    try {
      if (!user?.uid) throw new Error(t('auth.signInPrompt'));
      const result = await unlockThemeForUser(user, pendingId);
      markThemeUnlocked(pendingId, result.newBalance);
      await persistSelection(pendingId);
      toast.success(t('themeStudio.unlockThemeTitle', { theme: pendingTheme ? themeLabel(pendingTheme.id, pendingTheme.nameAr, pendingTheme.nameEn) : '' }));
    } catch (err: any) {
      setThemeColor(previousColor);
      toast.error(err?.message || t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  const themeLabel = (id: string, fallbackAr: string, fallbackEn: string) => {
    const key = `shared.theme.${id}`;
    const value = t(key);
    if (value !== key) return value;
    return isRtl ? fallbackAr : fallbackEn;
  };

  const pendingTheme = THEMES.find((theme) => theme.id === pendingId);

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="text-start">
      <p className="text-xs text-gray-800 dark:text-gray-400 mb-2">{t('themeStudio.appearance')}</p>
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => setThemeMode('dark')}
          className={`flex items-center justify-center gap-2 flex-1 py-2 rounded-lg text-xs font-bold transition border ${
            themeMode === 'dark'
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
              : 'bg-gray-50 dark:bg-gray-900 border-gray-500 dark:border-gray-800 text-gray-800 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer'
          }`}
        >
          <Moon className="w-4 h-4" />
          <span>{t('themeStudio.dark')}</span>
        </button>
        <button
          type="button"
          onClick={() => setThemeMode('light')}
          className={`flex items-center justify-center gap-2 flex-1 py-2 rounded-lg text-xs font-bold transition border ${
            themeMode === 'light'
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
              : 'bg-gray-50 dark:bg-gray-900 border-gray-500 dark:border-gray-800 text-gray-800 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white cursor-pointer'
          }`}
        >
          <Sun className="w-4 h-4" />
          <span>{t('themeStudio.light')}</span>
        </button>
      </div>

      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-xs text-gray-800 dark:text-gray-400 flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5" />
          <span>{t('themeStudio.colorThemes')}</span>
        </p>
        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-2 py-0.5">
          {t('themeStudio.unlockNote', { cost: THEME_UNLOCK_COST })}
        </span>
      </div>
      <p className="text-[10px] text-gray-600 dark:text-gray-500 mb-3 leading-relaxed">
        {t('themeStudio.themeDescription')}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {THEMES.map((theme) => {
          const unlocked = isThemeUnlocked(user, theme.id);
          const selected = themeColor === theme.id;
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => handlePick(theme)}
              className={`relative rounded-2xl border p-2.5 text-start transition cursor-pointer ${
                selected
                  ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_0_1px_rgba(99,102,241,0.35)]'
                  : 'border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-950/50 hover:border-indigo-400/50'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 mb-2">
                <ThemePie primary={theme.primary} secondary={theme.secondary} canvas="#ffffff" size={36} />
                <ThemePie primary={theme.primary} secondary={theme.secondary} canvas="#111111" size={36} />
              </div>
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-extrabold text-gray-900 dark:text-white">{themeLabel(theme.id, theme.nameAr, theme.nameEn)}</span>
                {selected ? (
                  <Check className="w-3.5 h-3.5 text-indigo-500" />
                ) : unlocked ? null : (
                  <Lock className="w-3 h-3 text-gray-400" />
                )}
              </div>
              <div className="mt-0.5 text-[9px] font-bold text-gray-500 dark:text-gray-400">
                {theme.free ? t('themeStudio.free') : unlocked ? t('themeStudio.unlocked') : `${THEME_UNLOCK_COST} ${t('common.points')}`}
              </div>
            </button>
          );
        })}
      </div>

      {pendingTheme && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !busy && setPendingId(null)}
            aria-label={t('common.close')}
          />
          <div 
            className="relative w-full max-w-sm rounded-2xl border border-purple-200 dark:border-gray-800 bg-white dark:bg-[#12141a] p-5 shadow-2xl text-start"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center gap-3 mb-3">
              <ThemePie primary={pendingTheme.primary} secondary={pendingTheme.secondary} canvas="#111" size={44} />
              <div>
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
                  {t('themeStudio.unlockThemeTitle', { theme: themeLabel(pendingTheme.id, pendingTheme.nameAr, pendingTheme.nameEn) })}
                </h3>
                <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">
                  {t('themeStudio.unlockThemeDesc')}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              {t('themeStudio.deductNotice', { cost: THEME_UNLOCK_COST })}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setPendingId(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-300 cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={confirmUnlock}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/25"
              >
                {busy ? <NajeSpinner className="w-4 h-4" /> : <Coins className="w-3.5 h-3.5" />}
                <span>{t('themeStudio.unlockBtn', { cost: THEME_UNLOCK_COST })}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
