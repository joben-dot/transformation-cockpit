import { describe, expect, it } from "vitest";
import { createId, type RoleAssignmentId } from "../../domain";
import { baseDemoState } from "../../tests/fixtures/baseDemoState";
import { demoReducer } from "../demoReducer";
import { stage3Ids } from "../../demo-data/stage3DemoData";
import {
  blockingChains,
  dependencyReadiness,
  prerequisiteGraph,
  reusedPrerequisites,
  topologicalExecutionOrder,
  wouldCreateBlockingCycle,
} from "./executionSelectors";
const meta = (state: ReturnType<typeof baseDemoState>, token: string) => ({
  commandId: createId("Command", token),
  actorRoleAssignmentId: Object.keys(
    state.entities.roleAssignments,
  )[0] as RoleAssignmentId,
  issuedAt: "2026-10-20T10:00:00Z",
});
describe("riktad förutsättningsgraf", () => {
  it("har tio referensnoder och de tio angivna blockerande relationerna", () => {
    const graph = prerequisiteGraph(baseDemoState(), stage3Ids.valueInitiative);
    expect(graph.nodes).toHaveLength(10);
    expect(graph.dependencies).toHaveLength(10);
  });
  it("topologiskt sorterar alla noder och visar parallella grenar", () => {
    const result = topologicalExecutionOrder(
      baseDemoState(),
      stage3Ids.valueInitiative,
    );
    expect(result.valid).toBe(true);
    expect(result.levels.flat()).toHaveLength(10);
    expect(result.levels.some((level) => level.length > 1)).toBe(true);
  });
  it("härleder direkta och indirekta blockerare", () => {
    const result = blockingChains(baseDemoState(), stage3Ids.valueInitiative);
    expect(result.some((item) => item.directBlockerIds.length > 0)).toBe(true);
    expect(result.some((item) => item.indirectBlockerIds.length > 0)).toBe(
      true,
    );
  });
  it("återanvänder samma gemensamma nod utan kopia", () => {
    const shared = reusedPrerequisites(baseDemoState()).find(
      (item) => item.node.id === stage3Ids.sharedNode,
    )!;
    expect(shared.initiativeIds).toEqual(
      expect.arrayContaining([
        stage3Ids.valueInitiative,
        stage3Ids.reuseInitiative,
      ]),
    );
  });
  it("avvisar självreferens atomärt", () => {
    const state = baseDemoState();
    const result = demoReducer(state, {
      ...meta(state, "self-edge"),
      commandType: "ADD_DEPENDENCY",
      targetId: createId("Dependency", "self-edge"),
      payload: {
        predecessorNodeId: stage3Ids.sharedNode,
        successorNodeId: stage3Ids.sharedNode,
        dependencyType: "FINISH_TO_START",
        requiredDeliverable: "Syntetisk leverans",
        blocking: true,
        requiredAt: "NODE_START",
        rationale: "Ogiltig",
        sourceRefs: [],
      },
    });
    expect(result.success).toBe(false);
    expect(result.nextState).toBe(state);
  });
  it("avvisar en blockerande cykel atomärt", () => {
    const state = baseDemoState();
    const graph = prerequisiteGraph(state, stage3Ids.valueInitiative);
    const result = demoReducer(state, {
      ...meta(state, "cycle-edge"),
      commandType: "ADD_DEPENDENCY",
      targetId: createId("Dependency", "cycle-edge"),
      payload: {
        predecessorNodeId: graph.nodes[8].id,
        successorNodeId: graph.nodes[1].id,
        dependencyType: "FINISH_TO_START",
        requiredDeliverable: "Cykel",
        blocking: true,
        requiredAt: "NODE_START",
        rationale: "Ogiltig",
        sourceRefs: [],
      },
    });
    expect(result.success).toBe(false);
    expect(result.nextState).toBe(state);
  });
  it("ändrad prioriteringspoäng muterar inte grafen", () => {
    const state = baseDemoState();
    const before = structuredClone(state.entities.dependencies);
    Object.values(state.entities.priorityAssessments)[0].totalScore = 1;
    expect(state.entities.dependencies).toEqual(before);
  });
  it("tillgänglig teknisk nod skapar varken effektåtagande eller startbeslut", () => {
    const state = baseDemoState();
    expect(
      Object.values(state.entities.executionNodes).some(
        (n) => n.availabilityStatus === "AVAILABLE",
      ),
    ).toBe(true);
    expect(state.entities.effectCommitments).toEqual({});
    expect(state.entities.humanDecisions).toEqual({});
  });
});

describe("transitiv återanvändning över initiativgränser", () => {
  const graphState = () => {
    const state = baseDemoState();
    state.entities.executionNodes = {};
    state.entities.dependencies = {};
    const initiatives = Object.keys(
      state.entities.initiatives,
    ) as import("../../domain").InitiativeId[];
    const [initiativeX, ownerF, ownerE, reuseInitiative] = initiatives;
    const actor = Object.keys(
      state.entities.roleAssignments,
    )[0] as RoleAssignmentId;
    const makeNode = (
      token: string,
      ownerInitiativeId: import("../../domain").InitiativeId,
      contextInitiativeIds: import("../../domain").InitiativeId[],
      status: import("../../domain").AvailabilityStatus,
    ) => {
      const id = createId("ExecutionNode", `transitive-${token}`);
      state.entities.executionNodes[id] = {
        id,
        ownerInitiativeId,
        contextInitiativeIds,
        title: `Nod ${token.toUpperCase()}`,
        description: "Syntetisk nod",
        nodeKind: "ENABLING_DELIVERY",
        responsibleRoleAssignmentId: actor,
        plannedPeriod: { from: "2027-01-01", to: "2027-03-31" },
        neededAt: "2027-03-31",
        availabilityCriteria: "Syntetiskt kriterium",
        availabilityStatus: status,
        availabilityEvidenceRefs: [],
      };
      return id;
    };
    const e = makeNode("e", ownerE, [reuseInitiative], "BLOCKED");
    const f = makeNode("f", ownerF, [reuseInitiative], "PLANNED");
    const g = makeNode("g", initiativeX, [initiativeX], "PLANNED");
    const unrelated = makeNode("unrelated", ownerF, [ownerF], "PLANNED");
    const addEdge = (
      token: string,
      predecessorNodeId: typeof e,
      successorNodeId: typeof e,
      requiredAt: "NODE_START" | "MILESTONE" = "NODE_START",
      blocking = true,
    ) => {
      const id = createId("Dependency", `transitive-${token}`);
      state.entities.dependencies[id] = {
        id,
        predecessorNodeId,
        successorNodeId,
        dependencyType:
          requiredAt === "MILESTONE"
            ? "MILESTONE"
            : blocking
              ? "FINISH_TO_START"
              : "ADVISORY",
        requiredDeliverable: "Syntetisk leverans",
        blocking,
        requiredAt,
        rationale: "Syntetiskt beroende",
        sourceRefs: ["SYNTHETIC-TRANSITIVE"],
      };
      return id;
    };
    addEdge("e-f", e, f);
    addEdge("f-g", f, g);
    addEdge("f-unrelated", f, unrelated);
    return { state, initiativeX, reuseInitiative, e, f, g, unrelated, addEdge };
  };

  it("inkluderar G, F och E transitivt utan kopior eller orelaterade efterföljare", () => {
    const { state, initiativeX, e, f, g, unrelated } = graphState();
    const graph = prerequisiteGraph(state, initiativeX);
    expect(graph.nodes.map((node) => node.id)).toEqual(
      expect.arrayContaining([g, f, e]),
    );
    expect(graph.nodes.map((node) => node.id)).not.toContain(unrelated);
    expect(graph.nodes.find((node) => node.id === e)?.ownerInitiativeId).toBe(
      state.entities.executionNodes[e].ownerInitiativeId,
    );
    expect(state.entities.executionNodes[e]).toMatchObject({
      responsibleRoleAssignmentId: expect.any(String),
      neededAt: "2027-03-31",
    });
    expect(new Set(graph.nodes.map((node) => node.id)).size).toBe(
      graph.nodes.length,
    );
    const chains = blockingChains(state, initiativeX);
    expect(
      chains.find((chain) => chain.node.id === g)?.indirectBlockerIds,
    ).toContain(e);
  });

  it("låter ett annat initiativ återanvända samma E och F med original-ID", () => {
    const { state, reuseInitiative, e, f } = graphState();
    const graph = prerequisiteGraph(state, reuseInitiative);
    expect(graph.nodes.map((node) => node.id)).toEqual(
      expect.arrayContaining([e, f]),
    );
    expect(state.entities.executionNodes[e].id).toBe(e);
  });

  it("upptäcker cykel över initiativgränser oavsett visningsurval", () => {
    const { state, e, g } = graphState();
    expect(wouldCreateBlockingCycle(state, g, e)).toBe(true);
  });

  it("skiljer startblockerare, senare milstolpe och rådgivande relation", () => {
    const { state, g, unrelated, addEdge } = graphState();
    addEdge("milestone-g", unrelated, g, "MILESTONE", true);
    const advisoryNode = createId("ExecutionNode", "transitive-advice");
    state.entities.executionNodes[advisoryNode] = {
      ...state.entities.executionNodes[unrelated],
      id: advisoryNode,
      title: "Rådgivande nod",
    };
    addEdge("advice-g", advisoryNode, g, "NODE_START", false);
    const readiness = dependencyReadiness(state, g);
    expect(readiness.blockedBeforeStart).toHaveLength(1);
    expect(readiness.laterMilestones).toHaveLength(1);
    expect(readiness.advisory).toHaveLength(1);
  });
});
