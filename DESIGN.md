# Design

Visual system for Night Canteen. Tokens live in `src/app/globals.css` (Tailwind v4 `@theme`); this file is the rationale. Register: **product** (customer ordering flow leans lightly experiential; admin is a clean task tool).

## Theme

**Mood:** a midnight food-truck window — deep night-blue air, warm lamp glow over the counter, food that looks good under a hanging bulb. Light, legible content surface; the "night" is carried by the **brand color, the wordmark, and drenched header moments**, not by tinting the whole page dark. Color strategy: **Restrained → Committed** — neutral surfaces, deep-indigo brand, warm-amber accent kept under ~15% of any screen.

## Color (OKLCH)

Neutrals carry a whisper of the brand's cool hue (night air); pure-white cards lift off the canvas.

| Role | Token | OKLCH | Use |
|---|---|---|---|
| Canvas | `--bg` | `0.985 0.006 250` | App background (night-air near-white) |
| Surface | `--surface` | `1 0 0` | Cards, sheets, inputs — pure white lift |
| Surface muted | `--surface-2` | `0.965 0.008 250` | Secondary panels, table zebra, toolbars |
| Ink | `--ink` | `0.24 0.03 258` | Primary text, near-black indigo |
| Muted ink | `--muted` | `0.48 0.025 258` | Secondary text (≥4.5:1 on white/bg) |
| Border | `--border` | `0.912 0.008 255` | Hairlines |
| Border strong | `--border-strong` | `0.85 0.012 255` | Inputs, dividers that need weight |
| **Primary** | `--primary` | `0.42 0.105 250` | Brand + primary actions (incl. Pay) |
| Primary hover | `--primary-hover` | `0.36 0.10 250` | Hover/active |
| Primary deep | `--primary-deep` | `0.26 0.07 256` | Drenched headers / night-sky bars |
| On-primary | `--on-primary` | `0.99 0.01 250` | Text/icon on primary |
| **Accent** | `--accent` | `0.80 0.14 74` | Warm amber "lamp glow": add-to-cart, active cart bar, highlights |
| Accent hover | `--accent-hover` | `0.75 0.145 68` | Hover/active |
| On-accent | `--on-accent` | `0.26 0.05 60` | Dark warm text on amber (amber is light → always dark text) |
| Success | `--success` | `0.58 0.12 150` | Paid / Ready |
| Success bg | `--success-bg` | `0.95 0.03 150` | Success surfaces/badges |
| Danger | `--danger` | `0.56 0.20 25` | Errors, cancel, sold-out |
| Danger bg | `--danger-bg` | `0.96 0.03 25` | Danger surfaces/badges |

**Rules:** amber is light — pair it only with dark (`--on-accent`) text, never white. Status is never color-only; always pair with a label/icon. Accent is for action + state, never decoration.

## Typography

Two families on a genuine contrast axis (serif display + geometric sans). Serif is used **only** for the wordmark and the customer welcome/hero heading — never in UI labels, buttons, prices, or data.

- **Display:** `Fraunces` (variable serif, soft/optical) — wordmark, hero H1. `font-display`.
- **UI / body:** `Geist` (geometric sans) — everything else. `font-sans`.
- **Mono:** `Geist Mono` — order numbers, amounts in dense contexts. `font-mono`.

Fixed rem scale (product), ratio ~1.2: `12 / 14 / 16 / 18 / 20 / 24 / 30 / 36`. Body 16px, muted 14px. Line length 65–75ch for prose. `text-wrap: balance` on headings.

## Spacing, radius, elevation

- Spacing: 4px base scale (Tailwind default). Generous vertical rhythm; vary it, don't uniformly pad.
- Radius: `--radius-sm 8` · `--radius 12` · `--radius-lg 16` · `--radius-xl 20`. Buttons: `--radius` (friendly, not full-pill except the floating cart bar).
- Elevation: soft, low-spread shadows tinted with the ink hue. `--shadow-sm` for cards, `--shadow-lg` for sheets/floating cart. Avoid heavy drop shadows.

## Components (states are mandatory)

Every interactive element ships default / hover / focus-visible / active / disabled / loading. Consistent vocabulary across customer + admin.

- **Button** — variants: `primary` (indigo), `accent` (amber, dark text), `secondary` (surface + border), `ghost`, `danger`. Sizes sm/md/lg; `lg` = 48px min for phone CTAs. Loading = inline spinner + disabled.
- **Card / Surface** — white on canvas, `--border` hairline, `--radius-lg`. No nested cards.
- **Badge / Status pill** — semantic bg tint + label (Sold out, Paid, Preparing, Ready).
- **Input / Field** — white, `--border-strong`, clear focus ring (`--primary` at low alpha), label + error slot.
- **Quantity stepper** — −/number/＋, 44px targets, disabled at bounds.
- **Sheet / Dialog** — bottom-sheet on phone; used sparingly (modals are a last resort per product rules).
- **Empty state** — teaches the screen ("No orders yet — paid orders land here"), never blank.
- **Skeleton** — for loading lists (menu, orders), not center spinners.

## Motion

150–250ms, ease-out (quart/expo). Motion conveys state only: button press, add-to-cart fly/confirm, status-change pulse, sheet slide-up, list stagger on first load (subtle). No orchestrated page-load choreography. Full `prefers-reduced-motion` fallbacks (crossfade/instant).

## Layout

Phone-first, structural responsiveness (not fluid type). Customer: single column, sticky brand header, floating cart bar. Admin: single column board on phone → wider board on tablet/desktop; top bar + minimal nav. Content max-width ~ 32rem (customer) for thumb reach; admin board can go wider.
