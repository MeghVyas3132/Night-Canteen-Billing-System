import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { createAdminClient } from "@/lib/supabase/admin";
import { markOrderPaid } from "@/lib/payments";

export const dynamic = "force-dynamic";

type RazorpayWebhook = {
  event?: string;
  payload?: {
    payment?: { entity?: { id?: string; order_id?: string } };
  };
};

/**
 * Razorpay webhook — the server-to-server source of truth for payment. Verifies
 * the signature with the webhook secret, then marks the matching order paid
 * (idempotent). Covers the case where the customer closes the tab after paying.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";

  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  let event: RazorpayWebhook;
  try {
    event = JSON.parse(raw) as RazorpayWebhook;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (event.event === "payment.captured" || event.event === "order.paid") {
    const payment = event.payload?.payment?.entity;
    const razorpayOrderId = payment?.order_id;
    const paymentId = payment?.id;

    if (razorpayOrderId && paymentId) {
      const supabase = createAdminClient();
      const { data: order } = await supabase
        .from("orders")
        .select("id")
        .eq("razorpay_order_id", razorpayOrderId)
        .maybeSingle();
      if (order) await markOrderPaid(order.id, paymentId);
    }
  }

  return NextResponse.json({ ok: true });
}
