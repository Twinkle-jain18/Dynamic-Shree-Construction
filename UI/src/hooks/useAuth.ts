import { useState, useEffect, useCallback } from 'react';
import { verifyToken } from '@/lib/api';

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      setIsAuthenticated(false);
      return;
    }
    verifyToken().then((valid) => setIsAuthenticated(valid));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('admin_token');
    setIsAuthenticated(false);
  }, []);

  const login = useCallback((token: string) => {
    localStorage.setItem('admin_token', token);
    setIsAuthenticated(true);
  }, []);

  return { isAuthenticated, login, logout };
}
