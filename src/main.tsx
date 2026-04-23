import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.tsx';
import './index.css';
import { BASE_URL } from './lib/api';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID';

declare global {
  interface Window {
    sessionExpiredTriggered?: boolean;
  }
}

// CSRF Logic Removed - Security relies on JWT headers for Cross-Origin requests


// Global fetch interceptor to inject JWT token and CSRF token into all /api/ requests
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  
  const isApiCall = typeof resource === 'string' && 
    (resource.includes(BASE_URL) || resource.startsWith('/api/') || resource.includes(':3003/api'));

  if (isApiCall) {
    const token = localStorage.getItem('conversio_token');
    config = config || {};
    config.credentials = 'include';
    
    config.headers = {
        ...config.headers,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})

    };
    
    args[1] = config;
  }

  let response = await originalFetch(...args);

  // If 401 (Expired), trigger modal instead of immediate redirect
  // Use a simple guard to prevent event spam
  if (response.status === 401 && isApiCall && !resource.toString().includes('/auth/login') && !resource.toString().includes('/auth/register')) {
    if (!window.sessionExpiredTriggered) {
        window.sessionExpiredTriggered = true;
        console.warn('[Auth] Session expired, triggering modal...');
        
        // Dispatch custom event for the UI to show the modal
        window.dispatchEvent(new CustomEvent('session-expired'));
        
        localStorage.removeItem('conversio_token');
        localStorage.removeItem('conversio_user');

        // Reset after 5 seconds
        setTimeout(() => { window.sessionExpiredTriggered = false; }, 5000);
    }
  }
  
  return response;
};

// Initial Logic
// fetchCsrfToken removed




createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
);

