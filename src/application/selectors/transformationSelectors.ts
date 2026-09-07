import { businessCaseDocumentBlockers, challengeDocumentBlockers, documentTextComplete } from "../../domain/caseDocumentRequirements";
import type { DemoState } from "../demoState";
import type { InitiativeId, LocalEffectCommitment, EffectCommitmentId, RoleAssignmentId } from "../../domain";
import type { StartPreparation } from "../../domain/transformation";
import { priorityEligibilityBlockers } from "./prioritySelectors";
import { prerequisiteGraph, topologicalExecutionOrder } from "./executionSelectors";
import { costSummary } from "./costSelectors";
import { currentEffectPotentials } from "./effectPotentialSelectors";
import { capacityStatus } from "./capacitySelectors";

export const validDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)) && new Date(s).toISOString().slice(0,10) === s;
export const latestDecision = (state: DemoState, id: InitiativeId) => Object.values(state.entities.decisionVersions).filter(v => v.initiativeId === id).sort((a,b) => b.versionNumber-a.versionNumber)[0];
export const activeCommitments = (state: DemoState, id: InitiativeId) => {
  const version = latestDecision(state,id);
  const ids = version?.snapshot.commitmentIds as EffectCommitmentId[] | undefined;
  return (ids ?? []).flatMap(key => state.entities.effectCommitments[key] ? [state.entities.effectCommitments[key]] : []);
};
export const acceptedCommitment = (state: DemoState, id: string) => Object.values(state.entities.effectOwnerAcceptances).find(a => a.effectCommitmentId === id);
export const roleValid = (state: DemoState, id: RoleAssignmentId, day: string, kind?: string) => {
  const a = state.entities.roleAssignments[id];
  return !!a && !!state.entities.people[a.personId] && a.validFrom <= day && (!a.validTo || a.validTo >= day) && (!kind || state.entities.roleDefinitions[a.roleDefinitionId]?.roleKind === kind);
};
export const hasMandate = (state: DemoState, role: string, scope: string, day: string) => Object.values(state.entities.mandates).some(m => m.roleAssignmentId === role && m.scope === scope && m.validFrom <= day && (!m.validTo || m.validTo >= day));

export function commitmentBlockers(state: DemoState, c: LocalEffectCommitment, day: string) {
  const d = c.details, baseline = state.entities.baselines[c.baselineId], plan = state.entities.measurementPlans[c.measurementPlanId];
  if (!d || !baseline || !plan) return ["Lokalt åtagande och mätplan saknas eller är ofullständiga."];
  const errors: string[] = [];
  const required = { "Mätetal": d.metricName, "Omfattning": d.scope, "Verksamhetsförändring": d.changeDescription, "Mottagarkapacitet": d.receiverCapacity, "Baselineunderlag": d.baselineReference, "Kvalitetsmått": d.qualitySafeguard, "Kvalitetsgräns": d.qualityLimit, "Datakälla": state.entities.dataSources[plan.dataSourceId]?.description, "Enhet": c.unit };
  Object.entries(required).forEach(([label,value]) => { if (!documentTextComplete(value)) errors.push(`${label} saknas eller innehåller mallens platshållare.`); });
  if (!baseline.verified) errors.push("Baseline är inte aktivt bekräftad.");
  if (!Number.isFinite(c.targetValue) || !Number.isFinite(baseline.value)) errors.push("Baseline och mål måste vara tal.");
  if (!roleValid(state,d.ownerRoleAssignmentId,day,"OWNER") || state.entities.roleAssignments[d.ownerRoleAssignmentId]?.businessId !== c.recipientBusinessId || !hasMandate(state,d.ownerRoleAssignmentId,"ACCEPT_LOCAL_EFFECT",day)) errors.push("Lokal effektägare med giltigt mandat saknas.");
  if (!roleValid(state,d.changeResponsibleId,day)) errors.push("Ansvarig för verksamhetsförändringen saknas.");
  if (!roleValid(state,plan.responsibleRoleAssignmentId,day)) errors.push("Mätningsansvarig saknas.");
  if (!validDate(baseline.measuredAt) || baseline.measuredAt > day) errors.push("Baseline måste vara daterad och uppmätt senast idag.");
  if (!validDate(d.changeDueDate) || !validDate(d.fullEffectDate) || !validDate(d.effectWindow.from) || !validDate(d.effectWindow.to) || d.effectWindow.from > d.effectWindow.to) errors.push("Giltiga förändrings- och effektdatum krävs.");
  if (!d.measurementDates.length || d.measurementDates.some(x => !validDate(x)) || new Set(d.measurementDates).size !== d.measurementDates.length) errors.push("Minst en unik och giltig mättidpunkt krävs.");
  const dates = [...d.measurementDates].sort();
  if (dates.length && (d.changeDueDate > dates[0] || dates[0] < d.effectWindow.from || dates[dates.length-1] > d.effectWindow.to || !dates.includes(d.fullEffectDate) || baseline.measuredAt > dates[0])) errors.push("Mättidpunkter ska följa förändringen och ligga i effektfönstret; full effekt ska ingå i mätplanen.");
  if (d.category === "MONEY" && !["SEK","SEK/år"].includes(c.unit)) errors.push("Pengar anges i SEK eller SEK/år i demon.");
  if(d.category==="MONEY") {
    const plan=d.annualFinancialEffect??[];
    for(let year=Number(d.effectWindow.from.slice(0,4));year<=Number(d.effectWindow.to.slice(0,4));year++){if(!plan.some(p=>p.year===year)){errors.push(`Ekonomisk effekt för ${year} saknas. Ange även bedömd nolleffekt uttryckligen.`);break;}}
    if(!plan.length||plan.some(p=>!Number.isInteger(p.year)||!Number.isFinite(p.amount)||p.year<Number(d.effectWindow.from.slice(0,4))||p.year>Number(d.effectWindow.to.slice(0,4)))||new Set(plan.map(p=>p.year)).size!==plan.length)errors.push("Ange verksamhetens ekonomiska plan per unikt kalenderår inom effektfönstret. Årstakt får inte automatiskt multipliceras till total effekt.");
  }
  if (d.category === "RELEASED_TIME" && !["timmar","timmar/år"].includes(c.unit)) errors.push("Frigjord tid anges i timmar eller timmar/år, utan automatisk monetarisering.");
  return errors;
}

export function startBlockers(state: DemoState, p: StartPreparation, day: string) {
  const errors: string[] = [];
  const e = state.entities, i = e.initiatives[p.initiativeId], profile = e.steeringProfileVersions[p.steeringProfileVersionId];
  if (!i || !profile) return ["Initiativ eller styrprofil saknas."];
  errors.push(...priorityEligibilityBlockers(state,i.id,profile).map(x=>x.description));
  const challenge=e.challenges[i.challengeId];
  if(challenge?.nominationStatus!=="NOMINATED")errors.push("Utmaningen måste vara registrerad för beredning.");
  if(challenge) errors.push(...challengeDocumentBlockers(challenge),...businessCaseDocumentBlockers(challenge));
  const a = e.priorityAssessments[p.priorityAssessmentId];
  if (!a || a.initiativeId !== i.id || a.steeringProfileVersionId !== profile.id || !["ACCEPTED","OVERRIDDEN"].includes(a.status)) errors.push("Mänskligt granskat prioriteringsunderlag för rätt ärende och styrprofil krävs.");
  if (a && currentEffectPotentials(state,i.id).some(potential=>!a.effectPotentialIds.includes(potential.id))) errors.push("Effektpotentialen har ändrats. Prioriteringsunderlaget måste ombedömas före beslut.");
  if (profile.status!=="ACTIVE" || profile.validFrom>day || (profile.validTo&&profile.validTo<day)) errors.push("Start kräver gällande aktiv styrprofil, inte ett jämförelsescenario.");
  if (!e.transformationGovernance[p.governanceVersionId]) errors.push("Versionsbestämd demostyrning saknas.");
  else if(e.transformationGovernance[p.governanceVersionId].validFrom>day) errors.push("Styrversionen gäller inte ännu.");
  Object.entries({ "Finansiering":p.fundingReference,"Kapacitet":p.capacityReference,"Lagkrav":p.legalReference,"Kvalitetskrav":p.qualityReference,"Förutsättningsbedömning":p.prerequisitesReview,"Ekonomisk bedömning":p.economicRationale }).forEach(([key,value])=>{if (!value.trim()) errors.push(`${key} måste vara bedömd och dokumenterad.`);});
  if (!p.recipientBusinessIds.length) errors.push("Minst en deltagande effektmottagande verksamhet krävs.");
  const recipients = Object.values(e.participations).filter(x=>x.initiativeId===i.id && x.participantKind==="EFFECT_RECIPIENT" && x.validFrom<=day && (!x.validTo||x.validTo>=day)).flatMap(x=>x.businessId?[x.businessId]:[]);
  if (!recipients.length || recipients.some(id=>!p.recipientBusinessIds.includes(id)) || p.recipientBusinessIds.some(id=>!recipients.includes(id))) errors.push("Beslutspaketet måste omfatta samtliga registrerade effektmottagare.");
  const keys = new Set<string>();
  for (const id of p.commitmentIds) {
    const c = e.effectCommitments[id];
    if (!c || c.initiativeId !== i.id || !p.recipientBusinessIds.includes(c.recipientBusinessId)) { errors.push("Åtagandet tillhör fel ärende eller mottagare."); continue; }
    const key = `${c.recipientBusinessId}:${c.details?.category}:${c.details?.metricName}`;
    if (keys.has(key)) errors.push("Samma lokala effekt får inte räknas flera gånger i beslutet."); keys.add(key);
    if(Object.values(e.initiatives).filter(other=>other.id!==i.id).flatMap(other=>activeCommitments(state,other.id)).some(other=>other.recipientBusinessId===c.recipientBusinessId&&other.details?.metricName.trim().toLowerCase()===c.details?.metricName.trim().toLowerCase()&&other.details?.scope.trim().toLowerCase()===c.details?.scope.trim().toLowerCase()))errors.push("Samma mottagare, omfattning och effektmått finns redan i ett annat beslutat initiativ. Red ut överlappet före start.");
    errors.push(...commitmentBlockers(state,c,day).map(x=>`${e.businesses[c.recipientBusinessId]?.name}: ${x}`));
    const acceptance=acceptedCommitment(state,id);
    if (!acceptance || acceptance.acceptedAt.slice(0,10)>day) errors.push(`${e.businesses[c.recipientBusinessId]?.name}: aktiv effektägaraccept saknas.`);
    if(c.details && (c.details.effectWindow.from<p.costHorizon.from || c.details.effectWindow.to>p.costHorizon.to))errors.push("Ekonomisk jämförelseperiod måste täcka hela effekthemtagningsfönstret.");
  }
  p.recipientBusinessIds.forEach(id=>{if(!p.commitmentIds.some(key=>e.effectCommitments[key]?.recipientBusinessId===id))errors.push(`${e.businesses[id]?.name}: lokalt effektåtagande saknas.`);});
  const graph = prerequisiteGraph(state,i.id);
  capacityStatus(state,i.id).filter(c=>c.status!=="AVAILABLE").forEach(c=>errors.push(`Genomförandekapacitet ${c.status==="UNKNOWN"?"inte styrkt":"otillräcklig"}: ${c.demand.poolReference}.`));
  if (!topologicalExecutionOrder(state,i.id).valid) errors.push("Förutsättningsgrafen innehåller en cirkel.");
  const prerequisiteIds = new Set(graph.dependencies.filter(d=>d.blocking && d.requiredAt==="NODE_START").map(d=>d.predecessorNodeId));
  graph.nodes.filter(n=>prerequisiteIds.has(n.id) && ["EXISTING_CAPABILITY","ENABLING_DELIVERY"].includes(n.nodeKind) && n.ownerInitiativeId!==i.id && n.availabilityStatus!=="AVAILABLE").forEach(n=>errors.push(`Förutsättning inte klar: ${n.title}.`));
  Object.values(e.completionRequirements).filter(r=>(r.initiativeId===i.id||r.challengeId===i.challengeId)&&r.blocks.includes("START_DECISION")&&!["VERIFIED","NOT_APPLICABLE"].includes(r.status)).forEach(r=>errors.push(r.missingItem));
  if (!validDate(p.costHorizon.from)||!validDate(p.costHorizon.to)||p.costHorizon.from>p.costHorizon.to) errors.push("Ekonomisk jämförelseperiod saknas.");
  else {
    const cost=costSummary(state,[i.id],"ESTIMATE",p.costHorizon);
    if (!cost.sourceRefs.length) errors.push("Dokumenterat kostnadsunderlag krävs, även vid bedömd nollkostnad.");
    if (cost.completeness!=="COMPLETE") errors.push("Kostnadsperioden innehåller ej beräknade delår.");
  }
  return [...new Set(errors)];
}

export function effectOutcome(state: DemoState, c: LocalEffectCommitment, asOf: string) {
  const baseline=state.entities.baselines[c.baselineId];
  const plan=state.entities.measurementPlans[c.measurementPlanId];
  const metric=plan && state.entities.metricDefinitions[plan.metricDefinitionId];
  const sign=metric?.direction==="LOWER_IS_BETTER"?-1:1;
  const points=Object.values(state.entities.measurementPoints).filter(m=>m.measurementPlanId===c.measurementPlanId && m.verifiedAt && m.verifiedAt.slice(0,10)<=asOf && m.measuredAt<=asOf).sort((a,b)=>b.measuredAt.localeCompare(a.measuredAt));
  const point=points[0];
  return { target: (c.targetValue-(baseline?.value??0))*sign, realized: point?(point.value-baseline.value)*sign:undefined, point, qualityMet: point?.qualityMet, unit:["%","procent"].includes(c.unit.toLowerCase())?"procentenheter":c.unit };
}
export function committedEconomics(state:DemoState,ids:InitiativeId[],period:{from:string;to:string},recipientBusinessIds?:string[]) {
  const commitments=ids.flatMap(id=>activeCommitments(state,id)).filter(c=>!recipientBusinessIds||recipientBusinessIds.includes(c.recipientBusinessId));
  return economicsForCommitments(state,ids,commitments,period);
}
export function preparedEconomics(state:DemoState,p:StartPreparation) {
  return economicsForCommitments(state,[p.initiativeId],p.commitmentIds.flatMap(id=>state.entities.effectCommitments[id]?[state.entities.effectCommitments[id]]:[]),p.costHorizon);
}
function economicsForCommitments(state:DemoState,ids:InitiativeId[],commitments:LocalEffectCommitment[],period:{from:string;to:string}) {
  const annual=commitments.flatMap(c=>(c.details?.annualFinancialEffect??[]).map(p=>({...p,commitmentId:c.id})));
  const included=annual.filter(p=>`${p.year}-01-01`>=period.from&&`${p.year}-12-31`<=period.to);
  const money=included.reduce((sum,p)=>sum+p.amount,0),cost=costSummary(state,ids,"ESTIMATE",period);
  const hasPlan=included.length>0;
  return {plannedFinancialEffect:hasPlan?money:undefined,cost:cost.amount,plannedNet:hasPlan&&cost.completeness==="COMPLETE"?money-cost.amount:undefined,sourceRefs:included.map(p=>p.commitmentId),costCompleteness:cost.completeness};
}
export function transformationStage(state: DemoState,id: InitiativeId) {
  if (state.entities.initiatives[id]?.closedAt) return "Avslutat";
  const commitments=activeCommitments(state,id);
  if (!latestDecision(state,id)) return "Under beredning";
  if (commitments.some(c=>c.details?.changeCompletedAt)) return "Under mätning";
  return "Pågående";
}
