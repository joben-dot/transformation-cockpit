import type { DemoState } from "../application";
import type { ChallengeId } from "../domain";
import { caseFlow, type FlowStep, type FlowStepKey } from "../application/selectors/flowSelectors";
import { processGuide } from "./processGuide";

export const journeyKeys:FlowStepKey[]=["material","businesscase","qualification","priority","conditions","commitments","decision","implementation","measurement","learning"];
export const journeyNumber=(key:FlowStepKey)=>key==="potential"?2:journeyKeys.indexOf(key)+1;
export function journeyFlow(state:DemoState,id:ChallengeId,day:string):(FlowStep&{number:number;target:FlowStepKey})[] {
  const raw=caseFlow(state,id,day);
  return journeyKeys.map((key,index)=>{
    const step=raw.find(s=>s.key===key)!;
    const potential=raw.find(s=>s.key==="potential")!;
    const combined=key==="businesscase";
    const target=combined&&step.status==="COMPLETE"&&potential.status!=="COMPLETE"?"potential":key;
    const effective=target==="potential"?potential:step;
    const followUp=target==="implementation"||target==="learning"?undefined:state.entities.challenges[id].stepFollowUps?.[target];
    const formal=["qualification","implementation","measurement"].includes(target);
    return {...step,number:index+1,target,title:processGuide.find(s=>s.number===index+1)!.title,
      responsibleId:formal?effective.responsibleId??followUp?.responsibleRoleAssignmentId:followUp?.responsibleRoleAssignmentId??effective.responsibleId,
      dueDate:formal?effective.dueDate??followUp?.dueDate:followUp?.dueDate??effective.dueDate,
      status:combined&&step.status==="COMPLETE"?potential.status:step.status,
      summary:combined?`${step.summary} ${potential.summary}`:step.summary};
  });
}
