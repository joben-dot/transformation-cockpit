import { expect,it } from 'vitest';
import { createPresentationDemoState } from '../../demo-data/presentationDemoState';
import { controlRoomCases, controlStages, selectControlCases } from './controlRoomSelectors';
import { startReadiness } from './startReadinessSelectors';
import { latestDecision } from './transformationSelectors';

it('partitionerar registrerade ärenden en gång och räknar även utmaningar utan initiativ',()=>{
 const state=createPresentationDemoState(),before=JSON.stringify(state),cases=controlRoomCases(state,'2026-09-06');
 const registered=Object.values(state.entities.challenges).filter(c=>c.nominationStatus==='NOMINATED');
 expect(cases).toHaveLength(registered.length);
 const groups=controlStages.flatMap(s=>selectControlCases(cases,s.key));
 expect(groups).toHaveLength(cases.length);
 expect(new Set(groups.map(c=>c.challengeId)).size).toBe(cases.length);
 expect(cases.some(c=>!c.initiativeId&&c.stage==='preparation')).toBe(true);
 for(const c of selectControlCases(cases,'ready')){expect(startReadiness(state,c.initiativeId!,'2026-09-06').ready).toBe(true);expect(latestDecision(state,c.initiativeId!)).toBeUndefined();expect(c.next?.destination.section).toBe('decision');}
 expect(selectControlCases(cases,'ready')).toHaveLength(2);
 expect(selectControlCases(cases,'effects').every(c=>!!latestDecision(state,c.initiativeId!))).toBe(true);
 expect(JSON.stringify(state)).toBe(before);
});
it('godtar granskat prioriteringsunderlag utan att fatta startbeslut',()=>{
 const state=createPresentationDemoState();
 const r=Object.values(state.entities.initiatives).map(i=>startReadiness(state,i.id,'2026-09-06')).find(r=>r.reviewed&&!r.started)!;
 expect(r).toBeDefined();
 r.assessment!.status='ACCEPTED';delete r.assessment!.humanRecommendation;
 expect(startReadiness(state,r.assessment!.initiativeId,'2026-09-06').prioritized).toBe(true);
 r.assessment!.status='OVERRIDDEN';r.assessment!.humanRecommendation='WAIT';
 expect(startReadiness(state,r.assessment!.initiativeId,'2026-09-06').prioritized).toBe(true);
 r.assessment!.humanRecommendation='START';
 expect(startReadiness(state,r.assessment!.initiativeId,'2026-09-06').prioritized).toBe(true);
});
it('hinder pekar på själva kompletteringen eller på förutsättningens ägare',()=>{
 const state=createPresentationDemoState();
 const edge=Object.values(state.entities.dependencies).find(d=>state.entities.executionNodes[d.predecessorNodeId].availabilityStatus!=='AVAILABLE'&&state.entities.executionNodes[d.predecessorNodeId].ownerInitiativeId!==state.entities.executionNodes[d.successorNodeId].ownerInitiativeId)!;
 edge.requiredAt='INITIATIVE_START';
 const cases=controlRoomCases(state,'2026-09-06');
 const requirements=selectControlCases(cases,'hinders').flatMap(c=>c.blockers).filter(b=>b.destination.requirementId);
 expect(requirements.length).toBeGreaterThan(0);
 for(const r of requirements){expect(state.entities.completionRequirements[r.destination.requirementId!].missingItem).toBe(r.label.replace(/^(Komplettera|Verifiera): /,''));expect(r.destination.section).toBe('qualification');}
 const dependency=cases.flatMap(c=>c.blockers).find(b=>b.destination.nodeId)!;
 expect(dependency).toBeDefined();
 expect(dependency.destination.initiativeId).toBe(state.entities.executionNodes[dependency.destination.nodeId!].ownerInitiativeId);
});
it('områdesurval bygger på registrerat deltagande och bevarar huvudradens total',()=>{
 const state=createPresentationDemoState();
 for(const area of Object.values(state.entities.businessAreas)) {
  const cases=controlRoomCases(state,'2026-09-06',area.id);
  expect(cases.every(c=>Object.values(state.entities.participations).some(p=>p.initiativeId===c.initiativeId&&p.businessId&&state.entities.businesses[p.businessId].businessAreaId===area.id))).toBe(true);
  expect(controlStages.reduce((sum,s)=>sum+selectControlCases(cases,s.key).length,0)).toBe(cases.length);
 }
});
