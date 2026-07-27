'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/lib/types';
import { authApi } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi.getMe()
      .then((data) => {
        setUser(data);
        localStorage.setItem('atendeti_user', JSON.stringify(data));
      })
      .catch(() => {
        const savedUser = localStorage.getItem('atendeti_user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (email: string, senha: string) => {
    const res = await authApi.login(email, senha);
    localStorage.setItem('atendeti_user', JSON.stringify(res.user));
    setUser(res.user);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('atendeti_user');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
