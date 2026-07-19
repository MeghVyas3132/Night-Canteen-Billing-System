import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export type SystemStatus = {
  supabaseConfigured: boolean;
  dbReachable: boolean;
  itemCount: number | null;
  error: string | null;
};

/**
 * End-to-end health probe used by the landing page and `/api/health`.
 * Proves the app can reach Supabase and read the menu through Row Level Security.
 * Degrades gracefully before Supabase is configured (see SETUP.md).
 */
export async function getSystemStatus(): Promise<SystemStatus> {
  if (!isSupabaseConfigured()) {
    return {
      supabaseConfigured: false,
      dbReachable: false,
      itemCount: null,
      error: null,
    };
  }

  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from("menu_items")
      .select("*", { count: "exact", head: true });

    if (error) {
      return {
        supabaseConfigured: true,
        dbReachable: false,
        itemCount: null,
        error: error.message,
      };
    }

    return {
      supabaseConfigured: true,
      dbReachable: true,
      itemCount: count ?? 0,
      error: null,
    };
  } catch (e) {
    return {
      supabaseConfigured: true,
      dbReachable: false,
      itemCount: null,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}
