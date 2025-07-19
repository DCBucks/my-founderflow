import { getAuth } from "@clerk/nextjs/server";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end("Method Not Allowed");
  }

  console.log("=== Test Auth API Called ===");
  console.log("Request method:", req.method);
  console.log("Request headers:", req.headers);
  console.log("Cookie header:", req.headers.cookie);

  try {
    console.log("🔍 Attempting to get auth from request...");

    // Get user using getAuth (server-side)
    const { userId, user } = getAuth(req);
    console.log("🔍 Auth result - userId:", userId);
    console.log("🔍 User object:", user ? "Found" : "Not found");

    if (!user) {
      console.log("❌ No user found in request");
      return res.status(401).json({
        error: "Not authenticated",
        debug: {
          hasUserId: !!userId,
          hasUser: !!user,
          hasCookies: !!req.headers.cookie,
          headers: Object.keys(req.headers),
        },
      });
    }

    console.log("✅ User authenticated successfully");
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email:
          user.primaryEmailAddress?.emailAddress ||
          user.emailAddresses?.[0]?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (error) {
    console.error("❌ Auth test error:", error);
    return res.status(500).json({
      error: "Authentication test failed",
      details: error.message,
    });
  }
}
