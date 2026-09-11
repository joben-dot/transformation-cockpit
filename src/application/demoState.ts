import type {
  AuditEntry,
  ChallengeId,
  DemoSessionId,
  DomainEntities,
  InitiativeId,
  OrganizationId,
} from "../domain";

export type Workspace =
  | "CHALLENGES"
  | "QUALIFICATION"
  | "PRIORITIZATION"
  | "DELIVERY"
  | "EFFECTS"
  | "LEARNING";
export type ViewPerspective =
  | { kind: "ORGANIZATION"; organizationId: OrganizationId }
  | { kind: "FEDERATED" };

export interface ViewContext {
  activeChallengeId?: ChallengeId;
  activeInitiativeId?: InitiativeId;
  selectedWorkspace: Workspace;
  selectedPerspective: ViewPerspective;
  workingSelectionIds: string[];
  activeScenarioId?: string;
}

export interface DemoSession {
  id: DemoSessionId;
  startedAt: string;
  isSynthetic: true;
}

export interface DemoState {
  entities: DomainEntities;
  viewContext: ViewContext;
  audit: AuditEntry[];
  demoSession: DemoSession;
}
