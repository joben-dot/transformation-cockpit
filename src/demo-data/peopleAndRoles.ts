import {
  createId,
  priorityReviewMandateScope,
  type Mandate,
  type Person,
  type Position,
  type RoleAssignment,
  type RoleDefinition,
} from "../domain";
import { businessIds, organizationIds, unitIds } from "./organizations";

export const people = [
  {
    id: createId("Person", "person-001"),
    displayName: "Alex Exempel",
    isSynthetic: true,
  },
  {
    id: createId("Person", "person-002"),
    displayName: "Robin Demo",
    isSynthetic: true,
  },
] satisfies Person[];
export const positions = [
  {
    id: createId("Position", "position-001"),
    organizationId: organizationIds.north,
    organizationalUnitId: unitIds.northService,
    name: "Processledare",
  },
  {
    id: createId("Position", "position-002"),
    organizationId: organizationIds.south,
    organizationalUnitId: unitIds.southDevelopment,
    name: "Utvecklingsledare",
  },
] satisfies Position[];
export const roleDefinitions = [
  {
    id: createId("RoleDefinition", "role-001"),
    name: "Initiativtagare",
    roleKind: "INITIATOR",
  },
  {
    id: createId("RoleDefinition", "role-002"),
    name: "Specialist",
    roleKind: "SPECIALIST",
  },
  {
    id: createId("RoleDefinition", "role-003"),
    name: "Portföljgranskare",
    roleKind: "DECISION_MAKER",
  },
] satisfies RoleDefinition[];
export const roleAssignments = [
  {
    id: createId("RoleAssignment", "assignment-001"),
    personId: people[0].id,
    roleDefinitionId: roleDefinitions[0].id,
    positionId: positions[0].id,
    organizationId: organizationIds.north,
    organizationalUnitId: unitIds.northService,
    businessId: businessIds.intake,
    validFrom: "2026-01-01",
  },
  {
    id: createId("RoleAssignment", "assignment-002"),
    personId: people[1].id,
    roleDefinitionId: roleDefinitions[1].id,
    positionId: positions[1].id,
    organizationId: organizationIds.south,
    organizationalUnitId: unitIds.southDevelopment,
    businessId: businessIds.response,
    validFrom: "2026-01-01",
  },
  {
    id: createId("RoleAssignment", "assignment-003"),
    personId: people[0].id,
    roleDefinitionId: roleDefinitions[2].id,
    positionId: positions[0].id,
    organizationId: organizationIds.north,
    organizationalUnitId: unitIds.northService,
    validFrom: "2026-01-01",
    validTo: "2027-12-31",
  },
] satisfies RoleAssignment[];
export const mandates = [
  {
    id: createId("Mandate", "mandate-001"),
    roleAssignmentId: roleAssignments[0].id,
    scope: "Nominera syntetiska strategiska utmaningar",
    validFrom: "2026-01-01",
  },
  {
    id: createId("Mandate", "mandate-002"),
    roleAssignmentId: roleAssignments[1].id,
    scope: "Tilldela syntetisk specialistkapacitet",
    validFrom: "2026-01-01",
  },
  {
    id: createId("Mandate", "mandate-003"),
    roleAssignmentId: roleAssignments[2].id,
    scope: priorityReviewMandateScope,
    validFrom: "2026-01-01",
    validTo: "2027-12-31",
  },
] satisfies Mandate[];
