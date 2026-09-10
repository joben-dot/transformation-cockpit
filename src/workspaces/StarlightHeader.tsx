import { useEffect, useRef } from "react";
import { startStarlight } from "./starlight";
import "./StarlightHeader.css";

const phrases = ["En verklig utmaning", "Rätt saker först", "Kraften mellan oss", "Effekt som märks", "Mer än var för sig"];

export function StarlightHeader() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (root.current) return startStarlight(root.current);
  }, []);
  return <div className="cosmic-mast" ref={root}>
    <div className="cosmos">
      <canvas role="img" aria-label="Symbolisk stjärnglob: valda samband tänder effektkluster och nya stjärnor mellan dem. Illustrationen är en metafor, inte verkliga effektdata.">
        Stjärnkluster förenas och tänder nya stjärnor mellan sig.
      </canvas>
      <div className="starwords" role="group" aria-label="Utforska berättelsen. Välj ett uttryck för att framhäva sambanden, välj det igen för att återgå.">
        {phrases.map((phrase, i) => <button type="button" key={phrase} data-story={i} aria-pressed={false}>{phrase}</button>)}
      </div>
      <button type="button" className="pause" aria-pressed={false}>Pausa rörelsen</button>
    </div>
    <div className="cosmic-identity">
      <a className="cosmic-title" href="#top" aria-label="Transformation Cockpit – överst på sidan">Transformation <span>Cockpit</span></a>
      <p className="cosmic-subtitle">Från utmaning till verifierad effekt.</p>
      <blockquote className="cosmic-principle" aria-label="Vår utgångspunkt">
        Vi motiverar det som behöver vara gemensamt.<br/>
        Vi lämnar utrymme för lokalt genomförande.<br/>
        <strong>Vi kräver ansvar för effekten i båda fallen.</strong>
      </blockquote>
    </div>
  </div>;
}
