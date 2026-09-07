import { useState } from "react";
import { Sparkles } from "lucide-react";
import type { DocumentField } from "./documentFormat";

const answers: Record<string,string> = {
  "Hur fyller jag i?": "Börja med uppgifterna som saknas inför nästa steg. Verksamheten beskriver behov och förändring; ekonomi hjälper till med kalkyl och antaganden; metodstöd håller ihop underlaget. Spara ett utkast och låt rätt ansvarig granska sin del. Att spara eller bifoga en fil är inget godkännande.",
  "Vad är skillnaden mellan effekt och nytta?": "Effekt beskriver den förändring som uppstår, exempelvis kortare väntetid. Nyttan är värdet förändringen ger verksamheten eller invånaren, exempelvis snabbare hjälp. Beskriv vad som ska förändras, för vem och hur det kan mätas. Frigjord tid blir inte automatiskt en budgetbesparing.",
  "Potential eller åtagande?": "Bedömd effektpotential beskriver vad initiativet kan ge och används före prioritering. Ett lokalt effektåtagande beslutas senare av varje mottagande verksamhet: eget mål, baseline, förändring, ansvar och mättidpunkter. Hjälpen får inte fatta det beslutet.",
  "Vad krävs för start?": "Ett granskat prioriteringsunderlag räcker inte. Förutsättningar, kostnader, finansiering, kapacitet, krav och accepterade lokala effektåtaganden måste ingå i ett komplett beslutspaket. Först därefter kan en människa med mandat fatta startbeslut. Kontrollera kraven i ärendets stegvy.",
  "Hur ser jag uppnådd effekt?": "Öppna effektuppföljningen och välj period. Följ den verifierade mätpunkten till verksamhetens låsta mål och baseline, och vidare till initiativet och dess förutsättningar. Potential, prognos och verifierat utfall hålls isär. Gemensamma kostnader och effekter får inte räknas flera gånger.",
};
const structures:Record<string,string>={
  problemStatement:"[Vilket problem upplever verksamheten eller invånaren?] Det berör [vilka] och innebär [konsekvens].",
  currentState:"I dag arbetar vi så här: [arbetssätt]. Nuläget stöds av [underlag och datum]. Det vi ännu behöver ta reda på är [fråga].",
  strategicHandlingReason:"Utmaningen behöver gemensam hantering eftersom [skäl]. Berörda funktioner är [funktioner] och den strategiska kopplingen är [mål].",
  purpose:"Syftet är att [förändring] för [mottagare], så att [möjlig verksamhetseffekt]. Detta behöver prövas genom [underlag].",
  alternatives:"Vi jämför [alternativ A] med [alternativ B] och att fortsätta som i dag. Skillnader i effektpotential, kostnad, tid, kvalitet och beroenden är [beskriv].",
  doNothingConsequence:"Om vi avstår bedömer verksamheten att [konsekvens]. Bedömningen bygger på [underlag]; osäkerheten gäller [antagande].",
  changeDescription:"Verksamheten behöver ändra [arbetssätt] genom [åtgärder]. Berörda medarbetare behöver [stöd och utbildning]. Ansvar och datum anges i separata fält.",
};

export function CopilotHelp({section,context,fields=[],values={},onApply}:{section:string;context?:string;fields?:DocumentField[];values?:Record<string,string>;onApply?:(patch:Record<string,string>)=>void}) {
  const [question,setQuestion]=useState(""),[answer,setAnswer]=useState(""),[field,setField]=useState(""),[proposal,setProposal]=useState(""),[notice,setNotice]=useState("");
  const available=fields.filter(f=>structures[f.key]);
  const prepared=`Jag arbetar i ${section}.${context?`\nSammanhang: ${context}`:""}\nMin fråga: ${question}\nHjälp mig med ett förslag till utkast. Hitta inte på mål, baseline, ansvar, beslut eller källor.`;
  return <details className="copilot-help"><summary><Sparkles size={18}/> Copilot · hjälp i {section}</summary><div className="copilot-content">
    <p className="copilot-status">Förberedd hjälp i demon · Microsoft Copilot är inte ansluten.</p>
    {context&&<p><b>Du arbetar med:</b> {context}</p>}
    <p>Här finns metodhjälp och skrivstöd. Ingen information skickas till någon AI-tjänst.</p>
    <div className="help-questions">{Object.keys(answers).map(q=><button type="button" className="secondary-action" key={q} onClick={()=>setAnswer(answers[q])}>{q}</button>)}</div>
    {answer&&<p className="help-answer" role="status">{answer}</p>}
    {onApply&&available.length>0&&<section className="help-proposal"><h3>Skrivstöd till utkastet</h3><p>Välj ett fält. Hakparenteserna är frågor att besvara, inte färdiga uppgifter.</p><label>Fält att få hjälp med<select value={field} onChange={e=>{setField(e.target.value);setProposal(structures[e.target.value]??"");setNotice("");}}><option value="">Välj fält</option>{available.map(f=><option key={f.key} value={f.key}>{f.label}</option>)}</select></label>{field&&<><label>Granska och bearbeta förslaget<textarea rows={4} value={proposal} onChange={e=>setProposal(e.target.value)}/></label><button type="button" disabled={!proposal.trim()} onClick={()=>{try{onApply({[field]:[values[field],proposal.trim()].filter(Boolean).join("\n\n")});setProposal("");setNotice("Tillagt i utkastet. Kontrollera och spara dokumentet separat. Inget har godkänts.");}catch(e){setNotice(e instanceof Error?e.message:"Förslaget kunde inte läggas till.");}}}>Lägg till i utkastet</button><p className="muted">Befintlig text bevaras. Enter fungerar när denna knapp har fokus.</p></>}</section>}
    <details><summary>Förbered en egen fråga till organisationens Copilot</summary><label>Vad vill du fråga?<textarea value={question} onChange={e=>setQuestion(e.target.value)}/></label><p>Kontrollera texten nedan innan du själv tar den vidare. Dokument och bilagor följer inte med.</p><textarea aria-label="Fråga med sammanhang att kopiera" readOnly value={prepared} rows={6}/><button type="button" disabled={!question.trim()} onClick={async()=>{try{await navigator.clipboard.writeText(prepared);setNotice("Frågan är kopierad. Ingenting har skickats.");}catch{setNotice("Markera och kopiera texten ovan.");}}}>Kopiera frågan med sammanhang</button></details>
    <p role="status">{notice}</p>
  </div></details>;
}
