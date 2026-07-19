"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureSession } from "@/lib/session";
import { isSupabaseConfigured, isRazorpayConfigured } from "@/lib/env";
import { createRazorpayOrder, razorpayKeyId } from "@/lib/razorpay";

export type CreateOrderInput = {
  items: { id: string; qty: number }[];
  name: string;
  phone?: string;
  idempotencyKey: string;
};

export type CreateOrderResult =
  | { error: string }
  | { alreadyPaid: true; orderId: string }
  | {
      orderId: string;
      razorpayOrderId: string;
      amountPaise: number;
      keyId: string;
      customerName: string;
      phone: string | null;
    };

const MAX_QTY_PER_ITEM = 50;

/**
 * Creates (or re-uses, for retries) a pending order + its Razorpay order.
 * ALL pricing is recomputed server-side; the client only sends ids + quantities.
 * Idempotent on `idempotencyKey`, so a retry re-opens payment for the same order.
 */
export async function createOrder(
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  if (!isSupabaseConfigured()) {
    return { error: "Ordering isn't available yet. Please try again later." };
  }
  if (!isRazorpayConfigured()) {
    return { error: "Payments aren't set up yet. Please try again soon." };
  }

  const name = (input.name ?? "").trim();
  if (!name) return { error: "Please enter your name." };
  if (name.length > 60) return { error: "That name is too long." };

  const phone = (input.phone ?? "").trim() || null;
  if (phone && !/^[0-9+\-\s]{6,15}$/.test(phone)) {
    return { error: "Enter a valid phone number, or leave it blank." };
  }

  const supabase = createAdminClient();

  // Retry path: same idempotency key → same order (re-open its payment).
  if (input.idempotencyKey) {
    const { data: existing } = await supabase
      .from("orders")
      .select(
        "id,total_paise,payment_status,razorpay_order_id,customer_name,customer_phone",
      )
      .eq("idempotency_key", input.idempotencyKey)
      .maybeSingle();
    if (existing) {
      if (existing.payment_status === "paid") {
        return { alreadyPaid: true, orderId: existing.id };
      }
      const rzpId = await ensureRazorpayOrder(supabase, existing.id, existing.razorpay_order_id, existing.total_paise);
      if (!rzpId) return { error: "Couldn't start the payment. Please try again." };
      return {
        orderId: existing.id,
        razorpayOrderId: rzpId,
        amountPaise: existing.total_paise,
        keyId: razorpayKeyId(),
        customerName: existing.customer_name,
        phone: existing.customer_phone,
      };
    }
  }

  // New order: sanitize quantities.
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

  // Authoritative item data from the DB.
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
    if (input.idempotencyKey) {
      const { data: existing } = await supabase
        .from("orders")
        .select("id")
        .eq("idempotency_key", input.idempotencyKey)
        .maybeSingle();
      if (existing) return createOrder(input); // rare race — restart on the retry path
    }
    return { error: "Couldn't place your order. Please try again." };
  }

  const { error: itemsInsertErr } = await supabase
    .from("order_items")
    .insert(orderItems.map((oi) => ({ ...oi, order_id: order.id })));
  if (itemsInsertErr) {
    await supabase.from("orders").delete().eq("id", order.id);
    return { error: "Couldn't place your order. Please try again." };
  }

  const rzpId = await ensureRazorpayOrder(supabase, order.id, null, total);
  if (!rzpId) {
    // Order persists as pending; a retry (same key) will re-attempt payment.
    return { error: "Couldn't start the payment. Please try again." };
  }

  return {
    orderId: order.id,
    razorpayOrderId: rzpId,
    amountPaise: total,
    keyId: razorpayKeyId(),
    customerName: name,
    phone,
  };
}

/** Returns the order's Razorpay order id, creating + storing it if needed. */
async function ensureRazorpayOrder(
  supabase: SupabaseClient,
  orderId: string,
  existingRazorpayOrderId: string | null,
  amountPaise: number,
): Promise<string | null> {
  if (existingRazorpayOrderId) return existingRazorpayOrderId;
  const rzp = await createRazorpayOrder(amountPaise, orderId);
  if (!rzp) return null;
  await supabase
    .from("orders")
    .update({ razorpay_order_id: rzp.id })
    .eq("id", orderId);
  return rzp.id;
}
