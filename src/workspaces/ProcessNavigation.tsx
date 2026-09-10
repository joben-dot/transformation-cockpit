import type { DemoState } from "../application";
import type { ChallengeId } from "../domain";
import { type FlowStepKey } from "../application/selectors/flowSelectors";
import { journeyFlow } from "./journeyModel";
export function ProcessNavigation({state,challengeId,day,current,onOpen}:{state:DemoState;challengeId:ChallengeId;day:string;current?:FlowStepKey|"history";onOpen:(key:FlowStepKey)=>void}) {
 const steps=journeyFlow(state,challengeId,day);
 return <nav className="process-navigation" aria-label="Ärendets process"><p>Hela ärendeflödet · {current?`Du arbetar i ${steps.find(s=>s.key===(current==="potential"?"businesscase":current))?.title??"beslutshistoriken"}`:"Välj ett steg"}</p><ol>{steps.map((s,i)=><li key={s.key}><button type="button" aria-current={(current===s.key||current==="potential"&&s.key==="businesscase")?"step":undefined} onClick={()=>onOpen(s.target)}><span className={`process-dot process-${s.status.toLowerCase()}`} aria-hidden="true">{s.status==="COMPLETE"?"✓":i+1}</span><span>{s.title}</span></button></li>)}</ol><small>Grönt: underlag eller beslut klart. Markerad ram: här är du. Du kan läsa kommande steg utan att passera deras beslutskrav.</small></nav>;
}
