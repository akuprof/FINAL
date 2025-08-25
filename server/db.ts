
import { createClient } from '@supabase/supabase-js'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from "@shared/schema";

// Default values for development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';
const databaseUrl = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/dbname';

// For Drizzle ORM with direct PostgreSQL connection
const client = postgres(databaseUrl, { max: 1 });
export const db = drizzle(client, { schema });

// For Supabase client operations
export const supabase = createClient(supabaseUrl, supabaseServiceKey);
