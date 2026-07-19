import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatPaise } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { AutoRefresh } from "@/components/auto-refresh";
import {
  STATUS_META,
  CUSTOMER_STEPS,
  type OrderStatus,
} from "@/lib/order-status";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

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

  if (!order || order.session_id !== session.id) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("name_snapshot,unit_price_paise_snapshot,quantity,line_total_paise")
    .eq("order_id", id)
    .order("name_snapshot");

  const status = (order.status as OrderStatus) ?? "pending_payment";
  const meta = STATUS_META[status];
  const pending = status === "pending_payment";
  const done = status === "completed" || status === "cancelled";
  const activeStep = CUSTOMER_STEPS.findIndex((s) => s.status === status);
  const showSteps = ["new", "preparing", "ready"].includes(status);

  return (
    <div className="flex min-h-full flex-col">
      {/* Poll for status changes until the order is finished. */}
      <AutoRefresh stop={done || pending} />

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
                {status === "ready"
                  ? "Ready for pickup! 🎉"
                  : `Thanks, ${order.customer_name}`}
              </h1>
            </div>
            <Badge tone={meta.tone} dot>
              {meta.label}
            </Badge>
          </div>

          {pending && (
            <div className="mt-4 rounded-xl bg-accent/12 px-4 py-3 text-sm text-on-accent">
              Waiting to confirm your payment. If you&rsquo;ve just paid, this
              will update in a moment.
            </div>
          )}

          {status === "cancelled" && (
            <div className="mt-4 rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger">
              This order was cancelled. If you were charged, it will be refunded.
            </div>
          )}

          {showSteps && (
            <ol className="mt-5 flex items-center">
              {CUSTOMER_STEPS.map((step, i) => {
                const reached = i <= activeStep;
                const current = i === activeStep;
                return (
                  <li key={step.status} className="flex flex-1 items-center last:flex-none">
                    <div className="flex flex-col items-center">
                      <span
                        className={cn(
                          "grid size-8 place-items-center rounded-full text-sm font-semibold transition-colors",
                          reached
                            ? "bg-primary text-on-primary"
                            : "bg-surface-2 text-muted",
                          current && step.status === "ready" && "bg-success",
                        )}
                      >
                        {reached ? "✓" : i + 1}
                      </span>
                      <span
                        className={cn(
                          "mt-1.5 text-xs",
                          reached ? "font-medium text-foreground" : "text-muted",
                        )}
                      >
                        {step.label}
                      </span>
                    </div>
                    {i < CUSTOMER_STEPS.length - 1 && (
                      <span
                        className={cn(
                          "mx-1 mb-5 h-0.5 flex-1 rounded",
                          i < activeStep ? "bg-primary" : "bg-border",
                        )}
                      />
                    )}
                  </li>
                );
              })}
            </ol>
          )}

          <div className="mt-6 space-y-2.5">
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
