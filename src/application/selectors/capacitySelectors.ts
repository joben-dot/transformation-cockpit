import type { DemoState } from "../demoState";
import type { CapabilityId, InitiativeId } from "../../domain";

const nextDay = (value: string) => {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
};
const activeOn = (period: { from: string; to: string }, day: string) =>
  period.from <= day && day <= period.to;

export interface CapacitySlice {
  period: { from: string; to: string };
  capabilityId: CapabilityId;
  poolReference: string;
  unit: string;
  requested: number;
  available?: number;
  status: "AVAILABLE" | "CONFLICT" | "UNKNOWN";
  shortage: number;
  demandIds: string[];
  sourceRefs: string[];
  sourceSelectionError: boolean;
}

/** Calculates concurrent demand per calendar day and then compacts equal adjacent days. */
export function capacityTimeline(
  state: DemoState,
  capabilityId: CapabilityId,
  poolReference: string,
  unit: string,
) {
  const demands = Object.values(state.entities.capacityDemands).filter(
    (item) =>
      item.capabilityId === capabilityId &&
      item.poolReference === poolReference &&
      item.unit === unit,
  );
  if (!demands.length) return [];
  const start = demands.map((item) => item.period.from).sort()[0];
  const end = demands
    .map((item) => item.period.to)
    .sort()
    .at(-1)!;
  const supplies = Object.values(state.entities.availableCapacities).filter(
    (item) =>
      item.capabilityId === capabilityId &&
      item.poolReference === poolReference &&
      item.unit === unit,
  );
  const days: CapacitySlice[] = [];
  for (let day = start; day <= end; day = nextDay(day)) {
    const activeDemands = demands.filter((item) => activeOn(item.period, day));
    if (!activeDemands.length) continue;
    const activeSupplies = supplies.filter((item) =>
      activeOn(item.period, day),
    );
    const supersededIds = new Set(
      activeSupplies.flatMap((item) =>
        item.supersedesAvailableCapacityId
          ? [item.supersedesAvailableCapacityId]
          : [],
      ),
    );
    const applicableSupplies = activeSupplies.filter(
      (item) => !supersededIds.has(item.id),
    );
    const sources = new Map<string, typeof applicableSupplies>();
    applicableSupplies.forEach((item) => {
      const sourceId = item.capacitySourceId ?? item.id;
      sources.set(sourceId, [...(sources.get(sourceId) ?? []), item]);
    });
    const hasConflictingVersions = [...sources.values()].some(
      (records) => records.length !== 1,
    );
    const selectedSupplies = [...sources.values()].flatMap((records) =>
      records.length === 1 ? records : [],
    );
    const resourceUnits = selectedSupplies.flatMap(
      (item) => item.resourceUnitIds ?? [],
    );
    const independentSourcesAreExplicit =
      selectedSupplies.length <= 1 ||
      (selectedSupplies.every((item) => item.resourceUnitIds?.length) &&
        new Set(resourceUnits).size === resourceUnits.length);
    const sourceSelectionError =
      hasConflictingVersions || !independentSourcesAreExplicit;
    const available =
      applicableSupplies.length === 0 || sourceSelectionError
        ? undefined
        : selectedSupplies.reduce((sum, item) => sum + item.amount, 0);
    const requested = activeDemands.reduce((sum, item) => sum + item.amount, 0);
    days.push({
      period: { from: day, to: day },
      capabilityId,
      poolReference,
      unit,
      requested,
      available,
      status:
        available === undefined
          ? "UNKNOWN"
          : requested > available
            ? "CONFLICT"
            : "AVAILABLE",
      shortage:
        available === undefined
          ? 0
          : Math.round(Math.max(0, requested - available) * 1_000_000) /
            1_000_000,
      demandIds: activeDemands.map((item) => item.id),
      sourceRefs: [
        ...activeDemands.map((item) => item.id),
        ...selectedSupplies.map((item) => item.id),
        ...selectedSupplies.flatMap((item) => item.sourceRefs),
      ],
      sourceSelectionError,
    });
  }
  return days.reduce<CapacitySlice[]>((segments, day) => {
    const previous = segments.at(-1);
    if (
      previous &&
      nextDay(previous.period.to) === day.period.from &&
      previous.requested === day.requested &&
      previous.available === day.available &&
      previous.status === day.status &&
      previous.sourceSelectionError === day.sourceSelectionError &&
      previous.demandIds.join(":") === day.demandIds.join(":")
    ) {
      previous.period.to = day.period.to;
      previous.sourceRefs = [
        ...new Set([...previous.sourceRefs, ...day.sourceRefs]),
      ];
      previous.demandIds = [
        ...new Set([...previous.demandIds, ...day.demandIds]),
      ];
    } else {
      segments.push(day);
    }
    return segments;
  }, []);
}

export function capacityStatus(state: DemoState, initiativeId?: InitiativeId) {
  return Object.values(state.entities.capacityDemands)
    .filter((demand) => !initiativeId || demand.initiativeId === initiativeId)
    .map((demand) => {
      const slices = capacityTimeline(
        state,
        demand.capabilityId,
        demand.poolReference,
        demand.unit,
      ).filter(
        (slice) =>
          slice.period.from <= demand.period.to &&
          demand.period.from <= slice.period.to,
      );
      const status = slices.some((slice) => slice.status === "UNKNOWN")
        ? ("UNKNOWN" as const)
        : slices.some((slice) => slice.status === "CONFLICT")
          ? ("CONFLICT" as const)
          : ("AVAILABLE" as const);
      return {
        demand,
        status,
        available: slices.length
          ? Math.min(...slices.map((slice) => slice.available ?? 0))
          : 0,
        requested: slices.length
          ? Math.max(...slices.map((slice) => slice.requested))
          : demand.amount,
        shortage: Math.max(0, ...slices.map((slice) => slice.shortage)),
        competingDemandIds: [
          ...new Set(
            slices.flatMap((slice) =>
              slice.demandIds.filter((id) => id !== demand.id),
            ),
          ),
        ],
        sourceRefs: [...new Set(slices.flatMap((slice) => slice.sourceRefs))],
      };
    });
}
