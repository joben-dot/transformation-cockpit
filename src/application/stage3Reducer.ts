import { createId, type AuditEntry } from "../domain";
import type { Command } from "./commands";
import type { CommandResult } from "./commandResult";
import type { DemoState } from "./demoState";
import { calculateAllocationForRule } from "./selectors/costSelectors";
import { wouldCreateBlockingCycle } from "./selectors/executionSelectors";
import { validateStage3State } from "./validateStage3State";

const stage3Types = new Set([
  "CREATE_EXECUTION_NODE",
  "UPDATE_EXECUTION_NODE",
  "RECORD_NODE_AVAILABILITY",
  "ADD_DEPENDENCY",
  "REMOVE_DEPENDENCY",
  "REGISTER_CAPACITY_DEMAND",
  "REGISTER_AVAILABLE_CAPACITY",
  "CHANGE_CAPACITY_PERIOD",
  "REGISTER_COST_ENTRY",
  "CREATE_ALLOCATION_RULE_VERSION",
  "CALCULATE_COST_ALLOCATION",
]);
const fail = (state: DemoState, description: string): CommandResult => ({
  success: false,
  nextState: state,
  errors: [{ code: "INVALID_PAYLOAD", description }],
  affectedEntityIds: [],
});
export function reduceStage3Command(
  state: DemoState,
  command: Command,
): CommandResult | undefined {
  if (!stage3Types.has(command.commandType)) return undefined;
  if (!state.entities.roleAssignments[command.actorRoleAssignmentId])
    return fail(state, "Aktörens rollrelation saknas.");
  const next = structuredClone(state) as DemoState;
  const affected: string[] = [];
  switch (command.commandType) {
    case "CREATE_EXECUTION_NODE":
      if (state.entities.executionNodes[command.targetId])
        return fail(state, "Genomförandenodens ID används redan.");
      if (
        command.payload.ownerInitiativeId &&
        !state.entities.initiatives[command.payload.ownerInitiativeId]
      )
        return fail(state, "Ansvarigt initiativ saknas.");
      if (
        command.payload.contextInitiativeIds.some(
          (id) => !state.entities.initiatives[id],
        )
      )
        return fail(state, "Nodens initiativkontext saknas.");
      next.entities.executionNodes[command.targetId] = {
        id: command.targetId,
        ...command.payload,
      };
      affected.push(command.targetId);
      break;
    case "UPDATE_EXECUTION_NODE":
    case "RECORD_NODE_AVAILABILITY": {
      const node = next.entities.executionNodes[command.targetId];
      if (!node) return fail(state, "Genomförandenoden saknas.");
      Object.assign(node, command.payload);
      affected.push(node.id);
      break;
    }
    case "ADD_DEPENDENCY": {
      const edge = command.payload;
      if (edge.predecessorNodeId === edge.successorNodeId)
        return fail(state, "En nod kan inte bero på sig själv.");
      if (
        !state.entities.executionNodes[edge.predecessorNodeId] ||
        !state.entities.executionNodes[edge.successorNodeId]
      )
        return fail(state, "Beroendets nodreferens saknas.");
      if (
        Object.values(state.entities.dependencies).some(
          (item) =>
            item.predecessorNodeId === edge.predecessorNodeId &&
            item.successorNodeId === edge.successorNodeId &&
            item.blocking === edge.blocking,
        )
      )
        return fail(state, "Ett identiskt beroende finns redan.");
      if (
        edge.blocking &&
        wouldCreateBlockingCycle(
          state,
          edge.predecessorNodeId,
          edge.successorNodeId,
        )
      )
        return fail(state, "Beroendet skulle skapa en blockerande cykel.");
      next.entities.dependencies[command.targetId] = {
        id: command.targetId,
        ...edge,
      };
      affected.push(
        command.targetId,
        edge.predecessorNodeId,
        edge.successorNodeId,
      );
      break;
    }
    case "REMOVE_DEPENDENCY":
      if (!next.entities.dependencies[command.targetId])
        return fail(state, "Beroendet saknas.");
      else {
        delete next.entities.dependencies[command.targetId];
        affected.push(command.targetId);
      }
      break;
    case "REGISTER_CAPACITY_DEMAND":
      if (
        !state.entities.executionNodes[command.payload.executionNodeId] ||
        !state.entities.capabilities[command.payload.capabilityId]
      )
        return fail(state, "Kapacitetsbehovets referens saknas.");
      next.entities.capacityDemands[command.targetId] = {
        id: command.targetId,
        ...command.payload,
      };
      affected.push(command.targetId);
      break;
    case "REGISTER_AVAILABLE_CAPACITY":
      if (!state.entities.capabilities[command.payload.capabilityId])
        return fail(state, "Kapacitetsförmågan saknas.");
      if (command.payload.supersedesAvailableCapacityId) {
        const replaced =
          state.entities.availableCapacities[
            command.payload.supersedesAvailableCapacityId
          ];
        if (!replaced)
          return fail(state, "Kapacitetsunderlaget som ska ersättas saknas.");
        if (
          replaced.capabilityId !== command.payload.capabilityId ||
          replaced.poolReference !== command.payload.poolReference ||
          replaced.unit !== command.payload.unit ||
          replaced.capacitySourceId !== command.payload.capacitySourceId
        )
          return fail(
            state,
            "Ersättningen måste avse samma kapacitetskälla, pool och enhet.",
          );
        if (
          (command.payload.assessmentVersion ?? 0) <=
          (replaced.assessmentVersion ?? 0)
        )
          return fail(state, "Ersättningen måste ha en högre version.");
      }
      next.entities.availableCapacities[command.targetId] = {
        id: command.targetId,
        ...command.payload,
      };
      affected.push(command.targetId);
      break;
    case "CHANGE_CAPACITY_PERIOD": {
      const demand = next.entities.capacityDemands[command.targetId];
      if (!demand) return fail(state, "Kapacitetsbehovet saknas.");
      demand.period = command.payload.period;
      affected.push(demand.id);
      break;
    }
    case "REGISTER_COST_ENTRY":
      if (state.entities.costEntries[command.targetId])
        return fail(state, "Kostnadspostens ID används redan.");
      if (
        command.payload.economicStatus !== "ACTUAL" &&
        Object.values(state.entities.costEntries).some(
          (item) =>
            item.economicStatus !== "ACTUAL" &&
            item.originReference === command.payload.originReference &&
            item.economicStatus === command.payload.economicStatus &&
            item.period.from === command.payload.period.from &&
            item.period.to === command.payload.period.to &&
            item.assessmentVersion >= command.payload.assessmentVersion,
        )
      )
        return fail(
          state,
          "En lika ny eller nyare bedömningsversion finns redan för kostnadsposten.",
        );
      if (!state.entities.executionNodes[command.payload.executionNodeId])
        return fail(state, "Kostnadens genomförandenod saknas.");
      next.entities.costEntries[command.targetId] = {
        id: command.targetId,
        ...command.payload,
        assessedByRoleAssignmentId: command.actorRoleAssignmentId,
      };
      affected.push(command.targetId);
      break;
    case "CREATE_ALLOCATION_RULE_VERSION":
      next.entities.allocationRuleVersions[command.targetId] = {
        id: command.targetId,
        ...command.payload,
        createdAt: command.issuedAt,
      };
      affected.push(command.targetId);
      break;
    case "CALCULATE_COST_ALLOCATION": {
      const cost = state.entities.costEntries[command.targetId];
      const rule =
        state.entities.allocationRuleVersions[command.payload.ruleVersionId];
      if (!cost || !rule)
        return fail(state, "Kostnad eller allokeringsregel saknas.");
      (
        Object.keys(
          next.entities.costAllocations,
        ) as import("../domain").CostAllocationId[]
      )
        .filter(
          (id) =>
            next.entities.costAllocations[id].costEntryId === cost.id &&
            next.entities.costAllocations[id].scenarioId ===
              command.payload.scenarioId,
        )
        .forEach((id) => delete next.entities.costAllocations[id]);
      calculateAllocationForRule(cost.amount, rule).forEach((part, index) => {
        const id = createId(
          "CostAllocation",
          `${command.commandId}-${index}`.replace(/[^a-z0-9-]/gi, "-"),
        );
        next.entities.costAllocations[id] = {
          id,
          costEntryId: cost.id,
          organizationId:
            command.payload.dimension === "ORGANIZATION"
              ? (part.recipientId as never)
              : undefined,
          recipientInitiativeId:
            command.payload.dimension === "INITIATIVE"
              ? (part.recipientId as never)
              : undefined,
          allocatedAmount: part.allocatedAmount,
          share: part.share,
          dimension: command.payload.dimension,
          allocationRuleVersionId: rule.id,
          scenarioId: command.payload.scenarioId,
        };
        affected.push(id);
      });
      affected.push(cost.id, rule.id);
      break;
    }
  }
  const validationErrors = validateStage3State(next);
  if (validationErrors.length) return fail(state, validationErrors[0]);
  const audit: AuditEntry = {
    id: createId("AuditEntry", command.commandId.replace(/[^a-z0-9-]/gi, "-")),
    commandId: command.commandId,
    commandType: command.commandType,
    actorRoleAssignmentId: command.actorRoleAssignmentId,
    issuedAt: command.issuedAt,
    affectedEntityIds: affected,
  };
  next.audit.push(audit);
  return { success: true, nextState: next, affectedEntityIds: affected };
}
