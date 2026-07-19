import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

/**
 * Supabase client for use in Client Components (browser).
 * Uses the public anon key; all sensitive access is gated by Row Level Security.
 */
export function createClient() {
  return createBrowserClient(env.supabaseUrl, env.supabaseAnonKey);
}
