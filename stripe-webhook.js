// Stripe calls this URL directly whenever something happens on a
// subscription — a new signup, a renewal payment, a cancellation, etc.
// This is where you'd plug in "email me" or "add a row to my spreadsheet"
// logic. Right now it just logs, which is enough to prove it's wired up.

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

exports.handler = async function (event) {
  const sig = event.headers["stripe-signature"];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  switch (stripeEvent.type) {
    case "checkout.session.completed": {
      const session = stripeEvent.data.object;
      // Fires the moment someone finishes checkout for the first time.
      // Good place to: email yourself, add them to a spreadsheet/CRM,
      // or kick off a "welcome" email to the customer.
      console.log("New subscription:", {
        email: session.customer_email,
        metadata: session.metadata,
      });
      break;
    }
    case "invoice.paid": {
      // Fires on every renewal charge (weekly/bi-weekly/monthly).
      console.log("Renewal payment succeeded:", stripeEvent.data.object.id);
      break;
    }
    case "customer.subscription.deleted": {
      console.log("Subscription canceled:", stripeEvent.data.object.id);
      break;
    }
    default:
      console.log(`Unhandled event type: ${stripeEvent.type}`);
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
