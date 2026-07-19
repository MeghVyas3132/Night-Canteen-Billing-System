import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

/**
 * Supabase client for Server Components, Route Handlers, and Server Actions.
 *
 * In Next.js 16 `cookies()` is async, so this factory is async too. The client
 * reads/writes the auth session cookie so admin auth (added in M1) works across
 * server and client.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // `setAll` was called from a Server Component. This can be ignored
          // when middleware refreshes the session; it's only a problem if there
          // is no middleware handling session refresh.
        }
      },
    },
  });
}
