import "server-only";
import { getSession } from "@/lib/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/env";
import type { OrderStatus } from "@/lib/order-status";

export type ActiveOrder = {
  id: string;
  daily_order_number: number | null;
  status: OrderStatus;
  payment_method: "upi" | "cash" | null;
};

/**
 * The current customer's most recent *active* order (paid & not yet collected,
 * or a cash order awaiting payment). Abandoned UPI checkouts are excluded.
 * Used to surface a "track your order" entry point so customers never lose it.
 */
export async function getActiveOrder(): Promise<ActiveOrder | null> {
  if (!isSupabaseConfigured()) return null;
  const session = await getSession();
  if (!session) return null;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("orders")
    .select("id,daily_order_number,status,payment_method")
    .eq("session_id", session.id)
    .or("status.in.(new,ready),and(status.eq.pending_payment,payment_method.eq.cash)")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as ActiveOrder) ?? null;
}
