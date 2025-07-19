"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";

export default function PremiumFeaturesExample() {
  const { user, isSignedIn } = useUser();
  const [premiumData, setPremiumData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGetPremiumData = async () => {
    if (!isSignedIn) {
      alert("Please sign in to access premium features");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/premium-features", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important: includes Clerk session cookies
        body: JSON.stringify({
          feature: "get_premium_data",
          action: "fetch",
        }),
      });

      if (response.status === 401) {
        setError("Authentication failed. Please sign in again.");
        return;
      }

      if (response.status === 403) {
        setError("Premium subscription required. Please upgrade your plan.");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch premium data");
        return;
      }

      const data = await response.json();
      setPremiumData(data.data);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePremiumSettings = async (settings) => {
    if (!isSignedIn) {
      alert("Please sign in to save settings");
      return;
    }

    try {
      const response = await fetch("/api/premium-features", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          feature: "save_premium_settings",
          action: "save",
          data: settings,
        }),
      });

      if (response.status === 401) {
        alert("Authentication failed. Please sign in again.");
        return;
      }

      if (response.status === 403) {
        alert("Premium subscription required. Please upgrade your plan.");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || "Failed to save settings");
        return;
      }

      alert("Settings saved successfully!");
    } catch (err) {
      alert("Network error. Please try again.");
    }
  };

  if (!isSignedIn) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h2>Premium Features</h2>
        <p>Please sign in to access premium features.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Premium Features Example</h2>
      <p>Welcome, {user?.primaryEmailAddress?.emailAddress}!</p>

      <div style={{ marginBottom: "2rem" }}>
        <button
          onClick={handleGetPremiumData}
          disabled={loading}
          style={{
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            border: "none",
            padding: "0.75rem 1.5rem",
            borderRadius: "0.5rem",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? "Loading..." : "Get Premium Data"}
        </button>
      </div>

      {error && (
        <div
          style={{
            background: "#fee",
            color: "#c33",
            padding: "1rem",
            borderRadius: "0.5rem",
            marginBottom: "1rem",
          }}
        >
          {error}
        </div>
      )}

      {premiumData && (
        <div
          style={{
            background: "#f0f8ff",
            padding: "1rem",
            borderRadius: "0.5rem",
            marginBottom: "1rem",
          }}
        >
          <h3>Premium Data:</h3>
          <pre>{JSON.stringify(premiumData, null, 2)}</pre>
        </div>
      )}

      <div>
        <h3>Save Premium Settings</h3>
        <button
          onClick={() =>
            handleSavePremiumSettings({
              theme: "dark",
              notifications: true,
              premiumFeature: "enabled",
            })
          }
          style={{
            background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            color: "white",
            border: "none",
            padding: "0.75rem 1.5rem",
            borderRadius: "0.5rem",
            cursor: "pointer",
          }}
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}
