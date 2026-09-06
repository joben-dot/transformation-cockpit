import type { IsoDate, IsoDateTime } from "./common";
import type {
  DataSourceId,
  MeasurementPlanId,
  MeasurementPointId,
  MetricDefinitionId,
  RoleAssignmentId,
} from "./ids";

export interface MetricDefinition {
  id: MetricDefinitionId;
  name: string;
  unit: string;
  direction: "HIGHER_IS_BETTER" | "LOWER_IS_BETTER";
}
export interface DataSource {
  id: DataSourceId;
  name: string;
  description: string;
  isSynthetic: boolean;
}
export interface MeasurementPlan {
  id: MeasurementPlanId;
  metricDefinitionId: MetricDefinitionId;
  dataSourceId: DataSourceId;
  frequency: string;
  responsibleRoleAssignmentId: RoleAssignmentId;
}
export interface MeasurementPoint {
  evidenceReference?: string;
  qualityObservation?: string;
  qualityMet?: boolean;
  decisionVersionId?: string;
  id: MeasurementPointId;
  measurementPlanId: MeasurementPlanId;
  measuredAt: IsoDate;
  value: number;
  verifiedAt?: IsoDateTime;
  verifiedByRoleAssignmentId?: RoleAssignmentId;
}
