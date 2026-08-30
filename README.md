# Mandate

An AI shopping agent that can spend money on your behalf, without ever
losing the paper trail. Built for Razorpay's AI Growth & Agentic Commerce
track.

## The idea

You set a spending rule once (a cap, a list of allowed merchants). That
rule is signed as a cryptographic "intent mandate" and registered as a
real Razorpay UPI Autopay token. From then on, an agent can shop for you
within that rule: it finds something on a merchant's catalog, signs a
"cart mandate" locking in the price, signs a single-use "payment mandate",
and schedules the debit. Every step is logged to an audit ledger you can
inspect at any time. If a merchant's price changes after the cart mandate
was signed, the purchase is blocked and escalated back to you instead of
silently overcharging.

This mirrors the mandate chain from Google's AP2 protocol (Intent -> Cart
-> Payment), but the settlement rail is Razorpay's actual UPI Autopay
product rather than a generic card charge - which is the part nobody's
built yet for India.

## Project structure

```
mandate-app/
  backend/    Express API: mandate signing, buyer agent, audit log,
              Razorpay integration (mocked by default)
  frontend/   React + Vite dashboard: set the rule, chat with the agent,
              watch the audit ledger fill in live
```

## Running it

You need Node.js 18+ installed.

**Backend**
```
cd backend
cp .env.example .env
npm install
npm start
```
Runs on http://localhost:4000.

**Frontend** (in a second terminal)
```
cd frontend
npm install
npm run dev
```
Runs on http://localhost:5173 and proxies /api calls to the backend.

Open http://localhost:5173, register a mandate, type a request like
"Get something nice for Priya, under 2000, from Nykaa", find a match, and
confirm the purchase. Watch the audit ledger update. Tick "simulate a
price change" on a different item to see the graceful failure case.

## Mock mode vs real Razorpay

By default `RAZORPAY_MOCK=true` in `backend/.env`, so the whole app runs
with zero credentials - `lib/razorpay.js` simulates Razorpay's UPI Autopay
responses and the mandate goes active immediately.

To use real test-mode calls:

1. Generate test-mode keys from the Razorpay dashboard (Account & Settings
   -> API Keys -> Generate Key, in Test mode).
2. In `backend/.env` set `RAZORPAY_MOCK=false`, `RAZORPAY_KEY_ID`,
   `RAZORPAY_KEY_SECRET`, and fill in `DEMO_CUSTOMER_*` (or pass a real
   name/contact/email in the policy form - you need a UPI app on that
   number to approve the mandate).
3. Register a mandate in the UI. `status` will be `awaiting_approval` and
   you'll see a Razorpay-hosted approval link.
4. Open that link (on any device) and approve with your UPI app.
5. Back in the app, click "I've approved it - check status." This calls
   `POST /api/policy/check-approval`, which fetches the invoice, then the
   payment behind it, and pulls out the real `token_id` once it's
   `captured`.
6. From here on, purchases call Razorpay's real `/orders` and
   `/payments/create/recurring` endpoints to schedule and execute the
   debit - see `scheduleDebit` in `lib/razorpay.js`.

This uses Razorpay's Registration Link product
(`/subscription_registration/auth_links`), which rides on their Invoices
infrastructure. Two earlier approaches were tried and documented in this
project's history: a direct S2S authorization call, and Razorpay's
Checkout widget - both ultimately require Razorpay to explicitly activate
UPI Autopay for your account, which can take days via a support request.
Registration Links are worth trying first since Invoices is a more
universally-available product, but if this also returns an error, that's
the same underlying account-activation gate, not a code problem - mock
mode exercises the identical downstream logic (mandate signing, policy
checks, audit trail) either way.

**Test mode still requires a real UPI app approval step** - it doesn't
move real money, but the mandate registration itself is a genuine NPCI
sandbox round trip, not simulated. That's worth calling out in your pitch:
this isn't a stub, it's the real integration running against test rails.

## What's simplified for the demo, on purpose

- **Mandate signing** uses HMAC-SHA256, not the full ECDSA verifiable
  credential scheme from AP2. Same idea (tamper-evident, checkable), much
  simpler to implement in the time available.
- **The 24-hour RBI pre-debit notice** is compressed to a few seconds
  (`DEMO_DEBIT_DELAY_MS` in `.env`) so you can actually see it in a pitch
  video.
- **The merchant catalog** (`backend/lib/merchants/*.json`) is
  representative sample data - realistic product names, prices, and
  categories modeled on each brand's real catalog structure - not
  live-scraped. Real production merchants would expose this as a live
  feed or API; the matching logic downstream (`lib/matcher.js`) is
  identical either way, so swapping a static file for a live fetch per
  merchant is a small, isolated change, not a rewrite. Adding a new
  merchant today is just dropping in a new JSON file shaped like the
  others - no code changes needed.
- **The buyer agent's matching** (`lib/matcher.js`) is a real scoring
  engine - keyword overlap against name/category/tags, budget fit, ranked
  alternatives with a plain-English reason for the pick - not an LLM, but
  genuinely more than a regex. Swap in a real model call here if you want
  free-form natural language understanding on top of this.

Worth saying plainly in your pitch: this is not a full implementation of
AP2, ACP, or NPCI's proposed UAP. It borrows their core idea (a signed,
scoped permission chain) and plugs it into Razorpay's existing UPI Autopay
product, which is the part that's genuinely missing today.
