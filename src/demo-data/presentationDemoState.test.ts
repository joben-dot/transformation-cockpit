import { describe, expect, it } from 'vitest';
import { createPresentationDemoState } from './presentationDemoState';
import { validateDemoState } from './validateDemoData';
import { caseOverview } from '../application/selectors/caseSelectors';
import { activeCommitments, effectOutcome, latestDecision } from '../application/selectors/transformationSelectors';

describe('presentationens sammanhängande exempel',()=>{
  it('har minst två giltiga ärenden per fas och inga framtida historiska handlingar',()=>{
    const state=createPresentationDemoState();
    expect(validateDemoState(state)).toEqual([]);
    const cases=caseOverview(state,'2026-09-06');
    for(const phase of ['UTKAST','REGISTRERAD','BEREDNING','PRIORITERINGSBAR','PAGAENDE','MATNING','AVSLUTAT'])expect(cases.filter(c=>c.step===phase).length,phase).toBeGreaterThanOrEqual(2);
    expect(state.audit.every(a=>a.issuedAt<'2026-09-07')).toBe(true);
    for(const c of cases.filter(c=>['PAGAENDE','MATNING','AVSLUTAT'].includes(c.step))){
      expect(latestDecision(state,c.initiativeId!)).toBeDefined();
      expect(activeCommitments(state,c.initiativeId!)).toHaveLength(1);
    }
    const outcomes=Object.values(state.entities.effectCommitments).map(c=>effectOutcome(state,c,'2026-09-06'));
    expect(outcomes.some(o=>o.realized!==undefined&&o.realized>o.target)).toBe(true);
    expect(outcomes.some(o=>o.qualityMet===false)).toBe(true);
    expect(Object.values(state.entities.measurementPoints).some(m=>!m.verifiedAt)).toBe(true);
  });
});
