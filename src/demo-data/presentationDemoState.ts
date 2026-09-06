import { initializeDemoState } from "../application/initializeDemoState";
import { demoReducer } from "../application/demoReducer";
import type { Command } from "../application/commands";
import type { DemoState } from "../application/demoState";
import { createId, type InitiativeId, type RoleAssignmentId } from "../domain";
import { referenceCommitment } from "./referenceCommitment";
import { roleAssignments } from "./peopleAndRoles";
import { stage2Ids } from "./stage2DemoData";

// Presentation fixtures have their own histories. Never alter a snapshot after a decision.
// The compact domain fixture stays independent for command-level regression tests.
function transform(value: unknown, visit: (s: string, key: string) => string, key = ""): unknown {
  if (typeof value === "string") return visit(value, key);
  if (Array.isArray(value)) return value.map(v => transform(v, visit, key));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k,v]) => [k,transform(v,visit,k)]));
  return value;
}
const recordedDates = new Set(["createdAt","assessedAt","verifiedAt","reviewedAt","completedAt"]);
const plainText = (s: string) => s.replace("Underlaget är helt syntetiskt.","Underlagets antaganden behöver prövas lokalt.").replace(/\b[Ss]yntetisk(?:a|t)? /g, "").replace(/\b[Ff]iktiv(?:a|t)? /g, "");

export function createPresentationDemoState(): DemoState {
  let state = transform(initializeDemoState(), (s,key) => {
    if (recordedDates.has(key) && s > "2026-09-01" && /^2026-/.test(s)) return "2026-09-01T08:00:00Z";
    return plainText(s);
  }) as DemoState;
  state.entities.transformationGovernance["GOVERNANCE-DEMO-1"].createdAt="2026-01-01T08:00:00Z";
  const names = ["Alex Berg","Robin Lind","Kim Lund","Sam Holm"];
  Object.values(state.entities.people).forEach((p,i) => {p.displayName=names[i]??`Lou Andersson ${i}`;});
  Object.values(state.entities.participations).forEach(p => { if(p.validFrom>"2026-09-01")p.validFrom="2026-09-01"; });
  let sequence=0;
  const specialist=roleAssignments[1].id, decision=roleAssignments[2].id, operator=roleAssignments[0].id;
  const meta=(actor:RoleAssignmentId=specialist,date="2026-01-26")=>({commandId:createId("Command",`example-${++sequence}`),actorRoleAssignmentId:actor,issuedAt:`${date}T12:00:00Z`});
  const apply=(command:Command)=>{const result=demoReducer(state,command);if(!result.success)throw new Error(`${command.commandType}: ${result.errors.map(e=>e.description).join(" | ")}`);state=result.nextState;};
  const source=stage2Ids.overriddenInitiative;
  const sourceChallenge=state.entities.initiatives[source].challengeId;
  const template=structuredClone(state.entities);
  const cloneCase=(slug:string,title:string,metric:string):InitiativeId=>{
    const tables=template as unknown as Record<string,Record<string,Record<string,unknown>>>;
    const selected=Object.entries(tables).flatMap(([table,rows])=>Object.entries(rows).filter(([id,row])=>id===source||id===sourceChallenge||row.initiativeId===source||row.ownerInitiativeId===source).map(([id,row])=>({table,id,row})));
    const ids=new Map(selected.map(({id})=>[id,`${id}-${slug}`]));
    for(const {table,id,row} of selected){
      const copy=transform(row,(s,key)=>ids.get(s)??(recordedDates.has(key)?"2026-01-22T08:00:00Z":key==="validFrom"?"2026-01-22":s)) as Record<string,unknown>;
      (state.entities as unknown as typeof tables)[table][ids.get(id)!]=copy;
    }
    const id=ids.get(source) as InitiativeId, initiative=state.entities.initiatives[id],challenge=state.entities.challenges[initiative.challengeId];
    initiative.title=title;initiative.purpose=`Förändra arbetssättet för ${metric.toLocaleLowerCase("sv-SE")}.`;initiative.desiredEndState=`Verksamheten följer ${metric.toLocaleLowerCase("sv-SE")} mot beslutad baseline.`;
    initiative.scope="En mottagande verksamhet med egen effektägare och avsatt införandekapacitet.";
    challenge.title=title;challenge.problemStatement=`Dagens arbetssätt ger onödigt arbete och osäker uppföljning av ${metric.toLocaleLowerCase("sv-SE")}.`;challenge.currentState="Kartläggning av föregående års arbetssätt och resursanvändning är genomförd.";
    if(challenge.businessCase)Object.assign(challenge.businessCase,{purpose:initiative.purpose,desiredState:initiative.desiredEndState,scope:initiative.scope,evidence:`Kartläggning och underlag för ${title.toLocaleLowerCase("sv-SE")}.`,timeHorizon:"2026",knownPrerequisites:"Befintliga verksamhetssystem och åtkomster är kontrollerade. Införande och utbildning återstår."});
    for(const p of Object.values(state.entities.effectPotentials).filter(p=>p.initiativeId===id)){p.seriesId+=`-${slug}`;p.evidenceRefs=[`Kartläggning: ${title}`];p.assumptions=["Avsatt tid för införande och lokalt förändringsansvar."];p.assessedAt="2026-01-22T08:00:00Z";}
    for(const n of Object.values(state.entities.executionNodes).filter(n=>n.ownerInitiativeId===id)){n.title=`Införande: ${title}`;n.description=initiative.purpose;n.plannedPeriod={from:"2026-02-01",to:"2026-03-31"};n.neededAt="2026-03-31";n.responsibleRoleAssignmentId=operator;}
    for(const c of Object.values(state.entities.costEntries).filter(c=>c.initiativeId===id)){c.originReference+=`-${slug}`;c.sourceRefs=[`Införandekalkyl: ${title}`];}
    const a=Object.values(state.entities.priorityAssessments).find(a=>a.initiativeId===id)!;
    a.status="CALCULATED";
    delete a.reviewedAt;delete a.reviewedByPersonId;delete a.reviewedByRoleAssignmentId;delete a.reviewMandateId;delete a.humanRationale;delete a.humanRecommendation;
    return id;
  };
  const examples = [
    {slug:"inkop",title:"Samordnade inköp av förbrukningsmaterial",metric:"Årlig kostnad för förbrukningsmaterial",category:"MONEY",baseline:900000,target:680000,value:700000,phase:"ongoing"},
    {slug:"bemanning",title:"Mindre dubbelarbete i bemanningsplaneringen",metric:"Tid för manuell bemanningsplanering",category:"RELEASED_TIME",baseline:1800,target:1100,value:1200,phase:"ongoing"},
    {slug:"bokning",title:"Effektivare bokning av gemensamma lokaler",metric:"Tid för lokalbokning och rättningar",category:"RELEASED_TIME",baseline:1200,target:800,value:930,phase:"measuring"},
    {slug:"ansokan",title:"Fler kompletta ansökningar från början",metric:"Andel kompletta ansökningar vid första kontakt",category:"QUALITY",baseline:62,target:85,value:79,phase:"unverified"},
    {slug:"licens",title:"Rätt antal licenser i verksamheten",metric:"Årlig kostnad för verksamhetslicenser",category:"MONEY",baseline:600000,target:420000,value:400000,phase:"closed"},
    {slug:"aterkoppling",title:"Tydligare återkoppling efter serviceärenden",metric:"Andel ärenden med återkoppling inom två dagar",category:"QUALITY",baseline:65,target:90,value:82,phase:"closed"},
  ] as const;
  for(const ex of examples){
    const id=cloneCase(ex.slug,ex.title,ex.metric),commitmentId=createId("EffectCommitment",`example-${ex.slug}`),b=state.entities.businesses[referenceCommitment.businessId];
    const money=ex.category==="MONEY",quality=ex.category==="QUALITY",ongoing=ex.phase==="ongoing",closed=ex.phase==="closed";
    const unit=money?"SEK/år":quality?"procent":"timmar/år";
    for(const n of Object.values(state.entities.executionNodes).filter(n=>n.ownerInitiativeId===id)){n.neededAt=ongoing?"2026-09-30":"2026-03-31";n.plannedPeriod={from:"2026-02-02",to:n.neededAt};}
    const fullDate=closed?"2026-08-31":"2026-12-31";
    const dates=ongoing?["2026-10-31",fullDate]:["2026-06-30",fullDate];
    for(const p of Object.values(state.entities.effectPotentials).filter(p=>p.initiativeId===id))Object.assign(p,{category:ex.category,unit:quality?"procentenheter":unit,effectMeasureCode:ex.metric,lowerBound:Math.round(Math.abs(ex.target-ex.baseline)*0.7),expectedValue:Math.abs(ex.target-ex.baseline),upperBound:Math.round(Math.abs(ex.target-ex.baseline)*1.2),earliestPossibleEffectDate:dates[0],fullPotentialDate:fullDate,realizationWindow:"Införande och lokal uppföljning under 2026"});
    const a=Object.values(state.entities.priorityAssessments).find(a=>a.initiativeId===id)!;
    apply({...meta(decision,"2026-01-23"),commandType:"REVIEW_PRIORITY_ASSESSMENT",targetId:a.id,payload:{rationale:"Underlaget är granskat inför beslut. Lokalt åtagande och startkrav prövas separat."}});
    const details={...referenceCommitment.details,category:ex.category,metricName:ex.metric,scope:state.entities.initiatives[id].scope,changeDescription:`Inför rutinen för ${ex.title.toLocaleLowerCase("sv-SE")} och utbilda berörda medarbetare.`,changeDueDate:ongoing?"2026-09-30":"2026-03-31",receiverCapacity:"Processansvarig: 8 timmar per månad. Två utbildningstillfällen är avsatta.",measurementDates:dates,fullEffectDate:fullDate,effectWindow:{from:"2026-01-01",to:"2026-12-31"},baselineReference:`Fastställd nulägeskartläggning 2026-01-15: ${ex.metric}.`,qualitySafeguard:"Tillgänglig service och korrekt handläggning",qualityLimit:"Minst 95 procent korrekt hanterade ärenden",annualFinancialEffect:money?[{year:2026,amount:closed?150000:60000}]:undefined};
    apply({...meta(),commandType:"SAVE_EFFECT_COMMITMENT",targetId:commitmentId,payload:{...referenceCommitment,initiativeId:id,baseline:ex.baseline,target:ex.target,baselineDate:"2026-01-15",baselineVerified:true,unit,direction:quality?"HIGHER_IS_BETTER":"LOWER_IS_BETTER",dataSource:`Verksamhetens uppföljningsuttag: ${ex.metric}`,details}});
    apply({...meta(details.ownerRoleAssignmentId,"2026-01-27"),commandType:"ACCEPT_EFFECT_COMMITMENT",targetId:commitmentId,payload:{accepted:true,mandateDescription:"Lokalt verksamhetsmandat för denna förändring, resursanvändning och mätplan."}});
    apply({...meta(specialist,"2026-01-28"),commandType:"ADD_PARTICIPATION",targetId:createId("Participation",`example-recipient-${ex.slug}`),payload:{initiativeId:id,businessId:b.id,organizationId:b.organizationId,participantKind:"EFFECT_RECIPIENT",validFrom:"2026-01-28"}});
    const packageId=`example-package-${ex.slug}`;
    apply({...meta(specialist,"2026-01-29"),commandType:"SAVE_START_PREPARATION",targetId:packageId,payload:{initiativeId:id,recipientBusinessIds:[b.id],commitmentIds:[commitmentId],priorityAssessmentId:a.id,steeringProfileVersionId:a.steeringProfileVersionId,governanceVersionId:"GOVERNANCE-DEMO-1",fundingReference:"120 000 SEK avsatta för införande och utbildning.",capacityReference:details.receiverCapacity,legalReference:"Åtkomst, informationshantering och tillämpliga krav har bedömts i underlaget.",qualityReference:details.qualityLimit,prerequisitesReview:"Befintliga system och åtkomster är kontrollerade. Inga olösta externa startberoenden.",economicRationale:money?"Införandekostnad jämförs med uttrycklig effektplan för 2026. Årstakt hålls separat; delårets netto och långsiktig förbättring ingår i bedömningen.":"Införandet finansieras som en kvalitets- eller kapacitetsförbättring. Tid och kvalitet omvandlas inte automatiskt till budgetbesparing.",costHorizon:{from:"2026-01-01",to:"2026-12-31"}}});
    apply({...meta(decision,"2026-02-02"),commandType:"DECIDE_TRANSFORMATION",targetId:`example-start-${ex.slug}`,payload:{preparationId:packageId,accepted:true,rationale:"Lokalt åtagande accepterat, resurser avsatta och startkrav prövade. Startbeslut inom angivet mandat.",type:"START"}});
    apply({...meta(operator,"2026-02-03"),commandType:"RECORD_EFFECT_FORECAST",targetId:`example-forecast-${ex.slug}`,payload:{commitmentId,date:fullDate,value:ex.value}});
    if(ongoing)continue;
    apply({...meta(operator,"2026-03-31"),commandType:"CONFIRM_BUSINESS_CHANGE",targetId:commitmentId,payload:{date:"2026-03-31",evidence:"Rutinen används av berörda medarbetare. Införandelogg och utbildningsnärvaro är kontrollerade."}});
    for(const date of closed?dates:[dates[0]]){
      apply({...meta(operator,date),commandType:"RECORD_EFFECT_MEASUREMENT",targetId:`example-measure-${ex.slug}-${date}`,payload:{commitmentId,date,value:ex.value,evidence:`Uppföljningsuttag ${date}, avstämt mot samma avgränsning som baseline.`,qualityObservation:ex.slug==="aterkoppling"?"93 procent korrekt hanterade ärenden; skyddsmåttet missas.":"97 procent korrekt hanterade ärenden; skyddsmåttet uppfylls.",qualityMet:ex.slug!=="aterkoppling"}});
      const planId=state.entities.effectCommitments[commitmentId].measurementPlanId;
      const point=Object.values(state.entities.measurementPoints).find(m=>m.measurementPlanId===planId&&m.measuredAt===date)!;
      if(ex.phase!=="unverified")apply({...meta(specialist,date),commandType:"VERIFY_EFFECT_MEASUREMENT",targetId:point.id,payload:{accepted:true}});
    }
    if(closed)apply({...meta(decision,"2026-09-01"),commandType:"COMPLETE_TRANSFORMATION",targetId:id,payload:{observation:quality?"Målet och kvalitetsgränsen missades. Förbättra rutinen och pröva kapaciteten före skalning.":"Målet överträffades. Återanvänd metoden; varje ny verksamhet måste fatta eget effektåtagande.",evidence:"Verifierade mätpunkter och dokumenterad genomgång med lokal effektägare."}});
  }
  // Two preparation cases also expose incomplete local commitments: no acceptance or start is implied.
  apply({...meta(specialist,"2026-09-02"),commandType:"SAVE_EFFECT_COMMITMENT",targetId:createId("EffectCommitment","example-contract-draft"),payload:{...referenceCommitment,baselineVerified:false}});
  apply({...meta(specialist,"2026-09-02"),commandType:"SAVE_EFFECT_COMMITMENT",targetId:createId("EffectCommitment","example-service-draft"),payload:{...referenceCommitment,initiativeId:stage2Ids.acceptedInitiative,baseline:72,target:76,baselineVerified:true,unit:"procent",direction:"HIGHER_IS_BETTER",dataSource:"Verksamhetens ärendegranskning: rätt vid första kontakt.",details:{...referenceCommitment.details,category:"QUALITY",metricName:"Andel rätt hanterade ärenden vid första kontakt",scope:"Ärenden i den gemensamma servicevägen.",changeDescription:"Inför gemensam vägledning och kunskapsstöd i första kontakten.",baselineReference:"Genomgång av ärendeurval juni 2026.",annualFinancialEffect:undefined}}});
  // Early phases deliberately have no initiative or binding effect target yet.
  const early=[
    ["enklare-kontakt","Enklare väg till rätt kontakt","DRAFT"],
    ["information","Samlad information inför skolstart","DRAFT"],
    ["resor","Bättre samordning av verksamhetsresor","NOMINATED"],
    ["energi","Minskad energianvändning i verksamhetslokaler","NOMINATED"],
  ] as const;
  early.forEach(([slug,title,status])=>{
    const id=createId("Challenge",`example-${slug}`);
    state.entities.challenges[id]={id,title,problemStatement:"Arbetet sker i separata rutiner och behöver kartläggas tillsammans med berörd verksamhet.",currentState:"Inledande beskrivning finns. Omfattning och nuläge behöver fördjupas.",source:"Verksamhetens utvecklingsdialog",initiatorRoleAssignmentId:operator,strategicRelevance:"Gemensam service och bättre användning av resurser.",strategicHandlingReason:"Flera funktioner behöver samverka och pröva gemensamma förutsättningar.",nominationStatus:status,relatedInitiativeIds:[],createdAt:"2026-09-01T08:00:00Z"};
    const requirementId=createId("CompletionRequirement",`example-${slug}`);
    state.entities.completionRequirements[requirementId]={id:requirementId,challengeId:id,missingItem:"Avgränsa problemet och dokumentera nuläget",reasonRequired:"Behövs för att pröva strategisk relevans och möjlig effekt.",blocks:["QUALIFICATION"],status:"OPEN",responsibleRoleAssignmentId:operator,verifierRoleAssignmentId:specialist,deadline:"2026-09-18",submittedEvidenceRefs:[],createdAt:"2026-09-01T08:00:00Z"};
  });
  state.audit.sort((a,b)=>a.issuedAt.localeCompare(b.issuedAt));
  return state;
}
