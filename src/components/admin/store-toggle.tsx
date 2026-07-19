"use client";

import { useState, useTransition } from "react";
import { setStoreOpen } from "@/lib/actions/store";
import { cn } from "@/lib/cn";

/** Open/Closed switch in the admin header. Optimistic; reverts on error. */
export function StoreToggle({ initialOpen }: { initialOpen: boolean }) {
  const [open, setOpen] = useState(initialOpen);
  const [pending, start] = useTransition();

  function toggle() {
    const next = !open;
    setOpen(next);
    start(async () => {
      const res = await setStoreOpen(next);
      if (!res.ok) setOpen(!next);
    });
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={open}
      aria-label={open ? "Canteen is open — tap to close" : "Canteen is closed — tap to open"}
      onClick={toggle}
      disabled={pending}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-on-primary transition-colors disabled:opacity-60",
        open ? "bg-success/25 hover:bg-success/35" : "bg-danger/30 hover:bg-danger/40",
      )}
    >
      <span
        className={cn("size-2 rounded-full", open ? "bg-success" : "bg-danger")}
      />
      {open ? "Open" : "Closed"}
    </button>
  );
}
