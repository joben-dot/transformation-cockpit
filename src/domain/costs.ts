import type { Period } from "./common";
import type {
  AllocationRuleVersionId,
  BusinessId,
  CostAllocationId,
  CostEntryId,
  ExecutionNodeId,
  FundingRuleVersionId,
  FundingSourceId,
  InitiativeId,
  OrganizationId,
  RoleAssignmentId,
} from "./ids";

export type CostCategory =
  | "COMMON_INVESTMENT"
  | "LOCAL_CONNECTION"
  | "DATA_INFORMATION"
  | "BUSINESS_CHANGE"
  | "TRAINING"
  | "OPERATIONS";
export type EconomicStatus = "ESTIMATE" | "BUDGET" | "FORECAST" | "ACTUAL";
export interface CostEntry {
  id: CostEntryId;
  initiativeId: InitiativeId;
  executionNodeId: ExecutionNodeId;
  originReference: string;
  category: CostCategory;
  period: Period;
  amount: number;
  currency: "SEK";
  economicStatus: EconomicStatus;
  recurrence: "ONE_TIME" | "RECURRING_ANNUAL";
  sourceRefs: string[];
  assessedByRoleAssignmentId: RoleAssignmentId;
  assessmentVersion: number;
  supersedesCostEntryId?: CostEntryId;
}
export interface CostAllocation {
  id: CostAllocationId;
  costEntryId: CostEntryId;
  organizationId?: OrganizationId;
  businessId?: BusinessId;
  recipientInitiativeId?: InitiativeId;
  allocatedAmount: number;
  share: number;
  dimension: "ORGANIZATION" | "INITIATIVE";
  allocationRuleVersionId: AllocationRuleVersionId;
  scenarioId: string;
}
export interface AllocationRuleVersion {
  id: AllocationRuleVersionId;
  versionNumber: number;
  name: string;
  method: "POPULATION" | "EQUAL" | "FIXED_AND_SIZE";
  fixedShare?: number;
  recipientWeights: Record<string, number>;
  status: "DRAFT" | "ACTIVE" | "RETIRED";
  demoAssumption: "Ej beslutad – används endast i demo.";
  createdAt: string;
}
export interface CostFunding {
  costEntryId: CostEntryId;
  fundingSourceId: FundingSourceId;
  fundingRuleVersionId: FundingRuleVersionId;
}
