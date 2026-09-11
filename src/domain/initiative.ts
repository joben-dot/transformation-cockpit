import type { IsoDateTime } from "./common";
import type { ChallengeId, InitiativeId } from "./ids";

export type InitiativeKind = "VALUE_CREATING" | "ENABLING";
export interface Initiative {
  implementationCompletedAt?: string;
  closedAt?: string;
  id: InitiativeId;
  challengeId: ChallengeId;
  title: string;
  purpose: string;
  desiredEndState: string;
  initiativeKind: InitiativeKind;
  scope: string;
  createdAt: IsoDateTime;
}
