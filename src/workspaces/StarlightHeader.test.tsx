import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StarlightHeader } from "./StarlightHeader";

describe("approved starlight identity", () => {
  it("renders an accessible, non-data illustration and the five approved phrases", () => {
    const html = renderToStaticMarkup(<StarlightHeader />);
    for (const phrase of ["En verklig utmaning", "Rätt saker först", "Kraften mellan oss", "Effekt som märks", "Mer än var för sig"])
      expect(html).toContain(phrase);
    expect(html).toContain("inte verkliga effektdata");
    expect(html).toContain("Pausa rörelsen");
    expect(html.match(/aria-pressed="false"/g)).toHaveLength(6);
    expect(html).toContain('href="#top"');
    expect(html).toContain("Vi kräver ansvar för effekten i båda fallen.");
  });
});
