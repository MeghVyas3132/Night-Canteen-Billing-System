import Link from "next/link";
import { getAnalytics, type Range } from "@/lib/analytics";
import { formatPaise } from "@/lib/format";
import { cn } from "@/lib/cn";

export const dynamic = "force-dynamic";

const RANGES: { key: Range; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 days" },
  { key: "all", label: "All time" },
];

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range: rawRange } = await searchParams;
  const range: Range =
    rawRange === "7d" || rawRange === "all" ? rawRange : "today";
  const a = await getAnalytics(range);

  const maxSeller = Math.max(1, ...a.bestSellers.map((s) => s.revenuePaise));
  const maxHour = Math.max(1, ...a.salesByHour);
  const maxDay = Math.max(1, ...a.salesByDay.map((d) => d.revenuePaise));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-foreground">Analytics</h1>
        <div className="flex rounded-lg border border-border bg-surface p-0.5">
          {RANGES.map((r) => (
            <Link
              key={r.key}
              href={`/admin/analytics?range=${r.key}`}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                range === r.key
                  ? "bg-primary text-on-primary"
                  : "text-muted hover:text-foreground",
              )}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Sales" value={formatPaise(a.totalSalesPaise)} />
        <Stat label="Orders" value={String(a.orderCount)} />
        <Stat label="Avg order" value={formatPaise(a.avgOrderPaise)} />
      </div>

      {a.orderCount === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-strong bg-surface px-6 py-14 text-center">
          <p className="text-base font-medium text-foreground">No sales yet</p>
          <p className="mx-auto mt-1.5 max-w-xs text-sm text-muted">
            Paid orders in this window will show up here.
          </p>
        </div>
      ) : (
        <>
          {/* Best sellers */}
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
            <h2 className="mb-4 text-sm font-semibold text-foreground">
              Top sellers
            </h2>
            <div className="space-y-3">
              {a.bestSellers.map((s) => (
                <div key={s.name}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate text-foreground">{s.name}</span>
                    <span className="shrink-0 tabular-nums text-muted">
                      {formatPaise(s.revenuePaise)} · {s.qty} sold
                    </span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(s.revenuePaise / maxSeller) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Peak hours */}
          <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
            <h2 className="mb-4 text-sm font-semibold text-foreground">
              Busiest hours{" "}
              <span className="font-normal text-muted">(IST)</span>
            </h2>
            <div className="flex h-28 items-end gap-0.5">
              {a.salesByHour.map((v, h) => (
                <div
                  key={h}
                  title={`${h}:00 — ${formatPaise(v)}`}
                  className="flex-1 rounded-t bg-accent"
                  style={{ height: `${Math.max((v / maxHour) * 100, v > 0 ? 4 : 0)}%` }}
                />
              ))}
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] text-muted">
              <span>12a</span>
              <span>6a</span>
              <span>12p</span>
              <span>6p</span>
              <span>11p</span>
            </div>
          </section>

          {/* Daily trend */}
          {range !== "today" && (
            <section className="rounded-2xl border border-border bg-surface p-5 shadow-card">
              <h2 className="mb-4 text-sm font-semibold text-foreground">
                Last 7 days
              </h2>
              <div className="flex h-28 items-end gap-2">
                {a.salesByDay.map((d) => (
                  <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
                    <div className="flex w-full flex-1 items-end">
                      <div
                        title={`${d.label} — ${formatPaise(d.revenuePaise)}`}
                        className="w-full rounded-t bg-primary"
                        style={{ height: `${Math.max((d.revenuePaise / maxDay) * 100, d.revenuePaise > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted">{d.label.split(" ")[0]}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-card">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
        {value}
      </p>
    </div>
  );
}
