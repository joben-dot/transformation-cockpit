import { describe, expect, it } from "vitest";
import {
  qualificationConfiguration,
  createId,
  qualificationAreas,
  qualificationCriteria,
} from "../../domain";
import { demoIds } from "../../demo-data/createDemoData";
import { stage2Ids } from "../../demo-data/stage2DemoData";
import { baseDemoState } from "../../tests/fixtures/baseDemoState";
import {
  deriveQualificationStatus,
  deriveQualificationAreaStatuses,
  isInitiativeQualified,
  qualificationAreasByInitiative,
  qualificationBlockers,
} from "./qualificationSelectors";

describe("kvalificeringshärledning", () => {
  it("definierar exakt sex synliga kvalificeringsområden", () =>
    expect(qualificationAreas).toHaveLength(6));
  it("innehåller samtliga 37 separat identifierbara demonstrationskriterier", () => {
    expect(qualificationCriteria).toHaveLength(37);
    expect(
      new Set(qualificationCriteria.map((item) => item.criterionCode)).size,
    ).toBe(37);
    qualificationCriteria.forEach((criterion) => {
      expect(criterion.name).not.toBe("");
      expect(criterion.helpText).toContain("prioriteringsunderlag");
    });
  });
  it("placerar varje obligatoriskt kriterium i exakt ett giltigt område", () => {
    expect(
      new Set(qualificationCriteria.map((item) => item.criterionCode)).size,
    ).toBe(qualificationCriteria.length);
    qualificationCriteria.forEach((item) =>
      expect(qualificationAreas).toContain(item.qualificationArea),
    );
  });
  it("härleder rätt obligatoriskt antal för vart och ett av de sex områdena", () => {
    const statuses = deriveQualificationAreaStatuses(
      baseDemoState(),
      stage2Ids.qualifiedInitiative,
    );
    expect(statuses.map((item) => item.totalMandatoryCount)).toEqual([
      5, 7, 7, 6, 6, 6,
    ]);
    expect(statuses.every((item) => item.status === "SATISFIED")).toBe(true);
  });
  it("härleder totalstatus utan lagrat totalfält", () => {
    const state = baseDemoState();
    expect(
      state.entities.initiatives[stage2Ids.qualifiedInitiative],
    ).not.toHaveProperty("qualificationStatus");
    expect(
      deriveQualificationStatus(state, stage2Ids.qualifiedInitiative).status,
    ).toBe("QUALIFIED");
  });
  it("låter varje obligatorisk punkt påverka härledd kvalificering", () => {
    qualificationCriteria.forEach((criterion) => {
      const state = baseDemoState();
      const assessment = Object.values(
        state.entities.qualificationAssessments,
      ).find(
        (item) =>
          item.initiativeId === stage2Ids.qualifiedInitiative &&
          item.criterionCode === criterion.criterionCode,
      )!;
      assessment.status = "INCOMPLETE";
      expect(isInitiativeQualified(state, stage2Ids.qualifiedInitiative)).toBe(
        false,
      );
    });
  });
  it("kan inte dölja en ofullständig punkt bakom övriga uppfyllda punkter", () => {
    const state = baseDemoState();
    const assessments = Object.values(
      state.entities.qualificationAssessments,
    ).filter((item) => item.initiativeId === stage2Ids.qualifiedInitiative);
    assessments[0].status = "NOT_SATISFIED";
    expect(
      assessments.slice(1).every((item) => item.status === "SATISFIED"),
    ).toBe(true);
    expect(
      deriveQualificationStatus(state, stage2Ids.qualifiedInitiative).status,
    ).toBe("INCOMPLETE");
  });
  it("spårar den använda konfigurationsversionen", () => {
    const state = baseDemoState();
    const assessments = Object.values(
      state.entities.qualificationAssessments,
    ).filter((item) => item.initiativeId === stage2Ids.qualifiedInitiative);
    expect(
      assessments.every(
        (item) =>
          item.assessedAgainstConfigurationVersion ===
          qualificationConfiguration.id,
      ),
    ).toBe(true);
  });
  it("godtar ett beskrivet men ännu inte genomfört beroende som förhandsbedömning", () => {
    const state = baseDemoState();
    const assessment = Object.values(
      state.entities.qualificationAssessments,
    ).find(
      (item) =>
        item.initiativeId === stage2Ids.qualifiedInitiative &&
        item.criterionCode === "KNOWN_DEPENDENCIES",
    )!;
    assessment.summary =
      "En ännu inte byggd fiktiv dataplattform är känd och beskriven.";
    assessment.status = "SATISFIED";
    expect(isInitiativeQualified(state, stage2Ids.qualifiedInitiative)).toBe(
      true,
    );
  });
  it("låter ett krav endast inför start vara frikopplat från kvalificering", () => {
    const state = baseDemoState();
    const id = createId("CompletionRequirement", "start-only");
    state.entities.completionRequirements[id] = {
      id,
      initiativeId: stage2Ids.qualifiedInitiative,
      missingItem: "Senare startunderlag",
      reasonRequired: "Behövs först inför start.",
      blocks: ["START_DECISION"],
      status: "OPEN",
      submittedEvidenceRefs: [],
      createdAt: "2026-10-01T08:00:00Z",
    };
    expect(isInitiativeQualified(state, stage2Ids.qualifiedInitiative)).toBe(
      true,
    );
  });
  it("låter öppet blockerande krav hindra kvalificering", () =>
    expect(isInitiativeQualified(baseDemoState(), demoIds.mainInitiative)).toBe(
      false,
    ));
  it("redovisar saknad ansvarig som blockerare", () =>
    expect(
      qualificationBlockers(baseDemoState(), demoIds.mainInitiative)[0].status,
    ).toBe("RESPONSIBILITY_UNASSIGNED"));
  it("redovisar saknad deadline som blockerande", () =>
    expect(
      qualificationBlockers(baseDemoState(), demoIds.mainInitiative)[0]
        .deadline,
    ).toBeUndefined());
  it("underkänner NOT_APPLICABLE utan motivering", () => {
    const state = baseDemoState();
    const item = Object.values(state.entities.qualificationAssessments).find(
      (x) => x.initiativeId === stage2Ids.qualifiedInitiative,
    )!;
    item.status = "NOT_APPLICABLE";
    item.notApplicableRationale = undefined;
    expect(isInitiativeQualified(state, stage2Ids.qualifiedInitiative)).toBe(
      false,
    );
  });
  it("underkänner verifieringskrävande NOT_APPLICABLE utan verifierare", () => {
    const state = baseDemoState();
    const item = Object.values(state.entities.qualificationAssessments).find(
      (x) =>
        x.initiativeId === stage2Ids.qualifiedInitiative &&
        x.requiresVerification,
    )!;
    Object.assign(item, {
      status: "NOT_APPLICABLE",
      notApplicableRationale: "Skriftlig syntetisk motivering",
      verifiedByRoleAssignmentId: undefined,
      verifiedAt: undefined,
    });
    expect(isInitiativeQualified(state, stage2Ids.qualifiedInitiative)).toBe(
      false,
    );
  });
  it("låter verifierad komplettering undanröja rätt blockerare", () => {
    const state = baseDemoState();
    state.entities.completionRequirements[
      stage2Ids.unassignedRequirement
    ].status = "VERIFIED";
    expect(qualificationBlockers(state, demoIds.mainInitiative)).toEqual([]);
  });
  it("isolerar ett initiativs kompletteringar från ett annat", () => {
    const state = baseDemoState();
    expect(qualificationBlockers(state, stage2Ids.qualifiedInitiative)).toEqual(
      [],
    );
    expect(qualificationBlockers(state, demoIds.mainInitiative)).toHaveLength(
      1,
    );
    expect(
      qualificationAreasByInitiative(
        state,
        createId("Initiative", "missing"),
      ).every((x) => x.assessments.length === 0),
    ).toBe(true);
  });
});
