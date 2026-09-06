import type { InitiativeId } from "../../domain";
import type { DemoState } from "../demoState";
import { effectPotentialsByInitiative } from "./effectPotentialSelectors";
import {
  prerequisiteGraph,
  topologicalExecutionOrder,
} from "./executionSelectors";

/**
 * Composes the first product story from normalized entities. It deliberately
 * returns no decision, commitment or realized-effect projection.
 */
export function referenceStory(state: DemoState, initiativeId: InitiativeId) {
  const initiative = state.entities.initiatives[initiativeId];
  if (!initiative) return undefined;

  const challenge = state.entities.challenges[initiative.challengeId];
  const graph = prerequisiteGraph(state, initiativeId);
  const order = topologicalExecutionOrder(state, initiativeId);
  const ownerInitiativeIds = new Set<InitiativeId>(
    graph.nodes.flatMap((node) =>
      node.ownerInitiativeId ? [node.ownerInitiativeId] : [],
    ),
  );
  ownerInitiativeIds.delete(initiativeId);

  return {
    challenge,
    initiative,
    effectPotentials: effectPotentialsByInitiative(state, initiativeId),
    prerequisiteNodes: graph.nodes,
    dependencies: graph.dependencies,
    enablingInitiatives: [...ownerInitiativeIds].flatMap((id) =>
      state.entities.initiatives[id] ? [state.entities.initiatives[id]] : [],
    ),
    executionLevels: order.levels,
    sourceRefs: [challenge.id, initiative.id, ...graph.sourceRefs],
  };
}
