import { InitiativeDependencies } from "./InitiativeDependencies";
import { FollowUpEditor } from "./FollowUpEditor";
import type { Command,CommandResult } from "../application";
import { Check, ChevronRight, Circle, AlertCircle } from "lucide-react";
import type { DemoState } from "../application";
import type { ChallengeId, ExecutionNodeId } from "../domain";
import { caseFlow, type FlowStepKey } from "../application/selectors/flowSelectors";
import { roleName } from "./transformationHelpers";

export function FlowOverview({state,challengeId,day,onOpen,dispatch,onOpenDependency}:{state:DemoState;challengeId:ChallengeId;day:string;onOpen:(key:FlowStepKey)=>void;dispatch?:(command:Command)=>CommandResult;onOpenDependency?:(nodeId:ExecutionNodeId)=>void}) {
  const steps = caseFlow(state,challengeId,day);
  const next = steps.find(s => s.status === "ACTION");
  return <section className="flow-overview" aria-label="Ärendets sammanfattade flöde">
    {state.entities.challenges[challengeId].relatedInitiativeIds[0] && <InitiativeDependencies state={state} id={state.entities.challenges[challengeId].relatedInitiativeIds[0]} day={day} onOpen={nodeId=>onOpenDependency?onOpenDependency(nodeId):onOpen("conditions")}/>}
    <div className="flow-intro"><h2>Från utmaning till uppmätt effekt</h2><p>Följ läget här. Öppna en punkt när du behöver se underlaget eller hantera det som saknas.</p></div>
    {next && <div className="flow-next"><span>Nästa uppmärksamhet</span><b>{next.title}</b><p>{next.summary}</p></div>}
    <ol className="flow-list">{steps.map((step,index) => <li key={step.key}>
      <button className={`flow-row flow-${step.status.toLowerCase()}`} onClick={() => onOpen(step.key)} aria-label={`${step.title}: ${step.status==="COMPLETE"?"Klart – visa underlag":step.status==="ACTION"?"Kräver åtgärd":"Kommande steg"}`}>
        <span className="flow-marker" aria-hidden="true">{step.status==="COMPLETE"?<Check size={21}/>:step.status==="ACTION"?<AlertCircle size={21}/>:<Circle size={19}/>}</span>
        <span className="flow-copy"><strong><small>{index+1}.</small> {step.title}</strong><span>{step.summary}</span>{step.status==="ACTION"&&!dispatch&&<small className="flow-owner">{step.responsibleId?roleName(state,step.responsibleId):"Ansvarig behöver utses"}{step.dueDate?` · ${step.dueDate}${step.dueDate<day?" · försenad":""}`:" · datum behöver anges"}</small>}</span>
        <span className="flow-action">{step.status==="COMPLETE"?"Visa underlag":step.status==="ACTION"?"Öppna åtgärd":"Visa nästa steg"}<ChevronRight size={18}/></span>
      </button>
      {step.status==="ACTION"&&dispatch&&<FollowUpEditor key={`${challengeId}-${step.key}`} state={state} challengeId={challengeId} step={step} day={day} dispatch={dispatch}/>}
    </li>)}</ol>
    <p className="flow-legend">Grönt betyder att punktens underlag eller beslut finns. Endast ett fattat startbeslut tillåter genomförande.</p>
  </section>;
}
