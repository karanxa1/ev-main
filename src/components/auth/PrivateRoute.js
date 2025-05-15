import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * PrivateRoute Component:
 * Protects routes that require authentication.
 * Redirects to login if user is not authenticated and saves the intended destination.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - The children components to render if authenticated
 * @returns {React.ReactElement} - The rendered component or redirect
 */
const PrivateRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  console.log('[PrivateRoute] Checking route:', location.pathname);
  console.log('[PrivateRoute] Auth loading:', loading);
  console.log('[PrivateRoute] currentUser:', currentUser);

  if (loading) {
    console.log('[PrivateRoute] Auth state is loading, showing loading indicator for', location.pathname);
    return <div className="loading-spinner">Loading...</div>; // Or a more sophisticated loading component
  }

  if (!currentUser) {
    console.log('[PrivateRoute] No currentUser, redirecting from', location.pathname, 'to /login');
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  console.log('[PrivateRoute] currentUser found, rendering children for', location.pathname);
  return children;
};

export default PrivateRoute;
