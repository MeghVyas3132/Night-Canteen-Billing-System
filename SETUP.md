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
Easiest: in the Supabase dashboard → **SQL Editor** → **New query**, paste **all** of
[`supabase/setup.sql`](supabase/setup.sql) and press **Run**. It bundles every migration + the seed and is safe to re-run.

<details><summary>Or run the migrations individually (in order)</summary>

1. [`0001_menu.sql`](supabase/migrations/0001_menu.sql) — menu tables + public-read policies.
2. [`0002_admin.sql`](supabase/migrations/0002_admin.sql) — admin profiles, audit log, `is_admin()`, admin write policies.
3. [`0003_orders.sql`](supabase/migrations/0003_orders.sql) — customer sessions, orders, order items.
4. [`0004_payment.sql`](supabase/migrations/0004_payment.sql) — atomic daily order number.
5. [`seed.sql`](supabase/seed.sql) — sample menu.
</details>

## 4b. Create an admin (staff) account
1. Supabase dashboard → **Authentication → Users → Add user** → enter an email + password (this is how staff sign in). Confirm/auto-confirm the user.
2. Copy that user's **User UID**.
3. In the **SQL Editor**, run (replace the UID and name):
   ```sql
   insert into public.admin_profiles (user_id, display_name, role)
   values ('PASTE-USER-UID-HERE', 'Your Name', 'owner');
   ```
4. Sign in at **http://localhost:3000/admin/login**. You should land on the menu manager.

## 4c. Razorpay (Test Mode) — for taking payments
1. Create a free account at [razorpay.com](https://razorpay.com) and stay in **Test Mode** (toggle, top of dashboard). No KYC needed to test.
2. **Settings → API Keys → Generate Test Key** → copy the **Key ID** (`rzp_test_…`) and **Key Secret**.
3. Put them in `.env.local`:
   ```
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxx
   ```
4. Restart `pnpm dev`. At checkout, pay with a **test UPI id** like `success@razorpay` (Razorpay's test simulator) to complete an order.

> The **webhook secret** is only needed once deployed to a public URL (Razorpay can't reach `localhost`). Locally, the server-side signature check confirms payments.

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
- **M0:** foundations, menu schema, health check. ✅
- **M1:** customer menu browse + admin login + menu management. ✅
- **M2:** customer session, cart with quantities, checkout (server-side pricing). ✅
- **M3:** Razorpay UPI payment (pay upfront) — paid orders enter the kitchen queue. ✅
- **M4 (next):** live order board + status flow (staff + customer).
