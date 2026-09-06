import type { DemoState } from "../application/demoState";
import { createId, type ExecutionNode, type Dependency } from "../domain";
import { stage2Ids } from "./stage2DemoData";
import { roleAssignments } from "./peopleAndRoles";
import { capabilities } from "./governanceConfiguration";
import { organizationIds } from "./organizations";

export const stage3Ids = {
  valueInitiative: stage2Ids.calculatedInitiative,
  reuseInitiative: stage2Ids.acceptedInitiative,
  enablingInitiative: createId("Initiative", "initiative-enabling-data"),
  sharedNode: createId("ExecutionNode", "shared-data-environment"),
  sharedCost: createId("CostEntry", "shared-environment-origin"),
  capacityDemand: createId("CapacityDemand", "analysis-demand-main"),
};
const labels = [
  [
    "identity-access",
    "Befintlig identitets- och åtkomstförmåga",
    "EXISTING_CAPABILITY",
    "AVAILABLE",
  ],
  [
    "information-classification",
    "Informationsklassning och bedömning av dataanvändning",
    "ENABLING_DELIVERY",
    "PLANNED",
  ],
  [
    "data-quality",
    "Datakvalitet och gemensamma begrepp",
    "ENABLING_DELIVERY",
    "BLOCKED",
  ],
  [
    "source-integration",
    "Anslutning av relevanta datakällor",
    "ENABLING_DELIVERY",
    "PLANNED",
  ],
  [
    "shared-data-environment",
    "Gemensam datamiljö",
    "ENABLING_DELIVERY",
    "PLANNED",
  ],
  [
    "quality-data",
    "Kvalitetssäkrat och åtkomligt dataunderlag",
    "ENABLING_DELIVERY",
    "BLOCKED",
  ],
  [
    "planning-support",
    "Verksamhetsnära analys- och planeringsstöd",
    "ENABLING_DELIVERY",
    "BLOCKED",
  ],
  [
    "changed-practices",
    "Förändrade arbetssätt och utbildning",
    "BUSINESS_CHANGE",
    "PLANNED",
  ],
  [
    "local-adoption",
    "Lokalt införande av nytt arbetssätt",
    "LOCAL_ADOPTION",
    "BLOCKED",
  ],
  [
    "follow-up",
    "Förberedd lokal uppföljningsförmåga",
    "FOLLOW_UP_PREPARATION",
    "BLOCKED",
  ],
] as const;
const edgePairs = [
  [1, 2],
  [1, 3],
  [0, 4],
  [2, 5],
  [3, 5],
  [4, 5],
  [5, 6],
  [6, 8],
  [7, 8],
  [5, 9],
] as const;
export function addStage3DemoData(state: DemoState) {
  const challengeId = createId("Challenge", "challenge-enabling-data");
  state.entities.challenges[challengeId] = {
    id: challengeId,
    title: "Gemensam syntetisk informationsförmåga",
    problemStatement: "Fiktiva initiativ saknar en delad datamiljö.",
    currentState: "Separata syntetiska informationsflöden.",
    source: "Syntetisk analys",
    initiatorRoleAssignmentId: roleAssignments[1].id,
    strategicRelevance: "Återanvändbar möjliggörare.",
    strategicHandlingReason: "Flera initiativ berörs.",
    nominationStatus: "NOMINATED",
    relatedInitiativeIds: [stage3Ids.enablingInitiative],
    createdAt: "2026-09-20T08:00:00Z",
  };
  state.entities.initiatives[stage3Ids.enablingInitiative] = {
    id: stage3Ids.enablingInitiative,
    challengeId,
    title: "Gemensam syntetisk datamiljö",
    purpose: "Tillhandahålla en återanvändbar teknisk förutsättning.",
    desiredEndState: "Verifierat tillgänglig delad miljö.",
    initiativeKind: "ENABLING",
    scope: "Fiktiv gemensam IT-leverans.",
    createdAt: "2026-09-20T09:00:00Z",
  };
  const nodes = labels.map(
    ([token, title, nodeKind, availabilityStatus], index): ExecutionNode => ({
      id: createId("ExecutionNode", token),
      ownerInitiativeId:
        token === "shared-data-environment"
          ? stage3Ids.enablingInitiative
          : stage3Ids.valueInitiative,
      capabilityId:
        token === "identity-access" ? capabilities[0].id : undefined,
      contextInitiativeIds:
        token === "shared-data-environment"
          ? [stage3Ids.valueInitiative, stage3Ids.reuseInitiative]
          : [stage3Ids.valueInitiative],
      title,
      description: `Syntetisk förutsättning ${title.toLocaleLowerCase("sv-SE")}.`,
      nodeKind,
      responsibleRoleAssignmentId:
        index === 2 ? undefined : roleAssignments[index % 2].id,
      plannedPeriod: {
        from: `2026-${index < 5 ? "10" : "11"}-01`,
        to: `2026-${index < 5 ? "10" : "11"}-28`,
      },
      neededAt: index < 5 ? "2026-10-31" : "2026-11-30",
      availabilityCriteria:
        "Dokumenterad leverans och verifierat tillgänglighetsunderlag.",
      availabilityStatus,
      availabilityEvidenceRefs:
        availabilityStatus === "AVAILABLE" ? ["SYNTHETIC-EVIDENCE-A"] : [],
      availabilityVerifiedAt:
        availabilityStatus === "AVAILABLE" ? "2026-09-01T10:00:00Z" : undefined,
    }),
  );
  nodes.forEach((node) => (state.entities.executionNodes[node.id] = node));
  edgePairs.forEach(([from, to], index) => {
    const edge: Dependency = {
      id: createId("Dependency", `reference-${index + 1}`),
      predecessorNodeId: nodes[from].id,
      successorNodeId: nodes[to].id,
      dependencyType: "FINISH_TO_START",
      requiredDeliverable: `${nodes[from].title} ska uppfylla dokumenterade tillgänglighetskriterier.`,
      blocking: true,
      requiredAt: "NODE_START",
      rationale: `Leveransen behövs innan ${nodes[to].title.toLocaleLowerCase("sv-SE")}.`,
      sourceRefs: ["SYNTHETIC-GRAPH-BASIS"],
    };
    state.entities.dependencies[edge.id] = edge;
  });
  state.entities.availableCapacities[
    createId("AvailableCapacity", "analysis-pool-q4")
  ] = {
    id: createId("AvailableCapacity", "analysis-pool-q4"),
    capabilityId: capabilities[1].id,
    poolReference: "SYNTHETIC-ANALYSIS-POOL",
    period: { from: "2026-10-01", to: "2026-12-31" },
    amount: 1,
    unit: "FTE",
    sourceRefs: ["SYNTHETIC-CAPACITY-PLAN"],
    capacitySourceId: "SYNTHETIC-ANALYSIS-POOL-PLAN",
    resourceUnitIds: ["SYNTHETIC-ANALYST-CAPACITY"],
    assessmentVersion: 1,
  };
  [
    [stage3Ids.capacityDemand, stage3Ids.valueInitiative, nodes[6].id, 0.7],
    [
      createId("CapacityDemand", "analysis-demand-reuse"),
      stage3Ids.reuseInitiative,
      stage3Ids.sharedNode,
      0.6,
    ],
  ].forEach(([id, initiativeId, executionNodeId, amount]) => {
    state.entities.capacityDemands[id as never] = {
      id: id as never,
      initiativeId: initiativeId as never,
      executionNodeId: executionNodeId as never,
      capabilityId: capabilities[1].id,
      poolReference: "SYNTHETIC-ANALYSIS-POOL",
      period: { from: "2026-10-01", to: "2026-12-31" },
      amount: amount as number,
      unit: "FTE",
    };
  });
  const rules = [
    [
      "population",
      "Fiktiv invånarbaserad",
      "POPULATION",
      { [organizationIds.north]: 42000, [organizationIds.south]: 28000 },
    ],
    [
      "equal",
      "Lika fördelning",
      "EQUAL",
      { [organizationIds.north]: 1, [organizationIds.south]: 1 },
    ],
    [
      "mixed",
      "Fast och storleksbaserad",
      "FIXED_AND_SIZE",
      { [organizationIds.north]: 60, [organizationIds.south]: 40 },
    ],
  ] as const;
  rules.forEach(([token, name, method, recipientWeights], index) => {
    const id = createId("AllocationRuleVersion", token);
    state.entities.allocationRuleVersions[id] = {
      id,
      versionNumber: index + 1,
      name,
      method,
      fixedShare: method === "FIXED_AND_SIZE" ? 0.3 : undefined,
      recipientWeights,
      status: index === 0 ? "ACTIVE" : "DRAFT",
      demoAssumption: "Ej beslutad – används endast i demo.",
      createdAt: "2026-09-20T10:00:00Z",
    };
  });
  const costSpecs = [
    [
      stage3Ids.sharedCost,
      stage3Ids.enablingInitiative,
      stage3Ids.sharedNode,
      "SHARED-ENVIRONMENT",
      "COMMON_INVESTMENT",
      900000,
      "ONE_TIME",
    ],
    [
      createId("CostEntry", "local-connection"),
      stage3Ids.valueInitiative,
      nodes[3].id,
      "LOCAL-CONNECTION",
      "LOCAL_CONNECTION",
      180000,
      "ONE_TIME",
    ],
    [
      createId("CostEntry", "data-quality"),
      stage3Ids.valueInitiative,
      nodes[2].id,
      "DATA-QUALITY",
      "DATA_INFORMATION",
      240000,
      "ONE_TIME",
    ],
    [
      createId("CostEntry", "training"),
      stage3Ids.valueInitiative,
      nodes[7].id,
      "TRAINING",
      "TRAINING",
      120000,
      "ONE_TIME",
    ],
    [
      createId("CostEntry", "operations"),
      stage3Ids.enablingInitiative,
      stage3Ids.sharedNode,
      "SHARED-OPERATIONS",
      "OPERATIONS",
      150000,
      "RECURRING_ANNUAL",
    ],
  ] as const;
  costSpecs.forEach(
    ([
      id,
      initiativeId,
      executionNodeId,
      originReference,
      category,
      amount,
      recurrence,
    ]) =>
      (state.entities.costEntries[id] = {
        id,
        initiativeId,
        executionNodeId,
        originReference,
        category,
        period: { from: "2026-10-01", to: "2026-12-31" },
        amount,
        currency: "SEK",
        economicStatus: "ESTIMATE",
        recurrence,
        sourceRefs: ["SYNTHETIC-COST-BASIS"],
        assessedByRoleAssignmentId: roleAssignments[1].id,
        assessmentVersion: 1,
      }),
  );
  return state;
}
