"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { ensureSession } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/env";

export type CreateOrderInput = {
  items: { id: string; qty: number }[];
  name: string;
  phone?: string;
  idempotencyKey: string;
};

export type CreateOrderResult = { orderId?: string; error?: string };

const MAX_QTY_PER_ITEM = 50;

/**
 * Creates a pending-payment order. ALL pricing is recomputed server-side from
 * the DB — the client only sends item ids + quantities. Payment (M3) then moves
 * the order into the kitchen queue.
 */
export async function createOrder(
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  if (!isSupabaseConfigured()) {
    return { error: "Ordering isn't available yet. Please try again later." };
  }

  const name = (input.name ?? "").trim();
  if (!name) return { error: "Please enter your name." };
  if (name.length > 60) return { error: "That name is too long." };

  const phone = (input.phone ?? "").trim() || null;
  if (phone && !/^[0-9+\-\s]{6,15}$/.test(phone)) {
    return { error: "Enter a valid phone number, or leave it blank." };
  }

  // Collapse + sanitize requested quantities.
  const wanted = new Map<string, number>();
  for (const it of Array.isArray(input.items) ? input.items : []) {
    if (typeof it?.id !== "string") continue;
    const q = Math.floor(Number(it.qty));
    if (!Number.isFinite(q) || q < 1) continue;
    if (q > MAX_QTY_PER_ITEM) {
      return { error: "Please keep the quantity of any one item reasonable." };
    }
    wanted.set(it.id, Math.min((wanted.get(it.id) ?? 0) + q, MAX_QTY_PER_ITEM));
  }
  if (wanted.size === 0) return { error: "Your cart is empty." };

  const supabase = createAdminClient();

  // Idempotency: a repeated submit with the same key returns the same order.
  if (input.idempotencyKey) {
    const { data: existing } = await supabase
      .from("orders")
      .select("id")
      .eq("idempotency_key", input.idempotencyKey)
      .maybeSingle();
    if (existing) return { orderId: existing.id };
  }

  // Authoritative item data straight from the DB.
  const ids = [...wanted.keys()];
  const { data: dbItems, error: itemsErr } = await supabase
    .from("menu_items")
    .select("id,name,price_paise,is_available")
    .in("id", ids);
  if (itemsErr) return { error: "Something went wrong. Please try again." };

  const byId = new Map((dbItems ?? []).map((i) => [i.id, i]));
  const unavailable: string[] = [];
  for (const id of ids) {
    const item = byId.get(id);
    if (!item || !item.is_available) unavailable.push(item?.name ?? "an item");
  }
  if (unavailable.length > 0) {
    return {
      error: `No longer available: ${unavailable.join(", ")}. Please update your cart.`,
    };
  }

  // Compute totals server-side (integer paise).
  let subtotal = 0;
  const orderItems = ids.map((id) => {
    const item = byId.get(id)!;
    const qty = wanted.get(id)!;
    const line = item.price_paise * qty;
    subtotal += line;
    return {
      menu_item_id: id,
      name_snapshot: item.name,
      unit_price_paise_snapshot: item.price_paise,
      quantity: qty,
      line_total_paise: line,
    };
  });
  const total = subtotal; // no taxes/fees in v1

  let session: Awaited<ReturnType<typeof ensureSession>>;
  try {
    session = await ensureSession(name, phone);
  } catch (e) {
    console.error("createOrder: could not create session:", e);
    return { error: "Couldn't place your order. Please try again." };
  }

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      session_id: session.id,
      customer_name: name,
      customer_phone: phone,
      status: "pending_payment",
      payment_status: "created",
      subtotal_paise: subtotal,
      total_paise: total,
      idempotency_key: input.idempotencyKey || null,
    })
    .select("id")
    .single();

  if (orderErr || !order) {
    // Likely a race on the idempotency key — return the winning order.
    if (input.idempotencyKey) {
      const { data: existing } = await supabase
        .from("orders")
        .select("id")
        .eq("idempotency_key", input.idempotencyKey)
        .maybeSingle();
      if (existing) return { orderId: existing.id };
    }
    return { error: "Couldn't place your order. Please try again." };
  }

  const { error: itemsInsertErr } = await supabase
    .from("order_items")
    .insert(orderItems.map((oi) => ({ ...oi, order_id: order.id })));

  if (itemsInsertErr) {
    await supabase.from("orders").delete().eq("id", order.id); // best-effort cleanup
    return { error: "Couldn't place your order. Please try again." };
  }

  return { orderId: order.id };
}
