import type {
  ChallengeId,
  CommandId,
  InitiativeId,
  OrganizationId,
  ParticipationId,
  RoleAssignmentId,
  BusinessId,
} from "../domain";
import type {
  InitiativeKind,
  NominationStatus,
  ParticipantKind,
} from "../domain";
import type { ViewPerspective } from "./demoState";
import type {
  CompletionBlock,
  EffectPotential,
  PriorityRecommendation,
  QualificationArea,
  QualificationAssessmentStatus,
  SteeringProfileVersion,
} from "../domain";

interface CommandMetadata {
  commandId: CommandId;
  actorRoleAssignmentId: RoleAssignmentId;
  issuedAt: string;
}

export type Command = import("./transformationCommands").TransformationCommand
  | (CommandMetadata & {
      commandType: "SET_ACTIVE_CHALLENGE";
      targetId: ChallengeId;
    })
  | (CommandMetadata & {
      commandType: "SET_ACTIVE_INITIATIVE";
      targetId: InitiativeId;
    })
  | (CommandMetadata & {
      commandType: "SET_VIEW_PERSPECTIVE";
      payload: { perspective: ViewPerspective };
    })
  | (CommandMetadata & {
      commandType: "SET_WORKING_SELECTION";
      payload: { entityIds: string[] };
    })
  | (CommandMetadata & {
      commandType: "CREATE_STRATEGIC_CHALLENGE";
      targetId: ChallengeId;
      payload: {
        title: string;
        problemStatement: string;
        currentState: string;
        source: string;
        strategicRelevance: string;
        strategicHandlingReason: string;
        nominationStatus: NominationStatus;
      };
    })
  | (CommandMetadata & {
      commandType: "UPDATE_STRATEGIC_CHALLENGE";
      targetId: ChallengeId;
      payload: Partial<Pick<import("../domain").StrategicChallenge,
        "title" | "problemStatement" | "currentState" | "source" |
        "strategicRelevance" | "strategicHandlingReason" | "nominationStatus" | "businessCase">>;
    })
  | (CommandMetadata & {
      commandType: "CREATE_INITIATIVE_FROM_CHALLENGE";
      targetId: InitiativeId;
      payload: {
        challengeId: ChallengeId;
        title: string;
        purpose: string;
        desiredEndState: string;
        initiativeKind: InitiativeKind;
        scope: string;
      };
    })
  | (CommandMetadata & {
      commandType: "ADD_PARTICIPATION";
      targetId: ParticipationId;
      payload: {
        initiativeId: InitiativeId;
        organizationId: OrganizationId;
        businessId?: BusinessId;
        participantKind: ParticipantKind;
        validFrom: string;
      };
    })
  | (CommandMetadata & {
      commandType: "UPSERT_QUALIFICATION_ASSESSMENT";
      targetId: import("../domain").QualificationAssessmentId;
      payload: {
        initiativeId: InitiativeId;
        qualificationArea: QualificationArea;
        criterionCode: string;
        summary: string;
        status: QualificationAssessmentStatus;
        mandatory: boolean;
        requiresVerification: boolean;
        evidenceRefs: string[];
        assumptions: string[];
        notApplicableRationale?: string;
        assessedAgainstConfigurationVersion: import("../domain").QualificationConfigurationId;
      };
    })
  | (CommandMetadata & {
      commandType: "VERIFY_QUALIFICATION_ASSESSMENT";
      targetId: import("../domain").QualificationAssessmentId;
    })
  | (CommandMetadata & {
      commandType: "CREATE_COMPLETION_REQUIREMENT";
      targetId: import("../domain").CompletionRequirementId;
      payload: {
        initiativeId?: InitiativeId;
        challengeId?: ChallengeId;
        qualificationAssessmentId?: import("../domain").QualificationAssessmentId;
        missingItem: string;
        reasonRequired: string;
        blocks: CompletionBlock[];
        responsibleRoleAssignmentId?: RoleAssignmentId;
        verifierRoleAssignmentId?: RoleAssignmentId;
        deadline?: string;
      };
    })
  | (CommandMetadata & {
      commandType: "ASSIGN_COMPLETION_RESPONSIBILITY";
      targetId: import("../domain").CompletionRequirementId;
      payload: {
        responsibleRoleAssignmentId: RoleAssignmentId;
        deadline: string;
        verifierRoleAssignmentId?: RoleAssignmentId;
      };
    })
  | (CommandMetadata & {
      commandType: "SUBMIT_COMPLETION_REQUIREMENT";
      targetId: import("../domain").CompletionRequirementId;
      payload: { submittedEvidenceRefs: string[]; resolutionSummary: string };
    })
  | (CommandMetadata & {
      commandType: "VERIFY_COMPLETION_REQUIREMENT";
      targetId: import("../domain").CompletionRequirementId;
      payload: { resolutionSummary: string };
    })
  | (CommandMetadata & {
      commandType: "REJECT_COMPLETION_REQUIREMENT";
      targetId: import("../domain").CompletionRequirementId;
      payload: { reason: string };
    })
  | (CommandMetadata & {
      commandType: "RECORD_EFFECT_POTENTIAL";
      targetId: import("../domain").EffectPotentialId;
      payload: Omit<
        EffectPotential,
        "id" | "assessedAt" | "assessedByRoleAssignmentIds"
      > & { assessedByRoleAssignmentIds?: RoleAssignmentId[] };
    })
  | (CommandMetadata & {
      commandType: "CREATE_STEERING_PROFILE_VERSION";
      targetId: import("../domain").SteeringProfileVersionId;
      payload: Omit<SteeringProfileVersion, "id" | "createdAt" | "status">;
    })
  | (CommandMetadata & {
      commandType: "ACTIVATE_STEERING_PROFILE_VERSION";
      targetId: import("../domain").SteeringProfileVersionId;
    })
  | (CommandMetadata & {
      commandType: "CALCULATE_PRIORITY_ASSESSMENT";
      targetId: import("../domain").PriorityAssessmentId;
      payload: {
        initiativeId: InitiativeId;
        steeringProfileVersionId: import("../domain").SteeringProfileVersionId;
        scores: Record<
          string,
          {
            score: number;
            evidenceRefs: string[];
            uncertainty: "LOW" | "MEDIUM" | "HIGH";
          }
        >;
      };
    })
  | (CommandMetadata & {
      /** Reweights an immutable assessment snapshot; it is not a reassessment. */
      commandType: "REWEIGHT_PRIORITY_ASSESSMENT";
      targetId: import("../domain").PriorityAssessmentId;
      payload: {
        sourcePriorityAssessmentId: import("../domain").PriorityAssessmentId;
        steeringProfileVersionId: import("../domain").SteeringProfileVersionId;
      };
    })
  | (CommandMetadata & {
      commandType: "REVIEW_PRIORITY_ASSESSMENT";
      targetId: import("../domain").PriorityAssessmentId;
      payload: { rationale?: string };
    })
  | (CommandMetadata & {
      commandType: "OVERRIDE_PRIORITY_ASSESSMENT";
      targetId: import("../domain").PriorityAssessmentId;
      payload: { recommendation: PriorityRecommendation; rationale: string };
    })
  | (CommandMetadata & {
      commandType: "REJECT_PRIORITY_ASSESSMENT";
      targetId: import("../domain").PriorityAssessmentId;
      payload: { rationale: string };
    })
  | (CommandMetadata & {
      commandType: "RETURN_PRIORITY_ASSESSMENT_FOR_COMPLETION";
      targetId: import("../domain").PriorityAssessmentId;
      payload: { rationale: string };
    })
  | (CommandMetadata & {
      commandType: "CREATE_EXECUTION_NODE";
      targetId: import("../domain").ExecutionNodeId;
      payload: Omit<import("../domain").ExecutionNode, "id">;
    })
  | (CommandMetadata & {
      commandType: "UPDATE_EXECUTION_NODE" | "RECORD_NODE_AVAILABILITY";
      targetId: import("../domain").ExecutionNodeId;
      payload: Partial<Omit<import("../domain").ExecutionNode, "id">>;
    })
  | (CommandMetadata & {
      commandType: "ADD_DEPENDENCY";
      targetId: import("../domain").DependencyId;
      payload: Omit<import("../domain").Dependency, "id">;
    })
  | (CommandMetadata & {
      commandType: "REMOVE_DEPENDENCY";
      targetId: import("../domain").DependencyId;
    })
  | (CommandMetadata & {
      commandType: "REGISTER_CAPACITY_DEMAND";
      targetId: import("../domain").CapacityDemandId;
      payload: Omit<import("../domain").CapacityDemand, "id">;
    })
  | (CommandMetadata & {
      commandType: "REGISTER_AVAILABLE_CAPACITY";
      targetId: import("../domain").AvailableCapacityId;
      payload: Omit<import("../domain").AvailableCapacity, "id">;
    })
  | (CommandMetadata & {
      commandType: "CHANGE_CAPACITY_PERIOD";
      targetId: import("../domain").CapacityDemandId;
      payload: { period: import("../domain").Period };
    })
  | (CommandMetadata & {
      commandType: "REGISTER_COST_ENTRY";
      targetId: import("../domain").CostEntryId;
      payload: Omit<
        import("../domain").CostEntry,
        "id" | "assessedByRoleAssignmentId"
      >;
    })
  | (CommandMetadata & {
      commandType: "CREATE_ALLOCATION_RULE_VERSION";
      targetId: import("../domain").AllocationRuleVersionId;
      payload: Omit<
        import("../domain").AllocationRuleVersion,
        "id" | "createdAt"
      >;
    })
  | (CommandMetadata & {
      commandType: "CALCULATE_COST_ALLOCATION";
      targetId: import("../domain").CostEntryId;
      payload: {
        ruleVersionId: import("../domain").AllocationRuleVersionId;
        scenarioId: string;
        dimension: "ORGANIZATION" | "INITIATIVE";
      };
    });
