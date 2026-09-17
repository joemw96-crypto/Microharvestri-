# Stripe Setup — Your Mom's Microgreens / microharvest.com

This folder contains everything needed to accept real subscription payments.
Follow these steps in order.

## 1. Create your Stripe account
Go to https://dashboard.stripe.com/register and sign up. Stripe starts you
in **Test mode** — you can build and test everything with fake card numbers
before ever touching real money.

## 2. Create your three subscription products
In the Stripe Dashboard: **Product catalog → + Add product**

Create three products, each with a **recurring price**:

| Product   | Price   | Billing period      |
|-----------|---------|----------------------|
| Weekly    | $14.00  | Every 1 week         |
| Bi-weekly | $16.00  | Every 2 weeks        |
| Monthly   | $28.00  | Every 1 month        |

After saving each one, click into it and copy its **Price ID** — it looks
like `price_1AbCdEfGhIjKlMnO`. You'll need all three.

## 3. Get your API keys
**Developers → API keys** (in test mode to start). Copy the **Secret key**
(starts with `sk_test_...`). Never put this in the HTML file or anywhere
public — it only goes in Netlify's environment variables (next step).

## 4. Set environment variables in Netlify
In your Netlify site: **Site configuration → Environment variables → Add
a variable**. Add all of these:

| Key                     | Value                                      |
|--------------------------|--------------------------------------------|
| `STRIPE_SECRET_KEY`      | your secret key from step 3                |
| `STRIPE_PRICE_WEEKLY`    | the weekly Price ID from step 2            |
| `STRIPE_PRICE_BIWEEKLY`  | the bi-weekly Price ID from step 2         |
| `STRIPE_PRICE_MONTHLY`   | the monthly Price ID from step 2           |
| `SITE_URL`               | `https://microharvest.com`                 |
| `STRIPE_WEBHOOK_SECRET`  | (added in step 6, once you have it)        |

## 5. Deploy this whole folder to Netlify
This is different from your earlier drag-and-drop deploys, because these
functions need `npm install` to run first. Two ways to do it:

**Option A — Netlify CLI (recommended, ~10 minutes one-time setup)**
1. Install Node.js from https://nodejs.org if you don't have it.
2. Open a terminal in this folder and run:
   ```
   npm install -g netlify-cli
   npm install
   netlify login
   netlify deploy --prod
   ```
3. When prompted, link it to your existing microharvest.com site.

**Option B — Connect a GitHub repo to Netlify**
1. Create a GitHub repo and push this folder's contents to it.
2. In Netlify: **Add new site → Import an existing project** → connect
   the repo. Netlify will run `npm install` automatically on every push.

Either way, once deployed, your live site's HTML, the checkout function,
and the webhook function are all served from the same microharvest.com
domain.

## 6. Set up the webhook
In Stripe: **Developers → Webhooks → + Add endpoint**
- Endpoint URL: `https://microharvest.com/.netlify/functions/stripe-webhook`
- Events to send: `checkout.session.completed`, `invoice.paid`,
  `customer.subscription.deleted`

After creating it, Stripe shows a **Signing secret** (starts with `whsec_...`).
Copy it into Netlify's environment variables as `STRIPE_WEBHOOK_SECRET`
(from step 4), then redeploy.

## 7. Test it
Use Stripe's test card `4242 4242 4242 4242`, any future expiry date, any
CVC. Complete a checkout on your live site and confirm:
- You land back on the site with the "you're on the list" confirmation
- The payment shows up in Stripe Dashboard → Payments (in test mode)
- Netlify's function logs (Site → Functions → stripe-webhook) show the
  event was received

## 8. Go live
Once everything works in test mode: in Stripe, toggle from **Test mode**
to **Live mode** (top right), repeat steps 2–3 to get *live* Price IDs and
a live secret key, and update the Netlify environment variables with the
live values. Real charges will start working immediately after.

## Where to actually see/manage orders
Right now, new signups and renewals are only logged to Netlify's function
logs — nothing gets saved anywhere permanent yet. Before going live for
real customers, it's worth adding one more step to the webhook: emailing
yourself (via a service like SendGrid) or writing each order to a simple
spreadsheet (via Zapier + Google Sheets is a common no-code way to do
this without more custom code).
