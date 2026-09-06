import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import App from "./App";
import { stage3Ids } from "./demo-data/stage3DemoData";

describe("den nya produktens ingång", () => {
  it("visar en sammanhängande syntetisk berättelse med stabil identitet", () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain(stage3Ids.valueInitiative);
    expect(html).toContain("CHALLENGE-DEMO-challenge-105");
    expect(html).toContain(
      "Bedömd potential – inte beslutad effekthemtagning.",
    );
    expect(html).toContain(stage3Ids.sharedNode);
    expect(html).toContain("Planerare i den fiktiva omsorgsverksamheten");
    expect(html).toContain("UNDVIKBAR_DRIFTKOSTNAD");
    expect(html).toContain("FRIGJORD_PLANERINGSKAPACITET");
    expect(html).toContain("procentenheter");
  });

  it("visar processgränsen utan beslut eller realiserade resultat", () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain("Prioritering är inte startbeslut");
    expect(html).toContain("Inte implementerat i denna leverans");
    expect(html).not.toContain("STARTA");
    expect(html).toContain("Prioritering är inte startbeslut");
    expect(html).not.toContain("5 700 h/år");
  });

  it("gör organisation till stödjande spårbarhet i stället för huvudnavigation", () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).not.toContain("Organisationsperspektiv");
    expect(html).not.toContain("Visa federerat");
    expect(html).toContain("Effektpotential");
    expect(html).toContain("Förutsättningar");
  });
});
