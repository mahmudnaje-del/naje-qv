import React, { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import NajeSpinner from './NajeSpinner';
import { useAppStore } from '../store';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';

export default function TermsConsentModal() {
  const { user, setUser } = useAppStore();
  const [loading, setLoading] = useState(false);

  if (!user || user.hasAcceptedTerms) return null;

  const handleAccept = async () => {
    setLoading(true);
    try {
      if (user.uid) {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { hasAcceptedTerms: true }, { merge: true });
        try {
          localStorage.setItem('naje_terms_accepted_' + user.uid, 'true');
        } catch (_) {}
      }
      setUser({ ...user, hasAcceptedTerms: true });
    } catch (error) {
      console.error('Error accepting terms:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-50 dark:bg-[#0f1115]/90 backdrop-blur-md">
      <div className="naje-glass-card-lg p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 ring-4 ring-indigo-500/10">
          <ShieldCheck className="w-10 h-10" />
        </div>
        
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-3">مرحباً بك في استوديو ناجي</h2>
        <p className="text-gray-800 dark:text-gray-400 text-sm mb-6 leading-relaxed">
          للإستمرار واستخدام خدماتنا الذكية، يرجى الموافقة على سياسة الخصوصية وشروط الخدمة الخاصة بنا.
        </p>

        <div className="naje-glass-card p-4 w-full mb-8">
          <div className="flex flex-col gap-3 text-sm font-semibold">
            <Link to="/Terms-of-Service" target="_blank" className="text-black dark:text-white dark:hover:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition underline underline-offset-4 decoration-black/30 dark:decoration-white/30 hover:decoration-indigo-400">
              قراءة شروط الخدمة
            </Link>
            <Link to="/Privacy-Policy" target="_blank" className="text-black dark:text-white dark:hover:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 transition underline underline-offset-4 decoration-black/30 dark:decoration-white/30 hover:decoration-pink-400">
              قراءة سياسة الخصوصية
            </Link>
          </div>
        </div>

        <button 
          onClick={handleAccept}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2"
        >
          {loading ? <NajeSpinner className="w-5 h-5" /> : 'أوافق على الشروط والسياسات'}
        </button>
      </div>
    </div>
  );
}
