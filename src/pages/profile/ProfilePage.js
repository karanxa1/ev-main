import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, FaCalendarAlt, FaCar, FaCog, 
  FaHistory, FaCamera, FaMoon, FaSun, FaMapMarkedAlt 
} from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import './ProfilePage.css';

// Placeholder for a flag icon, you might use an actual SVG or an icon library
const FlagIcon = () => (
  <svg width="24" height="18" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
    <rect width="24" height="18" fill="#008751"/>
    <rect width="8" height="18" fill="white"/>
    <rect x="16" width="8" height="18" fill="white"/>
  </svg>
);

const ProfilePage = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  // Initialize state with more relevant fields based on the image
  const [profileData, setProfileData] = useState({
    firstName: currentUser?.displayName?.split(' ')[0] || '',
    lastName: currentUser?.displayName?.split(' ').slice(1).join(' ') || '',
    email: currentUser?.email || '',
    phoneNumber: currentUser?.phoneNumber || '',
    gender: '',
    dateOfBirth: '',
    vehicle: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [darkMode, setDarkMode] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Mock data for trips
  const [trips, setTrips] = useState([
    { id: 1, date: '2023-05-15', from: 'Home', to: 'Office', distance: '12.5 km' },
    { id: 2, date: '2023-05-16', from: 'Office', to: 'Mall', distance: '8.2 km' },
    { id: 3, date: '2023-05-17', from: 'Mall', to: 'Home', distance: '15.0 km' },
  ]);

  // Effect to populate form when currentUser is available/changes
  useEffect(() => {
    if (currentUser) {
      const nameParts = currentUser.displayName?.split(' ') || [];
      setProfileData(prevData => ({
        ...prevData,
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: currentUser.email || '',
        phoneNumber: currentUser.phoneNumber || '',
        // Fetch from Firestore in a real implementation
      }));

      // Fetch user vehicle
      // This would be replaced with actual database calls
      const mockVehicle = {
        name: 'Tata Nexon EV',
        model: '2022',
        batteryCapacity: '40.5 kWh',
        range: '312 km',
        chargerTypes: ['CCS2', 'Type 2 AC']
      };
      
      setProfileData(prev => ({...prev, vehicle: mockVehicle}));
    }
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Here you would update user profile in Firestore/Firebase
      console.log('Profile data to save:', profileData);
      
      // Simple timeout to simulate API call
      setTimeout(() => {
        setLoading(false);
        // Show success message
        const successMessage = document.getElementById('success-message');
        successMessage.classList.add('show');
        setTimeout(() => successMessage.classList.remove('show'), 3000);
      }, 1000);
      
    } catch (err) {
      console.error("Failed to update profile", err);
      setError('Failed to update profile. Please try again.');
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/driver'); // Navigate directly to driver dashboard
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth/login');
    } catch (error) {
      console.error("Logout error", error);
      setError("Failed to log out. Please try again.");
    }
  };

  const handleSelectVehicle = () => {
    navigate('/change-vehicle');
  };

  const handleToggleDarkMode = () => {
    setDarkMode(!darkMode);
    // In a real app, you would save this preference
    document.body.classList.toggle('dark-mode');
  };

  return (
    <div className={`profile-page-container ${darkMode ? 'dark-mode' : ''}`}>
      <div className="profile-page-header">
        <button onClick={handleBack} className="back-button-bio">
          <FaArrowLeft />
        </button>
        <h1>My Profile</h1>
        <div className="profile-menu-container">
          <button 
            className="profile-menu-button" 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <FaCog />
          </button>
          {showProfileMenu && (
            <div className="profile-dropdown-menu">
              <button onClick={handleToggleDarkMode}>
                {darkMode ? <FaSun /> : <FaMoon />} {darkMode ? 'Light Mode' : 'Dark Mode'}
              </button>
              <button onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="profile-avatar-section">
        <div className="profile-avatar-lg">
          {currentUser?.photoURL ? (
            <img src={currentUser.photoURL} alt={profileData.firstName || 'User'} />
          ) : (
            <div className="avatar-initials-lg">
              {profileData.firstName ? profileData.firstName[0] : 'U'}
            </div>
          )}
          <button className="change-avatar-button">
            <FaCamera />
          </button>
        </div>
        <h2>{`${profileData.firstName} ${profileData.lastName}`.trim() || 'User Name'}</h2>
        <p className="profile-email-display">{profileData.email || 'user@example.com'}</p>
      </div>

      <div className="profile-tabs">
        <button 
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`} 
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button 
          className={`tab-button ${activeTab === 'vehicle' ? 'active' : ''}`} 
          onClick={() => setActiveTab('vehicle')}
        >
          Vehicle
        </button>
        <button 
          className={`tab-button ${activeTab === 'trips' ? 'active' : ''}`} 
          onClick={() => setActiveTab('trips')}
        >
          Trips
        </button>
      </div>

      {/* Profile Info Tab */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSave} className="profile-form">
          <div className="form-field">
            <label htmlFor="firstName">First Name</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={profileData.firstName}
              onChange={handleInputChange}
              placeholder="Enter your first name"
            />
          </div>
          
          <div className="form-field">
            <label htmlFor="lastName">Last Name</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={profileData.lastName}
              onChange={handleInputChange}
              placeholder="Enter your last name"
            />
          </div>

          <div className="form-field phone-field">
            <label htmlFor="phoneNumber">Phone Number</label>
            <div className="phone-input-container">
              <FlagIcon />
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={profileData.phoneNumber}
                onChange={handleInputChange}
                placeholder="Enter your phone number"
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="gender">Gender</label>
            <select
              id="gender"
              name="gender"
              value={profileData.gender}
              onChange={handleInputChange}
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="dateOfBirth">Date of Birth</label>
            <div className="date-input-container">
              <input
                type="text"
                id="dateOfBirth"
                name="dateOfBirth"
                value={profileData.dateOfBirth}
                onChange={handleInputChange}
                placeholder="DD/MM/YYYY"
              />
              <FaCalendarAlt className="calendar-icon" />
            </div>
          </div>
          
          <div className="profile-actions-bio">
            <button type="submit" className="btn-update-profile" disabled={loading}>
              {loading ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
          
          {error && <p className="error-message">{error}</p>}
          <div id="success-message" className="success-message">Profile updated successfully!</div>
        </form>
      )}

      {/* Vehicle Tab */}
      {activeTab === 'vehicle' && (
        <div className="vehicle-tab-content">
          {profileData.vehicle ? (
            <div className="vehicle-details">
              <div className="vehicle-header">
                <h3>{profileData.vehicle.name}</h3>
                <p>Model: {profileData.vehicle.model}</p>
              </div>
              <div className="vehicle-specs">
                <div className="vehicle-spec-item">
                  <div className="spec-label">Battery</div>
                  <div className="spec-value">{profileData.vehicle.batteryCapacity}</div>
                </div>
                <div className="vehicle-spec-item">
                  <div className="spec-label">Range</div>
                  <div className="spec-value">{profileData.vehicle.range}</div>
                </div>
                <div className="vehicle-spec-item">
                  <div className="spec-label">Compatible Chargers</div>
                  <div className="spec-value charger-types">
                    {profileData.vehicle.chargerTypes.map((type, index) => (
                      <span key={index} className="charger-type-badge">{type}</span>
                    ))}
                  </div>
                </div>
              </div>
              <button className="btn-change-vehicle" onClick={handleSelectVehicle}>
                <FaCar /> Change Vehicle
              </button>
            </div>
          ) : (
            <div className="no-vehicle-message">
              <FaCar size={48} />
              <p>No vehicle selected</p>
              <button className="btn-add-vehicle" onClick={handleSelectVehicle}>
                Select a Vehicle
              </button>
            </div>
          )}
        </div>
      )}

      {/* Trips Tab */}
      {activeTab === 'trips' && (
        <div className="trips-tab-content">
          {trips.length > 0 ? (
            <>
              <h3 className="trips-section-title">Recent Trips</h3>
              <div className="trips-list">
                {trips.map(trip => (
                  <div key={trip.id} className="trip-card">
                    <div className="trip-date">{trip.date}</div>
                    <div className="trip-route">
                      <div className="trip-from">
                        <div className="route-dot start"></div>
                        <span>{trip.from}</span>
                      </div>
                      <div className="trip-route-line"></div>
                      <div className="trip-to">
                        <div className="route-dot end"></div>
                        <span>{trip.to}</span>
                      </div>
                    </div>
                    <div className="trip-details">
                      <span className="trip-distance">
                        <FaMapMarkedAlt /> {trip.distance}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="view-all-trips">
                <button onClick={() => navigate('/trips')}>View All Trips</button>
              </div>
            </>
          ) : (
            <div className="no-trips-message">
              <FaHistory size={48} />
              <p>No trips recorded yet</p>
              <p className="trips-hint">Your EV charging trips will appear here</p>
            </div>
          )}
        </div>
      )}

      {/* Bottom Navigation is included in the driver dashboard */}
    </div>
  );
};

export default ProfilePage; 