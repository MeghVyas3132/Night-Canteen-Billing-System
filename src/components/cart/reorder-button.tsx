"use client";

import { CART_STORAGE_KEY } from "@/components/cart/cart-provider";
import { Button } from "@/components/ui/button";

export type ReorderLine = {
  menu_item_id: string | null;
  variant_id: string | null;
  name_snapshot: string;
  unit_price_paise_snapshot: number;
  quantity: number;
};

/**
 * Re-adds a past order's items to the cart and jumps to checkout. Seeds the cart
 * store via localStorage and does a full navigation so the provider re-reads it
 * (the order page lives outside the cart provider).
 */
export function ReorderButton({ lines }: { lines: ReorderLine[] }) {
  function reorder() {
    const cart = lines
      .filter((l) => l.menu_item_id)
      .map((l) => ({
        id: l.menu_item_id,
        variantId: l.variant_id,
        name: l.name_snapshot,
        price_paise: l.unit_price_paise_snapshot,
        qty: l.quantity,
      }));
    if (cart.length === 0) {
      window.location.href = "/";
      return;
    }
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore storage errors; fall through to the menu
    }
    window.location.href = "/checkout";
  }

  return (
    <Button onClick={reorder} className="w-full">
      Order again
    </Button>
  );
}
