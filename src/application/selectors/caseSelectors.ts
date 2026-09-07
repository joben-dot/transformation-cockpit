import { startReadiness } from "./startReadinessSelectors";
import type { ChallengeId, InitiativeId } from "../../domain";
import type { DemoState } from "../demoState";
import { deriveNextCriticalStep, deriveQualificationStatus } from "./qualificationSelectors";
import { activeCommitments, latestDecision, transformationStage } from "./transformationSelectors";
import { activeSteeringProfile, priorityEligibilityBlockers } from "./prioritySelectors";

export type CaseStep = "UTKAST" | "REGISTRERAD" | "BEREDNING" | "PRIORITERINGSBAR" | "PRIORITERAD" | "STARTKLAR" | "PAGAENDE" | "MATNING" | "AVSLUTAT";

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
    const profile=activeSteeringProfile(state);
    const priorityBlockers=initiativeId&&profile?priorityEligibilityBlockers(state,initiativeId,profile):[];
    const step: CaseStep = challenge.nominationStatus === "DRAFT" ? "UTKAST" : !initiative ? "REGISTRERAD" : qualification?.status === "QUALIFIED" && !priorityBlockers.length ? "PRIORITERINGSBAR" : "BEREDNING";
    const responsibleId=requirement?.status==="SUBMITTED"?requirement.verifierRoleAssignmentId:requirement?.responsibleRoleAssignmentId;
    const assignment = responsibleId ? state.entities.roleAssignments[responsibleId] : undefined;
    const person = assignment ? state.entities.people[assignment.personId] : undefined;
    const participatingBusinesses = [...new Set(Object.values(state.entities.participations).filter(p=>p.initiativeId===initiativeId).flatMap(p=>p.businessId?[p.businessId]:[]))];
    const areaLabels=participatingBusinesses.map(id=>{const b=state.entities.businesses[id];return `${state.entities.businessAreas[b?.businessAreaId]?.name ?? "Område behöver anges"} · ${b?.name??""}`;});
    const obstacle = requirement?.missingItem ??
      (step === "UTKAST" ? "Utkastet är inte inskickat till beredning" :
       step === "REGISTRERAD" ? "Beredningsinitiativ är ännu inte skapat" :
       step === "BEREDNING" ? priorityBlockers[0]?.description ?? `${qualification?.missingCriterionCodes.length ?? 0} obligatoriska bedömningar återstår` : "Inget känt hinder för prioriteringsdiskussion");
    const overview:CaseOverviewItem = {
      challengeId: challenge.id,
      initiativeId,
      caseNumber: `ÄR-${challenge.createdAt.slice(0, 4)}-${String(index + 1).padStart(3, "0")}`,
      title: challenge.title.trim() || "Namnlöst utkast",
      area: areaLabels.length?areaLabels.join("; "):"Område behöver anges",
      step,
      obstacle,
      nextAction: requirement ? (requirement.status === "SUBMITTED" ? "Verifiera dokumenterat svar" : `Komplettera: ${requirement.missingItem}`) :
        initiativeId ? deriveNextCriticalStep(state, initiativeId).label : step === "UTKAST" ? "Komplettera och skicka till beredning" : "Pröva om beredningsinitiativ ska skapas",
      responsible: person ? person.displayName : "Ansvarig saknas",
      dueDate: requirement?.deadline,
      overdue: Boolean(requirement?.deadline && requirement.deadline < today),
      comparable: !!initiativeId && qualification?.status === "QUALIFIED" && !priorityBlockers.length,
      comparisonReason: priorityBlockers[0]?.description ?? (qualification?.status !== "QUALIFIED" ? "Kvalificeringen är inte slutförd" : undefined),
    };
    if(initiativeId&&!latestDecision(state,initiativeId)) {
      const ready=startReadiness(state,initiativeId,today);
      if(ready.ready||ready.prioritized){overview.step=ready.ready?"STARTKLAR":"PRIORITERAD";overview.nextAction=ready.ready?"Fatta mänskligt startbeslut":"Färdigställ startkraven";overview.obstacle=ready.ready?"Underlaget är startklart; ett mänskligt beslut återstår.":ready.blockers[0];}
    }
    if(initiativeId&&latestDecision(state,initiativeId)) {
      const stage=transformationStage(state,initiativeId),cs=activeCommitments(state,initiativeId);
      overview.step=stage==="Avslutat"?"AVSLUTAT":stage==="Under mätning"?"MATNING":"PAGAENDE";
      const change=cs.find(c=>!c.details?.changeCompletedAt);
      const pending=cs.flatMap(c=>c.details?.measurementDates.filter(date=>!Object.values(state.entities.measurementPoints).some(m=>m.measurementPlanId===c.measurementPlanId&&m.measuredAt===date&&m.verifiedAt)).map(date=>({c,date}))??[]).sort((a,b)=>a.date.localeCompare(b.date))[0];
      const nextRole=change?.details?.changeResponsibleId ?? (pending&&state.entities.measurementPlans[pending.c.measurementPlanId].responsibleRoleAssignmentId);
      overview.responsible=nextRole?state.entities.people[state.entities.roleAssignments[nextRole].personId].displayName:"Ansvarig saknas";
      overview.dueDate=change?.details?.changeDueDate??pending?.date;
      overview.overdue=!!overview.dueDate&&overview.dueDate<today;
      overview.nextAction=stage==="Avslutat"?"Använd lärdom inför eventuell skalning":change?"Genomför beslutad verksamhetsförändring":pending?"Rapportera och verifiera beslutad mätpunkt":"Bedöm utfall och dokumentera lärdom inför avslut";
      overview.obstacle=stage==="Avslutat"?"Beslut och uppmätt utfall bevaras":change?change.details?.changeDescription??"Förändring återstår":pending?"Beslutad mätning är ännu inte verifierad":"Full effekt är uppmätt";
    }
    return overview;
  });
}
