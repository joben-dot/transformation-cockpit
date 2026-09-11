import {act,create} from "react-test-renderer";
import {expect,it} from "vitest";
import {FollowUpEditor} from "./FollowUpEditor";
import {initializeDemoState} from "../application/initializeDemoState";
import {demoReducer} from "../application/demoReducer";
import {caseFlow} from "../application/selectors/flowSelectors";

it("tilldelar nästa åtgärd direkt utan att acceptera effekt eller ändra beslutsbaslinjer",()=>{
 let state=initializeDemoState();const challenge=Object.values(state.entities.challenges)[0];
 const before=JSON.stringify({commitments:state.entities.effectCommitments,decisions:state.entities.decisionVersions});
 const step=caseFlow(state,challenge.id,"2026-09-06").find(s=>s.key==="material")!;
 const root=create(<FollowUpEditor state={state} challengeId={challenge.id} step={step} day="2026-09-06" dispatch={command=>{const result=demoReducer(state,command);if(result.success)state=result.nextState;return result;}}/>).root;
 expect(root.findAllByType("form")).toHaveLength(0);
 act(()=>root.findByType("details").props.onToggle({currentTarget:{open:true}}));
 act(()=>root.findByType("select").props.onChange({target:{value:challenge.initiatorRoleAssignmentId}}));
 act(()=>root.findByType("input").props.onChange({target:{value:"2026-09-20"}}));
 act(()=>root.findByType("form").props.onSubmit({preventDefault(){}}));
 expect(state.entities.challenges[challenge.id].stepFollowUps?.material?.dueDate).toBe("2026-09-20");
 expect(JSON.stringify({commitments:state.entities.effectCommitments,decisions:state.entities.decisionVersions})).toBe(before);
});
