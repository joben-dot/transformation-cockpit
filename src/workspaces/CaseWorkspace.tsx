import { useMemo, useState, useLayoutEffect } from "react";
import { ArrowLeft, ChevronRight, Plus, Search } from "lucide-react";
import {
  activeQualificationConfiguration,
  caseOverview,
} from "../application/selectors";
import type { Command, CommandResult, DemoState } from "../application";
import {
  createId,
  type ChallengeId,
  type CompletionRequirementId,
  type InitiativeId,
  type RoleAssignmentId,
} from "../domain";
import { FlowOverview } from "./FlowOverview";
import type { FlowStepKey } from "../application/selectors/flowSelectors";
import { isQualificationAssessmentValid } from "../application/selectors/qualificationSelectors";
import { AssessmentEditors } from "./AssessmentEditors";
import { qualificationAreaLabels } from "../application/selectors/qualificationSelectors";

const stepLabels = {
  UTKAST: "Utkast",
  REGISTRERAD: "Registrerad utmaning",
  BEREDNING: "Under beredning",
  PRIORITERINGSBAR: "Prioriteringsbar",
  PAGAENDE: "Pågående",
  MATNING: "Under mätning",
  AVSLUTAT: "Avslutat",
} as const;
const emptyCase = { title: "", problemStatement: "", currentState: "", strategicHandlingReason: "", strategicRelevance: "", purpose: "", desiredState: "", scope: "", alternatives: "", doNothingConsequence: "", evidence: "", assumptions: "", uncertainty: "", timeHorizon: "", knownPrerequisites: "", knownRisks: "" };

export interface CaseNavigationContext { activeId?: ChallengeId; query: string; stepFilter: string; }

export function CaseWorkspace({ state, dispatch, openPortfolio, context, setContext, feedback, openEffects, initialSection, day = new Date().toISOString().slice(0,10) }: {
  state: DemoState;
  dispatch: (command: Command) => CommandResult;
  openPortfolio: (id: InitiativeId) => void;
  context: CaseNavigationContext;
  setContext: (next: CaseNavigationContext) => void;
  feedback: string;
  day?: string;
  initialSection?: FlowStepKey;
  openEffects?: (id: InitiativeId, section: FlowStepKey) => void;
}) {
  const [detail, setDetail] = useState<FlowStepKey | undefined>(initialSection);
  useLayoutEffect(()=>{if(typeof window!=="undefined")window.scrollTo(0,0);},[detail,context.activeId]);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState(() => {
    const saved = context.activeId ? state.entities.challenges[context.activeId] : undefined;
    return saved ? { ...emptyCase, ...saved, ...(saved.businessCase ?? {}) } : { ...emptyCase };
  });
  const [requirement, setRequirement] = useState({ missing: "", reason: "", responsible: "", verifier: "", deadline: "" });
  const [answers, setAnswers] = useState<Record<string, { summary: string; evidence: string }>>({});
  const [initiativeDraft, setInitiativeDraft] = useState({ title: "", purpose: "", desiredEndState: "", scope: "" });
  const items = useMemo(() => caseOverview(state, day), [state, day]);
  const active = context.activeId ? items.find((item) => item.challengeId === context.activeId) : undefined;
  const challenge = active ? state.entities.challenges[active.challengeId] : undefined;
  const initiative = active?.initiativeId ? state.entities.initiatives[active.initiativeId] : undefined;
  const requirements = challenge ? Object.values(state.entities.completionRequirements).filter((item) => item.challengeId === challenge.id || (initiative && item.initiativeId === initiative.id)) : [];
  const config = activeQualificationConfiguration(state);
  const initiatorActor = Object.values(state.entities.roleAssignments).find((assignment) => state.entities.roleDefinitions[assignment.roleDefinitionId]?.roleKind === "INITIATOR")!;
  const specialistActor = Object.values(state.entities.roleAssignments).find((assignment) => state.entities.roleDefinitions[assignment.roleDefinitionId]?.roleKind === "SPECIALIST")!;
  const send = (command: Record<string, unknown>, actor: RoleAssignmentId = initiatorActor.id) => dispatch({ ...command, commandId: createId("Command", `case-${Date.now()}-${Math.random().toString(36).slice(2)}`), actorRoleAssignmentId: actor, issuedAt: new Date().toISOString() } as Command);
  const openCase = (id: ChallengeId) => {
    const item = state.entities.challenges[id];
    setForm({ ...emptyCase, title: item.title, problemStatement: item.problemStatement, currentState: item.currentState, strategicHandlingReason: item.strategicHandlingReason, strategicRelevance: item.strategicRelevance, ...(item.businessCase ?? {}) });
    setContext({ ...context, activeId: id });
  };

  if (active && challenge) {
    if (!detail) return <section className="case-workspace" aria-label="Ärendevy">
      <button className="back-link" onClick={()=>setContext({...context,activeId:undefined})}><ArrowLeft size={16}/> Till ärendeöversikten</button>
      <div className="case-detail-head"><div><p className="eyebrow">{active.caseNumber} · {stepLabels[active.step]}</p><h1>{active.title}</h1></div></div>
      <FlowOverview state={state} challengeId={challenge.id} day={day} onOpen={key=>{
        if(!initiative){setDetail("material");return;}
        if(key==="conditions")openPortfolio(initiative.id);
        else if(["commitments","decision","measurement"].includes(key)&&openEffects)openEffects(initiative.id,key);
        else setDetail(key);
      }}/>
    </section>;
    const saveMaterial = (nominationStatus = challenge.nominationStatus) => send({ commandType: "UPDATE_STRATEGIC_CHALLENGE", targetId: challenge.id, payload: { title: form.title, problemStatement: form.problemStatement, currentState: form.currentState, strategicHandlingReason: form.strategicHandlingReason, strategicRelevance: form.strategicRelevance, nominationStatus, businessCase: { templateId: "DEMO-CASE-V1", purpose: form.purpose, desiredState: form.desiredState, scope: form.scope, alternatives: form.alternatives, doNothingConsequence: form.doNothingConsequence, evidence: form.evidence, assumptions: form.assumptions, uncertainty: form.uncertainty, timeHorizon: form.timeHorizon, knownPrerequisites: form.knownPrerequisites, knownRisks: form.knownRisks } } });
    return <section className="case-workspace" aria-label="Ärendevy">
      <button className="back-link" onClick={() => setDetail(undefined)}><ArrowLeft size={16}/> Till ärendets flöde</button>
      <div className="case-detail-head"><div><p className="eyebrow">{active.caseNumber} · {stepLabels[active.step]}</p><h1>{active.title}</h1><p>{challenge.problemStatement || "Problemformulering saknas."}</p></div><span className="demo-role">Fiktiv demosession<small>Roll används per handling – ingen verklig autentisering</small></span></div>

      <p role="status" className="inline-feedback">{feedback}</p>
      <div className="case-columns detail-level">
        {detail==="material"&&<article className="card"><p className="eyebrow">GEMENSAMT UNDERLAG</p><h2>Utmaning och businesscase</h2><p className="template-note">Demonstrationsmall v1 · konfigurerbar struktur · inte verifierad som PPS-komplett</p>
          <dl className="material-summary">{[["Problem och behov",challenge.problemStatement],["Syfte",challenge.businessCase?.purpose],["Önskat läge",challenge.businessCase?.desiredState],["Avgränsning",challenge.businessCase?.scope]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value||"Behöver kompletteras"}</dd></div>)}</dl><details className="point-detail"><summary>Öppna underlaget för komplettering</summary><form className="material-form" onSubmit={(event) => { event.preventDefault(); saveMaterial(); }}>
            {[ ["title","Titel"], ["problemStatement","Problem och behov"], ["currentState","Nuläge"], ["strategicHandlingReason","Varför strategisk hantering?"], ["strategicRelevance","Strategisk relevans"], ["purpose","Syfte"], ["desiredState","Önskat förändrat läge"], ["scope","Avgränsning"], ["alternatives","Alternativ"], ["doNothingConsequence","Om vi avstår"], ["evidence","Evidens"], ["assumptions","Antaganden"], ["uncertainty","Osäkerhet"], ["timeHorizon","Tidshorisont"], ["knownPrerequisites","Kända förutsättningar"], ["knownRisks","Kända risker"] ].map(([key,label]) => <label key={key}>{label}<textarea value={form[key as keyof typeof form]} onChange={(event) => setForm({ ...form, [key]: event.target.value })}/></label>)}
            <button>Spara underlag</button>
          </form>
          {challenge.nominationStatus === "DRAFT" && <button onClick={() => saveMaterial("NOMINATED")}>Skicka utmaning till beredning</button>}
          {challenge.nominationStatus === "NOMINATED" && !initiative && <form onSubmit={(event) => { event.preventDefault(); const result = send({ commandType: "CREATE_INITIATIVE_FROM_CHALLENGE", targetId: createId("Initiative", `preparation-${challenge.id}`), payload: { challengeId: challenge.id, ...initiativeDraft, initiativeKind: "VALUE_CREATING" } }); if (result.success) setInitiativeDraft({ title: "", purpose: "", desiredEndState: "", scope: "" }); }}><h3>Skapa länkat beredningsinitiativ</h3>{Object.entries(initiativeDraft).map(([key,value]) => <label key={key}>{({title:"Titel",purpose:"Syfte",desiredEndState:"Önskat läge",scope:"Avgränsning"} as Record<string,string>)[key]}<input required value={value} onChange={(event)=>setInitiativeDraft({...initiativeDraft,[key]:event.target.value})}/></label>)}<button>Registrera initiativ för beredning</button><small>Registrering är inte ett startbeslut.</small></form>}
          </details>
          {initiative && <><p className="linked-note">Potential, förutsättningar och kostnader hämtas från länkade domänobjekt och kopieras inte hit.</p><button onClick={() => openPortfolio(initiative.id)}>Öppna potential, beroenden och kostnader <ChevronRight size={16}/></button></>}
          <details className="trace"><summary>Fördjupad spårbarhet</summary><code>{challenge.id}</code>{initiative && <code>{initiative.id}</code>}</details>
        </article>}
        {detail==="qualification"&&<aside className="card"><p className="eyebrow">HINDER OCH NÄSTA STEG</p><h2>{active.nextAction}</h2><p><b>Hinder:</b> {active.obstacle}</p><p><b>Ansvarig:</b> {active.responsible}</p><p><b>Datum:</b> {active.dueDate ?? "Datum saknas"} {active.overdue && <strong className="overdue">Försenad</strong>}</p>
          {requirements.map((item) => <details className="point-detail" key={item.id}><summary>{item.missingItem} · {["VERIFIED","NOT_APPLICABLE"].includes(item.status)?"Klart":"Åtgärd behövs"}</summary><CompletionCard itemId={item.id} state={state} send={send}/></details>) }
          <details className="point-detail"><summary>Lägg till kompletteringskrav</summary><form onSubmit={(event) => { event.preventDefault(); send({ commandType:"CREATE_COMPLETION_REQUIREMENT", targetId:createId("CompletionRequirement", `ui-${Date.now()}`), payload:{ challengeId:challenge.id, initiativeId:initiative?.id, missingItem:requirement.missing, reasonRequired:requirement.reason, blocks:["QUALIFICATION"], responsibleRoleAssignmentId: requirement.responsible || undefined, verifierRoleAssignmentId: requirement.verifier || undefined, deadline: requirement.deadline || undefined } }); }}><h3>Lägg till kompletteringskrav</h3><input required aria-label="Vad saknas" placeholder="Vad saknas?" value={requirement.missing} onChange={(event)=>setRequirement({...requirement,missing:event.target.value})}/><input required aria-label="Varför behövs uppgiften" placeholder="Varför behövs uppgiften?" value={requirement.reason} onChange={(event)=>setRequirement({...requirement,reason:event.target.value})}/><RoleSelect label="Den som kompletterar" value={requirement.responsible} state={state} onChange={(responsible)=>setRequirement({...requirement,responsible})}/><RoleSelect label="Den som verifierar" value={requirement.verifier} state={state} onChange={(verifier)=>setRequirement({...requirement,verifier})}/><input aria-label="Förfallodatum" type="date" value={requirement.deadline} onChange={(event)=>setRequirement({...requirement,deadline:event.target.value})}/><button>Spara krav</button></form></details>
        </aside>}
      </div>
      {initiative && (detail==="potential"||detail==="priority") && <AssessmentEditors state={state} initiativeId={initiative.id} dispatch={dispatch} section={detail}/>}
      {detail==="qualification" && initiative && config && <section className="card qualification-editor">
        <p className="eyebrow">INDIVIDUELLA BEDÖMNINGAR</p><h2>Kvalificering</h2><p>Varje punkt bedöms och sparas separat. Ett svar på en komplettering godkänner inga punkter.</p>{config.criteria.map((criterion) => { const current=Object.values(state.entities.qualificationAssessments).find((item)=>item.initiativeId===initiative.id&&item.criterionCode===criterion.criterionCode); const draft=answers[criterion.criterionCode] ?? {summary:current?.summary??"",evidence:current?.evidenceRefs[0]??""}; return <details className="point-detail" key={criterion.criterionCode}><summary>{criterion.name} · {current&&isQualificationAssessmentValid(current)?"Klart":"Åtgärd behövs"}</summary><div className="criterion"><div><b>{criterion.name}</b><small>{qualificationAreaLabels[criterion.qualificationArea]} · {criterion.helpText}</small></div><input aria-label={`Bedömning ${criterion.name}`} placeholder="Bedömning" value={draft.summary} onChange={(event)=>setAnswers({...answers,[criterion.criterionCode]:{...draft,summary:event.target.value}})}/><input aria-label={`Underlag ${criterion.name}`} placeholder="Underlagsreferens" value={draft.evidence} onChange={(event)=>setAnswers({...answers,[criterion.criterionCode]:{...draft,evidence:event.target.value}})}/><button onClick={()=>send({commandType:"UPSERT_QUALIFICATION_ASSESSMENT",targetId:current?.id??createId("QualificationAssessment",`${initiative.id}-${criterion.criterionCode.toLowerCase().replaceAll("_","-")}`),payload:{initiativeId:initiative.id,qualificationArea:criterion.qualificationArea,criterionCode:criterion.criterionCode,summary:draft.summary,status:"SATISFIED",mandatory:criterion.mandatory,requiresVerification:criterion.requiresVerification,evidenceRefs:[draft.evidence],assumptions:[],assessedAgainstConfigurationVersion:config.id}}, initiatorActor.id)}>Spara punkt</button>{current?.requiresVerification&&!current.verifiedAt&&<button onClick={()=>send({commandType:"VERIFY_QUALIFICATION_ASSESSMENT",targetId:current.id},specialistActor.id)}>Specialistverifiera</button>}</div></details>})}

      </section>}
    </section>;
  }

  const filtered = items.filter((item) => (context.stepFilter === "ALL" || item.step === context.stepFilter) && `${item.caseNumber} ${item.title} ${item.area}`.toLocaleLowerCase("sv").includes(context.query.toLocaleLowerCase("sv")));
  return <section className="case-workspace" aria-label="Ärendeöversikt"><div className="overview-head"><div><p className="eyebrow">STRATEGISKA ÄRENDEN</p><h1>Vad behöver ledningens uppmärksamhet?</h1><p>Härledda processteg, faktiska hinder och ägare till nästa handling. Arbetslistan är inte en prioriteringsranking.</p></div><button onClick={()=>{setForm({...emptyCase});setShowNew(!showNew)}}><Plus size={17}/> Registrera utmaning</button></div>
    <p role="status" className="inline-feedback">{feedback}</p>
    {showNew && <form className="new-case" onSubmit={(event)=>{event.preventDefault();const id=createId("Challenge",`user-${Date.now()}`);const result=send({commandType:"CREATE_STRATEGIC_CHALLENGE",targetId:id,payload:{title:form.title,problemStatement:form.problemStatement,currentState:form.currentState,source:"Registrerad i demosessionen",strategicRelevance:form.strategicRelevance,strategicHandlingReason:form.strategicHandlingReason,nominationStatus:"DRAFT"}});if(result.success){setShowNew(false);setContext({...context,activeId:id});}}}><h2>Nytt utkast</h2><p>Tomma uppgifter får sparas och kompletteras senare.</p><label>Titel<input value={form.title} onChange={(event)=>setForm({...form,title:event.target.value})}/></label><label>Problem<textarea value={form.problemStatement} onChange={(event)=>setForm({...form,problemStatement:event.target.value})}/></label><button>Spara utkast i demosessionen</button></form>}
    <div className="case-toolbar"><label><Search size={16}/><input aria-label="Sök ärenden" placeholder="Sök nummer, titel eller område" value={context.query} onChange={(event)=>setContext({...context,query:event.target.value})}/></label><select aria-label="Filtrera processteg" value={context.stepFilter} onChange={(event)=>setContext({...context,stepFilter:event.target.value})}><option value="ALL">Alla processteg</option>{Object.entries(stepLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select><span>Sorterad: äldsta först · {filtered.length} av {items.length}</span></div>
    <div className="case-table" role="table"><div className="case-row case-header" role="row"><span>Ärende</span><span>Steg</span><span>Nästa åtgärd</span><span>Ansvar och datum</span></div>{filtered.map((item)=><button className="case-row" role="row" key={item.challengeId} onClick={()=>openCase(item.challengeId)}><span><b>{item.caseNumber}</b><strong>{item.title}</strong><small>{item.area}</small></span><span><i>{stepLabels[item.step]}</i></span><span><strong>{item.nextAction}</strong></span><span><b>{item.responsible}</b><small>{item.dueDate??"Datum saknas"} {item.overdue&&<em>Försenad</em>}</small></span></button>)}</div><p className="session-note">Demodatum: {day}. Ändringar finns bara i demosessionen.</p></section>;
}

function RoleSelect({label,value,state,onChange}:{label:string;value:string;state:DemoState;onChange:(value:string)=>void}) { return <label>{label}<select value={value} onChange={(event)=>onChange(event.target.value)}><option value="">Ansvarig saknas</option>{Object.values(state.entities.roleAssignments).map((assignment)=><option key={assignment.id} value={assignment.id}>{state.entities.people[assignment.personId].displayName} · {state.entities.roleDefinitions[assignment.roleDefinitionId].name}</option>)}</select></label> }
function CompletionCard({itemId,state,send}:{itemId:CompletionRequirementId;state:DemoState;send:(command:Record<string,unknown>,actor?:RoleAssignmentId)=>CommandResult}) { const item=state.entities.completionRequirements[itemId]; const [answer,setAnswer]=useState(""); const [assignment,setAssignment]=useState({responsible:item.responsibleRoleAssignmentId??"",verifier:item.verifierRoleAssignmentId??"",deadline:item.deadline??""}); const role=(id?:RoleAssignmentId)=>id?`${state.entities.people[state.entities.roleAssignments[id].personId].displayName} · ${state.entities.roleDefinitions[state.entities.roleAssignments[id].roleDefinitionId].name}`:"Saknas"; return <div className="requirement"><b>{item.missingItem}</b><span>Varför: {item.reasonRequired}</span><span>Blockerar: {item.blocks.join(", ")}</span><span>Kompletterar: {role(item.responsibleRoleAssignmentId)}</span><span>Verifierar: {role(item.verifierRoleAssignmentId)}</span><span>Datum: {item.deadline??"Saknas"} · Status: {item.status}</span><span>Svar: {item.resolutionSummary||"Dokumenterat svar saknas"}</span>{(!item.responsibleRoleAssignmentId||!item.deadline||!item.verifierRoleAssignmentId)&&<div className="requirement-assignment"><RoleSelect label="Tilldela kompletterare" value={assignment.responsible} state={state} onChange={(responsible)=>setAssignment({...assignment,responsible})}/><RoleSelect label="Tilldela verifierare" value={assignment.verifier} state={state} onChange={(verifier)=>setAssignment({...assignment,verifier})}/><input aria-label="Sätt förfallodatum" type="date" value={assignment.deadline} onChange={(event)=>setAssignment({...assignment,deadline:event.target.value})}/><button disabled={!assignment.responsible||!assignment.deadline} onClick={()=>send({commandType:"ASSIGN_COMPLETION_RESPONSIBILITY",targetId:item.id,payload:{responsibleRoleAssignmentId:assignment.responsible,verifierRoleAssignmentId:assignment.verifier||undefined,deadline:assignment.deadline}})}>Tilldela krav</button></div>}{!["VERIFIED","NOT_APPLICABLE"].includes(item.status)&&<><input aria-label={`Svar ${item.missingItem}`} value={answer} onChange={(event)=>setAnswer(event.target.value)} placeholder="Dokumenterat svar"/>{item.status!=="SUBMITTED"?<button onClick={()=>send({commandType:"SUBMIT_COMPLETION_REQUIREMENT",targetId:item.id,payload:{submittedEvidenceRefs:[`DEMO-SVAR-${item.id}`],resolutionSummary:answer}},item.responsibleRoleAssignmentId)}>Skicka svar</button>:<button onClick={()=>send({commandType:"VERIFY_COMPLETION_REQUIREMENT",targetId:item.id,payload:{resolutionSummary:answer||item.resolutionSummary||"Verifierat svar"}},item.verifierRoleAssignmentId)}>Verifiera svar</button>}</>}</div> }
