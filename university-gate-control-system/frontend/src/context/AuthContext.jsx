import React, { createContext, useState, useContext, useEffect } from 'react';
import { apiService } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    // Check if user is logged in on mount
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
      // Optionally validate token by fetching profile
      loadUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUserProfile = async () => {
    try {
      const response = await apiService.auth.getProfile();
      setUser(response.data.data);
    } catch (error) {
      console.error('Failed to load user profile:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await apiService.auth.login({ email, password });
      const { token: authToken, user: userData } = response.data.data;

      localStorage.setItem('token', authToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setToken(authToken);
      setUser(userData);

      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await apiService.auth.register(userData);
      return { success: true, message: response.data.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      return { success: false, message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    
    // Call logout API (don't wait for it)
    apiService.auth.logout().catch(console.error);
  };

  const hasRole = (roles) => {
    if (!user || !user.roles) return false;
    return roles.some(role => user.roles.includes(role));
  };

  const hasPermission = (permission) => {
    if (!user || !user.permissions) return false;
    return user.permissions.some(p => p.name === permission);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    hasRole,
    hasPermission,
    isAuthenticated: !!token && !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
