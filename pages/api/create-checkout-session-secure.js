import Stripe from "stripe";
import { getAuth } from "@clerk/nextjs/server";

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
    console.log("🔍 === AUTH DEBUG ===");
    console.log("Has cookies:", !!req.headers.cookie);
    
    // Get authenticated user from Clerk
    const { userId, user } = getAuth(req);
    
    console.log("🔍 Auth result - userId:", userId, "user:", !!user);

    if (!userId || !user) {
      console.log("❌ Auth failed - no userId or user");
      return res.status(401).json({
        error: "Authentication required",
        message: "Please sign in to subscribe",
      });
    }

    // Get user email from authenticated user object
    const userEmail =
      user.primaryEmailAddress?.emailAddress ||
      user.emailAddresses?.[0]?.emailAddress;

    if (!userEmail) {
      console.error("No email found for authenticated user");
      return res.status(400).json({
        error: "No email found for user",
        message: "Please add an email to your account",
      });
    }

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
        user_id: userId,
        user_email: userEmail,
      },
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/cancel`,
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("❌ Stripe checkout session error:", error);
    res.status(500).json({
      error: "Failed to create checkout session",
      message: "Please try again later",
    });
  }
}
