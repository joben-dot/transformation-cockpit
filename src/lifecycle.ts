import { isQualified, qualificationRequirements, type QualificationState } from './scenario'

export type HumanDecision = 'BESLUTAT' | 'UTRED' | 'VÄNTA' | 'STOPPA' | null
export type LifecycleStatus = 'UTMANING' | 'UNDER_KVALIFICERING' | 'KVALIFICERAT_INITIATIV' | 'BESLUTAT_INITIATIV' | 'GENOMFORANDE'

export type Initiative = {
  id: string
  title: string
  problem: string
  area: string
  effect: string
  evidence: string
  time: string
  capacity: number
  risk: string
  scale: string
  members: string
  recommendation: 'STARTA' | 'UTRED' | 'VÄNTA' | 'STOPPA'
  qualification: QualificationState
  selectedForPrioritization: boolean
  decision: HumanDecision
  implementationStatus: 'EJ_STARTAD' | 'PÅGÅR'
}

export const emptyQualification = (): QualificationState =>
  Object.fromEntries(qualificationRequirements.map(requirement => [requirement, false])) as QualificationState

export function lifecycleStatus(initiative: Initiative): LifecycleStatus {
  if (initiative.decision === 'BESLUTAT') {
    return initiative.implementationStatus === 'PÅGÅR' ? 'GENOMFORANDE' : 'BESLUTAT_INITIATIV'
  }
  if (isQualified(initiative.qualification)) return 'KVALIFICERAT_INITIATIV'
  return Object.values(initiative.qualification).some(Boolean) ? 'UNDER_KVALIFICERING' : 'UTMANING'
}

export const qualifiedInitiatives = (initiatives: Initiative[]) =>
  initiatives.filter(initiative => isQualified(initiative.qualification))

export const implementationInitiatives = (initiatives: Initiative[]) =>
  initiatives.filter(initiative => initiative.decision === 'BESLUTAT')

export function updateQualification(initiative: Initiative, qualification: QualificationState): Initiative {
  return { ...initiative, qualification }
}

export function togglePrioritizationSelection(initiative: Initiative): Initiative {
  if (!isQualified(initiative.qualification)) return initiative
  return { ...initiative, selectedForPrioritization: !initiative.selectedForPrioritization }
}

export function recordDecision(initiative: Initiative, decision: HumanDecision): Initiative {
  if (!isQualified(initiative.qualification)) return initiative
  return {
    ...initiative,
    decision,
    implementationStatus: 'EJ_STARTAD',
  }
}
