# Mandate

An AI shopping agent that can spend money on your behalf, without ever losing the paper trail.

Built for Razorpay's AI Buildathon — Track 1: AI Growth & Agentic Commerce.

## The problem

There's currently no safe way to let an AI agent buy things for you. Every payment system assumes a human is physically clicking "buy," so nobody can verify an agent's purchase was actually authorized, or stop it from overspending. Google (AP2), OpenAI and Stripe (ACP), and Coinbase (x402) have all shipped protocols to solve this in the last year — none of them settle over UPI, India's dominant payment rail, and NPCI's own open standard for this (the Unified Agent Protocol) still needs RBI approval before it launches. Razorpay itself ran a curated pilot on this exact problem with Claude in February 2026 (Zomato, Swiggy, Zepto) — Mandate is a demonstration of the piece that pilot didn't cover: a generalized, pluggable version any merchant can join, not just three named partners.

## How it works

You set a spending rule once — a cap, a list of allowed merchants — and it's signed as a tamper-evident **intent mandate**, registered as a real Razorpay UPI Autopay token. From there, an agent can shop for you within that rule:

1. It searches a merchant catalog and scores candidates against your request — budget fit, keyword match — and shows you *why* it picked what it picked, with alternatives, not a black-box decision.
2. It locks in the price with a signed **cart mandate**.
3. A single-use **payment mandate** authorizes exactly one transaction, which triggers a real UPI Autopay debit.
4. Every step — approved or blocked — lands in a live audit ledger.

If a merchant's price changes after the cart mandate was signed, the purchase is blocked and escalated back to you instead of silently overcharging. That's the one failure case built in on purpose.

The mandate chain mirrors Google's AP2 (Intent → Cart → Payment) — reinventing that pattern would be pointless. What's actually new here is plugging it into Razorpay's real UPI Autopay product as the settlement rail, instead of a rail I made up for the demo.

## What's in the dashboard

- **Setup** — spending cap, merchant allowlist, mandate registration (real Razorpay Registration Link flow, or instant mock mode)
- **Agent** — natural-language purchase requests, ranked results with plain-English reasoning, one-click confirm
- **Ledger** — every signed mandate, every debit, every blocked attempt, timestamped and logged live
- **Annotate mode** — a toggle that overlays a red-pen explanation of what each part of the UI is actually doing, without ever changing the underlying product
- Swiss/International Typographic Style throughout — grid-driven, one accent color, no decoration for its own sake

## Track fit

Track 1's bar: *"Every money action explainable, bounded and gated. Show the audit trail and one failure handled gracefully."*

| Bar | Where it lives |
|---|---|
| Bounded | Spending cap + merchant allowlist, enforced before any mandate signs |
| Gated | Registration approval step, single-use payment mandates |
| Explainable | Every mandate is a signed, inspectable object; the agent states its reasoning |
| Audit trail | Live ledger, every event, every outcome |
| One failure handled gracefully | Price-mismatch check blocks and explains instead of overcharging |

## Tech stack

- **Backend** — Node.js, Express, HMAC-signed mandates, Razorpay REST API integration
- **Frontend** — React, Vite, hand-rolled Swiss design system (no UI framework)
- **Data** — JSON-file merchant catalogs (pluggable — see below), file-based audit log

## Project structure
mandate-app/
backend/
lib/
mandate.js signs and verifies intent/cart/payment mandates
matcher.js scoring engine the buyer agent uses to pick products
razorpay.js Razorpay integration (mock by default, real API when configured)
merchants/ one JSON file per merchant - drop in a new one to add a merchant
routes/ policy, agent, mandate, audit endpoints
frontend/
src/components/ Setup, Agent, Ledger, Annotate layer, flow diagram, info panel

## Running it

Requires Node.js 18+.

**Backend**
cd backend
cp .env.example .env
npm install
npm start
Runs on http://localhost:4000.

**Frontend** (second terminal)
cd frontend
npm install
npm run dev
Runs on http://localhost:5173, proxying `/api` to the backend.

Open the app, register a mandate, then try something like *"Get something nice for Priya, under 2000, from Nykaa"* in the Agent tab. Confirm the purchase and watch the ledger update. Tick "simulate a price change" on a different item to see the failure case block instead of overcharge.

## Mock mode vs real Razorpay

`RAZORPAY_MOCK=true` by default — the app runs with zero credentials, and mandates go active immediately using simulated Razorpay responses.

To use real test-mode calls:

1. Generate test-mode keys in the Razorpay dashboard (Account & Settings → API Keys → Generate Key, Test mode).
2. Set `RAZORPAY_MOCK=false`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` in `backend/.env`.
3. Register a mandate — status will be `awaiting_approval` with a Razorpay-hosted approval link.
4. Open the link on any device and approve with a UPI app.
5. Back in the app, click "I've approved it — check status." This polls the invoice, then the payment behind it, and pulls the real `token_id` once it's captured.
6. From here, purchases call Razorpay's real `/orders` and `/payments/create/recurring` endpoints.

This uses Razorpay's Registration Link product, which sits on their Invoices infrastructure. Two other approaches were implemented and tested first — a direct server-to-server call, and Razorpay's Checkout widget — both required Razorpay to explicitly activate UPI Autopay on the account, which needs a support request. Registration Links were worth trying since Invoices is a more universally-available product; if it also returns an activation error on a given account, that's the same underlying gate, not a code problem — mock mode exercises identical downstream logic either way.

Test mode still requires a genuine UPI app approval step. It doesn't move real money, but the registration itself is a real NPCI sandbox round trip, not a simulation.

## What's simplified, on purpose

- **Mandate signing** uses HMAC-SHA256, not the full ECDSA verifiable-credential scheme from AP2 — same tamper-evident property, far simpler to implement in the time available.
- **The 24-hour RBI pre-debit notice** is compressed to a few seconds (`DEMO_DEBIT_DELAY_MS`) so it's visible in a demo instead of requiring a real day's wait.
- **The merchant catalog** is representative sample data — realistic names, prices, and categories modeled on each brand's real catalog shape, not live-scraped. A real deployment would swap each JSON file for a live feed; the matching logic in `matcher.js` doesn't change either way.
- **The buyer agent's matching** is a transparent scoring engine — keyword overlap, budget fit, ranked alternatives with a stated reason — not an LLM. Swap in a model call here for free-form language understanding if needed; the explainability was a deliberate choice, not a limitation.
