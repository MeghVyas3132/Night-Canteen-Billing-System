import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_STATUSES } from "@/lib/order-status";

export const dynamic = "force-dynamic";

const SELECT =
  "id,daily_order_number,customer_name,customer_phone,status,total_paise,created_at,order_items(name_snapshot,quantity)";

/** GET /api/admin/orders — active orders for the live board (admin only). */
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("orders")
    .select(SELECT)
    .in("status", ACTIVE_STATUSES)
    .order("created_at", { ascending: true });
  if (error) {
    return NextResponse.json({ error: "query_failed" }, { status: 500 });
  }

  return NextResponse.json({ orders: data ?? [] });
}
