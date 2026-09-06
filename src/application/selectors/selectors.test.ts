import { describe, expect, it } from "vitest";
import { createId } from "../../domain";
import { demoIds } from "../../demo-data/createDemoData";
import { businessIds, organizationIds } from "../../demo-data/organizations";
import { baseDemoState } from "../../tests/fixtures/baseDemoState";
import {
  selectActiveChallenge,
  selectActiveInitiative,
  selectInitiativeTrace,
  selectOriginatingChallenge,
  selectParticipationsByInitiative,
  selectRelationsByBusiness,
  selectRelationsByOrganization,
} from "./index";

describe("grundselectors", () => {
  it("väljer aktiv strategisk utmaning från ViewContext", () => {
    expect(selectActiveChallenge(baseDemoState())?.id).toBe(
      demoIds.mainChallenge,
    );
  });

  it("väljer aktivt initiativ från ViewContext", () => {
    expect(selectActiveInitiative(baseDemoState())?.id).toBe(
      demoIds.mainInitiative,
    );
  });

  it("hittar initiativets ursprungliga utmaning via explicit initiativ-ID", () => {
    expect(
      selectOriginatingChallenge(baseDemoState(), demoIds.mainInitiative)?.id,
    ).toBe(demoIds.mainChallenge);
  });

  it("returnerar inget för ett okänt explicit initiativ-ID", () => {
    expect(
      selectOriginatingChallenge(
        baseDemoState(),
        createId("Initiative", "missing"),
      ),
    ).toBeUndefined();
  });

  it("väljer samtliga deltagandetyper för samma initiativ", () => {
    const participations = selectParticipationsByInitiative(
      baseDemoState(),
      demoIds.mainInitiative,
    );
    expect(participations.map((item) => item.participantKind)).toEqual([
      "INITIATOR",
      "EFFECT_RECIPIENT",
      "DELIVERY_PARTICIPANT",
    ]);
  });

  it("väljer relationer per organisation utan namnberoende", () => {
    expect(
      selectRelationsByOrganization(baseDemoState(), organizationIds.south),
    ).toHaveLength(2);
  });

  it("väljer relationer per verksamhet", () => {
    expect(
      selectRelationsByBusiness(baseDemoState(), businessIds.response),
    ).toHaveLength(2);
  });

  it("bygger en spårbar kedja från utmaning till deltaganden", () => {
    expect(
      selectInitiativeTrace(baseDemoState(), demoIds.mainInitiative),
    ).toMatchObject({
      challengeId: demoIds.mainChallenge,
      initiativeId: demoIds.mainInitiative,
      participationIds: expect.arrayContaining([
        createId("Participation", "participation-001"),
        createId("Participation", "participation-002"),
      ]),
    });
  });
});
