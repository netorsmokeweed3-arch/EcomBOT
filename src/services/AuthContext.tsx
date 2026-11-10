// src/services/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV();
const TOKEN_KEY = 'auth_jwt_token';
const USER_KEY = 'auth_user_data';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  isLoading: true,
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const savedToken = storage.getString(TOKEN_KEY);
      const savedUser = storage.getString(USER_KEY);
      if (savedToken) setToken(savedToken);
      if (savedUser) setUser(JSON.parse(savedUser));
    } catch (e) {
      console.error('[AuthContext Init Error]', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (newToken: string, newUser: User) => {
    try {
      storage.set(TOKEN_KEY, newToken);
      storage.set(USER_KEY, JSON.stringify(newUser));
      setToken(newToken);
      setUser(newUser);
    } catch (e) {
      console.error('[Auth Login Error]', e);
    }
  };

  const logout = () => {
    try {
      storage.remove(TOKEN_KEY);
      storage.remove(USER_KEY);
      setToken(null);
      setUser(null);
    } catch (e) {
      console.error('[Auth Logout Error]', e);
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);