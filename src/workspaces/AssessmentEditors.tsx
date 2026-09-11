import { useState } from "react";
import { PriorityCriteria } from "./PriorityCriteria";
import { useSessionDraft } from "./SessionDrafts";
import type { Command, CommandResult, DemoState } from "../application";
import { createId, type InitiativeId, type PotentialCategory, type RoleAssignmentId } from "../domain";
import { RoleSelect } from "./transformationUi";
import { currentEffectPotentials } from "../application/selectors/effectPotentialSelectors";
import { latestPriorityAssessment, priorityEligibilityBlockers } from "../application/selectors/prioritySelectors";

type Props = { state: DemoState; initiativeId: InitiativeId; dispatch: (command: Command) => CommandResult; section?: "potential" | "priority" };
export function AssessmentEditors({ state, initiativeId, dispatch, section }: Props) {
  const profile = Object.values(state.entities.steeringProfileVersions).find(p => p.status === "ACTIVE")!;
  const [potential, setPotential] = useSessionDraft(`potential-new-${initiativeId}`, { measure: "", category: "MONEY", unit: "SEK/år", lower: "", expected: "", upper: "", evidence: "", assumption: "", horizon: "", earliest: "", full: "", recipient: "", uncertainty: "MEDIUM" });
  const [scores, setScores] = useSessionDraft<Record<string, { score: string; evidence: string; uncertainty: "LOW" | "MEDIUM" | "HIGH" }>>(`priority-scores-${initiativeId}`, {});
  const potentials = currentEffectPotentials(state, initiativeId);
  const blockers = priorityEligibilityBlockers(state, initiativeId, profile);
  const latest = latestPriorityAssessment(state,initiativeId,profile.id);
  const fresh = latest && potentials.every(p=>latest.effectPotentialIds.includes(p.id));
  const [reviewer,setReviewer] = useState<RoleAssignmentId|"">("");
  const [rationale,setRationale] = useSessionDraft(`priority-rationale-${initiativeId}`,"");
  const [confirmed,setConfirmed] = useState(false);
  const actor = (kind: string) => Object.values(state.entities.roleAssignments).find(a => state.entities.roleDefinitions[a.roleDefinitionId]?.roleKind === kind)!.id;
  const [feedback, setFeedback] = useState("");
  function send(command: Command) { const result = dispatch(command); setFeedback(result.success ? "Underlaget sparades i ärendet." : result.errors.map(e => e.description).join(" ")); }
  const token = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return <section data-step-work={section==="priority"?"priority":undefined} className="card assessment-editors">
    <h2>{section==="potential"?"Bedömd effektpotential":section==="priority"?"Prioriteringsbedömning":"Effektpotential och prioriteringsbedömning"}</h2>
    <p>Potentialen beskriver vad förändringen kan ge. Verksamhetens bindande åtagande beslutas senare, före start.</p>
    <p role="status">{feedback}</p>
    {section==="priority"&&<PriorityCriteria profile={profile}/>}
    {section!=="priority"&&<><div className="potential-summary">{potentials.map(p=><article key={p.id}><b>{p.effectMeasureCode}</b><p>{p.expectedValue.toLocaleString("sv-SE")} {p.unit} · bedömt intervall {p.lowerBound.toLocaleString("sv-SE")}–{p.upperBound.toLocaleString("sv-SE")}</p><p>{p.realizationWindow} · full potential {p.fullPotentialDate}</p></article>)}</div><details data-step-work="potential" open={!potentials.length}><summary>Lägg till en bedömd effektpotential</summary>
      <form className="material-form" onSubmit={e => {
        e.preventDefault(); const id = token();
        if ([potential.lower, potential.expected, potential.upper].some(v => !v.trim())) { setFeedback("Ange hela intervallet. Tomt värde är inte noll."); return; }
        send({ commandId: createId("Command", id), commandType: "RECORD_EFFECT_POTENTIAL", actorRoleAssignmentId: actor("SPECIALIST"), issuedAt: new Date().toISOString(), targetId: createId("EffectPotential", id), payload: {
          seriesId: `SERIES-${id}`, initiativeId, category: potential.category as PotentialCategory, effectMeasureCode: potential.measure, unit: potential.unit,
          lowerBound: Number(potential.lower), expectedValue: Number(potential.expected), upperBound: Number(potential.upper),
          evidenceRefs: [potential.evidence], assumptions: [potential.assumption], realizationWindow: potential.horizon,
          earliestPossibleEffectDate: potential.earliest, fullPotentialDate: potential.full, recipientScenario: potential.recipient,
          uncertainty: potential.uncertainty as "LOW" | "MEDIUM" | "HIGH", scope: "FEDERATED_SCENARIO", assessmentVersion: 1,
        }});
      }}>
        <label>Effekttyp<select value={potential.category} onChange={e => setPotential({ ...potential, category: e.target.value })}><option value="MONEY">Pengar</option><option value="RELEASED_TIME">Frigjord tid</option><option value="QUALITY">Kvalitet</option><option value="OTHER_BUSINESS_EFFECT">Annan verksamhetseffekt</option></select></label>
        {Object.entries({ measure: "Mätetal", unit: "Enhet", recipient: "Bedömda effektmottagare", lower: "Låg potential", expected: "Förväntad potential", upper: "Hög potential", evidence: "Evidens / underlagsreferens", assumption: "Antagande", horizon: "Effekthemtagningsfönster", earliest: "Tidigast möjlig effekt", full: "Full potential tidigast" }).map(([key,label]) => <label key={key}>{label}<input required type={["earliest","full"].includes(key) ? "date" : ["lower","expected","upper"].includes(key) ? "number" : "text"} value={potential[key as keyof typeof potential]} onInput={e => {if(["earliest","full"].includes(key))setPotential({ ...potential, [key]: e.currentTarget.value });}} onChange={e => setPotential({ ...potential, [key]: e.target.value })}/></label>)}
        <label>Osäkerhet<select value={potential.uncertainty} onChange={e => setPotential({...potential, uncertainty: e.target.value})}><option value="LOW">Låg</option><option value="MEDIUM">Medel</option><option value="HIGH">Hög</option></select></label>
        <button>Spara bedömd potential</button>
      </form>
    </details>
    <p>{potentials.length} aktuella potentialer. Befintliga serier och deras versioner redigeras i ärendets potentialvy.</p></>}
    {section!=="potential"&&latest&&<section className="priority-review" aria-label="Granska prioriteringsunderlaget"><h3>{latest.totalScore} / 100 · {latest.status==="CALCULATED"?"Granskning återstår":"Granskat underlag"}</h3><p>Profil: {profile.profileName}. Underlaget bygger på {latest.effectPotentialIds.length} effektpotentialer.</p>{!fresh&&<p className="gate blocked">Potentialen har ändrats. Beräkna ett nytt underlag innan det granskas.</p>}<details><summary>Visa poängen och underlaget bakom bedömningen</summary><ul>{latest.criterionAssessments.map(c=><li key={c.criterionCode}><b>{profile.criteria.find(p=>p.code===c.criterionCode)?.name}: {c.score}</b><p>{c.evidenceRefs.join(" · ")}</p></li>)}</ul></details>{latest.status==="CALCULATED"&&<form onSubmit={e=>{e.preventDefault();if(!reviewer||!confirmed||!rationale.trim()||!fresh||blockers.length)return;send({commandId:createId("Command",token()),commandType:"REVIEW_PRIORITY_ASSESSMENT",actorRoleAssignmentId:reviewer,issuedAt:new Date().toISOString(),targetId:latest.id,payload:{rationale}});setConfirmed(false);}}><RoleSelect state={state} kind="DECISION_MAKER" label="Person som granskar prioriteringen" value={reviewer} onChange={setReviewer}/><label>Ställningstagande och motivering<textarea required value={rationale} onChange={e=>setRationale(e.target.value)}/></label><label className="check"><input type="checkbox" checked={confirmed} onChange={e=>setConfirmed(e.target.checked)}/>Jag har granskat underlaget inom mitt mandat. Detta är inte ett startbeslut.</label><button disabled={!reviewer||!confirmed||!rationale.trim()||!fresh||blockers.length>0}>Godkänn granskat prioriteringsunderlag</button></form>}</section>}
    {section!=="potential"&&<details open={!latest||!fresh}><summary>Gör en uttrycklig prioriteringsbedömning</summary>
      <p>Bedöm varje kriterium 0–100 och ange underlaget. Poängen fylls aldrig i automatiskt. Vikter och kriterier följer {profile.profileName} v{profile.versionNumber}.</p>
      {blockers.length > 0 && <ul>{blockers.map((b,i) => <li key={i}>{b.description}</li>)}</ul>}
      <form onSubmit={e => {
        e.preventDefault();
        if (profile.criteria.some(c => !scores[c.code]?.score.trim() || !scores[c.code]?.evidence.trim())) { setFeedback("Varje kriterium kräver poäng och underlag."); return; }
        const id = token(); send({ commandType: "CALCULATE_PRIORITY_ASSESSMENT", commandId: createId("Command", id), actorRoleAssignmentId: actor("DECISION_MAKER"), issuedAt: new Date().toISOString(), targetId: createId("PriorityAssessment", id), payload: {
          initiativeId, steeringProfileVersionId: profile.id, scores: Object.fromEntries(profile.criteria.map(c => [c.code, { score: Number(scores[c.code].score), evidenceRefs: [scores[c.code].evidence], uncertainty: scores[c.code].uncertainty }]))
        }});
      }}>
        {profile.criteria.map(c => { const value = scores[c.code] ?? { score: "", evidence: "", uncertainty: "MEDIUM" as const }; return <fieldset key={c.code}><legend>{c.name} · {profile.weights[c.code]} %</legend><p>{c.description}</p><label>Poäng för {c.name}<input required type="number" min="0" max="100" value={value.score} onChange={e => setScores({...scores,[c.code]: {...value,score:e.target.value}})}/></label><label>Underlag för {c.name}<input required value={value.evidence} onChange={e => setScores({...scores,[c.code]: {...value,evidence:e.target.value}})}/></label><label>Osäkerhet för {c.name}<select value={value.uncertainty} onChange={e => setScores({...scores,[c.code]: {...value,uncertainty:e.target.value as typeof value.uncertainty}})}><option value="LOW">Låg</option><option value="MEDIUM">Medel</option><option value="HIGH">Hög</option></select></label></fieldset>; })}
        <button>Skapa prioriteringsunderlag från mina bedömningar</button>
      </form>
    </details>}
  </section>;
}
