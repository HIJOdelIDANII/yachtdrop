import { test, expect } from "@playwright/test";

test.describe("Search Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/search");
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

    // Wait for results to appear (products or no-results)
    await expect(
      page.getByRole("heading", { name: /products/i }).or(page.getByText(/no results/i))
    ).toBeVisible({ timeout: 10000 });
  });

  test("quick-search chip triggers search", async ({ page }) => {
    await page.getByRole("button", { name: "Anchor" }).click();

    // Should navigate to search results
    await expect(
      page.getByRole("heading", { name: /products/i }).or(page.getByText(/no results/i))
    ).toBeVisible({ timeout: 10000 });
  });

  test("clear button resets search", async ({ page }) => {
    const input = page.getByTestId("search-input");
    await input.fill("test query");
    await expect(input).toHaveValue("test query");

    // Click clear button
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

    // Wait for the request to complete
    await page.waitForResponse(
      (res) => res.url().includes("/api/search/combined"),
      { timeout: 10000 }
    ).catch(() => {
      // May not fire if results are cached
    });

    // Wait a bit for any additional requests
    await page.waitForTimeout(500);

    // Should only have combined endpoint calls, not separate /api/search + /api/marinas
    const searchCalls = apiCalls.filter(
      (u) => u.includes("/api/search") && !u.includes("/combined")
    );
    const marinaCalls = apiCalls.filter((u) => u.includes("/api/marinas"));

    // The page should use the combined endpoint
    const combinedCalls = apiCalls.filter((u) =>
      u.includes("/api/search/combined")
    );
    expect(combinedCalls.length).toBeGreaterThanOrEqual(1);
    // No separate search/marina calls from the search page
    expect(searchCalls.length).toBe(0);
    expect(marinaCalls.length).toBe(0);
  });

  test("API returns proper cache headers", async ({ page }) => {
    const input = page.getByTestId("search-input");
    await input.fill("anchor");
    await input.press("Enter");

    const response = await page.waitForResponse(
      (res) => res.url().includes("/api/search/combined"),
      { timeout: 10000 }
    );
    const cacheControl = response.headers()["cache-control"];
    expect(cacheControl).toContain("s-maxage");
    expect(cacheControl).toContain("stale-while-revalidate");
  });

  test("filter sheet opens and closes", async ({ page }) => {
    // Click the filter button (Sliders icon)
    await page.locator("header button").last().click();

    // Filter sheet should be visible
    await expect(page.getByText(/filter/i).first()).toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe("Search Performance", () => {
  test("search results render within 3 seconds", async ({ page }) => {
    await page.goto("/search");
    const input = page.getByTestId("search-input");

    const start = Date.now();
    await input.fill("anchor");
    await input.press("Enter");

    // Wait for either products or no-results
    await expect(
      page.getByRole("heading", { name: /products/i }).or(page.getByText(/no results/i))
    ).toBeVisible({ timeout: 10000 });

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(3000);
  });

  test("repeated searches are fast (cache hit)", async ({ page }) => {
    await page.goto("/search");
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
    // Cached search should be much faster
    expect(elapsed).toBeLessThan(2000);
  });
});
