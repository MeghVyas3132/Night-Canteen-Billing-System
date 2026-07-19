import { redirect } from "next/navigation";
import { CartProvider } from "@/components/cart/cart-provider";
import { CartBar } from "@/components/cart/cart-bar";
import { getStoreOpen } from "@/lib/store";

/** Customer shopping surface — provides cart state + the floating cart bar. */
export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No ordering while the canteen is closed.
  if (!(await getStoreOpen())) redirect("/closed");

  return (
    <CartProvider>
      {children}
      <CartBar />
    </CartProvider>
  );
}
