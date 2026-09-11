import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

test("navigation preserves filters, browser history and item focus on desktop and mobile", async ({
  page,
  context,
  baseURL,
}) => {
  test.skip(
    !process.env.TEST_SUPABASE_SERVICE_ROLE_KEY,
    "Requires disposable test account access",
  );
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.TEST_SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const email = `wantio-nav-${crypto.randomUUID()}@example.com`,
    password = crypto.randomUUID();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw error || Error("Missing test user");
  const user = data.user;
  try {
    const auth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => [],
          setAll: async (cookies) =>
            context.addCookies(
              cookies.map((c) => ({
                name: c.name,
                value: c.value,
                url: baseURL!,
                sameSite: "Lax" as const,
              })),
            ),
        },
      },
    );
    const login = await auth.auth.signInWithPassword({ email, password });
    if (login.error) throw login.error;
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Make room for your next favorite" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "All", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    const tags = [
      "Books",
      "Home",
      "Travel",
      "Watches",
      "Ideas for the reading corner",
      "A very long label for future adventures",
    ].map((name) => ({
      id: crypto.randomUUID(),
      user_id: user.id,
      name,
      color: "#466BEA",
    }));
    const items = Array.from({ length: 24 }, (_, i) => ({
      id: crypto.randomUUID(),
      user_id: user.id,
      name: i < 2 ? `Book ${i}` : `Home find ${i}`,
      current_price: 25 + i,
      currency: "PLN",
      store: "Example store",
      image_url: baseURL + "/design/lamp.svg",
      created_at: new Date(Date.now() - i * 1000).toISOString(),
    }));
    for (const response of [
      await admin.from("tags").insert(tags),
      await admin.from("wishlist_items").insert(items),
      await admin.from("item_tags").insert(
        items.map((item, i) => ({
          item_id: item.id,
          tag_id: tags[i < 2 ? 0 : 1].id,
        })),
      ),
    ])
      if (response.error) throw response.error;
    await page.reload();
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      const nav = page.getByRole("navigation", {
        name: width === 390 ? "Mobile navigation" : "Main navigation",
        exact: true,
      });
      await expect(nav).toBeVisible();
      await expect(
        page
          .getByRole("button", { name: "Add item", exact: true })
          .filter({ visible: true }),
      ).toHaveCount(1);
      await page.getByRole("button", { name: "Books", exact: true }).click();
      await expect(page.getByRole("button", { name: /^View / })).toHaveCount(2);
      await page
        .getByRole("searchbox", { name: "Search wishlist" })
        .fill("Book 0");
      await expect(page.getByRole("button", { name: /^View / })).toHaveCount(1);
      await page
        .getByRole("button", { name: "View Book 0", exact: true })
        .click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).toBeHidden();
      await expect(page.getByRole("searchbox")).toHaveValue("Book 0");
      await expect(
        page.getByRole("button", { name: "Books", exact: true }),
      ).toHaveAttribute("aria-pressed", "true");
      await expect(
        page.getByRole("button", { name: "View Book 0", exact: true }),
      ).toBeFocused();
      await page.goForward();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.goBack();
      await expect(page.getByRole("dialog")).toBeHidden();
      await nav.getByRole("link", { name: "Settings", exact: true }).click();
      await expect(
        page.getByRole("heading", { name: "Settings", exact: true }),
      ).toBeVisible();
      await page.goBack();
      await expect(page.getByRole("searchbox")).toHaveValue("Book 0");
      await page.reload();
      await expect(page.getByRole("searchbox")).toHaveValue("Book 0");
      await page.getByRole("button", { name: "Home", exact: true }).click();
      await expect(
        page.getByRole("heading", { name: "No matching items" }),
      ).toBeVisible();
      await page.getByRole("button", { name: "Clear filters" }).click();
      await expect(page.getByRole("button", { name: /^View / })).toHaveCount(
        24,
      );
      await page
        .getByRole("button", { name: "View Home find 23" })
        .scrollIntoViewIfNeeded();
      const y = await page.evaluate(() => scrollY);
      await page.getByRole("button", { name: "View Home find 23" }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.getByRole("button", { name: "Close", exact: true }).click();
      await expect(page.getByRole("dialog")).toBeHidden();
      expect(Math.abs((await page.evaluate(() => scrollY)) - y)).toBeLessThan(
        8,
      );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: `test-results/navigation-${width}.png` });
    }
    await page.goto(`/?item=${items[0].id}&tag=${tags[0].id}`);
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page).not.toHaveURL(/item=/);
    await expect(
      page.getByRole("button", { name: "Books", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByRole("button", { name: "All", exact: true }),
    ).toBeInViewport();
    expect(errors).toEqual([]);
  } finally {
    const { error } = await admin.auth.admin.deleteUser(user.id);
    if (error) throw error;
  }
});
