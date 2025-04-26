import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext'; // Provides authentication context to the app
import Login from './pages/auth/Login'; // Login page component
import Signup from './pages/auth/Signup'; // Signup page component
import HostDashboard from './components/host/HostDashboard'; // Dashboard for charger hosts
import DriverDashboard from './pages/driver/DriverDashboard'; // Dashboard for EV drivers
import PrivateRoute from './components/auth/PrivateRoute'; // Component to protect routes
import HomePage from './pages/home/HomePage'; // Public landing page
import './App.css'; // Main application styles

/**
 * App Component:
 * The root component of the application. It sets up the React Router for navigation,
 * provides the authentication context, and defines the routes for different pages.
 */
function App() {
  return (
    // BrowserRouter enables client-side routing
    <Router>
      {/* AuthProvider makes authentication state (currentUser, login, logout, etc.) available to all child components */}
      <AuthProvider>
        {/* Main application container */}
        <div className="app">
          {/* Routes define the mapping between URL paths and components */}
          <Routes>
            {/* Public route for the Home page, accessible to all users */}
            <Route path="/" element={<HomePage />} /> {/* Route for the Home page */}
            
            {/* Public route for the Login page, accessible to unauthenticated users */}
            <Route path="/login" element={<Login />} /> {/* Route for the Login page */}
            
            {/* Public route for the Signup page, accessible to unauthenticated users */}
            <Route path="/signup" element={<Signup />} /> {/* Route for the Signup page */}

            {/* Protected route for the Host Dashboard, accessible only to authenticated users */}
            {/* The PrivateRoute component ensures that only authenticated users can access this route */}
            <Route 
              path="/host" 
              element={
                <PrivateRoute>
                  {/* Renders the HostDashboard component if the user is authenticated */}
                  <HostDashboard />
                </PrivateRoute>
              } 
            />
            
            {/* Protected route for the Driver Dashboard, accessible only to authenticated users */}
            {/* The PrivateRoute component ensures that only authenticated users can access this route */}
            <Route 
              path="/driver" 
              element={
                <PrivateRoute>
                  {/* Renders the DriverDashboard component if the user is authenticated */}
                  <DriverDashboard />
                </PrivateRoute>
              } 
            />

            {/* Fallback route: Redirects any unmatched URL paths to the Home page */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;