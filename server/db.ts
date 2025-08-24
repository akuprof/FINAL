
import { createClient } from '@supabase/supabase-js'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from "@shared/schema";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set",
  );
}

// For Drizzle ORM with direct PostgreSQL connection
const connectionString = `${process.env.SUPABASE_URL}/rest/v1/rpc/pg_connection_string`;
const client = postgres(process.env.DATABASE_URL || connectionString, { max: 1 });
export const db = drizzle(client, { schema });

// For Supabase client operations
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
