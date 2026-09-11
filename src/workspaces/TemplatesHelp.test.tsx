import { act, create, type ReactTestInstance } from "react-test-renderer";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TemplatesHelp } from "./TemplatesHelp";
import { processGuide } from "./processGuide";
import { readTemplateResources, saveTemplateResource, type TemplateResource } from "./templateRegistry";
import App from "../App";
import { initializeDemoState } from "../application/initializeDemoState";
vi.mock("./templateRegistry",async importOriginal=>({...await importOriginal<typeof import("./templateRegistry")>(),readTemplateResources:vi.fn(),saveTemplateResource:vi.fn()}));
const text=(node:ReactTestInstance|string):string=>typeof node==="string"?node:node.children.map(child=>typeof child==="string"?child:text(child)).join("");
const input=(root:ReactTestInstance,label:string)=>root.findAllByType("label").find(node=>text(node).startsWith(label))!.findByType("input");
let saved:TemplateResource[]=[];
beforeEach(()=>{saved=[];vi.mocked(readTemplateResources).mockImplementation(async()=>[...saved]);vi.mocked(saveTemplateResource).mockImplementation(async resource=>{saved.push(resource);});});
afterEach(()=>vi.clearAllMocks());

describe("Processguide och mallreferenser",()=>{
 it("har spårbar täckning av samtliga ärendesteg utan att göra dokumentguiden till en statusmotor",()=>{
   expect(new Set(processGuide.flatMap(stage=>stage.flowSteps))).toEqual(new Set(["material","businesscase","qualification","potential","priority","conditions","commitments","decision","implementation","measurement","learning"]));
   const documents=processGuide.flatMap(stage=>stage.documents.map(document=>document.id));
   expect(new Set(documents).size).toBe(documents.length);
   expect(processGuide.find(stage=>stage.id==="priority")!.purpose).toContain("inte ett startbeslut");
   expect(processGuide.find(stage=>stage.id==="learning")!.ready).toContain("nytt lokalt effektåtagande");
 });
 it("går in från ett ärende och tillbaka med ärendets sammanhang och data kvar",async()=>{
   const state=initializeDemoState(),before=JSON.stringify(state);
   const app=create(<App demoState={state}/>),root=app.root;
   const click=async(label:string)=>{await act(async()=>root.findAllByType("button").find(node=>text(node).trim()===label)!.props.onClick());};
   await click("Ärenden");
   await act(async()=>root.findAllByType("button").find(node=>node.props.className==="case-open")!.props.onClick());
   const title=root.findAllByType("h1").map(text);
   await click("Mallar och hjälp");
   expect(root.findAllByType("h1").map(text)).toContain("Mallar och hjälp");
   expect(root.findByProps({"aria-label":"Huvudprocess med dokumentstöd"}).findAllByType("button")).toHaveLength(11);
   await click("← Tillbaka");
   expect(root.findAllByType("h1").map(text)).toEqual(title);
   expect(JSON.stringify(state)).toBe(before);
   app.unmount();
 });
 it("visar en enda guide direkt under loggan och öppnar stegen utan att ändra ärendedata",async()=>{
   const state=initializeDemoState(),before=JSON.stringify(state);
   const app=create(<App demoState={state}/>),root=app.root;
   const header=root.findByProps({className:"product-header"});
   expect(header.children[1]).toBe(root.findByProps({className:"header-method-guide"}));
   const menu=root.findByProps({"aria-label":"Arbetsytor"});
   expect(text(menu)).not.toContain("Metod och styrning");
   expect(menu.findAllByType("button").map(text)).toEqual(["Kontrollrum","Ärenden","Prioritering","Effekt och beslut","Mallar och hjälp"]);
   expect(menu.findAllByType("button")[0].props["aria-current"]).toBe("page");
   const guide=()=>root.findByProps({"aria-label":"Huvudprocess med dokumentstöd"});
   expect(guide().findAllByType("button").every(button=>button.props["aria-pressed"]===false)).toBe(true);
   for(const stage of processGuide.filter(item=>item.number>0)){
     await act(async()=>guide().findAllByType("button")[stage.number-1].props.onClick());
     expect(text(root.findByProps({id:"guide-stage-title"}))).toBe(stage.title);
     expect(root.findAllByProps({"aria-label":"Huvudprocess med dokumentstöd"})).toHaveLength(1);
     expect(guide().findAllByType("button")[stage.number-1].props["aria-pressed"]).toBe(true);
   }
   expect(JSON.stringify(state)).toBe(before);
   app.unmount();
 });
 it("kopplar en länk till rätt dokumentdel och visar den som tillagd, inte godkänd",async()=>{
   const view=create(<TemplatesHelp stageId="challenge" onStageChange={()=>{}} openCases={()=>{}}/>);
   await act(async()=>{});
   const slot=view.root.findAllByType("article")[0];
   for(const [label,value] of [["Mallens namn","Gemensam utmaningsmall"],["Länk till mallen","https://example.org/utmaning.docx"],["Mallägare eller källa","Metodgruppen"],["Version eller dokumentdatum","1.2"]])act(()=>input(slot,label).props.onChange({target:{value}}));
   await act(async()=>slot.findByType("form").props.onSubmit({preventDefault(){}}));
   expect(saved[0]).toMatchObject({documentId:"1.1",kind:"link",owner:"Metodgruppen",version:"1.2"});
   expect(slot.findByType("a").props.href).toBe("https://example.org/utmaning.docx");
   expect(text(slot)).toContain("status behöver granskas");
   expect(view.root.findAllByType("article")[1].findAllByType("a")).toHaveLength(0);
   view.unmount();
 });
 it("bevarar filens innehåll och kopplar den till ett lokalt effektåtagande",async()=>{
   const view=create(<TemplatesHelp stageId="commitments" onStageChange={()=>{}} openCases={()=>{}}/>);
   await act(async()=>{});
   const slot=view.root.findByType("article");
   act(()=>slot.findByType("select").props.onChange({target:{value:"file"}}));
   const file=new File(["original content"],"befintlig-mall.txt",{type:"text/plain"});
   act(()=>input(slot,"Mallfil").props.onChange({target:{files:[file]}}));
   for(const [label,value] of [["Mallens namn","Effektåtagande"],["Mallägare eller källa","Verksamheten"],["Version eller dokumentdatum","2026-09-09"]])act(()=>input(slot,label).props.onChange({target:{value}}));
   await act(async()=>slot.findByType("form").props.onSubmit({preventDefault(){}}));
   expect(saved[0]).toMatchObject({documentId:"6.1",kind:"file",fileName:"befintlig-mall.txt"});
   expect(await saved[0].blob!.text()).toBe("original content");
   view.unmount();
 });
 it("visar fel vid misslyckat sparande och påstår inte att mallen sparats",async()=>{
   vi.mocked(saveTemplateResource).mockRejectedValueOnce(Error("Lagringen är full."));
   const view=create(<TemplatesHelp onStageChange={()=>{}} openCases={()=>{}}/>);
   await act(async()=>{});
   const slot=view.root.findAllByType("article")[0];
   await act(async()=>slot.findByType("form").props.onSubmit({preventDefault(){}}));
   expect(text(slot.findByProps({role:"status"}))).toBe("Lagringen är full.");
   expect(saved).toHaveLength(0);
   view.unmount();
 });
});
