import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { qualificationAreas } from "../domain";
import { demoIds } from "../demo-data/createDemoData";
import { stage2Ids } from "../demo-data/stage2DemoData";
import { baseDemoState } from "../tests/fixtures/baseDemoState";
import {
  EffectPotentialWorkspace,
  PriorityWorkspace,
  QualificationWorkspace,
  StrategicChallengeWorkspace,
} from "./Stage2Workspaces";
import { stage2Help } from "./stage2Help";

describe("etapp 2-arbetsytor", () => {
  it("följer samma ChallengeId och InitiativeId genom fyra arbetsytor", () => {
    const state = baseDemoState();
    state.viewContext.activeInitiativeId = stage2Ids.calculatedInitiative;
    state.viewContext.activeChallengeId =
      state.entities.initiatives[stage2Ids.calculatedInitiative].challengeId;
    const html = renderToStaticMarkup(
      <>
        <StrategicChallengeWorkspace state={state} />
        <QualificationWorkspace
          state={state}
          initiativeId={stage2Ids.calculatedInitiative}
        />
        <EffectPotentialWorkspace
          state={state}
          initiativeId={stage2Ids.calculatedInitiative}
        />
        <PriorityWorkspace
          state={state}
          initiativeId={stage2Ids.calculatedInitiative}
        />
      </>,
    );
    expect(html).toContain(stage2Ids.calculatedInitiative);
    expect(html).toContain(state.viewContext.activeChallengeId);
  });
  it("visar exakt sex kvalificeringsområden", () => {
    const html = renderToStaticMarkup(
      <QualificationWorkspace
        state={baseDemoState()}
        initiativeId={stage2Ids.qualifiedInitiative}
      />,
    );
    qualificationAreas.forEach((area) =>
      expect(html).toContain(
        area === "STRATEGIC_RELEVANCE"
          ? "Strategisk relevans och utmaning"
          : area === "EFFECT_POTENTIAL"
            ? "Effektpotential och evidens"
            : area === "FEASIBILITY"
              ? "Genomförbarhet och förutsättningar"
              : area === "ECONOMY_CAPACITY"
                ? "Ekonomi och kapacitet"
                : area === "QUALITY_LEGAL_SECURITY"
                  ? "Kvalitet, juridik och informationssäkerhet"
                  : "Verksamhetsförändring och mottagande",
      ),
    );
    expect(html.match(/class="stage2-area"/g)).toHaveLength(6);
  });
  it("byter initiativdata utan att blanda potential eller prioritering", () => {
    const state = baseDemoState();
    const qualified = renderToStaticMarkup(
      <EffectPotentialWorkspace
        state={state}
        initiativeId={stage2Ids.qualifiedInitiative}
      />,
    );
    const calculated = renderToStaticMarkup(
      <EffectPotentialWorkspace
        state={state}
        initiativeId={stage2Ids.calculatedInitiative}
      />,
    );
    expect(qualified).toContain("1200");
    expect(qualified).not.toContain("QUALITY");
    expect(calculated).toContain("QUALITY");
    expect(
      renderToStaticMarkup(
        <PriorityWorkspace
          state={state}
          initiativeId={stage2Ids.qualifiedInitiative}
        />,
      ),
    ).toContain("saknar beräknat prioriteringsunderlag");
  });
  it("visar obligatorisk icke-bindande märkning", () =>
    expect(
      renderToStaticMarkup(
        <EffectPotentialWorkspace
          state={baseDemoState()}
          initiativeId={stage2Ids.qualifiedInitiative}
        />,
      ),
    ).toContain("Bedömd potential – inte beslutad effekthemtagning."));
  it("visar profilversion och mänsklig status", () => {
    const html = renderToStaticMarkup(
      <PriorityWorkspace
        state={baseDemoState()}
        initiativeId={stage2Ids.acceptedInitiative}
      />,
    );
    expect(html).toContain("version 1");
    expect(html).toContain("ACCEPTED");
  });
  it("visar blockerarens ansvar, deadline och blockerat steg", () => {
    const html = renderToStaticMarkup(
      <QualificationWorkspace
        state={baseDemoState()}
        initiativeId={demoIds.mainInitiative}
      />,
    );
    expect(html).toContain("Ansvarig: Saknas");
    expect(html).toContain("Deadline: Saknas");
    expect(html).toContain("Blockerar: QUALIFICATION");
  });
  it("har hjälptexter för samtliga föreskrivna begrepp", () => {
    expect(Object.keys(stage2Help)).toHaveLength(13);
    Object.values(stage2Help).forEach((text) =>
      expect(text.length).toBeGreaterThan(50),
    );
  });
  it("byter inte aktivt ärende under rendering", () => {
    const state = baseDemoState();
    const before = structuredClone(state.viewContext);
    renderToStaticMarkup(<StrategicChallengeWorkspace state={state} />);
    expect(state.viewContext).toEqual(before);
  });
  it("beräknar inte kvalificering eller prioritet i presentationskomponenterna", () => {
    const html = renderToStaticMarkup(
      <PriorityWorkspace
        state={baseDemoState()}
        initiativeId={stage2Ids.calculatedInitiative}
      />,
    );
    expect(html).toContain("Transparent prioriteringsunderlag");
    expect(html).not.toContain("Genomförandeordning:");
  });
});
