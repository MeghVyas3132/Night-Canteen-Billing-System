"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteItem } from "@/lib/actions/menu";

export function DeleteItemButton({ id, name }: { id: string; name: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  function onDelete() {
    if (!window.confirm(`Remove "${name}" from the menu?`)) return;
    start(async () => {
      const res = await deleteItem(id);
      if (res?.error) window.alert(res.error);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      disabled={pending}
      aria-label={`Delete ${name}`}
      className="grid size-9 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-danger-bg hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger/40 disabled:opacity-50"
    >
      <svg
        viewBox="0 0 24 24"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
        <path d="M10 11v6M14 11v6" />
      </svg>
    </button>
  );
}
