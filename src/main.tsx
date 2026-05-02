import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

// Register service worker
if ('serviceWorker' in navigator) {
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
