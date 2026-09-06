import { expect,it } from "vitest";
import { initializeDemoState } from "../initializeDemoState";
import { cockpitCases,initiativeDependencies } from "./cockpitSelectors";
import { currentEffectPotentials } from "./effectPotentialSelectors";

it("sorterar giltiga underlag först och lämnar övriga ärenden utan påhittade poäng",()=>{
 const state=initializeDemoState(),before=JSON.stringify(state),items=cockpitCases(state,"2026-09-06");
 expect(items).toHaveLength(8);
 const ranked=items.filter(i=>i.rankable);
 expect(ranked.length).toBeGreaterThan(1);
 expect(ranked.map(i=>i.priorityScore)).toEqual(ranked.map(i=>i.priorityScore).sort((a,b)=>b!-a!));
 expect(items.slice(ranked.length).every(i=>i.priorityScore===undefined)).toBe(true);
 expect(JSON.stringify(state)).toBe(before);
 const first=ranked[0],p=currentEffectPotentials(state,first.initiativeId!)[0];
 first.assessment!.effectPotentialIds=first.assessment!.effectPotentialIds.filter(id=>id!==p.id);
 expect(cockpitCases(state,"2026-09-06").find(i=>i.challengeId===first.challengeId)).toMatchObject({stale:true,rankable:false,priorityScore:undefined});
});
it("visar befintliga beroenden över ägargränser och uppdaterar tillgänglighet utan att ge startbeslut",()=>{
 const state=initializeDemoState(),ids=Object.values(state.entities.initiatives).map(i=>i.id);
 const deps=initiativeDependencies(state,ids);
 expect(deps.length).toBeGreaterThan(0);
 expect(deps.every(d=>d.ownerInitiativeId!==d.initiativeId&&d.edges.every(e=>e.blocking))).toBe(true);
 const d=deps.find(d=>!d.available)!;
 state.entities.executionNodes[d.node.id].availabilityStatus="AVAILABLE";
 expect(initiativeDependencies(state,ids).find(x=>x.initiativeId===d.initiativeId&&x.node.id===d.node.id)!.available).toBe(true);
 expect(Object.values(state.entities.decisionVersions)).toHaveLength(0);
});
