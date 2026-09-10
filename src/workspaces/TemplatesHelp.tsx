import { useEffect, useRef, useState } from "react";
import { FileText, Link as LinkIcon, Upload } from "lucide-react";
import { processGuide, type GuideDocument } from "./processGuide";
import { readTemplateResources, removeTemplateResource, saveTemplateResource, type TemplateResource } from "./templateRegistry";
import { downloadBlob } from "./documentFormat";
import { BenefitTemplates } from "./BenefitTemplates";
import { MethodGuideNavigation } from "./MethodGuideNavigation";

function TemplateSlot({document,resources,onChanged}:{document:GuideDocument;resources:TemplateResource[];onChanged:()=>Promise<void>}) {
  const [mode,setMode]=useState<"file"|"link">("link");
  const [title,setTitle]=useState(""),[owner,setOwner]=useState(""),[version,setVersion]=useState(""),[url,setUrl]=useState("");
  const [file,setFile]=useState<File>(),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
  const fileInputRef=useRef<HTMLInputElement>(null);
  return <article className="template-slot" aria-labelledby={`doc-${document.id}`}>
    <h3 id={`doc-${document.id}`}><span>{document.id}</span> {document.title}</h3>
    <p>{document.purpose}</p>
    {document.parts.length>0&&<details className="guide-document-parts"><summary>Vad behöver underlaget täcka?</summary><ol>{document.parts.map((part,index)=><li key={part}><span>{document.id}.{index+1}</span> {part}</li>)}</ol></details>}
    {resources.length===0?<p className="template-empty"><FileText size={18} aria-hidden="true"/> Ingen bekräftad mall tillagd ännu.</p>:<ul className="template-resources">{resources.map(resource=><li key={resource.id}><div>{resource.kind==="link"?<a href={resource.url} target="_blank" rel="noopener noreferrer"><LinkIcon size={18} aria-hidden="true"/> {resource.title} ↗</a>:<button className="text-button" onClick={()=>{if(resource.blob)downloadBlob(resource.blob,resource.fileName??resource.title);}}><FileText size={18} aria-hidden="true"/> Ladda ner {resource.title}</button>}<p>{resource.owner} · {resource.version}</p><small>Tillagd lokalt · status behöver granskas</small></div><button className="text-button" disabled={busy} onClick={async()=>{if(!window.confirm(`Ta bort den lokala mallreferensen ”${resource.title}”?`))return;setBusy(true);try{await removeTemplateResource(resource.id);await onChanged();setMessage("Mallreferensen är borttagen. Ärendets underlag och beslut är oförändrade.");}catch{setMessage("Mallreferensen kunde inte tas bort. Försök igen.");}finally{setBusy(false);}}}>Ta bort</button></li>)}</ul>}
    <details className="template-add"><summary><Upload size={18} aria-hidden="true"/> Lägg till mall eller länk</summary>
      <p>Koppla en befintlig mall till <strong>{document.title}</strong>. Referensen sparas bara i din webbläsare. Den ändrar inte ärendens formulär eller beslutskrav.</p>
      <form onSubmit={async event=>{event.preventDefault();setBusy(true);setMessage("");try{
        await saveTemplateResource({id:crypto.randomUUID(),documentId:document.id,title:title.trim(),owner:owner.trim(),version:version.trim(),addedAt:new Date().toISOString(),kind:mode,...(mode==="link"?{url}:{blob:file,fileName:file?.name})});
        await onChanged();setTitle("");setOwner("");setVersion("");setUrl("");setFile(undefined);if(fileInputRef.current)fileInputRef.current.value="";setMessage("Sparad i den här webbläsaren. Mallens innehåll och status behöver granskas innan gemensam användning.");
      }catch(error){setMessage(error instanceof Error?error.message:"Mallen kunde inte sparas.");}finally{setBusy(false);}}}>
        <fieldset disabled={busy}><legend>Malluppgifter</legend>
          <label>Lägg till som<select value={mode} onChange={event=>{setMode(event.target.value as "file"|"link");setMessage("");}}><option value="link">Länk till en mall</option><option value="file">Uppladdad mallfil</option></select></label>
          <label>Mallens namn<input required maxLength={180} value={title} onChange={event=>setTitle(event.target.value)}/></label>
          {mode==="link"?<label>Länk till mallen<input type="url" required placeholder="https://…" value={url} onChange={event=>setUrl(event.target.value)}/></label>:<label>Mallfil (högst 10 MB)<input ref={fileInputRef} key={mode} type="file" required accept=".pdf,.docx,.xlsx,.pptx,.odt,.ods,.txt,.md,.html,.json" onChange={event=>setFile(event.target.files?.[0])}/></label>}
          {mode==="link"&&<p>Klistra in en länk som du redan har. Den öppnas hos dokumentets ägare med dina vanliga behörigheter. Cockpit hämtar inte innehållet, och länken ger inte ChatGPT åtkomst till er miljö.</p>}
          <label>Mallägare eller källa<input required maxLength={180} value={owner} onChange={event=>setOwner(event.target.value)}/></label>
          <label>Version eller dokumentdatum<input required maxLength={80} placeholder="Exempel: version 1.0 eller 2026-09-09" value={version} onChange={event=>setVersion(event.target.value)}/></label>
          <button className="primary-action" type="submit">{busy?"Sparar…":"Spara mallreferens"}</button>
        </fieldset>
      </form>
    </details>
    {message&&<p role="status" className="template-message">{message}</p>}
  </article>;
}

export function TemplatesHelp({stageId="challenge",onStageChange,openCases,onShowProcess,focusRequest=0}:{stageId?:string;onStageChange:(id:string)=>void;openCases:()=>void;onShowProcess?:()=>void;focusRequest?:number}) {
  const stage=processGuide.find(item=>item.id===stageId)??processGuide[1];
  const [resources,setResources]=useState<TemplateResource[]>([]),[error,setError]=useState("");
  const detailRef=useRef<HTMLElement>(null);
  const previousStage=useRef(stage.id);
  const previousFocusRequest=useRef(0);
  const processRef=useRef<HTMLElement>(null);
  useEffect(()=>{if(previousStage.current!==stage.id||previousFocusRequest.current!==focusRequest){previousStage.current=stage.id;previousFocusRequest.current=focusRequest;detailRef.current?.scrollIntoView?.({block:"start"});detailRef.current?.focus?.({preventScroll:true});}},[stage.id,focusRequest]);
  const load=async()=>{setResources(await readTemplateResources());setError("");};
  useEffect(()=>{let active=true;readTemplateResources().then(items=>{if(active)setResources(items);}).catch(()=>{if(active)setError("Lokal mallagring kunde inte öppnas. Processguiden fungerar ändå. Uppladdning och sparande kräver att webbläsaren tillåter lokal lagring.");});return()=>{active=false;};},[]);
  const select=(id:string)=>{onStageChange(id);};
  return <section className="templates-help" aria-labelledby="templates-help-title">
    <header className="guide-heading"><p className="eyebrow">GEMENSAMT ARBETSSÄTT · FRÅN BEHOV TILL EFFEKT</p><h1 id="templates-help-title">Mallar och hjälp</h1><p className="lead">Följ processen. Se vilket underlag som behövs och vem som bidrar – även när arbetet sker utanför verktyget.</p></header>
    {!onShowProcess&&<MethodGuideNavigation stageId={stage.id} onStageChange={select} openCases={openCases} navigationRef={processRef} detailId="guide-stage-detail"/>}
    <p className="guide-rule">Underlag kan kompletteras parallellt. <strong>Bedömd potential före prioritering. Lokalt accepterade effektåtaganden före start. Prioritering är inte startbeslut.</strong></p>
    <section id="guide-stage-detail" className="guide-stage" tabIndex={-1} ref={detailRef} aria-labelledby="guide-stage-title">
      <div className="guide-stage-header"><p className="eyebrow">VALT PROCESSTEG · {stage.number} {stage.number>0?"AV 10":"· GÄLLER ALLA STEG"}</p><h2 id="guide-stage-title">{stage.title}</h2><button className="text-button" onClick={()=>{if(onShowProcess){onShowProcess();return;}processRef.current?.scrollIntoView?.({block:"start"});processRef.current?.focus?.({preventScroll:true});}}>Visa hela processen ↑</button><p>{stage.purpose}</p></div>
      <div className="guide-stage-context"><div><h3>Vem bidrar?</h3><p>{stage.roles}</p></div><div><h3>Inför nästa steg</h3><p>{stage.ready}</p></div></div>
      <p className="guide-location"><strong>Här finns arbetet i demon:</strong> {stage.location}</p>
      <p className="guide-document-note">Dokumentdelarna kan ingå i samma underlag. Varje rad kräver inte en egen blankett. Återanvänd uppgifter och hänvisa till rätt version.</p>
      <div key={stage.id} className="guide-documents">{stage.documents.map(document=><TemplateSlot key={document.id} document={document} resources={resources.filter(resource=>resource.documentId===document.id)} onChanged={load}/>)}</div>
      {stage.id==="businesscase"&&<details className="guide-existing"><summary>Befintligt arbetsförslag till nyttokalkyl – inte fastställd mall</summary><p>Detta arbetsförslag fanns redan i demon. Det är inte bekräftat som er gemensamma mall och ingår därför inte som godkänd mall i förteckningen.</p><BenefitTemplates/></details>}
      <div className="guide-stage-navigation"><button disabled={stage.number===0} onClick={()=>select(processGuide[stage.number-1].id)}>← Föregående steg</button><button disabled={stage.number===10} onClick={()=>select(processGuide[stage.number+1].id)}>Nästa steg →</button></div>
    </section>
    <aside className="guide-storage"><h2>Om mallarna och sparandet</h2><p>Inga organisationsbekräftade mallar har lagts in i förteckningen ännu. Guiden beskriver dokumentens syfte; den skapar inga nya mallfiler. Befintliga demonstrationsformulär finns kvar vid ärendets processteg.</p><p>Filer och länkar som du lägger till sparas <strong>bara i den här webbläsaren på den här datorn</strong>, även efter omladdning. De delas inte med andra och försvinner om webbläsarens webbplatsdata rensas. Original på exempelvis en gemensam dokumentyta kan länkas hit. Länkens behörigheter gäller fortfarande.</p><p>En uppladdning innebär inget godkännande, ingen automatisk tolkning och ingen ändring av startkrav. Gemensam publicering, mallgodkännande och koppling mellan mallfält och formulär behöver införas senare.</p>{error&&<p role="alert">{error}</p>}</aside>
  </section>;
}
