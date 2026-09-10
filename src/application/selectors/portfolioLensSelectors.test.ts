import { expect, it } from "vitest";
import { initializeDemoState } from "../initializeDemoState";
import { stage3Ids } from "../../demo-data/stage3DemoData";
import { businessAreaId, businessIds } from "../../demo-data/organizations";
import { currentEffectPotentials } from "./effectPotentialSelectors";
import { portfolioLens, simulatedPotential } from "./portfolioLensSelectors";

it("behåller externa och indirekta förutsättningar utan att ändra områdets deltagande", () => {
  const state = initializeDemoState();
  state.entities.participations = Object.fromEntries(Object.entries(state.entities.participations)
    .filter(([, p]) => p.initiativeId === stage3Ids.valueInitiative)
    .map(([id, p]) => [id, { ...p, businessId: businessIds.intake, validFrom: "2026-01-01", validTo: undefined }]));
  const before = JSON.stringify(state);
  const lens = portfolioLens(state, businessAreaId, "2026-10-01");
  expect(lens.selected.map(i => i.id)).toEqual([stage3Ids.valueInitiative]);
  expect(lens.externalIds.has(stage3Ids.enablingInitiative)).toBe(true);
  expect(lens.nodes.some(n => n.id === stage3Ids.sharedNode)).toBe(true);
  expect(lens.dependencies.length).toBeGreaterThan(1);
  expect(JSON.stringify(state)).toBe(before);
});

it("samlar initiativ kring en gemensam förutsättning och respekterar deltagandets datum", () => {
  const state = initializeDemoState();
  const group = portfolioLens(state, "Alla", "2026-10-01").shared.find(g => g.node.id === stage3Ids.sharedNode);
  expect(group?.consumers).toEqual(expect.arrayContaining([stage3Ids.valueInitiative, stage3Ids.reuseInitiative]));
  Object.values(state.entities.participations).forEach(p => { p.validFrom = "2027-01-01"; });
  expect(portfolioLens(state, businessAreaId, "2026-10-01").selected).toHaveLength(0);
});

it("simulerar effekter separat utan att skriva över underlag, åtaganden eller beslut", () => {
  const state = initializeDemoState(), id = stage3Ids.valueInitiative;
  const source = currentEffectPotentials(state, id);
  const first = source[0];
  first.earliestPossibleEffectDate = "2027-01-31";
  const before = JSON.stringify(state);
  const rows = simulatedPotential(state, id, { [first.id]: 50 }, 1);
  expect(rows[0].expected).toBe(first.expectedValue / 2);
  expect(rows[0].firstEffect).toBe("2027-02-28");
  expect(rows.slice(1).map(r => r.expected)).toEqual(source.slice(1).map(p => p.expectedValue));
  expect(rows.map(r => r.source.unit)).toEqual(source.map(p => p.unit));
  expect(JSON.stringify(state)).toBe(before);
});
