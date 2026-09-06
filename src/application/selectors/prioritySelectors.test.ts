import { describe, expect, it } from "vitest";
import { createId, type RoleAssignmentId } from "../../domain";
import { demoIds } from "../../demo-data/createDemoData";
import { stage2Ids } from "../../demo-data/stage2DemoData";
import { baseDemoState } from "../../tests/fixtures/baseDemoState";
import {
  activeSteeringProfile,
  calculatePriorityAssessment,
  initiativesEligibleForPrioritization,
  priorityContributionByCriterion,
  prioritizedInitiatives,
  validateSteeringProfile,
} from "./prioritySelectors";
import { demoReducer } from "../demoReducer";

const stateAndProfile = () => {
  const state = baseDemoState();
  return { state, profile: activeSteeringProfile(state)! };
};
const scores = (value = 80) => ({
  EFFECT: {
    score: value,
    evidenceRefs: ["E-EFFECT"],
    uncertainty: "MEDIUM" as const,
  },
  EVIDENCE: {
    score: value,
    evidenceRefs: ["E-EVIDENCE"],
    uncertainty: "LOW" as const,
  },
  TIME: {
    score: value,
    evidenceRefs: ["E-TIME"],
    uncertainty: "MEDIUM" as const,
  },
  QUALITY: {
    score: value,
    evidenceRefs: ["E-QUALITY"],
    uncertainty: "LOW" as const,
  },
  CAPACITY: {
    score: value,
    evidenceRefs: ["E-CAPACITY"],
    uncertainty: "HIGH" as const,
  },
});
const calculate = (
  initiativeId = stage2Ids.qualifiedInitiative,
  value = 80,
) => {
  const { state, profile } = stateAndProfile();
  return calculatePriorityAssessment(state, {
    assessmentId: createId("PriorityAssessment", "test"),
    initiativeId,
    profile,
    scores: scores(value),
    assessedAt: "2026-10-01T08:00:00Z",
  });
};
const meta = (state = baseDemoState()) => ({
  commandId: createId("Command", "priority-command"),
  actorRoleAssignmentId: Object.keys(
    state.entities.roleAssignments,
  )[0] as RoleAssignmentId,
  issuedAt: "2026-10-02T08:00:00Z",
});

describe("styrprofil", () => {
  it("accepterar den giltiga demonstrationsprofilen", () =>
    expect(validateSteeringProfile(stateAndProfile().profile).valid).toBe(
      true,
    ));
  it("avvisar ogiltig viktsumma", () => {
    const profile = structuredClone(stateAndProfile().profile);
    profile.weights.EFFECT = 34;
    expect(validateSteeringProfile(profile).valid).toBe(false);
  });
  it("låter historisk bedömning behålla använd profilversion", () =>
    expect(calculate().steeringProfileVersionId).toBe(
      stateAndProfile().profile.id,
    ));
  it("aktiverar ny profil utan att skriva över den tidigare versionen", () => {
    const state = baseDemoState();
    const old = activeSteeringProfile(state)!;
    const {
      id: _oldId,
      createdAt: _oldCreatedAt,
      status: _oldStatus,
      ...profileConfiguration
    } = old;
    expect([_oldId, _oldCreatedAt, _oldStatus]).toHaveLength(3);
    const id = createId("SteeringProfileVersion", "steering-002");
    const created = demoReducer(state, {
      ...meta(state),
      commandType: "CREATE_STEERING_PROFILE_VERSION",
      targetId: id,
      payload: {
        ...profileConfiguration,
        profileName: "Ny demoprofil",
        versionNumber: 2,
        validFrom: "2027-01-01",
        demoAssumption: "Ej beslutad – används endast i demo.",
      },
    });
    expect(created.success).toBe(true);
    const activated = demoReducer(created.nextState, {
      ...meta(created.nextState),
      commandId: createId("Command", "activate-profile"),
      commandType: "ACTIVATE_STEERING_PROFILE_VERSION",
      targetId: id,
    });
    expect(
      activated.nextState.entities.steeringProfileVersions[old.id].status,
    ).toBe("RETIRED");
    expect(
      activated.nextState.entities.steeringProfileVersions[id].status,
    ).toBe("ACTIVE");
  });
  it("märker demonstrationsprofilen som ej beslutad", () =>
    expect(stateAndProfile().profile.demoAssumption).toBe(
      "Ej beslutad – används endast i demo.",
    ));
});

describe("transparent prioritering", () => {
  it("gör okvalificerat initiativ icke prioriteringsbart", () =>
    expect(calculate(demoIds.mainInitiative).systemRecommendation).toBe(
      "NOT_ELIGIBLE",
    ));
  it("beräknar kvalificerat initiativ reproducerbart", () =>
    expect(calculate()).toEqual(calculate()));
  it("låter kriteriebidragen summera till totalpoängen", () => {
    const a = calculate();
    expect(a.criterionAssessments.reduce((s, x) => s + x.contribution, 0)).toBe(
      a.totalScore,
    );
  });
  it("låter ett öppet PRIORITIZATION-krav blockera prioriteringsbarhet", () => {
    const { state, profile } = stateAndProfile();
    const id = createId("CompletionRequirement", "priority-only");
    state.entities.completionRequirements[id] = {
      id,
      initiativeId: stage2Ids.qualifiedInitiative,
      missingItem: "Kompletterande prioriteringsevidens",
      reasonRequired: "Behövs för prioriteringsunderlaget.",
      blocks: ["PRIORITIZATION"],
      status: "OPEN",
      submittedEvidenceRefs: [],
      createdAt: "2026-10-01T08:00:00Z",
    };
    const result = calculatePriorityAssessment(state, {
      assessmentId: createId("PriorityAssessment", "blocked"),
      initiativeId: stage2Ids.qualifiedInitiative,
      profile,
      scores: scores(),
      assessedAt: "2026-10-01T09:00:00Z",
    });
    expect(result.systemRecommendation).toBe("NOT_ELIGIBLE");
    expect(result.humanRationale).toContain("1 kompletteringskrav");
  });
  it("påverkas inte av initiativtagarens identitet", () => {
    const { state, profile } = stateAndProfile();
    const first = calculatePriorityAssessment(state, {
      assessmentId: createId("PriorityAssessment", "a"),
      initiativeId: stage2Ids.qualifiedInitiative,
      profile,
      scores: scores(),
      assessedAt: "2026-01-01",
    });
    state.entities.challenges[
      state.entities.initiatives[stage2Ids.qualifiedInitiative].challengeId
    ].initiatorRoleAssignmentId = Object.values(
      state.entities.roleAssignments,
    )[1].id;
    const second = calculatePriorityAssessment(state, {
      assessmentId: createId("PriorityAssessment", "b"),
      initiativeId: stage2Ids.qualifiedInitiative,
      profile,
      scores: scores(),
      assessedAt: "2026-01-01",
    });
    expect(second.totalScore).toBe(first.totalScore);
  });
  it("ger ingen dold bonus för fler deltagare", () => {
    const { state, profile } = stateAndProfile();
    const before = calculatePriorityAssessment(state, {
      assessmentId: createId("PriorityAssessment", "a"),
      initiativeId: stage2Ids.qualifiedInitiative,
      profile,
      scores: scores(),
      assessedAt: "2026-01-01",
    });
    state.entities.participations[createId("Participation", "bonus-check")] = {
      ...Object.values(state.entities.participations)[0],
      id: createId("Participation", "bonus-check"),
      initiativeId: stage2Ids.qualifiedInitiative,
    };
    const after = calculatePriorityAssessment(state, {
      assessmentId: createId("PriorityAssessment", "b"),
      initiativeId: stage2Ids.qualifiedInitiative,
      profile,
      scores: scores(),
      assessedAt: "2026-01-01",
    });
    expect(after.totalScore).toBe(before.totalScore);
  });
  it("bär med evidens och osäkerhet", () =>
    expect(calculate()).toMatchObject({
      evidenceSummary: "5 källreferenser",
      uncertaintySummary: expect.stringContaining("Hög"),
    }));
  it("skapar inte genomförandeordning", () =>
    expect(calculate()).not.toHaveProperty("executionOrder"));
  it("returnerar spårbara bidrag per kriterium", () =>
    expect(priorityContributionByCriterion(calculate())[0]).toMatchObject({
      criterionCode: "EFFECT",
      sourceRefs: ["E-EFFECT"],
    }));
  it("listar endast kvalificerade initiativ som valbara", () =>
    expect(
      initiativesEligibleForPrioritization(baseDemoState()).map((x) => x.id),
    ).not.toContain(demoIds.mainInitiative));
  it("rangordnar befintliga underlag utan att mutera dem", () => {
    const state = baseDemoState();
    const before = structuredClone(state.entities.priorityAssessments);
    expect(prioritizedInitiatives(state)[0].totalScore).toBeGreaterThanOrEqual(
      prioritizedInitiatives(state).at(-1)!.totalScore,
    );
    expect(state.entities.priorityAssessments).toEqual(before);
  });
});
