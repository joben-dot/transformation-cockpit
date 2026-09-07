import { act, create } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import { BenefitTemplates } from "./BenefitTemplates";

describe("nyttokalkylens fristående räkneexempel", () => {
  it("skiljer möjlig kapacitet från pengar och räknar med användning och användbarhet", () => {
    const renderer = create(<BenefitTemplates />);
    const output = () => JSON.stringify(renderer.toJSON());
    const hours = (value: number) => `${new Intl.NumberFormat("sv-SE").format(value)} timmar`;
    expect(output()).toContain(hours(16500));
    expect(output()).toContain(hours(8250));
    expect(output()).toContain("Inte bedömd");
    act(() => renderer.root.findAllByType("input")[3].props.onChange({ target: { value: "50" } }));
    expect(output()).toContain(hours(8250));
    expect(output()).toContain(hours(4125));
    act(() => renderer.root.findAllByType("input")[4].props.onChange({ target: { value: "0" } }));
    expect(output()).toContain(hours(0));
    expect(output()).toContain("Inte bedömd");
  });

  it("visar inte noll eller vilseledande potential när indata saknas eller procenten är ogiltig", () => {
    const renderer = create(<BenefitTemplates />);
    for (const value of ["", "-1", "101", "NaN"]) {
      act(() => renderer.root.findAllByType("input")[4].props.onChange({ target: { value } }));
      const numbers = renderer.root.findByProps({ className: "effect-metrics template-results" });
      expect(numbers.findAllByType("b").map(b => b.children.join(""))).toEqual(["Komplettera antagandena", "Komplettera antagandena", "Inte bedömd"]);
    }
  });
});
