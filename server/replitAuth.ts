
import type { Express, RequestHandler } from "express";
import { createServerClient } from '@supabase/ssr';
import { storage } from "./storage";
import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: '.env.local' });

// For local development, allow missing Supabase credentials
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("⚠️  Supabase credentials not set. Auth will be disabled for local development.");
}

// Create a server client for Express.js
export const createSupabaseServerClient = (req: any) => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
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
  
  // For local development without Supabase, allow all requests
  if (!supabase) {
    console.warn("⚠️  Auth disabled for local development");
    (req as any).user = { claims: { sub: 'local-dev-user' } };
    return next();
  }

  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.substring(7);
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
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
