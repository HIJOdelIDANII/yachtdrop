import { test, expect } from "@playwright/test";

// Dismiss Next.js dev overlay that blocks pointer events
async function dismissDevOverlay(page: import("@playwright/test").Page) {
  await page.addStyleTag({
    content: "nextjs-portal { display: none !important; pointer-events: none !important; }",
  });
}

test.describe("Search Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/search");
    await dismissDevOverlay(page);
  });

  test("renders search input", async ({ page }) => {
    const input = page.getByTestId("search-input");
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute("placeholder", /search/i);
  });

  test("shows quick-search chips when idle", async ({ page }) => {
    await expect(page.getByText("Find what you need")).toBeVisible();
    await expect(page.getByRole("button", { name: "Anchor" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Rope" })).toBeVisible();
  });

  test("performs search on input and shows results", async ({ page }) => {
    const input = page.getByTestId("search-input");
    await input.fill("anchor");
    await input.press("Enter");

    await expect(
      page.getByRole("heading", { name: /products/i }).or(page.getByText(/no results/i))
    ).toBeVisible({ timeout: 10000 });
  });

  test("quick-search chip triggers search", async ({ page }) => {
    await page.getByRole("button", { name: "Anchor" }).click();

    await expect(
      page.getByRole("heading", { name: /products/i }).or(page.getByText(/no results/i))
    ).toBeVisible({ timeout: 10000 });
  });

  test("clear button resets search", async ({ page }) => {
    const input = page.getByTestId("search-input");
    await input.fill("test query");
    await expect(input).toHaveValue("test query");

    await page.getByRole("button", { name: "Clear search" }).click();
    await expect(input).toHaveValue("");
  });

  test("single network request per search (combined endpoint)", async ({
    page,
  }) => {
    const apiCalls: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (url.includes("/api/search")) {
        apiCalls.push(url);
      }
    });

    const input = page.getByTestId("search-input");
    await input.fill("led");
    await input.press("Enter");

    await page.waitForResponse(
      (res) => res.url().includes("/api/search/combined"),
      { timeout: 10000 }
    ).catch(() => {});

    await page.waitForTimeout(500);

    const searchCalls = apiCalls.filter(
      (u) => u.includes("/api/search") && !u.includes("/combined")
    );
    const marinaCalls = apiCalls.filter((u) => u.includes("/api/marinas"));

    const combinedCalls = apiCalls.filter((u) =>
      u.includes("/api/search/combined")
    );
    expect(combinedCalls.length).toBeGreaterThanOrEqual(1);
    expect(searchCalls.length).toBe(0);
    expect(marinaCalls.length).toBe(0);
  });

  test("filter sheet opens", async ({ page }) => {
    // Filter button is the Sliders icon in the header
    await page.getByRole("button").filter({ has: page.locator("svg") }).last().click();

    await expect(page.getByText(/sort|filter|price/i).first()).toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe("Search Performance", () => {
  test("search results render within 10 seconds", async ({ page }) => {
    await page.goto("/search");
    await dismissDevOverlay(page);
    const input = page.getByTestId("search-input");

    const start = Date.now();
    await input.fill("anchor");
    await input.press("Enter");

    await expect(
      page.getByRole("heading", { name: /products/i }).or(page.getByText(/no results/i))
    ).toBeVisible({ timeout: 10000 });

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(10000);
  });

  test("repeated searches are fast (cache hit)", async ({ page }) => {
    await page.goto("/search");
    await dismissDevOverlay(page);
    const input = page.getByTestId("search-input");

    // First search
    await input.fill("rope");
    await input.press("Enter");
    await page.waitForResponse(
      (res) => res.url().includes("/api/search/combined"),
      { timeout: 10000 }
    ).catch(() => {});
    await page.waitForTimeout(300);

    // Clear and search again
    await page.getByRole("button", { name: "Clear search" }).click();

    const start = Date.now();
    await input.fill("rope");
    await input.press("Enter");

    await expect(
      page.getByRole("heading", { name: /products/i }).or(page.getByText(/no results/i))
    ).toBeVisible({ timeout: 5000 });

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(5000);
  });
});
