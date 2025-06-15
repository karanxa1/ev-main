import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Login.css'; // Using the same CSS file

/**
 * Signup Component:
 * A modern, card-based sign up form with validation and error handling.
 * Optimized for Vercel deployment.
 */
const Signup = () => {
  // Navigation hooks
  const navigate = useNavigate();
  
  // Auth context
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
  /* useEffect(() => {
    if (currentUser) {
      navigate(accountType === 'driver' ? '/driver' : '/host');
    }
  }, [currentUser, navigate, accountType]); */

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

  // Add error handling specifically for deployment environments
  const handleError = (error) => {
    console.error('Authentication error:', error);
    
    // Handle different error types with user-friendly messages
    if (error.code === 'auth/network-request-failed') {
      setValidationError('Network error. Please check your connection and try again.');
    } else if (error.code === 'auth/email-already-in-use') {
      setValidationError('This email is already registered. Please try logging in instead.');
    } else {
      setValidationError(error.message || 'An error occurred during signup. Please try again.');
    }
  };

  /**
   * Handle form submission with improved error handling for production
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
      
      // Navigate based on account type
      navigate('/select-vehicle', { replace: true });
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle Google Sign In with improved error handling for production
   */
  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate('/select-vehicle', { replace: true });
    } catch (error) {
      handleError(error);
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
                  className="spaced-input"
                />
              </div>
              {validationError && validationError.includes('Name') && (
                <div className="form-message error">{validationError}</div>
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
                  placeholder="Enter your email address"
                  required
                  autoComplete="email"
                  className="spaced-input"
                />
              </div>
              {validationError && validationError.includes('email') && (
                <div className="form-message error">{validationError}</div>
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
                  placeholder="Create a strong password"
                  required
                  autoComplete="new-password"
                  className="spaced-input"
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
                <div className="form-message error">{validationError}</div>
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
                  placeholder="Confirm your password"
                  required
                  autoComplete="new-password"
                  className="spaced-input"
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
                <div className="form-message error">{validationError}</div>
              )}
            </div>
            
            <div className="form-field">
              <label htmlFor="accountType">Account Type</label>
              <div className="input-container">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                <select
                  id="accountType"
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  className="spaced-input"
                  required
                >
                  <option value="driver">EV Driver</option>
                  <option value="host">Station Host</option>
                </select>
              </div>
            </div>
            
            <div className="form-field">
              <div className="terms-checkbox">
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  required
                />
                <label htmlFor="agreeToTerms">
                  I agree to the <Link to="/terms-and-conditions" target="_blank">Terms & Conditions</Link> and <Link to="/privacy-policy" target="_blank">Privacy Policy</Link>
                </label>
              </div>
              {validationError && validationError.includes('terms') && (
                <div className="form-message error">{validationError}</div>
              )}
            </div>
            
            <button 
              type="submit" 
              className="auth-button primary"
              disabled={loading || !agreeToTerms}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
          
          <div className="auth-divider">
            <span>OR</span>
          </div>
          
          <button 
            onClick={handleGoogleSignIn} 
            className="auth-button google"
            disabled={loading}
          >
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign up with Google
          </button>
          
          <div className="auth-footer">
            <p>Already have an account? <Link to="/login">Sign in</Link></p>
            <div className="legal-links">
              <Link to="/terms-and-conditions">Terms & Conditions</Link>
              <span className="separator">•</span>
              <Link to="/privacy-policy">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
