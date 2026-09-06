import type { BusinessId, EffectCommitmentId, InitiativeId, RoleAssignmentId, SteeringProfileVersionId, PriorityAssessmentId } from "./ids";
import type { Period } from "./common";

/** Versioned package for a human start/change decision. It contains references, not copied effects. */
export interface StartPreparation {
  id: string;
  initiativeId: InitiativeId;
  recipientBusinessIds: BusinessId[];
  commitmentIds: EffectCommitmentId[];
  priorityAssessmentId: PriorityAssessmentId;
  steeringProfileVersionId: SteeringProfileVersionId;
  governanceVersionId: string;
  fundingReference: string;
  capacityReference: string;
  legalReference: string;
  qualityReference: string;
  prerequisitesReview: string;
  economicRationale: string;
  costHorizon: Period;
  preparedBy: RoleAssignmentId;
  preparedAt: string;
}

export interface TransformationGovernance {
  id: string;
  version: number;
  validFrom: string;
  decisionFunction: string;
  escalation: string;
  commitmentStatus: string;
  changeRules: string;
  fundingPrinciple: string;
  qualityCategories: string;
  methodOwner: string;
  governingDocuments: string;
  legalRequirements: string;
  createdAt: string;
  demoAssumption: "Ej beslutad – används endast i demo.";
}

export interface CommitmentDetails {
  category: "MONEY" | "RELEASED_TIME" | "QUALITY" | "OTHER_BUSINESS_EFFECT";
  metricName: string;
  scope: string;
  changeDescription: string;
  changeResponsibleId: RoleAssignmentId;
  changeDueDate: string;
  receiverCapacity: string;
  measurementDates: string[];
  fullEffectDate: string;
  effectWindow: Period;
  ownerRoleAssignmentId: RoleAssignmentId;
  baselineReference: string;
  qualitySafeguard: string;
  qualityLimit: string;
  /** Explicit local financial plan; never a conversion of time or an actual outcome. */
  annualFinancialEffect?: Array<{year:number;amount:number}>;
  version: number;
  supersedesId?: EffectCommitmentId;
  createdAt: string;
  changeCompletedAt?: string;
  changeEvidence?: string;
}
