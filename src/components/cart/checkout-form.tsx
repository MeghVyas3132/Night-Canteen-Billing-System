"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/cart/cart-provider";
import { createOrder } from "@/lib/actions/order";
import { formatPaise } from "@/lib/format";
import { Button, buttonClasses } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { cn } from "@/lib/cn";

export function CheckoutForm() {
  const { lines, subtotalPaise, count, setQty, clear, hydrated } = useCart();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  // Stable idempotency key for this checkout attempt (once per mount).
  const [idempotencyKey] = useState(() => crypto.randomUUID());

  if (!hydrated) {
    return (
      <div className="py-16 text-center text-sm text-muted">Loading your cart…</div>
    );
  }
  if (count === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border-strong bg-surface px-6 py-14 text-center">
        <p className="text-base font-medium text-foreground">Your cart is empty</p>
        <p className="mt-1.5 text-sm text-muted">Add something tasty from the menu.</p>
        <Link href="/" className={cn(buttonClasses({ size: "md" }), "mt-5")}>
          Browse the menu
        </Link>
      </div>
    );
  }

  function placeOrder() {
    setError(null);
    if (!name.trim()) {
      setError("Please enter your name so we can call your order.");
      return;
    }
    const items = lines.map((l) => ({ id: l.id, qty: l.qty }));
    start(async () => {
      const res = await createOrder({
        items,
        name: name.trim(),
        phone: phone.trim() || undefined,
        idempotencyKey,
      });
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.orderId) {
        clear();
        router.push(`/order/${res.orderId}`);
      }
    });
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        {lines.map((line, i) => (
          <div
            key={line.id}
            className={cn(
              "flex items-center gap-3 px-4 py-3",
              i > 0 && "border-t border-border",
            )}
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-medium text-foreground">
                {line.name}
              </p>
              <p className="text-sm tabular-nums text-muted">
                {formatPaise(line.price_paise)}
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-surface-2 p-0.5">
              <StepBtn label={`Remove one ${line.name}`} onClick={() => setQty(line.id, line.qty - 1)}>
                <MinusIcon />
              </StepBtn>
              <span className="min-w-6 text-center text-sm font-semibold tabular-nums text-foreground">
                {line.qty}
              </span>
              <StepBtn label={`Add another ${line.name}`} onClick={() => setQty(line.id, line.qty + 1)}>
                <PlusIcon />
              </StepBtn>
            </div>
            <div className="w-16 shrink-0 text-right text-[15px] font-medium tabular-nums text-foreground">
              {formatPaise(line.price_paise * line.qty)}
            </div>
          </div>
        ))}
      </section>

      <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3.5 shadow-card">
        <span className="text-sm font-medium text-muted">Total</span>
        <span className="text-lg font-semibold tabular-nums text-foreground">
          {formatPaise(subtotalPaise)}
        </span>
      </div>

      <section className="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-card">
        <Field label="Your name" htmlFor="name" hint="We'll call this out when your order is ready.">
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            placeholder="e.g. Aryan"
            autoComplete="name"
            required
          />
        </Field>
        <Field label="Phone (optional)" htmlFor="phone">
          <Input
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            inputMode="tel"
            maxLength={15}
            placeholder="For updates"
            autoComplete="tel"
          />
        </Field>
      </section>

      {error && (
        <p role="alert" className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <Button onClick={placeOrder} loading={pending} size="lg" className="w-full">
        {pending ? "Placing order…" : `Place order · ${formatPaise(subtotalPaise)}`}
      </Button>
      <p className="text-center text-xs text-muted">
        Online payment arrives next — for now this places a pending order.
      </p>
    </div>
  );
}

function StepBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid size-8 place-items-center rounded-md text-foreground transition-colors hover:bg-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      {children}
    </button>
  );
}

function MinusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
      <path d="M5 12h14" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
