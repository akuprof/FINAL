import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// For development, allow missing credentials with a warning
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  Supabase environment variables not found. Auth features will be disabled.');
  console.warn('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.');
}

// Create a mock client if credentials are missing
const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a mock client for development
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ data: null, error: { message: 'Auth disabled' } }),
        signUp: async () => ({ data: null, error: { message: 'Auth disabled' } }),
        signOut: async () => ({ error: null })
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) })
      })
    } as any;
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
};

export const supabase = createSupabaseClient();