import { expect,it } from "vitest";
import { parseDocument,portableDocument,type DocumentEnvelope } from "./documentFormat";
import { documentTextComplete } from "../domain/caseDocumentRequirements";
const fields=[{key:"purpose",label:"Syfte",required:true}];
const data:DocumentEnvelope={format:"cockpit-document",version:1,kind:"businesscase",caseId:"case-a",values:{purpose:"Bättre service"}};
it("återläser endast rätt dokuments utkast, aldrig accept eller andra ärenden",()=>{
 const json=JSON.stringify({...data,values:{...data.values,accepted:"true",baselineVerified:"true"}});
 expect(parseDocument(json,"businesscase","case-a",fields)).toEqual(data.values);
 expect(()=>parseDocument(json,"utmaning","case-a",fields)).toThrow();
 expect(()=>parseDocument(json,"businesscase","case-b",fields)).toThrow();
 expect(()=>parseDocument(JSON.stringify({...data,version:2}),"businesscase","case-a",fields)).toThrow();
 expect(()=>parseDocument(JSON.stringify({...data,values:{purpose:4}}),"businesscase","case-a",fields)).toThrow();
 expect(parseDocument(JSON.stringify({...data,caseId:""}),"businesscase","case-b",fields)).toEqual(data.values);
});
it("exporterar läsbar mall utan att underlag kan avsluta HTML eller script",()=>{
 const payload="</textarea><script>alert('x')</script>";
 const html=portableDocument("Businesscase","Syfte",{...data,values:{purpose:payload}},fields);
 expect(html.match(/<script>/g)).toHaveLength(1);
 expect(html).toContain("&lt;/textarea&gt;");
 expect(html).toContain("\\u003c/script>");
 expect(documentTextComplete("Syftet är [förändring] för [mottagare].")).toBe(false);
 expect(documentTextComplete("Minska väntan för servicebesökare.")).toBe(true);
});
