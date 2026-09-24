import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { getErrorMessage } from './api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [raw, token] = await Promise.all([AsyncStorage.getItem('user'), AsyncStorage.getItem('token')]);
        if (raw && token) setUser(JSON.parse(raw));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = async (token, userData) => {
    await AsyncStorage.multiSet([['token', token], ['user', JSON.stringify(userData)]]);
    setUser(userData);
  };

  const login = async (payload) => {
    const res = await api.post('/auth/login', payload);
    await persist(res.data.token, res.data.user);
    return res.data;
  };

  const register = async (payload) => {
    const res = await api.post('/auth/register', payload);
    await persist(res.data.token, res.data.user);
    return res.data;
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['token', 'user', 'onboarded']);
    setUser(null);
  };

  const updateUser = (patch) => setUser((u) => ({ ...u, ...patch }));

  const refreshProfile = async () => {
    try {
      const res = await api.get('/khach-hang/me');
      updateUser({ profile: res.data });
      return res.data;
    } catch (e) {
      throw getErrorMessage(e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, updateUser, refreshProfile, getErrorMessage }}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;