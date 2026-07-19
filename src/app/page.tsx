import { getMenu, type MenuItem } from "@/lib/menu";
import { CustomerHero } from "@/components/customer-hero";
import { Badge } from "@/components/ui/badge";
import { formatPaise } from "@/lib/format";
import { cn } from "@/lib/cn";

// Reads live menu on every request.
export const dynamic = "force-dynamic";

export default async function Home() {
  const menu = await getMenu();
  const hasMenu = menu.categories.length > 0;

  return (
    <div className="flex min-h-full flex-col">
      <CustomerHero />

      <main className="relative z-10 -mt-5 flex-1 rounded-t-[1.75rem] bg-background px-5 pb-16 pt-7">
        <div className="mx-auto max-w-lg">
          {hasMenu ? (
            <div className="space-y-8">
              {menu.categories.map((category) => (
                <section key={category.id}>
                  <h2 className="mb-2.5 px-1 text-base font-semibold text-foreground">
                    {category.name}
                  </h2>
                  <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
                    {category.items.map((item, i) => (
                      <MenuItemRow key={item.id} item={item} first={i === 0} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <MenuEmptyState configured={menu.configured} />
          )}

          <p className="mt-10 text-center text-xs text-muted">
            Pay at checkout · order called by number when it&rsquo;s ready
          </p>
        </div>
      </main>
    </div>
  );
}

function MenuItemRow({ item, first }: { item: MenuItem; first: boolean }) {
  const soldOut = !item.is_available;
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 px-4 py-3.5",
        !first && "border-t border-border",
        soldOut && "opacity-60",
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="text-[15px] font-medium text-foreground">
            {item.name}
          </h3>
          {soldOut && <Badge tone="danger">Sold out</Badge>}
        </div>
        {item.description && (
          <p className="mt-0.5 line-clamp-2 text-sm text-muted">
            {item.description}
          </p>
        )}
      </div>
      <div className="shrink-0 pt-0.5 text-[15px] font-medium tabular-nums text-foreground">
        {formatPaise(item.price_paise)}
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
