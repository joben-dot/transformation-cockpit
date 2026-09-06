import { describe, expect, it } from "vitest";
import {
  createId,
  qualificationConfiguration,
  qualificationCriteria,
  type RoleAssignmentId,
} from "../domain";
import { stage2Ids } from "../demo-data/stage2DemoData";
import { baseDemoState } from "../tests/fixtures/baseDemoState";
import { demoReducer } from "./demoReducer";

const meta = (state = baseDemoState(), token = "stage2") => ({
  commandId: createId("Command", token),
  actorRoleAssignmentId: Object.keys(
    state.entities.roleAssignments,
  )[2] as RoleAssignmentId,
  issuedAt: "2026-10-10T08:00:00Z",
});
const calculatedId = createId("PriorityAssessment", "priority-1");

describe("etapp 2 commands", () => {
  it("registrerar en mänsklig acceptans med roll och tid", () => {
    const state = baseDemoState();
    const result = demoReducer(state, {
      ...meta(state),
      commandType: "REVIEW_PRIORITY_ASSESSMENT",
      targetId: calculatedId,
      payload: { rationale: "Granskat underlag." },
    });
    expect(result.success).toBe(true);
    expect(
      result.nextState.entities.priorityAssessments[calculatedId],
    ).toMatchObject({
      status: "ACCEPTED",
      reviewedByRoleAssignmentId: meta(state).actorRoleAssignmentId,
      reviewedByPersonId: Object.values(state.entities.people)[0].id,
      reviewMandateId: createId("Mandate", "mandate-003"),
      reviewedAt: meta(state).issuedAt,
    });
  });
  it("kräver motivering vid åsidosättande", () => {
    const state = baseDemoState();
    const result = demoReducer(state, {
      ...meta(state),
      commandType: "OVERRIDE_PRIORITY_ASSESSMENT",
      targetId: calculatedId,
      payload: { recommendation: "WAIT", rationale: "" },
    });
    expect(result.success).toBe(false);
    expect(result.nextState).toBe(state);
  });
  it("bevarar systemrekommendationen vid mänskligt åsidosättande", () => {
    const state = baseDemoState();
    const result = demoReducer(state, {
      ...meta(state),
      commandType: "OVERRIDE_PRIORITY_ASSESSMENT",
      targetId: calculatedId,
      payload: {
        recommendation: "WAIT",
        rationale: "Mänsklig bedömning av syntetisk kapacitet.",
      },
    });
    expect(
      result.nextState.entities.priorityAssessments[calculatedId],
    ).toMatchObject({
      status: "OVERRIDDEN",
      systemRecommendation: "START",
      previousSystemRecommendation: "START",
      humanRecommendation: "WAIT",
    });
  });
  it("kräver motivering vid avslag", () => {
    const state = baseDemoState();
    const result = demoReducer(state, {
      ...meta(state),
      commandType: "REJECT_PRIORITY_ASSESSMENT",
      targetId: calculatedId,
      payload: { rationale: "" },
    });
    expect(result.success).toBe(false);
  });
  it("tillåter inte AI eller system som mänsklig aktör", () => {
    const state = baseDemoState();
    const result = demoReducer(state, {
      ...meta(state),
      actorRoleAssignmentId: createId("RoleAssignment", "system-ai"),
      commandType: "REVIEW_PRIORITY_ASSESSMENT",
      targetId: calculatedId,
      payload: {},
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors[0].code).toBe("ACTOR_NOT_FOUND");
  });
  it("avvisar en ännu inte giltig rollrelation", () => {
    const state = baseDemoState();
    const actor = meta(state).actorRoleAssignmentId;
    state.entities.roleAssignments[actor].validFrom = "2027-01-01";
    const result = demoReducer(state, {
      ...meta(state),
      commandType: "REVIEW_PRIORITY_ASSESSMENT",
      targetId: calculatedId,
      payload: {},
    });
    expect(result.success).toBe(false);
    expect(result.nextState).toBe(state);
  });
  it("avvisar en utgången rollrelation", () => {
    const state = baseDemoState();
    const actor = meta(state).actorRoleAssignmentId;
    state.entities.roleAssignments[actor].validTo = "2026-01-31";
    const result = demoReducer(state, {
      ...meta(state),
      commandType: "REVIEW_PRIORITY_ASSESSMENT",
      targetId: calculatedId,
      payload: {},
    });
    expect(result.success).toBe(false);
  });
  it("avvisar saknat eller felavgränsat mandat", () => {
    const state = baseDemoState();
    state.entities.mandates[createId("Mandate", "mandate-003")].scope =
      "ANNAT_OMRÅDE";
    const result = demoReducer(state, {
      ...meta(state),
      commandType: "REVIEW_PRIORITY_ASSESSMENT",
      targetId: calculatedId,
      payload: {},
    });
    expect(result.success).toBe(false);
    expect(result.nextState).toBe(state);
  });
  it("avvisar ett utgånget mandat", () => {
    const state = baseDemoState();
    state.entities.mandates[createId("Mandate", "mandate-003")].validTo =
      "2026-01-31";
    const result = demoReducer(state, {
      ...meta(state),
      commandType: "REVIEW_PRIORITY_ASSESSMENT",
      targetId: calculatedId,
      payload: {},
    });
    expect(result.success).toBe(false);
  });
  it("verifierar en inskickad komplettering utan att påverka annat initiativ", () => {
    const state = baseDemoState();
    const before = structuredClone(
      state.entities.completionRequirements[stage2Ids.unassignedRequirement],
    );
    const result = demoReducer(state, {
      ...meta(state),
      commandType: "VERIFY_COMPLETION_REQUIREMENT",
      targetId: stage2Ids.waitingRequirement,
      payload: { resolutionSummary: "Behörigt verifierat." },
    });
    expect(result.success).toBe(true);
    expect(
      result.nextState.entities.completionRequirements[
        stage2Ids.waitingRequirement
      ].status,
    ).toBe("VERIFIED");
    expect(
      result.nextState.entities.completionRequirements[
        stage2Ids.unassignedRequirement
      ],
    ).toEqual(before);
    expect(
      result.nextState.entities.qualificationAssessments[
        createId("QualificationAssessment", "qa-103-7")
      ].status,
    ).toBe("INCOMPLETE");
  });
  it("avvisar NOT_APPLICABLE utan motivering atomärt", () => {
    const state = baseDemoState();
    const criterion = qualificationCriteria[0];
    const result = demoReducer(state, {
      ...meta(state),
      commandType: "UPSERT_QUALIFICATION_ASSESSMENT",
      targetId: createId("QualificationAssessment", "invalid-na"),
      payload: {
        initiativeId: stage2Ids.qualifiedInitiative,
        qualificationArea: criterion.qualificationArea,
        criterionCode: criterion.criterionCode,
        summary: "Ej tillämpligt",
        status: "NOT_APPLICABLE",
        mandatory: true,
        requiresVerification: false,
        evidenceRefs: [],
        assumptions: [],
        assessedAgainstConfigurationVersion: qualificationConfiguration.id,
      },
    });
    expect(result.success).toBe(false);
    expect(result.nextState).toBe(state);
  });
  it("registrerar potential utan att skapa åtagande", () => {
    const state = baseDemoState();
    const id = createId("EffectPotential", "command-potential");
    const result = demoReducer(state, {
      ...meta(state),
      commandType: "RECORD_EFFECT_POTENTIAL",
      targetId: id,
      payload: {
        initiativeId: stage2Ids.qualifiedInitiative,
        recipientScenario: "Fiktivt scenario",
        category: "MONEY",
        effectMeasureCode: "POSSIBLE_OPERATING_COST",
        unit: "SEK/år",
        lowerBound: 10,
        expectedValue: 20,
        upperBound: 30,
        evidenceRefs: ["E-DEMO"],
        assumptions: ["Syntetiskt antagande"],
        uncertainty: "HIGH",
        realizationWindow: "12 månader",
        earliestPossibleEffectDate: "2027-01-01",
        fullPotentialDate: "2027-12-31",
        scope: "FEDERATED_SCENARIO",
        assessmentVersion: 1,
      },
    });
    expect(result.success).toBe(true);
    expect(result.nextState.entities.effectPotentials[id]).toBeDefined();
    expect(result.nextState.entities.effectCommitments).toEqual({});
  });
  it("avvisar monetariserad frigjord tid utan fullständigt antagande", () => {
    const state = baseDemoState();
    const id = createId("EffectPotential", "invalid-monetization");
    const result = demoReducer(state, {
      ...meta(state),
      commandType: "RECORD_EFFECT_POTENTIAL",
      targetId: id,
      payload: {
        initiativeId: stage2Ids.qualifiedInitiative,
        recipientScenario: "Syntetiskt scenario",
        category: "RELEASED_TIME",
        effectMeasureCode: "MONETIZED_RELEASED_TIME",
        unit: "SEK",
        lowerBound: 10,
        expectedValue: 20,
        upperBound: 30,
        evidenceRefs: ["E-DEMO"],
        assumptions: [],
        uncertainty: "HIGH",
        realizationWindow: "12 månader",
        earliestPossibleEffectDate: "2027-01-01",
        fullPotentialDate: "2027-12-31",
        scope: "FEDERATED_SCENARIO",
        assessmentVersion: 1,
      },
    });
    expect(result.success).toBe(false);
    expect(result.nextState).toBe(state);
  });
  it("registrerar lyckad prioriteringshantering i audit", () => {
    const state = baseDemoState();
    const result = demoReducer(state, {
      ...meta(state),
      commandType: "REVIEW_PRIORITY_ASSESSMENT",
      targetId: calculatedId,
      payload: {},
    });
    expect(result.success).toBe(true);
    expect(result.nextState.audit.at(-1)).toMatchObject({
      commandType: "REVIEW_PRIORITY_ASSESSMENT",
      affectedEntityIds: expect.arrayContaining([calculatedId]),
    });
  });
});
