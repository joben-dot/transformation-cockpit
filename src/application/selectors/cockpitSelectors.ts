import type { DemoState } from "../demoState";
import type { InitiativeId } from "../../domain";
import { caseOverview } from "./caseSelectors";
import { activeSteeringProfile,latestPriorityAssessment } from "./prioritySelectors";
import { currentEffectPotentials } from "./effectPotentialSelectors";
import { prerequisiteGraph } from "./executionSelectors";

/** A display order, never a start decision or a replacement for the active profile. */
export function cockpitCases(state:DemoState,day:string) {
  const profile=activeSteeringProfile(state);
  const items=caseOverview(state,day).map(item=>{
    const latest=item.initiativeId?latestPriorityAssessment(state,item.initiativeId,profile?.id):undefined;
    const assessment=latest?.status!=="DRAFT"?latest:undefined;
    const stale=!!assessment&&currentEffectPotentials(state,assessment.initiativeId).some(p=>!assessment.effectPotentialIds.includes(p.id));
    const rankable=item.comparable&&!!assessment&&!stale;
    return {...item,assessment,stale,rankable,priorityScore:rankable?assessment.totalScore:undefined,createdAt:state.entities.challenges[item.challengeId].createdAt};
  });
  return items.sort((a,b)=>Number(b.rankable)-Number(a.rankable)||(b.priorityScore??0)-(a.priorityScore??0)||a.createdAt.localeCompare(b.createdAt)||a.caseNumber.localeCompare(b.caseNumber));
}

/** Cross-initiative prerequisites, keeping node-start and later milestones distinct. */
export function initiativeDependencies(state:DemoState,ids:InitiativeId[]) {
  return ids.flatMap(id=>{
    const graph=prerequisiteGraph(state,id);
    return graph.nodes.filter(n=>n.ownerInitiativeId&&n.ownerInitiativeId!==id).flatMap(node=>{
      const edges=graph.dependencies.filter(d=>d.blocking&&d.predecessorNodeId===node.id);
      if(!edges.length)return [];
      return [{initiativeId:id,ownerInitiativeId:node.ownerInitiativeId!,node,edges,available:node.availabilityStatus==="AVAILABLE",beforeStart:edges.some(e=>e.requiredAt==="INITIATIVE_START"&&state.entities.executionNodes[e.successorNodeId]?.ownerInitiativeId===id)}];
    });
  });
}
