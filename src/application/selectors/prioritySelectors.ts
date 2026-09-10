import type {
  InitiativeId,
  PriorityAssessment,
  PriorityAssessmentId,
  PriorityRecommendation,
  SteeringProfileVersion,
  SteeringProfileVersionId,
} from "../../domain";
import type { DemoState } from "../demoState";
import {
  isInitiativeQualified,
  completionBlockersForStep,
} from "./qualificationSelectors";
import { currentEffectPotentials } from "./effectPotentialSelectors";

export function validateSteeringProfile(profile: SteeringProfileVersion) {
  const errors: string[] = [];
  const codes = new Set(profile.criteria.map((item) => item.code));
  profile.criteria
    .filter((item) => item.required)
    .forEach((item) => {
      if (profile.weights[item.code] === undefined)
        errors.push(`Obligatoriskt kriterium saknar vikt: ${item.name}.`);
    });
  Object.entries(profile.weights).forEach(([code, weight]) => {
    if (!codes.has(code)) errors.push(`Vikt saknar kriterium: ${code}.`);
    if (!Number.isFinite(weight) || weight < 0)
      errors.push(`Ogiltig vikt: ${code}.`);
  });
  if (
    Object.values(profile.weights).reduce((sum, value) => sum + value, 0) !==
    profile.weightSumRule
  )
    errors.push(`Viktsumman ska vara ${profile.weightSumRule}.`);
  return { valid: errors.length === 0, errors, sourceRefs: [profile.id] };
}
export const activeSteeringProfile = (state: DemoState) =>
  Object.values(state.entities.steeringProfileVersions).find(
    (item) => item.status === "ACTIVE",
  );
export const priorityPosition = (assessment?: PriorityAssessment) =>
  assessment && ["ACCEPTED", "OVERRIDDEN"].includes(assessment.status)
    ? assessment.humanRecommendation ?? (assessment.status === "ACCEPTED" ? assessment.systemRecommendation : undefined)
    : undefined;
export const latestPriorityAssessment = (state: DemoState, id: InitiativeId, profileId?: SteeringProfileVersionId) =>
  Object.values(state.entities.priorityAssessments).filter(a=>a.initiativeId===id&&(!profileId||a.steeringProfileVersionId===profileId))
    .reverse().sort((a,b)=>b.assessedAt.localeCompare(a.assessedAt))[0];
export const priorityPositionLabels = {START:"Gå vidare till startprövning",INVESTIGATE:"Utred vidare",WAIT:"Avvakta",STOP:"Avstå",NOT_ELIGIBLE:"Underlag saknas"};
export interface PriorityCalculationInput {
  assessmentId: PriorityAssessmentId;
  initiativeId: InitiativeId;
  profile: SteeringProfileVersion;
  scores: Record<
    string,
    {
      score: number;
      evidenceRefs: string[];
      uncertainty: "LOW" | "MEDIUM" | "HIGH";
    }
  >;
  assessedAt: string;
}
export function priorityEligibilityBlockers(
  state: DemoState,
  initiativeId: InitiativeId,
  profile: SteeringProfileVersion,
) {
  const blockers: Array<{
    code: string;
    description: string;
    sourceRefs: string[];
  }> = completionBlockersForStep(state, initiativeId, "PRIORITIZATION").map(
    (item) => ({
      code: "COMPLETION_REQUIRED",
      description: item.missingItem,
      sourceRefs: [item.id],
    }),
  );
  if (!isInitiativeQualified(state, initiativeId)) {
    blockers.push({
      code: "QUALIFICATION_INCOMPLETE",
      description: "Kvalificeringen måste slutföras före prioritering.",
      sourceRefs: [initiativeId],
    });
  }
  const potentials = Object.values(state.entities.effectPotentials).filter(
    (item) => item.initiativeId === initiativeId,
  );
  const effectCriterionRequired = profile.criteria.some(
    (criterion) => criterion.required && criterion.code === "EFFECT",
  );
  if (effectCriterionRequired && potentials.length === 0) {
    blockers.push({
      code: "EFFECT_POTENTIAL_MISSING",
      description:
        "Relevant bedömd effektpotential måste registreras före prioritering.",
      sourceRefs: [profile.id, initiativeId],
    });
  }
  return blockers;
}
export function calculatePriorityAssessment(
  state: DemoState,
  input: PriorityCalculationInput,
): PriorityAssessment {
  const blockers = priorityEligibilityBlockers(
    state,
    input.initiativeId,
    input.profile,
  );
  const eligible = blockers.length === 0;
  const potentials = currentEffectPotentials(state, input.initiativeId);
  const qualificationAssessments = Object.values(
    state.entities.qualificationAssessments,
  ).filter((item) => item.initiativeId === input.initiativeId);
  const criterionAssessments = input.profile.criteria.map((criterion) => {
    const value = input.scores[criterion.code] ?? {
      score: 0,
      evidenceRefs: [],
      uncertainty: "HIGH" as const,
    };
    return {
      criterionCode: criterion.code,
      score: value.score,
      contribution: eligible
        ? Math.round(
            value.score * (input.profile.weights[criterion.code] ?? 0),
          ) / input.profile.weightSumRule
        : 0,
      evidenceRefs: value.evidenceRefs,
      uncertainty: value.uncertainty,
    };
  });
  const totalScore = Math.round(
    criterionAssessments.reduce((sum, item) => sum + item.contribution, 0),
  );
  const recommendation: PriorityRecommendation = !eligible
    ? "NOT_ELIGIBLE"
    : totalScore >= input.profile.thresholds.start
      ? "START"
      : totalScore >= input.profile.thresholds.investigate
        ? "INVESTIGATE"
        : totalScore >= input.profile.thresholds.wait
          ? "WAIT"
          : "STOP";
  return {
    id: input.assessmentId,
    initiativeId: input.initiativeId,
    steeringProfileVersionId: input.profile.id,
    criterionAssessments,
    totalScore,
    evidenceSummary: `${criterionAssessments.flatMap((item) => item.evidenceRefs).length} källreferenser`,
    uncertaintySummary: criterionAssessments.some(
      (item) => item.uncertainty === "HIGH",
    )
      ? "Hög osäkerhet i minst ett kriterium"
      : "Ingen hög osäkerhet",
    systemRecommendation: recommendation,
    assessedAt: input.assessedAt,
    status: "CALCULATED",
    humanRationale: blockers.length
      ? `Blockerat av ${blockers.length} kompletteringskrav.`
      : undefined,
    effectPotentialIds: potentials.map((item) => item.id),
    qualificationAssessmentIds: qualificationAssessments.map((item) => item.id),
  };
}
export const priorityAssessmentByInitiative = (
  state: DemoState,
  initiativeId: InitiativeId,
) =>
  Object.values(state.entities.priorityAssessments).filter(
    (item) => item.initiativeId === initiativeId,
  );
export const priorityContributionByCriterion = (
  assessment: PriorityAssessment,
) =>
  assessment.criterionAssessments.map((item) => ({
    criterionCode: item.criterionCode,
    contribution: item.contribution,
    sourceRefs: item.evidenceRefs,
  }));
export const initiativesEligibleForPrioritization = (state: DemoState) =>
  Object.values(state.entities.initiatives).filter((item) =>
    isInitiativeQualified(state, item.id),
  );
export const prioritizedInitiatives = (state: DemoState) =>
  Object.values(state.entities.priorityAssessments)
    .filter((item) => item.status !== "DRAFT")
    .sort((a, b) => b.totalScore - a.totalScore);
export const steeringProfileById = (
  state: DemoState,
  id: SteeringProfileVersionId,
) => state.entities.steeringProfileVersions[id];
