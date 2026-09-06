import type { DemoState } from "../application";
import type { InitiativeId } from "../domain";
import { currentEffectPotentials } from "../application/selectors/effectPotentialSelectors";
import { activeCommitments } from "../application/selectors/transformationSelectors";
import { roleName } from "./transformationHelpers";

export function DataProvenance({state,id}:{state:DemoState;id?:InitiativeId}) {
  const ids=id?[id]:Object.values(state.entities.initiatives).map(i=>i.id);
  const potentials=ids.flatMap(i=>currentEffectPotentials(state,i));
  const owners=[...new Set(ids.flatMap(i=>activeCommitments(state,i)).flatMap(c=>c.details?[c.details.ownerRoleAssignmentId]:[]))];
  const assessors=[...new Set(potentials.flatMap(p=>p.assessedByRoleAssignmentIds))];
  return <details className="data-provenance"><summary>Varifrån kommer uppgifterna – och vem ansvarar?</summary><div className="source-grid"><div><h3>Underlag till prioritering</h3><p>Registrerade businesscase och bedömd effektpotential. Poängen beräknas från dokumenterade kriteriebedömningar och den valda styrprofilens vikter.</p><p><b>Dokumenterade bedömare:</b> {assessors.map(a=>roleName(state,a)).join("; ")||"Ingen bedömare registrerad"}.</p></div><div><h3>Åtagande och uppmätt effekt</h3><p>Varje verksamhet accepterar sitt eget mål, sin baseline och mätplan. Uppmätt effekt hämtas från verifierade mätpunkter mot det låsta beslutet.</p><p><b>Effektägare i beslutade åtaganden:</b> {owners.map(a=>roleName(state,a)).join("; ")||"Inga beslutade åtaganden ännu"}.</p></div><div><h3>Förutsättningar och ansvar</h3><p>Beroenden hämtas från länkade leveranser mellan initiativen. Leveransens namngivna ansvariga och behövsdatum följer med. Saknas de visas det som en brist.</p></div><div><h3>Så uppdateras demonstrationen</h3><p>Registrerade underlag och det som sparas i denna session. Ingen automatisk hämtning från Antura, ekonomisystem eller andra verksamhetssystem är ansluten. Att öppna en punkt ändrar inga uppgifter.</p></div></div></details>;
}
