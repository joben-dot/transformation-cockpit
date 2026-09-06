import { roleName } from "./transformationHelpers";
import type { ReactNode } from "react";
import type { DemoState, Command, CommandResult } from "../application";
import type { RoleAssignmentId } from "../domain";

export interface WorkProps { state: DemoState; dispatch: (command: Command) => CommandResult; day: string }
export function RoleSelect({state,value,onChange,label,kind,businessId}:{state:DemoState;value:string;onChange:(id:RoleAssignmentId)=>void;label:string;kind?:string;businessId?:string}) {
  return <label>{label}<select required value={value} onChange={e=>onChange(e.target.value as RoleAssignmentId)}><option value="">Välj person och roll</option>{Object.values(state.entities.roleAssignments).filter(a=>(!kind||state.entities.roleDefinitions[a.roleDefinitionId].roleKind===kind)&&(!businessId||a.businessId===businessId)).map(a=><option key={a.id} value={a.id}>{roleName(state,a.id)}</option>)}</select></label>;
}
export function Why({children}:{children:ReactNode}) { return <details className="inline-help"><summary>Varför behövs detta?</summary><p>{children}</p></details>; }
export function Blockers({items}:{items:string[]}) {return items.length?<div className="gate blocked"><b>Start stoppad · {items.length} återstående krav</b><ul>{items.map((x,i)=><li key={i}>{x}</li>)}</ul></div>:<div className="gate ready"><b>Underlaget är komplett</b><p>Ett aktivt mänskligt beslut krävs fortfarande.</p></div>;}
export function Field({label,value,onChange,type="text",required=true}:{label:string;value:string;onChange:(v:string)=>void;type?:string;required?:boolean}){return <label>{label}<input required={required} type={type} step={type==="number"?"any":undefined} value={value} onChange={e=>onChange(e.target.value)}/></label>;}
