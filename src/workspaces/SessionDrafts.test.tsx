import { act, create } from "react-test-renderer";
import { expect, it } from "vitest";
import { SessionDrafts, useSessionDraft } from "./SessionDrafts";

it("håller ofärdiga uppgifter åtskilda när användaren växlar ärende utan att lämna formuläret",()=>{
  function Field({id}:{id:string}) {
    const [value,setValue]=useSessionDraft(id,`Sparat ${id}`);
    return <input value={value} onChange={e=>setValue(e.target.value)}/>;
  }
  const view=create(<SessionDrafts><Field id="A"/></SessionDrafts>);
  act(()=>view.root.findByType("input").props.onChange({target:{value:"Utkast A"}}));
  act(()=>view.update(<SessionDrafts><Field id="B"/></SessionDrafts>));
  expect(view.root.findByType("input").props.value).toBe("Sparat B");
  act(()=>view.root.findByType("input").props.onChange({target:{value:"Utkast B"}}));
  act(()=>view.update(<SessionDrafts><Field id="A"/></SessionDrafts>));
  expect(view.root.findByType("input").props.value).toBe("Utkast A");
});
