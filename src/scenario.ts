export const municipalities = ['Sävsjö', 'Vetlanda', 'Eksjö', 'Aneby', 'Nässjö'] as const
export type Municipality = typeof municipalities[number]

export type SteeringProfile = {
  effect: number
  evidence: number
  time: number
  quality: number
  capacity: number
}

export const defaultSteeringProfile: SteeringProfile = {
  effect: 35,
  evidence: 20,
  time: 20,
  quality: 10,
  capacity: 15,
}

export const qualificationRequirements = [
  'Problemdefinition validerad',
  'Omfattning och process kartlagd',
  'Rotorsakshypotes dokumenterad',
  'Baseline verifierad',
  'Processägarens validering',
  'Informationsklassning genomförd',
] as const

export type QualificationState = Record<(typeof qualificationRequirements)[number], boolean>

export const isQualified = (qualification: QualificationState) =>
  qualificationRequirements.every(requirement => qualification[requirement] === true)

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

export function calculatePriorityScore(
  scores: { effect: number; evidence: number; time: number; quality: number; capacity: number },
  weights: SteeringProfile,
) {
  const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0)
  if (!totalWeight) return 0
  return Math.round(Object.keys(weights).reduce((sum, key) => {
    const criterion = key as keyof SteeringProfile
    return sum + scores[criterion] * weights[criterion]
  }, 0) / totalWeight)
}

export function calculateParticipationScenario(
  participants: Municipality[],
  weights: SteeringProfile = defaultSteeringProfile,
  qualified = true,
) {
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
  const localBreakdown = participants.map(municipality => {
    const economics = initiativeEconomics[municipality]
    const benefitKsek = economics.benefitHours * HOUR_VALUE_SEK / 1000
    const allocatedFixedCostKsek = fixedCostKsek / participantCount
    const totalCostKsek = economics.organizationCostKsek + SCALING_COST_PER_PARTICIPANT_KSEK + allocatedFixedCostKsek
    return {
      municipality,
      releasedHours: economics.benefitHours,
      benefitKsek,
      organizationCostKsek: economics.organizationCostKsek,
      scalingCostKsek: SCALING_COST_PER_PARTICIPANT_KSEK,
      allocatedFixedCostKsek,
      totalCostKsek,
      netEffectKsek: benefitKsek - totalCostKsek,
    }
  })

  // Deltagande ändrar endast initiativets faktiska effekt- och kapacitetsvärden.
  // Det finns ingen deltagarfaktor, samverkansvikt eller förmågebonus i poängen.
  const scores = {
    effect: Math.max(0, Math.min(100, 50 + federatedNetKsek / 35)),
    evidence: 82,
    time: 82,
    quality: 85,
    capacity: Math.max(0, 100 - capacity * 18),
  }
  const priorityScore = participantCount && qualified ? calculatePriorityScore(scores, weights) : 0

  return { participantCount, releasedHours, organizationCostKsek, fixedCostKsek, scalingCostKsek, totalCostKsek, costPerParticipantKsek, capacity, benefitKsek, federatedNetKsek, localBreakdown, priorityScore }
}
