// Improve error handling in AuthContext

import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth } from '../services/firebase/config';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail 
} from 'firebase/auth';

// Create the auth context
const AuthContext = createContext();

// Custom hook to use the auth context
export function useAuth() {
  return useContext(AuthContext);
}

/**
 * AuthProvider Component with improved error handling
 */
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  
  /**
   * Signup Function with enhanced error handling
   */
  async function signup(email, password) {
    try {
      setAuthError("");
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      localStorage.setItem('authUser', JSON.stringify({
        uid: userCredential.user.uid,
        email: userCredential.user.email
      }));
      return userCredential;
    } catch (error) {
      console.error("Signup error:", error.message);
      // Provide more user-friendly error messages
      if (error.code === 'auth/email-already-in-use') {
        setAuthError("This email is already registered. Try logging in instead.");
      } else if (error.code === 'auth/invalid-email') {
        setAuthError("Please enter a valid email address.");
      } else if (error.code === 'auth/weak-password') {
        setAuthError("Password should be at least 6 characters.");
      } else if (error.code === 'auth/network-request-failed') {
        setAuthError("Network error. Please check your connection and try again.");
      } else if (error.code === 'auth/api-key-not-valid') {
        setAuthError("Authentication service unavailable. Please try again later.");
      } else {
        setAuthError(error.message || "Failed to create account. Please try again.");
      }
      throw error;
    }
  }
  
  /**
   * Login Function with enhanced error handling
   */
  async function login(email, password) {
    try {
      setAuthError("");
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      localStorage.setItem('authUser', JSON.stringify({
        uid: userCredential.user.uid,
        email: userCredential.user.email
      }));
      return userCredential;
    } catch (error) {
      console.error("Login error:", error.message);
      // Provide more user-friendly error messages
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setAuthError("Invalid email or password. Please try again.");
      } else if (error.code === 'auth/too-many-requests') {
        setAuthError("Too many failed attempts. Please try again later.");
      } else if (error.code === 'auth/network-request-failed') {
        setAuthError("Network error. Please check your connection and try again.");
      } else if (error.code === 'auth/api-key-not-valid') {
        setAuthError("Authentication service unavailable. Please try again later.");
      } else {
        setAuthError(error.message || "Failed to sign in. Please try again.");
      }
      throw error;
    }
  }

  /**
   * Google Sign In with enhanced error handling
   */
  async function signInWithGoogle() {
    try {
      setAuthError("");
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      localStorage.setItem('authUser', JSON.stringify({
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL
      }));
      
      return result;
    } catch (error) {
      console.error("Google sign in error:", error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        setAuthError("Login cancelled. Please try again.");
      } else if (error.code === 'auth/popup-blocked') {
        setAuthError("Pop-up blocked. Please allow pop-ups for this site.");
      } else if (error.code === 'auth/api-key-not-valid') {
        setAuthError("Authentication service unavailable. Please try again later.");
      } else {
        setAuthError("Google sign-in failed. Please try another method.");
      }
      
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
      localStorage.removeItem('authUser');
    } catch (error) {
      console.error("Logout error:", error);
      setAuthError("Failed to log out. Please try again.");
    }
  }

  // Effect for auth state changes
  useEffect(() => {
    // Get saved user first
    const savedUser = localStorage.getItem('authUser');
    if (savedUser && !currentUser) {
      setCurrentUser(JSON.parse(savedUser));
    }

    // Set up auth state listener with error handling
    let unsubscribe = () => {};
    try {
      unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          setCurrentUser(user);
          localStorage.setItem('authUser', JSON.stringify({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || null,
            photoURL: user.photoURL || null
          }));
        } else {
          setCurrentUser(null);
          localStorage.removeItem('authUser');
        }
        setLoading(false);
      });
    } catch (error) {
      console.error("Auth state subscription error:", error);
      setLoading(false);
    }

    return unsubscribe;
  }, [currentUser]);

  // Provide value
  const value = {
    currentUser,
    authError,
    setAuthError,
    signup,
    login,
    signInWithGoogle,
    logout: async () => {
      try {
        await signOut(auth);
        localStorage.removeItem('authUser');
      } catch (error) {
        console.error("Logout error:", error);
        setAuthError("Failed to log out. Please try again.");
      }
    },
    sendPasswordReset: async (email) => {
      try {
        await sendPasswordResetEmail(auth, email);
      } catch (error) {
        console.error("Password reset error:", error);
        if (error.code === 'auth/user-not-found') {
          setAuthError("No account found with this email.");
        } else {
          setAuthError("Failed to send reset email. Please try again.");
        }
        throw error;
      }
    },
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
