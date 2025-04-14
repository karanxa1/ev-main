import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../services/firebase/config';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);

  // Signup function
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

  // Login function
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

  // Logout function
  const logout = async () => {
    try {
      await signOut(auth);
      setUserType(null);
    } catch (error) {
      console.error('Error in logout:', error);
      throw error;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
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
      
      setLoading(false);
    });
    
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userType,
    signup,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
