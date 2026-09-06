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
