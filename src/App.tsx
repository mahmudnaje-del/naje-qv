import React, { useEffect, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store';
import { lazyWithRetry } from './lib/lazyRetry';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
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

const Admin = lazyWithRetry(() => import('./pages/Admin'));
const TermsOfService = lazyWithRetry(() => import('./pages/TermsOfService'));
const PrivacyPolicy = lazyWithRetry(() => import('./pages/PrivacyPolicy'));
const Sitemap = lazyWithRetry(() => import('./pages/Sitemap'));
const DeleteAccountRequest = lazyWithRetry(() => import('./pages/DeleteAccountRequest'));
const CreativelyAI = lazyWithRetry(() => import('./pages/CreativelyAI'));
const NajeAgent = lazyWithRetry(() => import('./pages/NajeAgent'));
const NajeAd = lazyWithRetry(() => import('./pages/NajeAd'));
const Store = lazyWithRetry(() => import('./pages/Store'));
const AuthAction = lazyWithRetry(() => import('./pages/AuthAction'));

export default function App() {
  const { initializeAuth, loadingAuth, user, themeMode } = useAppStore();

  useEffect(() => {
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeMode]);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1115]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <AppErrorBoundary>
      <ErrorBoundary>
        <BrowserRouter>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0f1115]">
            <NajeThinking size={48} />
          </div>
        }>
          <Routes>
            <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" />} />
            
            {/* User Routes */}
            <Route path="/" element={user ? <Dashboard /> : <Navigate to="/auth" />}>
              <Route index element={<Projects />} />
              <Route path="chat/:chatId" element={<Chat />} />
              <Route path="naje-agent-core" element={<NajeAgent />} />
              <Route path="al-nassaj" element={<Navigate to="/naje-agent-core" replace />} />
              <Route path="weaver" element={<Navigate to="/naje-agent-core" replace />} />
              <Route path="agent" element={<Navigate to="/naje-agent-core" replace />} />
              <Route path="naje-agent" element={<Navigate to="/naje-agent-core" replace />} />
              <Route path="creative-studio" element={<CreativelyAI />} />
              <Route path="creative-ai" element={<CreativelyAI />} />
              <Route path="naje-ad" element={<NajeAd />} />
              <Route path="store" element={<Store />} />
              <Route path="stor" element={<Navigate to="/store" replace />} />
              <Route path="settings" element={<Profile />} />
              <Route path="profile" element={<Navigate to="/settings" replace />} />
              <Route path="favorites" element={<Favorites />} />
              <Route path="projects" element={<Projects />} />
              <Route path="Terms-of-Service" element={<TermsOfService />} />
              <Route path="Privacy-Policy" element={<PrivacyPolicy />} />
              <Route path="Sitemap" element={<Sitemap />} />
            </Route>

            {/* Public Routes (No auth required) */}
            <Route path="/auth/action" element={<AuthAction />} />
            <Route path="/Terms-of-Service" element={<TermsOfService />} />
            <Route path="/Privacy-Policy" element={<PrivacyPolicy />} />
            <Route path="/Sitemap" element={<Sitemap />} />
            <Route path="/delete-account-request" element={<DeleteAccountRequest />} />

            {/* Admin Route */}
            <Route path="/naje-admin-ai" element={user?.isAdmin ? <Admin /> : <Navigate to="/" />} />
          </Routes>
        </Suspense>
        <ToastContainer />
        <SmartDownloadGatewayModal />
        <RealtimeNotificationListener />
        <TermsConsentModal />
        <OnboardingWizard />
      </BrowserRouter>
    </ErrorBoundary>
  </AppErrorBoundary>
  );
}
