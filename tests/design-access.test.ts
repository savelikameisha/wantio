import { afterEach, describe, expect, it, vi } from "vitest";
const getUser = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser } }),
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));
vi.mock("@/components/design-library", () => ({ DesignLibrary: () => null }));
import DesignPage from "@/app/internal/design/page";
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
describe("internal design access", () => {
  it.each([
    [undefined, { id: "owner" }, null],
    ["", { id: "owner" }, null],
    ["owner", null, null],
    ["owner", { id: "other", user_metadata: { role: "admin" } }, null],
    ["owner", { id: "owner" }, new Error("invalid session")],
  ])(
    "denies access unless the verified owner is configured",
    async (id, user, error) => {
      vi.stubEnv("WANTIO_ADMIN_USER_ID", id);
      getUser.mockResolvedValue({ data: { user }, error });
      await expect(DesignPage()).rejects.toThrow("NOT_FOUND");
    },
  );
  it("renders for the verified owner", async () => {
    vi.stubEnv("WANTIO_ADMIN_USER_ID", "owner");
    getUser.mockResolvedValue({ data: { user: { id: "owner" } }, error: null });
    await expect(DesignPage()).resolves.toBeTruthy();
  });
});
