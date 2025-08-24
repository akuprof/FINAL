
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
    // Get initial session
    const getSession = async () => {
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
      setIsLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
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
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    return await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: metadata
      }
    });
  };

  const signOut = async () => {
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
