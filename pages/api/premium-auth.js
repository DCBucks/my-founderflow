import { getAuth, createClerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  try {
    // 1. Verify authentication
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({
        error: "Authentication required",
        message: "Please sign in to access this feature",
      });
    }

    // 2. Get user data from Clerk
    const clerk = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    const user = await clerk.users.getUser(userId);

    if (!user) {
      return res.status(401).json({
        error: "User not found",
        message: "Please sign in again",
      });
    }

    const userEmail =
      user.primaryEmailAddress?.emailAddress ||
      user.emailAddresses?.[0]?.emailAddress;

    if (!userEmail) {
      return res.status(400).json({
        error: "No email found",
        message: "Please add an email to your account",
      });
    }

    // 3. Check premium status in database
    console.log("🔍 Checking database for user email:", userEmail);

    const { data: userData, error: dbError } = await supabase
      .from("users")
      .select("is_premium, subscription_status, subscription_end_date")
      .eq("email", userEmail)
      .single();

    console.log("🔍 Database result:", { userData, dbError });

    if (dbError) {
      console.error("Database error:", dbError);

      // If user doesn't exist, create them
      if (dbError.code === "PGRST116") {
        console.log("🔍 User not found, creating new user...");

        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert([
            {
              email: userEmail,
              clerk_user_id: userId,
              is_premium: false,
              subscription_status: "inactive",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (createError) {
          console.error("Error creating user:", createError);
          return res.status(500).json({
            error: "Failed to create user",
            message: "Please try again later",
            details: createError.message,
          });
        }

        console.log("✅ User created successfully:", newUser);

        // Return the newly created user data
        return res.status(200).json({
          success: true,
          user: {
            id: userId,
            email: userEmail,
            firstName: user.firstName,
            lastName: user.lastName,
          },
          premium: {
            isPremium: false,
            subscriptionStatus: "inactive",
            subscriptionEndDate: null,
          },
        });
      }

      return res.status(500).json({
        error: "Failed to verify premium status",
        message: "Please try again later",
        details: dbError.message,
      });
    }

    // 4. Check if user has premium access
    const isPremium = userData?.is_premium || false;
    const subscriptionStatus = userData?.subscription_status || "inactive";
    const subscriptionEndDate = userData?.subscription_end_date;

    // 5. Return user info and premium status
    return res.status(200).json({
      success: true,
      user: {
        id: userId,
        email: userEmail,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      premium: {
        isPremium,
        subscriptionStatus,
        subscriptionEndDate,
      },
    });
  } catch (error) {
    console.error("Premium auth error:", error);
    return res.status(500).json({
      error: "Authentication failed",
      message: "Please try again later",
    });
  }
}
