import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'admin' | 'employee';
  position: string;
  workingHours?: {
    start: string;
    end: string;
  };
  timezone?: string;
  notificationSettings?: {
    email: boolean;
    inApp: boolean;
    push: boolean;
    newTask: boolean;
    statusChange: boolean;
    deadlineApproaching: boolean;
    comments: boolean;
    mentions: boolean;
  };
}

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  registerUser: (email: string, password: string, userData: Partial<UserData>) => Promise<void>;
  updateUserData: (data: Partial<UserData>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            setUserData(userDoc.data() as UserData);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Auto logout after 30 days of inactivity
  useEffect(() => {
    const lastActivity = localStorage.getItem('lastActivity');
    
    if (lastActivity) {
      const inactiveTime = Date.now() - parseInt(lastActivity);
      const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
      
      if (inactiveTime > thirtyDaysInMs) {
        signOut();
        localStorage.removeItem('lastActivity');
      }
    }
    
    const updateLastActivity = () => {
      localStorage.setItem('lastActivity', Date.now().toString());
    };
    
    // Update last activity on user interactions
    window.addEventListener('click', updateLastActivity);
    window.addEventListener('keypress', updateLastActivity);
    window.addEventListener('scroll', updateLastActivity);
    
    return () => {
      window.removeEventListener('click', updateLastActivity);
      window.removeEventListener('keypress', updateLastActivity);
      window.removeEventListener('scroll', updateLastActivity);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      localStorage.setItem('lastActivity', Date.now().toString());
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      localStorage.removeItem('lastActivity');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  };

  const registerUser = async (email: string, password: string, userData: Partial<UserData>) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      if (userData.displayName) {
        await updateProfile(user, {
          displayName: userData.displayName,
          photoURL: userData.photoURL || null
        });
      }
      
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName: userData.displayName || null,
        photoURL: userData.photoURL || null,
        role: userData.role || 'employee',
        position: userData.position || '',
        workingHours: userData.workingHours || { start: '09:00', end: '17:00' },
        timezone: userData.timezone || 'Europe/Prague',
        notificationSettings: userData.notificationSettings || {
          email: true,
          inApp: true,
          push: false,
          newTask: true,
          statusChange: true,
          deadlineApproaching: true,
          comments: true,
          mentions: true
        }
      });
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  };

  const updateUserData = async (data: Partial<UserData>) => {
    if (!currentUser) return;
    
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, data, { merge: true });
      
      // Update local state
      setUserData(prev => {
        if (!prev) return data as UserData;
        return { ...prev, ...data };
      });
      
      // Update profile if displayName or photoURL is provided
      if (data.displayName || data.photoURL) {
        await updateProfile(currentUser, {
          displayName: data.displayName || currentUser.displayName,
          photoURL: data.photoURL || currentUser.photoURL
        });
      }
    } catch (error) {
      console.error('Error updating user data:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    userData,
    loading,
    signIn,
    signOut,
    resetPassword,
    registerUser,
    updateUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
