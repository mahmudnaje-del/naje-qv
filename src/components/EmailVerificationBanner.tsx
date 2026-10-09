import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { safeSendEmailVerification } from '../lib/authActionSettings';
import { Mail, AlertCircle, CheckCircle2, X } from 'lucide-react';
import NajeSpinner from './NajeSpinner';
import { useI18n } from '../i18n';

const COOLDOWN_KEY = 'naje_email_verify_cooldown_until';

export default function EmailVerificationBanner() {
  const { t, isRtl } = useI18n();
  const [user, setUser] = useState(auth.currentUser);
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(() => {
    try {
      const until = Number(localStorage.getItem(COOLDOWN_KEY) || 0);
      const diff = Math.ceil((until - Date.now()) / 1000);
      return diff > 0 ? diff : 0;
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(c => {
        if (c <= 1) {
          localStorage.removeItem(COOLDOWN_KEY);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const setTimedCooldown = (seconds: number) => {
    setCooldown(seconds);
    try {
      localStorage.setItem(COOLDOWN_KEY, String(Date.now() + seconds * 1000));
    } catch {
      // ignore
    }
  };

  // Check if banner should be displayed
  if (!user || user.emailVerified || dismissed) {
    return null;
  }

  // Only show for password-provider accounts (Google accounts are automatically verified)
  const isPasswordUser = Boolean(user.providerData?.some(p => p.providerId === 'password'));
  if (!isPasswordUser) {
    return null;
  }

  const handleResend = async () => {
    if (!auth.currentUser || cooldown > 0 || sending) return;

    try {
      setSending(true);
      setError(null);
      await safeSendEmailVerification(auth.currentUser);
      setSentSuccess(true);
      setTimedCooldown(60);
    } catch (err: any) {
      console.error('Email verification resend error:', err);
      if (err.code === 'auth/too-many-requests') {
        setError(t('surface.email.tooMany'));
        setTimedCooldown(60);
      } else if (err.code === 'auth/user-not-found') {
        setError(t('auth.errUserNotFound'));
        setTimedCooldown(15);
      } else {
        setError(err.message || t('surface.email.sendFail'));
        setTimedCooldown(30);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div 
      className="bg-amber-500/10 dark:bg-amber-500/15 border-b border-amber-500/25 px-4 py-2.5 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3 relative z-30 transition-all font-sans text-start" 
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 text-amber-600 dark:text-amber-400">
          <Mail className="w-3.5 h-3.5" />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 truncate">
          <span className="font-bold">{t('surface.email.verify')}</span>
          <span className="text-amber-800 dark:text-amber-300 truncate font-mono text-[11px] dir-ltr text-start">
            {user.email}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {sentSuccess ? (
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t('surface.email.sent')}</span>
          </span>
        ) : error ? (
          <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium max-w-[220px] truncate" title={error}>
            {error}
          </span>
        ) : null}

        <button
          onClick={handleResend}
          disabled={sending || cooldown > 0}
          className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold px-3 py-1 rounded-lg text-[11px] transition shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          {sending ? <NajeSpinner className="w-3 h-3" /> : null}
          <span>
            {sending 
              ? t('surface.email.sending')
              : (cooldown > 0 ? t('surface.email.wait', { n: cooldown }) : t('surface.email.resend'))}
          </span>
        </button>

        <button
          onClick={() => setDismissed(true)}
          className="text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 p-1 rounded-lg transition cursor-pointer"
          title={t('common.close')}
          aria-label={t('common.close')}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
