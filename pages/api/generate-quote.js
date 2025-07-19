import { getAuth, createClerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Initialize Clerk client
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export default async function handler(req, res) {
  console.log("=== Quote Generation API Called ===");
  console.log("Request method:", req.method);

  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    console.log("🔍 Attempting to get auth from request...");

    // Get user using getAuth (server-side)
    const { userId, user } = getAuth(req);
    console.log("🔍 Auth result - userId:", userId);
    console.log("🔍 User object:", user ? "Found" : "Not found");

    // Check if this is an authenticated request
    if (!userId) {
      console.log("❌ Authentication failed: No userId found");
      return res.status(401).json({
        error: "Not authenticated - Please sign in to generate quotes",
      });
    }

    // If getAuth didn't return the user object, fetch it using clerkClient
    let userData = user;
    if (!user && userId) {
      console.log("🔍 Fetching user data using clerkClient...");
      try {
        userData = await clerkClient.users.getUser(userId);
        console.log("✅ User data fetched successfully");
      } catch (clerkError) {
        console.error("❌ Error fetching user from Clerk:", clerkError);
        return res.status(401).json({
          error: "Authentication failed - Unable to fetch user data",
        });
      }
    }

    // Get user email from Clerk
    const userEmail =
      userData?.primaryEmailAddress?.emailAddress ||
      userData?.emailAddresses?.[0]?.emailAddress;

    if (!userEmail) {
      console.log("❌ No email found for user");
      return res.status(400).json({
        error: "No email found for user",
        message: "Please add an email to your account",
      });
    }

    console.log(
      "✅ Authentication successful, proceeding with quote generation"
    );

    // Check premium status and quote count
    let { data: dbUserData, error: dbError } = await supabase
      .from("users")
      .select("is_premium, quote_count, quote_count_date")
      .eq("email", userEmail)
      .single();

    // If user doesn't exist, create them
    if (dbError && dbError.code === "PGRST116") {
      console.log("User not found in database, creating new user...");
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert([
          {
            email: userEmail,
            clerk_user_id: userId,
            is_premium: false,
            quote_count: 0,
            quote_count_date: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (createError) {
        console.error("Error creating user:", createError);
        return res.status(500).json({ error: "Failed to create user account" });
      }

      dbUserData = newUser;
    } else if (dbError) {
      console.error("Database error:", dbError);
      return res.status(500).json({ error: "Database error" });
    }

    const today = new Date().toISOString().split("T")[0];

    // Reset count if it's a new day
    let quoteCount = dbUserData.quote_count || 0;
    let quoteCountDate = dbUserData.quote_count_date || null;

    if (quoteCountDate !== today) {
      quoteCount = 0;
      quoteCountDate = today;
    }

    // Enforce limit for non-premium users
    if (!dbUserData.is_premium && quoteCount >= 3) {
      console.log(
        `❌ Quote limit reached for user: ${userEmail} (${quoteCount}/3)`
      );
      return res.status(403).json({
        error: "Quote limit reached. Upgrade to premium for unlimited quotes.",
        limit: 3,
        used: quoteCount,
      });
    }

    console.log(`✅ Generating quote for user: ${userEmail} (${quoteCount}/3)`);

    // Generate the quote
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OpenAI API key not found in environment variables");
      return res.status(500).json({
        error:
          "OpenAI API key not set. Please add OPENAI_API_KEY to your .env.local file.",
      });
    }

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content:
                  "You are a helpful assistant that generates motivational quotes. Only use real, well-known entrepreneurs, founders, or business leaders as the author. Never use 'Unknown' or fictional names. Always maximize variety and randomness in your responses.",
              },
              {
                role: "user",
                content: `Give me a short, original motivational quote attributed to a real, well-known entrepreneur, founder, or business leader. The author must be a real person and never 'Unknown'. Make the quote and author as random as possible, and avoid repeating previous responses. Format: <quote> — <author>.`,
              },
            ],
            max_tokens: 60,
            temperature: 1.2,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error("OpenAI API error:", response.status, errorData);
        return res.status(500).json({
          error: `Failed to fetch quote from OpenAI. Status: ${response.status}`,
          details: errorData,
        });
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content?.trim();

      if (!text) {
        console.error("No content in OpenAI response");
        return res
          .status(500)
          .json({ error: "No quote content received from OpenAI." });
      }

      let quote = text;
      let author = "Unknown";

      if (text && text.includes("—")) {
        [quote, author] = text.split("—").map((s) => s.trim());
      }

      // Increment and update the count in Supabase
      await supabase
        .from("users")
        .update({
          quote_count: quoteCount + 1,
          quote_count_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq("email", userEmail);

      console.log(
        `✅ Quote generated successfully for ${userEmail} (${quoteCount + 1}/3)`
      );
      res.status(200).json({ quote, author });
    } catch (error) {
      console.error("Server error generating quote:", error);
      res.status(500).json({
        error: "Server error generating quote.",
        details: error.message,
      });
    }
  } catch (authError) {
    console.error("Authentication error:", authError);
    res.status(500).json({
      error: "Authentication error",
      details: authError.message,
    });
  }
}
