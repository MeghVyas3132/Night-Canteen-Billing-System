import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPaise } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

type OrderStatus =
  | "pending_payment"
  | "new"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

const STATUS: Record<
  OrderStatus,
  { label: string; tone: "neutral" | "success" | "danger" | "accent" | "primary" }
> = {
  pending_payment: { label: "Awaiting payment", tone: "accent" },
  new: { label: "Order received", tone: "primary" },
  preparing: { label: "Preparing", tone: "primary" },
  ready: { label: "Ready for pickup", tone: "success" },
  completed: { label: "Completed", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "danger" },
};

export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await getSession();
  if (!session) notFound();

  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from("orders")
    .select(
      "id,session_id,customer_name,status,payment_status,subtotal_paise,total_paise,daily_order_number,created_at",
    )
    .eq("id", id)
    .maybeSingle();

  // Only the session that placed the order can view it.
  if (!order || order.session_id !== session.id) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("name_snapshot,unit_price_paise_snapshot,quantity,line_total_paise")
    .eq("order_id", id)
    .order("name_snapshot");

  const status = (order.status as OrderStatus) ?? "pending_payment";
  const meta = STATUS[status];
  const pending = status === "pending_payment";

  return (
    <div className="flex min-h-full flex-col">
      <header className="bg-primary-deep text-on-primary">
        <div className="mx-auto flex max-w-lg items-center gap-2.5 px-5 py-4">
          <svg viewBox="0 0 24 24" className="size-5 text-accent" fill="currentColor" aria-hidden>
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
          </svg>
          <span className="font-display text-base font-semibold tracking-tight">
            Night Canteen
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-5 py-7">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-muted">
                {order.daily_order_number
                  ? `Order #${order.daily_order_number}`
                  : "Order placed"}
              </p>
              <h1 className="mt-0.5 text-xl font-semibold text-foreground">
                Thanks, {order.customer_name}
              </h1>
            </div>
            <Badge tone={meta.tone} dot>
              {meta.label}
            </Badge>
          </div>

          {pending && (
            <div className="mt-4 rounded-xl bg-accent/12 px-4 py-3 text-sm text-on-accent">
              Online payment is coming soon. Once you pay, your order goes
              straight to the kitchen.
            </div>
          )}

          <div className="mt-5 space-y-2.5">
            {(items ?? []).map((it, i) => (
              <div key={i} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-foreground">
                  <span className="tabular-nums text-muted">{it.quantity}×</span>{" "}
                  {it.name_snapshot}
                </span>
                <span className="tabular-nums text-muted">
                  {formatPaise(it.line_total_paise)}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <span className="text-sm font-medium text-muted">Total</span>
            <span className="text-lg font-semibold tabular-nums text-foreground">
              {formatPaise(order.total_paise)}
            </span>
          </div>
        </div>

        <Link href="/" className={cn(buttonClasses({ variant: "secondary", size: "md" }), "mt-5 w-full")}>
          Back to menu
        </Link>
      </main>
    </div>
  );
}
