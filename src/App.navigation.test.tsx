import { act, create, type ReactTestInstance } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import App from "./App";
import { stage2Ids } from "./demo-data/stage2DemoData";

const textContent = (node: ReactTestInstance | string): string =>
  typeof node === "string"
    ? node
    : node.children
        .map((child) => textContent(child as ReactTestInstance | string))
        .join("");

describe("sammanhängande navigation genom etapp 2", () => {
  it("når alla fyra arbetsytor med samma aktiva ärendeidentitet", () => {
    const renderer = create(<App />);
    const navigate = (label: string, expectedHeading: string) => {
      const button = renderer.root
        .findAllByType("button")
        .find((candidate) => textContent(candidate).includes(label));
      expect(button).toBeDefined();
      act(() => button!.props.onClick());
      const renderedText = textContent(renderer.root);
      expect(renderedText).toContain(expectedHeading);
      expect(renderedText).toContain(stage2Ids.calculatedInitiative);
      expect(renderedText).toContain("CHALLENGE-DEMO-challenge-105");
    };

    navigate("Utmaningar", "STRATEGISK ÄRENDEKONTEXT");
    navigate("Kvalificering", "Sex kvalificeringsområden");
    navigate(
      "Effektpotential",
      "Bedömd potential – inte beslutad effekthemtagning.",
    );
    navigate("Prioritering", "Transparent prioriteringsunderlag");
  });
});
