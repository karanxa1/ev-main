import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for offline functionality
serviceWorker.register({
  onSuccess: (registration) => {
    console.log('Service worker registered successfully:', registration);
  },
  onUpdate: (registration) => {
    console.log('New service worker available:', registration);
  }
});
