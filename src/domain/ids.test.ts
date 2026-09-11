import { describe, expect, it } from "vitest";
import { createId, idTypes } from "./ids";

describe("brandad ID-fabrik", () => {
  it("skapar unika syntetiska ID:n för samtliga domänslag", () => {
    const ids = idTypes.map((kind) => createId(kind, "unique-001"));
    expect(new Set(ids).size).toBe(idTypes.length);
  });

  it("är stabil för samma objektslag och token", () => {
    expect(createId("Initiative", "stable-001")).toBe(
      createId("Initiative", "stable-001"),
    );
  });

  it("avvisar tokens som kan vara härledda presentationssträngar", () => {
    expect(() => createId("Challenge", "Titel med blanksteg")).toThrow();
  });
});
