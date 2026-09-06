import { useMemo, useState } from "react";
import { ArrowLeft, Check, ChevronRight, Plus, Search } from "lucide-react";
import { caseOverview, deriveQualificationStatus } from "../application/selectors";
import type { Command, DemoState } from "../application";
import { createId, type ChallengeId, type InitiativeId } from "../domain";

const stepLabels = { UTKAST: "Utkast", REGISTRERAD: "Registrerad utmaning", BEREDNING: "Under beredning", PRIORITERINGSBAR: "Prioriteringsbar" } as const;
const process = ["Utmaning", "Businesscase", "Kvalificering", "Prioritering", "Effektåtagande", "Startbeslut", "Effektuppföljning"];

export function CaseWorkspace({ state, dispatch, openPortfolio }: { state: DemoState; dispatch: (command: Command) => unknown; openPortfolio: (id: InitiativeId) => void }) {
  const [activeId, setActiveId] = useState<ChallengeId>();
  const [query, setQuery] = useState("");
  const [stepFilter, setStepFilter] = useState("ALL");
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: "", problem: "", currentState: "", reason: "", relevance: "" });
  const [requirement, setRequirement] = useState({ missing: "", reason: "", responsible: "", deadline: "" });
  const items = useMemo(() => caseOverview(state), [state]);
  const filtered = items.filter((item) => (stepFilter === "ALL" || item.step === stepFilter) && `${item.caseNumber} ${item.title} ${item.area}`.toLocaleLowerCase("sv").includes(query.toLocaleLowerCase("sv")));
  const actor = Object.values(state.entities.roleAssignments)[0];
  const active = activeId ? items.find((item) => item.challengeId === activeId) : undefined;
  const challenge = active ? state.entities.challenges[active.challengeId] : undefined;
  const initiative = active?.initiativeId ? state.entities.initiatives[active.initiativeId] : undefined;
  const requirements = active?.initiativeId ? Object.values(state.entities.completionRequirements).filter((item) => item.initiativeId === active.initiativeId) : [];
  const send = (command: Record<string, unknown>) => dispatch({ ...command, commandId: createId("Command", `case-${Date.now()}`), actorRoleAssignmentId: actor.id, issuedAt: new Date().toISOString() } as Command);

  if (active && challenge) {
    const stepIndex = active.step === "UTKAST" ? 0 : active.step === "REGISTRERAD" ? 1 : active.step === "BEREDNING" ? 2 : 3;
    return <section className="case-workspace" aria-label="Ärendevy">
      <button className="back-link" onClick={() => setActiveId(undefined)}><ArrowLeft size={16}/> Till ärendeöversikten (filter bevaras)</button>
      <div className="case-detail-head"><div><p className="eyebrow">{active.caseNumber} · {stepLabels[active.step]}</p><h1>{active.title}</h1><p>{challenge.problemStatement || "Problemformulering saknas."}</p></div><span className="demo-role">Fiktiv roll: {state.entities.roleDefinitions[actor.roleDefinitionId].name}<small>Ingen autentisering eller mandatkontroll</small></span></div>
      <ol className="process-indicator">{process.map((label, index) => <li className={index < stepIndex ? "done" : index === stepIndex ? "current" : "upcoming"} key={label}>{index < stepIndex && <Check size={14}/>}<span>{label}</span>{index >= 4 && <small>Kommande</small>}</li>)}</ol>
      <div className="case-columns">
        <article className="card"><p className="eyebrow">SAMMANHÅLLET UNDERLAG</p><h2>Utmaning och businesscase</h2><p className="template-note">Demonstrationsmall v1 · konfigurerbar struktur · inte verifierad som PPS-komplett</p>
          <dl className="case-facts"><dt>Problem och nuläge</dt><dd>{challenge.problemStatement || "Saknas"}<br/>{challenge.currentState || "Nuläge saknas"}</dd><dt>Strategisk hantering</dt><dd>{challenge.strategicHandlingReason || "Motiv saknas"}</dd><dt>Syfte och önskat läge</dt><dd>{initiative ? `${initiative.purpose} ${initiative.desiredEndState}` : challenge.businessCase?.purpose || "Utvecklas under beredningen"}</dd><dt>Avgränsning</dt><dd>{initiative?.scope || challenge.businessCase?.scope || "Saknas"}</dd><dt>Alternativ / avstå</dt><dd>{challenge.businessCase?.alternatives || "Saknas"} {challenge.businessCase?.doNothingConsequence}</dd><dt>Evidens, antaganden och risk</dt><dd>{challenge.businessCase?.evidence || "Evidens saknas"} · {challenge.businessCase?.assumptions || "Antaganden saknas"} · {challenge.businessCase?.uncertainty || "Osäkerhet saknas"}</dd></dl>
          <p className="linked-note">Potential, förutsättningar och kostnader hämtas från länkade domänobjekt och kopieras inte hit.</p>
          {initiative && <button onClick={() => openPortfolio(initiative.id)}>Öppna potential, beroenden och kostnader <ChevronRight size={16}/></button>}
          <details className="trace"><summary>Fördjupad spårbarhet</summary><code>{challenge.id}</code>{initiative && <code>{initiative.id}</code>}</details>
        </article>
        <aside className="card"><p className="eyebrow">HINDER OCH NÄSTA STEG</p><h2>{active.nextAction}</h2><p><b>Hinder:</b> {active.obstacle}</p><p><b>Ansvarig:</b> {active.responsible}</p><p><b>Datum:</b> {active.dueDate ?? "Datum saknas"} {active.overdue && <strong className="overdue">Försenad</strong>}</p>
          {requirements.map((item) => <div className="requirement" key={item.id}><b>{item.missingItem}</b><span>Varför: {item.reasonRequired}</span><span>Blockerar: {item.blocks.join(", ")}</span><span>Status: {item.status}</span><span>Svar: {item.resolutionSummary || "Dokumenterat svar saknas"}</span></div>)}
          {initiative && <form onSubmit={(e) => { e.preventDefault(); const id=createId("CompletionRequirement", `ui-${Date.now()}`); send({ commandType:"CREATE_COMPLETION_REQUIREMENT", targetId:id, payload:{initiativeId:initiative.id, missingItem:requirement.missing, reasonRequired:requirement.reason, blocks:["QUALIFICATION"], responsibleRoleAssignmentId: requirement.responsible ? requirement.responsible as never : undefined, deadline: requirement.deadline || undefined}}); }}><h3>Lägg till kompletteringskrav</h3><input required aria-label="Vad saknas" placeholder="Vad saknas?" value={requirement.missing} onChange={e=>setRequirement({...requirement,missing:e.target.value})}/><input required aria-label="Varför behövs uppgiften" placeholder="Varför behövs uppgiften?" value={requirement.reason} onChange={e=>setRequirement({...requirement,reason:e.target.value})}/><select aria-label="Ansvarig för komplettering" value={requirement.responsible} onChange={e=>setRequirement({...requirement,responsible:e.target.value})}><option value="">Ansvarig saknas</option>{Object.values(state.entities.roleAssignments).map(a=><option key={a.id} value={a.id}>{state.entities.people[a.personId].displayName}</option>)}</select><input aria-label="Förfallodatum" type="date" value={requirement.deadline} onChange={e=>setRequirement({...requirement,deadline:e.target.value})}/><button>Spara krav</button></form>}
          {initiative && <button className="qualification-check" onClick={() => { const q=deriveQualificationStatus(state, initiative.id); alert(q.status === "QUALIFIED" ? "Underlaget är kvalificerat för prioriteringsdiskussion. Detta är inte ett startbeslut." : `Övergången stoppades: ${q.missingCriterionCodes.length} obligatoriska bedömningar och ${q.blockerIds.length} kompletteringskrav återstår.`); }}>Pröva övergång till prioritering</button>}
        </aside>
      </div>
    </section>;
  }

  return <section className="case-workspace" aria-label="Ärendeöversikt"><div className="overview-head"><div><p className="eyebrow">STRATEGISKA ÄRENDEN</p><h1>Vad behöver ledningens uppmärksamhet?</h1><p>Arbetslistan visar härledda processteg, faktiska hinder och vem som äger nästa handling. Den är inte en prioriteringsranking.</p></div><button onClick={()=>setShowNew(!showNew)}><Plus size={17}/> Registrera utmaning</button></div>
    {showNew && <form className="new-case" onSubmit={e=>{e.preventDefault(); const id=createId("Challenge",`user-${Date.now()}`); send({commandType:"CREATE_STRATEGIC_CHALLENGE",targetId:id,payload:{title:form.title,problemStatement:form.problem,currentState:form.currentState,source:"Registrerad i demosessionen",strategicRelevance:form.relevance,strategicHandlingReason:form.reason,nominationStatus:"DRAFT"}}); setShowNew(false);setActiveId(id);}}><h2>Nytt utkast</h2><p>Tomma uppgifter kan sparas. De måste kompletteras innan ärendet skickas till beredning.</p><label>Titel<input value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label><label>Problem<input value={form.problem} onChange={e=>setForm({...form,problem:e.target.value})}/></label><label>Nuläge<textarea value={form.currentState} onChange={e=>setForm({...form,currentState:e.target.value})}/></label><label>Varför strategisk hantering?<textarea value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})}/></label><label>Strategisk relevans<input value={form.relevance} onChange={e=>setForm({...form,relevance:e.target.value})}/></label><button>Spara utkast i demosessionen</button></form>}
    <div className="case-toolbar"><label><Search size={16}/><input aria-label="Sök ärenden" placeholder="Sök nummer, titel eller område" value={query} onChange={e=>setQuery(e.target.value)}/></label><select aria-label="Filtrera processteg" value={stepFilter} onChange={e=>setStepFilter(e.target.value)}><option value="ALL">Alla processteg</option>{Object.entries(stepLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select><span>Sorterad: äldsta ärende först · {filtered.length} av {items.length}</span></div>
    <div className="case-table" role="table"><div className="case-row case-header" role="row"><span>Ärende</span><span>Steg och hinder</span><span>Nästa åtgärd</span><span>Ansvar och datum</span></div>{filtered.map(item=><button className="case-row" role="row" key={item.challengeId} onClick={()=>setActiveId(item.challengeId)}><span><b>{item.caseNumber}</b><strong>{item.title}</strong><small>{item.area}</small></span><span><i>{stepLabels[item.step]}</i><small>{item.obstacle}</small></span><span><strong>{item.nextAction}</strong>{!item.comparable && <small>Kan inte jämföras: {item.comparisonReason}</small>}</span><span><b>{item.responsible}</b><small>{item.dueDate ?? "Datum saknas"} {item.overdue && <em>Försenad</em>}</small></span></button>)}</div>
    <p className="session-note">Ändringar finns bara i denna demosession. Ingen backend eller beständig lagring är ansluten.</p></section>;
}
