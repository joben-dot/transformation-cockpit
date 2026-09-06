import type { DemoState } from "../demoState";
import type {
  AllocationRuleVersion,
  CostEntry,
  EconomicStatus,
  InitiativeId,
  Period,
} from "../../domain";
import { prerequisiteGraph } from "./executionSelectors";

const overlaps = (a: Period, b: Period) => a.from <= b.to && b.from <= a.to;

/** Returns economic posts, never investment origins. Shared graph paths converge on the same CostEntryId. */
export function costEntriesForInitiatives(
  state: DemoState,
  initiativeIds: InitiativeId[],
) {
  const relevantNodeIds = new Set(
    initiativeIds.flatMap((initiativeId) =>
      prerequisiteGraph(state, initiativeId).nodes.map((node) => node.id),
    ),
  );
  return Object.values(state.entities.costEntries).filter(
    (entry) =>
      initiativeIds.includes(entry.initiativeId) ||
      relevantNodeIds.has(entry.executionNodeId),
  );
}

/** Actual partial postings are additive. For assessments, only the latest version of the same origin/status/period is current. */
export function currentCostEntries(entries: CostEntry[]) {
  const actual = entries.filter((entry) => entry.economicStatus === "ACTUAL");
  const versioned = new Map<string, CostEntry>();
  entries
    .filter((entry) => entry.economicStatus !== "ACTUAL")
    .forEach((entry) => {
      const key = [
        entry.originReference,
        entry.economicStatus,
        entry.period.from,
        entry.period.to,
        entry.recurrence,
      ].join(":");
      const current = versioned.get(key);
      if (!current || entry.assessmentVersion > current.assessmentVersion) {
        versioned.set(key, entry);
      }
    });
  return [...actual, ...versioned.values()];
}

// Kept as the public trace selector; it now returns posts by identity rather than deleting posts by origin.
export function costsByOrigin(
  state: DemoState,
  initiativeIds?: InitiativeId[],
) {
  const entries = initiativeIds
    ? costEntriesForInitiatives(state, initiativeIds)
    : Object.values(state.entities.costEntries);
  return currentCostEntries(entries);
}

function fullCalendarYears(period: Period, horizon: Period) {
  const first = Math.max(
    Number(period.from.slice(0, 4)),
    Number(horizon.from.slice(0, 4)),
  );
  const last = Math.min(
    Number(period.to.slice(0, 4)),
    Number(horizon.to.slice(0, 4)),
  );
  let years = 0;
  for (let year = first; year <= last; year += 1) {
    const calendarYear = { from: `${year}-01-01`, to: `${year}-12-31` };
    if (
      period.from <= calendarYear.from &&
      period.to >= calendarYear.to &&
      horizon.from <= calendarYear.from &&
      horizon.to >= calendarYear.to
    ) {
      years += 1;
    }
  }
  return years;
}

function uncomputedPartialPeriods(period: Period, horizon: Period) {
  const intersection = {
    from: period.from > horizon.from ? period.from : horizon.from,
    to: period.to < horizon.to ? period.to : horizon.to,
  };
  if (intersection.from > intersection.to) return [];
  const periods: Period[] = [];
  const firstFullYear =
    Number(intersection.from.slice(0, 4)) +
    (intersection.from.endsWith("-01-01") ? 0 : 1);
  const lastFullYear =
    Number(intersection.to.slice(0, 4)) -
    (intersection.to.endsWith("-12-31") ? 0 : 1);
  if (firstFullYear > lastFullYear) return [intersection];
  const firstCoveredDate = `${firstFullYear}-01-01`;
  const lastCoveredDate = `${lastFullYear}-12-31`;
  if (intersection.from < firstCoveredDate) {
    const previousYear = firstFullYear - 1;
    periods.push({
      from: intersection.from,
      to:
        intersection.to < `${previousYear}-12-31`
          ? intersection.to
          : `${previousYear}-12-31`,
    });
  }
  if (intersection.to > lastCoveredDate) {
    periods.push({
      from:
        intersection.from > `${lastFullYear + 1}-01-01`
          ? intersection.from
          : `${lastFullYear + 1}-01-01`,
      to: intersection.to,
    });
  }
  return periods.filter((item) => item.from <= item.to);
}

export function costSummary(
  state: DemoState,
  initiativeIds: InitiativeId[],
  status: EconomicStatus,
  horizon?: Period,
) {
  const entries = costsByOrigin(state, initiativeIds).filter(
    (entry) => entry.economicStatus === status,
  );
  const included = horizon
    ? entries.filter((entry) => overlaps(entry.period, horizon))
    : entries;
  const amount = included.reduce((sum, entry) => {
    if (entry.recurrence === "ONE_TIME") return sum + entry.amount;
    if (!horizon) return sum + entry.amount;
    return sum + entry.amount * fullCalendarYears(entry.period, horizon);
  }, 0);
  const uncomputedPeriods = horizon
    ? included.flatMap((entry) =>
        entry.recurrence === "RECURRING_ANNUAL"
          ? uncomputedPartialPeriods(entry.period, horizon).map((period) => ({
              costEntryId: entry.id,
              period,
              reason:
                "Delårsperiodisering stöds inte; endast hela kalenderår har beräknats.",
              sourceRefs: [entry.id],
            }))
          : [],
      )
    : [];
  return {
    amount,
    calculatedSubtotal: amount,
    completeness:
      uncomputedPeriods.length > 0
        ? ("INCOMPLETE" as const)
        : ("COMPLETE" as const),
    uncomputedPeriods,
    currency: "SEK" as const,
    horizon,
    recurringBasis: horizon ? "FULL_CALENDAR_YEARS" : "ANNUAL_UNPROJECTED",
    sourceRefs: included.map((entry) => entry.id),
  };
}

export function costBreakdownWithoutProjection(
  state: DemoState,
  initiativeIds: InitiativeId[],
  status: EconomicStatus,
) {
  const entries = costsByOrigin(state, initiativeIds).filter(
    (entry) => entry.economicStatus === status,
  );
  const oneTime = entries.filter((entry) => entry.recurrence === "ONE_TIME");
  const recurring = entries.filter(
    (entry) => entry.recurrence === "RECURRING_ANNUAL",
  );
  return {
    oneTimeAmount: oneTime.reduce((sum, entry) => sum + entry.amount, 0),
    recurringAnnualAmount: recurring.reduce(
      (sum, entry) => sum + entry.amount,
      0,
    ),
    sourceRefs: entries.map((entry) => entry.id),
  };
}

export function allocationSummary(
  state: DemoState,
  costEntryId: import("../../domain").CostEntryId,
  scenarioId: string,
) {
  const entry = state.entities.costEntries[costEntryId];
  const allocations = Object.values(state.entities.costAllocations).filter(
    (item) =>
      item.costEntryId === costEntryId && item.scenarioId === scenarioId,
  );
  const allocatedAmount = allocations.reduce(
    (sum, item) => sum + item.allocatedAmount,
    0,
  );
  return {
    totalAmount: entry?.amount ?? 0,
    allocatedAmount,
    remainingAmount: (entry?.amount ?? 0) - allocatedAmount,
    complete: Boolean(entry) && allocatedAmount === entry.amount,
    allocations,
    sourceRefs: [costEntryId, ...allocations.map((item) => item.id)],
  };
}

/** Integer-SEK largest remainder is assigned to the final configured recipient. */
export function calculateAllocation(
  amount: number,
  weights: Record<string, number>,
) {
  const recipients = Object.entries(weights);
  const totalWeight = recipients.reduce((sum, [, value]) => sum + value, 0);
  let assigned = 0;
  return recipients.map(([recipientId, weight], index) => {
    const allocatedAmount =
      index === recipients.length - 1
        ? amount - assigned
        : Math.round((amount * weight) / totalWeight);
    assigned += allocatedAmount;
    return { recipientId, allocatedAmount, share: allocatedAmount / amount };
  });
}

export function calculateAllocationForRule(
  amount: number,
  rule: AllocationRuleVersion,
) {
  const recipients = Object.keys(rule.recipientWeights);
  if (rule.method === "EQUAL") {
    return calculateAllocation(
      amount,
      Object.fromEntries(recipients.map((id) => [id, 1])),
    );
  }
  if (rule.method !== "FIXED_AND_SIZE") {
    return calculateAllocation(amount, rule.recipientWeights);
  }
  const fixedShare = rule.fixedShare ?? 0;
  const fixedAmount = Math.round(amount * fixedShare);
  const equalParts = calculateAllocation(
    fixedAmount,
    Object.fromEntries(recipients.map((id) => [id, 1])),
  );
  const sizeParts = calculateAllocation(
    amount - fixedAmount,
    rule.recipientWeights,
  );
  return equalParts.map((part, index) => ({
    recipientId: part.recipientId,
    allocatedAmount: part.allocatedAmount + sizeParts[index].allocatedAmount,
    share: (part.allocatedAmount + sizeParts[index].allocatedAmount) / amount,
  }));
}
