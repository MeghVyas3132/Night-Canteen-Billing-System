export type OrderStatus =
  | "pending_payment"
  | "new"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

export type StatusTone = "neutral" | "success" | "danger" | "accent" | "primary";

export const STATUS_META: Record<OrderStatus, { label: string; tone: StatusTone }> = {
  pending_payment: { label: "Awaiting payment", tone: "accent" },
  new: { label: "New", tone: "primary" },
  preparing: { label: "Preparing", tone: "primary" },
  ready: { label: "Ready", tone: "success" },
  completed: { label: "Completed", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "danger" },
};

/**
 * The single "advance" action for each active status. Simplified flow:
 * New (to make) → Ready (call the number) → Collected. "Preparing" is retired.
 */
export const NEXT_ACTION: Partial<
  Record<OrderStatus, { to: OrderStatus; label: string }>
> = {
  new: { to: "ready", label: "Ready" },
  preparing: { to: "ready", label: "Ready" }, // legacy safety
  ready: { to: "completed", label: "Collected" },
};

/** Statuses that belong on the live board (paid, not yet done). */
export const ACTIVE_STATUSES: OrderStatus[] = ["new", "preparing", "ready"];

/** Legal status transitions (validated server-side). */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ["cancelled"],
  new: ["ready", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

/** Customer-facing status line (no multi-step stepper). */
export function customerStatus(
  status: OrderStatus,
  method: "upi" | "cash" | null,
): { label: string; tone: StatusTone } {
  switch (status) {
    case "pending_payment":
      return method === "cash"
        ? { label: "Pay at the counter", tone: "accent" }
        : { label: "Confirming payment", tone: "accent" };
    case "new":
      return { label: "Preparing your order", tone: "primary" };
    case "ready":
      return { label: "Ready — collect at the counter", tone: "success" };
    case "completed":
      return { label: "Collected — enjoy!", tone: "neutral" };
    case "cancelled":
      return { label: "Cancelled", tone: "danger" };
    default:
      return { label: "Order placed", tone: "neutral" };
  }
}

export type PaymentStatus = "created" | "paid" | "failed" | "refunded";

export type BoardOrder = {
  id: string;
  daily_order_number: number | null;
  customer_name: string;
  customer_phone: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: "upi" | "cash" | null;
  total_paise: number;
  created_at: string;
  order_items: { name_snapshot: string; quantity: number }[];
};

// Board query: active paid orders + cash orders awaiting counter payment.
export const BOARD_SELECT =
  "id,daily_order_number,customer_name,customer_phone,status,payment_status,payment_method,total_paise,created_at,order_items(name_snapshot,quantity)";
export const BOARD_FILTER =
  "status.in.(new,preparing,ready),and(status.eq.pending_payment,payment_method.eq.cash)";

