export type Brand<T, Name extends string> = T & { readonly __brand: Name };

export const idTypes = [
  "Organization",
  "OrganizationalUnit",
  "BusinessArea",
  "Business",
  "Person",
  "Position",
  "RoleDefinition",
  "RoleAssignment",
  "Mandate",
  "DecisionFunction",
  "Capability",
  "ResourceAllocation",
  "Challenge",
  "Initiative",
  "Participation",
  "QualificationAssessment",
  "QualificationConfiguration",
  "CompletionRequirement",
  "EffectPotential",
  "EffectCommitment",
  "EffectOwnerAcceptance",
  "Baseline",
  "MetricDefinition",
  "DataSource",
  "MeasurementPlan",
  "MeasurementPoint",
  "EffectForecast",
  "ExecutionNode",
  "Dependency",
  "CapacityDemand",
  "AvailableCapacity",
  "CostEntry",
  "CostAllocation",
  "AllocationRuleVersion",
  "FundingSource",
  "FundingRuleVersion",
  "QualityRequirement",
  "SafeguardMeasure",
  "RequirementAssessment",
  "SteeringProfileVersion",
  "PriorityAssessment",
  "HumanDecision",
  "DecisionVersion",
  "ChangeProposal",
  "LearningRecord",
  "ScalingCandidate",
  "AuditEntry",
  "Command",
  "DemoSession",
] as const;

export type IdKind = (typeof idTypes)[number];
export type DomainId<K extends IdKind> = Brand<string, `${K}Id`>;

export type OrganizationId = DomainId<"Organization">;
export type OrganizationalUnitId = DomainId<"OrganizationalUnit">;
export type BusinessAreaId = DomainId<"BusinessArea">;
export type BusinessId = DomainId<"Business">;
export type PersonId = DomainId<"Person">;
export type PositionId = DomainId<"Position">;
export type RoleDefinitionId = DomainId<"RoleDefinition">;
export type RoleAssignmentId = DomainId<"RoleAssignment">;
export type MandateId = DomainId<"Mandate">;
export type DecisionFunctionId = DomainId<"DecisionFunction">;
export type CapabilityId = DomainId<"Capability">;
export type ResourceAllocationId = DomainId<"ResourceAllocation">;
export type ChallengeId = DomainId<"Challenge">;
export type InitiativeId = DomainId<"Initiative">;
export type ParticipationId = DomainId<"Participation">;
export type QualificationAssessmentId = DomainId<"QualificationAssessment">;
export type QualificationConfigurationId =
  DomainId<"QualificationConfiguration">;
export type CompletionRequirementId = DomainId<"CompletionRequirement">;
export type EffectPotentialId = DomainId<"EffectPotential">;
export type EffectCommitmentId = DomainId<"EffectCommitment">;
export type EffectOwnerAcceptanceId = DomainId<"EffectOwnerAcceptance">;
export type BaselineId = DomainId<"Baseline">;
export type MetricDefinitionId = DomainId<"MetricDefinition">;
export type DataSourceId = DomainId<"DataSource">;
export type MeasurementPlanId = DomainId<"MeasurementPlan">;
export type MeasurementPointId = DomainId<"MeasurementPoint">;
export type EffectForecastId = DomainId<"EffectForecast">;
export type ExecutionNodeId = DomainId<"ExecutionNode">;
export type DependencyId = DomainId<"Dependency">;
export type CapacityDemandId = DomainId<"CapacityDemand">;
export type AvailableCapacityId = DomainId<"AvailableCapacity">;
export type CostEntryId = DomainId<"CostEntry">;
export type CostAllocationId = DomainId<"CostAllocation">;
export type AllocationRuleVersionId = DomainId<"AllocationRuleVersion">;
export type FundingSourceId = DomainId<"FundingSource">;
export type FundingRuleVersionId = DomainId<"FundingRuleVersion">;
export type QualityRequirementId = DomainId<"QualityRequirement">;
export type SafeguardMeasureId = DomainId<"SafeguardMeasure">;
export type RequirementAssessmentId = DomainId<"RequirementAssessment">;
export type SteeringProfileVersionId = DomainId<"SteeringProfileVersion">;
export type PriorityAssessmentId = DomainId<"PriorityAssessment">;
export type HumanDecisionId = DomainId<"HumanDecision">;
export type DecisionVersionId = DomainId<"DecisionVersion">;
export type ChangeProposalId = DomainId<"ChangeProposal">;
export type LearningRecordId = DomainId<"LearningRecord">;
export type ScalingCandidateId = DomainId<"ScalingCandidate">;
export type AuditEntryId = DomainId<"AuditEntry">;
export type CommandId = DomainId<"Command">;
export type DemoSessionId = DomainId<"DemoSession">;

const prefixes: Record<IdKind, string> = Object.fromEntries(
  idTypes.map((kind) => [
    kind,
    kind.replace(/([a-z])([A-Z])/g, "$1-$2").toUpperCase(),
  ]),
) as Record<IdKind, string>;

export function createId<K extends IdKind>(
  kind: K,
  stableToken: string,
): DomainId<K> {
  if (!/^[a-z0-9-]+$/i.test(stableToken)) {
    throw new Error(
      "ID tokens may only contain letters, numbers, and hyphens.",
    );
  }
  return `${prefixes[kind]}-DEMO-${stableToken}` as DomainId<K>;
}
