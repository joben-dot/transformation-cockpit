import { StarlightHeader } from "./workspaces/StarlightHeader";
import { TemplatesHelp } from "./workspaces/TemplatesHelp";
import { MethodGuideNavigation } from "./workspaces/MethodGuideNavigation";
import "./workspaces/WorkspaceTools.css";
import "./workspaces/Usability.css";
import { PriorityCriteria } from "./workspaces/PriorityCriteria";
import { ProcessNavigation } from "./workspaces/ProcessNavigation";
import { StepGate } from "./workspaces/StepGate";
import type { ActionDestination } from "./application/selectors/controlRoomSelectors";
import { CopilotHelp } from "./workspaces/CopilotHelp";
import { SessionDrafts } from "./workspaces/SessionDrafts";
import { createPresentationDemoState } from "./demo-data/presentationDemoState";
import { useWorkspaceNavigation } from "./workspaces/useWorkspaceNavigation";
import { flowLocationLabels } from "./workspaces/flowLocationLabels";
import { LocationTrail } from "./workspaces/LocationTrail";
import { useMemo, useState, useRef, useLayoutEffect } from "react";
import {
  ArrowRight,
  Blocks,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Database,
  GitBranch,
  HelpCircle,
  ShieldCheck,
} from "lucide-react";
import {
  demoReducer,
  type Command,
  type CommandResult,
  type DemoState,
} from "./application";
import { referenceStory, strategicComparison } from "./application/selectors";
import {
  createId,
  effectPotentialLabel,
  type ExecutionNodeId,
  type InitiativeId,
  type RoleAssignmentId,
} from "./domain";
import { stage3Ids } from "./demo-data/stage3DemoData";
import type { FlowStepKey } from "./application/selectors/flowSelectors";
import { CaseWorkspace, type CaseNavigationContext } from "./workspaces/CaseWorkspace";
import { InitiativeDependencies } from "./workspaces/InitiativeDependencies";

import { PrerequisiteEditor } from "./workspaces/PrerequisiteEditor";
import { EffectWorkspace } from "./workspaces/EffectWorkspace";
import { ControlRoom } from "./workspaces/ControlRoom";
import { GovernanceWorkspace } from "./workspaces/GovernanceWorkspace";
import { validDate } from "./application/selectors/transformationSelectors";

const initialState = createPresentationDemoState();
const statusLabel = {
  AVAILABLE: "Tillgänglig",
  PLANNED: "Planerad",
  BLOCKED: "Blockerad",
  UNKNOWN: "Okänd",
} as const;
const recommendationLabel = {
  START: "Hög prioritet – fortsatt beredning",
  INVESTIGATE: "Fördjupa underlaget",
  WAIT: "Avvakta i portföljen",
  STOP: "Prioritera inte nu",
  NOT_ELIGIBLE: "Ofullständigt underlag",
} as const;

function Trace({ values }: { values: string[] }) {
  return (
    <details className="trace">
      <summary>Visa tekniska källidentiteter</summary>
      <div>
        {values.map((value) => (
          <code key={value}>{value}</code>
        ))}
      </div>
    </details>
  );
}
function Help({ children }: { children: React.ReactNode }) {
  return (
    <details className="inline-help">
      <summary>
        <HelpCircle size={14} /> Varför behövs detta?
      </summary>
      <p>{children}</p>
    </details>
  );
}
function commandError(result: CommandResult) {
  return result.success
    ? "Ändringen sparades i samma ärende."
    : result.errors.map((error) => error.description).join(" ");
}

export default function App({ demoState = initialState }: { demoState?: DemoState } = {}) {
  return <SessionDrafts><WorkspaceApp demoState={demoState}/></SessionDrafts>;
}

function WorkspaceApp({ demoState }: { demoState: DemoState }) {
  const [state, setState] = useState<DemoState>(demoState);
  const { route, set: setRoutePart, back, canGoBack } = useWorkspaceNavigation({
    workArea: "control", showPortfolio: false, portfolioSection: "comparison",
    selectedInitiativeId: stage3Ids.valueInitiative,
    caseContext: { query: "", stepFilter: "ALL", sort: "priority" },
    controlContext: {view:"overview",stage:"Alla",area:"Alla",from:"2026-01-01",to:Object.values(demoState.entities.effectCommitments).some(c=>c.details?.effectWindow.to==="2026-12-31")?"2026-12-31":"2030-12-31"},
  });
  const { workArea, showPortfolio, caseSection, effectSection, portfolioSection, selectedInitiativeId, caseContext } = route;
  const setWorkArea = (value: typeof workArea) => setRoutePart("workArea", value);
  const setShowPortfolio = (value: boolean) => setRoutePart("showPortfolio", value);
  const setCaseSection = (value: typeof caseSection) => setRoutePart("caseSection", value);
  const setEffectSection = (value: typeof effectSection) => setRoutePart("effectSection", value);
  const setPortfolioSection = (value: string) => setRoutePart("portfolioSection", value);
  const setSelectedInitiativeId = (value: InitiativeId) => setRoutePart("selectedInitiativeId", value);
  const setCaseContext = (value: CaseNavigationContext) => setRoutePart("caseContext", value);
  const [day,setDay]=useState("2026-09-06");
  const [dayInput,setDayInput]=useState("2026-09-06");
  const dayInputRef=useRef<HTMLInputElement>(null);
  const stateRef=useRef(state);
  stateRef.current=state;
  useLayoutEffect(()=>{if(typeof window!=="undefined")window.scrollTo(0,0);},[workArea,showPortfolio,portfolioSection]);
  const activeProfile = Object.values(
    state.entities.steeringProfileVersions,
  ).find((item) => item.status === "ACTIVE")!;
  const [comparisonProfileId, setComparisonProfileId] = useState(
    activeProfile.id,
  );
  const comparisonProfile =
    state.entities.steeringProfileVersions[comparisonProfileId] ??
    activeProfile;
  const comparisons = useMemo(
    () => strategicComparison(state, comparisonProfileId),
    [state, comparisonProfileId],
  );
  const availableComparisons = useMemo(() => strategicComparison(state, activeProfile.id), [state, activeProfile.id]);
  const [comparisonSelection, setComparisonSelection] = useState<InitiativeId[]>(
    () => strategicComparison(demoState, activeProfile.id).map((item) => item.initiative.id),
  );
  const displayedComparisons = comparisons.filter((item) => comparisonSelection.includes(item.initiative.id));
  const story = referenceStory(state, selectedInitiativeId);
  const [selectedNodeId, setSelectedNodeId] = useState<
    ExecutionNodeId | undefined
  >();
  const prerequisiteDrawerRef = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    if (showPortfolio && portfolioSection === "conditions" && selectedNodeId) {
      prerequisiteDrawerRef.current?.scrollIntoView?.({ block: "start" });
    }
  }, [showPortfolio, portfolioSection, selectedNodeId]);
  const [feedback, setFeedback] = useState("");
  const guideNavigationRef=useRef<HTMLElement>(null);
  const [guideFocusRequest,setGuideFocusRequest]=useState(0);
  const [weights, setWeights] = useState<Record<string, number>>({
    ...activeProfile.weights,
  });
  const decisionActor = Object.values(state.entities.roleAssignments).find(
    (assignment) =>
      state.entities.roleDefinitions[assignment.roleDefinitionId]?.roleKind ===
      "DECISION_MAKER",
  )!;
  const specialistActor = Object.values(state.entities.roleAssignments).find(
    (assignment) =>
      state.entities.roleDefinitions[assignment.roleDefinitionId]?.roleKind ===
      "SPECIALIST",
  )!;
  const [selectedPotentialSeriesId, setSelectedPotentialSeriesId] = useState(
    story?.effectPotentials[0]?.seriesId,
  );
  const selectedPotential =
    story?.effectPotentials.find(
      (item) => item.seriesId === selectedPotentialSeriesId,
    ) ?? story?.effectPotentials[0];
  const [potentialLower, setPotentialLower] = useState(
    selectedPotential?.lowerBound ?? 0,
  );
  const [potentialExpected, setPotentialExpected] = useState(
    selectedPotential?.expectedValue ?? 0,
  );
  const [potentialUpper, setPotentialUpper] = useState(
    selectedPotential?.upperBound ?? 0,
  );
  const [potentialAssumption, setPotentialAssumption] = useState(
    selectedPotential?.assumptions.join(" ") ?? "",
  );
  const [responsibleId, setResponsibleId] = useState<RoleAssignmentId|"">(
    specialistActor.id,
  );
  const [neededAt, setNeededAt] = useState("2026-11-30");

  const dispatch = (command: Command) => {
    const dated={...command,issuedAt:`${day}T${new Date().toISOString().slice(11)}`};
    const result = demoReducer(stateRef.current, dated);
    if (result.success) {stateRef.current=result.nextState;setState(result.nextState);}
    setFeedback(commandError(result));
    return result;
  };
  const dispatchMany = (commands: Command[]) => {
    let next = stateRef.current;
    for (const command of commands) {
      const result = demoReducer(next, {...command,issuedAt:`${day}T${new Date().toISOString().slice(11)}`});
      if (!result.success) {
        setFeedback(commandError(result));
        return result;
      }
      next = result.nextState;
    }
    stateRef.current=next;
    setState(next);
    setFeedback("Nytt versionsbundet jämförelseunderlag skapades.");
    return {
      success: true,
      nextState: next,
      affectedEntityIds: [],
    } satisfies CommandResult;
  };
  if (!story) return <main>Det valda initiativet saknas.</main>;
  const selectedNode = selectedNodeId
    ? state.entities.executionNodes[selectedNodeId]
    : undefined;
  const nodeRelations = selectedNode
    ? story.dependencies.filter(
        (edge) =>
          edge.predecessorNodeId === selectedNode.id ||
          edge.successorNodeId === selectedNode.id,
      )
    : [];
  const roleLabel = (id?: RoleAssignmentId) => {
    if (!id) return "Ansvarig saknas";
    const assignment = state.entities.roleAssignments[id];
    return `${state.entities.people[assignment.personId].displayName} · ${state.entities.roleDefinitions[assignment.roleDefinitionId].name}`;
  };
  const selectInitiative = (id: InitiativeId) => {
    setSelectedInitiativeId(id);
    setSelectedNodeId(undefined);
    const nextStory = referenceStory(state, id);
    const potential = nextStory?.effectPotentials[0];
    setSelectedPotentialSeriesId(potential?.seriesId);
    setPotentialLower(potential?.lowerBound ?? 0);
    setPotentialExpected(potential?.expectedValue ?? 0);
    setPotentialUpper(potential?.upperBound ?? 0);
    setPotentialAssumption(potential?.assumptions.join(" ") ?? "");
    setFeedback("");
  };

  const openPortfolio = (id: InitiativeId, nodeId?: ExecutionNodeId) => {
    selectInitiative(id);
    setWorkArea("cases");setShowPortfolio(true);setPortfolioSection("conditions");
    setRoutePart("prerequisiteFocus", undefined);
    if (nodeId) {
      const node = state.entities.executionNodes[nodeId];
      setSelectedNodeId(nodeId);
      setResponsibleId(node.responsibleRoleAssignmentId ?? "");
      setNeededAt(node.neededAt ?? "");
    }
  };
  const openEffects=(id:InitiativeId,section?:FlowStepKey)=>{selectInitiative(id);setEffectSection(section);setWorkArea("effects");};
  const openCase=(id:InitiativeId,section?:FlowStepKey)=>{setCaseSection(section);setCaseContext({...caseContext,focusRequirementId:undefined,activeId:state.entities.initiatives[id].challengeId});setWorkArea("cases");setShowPortfolio(false);};
  const openControlAction=(target:ActionDestination)=>{
    if(target.section==="conditions"&&target.initiativeId){
      selectInitiative(target.initiativeId);setWorkArea("cases");setShowPortfolio(true);setPortfolioSection("conditions");
      setRoutePart("prerequisiteFocus",target.focus??(target.nodeId?"availability":undefined));
      if(target.nodeId){setSelectedNodeId(target.nodeId);const node=state.entities.executionNodes[target.nodeId];setResponsibleId(node.responsibleRoleAssignmentId??"");setNeededAt(node.neededAt??"");}
    } else if(target.initiativeId&&["commitments","decision","measurement"].includes(target.section))openEffects(target.initiativeId,target.section);
    else {setCaseContext({...caseContext,activeId:target.challengeId,focusRequirementId:target.requirementId});setCaseSection(target.section);setWorkArea("cases");setShowPortfolio(false);}
  };
  const currentChallenge = workArea === "cases" && !showPortfolio
    ? (caseContext.activeId ? state.entities.challenges[caseContext.activeId] : undefined)
    : (workArea === "effects" || (workArea === "cases" && showPortfolio && portfolioSection !== "comparison"))
      ? state.entities.challenges[story.initiative.challengeId] : undefined;
  const currentSection = workArea === "effects" ? effectSection : workArea === "cases" && !showPortfolio ? caseSection : undefined;
  const locationLabel = currentSection ? flowLocationLabels[currentSection]
    : currentChallenge ? (showPortfolio ? ({potential:"Effektpotential",conditions:"Förutsättningar",costs:"Kostnader"} as Record<string,string>)[portfolioSection] : "Ärendets flöde")
    : ({cases: showPortfolio ? "Prioritering" : "Ärendeöversikt", effects:"Effekt och beslut", control:({effects:"Kontrollrum · Effektuppföljning",plan:"Kontrollrum · Tid och beroenden",simulation:"Kontrollrum · Simulera"} as Record<string,string>)[route.controlContext.view]??"Kontrollrum · Överblick", governance:"Metod och styrning", templates:"Mallar och hjälp"})[workArea];
  const currentFlowStep=currentSection??(currentChallenge&&showPortfolio?(portfolioSection==="potential"?"potential":"conditions"):undefined);
  const showCaseList=()=>{setCaseSection(undefined);setCaseContext({...caseContext,activeId:undefined});setWorkArea("cases");setShowPortfolio(false);};
  const showCaseFlow=()=>{if(!currentChallenge)return;setCaseSection(undefined);setCaseContext({...caseContext,activeId:currentChallenge.id});setWorkArea("cases");setShowPortfolio(false);};
  const openFlowStep=(key:FlowStepKey)=>{if(!currentChallenge)return;const id=currentChallenge.relatedInitiativeIds[0];if(!id||["material","businesscase","qualification","potential","priority"].includes(key)){setCaseContext({...caseContext,activeId:currentChallenge.id});setCaseSection(key);setWorkArea("cases");setShowPortfolio(false);}else if(key==="conditions"){selectInitiative(id);setWorkArea("cases");setShowPortfolio(true);setPortfolioSection("conditions");}else openEffects(id,key);};
  const demoSettings = <details className="demo-settings"><summary>Demoinställningar</summary><div className="demo-clock"><label>Demodatum <input ref={dayInputRef} type="date" value={dayInput} min={state.audit.map(a=>a.issuedAt.slice(0,10)).sort().at(-1)??"2026-09-06"} onChange={e=>setDayInput(e.target.value)}/></label><button onClick={()=>{const value=dayInputRef.current?.value??dayInput;const last=state.audit.map(a=>a.issuedAt.slice(0,10)).sort().at(-1)??"2026-09-06";if(validDate(value)&&value>=last){setDay(value);setDayInput(value);}else setDayInput(day);}}>Tillämpa demodatum</button><strong>Aktivt demodatum: {day}</strong><span>Flytta tiden framåt för att demonstrera planerade mätningar. Ingen verklig mätdata.</span><button className="text-button" onClick={()=>{if(window.confirm("Återställ alla egna demoändringar?")){stateRef.current=createPresentationDemoState();setState(stateRef.current);setDay("2026-09-06");setDayInput("2026-09-06");setFeedback("");setCaseContext({query:"",stepFilter:"ALL"});setWorkArea("cases");setShowPortfolio(false);}}}>Återställ demo</button></div></details>;
  const navigation = <><div className="workspace-tools"><div className="return-bar" role="navigation" aria-label="Tillbaka och ärendeflöde">
    {canGoBack&&<button className="workspace-back" onClick={back}>← Tillbaka</button>}
    <nav className="return-location" aria-label="Hela sökvägen"><ol>{workArea!=="control"&&<li><button className="text-button" onClick={()=>setWorkArea("control")}>Kontrollrum</button></li>}{currentChallenge?<><li><span aria-hidden="true">›</span><button className="text-button" onClick={showCaseList}>Ärenden</button></li><li><span aria-hidden="true">›</span>{currentFlowStep?<button className="text-button" onClick={showCaseFlow}>{currentChallenge.title}</button>:<strong aria-current="page">{currentChallenge.title} · flödet</strong>}</li>{currentFlowStep&&<li><span aria-hidden="true">›</span><strong aria-current="page">{locationLabel}</strong></li>}</>:<li>{workArea!=="control"&&<span aria-hidden="true">›</span>}<strong aria-current="page">{workArea==="control"?"Kontrollrum":locationLabel}</strong></li>}</ol></nav>
    {currentChallenge && <button className="text-button" onClick={showCaseFlow}>Visa hela ärendeflödet</button>}
  </div><CopilotHelp compact key={`${locationLabel}-${currentChallenge?.id??""}`} section={locationLabel} context={currentChallenge?.title}/>{demoSettings}<span className="workspace-asof">Lägesdatum: {day} · demo</span></div>{currentChallenge&&currentFlowStep&&<ProcessNavigation state={state} challengeId={currentChallenge.id} day={day} current={currentFlowStep} onOpen={openFlowStep}/>}</>;
  const openGuideStage=(id:string)=>{setRoutePart("templateStage",id);setWorkArea("templates");setGuideFocusRequest(value=>value+1);};
  const showGuideProcess=()=>{guideNavigationRef.current?.scrollIntoView?.({block:"start"});guideNavigationRef.current?.focus?.({preventScroll:true});};
  const header=<><header className="product-header"><StarlightHeader/><div className="header-method-guide"><details className="global-method" open={!currentChallenge&&!showPortfolio}><summary>Processguide · 10 steg, instruktioner och mallar</summary><MethodGuideNavigation stageId={workArea==="templates"?(route.templateStage??"challenge"):undefined} onStageChange={openGuideStage} openCases={showCaseList} navigationRef={guideNavigationRef} detailId={workArea==="templates"?"guide-stage-detail":undefined}/></details></div><nav aria-label="Arbetsytor"><button className="nav-button" aria-current={workArea==="control"?"page":undefined} onClick={()=>setWorkArea("control")}>Kontrollrum</button><button className="nav-button" aria-current={workArea==="cases"&&!showPortfolio?"page":undefined} onClick={()=>{setCaseSection(undefined);setCaseContext({...caseContext,activeId:undefined});setWorkArea("cases");setShowPortfolio(false);}}>Ärenden</button><button className="nav-button" aria-current={workArea==="cases"&&showPortfolio?"page":undefined} onClick={()=>{setWorkArea("cases");setShowPortfolio(true);setPortfolioSection("comparison");}}>Prioritering</button><button className="nav-button" aria-current={workArea==="effects"?"page":undefined} onClick={()=>{if(workArea==="cases"&&!showPortfolio&&caseContext.activeId){const linked=state.entities.challenges[caseContext.activeId]?.relatedInitiativeIds[0];if(!linked){setCaseSection("material");setFeedback("Det här ärendet behöver först ett beredningsinitiativ. Fortsätt med samma underlag nedan.");return;}selectInitiative(linked);}setEffectSection(undefined);setWorkArea("effects");}}>Effekt och beslut</button><button className="nav-button" aria-current={workArea==="templates"?"page":undefined} onClick={()=>setWorkArea("templates")}>Mallar och hjälp</button></nav></header></>;
  const footer=<footer>Prioritering är inte startbeslut · Exempeldata och exempelnamn är fiktiva · Processändringar gäller denna session · Mallar och dokument sparas lokalt · Ingen backend, verklig autentisering, extern AI eller integration är ansluten</footer>;
  if(workArea!=="cases")return <div className="product-shell">{header}<main id="top" onInvalidCapture={event=>{let parent=(event.target as HTMLElement).parentElement;while(parent&&parent!==event.currentTarget){if(parent instanceof HTMLDetailsElement)parent.open=true;parent=parent.parentElement;}}}>{navigation}{workArea==="governance"&&<LocationTrail items={[{label:"Metod och styrning"}]}/>} {workArea==="effects"?<EffectWorkspace key={selectedInitiativeId} initialSection={effectSection} onSectionChange={setEffectSection} onInitiativeChange={selectInitiative} state={state} dispatch={dispatch} day={day} initialId={selectedInitiativeId} openCases={()=>{setCaseSection(undefined);setCaseContext({...caseContext,activeId:undefined});setWorkArea("cases");setShowPortfolio(false);}} openCase={openCase} openPortfolio={openPortfolio}/>:workArea==="control"?<><ControlRoom openAction={openControlAction} dispatch={dispatch} context={route.controlContext} setContext={next=>setRoutePart("controlContext",next)} state={state} day={day} open={(id,section)=>{if(section==="conditions"){selectInitiative(id);setWorkArea("cases");setShowPortfolio(true);setPortfolioSection("conditions");}else if(section&&["material","businesscase","qualification","potential","priority"].includes(section))openCase(id,section);else openEffects(id,section);}} openCases={()=>{setCaseSection(undefined);setCaseContext({...caseContext,activeId:undefined});setWorkArea("cases");setShowPortfolio(false);}}/></>:workArea==="templates"?<TemplatesHelp stageId={route.templateStage} onStageChange={id=>setRoutePart("templateStage",id)} openCases={showCaseList} onShowProcess={showGuideProcess} focusRequest={guideFocusRequest} openGovernance={()=>setWorkArea("governance")}/>:<GovernanceWorkspace openTemplates={()=>setWorkArea("templates")} state={state} dispatch={dispatch} day={day}/>}</main>{footer}</div>;
  if (!showPortfolio) return (
    <div className="product-shell">{header}
      <main id="top" onInvalidCapture={event=>{let parent=(event.target as HTMLElement).parentElement;while(parent&&parent!==event.currentTarget){if(parent instanceof HTMLDetailsElement)parent.open=true;parent=parent.parentElement;}}}>{navigation}<CaseWorkspace key={caseContext.activeId??"overview"} initialSection={caseSection} onSectionChange={setCaseSection} openEffects={openEffects} state={state} dispatch={dispatch} day={day} context={caseContext} setContext={next=>{if(next.activeId!==caseContext.activeId)setCaseSection(undefined);setCaseContext(next);}} feedback={feedback} openPortfolio={openPortfolio}/></main>{footer}
    </div>
  );

  return (
    <div className="product-shell">
      {header}
      <main id="top" onInvalidCapture={event=>{let parent=(event.target as HTMLElement).parentElement;while(parent&&parent!==event.currentTarget){if(parent instanceof HTMLDetailsElement)parent.open=true;parent=parent.parentElement;}}}>{navigation}
        <LocationTrail items={[{label:"Prioritering",onClick:portfolioSection!=="comparison"?()=>setPortfolioSection("comparison"):undefined},...(portfolioSection!=="comparison"?[{label:story.initiative.title,onClick:()=>openCase(selectedInitiativeId)},{label:({potential:"Effektpotential",conditions:"Förutsättningar",costs:"Kostnader"} as Record<string,string>)[portfolioSection]}]:[{label:"Jämförelse"}])]}/>
        {portfolioSection!=="comparison"&&<StepGate dispatch={dispatch} state={state} challengeId={story.initiative.challengeId} day={day} stepKey={portfolioSection==="potential"?"potential":"conditions"} onOpen={openFlowStep}/>}
        <section hidden={portfolioSection!=="comparison"} className="hero">
          <div>
            <p className="eyebrow">STRATEGISKT PORTFÖLJSTÖD</p>
            <h1>Prioritera möjlig effekt – förstå hela möjliggörandet</h1>
            <p className="lead">
              Samma ärende binder samman potential, prioriteringsgrund,
              beroenden, kompletteringsansvar och kostnader.
            </p>
          </div>
          <aside className="principle-card">
            <ShieldCheck />
            <div>
              <b>Prioritering är inte startbeslut</b>
              <p>
                Potentialen är inte ett effektåtagande och teknisk
                färdigställandegrad är inte realiserad effekt.
              </p>
            </div>
          </aside>
        </section>

        <nav className="portfolio-tabs" aria-label="Prioriteringens delar">{[["comparison","Jämförelse"],["potential","Effektpotential"],["conditions","Förutsättningar"],["costs","Kostnader"]].map(([key,label])=><button key={key} aria-pressed={portfolioSection===key} onClick={()=>setPortfolioSection(key)}>{label}</button>)}<button onClick={()=>openCase(selectedInitiativeId)}>Till ärendets flöde</button></nav>
        <section hidden={portfolioSection!=="comparison"} id="comparison" className="section-block">
          <PriorityCriteria profile={comparisonProfile}/>
          <div className="section-title">
            <div>
              <p className="eyebrow">STRATEGISK JÄMFÖRELSE</p>
              <h2>Prioriteringsunderlag · {displayedComparisons.length} valda initiativ</h2>
            </div>
            <span className="nonbinding">
              {comparisonProfile.demoAssumption}
            </span>
          </div>
          <Help>
            Ledningen behöver se både kriteriernas bidrag och osäkerheten.
            Poängen stödjer prioriteringsdiskussionen men godkänner inte start.
          </Help>
          <details className="point-detail"><summary>Ändra urvalet för jämförelsen</summary><fieldset className="comparison-selection"><legend>Välj kvalificerade initiativ att jämföra</legend>{availableComparisons.map((item) => <label key={item.initiative.id}><input type="checkbox" checked={comparisonSelection.includes(item.initiative.id)} onChange={(event) => setComparisonSelection(event.target.checked ? [...comparisonSelection, item.initiative.id] : comparisonSelection.filter((id) => id !== item.initiative.id))}/>{item.initiative.title}</label>)}</fieldset></details>
          <div className="comparison-grid">
            {displayedComparisons.map((item) => (
              <button
                className={`comparison-card ${item.initiative.id === selectedInitiativeId ? "selected" : ""}`}
                key={item.initiative.id}
                onClick={() => { selectInitiative(item.initiative.id); setPortfolioSection("potential"); }}
              >
                <span>{item.assessment.totalScore} / 100</span>
                <h3>{item.initiative.title}</h3>
                <p>
                  {recommendationLabel[item.assessment.systemRecommendation]}
                </p>
                <small>
                  Profil v{item.profile.versionNumber} ·{" "}
                  {item.assessment.assessedAt.slice(0, 10)}
                </small>
                {item.needsReassessment && (
                  <strong className="stale-badge">
                    Nyare potential finns – ombedömning behövs
                  </strong>
                )}
                <small>
                  {item.potentials.length
                    ? `${item.potentials.length} effektpotentialer`
                    : "Obligatorisk potential saknas"}{" "}
                  · {item.blockers.length} blockerade noder
                </small>
                {item.potentials[0] && (
                  <small>
                    {item.potentials[0].expectedValue.toLocaleString("sv-SE")}{" "}
                    {item.potentials[0].unit} ·{" "}
                    {item.potentials[0].realizationWindow} · osäkerhet{" "}
                    {item.potentials[0].uncertainty}
                  </small>
                )}
              </button>
            ))}
          </div>
          <div className="scenario-switcher">
            <span>
              Gällande styrprofil: {activeProfile.profileName} v
              {activeProfile.versionNumber}
            </span>
            {comparisonProfile.id !== activeProfile.id && (
              <button
                onClick={() => {
                  setComparisonProfileId(activeProfile.id);
                  setWeights({ ...activeProfile.weights });
                }}
              >
                Visa grundprofilens jämförelse
              </button>
            )}
          </div>
          <details className="point-detail"><summary>Granska kriterier eller pröva andra vikter</summary><div className="profile-panel">
            <div>
              <h3>
                {comparisonProfile.profileName} · version{" "}
                {comparisonProfile.versionNumber}
              </h3>
              <p>
                Ändra vikter för att skapa ett nytt scenario. Historiska
                underlag behåller sin profilversion.
              </p>
            </div>
            <div className="weight-grid">
              {comparisonProfile.criteria.map((criterion) => (
                <label key={criterion.code}>
                  {criterion.name}
                  <input
                    aria-label={`Vikt ${criterion.name}`}
                    type="number"
                    value={weights[criterion.code] ?? 0}
                    onChange={(event) =>
                      setWeights({
                        ...weights,
                        [criterion.code]: Number(event.target.value),
                      })
                    }
                  />
                  <small>%</small>
                </label>
              ))}
            </div>
            <button
              onClick={() => {
                const token = Date.now();
                const profileId = createId(
                  "SteeringProfileVersion",
                  `scenario-${token}`,
                );
                const issuedAt = new Date().toISOString();
                const commands: Command[] = [
                  {
                    commandId: createId("Command", `profile-${token}`),
                    actorRoleAssignmentId: decisionActor.id,
                    issuedAt,
                    commandType: "CREATE_STEERING_PROFILE_VERSION",
                    targetId: profileId,
                    payload: {
                      profileName: "Strategiskt scenario",
                      versionNumber:
                        Math.max(
                          ...Object.values(
                            state.entities.steeringProfileVersions,
                          ).map((profile) => profile.versionNumber),
                        ) + 1,
                      validFrom: issuedAt.slice(0, 10),
                      decidedByDecisionFunctionId:
                        comparisonProfile.decidedByDecisionFunctionId,
                      criteria: comparisonProfile.criteria.map((item) => ({
                        ...item,
                      })),
                      weights,
                      thresholds: { ...comparisonProfile.thresholds },
                      weightSumRule: 100,
                      demoAssumption: "Ej beslutad – används endast i demo.",
                    },
                  },
                ];
                availableComparisons.filter((item) => comparisonSelection.includes(item.initiative.id)).forEach((item, index) =>
                  commands.push({
                    commandId: createId(
                      "Command",
                      `calculate-${token}-${index}`,
                    ),
                    actorRoleAssignmentId: decisionActor.id,
                    issuedAt,
                    commandType: "REWEIGHT_PRIORITY_ASSESSMENT",
                    targetId: createId(
                      "PriorityAssessment",
                      `scenario-${token}-${index}`,
                    ),
                    payload: {
                      sourcePriorityAssessmentId: item.assessment.id,
                      steeringProfileVersionId: profileId,
                    },
                  }),
                );
                const result = dispatchMany(commands);
                if (result.success) setComparisonProfileId(profileId);
              }}
            >
              Skapa nytt prioriteringsscenario
            </button>
          </div>
          </details><details className="point-detail"><summary>Visa poängens bidrag per kriterium</summary><div className="contributions">
            <h3>Bidrag för valt initiativ</h3>
            {displayedComparisons
              .find((item) => item.initiative.id === selectedInitiativeId)
              ?.assessment.criterionAssessments.map((criterion) => (
                <div key={criterion.criterionCode}>
                  <span>
                    {
                      comparisonProfile.criteria.find(
                        (item) => item.code === criterion.criterionCode,
                      )?.name
                    }
                  </span>
                  <i style={{ width: `${criterion.contribution}%` }} />
                  <b>{criterion.contribution}</b>
                  <small>
                    {
                      comparisonProfile.criteria.find(
                        (item) => item.code === criterion.criterionCode,
                      )?.description
                    }
                  </small>
                </div>
              ))}
          </div></details>
        </section>

        <section hidden={portfolioSection==="comparison"} className="story-heading">
          <div>
            <p className="eyebrow">VALT SAMMANHÄNGANDE ÄRENDE</p>
            <h2>{story.initiative.title}</h2>
            <p>{story.challenge.problemStatement}</p>
          </div>
          <details className="trace"><summary>Spårbarhet</summary><div className="identity-pair">
            <span>
              ChallengeId <code>{story.challenge.id}</code>
            </span>
            <ArrowRight />
            <span>
              InitiativeId <code>{story.initiative.id}</code>
            </span>
          </div></details>
        </section>

        {portfolioSection!=="comparison"&&<InitiativeDependencies state={state} id={selectedInitiativeId} day={day} onOpen={nodeId=>openPortfolio(selectedInitiativeId,nodeId)}/>}

        <section hidden={portfolioSection!=="potential"} id="potential" className="section-block">
          <div className="section-title">
            <div>
              <p className="eyebrow">VAD INITIATIVET KAN GE</p>
              <h2>Åtskilda effektpotentialer</h2>
            </div>
            <span className="nonbinding">{effectPotentialLabel}</span>
          </div>
          <Help>
            Potentialen behövs för jämförelse. Pengar, frigjord tid och kvalitet
            hålls isär; ett senare lokalt åtagande kräver egna beslut och
            baseline.
          </Help>
          <div className="potential-grid">
            {story.effectPotentials.map((potential) => (
              <article className="card potential-card" key={potential.id}>
                <span className="category">{potential.category}</span>
                <h3>{potential.effectMeasureCode}</h3>
                <div className="range">
                  <small>Låg</small>
                  <b>{potential.lowerBound}</b>
                  <small>Förväntad</small>
                  <b>{potential.expectedValue}</b>
                  <small>Hög</small>
                  <b>{potential.upperBound}</b>
                  <em>{potential.unit}</em>
                </div>
                <p>
                  <Clock3 size={15} /> {potential.realizationWindow}
                </p>
                <p>
                  Osäkerhet: <b>{potential.uncertainty}</b>
                </p>
                <p className="muted">
                  Mottagare:{" "}
                  {potential.recipientBusinessId
                    ? state.entities.businesses[potential.recipientBusinessId]
                        ?.name
                    : potential.recipientScenario}
                </p>
                <p className="muted">
                  Antaganden: {potential.assumptions.join(" ")}
                </p>
                <p className="muted">
                  Tidigast {potential.earliestPossibleEffectDate} · full
                  potential {potential.fullPotentialDate}
                </p>
                <Trace values={[potential.id, ...potential.evidenceRefs]} />
              </article>
            ))}
          </div>
          {selectedPotential && (
            <details className="point-detail"><summary>Komplettera eller ombedöm potentialen</summary><form
              className="edit-panel"
              onSubmit={(event) => {
                event.preventDefault();
                const token = Date.now();
                const {
                  id: _previousId,
                  assessedAt: _previousAssessmentDate,
                  assessedByRoleAssignmentIds,
                  ...potentialBasis
                } = selectedPotential;
                void _previousId;
                void _previousAssessmentDate;
                dispatch({
                  commandId: createId("Command", `potential-${token}`),
                  actorRoleAssignmentId: specialistActor.id,
                  issuedAt: new Date().toISOString(),
                  commandType: "RECORD_EFFECT_POTENTIAL",
                  targetId: createId("EffectPotential", `revision-${token}`),
                  payload: {
                    ...potentialBasis,
                    initiativeId: selectedInitiativeId,
                    lowerBound: potentialLower,
                    expectedValue: potentialExpected,
                    upperBound: potentialUpper,
                    assumptions: [potentialAssumption],
                    assessedByRoleAssignmentIds,
                    assessmentVersion: selectedPotential.assessmentVersion + 1,
                  },
                });
              }}
            >
              <h3>Skapa ny potentialbedömning</h3>
              <label>
                Potential att redigera
                <select
                  aria-label="Potential att redigera"
                  value={selectedPotential.seriesId}
                  onChange={(event) => {
                    const potential = story.effectPotentials.find(
                      (item) => item.seriesId === event.target.value,
                    )!;
                    setSelectedPotentialSeriesId(potential.seriesId);
                    setPotentialLower(potential.lowerBound);
                    setPotentialExpected(potential.expectedValue);
                    setPotentialUpper(potential.upperBound);
                    setPotentialAssumption(potential.assumptions.join(" "));
                  }}
                >
                  {story.effectPotentials.map((potential) => (
                    <option key={potential.seriesId} value={potential.seriesId}>
                      {potential.category} · {potential.effectMeasureCode} ·{" "}
                      {potential.unit}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Lågt värde
                <input
                  aria-label="Nytt lågt potentialvärde"
                  type="number"
                  value={potentialLower}
                  onChange={(event) =>
                    setPotentialLower(Number(event.target.value))
                  }
                />
              </label>
              <label>
                Förväntat värde
                <input
                  aria-label="Nytt förväntat potentialvärde"
                  type="number"
                  value={potentialExpected}
                  onChange={(event) =>
                    setPotentialExpected(Number(event.target.value))
                  }
                />
              </label>
              <label>
                Högt värde
                <input
                  aria-label="Nytt högt potentialvärde"
                  type="number"
                  value={potentialUpper}
                  onChange={(event) =>
                    setPotentialUpper(Number(event.target.value))
                  }
                />
              </label>
              <label>
                Synligt antagande
                <input
                  aria-label="Nytt potentialantagande"
                  value={potentialAssumption}
                  onChange={(event) =>
                    setPotentialAssumption(event.target.value)
                  }
                />
              </label>
              <button>Spara ny version</button>
            </form></details>
          )}
        </section>

        <section hidden={portfolioSection!=="conditions"} id="conditions" className="section-block">
          <div className="section-title">
            <div>
              <p className="eyebrow">VARFÖR HÖG PRIORITET KAN BEHÖVA VÄNTA</p>
              <h2>Faktiska beroenden och ansvar</h2>
            </div>
            <span className="sequence-note">
              <GitBranch /> Härledd ordning, inte startgodkännande
            </span>
          </div>
          <Help>
            En blockerande relation visar exakt vilken leverans som behövs före
            nästa nod. Ägarskapet flyttas inte när en gemensam förutsättning
            återanvänds.
          </Help>
          <div className="enabler-strip">
            <Database />
            <div>
              <b>Gemensamt möjliggörande initiativ</b>
              {story.enablingInitiatives.map((item) => (
                <span key={item.id}>
                  {item.title} · <code>{item.id}</code>
                </span>
              ))}
            </div>
          </div>
          <div className="execution-levels">
            {story.executionLevels.map((level, index) => (
              <div className="execution-level" key={index}>
                <span className="level-number">{index + 1}</span>
                <div>
                  {level.map((nodeId) => {
                    const node = state.entities.executionNodes[nodeId];
                    return (
                      <button
                        className={`node node-${node.availabilityStatus.toLowerCase()}`}
                        key={node.id}
                        onClick={() => {setSelectedNodeId(node.id);setResponsibleId(node.responsibleRoleAssignmentId??"");setNeededAt(node.neededAt??"");}}
                      >
                        <span>
                          {node.availabilityStatus === "AVAILABLE" ? (
                            <CheckCircle2 />
                          ) : node.availabilityStatus === "BLOCKED" ? (
                            <CircleDashed />
                          ) : (
                            <Blocks />
                          )}
                          {statusLabel[node.availabilityStatus]}
                        </span>
                        <h3>{node.title}</h3>
                        <small>Behövs {node.neededAt}</small>
                        <code>{node.id}</code>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          {selectedNode && (
            <aside className="drawer" ref={prerequisiteDrawerRef}>
              <button
                className="drawer-close"
                onClick={() => setSelectedNodeId(undefined)}
              >
                Stäng
              </button>
              <p className="eyebrow">FÖRDJUPAD FÖRUTSÄTTNING</p>
              <h2>{selectedNode.title}</h2>
              <p>{selectedNode.description}</p>
              <dl>
                <dt>Tillhör</dt>
                <dd>
                  {selectedNode.ownerInitiativeId
                    ? state.entities.initiatives[selectedNode.ownerInitiativeId]
                        ?.title
                    : state.entities.capabilities[selectedNode.capabilityId!]
                        ?.name}
                </dd>
                <dt>Ansvarig</dt>
                <dd>{roleLabel(selectedNode.responsibleRoleAssignmentId)}</dd>
                <dt>Behövs</dt>
                <dd>{selectedNode.neededAt}</dd>
                <dt>Status</dt>
                <dd>{statusLabel[selectedNode.availabilityStatus]}</dd>
                <dt>Tillgänglighetsunderlag</dt>
                <dd>
                  {selectedNode.availabilityEvidenceRefs.join(", ") || "Saknas"}
                </dd>
              </dl>
              <h3>Faktiska relationer</h3>
              {nodeRelations.map((edge) => (
                <p key={edge.id}>
                  <b>
                    {
                      state.entities.executionNodes[edge.predecessorNodeId]
                        .title
                    }
                  </b>{" "}
                  →{" "}
                  <b>
                    {state.entities.executionNodes[edge.successorNodeId].title}
                  </b>
                  <br />
                  {edge.requiredDeliverable} Därför: {edge.rationale}
                </p>
              ))}
              <form
                className="edit-panel"
                onSubmit={(event) => {
                  event.preventDefault();
                  if(!responsibleId||!neededAt){setFeedback("Välj ansvarig och datum.");return;}
                  dispatch({
                    commandId: createId(
                      "Command",
                      `responsibility-${Date.now()}`,
                    ),
                    actorRoleAssignmentId: specialistActor.id,
                    issuedAt: new Date().toISOString(),
                    commandType: "UPDATE_EXECUTION_NODE",
                    targetId: selectedNode.id,
                    payload: {
                      responsibleRoleAssignmentId: responsibleId,
                      neededAt,
                    },
                  });
                }}
              >
                <label>
                  Kompletteringsansvarig
                  <select
                    required aria-label="Kompletteringsansvarig"
                    value={responsibleId}
                    onChange={(event) =>
                      setResponsibleId(event.target.value as RoleAssignmentId)
                    }
                  >
                    <option value="">Välj ansvarig person och roll</option>
                    {Object.values(state.entities.roleAssignments).map(
                      (assignment) => (
                        <option key={assignment.id} value={assignment.id}>
                          {roleLabel(assignment.id)}
                        </option>
                      ),
                    )}
                  </select>
                </label>
                <label>
                  Deadline / behovsdatum
                  <input
                    required aria-label="Deadline"
                    type="date"
                    value={neededAt}
                    onChange={(event) => setNeededAt(event.target.value)}
                  />
                </label>
                <button>Spara ansvar och datum</button>
              </form>
              <Trace
                values={[
                  selectedNode.id,
                  ...nodeRelations.map((edge) => edge.id),
                ]}
              />
            </aside>
          )}
          {!state.entities.executionNodes[
            stage3Ids.sharedNode
          ].contextInitiativeIds.includes(selectedInitiativeId) && (
            <button
              className="secondary-action"
              onClick={() => {
                const node =
                  state.entities.executionNodes[stage3Ids.sharedNode];
                dispatch({
                  commandId: createId("Command", `reuse-${Date.now()}`),
                  actorRoleAssignmentId: specialistActor.id,
                  issuedAt: new Date().toISOString(),
                  commandType: "UPDATE_EXECUTION_NODE",
                  targetId: node.id,
                  payload: {
                    contextInitiativeIds: [
                      ...node.contextInitiativeIds,
                      selectedInitiativeId,
                    ],
                  },
                });
              }}
            >
              Koppla befintlig gemensam datamiljö
            </button>
          )}
        </section>

        {portfolioSection==="conditions"&&<PrerequisiteEditor key={`${selectedInitiativeId}-${route.prerequisiteFocus??""}-${selectedNodeId??""}`} state={state} dispatch={dispatch} day={day} id={selectedInitiativeId} focus={route.prerequisiteFocus} initialNodeId={selectedNodeId}/>}
        <section hidden={portfolioSection!=="costs"} id="costs" className="section-block">
          <div className="section-title">
            <div>
              <p className="eyebrow">HELA MÖJLIGGÖRANDET</p>
              <h2>Spårbar kostnadsbild</h2>
            </div>
          </div>
          <Help>
            Kostnaden visar gemensam teknik, lokalt dataarbete och
            verksamhetsförändring. Samma kostnadspost räknas en gång även när
            förutsättningen återanvänds.
          </Help>
          <div className="cost-grid">
            <article>
              <small>Engångskostnader</small>
              <b>
                {story.costBreakdown.oneTimeAmount.toLocaleString("sv-SE")} SEK
              </b>
              <p>
                Gemensam investering, anslutning, dataarbete och utbildning.
              </p>
            </article>
            <article>
              <small>Återkommande drift</small>
              <b>
                {story.costBreakdown.recurringAnnualAmount.toLocaleString(
                  "sv-SE",
                )}{" "}
                SEK/år
              </b>
              <p>
                Oprojicerat årsbelopp. Treårstotal visas inte utan komplett
                kalenderårshorisont.
              </p>
            </article>
            <article>
              <small>Ekonomisk potential</small>
              <b>
                {story.effectPotentials
                  .find((item) => item.category === "MONEY")
                  ?.expectedValue.toLocaleString("sv-SE") ?? "Saknas"}{" "}
                SEK/år
              </b>
              <p>Jämförbar årstakt, men inte beslutad besparing.</p>
            </article>
          </div>
          <div className="cost-details">
            {story.costEntries.map((entry) => (
              <p key={entry.id}>
                <b>{entry.category}</b>
                <span>
                  {entry.amount.toLocaleString("sv-SE")} {entry.currency} ·{" "}
                  {entry.recurrence === "ONE_TIME" ? "engång" : "per år"}
                </span>
              </p>
            ))}
          </div>
          <p className="muted">
            Kostnadsfördelning är en separat fördelning av samma kostnad och
            skapar ingen ny kostnad.
          </p>
          <Trace values={story.costBreakdown.sourceRefs} />
        </section>
        <p role="status" className="feedback">
          {feedback}
        </p>
        {portfolioSection!=="comparison"&&<StepGate footer state={state} challengeId={story.initiative.challengeId} day={day} stepKey={portfolioSection==="potential"?"potential":"conditions"} onOpen={openFlowStep}/>}
      </main>
      <footer>
        All data och alla namn är syntetiska · Ingen backend, autentisering,
        extern AI eller integration är ansluten
      </footer>
    </div>
  );
}
