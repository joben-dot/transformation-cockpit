import type { Period } from "./common";
import type {
  AvailableCapacityId,
  CapabilityId,
  CapacityDemandId,
  DependencyId,
  ExecutionNodeId,
  FundingSourceId,
  InitiativeId,
  OrganizationalUnitId,
  ResourceAllocationId,
  RoleAssignmentId,
} from "./ids";

export interface Capability {
  id: CapabilityId;
  name: string;
  description: string;
}
export interface ResourceAllocation {
  id: ResourceAllocationId;
  capabilityId: CapabilityId;
  roleAssignmentId?: RoleAssignmentId;
  organizationalUnitId?: OrganizationalUnitId;
  initiativeId: InitiativeId;
  period: Period;
  amount: number;
  unit: string;
  fundingSourceId?: FundingSourceId;
  status: "PLANNED" | "CONFIRMED" | "RELEASED";
}
export type AvailabilityStatus =
  | "AVAILABLE"
  | "PLANNED"
  | "BLOCKED"
  | "UNKNOWN";
export interface ExecutionNode {
  id: ExecutionNodeId;
  ownerInitiativeId?: InitiativeId;
  capabilityId?: CapabilityId;
  contextInitiativeIds: InitiativeId[];
  title: string;
  description: string;
  nodeKind:
    | "EXISTING_CAPABILITY"
    | "ENABLING_DELIVERY"
    | "BUSINESS_CHANGE"
    | "LOCAL_ADOPTION"
    | "FOLLOW_UP_PREPARATION";
  responsibleRoleAssignmentId?: RoleAssignmentId;
  plannedPeriod: Period;
  neededAt: string;
  availabilityCriteria: string;
  availabilityStatus: AvailabilityStatus;
  availabilityEvidenceRefs: string[];
  availabilityVerifiedAt?: string;
}
export interface Dependency {
  id: DependencyId;
  predecessorNodeId: ExecutionNodeId;
  successorNodeId: ExecutionNodeId;
  dependencyType: "FINISH_TO_START" | "MILESTONE" | "ADVISORY";
  requiredDeliverable: string;
  blocking: boolean;
  requiredAt: "NODE_START" | "MILESTONE";
  rationale: string;
  sourceRefs: string[];
}
export interface CapacityDemand {
  id: CapacityDemandId;
  initiativeId: InitiativeId;
  executionNodeId: ExecutionNodeId;
  capabilityId: CapabilityId;
  poolReference: string;
  period: Period;
  amount: number;
  unit: string;
}
export interface AvailableCapacity {
  id: AvailableCapacityId;
  capabilityId: CapabilityId;
  poolReference: string;
  period: Period;
  amount: number;
  unit: string;
  sourceRefs: string[];
  capacitySourceId?: string;
  resourceUnitIds?: string[];
  assessmentVersion?: number;
  supersedesAvailableCapacityId?: AvailableCapacityId;
}
