# Product

## Register

product

## Users

Two audiences on one system, both on **phones**:

- **Customers** — students and staff at Vijaybhoomi campus, standing at (or near) the Night Canteen food truck, often at night. They want to order food quickly without queuing at the counter. First-time and repeat users; no app install; varied cheap Android phones on campus wifi/4G. Their job: scan → find what they want → pay → know when it's ready.
- **Staff** — the people running the truck during a shift. They manage the live order queue and the menu from their own phone, one-handed, while cooking. Their job: see paid orders instantly, advance them, and flip items to "sold out" fast.

## Product Purpose

A QR ordering system for a **single** campus food truck. A customer scans one QR, browses the menu, pays upfront via Razorpay, and watches their order status; staff see paid orders on a live board and manage the menu themselves — no developer in the loop. Success = orders flow reliably end-to-end, staff trust the board during a busy rush, and it feels like a real café's system, not a student prototype. Reliability and polish beat feature count.

## Brand Personality

Late-night comfort. Warm, friendly, and a little characterful — the feeling of your favorite campus spot after dark. Three words: **cozy, dependable, quick.** The identity leans into "Night": a deep midnight base with a warm amber "lamp glow." Appetizing and inviting, never cold or corporate. Copy is plain and human ("Sold out for now", "We're on it") — never jargon.

## Anti-references

- **Generic delivery-app clone** (Swiggy/Zomato): saturated orange everything, dense promo cards, ad banners, coupon clutter.
- **Corporate SaaS dashboard**: cold blue-gray enterprise admin, walls of dense tables, no warmth.
- **Cluttered POS/billing terminal**: utilitarian grids of tiny buttons, information overload.
- **Unstyled prototype**: default fonts, plain browser buttons, obviously-a-demo.

## Design Principles

1. **The tool disappears into the task.** Customers should reach payment in a few taps; staff should read the board at a glance. Earned familiarity over novelty.
2. **Warmth in the brand, clarity in the surface.** The night-and-amber mood lives in brand color, the wordmark, and copy — content surfaces stay clean and legible on a cheap phone in any light.
3. **One thing per screen.** Minimal by mandate. Resist adding controls; every element must earn its place.
4. **Trust at the money moment.** Prices, totals, and payment states are unambiguous and calm. Never make a paying customer or staff member guess.
5. **Fast feedback.** Every tap confirms itself; every status change is visible immediately on both sides.

## Accessibility & Inclusion

- Target **WCAG 2.1 AA**: body text ≥4.5:1, large text/UI ≥3:1, visible focus states, tap targets ≥44px (phone-first).
- Full `prefers-reduced-motion` support; motion only ever conveys state.
- Don't rely on color alone for status (pair color with a label/icon: "Ready", "Sold out").
- Legible defaults for small, low-quality screens and bright outdoor/dark night conditions.
