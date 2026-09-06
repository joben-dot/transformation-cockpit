import { describe, expect, it } from "vitest";
import { createId } from "../../domain";
import { organizationIds } from "../../demo-data/organizations";
import { stage2Ids } from "../../demo-data/stage2DemoData";
import { baseDemoState } from "../../tests/fixtures/baseDemoState";
import {
  effectPotentialByCategory,
  effectPotentialsByInitiative,
  groupEffectPotentials,
} from "./effectPotentialSelectors";

describe("bedömd effektpotential", () => {
  it("lagrar potential och åtagande i olika samlingar", () => {
    const e = baseDemoState().entities;
    expect(Object.keys(e.effectPotentials).length).toBeGreaterThan(0);
    expect(e.effectCommitments).toEqual({});
  });
  it("har intervall, evidens, antaganden och osäkerhet", () =>
    expect(
      effectPotentialsByInitiative(
        baseDemoState(),
        stage2Ids.qualifiedInitiative,
      )[0],
    ).toMatchObject({
      lowerBound: 800,
      expectedValue: 1200,
      upperBound: 1600,
      evidenceRefs: expect.any(Array),
      assumptions: expect.any(Array),
      uncertainty: "MEDIUM",
    }));
  it("håller pengar, tid och kvalitet som separata kategorier", () => {
    const state = baseDemoState();
    expect(
      effectPotentialByCategory(
        state,
        stage2Ids.qualifiedInitiative,
        "RELEASED_TIME",
      ),
    ).toHaveLength(1);
    expect(
      effectPotentialByCategory(
        state,
        stage2Ids.calculatedInitiative,
        "QUALITY",
      ),
    ).toHaveLength(1);
  });
  it("summerar aldrig inkompatibla kategori- och enhetsvärden", () => {
    const groups = groupEffectPotentials(
      baseDemoState(),
      stage2Ids.calculatedInitiative,
    );
    expect(Object.keys(groups)).toEqual(["QUALITY:CORRECT_FIRST_TIME:procent"]);
  });
  it("summerar inte olika effektmått bara för att enheten är samma", () => {
    const state = baseDemoState();
    const original = effectPotentialsByInitiative(
      state,
      stage2Ids.calculatedInitiative,
    )[0];
    const id = createId("EffectPotential", "another-quality-measure");
    state.entities.effectPotentials[id] = {
      ...original,
      id,
      effectMeasureCode: "SATISFIED_RECIPIENTS",
    };
    expect(
      Object.keys(groupEffectPotentials(state, stage2Ids.calculatedInitiative)),
    ).toHaveLength(2);
  });
  it("låter federerat perspektiv vara frikopplat från lokala potentialposter", () => {
    const state = baseDemoState();
    const before = structuredClone(state.entities.effectPotentials);
    state.viewContext.selectedPerspective = { kind: "FEDERATED" };
    expect(state.entities.effectPotentials).toEqual(before);
  });
  it("skapar aldrig effektåtagande från potential", () => {
    const state = baseDemoState();
    state.entities.effectPotentials[createId("EffectPotential", "extra")] = {
      ...Object.values(state.entities.effectPotentials)[0],
      id: createId("EffectPotential", "extra"),
    };
    expect(state.entities.effectCommitments).toEqual({});
    expect(organizationIds.north).toBeTruthy();
  });
});
