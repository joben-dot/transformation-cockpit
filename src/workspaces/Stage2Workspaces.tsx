import { useEffect, useState } from "react";
import { HelpCircle } from "lucide-react";
import {
  effectPotentialLabel,
  type CompletionRequirement,
  type InitiativeId,
  createId,
  type RoleAssignmentId,
  type QualificationAssessmentStatus,
  type BusinessId,
} from "../domain";
import type { Command, CommandResult, DemoState } from "../application";
import {
  activeSteeringProfile,
  completionRequirementsByInitiative,
  deriveNextCriticalStep,
  deriveQualificationAreaStatuses,
  deriveQualificationStatus,
  effectPotentialsByInitiative,
  priorityAssessmentByInitiative,
  qualificationAreaLabels,
  qualificationAreasByInitiative,
  selectActiveChallenge,
  selectActiveInitiative,
} from "../application/selectors";
import { stage2Help } from "./stage2Help";

const Help = ({ term }: { term: keyof typeof stage2Help }) => (
  <details className="stage2-help">
    <summary>
      <HelpCircle size={14} />
      {term}
    </summary>
    <p>{stage2Help[term]}</p>
  </details>
);
const SourceRefs = ({ ids }: { ids: string[] }) => (
  <small className="stage2-refs">Källor: {ids.join(", ") || "saknas"}</small>
);
const Stage2Identity = ({ state }: { state: DemoState }) => (
  <p className="stage2-identity">
    ChallengeId: {state.viewContext.activeChallengeId ?? "Saknas"} ·
    InitiativeId: {state.viewContext.activeInitiativeId ?? "Saknas"}
  </p>
);

export function StrategicChallengeWorkspace({ state }: { state: DemoState }) {
  const challenge = selectActiveChallenge(state);
  const initiative = selectActiveInitiative(state);
  if (!challenge)
    return (
      <section className="panel">
        <h2>Ingen aktiv strategisk utmaning</h2>
      </section>
    );
  const next = initiative
    ? deriveNextCriticalStep(state, initiative.id)
    : { label: "Skapa initiativ från utmaningen", sourceRefs: [challenge.id] };
  return (
    <section className="stage2-workspace">
      <Stage2Identity state={state} />
      <Help term="strategisk utmaning" />
      <span className="eyebrow">STRATEGISK ÄRENDEKONTEXT</span>
      <h2>{challenge.title}</h2>
      <p>{challenge.problemStatement}</p>
      <dl>
        <dt>Nuläge</dt>
        <dd>{challenge.currentState}</dd>
        <dt>Strategisk relevans</dt>
        <dd>{challenge.strategicRelevance}</dd>
        <dt>Initiativtagare</dt>
        <dd>{challenge.initiatorRoleAssignmentId}</dd>
        <dt>Relaterat initiativ</dt>
        <dd>{initiative?.id ?? "Saknas"}</dd>
        <dt>Processposition</dt>
        <dd>
          {initiative
            ? deriveQualificationStatus(state, initiative.id).status
            : "NOMINERAD"}
        </dd>
        <dt>Nästa avgörande steg</dt>
        <dd>{next.label}</dd>
      </dl>
      <SourceRefs
        ids={[
          challenge.id,
          ...challenge.relatedInitiativeIds,
          ...next.sourceRefs,
        ]}
      />
    </section>
  );
}
export function QualificationWorkspace({
  state,
  initiativeId,
  onCommand,
}: {
  state: DemoState;
  initiativeId: InitiativeId;
  onCommand?: (command: Command) => CommandResult;
  onCommands?: (commands: Command[]) => CommandResult;
}) {
  const configuration = Object.values(
    state.entities.qualificationConfigurations,
  ).find((item) => item.status === "ACTIVE");
  const criteria = configuration?.criteria ?? [];
  const assessments = Object.values(
    state.entities.qualificationAssessments,
  ).filter((item) => item.initiativeId === initiativeId);
  const roles = Object.values(state.entities.roleAssignments);
  const roleLabel = (id: RoleAssignmentId) => {
    const assignment = state.entities.roleAssignments[id];
    const person = state.entities.people[assignment.personId];
    const role = state.entities.roleDefinitions[assignment.roleDefinitionId];
    return `${person.displayName} – ${role.name}`;
  };
  const specialists = roles.filter(
    (assignment) =>
      state.entities.roleDefinitions[assignment.roleDefinitionId]?.roleKind ===
      "SPECIALIST",
  );
  const [criterionCode, setCriterionCode] = useState(
    criteria[0]?.criterionCode ?? "",
  );
  const criterion = criteria.find(
    (item) => item.criterionCode === criterionCode,
  );
  const existing = assessments.find(
    (item) => item.criterionCode === criterionCode,
  );
  const [status, setStatus] =
    useState<QualificationAssessmentStatus>("INCOMPLETE");
  const [summary, setSummary] = useState("");
  const [evidence, setEvidence] = useState("");
  const [assumption, setAssumption] = useState("");
  const [assessorId, setAssessorId] = useState<RoleAssignmentId>(roles[0]?.id);
  const [verifierId, setVerifierId] = useState<RoleAssignmentId>(
    specialists[0]?.id,
  );
  const [feedback, setFeedback] = useState("");
  const [missingItem, setMissingItem] = useState("");
  const [reasonRequired, setReasonRequired] = useState("");
  const [deadline, setDeadline] = useState("2027-03-31");
  const [responsibleId, setResponsibleId] = useState<RoleAssignmentId>(
    roles[0]?.id,
  );
  const requirements = completionRequirementsByInitiative(state, initiativeId);
  const areaStatuses = deriveQualificationAreaStatuses(state, initiativeId);
  const activeRequirement = requirements.find(
    (item) => !["VERIFIED", "NOT_APPLICABLE"].includes(item.status),
  );

  useEffect(() => {
    setStatus(existing?.status ?? "INCOMPLETE");
    setSummary(existing?.summary ?? "");
    setEvidence(existing?.evidenceRefs.join(", ") ?? "");
    setAssumption(existing?.assumptions.join(", ") ?? "");
    if (existing) setAssessorId(existing.assessedByRoleAssignmentId);
  }, [criterionCode, existing]);

  const run = (
    command: Command,
    successMessage = "Ändringen sparades i det gemensamma ärendet.",
  ) => {
    const result = onCommand?.(command);
    setFeedback(
      result?.success
        ? successMessage
        : result && !result.success
          ? result.errors.map((error) => error.description).join(" ")
          : "",
    );
  };
  const now = () => new Date().toISOString();
  return (
    <section className="stage2-workspace">
      <Stage2Identity state={state} />
      <Help term="kvalificering" />
      <Help term="kompletteringsansvarig" />
      <Help term="verifierare" />
      <Help term="deadline" />
      <h2>Sex kvalificeringsområden</h2>
      {onCommand && configuration && criterion && (
        <section className="stage2-editor" aria-label="Bearbeta kvalificering">
          <h3>Bedöm en punkt i taget</h3>
          <label>
            Kriterium
            <select
              aria-label="Kriterium"
              value={criterionCode}
              onChange={(e) => setCriterionCode(e.target.value)}
            >
              {criteria.map((item) => (
                <option key={item.criterionCode} value={item.criterionCode}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <p>
            <b>{criterion.name}</b> – {criterion.helpText}
          </p>
          <label>
            Bedömning
            <select
              aria-label="Bedömning"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as QualificationAssessmentStatus)
              }
            >
              {[
                "NOT_ASSESSED",
                "INCOMPLETE",
                "SATISFIED",
                "NOT_SATISFIED",
                "NOT_APPLICABLE",
              ].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </label>
          <label>
            Sammanfattning
            <input
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
            />
          </label>
          <label>
            Evidensreferenser, kommaseparerade
            <input
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
            />
          </label>
          <label>
            Antaganden, kommaseparerade
            <input
              value={assumption}
              onChange={(e) => setAssumption(e.target.value)}
            />
          </label>
          <label>
            Bedömare
            <select
              aria-label="Bedömare"
              value={assessorId}
              onChange={(e) =>
                setAssessorId(e.target.value as RoleAssignmentId)
              }
            >
              {roles.map((item) => (
                <option key={item.id} value={item.id}>
                  {roleLabel(item.id)}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={() =>
              run(
                {
                  commandId: createId("Command", `qualification-${Date.now()}`),
                  actorRoleAssignmentId: assessorId,
                  issuedAt: now(),
                  commandType: "UPSERT_QUALIFICATION_ASSESSMENT",
                  targetId:
                    existing?.id ??
                    createId(
                      "QualificationAssessment",
                      `ui-${initiativeId}-${criterion.criterionCode}`.replace(
                        /[^a-z0-9-]/gi,
                        "-",
                      ),
                    ),
                  payload: {
                    initiativeId,
                    qualificationArea: criterion.qualificationArea,
                    criterionCode: criterion.criterionCode,
                    summary,
                    status,
                    mandatory: criterion.mandatory,
                    requiresVerification: criterion.requiresVerification,
                    evidenceRefs: evidence
                      .split(",")
                      .map((x) => x.trim())
                      .filter(Boolean),
                    assumptions: assumption
                      .split(",")
                      .map((x) => x.trim())
                      .filter(Boolean),
                    notApplicableRationale:
                      status === "NOT_APPLICABLE" ? summary : undefined,
                    assessedAgainstConfigurationVersion: configuration.id,
                  },
                },
                "Bedömningen sparades utan automatisk verifiering.",
              )
            }
          >
            Spara vald bedömning
          </button>
          {criterion.requiresVerification && existing && (
            <>
              <label>
                Specialistverifierare
                <select
                  aria-label="Specialistverifierare"
                  value={verifierId}
                  onChange={(e) =>
                    setVerifierId(e.target.value as RoleAssignmentId)
                  }
                >
                  {specialists.map((item) => (
                    <option key={item.id} value={item.id}>
                      {roleLabel(item.id)}
                    </option>
                  ))}
                </select>
              </label>
              <button
                onClick={() =>
                  run(
                    {
                      commandId: createId(
                        "Command",
                        `verify-assessment-${Date.now()}`,
                      ),
                      actorRoleAssignmentId: verifierId,
                      issuedAt: now(),
                      commandType: "VERIFY_QUALIFICATION_ASSESSMENT",
                      targetId: existing.id,
                    },
                    "Specialistverifieringen registrerades.",
                  )
                }
              >
                Verifiera vald bedömning
              </button>
            </>
          )}
          <p role="status">{feedback}</p>
        </section>
      )}
      {onCommand && criterion && (
        <section className="stage2-editor" aria-label="Hantera komplettering">
          <h3>Kompletteringsansvar</h3>
          {!activeRequirement ? (
            <>
              <label>
                Vad saknas?
                <input
                  value={missingItem}
                  onChange={(e) => setMissingItem(e.target.value)}
                />
              </label>
              <label>
                Varför behövs det?
                <input
                  value={reasonRequired}
                  onChange={(e) => setReasonRequired(e.target.value)}
                />
              </label>
              <button
                disabled={
                  !existing || !missingItem.trim() || !reasonRequired.trim()
                }
                onClick={() =>
                  run({
                    commandId: createId("Command", `completion-${Date.now()}`),
                    actorRoleAssignmentId: assessorId,
                    issuedAt: now(),
                    commandType: "CREATE_COMPLETION_REQUIREMENT",
                    targetId: createId(
                      "CompletionRequirement",
                      `completion-${Date.now()}`,
                    ),
                    payload: {
                      initiativeId,
                      qualificationAssessmentId: existing?.id,
                      missingItem,
                      reasonRequired,
                      blocks: ["QUALIFICATION"],
                    },
                  })
                }
              >
                Skapa kriteriespecifikt kompletteringskrav
              </button>
            </>
          ) : (
            <>
              <label>
                Ansvarig
                <select
                  aria-label="Kompletteringsansvarig"
                  value={responsibleId}
                  onChange={(e) =>
                    setResponsibleId(e.target.value as RoleAssignmentId)
                  }
                >
                  {roles.map((item) => (
                    <option key={item.id} value={item.id}>
                      {roleLabel(item.id)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Verifierare
                <select
                  aria-label="Kompletteringsverifierare"
                  value={verifierId}
                  onChange={(e) =>
                    setVerifierId(e.target.value as RoleAssignmentId)
                  }
                >
                  {specialists.map((item) => (
                    <option key={item.id} value={item.id}>
                      {roleLabel(item.id)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Deadline
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </label>
              <button
                onClick={() =>
                  run({
                    commandId: createId("Command", `assign-${Date.now()}`),
                    actorRoleAssignmentId: assessorId,
                    issuedAt: now(),
                    commandType: "ASSIGN_COMPLETION_RESPONSIBILITY",
                    targetId: activeRequirement.id,
                    payload: {
                      responsibleRoleAssignmentId: responsibleId,
                      verifierRoleAssignmentId: verifierId,
                      deadline,
                    },
                  })
                }
              >
                Spara vald ansvarig, deadline och verifierare
              </button>
              <button
                onClick={() =>
                  run({
                    commandId: createId("Command", `submit-${Date.now()}`),
                    actorRoleAssignmentId: responsibleId,
                    issuedAt: now(),
                    commandType: "SUBMIT_COMPLETION_REQUIREMENT",
                    targetId: activeRequirement.id,
                    payload: {
                      submittedEvidenceRefs: evidence
                        .split(",")
                        .filter(Boolean),
                      resolutionSummary: summary,
                    },
                  })
                }
              >
                Lämna in komplettering
              </button>
              <button
                onClick={() =>
                  run({
                    commandId: createId("Command", `verify-${Date.now()}`),
                    actorRoleAssignmentId: verifierId,
                    issuedAt: now(),
                    commandType: "VERIFY_COMPLETION_REQUIREMENT",
                    targetId: activeRequirement.id,
                    payload: { resolutionSummary: summary },
                  })
                }
              >
                Verifiera komplettering
              </button>
            </>
          )}
        </section>
      )}
      <div className="stage2-areas">
        {qualificationAreasByInitiative(state, initiativeId).map((group) => {
          const area = areaStatuses.find((item) => item.area === group.area);
          return (
            <details className="stage2-area" key={group.area}>
              <summary>
                <span>{qualificationAreaLabels[group.area]}</span>
                <strong>
                  {area?.satisfiedMandatoryCount} / {area?.totalMandatoryCount}{" "}
                  · {area?.status}
                </strong>
              </summary>
              <p>
                Återstår: {area?.remainingCriterionCodes.join(", ") || "Inga"}
              </p>
              <p>
                Kräver verifiering:{" "}
                {area?.verificationCriterionCodes.join(", ") || "Inga"}
              </p>
              {criteria
                .filter((item) => item.qualificationArea === group.area)
                .map((item) => {
                  const value = assessments.find(
                    (a) => a.criterionCode === item.criterionCode,
                  );
                  return (
                    <div key={item.criterionCode}>
                      <b>{item.name}</b>
                      <p>
                        {value?.summary || "Ej bedömd"} ·{" "}
                        {value?.status || "NOT_ASSESSED"}
                      </p>
                      <small>
                        Verifiering:{" "}
                        {value?.verifiedByRoleAssignmentId ?? "Ej verifierad"}
                      </small>
                    </div>
                  );
                })}
              {requirements
                .filter(
                  (item) =>
                    item.qualificationAssessmentId &&
                    group.assessments.some(
                      (a) => a.id === item.qualificationAssessmentId,
                    ),
                )
                .map((item) => (
                  <CompletionCard key={item.id} item={item} />
                ))}
              <SourceRefs ids={group.sourceRefs} />
            </details>
          );
        })}
      </div>
      {requirements
        .filter((item) => !item.qualificationAssessmentId)
        .map((item) => (
          <CompletionCard key={item.id} item={item} />
        ))}
    </section>
  );
}
function CompletionCard({ item }: { item: CompletionRequirement }) {
  return (
    <div className="stage2-blocker">
      <b>{item.missingItem}</b>
      <span>
        Kopplad bedömning: {item.qualificationAssessmentId ?? "Saknas"}
      </span>
      <span>Varför: {item.reasonRequired}</span>
      <span>Blockerar: {item.blocks.join(", ")}</span>
      <span>Ansvarig: {item.responsibleRoleAssignmentId ?? "Saknas"}</span>
      <span>Deadline: {item.deadline ?? "Saknas"}</span>
      <span>Verifierare: {item.verifierRoleAssignmentId ?? "Saknas"}</span>
      <span>Status: {item.status}</span>
      <span>
        Nästa steg:{" "}
        {item.status === "SUBMITTED"
          ? "Behörig verifiering"
          : "Tilldela ansvar och deadline"}
      </span>
    </div>
  );
}
export function EffectPotentialWorkspace({
  state,
  initiativeId,
  onCommand,
}: {
  state: DemoState;
  initiativeId: InitiativeId;
  onCommand?: (command: Command) => CommandResult;
}) {
  const roles = Object.values(state.entities.roleAssignments);
  const businesses = Object.values(state.entities.businesses);
  const [recipientKind, setRecipientKind] = useState<"BUSINESS" | "SCENARIO">(
    "BUSINESS",
  );
  const [businessId, setBusinessId] = useState<BusinessId>(businesses[0]?.id);
  const [scenario, setScenario] = useState("");
  const [category, setCategory] = useState<
    "MONEY" | "RELEASED_TIME" | "QUALITY" | "OTHER_BUSINESS_EFFECT"
  >("QUALITY");
  const [measure, setMeasure] = useState("");
  const [unit, setUnit] = useState("");
  const [lower, setLower] = useState(0);
  const [expected, setExpected] = useState(0);
  const [upper, setUpper] = useState(0);
  const [evidence, setEvidence] = useState("");
  const [assumption, setAssumption] = useState("");
  const [uncertainty, setUncertainty] = useState<"LOW" | "MEDIUM" | "HIGH">(
    "MEDIUM",
  );
  const [window, setWindow] = useState("");
  const [earliest, setEarliest] = useState("");
  const [full, setFull] = useState("");
  const [assessorIds, setAssessorIds] = useState<RoleAssignmentId[]>(
    roles[0] ? [roles[0].id] : [],
  );
  const [feedback, setFeedback] = useState("");
  const roleLabel = (id: RoleAssignmentId) => {
    const a = state.entities.roleAssignments[id];
    return `${state.entities.people[a.personId].displayName} – ${state.entities.roleDefinitions[a.roleDefinitionId].name}`;
  };
  const toggleAssessor = (id: RoleAssignmentId) =>
    setAssessorIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  return (
    <section className="stage2-workspace">
      <Stage2Identity state={state} />
      <Help term="bedömd effektpotential" />
      <Help term="evidens" />
      <Help term="antagande" />
      <Help term="osäkerhet" />
      <h2>Effektpotential</h2>
      <div className="qualification-success">{effectPotentialLabel}</div>
      {onCommand && (
        <section
          className="stage2-editor"
          aria-label="Registrera effektpotential"
        >
          <p>
            Alla startvärden är synliga och sparas först när du aktivt väljer
            Registrera.
          </p>
          <label>
            Mottagartyp
            <select
              value={recipientKind}
              onChange={(e) =>
                setRecipientKind(e.target.value as "BUSINESS" | "SCENARIO")
              }
            >
              <option value="BUSINESS">Verksamhet</option>
              <option value="SCENARIO">Scenario</option>
            </select>
          </label>
          {recipientKind === "BUSINESS" ? (
            <label>
              Mottagande verksamhet
              <select
                aria-label="Mottagande verksamhet"
                value={businessId}
                onChange={(e) => setBusinessId(e.target.value as BusinessId)}
              >
                {businesses.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label>
              Mottagarscenario
              <input
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
              />
            </label>
          )}
          <label>
            Effektkategori
            <select
              aria-label="Effektkategori"
              value={category}
              onChange={(e) => setCategory(e.target.value as typeof category)}
            >
              <option>MONEY</option>
              <option>RELEASED_TIME</option>
              <option>QUALITY</option>
              <option>OTHER_BUSINESS_EFFECT</option>
            </select>
          </label>
          <label>
            Mätetal
            <input
              value={measure}
              onChange={(e) => setMeasure(e.target.value)}
            />
          </label>
          <label>
            Enhet
            <input value={unit} onChange={(e) => setUnit(e.target.value)} />
          </label>
          <label>
            Låg potential
            <input
              type="number"
              value={lower}
              onChange={(e) => setLower(Number(e.target.value))}
            />
          </label>
          <label>
            Förväntad potential
            <input
              type="number"
              value={expected}
              onChange={(e) => setExpected(Number(e.target.value))}
            />
          </label>
          <label>
            Hög potential
            <input
              type="number"
              value={upper}
              onChange={(e) => setUpper(Number(e.target.value))}
            />
          </label>
          <label>
            Evidens
            <input
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
            />
          </label>
          <label>
            Antagande
            <input
              value={assumption}
              onChange={(e) => setAssumption(e.target.value)}
            />
          </label>
          <label>
            Osäkerhet
            <select
              value={uncertainty}
              onChange={(e) =>
                setUncertainty(e.target.value as typeof uncertainty)
              }
            >
              <option>LOW</option>
              <option>MEDIUM</option>
              <option>HIGH</option>
            </select>
          </label>
          <label>
            Effekthemtagningsfönster
            <input value={window} onChange={(e) => setWindow(e.target.value)} />
          </label>
          <label>
            Tidigaste möjliga effekt
            <input
              type="date"
              value={earliest}
              onChange={(e) => setEarliest(e.target.value)}
            />
          </label>
          <label>
            Full potential
            <input
              type="date"
              value={full}
              onChange={(e) => setFull(e.target.value)}
            />
          </label>
          <fieldset>
            <legend>Medverkande bedömare</legend>
            {roles.map((item) => (
              <label key={item.id}>
                <input
                  type="checkbox"
                  checked={assessorIds.includes(item.id)}
                  onChange={() => toggleAssessor(item.id)}
                />
                {roleLabel(item.id)}
              </label>
            ))}
          </fieldset>
          <button
            onClick={() => {
              const result = onCommand({
                commandId: createId("Command", `potential-${Date.now()}`),
                actorRoleAssignmentId: assessorIds[0],
                issuedAt: new Date().toISOString(),
                commandType: "RECORD_EFFECT_POTENTIAL",
                targetId: createId(
                  "EffectPotential",
                  `potential-${Date.now()}`,
                ),
                payload: {
                  initiativeId,
                  recipientBusinessId:
                    recipientKind === "BUSINESS" ? businessId : undefined,
                  recipientScenario:
                    recipientKind === "SCENARIO" ? scenario : undefined,
                  category,
                  seriesId: `SERIES-${initiativeId}-${category}-${measure}`,
                  effectMeasureCode: measure,
                  unit,
                  lowerBound: lower,
                  expectedValue: expected,
                  upperBound: upper,
                  evidenceRefs: evidence
                    .split(",")
                    .map((x) => x.trim())
                    .filter(Boolean),
                  assumptions: assumption
                    .split(",")
                    .map((x) => x.trim())
                    .filter(Boolean),
                  uncertainty,
                  realizationWindow: window,
                  earliestPossibleEffectDate: earliest,
                  fullPotentialDate: full,
                  scope:
                    recipientKind === "BUSINESS"
                      ? "LOCAL"
                      : "FEDERATED_SCENARIO",
                  assessedByRoleAssignmentIds: assessorIds,
                  assessmentVersion:
                    effectPotentialsByInitiative(state, initiativeId).length +
                    1,
                },
              });
              setFeedback(
                result.success
                  ? "Potentialen registrerades med angivna förutsättningar."
                  : result.errors.map((error) => error.description).join(" "),
              );
            }}
          >
            Registrera bedömd potential
          </button>
          <p role="status">{feedback}</p>
        </section>
      )}
      {effectPotentialsByInitiative(state, initiativeId).map((item) => (
        <article className="stage2-potential" key={item.id}>
          <h3>
            {item.category} ·{" "}
            {item.recipientBusinessId
              ? state.entities.businesses[item.recipientBusinessId]?.name
              : item.recipientScenario}
          </h3>
          <b>
            {item.effectMeasureCode}: {item.lowerBound} / {item.expectedValue} /{" "}
            {item.upperBound} {item.unit}
          </b>
          <p>
            {item.realizationWindow} · {item.uncertainty} osäkerhet
          </p>
          <p>
            Tidigast {item.earliestPossibleEffectDate} · full potential{" "}
            {item.fullPotentialDate}
          </p>
          <p>
            Bedömd {item.assessedAt} · version {item.assessmentVersion}
          </p>
          <p>
            Ansvariga bedömare:{" "}
            {item.assessedByRoleAssignmentIds.map(roleLabel).join(", ")}
          </p>
          <p>Evidens: {item.evidenceRefs.join(", ")}</p>
          <p>Antaganden: {item.assumptions.join(", ")}</p>
          <SourceRefs ids={[item.id, ...item.evidenceRefs]} />
        </article>
      ))}
    </section>
  );
}
export function PriorityWorkspace({
  state,
  initiativeId,
  onHumanAction,
}: {
  state: DemoState;
  initiativeId: InitiativeId;
  onHumanAction?: (command: Command) => CommandResult;
}) {
  const [rationale, setRationale] = useState("");
  const [feedback, setFeedback] = useState("");
  const profile = activeSteeringProfile(state);
  const assessment = priorityAssessmentByInitiative(state, initiativeId).at(-1);
  const reviewerAssignment = Object.values(state.entities.roleAssignments).find(
    (assignment) =>
      state.entities.roleDefinitions[assignment.roleDefinitionId]?.roleKind ===
      "DECISION_MAKER",
  );
  const reviewer = reviewerAssignment
    ? state.entities.people[reviewerAssignment.personId]
    : undefined;
  const [criterionScores, setCriterionScores] = useState<
    Record<string, number>
  >(() =>
    Object.fromEntries(
      (profile?.criteria ?? []).map((criterion) => [criterion.code, 80]),
    ),
  );
  const [priorityEvidence, setPriorityEvidence] = useState(
    "SYNTHETIC-PRIORITY-EVIDENCE",
  );
  return (
    <section className="stage2-workspace">
      <Stage2Identity state={state} />
      <Help term="styrprofil" />
      <Help term="prioriteringspoäng" />
      <Help term="mänskligt ställningstagande" />
      <Help term="prioritering och genomförandeordning" />
      <h2>Transparent prioriteringsunderlag</h2>
      <p>
        {profile?.profileName} · version {profile?.versionNumber} ·{" "}
        {profile?.demoAssumption}
      </p>
      {onHumanAction && profile && (
        <section className="stage2-editor" aria-label="Beräkna prioritering">
          {profile.criteria.map((criterion) => (
            <label key={criterion.code}>
              {criterion.name}, poäng 0–100
              <input
                type="number"
                min="0"
                max="100"
                value={criterionScores[criterion.code] ?? 0}
                onChange={(event) =>
                  setCriterionScores({
                    ...criterionScores,
                    [criterion.code]: Number(event.target.value),
                  })
                }
              />
            </label>
          ))}
          <label>
            Prioriteringsevidens
            <input
              value={priorityEvidence}
              onChange={(event) => setPriorityEvidence(event.target.value)}
            />
          </label>
          <button
            onClick={() => {
              const scores = Object.fromEntries(
                profile.criteria.map((criterion) => [
                  criterion.code,
                  {
                    score: criterionScores[criterion.code] ?? 0,
                    evidenceRefs: [priorityEvidence],
                    uncertainty: "MEDIUM" as const,
                  },
                ]),
              );
              const result = onHumanAction({
                commandId: createId("Command", `priority-${Date.now()}`),
                actorRoleAssignmentId: reviewerAssignment!.id,
                issuedAt: new Date().toISOString(),
                commandType: "CALCULATE_PRIORITY_ASSESSMENT",
                targetId: createId(
                  "PriorityAssessment",
                  `priority-${Date.now()}`,
                ),
                payload: {
                  initiativeId,
                  steeringProfileVersionId: profile.id,
                  scores,
                },
              });
              setFeedback(
                result.success
                  ? "Nytt prioriteringsunderlag beräknades."
                  : result.errors.map((error) => error.description).join(" "),
              );
            }}
          >
            Beräkna nytt prioriteringsunderlag med aktiv profil
          </button>
        </section>
      )}
      <p>
        Historiska underlag för initiativet:{" "}
        {priorityAssessmentByInitiative(state, initiativeId).length}
      </p>
      <p>
        Du agerar som: <b>{reviewer?.displayName ?? "Ingen behörig person"}</b>{" "}
        · demonstrerad roll- och mandatlogik, inte autentisering.
      </p>
      {assessment ? (
        <>
          <div className="stage2-score">
            {assessment.totalScore}
            <small>/100</small>
          </div>
          {assessment.criterionAssessments.map((item) => (
            <div className="stage2-contribution" key={item.criterionCode}>
              <b>{item.criterionCode}</b>
              <span>
                {item.score} poäng · bidrag {item.contribution}
              </span>
            </div>
          ))}
          <p>
            Systemrekommendation: <b>{assessment.systemRecommendation}</b>
          </p>
          <p>
            Mänsklig status: <b>{assessment.status}</b>
          </p>
          {assessment.humanRecommendation && (
            <p>
              Mänsklig rekommendation: <b>{assessment.humanRecommendation}</b>
            </p>
          )}
          <p>
            Motivering:{" "}
            {assessment.humanRationale ??
              "Inväntar mänskligt ställningstagande"}
          </p>
          {onHumanAction && assessment.status === "CALCULATED" && (
            <div
              className="stage2-actions"
              aria-label="Mänskligt ställningstagande"
            >
              <label>
                Motivering
                <input
                  value={rationale}
                  onChange={(event) => setRationale(event.target.value)}
                />
              </label>
              <button
                disabled={!rationale.trim()}
                onClick={() => {
                  const result = onHumanAction({
                    commandId: createId("Command", `review-${Date.now()}`),
                    actorRoleAssignmentId: reviewerAssignment!.id,
                    issuedAt: new Date().toISOString(),
                    commandType: "REVIEW_PRIORITY_ASSESSMENT",
                    targetId: assessment.id,
                    payload: { rationale },
                  });
                  setFeedback(
                    result.success
                      ? "Ställningstagandet registrerades."
                      : result.errors
                          .map((error) => error.description)
                          .join(" "),
                  );
                }}
              >
                Acceptera underlag
              </button>
              <button
                disabled={!rationale.trim()}
                onClick={() =>
                  onHumanAction({
                    commandId: createId("Command", `override-${Date.now()}`),
                    actorRoleAssignmentId: reviewerAssignment!.id,
                    issuedAt: new Date().toISOString(),
                    commandType: "OVERRIDE_PRIORITY_ASSESSMENT",
                    targetId: assessment.id,
                    payload: { recommendation: "INVESTIGATE", rationale },
                  })
                }
              >
                Åsidosätt med motivering
              </button>
              <button
                disabled={!rationale.trim()}
                onClick={() =>
                  onHumanAction({
                    commandId: createId("Command", `reject-${Date.now()}`),
                    actorRoleAssignmentId: reviewerAssignment!.id,
                    issuedAt: new Date().toISOString(),
                    commandType: "REJECT_PRIORITY_ASSESSMENT",
                    targetId: assessment.id,
                    payload: { rationale },
                  })
                }
              >
                Avslå med motivering
              </button>
              <button
                disabled={!rationale.trim()}
                onClick={() =>
                  onHumanAction({
                    commandId: createId("Command", `return-${Date.now()}`),
                    actorRoleAssignmentId: reviewerAssignment!.id,
                    issuedAt: new Date().toISOString(),
                    commandType: "RETURN_PRIORITY_ASSESSMENT_FOR_COMPLETION",
                    targetId: assessment.id,
                    payload: { rationale },
                  })
                }
              >
                Återför för komplettering
              </button>
            </div>
          )}
          <SourceRefs
            ids={[
              assessment.id,
              assessment.steeringProfileVersionId,
              ...assessment.effectPotentialIds,
              ...assessment.qualificationAssessmentIds,
              ...assessment.criterionAssessments.flatMap((x) => x.evidenceRefs),
            ]}
          />
        </>
      ) : (
        <p>Initiativet saknar beräknat prioriteringsunderlag.</p>
      )}
      <p role="status">{feedback}</p>
    </section>
  );
}

export function SteeringProfileWorkspace({
  state,
  onCommands,
}: {
  state: DemoState;
  onCommands: (commands: Command[]) => CommandResult;
}) {
  const profile = activeSteeringProfile(state)!;
  const [weights, setWeights] = useState<Record<string, number>>({
    ...profile.weights,
  });
  const [feedback, setFeedback] = useState("");
  const actorRoleAssignmentId = Object.keys(
    state.entities.roleAssignments,
  )[2] as RoleAssignmentId;
  const total = Object.values(weights).reduce((sum, value) => sum + value, 0);
  return (
    <section className="stage2-workspace">
      <Stage2Identity state={state} />
      <h2>Versionshanterad styrprofil</h2>
      <p>
        {profile.profileName} · version {profile.versionNumber} ·{" "}
        {profile.demoAssumption}
      </p>
      <p>
        En ny profil skapar nya framtida beräkningar. Historiska
        prioriteringsbedömningar behåller sin profilversion.
      </p>
      {profile.criteria.map((criterion) => (
        <label key={criterion.code}>
          {criterion.name}
          <input
            type="number"
            value={weights[criterion.code]}
            onChange={(event) =>
              setWeights({
                ...weights,
                [criterion.code]: Number(event.target.value),
              })
            }
          />
        </label>
      ))}
      <p>Viktsumma: {total}</p>
      <button
        disabled={total !== profile.weightSumRule}
        onClick={() => {
          const token = Date.now().toString(36);
          const id = createId("SteeringProfileVersion", `ui-profile-${token}`);
          const result = onCommands([
            {
              commandId: createId("Command", `profile-create-${token}`),
              actorRoleAssignmentId,
              issuedAt: new Date().toISOString(),
              commandType: "CREATE_STEERING_PROFILE_VERSION",
              targetId: id,
              payload: {
                profileName: `${profile.profileName} – användarversion`,
                versionNumber:
                  Math.max(
                    ...Object.values(
                      state.entities.steeringProfileVersions,
                    ).map((item) => item.versionNumber),
                  ) + 1,
                validFrom: new Date().toISOString().slice(0, 10),
                criteria: profile.criteria,
                weights,
                thresholds: profile.thresholds,
                weightSumRule: profile.weightSumRule,
                demoAssumption: "Ej beslutad – används endast i demo.",
                decidedByDecisionFunctionId:
                  profile.decidedByDecisionFunctionId,
              },
            },
            {
              commandId: createId("Command", `profile-activate-${token}`),
              actorRoleAssignmentId,
              issuedAt: new Date().toISOString(),
              commandType: "ACTIVATE_STEERING_PROFILE_VERSION",
              targetId: id,
            },
          ]);
          setFeedback(
            result.success
              ? `Profilversion ${profile.versionNumber + 1} aktiverades.`
              : result.errors.map((error) => error.description).join(" "),
          );
        }}
      >
        Skapa och aktivera ny profilversion
      </button>
      <p role="status">{feedback}</p>
    </section>
  );
}
