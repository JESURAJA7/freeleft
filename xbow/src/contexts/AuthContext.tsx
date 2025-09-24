import React, { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { authAPI } from '../services/api';
import type { User } from '../types/index';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: any) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = Cookies.get('xbow_token');
      //console.log('Auth check token:', token);
      const userData = Cookies.get('xbow_user');
      
      if (token && userData) {
        setUser(JSON.parse(userData));
        await refreshUser();
      }
    } catch (error) {
      console.error('Auth check error:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await authAPI.login({ email, password });
      
      if (response.data.success) {
        const { token, user: userData } = response.data;
        
        Cookies.set('xbow_token', token, { expires: 7 });
        console.log('token after login:', token);
        Cookies.set('xbow_user', JSON.stringify(userData), { expires: 7 });
        setUser(userData);
        
        toast.success('Login successful!');
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || 'Login failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await authAPI.register(userData);
      
      if (response.data.success) {
        const { token, user: newUser } = response.data;
        
        Cookies.set('xbow_token', token, { expires: 7 });
        Cookies.set('xbow_user', JSON.stringify(newUser), { expires: 7 });
        setUser(newUser);
        
        toast.success('Registration successful!');
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.message || 'Registration failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    Cookies.remove('xbow_token');
    Cookies.remove('xbow_user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const refreshUser = async () => {
    try {
      const response = await authAPI.getProfile();
      if (response.data.success) {
        const userData = response.data.user;
        Cookies.set('xbow_user', JSON.stringify(userData), { expires: 7 });
        setUser(userData);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
      logout();
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      login,
      register,
      logout,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};