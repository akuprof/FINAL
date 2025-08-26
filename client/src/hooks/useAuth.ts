
import { useEffect, useState } from "react";

interface AuthUser {
  id: string;
  email: string;
  role?: string;
  driverProfile?: any;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication status on mount
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/verify', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const { user } = await response.json();
        setUser(user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.warn('Error checking auth:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Set user immediately from login response
        setUser(data.user);
        return { data: { user: data.user }, error: null };
      } else {
        return { data: null, error: { message: data.message } };
      }
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error: { message: 'Network error' } };
    }
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, metadata }),
      });

      const data = await response.json();

      if (response.ok) {
        // Set user immediately from signup response
        setUser(data.user);
        return { data: { user: data.user }, error: null };
      } else {
        return { data: null, error: { message: data.message } };
      }
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error: { message: 'Network error' } };
    }
  };

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      setUser(null);
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error: { message: 'Network error' } };
    }
  };

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    signIn,
    signUp,
    signOut,
    checkAuth,
  };
}
