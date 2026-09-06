const { test, expect } = require("@playwright/test");

test("demonstrerbart strategiskt prioriteringsunderlag", async ({ page }) => {
  await page.goto("http://127.0.0.1:5173/");
  await expect(
    page.getByRole("heading", {
      name: "Prioriteringsunderlag för tre initiativ",
    }),
  ).toBeVisible();
  const comparisons = page.locator(".comparison-card");
  await expect(comparisons).toHaveCount(3);
  await expect(comparisons.first()).toContainText("Profil v1");

  await page.getByLabel("Vikt Effekt").fill("30");
  await page.getByLabel("Vikt Evidens").fill("25");
  await page
    .getByRole("button", { name: "Skapa nytt prioriteringsscenario" })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Nytt versionsbundet jämförelseunderlag",
  );
  await expect(comparisons.first()).toContainText("Profil v2");

  await page
    .getByRole("button", { name: /Bättre planering i fiktiv omsorg/ })
    .click();
  await page.getByRole("link", { name: "Effektpotential" }).click();
  await expect(
    page.getByText("Bedömd potential – inte beslutad effekthemtagning."),
  ).toBeVisible();
  await page.getByLabel("Nytt förväntat potentialvärde").fill("8");
  await page
    .getByLabel("Nytt potentialantagande")
    .fill("Aktivt ändrat syntetiskt kvalitetsantagande.");
  await page.getByRole("button", { name: "Spara ny version" }).click();
  await expect(page.getByRole("status")).toContainText("Ändringen sparades");
  await expect(page.locator(".potential-card").first()).toContainText("8");

  await page.getByRole("link", { name: "Förutsättningar" }).click();
  await page
    .getByRole("button", { name: /Datakvalitet och gemensamma begrepp/ })
    .click();
  const drawer = page.locator(".drawer");
  await expect(drawer).toContainText(
    "Informationsklassning och bedömning av dataanvändning",
  );
  await expect(drawer).toContainText("Robin Demo · Specialist");
  await drawer.getByLabel("Deadline").fill("2026-12-15");
  await drawer.getByRole("button", { name: "Spara ansvar och datum" }).click();
  await expect(page.getByRole("status")).toContainText("Ändringen sparades");
  await drawer.getByRole("button", { name: "Stäng" }).click();

  await page.getByRole("link", { name: "Kostnader" }).click();
  await expect(page.getByText(/1.*440.*000 SEK/)).toBeVisible();
  await expect(page.getByText(/150.*000 SEK\/år/)).toBeVisible();

  await page
    .getByRole("button", { name: /Samordnad fiktiv serviceväg/ })
    .click();
  await expect(page.getByText(/900.*000 SEK/).first()).toBeVisible();
  await expect(
    page.getByText("1 effektpotentialer · 1 blockerade noder"),
  ).toBeVisible();

  await page
    .getByRole("button", { name: /Digital fiktiv avtalsuppföljning/ })
    .click();
  await page.getByRole("link", { name: "Förutsättningar" }).click();
  await page
    .getByRole("button", { name: "Koppla befintlig gemensam datamiljö" })
    .click();
  await expect(page.getByRole("status")).toContainText("Ändringen sparades");
  await expect(
    page.getByText("Gemensam datamiljö", { exact: true }),
  ).toBeVisible();

  await page.screenshot({
    path: "artifacts/strategic-priority-demo.png",
    fullPage: true,
  });
});
