import type { DemoState } from "../demoState";
import type { InitiativeId } from "../../domain";
import { prerequisiteGraph } from "./executionSelectors";
import { currentEffectPotentials } from "./effectPotentialSelectors";

/** Area is a viewing filter. Upstream context survives; participation is never changed. */
export function portfolioLens(state:DemoState,area:string,day:string) {
  const e=state.entities;
  const selected=Object.values(e.initiatives).filter(i=>area==="Alla"||Object.values(e.participations).some(p=>p.initiativeId===i.id&&p.validFrom<=day&&(!p.validTo||p.validTo>=day)&&p.businessId&&e.businesses[p.businessId]?.businessAreaId===area));
  const graphs=selected.map(i=>({id:i.id,graph:prerequisiteGraph(state,i.id)}));
  const nodeIds=new Set(graphs.flatMap(x=>x.graph.nodes.map(n=>n.id)));
  const nodes=Object.values(e.executionNodes).filter(n=>nodeIds.has(n.id)).sort((a,b)=>a.plannedPeriod.from.localeCompare(b.plannedPeriod.from)||a.title.localeCompare(b.title));
  const selectedIds=new Set(selected.map(i=>i.id));
  const externalIds=new Set(nodes.flatMap(n=>n.ownerInitiativeId&&!selectedIds.has(n.ownerInitiativeId)?[n.ownerInitiativeId]:[]));
  const dependencies=Object.values(e.dependencies).filter(d=>nodeIds.has(d.predecessorNodeId)&&nodeIds.has(d.successorNodeId));
  const shared=nodes.map(node=>({node,consumers:graphs.filter(g=>(node.contextInitiativeIds.includes(g.id)&&node.ownerInitiativeId!==g.id)||g.graph.dependencies.some(d=>d.predecessorNodeId===node.id)).map(g=>g.id)})).filter(x=>x.consumers.length>1).sort((a,b)=>b.consumers.length-a.consumers.length);
  return {selected,selectedIds,externalIds,nodes,dependencies,shared};
}

export function simulatedPotential(state:DemoState,id:InitiativeId,factors:Record<string,number>,delayMonths:number) {
  const shift=(date:string)=>{const d=new Date(`${date}T00:00:00Z`);const original=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+delayMonths);const end=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();d.setUTCDate(Math.min(original,end));return d.toISOString().slice(0,10);};
  return currentEffectPotentials(state,id).map(p=>{
    const factor=Math.max(0,Math.min(200,Number.isFinite(factors[p.id])?factors[p.id]:100))/100;
    return {source:p,lower:p.lowerBound*factor,expected:p.expectedValue*factor,upper:p.upperBound*factor,firstEffect:shift(p.earliestPossibleEffectDate),fullEffect:shift(p.fullPotentialDate)};
  });
}
