import { createId } from "../domain";
import type { Command } from "./commands";
import type { CommandResult } from "./commandResult";
import type { DemoState } from "./demoState";
import { acceptedCommitment, activeCommitments, commitmentBlockers, effectOutcome, hasMandate, latestDecision, preparedEconomics, roleValid, startBlockers, validDate } from "./selectors/transformationSelectors";
import { costSummary, costsByOrigin } from "./selectors/costSelectors";
import { prerequisiteGraph } from "./selectors/executionSelectors";

const types = new Set(["SAVE_EFFECT_COMMITMENT","ACCEPT_EFFECT_COMMITMENT","SAVE_START_PREPARATION","DECIDE_TRANSFORMATION","CONFIRM_BUSINESS_CHANGE","RECORD_EFFECT_MEASUREMENT","VERIFY_EFFECT_MEASUREMENT","RECORD_EFFECT_FORECAST","COMPLETE_TRANSFORMATION","SAVE_TRANSFORMATION_GOVERNANCE"]);
// Deterministic integrity checksum for demo history, not a cryptographic signature.
function snapshotChecksum(value:unknown) {let hash=2166136261;for(const char of JSON.stringify(value)){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619);}return `fnv1a-${(hash>>>0).toString(16).padStart(8,"0")}`;}
const fail = (state: DemoState, description: string): CommandResult => ({ success:false,nextState:state,affectedEntityIds:[],errors:[{code:"INVALID_PAYLOAD",description}] });
export function transformationReducer(state: DemoState, command: Command): CommandResult | undefined {
  if (!types.has(command.commandType)) return;
  const day=command.issuedAt.slice(0,10), actor=command.actorRoleAssignmentId;
  if (!validDate(day) || !roleValid(state,actor,day)) return fail(state,"En giltig person och roll vid handlingens datum krävs.");
  const next=structuredClone(state), e=next.entities;
  const id="targetId" in command ? command.targetId : "";
  const affected: string[]=[id];
  const commitTarget=Object.values(e.effectCommitments).find(c=>c.id===id);
  const commandInitiative="payload" in command && "initiativeId" in command.payload ? command.payload.initiativeId : commitTarget?.initiativeId;
  if(commandInitiative && e.initiatives[commandInitiative]?.closedAt)return fail(state,"Ärendet är avslutat. Skapa ett separat initiativ för nästa förändring.");
  switch (command.commandType) {
    case "SAVE_EFFECT_COMMITMENT": {
      const p=command.payload;
      if (Object.values(e.effectCommitments).find(c=>c.id===id)) return fail(state,"Ett sparat åtagande får inte skrivas över. Skapa en ny version.");
      if (!e.initiatives[p.initiativeId] || !e.businesses[p.businessId]) return fail(state,"Initiativ och lokal effektmottagare krävs.");
      if (!Number.isFinite(p.baseline)||!Number.isFinite(p.target)||!p.unit.trim()) return fail(state,"Ange numerisk baseline och mål samt enhet.");
      if (!e.roleAssignments[p.measurementResponsibleId] || !e.roleAssignments[p.details.ownerRoleAssignmentId] || !e.roleAssignments[p.details.changeResponsibleId]) return fail(state,"Utpekad effektägare, förändringsansvarig och mätningsansvarig krävs.");
      const previous=p.details.supersedesId?e.effectCommitments[p.details.supersedesId]:undefined;
      if (p.details.supersedesId && (!previous||previous.initiativeId!==p.initiativeId||previous.recipientBusinessId!==p.businessId)) return fail(state,"Föregående åtagande måste tillhöra samma ärende och mottagare.");
      const metricId=createId("MetricDefinition",id), sourceId=createId("DataSource",id), baselineId=createId("Baseline",id), planId=createId("MeasurementPlan",id);
      e.metricDefinitions[metricId]={id:metricId,name:p.details.metricName,unit:p.unit,direction:p.direction};
      e.dataSources[sourceId]={id:sourceId,name:p.details.metricName,description:p.dataSource,isSynthetic:true};
      e.baselines[baselineId]={id:baselineId,initiativeId:p.initiativeId,businessId:p.businessId,metricDefinitionId:metricId,value:p.baseline,measuredAt:p.baselineDate,verified:p.baselineVerified};
      e.measurementPlans[planId]={id:planId,metricDefinitionId:metricId,dataSourceId:sourceId,frequency:"Enligt datumsatt lokal mätplan",responsibleRoleAssignmentId:p.measurementResponsibleId};
      e.effectCommitments[command.targetId]={id:command.targetId,initiativeId:p.initiativeId,recipientBusinessId:p.businessId,baselineId,measurementPlanId:planId,targetValue:p.target,unit:p.unit,details:{...p.details,createdAt:command.issuedAt,version:(previous?.details?.version??0)+1,changeCompletedAt:undefined,changeEvidence:undefined}};
      affected.push(metricId,sourceId,baselineId,planId,p.initiativeId);
      break;
    }
    case "ACCEPT_EFFECT_COMMITMENT": {
      const c=Object.values(e.effectCommitments).find(c=>c.id===id); if (!c) return fail(state,"Åtagandet saknas.");
      const blockers=commitmentBlockers(next,c,day);
      if (blockers.length) return fail(state,blockers.join(" "));
      if (!command.payload.accepted || !command.payload.mandateDescription.trim() || actor!==c.details?.ownerRoleAssignmentId) return fail(state,"Den utpekade lokala effektägaren måste aktivt acceptera åtagandet och ange mandatet.");
      if (acceptedCommitment(next,id)) return fail(state,"Åtagandet har redan accepterats. Historiken bevaras.");
      const acceptanceId=createId("EffectOwnerAcceptance",id);
      e.effectOwnerAcceptances[acceptanceId]={id:acceptanceId,effectCommitmentId:c.id,ownerRoleAssignmentId:actor,mandateDescription:command.payload.mandateDescription,acceptedAt:command.issuedAt};
      affected.push(acceptanceId); break;
    }
    case "SAVE_START_PREPARATION": {
      if (e.startPreparations[id]) return fail(state,"Beslutspaketet är versionsbundet och får inte skrivas över.");
      if (!e.initiatives[command.payload.initiativeId]) return fail(state,"Initiativ saknas.");
      e.startPreparations[id]={...command.payload,id,preparedAt:command.issuedAt,preparedBy:actor};break;
    }
    case "DECIDE_TRANSFORMATION": {
      const p=e.startPreparations[command.payload.preparationId]; if (!p) return fail(state,"Beslutspaketet saknas.");
      if(e.initiatives[p.initiativeId]?.closedAt)return fail(state,"Ett avslutat ärende kan inte startas igen.");
      if (!command.payload.accepted||!command.payload.rationale.trim()||!roleValid(next,actor,day,"DECISION_MAKER")||!hasMandate(next,actor,"START_TRANSFORMATION",day)) return fail(state,"Ett aktivt mänskligt beslut med giltigt startmandat och motivering krävs.");
      const old=latestDecision(next,p.initiativeId);
      if ((command.payload.type==="START" && old)||(command.payload.type==="CHANGE" && !old)) return fail(state,"Efter start krävs ändringsbeslut. Före start krävs startbeslut.");
      if(command.payload.type==="CHANGE" && (!command.payload.changeImpact || Object.values(command.payload.changeImpact).some(v=>!v.trim())))return fail(state,"Ändringsbeslut kräver konsekvenser för kostnad, tid, kvalitet och effekt.");
      const blockers=startBlockers(next,p,day); if(blockers.length)return fail(state,blockers.join(" "));
      const decisionId=createId("HumanDecision",id), versionId=createId("DecisionVersion",id);
      if(e.humanDecisions[decisionId])return fail(state,"Beslutsidentiteten används redan.");
      const mandate=Object.values(e.mandates).find(m=>m.roleAssignmentId===actor&&m.scope==="START_TRANSFORMATION"&&m.decisionFunctionId&&m.validFrom<=day&&(!m.validTo||m.validTo>=day));
      if (!mandate?.decisionFunctionId) return fail(state,"Beslutsfunktionen måste vara angiven i mandatet.");
      e.humanDecisions[decisionId]={id:decisionId,initiativeId:p.initiativeId,decisionFunctionId:mandate.decisionFunctionId,decisionMakerRoleAssignmentId:actor,decisionType:command.payload.type,decidedAt:command.issuedAt,rationale:command.payload.rationale};
      const commitments=p.commitmentIds.map(key=>e.effectCommitments[key]);
      const snapshot={ economics:preparedEconomics(next,p),preparation:structuredClone(p),commitmentIds:[...p.commitmentIds],commitments:structuredClone(commitments),baselines:commitments.map(c=>structuredClone(e.baselines[c.baselineId])),plans:commitments.map(c=>structuredClone(e.measurementPlans[c.measurementPlanId])),acceptances:commitments.map(c=>structuredClone(acceptedCommitment(next,c.id))),priority:structuredClone(e.priorityAssessments[p.priorityAssessmentId]),governance:structuredClone(e.transformationGovernance[p.governanceVersionId]),costs:structuredClone(costsByOrigin(next,[p.initiativeId]).filter(c=>c.economicStatus==="ESTIMATE")),costSummary:costSummary(next,[p.initiativeId],"ESTIMATE",p.costHorizon),dependencies:structuredClone(prerequisiteGraph(next,p.initiativeId)),changeImpact:command.payload.changeImpact };
      e.decisionVersions[versionId]={id:versionId,initiativeId:p.initiativeId,humanDecisionId:decisionId,versionNumber:(old?.versionNumber??0)+1,snapshot,checksum:snapshotChecksum(snapshot)};
      if (old) { const changeId=createId("ChangeProposal",id); e.changeProposals[changeId]={id:changeId,initiativeId:p.initiativeId,proposedByRoleAssignmentId:actor,description:command.payload.rationale,costImpact:command.payload.changeImpact!.cost,timeImpact:command.payload.changeImpact!.time,qualityImpact:command.payload.changeImpact!.quality,effectImpact:command.payload.changeImpact!.effect,createdAt:command.issuedAt};affected.push(changeId); }
      affected.push(decisionId,versionId,p.initiativeId);break;
    }
    case "CONFIRM_BUSINESS_CHANGE": {
      const c=Object.values(e.effectCommitments).find(c=>c.id===id); if(!c?.details || !activeCommitments(next,c.initiativeId).some(x=>x.id===id))return fail(state,"Förändringen måste tillhöra ett startat och beslutat åtagande.");
      if(c.details.changeCompletedAt)return fail(state,"Förändringen är redan bekräftad.");
      if(actor!==c.details.changeResponsibleId||!validDate(command.payload.date)||command.payload.date>day||!command.payload.evidence.trim())return fail(state,"Utpekad förändringsansvarig ska ange genomfört datum och evidens.");
      c.details.changeCompletedAt=command.payload.date;c.details.changeEvidence=command.payload.evidence;break;
    }
    case "RECORD_EFFECT_MEASUREMENT": {
      const p=command.payload,c=e.effectCommitments[p.commitmentId],mId=createId("MeasurementPoint",id);
      if(!c?.details?.changeCompletedAt || !activeCommitments(next,c.initiativeId).some(x=>x.id===c.id))return fail(state,"Verksamhetsförändringen ska vara genomförd för ett aktivt åtagande före effektmätning.");
      if(e.measurementPoints[mId])return fail(state,"Mätidentiteten används redan.");
      if(!c.details.measurementDates.includes(p.date)||p.date>day||p.date<c.details.changeCompletedAt||typeof p.qualityMet!=="boolean"||!Number.isFinite(p.value)||!p.evidence.trim()||!p.qualityObservation.trim())return fail(state,"Följ beslutad mättidpunkt efter förändringen och ange värde, evidens och kvalitetsutfall. Framtida utfall får inte registreras.");
      const plan=e.measurementPlans[c.measurementPlanId];
      if(actor!==plan.responsibleRoleAssignmentId)return fail(state,"Endast utsedd mätningsansvarig får registrera utfallet.");
      if(Object.values(e.measurementPoints).some(m=>m.measurementPlanId===plan.id&&m.measuredAt===p.date))return fail(state,"Det finns redan en mätpunkt för detta åtagande och datum.");
      e.measurementPoints[mId]={id:mId,measurementPlanId:plan.id,measuredAt:p.date,value:p.value,evidenceReference:p.evidence,qualityObservation:p.qualityObservation,qualityMet:p.qualityMet,decisionVersionId:latestDecision(next,c.initiativeId)!.id};affected.push(mId);break;
    }
    case "VERIFY_EFFECT_MEASUREMENT": {
      const m=Object.values(e.measurementPoints).find(m=>m.id===id); if(!m||m.verifiedAt)return fail(state,"Mätpunkten saknas eller är redan verifierad.");
      if(!command.payload.accepted||!roleValid(next,actor,day,"SPECIALIST")||m.measuredAt>day)return fail(state,"Specialisten måste aktivt verifiera en uppmätt mätpunkt.");
      m.verifiedAt=command.issuedAt;m.verifiedByRoleAssignmentId=actor;break;
    }
    case "RECORD_EFFECT_FORECAST": {
      const p=command.payload,c=e.effectCommitments[p.commitmentId];
      if(!c||!activeCommitments(next,c.initiativeId).some(x=>x.id===c.id)||!Number.isFinite(p.value)||!validDate(p.date)||p.date<day||e.initiatives[c.initiativeId]?.closedAt)return fail(state,"Prognosen kräver aktivt beslutat åtagande, värde och datum.");
      const fId=createId("EffectForecast",id);if(e.effectForecasts[fId])return fail(state,"Prognosidentiteten används redan.");
      e.effectForecasts[fId]={id:fId,effectCommitmentId:c.id,forecastValue:p.value,forecastDate:p.date,recordedAt:command.issuedAt};affected.push(fId);break;
    }
    case "COMPLETE_TRANSFORMATION": {
      const cs=activeCommitments(next,command.targetId);
      if(!cs.length || e.initiatives[command.targetId]?.closedAt)return fail(state,"Ett pågående initiativ med beslutade åtaganden krävs.");
      if(!roleValid(next,actor,day,"DECISION_MAKER")||!hasMandate(next,actor,"START_TRANSFORMATION",day))return fail(state,"Avslut kräver giltigt beslutsmandat.");
      if(cs.some(c=>!c.details?.changeCompletedAt || !Object.values(e.measurementPoints).some(m=>m.measurementPlanId===c.measurementPlanId&&m.measuredAt===c.details?.fullEffectDate&&m.verifiedAt)))return fail(state,"Samtliga lokala förändringar och verifierad mätning vid full effekt krävs före avslut.");
      if(!command.payload.observation.trim()||!command.payload.evidence.trim())return fail(state,"Dokumentera lärdom och underlag även när effektmålet inte uppnåddes.");
      e.initiatives[command.targetId].closedAt=command.issuedAt;
      const lId=createId("LearningRecord",command.commandId);e.learningRecords[lId]={id:lId,initiativeId:command.targetId,observation:command.payload.observation,evidenceReferences:[command.payload.evidence],recordedAt:command.issuedAt};affected.push(lId);
      // Reading an outcome never changes its goal or verification state.
      cs.forEach(c=>effectOutcome(next,c,day));break;
    }
    case "SAVE_TRANSFORMATION_GOVERNANCE": {
      if(e.transformationGovernance[id]||!validDate(command.payload.validFrom)||Object.values(command.payload).some(v=>!v.trim()))return fail(state,"Ange samtliga styrparametrar och en ny version.");
      if(!roleValid(next,actor,day,"DECISION_MAKER"))return fail(state,"Demostyrning ändras av beslutsrollen.");
      e.transformationGovernance[id]={id,...command.payload,version:Math.max(0,...Object.values(e.transformationGovernance).map(g=>g.version))+1,createdAt:command.issuedAt,demoAssumption:"Ej beslutad – används endast i demo."};break;
    }
    default: return;
  }
  next.audit.push({id:createId("AuditEntry",command.commandId),commandId:command.commandId,commandType:command.commandType,actorRoleAssignmentId:actor,issuedAt:command.issuedAt,affectedEntityIds:affected});
  return {success:true,nextState:next,affectedEntityIds:affected};
}
