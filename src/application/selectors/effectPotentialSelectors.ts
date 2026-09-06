import type { BusinessId, InitiativeId, PotentialCategory } from "../../domain";
import type { DemoState } from "../demoState";

export const effectPotentialsByInitiative = (
  state: DemoState,
  initiativeId: InitiativeId,
) =>
  Object.values(state.entities.effectPotentials).filter(
    (item) => item.initiativeId === initiativeId,
  );
export const effectPotentialsByRecipient = (
  state: DemoState,
  businessId: BusinessId,
) =>
  Object.values(state.entities.effectPotentials).filter(
    (item) => item.recipientBusinessId === businessId,
  );
export const effectPotentialByCategory = (
  state: DemoState,
  initiativeId: InitiativeId,
  category: PotentialCategory,
) =>
  effectPotentialsByInitiative(state, initiativeId).filter(
    (item) => item.category === category,
  );

/** Selects the latest version inside each explicitly identified recipient/scope series. */
export function currentEffectPotentials(
  state: DemoState,
  initiativeId: InitiativeId,
) {
  const current = new Map<
    string,
    ReturnType<typeof effectPotentialsByInitiative>[number]
  >();
  effectPotentialsByInitiative(state, initiativeId).forEach((item) => {
    const previous = current.get(item.seriesId);
    if (!previous || item.assessmentVersion > previous.assessmentVersion) {
      current.set(item.seriesId, item);
    }
  });
  return [...current.values()];
}
export function groupEffectPotentials(
  state: DemoState,
  initiativeId: InitiativeId,
) {
  return effectPotentialsByInitiative(state, initiativeId).reduce<
    Record<
      string,
      { unit: string; expectedValue: number; sourceRefs: string[] }
    >
  >((groups, item) => {
    const key = `${item.category}:${item.effectMeasureCode}:${item.unit}`;
    const current = groups[key] ?? {
      unit: item.unit,
      expectedValue: 0,
      sourceRefs: [],
    };
    groups[key] = {
      unit: item.unit,
      expectedValue: current.expectedValue + item.expectedValue,
      sourceRefs: [...current.sourceRefs, item.id],
    };
    return groups;
  }, {});
}
