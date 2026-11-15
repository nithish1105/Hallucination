import { useState } from 'react';
import { authApi, getApiErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/lib/safeToast';

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login: storeLogin, logout: storeLogout } = useAuthStore();

  const login = async (data: { email: string; password: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authApi.login(data);
      // Backend returns: { access_token, refresh_token, token_type, user }
      const { access_token, user } = res.data;
      storeLogin(access_token, user);
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', access_token);
      }
      toast.success('Welcome back!');
      return true;
    } catch (error: unknown) {
      const msg = getApiErrorMessage(error);
      setError(msg);
      toast.error(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: { name: string; email: string; password: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      await authApi.signup(data);
      toast.success('Account created! You can now sign in.');
      return true;
    } catch (error: unknown) {
      const msg = getApiErrorMessage(error);
      setError(msg);
      toast.error(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore logout API errors — clear client state regardless
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
    storeLogout();
    toast.success('Logged out successfully');
  };

  return { login, signup, logout, isLoading, error };
}
