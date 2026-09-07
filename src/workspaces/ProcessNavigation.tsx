import type { DemoState } from "../application";
import type { ChallengeId } from "../domain";
import { caseFlow,type FlowStepKey } from "../application/selectors/flowSelectors";
export function ProcessNavigation({state,challengeId,day,current,onOpen}:{state:DemoState;challengeId:ChallengeId;day:string;current?:FlowStepKey|"history";onOpen:(key:FlowStepKey)=>void}) {
 const steps=caseFlow(state,challengeId,day);
 return <nav className="process-navigation" aria-label="Ärendets process"><p>Hela ärendeflödet · {current?`Du arbetar i ${steps.find(s=>s.key===current)?.title??"beslutshistoriken"}`:"Välj ett steg"}</p><ol>{steps.map((s,i)=><li key={s.key}><button type="button" aria-current={current===s.key?"step":undefined} onClick={()=>onOpen(s.key)}><span className={`process-dot process-${s.status.toLowerCase()}`} aria-hidden="true">{s.status==="COMPLETE"?"✓":i+1}</span><span>{s.title}</span></button></li>)}</ol><small>Grönt: underlag eller beslut klart. Markerad ram: här är du. Du kan läsa kommande steg utan att passera deras beslutskrav.</small></nav>;
}
