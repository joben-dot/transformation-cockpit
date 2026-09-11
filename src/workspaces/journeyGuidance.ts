import type { FlowStepKey } from "../application/selectors/flowSelectors";

/** Explanations only; completion is always derived from the saved domain data. */
export const journeyGuidance: Record<FlowStepKey, {action:string; role:string; result:string}> = {
  material: {action:"Beskriv nuläget och varför behovet bör hanteras gemensamt. Registrera sedan utmaningen för fortsatt beredning.",role:"Initiativtagaren, med stöd av verksamhetskontakten",result:"En registrerad utmaning. Nästa dokument är businesscase."},
  businesscase: {action:"Fyll i syfte, önskat läge, avgränsning, alternativ och vad som händer om vi avstår. Spara och registrera initiativet för beredning.",role:"Beredaren tillsammans med berörd verksamhet",result:"Ett separat businesscase som följer med samma ärende."},
  qualification: {action:"Öppna de bedömningar som återstår. Dokumentera underlag och låt rätt specialist verifiera de punkter som kräver det.",role:"Beredaren samordnar; verksamhet och specialister bedömer",result:"Underlaget uppfyller de gemensamma kvalificeringskraven."},
  potential: {action:"Beskriv vilken effekt förändringen kan ge, för vem, när och med vilken osäkerhet. Ange underlaget bakom bedömningen.",role:"Verksamhet, ekonomi och relevanta specialister tillsammans",result:"Bedömd effektpotential att jämföra. Inget bindande effektåtagande."},
  priority: {action:"Bedöm kriterierna och beräkna prioriteringsunderlaget. Därefter granskar en person med mandat underlaget och dokumenterar sitt ställningstagande här.",role:"Beredaren tar fram underlaget; utsedd granskare med mandat tar ställning",result:"Granskat prioriteringsunderlag. Genomförande får fortfarande inte starta."},
  conditions: {action:"Koppla leveranser, beroenden och kostnader. Ange vad som måste vara tillgängligt före start och vem som ordnar det. Lokala åtaganden kan förberedas medan ni väntar.",role:"Beredaren, IT/specialister och ekonomi tillsammans med verksamheten",result:"En synlig genomförandeordning och kostnadsbild. Olösta startberoenden blockerar start."},
  commitments: {action:"Lägg till mottagande verksamhet. Dokumentera dess mål, baseline, förändring och mätplan. Varje effektägare behöver sedan acceptera sitt eget åtagande.",role:"Verksamhetens effektägare, förändringsansvarig och mätningsansvarig; ekonomi stödjer",result:"Lokala effektåtaganden med aktiv accept. Ingen annan accepterar för verksamhetens räkning."},
  decision: {action:"Hämta befintliga åtaganden och styrunderlag. Komplettera och spara beslutspaketet. När startkraven är uppfyllda fattar en person med mandat ett uttryckligt startbeslut.",role:"Beredaren sammanställer; behörig beslutsfattare beslutar",result:"Ett mänskligt startbeslut och en låst beslutsbaslinje."},
  implementation: {action:"Genomför förändringen och bekräfta med underlag att det nya arbetssättet används.",role:"Förändringsansvarig tillsammans med verksamheten; effektägaren säkrar mottagarkapaciteten",result:"Förändringen är bekräftad. Mätning och verifiering fortsätter enligt beslutet."},
  learning: {action:"Bedöm utfallet mot det ursprungliga målet, bevara även utebliven effekt och dokumentera lärdomar inför avslut eller skalning.",role:"Effektägare och behörig beslutsfattare, med mätningsansvarig och metodstöd",result:"Avslutsbeslut och lärande är sparade. En ny mottagare behöver ett nytt accepterat åtagande."},
  measurement: {action:"Rapportera vid beslutade mättidpunkter och låt mätningen verifieras. Jämför utfallet med målet och synliggör även utebliven effekt.",role:"Mätningsansvarig rapporterar och specialist verifierar; effektägaren följer resultatet",result:"Verifierad effekt jämförd med beslutade mål, baseline och tidsfönster."},
};

export function openStepWork(step: FlowStepKey) {
  const target = document.querySelector<HTMLElement>(`[data-step-work="${step}"]`);
  if (!target) return;
  let ancestor: HTMLElement | null = target;
  while (ancestor) { if (ancestor instanceof HTMLDetailsElement) ancestor.open = true; ancestor = ancestor.parentElement; }
  target.scrollIntoView({block:"start",behavior:"smooth"});
  target.setAttribute("tabindex", "-1");
  target.focus({preventScroll:true});
}
