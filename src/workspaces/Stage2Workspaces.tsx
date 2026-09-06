import { HelpCircle } from "lucide-react";
import {
  effectPotentialLabel,
  type CompletionRequirement,
  type InitiativeId,
} from "../domain";
import type { DemoState } from "../application";
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
}: {
  state: DemoState;
  initiativeId: InitiativeId;
}) {
  const requirements = completionRequirementsByInitiative(state, initiativeId);
  const areaStatuses = deriveQualificationAreaStatuses(state, initiativeId);
  return (
    <section className="stage2-workspace">
      <Stage2Identity state={state} />
      <Help term="kvalificering" />
      <Help term="kompletteringsansvarig" />
      <Help term="verifierare" />
      <Help term="deadline" />
      <h2>Sex kvalificeringsområden</h2>
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
}: {
  state: DemoState;
  initiativeId: InitiativeId;
}) {
  return (
    <section className="stage2-workspace">
      <Stage2Identity state={state} />
      <Help term="bedömd effektpotential" />
      <Help term="evidens" />
      <Help term="antagande" />
      <Help term="osäkerhet" />
      <h2>Effektpotential</h2>
      <div className="qualification-success">{effectPotentialLabel}</div>
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
  onHumanAction?: (action: "ACCEPT" | "OVERRIDE" | "REJECT" | "RETURN") => void;
}) {
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
              <button onClick={() => onHumanAction("ACCEPT")}>
                Acceptera underlag
              </button>
              <button onClick={() => onHumanAction("OVERRIDE")}>
                Åsidosätt med motivering
              </button>
              <button onClick={() => onHumanAction("REJECT")}>
                Avslå med motivering
              </button>
              <button onClick={() => onHumanAction("RETURN")}>
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
    </section>
  );
}
