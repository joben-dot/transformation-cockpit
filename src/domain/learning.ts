import type { IsoDateTime } from "./common";
import type {
  BusinessId,
  InitiativeId,
  LearningRecordId,
  OrganizationId,
  ScalingCandidateId,
} from "./ids";

export interface LearningRecord {
  id: LearningRecordId;
  initiativeId: InitiativeId;
  observation: string;
  evidenceReferences: string[];
  recordedAt: IsoDateTime;
}
export interface ScalingCandidate {
  id: ScalingCandidateId;
  sourceInitiativeId: InitiativeId;
  targetOrganizationId: OrganizationId;
  targetBusinessId?: BusinessId;
  rationale: string;
  createdAt: IsoDateTime;
}
