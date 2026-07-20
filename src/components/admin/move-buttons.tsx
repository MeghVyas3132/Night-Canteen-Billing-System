"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { moveItem, moveCategory } from "@/lib/actions/menu";

/** Compact up/down reorder control for a menu item or category. */
export function MoveButtons({
  id,
  kind,
  isFirst,
  isLast,
}: {
  id: string;
  kind: "item" | "category";
  isFirst: boolean;
  isLast: boolean;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();

  function move(direction: "up" | "down") {
    start(async () => {
      const res = await (kind === "item"
        ? moveItem(id, direction)
        : moveCategory(id, direction));
      if (res?.error) window.alert(res.error);
      router.refresh();
    });
  }

  return (
    <div className="flex shrink-0 flex-col">
      <button
        type="button"
        onClick={() => move("up")}
        disabled={pending || isFirst}
        aria-label="Move up"
        className="grid size-6 place-items-center rounded text-muted transition-colors hover:bg-surface-2 hover:text-foreground disabled:opacity-25"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M18 15l-6-6-6 6" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => move("down")}
        disabled={pending || isLast}
        aria-label="Move down"
        className="grid size-6 place-items-center rounded text-muted transition-colors hover:bg-surface-2 hover:text-foreground disabled:opacity-25"
      >
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
    </div>
  );
}
