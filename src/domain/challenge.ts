import type { IsoDateTime } from "./common";
import type { ChallengeId, InitiativeId, RoleAssignmentId } from "./ids";

export type NominationStatus = "DRAFT" | "NOMINATED" | "WITHDRAWN";
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
