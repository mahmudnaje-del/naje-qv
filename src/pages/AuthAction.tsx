import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  verifyPasswordResetCode, 
  confirmPasswordReset, 
  applyActionCode, 
  checkActionCode 
} from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { CheckCircle2, AlertCircle, KeyRound, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import NajeSpinner from '../components/NajeSpinner';
import { useI18n } from '../i18n';
import LanguageSelector from '../components/LanguageSelector';

export default function AuthAction() {
  const { t, isRtl } = useI18n();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // For password reset mode
  const [accountEmail, setAccountEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const ActionArrow = isRtl ? ArrowLeft : ArrowRight;

  // Mode-specific initialization
  useEffect(() => {
    if (!oobCode || !mode) {
      setError(isRtl ? 'رابط الإجراء غير صالح أو تنقصه بعض المعاملات.' : 'Action link is invalid or missing required parameters.');
      setLoading(false);
      return;
    }

    const initAction = async () => {
      try {
        setLoading(true);
        setError(null);

        if (mode === 'resetPassword') {
          // Verify code and extract user's email
          const email = await verifyPasswordResetCode(auth, oobCode);
          setAccountEmail(email);
          setLoading(false);
        } else if (mode === 'verifyEmail') {
          // Apply email verification
          await applyActionCode(auth, oobCode);
          if (auth.currentUser) {
            await auth.currentUser.reload().catch(() => {});
            try {
              const userRef = doc(db, 'users', auth.currentUser.uid);
              await updateDoc(userRef, { emailVerified: true });
            } catch (fsErr) {
              console.warn('Firestore emailVerified sync:', fsErr);
            }
          }
          setSuccessMessage(isRtl ? 'تم تفعيل بريدك الإلكتروني بنجاح! يمكنك الآن الاستمتاع بجميع ميزات استوديو ناجي.' : 'Your email has been verified successfully! You can now use all NAJE Studio features.');
          setLoading(false);
        } else if (mode === 'verifyAndChangeEmail') {
          // Apply email change verification
          await applyActionCode(auth, oobCode);
          if (auth.currentUser) {
            await auth.currentUser.reload().catch(() => {});
            try {
              const userRef = doc(db, 'users', auth.currentUser.uid);
              await updateDoc(userRef, { 
                email: auth.currentUser.email,
                emailVerified: true 
              });
            } catch (fsErr) {
              console.warn('Firestore email change sync:', fsErr);
            }
          }
          setSuccessMessage(isRtl ? 'تم تأكيد وتحديث عنوان بريدك الإلكتروني الجديد بنجاح!' : 'Your new email address has been verified and updated successfully!');
          setLoading(false);
        } else if (mode === 'recoverEmail') {
          // Undo email change
          const actionCodeInfo = await checkActionCode(auth, oobCode);
          const restoredEmail = actionCodeInfo.data.email;
          await applyActionCode(auth, oobCode);
          if (auth.currentUser) {
            await auth.currentUser.reload().catch(() => {});
            try {
              const userRef = doc(db, 'users', auth.currentUser.uid);
              await updateDoc(userRef, { email: restoredEmail || auth.currentUser.email });
            } catch (fsErr) {
              console.warn('Firestore email recovery sync:', fsErr);
            }
          }
          setSuccessMessage(isRtl ? 'تم التراجع عن تغيير بريدك الإلكتروني بنجاح. إذا لم تطلب هذا التغيير سابقاً، نوصي بتغيير كلمة المرور فوراً لحماية حسابك.' : 'Your email change was successfully reverted. If you did not request this, please change your password immediately.');
          setLoading(false);
        } else {
          setError(isRtl ? 'نوع الإجراء المطلوب غير مدعوم أو غير معروف.' : 'Unsupported action type.');
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Auth action error:', err);
        let msg = isRtl ? 'حدث خطأ أثناء معالجة الرابط.' : 'An error occurred while processing the link.';
        if (err.code === 'auth/expired-action-code') {
          msg = isRtl ? 'انتهت صلاحية هذا الرابط. يرجى طلب رابط جديد والمحاولة مجدداً.' : 'This link has expired. Please request a new one.';
        } else if (err.code === 'auth/invalid-action-code') {
          msg = isRtl ? 'هذا الرابط غير صالح أو تم استخدامه من قبل.' : 'This link is invalid or has already been used.';
        } else if (err.code === 'auth/user-disabled') {
          msg = isRtl ? 'هذا الحساب معطل حالياً من قبل الإدارة.' : 'This account has been disabled.';
        } else if (err.code === 'auth/user-not-found') {
          msg = t('auth.errUserNotFound');
        }
        setError(msg);
        setLoading(false);
      }
    };

    initAction();
  }, [mode, oobCode, isRtl, t]);

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode) return;

    if (!newPassword || newPassword.length < 6) {
      setError(t('auth.errWeakPassword'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('auth.errPasswordsDontMatch'));
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccessMessage(t('auth.resetSuccessDesc'));
    } catch (err: any) {
      console.error('Confirm password reset error:', err);
      let msg = isRtl ? 'تعذر تغيير كلمة المرور.' : 'Failed to update password.';
      if (err.code === 'auth/expired-action-code') {
        msg = isRtl ? 'انتهت صلاحية هذا الرابط. يرجى طلب رابط جديد لإعادة تعيين كلمة المرور.' : 'This reset link has expired.';
      } else if (err.code === 'auth/invalid-action-code') {
        msg = isRtl ? 'هذا الرابط غير صالح أو تم استخدامه مسبقاً.' : 'This reset link is invalid or already used.';
      } else if (err.code === 'auth/weak-password') {
        msg = t('auth.errWeakPassword');
      }
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0f1115] px-4 py-12 relative font-sans text-start" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="absolute top-4 end-4">
        <LanguageSelector />
      </div>

      <div className="w-full max-w-md bg-white dark:bg-gray-900/50 p-8 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xl">
        {/* Branding header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              Naje AI
            </h1>
          </Link>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 font-medium">
            {isRtl ? 'مركز تأكيد وأمان حسابك في استوديو ناجي' : 'Account security and verification center'}
          </p>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
            <NajeSpinner className="w-10 h-10" />
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {isRtl ? 'جاري التحقق من أمان وصلاحية الرابط...' : 'Verifying link security and validity...'}
            </p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="py-6 flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/20 shadow-inner">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {isRtl ? 'تعذر إكمال العملية' : 'Unable to complete action'}
              </h3>
              <p className="text-xs text-rose-600 dark:text-rose-400 leading-relaxed max-w-xs">{error}</p>
            </div>
            <div className="pt-4 w-full">
              <button
                onClick={() => navigate('/auth')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-md cursor-pointer"
              >
                <span>{t('auth.backToLogin')}</span>
                <ActionArrow className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Success state */}
        {!loading && !error && successMessage && (
          <div className="py-6 flex flex-col items-center text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 shadow-inner">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {isRtl ? 'تمت العملية بنجاح' : 'Operation completed successfully'}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed max-w-xs">{successMessage}</p>
            </div>
            <div className="pt-4 w-full">
              <button
                onClick={() => navigate(auth.currentUser ? '/' : '/auth')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-md cursor-pointer"
              >
                <span>{auth.currentUser ? (isRtl ? 'المتابعة إلى لوحة التحكم' : 'Continue to Dashboard') : t('auth.backToLogin')}</span>
                <ActionArrow className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Reset Password Form state */}
        {!loading && !error && !successMessage && mode === 'resetPassword' && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 p-3.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-900/50">
              <KeyRound className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
              <div className="text-start">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {isRtl ? 'إعادة تعيين كلمة المرور للحساب:' : 'Reset password for:'}
                </p>
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 truncate dir-ltr text-start">{accountEmail}</p>
              </div>
            </div>

            <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {t('auth.password')}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute end-3 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                  {isRtl ? 'يجب أن تتكون من 6 خانات على الأقل.' : 'Must be at least 6 characters.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  {t('auth.confirmPassword')}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute end-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-md mt-2 cursor-pointer"
              >
                {submitting ? <NajeSpinner className="w-4 h-4" /> : null}
                <span>{submitting ? t('common.saving') : (isRtl ? 'حفظ كلمة المرور الجديدة' : 'Save New Password')}</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Footer link back to main app */}
      <div className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
        <Link to="/auth" className="hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold transition">
          {t('auth.backToLogin')}
        </Link>
      </div>
    </div>
  );
}
