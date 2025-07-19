import Stripe from "stripe";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  // Check if required environment variables are set
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("STRIPE_SECRET_KEY is not set");
    return res.status(500).json({ error: "Stripe configuration error" });
  }

  if (!process.env.STRIPE_PRICE_ID) {
    console.error("STRIPE_PRICE_ID is not set");
    return res.status(500).json({ error: "Stripe price configuration error" });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    console.log("🔍 Creating checkout session...");
    console.log("Request body:", req.body);

    // Get user email from request body
    const { userEmail } = req.body;

    if (!userEmail) {
      console.error("No user email provided");
      return res.status(400).json({
        error: "User email is required",
        debug: {
          hasRequestBody: !!req.body,
          bodyKeys: Object.keys(req.body || {}),
        },
      });
    }

    console.log("Creating checkout session for user:", userEmail);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      customer_email: userEmail,
      metadata: {
        user_email: userEmail,
      },
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/cancel`,
    });

    console.log("Checkout session created successfully:", session.id);
    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout session error:", err);
    console.error("Error details:", {
      message: err.message,
      type: err.type,
      code: err.code,
      statusCode: err.statusCode,
      raw: err.raw,
    });
    res.status(500).json({
      error: "Failed to create checkout session",
      details: err.message,
      type: err.type,
      code: err.code,
    });
  }
}
