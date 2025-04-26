import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../services/firebase/config';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Create the AuthContext
const AuthContext = createContext();

/**
 * useAuth Hook:
 * Custom hook to use the AuthContext.
 * @returns {Object} - The authentication context value.
 */
export function useAuth() {
  return useContext(AuthContext);
}

/**
 * AuthProvider Component:
 * Provides the authentication context to the application.
 * It manages the user's authentication state and provides methods for login, signup, and logout.
 */
export function AuthProvider({ children }) {
  // State to hold the current user
  const [currentUser, setCurrentUser] = useState(null);
  // State to hold the user type (e.g., driver, admin)
  const [userType, setUserType] = useState(null);
  // State to indicate if the authentication state is being loaded
  const [loading, setLoading] = useState(true);

  /**
   * Signup Function:
   * Creates a new user with the given email and password using Firebase authentication.
   * Also creates a user document in Firestore with additional user information.
   * @param {string} email - The user's email address.
   * @param {string} password - The user's password.
   * @param {string} type - The type of user (default is 'driver').
   * @returns {Promise} - A promise that resolves after the user is successfully created.
   */
  const signup = async (email, password, type = 'driver') => {
    try {
      // Create auth user
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;
      
      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email,
        userType: type,
        createdAt: new Date().toISOString(),
      });
      
      setUserType(type);
      return user;
    } catch (error) {
      console.error('Error in signup:', error);
      throw error;
    }
  };

  /**
   * Login Function:
   * Signs in an existing user with the given email and password using Firebase authentication.
   * Retrieves the user type from Firestore after successful login.
   * @param {string} email - The user's email address.
   * @param {string} password - The user's password.
   * @returns {Promise} - A promise that resolves after the user is successfully signed in.
   */
  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;
      
      // Get user type from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setUserType(userDoc.data().userType);
      }
      
      return user;
    } catch (error) {
      console.error('Error in login:', error);
      throw error;
    }
  };

  /**
   * Logout Function:
   * Signs out the current user using Firebase authentication.
   * Resets the user type to null after successful logout.
   * @returns {Promise} - A promise that resolves after the user is successfully signed out.
   */
  const logout = async () => {
    try {
      await signOut(auth);
      setUserType(null);
    } catch (error) {
      console.error('Error in logout:', error);
      throw error;
    }
  };

  // UseEffect hook to subscribe to authentication state changes
  useEffect(() => {
    // Firebase method that returns an unsubscribe function when the component unmounts
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user); // Set the current user
      
      if (user) {
        // Get user data from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserType(userDoc.data().userType);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
      
      setLoading(false); // Set loading to false once the user is loaded
    });
    
    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  // Context value object that will be provided to all consumers
  const value = {
    currentUser,
    userType,
    signup,
    login,
    logout,
  };

  // Provide the authentication context to the children components
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
