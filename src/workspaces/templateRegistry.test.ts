import { describe, expect, it } from "vitest";
import { saveTemplateResource, templateUrl } from "./templateRegistry";

describe("Mallregistrets gränser",()=>{
 it("tillåter dokumentlänkar men inte körbara adresser eller inbäddade lösenord",()=>{
   expect(templateUrl(" https://example.org/mall.docx ")).toBe("https://example.org/mall.docx");
   for(const url of ["javascript:alert(1)","data:text/html,x","file:///tmp/x","https://user:password@example.org/x","/mall.docx"])expect(()=>templateUrl(url)).toThrow();
 });
 it("stoppar för stor fil innan något sparas",async()=>{
   await expect(saveTemplateResource({id:"test",documentId:"6.1",title:"Mall",owner:"Metodstöd",version:"1",addedAt:"2026-09-09",kind:"file",fileName:"stor.txt",blob:new Blob([new Uint8Array(10*1024*1024+1)])})).rejects.toThrow("högst 10 MB");
 });
});
