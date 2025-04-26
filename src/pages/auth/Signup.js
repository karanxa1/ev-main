import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Login.css'; // Using the same CSS file

/**
 * Signup Component:
 * A modern, card-based sign up form with validation and error handling.
 */
const Signup = () => {
  // Navigation hooks
  const navigate = useNavigate();
  
  // Auth context - add signInWithGoogle to the destructured properties
  const { signup, signInWithGoogle, currentUser, authError, setAuthError } = useAuth();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [accountType, setAccountType] = useState('driver');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [validationError, setValidationError] = useState('');

  // Clear errors when component mounts
  useEffect(() => {
    if (setAuthError) setAuthError('');
    setValidationError('');
  }, [setAuthError]);

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate(accountType === 'driver' ? '/driver' : '/host');
    }
  }, [currentUser, navigate, accountType]);

  /**
   * Validate the form data
   * @returns {boolean} Whether the form is valid
   */
  const validateForm = () => {
    // Reset validation errors
    setValidationError('');
    
    // Name validation
    if (name.trim().length < 3) {
      setValidationError('Name must be at least 3 characters');
      return false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError('Please enter a valid email address');
      return false;
    }
    
    // Password validation
    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return false;
    }
    
    // Password match validation
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return false;
    }
    
    // Terms agreement validation
    if (!agreeToTerms) {
      setValidationError('You must agree to the Terms of Service');
      return false;
    }
    
    return true;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      await signup(email, password);
      
      // In a real app, you would save additional user information (name, account type)
      // to a database like Firestore
      
      // Navigate based on account type
      navigate(accountType === 'driver' ? '/driver' : '/host', { replace: true });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Add handler for Google Sign In
  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      // Call the Google sign-in function from AuthContext
      await signInWithGoogle();
      // Navigate based on account type
      navigate(accountType === 'driver' ? '/driver' : '/host', { replace: true });
    } catch (error) {
      console.error('Google sign in error:', error);
      setValidationError('Failed to sign in with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card signup-card">
        <div className="card-header">
          <h2 className="card-title">Create an Account</h2>
          <p className="card-description">Join our EV Charging network today</p>
        </div>
        
        {(authError || validationError) && (
          <div className="auth-error">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{validationError || authError}</span>
          </div>
        )}
        
        <div className="card-content">
          <form onSubmit={handleSubmit} className="login-form signup-form">
            <div className="form-field">
              <label htmlFor="name">Full Name</label>
              <div className="input-container">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                  autoComplete="name"
                />
              </div>
              {validationError && validationError.includes('Name') && (
                <div className="form-message">{validationError}</div>
              )}
            </div>
            
            <div className="form-field">
              <label htmlFor="email">Email</label>
              <div className="input-container">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="johndoe@example.com"
                  required
                  autoComplete="email"
                />
              </div>
              {validationError && validationError.includes('email') && (
                <div className="form-message">{validationError}</div>
              )}
            </div>
            
            <div className="form-field">
              <label htmlFor="password">Password</label>
              <div className="input-container">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="******"
                  required
                  autoComplete="new-password"
                />
                <button 
                  type="button" 
                  className="password-toggle text-button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{ backgroundColor: "white", color: "#0b9748" }}
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
              {validationError && validationError.includes('Password must be') && (
                <div className="form-message">{validationError}</div>
              )}
              {!validationError && (
                <div className="password-hint">Password must be at least 6 characters</div>
              )}
            </div>
            
            <div className="form-field">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-container">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="******"
                  required
                  autoComplete="new-password"
                />
                <button 
                  type="button" 
                  className="password-toggle text-button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  style={{ backgroundColor: "white", color: "#0b9748" }}
                >
                  {showConfirmPassword ? "HIDE" : "SHOW"}
                </button>
              </div>
              {validationError && validationError.includes('match') && (
                <div className="form-message">{validationError}</div>
              )}
            </div>
            
            <div className="form-field">
              <label>I am a:</label>
              <div className="account-type-selector">
                <div 
                  className={`account-option ${accountType === 'driver' ? 'active' : ''}`}
                  onClick={() => setAccountType('driver')}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                  </svg>
                  <span>EV Driver</span>
                </div>
                
                <div 
                  className={`account-option ${accountType === 'host' ? 'active' : ''}`}
                  onClick={() => setAccountType('host')}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                  <span>Charging Host</span>
                </div>
              </div>
            </div>
            
            <div className="form-field checkbox-field">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={() => setAgreeToTerms(!agreeToTerms)}
                  required
                />
                <span className="checkbox-text">
                  I agree to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>
                </span>
              </label>
              {validationError && validationError.includes('agree') && (
                <div className="form-message">{validationError}</div>
              )}
            </div>
            
            <button 
              type="submit" 
              className="auth-button primary"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Register'}
            </button>
            
            <div className="auth-divider">
              <span>OR</span>
            </div>
            
            <button 
              type="button" 
              className="auth-button google-button secondary"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.61z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </form>
          
          <div className="auth-footer">
            <p>Already have an account? <Link to="/login">Login</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
