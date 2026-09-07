import {create} from "react-test-renderer";
import {expect,it} from "vitest";
import {createPresentationDemoState} from "./presentationDemoState";
import {startReadiness} from "../application/selectors/startReadinessSelectors";
import {activeCommitments,committedEconomics} from "../application/selectors/transformationSelectors";
import {ControlRoom} from "../workspaces/ControlRoom";

it("har lokala mottagare i kommunala områden och två verkligt startklara exempel",()=>{
 const state=createPresentationDemoState(),e=state.entities;
 const areas=Object.values(e.businessAreas);
 expect(areas.map(a=>a.name)).toEqual(expect.arrayContaining(["Vård","Skola","Omsorg","Samhällsbyggnad","Fritid och kultur"]));
 for(const area of areas){expect(Object.values(e.participations).some(p=>p.businessId&&e.businesses[p.businessId].businessAreaId===area.id)).toBe(true);}
 for(const c of Object.values(e.effectCommitments)){expect(e.roleAssignments[c.details!.ownerRoleAssignmentId].businessId).toBe(c.recipientBusinessId);}
 const ready=Object.values(e.initiatives).filter(i=>startReadiness(state,i.id,"2026-09-06").ready);
 expect(ready).toHaveLength(2);
 const first=startReadiness(state,ready[0].id,"2026-09-06");
 const acceptance=Object.values(e.effectOwnerAcceptances).find(a=>first.preparation!.commitmentIds.includes(a.effectCommitmentId))!;
 delete e.effectOwnerAcceptances[acceptance.id as keyof typeof e.effectOwnerAcceptances];
 expect(startReadiness(state,ready[0].id,"2026-09-06").ready).toBe(false);
});
it("visar bygglov under samhällsbyggnad och håller andra områdens utfall utanför",()=>{
 const state=createPresentationDemoState(),area=Object.values(state.entities.businessAreas).find(a=>a.name==="Samhällsbyggnad")!;
 const renderer=create(<ControlRoom state={state} day="2026-09-06" open={()=>{}} openCases={()=>{}} context={{view:"effects",stage:"Alla",area:area.id,from:"2026-01-01",to:"2026-12-31"}} setContext={()=>{}}/>);
 const table=renderer.root.findByType("tbody");
 expect(table.findAllByType("button").map(b=>b.children.join(""))).toEqual(["Fler kompletta bygglovsansökningar från början"]);
 const ids=Object.values(state.entities.initiatives).map(i=>i.id),businessIds=Object.values(state.entities.businesses).filter(b=>b.businessAreaId===area.id).map(b=>b.id);
 expect(committedEconomics(state,ids,{from:"2026-01-01",to:"2026-12-31"},businessIds).plannedFinancialEffect).toBeUndefined();
 expect(ids.flatMap(id=>activeCommitments(state,id)).some(c=>c.details?.category==="MONEY")).toBe(true);
});
