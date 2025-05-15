import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCalendarAlt } from 'react-icons/fa';
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
  const { currentUser, updateUserProfile } = useAuth();
  const navigate = useNavigate();

  // Initialize state with more relevant fields based on the image
  const [profileData, setProfileData] = useState({
    firstName: currentUser?.displayName?.split(' ')[0] || '',
    lastName: currentUser?.displayName?.split(' ').slice(1).join(' ') || '',
    email: currentUser?.email || '', // Email is usually not editable directly on this page
    phoneNumber: currentUser?.phoneNumber || '',
    gender: '', // Add gender
    dateOfBirth: '', // Add dateOfBirth
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        // gender and dateOfBirth would typically be fetched from your user profile data in Firebase/backend
      }));
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
      // Construct data to update
      const updatedProfile = {
        displayName: `${profileData.firstName} ${profileData.lastName}`.trim(),
        phoneNumber: profileData.phoneNumber,
        // You'll need to decide how to store/update gender and dateOfBirth
        // e.g., custom claims or a separate Firestore document
      };
      // Assuming updateUserProfile takes the data to update
      if (updateUserProfile) {
        await updateUserProfile(updatedProfile); // This needs to be implemented in AuthContext
      } else {
        console.warn("updateUserProfile function not available in AuthContext. Implement it to save data.");
      }
      // TODO: Add actual profile update logic here (e.g., call to Firebase)
      console.log('Profile data to save:', profileData);
      alert('Profile updated successfully!'); // Placeholder
      // navigate('/driver'); // Or wherever appropriate after update
    } catch (err) {
      console.error("Failed to update profile", err);
      setError('Failed to update profile. Please try again.');
      alert('Failed to update profile.'); // Placeholder
    }
    setLoading(false);
  };

  const handleBack = () => {
    navigate(-1); // Go back to the previous page in history
  };

  return (
    <div className="profile-page-container">
      <div className="profile-page-header">
        <button onClick={handleBack} className="back-button-bio">
          <FaArrowLeft />
        </button>
        <h1>Bio-data</h1>
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
        </div>
        <h2>{`${profileData.firstName} ${profileData.lastName}`.trim() || 'User Name'}</h2>
        <p className="profile-email-display">{profileData.email || 'user@example.com'}</p>
      </div>

      <form onSubmit={handleSave} className="profile-form">
        <div className="form-field">
          <label htmlFor="firstName">What's your first name?</label>
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
          <label htmlFor="lastName">And your last name?</label>
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
          <label htmlFor="phoneNumber">Phone number</label>
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
          <label htmlFor="gender">Select your gender</label>
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
          <label htmlFor="dateOfBirth">What is your date of birth?</label>
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
            {loading ? 'Updating...' : 'Update Profile'}
          </button>
        </div>
        {error && <p className="error-message">{error}</p>}
      </form>
    </div>
  );
};

export default ProfilePage; 