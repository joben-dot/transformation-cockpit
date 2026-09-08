import { ArrowRight, AlertCircle, Network } from "lucide-react";
import type { DemoState } from "../application";
import type { ExecutionNodeId, InitiativeId } from "../domain";
import { prerequisiteGraph, unavailableStartPrerequisites } from "../application/selectors/executionSelectors";
import { latestDecision } from "../application/selectors/transformationSelectors";
import { roleName } from "./transformationHelpers";

export function InitiativeDependencies({ state, id, day, onOpen }: {
  state: DemoState; id: InitiativeId; day: string; onOpen: (nodeId: ExecutionNodeId) => void;
}) {
  const initiative = state.entities.initiatives[id];
  const graph = prerequisiteGraph(state, id);
  const blocking = graph.dependencies.filter(edge => edge.blocking);
  if (initiative.closedAt || !blocking.length) return null;
  const startIds = new Set(unavailableStartPrerequisites(state, id).map(node => node.id));
  const started = !!latestDecision(state, id);
  const pending = graph.nodes.filter(node => node.availabilityStatus !== "AVAILABLE"
    && blocking.some(edge => edge.predecessorNodeId === node.id))
    .sort((a, b) => Number(startIds.has(b.id)) - Number(startIds.has(a.id))
      || (a.neededAt || "9999").localeCompare(b.neededAt || "9999") || a.title.localeCompare(b.title, "sv"));
  const stopped = !started && startIds.size > 0;
  if (!pending.length) return <section className="initiative-dependencies dependencies-clear" aria-label="Initiativets beroenden">
    <p><Network size={22} aria-hidden="true"/> Registrerade blockerande förutsättningar är tillgängliga.</p>
    <p>{started ? "Genomförande och effekt följs mot det fattade beslutet." : "Övriga startkrav och ett mänskligt startbeslut behöver fortfarande prövas."}</p>
  </section>;
  const renderItem = (node: typeof pending[number]) => {
    const edges = blocking.filter(edge => edge.predecessorNodeId === node.id);
    const beforeDelivery = edges.some(edge => edge.requiredAt === "NODE_START");
    const owner = node.ownerInitiativeId && state.entities.initiatives[node.ownerInitiativeId];
    return <li key={node.id}>
      <div className="dependency-summary-copy">
        <p className="dependency-impact">{!started && startIds.has(node.id) ? "Stoppar start" : beforeDelivery ? "Krävs före beroende leverans" : "Krävs vid senare milstolpe"}</p>
        <h3>{node.title}</h3>
        <p className="dependency-owner"><b>Ansvarig:</b> {roleName(state, node.responsibleRoleAssignmentId)}<br/>
          <b>Behövs senast:</b> {node.neededAt || "Datum saknas"}{node.neededAt && node.neededAt < day && <strong> · Försenat</strong>}
          {owner && <><br/><b>Tillhör:</b> {owner.title}</>}</p>
        <details><summary>Varför och vad behöver vara klart?</summary><p>{edges[0].rationale}</p>{edges.map(edge => <p key={edge.id}>
          <b>Före {state.entities.executionNodes[edge.successorNodeId]?.title}:</b> {edge.requiredDeliverable}
        </p>)}</details>
      </div>
      <button className="outline-link" aria-label={`Visa förutsättningen: ${node.title}`} onClick={() => onOpen(node.id)}>
        Visa förutsättningen <ArrowRight size={19} aria-hidden="true"/>
      </button>
    </li>;
  };
  return <section className={`initiative-dependencies ${stopped ? "dependencies-blocked" : "dependencies-pending"}`} aria-label="Initiativets beroenden">
    <h2><AlertCircle size={26} aria-hidden="true"/>{stopped ? `Start blockeras av ${startIds.size} ${startIds.size === 1 ? "förutsättning" : "förutsättningar"}` : started ? "Beroenden att följa under genomförandet" : "Beroenden inför kommande leveranser"}</h2>
    <p>{started ? "Följ de leveranser som återstår. Det befintliga startbeslutet ändras inte av denna lägesbild."
      : "Beroendet hindrar inte i sig beredning eller prioritering. Deras egna underlag behöver vara klara; start prövas separat."}</p>
    <ul>{pending.slice(0, 2).map(renderItem)}</ul>
    {pending.length > 2 && <details className="more-dependencies"><summary>Visa ytterligare {pending.length - 2} förutsättningar</summary><ul>{pending.slice(2).map(renderItem)}</ul></details>}
  </section>;
}
