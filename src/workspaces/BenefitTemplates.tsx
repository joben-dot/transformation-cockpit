const roles = [
  ["Verksamheten / initiativtagaren", "Beskriver behovet och mottagaren. Mottagande verksamhet bedömer nyttan, förändringen och uppföljningen samt föreslår effektägare."],
  ["IT och andra relevanta specialister", "Kompletterar med förutsättningar, beroenden, kostnader, krav och tillgång till mätdata. IT kan också initiera egna initiativ."],
  ["Ekonomi", "Granskar antaganden, kalkylperiod, kostnader och fördelning. Håller isär kostnadsminskning, undviken kostnad och andra nyttor."],
  ["Samordnaren / metodstödet", "Håller ihop samma underlag, pekar ut vem som kompletterar vad och när, och lämnar det till beredning inför prioritering."],
];
const questions = [
  ["Vad ska bli bättre, och för vem?", "Beskriv nytta och mottagande verksamhet. Ett initiativ kan ha flera nyttor med olika mottagare."],
  ["Hur ser nuläget och potentialen ut?", "Använd relevant mått eller definierad bedömningsskala. Ange underlag, antaganden, osäkerhet och tidsfönster."],
  ["Vad måste förändras eller finnas på plats?", "Beskriv verksamhetsförändring, kapacitet, tekniska och andra förutsättningar samt länkade initiativ."],
  ["Vad kostar det?", "Samla införande, förändring, drift och förvaltning för samma period. Gemensamma kostnader räknas en gång."],
  ["Vem ansvarar och hur följer vi upp?", "Föreslå effektägare, förändringsansvarig, mätmetod, datakälla och person samt tidpunkter för mätning."],
  ["Vad saknas för nästa steg?", "Ange komplettering, ansvarig person och datum. Ange eventuella obligatoriska krav med källa, tidsfrist och ansvarig bedömare."],
];
const examples = [
  ["Ekonomi", "Faktisk kostnadsminskning och undviken framtida kostnad redovisas separat."],
  ["Kapacitet och produktivitet", "Exempelvis genomströmning, användbar arbetstid eller mer verksamhet med samma resurser."],
  ["Kvalitet och service", "Exempelvis färre fel, kortare väntan, högre tillgänglighet eller bättre resultat för invånaren."],
  ["Arbetsmiljö, robusthet och miljö", "Använd relevanta mått eller en tydligt definierad kvalitativ bedömning."],
];

export function BenefitTemplates() {
  return <section className="section-block benefit-templates" aria-labelledby="benefit-templates-title">
    <h2 id="benefit-templates-title">Mallar och ansvar</h2>
    <p>Ett gemensamt underlag, flera bidragande roller. Mottagande verksamhet äger nyttan och uppföljningen.</p>
    <details className="card"><summary>Dokumentens plats i ärendeflödet</summary><p>Öppna ett ärende och välj rätt steg. Där finns dokumentets mall, onlineformulär och sparade bilagor tillsammans med kraven inför nästa steg.</p><table><thead><tr><th>Dokument</th><th>Var och varför?</th><th>Vem bidrar?</th></tr></thead><tbody>{[
      ["Utmaning","Eget första steg: grunduppgifter och strategiskt behov.","Initiativtagaren och berörd verksamhet."],
      ["Businesscase","Eget nästa steg: syfte, alternativ och underlag för beredning.","Verksamhet och beredare; ekonomi och specialister kompletterar."],
      ["Nyttokalkyl","Underlag till businesscase och bedömd effektpotential före prioritering.","Verksamhet och ekonomi, med metodstöd."],
      ["Lokalt effektåtagande","Efter prioritering, före start: mål, baseline, förändring, kapacitet och mätplan.","Verksamheten dokumenterar; lokal effektägare accepterar separat."],
      ["Beslutspaket","Start och beslut: samlade bedömningar och val av underlagsversioner.","Beredaren sammanställer; behörig beslutsfattare fattar beslut."],
      ["Effektuppföljning","Förändring och mätning: utfall och kvalitet mot låst mål och baseline.","Mätningsansvarig rapporterar; specialist verifierar."],
    ].map(([name,where,who])=><tr key={name}><td>{name}</td><td>{where}</td><td>{who}</td></tr>)}</tbody></table><p>Dokument kan fyllas i online eller med en nedladdad HTML-mall, vars JSON-export återläses som utkast. Excel och andra bilagor granskas manuellt. Sparandet i demon är lokalt; inget ärendeflöde skickar filer mellan personer ännu.</p></details>
    <article className="card">
      <p className="eyebrow">GEMENSAM NYTTOKALKYL · VERSION 0.2</p>
      <h3>Nyttokalkyl inför prioritering</h3>
      <p>Samma grund för uppdrag, linjearbete, förstudier, projekt, program och möjliggörande initiativ. Beskriv förbättringen med det mått som passar verksamheten. Alla nyttor behöver inte uttryckas i pengar.</p>
      <p><a href="./mallar/Nyttokalkyl.xlsx" download>Ladda ner nyttokalkylen i Excel</a></p>
      <p>Börja med <strong>Initiativ</strong> för gemensam ram och kostnader. Använd bladet <strong>Nytta</strong> för varje nytta och mottagande verksamhet; kopiera det vid behov. <strong>Exempel</strong> visar olika slags nyttor. Fyll bara i relevanta delar.</p>
      <p className="template-note">Arbetsförslag till gemensam mall. Bedömd effektpotential inför prioritering är inte ett bindande effektåtagande.</p>
      <details className="point-detail">
        <summary>Mallens sex gemensamma frågor</summary>
        <ol className="template-roles">{questions.map(([question, help]) => <li key={question}><strong>{question}</strong><p>{help}</p></li>)}</ol>
      </details>
      <details className="point-detail">
        <summary>Olika nyttor – samma grund för bedömning</summary>
        <dl>{examples.map(([category, help]) => <div key={category}><dt>{category}</dt><dd>{help}</dd></div>)}</dl>
        <p>Tid, kronor, kvalitet och andra mått hålls isär. Tidsvinster blir inte automatiskt budgetbesparingar. Kvalitativa nyttor behöver tydlig evidens och en definierad bedömning.</p>
        <p>Obligatoriska krav anges med källa, tidsfrist och ansvarig bedömare. De kan motivera en åtgärd även utan besparing; kostnader, konsekvenser och alternativ ska fortfarande bedömas.</p>
        <p>En teknisk förutsättning länkas till de verksamhetsnyttor den möjliggör. En leverans är inte bevis för realiserad effekt.</p>
      </details>
      <details className="point-detail">
        <summary>Vem fyller i vad – och hur går underlaget vidare?</summary>
        <ol className="template-roles">{roles.map(([role, text]) => <li key={role}><strong>{role}</strong><p>{text}</p></li>)}</ol>
        <p>Samma underlag kan gå tillbaka för komplettering. Ange alltid <strong>vad som saknas, ansvarig person och klart senast</strong>. Delarna kan beredas parallellt; samordnaren håller ihop versionen.</p>
        <p>I denna version fylls Excelmallen i utanför verktyget. Granskade uppgifter förs manuellt till ärendets underlag och effektpotential, med källa och version. Filen läses inte in automatiskt och skickas inte mellan personer av systemet.</p>
        <p>Efter prioritering, före start, fastställer varje mottagande verksamhet sitt separata effektåtagande: lokal baseline, mätning, förändring, kapacitet, ansvar och datum. Effektägaren måste aktivt acceptera. En ifylld kalkyl öppnar inte startgrinden.</p>
      </details>
    </article>
  </section>;
}
