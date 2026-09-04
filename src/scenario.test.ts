import { describe, expect, it } from 'vitest'
import { calculateParticipationScenario, municipalities } from './scenario'

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
})
