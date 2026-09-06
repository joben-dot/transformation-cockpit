import {
  createId,
  type Capability,
  type DecisionFunction,
  type FundingRuleVersion,
  type FundingSource,
  type SteeringProfileVersion,
} from "../domain";

export const decisionFunctions = [
  {
    id: createId("DecisionFunction", "function-001"),
    name: "Demoforum",
    mandateDescription: "Kan fatta framtida syntetiska beslut",
    demoAssumption: "Ej beslutad – används endast i demo.",
  },
] satisfies DecisionFunction[];
export const capabilities = [
  {
    id: createId("Capability", "capability-001"),
    name: "Processutveckling",
    description: "Förmåga att analysera och förbättra arbetssätt.",
  },
  {
    id: createId("Capability", "capability-002"),
    name: "Informationsanalys",
    description: "Förmåga att strukturera syntetiska informationsflöden.",
  },
] satisfies Capability[];
export const fundingSources = [
  {
    id: createId("FundingSource", "funding-001"),
    name: "Syntetisk utvecklingsram",
    isSynthetic: true,
  },
] satisfies FundingSource[];
export const fundingRuleVersions = [
  {
    id: createId("FundingRuleVersion", "funding-rule-001"),
    fundingSourceId: fundingSources[0].id,
    validFrom: "2026-01-01",
    allocationPrinciple: "Ej beslutad – används endast i demo.",
    status: "DRAFT",
  },
] satisfies FundingRuleVersion[];
export const steeringProfileVersions = [
  {
    id: createId("SteeringProfileVersion", "steering-001"),
    profileName: "Neutral demoprofil",
    versionNumber: 1,
    validFrom: "2026-01-01",
    status: "ACTIVE",
    criteria: [
      {
        code: "EFFECT",
        name: "Effekt",
        description:
          "Hög poäng betyder större relevant potential med avgränsad mottagare och tidsgrund.",
        required: true,
      },
      {
        code: "EVIDENCE",
        name: "Evidens",
        description:
          "Hög poäng betyder starkare och mer verifierbart underlag med lägre osäkerhet.",
        required: true,
      },
      {
        code: "TIME",
        name: "Tid",
        description:
          "Hög poäng betyder kortare tid till möjlig effekt; låg poäng betyder längre ledtid.",
        required: true,
      },
      {
        code: "QUALITY",
        name: "Kvalitet",
        description: "Möjlig kvalitetsförbättring.",
        required: true,
      },
      {
        code: "CAPACITY",
        name: "Kapacitet",
        description:
          "Hög poäng betyder god kapacitetsmatch och låg belastning; låg poäng betyder knapp eller osäker kapacitet.",
        required: true,
      },
    ],
    weights: { EFFECT: 35, EVIDENCE: 20, TIME: 20, QUALITY: 10, CAPACITY: 15 },
    thresholds: { start: 75, investigate: 55, wait: 35 },
    weightSumRule: 100,
    createdAt: "2026-01-01T08:00:00Z",
    demoAssumption: "Ej beslutad – används endast i demo.",
  },
] satisfies SteeringProfileVersion[];
