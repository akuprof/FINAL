
import type { Express, RequestHandler } from "express";
import { createClient } from '@supabase/supabase-js';
import { storage } from "./storage";
import { config } from "dotenv";

// Load environment variables
config();

// For local development, allow missing Supabase credentials
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("⚠️  Supabase credentials not set. Auth will be disabled for local development.");
}

const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  : null;

export async function setupAuth(app: Express) {
  // No session middleware needed for Supabase
  console.log("Supabase auth setup complete");
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
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
