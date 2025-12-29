import { createContext, useContext, useState, type ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from '../api/axios';

interface User {
  userId: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    return jwtDecode<User>(token);
  });

  const login = async (email: string, password: string) => {
    const res = await axios.post('/auth/login', {
      email,
      password,
    });

    const { token } = res.data;
    localStorage.setItem('token', token);
    setUser(jwtDecode<User>(token));
  };

  const register = async (
    username: string,
    email: string,
    password: string
  ) => {
    const res = await axios.post('/auth/register', {
      username,
      email,
      password,
    });

    const { token } = res.data;
    localStorage.setItem('token', token);
    setUser(jwtDecode<User>(token));
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};