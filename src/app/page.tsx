import { getSystemStatus } from "@/lib/health";

// Reads live DB state on every request; never prerender at build time.
export const dynamic = "force-dynamic";

/**
 * M0 landing / system-status page.
 * Proves the app is running and can reach Supabase end-to-end. This placeholder
 * is replaced by the customer welcome + menu in M1/M2.
 */
export default async function Home() {
  const status = await getSystemStatus();

  const checks = [
    { label: "App running", ok: true, detail: "Next.js 16 on Vercel-ready setup" },
    {
      label: "Supabase configured",
      ok: status.supabaseConfigured,
      detail: status.supabaseConfigured
        ? "Environment keys detected"
        : "Add keys to .env.local — see SETUP.md",
    },
    {
      label: "Database reachable",
      ok: status.dbReachable,
      detail: status.dbReachable
        ? `${status.itemCount} menu item${status.itemCount === 1 ? "" : "s"} found`
        : status.error
          ? status.error
          : "Run the migration + seed — see SETUP.md",
    },
  ];

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-2xl text-accent-foreground shadow-sm">
            🌙
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Night Canteen</h1>
          <p className="mt-1 text-sm text-muted">QR ordering system — foundations (M0)</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-2 shadow-sm">
          <ul className="divide-y divide-border">
            {checks.map((check) => (
              <li key={check.label} className="flex items-start gap-3 px-4 py-3.5">
                <span
                  aria-hidden
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    check.ok
                      ? "bg-success/10 text-success"
                      : "bg-danger/10 text-danger"
                  }`}
                >
                  {check.ok ? "✓" : "!"}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{check.label}</span>
                  <span className="block truncate text-xs text-muted">
                    {check.detail}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          Milestone M0 · next up: menu &amp; admin management (M1)
        </p>
      </div>
    </main>
  );
}
