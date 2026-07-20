import "server-only";
import { createClient } from "@/lib/supabase/server";

export type Range = "today" | "7d" | "all";

export type Analytics = {
  range: Range;
  totalSalesPaise: number;
  orderCount: number;
  avgOrderPaise: number;
  bestSellers: { name: string; qty: number; revenuePaise: number }[];
  salesByHour: number[]; // 24 buckets, revenue paise (IST)
  salesByDay: { label: string; revenuePaise: number }[]; // last 7 days (IST)
};

type OrderRow = {
  total_paise: number;
  created_at: string;
  paid_at: string | null;
  order_items: { name_snapshot: string; quantity: number; line_total_paise: number }[];
};

function sinceFor(range: Range): string | null {
  const now = new Date();
  if (range === "today") {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }
  if (range === "7d") {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }
  return null;
}

const IST_HOUR = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Kolkata",
  hour: "numeric",
  hourCycle: "h23",
});
const IST_DAY = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Kolkata",
  weekday: "short",
  day: "numeric",
});

/** On-demand sales analytics over PAID orders. Computed in-process (small scale). */
export async function getAnalytics(range: Range): Promise<Analytics> {
  const supabase = await createClient();
  const since = sinceFor(range);

  let query = supabase
    .from("orders")
    .select(
      "total_paise,created_at,paid_at,order_items(name_snapshot,quantity,line_total_paise)",
    )
    .eq("payment_status", "paid");
  if (since) query = query.gte("created_at", since);

  const { data } = await query;
  const orders = (data ?? []) as unknown as OrderRow[];

  const totalSalesPaise = orders.reduce((s, o) => s + (o.total_paise ?? 0), 0);
  const orderCount = orders.length;
  const avgOrderPaise = orderCount ? Math.round(totalSalesPaise / orderCount) : 0;

  const itemMap = new Map<string, { qty: number; revenuePaise: number }>();
  const salesByHour = new Array(24).fill(0) as number[];

  // last 7 days buckets (IST), oldest → newest
  const dayBuckets = new Map<string, { label: string; revenuePaise: number }>();
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dayBuckets.set(key, { label: IST_DAY.format(d), revenuePaise: 0 });
  }

  for (const o of orders) {
    const when = new Date(o.paid_at ?? o.created_at);
    salesByHour[Number(IST_HOUR.format(when))] += o.total_paise ?? 0;

    const dayKey = when.toISOString().slice(0, 10);
    const bucket = dayBuckets.get(dayKey);
    if (bucket) bucket.revenuePaise += o.total_paise ?? 0;

    for (const it of o.order_items ?? []) {
      const cur = itemMap.get(it.name_snapshot) ?? { qty: 0, revenuePaise: 0 };
      cur.qty += it.quantity;
      cur.revenuePaise += it.line_total_paise;
      itemMap.set(it.name_snapshot, cur);
    }
  }

  const bestSellers = [...itemMap.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 8);

  return {
    range,
    totalSalesPaise,
    orderCount,
    avgOrderPaise,
    bestSellers,
    salesByHour,
    salesByDay: [...dayBuckets.values()],
  };
}
