import { caseFlow } from "./selectors/flowSelectors";
import { caseNextActions } from "./selectors/controlRoomSelectors";
import { describe, expect, it } from "vitest";
import { initializeDemoState } from "./initializeDemoState";
import { demoReducer } from "./demoReducer";
import type { Command } from "./commands";
import type { DemoState } from "./demoState";
import { createId } from "../domain";
import { referenceCommitment } from "../demo-data/referenceCommitment";
import { roleAssignments } from "../demo-data/peopleAndRoles";
import { acceptedCommitment, activeCommitments, effectOutcome, effectFollowUp, preparedEconomics, latestDecision, startBlockers } from "./selectors/transformationSelectors";

let seq=0;
const specialist=roleAssignments[1].id,decision=roleAssignments[2].id,owner=referenceCommitment.details.ownerRoleAssignmentId;
const commitmentId=createId("EffectCommitment","journey");
const meta=(actor=specialist,date="2026-09-06")=>({commandId:createId("Command",`journey-${++seq}`),actorRoleAssignmentId:actor,issuedAt:`${date}T12:00:00Z`});
function apply(state:DemoState,c:Command) {const r=demoReducer(state,c);if(!r.success)throw Error(r.errors.map(e=>e.description).join(" | "));return r.nextState;}
function draft() {return apply(initializeDemoState(),{...meta(),commandType:"SAVE_EFFECT_COMMITMENT",targetId:commitmentId,payload:{...referenceCommitment,baselineVerified:true}});}
function ready() {
  let state=draft();
  state=apply(state,{...meta(owner),commandType:"ACCEPT_EFFECT_COMMITMENT",targetId:commitmentId,payload:{accepted:true,mandateDescription:"Syntetiskt lokalt mandat."}});
  const b=state.entities.businesses[referenceCommitment.businessId];
  state=apply(state,{...meta(),commandType:"ADD_PARTICIPATION",targetId:createId("Participation","journey"),payload:{initiativeId:referenceCommitment.initiativeId,businessId:b.id,organizationId:b.organizationId,participantKind:"EFFECT_RECIPIENT",validFrom:"2026-09-06"}});
  const a=Object.values(state.entities.priorityAssessments).find(a=>a.initiativeId===referenceCommitment.initiativeId)!;
  state=apply(state,{...meta(),commandType:"SAVE_START_PREPARATION",targetId:"package-journey",payload:{initiativeId:referenceCommitment.initiativeId,recipientBusinessIds:[b.id],commitmentIds:[commitmentId],priorityAssessmentId:a.id,steeringProfileVersionId:a.steeringProfileVersionId,governanceVersionId:"GOVERNANCE-DEMO-1",fundingReference:"Syntetiskt lokalt anslag 120000 SEK.",capacityReference:"Ansvarig har avsatt tid.",legalReference:"Syntetisk bedömning av avtals- och informationskrav.",qualityReference:"100 procent av kritiska tjänster ska ha avtal.",prerequisitesReview:"Inget olöst externt tekniskt beroende.",economicRationale:"Kostnad 120000 under 2026; bedömd årlig besparing 180000 vid full effekt. Perioderna särredovisas.",costHorizon:{from:"2026-01-01",to:"2027-12-31"}}});
  return state;
}
function start(state=ready()) {return apply(state,{...meta(decision),commandType:"DECIDE_TRANSFORMATION",targetId:"decision-journey",payload:{preparationId:"package-journey",accepted:true,rationale:"Syntetiskt startbeslut för full kedja.",type:"START"}});}



describe("regler från granskat underlag till aktivt beslut",()=>{
  it("bevarar beslutade steg och skiljer väntan på mätning från specialistverifiering",()=>{
    let state=start();const id=referenceCommitment.initiativeId,challengeId=state.entities.initiatives[id].challengeId;
    state=apply(state,{...meta(referenceCommitment.details.changeResponsibleId,"2026-12-31"),commandType:"CONFIRM_BUSINESS_CHANGE",targetId:commitmentId,payload:{date:"2026-12-31",evidence:"Nytt arbetssätt används"}});
    const flow=caseFlow(state,challengeId,"2026-12-31");
    expect(flow.find(s=>s.key==="measurement")?.status).toBe("WAITING");
    expect(flow.filter(s=>["material","businesscase","potential","qualification","priority","conditions","commitments","decision"].includes(s.key)).every(s=>s.status==="COMPLETE")).toBe(true);
    expect(caseNextActions(state,challengeId,"2026-12-31").next?.destination.section).toBe("measurement");
    const date=referenceCommitment.details.measurementDates[0];
    state=apply(state,{...meta(referenceCommitment.measurementResponsibleId,date),commandType:"RECORD_EFFECT_MEASUREMENT",targetId:"awaiting-verification",payload:{commitmentId,date,value:430000,evidence:"Mätuttag",qualityObservation:"Kvalitet uppfylld",qualityMet:true}});
    const next=caseFlow(state,challengeId,date).find(s=>s.key==="measurement")!;
    expect(next.status).toBe("ACTION");
    expect(next.summary).toContain("specialistverifiering");
    expect(next.responsibleId).toBeUndefined();
    expect(caseNextActions(state,challengeId,date).next?.reason).toBe(next.summary);
  });
  it.each(["START","WAIT","INVESTIGATE","STOP"] as const)("granskat råd %s är underlag; kräver separat aktivt startbeslut",(advice)=>{
    const state=ready(),p=state.entities.startPreparations["package-journey"],a=state.entities.priorityAssessments[p.priorityAssessmentId];
    a.status="ACCEPTED";a.systemRecommendation=advice;delete a.humanRecommendation;
    expect(startBlockers(state,p,"2026-09-06")).toEqual([]);
    expect(latestDecision(state,p.initiativeId)).toBeUndefined();
    expect(demoReducer(state,{...meta(decision),commandType:"DECIDE_TRANSFORMATION",targetId:"not-accepted",payload:{preparationId:p.id,accepted:false,rationale:"Råd är inget beslut",type:"START"}}).success).toBe(false);
    expect(latestDecision(start(state),p.initiativeId)).toBeDefined();
  });
  it("ett nyare ogranskat underlag gör ett gammalt paket inaktuellt",()=>{
    const state=ready(),p=state.entities.startPreparations["package-journey"],a=state.entities.priorityAssessments[p.priorityAssessmentId];
    const id=createId("PriorityAssessment","newer-same-day");
    state.entities.priorityAssessments[id]={...a,id,status:"CALCULATED"};
    expect(startBlockers(state,p,"2026-09-06").join(" ")).toContain("nyare bedömning");
  });
  it("senare leverans kan vara planerad vid start; uttryckligt startvillkor måste vara tillgängligt",()=>{
    const state=ready(),p=state.entities.startPreparations["package-journey"];
    const target=Object.values(state.entities.executionNodes).find(n=>n.ownerInitiativeId===p.initiativeId)!;
    const predecessor={...target,id:createId("ExecutionNode","future-prerequisite"),responsibleRoleAssignmentId:specialist,availabilityStatus:"PLANNED" as const,plannedPeriod:{from:"2026-09-10",to:"2026-10-01"}};
    target.plannedPeriod={from:"2026-11-01",to:"2026-12-01"};
    state.entities.executionNodes[predecessor.id]=predecessor;
    const id=createId("Dependency","timing-check");
    state.entities.dependencies[id]={id,predecessorNodeId:predecessor.id,successorNodeId:target.id,dependencyType:"FINISH_TO_START",requiredDeliverable:"Testleverans",blocking:true,requiredAt:"NODE_START",rationale:"Behövs inför leveransen",sourceRefs:["test"]};
    expect(startBlockers(state,p,"2026-09-06")).toEqual([]);
    state.entities.dependencies[id].requiredAt="INITIATIVE_START";
    expect(startBlockers(state,p,"2026-09-06").join(" ")).toContain("Förutsättning inte klar");
    predecessor.availabilityStatus="AVAILABLE" as never;
    expect(startBlockers(state,p,"2026-09-06")).toEqual([]);
  });
  it("saknat kostnadsunderlag och ofullständig årsperiod ger inget skenbart netto",()=>{
    const state=ready(),p=state.entities.startPreparations["package-journey"];
    expect(preparedEconomics(state,p).plannedNet).toBeDefined();
    state.entities.costEntries={};
    expect(preparedEconomics(state,p).plannedNet).toBeUndefined();
    state.entities.effectCommitments[commitmentId].details!.annualFinancialEffect!.push({year:2028,amount:100000});
    p.costHorizon={from:"2027-06-01",to:"2028-12-31"};
    expect(preparedEconomics(state,p).plannedFinancialEffect).toBeUndefined();
  });
  it("en förändring kan inte registreras som genomförd före startbeslutet",()=>{
    const state=start();
    const result=demoReducer(state,{...meta(referenceCommitment.details.changeResponsibleId),commandType:"CONFIRM_BUSINESS_CHANGE",targetId:commitmentId,payload:{date:"2026-09-01",evidence:"Fel datum"}});
    expect(result.success).toBe(false);
    expect(effectFollowUp(state,referenceCommitment.initiativeId,"2026-09-06").changes).toHaveLength(1);
  });
});

describe("verksamhetsägd effekt från åtagande till uppföljning",()=>{
  it.each(["effect","owner","dependency","milestone"] as const)("spärrar start utan komplett underlag: %s",(missing)=>{
    const state=ready(),id=referenceCommitment.initiativeId;
    expect(startBlockers(state,state.entities.startPreparations["package-journey"],"2026-09-06")).toEqual([]);
    if(missing==="effect") {
      state.entities.effectPotentials={};
      Object.values(state.entities.steeringProfileVersions).forEach(p=>p.criteria.forEach(c=>{if(c.code==="EFFECT")c.required=false;}));
    } else if(missing==="owner") {
      delete state.entities.roleAssignments[owner];
    } else {
      const successor=Object.values(state.entities.executionNodes).find(n=>n.contextInitiativeIds.includes(id))!;
      const predecessor={...successor,id:createId("ExecutionNode",`start-${missing}`),ownerInitiativeId:Object.values(state.entities.initiatives).find(i=>i.id!==id)!.id,nodeKind:"BUSINESS_CHANGE" as const,availabilityStatus:"PLANNED" as const,neededAt:missing==="milestone"?"":"2026-09-06"};
      state.entities.executionNodes[predecessor.id]=predecessor;
      const edge={...Object.values(state.entities.dependencies)[0],id:createId("Dependency",`start-${missing}`),predecessorNodeId:predecessor.id,successorNodeId:successor.id,blocking:true,requiredAt:missing==="milestone"?"MILESTONE" as const:"INITIATIVE_START" as const};
      state.entities.dependencies[edge.id]=edge;
    }
    const errors=startBlockers(state,state.entities.startPreparations["package-journey"],"2026-09-06").join(" ");
    expect(errors).toContain({effect:"Angiven effekt från businesscase saknas",owner:"Lokal effektägare",dependency:"Förutsättning inte klar",milestone:"Senare beroende saknar"}[missing]);
    const before=JSON.stringify(state);
    const result=demoReducer(state,{...meta(decision),commandType:"DECIDE_TRANSFORMATION",targetId:`blocked-${missing}`,payload:{preparationId:"package-journey",accepted:true,rationale:"Får inte passera spärren",type:"START"}});
    expect(result.success).toBe(false);
    expect(JSON.stringify(state)).toBe(before);
    expect(latestDecision(state,id)).toBeUndefined();
  });
  it("stoppar fel effektägare, saknad accept och ofullständigt beslutspaket utan någon delmutation",()=>{
    const state=draft(),before=JSON.stringify(state);
    const result=demoReducer(state,{...meta(specialist),commandType:"ACCEPT_EFFECT_COMMITMENT",targetId:commitmentId,payload:{accepted:true,mandateDescription:"IT kan inte binda verksamheten"}});
    expect(result.success).toBe(false);expect(JSON.stringify(state)).toBe(before);expect(acceptedCommitment(state,commitmentId)).toBeUndefined();
    const readyState=ready();delete readyState.entities.effectOwnerAcceptances[acceptedCommitment(readyState,commitmentId)!.id];
    expect(startBlockers(readyState,readyState.entities.startPreparations["package-journey"],"2026-09-06").join(" ")).toContain("aktiv effektägaraccept saknas");
    expect(demoReducer(readyState,{...meta(decision),commandType:"DECIDE_TRANSFORMATION",targetId:"blocked",payload:{preparationId:"package-journey",accepted:true,rationale:"Ska stoppas",type:"START"}}).success).toBe(false);
  });
  it("låser beslutsbaslinjen och skiljer prognos, rapporterad mätning och verifierad förbättring",()=>{
    let state=start();const frozen=JSON.stringify(latestDecision(state,referenceCommitment.initiativeId));
    expect(activeCommitments(state,referenceCommitment.initiativeId)).toHaveLength(1);
    const c=state.entities.effectCommitments[commitmentId];expect(effectOutcome(state,c,"2027-12-31").realized).toBeUndefined();
    state=apply(state,{...meta(specialist),commandType:"RECORD_EFFECT_FORECAST",targetId:"forecast-journey",payload:{commitmentId,date:"2027-12-31",value:440000}});
    expect(effectOutcome(state,c,"2027-12-31").realized).toBeUndefined();
    state=apply(state,{...meta(referenceCommitment.details.changeResponsibleId,"2026-12-31"),commandType:"CONFIRM_BUSINESS_CHANGE",targetId:commitmentId,payload:{date:"2026-12-31",evidence:"Syntetisk rutin införd och används"}});
    const measure={...meta(referenceCommitment.measurementResponsibleId,"2027-12-31"),commandType:"RECORD_EFFECT_MEASUREMENT" as const,targetId:"measure-journey",payload:{commitmentId,date:"2027-12-31",value:450000,evidence:"Syntetiskt bokslutsuttag",qualityObservation:"Alla kritiska avtal finns",qualityMet:true}};
    expect(demoReducer(state,{...measure,issuedAt:"2027-01-01T12:00:00Z"}).success).toBe(false);
    state=apply(state,measure);expect(effectOutcome(state,c,"2027-12-31").realized).toBeUndefined();
    const point=Object.values(state.entities.measurementPoints)[0];
    state=apply(state,{...meta(specialist,"2027-12-31"),commandType:"VERIFY_EFFECT_MEASUREMENT",targetId:point.id,payload:{accepted:true}});
    expect(effectOutcome(state,c,"2027-12-31").realized).toBe(150000);expect(effectOutcome(state,c,"2027-12-31").target).toBe(180000);
    expect(JSON.stringify(latestDecision(state,referenceCommitment.initiativeId))).toBe(frozen);
    expect(demoReducer(state,{...meta(decision,"2027-12-31"),commandType:"COMPLETE_TRANSFORMATION",targetId:referenceCommitment.initiativeId,payload:{observation:"Delmätning saknas",evidence:"Fullmätning räcker inte"}}).success).toBe(false);
    for(const date of c.details!.measurementDates.filter(date=>date!=="2027-12-31")){
      state=apply(state,{...meta(referenceCommitment.measurementResponsibleId,"2027-12-31"),commandType:"RECORD_EFFECT_MEASUREMENT",targetId:`measure-${date}`,payload:{commitmentId,date,value:430000,evidence:"Dokumenterad delmätning",qualityObservation:"Kvalitet uppfylld",qualityMet:true}});
      const interim=Object.values(state.entities.measurementPoints).find(p=>p.measuredAt===date&&p.measurementPlanId===c.measurementPlanId)!;
      state=apply(state,{...meta(specialist,"2027-12-31"),commandType:"VERIFY_EFFECT_MEASUREMENT",targetId:interim.id,payload:{accepted:true}});
    }
    state=apply(state,{...meta(decision,"2027-12-31"),commandType:"COMPLETE_TRANSFORMATION",targetId:referenceCommitment.initiativeId,payload:{observation:"Målet missades med 30000 SEK per år; arbetssättet behöver förbättras.",evidence:"Verifierad mätpunkt"}});
    expect(state.entities.initiatives[referenceCommitment.initiativeId].closedAt).toBeDefined();
    expect(effectOutcome(state,c,"2027-12-31").realized).toBe(150000);
  });
  it("kräver egen accept för en ny mottagare och nytt beslut efter start",()=>{
    let state=start();const b=Object.values(state.entities.businesses).find(b=>b.id!==referenceCommitment.businessId)!;
    state=apply(state,{...meta(),commandType:"ADD_PARTICIPATION",targetId:createId("Participation","new-recipient"),payload:{initiativeId:referenceCommitment.initiativeId,businessId:b.id,organizationId:b.organizationId,participantKind:"EFFECT_RECIPIENT",validFrom:"2026-09-06"}});
    expect(startBlockers(state,state.entities.startPreparations["package-journey"],"2026-09-06").join(" ")).toContain("samtliga registrerade effektmottagare");
    expect(activeCommitments(state,referenceCommitment.initiativeId)).toHaveLength(1);
    expect(demoReducer(state,{...meta(decision),commandType:"DECIDE_TRANSFORMATION",targetId:"second-start",payload:{preparationId:"package-journey",accepted:true,rationale:"Inte tillåtet",type:"START"}}).success).toBe(false);
  });
  it("bevarar originalet efter ett formellt ändringsbeslut och tar endast med vald åtagandeversion",()=>{
    let state=start();const original=JSON.stringify(latestDecision(state,referenceCommitment.initiativeId));const newId=createId("EffectCommitment","journey-v2");
    state=apply(state,{...meta(),commandType:"SAVE_EFFECT_COMMITMENT",targetId:newId,payload:{...referenceCommitment,baselineVerified:true,target:440000,details:{...referenceCommitment.details,supersedesId:commitmentId}}});
    state=apply(state,{...meta(owner),commandType:"ACCEPT_EFFECT_COMMITMENT",targetId:newId,payload:{accepted:true,mandateDescription:"Ny lokal bedömning och aktiv accept"}});
    const {id:_id,preparedAt:_at,preparedBy:_by,...p}=state.entities.startPreparations["package-journey"];void _id;void _at;void _by;
    state=apply(state,{...meta(),commandType:"SAVE_START_PREPARATION",targetId:"package-v2",payload:{...p,commitmentIds:[newId]}});
    state=apply(state,{...meta(decision),commandType:"DECIDE_TRANSFORMATION",targetId:"decision-v2",payload:{preparationId:"package-v2",type:"CHANGE",accepted:true,rationale:"Syntetisk omprövning efter ny kunskap",changeImpact:{cost:"Oförändrad kostnad",time:"Oförändrat fönster",quality:"Samma skyddsmått",effect:"Målet sänks från 180000 till 160000 i årstakt"}}});
    expect(activeCommitments(state,referenceCommitment.initiativeId).map(c=>c.id)).toEqual([newId]);
    expect(JSON.stringify(Object.values(state.entities.decisionVersions).find(v=>v.versionNumber===1))).toBe(original);
    expect(latestDecision(state,referenceCommitment.initiativeId)?.versionNumber).toBe(2);
  });
});
