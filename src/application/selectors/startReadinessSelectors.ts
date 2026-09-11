import type { DemoState } from "../demoState";
import type { InitiativeId } from "../../domain";
import { activeSteeringProfile, latestPriorityAssessment, priorityEligibilityBlockers } from "./prioritySelectors";
import { currentEffectPotentials } from "./effectPotentialSelectors";
import { latestDecision, startBlockers } from "./transformationSelectors";

export function startReadiness(state:DemoState,id:InitiativeId,day:string) {
 const preparation=Object.values(state.entities.startPreparations).filter(p=>p.initiativeId===id).at(-1);
 const decision=latestDecision(state,id),profile=activeSteeringProfile(state);
 const assessment=latestPriorityAssessment(state,id,profile?.id);
 const reviewed=!!profile&&profile.validFrom<=day&&(!profile.validTo||profile.validTo>=day)&&!!assessment&&["ACCEPTED","OVERRIDDEN"].includes(assessment.status)&&!priorityEligibilityBlockers(state,id,profile).length&&currentEffectPotentials(state,id).every(p=>assessment.effectPotentialIds.includes(p.id));
 const blockers=preparation?startBlockers(state,preparation,day):["Samlat beslutspaket behöver sparas och prövas."];
 const prioritized=reviewed;
 return {preparation,assessment,reviewed,prioritized,blockers,ready:!decision&&!!preparation&&!blockers.length,started:!!decision};
}
