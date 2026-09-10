import type { DemoState } from '../demoState';
import type { ChallengeId, CompletionRequirementId, ExecutionNodeId, InitiativeId, RoleAssignmentId } from '../../domain';
import { cockpitCases, initiativeDependencies } from './cockpitSelectors';
import { caseFlow, type FlowStepKey } from './flowSelectors';
import { activeCommitments, latestDecision } from './transformationSelectors';
import { costsByOrigin } from './costSelectors';

export const controlStages = [
  {key:'preparation',label:'Möjligheter och beredning',help:'Registrerade utmaningar där underlaget utvecklas.'},
  {key:'priority',label:'För prioritering',help:'Jämförbart underlag. Mänskligt ställningstagande återstår.'},
  {key:'prioritized',label:'Prioriterade',help:'Mänskligt ställningstagande att gå vidare. Startkrav återstår.'},
  {key:'ready',label:'Klara för start',help:'Startkraven är uppfyllda. Mänskligt startbeslut återstår.'},
  {key:'ongoing',label:'Pågående',help:'Genomförande eller beslutad effektuppföljning pågår.'},
  {key:'closed',label:'Avslutade',help:'Avslutade enligt processens regler. Målet kan ha uteblivit.'},
] as const;
export type ControlStage = typeof controlStages[number]['key'];
export interface ActionDestination {
  challengeId:ChallengeId;
  initiativeId?:InitiativeId;
  section:FlowStepKey;
  requirementId?:CompletionRequirementId;
  nodeId?:ExecutionNodeId;
  focus?:'cost';
}
export interface ControlAction {
  label:string; reason:string; destination:ActionDestination;
  responsibleId?:RoleAssignmentId; dueDate?:string;
}
export function caseNextActions(state:DemoState,challengeId:ChallengeId,day:string) {
  const challenge=state.entities.challenges[challengeId],id=challenge.relatedInitiativeIds[0];
  const flow=caseFlow(state,challengeId,day);
  const requirements=Object.values(state.entities.completionRequirements).filter(r=>(r.challengeId===challengeId||!!id&&r.initiativeId===id)&&!['VERIFIED','NOT_APPLICABLE'].includes(r.status)).sort((a,b)=>(a.deadline??'9999').localeCompare(b.deadline??'9999'));
  const blockers:ControlAction[]=requirements.map(r=>({label:r.status==='SUBMITTED'?`Verifiera: ${r.missingItem}`:`Komplettera: ${r.missingItem}`,reason:r.reasonRequired,destination:{challengeId,initiativeId:id,section:'qualification',requirementId:r.id},responsibleId:r.status==='SUBMITTED'?r.verifierRoleAssignmentId:r.responsibleRoleAssignmentId,dueDate:r.deadline}));
  if(id&&!state.entities.initiatives[id].closedAt) {
    for(const d of initiativeDependencies(state,[id]).filter(d=>!d.available))blockers.push({label:`Förutsättning återstår: ${d.node.title}`,reason:d.edges[0].rationale,destination:{challengeId:state.entities.initiatives[d.ownerInitiativeId].challengeId,initiativeId:d.ownerInitiativeId,section:'conditions',nodeId:d.node.id},responsibleId:d.node.responsibleRoleAssignmentId,dueDate:d.node.neededAt});
  }
  const next=flow.find(s=>s.status==='ACTION');
  let action:ControlAction|undefined;
  if(next) {
    const followUp=challenge.stepFollowUps?.[next.key==="implementation"||next.key==="learning"?"measurement":next.key];
    action={label:next.title,reason:next.summary,destination:{challengeId,initiativeId:id,section:next.key},responsibleId:followUp?.responsibleRoleAssignmentId??next.responsibleId,dueDate:followUp?.dueDate??next.dueDate};
    // Formal change/measurement responsibilities always come from the accepted plan.
    if(next.key==='measurement'||next.key==='implementation'){action.responsibleId=next.responsibleId;action.dueDate=next.dueDate;}
    if(next.key==='conditions'&&id&&!costsByOrigin(state,[id]).some(c=>c.economicStatus==='ESTIMATE')) {
      action={...action,label:'Komplettera kostnadsunderlag',destination:{...action.destination,focus:'cost'}};
    }
    if(action.dueDate&&action.dueDate<day&&!blockers.some(b=>b.dueDate===action!.dueDate&&b.responsibleId===action!.responsibleId))blockers.push({...action,label:`Försenat: ${action.label}`});
  }
  if(id&&state.entities.initiatives[id].closedAt)return {next:undefined,blockers:[]};
  return {next:blockers.find(b=>b.destination.requirementId)??action,blockers};
}
export function controlRoomCases(state:DemoState,day:string,area='Alla') {
  return cockpitCases(state,day).filter(c=>state.entities.challenges[c.challengeId].nominationStatus==='NOMINATED').filter(c=>area==='Alla'||!!c.initiativeId&&Object.values(state.entities.participations).some(p=>p.initiativeId===c.initiativeId&&p.businessId&&state.entities.businesses[p.businessId]?.businessAreaId===area)).map(c=>{
    const stage:ControlStage=c.step==='AVSLUTAT'?'closed':['PAGAENDE','MATNING'].includes(c.step)?'ongoing':c.step==='STARTKLAR'?'ready':c.step==='PRIORITERAD'?'prioritized':c.step==='PRIORITERINGSBAR'?'priority':'preparation';
    const actions=caseNextActions(state,c.challengeId,day);
    if(c.initiativeId&&(stage==='ready'||stage==='ongoing')) {
      const step=caseFlow(state,c.challengeId,day).find(s=>s.key===(stage==='ready'?'decision':c.step==='PAGAENDE'?'implementation':'measurement'))!;
      actions.next={label:stage==='ready'?'Öppna underlag för startbeslut':'Följ verksamhetsförändring och mätning',reason:step.summary,destination:{challengeId:c.challengeId,initiativeId:c.initiativeId,section:step.key},responsibleId:step.responsibleId,dueDate:step.dueDate};
    }
    const effectTaking=!!c.initiativeId&&!!latestDecision(state,c.initiativeId)&&activeCommitments(state,c.initiativeId).some(k=>area==='Alla'||state.entities.businesses[k.recipientBusinessId]?.businessAreaId===area);
    return {...c,stage,...actions,effectTaking};
  });
}
export function selectControlCases(cases:ReturnType<typeof controlRoomCases>,selection:string) {
  if(selection==='hinders')return cases.filter(c=>c.blockers.length);
  if(selection==='effects')return cases.filter(c=>c.effectTaking);
  // Read old navigation entries without changing domain statuses.
  const aliases:Record<string,string>={'Under beredning':'preparation','Pågående':'ongoing','Avslutat':'closed'};
  if(selection==='Under mätning')return cases.filter(c=>c.step==='MATNING');
  const stage=aliases[selection]??selection;
  return controlStages.some(s=>s.key===stage)?cases.filter(c=>c.stage===stage):cases;
}
