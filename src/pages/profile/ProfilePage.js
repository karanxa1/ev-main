import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaHome, FaMapMarkedAlt } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import './ProfilePage.css';

const ProfilePage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [previousPage, setPreviousPage] = useState('/');
  const [profileData, setProfileData] = useState({
    name: currentUser?.displayName || '',
    email: currentUser?.email || '',
    phone: currentUser?.phoneNumber || '',
    address: '',
    vehicle: '',
  });

  useEffect(() => {
    // Determine where the user came from
    const referrer = location.state?.from || '/';
    setPreviousPage(referrer);
  }, [location]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    // TODO: Implement actual profile update logic here
    setIsEditing(false);
  };

  const handleBack = () => {
    // Navigate back to the previous page
    navigate(previousPage);
  };

  const goToHome = () => {
    navigate('/');
  };

  const goToDriverDashboard = () => {
    navigate('/driver/dashboard');
  };

  return (
    <div className="profile-container">
      <div className="profile-nav">
        <button onClick={handleBack} className="back-button">
          <FaArrowLeft /> Back
        </button>
        <div className="page-shortcuts">
          <button onClick={goToHome} className="shortcut-button">
            <FaHome /> Home
          </button>
          <button onClick={goToDriverDashboard} className="shortcut-button">
            <FaMapMarkedAlt /> Dashboard
          </button>
        </div>
      </div>
      
      <h1>My Profile</h1>
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt={currentUser.displayName || 'User'} />
            ) : (
              <div className="avatar-initials">
                {currentUser?.displayName ? currentUser.displayName[0] : 'U'}
              </div>
            )}
          </div>
          <h2>{currentUser?.displayName || 'User'}</h2>
          <p className="profile-email">{currentUser?.email || 'email@example.com'}</p>
        </div>

        <div className="profile-details">
          {isEditing ? (
            <>
              <div className="profile-field">
                <label>Name:</label>
                <input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your name"
                />
              </div>
              <div className="profile-field">
                <label>Email:</label>
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                />
              </div>
              <div className="profile-field">
                <label>Phone:</label>
                <input
                  type="tel"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number"
                />
              </div>
              <div className="profile-field">
                <label>Address:</label>
                <input
                  type="text"
                  name="address"
                  value={profileData.address}
                  onChange={handleInputChange}
                  placeholder="Enter your address"
                />
              </div>
              <div className="profile-field">
                <label>Vehicle:</label>
                <input
                  type="text"
                  name="vehicle"
                  value={profileData.vehicle}
                  onChange={handleInputChange}
                  placeholder="Enter your vehicle details"
                />
              </div>
              <div className="profile-actions">
                <button onClick={handleSave} className="btn-save">Save</button>
                <button onClick={handleEditToggle} className="btn-cancel">Cancel</button>
              </div>
            </>
          ) : (
            <>
              <div className="profile-field">
                <label>Name:</label>
                <span>{profileData.name || 'Not set'}</span>
              </div>
              <div className="profile-field">
                <label>Email:</label>
                <span>{profileData.email || 'Not set'}</span>
              </div>
              <div className="profile-field">
                <label>Phone:</label>
                <span>{profileData.phone || 'Not set'}</span>
              </div>
              <div className="profile-field">
                <label>Address:</label>
                <span>{profileData.address || 'Not set'}</span>
              </div>
              <div className="profile-field">
                <label>Vehicle:</label>
                <span>{profileData.vehicle || 'Not set'}</span>
              </div>
              <div className="profile-actions">
                <button onClick={handleEditToggle} className="btn-edit">Edit Profile</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage; 