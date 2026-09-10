import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

test("public pages, small screen, and unauthenticated API protection", async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Your wishlist/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Get started" }).click();
  await expect(
    page.getByRole("button", { name: "Continue with Google" }),
  ).toBeVisible();
  expect(
    (
      await request.post("/api/items", { data: { name: "Unauthorized" } })
    ).status(),
  ).toBe(401);
  expect(
    (
      await request.post("/api/scrape", {
        data: { url: "https://example.com" },
      })
    ).status(),
  ).toBe(401);
  await page.goto("/shared/not-a-uuid");
  await expect(page.getByText("404",{exact:true})).toBeVisible();
});

test("save, edit, purchase, restore, share privately, and delete", async ({
  page,
  context,
  browser,
  baseURL,
}) => {
  test.skip(
    !process.env.TEST_SUPABASE_SERVICE_ROLE_KEY,
    "Requires an explicitly provided admin key for a disposable test account.",
  );
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const admin = createClient(url, process.env.TEST_SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const email = `wantio-e2e-${crypto.randomUUID()}@example.com`;
  const password = crypto.randomUUID() + crypto.randomUUID();
  const {
    data: { user },
    error,
  } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Wantio test" },
  });
  if (error || !user) throw error || new Error("Test account was not created");
  try {
    const auth = createServerClient(url, key, {
      cookies: {
        getAll: () => [],
        setAll: async (cookies) => {
          await context.addCookies(
            cookies.map((c) => ({
              name: c.name,
              value: c.value,
              url: baseURL!,
              sameSite: "Lax" as const,
            })),
          );
        },
      },
    });
    const login = await auth.auth.signInWithPassword({ email, password });
    if (login.error) throw login.error;
    const apiId=crypto.randomUUID();
    for(let retry=0;retry<2;retry++) {
      const response=await page.request.post('/api/items',{headers:{Authorization:`Bearer ${login.data.session!.access_token}`},data:{id:apiId,name:'Extension API test',currency:'EUR',current_price:0}});
      expect(response.status()).toBe(201);
    }
    const {data:saved}=await auth.from('wishlist_items').select('id').eq('id',apiId);
    expect(saved).toHaveLength(1);
    await auth.from('wishlist_items').delete().eq('id',apiId);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /Your wishlist/ }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.getByLabel("New tag").fill("Home");
    await page.getByRole("button", { name: "Add", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Delete tag Home" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Wishlist", exact: true }).click();
    await page
      .getByRole("button", { name: "Add item", exact: true })
      .first()
      .click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Product name").fill("Test chair");
    await dialog.getByLabel("Price", { exact: true }).fill("100");
    await dialog.getByLabel("Currency").selectOption("PLN");
    await dialog.getByLabel("Private notes").fill("Only I can see this");
    await dialog.getByLabel("Home", { exact: true }).check();
    await dialog.getByRole("button", { name: "Add item", exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(
      page.getByRole("button", { name: "View Test chair" }),
    ).toBeVisible();
    await page.screenshot({path:'test-results/wantio-mobile.png',fullPage:true});
    await page.setViewportSize({width:1440,height:1000});
    await page.screenshot({path:'test-results/wantio-desktop.png',fullPage:true});
    await page.setViewportSize({width:390,height:844});
    await page.getByRole("button", { name: "View Test chair" }).click();
    await dialog.getByRole("button", { name: "Edit item" }).click();
    await dialog.getByLabel("Product name").fill("Edited chair");
    await dialog.getByRole("button", { name: "Save changes" }).click();
    await expect(
      page.getByRole("button", { name: "View Edited chair" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "View Edited chair" }).click();
    await dialog.getByLabel(/Purchase price/).fill("75");
    await dialog.getByRole("button", { name: "Mark as purchased" }).click();
    await expect(dialog).toBeHidden();
    await expect(
      page.getByRole("button", { name: "View Edited chair" }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "Purchased", exact: true }).click();
    await expect(page.getByText("Spent · PLN")).toBeVisible();
    await page.getByRole("button", { name: "View Edited chair" }).click();
    await dialog.getByRole("button", { name: "Move back to wishlist" }).click();
    await expect(dialog).toBeHidden();
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.getByLabel("Allow viewing with a link").check();
    await expect(page.getByLabel("Allow viewing with a link")).toBeEnabled();
    const link = await page.getByLabel("Wishlist share link").inputValue();
    const guest = await browser.newContext();
    const guestPage = await guest.newPage();
    try {
      await guestPage.goto(link);
      await expect(
        guestPage.getByRole("heading", { name: "Edited chair" }),
      ).toBeVisible();
      await expect(guestPage.getByText("Only I can see this")).toHaveCount(0);
      await page.getByLabel("Allow viewing with a link").uncheck();
    await expect(page.getByLabel("Allow viewing with a link")).toBeEnabled();
      await guestPage.reload();
      await expect(guestPage.getByText("404", { exact: true })).toBeVisible();
    } finally {
      await guest.close();
    }
    await page.getByRole("button", { name: "Wishlist", exact: true }).click();
    await page.getByRole("button", { name: "View Edited chair" }).click();
    page.once("dialog", (d) => d.accept());
    await dialog
      .getByRole("button", { name: "Delete item", exact: true })
      .click();
    await expect(dialog).toBeHidden();
    await expect(
      page.getByRole("button", { name: "View Edited chair" }),
    ).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  } finally {
    const result = await admin.auth.admin.deleteUser(user.id);
    if (result.error) throw result.error;
  }
});
