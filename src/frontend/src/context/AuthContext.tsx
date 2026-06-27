import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import axios from 'axios';

interface User {
  id: number;
  username: string;
  email: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (username: string, password: string, email?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = '/crm/api';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    // Проверяем localStorage на наличие сохранённого токена
    return localStorage.getItem('token');
  });

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`);
      setUser(response.data);
    } catch {
      // Токен невалиден — очищаем
      setToken(null);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  const login = async (username: string, password: string, rememberMe: boolean = true) => {
    const response = await axios.post(`${API_URL}/auth/login`, { username, password });
    const { access_token } = response.data;
    setToken(access_token);
    if (rememberMe) {
      localStorage.setItem('token', access_token);
    }
  };

  const register = async (username: string, password: string, email?: string) => {
    await axios.post(`${API_URL}/auth/register`, { username, password, email });
    await login(username, password, true);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};