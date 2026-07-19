"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { setOrderStatus } from "@/lib/actions/order-status";
import {
  STATUS_META,
  NEXT_ACTION,
  type BoardOrder,
  type OrderStatus,
} from "@/lib/order-status";
import { formatPaise } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const POLL_MS = 4000;

export function OrderBoard({ initial }: { initial: BoardOrder[] }) {
  const [orders, setOrders] = useState<BoardOrder[]>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/orders", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { orders?: BoardOrder[] };
      if (Array.isArray(data.orders)) setOrders(data.orders);
    } catch {
      // transient network error — the next tick retries
    }
  }, []);

  useEffect(() => {
    const id = setInterval(refresh, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const advance = useCallback(
    (order: BoardOrder, to: OrderStatus) => {
      setError(null);
      // Optimistic: completing/cancelling drops the card; otherwise re-label it.
      setOrders((prev) =>
        to === "completed" || to === "cancelled"
          ? prev.filter((o) => o.id !== order.id)
          : prev.map((o) => (o.id === order.id ? { ...o, status: to } : o)),
      );
      startTransition(async () => {
        const res = await setOrderStatus(order.id, to);
        if (!res.ok) setError(res.error ?? "Couldn't update the order.");
        refresh();
      });
    },
    [refresh],
  );

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border-strong bg-surface px-6 py-16 text-center">
        <p className="text-base font-medium text-foreground">No active orders</p>
        <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted">
          Paid orders land here automatically. This board refreshes on its own.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          onAdvance={advance}
          busy={pending}
        />
      ))}
    </div>
  );
}

function OrderCard({
  order,
  onAdvance,
  busy,
}: {
  order: BoardOrder;
  onAdvance: (order: BoardOrder, to: OrderStatus) => void;
  busy: boolean;
}) {
  const meta = STATUS_META[order.status];
  const next = NEXT_ACTION[order.status];
  const ready = order.status === "ready";

  return (
    <div
      className={cn(
        "rounded-2xl border bg-surface p-4 shadow-card",
        ready ? "border-success/50 ring-1 ring-success/20" : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold tabular-nums text-foreground">
              {order.daily_order_number ? `#${order.daily_order_number}` : "—"}
            </span>
            <Badge tone={meta.tone} dot>
              {meta.label}
            </Badge>
          </div>
          <p className="mt-0.5 truncate text-sm font-medium text-foreground">
            {order.customer_name}
          </p>
        </div>
        <span className="shrink-0 text-xs text-muted">
          {timeAgo(order.created_at)}
        </span>
      </div>

      <ul className="mt-3 space-y-1">
        {order.order_items.map((it, i) => (
          <li key={i} className="text-sm text-foreground">
            <span className="tabular-nums text-muted">{it.quantity}×</span>{" "}
            {it.name_snapshot}
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {formatPaise(order.total_paise)}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              const label = order.daily_order_number
                ? `#${order.daily_order_number}`
                : "this order";
              if (window.confirm(`Cancel ${label}?`)) onAdvance(order, "cancelled");
            }}
            disabled={busy}
            className="rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-danger-bg hover:text-danger disabled:opacity-50"
          >
            Cancel
          </button>
          {next && (
            <Button
              size="sm"
              variant={ready ? "accent" : "primary"}
              onClick={() => onAdvance(order, next.to)}
              disabled={busy}
            >
              {next.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
}
