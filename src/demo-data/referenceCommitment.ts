import { createId } from "../domain";
import { businessIds } from "./organizations";
import { roleAssignments } from "./peopleAndRoles";
import { stage2Ids } from "./stage2DemoData";
import type { TransformationCommand } from "../application/transformationCommands";

/** Entirely invented preparation data. Loading it does not accept or decide anything. */
export const referenceCommitment: Extract<TransformationCommand,{commandType:"SAVE_EFFECT_COMMITMENT"}>["payload"]={
  initiativeId:stage2Ids.overriddenInitiative,businessId:businessIds.intake,
  baseline:600000,target:420000,baselineDate:"2026-06-30",baselineVerified:false,unit:"SEK/år",direction:"LOWER_IS_BETTER",
  dataSource:"Syntetisk ekonomirapport: årlig kostnad för ej nyttjade avtal. Samma urval används vid varje mätning.",measurementResponsibleId:roleAssignments[0].id,
  details:{category:"MONEY",annualFinancialEffect:[{year:2027,amount:150000}],metricName:"Kostnad för ej nyttjade avtal",scope:"Fiktiva avtal inom verksamhet Inlopp, samma avtalsurval under mätperioden.",changeDescription:"Inför månatlig avtalsgenomgång och aktiv uppsägning av avtal som inte används.",changeResponsibleId:roleAssignments[0].id,changeDueDate:"2026-12-31",receiverCapacity:"Verksamheten avsätter en avtalsansvarig 4 timmar per månad samt 2 utbildningstillfällen.",measurementDates:["2027-06-30","2027-12-31"],fullEffectDate:"2027-12-31",effectWindow:{from:"2027-01-01",to:"2027-12-31"},ownerRoleAssignmentId:createId("RoleAssignment","effect-owner-0"),baselineReference:"Fiktivt baselineunderlag: avtalsinventering juni 2026.",qualitySafeguard:"Andel kritiska tjänster med giltigt avtal",qualityLimit:"100 procent; inga kritiska tjänster får sakna avtal."}
};
