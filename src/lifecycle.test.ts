import { describe, expect, it } from 'vitest'
import { createInitiative, emptyQualification, implementationInitiatives, lifecycleStatus, qualifiedInitiatives, recordDecision, togglePrioritizationSelection, updateParticipants, updateQualification, type Initiative } from './lifecycle'
import { qualificationRequirements, type QualificationState } from './scenario'

const complete = Object.fromEntries(qualificationRequirements.map(requirement => [requirement, true])) as QualificationState
const challenge = (): Initiative => ({
  id: 'utmaning-1', initiator: 'Sävsjö', participants: ['Sävsjö'], isDemo: true, title: 'En utmaning', problem: 'Ett problem', area: 'Process', effect: '10 tim/år', evidence: 'Medel', time: '3 mån', capacity: 1, risk: 'Låg', scale: 'Medel', members: '1/5', recommendation: 'UTRED', qualification: emptyQualification(), selectedForPrioritization: false, decision: null, implementationStatus: 'EJ_STARTAD',
})

describe('initiativets sammanhängande livscykel', () => {
  it('skapar en ny utmaning med verkligt ursprung utan ärvd demo-information', () => {
    const item = createInitiative('UTM-005', 'Egen titel', 'Egen problemtext', 'Sävsjö')
    expect(item).toMatchObject({ id: 'UTM-005', title: 'Egen titel', problem: 'Egen problemtext', initiator: 'Sävsjö', participants: [], isDemo: false })
    expect(item.effect).toBe('Tas fram under kvalificeringen')
    expect(item.evidence).toBe('Underlag saknas')
    expect(item.qualification).toEqual(emptyQualification())
  })

  it('låter checkbox-urval vara skilt från aktiv identitet och beslut', () => {
    const activeId = 'UTM-A'
    const a = { ...updateQualification(challenge(), complete), id: activeId }
    const b = { ...updateQualification(challenge(), complete), id: 'UTM-B', selectedForPrioritization: true }
    const toggledB = togglePrioritizationSelection(b)
    expect(activeId).toBe('UTM-A')
    expect(toggledB.decision).toBeNull()
    expect(a.decision).toBeNull()
  })

  it('sparar beslut på explicit fokuserat objekt och inte ett annat markerat objekt', () => {
    const a = { ...updateQualification(challenge(), complete), id: 'UTM-A', selectedForPrioritization: true }
    const b = { ...updateQualification(challenge(), complete), id: 'UTM-B' }
    const items = [a, b].map(item => item.id === 'UTM-B' ? recordDecision(item, 'BESLUTAT') : item)
    expect(items[0].decision).toBeNull()
    expect(items[1]).toMatchObject({ id: 'UTM-B', decision: 'BESLUTAT', implementationStatus: 'EJ_STARTAD' })
    expect(implementationInitiatives(items).map(item => item.id)).toEqual(['UTM-B'])
  })

  it('isolerar deltagande per initiativ och påverkar inte identitet eller livscykelmetadata', () => {
    const a = { ...challenge(), id: 'UTM-A', participants: ['Sävsjö'] }
    const b = { ...challenge(), id: 'UTM-B', participants: ['Eksjö'] }
    const changedA = updateParticipants(a as Initiative, ['Sävsjö', 'Vetlanda'])
    expect(changedA.participants).toEqual(['Sävsjö', 'Vetlanda'])
    expect(b.participants).toEqual(['Eksjö'])
    expect(changedA).toMatchObject({ id: 'UTM-A', initiator: a.initiator, qualification: a.qualification, decision: a.decision })
  })

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
