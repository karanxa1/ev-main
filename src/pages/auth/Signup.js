import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { signInWithGoogle } from '../../services/firebase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEnvelope, faLock, faEye, faEyeSlash, faSpinner } from '@fortawesome/free-solid-svg-icons';
import './AuthPages.css';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    
    setLoading(true);
    setGoogleLoading(false);
    setError('');
    try {
      await signup(email, password, username);
      navigate('/driver');
    } catch (err) {
      setError('Failed to create an account. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setLoading(false);
    setError('');
    try {
      await signInWithGoogle();
      navigate('/driver');
    } catch (err) {
      setError('Failed to sign up with Google.');
      console.error(err);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Create Your Account</h2>
          <p>Join the EV charging network today!</p>
        </div>

        {error && <div className="auth-error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group with-icon">
            <span className="input-icon"><FontAwesomeIcon icon={faUser} /></span>
            <input 
              type="text" 
              id="username"
              placeholder="Username" 
              required 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              aria-label="Username"
            />
          </div>
          
          <div className="input-group with-icon">
            <span className="input-icon"><FontAwesomeIcon icon={faEnvelope} /></span>
            <input 
              type="email" 
              id="email"
              placeholder="Email Address" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Email Address"
            />
          </div>
          
          <div className="input-group with-icon password-group">
            <span className="input-icon"><FontAwesomeIcon icon={faLock} /></span>
            <input 
              type={showPassword ? 'text' : 'password'}
              id="password"
              placeholder="Password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-label="Password"
            />
            <button 
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
            </button>
          </div>
          
          <div className="input-group with-icon password-group">
            <span className="input-icon"><FontAwesomeIcon icon={faLock} /></span>
            <input 
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirm-password"
              placeholder="Confirm Password" 
              required 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              aria-label="Confirm Password"
            />
            <button 
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              <FontAwesomeIcon icon={showConfirmPassword ? faEyeSlash : faEye} />
            </button>
          </div>
          
          <button 
            type="submit" 
            className="auth-button primary" 
            disabled={loading || googleLoading}
          >
            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Sign Up'}
          </button>
          
          <div className="separator"><span>OR</span></div>
          
          <button
            type="button"
            className="auth-button google-sign-in-button"
            disabled={loading || googleLoading}
            onClick={handleGoogleSignIn}
          >
            {googleLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : <img src="/images/google-logo.svg" alt="Google Logo" className="google-icon" />}
            Sign up with Google
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login" className="auth-link">Login</Link></p>
          <Link to="/" className="auth-link home-link">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
