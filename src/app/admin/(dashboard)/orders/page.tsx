import { createClient } from "@/lib/supabase/server";
import { ACTIVE_STATUSES, type BoardOrder } from "@/lib/order-status";
import { OrderBoard } from "@/components/admin/order-board";

export const dynamic = "force-dynamic";

const SELECT =
  "id,daily_order_number,customer_name,customer_phone,status,total_paise,created_at,order_items(name_snapshot,quantity)";

export default async function OrdersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("orders")
    .select(SELECT)
    .in("status", ACTIVE_STATUSES)
    .order("created_at", { ascending: true });

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <h1 className="text-xl font-semibold text-foreground">Orders</h1>
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-success" />
          </span>
          Live
        </span>
      </div>
      <OrderBoard initial={(data ?? []) as unknown as BoardOrder[]} />
    </div>
  );
}
