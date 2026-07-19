# Night Canteen — Local Setup

Get the app running locally end-to-end. Full spec: [`docs/TRD.md`](docs/TRD.md).

## Prerequisites
- Node 20+ (Node 25 tested) and pnpm.
- A free [Supabase](https://supabase.com) account.

## 1. Install dependencies
```bash
pnpm install
```

## 2. Create a Supabase project
1. Go to [supabase.com](https://supabase.com) → **New project**. Pick a name and a strong DB password (save it), region closest to campus (e.g. Mumbai).
2. Wait for it to provision (~1–2 min).

## 3. Add your keys to `.env.local`
In the Supabase dashboard → **Project Settings → API**, copy:

| `.env.local` var | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` / `public` key |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role` key (keep secret — server only) |

`.env.local` already exists with blank slots — just paste the values in.

## 4. Create the schema + seed the menu
In the Supabase dashboard → **SQL Editor**, run these two files (copy-paste their contents, run each):

1. [`supabase/migrations/0001_menu.sql`](supabase/migrations/0001_menu.sql) — creates the menu tables + security policies.
2. [`supabase/seed.sql`](supabase/seed.sql) — inserts a sample Night Canteen menu.

> Later milestones add more migration files (run them in numeric order).

## 5. Run the app
```bash
pnpm dev
```
Open http://localhost:3000. The status page should show all three checks green, including **Database reachable — 10 menu items found**.

You can also hit the JSON probe: http://localhost:3000/api/health

## Troubleshooting
- **"Supabase configured" is red** → keys missing/typo'd in `.env.local`; restart `pnpm dev` after editing env.
- **"Database reachable" is red** → migration not run yet, or wrong project URL/key.

---

### Milestone status
- **M0 (now):** foundations, menu schema, health check. ✅
- **M1 (next):** admin login + menu management, customer menu browse.
- Razorpay keys are only needed at **M3** (test mode first).
