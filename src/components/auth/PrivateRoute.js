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

  // If still loading auth state, show nothing or a loading indicator
  if (loading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  // If no user is authenticated, redirect to login page with the return location
  if (!currentUser) {
    // Save the current location they were trying to access for redirecting after login
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // If user is authenticated, render the protected route component
  return children;
};

export default PrivateRoute;
