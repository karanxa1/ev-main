// Updated to ensure Firebase is properly initialized before rendering

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
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

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
