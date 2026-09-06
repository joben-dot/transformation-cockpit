import { describe, expect, it } from "vitest";
import { initializeDemoState } from "./initializeDemoState";
import { demoReducer } from "./demoReducer";
import type { Command } from "./commands";
import type { DemoState } from "./demoState";
import { createId } from "../domain";
import { referenceCommitment } from "../demo-data/referenceCommitment";
import { roleAssignments } from "../demo-data/peopleAndRoles";
import { acceptedCommitment, activeCommitments, effectOutcome, latestDecision, startBlockers } from "./selectors/transformationSelectors";

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

describe("verksamhetsägd effekt från åtagande till uppföljning",()=>{
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
