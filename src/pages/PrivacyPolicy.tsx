import React from 'react';
import { Lock, ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import LanguageSelector from '../components/LanguageSelector';

export default function PrivacyPolicy() {
  const { t, isRtl } = useI18n();
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;

  return (
    <div 
      className="flex-1 overflow-y-auto p-6 sm:p-12 max-w-4xl mx-auto w-full font-sans scrollbar-thin text-start"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="flex justify-end mb-4">
        <LanguageSelector />
      </div>

      <div className="bg-white dark:bg-[#0e1014] border border-gray-200 dark:border-gray-900 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center gap-4 mb-8 border-b border-gray-200 dark:border-gray-900 pb-6">
          <div className="w-16 h-16 bg-pink-500/10 rounded-2xl flex items-center justify-center text-pink-600 dark:text-pink-400 shrink-0">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">{t('legal.privacyTitle')}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">{t('legal.lastUpdated')}: 2026-07-15</p>
          </div>
        </div>

        <div className="space-y-8 text-gray-900 dark:text-gray-300 leading-relaxed text-sm md:text-base">
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('tools.legal.privacy.s1Title')}</h2>
            <p>{t('tools.legal.privacy.s1Body')}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('tools.legal.privacy.s2Title')}</h2>
            <p>{t('tools.legal.privacy.s2Body')}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('tools.legal.privacy.s3Title')}</h2>
            <p>{t('tools.legal.privacy.s3Body')}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('tools.legal.privacy.s4Title')}</h2>
            <p>{t('tools.legal.privacy.s4Body')}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('tools.legal.privacy.s5Title')}</h2>
            <p className="mb-3">{t('tools.legal.privacy.s5Body')}</p>
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-red-600 dark:text-red-400">{t('tools.legal.privacy.deleteBoxTitle')}</h3>
                <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">{t('tools.legal.privacy.deleteBoxDesc')}</p>
              </div>
              <Link 
                to="/delete-account-request"
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition flex-shrink-0"
              >
                {t('tools.legal.privacy.deleteBtn')}
              </Link>
            </div>
          </section>

          <section className="p-5 bg-pink-500/5 dark:bg-pink-500/10 border border-pink-500/20 rounded-2xl">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 text-pink-600 dark:text-pink-400">{t('tools.legal.privacy.s6Title')}</h2>
            <p className="mb-3">{t('tools.legal.privacy.s6Intro')}</p>
            <ol className="list-decimal list-inside space-y-1 text-sm md:text-base ms-2 mb-3">
              <li>{t('tools.legal.privacy.s6i1')}</li>
              <li>{t('tools.legal.privacy.s6i2')}</li>
              <li>{t('tools.legal.privacy.s6i3')}</li>
              <li>{t('tools.legal.privacy.s6i4')}</li>
            </ol>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 border-t border-pink-500/20 pt-3 mt-2">{t('tools.legal.privacy.s6Foot')}</p>
          </section>
        </div>
        
        <div className="mt-12 flex justify-center">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl transition shadow-md shadow-pink-600/20"
          >
            <BackArrow className="w-4 h-4" />
            <span>{t('legal.backHome')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
