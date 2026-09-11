import { FollowUpEditor } from "./FollowUpEditor";
import type { Command,CommandResult,DemoState } from "../application";
import type { ChallengeId } from "../domain";
import { challengeFields, businessCaseFields, requiredChallengeKeys, requiredBusinessCaseKeys, documentTextComplete } from "../domain/caseDocumentRequirements";
import { caseFlow, type FlowStepKey } from "../application/selectors/flowSelectors";
import { startReadiness } from "../application/selectors/startReadinessSelectors";
import { roleName } from "./transformationHelpers";
import { journeyGuidance, openStepWork } from "./journeyGuidance";

import { journeyNumber } from "./journeyModel";

export function StepGate({state,challengeId,day,stepKey,onOpen,dispatch,footer=false}:{state:DemoState;challengeId:ChallengeId;day:string;stepKey:FlowStepKey;onOpen:(step:FlowStepKey)=>void;dispatch?:(command:Command)=>CommandResult;footer?:boolean}) {
 const steps=caseFlow(state,challengeId,day),index=steps.findIndex(x=>x.key===stepKey),step=steps[index],next=steps[index+1];
 const c=state.entities.challenges[challengeId],id=c.relatedInitiativeIds[0],guide=journeyGuidance[stepKey];
 const prerequisite=stepKey==="businesscase"&&steps[0].status!=="COMPLETE"?steps[0]:!id&&index>1?steps.find(s=>s.status!=="COMPLETE"):["implementation","measurement","learning"].includes(stepKey)&&steps.find(s=>s.key==="decision")?.status!=="COMPLETE"?steps.find(s=>s.key==="decision"):stepKey==="priority"?steps.find(s=>["qualification","potential"].includes(s.key)&&s.status!=="COMPLETE"):undefined;
 const blockerTarget=(label:string):FlowStepKey=>{
  if(Object.values(state.entities.completionRequirements).some(r=>r.missingItem===label))return "qualification";
  if(/businesscase|nyttokalkyl|effektpotential/i.test(label))return "businesscase";
  if(/kvalificering/i.test(label))return "qualification";
  if(/effektägare|åtagande|mottagare|baseline|mät|verksamhetsförändring|kvalitetsmått|kvalitetsgräns|datakälla|enhet/i.test(label))return "commitments";
  if(/förutsättning inte klar|beroende|förutsättningsgraf|genomförandekapacitet|kostnadsunderlag/i.test(label))return "conditions";
  if(/prioritering/i.test(label))return "priority";
  return "decision";
 };
 const goNext=next&&<button type="button" className={step.status==="COMPLETE"?"":"secondary-action"} onClick={()=>onOpen(next.key)}>{step.status==="COMPLETE"?"Nästa steg":stepKey==="decision"?"Förhandsvisa nästa steg":"Förbered nästa steg"}: {next.title} →</button>;
 if(footer)return <nav className="journey-footer" aria-label="Fortsättning efter arbetsmomentet">{step.status!=="COMPLETE"&&<p>{step.summary} Sparade uppgifter och beslut avgör vad som är klart.</p>}{goNext}{stepKey==="learning"&&<button type="button" onClick={()=>openStepWork(stepKey)}>Se lärande och avslut ↑</button>}</nav>;
 const items:{label:string;complete:boolean;target?:FlowStepKey}[]=stepKey==="material"?[
  ...requiredChallengeKeys.map(k=>({label:challengeFields[k],complete:documentTextComplete(c[k])})),{label:"Utmaningen registrerad för beredning",complete:c.nominationStatus==="NOMINATED"}
 ]:stepKey==="businesscase"?[
  ...requiredBusinessCaseKeys.map(k=>({label:businessCaseFields[k],complete:documentTextComplete(c.businessCase?.[k])})),{label:"Initiativ registrerat från sparat businesscase",complete:!!id}
 ]:[{label:step.summary,complete:step.status==="COMPLETE"}];
 if(stepKey==="decision"&&id&&!startReadiness(state,id,day).started){const r=startReadiness(state,id,day);items.splice(0,items.length,...r.blockers.map(label=>({label,complete:false,target:blockerTarget(label)})),{label:"Samtliga underlagskrav uppfyllda",complete:r.ready},{label:"Mänskligt startbeslut fattat",complete:false});}
 const completions=Object.values(state.entities.completionRequirements).filter(r=>(r.challengeId===challengeId||(id&&r.initiativeId===id))&&r.blocks.includes(stepKey==="priority"?"PRIORITIZATION":stepKey==="decision"?"START_DECISION":"QUALIFICATION")&&["qualification","priority","decision"].includes(stepKey));
 const earlier=stepKey==="decision"?steps.slice(0,index).filter(s=>s.status!=="COMPLETE"):[];
 return <section className={`step-gate step-gate-${step.status.toLowerCase()}`} aria-label={`Krav i ${step.title}`}>
  <p className="eyebrow">DU ÄR HÄR · STEG {journeyNumber(stepKey)} AV 10{stepKey==="potential"?" · NYTTOKALKYL":""}</p>
  <h2>{step.title} · {step.status==="COMPLETE"?"Klart":step.status==="WAITING"?"Inväntar förutsättningar eller planerat datum":"Åtgärd behövs"}</h2>
  <p>{step.summary}</p>
  {stepKey==="decision"&&step.status!=="COMPLETE"&&<p className="start-rule"><b>{id&&startReadiness(state,id,day).ready?"Underlaget är klart. Ett aktivt mänskligt startbeslut återstår.":"Start är spärrad tills underlagen är klara."}</b> Effekt från businesscase, utsedd effektansvarig och accepterat åtagande krävs, liksom finansiering, kapacitet och uppfyllda startberoenden. Senare beroenden behöver ansvar och datum. Du får läsa kommande steg utan att starta arbetet.</p>}
  <p><b>Vem bidrar?</b> {guide.role}</p>
  {prerequisite?<div className="journey-next"><p>Färdigställ {prerequisite.title.toLocaleLowerCase("sv")} först. Du har öppnat en förhandsvisning av detta steg.</p><button onClick={()=>onOpen(prerequisite.key)}>Gå till {prerequisite.title.toLocaleLowerCase("sv")} →</button></div>:<div className="journey-actions">{step.status!=="COMPLETE"&&<button type="button" onClick={()=>openStepWork(stepKey)}>Arbeta med {step.title.toLocaleLowerCase("sv")} ↓</button>}{goNext}</div>}
  {step.status!=="COMPLETE"&&next&&!prerequisite&&<p className="muted">Du får förbereda kommande underlag. Att öppna nästa steg godkänner inga krav och startar inget initiativ.</p>}
  {earlier.length>0&&<div className="journey-repairs"><p><b>Underlag att färdigställa inför start</b></p>{earlier.map(s=><button className="text-button" key={s.key} onClick={()=>onOpen(s.key)}>{s.title}: {s.summary} →</button>)}</div>}
  <details className="journey-checklist" ><summary>{items.filter(x=>!x.complete).length?`Vad återstår? ${items.filter(x=>!x.complete).length} punkter` : "Visa vad som är klart"}</summary><ul>{items.map((item,i)=><li key={i}><span aria-hidden="true">{item.complete?"✓":"○"}</span> {item.complete?item.label:<button className="text-button" onClick={()=>item.target&&item.target!==stepKey?onOpen(item.target):prerequisite?onOpen(prerequisite.key):openStepWork(stepKey)}>{item.label} ↓</button>}</li>)}</ul></details>
  {completions.length>0&&<details><summary>Kompletteringar, ansvar och datum · {completions.length}</summary>{completions.map(r=><p key={r.id}><button className="text-button" onClick={()=>onOpen("qualification")}>{r.missingItem} →</button> · {r.status==="VERIFIED"?"Verifierat":r.status==="NOT_APPLICABLE"?"Ej tillämpligt":r.status==="SUBMITTED"?"Inväntar verifiering":"Behöver kompletteras"}<br/>{roleName(state,r.status==="SUBMITTED"?r.verifierRoleAssignmentId:r.responsibleRoleAssignmentId)} · {r.deadline??"Datum behöver anges"}</p>)}</details>}
  {step.status==="ACTION"&&dispatch&&!["implementation","learning"].includes(stepKey)&&<FollowUpEditor key={`${challengeId}-${stepKey}`} state={state} challengeId={challengeId} step={step} day={day} dispatch={dispatch}/>}
 </section>;
}
