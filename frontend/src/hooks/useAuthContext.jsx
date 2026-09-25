import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getUser, getToken, isAuthenticated as checkAuth, logOut as doLogOut } from '../utils/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => getUser());
  const [authenticated, setAuthenticated] = useState(() => checkAuth());

  // Sync state when localStorage changes (e.g. after login/signup)
  const refreshAuth = useCallback(() => {
    setUser(getUser());
    setAuthenticated(checkAuth());
  }, []);

  useEffect(() => {
    // Listen for storage events from other tabs
    const handler = () => refreshAuth();
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [refreshAuth]);

  const logOut = useCallback(() => {
    doLogOut();
    setUser(null);
    setAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, authenticated, refreshAuth, logOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
