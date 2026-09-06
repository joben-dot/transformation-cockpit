import type { InitiativeId, PriorityAssessment } from "../../domain";
import type { DemoState } from "../demoState";
import { effectPotentialsByInitiative } from "./effectPotentialSelectors";
import {
  prerequisiteGraph,
  topologicalExecutionOrder,
} from "./executionSelectors";
import { blockingChains } from "./executionSelectors";
import { costBreakdownWithoutProjection, costsByOrigin } from "./costSelectors";

function currentPotentials(state: DemoState, initiativeId: InitiativeId) {
  const current = new Map<
    string,
    ReturnType<typeof effectPotentialsByInitiative>[number]
  >();
  effectPotentialsByInitiative(state, initiativeId).forEach((item) => {
    const key = `${item.category}:${item.effectMeasureCode}:${item.unit}`;
    const previous = current.get(key);
    if (!previous || item.assessmentVersion > previous.assessmentVersion) {
      current.set(key, item);
    }
  });
  return [...current.values()];
}

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
    effectPotentials: currentPotentials(state, initiativeId),
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

export function strategicComparison(state: DemoState) {
  const latestByInitiative = new Map<InitiativeId, PriorityAssessment>();
  Object.values(state.entities.priorityAssessments).forEach((assessment) => {
    const current = latestByInitiative.get(assessment.initiativeId);
    const assessmentProfile =
      state.entities.steeringProfileVersions[
        assessment.steeringProfileVersionId
      ];
    const currentProfile = current
      ? state.entities.steeringProfileVersions[current.steeringProfileVersionId]
      : undefined;
    if (
      !current ||
      assessmentProfile.versionNumber > (currentProfile?.versionNumber ?? 0) ||
      (assessmentProfile.versionNumber === currentProfile?.versionNumber &&
        assessment.assessedAt > current.assessedAt)
    ) {
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
      return [
        {
          initiative,
          assessment,
          profile,
          potentials: currentPotentials(state, initiative.id),
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
