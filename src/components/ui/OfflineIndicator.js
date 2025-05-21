import React, { useState, useEffect } from 'react';
import { FaWifi, FaExclamationTriangle } from 'react-icons/fa';
import './OfflineIndicator.css';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showToast, setShowToast] = useState(!navigator.onLine);
  
  // Update online status when it changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Show reconnected toast briefly
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      setShowToast(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial timeout to hide online toast after 3 seconds
    if (isOnline && showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnline, showToast]);
  
  if (!showToast) {
    return null;
  }
  
  return (
    <div className={`offline-indicator ${isOnline ? 'online' : 'offline'}`}>
      {isOnline ? (
        <>
          <FaWifi className="status-icon online-icon" />
          <p>Back online</p>
        </>
      ) : (
        <>
          <FaExclamationTriangle className="status-icon offline-icon" />
          <div>
            <p>You are offline</p>
            <small>Limited functionality available</small>
          </div>
        </>
      )}
    </div>
  );
};

export default OfflineIndicator; 