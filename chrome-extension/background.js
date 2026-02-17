// Wantry Chrome Extension — Background Service Worker
// Handles auth session management

const DEFAULT_WANTRY_URL = "https://wantry.vercel.app";
const TOKEN_KEY = "wantry_session";

// Get the configured Wantry app URL
async function getWantryUrl() {
  const result = await chrome.storage.local.get("wantryUrl");
  return result.wantryUrl || DEFAULT_WANTRY_URL;
}

// Get stored session from chrome.storage
async function getSession() {
  const result = await chrome.storage.local.get(TOKEN_KEY);
  const session = result[TOKEN_KEY];

  if (!session?.access_token) return null;

  // Check if token might be expired (stored_at + expires_in)
  if (session.stored_at && session.expires_in) {
    const expiresAt = session.stored_at + session.expires_in * 1000;
    if (Date.now() > expiresAt - 60000) {
      // Token expired or about to expire — try refresh
      const refreshed = await refreshSession(session.refresh_token);
      if (refreshed) return refreshed;
      // Refresh failed — clear and return null
      await chrome.storage.local.remove(TOKEN_KEY);
      return null;
    }
  }

  return session;
}

// Store session
async function storeSession(data) {
  await chrome.storage.local.set({
    [TOKEN_KEY]: {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user: data.user,
      expires_in: data.expires_in || 3600,
      stored_at: Date.now(),
    },
  });
}

// Refresh an expired token via Supabase REST API
async function refreshSession(refreshToken) {
  if (!refreshToken) return null;

  try {
    const SUPABASE_URL = "https://fxjzqbdlroeeifqzfhbl.supabase.co";
    const SUPABASE_ANON_KEY =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4anpxYmRscm9lZWlmcXpmaGJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzMzYwODgsImV4cCI6MjA4NjkxMjA4OH0.jVUiW5GMgqDx2n-WkCpjgAHhWgpnphC2RZi7m1eFKDQ";

    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (data.access_token) {
      const session = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        user: data.user,
        expires_in: data.expires_in || 3600,
        stored_at: Date.now(),
      };
      await chrome.storage.local.set({ [TOKEN_KEY]: session });
      return session;
    }
    return null;
  } catch {
    return null;
  }
}

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "GET_SESSION") {
    getSession().then(sendResponse);
    return true;
  }

  if (message.type === "GET_WANTRY_URL") {
    getWantryUrl().then((url) => sendResponse({ url }));
    return true;
  }

  if (message.type === "SET_WANTRY_URL") {
    chrome.storage.local.set({ wantryUrl: message.url }).then(() => {
      sendResponse({ ok: true });
    });
    return true;
  }

  // Receive token from auth page content script
  if (message.type === "AUTH_TOKEN") {
    storeSession(message).then(() => {
      sendResponse({ ok: true });
    });
    return true;
  }

  if (message.type === "LOGOUT") {
    chrome.storage.local.remove(TOKEN_KEY).then(() => {
      sendResponse({ ok: true });
    });
    return true;
  }
});

// Listen for external messages (from the web page via chrome.runtime.sendMessage)
chrome.runtime.onMessageExternal.addListener((message, _sender, sendResponse) => {
  if (message.type === "AUTH_TOKEN" && message.access_token) {
    storeSession(message).then(() => {
      sendResponse({ ok: true });
    });
    return true;
  }
});
