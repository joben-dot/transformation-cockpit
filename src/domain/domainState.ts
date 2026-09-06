import type { EntityMap } from "./common";
import type { StrategicChallenge } from "./challenge";
import type { AllocationRuleVersion, CostAllocation, CostEntry } from "./costs";
import type {
  ChangeProposal,
  DecisionVersion,
  HumanDecision,
  PriorityAssessment,
} from "./decisions";
import type {
  EffectForecast,
  EffectOwnerAcceptance,
  EffectPotential,
  LocalEffectCommitment,
  Baseline,
} from "./effects";
import type {
  CapacityDemand,
  AvailableCapacity,
  Capability,
  Dependency,
  ExecutionNode,
  ResourceAllocation,
} from "./execution";
import type { AuditEntryId } from "./ids";
import type { Initiative } from "./initiative";
import type { LearningRecord, ScalingCandidate } from "./learning";
import type {
  DataSource,
  MeasurementPlan,
  MeasurementPoint,
  MetricDefinition,
} from "./measurement";
import type {
  Business,
  BusinessArea,
  LegalOrganization,
  OrganizationalUnit,
} from "./organization";
import type { Participation } from "./participation";
import type {
  CompletionRequirement,
  QualificationConfigurationVersion,
  QualificationAssessment,
} from "./qualification";
import type {
  QualityRequirement,
  RequirementAssessment,
  SafeguardMeasure,
} from "./requirements";
import type {
  DecisionFunction,
  FundingRuleVersion,
  FundingSource,
  SteeringProfileVersion,
} from "./governance";
import type {
  Mandate,
  Person,
  Position,
  RoleAssignment,
  RoleDefinition,
} from "./roles";

export interface AuditEntry {
  id: AuditEntryId;
  commandId: string;
  commandType: string;
  actorRoleAssignmentId: string;
  issuedAt: string;
  affectedEntityIds: string[];
}

export interface DomainEntities {
  organizations: EntityMap<LegalOrganization>;
  organizationalUnits: EntityMap<OrganizationalUnit>;
  businessAreas: EntityMap<BusinessArea>;
  businesses: EntityMap<Business>;
  people: EntityMap<Person>;
  positions: EntityMap<Position>;
  roleDefinitions: EntityMap<RoleDefinition>;
  roleAssignments: EntityMap<RoleAssignment>;
  mandates: EntityMap<Mandate>;
  decisionFunctions: EntityMap<DecisionFunction>;
  capabilities: EntityMap<Capability>;
  resourceAllocations: EntityMap<ResourceAllocation>;
  challenges: EntityMap<StrategicChallenge>;
  initiatives: EntityMap<Initiative>;
  participations: EntityMap<Participation>;
  qualificationAssessments: EntityMap<QualificationAssessment>;
  qualificationConfigurations: EntityMap<QualificationConfigurationVersion>;
  completionRequirements: EntityMap<CompletionRequirement>;
  effectPotentials: EntityMap<EffectPotential>;
  effectCommitments: EntityMap<LocalEffectCommitment>;
  effectOwnerAcceptances: EntityMap<EffectOwnerAcceptance>;
  baselines: EntityMap<Baseline>;
  metricDefinitions: EntityMap<MetricDefinition>;
  dataSources: EntityMap<DataSource>;
  measurementPlans: EntityMap<MeasurementPlan>;
  measurementPoints: EntityMap<MeasurementPoint>;
  effectForecasts: EntityMap<EffectForecast>;
  executionNodes: EntityMap<ExecutionNode>;
  dependencies: EntityMap<Dependency>;
  capacityDemands: EntityMap<CapacityDemand>;
  availableCapacities: EntityMap<AvailableCapacity>;
  costEntries: EntityMap<CostEntry>;
  costAllocations: EntityMap<CostAllocation>;
  allocationRuleVersions: EntityMap<AllocationRuleVersion>;
  fundingSources: EntityMap<FundingSource>;
  fundingRuleVersions: EntityMap<FundingRuleVersion>;
  qualityRequirements: EntityMap<QualityRequirement>;
  safeguardMeasures: EntityMap<SafeguardMeasure>;
  requirementAssessments: EntityMap<RequirementAssessment>;
  steeringProfileVersions: EntityMap<SteeringProfileVersion>;
  priorityAssessments: EntityMap<PriorityAssessment>;
  humanDecisions: EntityMap<HumanDecision>;
  decisionVersions: EntityMap<DecisionVersion>;
  changeProposals: EntityMap<ChangeProposal>;
  learningRecords: EntityMap<LearningRecord>;
  scalingCandidates: EntityMap<ScalingCandidate>;
}

export function createEmptyDomainEntities(): DomainEntities {
  return {
    organizations: {},
    organizationalUnits: {},
    businessAreas: {},
    businesses: {},
    people: {},
    positions: {},
    roleDefinitions: {},
    roleAssignments: {},
    mandates: {},
    decisionFunctions: {},
    capabilities: {},
    resourceAllocations: {},
    challenges: {},
    initiatives: {},
    participations: {},
    qualificationAssessments: {},
    qualificationConfigurations: {},
    completionRequirements: {},
    effectPotentials: {},
    effectCommitments: {},
    effectOwnerAcceptances: {},
    baselines: {},
    metricDefinitions: {},
    dataSources: {},
    measurementPlans: {},
    measurementPoints: {},
    effectForecasts: {},
    executionNodes: {},
    dependencies: {},
    capacityDemands: {},
    availableCapacities: {},
    costEntries: {},
    costAllocations: {},
    allocationRuleVersions: {},
    fundingSources: {},
    fundingRuleVersions: {},
    qualityRequirements: {},
    safeguardMeasures: {},
    requirementAssessments: {},
    steeringProfileVersions: {},
    priorityAssessments: {},
    humanDecisions: {},
    decisionVersions: {},
    changeProposals: {},
    learningRecords: {},
    scalingCandidates: {},
  };
}
