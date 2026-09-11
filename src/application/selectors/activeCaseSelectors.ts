import type {
  ChallengeId,
  InitiativeId,
  OrganizationId,
  BusinessId,
} from "../../domain";
import type { DemoState } from "../demoState";

export const selectActiveChallenge = (state: DemoState) =>
  state.viewContext.activeChallengeId
    ? state.entities.challenges[state.viewContext.activeChallengeId]
    : undefined;

export const selectActiveInitiative = (state: DemoState) =>
  state.viewContext.activeInitiativeId
    ? state.entities.initiatives[state.viewContext.activeInitiativeId]
    : undefined;

export const selectOriginatingChallenge = (
  state: DemoState,
  initiativeId: InitiativeId,
) => {
  const initiative = state.entities.initiatives[initiativeId];
  return initiative
    ? state.entities.challenges[initiative.challengeId]
    : undefined;
};

export const selectParticipationsByInitiative = (
  state: DemoState,
  initiativeId: InitiativeId,
) =>
  Object.values(state.entities.participations).filter(
    (participation) => participation.initiativeId === initiativeId,
  );

export const selectRelationsByOrganization = (
  state: DemoState,
  organizationId: OrganizationId,
) =>
  Object.values(state.entities.participations).filter(
    (participation) => participation.organizationId === organizationId,
  );

export const selectRelationsByBusiness = (
  state: DemoState,
  businessId: BusinessId,
) =>
  Object.values(state.entities.participations).filter(
    (participation) => participation.businessId === businessId,
  );

export const selectChallengeById = (
  state: DemoState,
  challengeId: ChallengeId,
) => state.entities.challenges[challengeId];
