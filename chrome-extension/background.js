// Wantry Chrome Extension — Background Service Worker
// Handles auth session management via Supabase cookies

const SUPABASE_PROJECT_REF = "fxjzqbdlroeeifqzfhbl";
const COOKIE_PREFIX = `sb-${SUPABASE_PROJECT_REF}-auth-token`;
const DEFAULT_WANTRY_URL = "https://wantry.vercel.app";

// Get the configured Wantry app URL
async function getWantryUrl() {
  const result = await chrome.storage.local.get("wantryUrl");
  return result.wantryUrl || DEFAULT_WANTRY_URL;
}

// Read and reassemble Supabase auth session from cookies
async function getSession() {
  const wantryUrl = await getWantryUrl();

  const cookies = await chrome.cookies.getAll({ url: wantryUrl });

  // Find auth token cookies (may be chunked: .0, .1, .2, etc.)
  const authCookies = cookies
    .filter((c) => c.name.startsWith(COOKIE_PREFIX))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (authCookies.length === 0) return null;

  // Reassemble chunked cookie value
  const tokenJson = authCookies.map((c) => c.value).join("");

  try {
    // Supabase SSR stores cookies as URL-encoded JSON
    const decoded = decodeURIComponent(tokenJson);

    // Try parsing as JSON directly
    let session;
    try {
      session = JSON.parse(decoded);
    } catch {
      // Sometimes it's base64-encoded JSON
      try {
        session = JSON.parse(atob(decoded));
      } catch {
        return null;
      }
    }

    // The session object should contain access_token
    if (session && session.access_token) {
      return {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        user: session.user,
      };
    }

    // Sometimes it's nested in a different structure
    if (session && Array.isArray(session) && session[0]?.access_token) {
      return {
        access_token: session[0].access_token,
        refresh_token: session[0].refresh_token,
        user: session[0].user,
      };
    }

    return null;
  } catch {
    return null;
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "GET_SESSION") {
    getSession().then(sendResponse);
    return true; // Keep channel open for async response
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
});
