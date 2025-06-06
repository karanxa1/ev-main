import React from 'react';
// Fix the Navigate import error
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext'; // Provides authentication context to the app
import Login from './pages/auth/Login'; // Login page component
import Signup from './pages/auth/Signup'; // Signup page component
import PasswordReset from './pages/auth/PasswordReset'; // Password reset page component
import HostDashboard from './components/host/HostDashboard'; // Dashboard for charger hosts
import DriverDashboard from './pages/driver/DriverDashboard'; // Dashboard for EV drivers
import PrivateRoute from './components/auth/PrivateRoute'; // Component to protect routes
import HomePage from './pages/home/HomePage'; // Public landing page
import SelectVehiclePage from './pages/vehicle-selection/SelectVehiclePage'; // Vehicle selection page
import ChangeVehiclePage from './pages/change-vehicle/ChangeVehiclePage'; // Added import for ChangeVehiclePage
import ProfilePage from './pages/profile/ProfilePage'; // Profile page component
import TripsPage from './pages/trips/TripsPage'; // Import for TripsPage
import './App.css'; // Main application styles

/**
 * App Component:
 * The root component of the application. It sets up the React Router for navigation,
 * provides the authentication context, and defines the routes for different pages.
 */
function App() {
  // Fix Google Maps loading by using a removal statement for recorder reference
  if (typeof window !== 'undefined') {
    if (window.recorder && !window.recorderFixed) {
      try {
        delete window.recorder;
        window.recorderFixed = true;
      } catch (e) {
        console.error("Failed to clean up recorder reference:", e);
      }
    }
  }

  return (
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

            {/* Public route for password reset confirmation */}
            <Route path="/reset-password" element={<PasswordReset />} /> {/* Route for password reset */}

            {/* Protected route for selecting a vehicle, accessible only to authenticated users */}
            <Route
              path="/select-vehicle"
              element={
                <PrivateRoute>
                  <SelectVehiclePage />
                </PrivateRoute>
              }
            />

            {/* Protected route for changing a vehicle, accessible only to authenticated users */}
            <Route
              path="/change-vehicle"
              element={
                <PrivateRoute>
                  <ChangeVehiclePage />
                </PrivateRoute>
              }
            />

            {/* Protected route for Trips page */}
            <Route
              path="/trips"
              element={
                <PrivateRoute>
                  <TripsPage />
                </PrivateRoute>
              }
            />

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

            {/* Protected route for the Profile page, accessible only to authenticated users */}
            <Route 
              path="/profile" 
              element={
                <PrivateRoute>
                  <ProfilePage />
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