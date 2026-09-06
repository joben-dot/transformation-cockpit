import { describe, expect, it } from "vitest";
import { createId, type RoleAssignmentId } from "../../domain";
import { stage3Ids } from "../../demo-data/stage3DemoData";
import { baseDemoState } from "../../tests/fixtures/baseDemoState";
import { demoReducer } from "../demoReducer";
import { capacityStatus, capacityTimeline } from "./capacitySelectors";
describe("kapacitet över tid", () => {
  it("visar konflikt för överlappande behov i samma pool", () =>
    expect(
      capacityStatus(baseDemoState(), stage3Ids.valueInitiative)[0].status,
    ).toBe("CONFLICT"));
  it("räknar om till okänd, inte konfliktfri, efter flytt till period utan tillgänglighet", () => {
    const state = baseDemoState();
    const priority = structuredClone(state.entities.priorityAssessments);
    const result = demoReducer(state, {
      commandId: createId("Command", "move-demand-test"),
      actorRoleAssignmentId: Object.keys(
        state.entities.roleAssignments,
      )[0] as RoleAssignmentId,
      issuedAt: "2026-10-20T10:00:00Z",
      commandType: "CHANGE_CAPACITY_PERIOD",
      targetId: stage3Ids.capacityDemand,
      payload: { period: { from: "2027-01-01", to: "2027-03-31" } },
    });
    expect(result.success).toBe(true);
    expect(
      capacityStatus(result.nextState, stage3Ids.valueInitiative)[0].status,
    ).toBe("UNKNOWN");
    expect(result.nextState.entities.priorityAssessments).toEqual(priority);
    expect(result.nextState.entities.resourceAllocations).toEqual(
      state.entities.resourceAllocations,
    );
  });
  it("icke överlappande behov skapar inte falsk konflikt", () => {
    const state = baseDemoState();
    const other = Object.values(state.entities.capacityDemands).find(
      (d) => d.id !== stage3Ids.capacityDemand,
    )!;
    other.period = { from: "2027-01-01", to: "2027-03-31" };
    expect(capacityStatus(state, stage3Ids.valueInitiative)[0].status).toBe(
      "AVAILABLE",
    );
  });
});

describe("faktiskt samtidiga kapacitetsbehov", () => {
  const configuredState = (includeJanuaryD = false) => {
    const state = baseDemoState();
    state.entities.capacityDemands = {};
    state.entities.availableCapacities = {};
    const capabilityId = Object.keys(
      state.entities.capabilities,
    )[0] as import("../../domain").CapabilityId;
    const nodeId = Object.keys(
      state.entities.executionNodes,
    )[0] as import("../../domain").ExecutionNodeId;
    const initiativeIds = Object.keys(
      state.entities.initiatives,
    ) as import("../../domain").InitiativeId[];
    const supplyId = createId("AvailableCapacity", "jan-feb-one-fte");
    state.entities.availableCapacities[supplyId] = {
      id: supplyId,
      capabilityId,
      poolReference: "CRITICAL-POOL",
      period: { from: "2027-01-01", to: "2027-02-28" },
      amount: 1,
      unit: "FTE",
      sourceRefs: ["SYNTHETIC-CAPACITY"],
    };
    const demands: Array<
      [string, import("../../domain").InitiativeId, string, string, number]
    > = [
      ["a", initiativeIds[0], "2027-01-01", "2027-02-28", 0.6],
      ["b", initiativeIds[1], "2027-01-01", "2027-01-31", 0.4],
      ["c", initiativeIds[2], "2027-02-01", "2027-02-28", 0.4],
    ];
    if (includeJanuaryD) {
      demands.push(["d", initiativeIds[3], "2027-01-01", "2027-01-31", 0.2]);
    }
    demands.forEach(([token, initiativeId, from, to, amount]) => {
      const id = createId("CapacityDemand", `concurrent-${token}`);
      state.entities.capacityDemands[id] = {
        id,
        initiativeId,
        executionNodeId: nodeId,
        capabilityId,
        poolReference: "CRITICAL-POOL",
        period: { from, to },
        amount,
        unit: "FTE",
      };
    });
    return { state, capabilityId };
  };

  it("ger januari 1,0 och februari 1,0 utan falsk konflikt", () => {
    const { state, capabilityId } = configuredState();
    const timeline = capacityTimeline(
      state,
      capabilityId,
      "CRITICAL-POOL",
      "FTE",
    );
    expect(
      timeline.map((slice) => [slice.period, slice.requested, slice.status]),
    ).toEqual([
      [{ from: "2027-01-01", to: "2027-01-31" }, 1, "AVAILABLE"],
      [{ from: "2027-02-01", to: "2027-02-28" }, 1, "AVAILABLE"],
    ]);
  });

  it("ger januari 1,2 med 0,2 konflikt och februari 1,0 utan konflikt", () => {
    const { state, capabilityId } = configuredState(true);
    const timeline = capacityTimeline(
      state,
      capabilityId,
      "CRITICAL-POOL",
      "FTE",
    );
    expect(timeline[0]).toMatchObject({
      period: { from: "2027-01-01", to: "2027-01-31" },
      requested: 1.2,
      status: "CONFLICT",
      shortage: 0.2,
    });
    expect(timeline[1]).toMatchObject({
      period: { from: "2027-02-01", to: "2027-02-28" },
      requested: 1,
      status: "AVAILABLE",
      shortage: 0,
    });
  });

  it("visar UNKNOWN för delperiod utan underlag och dubbelräknar inte samma postreferens", () => {
    const { state, capabilityId } = configuredState();
    const supply = Object.values(state.entities.availableCapacities)[0];
    supply.period.to = "2027-01-31";
    supply.sourceRefs.push(supply.sourceRefs[0]);
    const timeline = capacityTimeline(
      state,
      capabilityId,
      "CRITICAL-POOL",
      "FTE",
    );
    expect(timeline[0]).toMatchObject({
      requested: 1,
      available: 1,
      status: "AVAILABLE",
    });
    expect(timeline[1]).toMatchObject({
      requested: 1,
      available: undefined,
      status: "UNKNOWN",
    });
  });
});

describe("entydigt källval för tillgänglig kapacitet", () => {
  const stateWithDemand = () => {
    const state = baseDemoState();
    state.entities.capacityDemands = {};
    state.entities.availableCapacities = {};
    const capabilityId = Object.keys(
      state.entities.capabilities,
    )[0] as import("../../domain").CapabilityId;
    const initiativeId = Object.keys(
      state.entities.initiatives,
    )[0] as import("../../domain").InitiativeId;
    const executionNodeId = Object.keys(
      state.entities.executionNodes,
    )[0] as import("../../domain").ExecutionNodeId;
    const demandId = createId("CapacityDemand", "source-selection-demand");
    state.entities.capacityDemands[demandId] = {
      id: demandId,
      initiativeId,
      executionNodeId,
      capabilityId,
      poolReference: "SOURCE-SELECT-POOL",
      period: { from: "2027-01-01", to: "2027-01-31" },
      amount: 0.8,
      unit: "FTE",
    };
    return { state, capabilityId };
  };

  it("låter en giltig ersättning sänka 1,0 till 0,6 FTE och visar konflikt 0,2", () => {
    const { state, capabilityId } = stateWithDemand();
    const originalId = createId("AvailableCapacity", "source-original-one");
    const replacementId = createId(
      "AvailableCapacity",
      "source-replacement-lower",
    );
    state.entities.availableCapacities[originalId] = {
      id: originalId,
      capabilityId,
      poolReference: "SOURCE-SELECT-POOL",
      period: { from: "2027-01-01", to: "2027-01-31" },
      amount: 1,
      unit: "FTE",
      sourceRefs: ["SOURCE-ORIGINAL"],
      capacitySourceId: "STAFFING-BASIS",
      resourceUnitIds: ["RESOURCE-A"],
      assessmentVersion: 1,
    };
    state.entities.availableCapacities[replacementId] = {
      id: replacementId,
      capabilityId,
      poolReference: "SOURCE-SELECT-POOL",
      period: { from: "2027-01-01", to: "2027-01-31" },
      amount: 0.6,
      unit: "FTE",
      sourceRefs: ["SOURCE-REPLACEMENT"],
      capacitySourceId: "STAFFING-BASIS",
      resourceUnitIds: ["RESOURCE-A"],
      assessmentVersion: 2,
      supersedesAvailableCapacityId: originalId,
    };
    const [january] = capacityTimeline(
      state,
      capabilityId,
      "SOURCE-SELECT-POOL",
      "FTE",
    );
    expect(january).toMatchObject({
      available: 0.6,
      requested: 0.8,
      shortage: 0.2,
      status: "CONFLICT",
      sourceSelectionError: false,
    });
    expect(january.sourceRefs).toEqual(
      expect.arrayContaining([replacementId, "SOURCE-REPLACEMENT"]),
    );
    expect(january.sourceRefs).not.toContain(originalId);
  });

  it("ger UNKNOWN för motstridiga poster utan ersättningsrelation", () => {
    const { state, capabilityId } = stateWithDemand();
    [1, 0.6].forEach((amount, index) => {
      const id = createId("AvailableCapacity", `unresolved-${index}`);
      state.entities.availableCapacities[id] = {
        id,
        capabilityId,
        poolReference: "SOURCE-SELECT-POOL",
        period: { from: "2027-01-01", to: "2027-01-31" },
        amount,
        unit: "FTE",
        sourceRefs: [`CONFLICT-${index}`],
        capacitySourceId: "SAME-UNRESOLVED-SOURCE",
        resourceUnitIds: ["RESOURCE-A"],
        assessmentVersion: index + 1,
      };
    });
    expect(
      capacityTimeline(state, capabilityId, "SOURCE-SELECT-POOL", "FTE")[0],
    ).toMatchObject({
      available: undefined,
      status: "UNKNOWN",
      sourceSelectionError: true,
    });
  });

  it("låter en februariersättning vara utan påverkan på januari", () => {
    const { state, capabilityId } = stateWithDemand();
    const originalId = createId("AvailableCapacity", "january-original");
    const replacementId = createId("AvailableCapacity", "february-replacement");
    state.entities.availableCapacities[originalId] = {
      id: originalId,
      capabilityId,
      poolReference: "SOURCE-SELECT-POOL",
      period: { from: "2027-01-01", to: "2027-02-28" },
      amount: 1,
      unit: "FTE",
      sourceRefs: ["JANUARY-SOURCE"],
      capacitySourceId: "PERIOD-SOURCE",
      resourceUnitIds: ["RESOURCE-A"],
      assessmentVersion: 1,
    };
    state.entities.availableCapacities[replacementId] = {
      id: replacementId,
      capabilityId,
      poolReference: "SOURCE-SELECT-POOL",
      period: { from: "2027-02-01", to: "2027-02-28" },
      amount: 0.5,
      unit: "FTE",
      sourceRefs: ["FEBRUARY-SOURCE"],
      capacitySourceId: "PERIOD-SOURCE",
      resourceUnitIds: ["RESOURCE-A"],
      assessmentVersion: 2,
      supersedesAvailableCapacityId: originalId,
    };
    const january = capacityTimeline(
      state,
      capabilityId,
      "SOURCE-SELECT-POOL",
      "FTE",
    )[0];
    expect(january).toMatchObject({
      period: { from: "2027-01-01", to: "2027-01-31" },
      available: 1,
      status: "AVAILABLE",
    });
  });
});
