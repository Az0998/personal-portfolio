import { test, expect } from "@playwright/test";

/**
 * Optional smoke — requires `npm run dev` (or PLAYWRIGHT_BASE_URL).
 * Install: npx playwright install chromium
 */
const base = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";

test.describe("portfolio smoke", () => {
  test("home: career direction + hydro CTA within first paint", async ({ page }) => {
    await page.goto(base, { waitUntil: "domcontentloaded" });
    await expect(page.getByText("智慧水利 / 水信息").first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("采集 → 空间 → 态势 → 预报 → 文档").first()).toBeVisible();
    const cta = page.getByRole("link", { name: /进入智慧水利/ });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", /hydrobench/);
  });

  test("hydrobench: five chain entries present", async ({ page }) => {
    await page.goto(`${base}/hydrobench`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("navigation", { name: /智慧水利/ })).toBeVisible({
      timeout: 8000,
    });
    // Hub cards / tabs — at least one of each lane label
    for (const label of ["态势", "作业", "空间", "机理", "文档"]) {
      await expect(page.getByText(label, { exact: false }).first()).toBeVisible();
    }
  });

  test("watershed-map: shell loads without carto watermark text in DOM", async ({ page }) => {
    await page.goto(`${base}/watershed-map`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/流域/).first()).toBeVisible({ timeout: 10000 });
    const body = await page.locator("body").innerText();
    expect(body).not.toMatch(/API KEY REQUIRED/i);
  });

  test("xaj-bench: shell and restore calibrated control", async ({ page }) => {
    await page.goto(`${base}/xaj-bench`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/新安江|机理|对照/).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("button", { name: /率定|恢复/ }).first()).toBeVisible();
  });

  test("water-balance: informal disclaimer visible", async ({ page }) => {
    await page.goto(`${base}/water-balance-report`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/非正式/).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("button", { name: /清空/ })).toBeVisible();
  });

  test("mobile nav: menu toggle has aria-label", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(base, { waitUntil: "domcontentloaded" });
    const btn = page.getByRole("button", { name: /打开菜单|关闭菜单/ });
    await expect(btn).toBeVisible();
    await btn.click();
    await expect(page.getByRole("link", { name: "智慧水利" }).first()).toBeVisible();
  });
});
