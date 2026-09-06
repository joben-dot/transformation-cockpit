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

  it("visar effektkedjans arbetsytor utan att påstå att effekt är uppnådd", () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain("Effekt och beslut");
    expect(html).toContain("Kontrollrum");
    expect(html).toContain("Ingen backend");
    expect(html).not.toContain("STARTA");
    expect(html).not.toContain("realiserad effekt uppnådd");
  });
});
