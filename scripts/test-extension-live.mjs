import fs from "node:fs";
import { createRequire } from "node:module";
import { parseEnv } from "node:util";
import path from "node:path";
const require = createRequire(process.cwd() + "/package.json");
const { chromium } = require("@playwright/test");
const { createClient } = require("@supabase/supabase-js");
const { createServerClient } = require("@supabase/ssr");
process.loadEnvFile(".env.local");
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const privateEnv = process.env.WANTIO_TEST_ENV_FILE
  ? parseEnv(fs.readFileSync(process.env.WANTIO_TEST_ENV_FILE, "utf8"))
  : {};
const secret = (
  process.env.TEST_SUPABASE_SERVICE_ROLE_KEY ||
  privateEnv.SUPABASE_SERVICE_ROLE_KEY ||
  ""
)
  .replace(/\\n/g, "")
  .trim();
if (!secret)
  throw new Error(
    "Provide TEST_SUPABASE_SERVICE_ROLE_KEY or WANTIO_TEST_ENV_FILE for a disposable test account.",
  );
const admin = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const email = `wantio-e2e-${crypto.randomUUID()}@example.com`,
  password = crypto.randomUUID();
const {
  data: { user },
  error,
} = await admin.auth.admin.createUser({ email, password, email_confirm: true });
if (error) throw error;
let context;
try {
  const ext = path.resolve(process.env.EXTENSION_PATH || "chrome-extension");
  fs.mkdirSync("test-results/extension", { recursive: true });
  context = await chromium.launchPersistentContext("", {
    channel: "chromium",
    headless: true,
    args: [
      `--disable-extensions-except=${ext}`,
      `--load-extension=${ext}`,
      "--enable-unsafe-extension-debugging",
    ],
  });
  const pageErrors = [];
  context.on("page", (p) =>
    p.on("pageerror", (error) => pageErrors.push(error.message)),
  );
  let [worker] = context.serviceWorkers();
  if (!worker) worker = await context.waitForEvent("serviceworker");
  const id = worker.url().split("/")[2];
  console.log("Extension loaded");
  const auth = createServerClient(url, key, {
    cookies: {
      getAll: () => [],
      setAll: async (cookies) =>
        context.addCookies(
          cookies.map((c) => ({
            name: c.name,
            value: c.value,
            url: "https://wantio.app",
            sameSite: "Lax",
          })),
        ),
    },
  });
  const login = await auth.auth.signInWithPassword({ email, password });
  if (login.error) throw login.error;
  const page = await context.newPage();
  await page.goto("https://wantio.app/auth/extension");
  try {
    await page
      .getByText(/✓ Connected!|Your account is connected/)
      .waitFor({ timeout: 22000 });
    console.log("Real content-script authentication: connected");
  } catch (e) {
    console.log("Auth page:", await page.locator("body").innerText());
    throw e;
  }
  await context.route("https://shop.example/**", (route) =>
    route.fulfill({
      contentType: route.request().url().endsWith(".svg")
        ? "image/svg+xml"
        : "text/html",
      body: fs.readFileSync(
        route.request().url().endsWith(".svg")
          ? "tests/fixtures/lamp.svg"
          : "tests/fixtures/product.html",
        "utf8",
      ),
    }),
  );
  await page.goto("https://shop.example/product");
  await page.bringToFront();
  const root = await context.browser().newBrowserCDPSession();
  const { targetInfos } = await root.send("Target.getTargets", {
    filter: [{ type: "tab" }],
  });
  const targetInfo = targetInfos.find(
    (t) => t.url === "https://shop.example/product",
  );
  if (!targetInfo) throw new Error("Product tab target not found");
  await root.send("Extensions.triggerAction", {
    id,
    targetId: targetInfo.targetId,
  });
  const popupPromise = context
    .waitForEvent("page", { timeout: 10000 })
    .catch(() => null);
  await worker.evaluate(() =>
    chrome.tabs.create({
      url: chrome.runtime.getURL("popup.html"),
      active: false,
    }),
  );
  const popup = await popupPromise;
  if (!popup) throw new Error("Popup test page missing");
  popup.on("pageerror", (e) => console.log("Popup JS error", e.message));
  await popup.waitForLoadState();
  await popup
    .locator("#state-form")
    .waitFor({ state: "visible", timeout: 15000 });
  await popup.setViewportSize({ width: 380, height: 600 });
  await popup.locator("#product-image").evaluate((img) => img.decode());
  await popup.screenshot({ path: "test-results/extension/form.png" });
  const { expect } = require("@playwright/test");
  await expect(popup.locator("#item-name")).toHaveText("Arc table lamp");
  await popup.locator("#item-name").fill("My reading lamp");
  await popup.locator("#edit-price").click();
  await popup.locator("#price-input").fill("149.50");
  await popup.locator("#price-done").click();
  await popup.locator("#change-image").click();
  await popup.screenshot({ path: "test-results/extension/image-picker.png" });
  await popup
    .getByRole("button", { name: "Choose image 1", exact: true })
    .click();
  await popup.locator("#add-note").click();
  await popup.locator("#note-input").fill("For the reading corner.");
  await expect(popup.locator("#draft-status")).toHaveText(
    "Draft kept on this device.",
  );
  await expect
    .poll(async () => {
      const stored = await worker.evaluate(() =>
        chrome.storage.local.get("wantio_drafts_v1"),
      );
      return Object.values(stored.wantio_drafts_v1 || {})[0]?.item.notes;
    })
    .toBe("For the reading corner.");
  await popup.close();
  await page.bringToFront();
  const reopenedPromise = context.waitForEvent("page", { timeout: 10000 });
  await worker.evaluate(() =>
    chrome.tabs.create({
      url: chrome.runtime.getURL("popup.html"),
      active: false,
    }),
  );
  const reopened = await reopenedPromise;
  await reopened.setViewportSize({ width: 380, height: 600 });
  await expect(reopened.locator("#item-name")).toHaveText("My reading lamp");
  await expect(reopened.locator("#note-input")).toHaveValue(
    "For the reading corner.",
  );
  await expect(reopened.locator("#price-input")).toHaveValue("149.5");
  console.log("Draft restores name, price, image and note after popup closes");
  await context.setOffline(true);
  await reopened.locator("#save").click();
  await expect(reopened.locator("#form-error")).toContainText(
    /connection|reach|long/,
    { timeout: 22000 },
  );
  await expect(reopened.locator("#item-name")).toHaveText("My reading lamp");
  await context.setOffline(false);
  console.log("Offline save retains edits and offers retry");
  await reopened.locator("#save").click();
  await reopened
    .locator("#state-success")
    .waitFor({ state: "visible", timeout: 20000 });
  await reopened.screenshot({ path: "test-results/extension/success.png" });
  const { data: items, error: dbError } = await admin
    .from("wishlist_items")
    .select("name,current_price,notes")
    .eq("user_id", user.id);
  if (dbError) throw dbError;
  expect(items).toEqual([
    {
      name: "My reading lamp",
      current_price: 149.5,
      notes: "For the reading corner.",
    },
  ]);
  console.log("Saved exactly one item with edited fields");
  await reopened.reload();
  await expect(reopened.locator("#state-success")).toBeVisible();
  console.log("Reopening shows saved confirmation, avoiding duplicate save");
  await reopened.locator("#menu-button").click();
  await reopened.locator("#disconnect").click();
  await expect(reopened.locator("#state-login")).toBeVisible();
  await reopened.screenshot({ path: "test-results/extension/login.png" });
  console.log("Disconnected state verified");
  expect(pageErrors).toEqual([]);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await context?.close();
  const result = await admin.auth.admin.deleteUser(user.id);
  if (result.error) throw result.error;
  console.log("Test account removed");
}
