import {
  createId,
  type AuditEntry,
  type Initiative,
  type Participation,
  type StrategicChallenge,
} from "../domain";
import { validateDemoState } from "../demo-data/validateDemoData";
import type { Command } from "./commands";
import type { CommandError, CommandResult } from "./commandResult";
import type { DemoState } from "./demoState";
import {
  calculatePriorityAssessment,
  validateSteeringProfile,
} from "./selectors/prioritySelectors";
import { priorityReviewMandateScope } from "../domain";
import { reduceStage3Command } from "./stage3Reducer";
import { validateStage3State } from "./validateStage3State";

const failure = (
  state: DemoState,
  code: CommandError["code"],
  description: string,
  entityId?: string,
): CommandResult => ({
  success: false,
  nextState: state,
  errors: [{ code, description, entityId }],
  affectedEntityIds: [],
});

function validatePriorityReviewer(state: DemoState, command: Command) {
  const assignment =
    state.entities.roleAssignments[command.actorRoleAssignmentId];
  if (!assignment || !state.entities.people[assignment.personId])
    return failure(
      state,
      "INVALID_REFERENCE",
      "Åtgärden kräver en befintlig mänsklig personkoppling.",
      command.actorRoleAssignmentId,
    );
  const actionDate = command.issuedAt.slice(0, 10);
  if (
    assignment.validFrom > actionDate ||
    (assignment.validTo && assignment.validTo < actionDate)
  )
    return failure(
      state,
      "INVALID_REFERENCE",
      "Rollrelationen är inte giltig vid åtgärdstidpunkten.",
      assignment.id,
    );
  const role = state.entities.roleDefinitions[assignment.roleDefinitionId];
  if (!role || role.roleKind !== "DECISION_MAKER")
    return failure(
      state,
      "INVALID_REFERENCE",
      "Rollrelationen är inte behörig att hantera prioriteringsunderlag.",
      assignment.id,
    );
  const mandate = Object.values(state.entities.mandates).find(
    (item) =>
      item.roleAssignmentId === assignment.id &&
      item.scope === priorityReviewMandateScope &&
      item.validFrom <= actionDate &&
      (!item.validTo || item.validTo >= actionDate),
  );
  if (!mandate)
    return failure(
      state,
      "INVALID_REFERENCE",
      "Ett giltigt och rätt avgränsat mandat för prioriteringsgranskning saknas.",
      assignment.id,
    );
  return undefined;
}

function findPriorityReviewMandate(
  state: DemoState,
  roleAssignmentId: string,
  issuedAt: string,
) {
  const actionDate = issuedAt.slice(0, 10);
  return Object.values(state.entities.mandates).find(
    (item) =>
      item.roleAssignmentId === roleAssignmentId &&
      item.scope === priorityReviewMandateScope &&
      item.validFrom <= actionDate &&
      (!item.validTo || item.validTo >= actionDate),
  );
}

function validateCommand(
  state: DemoState,
  command: Command,
): CommandResult | undefined {
  if (!state.entities.roleAssignments[command.actorRoleAssignmentId]) {
    return failure(
      state,
      "ACTOR_NOT_FOUND",
      "Commandets aktör saknar en giltig rollrelation.",
      command.actorRoleAssignmentId,
    );
  }
  switch (command.commandType) {
    case "SET_ACTIVE_CHALLENGE":
      if (!state.entities.challenges[command.targetId])
        return failure(
          state,
          "TARGET_NOT_FOUND",
          "Utmaningen finns inte.",
          command.targetId,
        );
      break;
    case "SET_ACTIVE_INITIATIVE":
      if (!state.entities.initiatives[command.targetId])
        return failure(
          state,
          "TARGET_NOT_FOUND",
          "Initiativet finns inte.",
          command.targetId,
        );
      break;
    case "SET_VIEW_PERSPECTIVE":
      if (
        command.payload.perspective.kind === "ORGANIZATION" &&
        !state.entities.organizations[
          command.payload.perspective.organizationId
        ]
      )
        return failure(
          state,
          "INVALID_REFERENCE",
          "Perspektivets organisation finns inte.",
          command.payload.perspective.organizationId,
        );
      break;
    case "CREATE_STRATEGIC_CHALLENGE":
      if (state.entities.challenges[command.targetId])
        return failure(
          state,
          "TARGET_ALREADY_EXISTS",
          "Utmaningens ID används redan.",
          command.targetId,
        );
      if (
        !command.payload.title.trim() ||
        !command.payload.problemStatement.trim()
      )
        return failure(
          state,
          "INVALID_PAYLOAD",
          "Titel och problemformulering krävs.",
          command.targetId,
        );
      break;
    case "CREATE_INITIATIVE_FROM_CHALLENGE":
      if (state.entities.initiatives[command.targetId])
        return failure(
          state,
          "TARGET_ALREADY_EXISTS",
          "Initiativets ID används redan.",
          command.targetId,
        );
      if (!state.entities.challenges[command.payload.challengeId])
        return failure(
          state,
          "INVALID_REFERENCE",
          "Ursprunglig utmaning finns inte.",
          command.payload.challengeId,
        );
      break;
    case "ADD_PARTICIPATION": {
      if (state.entities.participations[command.targetId])
        return failure(
          state,
          "TARGET_ALREADY_EXISTS",
          "Deltagandets ID används redan.",
          command.targetId,
        );
      if (!state.entities.initiatives[command.payload.initiativeId])
        return failure(
          state,
          "INVALID_REFERENCE",
          "Deltagandets initiativ finns inte.",
          command.payload.initiativeId,
        );
      if (!state.entities.organizations[command.payload.organizationId])
        return failure(
          state,
          "INVALID_REFERENCE",
          "Deltagandets organisation finns inte.",
          command.payload.organizationId,
        );
      const business = command.payload.businessId
        ? state.entities.businesses[command.payload.businessId]
        : undefined;
      if (command.payload.businessId && !business)
        return failure(
          state,
          "INVALID_REFERENCE",
          "Deltagandets verksamhet finns inte.",
          command.payload.businessId,
        );
      if (
        business &&
        business.organizationId !== command.payload.organizationId
      )
        return failure(
          state,
          "INVALID_REFERENCE",
          "Verksamheten tillhör inte deltagandets organisation.",
          command.payload.businessId,
        );
      break;
    }
    case "SET_WORKING_SELECTION":
      break;
    case "UPSERT_QUALIFICATION_ASSESSMENT": {
      if (!state.entities.initiatives[command.payload.initiativeId])
        return failure(
          state,
          "INVALID_REFERENCE",
          "Initiativet finns inte.",
          command.payload.initiativeId,
        );
      const configuration = Object.values(
        state.entities.qualificationConfigurations,
      ).find((item) => item.status === "ACTIVE");
      if (
        !configuration ||
        command.payload.assessedAgainstConfigurationVersion !== configuration.id
      )
        return failure(
          state,
          "INVALID_REFERENCE",
          "Kvalificeringsbedömningen refererar inte till aktiv katalogversion.",
          command.targetId,
        );
      const criterion = configuration.criteria.find(
        (item) => item.criterionCode === command.payload.criterionCode,
      );
      if (
        !criterion ||
        criterion.qualificationArea !== command.payload.qualificationArea ||
        criterion.mandatory !== command.payload.mandatory ||
        criterion.requiresVerification !== command.payload.requiresVerification
      )
        return failure(
          state,
          "INVALID_PAYLOAD",
          "Kriteriet matchar inte den versionsbundna katalogen.",
          command.targetId,
        );
      if (
        command.payload.status === "NOT_APPLICABLE" &&
        !command.payload.notApplicableRationale?.trim()
      )
        return failure(
          state,
          "INVALID_PAYLOAD",
          "Ej tillämpligt kräver en skriftlig motivering.",
          command.targetId,
        );
      if (
        command.payload.status === "NOT_APPLICABLE" &&
        command.payload.requiresVerification &&
        (!command.payload.verifiedByRoleAssignmentId ||
          !command.payload.verifiedAt)
      )
        return failure(
          state,
          "INVALID_PAYLOAD",
          "Ej tillämpligt kräver behörig verifiering för kriteriet.",
          command.targetId,
        );
      if (command.payload.verifiedByRoleAssignmentId) {
        const verifierAssignment =
          state.entities.roleAssignments[
            command.payload.verifiedByRoleAssignmentId
          ];
        const verifierRole = verifierAssignment
          ? state.entities.roleDefinitions[verifierAssignment.roleDefinitionId]
          : undefined;
        if (!verifierAssignment || verifierRole?.roleKind !== "SPECIALIST")
          return failure(
            state,
            "INVALID_REFERENCE",
            "Verifieraren saknar behörig specialistroll.",
            command.payload.verifiedByRoleAssignmentId,
          );
      }
      break;
    }
    case "CREATE_COMPLETION_REQUIREMENT":
      if (state.entities.completionRequirements[command.targetId])
        return failure(
          state,
          "TARGET_ALREADY_EXISTS",
          "Kompletteringskravets ID används redan.",
          command.targetId,
        );
      if (!state.entities.initiatives[command.payload.initiativeId])
        return failure(
          state,
          "INVALID_REFERENCE",
          "Initiativet finns inte.",
          command.payload.initiativeId,
        );
      break;
    case "ASSIGN_COMPLETION_RESPONSIBILITY":
    case "SUBMIT_COMPLETION_REQUIREMENT":
    case "VERIFY_COMPLETION_REQUIREMENT":
    case "REJECT_COMPLETION_REQUIREMENT": {
      const requirement =
        state.entities.completionRequirements[command.targetId];
      if (!requirement)
        return failure(
          state,
          "TARGET_NOT_FOUND",
          "Kompletteringskravet finns inte.",
          command.targetId,
        );
      if (
        command.commandType === "ASSIGN_COMPLETION_RESPONSIBILITY" &&
        !state.entities.roleAssignments[
          command.payload.responsibleRoleAssignmentId
        ]
      )
        return failure(
          state,
          "INVALID_REFERENCE",
          "Ansvarig rollrelation finns inte.",
          command.payload.responsibleRoleAssignmentId,
        );
      if (
        command.commandType === "ASSIGN_COMPLETION_RESPONSIBILITY" &&
        command.payload.verifierRoleAssignmentId &&
        !state.entities.roleAssignments[
          command.payload.verifierRoleAssignmentId
        ]
      )
        return failure(
          state,
          "INVALID_REFERENCE",
          "Verifierarens rollrelation finns inte.",
          command.payload.verifierRoleAssignmentId,
        );
      if (
        command.commandType === "SUBMIT_COMPLETION_REQUIREMENT" &&
        (!["REQUESTED", "IN_PROGRESS", "REJECTED"].includes(
          requirement.status,
        ) ||
          !command.payload.submittedEvidenceRefs.length)
      )
        return failure(
          state,
          "INVALID_PAYLOAD",
          "Kravet måste vara tilldelat och ha evidens före inskick.",
          command.targetId,
        );
      if (
        command.commandType === "VERIFY_COMPLETION_REQUIREMENT" &&
        (requirement.status !== "SUBMITTED" ||
          requirement.verifierRoleAssignmentId !==
            command.actorRoleAssignmentId)
      )
        return failure(
          state,
          "INVALID_PAYLOAD",
          "Endast utsedd verifierare kan verifiera ett inskickat krav.",
          command.targetId,
        );
      if (
        command.commandType === "REJECT_COMPLETION_REQUIREMENT" &&
        requirement.status !== "SUBMITTED"
      )
        return failure(
          state,
          "INVALID_PAYLOAD",
          "Endast ett inskickat krav kan avslås.",
          command.targetId,
        );
      break;
    }
    case "RECORD_EFFECT_POTENTIAL":
      if (state.entities.effectPotentials[command.targetId])
        return failure(
          state,
          "TARGET_ALREADY_EXISTS",
          "Potentialens ID används redan.",
          command.targetId,
        );
      if (!state.entities.initiatives[command.payload.initiativeId])
        return failure(
          state,
          "INVALID_REFERENCE",
          "Initiativet finns inte.",
          command.payload.initiativeId,
        );
      if (
        command.payload.lowerBound > command.payload.expectedValue ||
        command.payload.expectedValue > command.payload.upperBound
      )
        return failure(
          state,
          "INVALID_PAYLOAD",
          "Potentialens intervall är ogiltigt.",
          command.targetId,
        );
      if (
        command.payload.category === "RELEASED_TIME" &&
        command.payload.monetizationAssumption === undefined &&
        command.payload.unit === "SEK"
      )
        return failure(
          state,
          "INVALID_PAYLOAD",
          "Monetarisering av tid kräver ett explicit antagande.",
          command.targetId,
        );
      break;
    case "CREATE_STEERING_PROFILE_VERSION": {
      if (state.entities.steeringProfileVersions[command.targetId])
        return failure(
          state,
          "TARGET_ALREADY_EXISTS",
          "Profilversionens ID används redan.",
          command.targetId,
        );
      const candidate = {
        id: command.targetId,
        ...command.payload,
        status: "DRAFT" as const,
        createdAt: command.issuedAt,
      };
      const validation = validateSteeringProfile(candidate);
      if (!validation.valid)
        return failure(
          state,
          "INVALID_PAYLOAD",
          validation.errors.join(" "),
          command.targetId,
        );
      break;
    }
    case "ACTIVATE_STEERING_PROFILE_VERSION":
      if (!state.entities.steeringProfileVersions[command.targetId])
        return failure(
          state,
          "TARGET_NOT_FOUND",
          "Profilversionen finns inte.",
          command.targetId,
        );
      break;
    case "CALCULATE_PRIORITY_ASSESSMENT":
      if (state.entities.priorityAssessments[command.targetId])
        return failure(
          state,
          "TARGET_ALREADY_EXISTS",
          "Prioriteringsbedömningens ID används redan.",
          command.targetId,
        );
      if (
        !state.entities.initiatives[command.payload.initiativeId] ||
        !state.entities.steeringProfileVersions[
          command.payload.steeringProfileVersionId
        ]
      )
        return failure(
          state,
          "INVALID_REFERENCE",
          "Initiativ eller profilversion saknas.",
          command.targetId,
        );
      if (
        !validateSteeringProfile(
          state.entities.steeringProfileVersions[
            command.payload.steeringProfileVersionId
          ],
        ).valid
      )
        return failure(
          state,
          "INVALID_PAYLOAD",
          "Styrprofilversionen är inte giltig.",
          command.payload.steeringProfileVersionId,
        );
      break;
    case "REVIEW_PRIORITY_ASSESSMENT":
    case "OVERRIDE_PRIORITY_ASSESSMENT":
    case "REJECT_PRIORITY_ASSESSMENT":
    case "RETURN_PRIORITY_ASSESSMENT_FOR_COMPLETION": {
      const assessment = state.entities.priorityAssessments[command.targetId];
      if (!assessment)
        return failure(
          state,
          "TARGET_NOT_FOUND",
          "Prioriteringsunderlaget finns inte.",
          command.targetId,
        );
      if (
        assessment.status !== "CALCULATED" &&
        assessment.status !== "REVIEWED"
      )
        return failure(
          state,
          "INVALID_PAYLOAD",
          "Prioriteringsunderlaget har inte rätt status för mänsklig hantering.",
          command.targetId,
        );
      if (
        command.commandType !== "REVIEW_PRIORITY_ASSESSMENT" &&
        !command.payload.rationale.trim()
      )
        return failure(
          state,
          "INVALID_PAYLOAD",
          "Mänskligt ställningstagande kräver motivering.",
          command.targetId,
        );
      const reviewerError = validatePriorityReviewer(state, command);
      if (reviewerError) return reviewerError;
      break;
    }
  }
  return undefined;
}

function applyCommand(nextState: DemoState, command: Command): string[] {
  switch (command.commandType) {
    case "SET_ACTIVE_CHALLENGE":
      nextState.viewContext.activeChallengeId = command.targetId;
      return [command.targetId];
    case "SET_ACTIVE_INITIATIVE":
      nextState.viewContext.activeInitiativeId = command.targetId;
      return [command.targetId];
    case "SET_VIEW_PERSPECTIVE":
      nextState.viewContext.selectedPerspective = command.payload.perspective;
      return command.payload.perspective.kind === "ORGANIZATION"
        ? [command.payload.perspective.organizationId]
        : [];
    case "SET_WORKING_SELECTION":
      nextState.viewContext.workingSelectionIds = [
        ...command.payload.entityIds,
      ];
      return [...command.payload.entityIds];
    case "CREATE_STRATEGIC_CHALLENGE": {
      const challenge: StrategicChallenge = {
        id: command.targetId,
        ...command.payload,
        initiatorRoleAssignmentId: command.actorRoleAssignmentId,
        relatedInitiativeIds: [],
        createdAt: command.issuedAt,
      };
      nextState.entities.challenges[challenge.id] = challenge;
      return [challenge.id];
    }
    case "CREATE_INITIATIVE_FROM_CHALLENGE": {
      const initiative: Initiative = {
        id: command.targetId,
        ...command.payload,
        createdAt: command.issuedAt,
      };
      nextState.entities.initiatives[initiative.id] = initiative;
      nextState.entities.challenges[
        initiative.challengeId
      ].relatedInitiativeIds.push(initiative.id);
      return [initiative.id, initiative.challengeId];
    }
    case "ADD_PARTICIPATION": {
      const participation: Participation = {
        id: command.targetId,
        ...command.payload,
      };
      nextState.entities.participations[participation.id] = participation;
      return [participation.id, participation.initiativeId];
    }
    case "UPSERT_QUALIFICATION_ASSESSMENT": {
      nextState.entities.qualificationAssessments[command.targetId] = {
        id: command.targetId,
        ...command.payload,
        assessedByRoleAssignmentId: command.actorRoleAssignmentId,
        assessedAt: command.issuedAt,
      };
      return [command.targetId, command.payload.initiativeId];
    }
    case "CREATE_COMPLETION_REQUIREMENT":
      nextState.entities.completionRequirements[command.targetId] = {
        id: command.targetId,
        ...command.payload,
        status: "RESPONSIBILITY_UNASSIGNED",
        submittedEvidenceRefs: [],
        createdAt: command.issuedAt,
      };
      return [command.targetId, command.payload.initiativeId];
    case "ASSIGN_COMPLETION_RESPONSIBILITY": {
      const item = nextState.entities.completionRequirements[command.targetId];
      Object.assign(item, command.payload, { status: "REQUESTED" });
      return [item.id, item.initiativeId];
    }
    case "SUBMIT_COMPLETION_REQUIREMENT": {
      const item = nextState.entities.completionRequirements[command.targetId];
      Object.assign(item, command.payload, {
        status: "SUBMITTED",
        completedAt: command.issuedAt,
      });
      return [item.id, item.initiativeId];
    }
    case "VERIFY_COMPLETION_REQUIREMENT": {
      const item = nextState.entities.completionRequirements[command.targetId];
      Object.assign(item, command.payload, {
        status: "VERIFIED",
        verifierRoleAssignmentId: command.actorRoleAssignmentId,
        verifiedAt: command.issuedAt,
      });
      return [item.id, item.initiativeId];
    }
    case "REJECT_COMPLETION_REQUIREMENT": {
      const item = nextState.entities.completionRequirements[command.targetId];
      Object.assign(item, {
        status: "REJECTED",
        resolutionSummary: command.payload.reason,
        verifierRoleAssignmentId: command.actorRoleAssignmentId,
      });
      return [item.id, item.initiativeId];
    }
    case "RECORD_EFFECT_POTENTIAL":
      nextState.entities.effectPotentials[command.targetId] = {
        id: command.targetId,
        ...command.payload,
        assessedByRoleAssignmentIds: command.payload.assessedByRoleAssignmentIds
          ?.length
          ? command.payload.assessedByRoleAssignmentIds
          : [command.actorRoleAssignmentId],
        assessedAt: command.issuedAt,
      };
      return [command.targetId, command.payload.initiativeId];
    case "CREATE_STEERING_PROFILE_VERSION":
      nextState.entities.steeringProfileVersions[command.targetId] = {
        id: command.targetId,
        ...command.payload,
        status: "DRAFT",
        createdAt: command.issuedAt,
      };
      return [command.targetId];
    case "ACTIVATE_STEERING_PROFILE_VERSION":
      Object.values(nextState.entities.steeringProfileVersions)
        .filter((item) => item.status === "ACTIVE")
        .forEach((item) => {
          item.status = "RETIRED";
        });
      nextState.entities.steeringProfileVersions[command.targetId].status =
        "ACTIVE";
      return [command.targetId];
    case "CALCULATE_PRIORITY_ASSESSMENT": {
      const profile =
        nextState.entities.steeringProfileVersions[
          command.payload.steeringProfileVersionId
        ];
      nextState.entities.priorityAssessments[command.targetId] =
        calculatePriorityAssessment(nextState, {
          assessmentId: command.targetId,
          initiativeId: command.payload.initiativeId,
          profile,
          scores: command.payload.scores,
          assessedAt: command.issuedAt,
        });
      return [command.targetId, command.payload.initiativeId, profile.id];
    }
    case "REVIEW_PRIORITY_ASSESSMENT": {
      const item = nextState.entities.priorityAssessments[command.targetId];
      const assignment =
        nextState.entities.roleAssignments[command.actorRoleAssignmentId];
      const mandate = findPriorityReviewMandate(
        nextState,
        assignment.id,
        command.issuedAt,
      )!;
      Object.assign(item, {
        status: "ACCEPTED",
        reviewedByRoleAssignmentId: command.actorRoleAssignmentId,
        reviewedByPersonId: assignment.personId,
        reviewMandateId: mandate.id,
        reviewedAt: command.issuedAt,
        humanRationale: command.payload.rationale ?? "Underlaget accepterat.",
        previousSystemRecommendation: item.systemRecommendation,
      });
      return [
        item.id,
        item.initiativeId,
        item.steeringProfileVersionId,
        assignment.personId,
        assignment.id,
        mandate.id,
      ];
    }
    case "OVERRIDE_PRIORITY_ASSESSMENT": {
      const item = nextState.entities.priorityAssessments[command.targetId];
      const assignment =
        nextState.entities.roleAssignments[command.actorRoleAssignmentId];
      const mandate = findPriorityReviewMandate(
        nextState,
        assignment.id,
        command.issuedAt,
      )!;
      Object.assign(item, {
        status: "OVERRIDDEN",
        reviewedByRoleAssignmentId: command.actorRoleAssignmentId,
        reviewedByPersonId: assignment.personId,
        reviewMandateId: mandate.id,
        reviewedAt: command.issuedAt,
        humanRationale: command.payload.rationale,
        humanRecommendation: command.payload.recommendation,
        previousSystemRecommendation: item.systemRecommendation,
      });
      return [
        item.id,
        item.initiativeId,
        item.steeringProfileVersionId,
        assignment.personId,
        assignment.id,
        mandate.id,
      ];
    }
    case "REJECT_PRIORITY_ASSESSMENT":
    case "RETURN_PRIORITY_ASSESSMENT_FOR_COMPLETION": {
      const item = nextState.entities.priorityAssessments[command.targetId];
      const assignment =
        nextState.entities.roleAssignments[command.actorRoleAssignmentId];
      const mandate = findPriorityReviewMandate(
        nextState,
        assignment.id,
        command.issuedAt,
      )!;
      Object.assign(item, {
        status:
          command.commandType === "REJECT_PRIORITY_ASSESSMENT"
            ? "REJECTED"
            : "RETURNED_FOR_COMPLETION",
        reviewedByRoleAssignmentId: command.actorRoleAssignmentId,
        reviewedByPersonId: assignment.personId,
        reviewMandateId: mandate.id,
        reviewedAt: command.issuedAt,
        humanRationale: command.payload.rationale,
        previousSystemRecommendation: item.systemRecommendation,
      });
      return [
        item.id,
        item.initiativeId,
        item.steeringProfileVersionId,
        assignment.personId,
        assignment.id,
        mandate.id,
      ];
    }
    default:
      return [];
  }
}

export function demoReducer(state: DemoState, command: Command): CommandResult {
  const invalidCurrentState = validateDemoState(state);
  const invalidStage3State = validateStage3State(state);
  if (invalidCurrentState.length || invalidStage3State.length)
    return failure(
      state,
      "POST_STATE_INVALID",
      invalidCurrentState[0]?.description ?? invalidStage3State[0],
    );
  const stage3Result = reduceStage3Command(state, command);
  if (stage3Result) {
    if (!stage3Result.success) return stage3Result;
    const errors = validateDemoState(stage3Result.nextState);
    if (errors.length)
      return failure(
        state,
        "POST_STATE_INVALID",
        errors[0].description,
        errors[0].entityId,
      );
    return stage3Result;
  }
  const commandError = validateCommand(state, command);
  if (commandError) return commandError;

  const nextState = structuredClone(state) as DemoState;
  const affectedEntityIds = applyCommand(nextState, command);
  const postStateErrors = validateDemoState(nextState);
  if (postStateErrors.length)
    return failure(
      state,
      "POST_STATE_INVALID",
      postStateErrors[0].description,
      postStateErrors[0].entityId,
    );

  const auditEntry: AuditEntry = {
    id: createId("AuditEntry", command.commandId.replace(/[^a-z0-9-]/gi, "-")),
    commandId: command.commandId,
    commandType: command.commandType,
    actorRoleAssignmentId: command.actorRoleAssignmentId,
    issuedAt: command.issuedAt,
    affectedEntityIds,
  };
  nextState.audit.push(auditEntry);
  return { success: true, nextState, affectedEntityIds };
}
