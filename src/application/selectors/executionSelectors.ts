import type { DemoState } from "../demoState";
import type { ExecutionNodeId, InitiativeId } from "../../domain";

export function prerequisiteGraph(
  state: DemoState,
  initiativeId: InitiativeId,
) {
  const included = new Set(
    Object.values(state.entities.executionNodes)
      .filter((node) => node.contextInitiativeIds.includes(initiativeId))
      .map((node) => node.id),
  );
  // Follow incoming relationships across ownership boundaries. Never follow unrelated successors.
  const dependencies = Object.values(state.entities.dependencies);
  const queue = [...included];
  while (queue.length) {
    const successorId = queue.shift()!;
    dependencies
      .filter((edge) => edge.successorNodeId === successorId)
      .forEach((edge) => {
        if (!included.has(edge.predecessorNodeId)) {
          included.add(edge.predecessorNodeId);
          queue.push(edge.predecessorNodeId);
        }
      });
  }
  const nodes = [...included].flatMap((id) =>
    state.entities.executionNodes[id]
      ? [state.entities.executionNodes[id]]
      : [],
  );
  const relevantDependencies = dependencies.filter(
    (edge) =>
      included.has(edge.predecessorNodeId) &&
      included.has(edge.successorNodeId),
  );
  return {
    nodes,
    dependencies: relevantDependencies,
    sourceRefs: [...included, ...relevantDependencies.map((edge) => edge.id)],
  };
}

export function topologicalExecutionOrder(
  state: DemoState,
  initiativeId: InitiativeId,
) {
  const graph = prerequisiteGraph(state, initiativeId);
  const blocking = graph.dependencies.filter((edge) => edge.blocking);
  const indegree = new Map(graph.nodes.map((node) => [node.id, 0]));
  blocking.forEach((edge) =>
    indegree.set(
      edge.successorNodeId,
      (indegree.get(edge.successorNodeId) ?? 0) + 1,
    ),
  );
  const levels: ExecutionNodeId[][] = [];
  let ready = [...indegree]
    .filter(([, count]) => count === 0)
    .map(([id]) => id)
    .sort();
  let visited = 0;
  while (ready.length) {
    levels.push(ready);
    visited += ready.length;
    const next: ExecutionNodeId[] = [];
    ready.forEach((id) =>
      blocking
        .filter((edge) => edge.predecessorNodeId === id)
        .forEach((edge) => {
          const count = (indegree.get(edge.successorNodeId) ?? 0) - 1;
          indegree.set(edge.successorNodeId, count);
          if (count === 0) next.push(edge.successorNodeId);
        }),
    );
    ready = next.sort();
  }
  return {
    valid: visited === graph.nodes.length,
    levels,
    sourceRefs: graph.sourceRefs,
  };
}

/** The same prerequisite gate is used by the start decision and its summaries. */
export function unavailableStartPrerequisites(state: DemoState, initiativeId: InitiativeId) {
  const graph = prerequisiteGraph(state, initiativeId);
  const prerequisiteIds = new Set(graph.dependencies
    .filter(edge => edge.blocking && edge.requiredAt === "NODE_START")
    .map(edge => edge.predecessorNodeId));
  return graph.nodes.filter(node => prerequisiteIds.has(node.id)
    && node.ownerInitiativeId !== initiativeId && node.availabilityStatus !== "AVAILABLE");
}

export function wouldCreateBlockingCycle(
  state: DemoState,
  predecessorNodeId: ExecutionNodeId,
  successorNodeId: ExecutionNodeId,
) {
  const adjacency = new Map<ExecutionNodeId, ExecutionNodeId[]>();
  Object.values(state.entities.dependencies)
    .filter((edge) => edge.blocking)
    .forEach((edge) => {
      adjacency.set(edge.predecessorNodeId, [
        ...(adjacency.get(edge.predecessorNodeId) ?? []),
        edge.successorNodeId,
      ]);
    });
  const visited = new Set<ExecutionNodeId>();
  const reachesPredecessor = (nodeId: ExecutionNodeId): boolean => {
    if (nodeId === predecessorNodeId) return true;
    if (visited.has(nodeId)) return false;
    visited.add(nodeId);
    return (adjacency.get(nodeId) ?? []).some(reachesPredecessor);
  };
  return reachesPredecessor(successorNodeId);
}

export function blockingChains(state: DemoState, initiativeId: InitiativeId) {
  const graph = prerequisiteGraph(state, initiativeId);
  return graph.nodes
    .filter((node) => node.availabilityStatus !== "AVAILABLE")
    .map((node) => {
      const direct = graph.dependencies.filter(
        (edge) => edge.blocking && edge.successorNodeId === node.id,
      );
      const indirect = new Set<ExecutionNodeId>();
      const walk = (id: ExecutionNodeId) =>
        graph.dependencies
          .filter((edge) => edge.blocking && edge.successorNodeId === id)
          .forEach((edge) => {
            indirect.add(edge.predecessorNodeId);
            walk(edge.predecessorNodeId);
          });
      direct.forEach((edge) => walk(edge.predecessorNodeId));
      return {
        node,
        directBlockerIds: direct.map((edge) => edge.predecessorNodeId),
        indirectBlockerIds: [...indirect],
        sourceRefs: [node.id, ...direct.map((edge) => edge.id)],
      };
    });
}

export function dependencyReadiness(
  state: DemoState,
  successorNodeId: ExecutionNodeId,
) {
  const relations = Object.values(state.entities.dependencies).filter(
    (edge) => edge.successorNodeId === successorNodeId,
  );
  const unresolved = relations.filter(
    (edge) =>
      state.entities.executionNodes[edge.predecessorNodeId]
        ?.availabilityStatus !== "AVAILABLE",
  );
  return {
    blockedBeforeStart: unresolved.filter(
      (edge) => edge.blocking && edge.requiredAt === "NODE_START",
    ),
    laterMilestones: unresolved.filter(
      (edge) => edge.blocking && edge.requiredAt === "MILESTONE",
    ),
    advisory: unresolved.filter((edge) => !edge.blocking),
    sourceRefs: relations.map((edge) => edge.id),
  };
}

export const reusedPrerequisites = (state: DemoState) =>
  Object.values(state.entities.executionNodes)
    .filter((node) => node.contextInitiativeIds.length > 1)
    .map((node) => ({
      node,
      initiativeIds: node.contextInitiativeIds,
      sourceRefs: [node.id, ...node.contextInitiativeIds],
    }));
