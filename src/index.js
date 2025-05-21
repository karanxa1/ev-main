import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import './index.css';
import * as serviceWorker from './serviceWorker';

// Better error handling for Firebase
const handleError = (error) => {
  console.error('Application error:', error);
  
  // Display user-friendly error message if desired
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const errorMessage = document.createElement('div');
    errorMessage.style.padding = '20px';
    errorMessage.style.margin = '20px';
    errorMessage.style.backgroundColor = '#fff0f0';
    errorMessage.style.border = '1px solid #ffcccc';
    errorMessage.style.borderRadius = '4px';
    
    errorMessage.innerHTML = `
      <h3 style="color: #d8000c;">Something went wrong</h3>
      <p>The application couldn't be loaded properly. Please try refreshing the page.</p>
      <button onclick="window.location.reload()" 
        style="background: #0b9748; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;">
        Refresh Page
      </button>
    `;
    
    rootElement.appendChild(errorMessage);
  }
};

// Global error handling
window.addEventListener('error', (event) => {
  handleError(event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  handleError(event.reason);
});

// Initialize app with error boundary
try {
  // Force initialize Firebase before rendering
  import('./services/firebase/config')
    .then(() => {
      const container = document.getElementById('root');
      const root = createRoot(container);
      
      root.render(
        <React.StrictMode>
          <ThemeProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </ThemeProvider>
        </React.StrictMode>
      );
    })
    .catch((error) => {
      console.error("Failed to initialize Firebase:", error);
      // Attempt to render anyway
      const container = document.getElementById('root');
      const root = createRoot(container);
      
      root.render(
        <React.StrictMode>
          <ThemeProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </ThemeProvider>
        </React.StrictMode>
      );
    });
} catch (error) {
  handleError(error);
}

// Register service worker for offline functionality
serviceWorker.register();
