import {
  createId,
  qualificationConfiguration,
  qualificationCriteria,
} from "../domain";
import type { DemoState } from "../application/demoState";
import { businessIds, organizationIds } from "./organizations";
import { mandates, roleAssignments } from "./peopleAndRoles";
import { steeringProfileVersions } from "./governanceConfiguration";

export const stage2Ids = {
  waitingInitiative: createId("Initiative", "initiative-102"),
  qualifiedInitiative: createId("Initiative", "initiative-103"),
  calculatedInitiative: createId("Initiative", "initiative-104"),
  acceptedInitiative: createId("Initiative", "initiative-105"),
  overriddenInitiative: createId("Initiative", "initiative-106"),
  unassignedRequirement: createId("CompletionRequirement", "completion-001"),
  waitingRequirement: createId("CompletionRequirement", "completion-002"),
};

const states = [
  {
    id: stage2Ids.waitingInitiative,
    token: "103",
    title: "Verifiering av syntetisk serviceinformation",
  },
  {
    id: stage2Ids.qualifiedInitiative,
    token: "104",
    title: "Förenklad fiktiv återkoppling",
  },
  {
    id: stage2Ids.calculatedInitiative,
    token: "105",
    title: "Samlad syntetisk planering",
  },
  {
    id: stage2Ids.acceptedInitiative,
    token: "106",
    title: "Tydligare fiktiv vägledning",
  },
  {
    id: stage2Ids.overriddenInitiative,
    token: "107",
    title: "Automatiserad demokontroll",
  },
] as const;

export function addStage2DemoData(state: DemoState): DemoState {
  const entities = state.entities;
  states.forEach((item, initiativeIndex) => {
    const challengeId = createId("Challenge", `challenge-${item.token}`);
    entities.challenges[challengeId] = {
      id: challengeId,
      title: item.title,
      problemStatement:
        "Ett helt fiktivt verksamhetsproblem behöver hanteras strategiskt.",
      currentState: "Syntetiskt nuläge med manuella moment.",
      source: "Syntetisk analys",
      initiatorRoleAssignmentId:
        roleAssignments[initiativeIndex % roleAssignments.length].id,
      strategicRelevance: "Kopplar till ett fiktivt strategiskt mål.",
      strategicHandlingReason:
        "Berör flera roller och kräver gemensam riktning.",
      nominationStatus: "NOMINATED",
      relatedInitiativeIds: [item.id],
      createdAt: `2026-09-${10 + initiativeIndex}T08:00:00Z`,
    };
    entities.initiatives[item.id] = {
      id: item.id,
      challengeId,
      title: item.title,
      purpose: "Skapa ett prövbart syntetiskt arbetssätt.",
      desiredEndState: "Ett tydligt, verifierbart framtida läge.",
      initiativeKind: initiativeIndex === 4 ? "ENABLING" : "VALUE_CREATING",
      scope: "Fiktiv verksamhetsövergripande avgränsning.",
      createdAt: `2026-09-${10 + initiativeIndex}T09:00:00Z`,
    };
    entities.participations[
      createId("Participation", `participation-${10 + initiativeIndex}`)
    ] = {
      id: createId("Participation", `participation-${10 + initiativeIndex}`),
      initiativeId: item.id,
      organizationId: organizationIds.north,
      businessId: businessIds.intake,
      participantKind: "PARTICIPANT",
      validFrom: "2026-09-15",
    };
    qualificationCriteria.forEach((criterion, criterionIndex) => {
      const id = createId(
        "QualificationAssessment",
        `qa-${item.token}-${criterionIndex + 1}`,
      );
      entities.qualificationAssessments[id] = {
        id,
        initiativeId: item.id,
        qualificationArea: criterion.qualificationArea,
        criterionCode: criterion.criterionCode,
        summary: `Syntetiskt underlag för ${criterion.name.toLocaleLowerCase("sv-SE")}.`,
        status:
          item.id === stage2Ids.waitingInitiative && criterionIndex === 6
            ? "INCOMPLETE"
            : "SATISFIED",
        mandatory: criterion.mandatory,
        requiresVerification: criterion.requiresVerification,
        evidenceRefs: [`EVIDENCE-DEMO-${item.token}-${criterionIndex + 1}`],
        assumptions: ["Underlaget är helt syntetiskt."],
        assessedByRoleAssignmentId: roleAssignments[0].id,
        assessedAt: "2026-09-20T10:00:00Z",
        verifiedByRoleAssignmentId:
          criterion.requiresVerification &&
          item.id !== stage2Ids.waitingInitiative
            ? roleAssignments[1].id
            : undefined,
        verifiedAt:
          criterion.requiresVerification &&
          item.id !== stage2Ids.waitingInitiative
            ? "2026-09-21T10:00:00Z"
            : undefined,
        assessedAgainstConfigurationVersion: qualificationConfiguration.id,
      };
    });
  });
  const mainAssessmentId = createId(
    "QualificationAssessment",
    "qa-main-current-state",
  );
  entities.qualificationAssessments[mainAssessmentId] = {
    id: mainAssessmentId,
    initiativeId: Object.values(entities.initiatives)[0].id,
    qualificationArea: "STRATEGIC_RELEVANCE",
    criterionCode: "VERIFIABLE_CURRENT_STATE",
    summary: "Nuläget behöver verifieras med syntetiskt underlag.",
    status: "INCOMPLETE",
    mandatory: true,
    requiresVerification: false,
    evidenceRefs: [],
    assumptions: [],
    assessedByRoleAssignmentId: roleAssignments[0].id,
    assessedAt: "2026-09-18T08:00:00Z",
    assessedAgainstConfigurationVersion: qualificationConfiguration.id,
  };
  entities.completionRequirements[stage2Ids.unassignedRequirement] = {
    id: stage2Ids.unassignedRequirement,
    initiativeId: Object.values(entities.initiatives)[0].id,
    qualificationAssessmentId: mainAssessmentId,
    missingItem: "Verifierad beskrivning av informationsbehov",
    reasonRequired: "Behövs för att avsluta kvalificeringen.",
    blocks: ["QUALIFICATION"],
    status: "RESPONSIBILITY_UNASSIGNED",
    submittedEvidenceRefs: [],
    createdAt: "2026-09-18T08:00:00Z",
  };
  entities.completionRequirements[stage2Ids.waitingRequirement] = {
    id: stage2Ids.waitingRequirement,
    initiativeId: stage2Ids.waitingInitiative,
    qualificationAssessmentId: createId("QualificationAssessment", "qa-103-7"),
    missingItem: "Behörig juridisk verifiering",
    reasonRequired: "Krävs för kriteriet kvalitet och juridik.",
    blocks: ["QUALIFICATION", "PRIORITIZATION"],
    responsibleRoleAssignmentId: roleAssignments[0].id,
    deadline: "2026-10-15",
    verifierRoleAssignmentId: roleAssignments[1].id,
    status: "SUBMITTED",
    submittedEvidenceRefs: ["EVIDENCE-DEMO-SUBMITTED"],
    resolutionSummary: "Syntetiskt underlag inskickat.",
    createdAt: "2026-09-18T08:00:00Z",
    completedAt: "2026-09-25T08:00:00Z",
  };
  const potentialId = createId("EffectPotential", "potential-001");
  entities.effectPotentials[potentialId] = {
    id: potentialId,
    initiativeId: stage2Ids.qualifiedInitiative,
    recipientBusinessId: businessIds.intake,
    category: "RELEASED_TIME",
    effectMeasureCode: "RELEASED_HOURS",
    unit: "timmar/år",
    lowerBound: 800,
    expectedValue: 1200,
    upperBound: 1600,
    evidenceRefs: ["EVIDENCE-DEMO-TIME-001"],
    assumptions: ["Frigjord tid kan disponeras till kärnuppdraget."],
    uncertainty: "MEDIUM",
    realizationWindow: "6–12 månader",
    earliestPossibleEffectDate: "2027-03-01",
    fullPotentialDate: "2027-09-01",
    scope: "LOCAL",
    assessedByRoleAssignmentIds: [roleAssignments[0].id],
    assessedAt: "2026-09-22T08:00:00Z",
    assessmentVersion: 1,
  };
  const profile = steeringProfileVersions[0];
  const profileWeights: Record<string, number> = profile.weights;
  [
    stage2Ids.calculatedInitiative,
    stage2Ids.acceptedInitiative,
    stage2Ids.overriddenInitiative,
  ].forEach((initiativeId, index) => {
    const id = createId("PriorityAssessment", `priority-${index + 1}`);
    const criterionAssessments = profile.criteria.map((criterion) => ({
      criterionCode: criterion.code,
      score: 80 - index * 5,
      contribution: (80 - index * 5) * (profileWeights[criterion.code] / 100),
      evidenceRefs: [`EVIDENCE-DEMO-PRIORITY-${criterion.code}`],
      uncertainty: "MEDIUM" as const,
    }));
    entities.priorityAssessments[id] = {
      id,
      initiativeId,
      steeringProfileVersionId: profile.id,
      criterionAssessments,
      totalScore: Math.round(
        criterionAssessments.reduce((sum, item) => sum + item.contribution, 0),
      ),
      evidenceSummary: "Syntetiskt prioriteringsunderlag.",
      uncertaintySummary: "Medelhög osäkerhet.",
      systemRecommendation: "START",
      assessedAt: "2026-09-23T08:00:00Z",
      status:
        index === 0 ? "CALCULATED" : index === 1 ? "ACCEPTED" : "OVERRIDDEN",
      reviewedByRoleAssignmentId: index ? roleAssignments[2].id : undefined,
      reviewedByPersonId: index ? roleAssignments[2].personId : undefined,
      reviewMandateId: index ? mandates[2].id : undefined,
      reviewedAt: index ? "2026-09-24T08:00:00Z" : undefined,
      humanRationale:
        index === 1
          ? "Underlaget accepteras för fortsatt beredning."
          : index === 2
            ? "Kapaciteten bedöms kräva fortsatt utredning."
            : undefined,
      humanRecommendation: index === 2 ? "INVESTIGATE" : undefined,
      previousSystemRecommendation: index ? "START" : undefined,
      effectPotentialIds: Object.values(entities.effectPotentials)
        .filter((item) => item.initiativeId === initiativeId)
        .map((item) => item.id),
      qualificationAssessmentIds: Object.values(
        entities.qualificationAssessments,
      )
        .filter((item) => item.initiativeId === initiativeId)
        .map((item) => item.id),
    };
  });
  const portfolioPotentialId = createId("EffectPotential", "potential-002");
  entities.effectPotentials[portfolioPotentialId] = {
    ...entities.effectPotentials[potentialId],
    id: portfolioPotentialId,
    initiativeId: stage2Ids.calculatedInitiative,
    recipientBusinessId: businessIds.response,
    category: "QUALITY",
    effectMeasureCode: "CORRECT_FIRST_TIME",
    unit: "procent",
    lowerBound: 4,
    expectedValue: 7,
    upperBound: 10,
  };
  Object.values(entities.priorityAssessments).forEach((assessment) => {
    assessment.effectPotentialIds = Object.values(entities.effectPotentials)
      .filter((item) => item.initiativeId === assessment.initiativeId)
      .map((item) => item.id);
  });
  return state;
}
