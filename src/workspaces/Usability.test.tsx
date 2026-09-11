import { act, create } from "react-test-renderer";
import { expect, it } from "vitest";
import { initializeDemoState } from "../application/initializeDemoState";
import { stage3Ids } from "../demo-data/stage3DemoData";
import { journeyFlow } from "./journeyModel";
import { processGuide } from "./processGuide";
import { PortfolioLens } from "./PortfolioLens";
import { SessionDrafts } from "./SessionDrafts";
import { AssessmentEditors } from "./AssessmentEditors";
const text = (n:unknown):string => typeof n === "string" ? n : n && typeof n === "object" && "children" in n ? (n as {children:unknown[]}).children.map(text).join("") : "";

it("visar metodens tio steg och lägger ofullständig nyttokalkyl i businesscase", () => {
  const state = initializeDemoState(), id = state.entities.initiatives[stage3Ids.valueInitiative].challengeId;
  const before = JSON.stringify(state);
  const steps = journeyFlow(state, id, "2026-10-01");
  expect(steps.map(s => s.title)).toEqual(processGuide.filter(s => s.number > 0).map(s => s.title));
  expect(steps.map(s => s.number)).toEqual([1,2,3,4,5,6,7,8,9,10]);
  expect(JSON.stringify(state)).toBe(before);
  state.entities.effectPotentials = {};
  const businesscase = journeyFlow(state, id, "2026-10-01")[1];
  expect(businesscase.status).not.toBe("COMPLETE");
});

it("visar saknad kostnad som okänt underlag och stoppar ett omvänt planfönster", () => {
  const state = initializeDemoState(); state.entities.costEntries = {};
  const props = {state,area:"Alla",day:"2026-10-01",from:"2026-01-01",to:"2030-12-31",mode:"plan" as const,open:()=>{},openNode:()=>{}};
  const renderer = create(<PortfolioLens {...props}/>);
  act(() => renderer.root.findAllByType("select")[0].props.onChange({target:{value:"capacity"}}));
  expect(text(renderer.root)).toContain("Kostnadsunderlag saknas");
  expect(text(renderer.root)).toContain("hela angivna period");
  act(() => renderer.update(<PortfolioLens {...props} from="2031-01-01"/>));
  expect(renderer.root.findByProps({role:"alert"})).toBeDefined();
});

it("bevarar en osparad nyttokalkyl när användaren hoppar fram och tillbaka", () => {
  const state=initializeDemoState(), dispatch=()=>{throw Error("Navigering får inte spara domändata");};
  const view=(visible:boolean)=><SessionDrafts>{visible&&<AssessmentEditors state={state} initiativeId={stage3Ids.valueInitiative} dispatch={dispatch} section="potential"/>}</SessionDrafts>;
  const renderer=create(view(true));
  const field=()=>renderer.root.findAllByType("label").find(l=>text(l)==="Antagande")!.findByType("input");
  act(()=>field().props.onChange({target:{value:"Kontrollera volym med verksamheten"}}));
  act(()=>renderer.update(view(false)));
  act(()=>renderer.update(view(true)));
  expect(field().props.value).toBe("Kontrollera volym med verksamheten");
});
