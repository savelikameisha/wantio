import { ExtensionError } from "./network.js";
export function createSessionStore(storage, getConfig, request) {
  const key = "wantio_session";
  let refreshing = null;
  let epoch = 0;
  const expires = (token) => {
    try {
      return (
        JSON.parse(
          atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
        ).exp || 0
      );
    } catch {
      return 0;
    }
  };
  async function store(data, expectedEpoch = epoch) {
    if (!data.access_token || !data.refresh_token)
      throw new ExtensionError("Connect your account again.", "auth");
    if (expectedEpoch !== epoch)
      throw new ExtensionError("The connection changed. Try again.", "auth");
    const session = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at || expires(data.access_token),
    };
    await storage.set({ [key]: session });
    return session;
  }
  async function refresh(session) {
    const started = epoch;
    const config = await getConfig();
    try {
      const data = await request(
        `${config.supabaseUrl}/auth/v1/token?grant_type=refresh_token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: config.supabaseAnonKey,
          },
          body: JSON.stringify({ refresh_token: session.refresh_token }),
        },
      );
      return await store(data, started);
    } catch (error) {
      if (error.code === "auth" && started === epoch) await storage.remove(key);
      throw error;
    }
  }
  return {
    async get(force = false) {
      const session = (await storage.get(key))[key];
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
    },
    async connect(data) {
      epoch++;
      return store(data);
    },
    async logout() {
      epoch++;
      await storage.remove(key);
    },
  };
}
