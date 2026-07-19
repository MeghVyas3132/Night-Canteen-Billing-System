import Link from "next/link";
import { CheckoutForm } from "@/components/cart/checkout-form";

export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  return (
    <div className="flex min-h-full flex-col bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-5 py-4">
          <Link
            href="/"
            aria-label="Back to menu"
            className="grid size-9 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <h1 className="text-lg font-semibold text-foreground">Your order</h1>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-5 py-6">
        <CheckoutForm />
      </main>
    </div>
  );
}
