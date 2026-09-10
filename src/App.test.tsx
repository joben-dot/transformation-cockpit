import { initializeDemoState } from "./application/initializeDemoState";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("kontrollrummet", () => {
  it("är startvy och skiljer möjlig effekt från uppföljning", () => {
    const html = renderToStaticMarkup(<App demoState={initializeDemoState()} />);
    expect(html).toContain("Mer än var för sig");
    expect(html).not.toContain("Gemensam riktning. Synliga framsteg.");
    expect(html).not.toContain('class="hero cockpit-hero"');
    expect(html).toContain("Det här ligger högst");
    expect(html).toContain("Ansvar behöver klarläggas");
    expect(html).toContain("Prioritering är inte startbeslut");
    expect(html).not.toContain("sr-only");
    expect(html).not.toContain("INITIATIVE-DEMO-initiative-104");
  });

  it("visar effektkedjans arbetsytor utan att påstå att effekt är uppnådd", () => {
    const html = renderToStaticMarkup(<App demoState={initializeDemoState()} />);
    expect(html).toContain("Effekt och beslut");
    expect(html).toContain("Kontrollrum");
    expect(html).toContain("Ingen backend");
    expect(html).not.toContain("STARTA");
    expect(html).not.toContain("realiserad effekt uppnådd");
  });
});
