import { useMemo, useState } from "react";
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
  Sparkles,
} from "lucide-react";
import {
  demoReducer,
  initializeDemoState,
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

const initialState = initializeDemoState();
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

export default function App() {
  const [state, setState] = useState<DemoState>(initialState);
  const comparisons = useMemo(() => strategicComparison(state), [state]);
  const [selectedInitiativeId, setSelectedInitiativeId] =
    useState<InitiativeId>(stage3Ids.valueInitiative);
  const story = referenceStory(state, selectedInitiativeId);
  const [selectedNodeId, setSelectedNodeId] = useState<
    ExecutionNodeId | undefined
  >();
  const [feedback, setFeedback] = useState("");
  const activeProfile = Object.values(
    state.entities.steeringProfileVersions,
  ).find((item) => item.status === "ACTIVE")!;
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
  const selectedPotential = story?.effectPotentials[0];
  const [potentialExpected, setPotentialExpected] = useState(
    selectedPotential?.expectedValue ?? 0,
  );
  const [potentialAssumption, setPotentialAssumption] = useState(
    selectedPotential?.assumptions.join(" ") ?? "",
  );
  const [responsibleId, setResponsibleId] = useState<RoleAssignmentId>(
    specialistActor.id,
  );
  const [neededAt, setNeededAt] = useState("2026-11-30");

  const dispatch = (command: Command) => {
    const result = demoReducer(state, command);
    if (result.success) setState(result.nextState);
    setFeedback(commandError(result));
    return result;
  };
  const dispatchMany = (commands: Command[]) => {
    let next = state;
    for (const command of commands) {
      const result = demoReducer(next, command);
      if (!result.success) {
        setFeedback(commandError(result));
        return result;
      }
      next = result.nextState;
    }
    setState(next);
    setFeedback("Nytt versionsbundet jämförelseunderlag skapades.");
    return {
      success: true,
      nextState: next,
      affectedEntityIds: [],
    } satisfies CommandResult;
  };
  if (!story) return <main>Det valda syntetiska initiativet saknas.</main>;
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
    setPotentialExpected(potential?.expectedValue ?? 0);
    setPotentialAssumption(potential?.assumptions.join(" ") ?? "");
    setFeedback("");
  };

  return (
    <div className="product-shell">
      <header className="product-header">
        <a className="brand" href="#top">
          <span>
            <Sparkles size={18} />
          </span>
          <b>Transformation Cockpit</b>
        </a>
        <nav aria-label="Sidinnehåll">
          <a href="#comparison">Prioritering</a>
          <a href="#potential">Effektpotential</a>
          <a href="#conditions">Förutsättningar</a>
          <a href="#costs">Kostnader</a>
        </nav>
        <span className="demo-badge">Syntetisk demo</span>
      </header>
      <main id="top">
        <section className="hero">
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

        <section id="comparison" className="section-block">
          <div className="section-title">
            <div>
              <p className="eyebrow">STRATEGISK JÄMFÖRELSE</p>
              <h2>Prioriteringsunderlag för tre initiativ</h2>
            </div>
            <span className="nonbinding">{activeProfile.demoAssumption}</span>
          </div>
          <Help>
            Ledningen behöver se både kriteriernas bidrag och osäkerheten.
            Poängen stödjer prioriteringsdiskussionen men godkänner inte start.
          </Help>
          <div className="comparison-grid">
            {comparisons.map((item) => (
              <button
                className={`comparison-card ${item.initiative.id === selectedInitiativeId ? "selected" : ""}`}
                key={item.initiative.id}
                onClick={() => selectInitiative(item.initiative.id)}
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
          <div className="profile-panel">
            <div>
              <h3>
                {activeProfile.profileName} · version{" "}
                {activeProfile.versionNumber}
              </h3>
              <p>
                Ändra vikter för att skapa ett nytt scenario. Historiska
                underlag behåller sin profilversion.
              </p>
            </div>
            <div className="weight-grid">
              {activeProfile.criteria.map((criterion) => (
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
                      versionNumber: activeProfile.versionNumber + 1,
                      validFrom: issuedAt.slice(0, 10),
                      decidedByDecisionFunctionId:
                        activeProfile.decidedByDecisionFunctionId,
                      criteria: activeProfile.criteria.map((item) => ({
                        ...item,
                      })),
                      weights,
                      thresholds: { ...activeProfile.thresholds },
                      weightSumRule: 100,
                      demoAssumption: "Ej beslutad – används endast i demo.",
                    },
                  },
                  {
                    commandId: createId("Command", `activate-${token}`),
                    actorRoleAssignmentId: decisionActor.id,
                    issuedAt,
                    commandType: "ACTIVATE_STEERING_PROFILE_VERSION",
                    targetId: profileId,
                  },
                ];
                comparisons.forEach((item, index) =>
                  commands.push({
                    commandId: createId(
                      "Command",
                      `calculate-${token}-${index}`,
                    ),
                    actorRoleAssignmentId: decisionActor.id,
                    issuedAt,
                    commandType: "CALCULATE_PRIORITY_ASSESSMENT",
                    targetId: createId(
                      "PriorityAssessment",
                      `scenario-${token}-${index}`,
                    ),
                    payload: {
                      initiativeId: item.initiative.id,
                      steeringProfileVersionId: profileId,
                      scores: Object.fromEntries(
                        item.assessment.criterionAssessments.map(
                          (criterion) => [
                            criterion.criterionCode,
                            {
                              score: criterion.score,
                              evidenceRefs: criterion.evidenceRefs,
                              uncertainty: criterion.uncertainty,
                            },
                          ],
                        ),
                      ),
                    },
                  }),
                );
                dispatchMany(commands);
              }}
            >
              Skapa nytt prioriteringsscenario
            </button>
          </div>
          <div className="contributions">
            <h3>Bidrag för valt initiativ</h3>
            {comparisons
              .find((item) => item.initiative.id === selectedInitiativeId)
              ?.assessment.criterionAssessments.map((criterion) => (
                <div key={criterion.criterionCode}>
                  <span>
                    {
                      activeProfile.criteria.find(
                        (item) => item.code === criterion.criterionCode,
                      )?.name
                    }
                  </span>
                  <i style={{ width: `${criterion.contribution}%` }} />
                  <b>{criterion.contribution}</b>
                </div>
              ))}
          </div>
        </section>

        <section className="story-heading">
          <div>
            <p className="eyebrow">VALT SAMMANHÄNGANDE ÄRENDE</p>
            <h2>{story.initiative.title}</h2>
            <p>{story.challenge.problemStatement}</p>
          </div>
          <div className="identity-pair">
            <span>
              ChallengeId <code>{story.challenge.id}</code>
            </span>
            <ArrowRight />
            <span>
              InitiativeId <code>{story.initiative.id}</code>
            </span>
          </div>
        </section>

        <section id="potential" className="section-block">
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
            <form
              className="edit-panel"
              onSubmit={(event) => {
                event.preventDefault();
                const span =
                  selectedPotential.upperBound -
                  selectedPotential.expectedValue;
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
                    lowerBound: potentialExpected - span,
                    expectedValue: potentialExpected,
                    upperBound: potentialExpected + span,
                    assumptions: [potentialAssumption],
                    assessedByRoleAssignmentIds,
                    assessmentVersion: selectedPotential.assessmentVersion + 1,
                  },
                });
              }}
            >
              <h3>Skapa ny potentialbedömning</h3>
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
            </form>
          )}
        </section>

        <section id="conditions" className="section-block">
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
                        onClick={() => setSelectedNodeId(node.id)}
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
            <aside className="drawer">
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
                    aria-label="Kompletteringsansvarig"
                    value={responsibleId}
                    onChange={(event) =>
                      setResponsibleId(event.target.value as RoleAssignmentId)
                    }
                  >
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
                    aria-label="Deadline"
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

        <section id="costs" className="section-block">
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
        <section className="section-block roadmap">
          <p className="eyebrow">SENARE STEG</p>
          <h2>Inte implementerat i denna leverans</h2>
          <p>
            Lokala effektåtaganden, mandatprövad startgrind, låst
            beslutsbaslinje, ändringsstyrning, prognos, verifierad mätning och
            härlett kontrollrum.
          </p>
          <p>
            Rapportpresentationen kvarstår som leveranskrav;
            rapportöverensstämmelse har inte verifierats eftersom
            rapportunderlaget saknas här.
          </p>
        </section>
      </main>
      <footer>
        All data och alla namn är syntetiska · Ingen backend, autentisering,
        extern AI eller integration är ansluten
      </footer>
    </div>
  );
}
