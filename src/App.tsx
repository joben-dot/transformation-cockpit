import {
  ArrowRight,
  Blocks,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Database,
  GitBranch,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { initializeDemoState } from "./application";
import { referenceStory } from "./application/selectors";
import { effectPotentialLabel } from "./domain";
import { stage3Ids } from "./demo-data/stage3DemoData";

const state = initializeDemoState();

const statusLabel = {
  AVAILABLE: "Tillgänglig",
  PLANNED: "Planerad",
  BLOCKED: "Blockerad",
  UNKNOWN: "Okänd",
} as const;

const kindLabel = {
  EXISTING_CAPABILITY: "Befintlig förmåga",
  ENABLING_DELIVERY: "Förutsättningsprojekt",
  BUSINESS_CHANGE: "Verksamhetsförändring",
  LOCAL_ADOPTION: "Lokalt införande",
  FOLLOW_UP_PREPARATION: "Förberedd uppföljning",
} as const;

function Trace({ values }: { values: string[] }) {
  return (
    <details className="trace">
      <summary>Visa källidentiteter</summary>
      <div>
        {values.map((value) => (
          <code key={value}>{value}</code>
        ))}
      </div>
    </details>
  );
}

export default function App() {
  const story = referenceStory(state, stage3Ids.valueInitiative);
  if (!story) return <main>Den syntetiska referensberättelsen saknas.</main>;

  const { challenge, initiative } = story;
  return (
    <div className="product-shell">
      <header className="product-header">
        <a
          className="brand"
          href="#top"
          aria-label="Transformation Cockpit, start"
        >
          <span>
            <Sparkles size={18} />
          </span>
          <b>Transformation Cockpit</b>
        </a>
        <nav aria-label="Sidinnehåll">
          <a href="#potential">Effektpotential</a>
          <a href="#conditions">Förutsättningar</a>
          <a href="#roadmap">Fortsatt process</a>
        </nav>
        <span className="demo-badge">Syntetisk referensberättelse</span>
      </header>

      <main id="top">
        <section className="hero">
          <div>
            <p className="eyebrow">STRATEGISKT PORTFÖLJSTÖD · NY GRUND</p>
            <h1>Från strategisk utmaning till mätbar verksamhetseffekt</h1>
            <p className="lead">
              En sammanhängande struktur för att bedöma möjlig effekt, förstå
              vad som måste möjliggöras och senare fatta spårbara mänskliga
              beslut.
            </p>
          </div>
          <aside className="principle-card">
            <ShieldCheck size={24} />
            <div>
              <b>Ärlig processgräns</b>
              <p>
                Inga startbeslut eller realiserade effekter visas i detta första
                steg.
              </p>
            </div>
          </aside>
        </section>

        <section className="story-heading">
          <div>
            <p className="eyebrow">SAMMA ÄRENDE GENOM HELA STRUKTUREN</p>
            <h2>{initiative.title}</h2>
            <p>{initiative.purpose}</p>
          </div>
          <div className="identity-pair">
            <span>
              ChallengeId <code>{challenge.id}</code>
            </span>
            <ArrowRight size={16} />
            <span>
              InitiativeId <code>{initiative.id}</code>
            </span>
          </div>
        </section>

        <section className="challenge-grid">
          <article className="card challenge-card">
            <div className="card-icon">
              <Target />
            </div>
            <p className="eyebrow">STRATEGISK UTMANING</p>
            <h3>{challenge.title}</h3>
            <p>{challenge.problemStatement}</p>
            <dl>
              <dt>Nuläge</dt>
              <dd>{challenge.currentState}</dd>
              <dt>Varför strategiskt?</dt>
              <dd>{challenge.strategicHandlingReason}</dd>
            </dl>
            <Trace values={[challenge.id, initiative.id]} />
          </article>
          <article className="card model-card">
            <p className="eyebrow">MODELLENS SKILLNADER</p>
            <ul>
              <li>
                <CheckCircle2 /> Potential är en bedömning, inte ett löfte.
              </li>
              <li>
                <CheckCircle2 /> Prioritet är inte genomförandeordning.
              </li>
              <li>
                <CheckCircle2 /> En teknisk leverans är inte verksamhetseffekt.
              </li>
              <li>
                <CheckCircle2 /> Beslut och mätning tillkommer i senare steg.
              </li>
            </ul>
          </article>
        </section>

        <section id="potential" className="section-block">
          <div className="section-title">
            <div>
              <p className="eyebrow">VAD INITIATIVET KAN GE</p>
              <h2>Bedömd effektpotential</h2>
            </div>
            <span className="nonbinding">{effectPotentialLabel}</span>
          </div>
          <div className="potential-grid">
            {story.effectPotentials.map((potential) => (
              <article className="card potential-card" key={potential.id}>
                <span className="category">{potential.category}</span>
                <h3>{potential.effectMeasureCode}</h3>
                <div className="range">
                  <small>Låg</small>
                  <b>{potential.lowerBound}</b>
                  <small>Förväntad</small>
                  <b>{potential.expectedValue}</b>
                  <small>Hög</small>
                  <b>{potential.upperBound}</b>
                  <em>{potential.unit}</em>
                </div>
                <p>
                  <Clock3 size={15} /> {potential.realizationWindow}
                </p>
                <p>
                  Osäkerhet: <b>{potential.uncertainty}</b>
                </p>
                <p className="muted">
                  Evidens: {potential.evidenceRefs.join(", ")}
                </p>
                <Trace values={[potential.id, ...potential.evidenceRefs]} />
              </article>
            ))}
          </div>
        </section>

        <section id="conditions" className="section-block">
          <div className="section-title">
            <div>
              <p className="eyebrow">VAD SOM MÅSTE MÖJLIGGÖRAS</p>
              <h2>Förutsättningar och beroenden</h2>
            </div>
            <span className="sequence-note">
              <GitBranch size={16} /> Härledd ordning, inte startgodkännande
            </span>
          </div>
          <div className="enabler-strip">
            <Database />{" "}
            <div>
              <b>Återanvänt möjliggörande initiativ</b>
              {story.enablingInitiatives.map((item) => (
                <span key={item.id}>
                  {item.title} · <code>{item.id}</code>
                </span>
              ))}
            </div>
          </div>
          <div className="execution-levels">
            {story.executionLevels.map((level, index) => (
              <div className="execution-level" key={index}>
                <span className="level-number">{index + 1}</span>
                <div>
                  {level.map((nodeId) => {
                    const node = state.entities.executionNodes[nodeId];
                    return (
                      <article
                        className={`node node-${node.availabilityStatus.toLowerCase()}`}
                        key={node.id}
                      >
                        <span>
                          {node.availabilityStatus === "AVAILABLE" ? (
                            <CheckCircle2 />
                          ) : node.availabilityStatus === "BLOCKED" ? (
                            <CircleDashed />
                          ) : (
                            <Blocks />
                          )}
                          {statusLabel[node.availabilityStatus]}
                        </span>
                        <h3>{node.title}</h3>
                        <p>{kindLabel[node.nodeKind]}</p>
                        <small>Behövs {node.neededAt}</small>
                        <code>{node.id}</code>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <p className="footnote">
            Grafen innehåller {story.prerequisiteNodes.length} stabila noder och{" "}
            {story.dependencies.length} explicita beroenden. Ägarskap behålls
            även när en förutsättning återanvänds.
          </p>
          <Trace values={story.sourceRefs} />
        </section>

        <section id="roadmap" className="section-block roadmap">
          <p className="eyebrow">FORTSATT IMPLEMENTATION</p>
          <h2>Processdelar som ännu inte är implementerade</h2>
          <div className="roadmap-grid">
            {[
              "Lokala effektåtaganden och baseline",
              "Mänskligt startbeslut och låst beslutsversion",
              "Prognos och formell ändringsstyrning",
              "Verifierade mätpunkter och realiserad effekt",
              "Härledd strategisk översikt och lärande",
            ].map((label, index) => (
              <article key={label}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{label}</p>
                <small>Ej implementerad</small>
              </article>
            ))}
          </div>
        </section>
      </main>
      <footer>
        All data och alla namn är syntetiska · Ingen backend, autentisering,
        extern AI eller integration är ansluten
      </footer>
    </div>
  );
}
