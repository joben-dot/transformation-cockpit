import type { DemoState } from "../application";
import {
  allocationSummary,
  capacityStatus,
  costBreakdownWithoutProjection,
  costSummary,
  prerequisiteGraph,
  reusedPrerequisites,
  topologicalExecutionOrder,
} from "../application/selectors";
import { effectPotentialsByInitiative } from "../application/selectors/effectPotentialSelectors";
import type { Command } from "../application/commands";
import { createId, type InitiativeId, type RoleAssignmentId } from "../domain";
import { stage3Ids } from "../demo-data/stage3DemoData";

export function Stage3Workspace({
  state,
  onCommand,
}: {
  state: DemoState;
  onCommand: (command: Command) => void;
}) {
  const initiativeId = state.viewContext.activeInitiativeId!;
  const graph = prerequisiteGraph(state, initiativeId);
  const order = topologicalExecutionOrder(state, initiativeId);
  const capacities = capacityStatus(state, initiativeId);
  const sharedCost = state.entities.costEntries[stage3Ids.sharedCost];
  const costBreakdown = costBreakdownWithoutProjection(
    state,
    [stage3Ids.valueInitiative, stage3Ids.enablingInitiative],
    "ESTIMATE",
  );
  const partialHorizon = costSummary(
    state,
    [stage3Ids.valueInitiative, stage3Ids.enablingInitiative],
    "ESTIMATE",
    { from: "2026-10-01", to: "2026-12-31" },
  );
  const activeRule = Object.values(state.entities.allocationRuleVersions).find(
    (rule) => rule.status === "ACTIVE",
  )!;
  const actorRoleAssignmentId = Object.keys(
    state.entities.roleAssignments,
  )[1] as RoleAssignmentId;
  const meta = { actorRoleAssignmentId, issuedAt: "2026-10-15T10:00:00Z" };
  const chooseInitiative = (targetId: InitiativeId) =>
    onCommand({
      ...meta,
      commandId: createId(
        "Command",
        `stage3-select-${targetId}`.replace(/[^a-z0-9-]/gi, "-"),
      ),
      commandType: "SET_ACTIVE_INITIATIVE",
      targetId,
    });
  return (
    <section className="stage2-workspace stage3-workspace">
      <p className="eyebrow">
        FÖRUTSÄTTNINGAR · GENOMFÖRANDEORDNING · KAPACITET · KOSTNAD
      </p>
      <h2>{state.entities.initiatives[initiativeId]?.title}</h2>
      <p>
        <code>{state.entities.initiatives[initiativeId]?.challengeId}</code> →{" "}
        <code>{initiativeId}</code>
      </p>
      <p
        className={
          partialHorizon.completeness === "INCOMPLETE" ? "warning" : ""
        }
      >
        Kostnadshorisont oktober–december 2026: {partialHorizon.completeness}.
        Beräknad delsumma{" "}
        {partialHorizon.calculatedSubtotal.toLocaleString("sv-SE")} SEK.
        {partialHorizon.uncomputedPeriods.length > 0 &&
          ` ${partialHorizon.uncomputedPeriods[0].reason}`}
      </p>
      <div className="qualification-success">
        Strategisk prioritet är beslutsunderlag – inte startgodkännande.
      </div>
      <p>
        Oförändrad bedömd potential:{" "}
        {effectPotentialsByInitiative(state, initiativeId)
          .map((p) => `${p.expectedValue} ${p.unit}`)
          .join(", ") || "Ingen potential registrerad för detta initiativ."}
      </p>
      <div className="stage2-actions">
        <button onClick={() => chooseInitiative(stage3Ids.valueInitiative)}>
          Värdeskapande initiativ
        </button>
        <button onClick={() => chooseInitiative(stage3Ids.reuseInitiative)}>
          Annat initiativ som återanvänder E
        </button>
      </div>
      <h3>Riktad förutsättningsgraf</h3>
      <p>
        Riktning: föregångare/förutsättning → beroende nod. Körordning skiljer
        sig från strategisk prioritet och är inte en fullständig tidsplan.
      </p>
      <div className="stage2-actions">
        <button
          onClick={() =>
            onCommand({
              ...meta,
              commandId: createId("Command", "add-local-readiness-ui"),
              commandType: "CREATE_EXECUTION_NODE",
              targetId: createId("ExecutionNode", "local-readiness-ui"),
              payload: {
                ownerInitiativeId: initiativeId,
                contextInitiativeIds: [initiativeId],
                title: "Ny lokal syntetisk förutsättning",
                description: "Tillagd genom den validerade command-vägen.",
                nodeKind: "LOCAL_ADOPTION",
                responsibleRoleAssignmentId: actorRoleAssignmentId,
                plannedPeriod: { from: "2027-01-01", to: "2027-02-28" },
                neededAt: "2027-02-28",
                availabilityCriteria: "Lokalt underlag ska verifieras.",
                availabilityStatus: "PLANNED",
                availabilityEvidenceRefs: [],
              },
            })
          }
        >
          Lägg till ny förutsättning
        </button>
        {!state.entities.executionNodes[
          stage3Ids.sharedNode
        ].contextInitiativeIds.includes(initiativeId) && (
          <button
            onClick={() =>
              onCommand({
                ...meta,
                commandId: createId("Command", "reuse-shared-node-ui"),
                commandType: "UPDATE_EXECUTION_NODE",
                targetId: stage3Ids.sharedNode,
                payload: {
                  contextInitiativeIds: [
                    ...state.entities.executionNodes[stage3Ids.sharedNode]
                      .contextInitiativeIds,
                    initiativeId,
                  ],
                },
              })
            }
          >
            Koppla befintlig gemensam förutsättning
          </button>
        )}
      </div>
      {order.levels.map((level, index) => (
        <div className="stage3-level" key={index}>
          <b>Parallell nivå {index + 1}</b>
          {level.map((id) => {
            const node = state.entities.executionNodes[id];
            return (
              <article key={id}>
                <strong>{node.title}</strong>
                <span>
                  {node.availabilityStatus} · behövs {node.neededAt}
                </span>
                <span>
                  Ansvarig:{" "}
                  {node.responsibleRoleAssignmentId ??
                    "Saknas – komplettering behövs"}
                </span>
              </article>
            );
          })}
        </div>
      ))}
      <details>
        <summary>Beroenden och leveranskrav</summary>
        {graph.dependencies.map((edge) => (
          <p key={edge.id}>
            {state.entities.executionNodes[edge.predecessorNodeId].title} →{" "}
            {state.entities.executionNodes[edge.successorNodeId].title}:{" "}
            {edge.requiredDeliverable} ({edge.requiredAt})
          </p>
        ))}
      </details>
      <p>
        Återanvänd gemensam förutsättning:{" "}
        {reusedPrerequisites(state)
          .map((x) => `${x.node.title} (${x.node.id})`)
          .join(", ")}
      </p>
      <h3>Kapacitet över tid</h3>
      {capacities.map((item) => (
        <p key={item.demand.id}>
          <b>{item.status}</b> · {item.requested}/{item.available || "okänd"}{" "}
          {item.demand.unit} · {item.demand.period.from}–{item.demand.period.to}
        </p>
      ))}
      {state.entities.capacityDemands[stage3Ids.capacityDemand] && (
        <button
          onClick={() =>
            onCommand({
              ...meta,
              commandId: createId("Command", "move-capacity-period-ui"),
              commandType: "CHANGE_CAPACITY_PERIOD",
              targetId: stage3Ids.capacityDemand,
              payload: { period: { from: "2027-01-01", to: "2027-03-31" } },
            })
          }
        >
          Flytta behov till nästa period
        </button>
      )}
      <p>
        Efterfrågan är inte en bekräftad resursallokering. Okänd tillgänglighet
        visas som okänd.
      </p>
      <h3>Spårbar kostnadsbild</h3>
      <p>
        Preliminära engångskostnader:{" "}
        {costBreakdown.oneTimeAmount.toLocaleString("sv-SE")} SEK. Återkommande
        drift: {costBreakdown.recurringAnnualAmount.toLocaleString("sv-SE")} SEK
        per år. Budget, prognos och utfall summeras separat.
      </p>
      <p>
        Gemensam investering: {sharedCost.amount.toLocaleString("sv-SE")} SEK ·
        ursprung {sharedCost.originReference}. Teknisk leverans är inte
        realiserad verksamhetseffekt.
      </p>
      <div className="stage2-actions">
        {Object.values(state.entities.allocationRuleVersions).map((rule) => (
          <button
            key={rule.id}
            onClick={() =>
              onCommand({
                ...meta,
                commandId: createId(
                  "Command",
                  `allocation-${rule.versionNumber}`,
                ),
                commandType: "CALCULATE_COST_ALLOCATION",
                targetId: sharedCost.id,
                payload: {
                  ruleVersionId: rule.id,
                  scenarioId: "UI-SCENARIO",
                  dimension: "ORGANIZATION",
                },
              })
            }
          >
            {rule.name}
          </button>
        ))}
      </div>
      <p>
        {activeRule.demoAssumption} Allokering fördelar befintlig kostnad och
        skapar ingen ny kostnad.
      </p>
      {allocationSummary(state, sharedCost.id, "UI-SCENARIO").allocations.map(
        (part) => (
          <p key={part.id}>
            {part.organizationId}:{" "}
            {part.allocatedAmount.toLocaleString("sv-SE")} SEK (
            {(part.share * 100).toFixed(1)} %)
          </p>
        ),
      )}
    </section>
  );
}
