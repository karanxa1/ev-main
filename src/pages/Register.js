import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerWithEmailAndPassword, signInWithGoogle } from '../services/firebase';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await registerWithEmailAndPassword(email, password);
      navigate('/dashboard'); // Redirect after successful registration
    } catch (error) {
      console.error('Error registering:', error);
      // Handle error state appropriately
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      navigate('/dashboard'); // Redirect after successful registration
    } catch (error) {
      console.error('Error signing up with Google:', error);
      // Handle error state appropriately
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <h1>Register</h1>
      <form onSubmit={handleRegister} className="register-form">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className="register-button" disabled={loading}>
          Register
        </button>
      </form>
      
      <div className="separator">
        <span>OR</span>
      </div>
      
      <button 
        type="button"
        onClick={handleGoogleSignUp} 
        className="google-sign-in-button"
        disabled={loading}
      >
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" 
          alt="Google Logo" 
          className="google-icon" 
        />
        Sign up with Google
      </button>
      
      <p>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}

export default Register;