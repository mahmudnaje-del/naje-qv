import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);


if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((r) => r.unregister());
    });
    if (typeof caches !== 'undefined') {
      caches.keys().then((keys) => {
        keys.forEach((key) => caches.delete(key));
      });
    }
  } else {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      // Periodically check for updates in the background without forcing mid-session reload
      setInterval(() => registration.update(), 60 * 60 * 1000); // hourly
    }).catch((err) => console.error('SW registration failed', err));
  }
}

