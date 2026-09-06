import type { IsoDateTime } from "./common";
import type {
  ChangeProposalId,
  DecisionFunctionId,
  DecisionVersionId,
  HumanDecisionId,
  InitiativeId,
  PriorityAssessmentId,
  PersonId,
  MandateId,
  RoleAssignmentId,
  SteeringProfileVersionId,
} from "./ids";

export type PriorityRecommendation =
  | "START"
  | "INVESTIGATE"
  | "WAIT"
  | "STOP"
  | "NOT_ELIGIBLE";
export type PriorityStatus =
  | "DRAFT"
  | "CALCULATED"
  | "REVIEWED"
  | "ACCEPTED"
  | "OVERRIDDEN"
  | "REJECTED"
  | "RETURNED_FOR_COMPLETION";
export interface CriterionAssessment {
  criterionCode: string;
  score: number;
  contribution: number;
  evidenceRefs: string[];
  uncertainty: "LOW" | "MEDIUM" | "HIGH";
}
export interface PriorityAssessment {
  id: PriorityAssessmentId;
  initiativeId: InitiativeId;
  steeringProfileVersionId: SteeringProfileVersionId;
  criterionAssessments: CriterionAssessment[];
  totalScore: number;
  evidenceSummary: string;
  uncertaintySummary: string;
  systemRecommendation: PriorityRecommendation;
  assessedAt: IsoDateTime;
  status: PriorityStatus;
  reviewedByRoleAssignmentId?: RoleAssignmentId;
  reviewedByPersonId?: PersonId;
  reviewMandateId?: MandateId;
  reviewedAt?: IsoDateTime;
  humanRationale?: string;
  humanRecommendation?: PriorityRecommendation;
  previousSystemRecommendation?: PriorityRecommendation;
}
export interface HumanDecision {
  id: HumanDecisionId;
  initiativeId: InitiativeId;
  decisionFunctionId: DecisionFunctionId;
  decisionMakerRoleAssignmentId: RoleAssignmentId;
  decisionType: "START" | "CHANGE" | "STOP" | "DEFER";
  decidedAt: IsoDateTime;
  rationale: string;
}
export interface DecisionVersion {
  id: DecisionVersionId;
  initiativeId: InitiativeId;
  humanDecisionId: HumanDecisionId;
  versionNumber: number;
  snapshot: Readonly<Record<string, unknown>>;
  checksum: string;
}
export interface ChangeProposal {
  id: ChangeProposalId;
  initiativeId: InitiativeId;
  proposedByRoleAssignmentId: RoleAssignmentId;
  description: string;
  timeImpact: string;
  costImpact: string;
  qualityImpact: string;
  effectImpact: string;
  createdAt: IsoDateTime;
}
