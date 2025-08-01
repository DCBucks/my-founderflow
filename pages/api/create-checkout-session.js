import Stripe from "stripe";
import { getAuth, clerkClient } from "@clerk/nextjs/server";

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
    console.log("🔍 Attempting to get auth from request...");
    console.log("Request headers:", req.headers);
    console.log("Cookie header:", req.headers.cookie);

    // Get user from Clerk using session cookies
    let { userId, user } = getAuth(req);
    console.log("🔍 Auth result - userId:", userId);
    console.log("🔍 User object:", user ? "Found" : "Not found");

    // If we have userId but no user object, we can still proceed
    if (!user && userId) {
      console.log("🔍 Using userId for authentication:", userId);
      // We'll get the email from the request body
    }

    if (!user && !userId) {
      console.error("No user or userId found in request");
      console.log("Available headers:", Object.keys(req.headers));
      return res.status(401).json({
        error: "User not authenticated",
        debug: {
          hasUserId: !!userId,
          hasUser: !!user,
          hasCookies: !!req.headers.cookie,
        },
      });
    }

    // Get user email from request body or user object
    let userEmail = null;
    if (user) {
      userEmail = user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress;
    } else if (req.body && req.body.userEmail) {
      userEmail = req.body.userEmail;
    }

    if (!userEmail) {
      console.error("No email found for user");
      return res.status(400).json({
        error: "User email not found",
        debug: {
          hasUser: !!user,
          userId: userId,
          hasRequestBody: !!req.body,
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
        user_id: user.id,
        user_email: userEmail,
      },
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/cancel`,
    });

    console.log("Checkout session created successfully:", session.id);
    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout session error:", err);
    res.status(500).json({
      error: "Failed to create checkout session",
      details: err.message,
    });
  }
}
