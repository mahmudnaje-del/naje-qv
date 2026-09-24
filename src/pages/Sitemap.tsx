import React from 'react';
import { Map, Link as LinkIcon, ArrowLeft, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import LanguageSelector from '../components/LanguageSelector';

export default function Sitemap() {
  const { t, isRtl } = useI18n();
  const BackArrow = isRtl ? ArrowRight : ArrowLeft;

  const publicRoutes = [
    { path: '/auth', name: t('auth.tabLogin') },
    { path: '/Terms-of-Service', name: t('legal.termsTitle') },
    { path: '/Privacy-Policy', name: t('legal.privacyTitle') },
    { path: '/delete-account-request', name: t('auth.deleteAccountRequest') },
    { path: '/Sitemap', name: t('legal.sitemapTitle') },
  ];

  const productRoutes = [
    { path: '/', name: t('nav.home') },
    { path: '/projects', name: t('projects.pageTitle') },
    { path: '/settings', name: t('nav.settings') },
    { path: '/favorites', name: t('nav.favorites') },
    { path: '/store', name: t('nav.store') },
    { path: '/creative-studio', name: t('nav.creativeStudio') },
    { path: '/naje-agent-core', name: t('nav.najeAgent') },
    { path: '/naje-ad', name: t('nav.najeAd') },
    { path: '/naje-prompt', name: t('nav.najePrompt') },
    { path: '/naje-ident', name: t('najeIdent.title') },
    { path: '/naje-cv', name: t('nav.najeCv') },
  ];

  const renderGroup = (title: string, routes: { path: string; name: string }[]) => (
    <div className="mb-8 last:mb-0">
      <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3 tracking-wide">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {routes.map((route) => (
          <Link
            key={route.path}
            to={route.path}
            className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 hover:border-emerald-500/50 rounded-xl transition group"
          >
            <LinkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-emerald-500 transition shrink-0" />
            <span className="text-gray-900 dark:text-gray-300 font-medium group-hover:text-gray-900 dark:text-white transition">{route.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <div 
      className="flex-1 overflow-y-auto p-6 sm:p-12 max-w-4xl mx-auto w-full font-sans scrollbar-thin min-h-screen text-start"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="flex justify-end mb-4">
        <LanguageSelector />
      </div>

      <div className="bg-white dark:bg-[#0e1014] border border-gray-200 dark:border-gray-900 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center gap-4 mb-8 border-b border-gray-200 dark:border-gray-900 pb-6">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Map className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">{t('legal.sitemapTitle')}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">{t('tools.sitemap.subtitle')}</p>
          </div>
        </div>

        {renderGroup(t('tools.sitemap.publicPages'), publicRoutes)}
        {renderGroup(t('tools.sitemap.platform'), productRoutes)}

        <div className="mt-12 flex justify-center border-t border-gray-200 dark:border-gray-900 pt-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition shadow-md shadow-emerald-600/20"
          >
            <BackArrow className="w-4 h-4" />
            <span>{t('legal.backHome')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
