
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

interface AuthUser extends User {
  role?: string;
  driverProfile?: any;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if Supabase is available
    if (!supabase.auth) {
      console.warn('Supabase auth not available, skipping authentication');
      setIsLoading(false);
      return;
    }

    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const authUser = session.user as AuthUser;
          // Fetch user profile to get role
          const { data: profile } = await supabase
            .from('users')
            .select('*, drivers(*)')
            .eq('id', authUser.id)
            .single();
          
          if (profile) {
            authUser.role = profile.role;
            authUser.driverProfile = profile.drivers?.[0];
          }
          setUser(authUser);
        }
      } catch (error) {
        console.warn('Error getting session:', error);
      }
      setIsLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (session?.user) {
          const authUser = session.user as AuthUser;
          // Fetch user profile to get role
          const { data: profile } = await supabase
            .from('users')
            .select('*, drivers(*)')
            .eq('id', authUser.id)
            .single();
          
          if (profile) {
            authUser.role = profile.role;
            authUser.driverProfile = profile.drivers?.[0];
          }
          setUser(authUser);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.warn('Error in auth state change:', error);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!supabase.auth) {
      return { data: null, error: { message: 'Auth not available' } };
    }
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    if (!supabase.auth) {
      return { data: null, error: { message: 'Auth not available' } };
    }
    return await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: metadata
      }
    });
  };

  const signOut = async () => {
    if (!supabase.auth) {
      return { error: null };
    }
    return await supabase.auth.signOut();
  };

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    signIn,
    signUp,
    signOut,
  };
}
