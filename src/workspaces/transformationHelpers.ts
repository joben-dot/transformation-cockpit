import type { DemoState } from "../application";
import type { RoleAssignmentId } from "../domain";
export function roleName(state: DemoState, id?: RoleAssignmentId) {
  const a=id && state.entities.roleAssignments[id];
  return a ? `${state.entities.people[a.personId].displayName} · ${state.entities.roleDefinitions[a.roleDefinitionId].name}` : "Ansvarig saknas";
}
export const token=()=>crypto.randomUUID();
export const format=(n:number|undefined)=>n===undefined?"Ej uppmätt":n.toLocaleString("sv-SE",{maximumFractionDigits:2});
