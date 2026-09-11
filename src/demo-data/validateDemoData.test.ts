import { describe, expect, it } from "vitest";
import { createId } from "../domain";
import { createDemoData } from "./createDemoData";
import { validateDemoState } from "./validateDemoData";

describe("syntetisk grunddata", () => {
  it("har matchande Record-nycklar och objekt-ID:n", () => {
    const state = createDemoData();
    for (const records of Object.values(state.entities)) {
      for (const [key, entity] of Object.entries(records) as [
        string,
        { id: string },
      ][]) {
        expect(key).toBe(entity.id);
      }
    }
  });

  it("har globalt unika ID:n", () => {
    const ids = Object.values(createDemoData().entities).flatMap((records) =>
      Object.keys(records),
    );
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("har giltiga relationer", () => {
    expect(validateDemoState(createDemoData())).toEqual([]);
  });

  it("håller juridisk organisation och organisatorisk enhet isär", () => {
    const { entities } = createDemoData();
    expect(Object.values(entities.organizations)).toHaveLength(2);
    expect(Object.values(entities.organizationalUnits)).toHaveLength(2);
    expect(Object.values(entities.organizationalUnits)[0]).toHaveProperty(
      "organizationId",
    );
  });

  it("håller person, befattning, rollrelation och mandat isär", () => {
    const { entities } = createDemoData();
    expect(Object.values(entities.people)[0]).not.toHaveProperty("roleKind");
    expect(Object.values(entities.positions)[0]).not.toHaveProperty("personId");
    expect(Object.values(entities.roleAssignments)[0]).toHaveProperty(
      "personId",
    );
    expect(Object.values(entities.mandates)[0]).toHaveProperty(
      "roleAssignmentId",
    );
  });

  it("håller förmåga och organisatorisk hemvist isär", () => {
    const { entities } = createDemoData();
    expect(Object.values(entities.capabilities)[0]).not.toHaveProperty(
      "organizationId",
    );
    expect(Object.values(entities.organizationalUnits)[0]).toHaveProperty(
      "organizationId",
    );
  });

  it("låter inte en resursallokering ändra organisatorisk hemvist", () => {
    const state = createDemoData();
    const assignmentBefore = structuredClone(
      Object.values(state.entities.roleAssignments)[1],
    );
    expect(
      Object.values(state.entities.resourceAllocations)[0].roleAssignmentId,
    ).toBe(assignmentBefore.id);
    expect(Object.values(state.entities.roleAssignments)[1]).toEqual(
      assignmentBefore,
    );
  });

  it("rapporterar en Record-nyckel som inte matchar objektets ID", () => {
    const state = createDemoData();
    const organization = Object.values(state.entities.organizations)[0];
    delete state.entities.organizations[organization.id];
    state.entities.organizations[createId("Organization", "wrong-key")] =
      organization;
    expect(validateDemoState(state)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "KEY_ID_MISMATCH" }),
      ]),
    );
  });

  it("rapporterar en bruten foreign key", () => {
    const state = createDemoData();
    Object.values(state.entities.initiatives)[0].challengeId = createId(
      "Challenge",
      "missing",
    );
    expect(validateDemoState(state)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "MISSING_REFERENCE" }),
      ]),
    );
  });

  it("rapporterar en verksamhet som tillhör fel organisation", () => {
    const state = createDemoData();
    const participation = Object.values(state.entities.participations)[0];
    participation.organizationId = Object.values(
      state.entities.organizations,
    )[1].id;
    expect(validateDemoState(state)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "ORGANIZATION_MISMATCH" }),
      ]),
    );
  });

  it("innehåller inga förbjudna verkliga namn", () => {
    const state = createDemoData();
    expect(
      validateDemoState(state).filter(
        (error) => error.code === "FORBIDDEN_DEMO_NAME",
      ),
    ).toEqual([]);
  });

  it("kan byta organisationsnamn utan att relationerna påverkas", () => {
    const state = createDemoData();
    Object.values(state.entities.organizations)[0].name =
      "Helt annat fiktivt namn";
    expect(validateDemoState(state)).toEqual([]);
  });
});
