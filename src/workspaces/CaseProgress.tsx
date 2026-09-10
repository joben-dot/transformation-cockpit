import type { Command,CommandResult,DemoState } from "../application";
import type { ChallengeId } from "../domain";
import type { FlowStepKey } from "../application/selectors/flowSelectors";
import { activeCommitments,latestDecision,effectOutcome } from "../application/selectors/transformationSelectors";
import { journeyFlow } from "./journeyModel";
import { roleName } from "./transformationHelpers";
import { FollowUpEditor } from "./FollowUpEditor";

export function CaseProgress({state,challengeId,day,onOpen,dispatch}:{state:DemoState;challengeId:ChallengeId;day:string;onOpen:(key:FlowStepKey)=>void;dispatch?:(command:Command)=>CommandResult}) {
  const c=state.entities.challenges[challengeId],id=c.relatedInitiativeIds[0],initiative=id?state.entities.initiatives[id]:undefined;
  const steps=journeyFlow(state,challengeId,day),decision=id?latestDecision(state,id):undefined;
  const cs=id?activeCommitments(state,id):[];
  const phase=initiative?.closedAt?"Avslutat och utvärderat":!decision?"Under beredning · inte startat":cs.length&&cs.every(c=>!!c.details?.changeCompletedAt)?"Verksamhetsförändringar bekräftade · följs för effekt":"Genomförande pågår";
  // After start, focus on operational evidence. Historic decisions remain in their locked versions.
  const remaining=steps.filter(s=>s.status!=="COMPLETE"&&(!decision||s.number>=8));
  const next=remaining.find(s=>s.status==="ACTION")??remaining[0];
  const problems=cs.filter(c=>{const o=effectOutcome(state,c,day);return o.qualityMet===false||(o.realized!==undefined&&o.target!==undefined&&o.realized<o.target);});
  return <section className="case-progress" aria-label="Läge och nästa åtgärd">
    <div><span className="progress-phase">{phase}</span><h2>{initiative?.closedAt?"Resultat och lärande finns kvar":next?`Nästa: ${next.title}`:"Granska resultatet"}</h2><p>{next?.summary??"Öppna steg 9–10 för verifierat utfall och dokumenterat lärande."}</p>
      {next&&<p className="progress-owner">{next.responsibleId?roleName(state,next.responsibleId):"Ansvarig för nästa åtgärd behöver utses"} · {next.dueDate?`${next.dueDate}${next.dueDate<day?" · försenat":""}`:"Datum behöver anges"}</p>}
      {problems.length>0&&<p className="progress-alert">{problems.length} åtaganden har uppmätt effekt under mål eller kvalitetsavvikelse. Se effektuppföljningen.</p>}
    </div>
    <div className="progress-actions">{next&&<button onClick={()=>onOpen(next.target)}>Fortsätt med {next.title.toLocaleLowerCase("sv")} →</button>}<details><summary>Vad återstår? {remaining.length} steg</summary><p>Du kan förbereda senare steg. Underlag och beslut avgör vad som är klart.</p>{remaining.map(s=><div key={s.key}><button className="text-button" onClick={()=>onOpen(s.target)}>{s.number}. {s.title} →</button><p>{s.summary}</p>{dispatch&&s.status==="ACTION"&&!["implementation","learning"].includes(s.key)&&<FollowUpEditor state={state} challengeId={challengeId} step={{...s,key:s.target}} day={day} dispatch={dispatch}/>}</div>)}</details></div>
  </section>;
}
