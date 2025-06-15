import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Login.css';
/**
 * Login Component:
 * A modern card-based login form with clean design and Google authentication option
 */
const Login = () => {
  // Navigation and location hooks
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/driver';
  const successMessage = location.state?.message;
  
  // Auth context
  const { login, signInWithGoogle, sendPasswordReset, currentUser, authError, setAuthError } = useAuth();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  // Clear errors when component mounts
  useEffect(() => {
    if (setAuthError) setAuthError('');
    // Check for saved email
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setForgotPasswordEmail(rememberedEmail);
    }
  }, [setAuthError]);

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      // If user is already logged in, always redirect to /driver as a sensible default dashboard.
      // This avoids potential loops if 'from' state is causing issues with PrivateRoute re-checks.
      console.log(`[Login.js] currentUser exists. Redirecting to /driver. Original 'from' was: ${from}`);
      navigate('/driver', { replace: true });
    }
  }, [currentUser, navigate]); // Removed 'from' from dependencies as we are overriding it

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      await login(email, password);
      // Navigate to the intended destination
      navigate(from, { replace: true });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle Google Sign In
   */
  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Google sign in error:', error);
      if (setAuthError) {
        setAuthError('Failed to sign in with Google. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle Forgot Password
   */
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!forgotPasswordEmail || forgotPasswordEmail.trim() === '') {
      if (setAuthError) setAuthError('Please enter your email address');
      return;
    }
    
    setLoading(true);
    try {
      await sendPasswordReset(forgotPasswordEmail);
      setResetSent(true);
      setShowForgotPasswordModal(false);
      if (setAuthError) setAuthError('');
    } catch (error) {
      console.error('Password reset error:', error);
      if (setAuthError) {
        setAuthError('Failed to send password reset email. Please check your email and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="card-header">
          <h2 className="card-title">Login</h2>
          <p className="card-description">Enter your email and password to login to your account</p>
        </div>
        
        {(resetSent || successMessage) && (
          <div className="auth-success">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 2,6"></polyline>
            </svg>
            <span>{successMessage || "Password reset email sent! Check your inbox."}</span>
          </div>
        )}
        
        {authError && (
          <div className="auth-error">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{authError}</span>
          </div>
        )}
        
        <div className="card-content">
          <form onSubmit={handleSubmit} className="login-form">
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
            </div>
            
            <div className="form-field">
              <div className="label-row">
                <label htmlFor="password">Password</label>
                <button 
                  type="button"
                  className="forgot-link"
                  onClick={() => {
                    setForgotPasswordEmail(email);
                    setShowForgotPasswordModal(true);
                  }}
                >
                  Forgot password?
                </button>
              </div>
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
                  autoComplete="current-password"
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
            </div>
            
            <button 
              type="submit" 
              className="auth-button primary"
              disabled={loading}
            >
              {loading ? (
                <div className="button-content">
                  <svg className="spinner" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="button-content">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                    <polyline points="10 17 15 12 10 7"></polyline>
                    <line x1="15" y1="12" x2="3" y2="12"></line>
                  </svg>
                  <span>Sign in</span>
                </div>
              )}
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
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          </form>
          
          <div className="auth-footer">
            <p>Don't have an account? <Link to="/signup">Sign up</Link></p>
            <div className="legal-links">
              <Link to="/terms-and-conditions">Terms & Conditions</Link>
              <span className="separator">•</span>
              <Link to="/privacy-policy">Privacy Policy</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Reset Password</h3>
              <button className="modal-close" onClick={() => setShowForgotPasswordModal(false)}>
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="modal-body">
              <p>Enter your email address and we'll send you a link to reset your password.</p>
              <div className="form-field">
                <label htmlFor="resetEmail">Email</label>
                <div className="input-container">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  <input
                    id="resetEmail"
                    type="email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="spaced-input"
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button 
                  className="auth-button secondary"
                  onClick={() => setShowForgotPasswordModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="auth-button primary"
                  onClick={handleForgotPassword}
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Reset Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;