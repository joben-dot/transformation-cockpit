import type { DemoState } from "./demoState";
import { topologicalExecutionOrder } from "./selectors/executionSelectors";
export function validateStage3State(state: DemoState): string[] {
  const errors: string[] = [];
  Object.values(state.entities.executionNodes).forEach((node) => {
    if (
      node.ownerInitiativeId &&
      !state.entities.initiatives[node.ownerInitiativeId]
    )
      errors.push(`Nod ${node.id} saknar ansvarigt initiativ.`);
    if (node.capabilityId && !state.entities.capabilities[node.capabilityId])
      errors.push(`Nod ${node.id} saknar förmåga.`);
    node.contextInitiativeIds.forEach((id) => {
      if (!state.entities.initiatives[id])
        errors.push(`Nod ${node.id} saknar kontextinitiativ.`);
    });
  });
  Object.values(state.entities.dependencies).forEach((edge) => {
    if (
      !state.entities.executionNodes[edge.predecessorNodeId] ||
      !state.entities.executionNodes[edge.successorNodeId]
    )
      errors.push(`Beroende ${edge.id} saknar nod.`);
    if (edge.predecessorNodeId === edge.successorNodeId)
      errors.push(`Beroende ${edge.id} är självrefererande.`);
  });
  Object.values(state.entities.availableCapacities).forEach((capacity) => {
    if (capacity.period.from > capacity.period.to)
      errors.push(`Kapacitetsunderlag ${capacity.id} har ogiltig period.`);
    if (capacity.amount < 0 || !Number.isFinite(capacity.amount))
      errors.push(`Kapacitetsunderlag ${capacity.id} har ogiltig mängd.`);
    if (
      capacity.supersedesAvailableCapacityId &&
      !state.entities.availableCapacities[
        capacity.supersedesAvailableCapacityId
      ]
    )
      errors.push(
        `Kapacitetsunderlag ${capacity.id} ersätter ett underlag som saknas.`,
      );
  });
  Object.values(state.entities.capacityDemands).forEach((demand) => {
    if (!state.entities.initiatives[demand.initiativeId])
      errors.push(`Kapacitetsbehov ${demand.id} saknar initiativ.`);
    if (!state.entities.executionNodes[demand.executionNodeId])
      errors.push(`Kapacitetsbehov ${demand.id} saknar genomförandenod.`);
    if (!state.entities.capabilities[demand.capabilityId])
      errors.push(`Kapacitetsbehov ${demand.id} saknar förmåga.`);
    if (demand.period.from > demand.period.to)
      errors.push(`Kapacitetsbehov ${demand.id} har ogiltig period.`);
    if (demand.amount < 0 || !Number.isFinite(demand.amount))
      errors.push(`Kapacitetsbehov ${demand.id} har ogiltig mängd.`);
  });
  Object.keys(state.entities.initiatives).forEach((id) => {
    if (!topologicalExecutionOrder(state, id as never).valid)
      errors.push(`Initiativ ${id} har blockerande cykel.`);
  });
  Object.values(state.entities.costEntries).forEach((entry) => {
    if (!state.entities.initiatives[entry.initiativeId])
      errors.push(`Kostnadspost ${entry.id} saknar initiativ.`);
    if (!state.entities.executionNodes[entry.executionNodeId])
      errors.push(`Kostnadspost ${entry.id} saknar genomförandenod.`);
    if (entry.period.from > entry.period.to)
      errors.push(`Kostnadspost ${entry.id} har ogiltig period.`);
    if (entry.amount < 0 || !Number.isFinite(entry.amount))
      errors.push(`Kostnadspost ${entry.id} har ogiltigt belopp.`);
    if (
      entry.supersedesCostEntryId &&
      !state.entities.costEntries[entry.supersedesCostEntryId]
    )
      errors.push(`Kostnadspost ${entry.id} ersätter en post som saknas.`);
    const duplicateVersion = Object.values(state.entities.costEntries).find(
      (candidate) =>
        candidate.id !== entry.id &&
        candidate.economicStatus !== "ACTUAL" &&
        candidate.originReference === entry.originReference &&
        candidate.economicStatus === entry.economicStatus &&
        candidate.period.from === entry.period.from &&
        candidate.period.to === entry.period.to &&
        candidate.assessmentVersion === entry.assessmentVersion,
    );
    if (duplicateVersion)
      errors.push(
        `Kostnadspost ${entry.id} har en dubblerad bedömningsversion.`,
      );
  });
  const groups = new Map<string, number>();
  Object.values(state.entities.costAllocations).forEach((part) => {
    if (
      !state.entities.costEntries[part.costEntryId] ||
      !state.entities.allocationRuleVersions[part.allocationRuleVersionId]
    )
      errors.push(`Allokering ${part.id} saknar referens.`);
    if (
      part.organizationId &&
      !state.entities.organizations[part.organizationId]
    )
      errors.push(`Allokering ${part.id} har ogiltig mottagare.`);
    const key = `${part.costEntryId}:${part.scenarioId}:${part.dimension}`;
    groups.set(key, (groups.get(key) ?? 0) + part.allocatedAmount);
  });
  groups.forEach((amount, key) => {
    const entry = state.entities.costEntries[key.split(":")[0] as never];
    if (entry && amount > entry.amount)
      errors.push(`Allokering ${key} överstiger kostnaden.`);
  });
  return errors;
}
