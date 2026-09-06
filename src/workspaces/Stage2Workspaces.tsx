import { useState } from "react";
import { HelpCircle } from "lucide-react";
import {
  effectPotentialLabel,
  type CompletionRequirement,
  type InitiativeId,
  createId,
  type RoleAssignmentId,
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
  onCommands,
}: {
  state: DemoState;
  initiativeId: InitiativeId;
  onCommand?: (command: Command) => CommandResult;
  onCommands?: (commands: Command[]) => CommandResult;
}) {
  const [summary, setSummary] = useState("Syntetiskt bedömningsunderlag");
  const [evidence, setEvidence] = useState("SYNTHETIC-USER-EVIDENCE");
  const [assumption, setAssumption] = useState("Syntetiskt användarantagande");
  const [feedback, setFeedback] = useState("");
  const [deadline, setDeadline] = useState("2027-03-31");
  const requirements = completionRequirementsByInitiative(state, initiativeId);
  const areaStatuses = deriveQualificationAreaStatuses(state, initiativeId);
  const actorRoleAssignmentId = Object.keys(
    state.entities.roleAssignments,
  )[1] as RoleAssignmentId;
  const configuration = Object.values(
    state.entities.qualificationConfigurations,
  ).find((item) => item.status === "ACTIVE");
  const activeRequirement = requirements.find(
    (item) => !["VERIFIED", "NOT_APPLICABLE"].includes(item.status),
  );
  const run = (command: Command) => {
    const result = onCommand?.(command);
    setFeedback(
      result?.success
        ? "Ändringen sparades i det gemensamma ärendet."
        : result && !result.success
          ? result.errors.map((error) => error.description).join(" ")
          : "",
    );
  };
  return (
    <section className="stage2-workspace">
      <Stage2Identity state={state} />
      <Help term="kvalificering" />
      <Help term="kompletteringsansvarig" />
      <Help term="verifierare" />
      <Help term="deadline" />
      <h2>Sex kvalificeringsområden</h2>
      {onCommand && configuration && (
        <section className="stage2-editor" aria-label="Bearbeta kvalificering">
          <h3>Bearbeta återstående bedömningspunkter</h3>
          <label>
            Sammanfattning
            <input
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
            />
          </label>
          <label>
            Evidensreferens
            <input
              value={evidence}
              onChange={(event) => setEvidence(event.target.value)}
            />
          </label>
          <label>
            Antagande
            <input
              value={assumption}
              onChange={(event) => setAssumption(event.target.value)}
            />
          </label>
          <button
            disabled={!summary.trim() || !evidence.trim()}
            onClick={() => {
              const existing = Object.values(
                state.entities.qualificationAssessments,
              )
                .filter((item) => item.initiativeId === initiativeId)
                .map((item) => item.criterionCode);
              const commands = configuration.criteria
                .filter(
                  (criterion) => !existing.includes(criterion.criterionCode),
                )
                .map(
                  (criterion, index): Command => ({
                    commandId: createId(
                      "Command",
                      `ui-qualification-${Date.now()}-${index}`,
                    ),
                    actorRoleAssignmentId,
                    issuedAt: new Date().toISOString(),
                    commandType: "UPSERT_QUALIFICATION_ASSESSMENT",
                    targetId: createId(
                      "QualificationAssessment",
                      `ui-${initiativeId}-${index}`.replace(
                        /[^a-z0-9-]/gi,
                        "-",
                      ),
                    ),
                    payload: {
                      initiativeId,
                      qualificationArea: criterion.qualificationArea,
                      criterionCode: criterion.criterionCode,
                      summary,
                      status: "SATISFIED",
                      mandatory: criterion.mandatory,
                      requiresVerification: criterion.requiresVerification,
                      evidenceRefs: [evidence],
                      assumptions: [assumption],
                      verifiedByRoleAssignmentId: criterion.requiresVerification
                        ? actorRoleAssignmentId
                        : undefined,
                      verifiedAt: criterion.requiresVerification
                        ? new Date().toISOString()
                        : undefined,
                      assessedAgainstConfigurationVersion: configuration.id,
                    },
                  }),
                );
              const result = onCommands?.(commands);
              setFeedback(
                result?.success
                  ? "Samtliga bedömningar sparades."
                  : result && !result.success
                    ? result.errors.map((error) => error.description).join(" ")
                    : "",
              );
            }}
          >
            Bedöm alla återstående punkter
          </button>
          <p role="status">{feedback}</p>
        </section>
      )}
      {onCommand && (
        <section className="stage2-editor" aria-label="Hantera komplettering">
          <h3>Kompletteringsansvar</h3>
          {!activeRequirement ? (
            <button
              onClick={() =>
                run({
                  commandId: createId("Command", `completion-${Date.now()}`),
                  actorRoleAssignmentId,
                  issuedAt: new Date().toISOString(),
                  commandType: "CREATE_COMPLETION_REQUIREMENT",
                  targetId: createId(
                    "CompletionRequirement",
                    `completion-${Date.now()}`,
                  ),
                  payload: {
                    initiativeId,
                    missingItem: "Kompletterande syntetiskt underlag",
                    reasonRequired: "Behövs för transparent kvalificering",
                    blocks: ["QUALIFICATION"],
                  },
                })
              }
            >
              Skapa kompletteringskrav
            </button>
          ) : (
            <>
              <label>
                Deadline
                <input
                  type="date"
                  value={deadline}
                  onChange={(event) => setDeadline(event.target.value)}
                />
              </label>
              <button
                onClick={() =>
                  run({
                    commandId: createId("Command", `assign-${Date.now()}`),
                    actorRoleAssignmentId,
                    issuedAt: new Date().toISOString(),
                    commandType: "ASSIGN_COMPLETION_RESPONSIBILITY",
                    targetId: activeRequirement.id,
                    payload: {
                      responsibleRoleAssignmentId: actorRoleAssignmentId,
                      verifierRoleAssignmentId: actorRoleAssignmentId,
                      deadline,
                    },
                  })
                }
              >
                Ange ansvarig, deadline och verifierare
              </button>
              <button
                onClick={() =>
                  run({
                    commandId: createId("Command", `submit-${Date.now()}`),
                    actorRoleAssignmentId,
                    issuedAt: new Date().toISOString(),
                    commandType: "SUBMIT_COMPLETION_REQUIREMENT",
                    targetId: activeRequirement.id,
                    payload: {
                      submittedEvidenceRefs: [evidence],
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
                    actorRoleAssignmentId,
                    issuedAt: new Date().toISOString(),
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
        {qualificationAreasByInitiative(state, initiativeId).map((group) => (
          <details className="stage2-area" key={group.area}>
            <summary>
              <span>{qualificationAreaLabels[group.area]}</span>
              <strong>
                {
                  areaStatuses.find((item) => item.area === group.area)
                    ?.satisfiedMandatoryCount
                }{" "}
                /{" "}
                {
                  areaStatuses.find((item) => item.area === group.area)
                    ?.totalMandatoryCount
                }{" "}
                ·{" "}
                {areaStatuses.find((item) => item.area === group.area)?.status}
              </strong>
            </summary>
            <p>
              Återstår:{" "}
              {areaStatuses
                .find((item) => item.area === group.area)
                ?.remainingCriterionCodes.join(", ") || "Inga"}
            </p>
            <p>
              Kräver verifiering:{" "}
              {areaStatuses
                .find((item) => item.area === group.area)
                ?.verificationCriterionCodes.join(", ") || "Inga"}
            </p>
            {group.assessments.map((item) => (
              <div key={item.id}>
                <p>
                  {item.summary} · {item.status}
                </p>
                <small>
                  Verifiering:{" "}
                  {item.verifiedByRoleAssignmentId ?? "Ej verifierad"}
                </small>
              </div>
            ))}
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
        ))}
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
  const [expectedValue, setExpectedValue] = useState(100);
  const [evidence, setEvidence] = useState("SYNTHETIC-POTENTIAL-EVIDENCE");
  const [assumption, setAssumption] = useState("Syntetiskt volymantagande");
  const [feedback, setFeedback] = useState("");
  const actorRoleAssignmentId = Object.keys(
    state.entities.roleAssignments,
  )[1] as RoleAssignmentId;
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
          <label>
            Förväntat kvalitetsindex
            <input
              type="number"
              value={expectedValue}
              onChange={(event) => setExpectedValue(Number(event.target.value))}
            />
          </label>
          <label>
            Evidens
            <input
              value={evidence}
              onChange={(event) => setEvidence(event.target.value)}
            />
          </label>
          <label>
            Antagande
            <input
              value={assumption}
              onChange={(event) => setAssumption(event.target.value)}
            />
          </label>
          <button
            onClick={() => {
              const result = onCommand({
                commandId: createId("Command", `potential-${Date.now()}`),
                actorRoleAssignmentId,
                issuedAt: new Date().toISOString(),
                commandType: "RECORD_EFFECT_POTENTIAL",
                targetId: createId(
                  "EffectPotential",
                  `potential-${Date.now()}`,
                ),
                payload: {
                  initiativeId,
                  recipientScenario: "Syntetiskt mottagarscenario",
                  category: "QUALITY",
                  effectMeasureCode: "QUALITY_INDEX",
                  unit: "index",
                  lowerBound: Math.max(0, expectedValue - 10),
                  expectedValue,
                  upperBound: expectedValue + 10,
                  evidenceRefs: [evidence],
                  assumptions: [assumption],
                  uncertainty: "MEDIUM",
                  realizationWindow: "12 månader",
                  earliestPossibleEffectDate: "2027-01-01",
                  fullPotentialDate: "2027-12-31",
                  scope: "LOCAL",
                  assessmentVersion: 1,
                },
              });
              setFeedback(
                result.success
                  ? "Potentialen registrerades."
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
            {item.lowerBound} / {item.expectedValue} / {item.upperBound}{" "}
            {item.unit}
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
            Ansvariga bedömare: {item.assessedByRoleAssignmentIds.join(", ")}
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
