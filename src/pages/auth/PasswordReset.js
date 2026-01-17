import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../../services/firebase/config';
import './Login.css';

/**
 * PasswordReset Component:
 * Handles password reset confirmation from email links
 */
const PasswordReset = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get URL parameters
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');
  
  // Component state
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Verify the password reset code when component mounts
  useEffect(() => {
    const verifyCode = async () => {
      // Handle both 'resetPassword' and 'action' modes for compatibility
      if ((mode !== 'resetPassword' && mode !== 'action') || !oobCode) {
        setError('Invalid password reset link. Please request a new password reset.');
        setVerifying(false);
        return;
      }

      try {
        // Verify the password reset code and get the email
        const userEmail = await verifyPasswordResetCode(auth, oobCode);
        setEmail(userEmail);
        setVerifying(false);
      } catch (error) {
        console.error('Error verifying password reset code:', error);
        if (error.code === 'auth/expired-action-code') {
          setError('This password reset link has expired. Please request a new one.');
        } else if (error.code === 'auth/invalid-action-code') {
          setError('This password reset link is invalid. Please request a new one.');
        } else {
          setError('Failed to verify password reset link. Please try again.');
        }
        setVerifying(false);
      }
    };

    verifyCode();
  }, [mode, oobCode]);

  // Handle password reset form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate passwords
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      // Confirm the password reset
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccess(true);
      
      // Redirect to login after a delay
      setTimeout(() => {
        navigate('/login', { 
          state: { message: 'Password reset successful! Please log in with your new password.' }
        });
      }, 3000);
    } catch (error) {
      console.error('Password reset error:', error);
      if (error.code === 'auth/expired-action-code') {
        setError('This password reset link has expired. Please request a new one.');
      } else if (error.code === 'auth/invalid-action-code') {
        setError('This password reset link is invalid. Please request a new one.');
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak. Please choose a stronger password.');
      } else {
        setError('Failed to reset password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while verifying
  if (verifying) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="card-header">
            <h2 className="card-title">Verifying Reset Link</h2>
            <p className="card-description">Please wait while we verify your password reset link...</p>
          </div>
          <div className="loading-spinner">Loading...</div>
        </div>
      </div>
    );
  }

  // Show success state
  if (success) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="card-header">
            <h2 className="card-title">Password Reset Successful!</h2>
            <p className="card-description">Your password has been updated successfully.</p>
          </div>
          <div className="auth-success">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>Redirecting to login page...</span>
          </div>
        </div>
      </div>
    );
  }

  // Show error state or password reset form
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="card-header">
          <h2 className="card-title">Reset Your Password</h2>
          <p className="card-description">
            {email ? `Enter a new password for ${email}` : 'Enter your new password'}
          </p>
        </div>

        {error && (
          <div className="auth-error">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Show form only if we have a valid code and no error */}
        {!error && email && (
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-field">
              <label htmlFor="newPassword">New Password</label>
              <div className="input-container">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
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
            </div>

            <div className="form-field">
              <label htmlFor="confirmPassword">Confirm New Password</label>
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
                  placeholder="Confirm new password"
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
            </div>

            <button 
              type="submit" 
              className="auth-button primary"
              disabled={loading}
            >
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        )}

        {/* Show link to login if there's an error */}
        {error && (
          <div className="auth-footer">
            <p>
              <Link to="/login">Back to Login</Link> | 
              <Link to="/login" onClick={() => {/* Open forgot password modal */}}>Request New Reset</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PasswordReset; 