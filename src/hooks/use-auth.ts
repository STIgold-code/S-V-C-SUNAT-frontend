'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { User, LoginRequest, LoginResponse, RegisterRequest } from '@/types';

const TOKEN_KEY = 'svc_sunat_token';
const USER_KEY = 'svc_sunat_user';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load auth state from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const response = await api.post<LoginResponse>('/auth/login', data);

    localStorage.setItem(TOKEN_KEY, response.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));

    setToken(response.access_token);
    setUser(response.user);

    router.push('/');
    return response;
  }, [router]);

  const register = useCallback(async (data: RegisterRequest) => {
    const response = await api.post<LoginResponse>('/auth/register', data);

    localStorage.setItem(TOKEN_KEY, response.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.user));

    setToken(response.access_token);
    setUser(response.user);

    router.push('/');
    return response;
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    router.push('/login');
  }, [router]);

  const isAuthenticated = !!token && !!user;

  return {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
  };
}
