import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("ärendeöversikten", () => {
  it("är startvy och beskriver arbete utan prioriteringspoäng", () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain("Vad behöver ledningens uppmärksamhet?");
    expect(html).toContain("8 av 8");
    expect(html).toContain("Ansvarig saknas");
    expect(html).toContain("Prioritering är inte startbeslut");
    expect(html).not.toContain("sr-only");
    expect(html).not.toContain("INITIATIVE-DEMO-initiative-104");
  });

  it("visar kommande steg utan att påstå att de är genomförda", () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain("Inte implementerat i denna leverans");
    expect(html).not.toContain("STARTA");
    expect(html).not.toContain("realiserad effekt uppnådd");
  });
});
