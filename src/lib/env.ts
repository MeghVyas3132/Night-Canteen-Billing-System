/**
 * Central access point for environment variables.
 *
 * Only `NEXT_PUBLIC_`-prefixed vars are exposed to the browser; everything else
 * (service role key, Razorpay secrets) stays server-side only.
 */
export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  // Server-only. Never import this into a client component.
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
} as const;

/** True once the public Supabase URL + anon key are present. */
export function isSupabaseConfigured(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}
