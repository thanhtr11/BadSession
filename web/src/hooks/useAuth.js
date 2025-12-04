/**
 * useAuth Hook
 * Manages authentication state and user data
 * Handles login/logout and token management
 */

import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS } from '../config/constants';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize authentication on mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
        const userData = localStorage.getItem(STORAGE_KEYS.USER);

        // Validate stored data
        if (token && userData && userData !== 'undefined' && userData.trim().length > 0) {
          try {
            const parsedUser = JSON.parse(userData);
            setUser(parsedUser);
            setIsAuthenticated(true);
          } catch (parseError) {
            console.error('Failed to parse user data:', parseError);
            clearAuth();
          }
        } else {
          clearAuth();
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Clears all auth data
  const clearAuth = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  // Login handler
  const login = useCallback((token, userData) => {
    try {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
      setError(null);
    } catch (err) {
      console.error('Error during login:', err);
      setError('Failed to save authentication data');
      clearAuth();
    }
  }, [clearAuth]);

  // Logout handler
  const logout = useCallback(() => {
    clearAuth();
    setError(null);
  }, [clearAuth]);

  // Get stored token
  const getToken = useCallback(() => {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  }, []);

  // Check if user has specific role
  const hasRole = useCallback((role) => {
    return user?.role === role;
  }, [user]);

  // Check if user has any of the given roles
  const hasAnyRole = useCallback((roles) => {
    return roles.includes(user?.role);
  }, [user]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    getToken,
    hasRole,
    hasAnyRole,
    clearAuth
  };
};

export default useAuth;
