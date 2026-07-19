"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCheckoutSignature } from "@/lib/razorpay";
import { markOrderPaid } from "@/lib/payments";

export type VerifyPaymentInput = {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
};

/**
 * Verifies a Razorpay checkout success from the browser. The signature is HMAC'd
 * with the server-only key secret, so a forged callback can't pass. On success
 * the order is marked paid (idempotent — the webhook may also confirm it).
 */
export async function verifyPayment(
  input: VerifyPaymentInput,
): Promise<{ ok: boolean; error?: string }> {
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } =
    input ?? {};
  if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return { ok: false, error: "Missing payment details." };
  }

  if (
    !verifyCheckoutSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature)
  ) {
    return { ok: false, error: "Payment could not be verified." };
  }

  // The signed Razorpay order must match the one we created for this order.
  const supabase = createAdminClient();
  const { data: order } = await supabase
    .from("orders")
    .select("id,razorpay_order_id")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || order.razorpay_order_id !== razorpayOrderId) {
    return { ok: false, error: "This payment doesn't match your order." };
  }

  await markOrderPaid(orderId, razorpayPaymentId);
  return { ok: true };
}
