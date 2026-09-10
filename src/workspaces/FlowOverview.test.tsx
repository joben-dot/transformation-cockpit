import { act, create } from "react-test-renderer";
import { expect, it } from "vitest";
import App from "../App";
import { initializeDemoState } from "../application/initializeDemoState";
import { caseFlow } from "../application/selectors/flowSelectors";
import { referenceCommitment } from "../demo-data/referenceCommitment";

const text=(n:unknown):string=>typeof n==="string"?n:n&&typeof n==="object"&&"children" in n?(n as {children:unknown[]}).children.map(text).join(""):"";
it("visar ett läsbart flöde utan formulär och bevarar ärendet vid fördjupning",()=>{
  const root=create(<App demoState={initializeDemoState()}/>).root;
  act(()=>root.findAllByType("button").find(b=>text(b)==="Ärenden")!.props.onClick());
  act(()=>root.findAllByType("button").find(b=>b.props.className==="case-open"&&text(b).includes("Digital fiktiv avtalsuppföljning"))!.props.onClick());
  const flow=()=>root.findByProps({"aria-label":"Ärendets sammanfattade flöde"});
  expect(flow().findAllByType("button").filter(b=>b.props["aria-label"])).toHaveLength(10);
  expect(text(flow())).toContain("Fortsätt med");
  expect(flow().findAll(n=>["input","select","textarea","form"].includes(String(n.type)))).toHaveLength(0);
  act(()=>flow().findAllByType("button").find(b=>b.props["aria-label"]?.startsWith("Utmaning:"))!.props.onClick());
  expect(root.findByProps({className:"material-summary"})).toBeDefined();
  expect(root.findAllByType("details").find(d=>text(d).includes("Fyll i eller komplettera utmaningen online"))!.props.open).toBeUndefined();
  act(()=>root.findAllByType("button").find(b=>text(b).includes("Till ärendets flöde"))!.props.onClick());
  expect(root.findByType("h1").children.join("")).toBe("Digital fiktiv avtalsuppföljning");
  expect(flow().findAllByType("form")).toHaveLength(0);
});
it("skiljer komplett prioriteringsunderlag från åtagande, start och uppmätt effekt utan mutation",()=>{
  const state=initializeDemoState(),before=JSON.stringify(state);
  const challenge=state.entities.initiatives[referenceCommitment.initiativeId].challengeId;
  const flow=caseFlow(state,challenge,"2026-09-06");
  expect(flow.find(s=>s.key==="potential")!.status).toBe("COMPLETE");
  for(const key of ["commitments","decision","measurement"])expect(flow.find(s=>s.key===key)!.status).not.toBe("COMPLETE");
  expect(JSON.stringify(state)).toBe(before);
  const assessment=Object.values(state.entities.qualificationAssessments).find(a=>a.initiativeId===referenceCommitment.initiativeId&&a.mandatory)!;
  assessment.status="INCOMPLETE";
  expect(caseFlow(state,challenge,"2026-09-06").find(s=>s.key==="qualification")!.status).toBe("ACTION");
  expect(caseFlow(state,challenge,"2026-09-06").find(s=>s.key==="priority")!.status).not.toBe("COMPLETE");
});
