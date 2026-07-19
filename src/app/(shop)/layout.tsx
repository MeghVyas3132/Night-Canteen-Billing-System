import { CartProvider } from "@/components/cart/cart-provider";
import { CartBar } from "@/components/cart/cart-bar";

/** Customer shopping surface — provides cart state + the floating cart bar. */
export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      {children}
      <CartBar />
    </CartProvider>
  );
}
