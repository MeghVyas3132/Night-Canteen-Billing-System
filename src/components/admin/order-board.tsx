"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { setOrderStatus, confirmCashPayment } from "@/lib/actions/order-status";
import { createClient } from "@/lib/supabase/client";
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

const POLL_MS = 5000; // safety net; Realtime handles the instant path
const STALE_MS = 30 * 60 * 1000; // unpaid > 30 min → greyed

export function OrderBoard({ initial }: { initial: BoardOrder[] }) {
  const [orders, setOrders] = useState<BoardOrder[]>(initial);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [now, setNow] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/orders", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { orders?: BoardOrder[] };
      if (Array.isArray(data.orders)) setOrders(data.orders);
    } catch {
      // transient — the next tick / realtime event recovers
    }
  }, []);

  // Realtime: push updates the instant any order changes (any device).
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("admin-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => refresh(),
      )
      .subscribe();

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) supabase.realtime.setAuth(data.session.access_token);
    })();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  // Fallback poll + refresh on tab focus.
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

  // Tick "now" for staleness / relative time — kept in state, out of render.
  useEffect(() => {
    const update = () => setNow(Date.now());
    const t = setTimeout(update, 0);
    const id = setInterval(update, 30000);
    return () => {
      clearTimeout(t);
      clearInterval(id);
    };
  }, []);

  const advance = useCallback(
    (order: BoardOrder, to: OrderStatus) => {
      setError(null);
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

  const cashReceived = useCallback(
    (order: BoardOrder) => {
      setError(null);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === order.id
            ? { ...o, payment_status: "paid", status: "new" }
            : o,
        ),
      );
      startTransition(async () => {
        const res = await confirmCashPayment(order.id);
        if (!res.ok) setError(res.error ?? "Couldn't confirm the cash payment.");
        refresh();
      });
    },
    [refresh],
  );

  // Cleared (paid) first, then cash-awaiting; oldest first within each group.
  const sorted = useMemo(
    () =>
      [...orders].sort((a, b) => {
        const ca = a.payment_status === "paid" ? 0 : 1;
        const cb = b.payment_status === "paid" ? 0 : 1;
        if (ca !== cb) return ca - cb;
        return (
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      }),
    [orders],
  );

  if (sorted.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border-strong bg-surface px-6 py-16 text-center">
        <p className="text-base font-medium text-foreground">No active orders</p>
        <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted">
          Paid orders and cash orders awaiting payment land here automatically.
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
      {sorted.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          now={now}
          busy={pending}
          onAdvance={advance}
          onCashReceived={cashReceived}
        />
      ))}
    </div>
  );
}

function OrderCard({
  order,
  now,
  busy,
  onAdvance,
  onCashReceived,
}: {
  order: BoardOrder;
  now: number;
  busy: boolean;
  onAdvance: (order: BoardOrder, to: OrderStatus) => void;
  onCashReceived: (order: BoardOrder) => void;
}) {
  const cleared = order.payment_status === "paid";
  const cashPending = !cleared; // board only holds paid-active + cash-awaiting
  const stale =
    cashPending && now - new Date(order.created_at).getTime() > STALE_MS;
  const meta = STATUS_META[order.status];
  const next = NEXT_ACTION[order.status];
  const ready = order.status === "ready";

  return (
    <div
      className={cn(
        "animate-enter rounded-2xl border bg-surface p-4 shadow-card transition-[opacity,box-shadow,border-color] duration-200",
        ready && "border-success/50 ring-1 ring-success/20",
        !ready && cashPending && "border-accent/40",
        !ready && cleared && "border-border",
        stale && "opacity-55",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-lg font-bold tabular-nums text-foreground">
              {order.daily_order_number ? `#${order.daily_order_number}` : "—"}
            </span>
            {cashPending ? (
              <Badge tone="accent" dot>
                Cash · awaiting
              </Badge>
            ) : (
              <Badge tone={meta.tone} dot>
                {meta.label}
              </Badge>
            )}
            {stale && (
              <span className="text-xs font-medium text-danger">30+ min</span>
            )}
          </div>
          <p className="mt-0.5 truncate text-sm font-medium text-foreground">
            {order.customer_name}
            {order.customer_phone && (
              <span className="font-normal text-muted"> · {order.customer_phone}</span>
            )}
          </p>
        </div>
        <span className="shrink-0 text-xs text-muted">
          {timeAgo(order.created_at, now)}
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
          {cashPending ? (
            <Button
              size="sm"
              variant="accent"
              onClick={() => onCashReceived(order)}
              disabled={busy}
            >
              Cash received
            </Button>
          ) : (
            next && (
              <Button
                size="sm"
                variant={ready ? "accent" : "primary"}
                onClick={() => onAdvance(order, next.to)}
                disabled={busy}
              >
                {next.label}
              </Button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function timeAgo(iso: string, now: number): string {
  const diffMs = now - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
}
