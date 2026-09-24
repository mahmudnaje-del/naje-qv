import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import NajeSpinner from './NajeSpinner';
import { useAppStore } from '../store';
import { useI18n } from '../i18n';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';

export default function TermsConsentModal() {
  const { user, setUser } = useAppStore();
  const { t, isRtl } = useI18n();
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
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-50 dark:bg-[#0f1115]/90 backdrop-blur-md"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="naje-glass-card-lg p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center">
        <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 ring-4 ring-indigo-500/10">
          <ShieldCheck className="w-10 h-10" />
        </div>
        
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-3">
          {t('termsModal.title')}
        </h2>
        <p className="text-gray-800 dark:text-gray-400 text-sm mb-6 leading-relaxed">
          {t('termsModal.desc')}
        </p>

        <div className="naje-glass-card p-4 w-full mb-8">
          <div className="flex flex-col gap-3 text-sm font-semibold">
            <Link to="/Terms-of-Service" target="_blank" className="text-black dark:text-white dark:hover:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition underline underline-offset-4 decoration-black/30 dark:decoration-white/30 hover:decoration-indigo-400">
              {t('termsModal.readTerms')}
            </Link>
            <Link to="/Privacy-Policy" target="_blank" className="text-black dark:text-white dark:hover:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 transition underline underline-offset-4 decoration-black/30 dark:decoration-white/30 hover:decoration-pink-400">
              {t('termsModal.readPrivacy')}
            </Link>
            <Link to="/delete-account-request" target="_blank" className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition underline underline-offset-4 decoration-red-500/30 hover:decoration-red-400 text-xs">
              {t('termsModal.requestDeleteAccount')}
            </Link>
          </div>
        </div>

        <button 
          onClick={handleAccept}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/25"
        >
          {loading ? <NajeSpinner className="w-5 h-5" /> : t('termsModal.acceptBtn')}
        </button>
      </div>
    </div>
  );
}
