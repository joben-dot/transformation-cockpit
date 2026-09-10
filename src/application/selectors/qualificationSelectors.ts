import {
  qualificationAreas,
  type InitiativeId,
  type QualificationArea,
} from "../../domain";
import type { DemoState } from "../demoState";

export const qualificationAssessmentsByInitiative = (
  state: DemoState,
  initiativeId: InitiativeId,
) =>
  Object.values(state.entities.qualificationAssessments).filter(
    (item) => item.initiativeId === initiativeId,
  );
export const activeQualificationConfiguration = (state: DemoState) =>
  Object.values(state.entities.qualificationConfigurations).find(
    (configuration) => configuration.status === "ACTIVE",
  );
export const completionRequirementsByInitiative = (
  state: DemoState,
  initiativeId: InitiativeId,
) =>
  Object.values(state.entities.completionRequirements).filter(
    (item) => item.initiativeId === initiativeId || item.challengeId === state.entities.initiatives[initiativeId]?.challengeId,
  );
export const qualificationBlockers = (
  state: DemoState,
  initiativeId: InitiativeId,
) =>
  completionRequirementsByInitiative(state, initiativeId).filter(
    (item) =>
      item.blocks.includes("QUALIFICATION") &&
      !["VERIFIED", "NOT_APPLICABLE"].includes(item.status),
  );
export const completionBlockersForStep = (
  state: DemoState,
  initiativeId: InitiativeId,
  step: "QUALIFICATION" | "PRIORITIZATION" | "START_DECISION",
) =>
  completionRequirementsByInitiative(state, initiativeId).filter(
    (item) =>
      item.blocks.includes(step) &&
      !["VERIFIED", "NOT_APPLICABLE"].includes(item.status),
  );

export const isQualificationAssessmentValid = (
  item: ReturnType<typeof qualificationAssessmentsByInitiative>[number],
) => {
  const verifiedWhenRequired =
    !item.requiresVerification ||
    Boolean(item.verifiedByRoleAssignmentId && item.verifiedAt);
  if (item.status === "SATISFIED") return verifiedWhenRequired;
  return (
    item.status === "NOT_APPLICABLE" &&
    Boolean(item.notApplicableRationale?.trim()) &&
    verifiedWhenRequired
  );
};

export function deriveQualificationStatus(
  state: DemoState,
  initiativeId: InitiativeId,
) {
  const assessments = qualificationAssessmentsByInitiative(state, initiativeId);
  const criteria = activeQualificationConfiguration(state)?.criteria ?? [];
  const byCode = new Map(assessments.map((item) => [item.criterionCode, item]));
  const missingCriterionCodes = criteria
    .filter(
      (item) =>
        item.mandatory &&
        (!byCode.has(item.criterionCode) ||
          !isQualificationAssessmentValid(byCode.get(item.criterionCode)!)),
    )
    .map((item) => item.criterionCode);
  const blockers = qualificationBlockers(state, initiativeId);
  return {
    status:
      missingCriterionCodes.length || blockers.length
        ? ("INCOMPLETE" as const)
        : ("QUALIFIED" as const),
    missingCriterionCodes,
    blockerIds: blockers.map((item) => item.id),
    sourceRefs: [
      ...assessments.map((item) => item.id),
      ...blockers.map((item) => item.id),
    ],
  };
}
export const isInitiativeQualified = (
  state: DemoState,
  initiativeId: InitiativeId,
) => deriveQualificationStatus(state, initiativeId).status === "QUALIFIED";
export const qualificationAreasByInitiative = (
  state: DemoState,
  initiativeId: InitiativeId,
) => {
  const assessments = qualificationAssessmentsByInitiative(state, initiativeId);
  return qualificationAreas.map((area) => ({
    area,
    assessments: assessments.filter((item) => item.qualificationArea === area),
    sourceRefs: assessments
      .filter((item) => item.qualificationArea === area)
      .map((item) => item.id),
  }));
};

export function deriveQualificationAreaStatuses(
  state: DemoState,
  initiativeId: InitiativeId,
) {
  const assessments = qualificationAssessmentsByInitiative(state, initiativeId);
  const configuredCriteria =
    activeQualificationConfiguration(state)?.criteria ?? [];
  const blockers = qualificationBlockers(state, initiativeId);
  const byCode = new Map(assessments.map((item) => [item.criterionCode, item]));
  return qualificationAreas.map((area) => {
    const criteria = configuredCriteria.filter(
      (criterion) =>
        criterion.qualificationArea === area && criterion.mandatory,
    );
    const invalidCriterionCodes = criteria
      .filter((criterion) => {
        const assessment = byCode.get(criterion.criterionCode);
        return !assessment || !isQualificationAssessmentValid(assessment);
      })
      .map((criterion) => criterion.criterionCode);
    const assessmentIdsInArea = new Set(
      assessments
        .filter((assessment) => assessment.qualificationArea === area)
        .map((assessment) => assessment.id),
    );
    const blockedCriterionCodes = blockers
      .filter(
        (blocker) =>
          blocker.qualificationAssessmentId &&
          assessmentIdsInArea.has(blocker.qualificationAssessmentId),
      )
      .flatMap((blocker) => {
        const assessment = blocker.qualificationAssessmentId
          ? state.entities.qualificationAssessments[
              blocker.qualificationAssessmentId
            ]
          : undefined;
        return assessment ? [assessment.criterionCode] : [];
      });
    const remainingCriterionCodes = [
      ...new Set([...invalidCriterionCodes, ...blockedCriterionCodes]),
    ];
    return {
      area,
      satisfiedMandatoryCount: criteria.length - remainingCriterionCodes.length,
      totalMandatoryCount: criteria.length,
      status: remainingCriterionCodes.length
        ? ("INCOMPLETE" as const)
        : ("SATISFIED" as const),
      remainingCriterionCodes,
      verificationCriterionCodes: criteria
        .filter((criterion) => criterion.requiresVerification)
        .map((criterion) => criterion.criterionCode),
      sourceRefs: criteria.flatMap(
        (criterion) => byCode.get(criterion.criterionCode)?.id ?? [],
      ),
    };
  });
}

export function deriveNextCriticalStep(
  state: DemoState,
  initiativeId: InitiativeId,
) {
  const blockers = qualificationBlockers(state, initiativeId);
  const unassigned = blockers.find((item) => !item.responsibleRoleAssignmentId);
  if (unassigned)
    return {
      label: "Tilldela kompletteringsansvarig",
      sourceRefs: [unassigned.id],
    };
  const undated = blockers.find((item) => !item.deadline);
  if (undated)
    return {
      label: "Sätt deadline för komplettering",
      sourceRefs: [undated.id],
    };
  if (blockers.length)
    return {
      label: blockers.some(item=>item.status!=="SUBMITTED")?"Komplettera underlaget":"Verifiera inskickat underlag",
      sourceRefs: blockers.map((item) => item.id),
    };
  if (!isInitiativeQualified(state, initiativeId))
    return {
      label: "Slutför kvalificeringsbedömning",
      sourceRefs: deriveQualificationStatus(state, initiativeId).sourceRefs,
    };
  return {
    label: "Beräkna eller granska prioriteringsunderlag",
    sourceRefs: [initiativeId],
  };
}
export const qualificationAreaLabels: Record<QualificationArea, string> = {
  STRATEGIC_RELEVANCE: "Strategisk relevans och utmaning",
  EFFECT_POTENTIAL: "Effektpotential och evidens",
  FEASIBILITY: "Genomförbarhet och förutsättningar",
  ECONOMY_CAPACITY: "Ekonomi och kapacitet",
  QUALITY_LEGAL_SECURITY: "Kvalitet, juridik och informationssäkerhet",
  BUSINESS_CHANGE: "Verksamhetsförändring och mottagande",
};
