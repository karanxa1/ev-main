import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoadScript, GoogleMap, Marker } from '@react-google-maps/api';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import HostDashboard from './components/host/HostDashboard';
import './App.css';

// Auth Components
const Login: React.FC = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to log in');
    }
  };

  return (
    <div className="auth-form">
      <h2>Login</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>
        <button type="submit">Login</button>
      </form>
      <p>Don't have an account? <a href="/signup">Sign up</a></p>
    </div>
  );
};

const Signup: React.FC = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [role, setRole] = React.useState<'driver' | 'host'>('driver');
  const [error, setError] = React.useState('');
  const { signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    try {
      await signup(email, password, role);
    } catch (err: any) {
      setError(err.message || 'Failed to create an account');
    }
  };

  return (
    <div className="auth-form">
      <h2>Sign Up</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>
        <div className="form-group">
          <label>Confirm Password</label>
          <input 
            type="password" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            required 
          />
        </div>
        <div className="form-group">
          <label>Role</label>
          <select 
            value={role} 
            onChange={(e) => setRole(e.target.value as 'driver' | 'host')} 
            required
          >
            <option value="driver">Driver</option>
            <option value="host">Host</option>
          </select>
        </div>
        <button type="submit">Sign Up</button>
      </form>
      <p>Already have an account? <a href="/login">Login</a></p>
    </div>
  );
};

// Dashboard Components
const DriverDashboard: React.FC = () => {
  const { logout, currentUser } = useAuth();
  const [chargers] = React.useState<any[]>([]);
  const [selectedCharger, setSelectedCharger] = React.useState<any>(null);
  const [showBookingModal, setShowBookingModal] = React.useState(false);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = React.useState<string>('');
  const [bookingSuccess, setBookingSuccess] = React.useState(false);
  React.useEffect(() => {
    const fetchChargers = async () => {
      try {
        // TODO: Implement charger fetching logic
      } catch (error) {
        console.error('Error fetching chargers:', error);
      }
    };

    fetchChargers();
  }, []);

  const handleBookCharger = async () => {
    if (!selectedCharger || !selectedDate || !selectedTime || !currentUser) return;
    
    try {
      // TODO: Implement Firestore booking creation
      // await createBooking({
      //   chargerId: selectedCharger.id,
      //   userId: currentUser.uid,
      //   date: selectedDate,
      //   timeSlot: selectedTime,
      //   status: 'confirmed'
      // });
      setBookingSuccess(true);
      setShowBookingModal(false);
    } catch (error) {
      console.error('Error creating booking:', error);
    }
  };

  return (
    <div className="dashboard">
      <h2>Driver Dashboard</h2>
      <p>Welcome to your driver dashboard. Here you can find and book charging stations.</p>
      
      <div style={{ height: '500px', width: '100%', marginBottom: '20px' }}>
        <LoadScript googleMapsApiKey="YOUR_API_KEY">
          <GoogleMap
            mapContainerStyle={{ height: '100%', width: '100%' }}
            center={{ lat: 40.7128, lng: -74.0060 }}
            zoom={12}
            options={{ gestureHandling: 'cooperative' }}
          >
            {chargers.map(charger => (
              <Marker
                key={charger.id}
                position={{ lat: charger.latitude, lng: charger.longitude }}
                onClick={() => setSelectedCharger(charger)}
              />
            ))}
          </GoogleMap>
        </LoadScript>
      </div>

      {selectedCharger && (
        <div className="charger-info">
          <h3>{selectedCharger.name}</h3>
          <p>Type: {selectedCharger.type}</p>
          <p>Power: {selectedCharger.power} kW</p>
          <p>Price: ${selectedCharger.pricePerKwh}/kWh</p>
          <p>Status: {selectedCharger.availability ? 'Available' : 'Occupied'}</p>
          <button onClick={() => setShowBookingModal(true)}>Book Now</button>
          
          {showBookingModal && (
            <div className="booking-modal">
              <h3>Book {selectedCharger.name}</h3>
              <div>
                <label>Date:</label>
                <input 
                  type="date" 
                  onChange={(e) => setSelectedDate(new Date(e.target.value))} 
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label>Time Slot:</label>
                <select onChange={(e) => setSelectedTime(e.target.value)}>
                  <option value="">Select time</option>
                  <option value="08:00-10:00">08:00-10:00</option>
                  <option value="10:00-12:00">10:00-12:00</option>
                  <option value="12:00-14:00">12:00-14:00</option>
                  <option value="14:00-16:00">14:00-16:00</option>
                  <option value="16:00-18:00">16:00-18:00</option>
                  <option value="18:00-20:00">18:00-20:00</option>
                </select>
              </div>
              <button onClick={handleBookCharger}>Confirm Booking</button>
              <button onClick={() => setShowBookingModal(false)}>Cancel</button>
            </div>
          )}
          
          {bookingSuccess && (
            <div className="booking-success">
              <p>Booking confirmed for {selectedTime}!</p>
            </div>
          )}
        </div>
      )}

      <button onClick={() => logout()}>Logout</button>
    </div>
  );
};

// Dashboard Components


// Protected Route Component
const ProtectedRoute: React.FC<{ 
  element: React.ReactNode; 
  requiredRole?: 'driver' | 'host'; 
}> = ({ element, requiredRole }) => {
  const { currentUser, userLoading, userRole } = useAuth();
  
  if (userLoading) {
    return <div>Loading...</div>;
  }
  
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  if (requiredRole && userRole !== requiredRole) {
    // Redirect to the appropriate dashboard based on role
    return <Navigate to={userRole === 'driver' ? '/driver' : '/host'} />;
  }
  
  return <>{element}</>;
};

// App Component with Routing
function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route 
              path="/driver" 
              element={
                <ProtectedRoute 
                  element={<DriverDashboard />} 
                  requiredRole="driver" 
                />
              } 
            />
            <Route 
              path="/host" 
              element={
                <ProtectedRoute 
                  element={<HostDashboard />} 
                  requiredRole="host" 
                />
              } 
            />
            <Route path="/" element={<Navigate to="/login" />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
