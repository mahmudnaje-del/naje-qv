import React from 'react';
import { Shield, ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import LanguageSelector from '../components/LanguageSelector';

export default function TermsOfService() {
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
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">{t('legal.termsTitle')}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">{t('legal.lastUpdated')}: 2026-07-15</p>
          </div>
        </div>

        <div className="space-y-8 text-gray-900 dark:text-gray-300 leading-relaxed text-sm md:text-base">
          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('tools.legal.terms.s1Title')}</h2>
            <p>{t('tools.legal.terms.s1Body')}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('tools.legal.terms.s2Title')}</h2>
            <p>{t('tools.legal.terms.s2Body')}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('tools.legal.terms.s3Title')}</h2>
            <p>{t('tools.legal.terms.s3Body')}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('tools.legal.terms.s4Title')}</h2>
            <p>{t('tools.legal.terms.s4Body')}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('tools.legal.terms.s5Title')}</h2>
            <p>{t('tools.legal.terms.s5Body')}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('tools.legal.terms.s6Title')}</h2>
            <p>{t('tools.legal.terms.s6Body')}</p>
          </section>
        </div>
        
        <div className="mt-12 flex justify-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow-md shadow-indigo-600/20"
          >
            <BackArrow className="w-4 h-4" />
            <span>{t('legal.backHome')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
