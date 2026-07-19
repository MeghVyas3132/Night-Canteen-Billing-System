"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribes to changes on a public table and re-renders the current server
 * page when they arrive. Used on the customer menu so sold-out changes appear
 * instantly (menu_items is publicly readable, so the anon client can subscribe).
 */
export function RealtimeRefresh({
  table,
  channel,
}: {
  table: string;
  channel: string;
}) {
  const router = useRouter();
  useEffect(() => {
    const supabase = createClient();
    const ch = supabase
      .channel(channel)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => router.refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [table, channel, router]);
  return null;
}
