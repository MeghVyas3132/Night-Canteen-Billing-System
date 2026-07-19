import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

const API = "https://api.razorpay.com/v1";

/** Returns the public Razorpay key id (safe to send to the browser). */
export function razorpayKeyId(): string {
  return env.razorpayKeyId;
}

/** Creates a Razorpay order for exactly `amountPaise`. Returns null on failure. */
export async function createRazorpayOrder(
  amountPaise: number,
  receipt: string,
): Promise<{ id: string } | null> {
  const auth = Buffer.from(
    `${env.razorpayKeyId}:${env.razorpayKeySecret}`,
  ).toString("base64");

  const res = await fetch(`${API}/orders`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: "INR",
      receipt,
      notes: { order: receipt },
    }),
  });

  if (!res.ok) {
    console.error(
      "razorpay order create failed:",
      res.status,
      await res.text().catch(() => ""),
    );
    return null;
  }
  const data = (await res.json()) as { id?: string };
  return data.id ? { id: data.id } : null;
}

/** Verifies the checkout success signature: HMAC_SHA256(order_id|payment_id). */
export function verifyCheckoutSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string,
): boolean {
  const expected = createHmac("sha256", env.razorpayKeySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");
  return safeEqualHex(expected, signature);
}

/** Verifies a webhook: HMAC_SHA256(rawBody) with the webhook secret. */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
): boolean {
  if (!env.razorpayWebhookSecret) return false;
  const expected = createHmac("sha256", env.razorpayWebhookSecret)
    .update(rawBody)
    .digest("hex");
  return safeEqualHex(expected, signature);
}

function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}
