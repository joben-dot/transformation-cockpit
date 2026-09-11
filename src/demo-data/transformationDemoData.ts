import type { DemoState } from "../application/demoState";
import { createId } from "../domain";
import { stage2Ids } from "./stage2DemoData";

export function addTransformationDemoData(state: DemoState) {
  const e=state.entities;
  const ownerRole=createId("RoleDefinition","effect-owner");
  e.roleDefinitions[ownerRole]={id:ownerRole,name:"Lokal effektägare",roleKind:"OWNER"};
  Object.values(e.businesses).forEach((b,index)=>{
    const personId=createId("Person",`effect-owner-${index}`), roleId=createId("RoleAssignment",`effect-owner-${index}`),mandateId=createId("Mandate",`effect-owner-${index}`);
    e.people[personId]={id:personId,displayName:index===0?"Kim Fiktiv":"Sam Exempel",isSynthetic:true};
    e.roleAssignments[roleId]={id:roleId,personId,roleDefinitionId:ownerRole,organizationId:b.organizationId,organizationalUnitId:b.organizationalUnitId,businessId:b.id,validFrom:"2026-01-01"};
    e.mandates[mandateId]={id:mandateId,roleAssignmentId:roleId,scope:"ACCEPT_LOCAL_EFFECT",validFrom:"2026-01-01"};
  });
  const decisionActor=Object.values(e.roleAssignments).find(r=>e.roleDefinitions[r.roleDefinitionId].roleKind==="DECISION_MAKER")!;
  const mandateId=createId("Mandate","transformation-start");
  e.mandates[mandateId]={id:mandateId,roleAssignmentId:decisionActor.id,scope:"START_TRANSFORMATION",decisionFunctionId:Object.values(e.decisionFunctions)[0].id,validFrom:"2026-01-01",validTo:"2027-12-31"};
  e.transformationGovernance["GOVERNANCE-DEMO-1"]={id:"GOVERNANCE-DEMO-1",version:1,validFrom:"2026-01-01",decisionFunction:"Fiktiv gemensam beslutsfunktion; personens mandat kontrolleras separat.",escalation:"Lokalt effektåtagande → gemensamt beslut inom mandat → överordnad eller politisk nivå när mandat saknas.",commitmentStatus:"Aktivt daterad lokal styröverenskommelse i demonstrationen.",changeRules:"Alla ändringar av beslutade åtaganden, baseline, mätplan, deltagande, kostnad, tid och kvalitet kräver ny beslutsversion.",fundingPrinciple:"Storleksbaserad fördelning som utgångspunkt. Faktisk regelversion och kostnadsposter hålls separat.",qualityCategories:"Kvalitet och skyddsmått redovisas separat. Frigjord tid monetariseras inte automatiskt.",methodOwner:"Fiktiv gemensam metodfunktion med verksamhet, ekonomi och arkitektur.",governingDocuments:"Syntetiskt demonstrationsunderlag. Organisationsspecifika originaldokument ingår inte.",legalRequirements:"Bedöm relevanta lagkrav och informationssäkerhet i varje ärende; dokumentera bedömningen före start.",createdAt:"2026-09-06T08:00:00Z",demoAssumption:"Ej beslutad – används endast i demo."};
  // Complete preparation material for existing reference cases; no user decision is simulated.
  Object.values(e.challenges).filter(c=>c.relatedInitiativeIds.length).forEach(c=>{
    const i=e.initiatives[c.relatedInitiativeIds[0]];
    c.businessCase??={templateId:"DEMO-CASE-V1",purpose:i.purpose,desiredState:i.desiredEndState,scope:i.scope,alternatives:"Gemensam förändring eller lokalt förbättringsarbete.",doNothingConsequence:"Nuvarande dubbelarbete och kostnader kvarstår.",evidence:"Syntetisk kartläggning – inga verkliga mätvärden.",assumptions:"Verksamheten avsätter tid för införande.",uncertainty:"Medel; lokala förutsättningar behöver bedömas.",timeHorizon:"2026–2030",knownPrerequisites:"Se ärendets förutsättningsgraf.",knownRisks:"Otillräcklig mottagarkapacitet kan fördröja effekten."};
  });
  // A small case without an unresolved shared infrastructure prerequisite, usable for a full walkthrough.
  const i=stage2Ids.overriddenInitiative, nodeId=createId("ExecutionNode","contract-implementation"),costId=createId("CostEntry","contract-implementation");
  e.executionNodes[nodeId]={id:nodeId,ownerInitiativeId:i,contextInitiativeIds:[i],title:"Införande av gemensam avtalsuppföljning",description:"Utbildning och ändrad uppföljningsrutin.",nodeKind:"BUSINESS_CHANGE",plannedPeriod:{from:"2026-10-01",to:"2026-12-31"},neededAt:"2026-12-31",availabilityCriteria:"Verksamheten bekräftar att rutinen används.",availabilityStatus:"PLANNED",availabilityEvidenceRefs:[]};
  e.costEntries[costId]={id:costId,initiativeId:i,executionNodeId:nodeId,originReference:"SYNTHETIC-CONTRACT-IMPLEMENTATION",category:"BUSINESS_CHANGE",period:{from:"2026-01-01",to:"2026-12-31"},amount:120000,currency:"SEK",economicStatus:"ESTIMATE",recurrence:"ONE_TIME",sourceRefs:["Syntetisk kalkyl: utbildning och införandetid"],assessedByRoleAssignmentId:decisionActor.id,assessmentVersion:1};
  return state;
}
