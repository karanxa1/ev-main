import React, { createContext, useState, useEffect, useContext } from 'react';
import { 
  auth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from '../firebase';

// Create the auth context
const AuthContext = createContext();

// Custom hook to use the auth context
export function useAuth() {
  return useContext(AuthContext);
}

/**
 * AuthProvider Component:
 * Provides authentication state and methods to the application.
 * Uses localStorage to persist authentication between page reloads and browser navigation.
 */
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  
  /**
   * Signup Function:
   * Creates a new user account with email and password
   */
  async function signup(email, password) {
    try {
      setAuthError("");
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Store user authentication in localStorage for persistence
      localStorage.setItem('authUser', JSON.stringify({
        uid: userCredential.user.uid,
        email: userCredential.user.email
      }));
      return userCredential;
    } catch (error) {
      console.error("Signup error:", error.message);
      setAuthError(error.message);
      throw error;
    }
  }
  
  /**
   * Login Function:
   * Signs in an existing user
   */
  async function login(email, password) {
    try {
      setAuthError("");
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Store user authentication in localStorage for persistence
      localStorage.setItem('authUser', JSON.stringify({
        uid: userCredential.user.uid,
        email: userCredential.user.email
      }));
      return userCredential;
    } catch (error) {
      console.error("Login error:", error.message);
      setAuthError(error.message);
      throw error;
    }
  }

  /**
   * Google Sign In Function:
   * Signs in using Google authentication
   */
  async function signInWithGoogle() {
    try {
      setAuthError("");
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Store user data in localStorage
      localStorage.setItem('authUser', JSON.stringify({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL
      }));
      
      return result;
    } catch (error) {
      console.error("Google sign in error:", error.message);
      setAuthError(error.message);
      throw error;
    }
  }

  /**
   * Send Password Reset Email Function:
   * Sends a password reset email to the user
   */
  async function sendPasswordReset(email) {
    try {
      setAuthError("");
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Password reset error:", error.message);
      setAuthError(error.message);
      throw error;
    }
  }
  
  /**
   * Logout Function:
   * Signs out the current user
   */
  async function logout() {
    try {
      await signOut(auth);
      // Remove user data from localStorage
      localStorage.removeItem('authUser');
    } catch (error) {
      console.error("Logout error:", error.message);
      setAuthError(error.message);
      throw error;
    }
  }

  // Effect to listen to auth state changes and handle persistence
  useEffect(() => {
    // First check localStorage for existing session
    const savedUser = localStorage.getItem('authUser');
    if (savedUser && !currentUser) {
      setCurrentUser(JSON.parse(savedUser));
    }

    // Then set up Firebase auth listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in
        setCurrentUser(user);
        localStorage.setItem('authUser', JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL
        }));
      } else {
        // User is signed out
        setCurrentUser(null);
        localStorage.removeItem('authUser');
      }
      setLoading(false);
    });

    // Cleanup subscription
    return unsubscribe;
  }, [currentUser]);

  // Context value
  const value = {
    currentUser,
    authError,
    setAuthError,
    signup,
    login,
    signInWithGoogle,
    sendPasswordReset,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
