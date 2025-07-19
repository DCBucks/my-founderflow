"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";

export default function TestPremiumPage() {
  const { user, isSignedIn } = useUser();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testPremiumAuth = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/premium-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Premium Authentication Test</h1>

      <div style={{ marginBottom: "2rem" }}>
        <h2>Current Status</h2>
        <p>
          <strong>Signed In:</strong> {isSignedIn ? "Yes" : "No"}
        </p>
        <p>
          <strong>User ID:</strong> {user?.id || "None"}
        </p>
        <p>
          <strong>Email:</strong>{" "}
          {user?.primaryEmailAddress?.emailAddress || "None"}
        </p>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <button
          onClick={testPremiumAuth}
          disabled={loading || !isSignedIn}
          style={{
            background: isSignedIn
              ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              : "#ccc",
            color: "white",
            border: "none",
            padding: "1rem 2rem",
            borderRadius: "0.5rem",
            cursor: isSignedIn && !loading ? "pointer" : "not-allowed",
            fontSize: "1.1rem",
          }}
        >
          {loading ? "Testing..." : "Test Premium Authentication"}
        </button>

        {!isSignedIn && (
          <p style={{ color: "#666", marginTop: "0.5rem" }}>
            Please sign in first to test authentication
          </p>
        )}
      </div>

      {result && (
        <div
          style={{
            background: result.success ? "#f0f8ff" : "#fee",
            border: `2px solid ${result.success ? "#4CAF50" : "#f44336"}`,
            borderRadius: "0.5rem",
            padding: "1rem",
            marginBottom: "1rem",
          }}
        >
          <h3>Test Result</h3>
          <pre
            style={{
              background: "#f5f5f5",
              padding: "1rem",
              borderRadius: "0.25rem",
              overflow: "auto",
            }}
          >
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ marginTop: "2rem" }}>
        <h2>What This Tests</h2>
        <ul>
          <li>✅ Clerk authentication is working</li>
          <li>✅ Database connection is working</li>
          <li>✅ User data can be retrieved</li>
          <li>✅ Premium status can be checked</li>
        </ul>
      </div>
    </div>
  );
}
