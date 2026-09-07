import type { StrategicChallenge } from "./challenge";
export const challengeFields = {title:"Titel",problemStatement:"Problem och behov",currentState:"Nuläge",strategicHandlingReason:"Varför strategisk hantering?",strategicRelevance:"Strategisk relevans"};
export const businessCaseFields = {purpose:"Syfte",desiredState:"Önskat förändrat läge",scope:"Avgränsning",alternatives:"Alternativ",doNothingConsequence:"Om vi avstår",evidence:"Evidens",assumptions:"Antaganden",uncertainty:"Osäkerhet",timeHorizon:"Tidshorisont",knownPrerequisites:"Kända förutsättningar",knownRisks:"Kända risker"};
export const requiredChallengeKeys = ["title","problemStatement","currentState","strategicHandlingReason"] as const;
export const requiredBusinessCaseKeys = ["purpose","desiredState","scope","alternatives","doNothingConsequence"] as const;
export const challengeDocumentBlockers = (c:StrategicChallenge) => requiredChallengeKeys.filter(k=>!documentTextComplete(c[k])).map(k=>`${challengeFields[k]} behöver färdigställas i utmaningen.`);
export const businessCaseDocumentBlockers = (c:StrategicChallenge) => requiredBusinessCaseKeys.filter(k=>!documentTextComplete(c.businessCase?.[k])).map(k=>`${businessCaseFields[k]} behöver färdigställas i businesscase.`);

export const documentTextComplete = (value?: string) => !!value?.trim() && !/\[[^\]]+\]/.test(value);
