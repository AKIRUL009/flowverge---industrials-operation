import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { api } from '../utils/api';

interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
  phone_verified: boolean;
  phone?: string;
  language_preference?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null; // Legacy JWT only
  firebaseToken: string | null; // Firebase ID Token only
  authProvider: 'legacy' | 'firebase' | null;
  login: (token: string, user: User, provider?: 'legacy' | 'firebase') => void;
  logout: () => void;
  loading: boolean;
}

const isTokenExpired = (token: string): boolean => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const { exp } = JSON.parse(jsonPayload);
    if (!exp) return false;
    return Date.now() >= (exp * 1000 - 10000); // 10s buffer
  } catch (e) {
    return false;
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [firebaseToken, setFirebaseToken] = useState<string | null>(null);
  const [authProvider, setAuthProvider] = useState<'legacy' | 'firebase' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    const savedProvider = localStorage.getItem('authProvider') as 'legacy' | 'firebase' | null;

    if (savedToken && savedUser && savedProvider === 'legacy') {
      if (isTokenExpired(savedToken)) {
        console.warn('Saved JWT token is expired. Clearing auth session.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('authProvider');
        setToken(null);
        setFirebaseToken(null);
        setUser(null);
        setAuthProvider(null);
      } else {
        try {
          const parsedUser = JSON.parse(savedUser);
          if (parsedUser.role_name && !parsedUser.role) {
            parsedUser.role = parsedUser.role_name;
          }
          setToken(savedToken);
          setFirebaseToken(null);
          setUser(parsedUser);
          setAuthProvider('legacy');
        } catch (e) {
          console.error('Failed to parse saved user', e);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('authProvider');
        }
      }
      setLoading(false);
    } else if (savedProvider !== 'legacy') {
        // If not legacy, rely on Firebase to resolve session
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    const idToken = await firebaseUser.getIdToken();
                    const res = await api.get('/api/auth/firebase/verify', idToken);
                    const flowvergeUser = res?.user; 
                    
                    if (flowvergeUser) {
                        setToken(null);
                        setFirebaseToken(idToken);
                        setUser(flowvergeUser);
                        setAuthProvider('firebase');
                        localStorage.setItem('authProvider', 'firebase');
                    } else {
                        throw new Error('User not authorized in FLOWVERGE');
                    }
                } catch (err) {
                    console.error('Failed to restore Firebase session:', err);
                    setToken(null);
                    setFirebaseToken(null);
                    setUser(null);
                    setAuthProvider(null);
                    localStorage.removeItem('authProvider');
                }
            } else {
                if (localStorage.getItem('authProvider') === 'firebase' || !localStorage.getItem('authProvider')) {
                    setToken(null);
                    setFirebaseToken(null);
                    setUser(null);
                    setAuthProvider(null);
                    localStorage.removeItem('authProvider');
                }
            }
            setLoading(false);
        });
        
        return () => unsubscribe();
    } else {
        setLoading(false);
    }

    const handleUnauthorized = () => {
      setToken(null);
      setFirebaseToken(null);
      setUser(null);
      setAuthProvider(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('authProvider');
      signOut(auth).catch(console.error);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = (newToken: string, newUser: User, provider: 'legacy' | 'firebase' = 'legacy') => {
    if (provider === 'legacy') {
        setToken(newToken);
        setFirebaseToken(null);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
    } else {
        setToken(null);
        setFirebaseToken(newToken);
        localStorage.removeItem('token');
        localStorage.setItem('user', JSON.stringify(newUser));
    }
    
    setUser(newUser);
    setAuthProvider(provider);
    
    localStorage.setItem('authProvider', provider);
  };

  const logout = () => {
    setToken(null);
    setFirebaseToken(null);
    setUser(null);
    setAuthProvider(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('authProvider');
    if (authProvider === 'firebase') {
        signOut(auth).catch(console.error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, firebaseToken, authProvider, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
