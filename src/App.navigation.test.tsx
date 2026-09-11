import { initializeDemoState } from "./application/initializeDemoState";
import { act, create } from "react-test-renderer";
import { describe, expect, it } from "vitest";
import App from "./App";

const text = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object" || !("children" in value)) return "";
  return (value as { children: unknown[] }).children.map(text).join("");
};

it("visar samma leveransberoende via jämförelse och i ärendets detaljsteg",()=>{
  const state=initializeDemoState(),before=JSON.stringify(state);
  const root=create(<App demoState={state}/>).root;
  const click=(label:string)=>act(()=>root.findAllByType("button").find(b=>text(b).trim()===label)!.props.onClick());
  const summary=()=>root.findByProps({"aria-label":"Initiativets beroenden"});
  const check=()=>{expect(text(summary())).toContain("inför leveranser");expect(text(summary())).toContain("Gemensam datamiljö");};
  click("Prioritering");
  act(()=>root.findAllByType("button").find(b=>b.props.className?.includes("comparison-card")&&text(b).includes("Bättre planering"))!.props.onClick());
  expect(root.findByProps({id:"potential"}).props.hidden).toBe(false);
  check();
  act(()=>summary().findAllByType("button").find(b=>b.props["aria-label"]==="Visa förutsättningen: Gemensam datamiljö")!.props.onClick());
  expect(text(root.findByProps({className:"drawer"}))).toContain("Gemensam datamiljö");
  click("← Tillbaka");
  expect(root.findByProps({id:"potential"}).props.hidden).toBe(false);
  check();
  click("Till ärendets flöde");
  act(()=>root.findAllByType("button").find(b=>b.props["aria-label"]?.startsWith("Prioritering:"))!.props.onClick());
  check();
  click("Till ärendets flöde");
  act(()=>root.findAllByType("button").find(b=>b.props["aria-label"]?.startsWith("Lokala effektåtaganden:"))!.props.onClick());
  check();
  expect(JSON.stringify(state)).toBe(before);
});

describe("navigation från arbetslistan", () => {
  it("samlar hjälp och demoinställningar vid arbetsytan och visar tillbaka först när den kan användas",()=>{
    const renderer=create(<App demoState={initializeDemoState()}/>),root=renderer.root;
    const tools=root.findByProps({className:"workspace-tools"});
    expect(tools.findAllByProps({className:"workspace-back"})).toHaveLength(0);
    expect(text(tools.findByProps({"aria-label":"Hela sökvägen"}))).toBe("Kontrollrum");
    expect(tools.findByProps({className:"demo-settings"})).toBeTruthy();
    expect(tools.findByProps({"aria-label":"Hjälp i Kontrollrum · Överblick"})).toBeTruthy();
    const toolbar=root.findByProps({className:"control-toolbar"});
    expect(toolbar.findByProps({"aria-label":"Kontrollrummets vyer"})).toBeTruthy();
    expect(toolbar.findAllByType("select")).toHaveLength(1);
    act(()=>root.findAllByType("button").find(button=>text(button)==="Ärenden")!.props.onClick());
    act(()=>root.findByProps({className:"workspace-back"}).props.onClick());
    expect(root.findAllByProps({className:"workspace-back"})).toHaveLength(0);
    expect(root.findByProps({className:"control-toolbar"})).toBeTruthy();
    renderer.unmount();
  });
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
  const click=(label:string)=>act(()=>root.findAllByType("button").find(b=>text(b).trim()===label.trim())!.props.onClick());
  const trail=()=>root.findAllByType("nav").find(n=>n.props["aria-label"]==="Du är här")!;
  click("Ärenden");
  const search=root.findAllByType("input").find(i=>i.props.placeholder?.includes("Sök"))!;
  act(()=>search.props.onChange({target:{value:"avtal"}}));
  act(()=>root.findAllByType("button").find(b=>b.props.className==="case-open"&&text(b).includes("avtalsuppföljning"))!.props.onClick());
  expect(text(trail())).toContain("Digital fiktiv avtalsuppföljning");
  act(()=>root.findAllByType("button").find(b=>b.props["aria-label"]?.includes("Lokala effektåtaganden"))!.props.onClick());
  expect(text(trail())).toContain("Lokala effektåtaganden");
  click("Beslutshistorik");
  expect(text(trail())).toContain("Beslutshistorik");
  act(()=>trail().findAllByType("button").find(b=>text(b)==="Ärenden")!.props.onClick());
  expect(root.findAllByType("input").find(i=>i.props.placeholder?.includes("Sök"))!.props.value).toBe("avtal");
});

it("går tillbaka genom delvyer med samma ärende, ofärdig text och listurval",()=>{
  const renderer=create(<App demoState={initializeDemoState()}/>),root=renderer.root;
  const click=(label:string)=>act(()=>root.findAllByType("button").find(b=>text(b).trim()===label.trim())!.props.onClick());
  const trail=()=>root.findAllByType("nav").find(n=>n.props["aria-label"]==="Du är här")!;
  const input=(label:string)=>root.findAllByType("input").find(i=>i.props["aria-label"]===label)!;
  const select=(label:string)=>root.findAllByType("select").find(i=>i.props["aria-label"]===label)!;
  click("Ärenden");
  act(()=>input("Sök ärenden").props.onChange({target:{value:"avtal"}}));
  act(()=>select("Sortera ärendelistan").props.onChange({target:{value:"deadline"}}));
  act(()=>root.findAllByType("button").find(b=>b.props.className==="case-open"&&text(b).includes("avtalsuppföljning"))!.props.onClick());
  act(()=>root.findAllByType("button").find(b=>b.props["aria-label"]?.startsWith("Utmaning:"))!.props.onClick());
  const title=()=>root.findAllByType("label").find(l=>text(l)==="Titel *")!.findByType("textarea");
  act(()=>title().props.onChange({target:{value:"Ett osparat förtydligande"}}));
  click("Öppna potential, beroenden och kostnader ");
  expect(text(trail())).toContain("Förutsättningar");
  click("← Tillbaka");
  expect(text(trail())).toContain("Utmaning");
  expect(title().props.value).toBe("Ett osparat förtydligande");
  click("← Tillbaka");
  expect(root.findAllByProps({"aria-label":"Ärendets sammanfattade flöde"})).toHaveLength(1);
  click("← Tillbaka");
  expect(input("Sök ärenden").props.value).toBe("avtal");
  expect(select("Sortera ärendelistan").props.value).toBe("deadline");
});

it("återanvänder sparat utmaningsunderlag i beredningen utan fyra nya inmatningar",()=>{
  const renderer=create(<App demoState={initializeDemoState()}/>),root=renderer.root;
  const button=(label:string)=>root.findAllByType("button").find(b=>text(b).trim()===label.trim())!;
  const click=(label:string)=>act(()=>button(label).props.onClick());
  const field=(label:string,type:"input"|"textarea")=>root.findAllByType("label").find(l=>text(l).replace(/ \*$/,"")===label)!.findByType(type);
  const enter=(label:string,value:string,type:"input"|"textarea"="textarea")=>act(()=>field(label,type).props.onChange({target:{value}}));
  click("Ärenden");click("Registrera utmaning");
  enter("Titel","Kortare väntan","input");enter("Problem","Onödigt långa väntetider");
  act(()=>root.findAllByType("form").find(f=>text(f).includes("Spara utkast i demosessionen"))!.props.onSubmit({preventDefault(){}}));
  expect(root.findAllByProps({"data-step-work":"material"})).toHaveLength(1);
  enter("Nuläge","Manuella köer");enter("Varför strategisk hantering?","Gemensamt behov");
  click("Registrera utmaning för fortsatt beredning");
  expect(button("Registrera initiativ för beredning").props.disabled).toBe(true);
  enter("Syfte","Minska väntan");enter("Önskat förändrat läge","Samordnad återkoppling");enter("Avgränsning","Serviceanmälan");
  enter("Alternativ","Gemensam rutin eller förbättra lokalt");enter("Om vi avstår","Långa väntetider kvarstår");
  act(()=>root.findAllByType("form").find(f=>text(f).includes("Spara businesscase"))!.props.onSubmit({preventDefault(){}}));
  expect(button("Registrera initiativ för beredning").props.disabled).toBe(false);
  expect(root.findAllByType("input").filter(i=>i.props.required)).toHaveLength(0);
  click("Registrera initiativ för beredning");
  expect(root.findAllByType("h1").map(text)).toContain("Kortare väntan");
  expect(root.findAllByProps({"aria-label":"Krav i Bedömd effektpotential"})).toHaveLength(1);
  click("Effekt och beslut");
  expect(root.findAllByType("h1").map(text)).toContain("Kortare väntan");
});

it("återgår till kontrollrummets effektvy med samma urval",()=>{
  const root=create(<App demoState={initializeDemoState()}/>).root;
  const click=(name:string)=>act(()=>root.findAllByType("button").find(b=>text(b).trim()===name)!.props.onClick());
  click("Effektuppföljning");
  const windowEnd=()=>root.findAllByType("label").find(l=>text(l)==="Till")!.findByType("input");
  act(()=>windowEnd().props.onChange({target:{value:"2027-12-31"}}));
  const caseButton=root.findAllByType("button").find(b=>text(b)==="Digital fiktiv avtalsuppföljning")!;
  act(()=>caseButton.props.onClick());
  click("← Tillbaka");
  expect(root.findAllByType("button").find(b=>text(b)==="Effektuppföljning")!.props["aria-pressed"]).toBe(true);
  expect(windowEnd().props.value).toBe("2027-12-31");
});

it("öppnar exakt förutsättning från ärendets sammanfattning och återgår till samma ärende",()=>{
  const state=initializeDemoState(),before=JSON.stringify(state);
  const renderer=create(<App demoState={state}/>),root=renderer.root;
  const click=(label:string)=>act(()=>root.findAllByType("button").find(b=>text(b).trim()===label.trim())!.props.onClick());
  click("Ärenden");
  const row=root.findAllByType("button").find(b=>b.props.className==="case-open"&&text(b).includes("Bättre planering"));
  expect(row).toBeDefined();
  act(()=>row!.props.onClick());
  const title=root.findAllByType("h1").map(text)[0];
  const summary=root.findByProps({"aria-label":"Initiativets beroenden"});
  expect(text(summary)).toContain("inför leveranser");
  const dependency=summary.findAllByType("button").find(b=>b.props["aria-label"]?.startsWith("Visa förutsättningen:"))!;
  const expected=dependency.props["aria-label"].replace("Visa förutsättningen: ","");
  act(()=>dependency.props.onClick());
  expect(text(root.findByProps({className:"drawer"}))).toContain(expected);
  expect(root.findAllByType("h2").map(text)).toContain(expected);
  click("← Tillbaka");
  expect(root.findAllByType("h1").map(text)).toContain(title);
  expect(root.findAllByProps({"aria-label":"Initiativets beroenden"})).toHaveLength(1);
  expect(JSON.stringify(state)).toBe(before);
});
