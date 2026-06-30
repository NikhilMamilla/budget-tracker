import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

const normalizeUserPayload = (payload) => {
  if (!payload) return null;

  if (payload.user && typeof payload.user === 'object') {
    return payload.user;
  }

  if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
    if (payload.data.user && typeof payload.data.user === 'object') {
      return payload.data.user;
    }
    if ('name' in payload.data || 'email' in payload.data) {
      return payload.data;
    }
  }

  if (payload && typeof payload === 'object' && !Array.isArray(payload) && ('name' in payload || 'email' in payload)) {
    return payload;
  }

  return payload;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('aurax_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('aurax_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/profile');
          const profile = normalizeUserPayload(res);
          setUser(profile);
          localStorage.setItem('aurax_user', JSON.stringify(profile));
        } catch (err) {
          console.error('Session validation failed:', err);
          logout();
        }
      }
      setLoading(false);
    };
    verifySession();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const userPayload = normalizeUserPayload(res);
    const authToken = res?.token || res?.data?.token || null;
    const userData = userPayload?.user || userPayload || null;
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('aurax_user', JSON.stringify(userData));
    localStorage.setItem('aurax_token', authToken);
    return res;
  };

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password });
    const userPayload = normalizeUserPayload(res);
    const authToken = res?.token || res?.data?.token || null;
    const userData = userPayload?.user || userPayload || null;
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('aurax_user', JSON.stringify(userData));
    localStorage.setItem('aurax_token', authToken);
    return res;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('aurax_user');
    localStorage.removeItem('aurax_token');
  };

  const updateUser = (updatedData) => {
    setUser(updatedData);
    localStorage.setItem('aurax_user', JSON.stringify(updatedData));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
