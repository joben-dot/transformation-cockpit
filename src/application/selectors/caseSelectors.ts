import type { ChallengeId, InitiativeId } from "../../domain";
import type { DemoState } from "../demoState";
import { deriveNextCriticalStep, deriveQualificationStatus } from "./qualificationSelectors";

export type CaseStep = "UTKAST" | "REGISTRERAD" | "BEREDNING" | "PRIORITERINGSBAR";

export interface CaseOverviewItem {
  challengeId: ChallengeId;
  initiativeId?: InitiativeId;
  caseNumber: string;
  title: string;
  area: string;
  step: CaseStep;
  obstacle: string;
  nextAction: string;
  responsible: string;
  dueDate?: string;
  overdue: boolean;
  comparable: boolean;
  comparisonReason?: string;
}

export function caseOverview(state: DemoState, today = new Date().toISOString().slice(0, 10)): CaseOverviewItem[] {
  return Object.values(state.entities.challenges).map((challenge, index) => {
    const initiativeId = challenge.relatedInitiativeIds[0];
    const initiative = initiativeId ? state.entities.initiatives[initiativeId] : undefined;
    const requirements = Object.values(state.entities.completionRequirements)
      .filter((item) => (item.challengeId === challenge.id || (initiativeId && item.initiativeId === initiativeId)) && !["VERIFIED", "NOT_APPLICABLE"].includes(item.status));
    const requirement = requirements.sort((a, b) => (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999"))[0];
    const qualification = initiativeId ? deriveQualificationStatus(state, initiativeId) : undefined;
    const step: CaseStep = challenge.nominationStatus === "DRAFT" ? "UTKAST" : !initiative ? "REGISTRERAD" : qualification?.status === "QUALIFIED" ? "PRIORITERINGSBAR" : "BEREDNING";
    const assignment = requirement?.responsibleRoleAssignmentId
      ? state.entities.roleAssignments[requirement.responsibleRoleAssignmentId] : undefined;
    const person = assignment ? state.entities.people[assignment.personId] : undefined;
    const business = Object.values(state.entities.participations)
      .find((item) => item.initiativeId === initiativeId)?.businessId;
    const obstacle = requirement?.missingItem ??
      (step === "UTKAST" ? "Utkastet är inte inskickat till beredning" :
       step === "REGISTRERAD" ? "Beredningsinitiativ är ännu inte skapat" :
       step === "BEREDNING" ? `${qualification?.missingCriterionCodes.length ?? 0} obligatoriska bedömningar återstår` : "Inget känt hinder för prioriteringsdiskussion");
    return {
      challengeId: challenge.id,
      initiativeId,
      caseNumber: `ÄR-${challenge.createdAt.slice(0, 4)}-${String(index + 1).padStart(3, "0")}`,
      title: challenge.title.trim() || "Namnlöst utkast",
      area: business ? state.entities.businesses[business]?.name ?? "Område saknas" : "Område behöver anges",
      step,
      obstacle,
      nextAction: requirement ? (requirement.status === "SUBMITTED" ? "Verifiera dokumenterat svar" : `Komplettera: ${requirement.missingItem}`) :
        initiativeId ? deriveNextCriticalStep(state, initiativeId).label : step === "UTKAST" ? "Komplettera och skicka till beredning" : "Pröva om beredningsinitiativ ska skapas",
      responsible: person ? person.displayName : "Ansvarig saknas",
      dueDate: requirement?.deadline,
      overdue: Boolean(requirement?.deadline && requirement.deadline < today),
      comparable: qualification?.status === "QUALIFIED" && Object.values(state.entities.effectPotentials).some((item) => item.initiativeId === initiativeId),
      comparisonReason: qualification?.status !== "QUALIFIED" ? "Kvalificeringen är inte slutförd" : !Object.values(state.entities.effectPotentials).some((item) => item.initiativeId === initiativeId) ? "Bedömd effektpotential saknas" : undefined,
    };
  });
}
