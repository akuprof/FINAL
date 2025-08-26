import { createBrowserClient } from '@supabase/ssr'

// Supabase configuration using environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://lcmxoxiafeeqjxbnwlic.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjbXhveGlhZmVlcWp4Ym53bGljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNjEzNzYsImV4cCI6MjA3MTYzNzM3Nn0.jbT_JYQxEaWQRz5QyLKkfQ_IoTwRjPCzxB7CuSySF08'

// Create Supabase client
export const supabase = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});