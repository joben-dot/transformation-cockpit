import type {
  QualityRequirementId,
  RequirementAssessmentId,
  RoleAssignmentId,
  SafeguardMeasureId,
  InitiativeId,
} from "./ids";

export interface QualityRequirement {
  id: QualityRequirementId;
  initiativeId: InitiativeId;
  description: string;
  mandatory: boolean;
}
export interface SafeguardMeasure {
  id: SafeguardMeasureId;
  initiativeId: InitiativeId;
  name: string;
  limitDescription: string;
}
export interface RequirementAssessment {
  id: RequirementAssessmentId;
  initiativeId: InitiativeId;
  qualityRequirementId?: QualityRequirementId;
  safeguardMeasureId?: SafeguardMeasureId;
  assessorRoleAssignmentId: RoleAssignmentId;
  result: "MET" | "NOT_MET" | "NOT_ASSESSED";
}
