import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Marks an order paid and moves it into the kitchen queue. Idempotent and safe
 * under races: the status flip is an atomic claim (only the first caller wins),
 * and the daily order number is assigned exactly once. Called by both the
 * client-verify path and the webhook — whichever confirms first.
 */
export async function markOrderPaid(
  orderId: string,
  paymentId: string,
): Promise<void> {
  const supabase = createAdminClient();

  // Atomic claim: only rows not already paid are updated. A concurrent second
  // caller re-evaluates the filter after the row lock and updates 0 rows.
  const { data: claimed } = await supabase
    .from("orders")
    .update({
      payment_status: "paid",
      status: "new",
      paid_at: new Date().toISOString(),
      razorpay_payment_id: paymentId,
    })
    .eq("id", orderId)
    .neq("payment_status", "paid")
    .select("id,daily_order_number")
    .maybeSingle();

  if (!claimed) return; // already paid — nothing to do

  if (claimed.daily_order_number == null) {
    const { data: num, error } = await supabase.rpc("next_daily_order_number");
    if (!error && typeof num === "number") {
      await supabase
        .from("orders")
        .update({ daily_order_number: num })
        .eq("id", orderId);
    }
  }
}
