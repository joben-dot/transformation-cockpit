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

test("sammanhängande ärende med individuell bedömning och explicit potential", async ({
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
  const identity = await page.locator(".stage2-identity").textContent();
  const editor = page.getByRole("region", { name: "Bearbeta kvalificering" });
  const criterion = editor.getByLabel("Kriterium");
  const options = await criterion
    .locator("option")
    .evaluateAll((items) => items.map((item) => item.value));

  await editor.getByLabel("Bedömning").selectOption("INCOMPLETE");
  await editor
    .getByLabel("Sammanfattning")
    .fill("Första punkten behöver mer underlag");
  await editor.getByRole("button", { name: "Spara vald bedömning" }).click();
  await criterion.selectOption(options[1]);
  await expect(editor.getByLabel("Bedömning")).toHaveValue("INCOMPLETE");

  for (const [index, code] of options.entries()) {
    await criterion.selectOption(code);
    await editor.getByLabel("Bedömning").selectOption("SATISFIED");
    await editor
      .getByLabel("Sammanfattning")
      .fill(`Individuell syntetisk bedömning ${index + 1}`);
    await editor.getByLabel(/Evidensreferenser/).fill(`EVIDENCE-${index + 1}`);
    await editor.getByLabel(/Antaganden/).fill(`ASSUMPTION-${index + 1}`);
    await editor.getByRole("button", { name: "Spara vald bedömning" }).click();
    const verify = editor.getByRole("button", {
      name: "Verifiera vald bedömning",
    });
    if (await verify.isVisible().catch(() => false)) await verify.click();
  }

  const completion = page.getByRole("region", {
    name: "Hantera komplettering",
  });
  await completion.getByLabel("Vad saknas?").fill("Kriteriespecifik kontroll");
  await completion
    .getByLabel("Varför behövs det?")
    .fill("Behövs för spårbar mänsklig prövning");
  await completion
    .getByRole("button", { name: /Skapa kriteriespecifikt/ })
    .click();
  await completion.getByRole("button", { name: /Spara vald ansvarig/ }).click();
  await completion
    .getByRole("button", { name: "Lämna in komplettering" })
    .click();
  await completion
    .getByRole("button", { name: "Verifiera komplettering" })
    .click();

  await page.getByRole("button", { name: "Prioritering" }).click();
  await page
    .getByRole("button", { name: /Beräkna nytt prioriteringsunderlag/ })
    .click();
  await expect(page.getByRole("status")).toContainText("effektpotential");

  await page.getByRole("button", { name: "Effektpotential" }).click();
  await expect(page.locator(".stage2-identity")).toHaveText(identity);
  const potential = page.getByRole("region", {
    name: "Registrera effektpotential",
  });
  await potential.getByLabel("Effektkategori").selectOption("MONEY");
  await potential.getByLabel("Mätetal").fill("MÖJLIG_KOSTNADSEFFEKT");
  await potential.getByLabel("Enhet").fill("SEK/år");
  await potential.getByLabel("Låg potential").fill("100000");
  await potential.getByLabel("Förväntad potential").fill("150000");
  await potential.getByLabel("Hög potential").fill("200000");
  await potential.getByLabel("Evidens").fill("EVIDENCE-MONEY");
  await potential.getByLabel("Antagande").fill("Syntetiskt volymantagande");
  await potential
    .getByLabel("Effekthemtagningsfönster")
    .fill("Kalenderår 2027");
  await potential.getByLabel("Tidigaste möjliga effekt").fill("2027-01-01");
  await potential.getByLabel("Full potential").fill("2027-12-31");
  await potential
    .getByRole("button", { name: "Registrera bedömd potential" })
    .click();
  await expect(page.getByText(/150000 \/ 200000 SEK\/år/)).toBeVisible();

  await potential.getByLabel("Effektkategori").selectOption("RELEASED_TIME");
  await potential.getByLabel("Mätetal").fill("MÖJLIG_FRIGJORD_TID");
  await potential.getByLabel("Enhet").fill("timmar/år");
  await potential.getByLabel("Låg potential").fill("300");
  await potential.getByLabel("Förväntad potential").fill("450");
  await potential.getByLabel("Hög potential").fill("600");
  await potential.getByLabel("Evidens").fill("EVIDENCE-TIME");
  await potential
    .getByLabel("Antagande")
    .fill("Syntetiskt arbetsflödesantagande");
  await potential.getByLabel("Effekthemtagningsfönster").fill("2028–2029");
  await potential.getByLabel("Tidigaste möjliga effekt").fill("2028-02-01");
  await potential.getByLabel("Full potential").fill("2029-06-30");
  await potential
    .getByRole("button", { name: "Registrera bedömd potential" })
    .click();
  await expect(page.getByText(/450 \/ 600 timmar\/år/)).toBeVisible();

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
  const effectWeight = page.getByLabel("Effekt");
  const evidenceWeight = page.getByLabel("Evidens");
  await effectWeight.fill(String(Number(await effectWeight.inputValue()) + 1));
  await evidenceWeight.fill(
    String(Number(await evidenceWeight.inputValue()) - 1),
  );
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
  await expect(page.getByText(/INITIATIVE-DEMO-created-/)).toBeVisible();
  await page
    .getByRole("button", { name: "Annat initiativ som återanvänder E" })
    .click();
  await expect(
    page.getByText(/Preliminära engångskostnader:.*900.*000 SEK/),
  ).toBeVisible();
});
