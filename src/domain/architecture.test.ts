/// <reference types="vite/client" />
import { describe, expect, it } from "vitest";

const domainSources = import.meta.glob("./*.ts", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;
const productionSources = Object.entries(domainSources).filter(
  ([path]) => !path.endsWith(".test.ts"),
);

describe("domänlagrets arkitekturgräns", () => {
  it("importerar inte React", () => {
    productionSources.forEach(([, source]) =>
      expect(source).not.toMatch(/from ['"]react/),
    );
  });

  it("känner inte till sidnavigation eller visuella komponenter", () => {
    productionSources.forEach(([, source]) =>
      expect(source).not.toMatch(/selectedWorkspace|React\.FC|JSX\./),
    );
  });

  it("jämför inte organisationsnamn i domänlogiken", () => {
    productionSources.forEach(([, source]) =>
      expect(source).not.toMatch(
        /organization\.name\s*={2,3}|name\s*={2,3}\s*organization/,
      ),
    );
  });
});
