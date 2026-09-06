import {
  createEmptyDomainEntities,
  createId,
  qualificationConfiguration,
  type DomainEntities,
  type EntityMap,
} from "../domain";
import type { DemoState } from "../application/demoState";
import {
  businesses,
  businessAreas,
  organizationIds,
  organizationalUnits,
  organizations,
} from "./organizations";
import {
  mandates,
  people,
  positions,
  roleAssignments,
  roleDefinitions,
} from "./peopleAndRoles";
import {
  capabilities,
  decisionFunctions,
  fundingRuleVersions,
  fundingSources,
  steeringProfileVersions,
} from "./governanceConfiguration";
import { addStage2DemoData } from "./stage2DemoData";
import { addStage3DemoData } from "./stage3DemoData";
import { addTransformationDemoData } from "./transformationDemoData";

const toMap = <T extends { id: string }>(items: T[]): EntityMap<T> =>
  Object.fromEntries(
    items.map((item) => [item.id, structuredClone(item)]),
  ) as EntityMap<T>;

export const demoIds = {
  mainChallenge: createId("Challenge", "challenge-001"),
  controlChallenge: createId("Challenge", "challenge-002"),
  mainInitiative: createId("Initiative", "initiative-001"),
};

export function createDemoData(): DemoState {
  const entities: DomainEntities = {
    ...createEmptyDomainEntities(),
    organizations: toMap(organizations),
    organizationalUnits: toMap(organizationalUnits),
    businessAreas: toMap(businessAreas),
    businesses: toMap(businesses),
    people: toMap(people),
    positions: toMap(positions),
    roleDefinitions: toMap(roleDefinitions),
    roleAssignments: toMap(roleAssignments),
    mandates: toMap(mandates),
    decisionFunctions: toMap(decisionFunctions),
    capabilities: toMap(capabilities),
    fundingSources: toMap(fundingSources),
    fundingRuleVersions: toMap(fundingRuleVersions),
    steeringProfileVersions: toMap(steeringProfileVersions),
    qualificationConfigurations: toMap([qualificationConfiguration]),
  };

  entities.challenges[demoIds.mainChallenge] = {
    id: demoIds.mainChallenge,
    title: "Samordning av syntetiska serviceflöden",
    problemStatement:
      "Överlämningar mellan fiktiva verksamheter tar onödig tid.",
    currentState: "Flödet dokumenteras på olika sätt.",
    source: "Syntetisk intern observation",
    initiatorRoleAssignmentId: roleAssignments[0].id,
    strategicRelevance:
      "Relevant för den fiktiva organisationens serviceförmåga.",
    strategicHandlingReason: "Kräver samordning över organisatoriska gränser.",
    nominationStatus: "NOMINATED",
    relatedInitiativeIds: [demoIds.mainInitiative],
    createdAt: "2026-09-01T09:00:00Z",
  };
  entities.challenges[demoIds.controlChallenge] = {
    id: demoIds.controlChallenge,
    title: "Kontrollärende för syntetisk informationsdelning",
    problemStatement: "En fiktiv kontrollprocess saknar enhetlig återkoppling.",
    currentState: "Ärendet är nominerat men har inget initiativ.",
    source: "Syntetisk workshop",
    initiatorRoleAssignmentId: roleAssignments[1].id,
    strategicRelevance: "Ger testbar separation mellan ärenden.",
    strategicHandlingReason: "Ska inte sammanblandas med huvudärendet.",
    nominationStatus: "NOMINATED",
    relatedInitiativeIds: [],
    createdAt: "2026-09-02T09:00:00Z",
  };
  entities.initiatives[demoIds.mainInitiative] = {
    id: demoIds.mainInitiative,
    challengeId: demoIds.mainChallenge,
    title: "Gemensamt syntetiskt servicearbete",
    purpose: "Pröva ett gemensamt arbetssätt i demomiljön.",
    desiredEndState: "Tydliga och spårbara överlämningar.",
    initiativeKind: "VALUE_CREATING",
    scope: "Två fiktiva organisationer.",
    createdAt: "2026-09-03T09:00:00Z",
  };
  const participations = [
    {
      id: createId("Participation", "participation-001"),
      initiativeId: demoIds.mainInitiative,
      organizationId: organizationIds.north,
      businessId: businesses[0].id,
      participantKind: "INITIATOR" as const,
      validFrom: "2026-09-03",
    },
    {
      id: createId("Participation", "participation-002"),
      initiativeId: demoIds.mainInitiative,
      organizationId: organizationIds.south,
      businessId: businesses[1].id,
      participantKind: "EFFECT_RECIPIENT" as const,
      validFrom: "2026-09-03",
    },
    {
      id: createId("Participation", "participation-003"),
      initiativeId: demoIds.mainInitiative,
      organizationId: organizationIds.south,
      businessId: businesses[1].id,
      participantKind: "DELIVERY_PARTICIPANT" as const,
      validFrom: "2026-09-03",
    },
  ];
  entities.participations = toMap(participations);
  const allocation = {
    id: createId("ResourceAllocation", "allocation-001"),
    capabilityId: capabilities[0].id,
    roleAssignmentId: roleAssignments[1].id,
    initiativeId: demoIds.mainInitiative,
    period: { from: "2026-10-01", to: "2026-12-31" },
    amount: 0.25,
    unit: "FTE",
    fundingSourceId: fundingSources[0].id,
    status: "PLANNED" as const,
  };
  entities.resourceAllocations[allocation.id] = allocation;

  return addTransformationDemoData(addStage3DemoData(
    addStage2DemoData({
      entities,
      viewContext: {
        activeChallengeId: demoIds.mainChallenge,
        activeInitiativeId: demoIds.mainInitiative,
        selectedWorkspace: "CHALLENGES",
        selectedPerspective: {
          kind: "ORGANIZATION",
          organizationId: organizationIds.north,
        },
        workingSelectionIds: [],
      },
      audit: [],
      demoSession: {
        id: createId("DemoSession", "session-001"),
        startedAt: "2026-09-06T08:00:00Z",
        isSynthetic: true,
      },
    }),
  ));
}
