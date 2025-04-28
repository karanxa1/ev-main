import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './ProfilePage.css';

const ProfilePage = () => {
  const { currentUser, updateProfile, updatePassword, logout } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    language: 'en',
    photo: null,
    photoURL: ''
  });
  
  // Load user data
  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        name: currentUser.displayName || '',
        email: currentUser.email || '',
        photoURL: currentUser.photoURL || ''
      }));
    } else {
      navigate('/login');
    }
  }, [currentUser, navigate]);
  
  // Handle input changes
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };
  
  // Handle photo change
  const handlePhotoChange = (e) => {
    if (e.target.files[0]) {
      setFormData(prev => ({ 
        ...prev, 
        photo: e.target.files[0],
        photoURL: URL.createObjectURL(e.target.files[0])
      }));
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });
    
    try {
      // Update profile info
      if (formData.name !== currentUser.displayName) {
        await updateProfile({
          displayName: formData.name
        });
      }
      
      // Update photo if selected
      if (formData.photo) {
        // In a real app, you would upload to storage and get URL
        // For this example we'll just simulate success
        console.log("Photo would be uploaded:", formData.photo.name);
      }
      
      // Update password if provided
      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          throw new Error("Passwords don't match");
        }
        await updatePassword(formData.currentPassword, formData.newPassword);
      }
      
      setMessage({
        text: 'Profile updated successfully!',
        type: 'success'
      });
    } catch (error) {
      setMessage({
        text: error.message || 'Failed to update profile',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="profile-page">
      <div className="profile-container">
        <header className="profile-header">
          <div className="avatar-section">
            <div className="avatar-container">
              {formData.photoURL ? (
                <img src={formData.photoURL} alt="Avatar" className="avatar-image" />
              ) : (
                <div className="avatar-placeholder">
                  {formData.name ? formData.name[0].toUpperCase() : 'U'}
                </div>
              )}
            </div>
            <div className="avatar-details">
              <h1 className="avatar-name">{formData.name || 'User'}</h1>
              <label htmlFor="photo-upload" className="change-photo-btn">
                Change photo
              </label>
              <input 
                type="file" 
                id="photo-upload" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={handlePhotoChange}
              />
            </div>
          </div>
        </header>
        
        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="card profile-info">
            <div className="card-content">
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  type="text"
                  placeholder="E.g. John Smith"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  readOnly
                  disabled
                  className="disabled-input"
                />
                <p className="help-text">Email cannot be changed</p>
              </div>
              <div className="form-group">
                <label htmlFor="bio">Biography</label>
                <textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={formData.bio}
                  onChange={handleChange}
                ></textarea>
              </div>
            </div>
          </div>
          
          <div className="card language-settings">
            <div className="card-header">
              <h2>Language</h2>
              <p>Choose your preferred language</p>
            </div>
            <div className="card-content">
              <div className="language-options">
                <div className="language-option">
                  <input
                    type="radio"
                    id="lang-en"
                    name="language"
                    value="en"
                    checked={formData.language === 'en'}
                    onChange={() => setFormData(prev => ({ ...prev, language: 'en' }))}
                  />
                  <label htmlFor="lang-en">English</label>
                </div>
                <div className="language-option">
                  <input
                    type="radio"
                    id="lang-hi"
                    name="language"
                    value="hi"
                    checked={formData.language === 'hi'}
                    onChange={() => setFormData(prev => ({ ...prev, language: 'hi' }))}
                  />
                  <label htmlFor="lang-hi">Hindi</label>
                </div>
                <div className="language-option">
                  <input
                    type="radio"
                    id="lang-ta"
                    name="language"
                    value="ta"
                    checked={formData.language === 'ta'}
                    onChange={() => setFormData(prev => ({ ...prev, language: 'ta' }))}
                  />
                  <label htmlFor="lang-ta">Tamil</label>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card password-settings">
            <div className="card-header">
              <h2>Change Password</h2>
              <p>For your security, please do not share your password with others.</p>
            </div>
            <div className="card-content">
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
          
          <div className="form-actions">
            <button type="submit" className="save-button" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
