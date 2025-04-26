import React, { useContext } from 'react';
import { Route, Navigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';

/**
 * PrivateRoute Component:
 * A wrapper component that protects routes by checking if the user is authenticated.
 * If the user is authenticated, it renders the requested component; otherwise, it redirects to the login page.
 */
const PrivateRoute = ({ children }) => {
  // Access the current user from the AuthContext
  const { currentUser } = useContext(AuthContext);

  // If there is no current user, redirect to the login page; otherwise, render the children components
  return currentUser ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
