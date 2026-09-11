import { businessCaseDocumentBlockers, challengeDocumentBlockers } from "../../domain/caseDocumentRequirements";
import type { ChallengeId, RoleAssignmentId } from "../../domain";
import type { DemoState } from "../demoState";
import { currentEffectPotentials } from "./effectPotentialSelectors";
import { deriveQualificationStatus } from "./qualificationSelectors";
import { capacityStatus } from "./capacitySelectors";
import { prerequisiteGraph, topologicalExecutionOrder, unavailableStartPrerequisites } from "./executionSelectors";
import { costsByOrigin } from "./costSelectors";
import { latestPriorityAssessment, priorityPosition, priorityPositionLabels } from "./prioritySelectors";
import { acceptedCommitment, activeCommitments, commitmentBlockers, effectFollowUp, laterDependencyBlockers, latestDecision, startBlockers } from "./transformationSelectors";

export type FlowStepKey = "material" | "businesscase" | "qualification" | "potential" | "priority" | "conditions" | "commitments" | "decision" | "measurement" | "implementation" | "learning";
export type FlowStatus = "COMPLETE" | "ACTION" | "WAITING";
export interface FlowStep {
  key: FlowStepKey;
  title: string;
  status: FlowStatus;
  summary: string;
  responsibleId?: RoleAssignmentId;
  dueDate?: string;
}

/** Presentation only. Never sets completion flags or substitutes for startBlockers. */
export function caseFlow(state: DemoState, challengeId: ChallengeId, day: string): FlowStep[] {
  const e = state.entities, challenge = e.challenges[challengeId];
  const initiativeId = challenge.relatedInitiativeIds[0];
  const initiative = initiativeId && e.initiatives[initiativeId];
  const challengeComplete = challenge.nominationStatus === "NOMINATED" && !challengeDocumentBlockers(challenge).length;
  const bcComplete = !businessCaseDocumentBlockers(challenge).length;
  const steps: FlowStep[] = [
    {key:"material",title:"Utmaning",status:challengeComplete?"COMPLETE":"ACTION",summary:challengeComplete?"Grunduppgifter registrerade. Businesscase är ett separat nästa dokument.":"Beskriv problem, nuläge och varför utmaningen behöver strategisk hantering.",responsibleId:challenge.initiatorRoleAssignmentId},
    {key:"businesscase",title:"Businesscase",status:bcComplete&&initiative?"COMPLETE":challengeComplete?"ACTION":"WAITING",summary:bcComplete?(initiative?"Businesscase är sparat. Nyttokalkylen ingår i samma steg.":"Underlaget är ifyllt. Registrera initiativet för fortsatt beredning."):"Jämför syfte, önskat läge, avgränsning, alternativ och konsekvensen av att avstå.",responsibleId:challenge.initiatorRoleAssignmentId}
  ];
  if (!initiative) return [...steps, ...([
    ["potential", "Bedömd effektpotential"], ["qualification", "Kvalificering"], ["priority", "Prioritering"],
    ["conditions", "Förutsättningar och körordning"], ["commitments", "Lokala effektåtaganden"],
    ["decision", "Startbeslut"], ["implementation", "Genomförande och förändring"], ["measurement", "Effektuppföljning"], ["learning", "Avslut, lärande och skalning"],
  ] as const).map(([key,title]) => ({ key,title,status:"WAITING" as const,summary:"Nästa steg när ärendet har ett länkat beredningsinitiativ." }))];

  const qualification = deriveQualificationStatus(state, initiative.id);
  const requirements = Object.values(e.completionRequirements).filter(r => (r.challengeId === challengeId || r.initiativeId === initiative.id) && !["VERIFIED","NOT_APPLICABLE"].includes(r.status));
  const qRequirements = requirements.filter(r => r.blocks.includes("QUALIFICATION"));
  const qComplete = qualification.status === "QUALIFIED" && !qRequirements.length;
  const missing = qualification.missingCriterionCodes.length + qRequirements.length;
  const first = [...qRequirements].sort((a,b) => (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999"))[0];
  steps.push({ key:"qualification",title:"Kvalificering",status:qComplete?"COMPLETE":"ACTION",summary:qComplete?"Obligatoriska bedömningar och verifieringar är klara.":`${missing} bedömningar eller kompletteringar återstår.`,responsibleId:first?.status==="SUBMITTED"?first.verifierRoleAssignmentId:first?.responsibleRoleAssignmentId,dueDate:first?.deadline });
  const potentials = currentEffectPotentials(state, initiative.id);
  steps.push({ key:"potential",title:"Bedömd effektpotential",status:potentials.length?"COMPLETE":"ACTION",summary:potentials.length?`${potentials.length} bedömda effekter med antaganden och tidsfönster. Inte bindande åtaganden.`:"Vilken effekt kan initiativet ge? Bedömning saknas.",responsibleId:potentials[0]?.assessedByRoleAssignmentIds[0] });
  const profile = Object.values(e.steeringProfileVersions).find(p => p.status === "ACTIVE");
  const priority = latestPriorityAssessment(state,initiative.id,profile?.id);
  const fresh = priority && potentials.every(p => priority.effectPotentialIds.includes(p.id));
  const reviewed = fresh && ["ACCEPTED","OVERRIDDEN"].includes(priority.status) && qComplete && !requirements.some(r => r.blocks.includes("PRIORITIZATION"));
  steps.push({ key:"priority",title:"Prioritering",status:reviewed?"COMPLETE":qComplete&&potentials.length?"ACTION":"WAITING",summary:priority?`${priority.totalScore} / 100 · ${!fresh?"nyare underlag behöver bedömas":reviewed?(priorityPositionLabels[priorityPosition(priority)!]??"underlaget är granskat"):"granskning återstår"}. Prioritering är inte startbeslut.`:"Prioritering sker när kvalificering och bedömd potential finns.",responsibleId:priority?.reviewedByRoleAssignmentId });
  const graph = prerequisiteGraph(state, initiative.id);
  const blocked = unavailableStartPrerequisites(state, initiative.id);
  const costs = costsByOrigin(state,[initiative.id]).filter(c => c.economicStatus === "ESTIMATE");
  const preparation = Object.values(e.startPreparations).filter(p => p.initiativeId === initiative.id).at(-1);
  const conditionsReviewed = !blocked.length && !laterDependencyBlockers(state,initiative.id,day).length && graph.nodes.length > 0 && topologicalExecutionOrder(state,initiative.id).valid && costs.length > 0 && costs.every(c=>c.sourceRefs.length>0) && capacityStatus(state,initiative.id).every(c=>c.status==="AVAILABLE");
  steps.push({key:"conditions",title:"Förutsättningar och körordning",status:conditionsReviewed?"COMPLETE":"ACTION",summary:blocked.length?`${blocked.length} förutsättningar återstår före start. ${blocked[0].title}.`:`${graph.nodes.length} leveranser · ${costs.length} kostnadsposter. ${conditionsReviewed?"Strukturerade förutsättningar och kostnadsunderlag finns. Samlad prövning görs i beslutspaketet.":"Förutsättningar, kostnadsunderlag eller kapacitet behöver kompletteras."}`,responsibleId:blocked[0]?.responsibleRoleAssignmentId??preparation?.preparedBy,dueDate:blocked[0]?.neededAt});
  const decision = latestDecision(state, initiative.id);
  const commitments = decision ? activeCommitments(state,initiative.id) : Object.values(e.effectCommitments).filter(c => c.initiativeId === initiative.id);
  const recipients = Object.values(e.participations).filter(p => p.initiativeId === initiative.id && p.participantKind === "EFFECT_RECIPIENT" && p.validFrom <= day && (!p.validTo || p.validTo >= day)).flatMap(p => p.businessId ? [p.businessId] : []);
  const accepted = commitments.filter(c => acceptedCommitment(state,c.id) && !commitmentBlockers(state,c,day).length);
  const covered = recipients.filter(id => accepted.some(c => c.recipientBusinessId === id)).length;
  const commitmentComplete = recipients.length > 0 && covered === recipients.length;
  steps.push({key:"commitments",title:"Lokala effektåtaganden",status:commitmentComplete?"COMPLETE":reviewed||commitments.length?"ACTION":"WAITING",summary:recipients.length?`${covered} av ${recipients.length} verksamheter har fullständiga, aktivt accepterade åtaganden.`:"Lokala mål, effektägare och mätplaner ska fastställas av verksamheten.",responsibleId:commitments.find(c => !acceptedCommitment(state,c.id))?.details?.ownerRoleAssignmentId});
  const blockers = preparation ? startBlockers(state,preparation,day) : [];
  steps.push({key:"decision",title:"Startbeslut",status:decision?"COMPLETE":commitmentComplete?"ACTION":"WAITING",summary:decision?`Beslutsversion ${decision.versionNumber} är låst. Ursprungliga värden bevaras.`:preparation?(blockers.length?`${blockers.length} krav återstår. Start är stoppad.`:"Startklart underlag. Ett aktivt mänskligt beslut återstår."):"Start kräver ett komplett beslutspaket och ett mänskligt beslut.",responsibleId:decision?e.humanDecisions[decision.humanDecisionId].decisionMakerRoleAssignmentId:undefined});
  const followUp=effectFollowUp(state,initiative.id,day);
  const {changes,planned,pending,next}=followUp,allVerified=followUp.complete;
  steps.push({key:"implementation",title:"Genomförande och förändring",status:decision&&commitments.length&&!changes.length?"COMPLETE":decision?"ACTION":"WAITING",summary:!decision?"Genomförande kräver startbeslut.":changes.length?`${changes.length} verksamhetsförändringar återstår.`:"Verksamhetsförändringarna är bekräftade. Effektuppföljningen fortsätter.",responsibleId:changes[0]?.details?.changeResponsibleId,dueDate:changes[0]?.details?.changeDueDate});
  steps.push({key:"measurement",title:"Effektuppföljning",status:allVerified?"COMPLETE":decision&&next?.c.details?.changeCompletedAt&&(!!next.point||next.date<=day)?"ACTION":"WAITING",summary:!decision?"Följs upp efter start mot beslutade lokala mål och mättidpunkter.":changes.length&&!next?.c.details?.changeCompletedAt?`${changes.length} verksamhetsförändringar återstår före deras effektmätning.`:`${planned.length-pending.length} av ${planned.length} planerade mätpunkter är verifierade. ${next?.point?"Rapporterat underlag väntar på specialistverifiering.":next&&next.date>day?`Nästa mätning planeras ${next.date}.`:next?"Rapportera nästa mätning.":"Mätplanen är verifierad. Bedöm utfallet och dokumentera lärandet."}`,responsibleId:next&&!next.point?e.measurementPlans[next.c.measurementPlanId].responsibleRoleAssignmentId:undefined,dueDate:next?.date});
  steps.push({key:"learning",title:"Avslut, lärande och skalning",status:initiative.closedAt?"COMPLETE":allVerified?"ACTION":"WAITING",summary:initiative.closedAt?`Avslutat ${initiative.closedAt.slice(0,10)}. Beslut och uppmätt resultat bevaras.`:allVerified?"Dokumentera lärandet och fatta avslutsbeslut. Utebliven effekt ska också bevaras.":"Avslut inväntar verifierad uppföljning. En ny mottagare behöver ett eget effektåtagande."});
  const order:FlowStepKey[]=["material","businesscase","potential","qualification","priority","conditions","commitments","decision","implementation","measurement","learning"];
  return steps.map(s=>decision&&order.indexOf(s.key)<=order.indexOf("decision")?{...s,status:"COMPLETE" as const,summary:`Underlag ingår i beslutsversion ${decision.versionNumber}. Nya ändringar prövas separat.`}:s).sort((a,b)=>order.indexOf(a.key)-order.indexOf(b.key));
}
