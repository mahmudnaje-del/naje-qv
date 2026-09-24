import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useI18n } from '../i18n';
import LanguageSelector from '../components/LanguageSelector';

export default function NotFound() {
  const { t, isRtl } = useI18n();

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-[#0f1115] font-sans relative"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="absolute top-6 end-6">
        <LanguageSelector variant="compact" />
      </div>

      <div className="bg-white dark:bg-[#0e1014] border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-2xl max-w-lg w-full text-center">
        <div className="w-16 h-16 mx-auto mb-6 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500">
          <Compass className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">
          {t('notFound.pageTitle')}
        </h1>
        <p className="text-gray-700 dark:text-gray-400 mb-8 leading-relaxed text-sm">
          {t('notFound.pageDesc')}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-md shadow-indigo-600/20"
          >
            {t('notFound.homeBtn')}
          </Link>
          <Link
            to="/Sitemap"
            className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 font-bold hover:border-indigo-500 transition"
          >
            {t('notFound.sitemapBtn')}
          </Link>
        </div>
      </div>
    </div>
  );
}
