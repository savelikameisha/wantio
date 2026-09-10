// @vitest-environment node
import { it, expect, vi } from "vitest";
import { isPublicAddress, fetchProductHtml } from "@/lib/server/safe-fetch";
vi.mock("node:dns/promises", () => ({
  lookup: vi.fn(async () => [{ address: "127.0.0.1", family: 4 }]),
}));
it.each([
  "127.0.0.1",
  "10.0.0.1",
  "172.16.0.1",
  "192.168.1.1",
  "169.254.169.254",
  "::1",
  "::ffff:127.0.0.1",
  "fc00::1",
  "fe80::1",
  "0.0.0.0",
])("blocks %s", (ip) => expect(isPublicAddress(ip)).toBe(false));
it("allows routable public addresses", () => {
  expect(isPublicAddress("8.8.8.8")).toBe(true);
  expect(isPublicAddress("2606:4700:4700::1111")).toBe(true);
});
it("rejects a hostname resolving to loopback before opening a socket", async () => {
  await expect(
    fetchProductHtml("https://store.example/product"),
  ).rejects.toThrow("Only public");
});
it("rejects unsupported protocols and ports", async () => {
  await expect(fetchProductHtml("file:///etc/passwd")).rejects.toThrow();
  await expect(
    fetchProductHtml("https://store.example:8443/item"),
  ).rejects.toThrow();
});
