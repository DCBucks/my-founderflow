import { getAuth, clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  try {
    console.log("🔍 Authenticating user for premium features...");

    // Get authenticated user from Clerk
    const { userId, user } = getAuth(req);

    if (!userId || !user) {
      console.log("❌ Authentication failed: No userId or user found");
      return res.status(401).json({
        error: "Authentication required",
        debug: { hasUserId: !!userId, hasUser: !!user },
      });
    }

    console.log("✅ User authenticated:", userId);

    // Get user email
    const userEmail =
      user.primaryEmailAddress?.emailAddress ||
      user.emailAddresses?.[0]?.emailAddress;

    if (!userEmail) {
      return res.status(400).json({ error: "No email found for user" });
    }

    // Verify premium status in database
    const { data: userData, error: dbError } = await supabase
      .from("users")
      .select("is_premium, stripe_customer_id")
      .eq("email", userEmail)
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      return res.status(500).json({ error: "Failed to verify premium status" });
    }

    if (!userData?.is_premium) {
      return res.status(403).json({ error: "Premium subscription required" });
    }

    // Now handle the specific premium feature request
    const { feature, action, data } = req.body;

    switch (feature) {
      case "get_premium_data":
        // Example: Get user's premium analytics
        const { data: premiumData, error: premiumError } = await supabase
          .from("premium_analytics")
          .select("*")
          .eq("user_email", userEmail);

        if (premiumError) {
          return res
            .status(500)
            .json({ error: "Failed to fetch premium data" });
        }

        return res.status(200).json({
          success: true,
          data: premiumData,
          user: { id: userId, email: userEmail },
        });

      case "save_premium_settings":
        // Example: Save premium user settings
        const { data: savedSettings, error: settingsError } = await supabase
          .from("user_settings")
          .upsert({
            user_email: userEmail,
            settings: data,
            updated_at: new Date().toISOString(),
          });

        if (settingsError) {
          return res.status(500).json({ error: "Failed to save settings" });
        }

        return res.status(200).json({
          success: true,
          message: "Settings saved successfully",
        });

      default:
        return res.status(400).json({ error: "Unknown premium feature" });
    }
  } catch (error) {
    console.error("Premium features API error:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
}
