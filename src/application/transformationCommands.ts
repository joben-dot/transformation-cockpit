import type { BusinessId, EffectCommitmentId, InitiativeId, RoleAssignmentId } from "../domain";
import type { CommitmentDetails, StartPreparation, TransformationGovernance } from "../domain/transformation";

interface Meta { commandId: string; actorRoleAssignmentId: RoleAssignmentId; issuedAt: string }
export type TransformationCommand = Meta & (
  | { commandType: "SAVE_EFFECT_COMMITMENT"; targetId: EffectCommitmentId; payload: {
    initiativeId: InitiativeId; businessId: BusinessId; target: number; baseline: number; baselineDate: string; baselineVerified: boolean;
    unit: string; direction: "HIGHER_IS_BETTER" | "LOWER_IS_BETTER"; dataSource: string; measurementResponsibleId: RoleAssignmentId;
    details: Omit<CommitmentDetails, "createdAt" | "version" | "changeCompletedAt" | "changeEvidence">;
  }}
  | { commandType: "ACCEPT_EFFECT_COMMITMENT"; targetId: EffectCommitmentId; payload: { accepted: boolean; mandateDescription: string } }
  | { commandType: "SAVE_START_PREPARATION"; targetId: string; payload: Omit<StartPreparation, "id" | "preparedBy" | "preparedAt"> }
  | { commandType: "DECIDE_TRANSFORMATION"; targetId: string; payload: { preparationId: string; accepted: boolean; rationale: string; type: "START" | "CHANGE"; changeImpact?: { cost: string; time: string; quality: string; effect: string } } }
  | { commandType: "CONFIRM_BUSINESS_CHANGE"; targetId: EffectCommitmentId; payload: { date: string; evidence: string } }
  | { commandType: "RECORD_EFFECT_MEASUREMENT"; targetId: string; payload: { commitmentId: EffectCommitmentId; date: string; value: number; evidence: string; qualityObservation: string; qualityMet: boolean } }
  | { commandType: "VERIFY_EFFECT_MEASUREMENT"; targetId: string; payload: { accepted: boolean } }
  | { commandType: "RECORD_EFFECT_FORECAST"; targetId: string; payload: { commitmentId: EffectCommitmentId; date: string; value: number } }
  | { commandType: "COMPLETE_TRANSFORMATION"; targetId: InitiativeId; payload: { observation: string; evidence: string } }
  | { commandType: "SAVE_TRANSFORMATION_GOVERNANCE"; targetId: string; payload: Omit<TransformationGovernance, "id" | "version" | "createdAt" | "demoAssumption"> }
);
