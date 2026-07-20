import { getMenu } from "@/lib/menu";
import { CustomerHero } from "@/components/customer-hero";
import { RealtimeRefresh } from "@/components/realtime-refresh";
import { MenuBrowser } from "@/components/menu-browser";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const menu = await getMenu();
  const hasMenu = menu.categories.length > 0;

  return (
    <div className="flex min-h-full flex-col">
      {/* Live menu: sold-out / price changes appear instantly. */}
      <RealtimeRefresh table="menu_items" channel="menu" />
      <CustomerHero />

      <main className="relative z-10 -mt-5 flex-1 rounded-t-[1.75rem] bg-background pb-28 pt-1">
        {hasMenu ? (
          <MenuBrowser categories={menu.categories} />
        ) : (
          <div className="mx-auto max-w-lg px-6 pt-7">
            <MenuEmptyState configured={menu.configured} />
          </div>
        )}
        <p className="mx-auto mt-12 max-w-lg px-6 text-center text-xs text-muted">
          Pay by UPI or cash · called by number when it&rsquo;s ready
        </p>
      </main>
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
