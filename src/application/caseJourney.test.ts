import { describe, expect, it } from "vitest";
import { createId, type RoleAssignmentId } from "../domain";
import { initializeDemoState } from "./initializeDemoState";
import { demoReducer } from "./demoReducer";
import type { Command } from "./commands";
import type { DemoState } from "./demoState";

const command = (value: Record<string, unknown>, actorRoleAssignmentId: RoleAssignmentId): Command => ({ ...value, commandId: createId("Command", `journey-${Math.random().toString(36).slice(2)}`), issuedAt: "2026-09-06T12:00:00Z", actorRoleAssignmentId } as Command);

describe("användarskapat ärende", () => {
  it("bevarar identitet, stoppar ofullständig beredning och tillämpar separata kompletteringsroller", () => {
    let state: DemoState = initializeDemoState();
    const initiator = Object.values(state.entities.roleAssignments).find((item) => state.entities.roleDefinitions[item.roleDefinitionId].roleKind === "INITIATOR")!;
    const specialist = Object.values(state.entities.roleAssignments).find((item) => state.entities.roleDefinitions[item.roleDefinitionId].roleKind === "SPECIALIST")!;
    const challengeId = createId("Challenge", "journey-created");
    let result = demoReducer(state, command({ commandType: "CREATE_STRATEGIC_CHALLENGE", targetId: challengeId, payload: { title: "", problemStatement: "", currentState: "", source: "Demo", strategicRelevance: "", strategicHandlingReason: "", nominationStatus: "DRAFT" } }, initiator.id));
    expect(result.success).toBe(true); state = result.nextState;

    result = demoReducer(state, command({ commandType: "UPDATE_STRATEGIC_CHALLENGE", targetId: challengeId, payload: { nominationStatus: "NOMINATED" } }, initiator.id));
    expect(result.success).toBe(false);
    result = demoReducer(state, command({ commandType: "UPDATE_STRATEGIC_CHALLENGE", targetId: challengeId, payload: { title: "Fiktiv kompetensförsörjning", problemStatement: "Gemensam analys saknas", currentState: "Lokala manuella listor", strategicHandlingReason: "Flera verksamheter berörs", nominationStatus: "NOMINATED", businessCase: { templateId:"DEMO-CASE-V1",purpose:"Pröva gemensamt stöd",desiredState:"Samordnat läge",scope:"Två fiktiva verksamheter",alternatives:"Förenkla manuellt",doNothingConsequence:"Fortsatta väntetider",evidence:"DEMO-EVIDENS",assumptions:"Volymen består",uncertainty:"Medel",timeHorizon:"12 månader",knownPrerequisites:"Datakvalitet",knownRisks:"Låg användning" } } }, initiator.id));
    expect(result.success).toBe(true); state = result.nextState;

    const earlyRequirementId=createId("CompletionRequirement","journey-early");
    result=demoReducer(state,command({commandType:"CREATE_COMPLETION_REQUIREMENT",targetId:earlyRequirementId,payload:{challengeId,missingItem:"Avgränsning",reasonRequired:"Behövs i beredning",blocks:["QUALIFICATION"]}},initiator.id));
    expect(result.success).toBe(true);state=result.nextState;
    expect(state.entities.completionRequirements[earlyRequirementId].responsibleRoleAssignmentId).toBeUndefined();

    const initiativeId = createId("Initiative", "journey-preparation");
    result = demoReducer(state, command({ commandType:"CREATE_INITIATIVE_FROM_CHALLENGE",targetId:initiativeId,payload:{challengeId,title:"Bered gemensamt stöd",purpose:"Ta fram beslutsunderlag",desiredEndState:"Bedömt underlag",initiativeKind:"VALUE_CREATING",scope:"Fiktiv avgränsning"}},initiator.id));
    expect(result.success).toBe(true); state=result.nextState;
    expect(state.entities.challenges[challengeId].relatedInitiativeIds).toEqual([initiativeId]);
    expect(state.entities.completionRequirements[earlyRequirementId].initiativeId).toBe(initiativeId);

    const requirementId=createId("CompletionRequirement","journey-answer");
    result=demoReducer(state,command({commandType:"CREATE_COMPLETION_REQUIREMENT",targetId:requirementId,payload:{challengeId,initiativeId,missingItem:"Volymunderlag",reasonRequired:"Behövs för potential",blocks:["QUALIFICATION"],responsibleRoleAssignmentId:initiator.id,verifierRoleAssignmentId:specialist.id,deadline:"2026-10-01"}},initiator.id));
    expect(result.success).toBe(true);state=result.nextState;
    result=demoReducer(state,command({commandType:"SUBMIT_COMPLETION_REQUIREMENT",targetId:requirementId,payload:{submittedEvidenceRefs:["DEMO-SVAR"],resolutionSummary:"Volymer dokumenterade"}},specialist.id));
    expect(result.success).toBe(false);
    result=demoReducer(state,command({commandType:"SUBMIT_COMPLETION_REQUIREMENT",targetId:requirementId,payload:{submittedEvidenceRefs:["DEMO-SVAR"],resolutionSummary:"Volymer dokumenterade"}},initiator.id));
    expect(result.success).toBe(true);state=result.nextState;
    result=demoReducer(state,command({commandType:"VERIFY_COMPLETION_REQUIREMENT",targetId:requirementId,payload:{resolutionSummary:"Verifierat mot syntetiskt underlag"}},specialist.id));
    expect(result.success).toBe(true);
    state=result.nextState;
    expect(state.entities.completionRequirements[requirementId].status).toBe("VERIFIED");

    for (const action of [
      command({commandType:"ASSIGN_COMPLETION_RESPONSIBILITY",targetId:earlyRequirementId,payload:{responsibleRoleAssignmentId:initiator.id,verifierRoleAssignmentId:specialist.id,deadline:"2026-10-02"}},initiator.id),
      command({commandType:"SUBMIT_COMPLETION_REQUIREMENT",targetId:earlyRequirementId,payload:{submittedEvidenceRefs:["DEMO-AVGRANSNING"],resolutionSummary:"Avgränsning dokumenterad"}},initiator.id),
      command({commandType:"VERIFY_COMPLETION_REQUIREMENT",targetId:earlyRequirementId,payload:{resolutionSummary:"Avgränsning verifierad"}},specialist.id),
    ]) { result=demoReducer(state,action); expect(result.success).toBe(true); state=result.nextState; }
    result=demoReducer(state,command({commandType:"RECORD_EFFECT_POTENTIAL",targetId:createId("EffectPotential","journey-potential"),payload:{seriesId:"JOURNEY-POTENTIAL",initiativeId,recipientScenario:"Fiktiv mottagare",category:"OTHER_BUSINESS_EFFECT",effectMeasureCode:"KORTARE_VANTETID",unit:"dagar",lowerBound:1,expectedValue:2,upperBound:3,evidenceRefs:["DEMO-EVIDENS"],assumptions:["Volymen består"],uncertainty:"MEDIUM",realizationWindow:"12 månader",earliestPossibleEffectDate:"2027-01-01",fullPotentialDate:"2027-09-01",scope:"FEDERATED_SCENARIO",assessmentVersion:1}},specialist.id));
    expect(result.success).toBe(true);state=result.nextState;
    const config=Object.values(state.entities.qualificationConfigurations).find((item)=>item.status==="ACTIVE")!;
    for(const criterion of config.criteria){ const assessmentId=createId("QualificationAssessment",`journey-${criterion.criterionCode.toLowerCase().replaceAll("_","-")}`); result=demoReducer(state,command({commandType:"UPSERT_QUALIFICATION_ASSESSMENT",targetId:assessmentId,payload:{initiativeId,qualificationArea:criterion.qualificationArea,criterionCode:criterion.criterionCode,summary:"Individuellt bedömd",status:"SATISFIED",mandatory:criterion.mandatory,requiresVerification:criterion.requiresVerification,evidenceRefs:[`DEMO-${criterion.criterionCode}`],assumptions:[],assessedAgainstConfigurationVersion:config.id}},initiator.id)); expect(result.success).toBe(true);state=result.nextState; if(criterion.requiresVerification){result=demoReducer(state,command({commandType:"VERIFY_QUALIFICATION_ASSESSMENT",targetId:assessmentId},specialist.id));expect(result.success).toBe(true);state=result.nextState;} }
    const decision=Object.values(state.entities.roleAssignments).find((item)=>state.entities.roleDefinitions[item.roleDefinitionId].roleKind==="DECISION_MAKER")!;
    const profile=Object.values(state.entities.steeringProfileVersions).find((item)=>item.status==="ACTIVE")!;
    const scores=Object.fromEntries(profile.criteria.map((item)=>[item.code,{score:3,evidenceRefs:["DEMO-CASE"],uncertainty:"MEDIUM" as const}]));
    result=demoReducer(state,command({commandType:"CALCULATE_PRIORITY_ASSESSMENT",targetId:createId("PriorityAssessment","journey-priority"),payload:{initiativeId,steeringProfileVersionId:profile.id,scores}},decision.id));
    expect(result.success).toBe(true);
    expect(result.nextState.entities.priorityAssessments[createId("PriorityAssessment","journey-priority")].initiativeId).toBe(initiativeId);
  });
});
