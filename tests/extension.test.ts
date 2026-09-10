// @vitest-environment node
import { it, expect, vi } from "vitest";
import { createSessionStore } from "../chrome-extension/lib/session.js";
import { createDraftStore } from "../chrome-extension/lib/drafts.js";
import {
  createAuthorizedRequest,
  ExtensionError,
} from "../chrome-extension/lib/network.js";
function storage(initial: Record<string, unknown> = {}) {
  const data = structuredClone(initial);
  return {
    data,
    get: async (key: string) => structuredClone({ [key]: data[key] }),
    set: async (values: Record<string, unknown>) => {
      Object.assign(data, structuredClone(values));
    },
    remove: async (key: string) => {
      delete data[key];
    },
  };
}
const oldSession = {
  access_token: "expired",
  refresh_token: "refresh",
  expires_at: 1,
};
const renewed = {
  access_token: "renewed",
  refresh_token: "next-refresh",
  expires_at: 9999999999,
};
const config = async () => ({
  url: "https://wantio.app",
  supabaseUrl: "https://project.supabase.co",
  supabaseAnonKey: "public",
});
it("refreshes an expired session only once for simultaneous requests", async () => {
  const request = vi.fn(async () => renewed);
  const s = createSessionStore(
    storage({ wantio_session: oldSession }),
    config,
    request,
  );
  expect(await Promise.all([s.get(), s.get()])).toEqual([renewed, renewed]);
  expect(request).toHaveBeenCalledTimes(1);
});
it("keeps the refresh token when the network is unavailable", async () => {
  const local = storage({ wantio_session: oldSession });
  const s = createSessionStore(local, config, async () => {
    throw new ExtensionError("Offline");
  });
  await expect(s.get()).rejects.toThrow("Offline");
  expect(local.data.wantio_session).toEqual(oldSession);
});
it("removes rejected credentials", async () => {
  const local = storage({ wantio_session: oldSession });
  const s = createSessionStore(local, config, async () => {
    throw new ExtensionError("Expired", "auth");
  });
  await expect(s.get()).rejects.toThrow("Expired");
  expect(local.data.wantio_session).toBeUndefined();
});
it("does not restore a session after logout during refresh", async () => {
  let resolve!: (value: typeof renewed) => void;
  const request = vi.fn(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  const local = storage({ wantio_session: oldSession });
  const s = createSessionStore(local, config, request);
  const pending = s.get();
  const rejection = expect(pending).rejects.toThrow("connection changed");
  await vi.waitFor(() => expect(request).toHaveBeenCalled());
  await s.logout();
  resolve(renewed);
  await rejection;
  expect(local.data.wantio_session).toBeUndefined();
});
it("retries an unauthorized request once with a refreshed token", async () => {
  const get = vi.fn(async (force: boolean) => ({
    access_token: force ? "new" : "old",
  }));
  const request = vi
    .fn()
    .mockRejectedValueOnce(new ExtensionError("Expired", "auth"))
    .mockResolvedValueOnce({ ok: true });
  expect(
    await createAuthorizedRequest(get, config, request)("/api/items"),
  ).toEqual({ ok: true });
  expect(get.mock.calls).toEqual([[false], [true]]);
  expect(request.mock.calls[1][1].headers.Authorization).toBe("Bearer new");
});
it("serializes drafts and does not resurrect an already saved item", async () => {
  const drafts = createDraftStore(storage());
  const item = { id: "one", name: "Lamp" };
  await Promise.all([
    drafts.put("account:url", item),
    drafts.complete("account:url", item),
    drafts.put("account:url", { ...item, name: "Stale" }),
  ]);
  expect(await drafts.get("account:url")).toMatchObject({ saved: true, item });
});
it("removes expired drafts from storage and keeps at most ten", async () => {
  const local = storage({
    wantio_drafts_v1: {
      expired: { item: { id: "old" }, updatedAt: Date.now() - 8 * 86400000 },
    },
  });
  const drafts = createDraftStore(local);
  expect(await drafts.get("expired")).toBeNull();
  expect(local.data.wantio_drafts_v1).toEqual({});
  for (let i = 0; i < 12; i++)
    await drafts.put(`account:${i}`, { id: String(i) });
  expect(Object.keys(local.data.wantio_drafts_v1 as object)).toHaveLength(10);
});

it("blocks credential handoff from other websites and reads from content scripts", async () => {
  let handle: (
    message: unknown,
    sender: unknown,
    reply: (value: unknown) => void,
  ) => void;
  vi.stubGlobal("chrome", {
    storage: { local: storage() },
    runtime: {
      getURL: () => "chrome-extension://test/",
      onMessage: {
        addListener: (fn: typeof handle) => {
          handle = fn;
        },
      },
    },
  });
  try {
    await import("../chrome-extension/background.js");
    const send = (message: unknown, sender: unknown) =>
      new Promise((resolve) => handle(message, sender, resolve));
    expect(
      await send(
        { type: "AUTH_TOKEN", access_token: "forged", refresh_token: "forged" },
        { tab: { url: "https://other.example/auth/extension" } },
      ),
    ).toMatchObject({ error: "Unexpected sign-in page." });
    expect(
      await send(
        { type: "GET_SESSION" },
        { url: "https://wantio.app/auth/extension" },
      ),
    ).toMatchObject({ error: "This request is not supported." });
  } finally {
    vi.unstubAllGlobals();
  }
});
