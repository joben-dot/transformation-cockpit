import { describe, expect, it } from "vitest";
import { createId, type RoleAssignmentId } from "../../domain";
import { stage3Ids } from "../../demo-data/stage3DemoData";
import { baseDemoState } from "../../tests/fixtures/baseDemoState";
import { demoReducer } from "../demoReducer";
import { validateStage3State } from "../validateStage3State";
import {
  allocationSummary,
  calculateAllocation,
  calculateAllocationForRule,
  costsByOrigin,
  costSummary,
} from "./costSelectors";
describe("kostnadsursprung och allokering", () => {
  it("räknar gemensamt kostnadsursprung en gång i samlad vy", () => {
    const entries = costsByOrigin(baseDemoState(), [
      stage3Ids.valueInitiative,
      stage3Ids.reuseInitiative,
      stage3Ids.enablingInitiative,
    ]);
    expect(
      entries.filter((e) => e.originReference === "SHARED-ENVIRONMENT"),
    ).toHaveLength(1);
  });
  it("håller ekonomiska statusar isär", () => {
    const state = baseDemoState();
    expect(
      costSummary(
        state,
        [stage3Ids.valueInitiative, stage3Ids.enablingInitiative],
        "ACTUAL",
      ).amount,
    ).toBe(0);
    expect(
      costSummary(
        state,
        [stage3Ids.valueInitiative, stage3Ids.enablingInitiative],
        "ESTIMATE",
      ).amount,
    ).toBeGreaterThan(0);
  });
  it("avrundar deterministiskt och stämmer av totalen", () =>
    expect(
      calculateAllocation(100, { a: 1, b: 1, c: 1 }).reduce(
        (s, p) => s + p.allocatedAmount,
        0,
      ),
    ).toBe(100));
  it("tillämpar lika respektive fast och storleksbaserad regel konfigurerat", () => {
    const state = baseDemoState();
    const equal = Object.values(state.entities.allocationRuleVersions).find(
      (rule) => rule.method === "EQUAL",
    )!;
    const mixed = Object.values(state.entities.allocationRuleVersions).find(
      (rule) => rule.method === "FIXED_AND_SIZE",
    )!;
    expect(
      calculateAllocationForRule(100, equal).map(
        (part) => part.allocatedAmount,
      ),
    ).toEqual([50, 50]);
    expect(
      calculateAllocationForRule(100, mixed).map(
        (part) => part.allocatedAmount,
      ),
    ).toEqual([57, 43]);
  });
  it("allokering skapar inte en ny kostnad", () => {
    const state = baseDemoState();
    const before = Object.keys(state.entities.costEntries).length;
    const rule = Object.values(state.entities.allocationRuleVersions)[0];
    const result = demoReducer(state, {
      commandId: createId("Command", "allocate-test"),
      actorRoleAssignmentId: Object.keys(
        state.entities.roleAssignments,
      )[0] as RoleAssignmentId,
      issuedAt: "2026-10-20T10:00:00Z",
      commandType: "CALCULATE_COST_ALLOCATION",
      targetId: stage3Ids.sharedCost,
      payload: {
        ruleVersionId: rule.id,
        scenarioId: "TEST",
        dimension: "ORGANIZATION",
      },
    });
    expect(result.success).toBe(true);
    expect(Object.keys(result.nextState.entities.costEntries)).toHaveLength(
      before,
    );
    expect(
      allocationSummary(result.nextState, stage3Ids.sharedCost, "TEST")
        .complete,
    ).toBe(true);
    expect(state.entities.costAllocations).toEqual({});
  });
  it("visar återstående belopp i ett ofullständigt utkast", () => {
    const state = baseDemoState();
    const rule = Object.values(state.entities.allocationRuleVersions)[0];
    const id = createId("CostAllocation", "partial-test");
    state.entities.costAllocations[id] = {
      id,
      costEntryId: stage3Ids.sharedCost,
      organizationId: Object.keys(state.entities.organizations)[0] as never,
      allocatedAmount: 100_000,
      share: 1 / 9,
      dimension: "ORGANIZATION",
      allocationRuleVersionId: rule.id,
      scenarioId: "DRAFT",
    };
    const summary = allocationSummary(state, stage3Ids.sharedCost, "DRAFT");
    expect(summary.complete).toBe(false);
    expect(summary.remainingAmount).toBe(800_000);
  });
  it("valideringen avvisar överallokering", () => {
    const state = baseDemoState();
    const rule = Object.values(state.entities.allocationRuleVersions)[0];
    const id = createId("CostAllocation", "over-test");
    state.entities.costAllocations[id] = {
      id,
      costEntryId: stage3Ids.sharedCost,
      organizationId: Object.keys(state.entities.organizations)[0] as never,
      allocatedAmount: 900_001,
      share: 1.01,
      dimension: "ORGANIZATION",
      allocationRuleVersionId: rule.id,
      scenarioId: "OVER",
    };
    expect(validateStage3State(state)).toContainEqual(
      expect.stringContaining("överstiger"),
    );
  });
  it("avvisar dubblerat kostnadsursprung atomärt", () => {
    const state = baseDemoState();
    const existing = state.entities.costEntries[stage3Ids.sharedCost];
    const {
      id: _id,
      assessedByRoleAssignmentId: _actor,
      ...payload
    } = existing;
    void _id;
    void _actor;
    const result = demoReducer(state, {
      commandId: createId("Command", "duplicate-origin"),
      actorRoleAssignmentId: Object.keys(
        state.entities.roleAssignments,
      )[0] as RoleAssignmentId,
      issuedAt: "2026-10-20T10:00:00Z",
      commandType: "REGISTER_COST_ENTRY",
      targetId: createId("CostEntry", "duplicate-origin"),
      payload: {
        ...payload,
        originReference: "SHARED-ENVIRONMENT",
      },
    });
    expect(result.success).toBe(false);
    expect(result.nextState).toBe(state);
  });
});

describe("kritisk kostnadshorisont", () => {
  it("beräknar 1 560 000 SEK för två initiativ över tre hela kalenderår", () => {
    const state = baseDemoState();
    state.entities.costEntries = {};
    const sharedNode = state.entities.executionNodes[stage3Ids.sharedNode];
    const localANode = createId("ExecutionNode", "cost-local-a");
    const localBNode = createId("ExecutionNode", "cost-local-b");
    const template = { ...sharedNode, availabilityEvidenceRefs: [] };
    state.entities.executionNodes[localANode] = {
      ...template,
      id: localANode,
      ownerInitiativeId: stage3Ids.valueInitiative,
      contextInitiativeIds: [stage3Ids.valueInitiative],
      title: "Lokal A",
    };
    state.entities.executionNodes[localBNode] = {
      ...template,
      id: localBNode,
      ownerInitiativeId: stage3Ids.reuseInitiative,
      contextInitiativeIds: [stage3Ids.reuseInitiative],
      title: "Lokal B",
    };
    const actor = Object.keys(
      state.entities.roleAssignments,
    )[0] as RoleAssignmentId;
    const add = (
      token: string,
      initiativeId: typeof stage3Ids.valueInitiative,
      executionNodeId: typeof sharedNode.id,
      originReference: string,
      amount: number,
      recurrence: "ONE_TIME" | "RECURRING_ANNUAL",
    ) => {
      const id = createId("CostEntry", token);
      state.entities.costEntries[id] = {
        id,
        initiativeId,
        executionNodeId,
        originReference,
        category: recurrence === "ONE_TIME" ? "LOCAL_CONNECTION" : "OPERATIONS",
        period: { from: "2027-01-01", to: "2029-12-31" },
        amount,
        currency: "SEK",
        economicStatus: "ESTIMATE",
        recurrence,
        sourceRefs: ["SYNTHETIC-THREE-YEAR-BASIS"],
        assessedByRoleAssignmentId: actor,
        assessmentVersion: 1,
      };
    };
    add(
      "shared-investment-critical",
      stage3Ids.enablingInitiative as never,
      sharedNode.id,
      "COMMON-INVESTMENT-CRITICAL",
      900_000,
      "ONE_TIME",
    );
    add(
      "local-a-critical",
      stage3Ids.valueInitiative,
      localANode,
      "LOCAL-A-CRITICAL",
      100_000,
      "ONE_TIME",
    );
    add(
      "local-b-critical",
      stage3Ids.reuseInitiative as never,
      localBNode,
      "LOCAL-B-CRITICAL",
      200_000,
      "ONE_TIME",
    );
    add(
      "shared-operations-critical",
      stage3Ids.enablingInitiative as never,
      sharedNode.id,
      "COMMON-OPERATIONS-CRITICAL",
      120_000,
      "RECURRING_ANNUAL",
    );
    const summary = costSummary(
      state,
      [stage3Ids.valueInitiative, stage3Ids.reuseInitiative],
      "ESTIMATE",
      { from: "2027-01-01", to: "2029-12-31" },
    );
    expect(summary.amount).toBe(1_560_000);
    expect(summary.sourceRefs).toHaveLength(4);
  });

  it("summerar två faktiska delutfall men håller budget separat", () => {
    const state = baseDemoState();
    state.entities.costEntries = {};
    const base = {
      initiativeId: stage3Ids.valueInitiative,
      executionNodeId: stage3Ids.sharedNode,
      originReference: "SAME-INVESTMENT",
      category: "COMMON_INVESTMENT" as const,
      period: { from: "2027-01-01", to: "2027-12-31" },
      currency: "SEK" as const,
      recurrence: "ONE_TIME" as const,
      sourceRefs: ["SYNTHETIC-ACTUAL"],
      assessedByRoleAssignmentId: Object.keys(
        state.entities.roleAssignments,
      )[0] as RoleAssignmentId,
      assessmentVersion: 1,
    };
    [
      ["actual-40", 40_000],
      ["actual-60", 60_000],
    ].forEach(([token, amount]) => {
      const id = createId("CostEntry", String(token));
      state.entities.costEntries[id] = {
        ...base,
        id,
        amount: Number(amount),
        economicStatus: "ACTUAL",
      };
    });
    const budgetId = createId("CostEntry", "budget-100");
    state.entities.costEntries[budgetId] = {
      ...base,
      id: budgetId,
      amount: 100_000,
      economicStatus: "BUDGET",
    };
    expect(
      costSummary(state, [stage3Ids.valueInitiative], "ACTUAL").amount,
    ).toBe(100_000);
    expect(
      costSummary(state, [stage3Ids.valueInitiative], "BUDGET").amount,
    ).toBe(100_000);
  });

  it("använder senaste bedömningsversion och lämnar årsbelopp oprojicerat utan horisont", () => {
    const state = baseDemoState();
    state.entities.costEntries = {};
    const base = {
      initiativeId: stage3Ids.valueInitiative,
      executionNodeId: stage3Ids.sharedNode,
      originReference: "VERSIONED-ESTIMATE",
      category: "OPERATIONS" as const,
      period: { from: "2027-01-01", to: "2029-12-31" },
      currency: "SEK" as const,
      economicStatus: "ESTIMATE" as const,
      recurrence: "RECURRING_ANNUAL" as const,
      sourceRefs: ["SYNTHETIC-VERSION"],
      assessedByRoleAssignmentId: Object.keys(
        state.entities.roleAssignments,
      )[0] as RoleAssignmentId,
    };
    const oldId = createId("CostEntry", "version-old");
    const newId = createId("CostEntry", "version-new");
    state.entities.costEntries[oldId] = {
      ...base,
      id: oldId,
      amount: 100_000,
      assessmentVersion: 1,
    };
    state.entities.costEntries[newId] = {
      ...base,
      id: newId,
      amount: 120_000,
      assessmentVersion: 2,
      supersedesCostEntryId: oldId,
    };
    const summary = costSummary(state, [stage3Ids.valueInitiative], "ESTIMATE");
    expect(summary.amount).toBe(120_000);
    expect(summary.recurringBasis).toBe("ANNUAL_UNPROJECTED");
  });
});

describe("ofullständig kostnadshorisont", () => {
  const annualState = () => {
    const state = baseDemoState();
    state.entities.costEntries = {};
    const id = createId("CostEntry", "partial-year-annual");
    state.entities.costEntries[id] = {
      id,
      initiativeId: stage3Ids.valueInitiative,
      executionNodeId: stage3Ids.sharedNode,
      originReference: "PARTIAL-YEAR-ANNUAL",
      category: "OPERATIONS",
      period: { from: "2027-01-01", to: "2028-12-31" },
      amount: 120_000,
      currency: "SEK",
      economicStatus: "ESTIMATE",
      recurrence: "RECURRING_ANNUAL",
      sourceRefs: ["SYNTHETIC-PARTIAL-YEAR"],
      assessedByRoleAssignmentId: Object.keys(
        state.entities.roleAssignments,
      )[0] as RoleAssignmentId,
      assessmentVersion: 1,
    };
    return { state, id };
  };

  it("markerar juli–december som ofullständig, inte komplett nolltotal", () => {
    const { state, id } = annualState();
    const result = costSummary(state, [stage3Ids.valueInitiative], "ESTIMATE", {
      from: "2027-07-01",
      to: "2027-12-31",
    });
    expect(result).toMatchObject({
      calculatedSubtotal: 0,
      completeness: "INCOMPLETE",
    });
    expect(result.uncomputedPeriods).toEqual([
      {
        costEntryId: id,
        period: { from: "2027-07-01", to: "2027-12-31" },
        reason: expect.stringContaining("Delårsperiodisering"),
        sourceRefs: [id],
      },
    ]);
  });

  it("visar 120 000 SEK helårsdel och återstående januari–juni", () => {
    const { state, id } = annualState();
    const result = costSummary(state, [stage3Ids.valueInitiative], "ESTIMATE", {
      from: "2027-01-01",
      to: "2028-06-30",
    });
    expect(result).toMatchObject({
      calculatedSubtotal: 120_000,
      completeness: "INCOMPLETE",
    });
    expect(result.uncomputedPeriods).toEqual([
      expect.objectContaining({
        costEntryId: id,
        period: { from: "2028-01-01", to: "2028-06-30" },
      }),
    ]);
  });
});
