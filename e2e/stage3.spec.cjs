const { test, expect } = require("@playwright/test");
test("stage 3 browser flow", async ({ page }) => {
  await page.goto("http://127.0.0.1:5173/");
  await page.getByRole("button", { name: "Genomförande" }).click();
  await expect(page.getByText("Riktad förutsättningsgraf")).toBeVisible();
  await page
    .getByRole("button", { name: "Lägg till ny förutsättning" })
    .click();
  await expect(
    page.getByText("Ny lokal syntetisk förutsättning"),
  ).toBeVisible();
  await expect(
    page.getByText("CONFLICT", { exact: true }).first(),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Flytta behov till nästa period" })
    .click();
  await expect(page.getByText(/UNKNOWN/).first()).toBeVisible();
  await page.getByRole("button", { name: "Lika fördelning" }).click();
  await expect(page.getByText(/450.*000 SEK/).first()).toBeVisible();
  await page.getByRole("button", { name: /Annat initiativ/ }).click();
  await expect(
    page.getByText(/INITIATIVE-DEMO-initiative-105/).first(),
  ).toBeVisible();
  await expect(page.getByText(/Gemensam datamiljö/).first()).toBeVisible();
  await page.screenshot({
    path: "artifacts/etapp-3-forutsattningar.png",
    fullPage: true,
  });
});
