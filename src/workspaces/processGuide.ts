import type { FlowStepKey } from "../application/selectors/flowSelectors";

export interface GuideDocument { id: string; title: string; purpose: string; parts: string[]; }
export interface GuideStage {
  id: string; number: number; title: string; short: string; purpose: string;
  roles: string; ready: string; location: string; flowSteps: FlowStepKey[]; documents: GuideDocument[];
}
const doc = (id: string, title: string, purpose: string, parts: string[] = []): GuideDocument => ({id,title,purpose,parts});

// Method guidance only. Case status and decision gates continue to come from domain selectors.
export const processGuide: GuideStage[] = [
  {id:"foundation",number:0,title:"Gemensam grund",short:"Ramar för hela arbetssättet",purpose:"Kom överens om samma begrepp, ansvar och underlag. Grunden gäller genom hela processen.",roles:"Gemensamt metodstöd och behöriga företrädare för verksamhet, ekonomi och styrning.",ready:"Tillämpliga ramar och versioner är kända. Obeslutade styrfrågor i demon är markerade som antaganden.",location:"Metod och styrning",flowSteps:[],documents:[
    doc("0.1","Process och beslutspunkter","Beskriv vägen från utmaning till uppföljd effekt och vad som krävs vid varje beslut."),
    doc("0.2","Roller och mandat","Klargör vem som bereder, prioriterar, beslutar, genomför och följer upp, samt när en fråga eskaleras."),
    doc("0.3","Gemensamma begrepp","Håll isär exempelvis bedömd effektpotential, effektåtagande, prognos och verifierat utfall."),
    doc("0.4","Styrande dokument","Samla överenskomna riktlinjer, relevanta krav och deras giltighet. Krav behöver bedömas av rätt kompetens."),
    doc("0.5","Mallförteckning och instruktioner","Ange syfte, ägare, version och status för gemensamma mallar. Denna vy är en första struktur för förteckningen."),
  ]},
  {id:"challenge",number:1,title:"Utmaning",short:"Beskriv behovet",purpose:"Beskriv problemet och vem det berör. Här behövs varken en färdig lösning eller en nyttokalkyl.",roles:"Initiativtagare och berörd verksamhet. Verksamhetskontakt eller metodstöd hjälper till vid behov.",ready:"Grunduppgifterna är tydliga och någon tar ansvar för nästa steg: businesscase, komplettering, annan hantering eller avslut.",location:"Ärenden → Utmaning",flowSteps:["material"],documents:[
    doc("1.1","Utmaningsbeskrivning","Ett eget, avgränsat första dokument.",["Problem och nuläge.","Berörd verksamhet och kontaktperson.","Önskad förändring och skäl för strategisk eller gemensam hantering."]),
    doc("1.2","Ställningstagande till fortsatt beredning","Dokumentera vart utmaningen går härnäst, varför samt ansvarig och datum."),
  ]},
  {id:"businesscase",number:2,title:"Businesscase",short:"Bedöm alternativ och möjlig effekt",purpose:"Undersök om och hur utmaningen bör tas vidare. Bedömd effektpotential tas fram före prioritering och är inte ett löfte.",roles:"Verksamheten och beredningsansvarig, med ekonomi, analys och relevanta specialister.",ready:"Alternativ, möjlig effekt, kostnader, antaganden, osäkerhet och tidsfönster går att förstå och granska.",location:"Ärenden → Businesscase och Bedömd effektpotential",flowSteps:["businesscase","potential"],documents:[
    doc("2.1","Businesscase","Samla underlaget för att bedöma värdet och genomförbarheten.",["Syfte, önskat läge och avgränsning.","Alternativ och konsekvensen av att avstå.","Berörda verksamheter och möjlig gemensam användning.","Bedömd effektpotential, risker, beroenden och genomförbarhet."]),
    doc("2.2","Nyttokalkyl","Del av eller bilaga till businesscase. Återanvänd samma uppgifter i bedömd effektpotential.",["Pengar, tid, kvalitet och andra nyttor hålls isär.","Införande, verksamhetsförändring, tekniska förutsättningar och löpande kostnader.","Evidens, antaganden, osäkerhet och gemensam kalkylperiod.","Kostnadsfördelning och kontroll mot dubbelräkning. Frigjord tid är inte automatiskt en budgetbesparing."]),
  ]},
  {id:"qualification",number:3,title:"Kvalificering",short:"Granska och komplettera",purpose:"Kontrollera att underlaget håller för gemensam prioritering. Hänvisa till businesscase och kalkyl; skriv inte samma sak igen.",roles:"Beredningsansvarig samordnar. Verksamhet, ekonomi och berörda specialister granskar sina delar.",ready:"Tillämpliga krav är bedömda och nödvändiga kompletteringar verifierade. Saknade uppgifter har ansvarig och datum.",location:"Ärenden → Kvalificering",flowSteps:["qualification"],documents:[
    doc("3.1","Kvalificeringschecklista","Kontrollera gemensamma minimikrav och vilket underlag som styrker dem."),
    doc("3.2","Sakkunnigbedömningar vid behov","Koppla rätt kompetens till frågan.",["Verksamhet och förändring.","Information, data, arkitektur och teknik.","Juridik, informationssäkerhet och dataskydd.","Ekonomi, kapacitet, drift och förvaltning."]),
    doc("3.3","Kompletteringslista","Ange vad som saknas, varför, vem som kompletterar, klart senast och vem som granskar."),
  ]},
  {id:"priority",number:4,title:"Prioritering",short:"Jämför och ta ställning",purpose:"Jämför initiativ på tydliga grunder, med bedömd effektpotential och osäkerhet synliga. Hög prioritet är inte ett startbeslut.",roles:"Gemensam beredning tar fram jämförelsen. Utsedd beslutsfunktion tar ställning inom sitt mandat.",ready:"Prioriteringsgrunden och det mänskliga ställningstagandet är dokumenterade. Beroenden och kapacitet påverkar fortsatt planering.",location:"Prioritering och ärendets steg Prioritering",flowSteps:["priority"],documents:[
    doc("4.1","Prioriteringskriterier och bedömningsanvisning","Gemensamma kriterier, skalor, vikter, giltighet och instruktioner."),
    doc("4.2","Bedömning per initiativ","Motivera bedömningen med källor och aktuella underlagsversioner."),
    doc("4.3","Gemensamt jämförelseunderlag","Visa möjlig effekt, osäkerhet, kapacitet och beroenden mellan initiativ."),
    doc("4.4","Prioriteringsställningstagande","Dokumentera prioritering, fortsatt beredning, avvaktan eller avslag med skäl och mandat."),
  ]},
  {id:"conditions",number:5,title:"Förutsättningar och körordning",short:"Visa vad som måste finnas först",purpose:"Klä det övergripande initiativet med nödvändiga förutsättningar, delinitiativ, kostnader och kapacitet. Kända beroenden beskrivs redan under beredningen och fördjupas här.",roles:"Beredningsansvarig, verksamhet, IT och arkitektur, ekonomi samt ansvariga för beroende leveranser och förvaltning.",ready:"Det framgår vad som måste vara klart före start respektive senare milstolpar, vem som levererar och när. Startblockerande förutsättningar måste vara uppfyllda före start.",location:"Ärendets steg Förutsättningar och körordning",flowSteps:["conditions"],documents:[
    doc("5.1","Förutsättnings- och beroendeplan","Beskriv beroenden och möjlig genomförandeordning.",["Befintliga förmågor och tidigare initiativ eller leveranser.","Krav före start respektive vid senare milstolpe.","Ansvarig, datum och underlag som visar tillgänglighet."]),
    doc("5.2","Genomförandeupplägg","Välj uppdrag, linjearbete, projekt, program eller förstudie efter behov. Beskriv bemanning och milstolpar."),
    doc("5.3","Finansiering och kostnadsfördelning","Komplettera kalkylen med finansiering, full kostnad över perioden och fördelningsprincip. Gemensam faktisk kostnad räknas en gång."),
    doc("5.4","Mottagnings- och förvaltningsplan","Klargör vem som tar emot, driver och vidareutvecklar resultatet samt vilken kapacitet det kräver."),
  ]},
  {id:"commitments",number:6,title:"Lokala effektåtaganden",short:"Verksamheten förbinder sig",purpose:"Varje effektmottagande verksamhet beslutar separat vad den ska realisera. IT, projektledning och AI får stödja men aldrig acceptera för verksamhetens räkning.",roles:"Verksamheten, ekonomi, förändringsansvarig och mätningsansvarig bidrar. Effektägaren accepterar aktivt med tillräckligt mandat.",ready:"Varje deltagande mottagare har ett komplett, aktivt och daterat accepterat effektåtagande före start.",location:"Effekt och beslut → Lokala effektåtaganden",flowSteps:["commitments"],documents:[
    doc("6.1","Lokalt effektåtagande med mätplan","Ett samlat dokument per effektmottagande verksamhet, med bidrag från flera roller.",["Effekttyp, enhet, omfattning och effekthemtagningsfönster.","Lokal beslutad baseline, mätetal, datakälla och mätmetod.","Nödvändig verksamhetsförändring, ansvarig och genomförandedatum.","Bekräftad mottagarkapacitet och kvalitet eller skyddsmått.","Mätningsansvarig, första och återkommande mättidpunkter samt tidpunkt för full effekt.","Effektägarens mandat och aktiva, daterade accepterande."]),
  ]},
  {id:"start",number:7,title:"Startbeslut",short:"Pröva startklarhet och besluta",purpose:"Samla granskade underlag och pröva om initiativet får starta. Prioriterat, startklart och startat betyder olika saker.",roles:"Beredningsansvarig sammanställer. Behörig beslutsfattare fattar ett uttryckligt startbeslut.",ready:"Hårt stopp tills startkraven är uppfyllda. Ett mänskligt startbeslut låser de underlagsversioner som genomförande och effekt mäts mot.",location:"Effekt och beslut → Startbeslut",flowSteps:["decision"],documents:[
    doc("7.1","Samlat beslutspaket","Hänvisa till granskade underlagsversioner, åtaganden, kostnader, kapacitet och beroenden. Undvik nya kopior av samma uppgifter."),
    doc("7.2","Startklarhetskontroll","Kontrollera att alla tillämpliga startkrav och lokala accepteranden finns."),
    doc("7.3","Startbeslut","Dokumentera omfattning, mandat, beslutsfattare, datum och skäl."),
    doc("7.4","Låst beslutsbaslinje","Bevara beslutets underlag. Ändringar kräver formell ändringsstyrning och nytt mänskligt beslut; ursprungsversionen finns kvar."),
  ]},
  {id:"delivery",number:8,title:"Genomförande och förändring",short:"Leverera och ändra arbetssätt",purpose:"Genomför leveranser och den verksamhetsförändring som behövs för effekt. Teknisk leverans och nytt arbetssätt följs var för sig.",roles:"Genomförandeansvarig, förändringsansvarig, mottagande verksamhet och förvaltning, med gemensamt metodstöd.",ready:"Mottagandet och förändringen dokumenteras. Avvikelser i kostnad, tid, kvalitet och effekt hanteras mot beslutet.",location:"Effekt och beslut → Genomförande och förändring. Guiden beskriver även dokumentstöd utanför demon.",flowSteps:["implementation"],documents:[
    doc("8.1","Genomförande- och förändringsplan","Planera arbetet, ansvar, hårda datum och införandet i verksamheten."),
    doc("8.2","Kort lägesrapport","Visa framdrift, hinder, nästa steg, kostnad, tid, kvalitet och effektprognos."),
    doc("8.3","Ändringsbegäran och ändringsbeslut","Beskriv avvikelse, konsekvenser och beslut. Skriv aldrig över den låsta ursprungliga baslinjen."),
    doc("8.4","Leveransmottagande och överlämning","Dokumentera mottagen leverans och ansvar för drift och förvaltning."),
    doc("8.5","Bekräftad verksamhetsförändring","Visa att det överenskomna arbetssättet faktiskt används. Detta är inte i sig bevis för uppnådd effekt."),
  ]},
  {id:"measurement",number:9,title:"Effektuppföljning",short:"Mät och verifiera utfallet",purpose:"Mät i verksamheten vid beslutade tidpunkter. Jämför verifierat utfall med den låsta baslinjen och åtagandet.",roles:"Mätningsansvarig rapporterar, utsedd granskare verifierar och effektägaren ansvarar för effekthemtagningen. Verksamhetskontakten kan samordna återrapportering.",ready:"Utfallet har källa, period och verifiering. Avvikelser har förklaring, åtgärd och ansvarig. Prognos är inte realiserad effekt.",location:"Effekt och beslut → Effektuppföljning; Kontrollrum → Effektuppföljning",flowSteps:["measurement"],documents:[
    doc("9.1","Lokal effektuppföljning","Återanvänd mätplanen och åtagandets uppgifter.",["Låst mål och baseline.","Mätvärde, mätperiod, datakälla och underlag.","Genomförd förändring och kvalitet eller skyddsmått.","Verifiering, avvikelse, orsak och åtgärd."]),
    doc("9.2","Samlad effektredovisning","Håll potential, åtaganden, prognoser och verifierade utfall isär. Visa tidsfönster, kostnader och bidragande initiativ utan dubbelräkning."),
  ]},
  {id:"learning",number:10,title:"Avslut, lärande och skalning",short:"Ta vara på resultatet",purpose:"Avsluta genomförandet ordnat och återanvänd kunskapen. Effekthemtagningen kan fortsätta efter projektets avslut.",roles:"Genomförandeansvarig, effektägare, mottagande verksamhet och gemensamt metodstöd. Nya mottagare beslutar om egna åtaganden.",ready:"Kvarvarande ansvar och mätningar är utpekade. Skalning kräver nytt lokalt effektåtagande; tidigare utfall får inte kopieras.",location:"Effekt och beslut → Avslut, lärande och skalning / Beslutshistorik; Kontrollrum för utfall. Skalning bereds som ett nytt lokalt åtagande.",flowSteps:["learning"],documents:[
    doc("10.1","Slut- och läranderapport","Samla resultat, kostnader, kvarstående arbete och lärdomar."),
    doc("10.2","Avslut med kvarvarande effektansvar","Dokumentera vad som avslutas, vem som fortsätter följa upp och när. Projektavslut avslutar inte automatiskt effektansvaret."),
    doc("10.3","Underlag för återanvändning och skalning","Beskriv återanvändbar metod, kunskap och teknik samt nästa mottagares egna förutsättningar, kostnader och effektåtagande."),
  ]},
];
