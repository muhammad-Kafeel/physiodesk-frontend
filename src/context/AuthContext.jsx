import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/services';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
  const [token,   setToken]   = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // On mount, verify token is still valid
  useEffect(() => {
    const verify = async () => {
      if (!token) { setLoading(false); return; }
      try {
        const res = await authAPI.me();
        setUser(res.data.data);
        localStorage.setItem('user', JSON.stringify(res.data.data));
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, []);

  const login = useCallback((userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('user',  JSON.stringify(userData));
    localStorage.setItem('token', authToken);
  }, []);

  const logout = useCallback(async () => {
    try { await authAPI.logout(); } catch {}
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }, []);

  const isAdmin   = () => user?.role === 'admin';
  const isDoctor  = () => user?.role === 'doctor';
  const isPatient = () => user?.role === 'patient';

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAdmin, isDoctor, isPatient }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
