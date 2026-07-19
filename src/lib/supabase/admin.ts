import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Service-role Supabase client — bypasses Row Level Security. SERVER ONLY.
 * Used for flows that aren't tied to a Supabase-authed user: customer order
 * creation and customer order reads (ownership is enforced in app code via the
 * session token). Never import this into a client component.
 */
export function createAdminClient() {
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
