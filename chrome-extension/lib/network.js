export class ExtensionError extends Error {
  constructor(message, code = "network") {
    super(message);
    this.code = code;
  }
}
export async function fetchJson(url, options = {}, timeout = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok)
      throw new ExtensionError(
        response.status === 401
          ? "Connect your account again to continue."
          : data.error || "Wantio could not complete the request. Try again.",
        response.status === 401 ||
        (response.status === 400 && url.includes("/auth/v1/token"))
          ? "auth"
          : String(response.status),
      );
    return data;
  } catch (error) {
    if (error instanceof ExtensionError) throw error;
    throw new ExtensionError(
      controller.signal.aborted
        ? "This is taking too long. Your changes are kept — try again."
        : "Could not reach Wantio. Check your connection and try again.",
    );
  } finally {
    clearTimeout(timer);
  }
}
export function createAuthorizedRequest(
  getSession,
  getConfig,
  request = fetchJson,
) {
  return async function authorized(path, options = {}, supabase = false) {
    const config = await getConfig();
    for (let attempt = 0; attempt < 2; attempt++) {
      const session = await getSession(attempt === 1);
      if (!session)
        throw new ExtensionError("Connect your account to continue.", "auth");
      try {
        return await request(
          `${supabase ? config.supabaseUrl : config.url}${path}`,
          {
            ...options,
            headers: {
              ...options.headers,
              Authorization: `Bearer ${session.access_token}`,
              ...(supabase ? { apikey: config.supabaseAnonKey } : {}),
            },
          },
          path === "/api/scrape" ? 40000 : 15000,
        );
      } catch (error) {
        if (error.code !== "auth" || attempt === 1) throw error;
      }
    }
  };
}
