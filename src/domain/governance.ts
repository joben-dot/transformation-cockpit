import type { IsoDate, IsoDateTime, RecordStatus } from "./common";
import type {
  DecisionFunctionId,
  FundingRuleVersionId,
  FundingSourceId,
  SteeringProfileVersionId,
} from "./ids";

export interface DecisionFunction {
  id: DecisionFunctionId;
  name: string;
  mandateDescription: string;
  demoAssumption: string;
}
export interface FundingSource {
  id: FundingSourceId;
  name: string;
  isSynthetic: boolean;
}
export interface FundingRuleVersion {
  id: FundingRuleVersionId;
  fundingSourceId: FundingSourceId;
  validFrom: IsoDate;
  allocationPrinciple: string;
  status: RecordStatus;
}
export interface PriorityCriterionDefinition {
  code: string;
  name: string;
  description: string;
  required: boolean;
}
export interface SteeringProfileVersion {
  id: SteeringProfileVersionId;
  profileName: string;
  versionNumber: number;
  validFrom: IsoDate;
  validTo?: IsoDate;
  status: "DRAFT" | "ACTIVE" | "RETIRED";
  decidedByDecisionFunctionId?: DecisionFunctionId;
  criteria: PriorityCriterionDefinition[];
  weights: Record<string, number>;
  thresholds: { start: number; investigate: number; wait: number };
  weightSumRule: number;
  createdAt: IsoDateTime;
  demoAssumption: string;
}

export const priorityReviewMandateScope = "PRIORITY_ASSESSMENT_REVIEW";
