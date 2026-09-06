import type { IsoDate } from "./common";
import type {
  BusinessId,
  DecisionFunctionId,
  MandateId,
  OrganizationId,
  OrganizationalUnitId,
  PersonId,
  PositionId,
  RoleAssignmentId,
  RoleDefinitionId,
} from "./ids";

export interface Person {
  id: PersonId;
  displayName: string;
  isSynthetic: boolean;
}
export interface Position {
  id: PositionId;
  organizationId: OrganizationId;
  organizationalUnitId?: OrganizationalUnitId;
  name: string;
}
export type RoleKind =
  | "INITIATOR"
  | "OWNER"
  | "DECISION_MAKER"
  | "SPECIALIST"
  | "OBSERVER";
export interface RoleDefinition {
  id: RoleDefinitionId;
  name: string;
  roleKind: RoleKind;
}
export interface RoleAssignment {
  id: RoleAssignmentId;
  personId: PersonId;
  roleDefinitionId: RoleDefinitionId;
  positionId?: PositionId;
  organizationId: OrganizationId;
  organizationalUnitId?: OrganizationalUnitId;
  businessId?: BusinessId;
  validFrom: IsoDate;
  validTo?: IsoDate;
}
export interface Mandate {
  id: MandateId;
  roleAssignmentId: RoleAssignmentId;
  scope: string;
  validFrom: IsoDate;
  validTo?: IsoDate;
  decisionFunctionId?: DecisionFunctionId;
}
