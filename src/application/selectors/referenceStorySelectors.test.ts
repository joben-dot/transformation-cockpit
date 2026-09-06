import { describe, expect, it } from "vitest";
import { stage3Ids } from "../../demo-data/stage3DemoData";
import { baseDemoState } from "../../tests/fixtures/baseDemoState";
import { referenceStory } from "./referenceStorySelectors";

describe("referenceStory", () => {
  it("följer samma initiativ till potential och transitiva förutsättningar", () => {
    const state = baseDemoState();
    const story = referenceStory(state, stage3Ids.valueInitiative)!;
    expect(story.initiative.id).toBe(stage3Ids.valueInitiative);
    expect(story.challenge.id).toBe(story.initiative.challengeId);
    expect(
      story.effectPotentials.every(
        (item) => item.initiativeId === story.initiative.id,
      ),
    ).toBe(true);
    expect(story.prerequisiteNodes).toContain(
      state.entities.executionNodes[stage3Ids.sharedNode],
    );
    expect(story.enablingInitiatives.map((item) => item.id)).toContain(
      stage3Ids.enablingInitiative,
    );
  });

  it("återanvänder originalobjekt och skapar inga beslut eller effektutfall", () => {
    const state = baseDemoState();
    const before = structuredClone(state);
    const story = referenceStory(state, stage3Ids.valueInitiative)!;
    expect(
      story.prerequisiteNodes.find((item) => item.id === stage3Ids.sharedNode),
    ).toBe(state.entities.executionNodes[stage3Ids.sharedNode]);
    expect(state).toEqual(before);
    expect(state.entities.humanDecisions).toEqual({});
    expect(state.entities.measurementPoints).toEqual({});
  });
});

describe("strategicComparison", () => {
  it("jämför tre fiktiva värdeskapande initiativ med versionsbundna källor", async () => {
    const { strategicComparison } = await import("./referenceStorySelectors");
    const comparison = strategicComparison(baseDemoState());
    expect(comparison).toHaveLength(3);
    expect(comparison.every((item) => item.profile.versionNumber === 1)).toBe(
      true,
    );
    expect(comparison.every((item) => item.potentials.length > 0)).toBe(true);
    expect(
      comparison.every((item) =>
        item.sourceRefs.includes(item.assessment.steeringProfileVersionId),
      ),
    ).toBe(true);
  });

  it("räknar den delade kostnaden en gång per vald berättelse", () => {
    const state = baseDemoState();
    const main = referenceStory(state, stage3Ids.valueInitiative)!;
    const reuse = referenceStory(state, stage3Ids.reuseInitiative)!;
    expect(main.costBreakdown.oneTimeAmount).toBe(1_440_000);
    expect(reuse.costBreakdown.oneTimeAmount).toBe(900_000);
    expect(
      main.costBreakdown.sourceRefs.filter((id) => id === stage3Ids.sharedCost),
    ).toHaveLength(1);
  });
});
