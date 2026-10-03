import React, { useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store';
import { useI18n, applyLocaleToDocument } from './i18n';
import { applyThemeToDocument } from './lib/themes';
import { lazyWithRetry } from './lib/lazyRetry';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Projects from './pages/Projects';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Favorites from './pages/Favorites';
import ToastContainer from './components/ToastContainer';
import OnboardingWizard from './components/OnboardingWizard';
import TermsConsentModal from './components/TermsConsentModal';
import ErrorBoundary from './components/ErrorBoundary';
import AppErrorBoundary from './components/AppErrorBoundary';
import NajeThinking from './components/NajeThinking';
import RealtimeNotificationListener from './components/RealtimeNotificationListener';
import SmartDownloadGatewayModal from './components/SmartDownloadGatewayModal';
import OfflineBanner from './components/OfflineBanner';
import InstallAppButton from './components/InstallAppButton';
import { scheduleOfflineWarm } from './lib/offline';

const Admin = lazyWithRetry(() => import('./pages/Admin'));
const TermsOfService = lazyWithRetry(() => import('./pages/TermsOfService'));
const PrivacyPolicy = lazyWithRetry(() => import('./pages/PrivacyPolicy'));
const Sitemap = lazyWithRetry(() => import('./pages/Sitemap'));
const DeleteAccountRequest = lazyWithRetry(() => import('./pages/DeleteAccountRequest'));
const CreativelyAI = lazyWithRetry(() => import('./pages/CreativelyAI'));
const NajeAgent = lazyWithRetry(() => import('./pages/NajeAgent'));
const NajeAd = lazyWithRetry(() => import('./pages/NajeAd'));
const NajeDeveloper = lazyWithRetry(() => import('./pages/NajeDeveloper'));
const NajeSource = lazyWithRetry(() => import('./pages/NajeSource'));
const NajePrompt = lazyWithRetry(() => import('./pages/NajePrompt'));
const NajeIdent = lazyWithRetry(() => import('./pages/NajeIdent'));
const NajeCv = lazyWithRetry(() => import('./pages/NajeCv'));
const Store = lazyWithRetry(() => import('./pages/Store'));
const AuthAction = lazyWithRetry(() => import('./pages/AuthAction'));
const NotFound = lazyWithRetry(() => import('./pages/NotFound'));

export default function App() {
  const { initializeAuth, loadingAuth, user, themeMode, themeColor, language } = useAppStore();
  const { t, isRtl, locale } = useI18n();

  useEffect(() => {
    applyThemeToDocument(themeColor, themeMode);
  }, [themeMode, themeColor]);

  useEffect(() => {
    applyLocaleToDocument(language || locale || 'ar');
  }, [language, locale]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!user) return;
    scheduleOfflineWarm();
  }, [user]);

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-naje-canvas" dir={isRtl ? 'rtl' : 'ltr'}>
        <NajeThinking size={64} />
      </div>
    );
  }

  return (
    <AppErrorBoundary>
      <ErrorBoundary>
        <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-naje-canvas"><NajeThinking size={48} /></div>}>
          <Routes>
            <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />
            <Route path="/auth/action" element={<AuthAction />} />
            <Route path="/Terms-of-Service" element={<TermsOfService />} />
            <Route path="/Privacy-Policy" element={<PrivacyPolicy />} />
            <Route path="/Sitemap" element={<Sitemap />} />
            <Route path="/delete-account-request" element={<DeleteAccountRequest />} />
            <Route path="/" element={user ? <Dashboard /> : <Navigate to="/auth" />}>
              <Route index element={<Home />} />
              <Route path="chat/:chatId" element={<Chat />} />
              <Route path="naje-agent-core" element={<NajeAgent />} />
              <Route path="al-nassaj" element={<Navigate to="/naje-agent-core" replace />} />
              <Route path="weaver" element={<Navigate to="/naje-agent-core" replace />} />
              <Route path="agent" element={<Navigate to="/naje-agent-core" replace />} />
              <Route path="naje-agent" element={<Navigate to="/naje-agent-core" replace />} />
              <Route path="creative-studio" element={<CreativelyAI />} />
              <Route path="creative-ai" element={<CreativelyAI />} />
              <Route path="naje-ad" element={<NajeAd />} />
              <Route path="naje-prompt" element={<NajePrompt />} />
              <Route path="naje-ident" element={<NajeIdent />} />
              <Route path="naje-intro" element={<Navigate to="/naje-ident" replace />} />
              <Route path="naje-motion" element={<Navigate to="/naje-ident" replace />} />
              <Route path="naje-cv" element={<NajeCv />} />
              <Route path="cv-by-naje" element={<Navigate to="/naje-cv" replace />} />
              <Route path="naje-developer" element={<NajeDeveloper />} />
              <Route path="naje-source" element={<NajeSource />} />
              <Route path="store" element={<Store />} />
              <Route path="stor" element={<Navigate to="/store" replace />} />
              <Route path="settings" element={<Profile />} />
              <Route path="profile" element={<Navigate to="/settings" replace />} />
              <Route path="favorites" element={<Favorites />} />
              <Route path="projects" element={<Projects />} />
            </Route>
            <Route path="/naje-admin-ai" element={user?.isAdmin ? <Admin /> : <Navigate to="/" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <ToastContainer />
        <OfflineBanner />
        <InstallAppButton />
        <SmartDownloadGatewayModal />
        <RealtimeNotificationListener />
        <TermsConsentModal />
        <OnboardingWizard />
      </BrowserRouter>
    </ErrorBoundary>
  </AppErrorBoundary>
  );
}
