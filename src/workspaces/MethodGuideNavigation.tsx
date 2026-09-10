import type { Ref } from "react";
import { ArrowRight, BookOpen } from "lucide-react";
import { processGuide } from "./processGuide";

export function MethodGuideNavigation({stageId,onStageChange,openCases,navigationRef,detailId}:{
  stageId?:string;
  onStageChange:(id:string)=>void;
  openCases:()=>void;
  navigationRef?:Ref<HTMLElement>;
  detailId?:string;
}) {
  return <>
    <div className="guide-intro"><p><BookOpen size={20} aria-hidden="true"/> <strong>Välj ett steg för instruktioner och mallplatser.</strong> Detta är en metodguide, inte status för ett enskilt ärende.</p><button className="text-button" onClick={openCases}>Till ärendena <ArrowRight size={18} aria-hidden="true"/></button></div>
    <nav ref={navigationRef} tabIndex={-1} aria-label="Huvudprocess med dokumentstöd" className="guide-process">
      <ol>{processGuide.filter(item=>item.number>0).map(item=><li key={item.id}><button aria-pressed={stageId===item.id} aria-controls={detailId} onClick={()=>onStageChange(item.id)}><span className="guide-step-number">{item.number}</span><span><strong>{item.title}</strong><small>{item.short}</small></span></button></li>)}</ol>
      <button className="guide-foundation" aria-pressed={stageId==="foundation"} aria-controls={detailId} onClick={()=>onStageChange("foundation")}><BookOpen size={20} aria-hidden="true"/> 0. Gemensam grund <span>Process, mandat, begrepp och styrande dokument</span></button>
    </nav>
  </>;
}
