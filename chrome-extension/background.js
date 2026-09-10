import {
  fetchJson,
  ExtensionError,
  createAuthorizedRequest,
} from "./lib/network.js";
import { createSessionStore } from "./lib/session.js";
import { createDraftStore } from "./lib/drafts.js";
const APP_URL = "https://wantio.app";
let configPromise;
async function getConfig() {
  if (!configPromise)
    configPromise = fetchJson(`${APP_URL}/api/config`)
      .then((data) => {
        if (
          data.supabaseUrl !== "https://zfrdcuztrujsmrsnppes.supabase.co" ||
          !data.supabaseAnonKey
        )
          throw new ExtensionError(
            "Wantio connection settings are unavailable. Try again.",
          );
        return { ...data, url: APP_URL };
      })
      .catch((error) => {
        configPromise = null;
        throw error;
      });
  return configPromise;
}
const sessions = createSessionStore(chrome.storage.local, getConfig, fetchJson);
const drafts = createDraftStore(chrome.storage.local);
const authorized = createAuthorizedRequest(sessions.get, getConfig);
const saves = new Map();
async function draftKey(url) {
  const session = await sessions.get();
  if (!session)
    throw new ExtensionError("Connect your account to continue.", "auth");
  const payload = JSON.parse(
    atob(
      session.access_token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"),
    ),
  );
  if (!payload.sub)
    throw new ExtensionError("Connect your account again.", "auth");
  return `${payload.sub}:${url}`;
}
async function handle(message, sender) {
  if (message.type === "AUTH_TOKEN") {
    const page = sender.tab?.url && new URL(sender.tab.url);
    if (!page || page.origin !== APP_URL || page.pathname !== "/auth/extension")
      throw new ExtensionError("Unexpected sign-in page.", "auth");
    await sessions.connect(message);
    return { ok: true, version: chrome.runtime.getManifest().version };
  }
  // Only extension pages may read credentials, make API calls, or manage drafts.
  if (!sender.url?.startsWith(chrome.runtime.getURL("")))
    throw new ExtensionError("This request is not supported.");
  switch (message.type) {
    case "GET_CONFIG":
      return getConfig();
    case "GET_SESSION":
      return sessions.get(message.force === true);
    case "GET_TAGS":
      return authorized(
        "/rest/v1/tags?select=id,name,color&order=name",
        {},
        true,
      );
    case "CREATE_TAG": {
      const name = typeof message.name === "string" ? message.name.trim() : "";
      if (!name || name.length > 40)
        throw new ExtensionError(
          "Use a label name up to 40 characters.",
          "validation",
        );
      const session = await sessions.get();
      if (!session)
        throw new ExtensionError("Connect your account to continue.", "auth");
      const userId = JSON.parse(
        atob(
          session.access_token
            .split(".")[1]
            .replace(/-/g, "+")
            .replace(/_/g, "/"),
        ),
      ).sub;
      const existing = await authorized(
        "/rest/v1/tags?select=id,name,color&order=name",
        {},
        true,
      );
      const match = existing.find(
        (tag) => tag.name.toLowerCase() === name.toLowerCase(),
      );
      if (match) return match;
      const result = await authorized(
        "/rest/v1/tags?on_conflict=user_id,name&select=id,name,color",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Prefer: "return=representation,resolution=merge-duplicates",
          },
          body: JSON.stringify({ name, user_id: userId, color: "#65b5f6" }),
        },
        true,
      );
      return result[0];
    }
    case "GET_DRAFT":
      return drafts.get(await draftKey(message.url));
    case "SAVE_DRAFT":
      await drafts.put(await draftKey(message.url), message.item);
      return { ok: true };
    case "CLEAR_DRAFT":
      await drafts.remove(await draftKey(message.url));
      return { ok: true };
    case "SCRAPE":
      return authorized("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: message.url,
          existingTags: message.tags || [],
        }),
      });
    case "SAVE_ITEM": {
      const item = message.item;
      if (!item?.id || !item.name?.trim())
        throw new ExtensionError("Give this item a name.", "validation");
      if (!saves.has(item.id)) {
        const task = (async () => {
          const key = await draftKey(message.url || item.url);
          await drafts.put(key, item);
          const result = await authorized("/api/items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item),
          });
          await drafts.complete(key, item);
          return result;
        })();
        saves.set(item.id, task);
        task.finally(() => saves.delete(item.id)).catch(() => {});
      }
      return saves.get(item.id);
    }
    case "LOGOUT":
      await sessions.logout();
      return { ok: true };
    default:
      throw new ExtensionError("Update the extension and try again.");
  }
}
chrome.runtime.onMessage.addListener((message, sender, reply) => {
  handle(message, sender)
    .then(reply)
    .catch((error) =>
      reply({ error: error.message, code: error.code || "unknown" }),
    );
  return true;
});
