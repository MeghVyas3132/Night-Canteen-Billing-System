"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setItemAvailability } from "@/lib/actions/menu";
import { cn } from "@/lib/cn";

/** Optimistic sold-out / available switch. Reverts on server error. */
export function AvailabilityToggle({
  id,
  available,
}: {
  id: string;
  available: boolean;
}) {
  const [on, setOn] = useState(available);
  const [pending, start] = useTransition();
  const router = useRouter();

  function toggle() {
    const next = !on;
    setOn(next);
    start(async () => {
      const res = await setItemAvailability(id, next);
      if (res?.error) setOn(!next);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={on ? "Available — tap to mark sold out" : "Sold out — tap to mark available"}
      title={on ? "Available" : "Sold out"}
      onClick={toggle}
      disabled={pending}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-60",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        on ? "bg-success" : "bg-border-strong",
      )}
    >
      <span
        className={cn(
          "inline-block size-5 rounded-full bg-white shadow-sm transition-transform",
          on ? "translate-x-[22px]" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
