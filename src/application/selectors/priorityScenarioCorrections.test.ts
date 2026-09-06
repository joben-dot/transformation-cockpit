import { describe, expect, it } from "vitest";
import { createId } from "../../domain";
import { stage2Ids } from "../../demo-data/stage2DemoData";
import { baseDemoState } from "../../tests/fixtures/baseDemoState";
import { demoReducer } from "../demoReducer";
import { calculatePriorityAssessment } from "./prioritySelectors";
import { strategicComparison } from "./referenceStorySelectors";

const initiatives = [
  stage2Ids.calculatedInitiative,
  stage2Ids.acceptedInitiative,
  stage2Ids.overriddenInitiative,
];

function scenarioScores(
  state: ReturnType<typeof baseDemoState>,
  criterionCode: string,
) {
  const profile = Object.values(state.entities.steeringProfileVersions).find(
    (item) => item.status === "ACTIVE",
  )!;
  const scenario = {
    ...profile,
    id: createId("SteeringProfileVersion", `test-${criterionCode}`),
    status: "DRAFT" as const,
    weights: Object.fromEntries(
      profile.criteria.map((criterion) => [
        criterion.code,
        criterion.code === criterionCode ? 100 : 0,
      ]),
    ),
  };
  return initiatives
    .map((initiativeId, index) => {
      const source = strategicComparison(state).find(
        (item) => item.initiative.id === initiativeId,
      )!.assessment;
      return calculatePriorityAssessment(state, {
        assessmentId: createId(
          "PriorityAssessment",
          `${criterionCode}-${index}`,
        ),
        initiativeId,
        profile: scenario,
        assessedAt: "2026-10-01T10:00:00Z",
        scores: Object.fromEntries(
          source.criterionAssessments.map((criterion) => [
            criterion.criterionCode,
            {
              score: criterion.score,
              evidenceRefs: criterion.evidenceRefs,
              uncertainty: criterion.uncertainty,
            },
          ]),
        ),
      });
    })
    .sort((a, b) => b.totalScore - a.totalScore);
}

describe("prioriteringsscenarier och underlagsversioner", () => {
  it("effektscenariot ger oberoende beräknad ordning 95, 75, 65", () => {
    const result = scenarioScores(baseDemoState(), "EFFECT");
    expect(result.map((item) => item.totalScore)).toEqual([95, 75, 65]);
    expect(result.map((item) => item.initiativeId)).toEqual([
      stage2Ids.calculatedInitiative,
      stage2Ids.overriddenInitiative,
      stage2Ids.acceptedInitiative,
    ]);
  });

  it("evidensscenariot ändrar ordningen och ger 90, 75, 55", () => {
    const result = scenarioScores(baseDemoState(), "EVIDENCE");
    expect(result.map((item) => item.totalScore)).toEqual([90, 75, 55]);
    expect(result.map((item) => item.initiativeId)).toEqual([
      stage2Ids.acceptedInitiative,
      stage2Ids.calculatedInitiative,
      stage2Ids.overriddenInitiative,
    ]);
  });

  it("ett scenario skapas som utkast utan att byta gällande styrprofil", () => {
    const state = baseDemoState();
    const active = Object.values(state.entities.steeringProfileVersions).find(
      (item) => item.status === "ACTIVE",
    )!;
    const actor = Object.values(state.entities.roleAssignments)[2].id;
    const id = createId("SteeringProfileVersion", "scenario-not-active");
    const result = demoReducer(state, {
      commandId: createId("Command", "scenario-not-active"),
      actorRoleAssignmentId: actor,
      issuedAt: "2026-10-01T10:00:00Z",
      commandType: "CREATE_STEERING_PROFILE_VERSION",
      targetId: id,
      payload: {
        profileName: "Effektscenario",
        versionNumber: 2,
        validFrom: "2026-10-01",
        criteria: active.criteria,
        weights: { EFFECT: 100, EVIDENCE: 0, TIME: 0, QUALITY: 0, CAPACITY: 0 },
        thresholds: active.thresholds,
        weightSumRule: 100,
        demoAssumption: "Ej beslutad – används endast i demo.",
      },
    });
    expect(result.success).toBe(true);
    expect(result.nextState.entities.steeringProfileVersions[id].status).toBe(
      "DRAFT",
    );
    expect(
      Object.values(result.nextState.entities.steeringProfileVersions).find(
        (item) => item.status === "ACTIVE",
      )?.id,
    ).toBe(active.id);
  });

  it("omviktning behåller ursprungsbedömningens exakta potentialversioner", () => {
    const state = baseDemoState();
    const source = strategicComparison(state).find(
      (item) => item.initiative.id === stage2Ids.calculatedInitiative,
    )!;
    const quality = source.latestPotentials.find(
      (item) => item.category === "QUALITY",
    )!;
    const revisedId = createId("EffectPotential", "reweight-newer-potential");
    state.entities.effectPotentials[revisedId] = {
      ...quality,
      id: revisedId,
      expectedValue: 8,
      assessmentVersion: quality.assessmentVersion + 1,
    };
    const scenarioId = createId("SteeringProfileVersion", "reweight-scenario");
    state.entities.steeringProfileVersions[scenarioId] = {
      ...source.profile,
      id: scenarioId,
      profileName: "Omviktningsscenario",
      versionNumber: 2,
      status: "DRAFT",
      weights: { EFFECT: 100, EVIDENCE: 0, TIME: 0, QUALITY: 0, CAPACITY: 0 },
    };
    const targetId = createId("PriorityAssessment", "reweighted-snapshot");
    const result = demoReducer(state, {
      commandId: createId("Command", "reweight-snapshot"),
      actorRoleAssignmentId: Object.values(state.entities.roleAssignments)[2]
        .id,
      issuedAt: "2026-10-02T10:00:00Z",
      commandType: "REWEIGHT_PRIORITY_ASSESSMENT",
      targetId,
      payload: {
        sourcePriorityAssessmentId: source.assessment.id,
        steeringProfileVersionId: scenarioId,
      },
    });
    expect(result.success).toBe(true);
    const reweighted = result.nextState.entities.priorityAssessments[targetId];
    expect(reweighted.effectPotentialIds).toEqual(
      source.assessment.effectPotentialIds,
    );
    expect(reweighted.effectPotentialIds).not.toContain(revisedId);
    const comparison = strategicComparison(result.nextState, scenarioId).find(
      (item) => item.initiative.id === stage2Ids.calculatedInitiative,
    )!;
    expect(comparison.needsReassessment).toBe(true);
  });

  it("historiskt underlag ligger kvar och ny potential markerar ombedömningsbehov", () => {
    const state = baseDemoState();
    const before = strategicComparison(state).find(
      (item) => item.initiative.id === stage2Ids.calculatedInitiative,
    )!;
    const quality = before.latestPotentials.find(
      (item) => item.category === "QUALITY",
    )!;
    const revisedId = createId("EffectPotential", "quality-revised-test");
    state.entities.effectPotentials[revisedId] = {
      ...quality,
      id: revisedId,
      expectedValue: 8,
      assessmentVersion: 2,
    };
    const after = strategicComparison(state).find(
      (item) => item.initiative.id === stage2Ids.calculatedInitiative,
    )!;
    expect(
      after.potentials.find((item) => item.seriesId === quality.seriesId)
        ?.expectedValue,
    ).toBe(7);
    expect(
      after.latestPotentials.find((item) => item.seriesId === quality.seriesId)
        ?.expectedValue,
    ).toBe(8);
    expect(after.needsReassessment).toBe(true);
  });

  it("ny bedömning binder endast den aktuella versionen i varje potentialserie", () => {
    const state = baseDemoState();
    const source = strategicComparison(state).find(
      (item) => item.initiative.id === stage2Ids.calculatedInitiative,
    )!;
    const quality = source.latestPotentials.find(
      (item) => item.category === "QUALITY",
    )!;
    const revisedId = createId("EffectPotential", "quality-current-test");
    state.entities.effectPotentials[revisedId] = {
      ...quality,
      id: revisedId,
      expectedValue: 8,
      assessmentVersion: 2,
    };
    const profile = source.profile;
    const calculated = calculatePriorityAssessment(state, {
      assessmentId: createId("PriorityAssessment", "current-sources"),
      initiativeId: source.initiative.id,
      profile,
      assessedAt: "2026-10-01T10:00:00Z",
      scores: Object.fromEntries(
        source.assessment.criterionAssessments.map((criterion) => [
          criterion.criterionCode,
          {
            score: criterion.score,
            evidenceRefs: criterion.evidenceRefs,
            uncertainty: criterion.uncertainty,
          },
        ]),
      ),
    });
    expect(calculated.effectPotentialIds).toContain(revisedId);
    expect(calculated.effectPotentialIds).not.toContain(quality.id);
    expect(new Set(calculated.effectPotentialIds).size).toBe(
      calculated.effectPotentialIds.length,
    );
  });
});
