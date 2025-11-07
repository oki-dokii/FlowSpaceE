import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, firebaseSignUp, firebaseSignIn, firebaseSignOut, onAuthStateChanged } from '@/lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';

const API_URL = import.meta.env.VITE_API_URL || '';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  accessToken: string | null;
  isLoading: boolean;
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
        const token = await fbUser.getIdToken();
        setAccessToken(token);
        localStorage.setItem('accessToken', token);
        
        // Sync with backend
        await syncUserWithBackend(fbUser, token);
      } else {
        setUser(null);
        setAccessToken(null);
        localStorage.removeItem('accessToken');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const syncUserWithBackend = async (fbUser: FirebaseUser, token: string) => {
    try {
      // Register/login with backend using Firebase token
      const response = await fetch(`${API_URL}/api/auth/firebase-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          uid: fbUser.uid,
          email: fbUser.email,
          name: fbUser.displayName || fbUser.email?.split('@')[0],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error('Failed to sync with backend:', err);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      await firebaseSignUp(email, password, name);
      // onAuthStateChanged will handle the rest
    } catch (err: any) {
      throw new Error(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      await firebaseSignIn(email, password);
      // onAuthStateChanged will handle the rest
    } catch (err: any) {
      throw new Error(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut();
      setUser(null);
      setAccessToken(null);
      localStorage.removeItem('accessToken');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        accessToken,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!firebaseUser,
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
