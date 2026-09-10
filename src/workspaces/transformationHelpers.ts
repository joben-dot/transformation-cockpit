import type { DemoState } from "../application";
import type { RoleAssignmentId } from "../domain";
export function roleName(state: DemoState, id?: RoleAssignmentId) {
  const a=id && state.entities.roleAssignments[id];
  return a ? `${state.entities.people[a.personId].displayName} · ${state.entities.roleDefinitions[a.roleDefinitionId].name}` : "Ansvarig saknas";
}
// Local record identity; also works in HTTP development previews where randomUUID is unavailable.
export const token=()=>{
  if(typeof crypto.randomUUID==="function")return crypto.randomUUID();
  const bytes=crypto.getRandomValues(new Uint8Array(16));
  bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
  const hex=Array.from(bytes,b=>b.toString(16).padStart(2,"0")).join("");
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
};
export const format=(n:number|undefined)=>n===undefined?"Ej uppmätt":n.toLocaleString("sv-SE",{maximumFractionDigits:2});
