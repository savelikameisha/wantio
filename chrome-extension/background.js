// Wantio: session refresh lives in the worker, not in short-lived popups.
const WANTIO_URL = "https://wantio.app";
const TOKEN_KEY = "wantio_session";
let refreshing = null;
let config = null;
async function getConfig() {
  if (config) return config;
  const res = await fetch(`${WANTIO_URL}/api/config`);
  if (!res.ok) throw new Error("Wantio is unavailable. Try again.");
  config = await res.json();
  return config;
}
function expiry(token) {
  try {
    return JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    ).exp;
  } catch {
    return 0;
  }
}
async function storeSession(data) {
  if (!data.access_token || !data.refresh_token)
    throw new Error("Invalid session.");
  const session = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at || expiry(data.access_token),
  };
  await chrome.storage.local.set({ [TOKEN_KEY]: session });
  return session;
}
async function refresh(session) {
  const c = await getConfig();
  const res = await fetch(
    `${c.supabaseUrl}/auth/v1/token?grant_type=refresh_token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: c.supabaseAnonKey,
      },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    },
  );
  if (!res.ok) {
    if (res.status === 400 || res.status === 401)
      await chrome.storage.local.remove(TOKEN_KEY);
    throw new Error("Sign in to Wantio again.");
  }
  return storeSession(await res.json());
}
async function getSession(force = false) {
  const stored = await chrome.storage.local.get(TOKEN_KEY);
  const session = stored[TOKEN_KEY];
  if (!session) return null;
  if (
    force ||
    !session.expires_at ||
    Date.now() / 1000 >= session.expires_at - 60
  ) {
    if (!refreshing)
      refreshing = refresh(session).finally(() => {
        refreshing = null;
      });
    return refreshing;
  }
  return session;
}
chrome.runtime.onMessage.addListener((message, sender, reply) => {
  const task = async () => {
    if (message.type === "GET_SESSION")
      return getSession(message.force === true);
    if (message.type === "GET_CONFIG")
      return { ...(await getConfig()), url: WANTIO_URL };
    if (message.type === "AUTH_TOKEN") {
      if (
        !sender.tab?.url ||
        !sender.tab.url.startsWith(`${WANTIO_URL}/auth/extension`)
      )
        throw new Error("Unexpected sign-in page.");
      await storeSession(message);
      return { ok: true };
    }
    if (message.type === "LOGOUT") {
      await chrome.storage.local.remove(TOKEN_KEY);
      return { ok: true };
    }
    throw new Error("Unknown request.");
  };
  task()
    .then(reply)
    .catch((error) => reply({ error: error.message }));
  return true;
});
