"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ExtensionAuthPage() {
  const [status, setStatus] = useState<
    "checking" | "sending" | "success" | "no-session" | "missing"
  >("checking");

  useEffect(() => {
    const onConnected = (event: MessageEvent) => {
      if (
        event.source === window &&
        event.origin === window.location.origin &&
        event.data?.type === "WANTIO_EXTENSION_CONNECTED"
      ) {
        clearTimeout(timeout);
        setStatus("success");
      }
    };
    window.addEventListener("message", onConnected);
    const timeout = setTimeout(
      () => setStatus((s) => (s === "sending" ? "missing" : s)),
      18000,
    );
    async function handleAuth() {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setStatus("no-session");
        return;
      }

      setStatus("sending");

      // Store token in sessionStorage for the content script to pick up
      const tokenData = {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        user: {
          id: session.user.id,
          email: session.user.email,
        },
      };

      sessionStorage.setItem("wantio_ext_token", JSON.stringify(tokenData));
    }

    handleAuth().catch(() => setStatus("no-session"));
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("message", onConnected);
      sessionStorage.removeItem("wantio_ext_token");
    };
  }, []);

  // If no session, trigger Google login that redirects back here
  async function handleLogin() {
    const supabase = createClient();
    const { data } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/extension`,
      },
    });
    if (data.url) {
      window.location.href = data.url;
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#FFF4F7",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        style={{
          textAlign: "center",
          padding: "32px",
          background: "white",
          borderRadius: "16px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          maxWidth: "360px",
          width: "100%",
        }}
      >
        <img
          src="/icon.svg"
          alt="Wantio"
          width={48}
          height={48}
          style={{ marginBottom: "16px" }}
        />

        {status === "checking" && (
          <>
            <h2
              style={{ fontSize: "18px", margin: "0 0 8px", color: "#1f1a1c" }}
            >
              Connecting...
            </h2>
            <p style={{ fontSize: "14px", color: "#7a6970", margin: 0 }}>
              Checking your session
            </p>
          </>
        )}

        {status === "no-session" && (
          <>
            <h2
              style={{ fontSize: "18px", margin: "0 0 8px", color: "#1f1a1c" }}
            >
              Sign in to Wantio
            </h2>
            <p
              style={{ fontSize: "14px", color: "#7a6970", margin: "0 0 16px" }}
            >
              Connect your account to use the Chrome extension.
            </p>
            <button
              onClick={handleLogin}
              style={{
                width: "100%",
                padding: "10px 16px",
                background: "#B8386B",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Sign in with Google
            </button>
          </>
        )}

        {status === "missing" && (
          <p>Install or enable the Wantio extension, then reload this page.</p>
        )}
        {status === "sending" && (
          <>
            <h2
              style={{ fontSize: "18px", margin: "0 0 8px", color: "#1f1a1c" }}
            >
              Connecting...
            </h2>
            <p style={{ fontSize: "14px", color: "#7a6970", margin: 0 }}>
              Sending your session to the extension
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <h2
              style={{ fontSize: "18px", margin: "0 0 8px", color: "#16a34a" }}
            >
              ✓ Connected!
            </h2>
            <p style={{ fontSize: "14px", color: "#7a6970", margin: 0 }}>
              You can close this tab and use the extension now.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
