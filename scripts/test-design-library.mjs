import fs from "node:fs";
import { spawn } from "node:child_process";
import { parseEnv } from "node:util";
import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
process.loadEnvFile(".env.local");
const privateEnv = parseEnv(
  fs.readFileSync(process.env.WANTIO_TEST_ENV_FILE, "utf8"),
);
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  privateEnv.SUPABASE_SERVICE_ROLE_KEY.replace(/\\n/g, "").trim(),
  { auth: { persistSession: false, autoRefreshToken: false } },
);
const users = [];
let server, browser;
const base = "http://127.0.0.1:3103";
try {
  for (let n = 0; n < 2; n++) {
    const email = `wantio-design-${crypto.randomUUID()}@example.com`,
      password = crypto.randomUUID();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    users.push({ ...data.user, password });
  }
  server = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "start", "-p", "3103"],
    {
      env: { ...process.env, WANTIO_ADMIN_USER_ID: users[0].id },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  let logs = "";
  server.stdout.on("data", (b) => (logs += b));
  server.stderr.on("data", (b) => (logs += b));
  for (let n = 0; n < 90; n++) {
    try {
      await fetch(base);
      break;
    } catch {
      if (n === 89) throw Error(logs);
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  browser = await chromium.launch();
  const guest = await browser.newContext();
  const gp = await guest.newPage();
  const guestResponse = await gp.goto(base + "/internal/design");
  if (guestResponse.status() !== 404) throw Error("Guest access");
  await guest.close();
  for (let n = 0; n < 2; n++) {
    const ctx = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    });
    const auth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll: () => [],
          setAll: async (cookies) =>
            ctx.addCookies(
              cookies.map((c) => ({
                name: c.name,
                value: c.value,
                url: base,
                sameSite: "Lax",
              })),
            ),
        },
      },
    );
    const { error } = await auth.auth.signInWithPassword({
      email: users[n].email,
      password: users[n].password,
    });
    if (error) throw error;
    const page = await ctx.newPage();
    const errors = [];
    page.on("pageerror", (e) => {
      errors.push(e.message);
      console.error("Page error:", e.message);
    });
    page.on("requestfailed", (r) =>
      console.error("Request failed", r.url(), r.failure()?.errorText),
    );
    const response = await page.goto(base + "/internal/design");
    if (n === 1) {
      if (response.status() !== 404) throw Error("Non-owner access");
      if (
        (await page.locator("body").innerText()).includes("The shape of Wantio")
      )
        throw Error("Page leaked");
      const rsc = await ctx.request.get(
        base + "/internal/design?_rsc=access-check",
        { headers: { RSC: "1" } },
      );
      if (rsc.status() !== 404) throw Error("Non-owner RSC access");
      console.log("Regular account denied for page and RSC (404)");
      await ctx.close();
      continue;
    }
    await page.getByRole("heading", { name: "The shape of Wantio." }).waitFor();
    await page
      .getByRole("button", { name: "Toggle color theme" })
      .locator("svg")
      .waitFor();
    fs.mkdirSync("test-results/design", { recursive: true });
    await page.screenshot({
      path: "test-results/design/desktop.png",
      fullPage: false,
    });
    await page.getByRole("button", { name: "Validate example" }).click();
    await page
      .getByText("Enter a name to continue.", { exact: true })
      .waitFor();
    await page
      .getByLabel("Product name", { exact: true })
      .fill("A design example");
    await page.getByRole("button", { name: "Validate example" }).click();
    await page.getByRole("button", { name: "Dismiss notification" }).click();
    await page
      .getByRole("button", { name: "Save to wishlist", exact: true })
      .click();
    await page.getByRole("button", { name: "Saving…" }).waitFor();
    await page.getByRole("status").waitFor();
    await page.getByRole("button", { name: "Dismiss notification" }).click();
    await page.getByRole("button", { name: "Books", exact: true }).click();
    await page.getByText("No books in this example.").waitFor();
    await page.getByRole("button", { name: "Show all items" }).click();
    await page.getByRole("button", { name: "View Arc table lamp" }).click();
    await page.getByRole("dialog").waitFor();
    await page.keyboard.press("Escape");
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    await page
      .getByRole("switch", { name: "Preview missing image & price" })
      .click();
    await page.getByText("Price not set", { exact: true }).waitFor();
    await page.getByRole("button", { name: "Reset example" }).click();
    await page.getByRole("button", { name: "Dismiss notification" }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => scrollTo(0, 0));
    if (
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      )
    ) {
      console.log(
        await page.evaluate(() =>
          Array.from(document.querySelectorAll("body *"))
            .filter((e) => e.getBoundingClientRect().right > innerWidth + 1)
            .slice(0, 8)
            .map((e) => ({ tag: e.tagName, cls: e.className })),
        ),
      );
      throw Error("Mobile overflow");
    }
    await page.screenshot({
      path: "test-results/design/mobile.png",
      fullPage: false,
    });
    await page.getByRole("button", { name: "Toggle color theme" }).click();
    await page.screenshot({
      path: "test-results/design/dark.png",
      fullPage: true,
    });
    if (errors.length) throw Error(errors.join("\n"));
    console.log(
      "Owner access, forms, loading, filters, dialog, fallback, mobile and dark theme verified",
    );
    await ctx.close();
  }
} finally {
  await browser?.close();
  server?.kill("SIGTERM");
  for (const user of users) {
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error)
      console.error("Cleanup failed for test user", user.id, error.message);
  }
  console.log("Temporary test accounts removed");
}
