"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/cart/cart-provider";
import { customerStatus, type OrderStatus } from "@/lib/order-status";

export type ActiveOrderInfo = {
  id: string;
  daily_order_number: number | null;
  status: OrderStatus;
  payment_method: "upi" | "cash" | null;
};

/**
 * Floating "track your order" bar so a customer never loses their order after
 * returning to the menu. Yields to the cart bar when there are items in the cart.
 */
export function ActiveOrderBar({ order }: { order: ActiveOrderInfo }) {
  const { count, hydrated } = useCart();
  const pathname = usePathname();

  if (!hydrated || count > 0 || pathname !== "/") return null;

  const cs = customerStatus(order.status, order.payment_method);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
      <Link
        href={`/order/${order.id}`}
        style={{ animation: "nc-slide-up 0.3s var(--ease-out-expo)" }}
        className="pointer-events-auto mx-auto flex max-w-lg items-center justify-between gap-4 rounded-full bg-primary px-5 py-3.5 text-on-primary shadow-float transition-[transform,background-color] duration-150 hover:bg-primary-hover active:scale-[0.99]"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-white/15 text-xs font-bold tabular-nums">
            {order.daily_order_number ?? "•"}
          </span>
          <span className="truncate text-sm font-semibold">{cs.label}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1 text-sm font-semibold">
          Track
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M9 6l6 6-6 6" />
          </svg>
        </span>
      </Link>
    </div>
  );
}
