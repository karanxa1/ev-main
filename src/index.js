// Fixed Router nesting issue

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

// Force initialize Firebase before rendering
import './services/firebase/config';

// Create root and render app
const container = document.getElementById('root');
const root = createRoot(container);

// Add error handler
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
});

// Render without BrowserRouter since it's likely already included in App.js
root.render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
