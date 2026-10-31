import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('elms_user');
      return savedUser && savedUser !== 'undefined' ? JSON.parse(savedUser) : null;
    } catch (e) {
      localStorage.removeItem('elms_user');
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('elms_access_token');
      if (token) {
        try {
          const res = await api.get('/auth/profile');
          setUser(res.data.data.user);
          localStorage.setItem('elms_user', JSON.stringify(res.data.data.user));
        } catch (error) {
          logout();
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email, password, faceDescriptor = null) => {
    const payload = { email, password };
    if (faceDescriptor) payload.faceDescriptor = faceDescriptor;
    const res = await api.post('/auth/login', payload);

    if (res.data?.status === 'face_verification_required' || res.data?.requireFace) {
      return res.data;
    }

    const { user, accessToken, refreshToken } = res.data.data;
    localStorage.setItem('elms_access_token', accessToken);
    localStorage.setItem('elms_refresh_token', refreshToken);
    localStorage.setItem('elms_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Silently handle logout error
    } finally {
      localStorage.removeItem('elms_access_token');
      localStorage.removeItem('elms_refresh_token');
      localStorage.removeItem('elms_user');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
