import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";

export type MenuItem = {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price_paise: number;
  is_available: boolean;
  sort_order: number;
};

export type MenuCategoryWithItems = {
  id: string;
  name: string;
  sort_order: number;
  items: MenuItem[];
};

export type Menu = {
  configured: boolean;
  categories: MenuCategoryWithItems[];
};

const ITEM_COLUMNS =
  "id,category_id,name,description,price_paise,is_available,sort_order";

/**
 * Loads the full menu grouped by category, ordered for display.
 * Returns `configured:false` before Supabase is wired so callers can show a
 * friendly setup/empty state instead of crashing.
 */
export async function getMenu(): Promise<Menu> {
  if (!isSupabaseConfigured()) {
    return { configured: false, categories: [] };
  }

  const supabase = await createClient();
  const [{ data: categories, error: catErr }, { data: items, error: itemErr }] =
    await Promise.all([
      supabase
        .from("menu_categories")
        .select("id,name,sort_order")
        .order("sort_order"),
      supabase.from("menu_items").select(ITEM_COLUMNS).order("sort_order"),
    ]);

  if (catErr || itemErr) {
    return { configured: true, categories: [] };
  }

  const itemsByCategory = new Map<string | null, MenuItem[]>();
  for (const item of (items ?? []) as MenuItem[]) {
    const key = item.category_id;
    const list = itemsByCategory.get(key) ?? [];
    list.push(item);
    itemsByCategory.set(key, list);
  }

  const grouped: MenuCategoryWithItems[] = (categories ?? [])
    .map((c) => ({ ...c, items: itemsByCategory.get(c.id) ?? [] }))
    .filter((c) => c.items.length > 0);

  return { configured: true, categories: grouped };
}
