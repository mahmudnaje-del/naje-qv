import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup, 
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, increment } from 'firebase/firestore';
import { safeSendPasswordResetEmail, safeSendEmailVerification } from '../lib/authActionSettings';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);
  const [resetCooldown, setResetCooldown] = useState(0);

  useEffect(() => {
    if (resetCooldown <= 0) return;
    const timer = setInterval(() => {
      setResetCooldown(prev => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resetCooldown]);

  const handleError = (err: any) => {
    let msg = err.message;
    if (err.code === 'auth/email-already-in-use') {
      msg = 'البريد الإلكتروني مستخدم بالفعل. الرجاء تسجيل الدخول أو استخدام بريد آخر.';
    } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      msg = 'بيانات الدخول غير صحيحة.';
    } else if (err.code === 'auth/weak-password') {
      msg = 'كلمة المرور ضعيفة جداً.';
    } else if (err.code === 'auth/network-request-failed') {
      msg = 'فشل الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت، أو جرب فتح التطبيق في نافذة جديدة (قد تمنع المتصفحات تسجيل الدخول داخل الإطارات المضمنة).';
    } else if (err.code === 'auth/popup-closed-by-user') {
      msg = 'تم إغلاق نافذة تسجيل الدخول قبل اكتمال العملية.';
    }
    setError(msg);
  };

  const checkUserRegistrationLimit = async (): Promise<string | null> => {
    try {
      const statusSnap = await getDoc(doc(db, 'config', 'system_status'));
      if (statusSnap.exists()) {
        const sysData = statusSnap.data();
        const rawLimit = String(sysData.maxUsersLimit ?? '').trim();
        const currentCount = Number(sysData.registeredUsersCount || 0);

        if (rawLimit === '00') {
          return sysData.maxUsersMessage || 'عذراً، التسجيل مغلق حالياً ومتاح فقط للمستخدمين المسجلين سابقاً.';
        }

        const maxLimit = Number(rawLimit) || 0;
        if (maxLimit > 0 && currentCount >= maxLimit) {
          return sysData.maxUsersMessage || 'نعتذر، وصل التطبيق إلى الحد الأقصى المسموح به لعدد المستخدمين حالياً. يرجى التواصل مع الإدارة.';
        }
      }
    } catch (e) {
      console.error('Failed checking user limit:', e);
    }
    return null;
  };

  const handleForgotPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email.trim()) {
      setError('يرجى إدخال بريدك الإلكتروني أولاً.');
      return;
    }
    if (resetCooldown > 0) return;

    setIsLoading(true);
    setError('');
    try {
      await safeSendPasswordResetEmail(auth, email.trim().toLowerCase());
      setForgotPasswordSent(true);
    } catch (err: any) {
      console.error('Password reset request error:', err);
      if (err.code === 'auth/invalid-email') {
        setError('صيغة البريد الإلكتروني غير صحيحة.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('تم إرسال عدة طلبات مؤخراً. يرجى الانتظار قليلاً قبل المحاولة مجدداً.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('فشل الاتصال بالإنترنت. يرجى التحقق من اتصالك والمحاولة مجدداً.');
      } else if (err.code === 'auth/user-not-found') {
        // Safe UX to prevent account enumeration while informing the user
        setForgotPasswordSent(true);
      } else {
        setError(err.message || 'تعذر إرسال رابط إعادة التعيين حالياً.');
      }
    } finally {
      setIsLoading(false);
      setResetCooldown(30);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      // Check if user doc exists in Firestore (returning vs new user)
      const userRef = doc(db, 'users', result.user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const limitError = await checkUserRegistrationLimit();
        if (limitError) {
          await auth.signOut();
          setError(limitError);
          setIsLoading(false);
          return;
        }
      }
    } catch (err: any) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    let targetEmail = email.trim().toLowerCase();
    let targetPassword = password;

    // Handle special Google Play Console reviewer credentials
    if (targetEmail === 'google-play-console' && targetPassword === 'google-play-console') {
      targetEmail = 'google-play-console@qelvaai.com';
    }

    try {
      if (isLogin) {
        try {
          await signInWithEmailAndPassword(auth, targetEmail, targetPassword);
        } catch (err: any) {
          if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
            // Check limit before auto creating
            const limitError = await checkUserRegistrationLimit();
            if (limitError) {
              setError(limitError);
              setIsLoading(false);
              return;
            }
            // If the account does not exist in Firebase Auth yet, try creating it automatically
            try {
              const userCred = await createUserWithEmailAndPassword(auth, targetEmail, targetPassword);
              await updateProfile(userCred.user, { displayName: targetEmail.split('@')[0] });
            } catch (createErr: any) {
              // If creation also fails (e.g. wrong password for existing user with invalid-credential), throw original error
              throw err;
            }
          } else {
            throw err;
          }
        }
      } else {
        // Checking registration limit before creating account
        const limitError = await checkUserRegistrationLimit();
        if (limitError) {
          setError(limitError);
          setIsLoading(false);
          return;
        }

        const userCred = await createUserWithEmailAndPassword(auth, targetEmail, targetPassword);
        const chosenName = name.trim() || targetEmail.split('@')[0];
        await updateProfile(userCred.user, { displayName: chosenName });
        const userRef = doc(db, 'users', userCred.user.uid);
        await setDoc(userRef, {
          uid: userCred.user.uid,
          email: targetEmail,
          displayName: chosenName,
          balance: 5,
          isAdmin: false,
          canAddAdmins: false,
          hasAcceptedTerms: true,
          hasCompletedOnboarding: true,
          emailVerified: false,
        }, { merge: true });

        // Send email verification link
        try {
          await safeSendEmailVerification(userCred.user);
        } catch (verErr) {
          console.warn('Initial email verification send error:', verErr);
        }

        // Increment registeredUsersCount in system_status
        await setDoc(doc(db, 'config', 'system_status'), {
          registeredUsersCount: increment(1)
        }, { merge: true }).catch(() => null);
      }
    } catch (err: any) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0f1115] px-4 py-12 relative font-sans" dir="rtl">
      <div className="w-full max-w-md bg-white dark:bg-gray-900/50 p-8 rounded-2xl border border-gray-600 dark:border-gray-800">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Naje AI</h1>
          <p className="text-gray-800 dark:text-gray-400 mt-2">الجيل القادم من أدوات الذكاء الاصطناعي</p>
        </div>
        
        {showForgotPassword ? (
          /* Forgot Password View */
          <div className="space-y-4">
            <div className="text-right">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">إعادة تعيين كلمة المرور</h2>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                أدخل عنوان بريدك الإلكتروني المسجل لنرسل لك رابطاً لإعادة تعيين كلمة المرور بأمان.
              </p>
            </div>

            {forgotPasswordSent && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs leading-relaxed">
                إذا كان هذا البريد مسجلاً لدينا، ستصلك رسالة لإعادة تعيين كلمة المرور. يرجى تفقد صندوق الوارد ومجلد البريد غير الهام (Spam).
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 dark:text-gray-400 mb-1">البريد الإلكتروني</label>
                <input 
                  type="email" 
                  required 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-600 dark:border-gray-800 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm" 
                />
              </div>

              {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}

              <button 
                type="submit" 
                disabled={isLoading || resetCooldown > 0} 
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2 rounded-lg transition flex items-center justify-center gap-2 text-sm shadow-md"
              >
                {isLoading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : null}
                {isLoading 
                  ? 'جاري الإرسال...' 
                  : (resetCooldown > 0 ? `إعادة الإرسال بعد (${resetCooldown}) ثانية` : 'إرسال رابط إعادة التعيين')}
              </button>
            </form>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setError('');
                }}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold transition"
              >
                ← العودة إلى تسجيل الدخول
              </button>
            </div>
          </div>
        ) : (
          /* Normal Login / Register Form */
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-800 dark:text-gray-400 mb-1">الاسم الكامل</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-600 dark:border-gray-800 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-800 dark:text-gray-400 mb-1">البريد الإلكتروني</label>
                <input type="text" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-600 dark:border-gray-800 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 dark:text-gray-400 mb-1">كلمة المرور</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-600 dark:border-gray-800 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition" />
              </div>

              {isLogin && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setShowForgotPassword(true);
                      setForgotPasswordSent(false);
                    }}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium transition cursor-pointer"
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>
              )}
              
              {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
              
              <button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white font-medium py-2 rounded-lg transition flex items-center justify-center gap-2">
                {isLoading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : null}
                {isLoading ? 'جاري المعالجة...' : (isLogin ? 'تسجيل الدخول' : 'إنشاء حساب')}
              </button>
            </form>

            <div className="mt-6 flex items-center gap-4">
              <div className="h-px bg-gray-100 dark:bg-gray-800 flex-1"></div>
              <span className="text-sm text-gray-800 dark:text-gray-400 ">أو</span>
              <div className="h-px bg-gray-100 dark:bg-gray-800 flex-1"></div>
            </div>

            <button onClick={handleGoogleSignIn} type="button" className="mt-6 w-full bg-white hover:bg-gray-100 text-black font-medium py-2 rounded-lg transition flex items-center justify-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                <path fill="none" d="M1 1h22v22H1z" />
              </svg>
              الدخول باستخدام Google
            </button>
            
            <div className="mt-6 text-center">
              <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="text-gray-800 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm transition">
                {isLogin ? 'ما عندك حساب؟ سجل الآن' : 'عندك حساب؟ سجل دخول'}
              </button>
              
              <p className="text-xs text-gray-800 dark:text-gray-400 mt-4">
                ملاحظة: إذا واجهت مشكلة في تسجيل الدخول بواسطة Google، يرجى فتح التطبيق في علامة تبويب جديدة.
              </p>
            </div>
          </>
        )}
      </div>

      <div className="mt-8 text-center text-sm text-gray-800 dark:text-gray-400">
        الشركة الأم:{' '}
        <a 
          href="https://qelvaai.com" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 underline font-semibold transition"
        >
          Qelva Ai
        </a>
      </div>

      {/* Publicly visible links required for compliance and discovery */}
      <div className="mt-4 text-center text-xs text-gray-800 dark:text-gray-500 flex justify-center gap-4 flex-wrap" style={{ direction: 'rtl' }}>
        <Link to="/Terms-of-Service" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">شروط الخدمة</Link>
        <span>•</span>
        <Link to="/Privacy-Policy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">سياسة الخصوصية</Link>
        <span>•</span>
        <Link to="/delete-account-request" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-semibold">طلب حذف الحساب</Link>
      </div>
    </div>
  );
}

