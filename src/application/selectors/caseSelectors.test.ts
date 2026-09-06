import { describe, expect, it } from "vitest";
import { initializeDemoState } from "../initializeDemoState";
import { caseOverview } from "./caseSelectors";
import { stage2Ids } from "../../demo-data/stage2DemoData";

describe("caseOverview", () => {
  it("derives work status separately from strategic priority", () => {
    const state = initializeDemoState();
    const items = caseOverview(state);
    expect(items).toHaveLength(8);
    expect(items.every((item) => !Object.prototype.hasOwnProperty.call(item, "priorityScore"))).toBe(true);
    expect(items.find((item) => item.initiativeId === stage2Ids.waitingInitiative)).toMatchObject({
      step: "BEREDNING",
      obstacle: "Behörig juridisk verifiering",
      nextAction: "Verifiera dokumenterat svar",
      responsible: "Alex Exempel",
      dueDate: "2026-10-15",
      comparable: false,
    });
  });

  it("keeps qualified cases selectable without claiming a start decision", () => {
    const item = caseOverview(initializeDemoState()).find(
      (candidate) => candidate.initiativeId === stage2Ids.calculatedInitiative,
    );
    expect(item).toMatchObject({
      step: "PRIORITERINGSBAR",
      comparable: true,
      obstacle: "Inget känt hinder för prioriteringsdiskussion",
    });
  });
});
