import type { InitiativeId, PriorityAssessment } from "../../domain";
import type { DemoState } from "../demoState";
import { currentEffectPotentials } from "./effectPotentialSelectors";
import {
  prerequisiteGraph,
  topologicalExecutionOrder,
} from "./executionSelectors";
import { blockingChains } from "./executionSelectors";
import { costBreakdownWithoutProjection, costsByOrigin } from "./costSelectors";

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
    effectPotentials: currentEffectPotentials(state, initiativeId),
    prerequisiteNodes: graph.nodes,
    dependencies: graph.dependencies,
    enablingInitiatives: [...ownerInitiativeIds].flatMap((id) =>
      state.entities.initiatives[id] ? [state.entities.initiatives[id]] : [],
    ),
    executionLevels: order.levels,
    blockerChains: blockingChains(state, initiativeId),
    costBreakdown: costBreakdownWithoutProjection(
      state,
      [initiativeId],
      "ESTIMATE",
    ),
    costEntries: costsByOrigin(state, [initiativeId]).filter(
      (entry) => entry.economicStatus === "ESTIMATE",
    ),
    sourceRefs: [challenge.id, initiative.id, ...graph.sourceRefs],
  };
}

export function strategicComparison(
  state: DemoState,
  steeringProfileVersionId?: import("../../domain").SteeringProfileVersionId,
) {
  const selectedProfileId =
    steeringProfileVersionId ??
    Object.values(state.entities.steeringProfileVersions).find(
      (profile) => profile.status === "ACTIVE",
    )?.id;
  const latestByInitiative = new Map<InitiativeId, PriorityAssessment>();
  Object.values(state.entities.priorityAssessments).forEach((assessment) => {
    if (assessment.steeringProfileVersionId !== selectedProfileId) return;
    const current = latestByInitiative.get(assessment.initiativeId);
    if (!current || assessment.assessedAt > current.assessedAt) {
      latestByInitiative.set(assessment.initiativeId, assessment);
    }
  });
  return [...latestByInitiative.values()]
    .flatMap((assessment) => {
      const initiative = state.entities.initiatives[assessment.initiativeId];
      if (!initiative || initiative.initiativeKind !== "VALUE_CREATING")
        return [];
      const profile =
        state.entities.steeringProfileVersions[
          assessment.steeringProfileVersionId
        ];
      const assessedPotentials = assessment.effectPotentialIds.flatMap((id) =>
        state.entities.effectPotentials[id]
          ? [state.entities.effectPotentials[id]]
          : [],
      );
      const latestPotentials = currentEffectPotentials(state, initiative.id);
      const assessedIds = new Set(assessedPotentials.map((item) => item.id));
      return [
        {
          initiative,
          assessment,
          profile,
          potentials: assessedPotentials,
          latestPotentials,
          needsReassessment: latestPotentials.some(
            (item) => !assessedIds.has(item.id),
          ),
          blockers: blockingChains(state, initiative.id),
          sourceRefs: [
            initiative.id,
            assessment.id,
            profile.id,
            ...assessment.effectPotentialIds,
          ],
        },
      ];
    })
    .sort((a, b) => b.assessment.totalScore - a.assessment.totalScore);
}
