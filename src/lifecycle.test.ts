import { describe, expect, it } from 'vitest'
import { emptyQualification, implementationInitiatives, lifecycleStatus, qualifiedInitiatives, recordDecision, togglePrioritizationSelection, updateQualification, type Initiative } from './lifecycle'
import { qualificationRequirements, type QualificationState } from './scenario'

const complete = Object.fromEntries(qualificationRequirements.map(requirement => [requirement, true])) as QualificationState
const challenge = (): Initiative => ({
  id: 'utmaning-1', title: 'En utmaning', problem: 'Ett problem', area: 'Process', effect: '10 tim/år', evidence: 'Medel', time: '3 mån', capacity: 1, risk: 'Låg', scale: 'Medel', members: '1/5', recommendation: 'UTRED', qualification: emptyQualification(), selectedForPrioritization: false, decision: null, implementationStatus: 'EJ_STARTAD',
})

describe('initiativets sammanhängande livscykel', () => {
  it('behåller samma id från utmaning via kvalificering till genomförande', () => {
    const qualified = updateQualification(challenge(), complete)
    const decided = recordDecision(qualified, 'BESLUTAT')
    expect(qualified.id).toBe('utmaning-1')
    expect(implementationInitiatives([decided])[0].id).toBe('utmaning-1')
  })

  it('gör inte ett okvalificerat objekt valbart', () => {
    const item = challenge()
    expect(togglePrioritizationSelection(item)).toBe(item)
    expect(qualifiedInitiatives([item])).toEqual([])
  })

  it('visar samma kvalificerade objekt och låter urval vara skilt från beslut', () => {
    const qualified = updateQualification(challenge(), complete)
    const selected = togglePrioritizationSelection(qualified)
    expect(qualifiedInitiatives([selected])[0].id).toBe(qualified.id)
    expect(selected.selectedForPrioritization).toBe(true)
    expect(selected.decision).toBeNull()
    expect(togglePrioritizationSelection(selected).decision).toBeNull()
  })

  it('behåller kvalificerade utan beslut i lägesbilden men inte i genomförande', () => {
    const qualified = updateQualification(challenge(), complete)
    expect(lifecycleStatus(qualified)).toBe('KVALIFICERAT_INITIATIV')
    expect(qualifiedInitiatives([qualified])).toHaveLength(1)
    expect(implementationInitiatives([qualified])).toHaveLength(0)
  })

  it('kräver ett explicit genomförandebeslut och bevarar status på objektet', () => {
    const qualified = updateQualification(challenge(), complete)
    expect(implementationInitiatives([recordDecision(qualified, 'UTRED')])).toEqual([])
    const decided = recordDecision(qualified, 'BESLUTAT')
    expect(decided.qualification).toBe(qualified.qualification)
    expect(decided.decision).toBe('BESLUTAT')
    expect(decided.implementationStatus).toBe('EJ_STARTAD')
    expect(decided.implementationStatus).not.toBe('PÅGÅR')
    expect(implementationInitiatives([decided])[0]).toBe(decided)
  })
})
