"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";

export default function AuthTestPage() {
  const { user, isSignedIn } = useUser();
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testAuth = async () => {
    setLoading(true);
    setTestResult(null);

    try {
      console.log("Testing authentication...");
      console.log("User signed in:", isSignedIn);
      console.log("User object:", user);

      const response = await fetch("/api/test-clerk-auth", {
        method: "GET",
        credentials: "include", // Important: includes Clerk session cookies
      });

      console.log("Response status:", response.status);

      const data = await response.json();
      console.log("Response data:", data);

      setTestResult({
        status: response.status,
        data: data,
        success: response.ok,
      });
    } catch (error) {
      console.error("Test error:", error);
      setTestResult({
        status: "ERROR",
        data: { error: error.message },
        success: false,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Clerk Authentication Test</h1>

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
          onClick={testAuth}
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
          {loading ? "Testing..." : "Test API Authentication"}
        </button>

        {!isSignedIn && (
          <p style={{ color: "#666", marginTop: "0.5rem" }}>
            Please sign in first to test authentication
          </p>
        )}
      </div>

      {testResult && (
        <div
          style={{
            background: testResult.success ? "#f0f8ff" : "#fee",
            border: `2px solid ${testResult.success ? "#4CAF50" : "#f44336"}`,
            borderRadius: "0.5rem",
            padding: "1rem",
            marginBottom: "1rem",
          }}
        >
          <h3>Test Result</h3>
          <p>
            <strong>Status Code:</strong> {testResult.status}
          </p>
          <p>
            <strong>Success:</strong> {testResult.success ? "Yes" : "No"}
          </p>
          <pre
            style={{
              background: "#f5f5f5",
              padding: "1rem",
              borderRadius: "0.25rem",
              overflow: "auto",
            }}
          >
            {JSON.stringify(testResult.data, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ marginTop: "2rem" }}>
        <h2>Next Steps</h2>
        <ol>
          <li>Sign in to your account</li>
          <li>Click "Test API Authentication"</li>
          <li>Check the result above</li>
          <li>If successful, proceed to implement premium features</li>
        </ol>
      </div>
    </div>
  );
}
