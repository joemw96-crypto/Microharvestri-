// Creates a Stripe Checkout session for a subscription plan, then hands the
// browser a URL to redirect to. Stripe's own hosted page collects the card
// details from there — this function never sees or stores card numbers.

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Map the plan keys used on the site to the Stripe Price IDs you create
// in the Stripe Dashboard (see README-STRIPE-SETUP.md, step 2).
const PRICE_IDS = {
  weekly: process.env.STRIPE_PRICE_WEEKLY,
  biweekly: process.env.STRIPE_PRICE_BIWEEKLY,
  monthly: process.env.STRIPE_PRICE_MONTHLY,
};

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const data = JSON.parse(event.body);
    const priceId = PRICE_IDS[data.plan];

    if (!priceId) {
      return { statusCode: 400, body: JSON.stringify({ error: "Unknown plan selected." }) };
    }
    if (!data.varieties || data.varieties.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: "Pick at least one variety." }) };
    }
    if (!data.email) {
      return { statusCode: 400, body: JSON.stringify({ error: "Email is required." }) };
    }

    const siteUrl = process.env.SITE_URL || "https://microharvest.com";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: data.email,
      success_url: `${siteUrl}/?success=true`,
      cancel_url: `${siteUrl}/?canceled=true`,
      // Metadata rides along on the Stripe object so you can see it in the
      // Dashboard, and it's also what the webhook receives below.
      metadata: {
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        address: data.address || "",
        deliveryDay: data.deliveryDay || "",
        varieties: (data.varieties || []).join(", "),
      },
    });

    return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
