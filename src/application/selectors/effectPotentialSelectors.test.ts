import { describe, expect, it } from "vitest";
import { createId } from "../../domain";
import { organizationIds } from "../../demo-data/organizations";
import { stage2Ids } from "../../demo-data/stage2DemoData";
import { baseDemoState } from "../../tests/fixtures/baseDemoState";
import {
  effectPotentialByCategory,
  currentEffectPotentials,
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
    expect(Object.keys(groups)).toEqual(
      expect.arrayContaining([
        "QUALITY:CORRECT_FIRST_TIME:procentenheter",
        "MONEY:UNDVIKBAR_DRIFTKOSTNAD:SEK/år",
        "RELEASED_TIME:FRIGJORD_PLANERINGSKAPACITET:timmar/år",
      ]),
    );
    expect(groups["MONEY:UNDVIKBAR_DRIFTKOSTNAD:SEK/år"].expectedValue).toBe(
      260000,
    );
    expect(
      groups["RELEASED_TIME:FRIGJORD_PLANERINGSKAPACITET:timmar/år"]
        .expectedValue,
    ).toBe(1300);
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
    const groups = groupEffectPotentials(state, stage2Ids.calculatedInitiative);
    expect(
      groups["QUALITY:CORRECT_FIRST_TIME:procentenheter"].expectedValue,
    ).toBe(7);
    expect(
      groups["QUALITY:SATISFIED_RECIPIENTS:procentenheter"].expectedValue,
    ).toBe(original.expectedValue);
    expect(
      Object.keys(groups).filter((key) => key.startsWith("QUALITY:")).length,
    ).toBe(2);
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

describe("potentialserier", () => {
  it("behåller samma mätetal för två mottagande verksamheter separat", () => {
    const state = baseDemoState();
    const original = effectPotentialsByInitiative(
      state,
      stage2Ids.calculatedInitiative,
    ).find((item) => item.category === "QUALITY")!;
    const otherBusiness = Object.values(state.entities.businesses).find(
      (item) => item.id !== original.recipientBusinessId,
    )!;
    const id = createId("EffectPotential", "same-measure-other-recipient");
    state.entities.effectPotentials[id] = {
      ...original,
      id,
      seriesId: "SERIES-QUALITY-OTHER-RECIPIENT",
      recipientBusinessId: otherBusiness.id,
      assessmentVersion: 2,
    };
    const current = currentEffectPotentials(
      state,
      stage2Ids.calculatedInitiative,
    );
    expect(
      current.filter(
        (item) => item.effectMeasureCode === original.effectMeasureCode,
      ),
    ).toHaveLength(2);
    expect(current.map((item) => item.recipientBusinessId)).toEqual(
      expect.arrayContaining([original.recipientBusinessId, otherBusiness.id]),
    );
  });

  it("enhetsändring inom samma serie ersätter versionen utan dubbelräkning", () => {
    const state = baseDemoState();
    const original = effectPotentialsByInitiative(
      state,
      stage2Ids.calculatedInitiative,
    ).find((item) => item.category === "QUALITY")!;
    const id = createId("EffectPotential", "unit-revision");
    state.entities.effectPotentials[id] = {
      ...original,
      id,
      unit: "indexpunkter",
      assessmentVersion: 2,
    };
    const series = currentEffectPotentials(
      state,
      stage2Ids.calculatedInitiative,
    ).filter((item) => item.seriesId === original.seriesId);
    expect(series).toHaveLength(1);
    expect(series[0]).toMatchObject({ id, unit: "indexpunkter" });
  });
});
