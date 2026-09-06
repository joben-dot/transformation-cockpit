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
}
