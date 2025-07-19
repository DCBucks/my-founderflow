export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end("Method Not Allowed");
  }

  const config = {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? "✅ Set" : "❌ Missing",
    STRIPE_PRICE_ID: process.env.STRIPE_PRICE_ID ? "✅ Set" : "❌ Missing",
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET
      ? "✅ Set"
      : "❌ Missing",
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? "✅ Set"
      : "❌ Missing",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? "✅ Set"
      : "❌ Missing",
  };

  res.status(200).json({
    message: "Stripe Configuration Check",
    config,
    hasAllRequired:
      config.STRIPE_SECRET_KEY === "✅ Set" &&
      config.STRIPE_PRICE_ID === "✅ Set",
  });
}
