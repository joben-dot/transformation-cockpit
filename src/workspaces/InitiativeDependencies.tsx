import type { DemoState } from "../application";
import type { ExecutionNodeId, InitiativeId } from "../domain";
import { dependencyDueDate, prerequisiteGraph, unavailableStartPrerequisites } from "../application/selectors/executionSelectors";
import { latestDecision } from "../application/selectors/transformationSelectors";
import { roleName } from "./transformationHelpers";

export function InitiativeDependencies({ state, id, day, onOpen }: {
  state: DemoState; id: InitiativeId; day: string; onOpen: (nodeId: ExecutionNodeId) => void;
}) {
  const graph = prerequisiteGraph(state, id);
  const blocking = graph.dependencies.filter(edge => edge.blocking);
  if (state.entities.initiatives[id].closedAt || !blocking.length) return null;
  const started = !!latestDecision(state, id);
  const startIds = new Set(started ? [] : unavailableStartPrerequisites(state, id).map(node => node.id));
  const pending = graph.nodes.filter(node => node.availabilityStatus !== "AVAILABLE"
    && blocking.some(edge => edge.predecessorNodeId === node.id));
  const start = pending.filter(n => startIds.has(n.id));
  const later = pending.filter(n => !startIds.has(n.id));
  const renderItem = (node: typeof pending[number]) => <li key={node.id}>
    <div><h3>{node.title}</h3>
      <p><b>Ansvarig:</b> {roleName(state, node.responsibleRoleAssignmentId)}
        {node.ownerInitiativeId && <> · {state.entities.initiatives[node.ownerInitiativeId]?.title}</>}</p>
      {blocking.filter(edge => edge.predecessorNodeId === node.id).map(edge => {
        const due = dependencyDueDate(state, edge);
        return <div key={edge.id}><p><b>{state.entities.executionNodes[edge.successorNodeId]?.title} behöver:</b> {edge.requiredDeliverable}</p>
          <p>{edge.requiredAt === "INITIATIVE_START" ? "Villkor för startbesked" : edge.requiredAt === "NODE_START" ? "Krav före denna leverans startar" : "Krav vid senare milstolpe"}
            {due ? ` · behövs ${due}` : edge.requiredAt !== "INITIATIVE_START" ? " · datum saknas" : ""}
            {due && due < day && <strong> · datum passerat</strong>}
            {due && node.plannedPeriod?.to && node.plannedPeriod.to > due && <strong> · planerad leverans ligger efter behovsdatum</strong>}</p>
          <p>{edge.rationale}</p></div>;
      })}
    </div>
    <button className="outline-link" aria-label={`Visa förutsättningen: ${node.title}`} onClick={() => onOpen(node.id)}>Öppna underlag →</button>
  </li>;
  return <details className="initiative-dependencies dependency-disclosure" aria-label="Initiativets beroenden">
    <summary>Beroenden · {pending.length ? `${pending.length} förutsättningar återstår` : "registrerade förutsättningar tillgängliga"}
      {start.length > 0 ? ` · ${start.length} villkor för startbesked` : pending.length > 0 ? " · inför leveranser" : ""}</summary>
    {start.length > 0 && <section><h2>Inför startbesked · {start.length}</h2><p>Dessa förutsättningar ska vara tillgängliga när startbeslut fattas. Beredning och prioritering kan fortsätta.</p><ul>{start.map(renderItem)}</ul></section>}
    {later.length > 0 && <section><h2>Inför leveranser och milstolpar · {later.length}</h2><p>Följ ansvar, behovsdatum och leveransplan. Ett senare leveranskrav är inte i sig ett stopp för hela initiativets start.</p><ul>{later.map(renderItem)}</ul></section>}
    {!pending.length && <p>{started ? "Följ genomförande och effekt mot det fattade beslutet." : "Övriga startkrav och ett mänskligt startbeslut behöver fortfarande prövas."}</p>}
  </details>;
}
