import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .catch((error) => {
        console.log('SW cleanup failed: ', error);
      });

    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith('focus-'))
          .map((cacheName) => caches.delete(cacheName)),
      ))
      .catch((error) => {
        console.log('Cache cleanup failed: ', error);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallback={<div>Something went wrong. Please refresh the page.</div>}>
      <AuthProvider>
        <App />
        <Toaster position="top-right" />
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);
