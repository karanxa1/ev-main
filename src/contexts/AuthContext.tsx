import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { auth, getUserData, registerUser, loginUser, logoutUser } from '../firebase/services';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthContextType {
  currentUser: User | null;
  userLoading: boolean;
  userProfile: any | null;
  userRole: string | null;
  signup: (email: string, password: string, role: 'driver' | 'host') => Promise<User>;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userLoading: true,
  userProfile: null,
  userRole: null,
  signup: async () => { throw new Error('Not implemented'); },
  login: async () => { throw new Error('Not implemented'); },
  logout: async () => { throw new Error('Not implemented'); }
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          const userData = await getUserData(user.uid);
          setUserProfile(userData);
          setUserRole(userData?.role || null);
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      } else {
        setUserProfile(null);
        setUserRole(null);
      }
      
      setUserLoading(false);
    });

    return unsubscribe;
  }, []);

  // Redirect based on user role
  useEffect(() => {
    if (!userLoading && currentUser && userRole) {
      const publicPaths = ['/login', '/signup', '/'];
      
      if (publicPaths.includes(location.pathname)) {
        // Redirect to appropriate dashboard based on role
        navigate(userRole === 'driver' ? '/driver' : '/host');
      }
    } else if (!userLoading && !currentUser && location.pathname !== '/signup') {
      // Redirect to login if not authenticated and not on signup page
      navigate('/login');
    }
  }, [userLoading, currentUser, userRole, location.pathname, navigate]);

  // Authentication functions
  const signup = async (email: string, password: string, role: 'driver' | 'host') => {
    const user = await registerUser(email, password, role);
    return user;
  };

  const login = async (email: string, password: string) => {
    const user = await loginUser(email, password);
    return user;
  };

  const logout = async () => {
    await logoutUser();
    navigate('/login');
  };

  const value = {
    currentUser,
    userLoading,
    userProfile,
    userRole,
    signup,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};