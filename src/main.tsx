import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallback={<div>Something went wrong. Please refresh the page.</div>}>
      <App />
      <Toaster position="top-right" />
    </ErrorBoundary>
  </StrictMode>,
);
