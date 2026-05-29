'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import API from '../utils/api';
import { User } from '../types';

interface AuthContextProps {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, role?: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load token and user on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
          setToken(storedToken);
          const response = await API.get('/auth/me');
          setUser(response.data.user);
        }
      } catch (error) {
        console.warn('No active session on mount (guest mode).');
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    setLoading(true);
    try {
      const response = await API.post('/auth/login', { email, password });
      const { token: userToken, user: userData } = response.data;
      
      localStorage.setItem('token', userToken);
      setToken(userToken);
      setUser(userData);
      
      // Navigate based on role
      if (userData.role === 'Borrower') {
        router.push('/portal');
      } else {
        router.push('/dashboard');
      }
      
      return userData;
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, role?: string): Promise<User> => {
    setLoading(true);
    try {
      const response = await API.post('/auth/register', { name, email, password, role });
      const { token: userToken, user: userData } = response.data;

      localStorage.setItem('token', userToken);
      setToken(userToken);
      setUser(userData);

      if (userData.role === 'Borrower') {
        router.push('/portal');
      } else {
        router.push('/dashboard');
      }

      return userData;
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  const refreshUser = async (): Promise<User | null> => {
    try {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) return null;

      const response = await API.get('/auth/me');
      setUser(response.data.user);
      return response.data.user;
    } catch (error) {
      console.warn('Failed to refresh user profile:', error);
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
