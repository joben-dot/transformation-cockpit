import { act, create } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import { initializeDemoState } from "../application/initializeDemoState";
import { prerequisiteGraph, unavailableStartPrerequisites } from "../application/selectors/executionSelectors";
import { isInitiativeQualified } from "../application/selectors/qualificationSelectors";
import { stage3Ids } from "../demo-data/stage3DemoData";
import { InitiativeDependencies } from "./InitiativeDependencies";

const text = (value: unknown): string => typeof value === "string" ? value : value && typeof value === "object" && "children" in value
  ? (value as {children:unknown[]}).children.map(text).join("") : "";
const id = stage3Ids.valueInitiative;

describe("beroenden direkt i ärendeflödet", () => {
  it("visar startstopp, faktisk ägare och datum, utan att ändra prioritering eller fatta beslut", () => {
    const state = initializeDemoState(), before = JSON.stringify(state), open = vi.fn();
    const node = unavailableStartPrerequisites(state, id)[0];
    const view = create(<InitiativeDependencies state={state} id={id} day="2026-09-06" onOpen={open}/>);
    expect(text(view.root)).toContain("Start blockeras av");
    expect(text(view.root)).toContain(node.title);
    expect(text(view.root)).toContain(node.neededAt);
    expect(text(view.root)).toContain("Beroendet hindrar inte i sig beredning eller prioritering");
    const button = view.root.findAllByType("button").find(b => b.props["aria-label"] === `Visa förutsättningen: ${node.title}`)!;
    act(() => button.props.onClick());
    expect(open).toHaveBeenCalledWith(node.id);
    expect(isInitiativeQualified(state, id)).toBe(true);
    expect(JSON.stringify(state)).toBe(before);
  });
  it("skiljer senare milstolpar från startstopp", () => {
    const state = initializeDemoState();
    for (const edge of prerequisiteGraph(state,id).dependencies) edge.requiredAt = "MILESTONE";
    const view = create(<InitiativeDependencies state={state} id={id} day="2026-09-06" onOpen={()=>{}}/>);
    expect(unavailableStartPrerequisites(state,id)).toHaveLength(0);
    expect(text(view.root)).not.toContain("Start blockeras");
    expect(text(view.root)).toContain("Krävs vid senare milstolpe");
  });
  it("visar saknade ansvar och datum och deklarerar inte automatisk startklarhet när beroenden lösts", () => {
    const state = initializeDemoState();
    const nodes = prerequisiteGraph(state,id).nodes;
    for (const node of nodes) { node.responsibleRoleAssignmentId = undefined; node.neededAt = ""; }
    const view = create(<InitiativeDependencies state={state} id={id} day="2026-09-06" onOpen={()=>{}}/>);
    expect(text(view.root)).toContain("Ansvarig saknas");expect(text(view.root)).toContain("Datum saknas");
    for (const node of nodes) node.availabilityStatus = "AVAILABLE";
    act(()=>view.update(<InitiativeDependencies state={state} id={id} day="2026-09-06" onOpen={()=>{}}/>));
    expect(text(view.root)).not.toContain("Start blockeras");
    expect(text(view.root)).toContain("Övriga startkrav och ett mänskligt startbeslut behöver fortfarande prövas");
    expect(Object.values(state.entities.decisionVersions)).toHaveLength(0);
  });
  it("visar inga falska startstopp för rådgivande relationer eller avslutade initiativ", () => {
    const state = initializeDemoState();
    for (const edge of prerequisiteGraph(state,id).dependencies) edge.blocking=false;
    expect(create(<InitiativeDependencies state={state} id={id} day="2026-09-06" onOpen={()=>{}}/>).toJSON()).toBeNull();
    for (const edge of prerequisiteGraph(state,id).dependencies) edge.blocking=true;
    state.entities.initiatives[id].closedAt="2026-09-06";
    expect(create(<InitiativeDependencies state={state} id={id} day="2026-09-06" onOpen={()=>{}}/>).toJSON()).toBeNull();
  });
});
