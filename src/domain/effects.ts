import type { EffectKind, IsoDate, IsoDateTime } from "./common";
import type {
  BaselineId,
  BusinessId,
  EffectCommitmentId,
  EffectForecastId,
  EffectOwnerAcceptanceId,
  EffectPotentialId,
  InitiativeId,
  MeasurementPlanId,
  MetricDefinitionId,
  RoleAssignmentId,
} from "./ids";

export type PotentialCategory = EffectKind | "OTHER_BUSINESS_EFFECT";
export interface MonetizationAssumption {
  hourlyValue: number;
  disposition: string;
  period: string;
  sourceRef: string;
  assessedByRoleAssignmentId: RoleAssignmentId;
}
export interface EffectPotential {
  id: EffectPotentialId;
  initiativeId: InitiativeId;
  recipientBusinessId?: BusinessId;
  recipientScenario?: string;
  category: PotentialCategory;
  effectMeasureCode: string;
  unit: string;
  lowerBound: number;
  expectedValue: number;
  upperBound: number;
  evidenceRefs: string[];
  assumptions: string[];
  uncertainty: "LOW" | "MEDIUM" | "HIGH";
  realizationWindow: string;
  earliestPossibleEffectDate: IsoDate;
  fullPotentialDate: IsoDate;
  scope: "LOCAL" | "FEDERATED_SCENARIO";
  assessedByRoleAssignmentIds: RoleAssignmentId[];
  assessedAt: IsoDateTime;
  assessmentVersion: number;
  monetizationAssumption?: MonetizationAssumption;
}
export interface LocalEffectCommitment {
  id: EffectCommitmentId;
  initiativeId: InitiativeId;
  recipientBusinessId: BusinessId;
  baselineId: BaselineId;
  measurementPlanId: MeasurementPlanId;
  targetValue: number;
  unit: string;
}
export interface EffectOwnerAcceptance {
  id: EffectOwnerAcceptanceId;
  effectCommitmentId: EffectCommitmentId;
  ownerRoleAssignmentId: RoleAssignmentId;
  mandateDescription: string;
  acceptedAt: IsoDateTime;
}
export interface Baseline {
  id: BaselineId;
  initiativeId: InitiativeId;
  businessId: BusinessId;
  metricDefinitionId: MetricDefinitionId;
  value: number;
  measuredAt: IsoDate;
  verified: boolean;
}
export interface EffectForecast {
  id: EffectForecastId;
  effectCommitmentId: EffectCommitmentId;
  forecastValue: number;
  forecastDate: IsoDate;
  recordedAt: IsoDateTime;
}

export const effectPotentialLabel =
  "Bedömd potential – inte beslutad effekthemtagning.";
