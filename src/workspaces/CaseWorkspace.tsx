import { FollowUpEditor } from "./FollowUpEditor";
import { caseFlow } from "../application/selectors/flowSelectors";
import { StepGate } from "./StepGate";
import { StartReadyQueue } from "./StartReadyQueue";
import { CaseDocumentEditor } from "./CaseDocumentEditor";
import { businessCaseDocumentBlockers } from "../domain/caseDocumentRequirements";
import { useSessionDraft } from "./SessionDrafts";
import { LocationTrail } from "./LocationTrail";
import { flowLocationLabels } from "./flowLocationLabels";
import { cockpitCases } from "../application/selectors/cockpitSelectors";
import { DataProvenance } from "./DataProvenance";
import { useMemo, useState, useLayoutEffect, useEffect } from "react";
import { ArrowLeft, ChevronRight, Plus, Search } from "lucide-react";
import {
  activeQualificationConfiguration,
} from "../application/selectors";
import type { Command, CommandResult, DemoState } from "../application";
import {
  createId,
  type ChallengeId,
  type CompletionRequirementId,
  type InitiativeId,
  type ExecutionNodeId,
  type RoleAssignmentId,
} from "../domain";
import { FlowOverview } from "./FlowOverview";
import { InitiativeDependencies } from "./InitiativeDependencies";
import type { FlowStepKey } from "../application/selectors/flowSelectors";
import { isQualificationAssessmentValid } from "../application/selectors/qualificationSelectors";
import { AssessmentEditors } from "./AssessmentEditors";
import { qualificationAreaLabels } from "../application/selectors/qualificationSelectors";

const stepLabels = {
  UTKAST: "Utkast",
  REGISTRERAD: "Registrerad utmaning",
  BEREDNING: "Under beredning",
  PRIORITERINGSBAR: "Prioriteringsbar",
  PRIORITERAD: "Prioriterad – startkrav återstår",
  STARTKLAR: "Klar för start",
  PAGAENDE: "Pågående",
  MATNING: "Under mätning",
  AVSLUTAT: "Avslutat",
} as const;
const emptyCase = { title: "", problemStatement: "", currentState: "", strategicHandlingReason: "", strategicRelevance: "", purpose: "", desiredState: "", scope: "", alternatives: "", doNothingConsequence: "", evidence: "", assumptions: "", uncertainty: "", timeHorizon: "", knownPrerequisites: "", knownRisks: "" };

export interface CaseNavigationContext { activeId?: ChallengeId; focusRequirementId?:CompletionRequirementId; query: string; stepFilter: string; sort?: string; }

export function CaseWorkspace({ state, dispatch, openPortfolio, context, setContext, feedback, openEffects, initialSection, onSectionChange, day = new Date().toISOString().slice(0,10) }: {
  state: DemoState;
  dispatch: (command: Command) => CommandResult;
  openPortfolio: (id: InitiativeId, nodeId?: ExecutionNodeId) => void;
  context: CaseNavigationContext;
  setContext: (next: CaseNavigationContext) => void;
  feedback: string;
  day?: string;
  initialSection?: FlowStepKey;
  onSectionChange?: (section: FlowStepKey | undefined) => void;
  openEffects?: (id: InitiativeId, section: FlowStepKey) => void;
}) {
  const [localDetail, setLocalDetail] = useState<FlowStepKey | undefined>(initialSection);
  const detail = onSectionChange ? initialSection : localDetail;
  const setDetail = onSectionChange ?? setLocalDetail;
  useLayoutEffect(()=>{if(typeof window!=="undefined")window.scrollTo(0,0);},[detail,context.activeId]);
  useEffect(()=>{if(context.focusRequirementId&&typeof document!=="undefined")document.getElementById(`completion-${context.focusRequirementId}`)?.scrollIntoView?.({block:"center"});},[context.focusRequirementId,detail]);
  const sort=context.sort??"priority";
  const setSort=(sort:string)=>setContext({...context,sort});
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useSessionDraft(`material-${context.activeId??"new"}`, () => {
    const saved = context.activeId ? state.entities.challenges[context.activeId] : undefined;
    return saved ? { ...emptyCase, title:saved.title,problemStatement:saved.problemStatement,currentState:saved.currentState,strategicHandlingReason:saved.strategicHandlingReason,strategicRelevance:saved.strategicRelevance, ...(saved.businessCase ?? {}) } : { ...emptyCase };
  });
  const [requirement, setRequirement] = useState({ missing: "", reason: "", responsible: "", verifier: "", deadline: "" });
  const [answers, setAnswers] = useState<Record<string, { summary: string; evidence: string }>>({});
  const items = useMemo(() => cockpitCases(state, day), [state, day]);
  const active = context.activeId ? items.find((item) => item.challengeId === context.activeId) : undefined;
  const challenge = active ? state.entities.challenges[active.challengeId] : undefined;
  const initiative = active?.initiativeId ? state.entities.initiatives[active.initiativeId] : undefined;
  const requirements = challenge ? Object.values(state.entities.completionRequirements).filter((item) => item.challengeId === challenge.id || (initiative && item.initiativeId === initiative.id)) : [];
  const config = activeQualificationConfiguration(state);
  const initiatorActor = Object.values(state.entities.roleAssignments).find((assignment) => state.entities.roleDefinitions[assignment.roleDefinitionId]?.roleKind === "INITIATOR")!;
  const specialistActor = Object.values(state.entities.roleAssignments).find((assignment) => state.entities.roleDefinitions[assignment.roleDefinitionId]?.roleKind === "SPECIALIST")!;
  const send = (command: Record<string, unknown>, actor: RoleAssignmentId = initiatorActor.id) => dispatch({ ...command, commandId: createId("Command", `case-${Date.now()}-${Math.random().toString(36).slice(2)}`), actorRoleAssignmentId: actor, issuedAt: new Date().toISOString() } as Command);
  const openCase = (id: ChallengeId, section?: FlowStepKey) => {
    const item = state.entities.challenges[id];
    setForm({ ...emptyCase, title: item.title, problemStatement: item.problemStatement, currentState: item.currentState, strategicHandlingReason: item.strategicHandlingReason, strategicRelevance: item.strategicRelevance, ...(item.businessCase ?? {}) });
    setContext({ ...context, activeId: id });
    setDetail(section);
  };

  const location=<LocationTrail items={[{label:"Ärenden",onClick:active?()=>setContext({...context,activeId:undefined}):undefined},...(active?[{label:active.title,onClick:detail?()=>setDetail(undefined):undefined}]:[]),...(detail?[{label:flowLocationLabels[detail]}]:[])]}/>;
  if (active && challenge) {
    if (!detail) return <section className="case-workspace" aria-label="Ärendevy">{location}
      <button className="back-link" onClick={()=>setContext({...context,activeId:undefined})}><ArrowLeft size={16}/> Till ärendeöversikten</button>
      <div className="case-detail-head"><div><p className="eyebrow">{active.caseNumber} · {stepLabels[active.step]}</p><h1>{active.title}</h1></div></div>
      <FlowOverview onOpenDependency={nodeId=>initiative&&openPortfolio(initiative.id,nodeId)} dispatch={dispatch} state={state} challengeId={challenge.id} day={day} onOpen={key=>{
        if(!initiative){setDetail(key);return;}
        if(key==="conditions")openPortfolio(initiative.id);
        else if(["commitments","decision","measurement"].includes(key)&&openEffects)openEffects(initiative.id,key);
        else setDetail(key);
      }}/>
    </section>;
    const saveMaterial = (nominationStatus = challenge.nominationStatus) => send({commandType:"UPDATE_STRATEGIC_CHALLENGE",targetId:challenge.id,payload:{title:form.title,problemStatement:form.problemStatement,currentState:form.currentState,strategicHandlingReason:form.strategicHandlingReason,strategicRelevance:form.strategicRelevance,nominationStatus}});
    const saveBusinessCase = () => send({commandType:"UPDATE_STRATEGIC_CHALLENGE",targetId:challenge.id,payload:{businessCase:{templateId:"DEMO-BUSINESSCASE-V2",purpose:form.purpose,desiredState:form.desiredState,scope:form.scope,alternatives:form.alternatives,doNothingConsequence:form.doNothingConsequence,evidence:form.evidence,assumptions:form.assumptions,uncertainty:form.uncertainty,timeHorizon:form.timeHorizon,knownPrerequisites:form.knownPrerequisites,knownRisks:form.knownRisks}}});
    return <section className="case-workspace" aria-label="Ärendevy">{location}
      <button className="back-link" onClick={() => setDetail(undefined)}><ArrowLeft size={16}/> Till ärendets flöde</button>
      <div className="case-detail-head"><div><p className="eyebrow">{active.caseNumber} · {stepLabels[active.step]}</p><h1>{active.title}</h1><p>{challenge.problemStatement || "Problemformulering saknas."}</p></div></div>

      <StepGate dispatch={dispatch} state={state} challengeId={challenge.id} day={day} stepKey={detail} onOpen={key=>{if(key==="conditions"&&initiative)openPortfolio(initiative.id);else if(["commitments","decision","measurement"].includes(key)&&initiative&&openEffects)openEffects(initiative.id,key);else setDetail(key);}}/>
      {initiative&&<InitiativeDependencies state={state} id={initiative.id} day={day} onOpen={nodeId=>openPortfolio(initiative.id,nodeId)}/>}
      {initiative&&<DataProvenance state={state} id={initiative.id}/>}
      <p role="status" className="inline-feedback">{feedback}</p>
      <div className="case-columns detail-level">
        {(detail==="material"||detail==="businesscase")&&<CaseDocumentEditor kind={detail} challenge={challenge} values={form} onChange={patch=>setForm({...form,...patch})} onSave={detail==="material"?()=>saveMaterial():saveBusinessCase} onNominate={()=>{const r=saveMaterial("NOMINATED");if(r.success)setDetail("businesscase");}} onNext={()=>setDetail("businesscase")} canRegister={!businessCaseDocumentBlockers(challenge).length} onRegister={()=>{const result=send({commandType:"CREATE_INITIATIVE_FROM_CHALLENGE",targetId:createId("Initiative",`preparation-${challenge.id}`),payload:{challengeId:challenge.id,title:challenge.title,purpose:challenge.businessCase!.purpose,desiredEndState:challenge.businessCase!.desiredState,scope:challenge.businessCase!.scope,initiativeKind:"VALUE_CREATING"}});if(result.success)setDetail("qualification");}}/>}
        {initiative&&(detail==="material"||detail==="businesscase")&&<button onClick={()=>openPortfolio(initiative.id)}>Öppna potential, beroenden och kostnader <ChevronRight size={16}/></button>}
        {detail==="qualification"&&<aside className="card"><p className="eyebrow">HINDER OCH NÄSTA STEG</p><h2>{active.nextAction}</h2><p><b>Hinder:</b> {active.obstacle}</p><p><b>Ansvarig:</b> {active.responsible}</p><p><b>Datum:</b> {active.dueDate ?? "Datum saknas"} {active.overdue && <strong className="overdue">Försenad</strong>}</p>
          {requirements.map((item) => <details id={`completion-${item.id}`} className="point-detail" key={item.id} open={context.focusRequirementId===item.id?true:undefined}><summary>{item.missingItem} · {["VERIFIED","NOT_APPLICABLE"].includes(item.status)?"Klart":"Åtgärd behövs"}</summary><CompletionCard itemId={item.id} state={state} send={send}/></details>) }
          <details className="point-detail"><summary>Lägg till kompletteringskrav</summary><form onSubmit={(event) => { event.preventDefault(); send({ commandType:"CREATE_COMPLETION_REQUIREMENT", targetId:createId("CompletionRequirement", `ui-${Date.now()}`), payload:{ challengeId:challenge.id, initiativeId:initiative?.id, missingItem:requirement.missing, reasonRequired:requirement.reason, blocks:["QUALIFICATION"], responsibleRoleAssignmentId: requirement.responsible || undefined, verifierRoleAssignmentId: requirement.verifier || undefined, deadline: requirement.deadline || undefined } }); }}><h3>Lägg till kompletteringskrav</h3><input required aria-label="Vad saknas" placeholder="Vad saknas?" value={requirement.missing} onChange={(event)=>setRequirement({...requirement,missing:event.target.value})}/><input required aria-label="Varför behövs uppgiften" placeholder="Varför behövs uppgiften?" value={requirement.reason} onChange={(event)=>setRequirement({...requirement,reason:event.target.value})}/><RoleSelect label="Den som kompletterar" value={requirement.responsible} state={state} onChange={(responsible)=>setRequirement({...requirement,responsible})}/><RoleSelect label="Den som verifierar" value={requirement.verifier} state={state} onChange={(verifier)=>setRequirement({...requirement,verifier})}/><input aria-label="Förfallodatum" type="date" value={requirement.deadline} onChange={(event)=>setRequirement({...requirement,deadline:event.target.value})}/><button>Spara krav</button></form></details>
        </aside>}
      </div>
      {initiative && (detail==="potential"||detail==="priority") && <AssessmentEditors state={state} initiativeId={initiative.id} dispatch={dispatch} section={detail}/>}
      {detail==="qualification" && initiative && config && <section data-step-work="qualification" className="card qualification-editor">
        <p className="eyebrow">INDIVIDUELLA BEDÖMNINGAR</p><h2>Kvalificering</h2><p>Varje punkt bedöms och sparas separat. Ett svar på en komplettering godkänner inga punkter.</p>{config.criteria.map((criterion) => { const current=Object.values(state.entities.qualificationAssessments).find((item)=>item.initiativeId===initiative.id&&item.criterionCode===criterion.criterionCode); const draft=answers[criterion.criterionCode] ?? {summary:current?.summary??"",evidence:current?.evidenceRefs[0]??""}; return <details className="point-detail" key={criterion.criterionCode}><summary>{criterion.name} · {current&&isQualificationAssessmentValid(current)?"Klart":"Åtgärd behövs"}</summary><div className="criterion"><div><b>{criterion.name}</b><small>{qualificationAreaLabels[criterion.qualificationArea]} · {criterion.helpText}</small></div><input aria-label={`Bedömning ${criterion.name}`} placeholder="Bedömning" value={draft.summary} onChange={(event)=>setAnswers({...answers,[criterion.criterionCode]:{...draft,summary:event.target.value}})}/><input aria-label={`Underlag ${criterion.name}`} placeholder="Underlagsreferens" value={draft.evidence} onChange={(event)=>setAnswers({...answers,[criterion.criterionCode]:{...draft,evidence:event.target.value}})}/><button onClick={()=>send({commandType:"UPSERT_QUALIFICATION_ASSESSMENT",targetId:current?.id??createId("QualificationAssessment",`${initiative.id}-${criterion.criterionCode.toLowerCase().replaceAll("_","-")}`),payload:{initiativeId:initiative.id,qualificationArea:criterion.qualificationArea,criterionCode:criterion.criterionCode,summary:draft.summary,status:"SATISFIED",mandatory:criterion.mandatory,requiresVerification:criterion.requiresVerification,evidenceRefs:[draft.evidence],assumptions:[],assessedAgainstConfigurationVersion:config.id}}, initiatorActor.id)}>Spara punkt</button>{current?.requiresVerification&&!current.verifiedAt&&<button onClick={()=>send({commandType:"VERIFY_QUALIFICATION_ASSESSMENT",targetId:current.id},specialistActor.id)}>Specialistverifiera</button>}</div></details>})}

      </section>}
      <StepGate footer state={state} challengeId={challenge.id} day={day} stepKey={detail} onOpen={key=>{if(key==="conditions"&&initiative)openPortfolio(initiative.id);else if(["commitments","decision","measurement"].includes(key)&&initiative&&openEffects)openEffects(initiative.id,key);else setDetail(key);}}/>
    </section>;
  }

  const filtered = items.filter((item) => (context.stepFilter === "ALL" || item.step === context.stepFilter) && `${item.caseNumber} ${item.title} ${item.area}`.toLocaleLowerCase("sv").includes(context.query.toLocaleLowerCase("sv")));
  if(sort==="oldest")filtered.sort((a,b)=>a.createdAt.localeCompare(b.createdAt)||a.caseNumber.localeCompare(b.caseNumber));
  if(sort==="deadline")filtered.sort((a,b)=>(a.dueDate??"9999").localeCompare(b.dueDate??"9999"));
  return <section className="case-workspace" aria-label="Ärendeöversikt">{location}<div className="overview-head"><div><p className="eyebrow">STRATEGISKA ÄRENDEN</p><h1>Vad behöver ledningens uppmärksamhet?</h1><p>Prioriterade ärenden först. Följ nästa steg, ansvar och vad som behöver bli klart före genomförande.</p></div><button onClick={()=>{setForm({...emptyCase});setShowNew(!showNew)}}><Plus size={17}/> Registrera utmaning</button></div>
    <p role="status" className="inline-feedback">{feedback}</p>
    {showNew && <form className="new-case" onSubmit={(event)=>{event.preventDefault();const id=createId("Challenge",`user-${Date.now()}`);const result=send({commandType:"CREATE_STRATEGIC_CHALLENGE",targetId:id,payload:{title:form.title,problemStatement:form.problemStatement,currentState:form.currentState,source:"Registrerad i demosessionen",strategicRelevance:form.strategicRelevance,strategicHandlingReason:form.strategicHandlingReason,nominationStatus:"DRAFT"}});if(result.success){setShowNew(false);setContext({...context,activeId:id});setDetail("material");}}}><h2>Nytt utkast</h2><p>Börja med titel och problem. Övrigt underlag kompletteras stegvis.</p><label>Titel<input value={form.title} onChange={(event)=>setForm({...form,title:event.target.value})}/></label><label>Problem<textarea value={form.problemStatement} onChange={(event)=>setForm({...form,problemStatement:event.target.value})}/></label><button>Spara utkast i demosessionen</button></form>}
    <StartReadyQueue compact state={state} day={day} onOpen={id=>openEffects?openEffects(id,"decision"):openCase(state.entities.initiatives[id].challengeId)}/>
    <div className="case-toolbar"><label><Search size={16}/><input aria-label="Sök ärenden" placeholder="Sök nummer, titel eller område" value={context.query} onChange={(event)=>setContext({...context,query:event.target.value})}/></label><select aria-label="Filtrera processteg" value={context.stepFilter} onChange={(event)=>setContext({...context,stepFilter:event.target.value})}><option value="ALL">Alla processteg</option>{Object.entries(stepLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select><select aria-label="Sortera ärendelistan" value={sort} onChange={e=>setSort(e.target.value)}><option value="priority">Prioriteringsunderlag – högst först</option><option value="deadline">Nästa åtgärdsdatum</option><option value="oldest">Äldsta ärende först</option></select><span>{filtered.length} av {items.length}</span></div>
    <details className="case-list-help"><summary>Så fungerar flödet och sorteringen</summary><p>Utmaning → businesscase → kvalificering → effektpotential → prioritering → förutsättningar → lokala åtaganden → startbeslut → förändring och effektmätning. Öppna ett ärende och välj Fortsätt för att arbeta med nästa uppgift.</p><p className="sort-explanation">{sort==="priority"?"Sortering: senaste giltiga underlag i aktiv styrprofil, högst poäng först. Lika poäng: äldsta ärendet först. Övriga ärenden visas därefter utan placering. Prioritet är inte startbeslut eller körordning.":sort==="deadline"?"Sortering: tidigaste dokumenterade åtgärdsdatum först. Saknade datum visas sist. Detta ändrar inte prioriteringen.":"Sortering: registreringsdatum, äldsta först. Detta ändrar inte prioriteringen."}</p></details>
    <div className="case-table" role="table"><div className="case-row case-header" role="row"><span>Ärende</span><span>Steg</span><span>Nästa åtgärd</span><span>Ansvar och datum</span></div>{filtered.map((item)=>{const flow=caseFlow(state,item.challengeId,day),next=flow.find(s=>s.status==="ACTION");return <div className="case-row" role="row" key={item.challengeId}><button className="case-open" onClick={()=>openCase(item.challengeId)}><span><b>{item.caseNumber}</b><strong>{item.title}</strong><small>{item.area}</small><small className="list-priority">{item.priorityScore!==undefined?`${item.priorityScore} / 100 · ${item.assessment?.status==="CALCULATED"?"granskning återstår":"granskat underlag"}`:item.stale?"Ny bedömning behövs":"Ingen prioriteringsplacering ännu"}</small><span className="open-affordance">Öppna ärende <ChevronRight size={16}/></span></span><span><i>{stepLabels[item.step]}</i></span></button><div className="case-next-action">{next?<button className="text-button" onClick={()=>{if(next.key==="conditions"&&item.initiativeId)openPortfolio(item.initiativeId);else if(["commitments","decision","measurement"].includes(next.key)&&item.initiativeId&&openEffects)openEffects(item.initiativeId,next.key);else openCase(item.challengeId,next.key);}}>{item.nextAction} →</button>:<span>{item.nextAction}</span>}</div><div>{next?<FollowUpEditor key={`${item.challengeId}-${next.key}`} state={state} challengeId={item.challengeId} step={next} day={day} dispatch={dispatch}/>:<p>Inga öppna steg</p>}</div></div>})}</div><p className="session-note">Demodatum: {day}. Ändringar finns bara i demosessionen.</p></section>;
}

function RoleSelect({label,value,state,onChange}:{label:string;value:string;state:DemoState;onChange:(value:string)=>void}) { return <label>{label}<select value={value} onChange={(event)=>onChange(event.target.value)}><option value="">Ansvarig saknas</option>{Object.values(state.entities.roleAssignments).map((assignment)=><option key={assignment.id} value={assignment.id}>{state.entities.people[assignment.personId].displayName} · {state.entities.roleDefinitions[assignment.roleDefinitionId].name}</option>)}</select></label> }
function CompletionCard({itemId,state,send}:{itemId:CompletionRequirementId;state:DemoState;send:(command:Record<string,unknown>,actor?:RoleAssignmentId)=>CommandResult}) { const item=state.entities.completionRequirements[itemId]; const [answer,setAnswer]=useState(""); const [assignment,setAssignment]=useState({responsible:item.responsibleRoleAssignmentId??"",verifier:item.verifierRoleAssignmentId??"",deadline:item.deadline??""}); const role=(id?:RoleAssignmentId)=>id?`${state.entities.people[state.entities.roleAssignments[id].personId].displayName} · ${state.entities.roleDefinitions[state.entities.roleAssignments[id].roleDefinitionId].name}`:"Saknas"; return <div className="requirement"><b>{item.missingItem}</b><span>Varför: {item.reasonRequired}</span><span>Blockerar: {item.blocks.join(", ")}</span><span>Kompletterar: {role(item.responsibleRoleAssignmentId)}</span><span>Verifierar: {role(item.verifierRoleAssignmentId)}</span><span>Datum: {item.deadline??"Saknas"} · Status: {item.status}</span><span>Svar: {item.resolutionSummary||"Dokumenterat svar saknas"}</span>{(!item.responsibleRoleAssignmentId||!item.deadline||!item.verifierRoleAssignmentId)&&<div className="requirement-assignment"><RoleSelect label="Tilldela kompletterare" value={assignment.responsible} state={state} onChange={(responsible)=>setAssignment({...assignment,responsible})}/><RoleSelect label="Tilldela verifierare" value={assignment.verifier} state={state} onChange={(verifier)=>setAssignment({...assignment,verifier})}/><input aria-label="Sätt förfallodatum" type="date" value={assignment.deadline} onInput={(event)=>setAssignment({...assignment,deadline:event.currentTarget.value})} onChange={(event)=>setAssignment({...assignment,deadline:event.target.value})}/><button disabled={!assignment.responsible||!assignment.deadline} onClick={()=>send({commandType:"ASSIGN_COMPLETION_RESPONSIBILITY",targetId:item.id,payload:{responsibleRoleAssignmentId:assignment.responsible,verifierRoleAssignmentId:assignment.verifier||undefined,deadline:assignment.deadline}})}>Tilldela krav</button></div>}{!["VERIFIED","NOT_APPLICABLE"].includes(item.status)&&<><input aria-label={`Svar ${item.missingItem}`} value={answer} onChange={(event)=>setAnswer(event.target.value)} placeholder="Dokumenterat svar"/>{item.status!=="SUBMITTED"?<button onClick={()=>send({commandType:"SUBMIT_COMPLETION_REQUIREMENT",targetId:item.id,payload:{submittedEvidenceRefs:[`DEMO-SVAR-${item.id}`],resolutionSummary:answer}},item.responsibleRoleAssignmentId)}>Skicka svar</button>:<button onClick={()=>send({commandType:"VERIFY_COMPLETION_REQUIREMENT",targetId:item.id,payload:{resolutionSummary:answer||item.resolutionSummary||"Verifierat svar"}},item.verifierRoleAssignmentId)}>Verifiera svar</button>}</>}</div> }
