"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/lib/admin";
import { logAudit } from "@/lib/audit";

// Lenient UUID *format* check (8-4-4-4-12 hex). We don't enforce RFC variant
// bits — the DB's foreign keys enforce that IDs reference real rows, and the
// seed uses memorable non-RFC UUIDs.
const UUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export type ItemFormState = {
  error: string | null;
  fieldErrors?: Record<string, string>;
};
export type CategoryFormState = { error: string | null; ok?: boolean };

type ItemData = {
  name: string;
  description: string | null;
  price_paise: number;
  is_available: boolean;
  category_id: string | null;
};

function validateItem(
  formData: FormData,
): { data: ItemData } | { fieldErrors: Record<string, string> } {
  const fieldErrors: Record<string, string> = {};

  const name = String(formData.get("name") ?? "").trim();
  if (!name) fieldErrors.name = "Name is required";
  else if (name.length > 80) fieldErrors.name = "Keep the name under 80 characters";

  const description = String(formData.get("description") ?? "").trim();
  if (description.length > 280)
    fieldErrors.description = "Keep it under 280 characters";

  const priceRaw = String(formData.get("price_rupees") ?? "").trim();
  const price = Number(priceRaw);
  if (priceRaw === "" || !Number.isFinite(price))
    fieldErrors.price_rupees = "Enter a valid price";
  else if (price < 0) fieldErrors.price_rupees = "Price can't be negative";
  else if (price > 100000) fieldErrors.price_rupees = "That price looks too high";

  const is_available = formData.get("is_available") === "on";
  const rawCat = formData.get("category_id");
  const category_id =
    typeof rawCat === "string" && UUID_RE.test(rawCat) ? rawCat : null;

  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  return {
    data: {
      name,
      description: description || null,
      price_paise: Math.round(price * 100),
      is_available,
      category_id,
    },
  };
}

function revalidateMenu() {
  revalidatePath("/admin/menu");
  revalidatePath("/");
}

export async function createItem(
  _prev: ItemFormState,
  formData: FormData,
): Promise<ItemFormState> {
  const admin = await getCurrentAdmin();
  if (!admin) return { error: "Your session expired. Please sign in again." };

  const result = validateItem(formData);
  if ("fieldErrors" in result)
    return { error: "Please fix the highlighted fields.", fieldErrors: result.fieldErrors };

  const { data, error } = await admin.supabase
    .from("menu_items")
    .insert(result.data)
    .select("id")
    .single();
  if (error) return { error: "Couldn't save the item. Please try again." };

  await logAudit(admin.supabase, {
    actorId: admin.user.id,
    action: "menu_item.create",
    entityType: "menu_item",
    entityId: data.id,
    summary: `Added "${result.data.name}"`,
    after: result.data,
  });

  revalidateMenu();
  redirect("/admin/menu");
}

export async function updateItem(
  _prev: ItemFormState,
  formData: FormData,
): Promise<ItemFormState> {
  const admin = await getCurrentAdmin();
  if (!admin) return { error: "Your session expired. Please sign in again." };

  const id = String(formData.get("id") ?? "");
  if (!UUID_RE.test(id)) return { error: "Missing item reference." };

  const result = validateItem(formData);
  if ("fieldErrors" in result)
    return { error: "Please fix the highlighted fields.", fieldErrors: result.fieldErrors };

  const { data: before } = await admin.supabase
    .from("menu_items")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const { error } = await admin.supabase
    .from("menu_items")
    .update(result.data)
    .eq("id", id);
  if (error) return { error: "Couldn't save changes. Please try again." };

  await logAudit(admin.supabase, {
    actorId: admin.user.id,
    action: "menu_item.update",
    entityType: "menu_item",
    entityId: id,
    summary: `Updated "${result.data.name}"`,
    before,
    after: result.data,
  });

  revalidateMenu();
  redirect("/admin/menu");
}

export async function deleteItem(id: string): Promise<{ error: string | null }> {
  const admin = await getCurrentAdmin();
  if (!admin) return { error: "Your session expired. Please sign in again." };
  if (!UUID_RE.test(id)) return { error: "Invalid item reference." };

  const { data: before } = await admin.supabase
    .from("menu_items")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  const { error } = await admin.supabase.from("menu_items").delete().eq("id", id);
  if (error) return { error: "Couldn't delete the item. Please try again." };

  await logAudit(admin.supabase, {
    actorId: admin.user.id,
    action: "menu_item.delete",
    entityType: "menu_item",
    entityId: id,
    summary: before ? `Removed "${before.name}"` : "Removed an item",
    before,
  });

  revalidateMenu();
  return { error: null };
}

export async function setItemAvailability(
  id: string,
  available: boolean,
): Promise<{ error: string | null }> {
  const admin = await getCurrentAdmin();
  if (!admin) return { error: "Your session expired. Please sign in again." };
  if (!UUID_RE.test(id)) return { error: "Invalid item reference." };

  const { error } = await admin.supabase
    .from("menu_items")
    .update({ is_available: available })
    .eq("id", id);
  if (error) return { error: "Couldn't update availability." };

  await logAudit(admin.supabase, {
    actorId: admin.user.id,
    action: "menu_item.availability",
    entityType: "menu_item",
    entityId: id,
    summary: available ? "Marked available" : "Marked sold out",
  });

  revalidateMenu();
  return { error: null };
}

export async function createCategory(
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const admin = await getCurrentAdmin();
  if (!admin) return { error: "Your session expired. Please sign in again." };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Enter a category name." };
  if (name.length > 60) return { error: "Keep it under 60 characters." };

  const { data: maxRow } = await admin.supabase
    .from("menu_categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sort_order = (maxRow?.sort_order ?? 0) + 1;

  const { data, error } = await admin.supabase
    .from("menu_categories")
    .insert({ name, sort_order })
    .select("id")
    .single();
  if (error) return { error: "Couldn't add the category." };

  await logAudit(admin.supabase, {
    actorId: admin.user.id,
    action: "menu_category.create",
    entityType: "menu_category",
    entityId: data.id,
    summary: `Added category "${name}"`,
  });

  revalidateMenu();
  return { error: null, ok: true };
}
