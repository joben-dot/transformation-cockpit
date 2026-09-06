import { initializeDemoState } from "./application/initializeDemoState";
import { act, create } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import App from "./App";

const text = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object" || !("children" in value)) return "";
  return (value as { children: unknown[] }).children.map(text).join("");
};

describe("navigation från arbetslistan", () => {
  it("öppnar verkligt renderad prioriteringsvy och kan återgå", () => {
    const renderer = create(<App demoState={initializeDemoState()} />);
    const priority = renderer.root.findAllByType("button").find((button) => text(button) === "Prioritering")!;
    act(() => priority.props.onClick());
    expect(renderer.root.findAllByType("h2").map(text)).toContain("Prioriteringsunderlag · 3 valda initiativ");
    const back = renderer.root.findAllByType("button").find((button) => text(button) === "Ärenden")!;
    act(() => back.props.onClick());
    expect(renderer.root.findAllByType("h1").map(text)).toContain("Vad behöver ledningens uppmärksamhet?");
  });

  it("behåller bortvalda kandidater till nästa scenario", () => {
    const renderer = create(<App demoState={initializeDemoState()} />);
    act(() => renderer.root.findAllByType("button").find((button) => text(button) === "Prioritering")!.props.onClick());
    let choices = renderer.root.findAllByType("input").filter((input) => input.props.type === "checkbox");
    expect(choices).toHaveLength(3);
    act(() => choices[2].props.onChange({ target: { checked: false } }));
    act(() => renderer.root.findAllByType("button").find((button) => text(button) === "Skapa nytt prioriteringsscenario")!.props.onClick());
    choices = renderer.root.findAllByType("input").filter((input) => input.props.type === "checkbox");
    expect(choices).toHaveLength(3);
    act(() => choices[2].props.onChange({ target: { checked: true } }));
    expect(renderer.root.findAllByType("input").filter((input) => input.props.type === "checkbox" && input.props.checked)).toHaveLength(3);
  });
});

it("visar faktisk plats genom ärendets delar och bevarar listans sökning",()=>{
  const root=create(<App demoState={initializeDemoState()}/>).root;
  const click=(label:string)=>act(()=>root.findAllByType("button").find(b=>text(b)===label)!.props.onClick());
  const trail=()=>root.findAllByType("nav").find(n=>n.props["aria-label"]==="Du är här")!;
  click("Ärenden");
  const search=root.findAllByType("input").find(i=>i.props.placeholder?.includes("Sök"))!;
  act(()=>search.props.onChange({target:{value:"avtal"}}));
  act(()=>root.findAllByType("button").find(b=>b.props.role==="row"&&text(b).includes("avtalsuppföljning"))!.props.onClick());
  expect(text(trail())).toContain("Digital fiktiv avtalsuppföljning");
  act(()=>root.findAllByType("button").find(b=>b.props["aria-label"]?.includes("Lokala effektåtaganden"))!.props.onClick());
  expect(text(trail())).toContain("Lokala effektåtaganden");
  click("4. Beslutshistorik");
  expect(text(trail())).toContain("Beslutshistorik");
  act(()=>trail().findAllByType("button").find(b=>text(b)==="Ärenden")!.props.onClick());
  expect(root.findAllByType("input").find(i=>i.props.placeholder?.includes("Sök"))!.props.value).toBe("avtal");
});
