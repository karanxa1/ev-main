import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const NavigationHeader = React.memo(({ pageLoaded }) => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profileRef = useRef(null);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev);
  }, []);

  const scrollToSection = useCallback((sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const targetPosition = element.offsetTop - 80;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  }, []);

  const handleNavClick = useCallback((sectionId) => {
    if (mobileMenuOpen) toggleMobileMenu();
    scrollToSection(sectionId);
  }, [mobileMenuOpen, toggleMobileMenu, scrollToSection]);

  const handleProfileNavigation = useCallback((path) => {
    setProfileMenuOpen(false);
    if (mobileMenuOpen) toggleMobileMenu();
    
    if (path === '/dashboard') {
      navigate('/driver');
    } else {
      navigate(path);
    }
  }, [navigate, mobileMenuOpen, toggleMobileMenu]);

  const handleLogout = useCallback(async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      try {
        await logout();
        navigate('/');
      } catch (error) {
        console.error("Failed to log out", error);
        alert("Logout failed. Please try again.");
      }
    }
  }, [logout, navigate]);

  // Click outside handler for profile dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <>
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div 
          className="mobile-menu-overlay" 
          onClick={toggleMobileMenu}
          aria-hidden="true"
        />
      )}

      <header className={`home-header ${pageLoaded ? 'animate-on-load-slide-down' : 'initially-hidden'}`}>
        <div className="container header-container">
          <div 
            className="logo" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            style={{ cursor: 'pointer' }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            aria-label="Go to top of page"
          >
            <span className="logo-text">EV Charging Network</span>
          </div>
          
          <button 
            className={`hamburger-menu ${mobileMenuOpen ? 'open' : ''}`} 
            onClick={toggleMobileMenu} 
            aria-label="Toggle navigation menu" 
            aria-expanded={mobileMenuOpen}
          >
            <div></div>
            <div></div>
            <div></div>
          </button>
          
          <nav className={`nav-links ${mobileMenuOpen ? 'open' : ''}`} role="navigation">
            <button 
              className="nav-item" 
              onClick={() => handleNavClick('about')}
              type="button"
            >
              About
            </button>
            <button 
              className="nav-item"
              onClick={() => handleNavClick('stations')}
              type="button"
            >
              Stations
            </button>
            <button 
              className="nav-item"
              onClick={() => handleNavClick('how-it-works')}
              type="button"
            >
              How it Works
            </button>
            <button
              className="nav-item"
              onClick={() => handleNavClick('cost-estimator')}
              type="button"
            >
              Cost Estimator
            </button>
            
            {/* Conditional rendering based on authentication status */}
            {currentUser ? (
              <div className="profile-menu-container" ref={profileRef}>
                <button 
                  className="profile-button" 
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  aria-expanded={profileMenuOpen}
                  aria-haspopup="true"
                >
                  <div className="profile-avatar">
                    {currentUser.photoURL ? (
                      <img 
                        src={currentUser.photoURL} 
                        alt={currentUser.displayName || "User"} 
                        loading="lazy"
                      />
                    ) : (
                      <div className="avatar-initials">
                        {currentUser.displayName ? currentUser.displayName[0] : "U"}
                      </div>
                    )}
                  </div>
                  <span className="profile-name">
                    {currentUser.displayName || currentUser.email || "User"}
                  </span>
                  <span className={`profile-chevron ${profileMenuOpen ? 'open' : ''}`}>▼</span>
                </button>
                
                {profileMenuOpen && (
                  <div className="profile-dropdown" role="menu">
                    <div className="profile-dropdown-header">
                      <strong>
                        {currentUser.displayName || currentUser.email || "User"}
                      </strong>
                      <span className="profile-email">{currentUser.email}</span>
                    </div>
                    <div className="profile-dropdown-items">
                      <button 
                        onClick={() => handleProfileNavigation('/bookings')} 
                        className="profile-dropdown-button"
                        role="menuitem"
                      >
                        My Bookings
                      </button>
                      <button 
                        onClick={() => handleProfileNavigation('/dashboard')} 
                        className="profile-dropdown-button"
                        role="menuitem"
                      >
                        Dashboard
                      </button>
                      <button 
                        onClick={handleLogout} 
                        className="logout-button"
                        role="menuitem"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="auth-buttons">
                <Link 
                  to="/login" 
                  className="btn-login" 
                  onClick={() => { if(mobileMenuOpen) toggleMobileMenu(); }}
                >
                  Login
                </Link>
                <Link 
                  to="/signup" 
                  className="btn-signup" 
                  onClick={() => { if(mobileMenuOpen) toggleMobileMenu(); }}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>
    </>
  );
});

NavigationHeader.displayName = 'NavigationHeader';

export default NavigationHeader; 