const { test, expect } = require("@playwright/test");

test("ny sammanhängande produktingång", async ({ page }) => {
  await page.goto("http://127.0.0.1:5173/");
  await expect(
    page.getByRole("heading", {
      name: "Från strategisk utmaning till mätbar verksamhetseffekt",
    }),
  ).toBeVisible();
  await expect(
    page.getByText("INITIATIVE-DEMO-initiative-104", { exact: false }).first(),
  ).toBeVisible();
  await page.getByRole("link", { name: "Effektpotential" }).click();
  await expect(
    page.getByText("Bedömd potential – inte beslutad effekthemtagning."),
  ).toBeVisible();
  await page.getByRole("link", { name: "Förutsättningar" }).click();
  await expect(
    page.getByRole("heading", { name: "Förutsättningar och beroenden" }),
  ).toBeVisible();
  await expect(
    page
      .getByText("EXECUTION-NODE-DEMO-shared-data-environment", {
        exact: false,
      })
      .first(),
  ).toBeVisible();
  await page.getByRole("link", { name: "Fortsatt process" }).click();
  await expect(
    page.getByText("Mänskligt startbeslut och låst beslutsversion"),
  ).toBeVisible();
  await expect(page.getByText("Ej implementerad").first()).toBeVisible();
  await page.screenshot({
    path: "artifacts/new-application-entry.png",
    fullPage: true,
  });
});
