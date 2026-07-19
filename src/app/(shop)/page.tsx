import { getMenu, type MenuItem } from "@/lib/menu";
import { CustomerHero } from "@/components/customer-hero";
import { AddToCart } from "@/components/cart/add-to-cart";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { formatPaise } from "@/lib/format";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const menu = await getMenu();
  const hasMenu = menu.categories.length > 0;

  return (
    <div className="flex min-h-full flex-col">
      {/* Live menu: sold-out / price changes appear instantly. */}
      <RealtimeRefresh table="menu_items" channel="menu" />
      <CustomerHero />

      <main className="relative z-10 -mt-5 flex-1 rounded-t-[1.75rem] bg-background px-6 pb-28 pt-8">
        <div className="mx-auto max-w-lg">
          {hasMenu ? (
            <div className="space-y-10">
              {menu.categories.map((category) => (
                <section key={category.id}>
                  <div className="mb-1 flex items-baseline gap-3">
                    <h2 className="font-display text-xl font-medium tracking-tight text-foreground">
                      {category.name}
                    </h2>
                    <span className="h-px flex-1 bg-border" />
                  </div>
                  <div className="divide-y divide-border">
                    {category.items.map((item) => (
                      <MenuItemRow key={item.id} item={item} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <MenuEmptyState configured={menu.configured} />
          )}

          <p className="mt-12 text-center text-xs text-muted">
            Pay by UPI or cash · called by number when it&rsquo;s ready
          </p>
        </div>
      </main>
    </div>
  );
}

function MenuItemRow({ item }: { item: MenuItem }) {
  const soldOut = !item.is_available;
  return (
    <div className="flex items-start justify-between gap-5 py-4">
      <div className={cn("min-w-0 pt-0.5", soldOut && "opacity-55")}>
        <h3 className="text-[15px] font-medium leading-snug text-foreground">
          {item.name}
        </h3>
        {item.description && (
          <p className="mt-1 text-sm leading-snug text-muted">
            {item.description}
          </p>
        )}
        <p className="mt-1.5 text-sm font-medium tabular-nums text-foreground">
          {formatPaise(item.price_paise)}
        </p>
      </div>
      <div className="shrink-0 pt-0.5">
        <AddToCart
          id={item.id}
          name={item.name}
          pricePaise={item.price_paise}
          available={item.is_available}
        />
      </div>
    </div>
  );
}

function MenuEmptyState({ configured }: { configured: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-border-strong bg-surface px-6 py-12 text-center">
      <p className="text-base font-medium text-foreground">
        The menu is being set up
      </p>
      <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted">
        {configured
          ? "No items are on the menu yet. Check back in a bit."
          : "Almost there — finish the Supabase setup in SETUP.md to load the menu."}
      </p>
    </div>
  );
}
