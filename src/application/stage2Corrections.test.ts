import { describe, expect, it } from "vitest";
import {
  createId,
  qualificationConfiguration,
  qualificationCriteria,
} from "../domain";
import { stage2Ids } from "../demo-data/stage2DemoData";
import { baseDemoState } from "../tests/fixtures/baseDemoState";
import { demoReducer } from "./demoReducer";

const metadata = (state: ReturnType<typeof baseDemoState>, token: string) => ({
  commandId: createId("Command", token),
  actorRoleAssignmentId: Object.values(state.entities.roleAssignments)[0].id,
  issuedAt: "2026-10-20T08:00:00Z",
});

function potentialCommand(
  state: ReturnType<typeof baseDemoState>,
  token: string,
  category: "MONEY" | "RELEASED_TIME",
) {
  return {
    ...metadata(state, token),
    commandType: "RECORD_EFFECT_POTENTIAL" as const,
    targetId: createId("EffectPotential", token),
    payload: {
      initiativeId: stage2Ids.qualifiedInitiative,
      recipientBusinessId: Object.values(state.entities.businesses)[0].id,
      category,
      effectMeasureCode:
        category === "MONEY" ? "OPERATING_COST" : "RELEASED_HOURS",
      unit: category === "MONEY" ? "SEK/år" : "timmar/år",
      lowerBound: category === "MONEY" ? 100_000 : 300,
      expectedValue: category === "MONEY" ? 150_000 : 450,
      upperBound: category === "MONEY" ? 200_000 : 600,
      evidenceRefs: [`EVIDENCE-${token}`],
      assumptions: [`ASSUMPTION-${token}`],
      uncertainty: category === "MONEY" ? ("HIGH" as const) : ("LOW" as const),
      realizationWindow: category === "MONEY" ? "2027" : "2028–2029",
      earliestPossibleEffectDate:
        category === "MONEY" ? "2027-01-01" : "2028-02-01",
      fullPotentialDate: category === "MONEY" ? "2027-12-31" : "2029-06-30",
      scope: "LOCAL" as const,
      assessedByRoleAssignmentIds: [
        metadata(state, token).actorRoleAssignmentId,
      ],
      assessmentVersion: 1,
    },
  };
}

describe("riktade etapp 2-rättningar", () => {
  it("sparar bara valt kriterium och skapar inte specialistverifiering", () => {
    const state = baseDemoState();
    const criterion = qualificationCriteria.find(
      (item) => item.requiresVerification,
    )!;
    const other = qualificationCriteria.find(
      (item) => item.criterionCode !== criterion.criterionCode,
    )!;
    const otherBefore = Object.values(
      state.entities.qualificationAssessments,
    ).find(
      (item) =>
        item.initiativeId === stage2Ids.waitingInitiative &&
        item.criterionCode === other.criterionCode,
    );
    const prior = Object.values(state.entities.qualificationAssessments).find(
      (item) =>
        item.initiativeId === stage2Ids.waitingInitiative &&
        item.criterionCode === criterion.criterionCode,
    );
    const id =
      prior?.id ?? createId("QualificationAssessment", "one-criterion-only");
    const result = demoReducer(state, {
      ...metadata(state, "one-criterion"),
      commandType: "UPSERT_QUALIFICATION_ASSESSMENT",
      targetId: id,
      payload: {
        initiativeId: stage2Ids.waitingInitiative,
        qualificationArea: criterion.qualificationArea,
        criterionCode: criterion.criterionCode,
        summary: "Individuellt syntetiskt underlag",
        status: "SATISFIED",
        mandatory: criterion.mandatory,
        requiresVerification: criterion.requiresVerification,
        evidenceRefs: ["EVIDENCE-ONE"],
        assumptions: ["ASSUMPTION-ONE"],
        assessedAgainstConfigurationVersion: qualificationConfiguration.id,
      },
    });
    expect(
      result.success,
      !result.success ? JSON.stringify(result.errors) : "",
    ).toBe(true);
    expect(
      result.nextState.entities.qualificationAssessments[id].verifiedAt,
    ).toBeUndefined();
    expect(
      Object.values(result.nextState.entities.qualificationAssessments).find(
        (item) => item.id === otherBefore?.id,
      ),
    ).toEqual(otherBefore);
  });

  it("kräver separat giltig specialistroll för verifiering och är atomär vid fel", () => {
    const state = baseDemoState();
    const assessment = Object.values(
      state.entities.qualificationAssessments,
    ).find((item) => item.requiresVerification && item.status === "SATISFIED")!;
    const nonSpecialist = Object.values(state.entities.roleAssignments).find(
      (assignment) =>
        state.entities.roleDefinitions[assignment.roleDefinitionId].roleKind !==
        "SPECIALIST",
    )!.id;
    delete assessment.verifiedAt;
    delete assessment.verifiedByRoleAssignmentId;
    const failed = demoReducer(state, {
      ...metadata(state, "bad-verifier"),
      actorRoleAssignmentId: nonSpecialist,
      commandType: "VERIFY_QUALIFICATION_ASSESSMENT",
      targetId: assessment.id,
    });
    expect(failed.success).toBe(false);
    expect(failed.nextState).toBe(state);
    const specialist = Object.values(state.entities.roleAssignments).find(
      (assignment) =>
        state.entities.roleDefinitions[assignment.roleDefinitionId].roleKind ===
        "SPECIALIST",
    )!.id;
    const passed = demoReducer(state, {
      ...metadata(state, "good-verifier"),
      actorRoleAssignmentId: specialist,
      commandType: "VERIFY_QUALIFICATION_ASSESSMENT",
      targetId: assessment.id,
    });
    expect(passed.success).toBe(true);
    expect(
      passed.nextState.entities.qualificationAssessments[assessment.id]
        .verifiedByRoleAssignmentId,
    ).toBe(specialist);
  });

  it("förhindrar giltig prioritering utan effektpotential", () => {
    const state = baseDemoState();
    for (const item of Object.values(state.entities.effectPotentials)) {
      if (item.initiativeId === stage2Ids.qualifiedInitiative) {
        delete state.entities.effectPotentials[item.id];
      }
    }
    const profile = Object.values(state.entities.steeringProfileVersions).find(
      (item) => item.status === "ACTIVE",
    )!;
    const result = demoReducer(state, {
      ...metadata(state, "priority-without-potential"),
      commandType: "CALCULATE_PRIORITY_ASSESSMENT",
      targetId: createId("PriorityAssessment", "without-potential"),
      payload: {
        initiativeId: stage2Ids.qualifiedInitiative,
        steeringProfileVersionId: profile.id,
        scores: Object.fromEntries(
          profile.criteria.map((criterion) => [
            criterion.code,
            { score: 80, evidenceRefs: ["E"], uncertainty: "MEDIUM" as const },
          ]),
        ),
      },
    });
    expect(result.success).toBe(false);
    expect(result.nextState).toBe(state);
    if (!result.success)
      expect(result.errors[0].description).toContain("effektpotential");
  });

  it("bevarar två skilda effektkategorier och exakt angivna tidsfönster", () => {
    let state = baseDemoState();
    const money = demoReducer(
      state,
      potentialCommand(state, "money-exact", "MONEY"),
    );
    expect(money.success).toBe(true);
    state = money.nextState;
    const time = demoReducer(
      state,
      potentialCommand(state, "time-exact", "RELEASED_TIME"),
    );
    expect(time.success).toBe(true);
    expect(
      time.nextState.entities.effectPotentials[
        createId("EffectPotential", "money-exact")
      ],
    ).toMatchObject({
      category: "MONEY",
      expectedValue: 150_000,
      realizationWindow: "2027",
    });
    expect(
      time.nextState.entities.effectPotentials[
        createId("EffectPotential", "time-exact")
      ],
    ).toMatchObject({
      category: "RELEASED_TIME",
      expectedValue: 450,
      realizationWindow: "2028–2029",
    });
  });

  it("låser prioriteringsunderlagets potential- och kvalificeringsreferenser", () => {
    const state = baseDemoState();
    const assessment = Object.values(state.entities.priorityAssessments).find(
      (item) => item.initiativeId === stage2Ids.calculatedInitiative,
    )!;
    const before = structuredClone(assessment);
    state.entities.effectPotentials[
      assessment.effectPotentialIds[0]
    ].expectedValue += 999;
    expect(assessment.effectPotentialIds).toEqual(before.effectPotentialIds);
    expect(assessment.qualificationAssessmentIds).toEqual(
      before.qualificationAssessmentIds,
    );
  });
});
