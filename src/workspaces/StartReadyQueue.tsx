import type { DemoState } from "../application";
import type { InitiativeId } from "../domain";
import { startReadiness } from "../application/selectors/startReadinessSelectors";

export function StartReadyQueue({state,day,onOpen}:{state:DemoState;day:string;onOpen:(id:InitiativeId)=>void}) {
 const ready=Object.values(state.entities.initiatives).map(i=>({i,r:startReadiness(state,i.id,day)})).filter(x=>x.r.ready).sort((a,b)=>(b.r.assessment?.totalScore??0)-(a.r.assessment?.totalScore??0)||a.i.createdAt.localeCompare(b.i.createdAt));
 return <section className="start-ready-queue" aria-label="Klara för start"><div><p className="eyebrow">NÄSTA BESLUT</p><h2>Klara för start <span>{ready.length}</span></h2><p>Prioriteringsunderlaget är granskat och startkraven är uppfyllda vid {day}. Mänskligt startbeslut återstår. Kön visar alla startklara initiativ, oberoende av listans filter.</p></div>{ready.length?<ol>{ready.map(({i,r})=><li key={i.id}><button onClick={()=>onOpen(i.id)}><span><strong>{i.title}</strong><small>{r.assessment?.totalScore} / 100 · startkraven uppfyllda</small></span><span>Öppna startbeslut →</span></button></li>)}</ol>:<p>Inga initiativ är startklara ännu. Se vad som saknas i respektive ärendeflöde.</p>}</section>;
}
