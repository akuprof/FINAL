
import type { Express, RequestHandler } from "express";
import { createServerClient } from '@supabase/ssr';
import { storage } from "./storage";
import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: '.env.local' });

// Supabase configuration using environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lcmxoxiafeeqjxbnwlic.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjbXhveGlhZmVlcWp4Ym53bGljIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjA2MTM3NiwiZXhwIjoyMDcxNjM3Mzc2fQ.CKaJnsgp4E5Xn-G99TPPeFhVCh2RlsaEorvlqRQpxDA'

// Create a server client for Express.js
export const createSupabaseServerClient = (req: any) => {
  return createServerClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        getAll() {
          return Object.entries(req.cookies || {}).map(([name, value]) => ({
            name,
            value: value as string,
          }));
        },
        setAll(cookiesToSet) {
          // In Express.js, we handle cookies through the response object
          // This is mainly for SSR compatibility - actual cookie setting
          // is done in the route handlers using res.cookie()
          cookiesToSet.forEach(({ name, value, options }) => {
            // Cookies will be set by the response object in route handlers
          });
        },
      },
    }
  );
};

export async function setupAuth(app: Express) {
  // No session middleware needed for Supabase
  console.log("Supabase auth setup complete");
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const supabase = createSupabaseServerClient(req);

  try {
    // Get session from cookies
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(session.access_token);
    
    if (userError || !user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Attach user to request
    (req as any).user = { claims: { sub: user.id } };
    
    return next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};
