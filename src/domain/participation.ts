import type { IsoDate } from "./common";
import type {
  BusinessId,
  InitiativeId,
  OrganizationId,
  ParticipationId,
} from "./ids";

export type ParticipantKind =
  | "INITIATOR"
  | "PARTICIPANT"
  | "EFFECT_RECIPIENT"
  | "COST_BEARER"
  | "DELIVERY_PARTICIPANT";
export interface Participation {
  id: ParticipationId;
  initiativeId: InitiativeId;
  organizationId: OrganizationId;
  businessId?: BusinessId;
  participantKind: ParticipantKind;
  validFrom: IsoDate;
  validTo?: IsoDate;
}
