import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState('driver'); // Add user type selection
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    
    try {
      setLoading(true);
      await signup(email, password, userType); // Pass userType to signup function
      navigate(userType === 'host' ? '/host' : '/driver');
    } catch (err) {
      setError(err.message || 'Failed to create an account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <h2>Sign Up</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>
        <div className="form-group">
          <label>Confirm Password</label>
          <input 
            type="password" 
            value={confirmPassword} 
            onChange={(e) => setConfirmPassword(e.target.value)} 
            required 
          />
        </div>
        <div className="form-group">
          <label>I am a:</label>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                value="driver"
                checked={userType === 'driver'}
                onChange={() => setUserType('driver')}
              />
              EV Driver
            </label>
            <label>
              <input
                type="radio"
                value="host"
                checked={userType === 'host'}
                onChange={() => setUserType('host')}
              />
              Charger Host
            </label>
          </div>
        </div>
        <button disabled={loading} type="submit">
          {loading ? "Signing up..." : "Sign Up"}
        </button>
      </form>
      <p>Already have an account? <a href="/login">Log in</a></p>
    </div>
  );
};

export default Signup;
