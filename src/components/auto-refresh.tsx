"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Re-runs the current server component on an interval so a Server Component page
 * reflects live changes (used for the customer order status). Stops polling once
 * `stop` is true (order finished) and while the tab is hidden.
 */
export function AutoRefresh({
  intervalMs = 4000,
  stop = false,
}: {
  intervalMs?: number;
  stop?: boolean;
}) {
  const router = useRouter();
  useEffect(() => {
    if (stop) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs, stop]);
  return null;
}
