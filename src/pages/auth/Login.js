import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { signInWithGoogle } from '../../services/firebase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faEye, faEyeSlash, faSpinner } from '@fortawesome/free-solid-svg-icons';
import './AuthPages.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setGoogleLoading(false);
    setError('');
    try {
      await login(email, password);
      navigate('/driver');
    } catch (err) {
      setError('Failed to log in. Please check your credentials.');
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
      setError('Failed to log in with Google.');
      console.error(err);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Welcome Back!</h2>
          <p>Log in to access your EV charging account.</p>
        </div>

        {error && <div className="auth-error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
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
          
          <div className="auth-options">
            <div className="remember-me">
              <input type="checkbox" id="remember" />
              <label htmlFor="remember">Remember me</label>
            </div>
            <Link to="/forgot-password" className="forgot-link">Forgot Password?</Link>
          </div>
          
          <button 
            type="submit" 
            className="auth-button primary" 
            disabled={loading || googleLoading}
          >
            {loading ? <FontAwesomeIcon icon={faSpinner} spin /> : 'Login'}
          </button>
          
          <div className="separator"><span>OR</span></div>
          
          <button
            type="button"
            className="auth-button google-sign-in-button"
            disabled={loading || googleLoading}
            onClick={handleGoogleSignIn}
          >
            {googleLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : <img src="/images/google-logo.svg" alt="Google Logo" className="google-icon" />}
            Sign in with Google
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/signup" className="auth-link">Sign up</Link></p>
          <Link to="/" className="auth-link home-link">← Back to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
