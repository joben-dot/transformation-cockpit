import { create } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import App from "./App";

const text = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object" || !("children" in value)) return "";
  return (value as { children: unknown[] }).children.map(text).join("");
};

describe("den nya informationsarkitekturen", () => {
  it("erbjuder endast länkar till den sammanhängande första vyn", () => {
    const renderer = create(<App />);
    const links = renderer.root.findAllByType("a");
    expect(links.map((link) => text(link))).toEqual([
      "Transformation Cockpit",
      "Effektpotential",
      "Förutsättningar",
      "Fortsatt process",
    ]);
    expect(links.map((link) => link.props.href)).toEqual([
      "#top",
      "#potential",
      "#conditions",
      "#roadmap",
    ]);
  });
});
