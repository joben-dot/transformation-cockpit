import type { IsoDate, IsoDateTime } from "./common";
import {
  createId,
  type CompletionRequirementId,
  type InitiativeId,
  type QualificationAssessmentId,
  type QualificationConfigurationId,
  type RoleAssignmentId,
} from "./ids";

export const qualificationAreas = [
  "STRATEGIC_RELEVANCE",
  "EFFECT_POTENTIAL",
  "FEASIBILITY",
  "ECONOMY_CAPACITY",
  "QUALITY_LEGAL_SECURITY",
  "BUSINESS_CHANGE",
] as const;
export type QualificationArea = (typeof qualificationAreas)[number];
export type QualificationAssessmentStatus =
  | "NOT_ASSESSED"
  | "INCOMPLETE"
  | "SATISFIED"
  | "NOT_SATISFIED"
  | "NOT_APPLICABLE";
export interface QualificationCriterion {
  criterionCode: string;
  qualificationArea: QualificationArea;
  name: string;
  helpText: string;
  mandatory: boolean;
  requiresVerification: boolean;
}
export interface QualificationConfigurationVersion {
  id: QualificationConfigurationId;
  versionNumber: number;
  status: "DRAFT" | "ACTIVE" | "RETIRED";
  criteria: ReadonlyArray<QualificationCriterion>;
  createdAt: IsoDateTime;
  demoAssumption: string;
}
export interface QualificationAssessment {
  id: QualificationAssessmentId;
  initiativeId: InitiativeId;
  qualificationArea: QualificationArea;
  criterionCode: string;
  summary: string;
  status: QualificationAssessmentStatus;
  mandatory: boolean;
  requiresVerification: boolean;
  evidenceRefs: string[];
  assumptions: string[];
  notApplicableRationale?: string;
  assessedByRoleAssignmentId: RoleAssignmentId;
  assessedAt: IsoDateTime;
  verifiedByRoleAssignmentId?: RoleAssignmentId;
  verifiedAt?: IsoDateTime;
  assessedAgainstConfigurationVersion: QualificationConfigurationId;
}
export type CompletionBlock =
  | "QUALIFICATION"
  | "PRIORITIZATION"
  | "START_DECISION";
export type CompletionRequirementStatus =
  | "OPEN"
  | "RESPONSIBILITY_UNASSIGNED"
  | "REQUESTED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "VERIFIED"
  | "REJECTED"
  | "OVERDUE"
  | "NOT_APPLICABLE";
export interface CompletionRequirement {
  id: CompletionRequirementId;
  initiativeId?: InitiativeId;
  challengeId?: import("./ids").ChallengeId;
  qualificationAssessmentId?: QualificationAssessmentId;
  missingItem: string;
  reasonRequired: string;
  blocks: CompletionBlock[];
  responsibleRoleAssignmentId?: RoleAssignmentId;
  deadline?: IsoDate;
  verifierRoleAssignmentId?: RoleAssignmentId;
  status: CompletionRequirementStatus;
  submittedEvidenceRefs: string[];
  resolutionSummary?: string;
  notApplicableRationale?: string;
  createdAt: IsoDateTime;
  completedAt?: IsoDateTime;
  verifiedAt?: IsoDateTime;
}
export const qualificationConfiguration: QualificationConfigurationVersion = {
  id: createId("QualificationConfiguration", "catalog-002"),
  versionNumber: 2,
  status: "ACTIVE",
  criteria: [
    {
      criterionCode: "CLEAR_CHALLENGE",
      qualificationArea: "STRATEGIC_RELEVANCE",
      name: "Tydlig utmaning",
      helpText:
        "Tydlig utmaning behövs för ett spårbart prioriteringsunderlag; om bedömningen saknas förblir området ofullständigt.",
      mandatory: true,
      requiresVerification: false,
    },
    {
      criterionCode: "VERIFIABLE_CURRENT_STATE",
      qualificationArea: "STRATEGIC_RELEVANCE",
      name: "Verifierbart nuläge",
      helpText:
        "Verifierbart nuläge behövs för ett spårbart prioriteringsunderlag; om bedömningen saknas förblir området ofullständigt.",
      mandatory: true,
      requiresVerification: false,
    },
    {
      criterionCode: "DESIRED_END_STATE",
      qualificationArea: "STRATEGIC_RELEVANCE",
      name: "Önskat slutläge",
      helpText:
        "Önskat slutläge behövs för ett spårbart prioriteringsunderlag; om bedömningen saknas förblir området ofullständigt.",
      mandatory: true,
      requiresVerification: false,
    },
    {
      criterionCode: "STRATEGIC_LINK",
      qualificationArea: "STRATEGIC_RELEVANCE",
      name: "Strategisk koppling",
      helpText:
        "Strategisk koppling behövs för ett spårbart prioriteringsunderlag; om bedömningen saknas förblir området ofullständigt.",
      mandatory: true,
      requiresVerification: false,
    },
    {
      criterionCode: "STRATEGIC_HANDLING_REASON",
      qualificationArea: "STRATEGIC_RELEVANCE",
      name: "Motiv för strategisk hantering",
      helpText:
        "Motiv för strategisk hantering behövs för ett spårbart prioriteringsunderlag; om bedömningen saknas förblir området ofullständigt.",
      mandatory: true,
      requiresVerification: false,
    },
    {
      criterionCode: "POSSIBLE_EFFECT_CATEGORIES",
      qualificationArea: "EFFECT_POTENTIAL",
      name: "Möjliga effektkategorier",
      helpText:
        "Möjliga effektkategorier behövs för ett spårbart prioriteringsunderlag; om bedömningen saknas förblir området ofullständigt.",
      mandatory: true,
      requiresVerification: false,
    },
    {
      criterionCode: "ESTIMATED_SCALE",
      qualificationArea: "EFFECT_POTENTIAL",
      name: "Bedömd omfattning",
      helpText:
        "Bedömd omfattning behövs för ett spårbart prioriteringsunderlag; om bedömningen saknas förblir området ofullständigt.",
      mandatory: true,
      requiresVerification: false,
    },
    {
      criterionCode: "EVIDENCE",
      qualificationArea: "EFFECT_POTENTIAL",
      name: "Evidens",
      helpText:
        "Evidens behövs för ett spårbart prioriteringsunderlag; om bedömningen saknas förblir området ofullständigt.",
      mandatory: true,
      requiresVerification: false,
    },
    {
      criterionCode: "ASSUMPTIONS",
      qualificationArea: "EFFECT_POTENTIAL",
      name: "Antaganden",
      helpText:
        "Antaganden behövs för ett spårbart prioriteringsunderlag; om bedömningen saknas förblir området ofullständigt.",
      mandatory: true,
      requiresVerification: false,
    },
    {
      criterionCode: "UNCERTAINTY",
      qualificationArea: "EFFECT_POTENTIAL",
      name: "Osäkerhet",
      helpText:
        "Osäkerhet behövs för ett spårbart prioriteringsunderlag; om bedömningen saknas förblir området ofullständigt.",
      mandatory: true,
      requiresVerification: false,
    },
    {
      criterionCode: "REALIZATION_WINDOW",
      qualificationArea: "EFFECT_POTENTIAL",
      name: "Tidsfönster",
      helpText:
        "Tidsfönster behövs för ett spårbart prioriteringsunderlag; om bedömningen saknas förblir området ofullständigt.",
      mandatory: true,
      requiresVerification: false,
    },
    {
      criterionCode: "PRELIMINARY_RECIPIENTS",
      qualificationArea: "EFFECT_POTENTIAL",
      name: "Preliminära effektmottagare",
      helpText:
        "Preliminära effektmottagare behövs för ett spårbart prioriteringsunderlag; om bedömningen saknas förblir området ofullständigt.",
      mandatory: true,
      requiresVerification: false,
    },
    {
      criterionCode: "DELIVERY_OPTIONS",
      qualificationArea: "FEASIBILITY",
      name: "Möjliga genomförandealternativ",
      helpText:
        "Möjliga genomförandealternativ behövs för ett spårbart prioriteringsunderlag; om bedömningen saknas förblir området ofullständigt.",
      mandatory: true,
      requiresVerification: false,
    },
    {
      criterionCode: "TECHNICAL_PREREQUISITES",
      qualificationArea: "FEASIBILITY",
      name: "Tekniska förutsättningar",
      helpText:
        "Tekniska förutsättningar behövs för ett spårbart prioriteringsunderlag; om bedömningen saknas förblir området ofullständigt.",
      mandatory: true,
      requiresVerification: false,
    },
    {
      criterionCode: "INFORMATION_PREREQUISITES",
      qualificationArea: "FEASIBILITY",
      name: "Informationsmässiga förutsättningar",
      helpText:
        "Informationsmässiga förutsättningar behövs för ett spårbart prioriteringsunderlag; om bedömningen saknas förblir området ofullständigt.",
      mandatory: true,
      requiresVerification: false,
    },
    {
      criterionCode: "ARCHITECTURE_ASSESSMENT",
      qualificationArea: "FEASIBILITY",
      name: "Arkitekturell bedömning",
      helpText:
        "Arkitekturell bedömning behövs för ett spårbart prioriteringsunderlag; om bedömningen saknas förblir området ofullständigt.",
      mandatory: true,
      requiresVerification: false,
    },
    {
      criterionCode: "KNOWN_DEPENDENCIES",
      qualificationArea: "FEASIBILITY",
      name: "Beroenden",
      helpText:
        "Beroenden behövs för ett spårbart prioriteringsunderlag; om bedömningen saknas förblir området ofullständigt.",
      mandatory: true,
      requiresVerification: false,
    },
    {
      criterionCode: "MANAGEMENT_PREREQUISITES",
      qualificationArea: "FEASIBILITY",
      name: "Förvaltningsförutsättningar",
      helpText:
        "Förvaltningsförutsättningar behövs för ett spårbart prioriteringsunderlag; om bedömningen saknas förblir området ofullständigt.",
      mandatory: true,
      requiresVerification: false,
    },
    {
      criterionCode: "OVERALL_FEASIBILITY",
      qualificationArea: "FEASIBILITY",
      name: "Övergripande genomförbarhet",
      helpText:
        "Övergripande genomförbarhet behövs för ett spårbart prioriteringsunderlag; om bedömningen saknas förblir området ofullständigt.",
      mandatory: true,
      requiresVerification: false,
    },
    {
      criterionCode: "PRELIMINARY_COST",
      qualificationArea: "ECONOMY_CAPACITY",
      name: "Preliminär kostnadsbild",
      helpText:
        "Preliminär kostnadsbild behövs för ett spårbart prioriteringsunderlag; om bedömningen saknas förblir området ofullständigt.",
      mandatory: true,
      requiresVerification: false,
    },
    {
      criterionCode: "FUNDING_NEED",
      qualificationArea: "ECONOMY_CAPACITY",
      name: "Finansieringsbehov",
      helpText:
        "Finansieringsbehov behövs för ett spårbart prioriteringsunderlag; om bedömningen saknas förblir området ofullständigt.",
      mandatory: true,
      requiresVerification: false,
    },
    {
      criterionCode: "CAPACITY_NEED",
      qualificationArea: "ECONOMY_CAPACITY",
      name: "Kapacitetsbehov",
      helpText:
        "Kapacitetsbehov behövs för ett spårbart prioriteringsunderlag; om bedömningen saknas förblir området ofullständigt.",
      mandatory: true,
      requiresVerification: false,
    },
    {
      criterionCode: "TIME_TO_FIRST_EFFECT",
      qualificationArea: "ECONOMY_CAPACITY",
      name: "Tid till första möjliga effekt",
      helpText:
        "Tid till första möjliga effekt behövs för ett spårbart prioriteringsunderlag; om bedömningen saknas förblir området ofullständigt.",
      mandatory: true,
      requiresVerification: false,
    },
    {
      criterionCode: "TIME_TO_FULL_EFFECT",
      qualificationArea: "ECONOMY_CAPACITY",
      name: "Tid till full möjlig effekt",
      helpText:
        "Tid till full möjlig effekt behövs för ett spårbart prioriteringsunderlag; om bedömningen saknas förblir området ofullständigt.",
      mandatory: true,
      requiresVerification: false,
    },
    {
      criterionCode: "OPPORTUNITY_COST",
      qualificationArea: "ECONOMY_CAPACITY",
      name: "Alternativkostnad eller undanträngning",
      helpText:
        "Alternativkostnad eller undanträngning behövs för ett spårbart prioriteringsunderlag; om bedömningen saknas förblir området ofullständigt.",
      mandatory: true,
      requiresVerification: false,
    },
    {
      criterionCode: "QUALITY",
      qualificationArea: "QUALITY_LEGAL_SECURITY",
      name: "Kvalitet",
      helpText:
        "Kvalitet behövs för ett spårbart prioriteringsunderlag; om bedömningen saknas förblir området ofullständigt.",
      mandatory: true,
      requiresVerification: false,
    },
    {
      criterionCode: "LEGAL_REQUIREMENTS",
      qualificationArea: "QUALITY_LEGAL_SECURITY",
      name: "Rättsliga krav",
      helpText:
        "Rättsliga krav behövs för ett spårbart prioriteringsunderlag; om bedömningen saknas förblir området ofullständigt.",
      mandatory: true,
      requiresVerification: true,
    },
    {
      criterionCode: "INFORMATION_SECURITY",
      qualificationArea: "QUALITY_LEGAL_SECURITY",
      name: "Informationssäkerhet",
      helpText:
        "Informationssäkerhet behövs för ett spårbart prioriteringsunderlag; om bedömningen saknas förblir området ofullständigt.",
      mandatory: true,
      requiresVerification: true,
    },
    {
      criterionCode: "DATA_PROTECTION",
      qualificationArea: "QUALITY_LEGAL_SECURITY",
      name: "Dataskydd",
      helpText:
        "Dataskydd behövs för ett spårbart prioriteringsunderlag; om bedömningen saknas förblir området ofullständigt.",
      mandatory: true,
      requiresVerification: true,
    },
    {
      criterionCode: "SAFEGUARDS",
      qualificationArea: "QUALITY_LEGAL_SECURITY",
      name: "Skyddsmått",
      helpText:
        "Skyddsmått behövs för ett spårbart prioriteringsunderlag; om bedömningen saknas förblir området ofullständigt.",
      mandatory: true,
      requiresVerification: false,
    },
    {
      criterionCode: "AUTHORIZED_VERIFICATION_NEED",
      qualificationArea: "QUALITY_LEGAL_SECURITY",
      name: "Behov av behörig verifiering",
      helpText:
        "Behov av behörig verifiering behövs för ett spårbart prioriteringsunderlag; om bedömningen saknas förblir området ofullständigt.",
      mandatory: true,
      requiresVerification: true,
    },
    {
      criterionCode: "CHANGED_WAYS_OF_WORKING",
      qualificationArea: "BUSINESS_CHANGE",
      name: "Förändrade arbetssätt",
      helpText:
        "Förändrade arbetssätt behövs för ett spårbart prioriteringsunderlag; om bedömningen saknas förblir området ofullständigt.",
      mandatory: true,
      requiresVerification: false,
    },
    {
      criterionCode: "AFFECTED_BUSINESSES",
      qualificationArea: "BUSINESS_CHANGE",
      name: "Berörda verksamheter",
      helpText:
        "Berörda verksamheter behövs för ett spårbart prioriteringsunderlag; om bedömningen saknas förblir området ofullständigt.",
      mandatory: true,
      requiresVerification: false,
    },
    {
      criterionCode: "PRELIMINARY_RECIPIENT_CAPACITY",
      qualificationArea: "BUSINESS_CHANGE",
      name: "Preliminär mottagarkapacitet",
      helpText:
        "Preliminär mottagarkapacitet behövs för ett spårbart prioriteringsunderlag; om bedömningen saknas förblir området ofullständigt.",
      mandatory: true,
      requiresVerification: false,
    },
    {
      criterionCode: "CHANGE_MANAGEMENT_NEED",
      qualificationArea: "BUSINESS_CHANGE",
      name: "Behov av förändringsledning",
      helpText:
        "Behov av förändringsledning behövs för ett spårbart prioriteringsunderlag; om bedömningen saknas förblir området ofullständigt.",
      mandatory: true,
      requiresVerification: false,
    },
    {
      criterionCode: "LOCAL_LEADERSHIP_RESPONSIBILITY",
      qualificationArea: "BUSINESS_CHANGE",
      name: "Behov av lokal ledning och ansvar",
      helpText:
        "Behov av lokal ledning och ansvar behövs för ett spårbart prioriteringsunderlag; om bedömningen saknas förblir området ofullständigt.",
      mandatory: true,
      requiresVerification: false,
    },
    {
      criterionCode: "MEASURABILITY",
      qualificationArea: "BUSINESS_CHANGE",
      name: "Mätbarhet",
      helpText:
        "Mätbarhet behövs för ett spårbart prioriteringsunderlag; om bedömningen saknas förblir området ofullständigt.",
      mandatory: true,
      requiresVerification: false,
    },
  ],
  createdAt: "2026-09-01T08:00:00Z",
  demoAssumption: "Ej beslutad – används endast i demo.",
};
export const qualificationCriteria = qualificationConfiguration.criteria;
