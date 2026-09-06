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

  await page.getByLabel("Vikt Effekt").fill("100");
  await page.getByLabel("Vikt Evidens").fill("0");
  await page.getByLabel("Vikt Tid").fill("0");
  await page.getByLabel("Vikt Kvalitet").fill("0");
  await page.getByLabel("Vikt Kapacitet").fill("0");
  await page
    .getByRole("button", { name: "Skapa nytt prioriteringsscenario" })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Nytt versionsbundet jämförelseunderlag",
  );
  await expect(comparisons.first()).toContainText("Profil v2");
  await expect(comparisons.first()).toContainText("95 / 100");
  await expect(
    page.getByText("Gällande styrprofil: Neutral demoprofil v1"),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Visa grundprofilens jämförelse" })
    .click();
  await expect(comparisons.first()).toContainText("Profil v1");

  await page.getByLabel("Vikt Effekt").fill("0");
  await page.getByLabel("Vikt Evidens").fill("100");
  await page.getByLabel("Vikt Tid").fill("0");
  await page.getByLabel("Vikt Kvalitet").fill("0");
  await page.getByLabel("Vikt Kapacitet").fill("0");
  await page
    .getByRole("button", { name: "Skapa nytt prioriteringsscenario" })
    .click();
  await expect(comparisons.first()).toContainText("90 / 100");
  await expect(comparisons.first()).toContainText(
    "Samordnad fiktiv serviceväg",
  );

  await page
    .getByRole("button", { name: /Bättre planering i fiktiv omsorg/ })
    .click();
  await page.getByRole("link", { name: "Effektpotential" }).click();
  await expect(
    page.getByText("Bedömd potential – inte beslutad effekthemtagning."),
  ).toBeVisible();
  const potentialSelect = page.getByLabel("Potential att redigera");
  const selectPotential = async (category) => {
    const value = await potentialSelect
      .locator("option")
      .filter({ hasText: category })
      .first()
      .getAttribute("value");
    await potentialSelect.selectOption(value);
  };
  await selectPotential("MONEY");
  await expect(page.getByLabel("Nytt förväntat potentialvärde")).toHaveValue(
    "260000",
  );
  await selectPotential("RELEASED_TIME");
  await expect(page.getByLabel("Nytt förväntat potentialvärde")).toHaveValue(
    "1300",
  );
  await selectPotential("QUALITY");
  await expect(page.getByLabel("Nytt förväntat potentialvärde")).toHaveValue(
    "7",
  );
  await page.getByLabel("Nytt lågt potentialvärde").fill("5");
  await page.getByLabel("Nytt förväntat potentialvärde").fill("8");
  await page.getByLabel("Nytt högt potentialvärde").fill("11");
  await page
    .getByLabel("Nytt potentialantagande")
    .fill("Aktivt ändrat syntetiskt kvalitetsantagande.");
  await page.getByRole("button", { name: "Spara ny version" }).click();
  await expect(page.getByRole("status")).toContainText("Ändringen sparades");
  await expect(page.locator(".potential-card").first()).toContainText("8");
  await page.getByRole("link", { name: "Prioritering" }).click();
  await expect(
    page.getByText("Nyare potential finns – ombedömning behövs"),
  ).toBeVisible();

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
