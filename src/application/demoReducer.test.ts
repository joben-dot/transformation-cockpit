import { describe, expect, it } from "vitest";
import { createId, type RoleAssignmentId } from "../domain";
import { demoIds } from "../demo-data/createDemoData";
import { organizationIds } from "../demo-data/organizations";
import { baseDemoState } from "../tests/fixtures/baseDemoState";
import type { Command } from "./commands";
import { demoReducer } from "./demoReducer";

const metadata = (state = baseDemoState()) => ({
  commandId: createId("Command", "command-001"),
  actorRoleAssignmentId: Object.keys(
    state.entities.roleAssignments,
  )[0] as RoleAssignmentId,
  issuedAt: "2026-09-06T10:00:00Z",
});

describe("gemensam command- och reducergrund", () => {
  it("ändrar aktivt initiativ endast med explicit targetId", () => {
    const state = baseDemoState();
    const result = demoReducer(state, {
      ...metadata(state),
      commandType: "SET_ACTIVE_INITIATIVE",
      targetId: demoIds.mainInitiative,
    });
    expect(result.success).toBe(true);
    expect(result.nextState.viewContext.activeInitiativeId).toBe(
      demoIds.mainInitiative,
    );
  });

  it("låter arbetsurval vara skilt från aktivt initiativ", () => {
    const state = baseDemoState();
    const activeBefore = state.viewContext.activeInitiativeId;
    const result = demoReducer(state, {
      ...metadata(state),
      commandType: "SET_WORKING_SELECTION",
      payload: { entityIds: [demoIds.controlChallenge] },
    });
    expect(result.nextState.viewContext.activeInitiativeId).toBe(activeBefore);
    expect(result.nextState.viewContext.workingSelectionIds).toEqual([
      demoIds.controlChallenge,
    ]);
  });

  it("låter perspektivbyte vara skilt från deltagande", () => {
    const state = baseDemoState();
    const participationsBefore = structuredClone(state.entities.participations);
    const result = demoReducer(state, {
      ...metadata(state),
      commandType: "SET_VIEW_PERSPECTIVE",
      payload: { perspective: { kind: "FEDERATED" } },
    });
    expect(result.nextState.entities.participations).toEqual(
      participationsBefore,
    );
  });

  it("låter organisationsperspektiv ändras utan domändatamutation", () => {
    const state = baseDemoState();
    const entitiesBefore = structuredClone(state.entities);
    const result = demoReducer(state, {
      ...metadata(state),
      commandType: "SET_VIEW_PERSPECTIVE",
      payload: {
        perspective: {
          kind: "ORGANIZATION",
          organizationId: organizationIds.south,
        },
      },
    });
    expect(result.nextState.entities).toEqual(entitiesBefore);
    expect(result.nextState.viewContext.selectedPerspective).toEqual({
      kind: "ORGANIZATION",
      organizationId: organizationIds.south,
    });
  });

  it("misslyckas för ett okänt explicit mål-ID", () => {
    const state = baseDemoState();
    const result = demoReducer(state, {
      ...metadata(state),
      commandType: "SET_ACTIVE_INITIATIVE",
      targetId: createId("Initiative", "missing"),
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors[0].code).toBe("TARGET_NOT_FOUND");
  });

  it("returnerar exakt ursprungligt state vid fel", () => {
    const state = baseDemoState();
    const result = demoReducer(state, {
      ...metadata(state),
      commandType: "SET_ACTIVE_CHALLENGE",
      targetId: createId("Challenge", "missing"),
    });
    expect(result.nextState).toBe(state);
  });

  it("lämnar state-innehållet oförändrat vid fel", () => {
    const state = baseDemoState();
    const before = structuredClone(state);
    demoReducer(state, {
      ...metadata(state),
      commandType: "SET_ACTIVE_CHALLENGE",
      targetId: createId("Challenge", "missing"),
    });
    expect(state).toEqual(before);
  });

  it("skapar ett nytt state vid lyckat command", () => {
    const state = baseDemoState();
    const result = demoReducer(state, {
      ...metadata(state),
      commandType: "SET_WORKING_SELECTION",
      payload: { entityIds: [demoIds.mainInitiative] },
    });
    expect(result.success).toBe(true);
    expect(result.nextState).not.toBe(state);
  });

  it("registrerar lyckade commands i audit", () => {
    const state = baseDemoState();
    const result = demoReducer(state, {
      ...metadata(state),
      commandType: "SET_ACTIVE_CHALLENGE",
      targetId: demoIds.controlChallenge,
    });
    expect(result.nextState.audit).toHaveLength(1);
    expect(result.nextState.audit[0]).toMatchObject({
      commandType: "SET_ACTIVE_CHALLENGE",
      affectedEntityIds: [demoIds.controlChallenge],
    });
  });

  it("godkänner inte ett post-state med fel organisation för verksamheten", () => {
    const state = baseDemoState();
    const targetId = createId("Participation", "invalid-business-organization");
    const command: Command = {
      ...metadata(state),
      commandType: "ADD_PARTICIPATION",
      targetId,
      payload: {
        initiativeId: demoIds.mainInitiative,
        organizationId: organizationIds.north,
        businessId: Object.values(state.entities.businesses)[1].id,
        participantKind: "PARTICIPANT",
        validFrom: "2026-09-06",
      },
    };
    const result = demoReducer(state, command);
    expect(result.success).toBe(false);
    expect(result.nextState).toBe(state);
  });

  it("kan skapa två initiativ utan sammanblandning", () => {
    const state = baseDemoState();
    const secondId = createId("Initiative", "initiative-002");
    const result = demoReducer(state, {
      ...metadata(state),
      commandType: "CREATE_INITIATIVE_FROM_CHALLENGE",
      targetId: secondId,
      payload: {
        challengeId: demoIds.controlChallenge,
        title: "Separat syntetiskt initiativ",
        purpose: "Verifiera isolering.",
        desiredEndState: "Separat spårbarhet.",
        initiativeKind: "ENABLING",
        scope: "Kontrollärendet.",
      },
    });
    expect(result.success).toBe(true);
    expect(
      result.nextState.entities.initiatives[demoIds.mainInitiative].challengeId,
    ).toBe(demoIds.mainChallenge);
    expect(result.nextState.entities.initiatives[secondId].challengeId).toBe(
      demoIds.controlChallenge,
    );
  });

  it("skapar en strategisk utmaning med explicit mål-ID och aktör", () => {
    const state = baseDemoState();
    const challengeId = createId("Challenge", "challenge-003");
    const result = demoReducer(state, {
      ...metadata(state),
      commandType: "CREATE_STRATEGIC_CHALLENGE",
      targetId: challengeId,
      payload: {
        title: "Ny syntetisk utmaning",
        problemStatement: "Ett fiktivt problem behöver beskrivas.",
        currentState: "Syntetiskt nuläge.",
        source: "Syntetisk observation",
        strategicRelevance: "Demorelevant",
        strategicHandlingReason: "Kräver gemensam hantering.",
        nominationStatus: "DRAFT",
      },
    });
    expect(result.success).toBe(true);
    expect(result.nextState.entities.challenges[challengeId]).toMatchObject({
      id: challengeId,
      initiatorRoleAssignmentId: metadata(state).actorRoleAssignmentId,
    });
  });

  it("lägger till en separat deltaganderelation med explicit mål-ID", () => {
    const state = baseDemoState();
    const participationId = createId("Participation", "participation-004");
    const result = demoReducer(state, {
      ...metadata(state),
      commandType: "ADD_PARTICIPATION",
      targetId: participationId,
      payload: {
        initiativeId: demoIds.mainInitiative,
        organizationId: organizationIds.north,
        participantKind: "COST_BEARER",
        validFrom: "2026-09-06",
      },
    });
    expect(result.success).toBe(true);
    expect(
      result.nextState.entities.participations[participationId],
    ).toMatchObject({
      initiativeId: demoIds.mainInitiative,
      participantKind: "COST_BEARER",
    });
  });

  it("avvisar redan bruten referensintegritet utan delmutation", () => {
    const state = baseDemoState();
    Object.values(state.entities.initiatives)[0].challengeId = createId(
      "Challenge",
      "missing",
    );
    const result = demoReducer(state, {
      ...metadata(state),
      commandType: "SET_WORKING_SELECTION",
      payload: { entityIds: [] },
    });
    expect(result.success).toBe(false);
    expect(result.nextState).toBe(state);
    if (!result.success)
      expect(result.errors[0].code).toBe("POST_STATE_INVALID");
  });
});
