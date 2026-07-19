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

/** The single "advance" action available for each active status. */
export const NEXT_ACTION: Partial<
  Record<OrderStatus, { to: OrderStatus; label: string }>
> = {
  new: { to: "preparing", label: "Start preparing" },
  preparing: { to: "ready", label: "Mark ready" },
  ready: { to: "completed", label: "Complete" },
};

/** Statuses that belong on the live board (paid, not yet done). */
export const ACTIVE_STATUSES: OrderStatus[] = ["new", "preparing", "ready"];

/** Legal status transitions (validated server-side). */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_payment: ["cancelled"],
  new: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

/** Customer-facing progress steps. */
export const CUSTOMER_STEPS: { status: OrderStatus; label: string }[] = [
  { status: "new", label: "Received" },
  { status: "preparing", label: "Preparing" },
  { status: "ready", label: "Ready" },
];

export type BoardOrder = {
  id: string;
  daily_order_number: number | null;
  customer_name: string;
  customer_phone: string | null;
  status: OrderStatus;
  total_paise: number;
  created_at: string;
  order_items: { name_snapshot: string; quantity: number }[];
};
