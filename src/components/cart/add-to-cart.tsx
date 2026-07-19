"use client";

import { useCart } from "./cart-provider";

/** Add button that becomes a −/qty/＋ stepper once the item is in the cart. */
export function AddToCart({
  id,
  name,
  pricePaise,
  available,
}: {
  id: string;
  name: string;
  pricePaise: number;
  available: boolean;
}) {
  const { qtyOf, add, setQty, hydrated } = useCart();
  const qty = qtyOf(id);

  if (!available) {
    return (
      <span className="text-xs font-semibold uppercase tracking-wide text-danger">
        Sold out
      </span>
    );
  }

  if (!hydrated || qty === 0) {
    return (
      <button
        type="button"
        onClick={() => add({ id, name, price_paise: pricePaise })}
        className="h-9 rounded-lg bg-accent px-4 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        Add
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1 rounded-lg bg-accent/12 p-0.5">
      <StepperButton label={`Remove one ${name}`} onClick={() => setQty(id, qty - 1)}>
        <MinusIcon />
      </StepperButton>
      <span
        aria-live="polite"
        className="min-w-6 text-center text-sm font-semibold tabular-nums text-on-accent"
      >
        {qty}
      </span>
      <StepperButton
        label={`Add another ${name}`}
        onClick={() => add({ id, name, price_paise: pricePaise })}
      >
        <PlusIcon />
      </StepperButton>
    </div>
  );
}

function StepperButton({
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
      className="grid size-8 place-items-center rounded-md text-on-accent transition-colors hover:bg-accent/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
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
