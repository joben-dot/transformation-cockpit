export const municipalities = ['Sävsjö', 'Vetlanda', 'Eksjö', 'Aneby', 'Nässjö'] as const
export type Municipality = typeof municipalities[number]

export const initiativeEconomics: Record<Municipality, { benefitHours: number; organizationCostKsek: number; capacity: number }> = {
  Sävsjö: { benefitHours: 1800, organizationCostKsek: 180, capacity: 0.45 },
  Vetlanda: { benefitHours: 2100, organizationCostKsek: 220, capacity: 0.5 },
  Eksjö: { benefitHours: 1600, organizationCostKsek: 170, capacity: 0.4 },
  Aneby: { benefitHours: 1100, organizationCostKsek: 130, capacity: 0.3 },
  Nässjö: { benefitHours: 1800, organizationCostKsek: 200, capacity: 0.45 },
}

const FIXED_COST_KSEK = 1000
const SCALING_COST_PER_PARTICIPANT_KSEK = 80
const HOUR_VALUE_SEK = 450

export function calculateParticipationScenario(participants: Municipality[]) {
  const participantCount = participants.length
  const releasedHours = participants.reduce((sum, name) => sum + initiativeEconomics[name].benefitHours, 0)
  const organizationCostKsek = participants.reduce((sum, name) => sum + initiativeEconomics[name].organizationCostKsek, 0)
  const fixedCostKsek = participantCount ? FIXED_COST_KSEK : 0
  const scalingCostKsek = participantCount * SCALING_COST_PER_PARTICIPANT_KSEK
  const totalCostKsek = fixedCostKsek + organizationCostKsek + scalingCostKsek
  const costPerParticipantKsek = participantCount ? totalCostKsek / participantCount : 0
  const capacity = participants.reduce((sum, name) => sum + initiativeEconomics[name].capacity, 0) + (participantCount ? 0.75 : 0)
  const benefitKsek = releasedHours * HOUR_VALUE_SEK / 1000
  const federatedNetKsek = benefitKsek - totalCostKsek

  // Samverkan är inget eget kriterium. Deltagandet ändrar i stället de värden
  // som matas in i den beslutade effektviktningen.
  const effectScore = Math.max(0, Math.min(100, 50 + federatedNetKsek / 35))
  const capacityScore = Math.max(0, 100 - capacity * 18)
  const priorityScore = participantCount
    ? Math.round(effectScore * .35 + 82 * .20 + (participantCount > 4 ? 70 : 82) * .20 + 85 * .10 + capacityScore * .15)
    : 0

  return { participantCount, releasedHours, organizationCostKsek, fixedCostKsek, scalingCostKsek, totalCostKsek, costPerParticipantKsek, capacity, benefitKsek, federatedNetKsek, priorityScore }
}
