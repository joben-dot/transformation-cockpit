import { describe, expect, it } from 'vitest'
import { calculateParticipationScenario, calculatePriorityScore, defaultSteeringProfile, isQualified, municipalities, qualificationRequirements, type QualificationState } from './scenario'

describe('deltagarscenario', () => {
  it('behåller den fasta kostnaden när en kommun lämnar och fördelar den på kvarvarande deltagare', () => {
    const five = calculateParticipationScenario([...municipalities])
    const four = calculateParticipationScenario(municipalities.filter(name => name !== 'Aneby'))
    expect(five.fixedCostKsek).toBe(1000)
    expect(four.fixedCostKsek).toBe(1000)
    expect(four.scalingCostKsek).toBe(five.scalingCostKsek - 80)
    expect(four.organizationCostKsek).toBe(five.organizationCostKsek - 130)
    expect(four.costPerParticipantKsek).toBeGreaterThan(five.costPerParticipantKsek)
  })

  it('räknar om nytta, kapacitet, nettoeffekt och prioriteringspoäng', () => {
    const five = calculateParticipationScenario([...municipalities])
    const four = calculateParticipationScenario(municipalities.slice(0, 4))
    expect(four.releasedHours).toBeLessThan(five.releasedHours)
    expect(four.capacity).toBeLessThan(five.capacity)
    expect(four.federatedNetKsek).not.toBe(five.federatedNetKsek)
    expect(four.priorityScore).not.toBe(five.priorityScore)
  })

  it('modellerar ingen alternativkostnad för kommuner som står utanför', () => {
    expect(calculateParticipationScenario([])).toMatchObject({ totalCostKsek: 0, releasedHours: 0, federatedNetKsek: 0, priorityScore: 0 })
  })

  it('använder aldrig participantCount som direkt prioriteringsfaktor', () => {
    const scores = { effect: 73, evidence: 82, time: 82, quality: 85, capacity: 61 }
    expect(calculatePriorityScore(scores, defaultSteeringProfile)).toBe(76)
    expect(calculatePriorityScore).toHaveLength(2)
  })

  it('räknar prioriteringspoängen med den gemensamma styrprofilen', () => {
    const effectOnly = { effect: 100, evidence: 0, time: 0, quality: 0, capacity: 0 }
    expect(calculateParticipationScenario([...municipalities], effectOnly).priorityScore).not.toBe(
      calculateParticipationScenario([...municipalities], defaultSteeringProfile).priorityScore,
    )
  })

  it('kräver exakt de sex synliga kvalificeringskraven', () => {
    const qualification = Object.fromEntries(qualificationRequirements.map(requirement => [requirement, true])) as QualificationState
    expect(isQualified(qualification)).toBe(true)
    qualification['Baseline verifierad'] = false
    expect(isQualified(qualification)).toBe(false)
    expect(calculateParticipationScenario([...municipalities], defaultSteeringProfile, false).priorityScore).toBe(0)
  })
})
