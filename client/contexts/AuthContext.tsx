import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, firebaseSignUp, firebaseSignIn, firebaseSignOut, onAuthStateChanged } from '@/lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';

const API_URL = import.meta.env.VITE_API_URL || '';

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  accessToken: string | null;
  isLoading: boolean;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return localStorage.getItem('accessToken');
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen to Firebase auth state
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // Get Firebase ID token
        try {
          const token = await fbUser.getIdToken();
          setAccessToken(token);
          localStorage.setItem('accessToken', token);
          
          // Set user from Firebase
          setUser({
            id: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            email: fbUser.email || '',
            avatarUrl: fbUser.photoURL || undefined,
          });
        } catch (error) {
          console.error('Error getting Firebase token:', error);
        }
      } else {
        setUser(null);
        setAccessToken(null);
        localStorage.removeItem('accessToken');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const fbUser = await firebaseSignIn(email, password);
    // Firebase auth state listener will handle the rest
  };

  const register = async (name: string, email: string, password: string) => {
    const fbUser = await firebaseSignUp(email, password, name);
    // Firebase auth state listener will handle the rest
  };

  const logout = async () => {
    await firebaseSignOut();
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('accessToken');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        accessToken,
        isLoading,
        authLoading: isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function getAccessToken(): string | null {
  return localStorage.getItem('accessToken');
}
