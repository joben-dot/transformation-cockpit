import type { IsoDateTime } from "./common";
import type { ChallengeId, InitiativeId, RoleAssignmentId } from "./ids";

export type NominationStatus = "DRAFT" | "NOMINATED" | "WITHDRAWN";
export type TransformationStep = "material" | "businesscase" | "qualification" | "potential" | "priority" | "conditions" | "commitments" | "decision" | "measurement";
export interface StrategicChallenge {
  id: ChallengeId;
  title: string;
  problemStatement: string;
  currentState: string;
  source: string;
  initiatorRoleAssignmentId: RoleAssignmentId;
  strategicRelevance: string;
  strategicHandlingReason: string;
  nominationStatus: NominationStatus;
  relatedInitiativeIds: InitiativeId[];
  createdAt: IsoDateTime;
  /** Coordination of next actions; never substitutes for formal effect ownership or a locked measurement plan. */
  stepFollowUps?: Partial<Record<TransformationStep,{responsibleRoleAssignmentId:RoleAssignmentId;dueDate:string}>>;
  /** Evolving preparation material. Empty values are valid while the case is a draft. */
  businessCase?: {
    templateId: string;
    purpose: string;
    desiredState: string;
    scope: string;
    alternatives: string;
    doNothingConsequence: string;
    evidence: string;
    assumptions: string;
    uncertainty: string;
    timeHorizon: string;
    knownPrerequisites: string;
    knownRisks: string;
  };
}
