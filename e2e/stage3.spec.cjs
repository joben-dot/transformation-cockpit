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

test("sammanhängande ärende från registrering genom etapp 3", async ({
  page,
}) => {
  await page.goto("http://127.0.0.1:5173/");
  await page
    .getByRole("button", { name: /Ny utmaning/ })
    .first()
    .click();
  await page.getByLabel("Titel").fill("Syntetisk sammanhållen planering");
  await page
    .getByLabel("Problemformulering")
    .fill("Ett fiktivt planeringsunderlag behöver samordnas.");
  await page
    .getByRole("button", { name: "Registrera och kvalificera" })
    .click();
  await expect(
    page.getByText(/ChallengeId: CHALLENGE-DEMO-created-/),
  ).toBeVisible();
  const identity = await page.locator(".stage2-identity").textContent();

  await page
    .getByRole("button", { name: "Bedöm alla återstående punkter" })
    .click();
  await expect(page.getByText("Samtliga bedömningar sparades.")).toBeVisible();
  await page.getByRole("button", { name: "Skapa kompletteringskrav" }).click();
  await page
    .getByRole("button", { name: "Ange ansvarig, deadline och verifierare" })
    .click();
  await page.getByRole("button", { name: "Lämna in komplettering" }).click();
  await page.getByRole("button", { name: "Verifiera komplettering" }).click();

  await page.getByRole("button", { name: "Effektpotential" }).click();
  await expect(page.locator(".stage2-identity")).toHaveText(identity);
  await page
    .getByRole("button", { name: "Registrera bedömd potential" })
    .click();
  await expect(page.getByText("Potentialen registrerades.")).toBeVisible();

  await page.getByRole("button", { name: "Prioritering" }).click();
  await expect(page.locator(".stage2-identity")).toHaveText(identity);
  await page
    .getByRole("button", { name: /Beräkna nytt prioriteringsunderlag/ })
    .click();
  await page
    .getByLabel("Motivering")
    .fill("Mänsklig syntetisk prioriteringsmotivering.");
  await page.getByRole("button", { name: "Acceptera underlag" }).click();
  await expect(
    page.getByText("Ställningstagandet registrerades."),
  ).toBeVisible();

  await page.getByRole("button", { name: /Styrmodell/ }).click();
  const effect = page.getByLabel("Effekt");
  const evidence = page.getByLabel("Evidens");
  await effect.fill(String(Number(await effect.inputValue()) + 1));
  await evidence.fill(String(Number(await evidence.inputValue()) - 1));
  await page
    .getByRole("button", { name: "Skapa och aktivera ny profilversion" })
    .click();
  await expect(page.getByText(/Profilversion 2 aktiverades/)).toBeVisible();

  await page.getByRole("button", { name: "Prioritering" }).click();
  await page
    .getByRole("button", { name: /Beräkna nytt prioriteringsunderlag/ })
    .click();
  await expect(
    page.getByText("Historiska underlag för initiativet: 2"),
  ).toBeVisible();

  await page.getByRole("button", { name: "Genomförande" }).click();
  await page
    .getByRole("button", { name: "Lägg till ny förutsättning" })
    .click();
  await expect(
    page.getByText("Ny lokal syntetisk förutsättning"),
  ).toBeVisible();
  await expect(
    page.getByText("Ingen gemensam investering är kopplad till vald kontext."),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Annat initiativ som återanvänder E" })
    .click();
  await expect(
    page.getByText(/Preliminära engångskostnader:.*900.*000 SEK/),
  ).toBeVisible();
});
