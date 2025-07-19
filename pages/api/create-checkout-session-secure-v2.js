import Stripe from "stripe";
import { getAuth, createClerkClient } from "@clerk/nextjs/server";

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

  if (!process.env.CLERK_SECRET_KEY) {
    console.error("CLERK_SECRET_KEY is not set");
    return res.status(500).json({ error: "Clerk configuration error" });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

  try {
    console.log("🔍 === SECURE V2 AUTH DEBUG ===");

    // Get userId from session
    const { userId } = getAuth(req);
    console.log("🔍 userId from getAuth:", userId);

    if (!userId) {
      console.log("❌ No userId found");
      return res.status(401).json({
        error: "Authentication required",
        message: "Please sign in to subscribe",
      });
    }

    // Use clerk client to get full user object
    console.log("🔍 Getting user from clerk client...");
    const user = await clerk.users.getUser(userId);
    console.log("🔍 User from clerk client:", !!user);

    if (!user) {
      console.log("❌ No user found from clerk client");
      return res.status(401).json({
        error: "User not found",
        message: "Please sign in again",
      });
    }

    // Get user email from user object
    const userEmail =
      user.primaryEmailAddress?.emailAddress ||
      user.emailAddresses?.[0]?.emailAddress;
    console.log("🔍 User email:", userEmail);

    if (!userEmail) {
      console.error("No email found for user");
      return res.status(400).json({
        error: "No email found for user",
        message: "Please add an email to your account",
      });
    }

    console.log("✅ Creating checkout session for:", userEmail);

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

    console.log("✅ Checkout session created:", session.id);
    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("❌ Error:", error);
    console.error("❌ Error details:", {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode,
    });
    res.status(500).json({
      error: "Failed to create checkout session",
      message: "Please try again later",
      details: error.message,
    });
  }
}
