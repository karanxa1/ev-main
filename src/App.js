import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import HostDashboard from './components/host/HostDashboard';
import DriverDashboard from './pages/driver/DriverDashboard';
import PrivateRoute from './components/auth/PrivateRoute';
import './App.css';

// Main App Component
function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/host" element={
              <PrivateRoute>
                <HostDashboard />
              </PrivateRoute>
            } />
            <Route path="/driver" element={
              <PrivateRoute>
                <DriverDashboard />
              </PrivateRoute>
            } />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;