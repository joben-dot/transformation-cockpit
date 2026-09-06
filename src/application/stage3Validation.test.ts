import { describe, expect, it } from "vitest";
import { createId, type RoleAssignmentId } from "../domain";
import { stage3Ids } from "../demo-data/stage3DemoData";
import { baseDemoState } from "../tests/fixtures/baseDemoState";
import { demoReducer } from "./demoReducer";
import { costsByOrigin } from "./selectors/costSelectors";
const actor = (state: ReturnType<typeof baseDemoState>) =>
  Object.keys(state.entities.roleAssignments)[0] as RoleAssignmentId;
describe("gemensam valideringsgrund för etapp 3", () => {
  it("avvisar omvänd kapacitetsperiod atomärt", () => {
    const state = baseDemoState();
    const audit = state.audit.length;
    const result = demoReducer(state, {
      commandId: createId("Command", "invalid-reversed-capacity"),
      actorRoleAssignmentId: actor(state),
      issuedAt: "2027-01-01T10:00:00Z",
      commandType: "CHANGE_CAPACITY_PERIOD",
      targetId: stage3Ids.capacityDemand,
      payload: { period: { from: "2027-03-31", to: "2027-01-01" } },
    });
    expect(result.success).toBe(false);
    expect(result.nextState).toBe(state);
    expect(state.audit).toHaveLength(audit);
  });
  it("avvisar kostnad med okänt initiativ atomärt", () => {
    const state = baseDemoState();
    const template = state.entities.costEntries[stage3Ids.sharedCost];
    const {
      id: _id,
      assessedByRoleAssignmentId: _actor,
      ...payload
    } = template;
    void _id;
    void _actor;
    const result = demoReducer(state, {
      commandId: createId("Command", "unknown-cost-initiative"),
      actorRoleAssignmentId: actor(state),
      issuedAt: "2027-01-01T10:00:00Z",
      commandType: "REGISTER_COST_ENTRY",
      targetId: createId("CostEntry", "unknown-initiative"),
      payload: {
        ...payload,
        initiativeId: createId("Initiative", "does-not-exist"),
        originReference: "UNKNOWN-INITIATIVE-COST",
      },
    });
    expect(result.success).toBe(false);
    expect(result.nextState).toBe(state);
    expect(
      state.entities.costEntries[createId("CostEntry", "unknown-initiative")],
    ).toBeUndefined();
  });
});

it("registrerar ersättande kostnadsbedömning med ändrad period utan dubbelräkning", () => {
  const state = baseDemoState();
  const original = state.entities.costEntries[stage3Ids.sharedCost];
  const id = createId("CostEntry", "replacement-command-regression");
  const result = demoReducer(state, {
    commandId: createId("Command", "replacement-command-regression"),
    actorRoleAssignmentId: actor(state),
    issuedAt: "2027-01-01T10:00:00Z",
    commandType: "REGISTER_COST_ENTRY",
    targetId: id,
    payload: {
      initiativeId: original.initiativeId,
      executionNodeId: original.executionNodeId,
      originReference: original.originReference,
      category: original.category,
      period: { from: "2027-01-01", to: "2027-12-31" },
      amount: 1_000_000,
      currency: "SEK",
      economicStatus: original.economicStatus,
      recurrence: original.recurrence,
      sourceRefs: ["SYNTHETIC-REPLACEMENT"],
      assessmentVersion: 2,
      supersedesCostEntryId: original.id,
    },
  });
  expect(result.success).toBe(true);
  expect(
    costsByOrigin(result.nextState, [stage3Ids.valueInitiative])
      .filter((entry) => entry.originReference === original.originReference)
      .reduce((sum, entry) => sum + entry.amount, 0),
  ).toBe(1_000_000);
});
