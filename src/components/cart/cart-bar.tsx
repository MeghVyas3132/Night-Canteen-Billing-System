"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "./cart-provider";
import { formatPaise } from "@/lib/format";

/** Floating amber cart bar → checkout. Hidden when empty or on checkout. */
export function CartBar() {
  const { count, subtotalPaise, hydrated } = useCart();
  const pathname = usePathname();
  if (!hydrated || count === 0 || pathname === "/checkout") return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
      <Link
        href="/checkout"
        style={{ animation: "nc-slide-up 0.28s cubic-bezier(0.22,1,0.36,1)" }}
        className="pointer-events-auto mx-auto flex max-w-lg items-center justify-between gap-4 rounded-full bg-accent px-5 py-3.5 text-on-accent shadow-float transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <span className="flex items-center gap-2">
          <span className="grid size-6 place-items-center rounded-full bg-on-accent/15 text-xs font-bold tabular-nums">
            {count}
          </span>
          <span className="text-sm font-semibold">
            {count === 1 ? "item" : "items"} in cart
          </span>
        </span>
        <span className="flex items-center gap-2 text-sm font-semibold">
          <span className="tabular-nums">{formatPaise(subtotalPaise)}</span>
          <span aria-hidden>·</span>
          <span>Checkout</span>
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M9 6l6 6-6 6" />
          </svg>
        </span>
      </Link>
    </div>
  );
}
