import { useSessionDraft } from "./SessionDrafts";

const roles = [
  ["Verksamheten", "Beskriver nyttan, mottagaren och det förändrade arbetssättet. Föreslår effektägare och hur nyttan ska mätas."],
  ["IT", "Kompletterar med förutsättningar, beroenden, kostnader och tillgång till mätdata."],
  ["Ekonomi", "Granskar antaganden, kalkylperiod, kostnadsfördelning och om tidsvinst kan bli en faktisk kostnadsminskning."],
  ["Samordnaren / metodstödet", "Håller ihop samma underlag, pekar ut vem som kompletterar vad och när, och lämnar det till beredning inför prioritering."],
];

export function BenefitTemplates() {
  const [inputs, setInputs] = useSessionDraft("benefit-template-example", { people: "6000", seconds: "45", days: "220", adoption: "100", usable: "50" });
  const definitions = [
    ["people", "Berörda medarbetare", undefined],
    ["seconds", "Sekunder per person och relevant dag", undefined],
    ["days", "Relevanta dagar under perioden", undefined],
    ["adoption", "Andel som nås och använder arbetssättet, %", 100],
    ["usable", "Andel tidsvinst som kan användas, %", 100],
  ] as const;
  const valid = definitions.every(([key,,max]) => inputs[key].trim() !== "" && Number.isFinite(Number(inputs[key])) && Number(inputs[key]) >= 0 && (max === undefined || Number(inputs[key]) <= max));
  const gross = Number(inputs.people) * Number(inputs.seconds) * Number(inputs.days) * Number(inputs.adoption) / 100 / 3600;
  const usable = gross * Number(inputs.usable) / 100;
  const number = (n: number) => new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 1 }).format(n);

  return <section className="section-block benefit-templates" aria-labelledby="benefit-templates-title">
    <h2 id="benefit-templates-title">Mallar och ansvar</h2>
    <p>Ett gemensamt underlag, flera bidragande roller. Verksamheten äger nyttan och uppföljningen. IT bidrar med förutsättningarna.</p>
    <article className="card">
      <p className="eyebrow">FÖRSTA MALLEN · VERSION 0.1</p>
      <h3>Nyttokalkyl inför prioritering</h3>
      <p>Beskriv möjlig nytta, antaganden, kostnader och ett första förslag till uppföljning. Mallen innehåller ett tomt blad och ett ifyllt räkneexempel. Fyll bara i relevanta delar.</p>
      <p><a href="./mallar/Nyttokalkyl_v0_1.xlsx" download>Ladda ner nyttokalkylen i Excel</a></p>
      <p className="template-note">Arbetsförslag till gemensam mall. Inte en beslutad standard eller ett bindande effektåtagande.</p>
      <details className="point-detail">
        <summary>Vem fyller i vad – och hur går underlaget vidare?</summary>
        <ol className="template-roles">{roles.map(([role, text]) => <li key={role}><strong>{role}</strong><p>{text}</p></li>)}</ol>
        <p>Samma underlag kan gå tillbaka för komplettering. Ange alltid <strong>vad som saknas, ansvarig person och klart senast</strong>. Delarna kan beredas parallellt; samordnaren håller ihop versionen.</p>
        <p>I denna version fylls Excelmallen i utanför verktyget. Granskade uppgifter förs manuellt till ärendets underlag och effektpotential, med källa och version. Filen läses inte in automatiskt och skickas inte mellan personer av systemet.</p>
        <p>Efter prioritering, före start, fastställer varje mottagande verksamhet sitt separata effektåtagande: lokal baseline, mätning, förändring, kapacitet, ansvar och datum. Effektägaren måste aktivt acceptera. En ifylld kalkyl öppnar inte startgrinden.</p>
      </details>
      <details className="point-detail">
        <summary>Pröva antagandet: 45 sekunder per medarbetare</summary>
        <p>6 000 medarbetare × 45 sekunder motsvarar 75 timmar per dag teoretiskt. Men utspridda sekunder är inte automatiskt användbar tid. Här prövar du hur antagandena påverkar potentialen.</p>
        <p>Perioden i exemplet är ett år. 220 dagar, 100 % användning och 50 % användbar tid är räkneantaganden som behöver prövas.</p>
        <div className="form-grid">{definitions.map(([key, label, max]) => <label key={key}>{label}<input type="number" min="0" max={max} step="any" value={inputs[key]} onChange={e => setInputs({ ...inputs, [key]: e.target.value })} /></label>)}</div>
        <div className="effect-metrics template-results" aria-live="polite">
          <p>Teoretisk tidsvinst under perioden<b>{valid && Number.isFinite(gross) ? `${number(gross)} timmar` : "Komplettera antagandena"}</b></p>
          <p>Bedömd användbar tid<b>{valid && Number.isFinite(usable) ? `${number(usable)} timmar` : "Komplettera antagandena"}</b></p>
          <p>Besparing i kronor<b>Inte bedömd</b></p>
        </div>
        <p>Ekonomi och verksamhet behöver ange vilken utgift som faktiskt kan minska och när. Timmar multipliceras inte automatiskt med lön. Kvalitet följs separat.</p>
        <p className="template-note">Räkneexempel. Ändringarna påverkar inte portföljen, ett effektåtagande eller redovisad effekt. Inga utfall är verifierade.</p>
      </details>
    </article>
  </section>;
}
