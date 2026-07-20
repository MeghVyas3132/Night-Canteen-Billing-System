"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Subscribes to changes on a public table and re-renders the current server
 * page when they arrive. Debounced so a burst of changes coalesces into a
 * single refresh (avoids visible re-render churn during busy periods).
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
    let timer: ReturnType<typeof setTimeout> | null = null;

    const scheduleRefresh = () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        router.refresh();
      }, 400);
    };

    const ch = supabase
      .channel(channel)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        scheduleRefresh,
      )
      .subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(ch);
    };
  }, [table, channel, router]);
  return null;
}
