import React, { createContext, useState, useEffect, useCallback } from 'react';
import authService from '../api/authService';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('factoryflow_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('factoryflow_token'));
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('factoryflow_token');
    localStorage.removeItem('factoryflow_user');
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [logout]);

  useEffect(() => {
    async function verifyAuth() {
      const storedToken = localStorage.getItem('factoryflow_token');
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const profile = await authService.getMe();
        setUser(profile);
        localStorage.setItem('factoryflow_user', JSON.stringify(profile));
      } catch (err) {
        console.warn('Erreur vérification token:', err.message);
        logout();
      } finally {
        setIsLoading(false);
      }
    }

    verifyAuth();
  }, [logout]);

  const login = async (credentials) => {
    setIsLoading(true);
    try {
      const data = await authService.login(credentials);
      localStorage.setItem('factoryflow_token', data.token);
      localStorage.setItem('factoryflow_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: Boolean(token && user),
    isAdmin: user?.role === 'ADMIN',
    isOperator: user?.role === 'OPERATEUR',
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
