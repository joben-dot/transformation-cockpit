import type { InitiativeId } from "../../domain";
import type { DemoState } from "../demoState";
import {
  selectOriginatingChallenge,
  selectParticipationsByInitiative,
} from "./activeCaseSelectors";

export interface InitiativeTrace {
  challengeId: string;
  initiativeId: string;
  participationIds: string[];
  organizationIds: string[];
  businessIds: string[];
}

export function selectInitiativeTrace(
  state: DemoState,
  initiativeId: InitiativeId,
): InitiativeTrace | undefined {
  const initiative = state.entities.initiatives[initiativeId];
  const challenge = selectOriginatingChallenge(state, initiativeId);
  if (!initiative || !challenge) return undefined;
  const participations = selectParticipationsByInitiative(state, initiativeId);
  return {
    challengeId: challenge.id,
    initiativeId: initiative.id,
    participationIds: participations.map((participation) => participation.id),
    organizationIds: [
      ...new Set(
        participations.map((participation) => participation.organizationId),
      ),
    ],
    businessIds: [
      ...new Set(
        participations.flatMap((participation) =>
          participation.businessId ? [participation.businessId] : [],
        ),
      ),
    ],
  };
}
