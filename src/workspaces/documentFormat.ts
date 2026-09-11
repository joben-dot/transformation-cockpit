export interface DocumentField {key:string;label:string;required?:boolean;options?:{value:string;label:string}[];}
export interface DocumentEnvelope {format:"cockpit-document";version:1;kind:string;caseId:string;values:Record<string,string>;}
export function parseDocument(text:string,kind:string,caseId:string,fields:DocumentField[]) {
  const data:unknown=JSON.parse(text);
  if(!data||typeof data!=="object")throw Error("Dokumentet har fel format.");
  const d=data as DocumentEnvelope;
  if(d.format!=="cockpit-document"||d.version!==1||d.kind!==kind)throw Error("Filen tillhör en annan dokumentmall eller version.");
  if(typeof d.caseId!=="string")throw Error("Dokumentets ärendereferens saknas.");
  if(d.caseId&&d.caseId!==caseId)throw Error("Filen tillhör ett annat ärende. Använd en tom mall för ett nytt ärende.");
  if(!d.values||typeof d.values!=="object"||Array.isArray(d.values))throw Error("Dokumentets fält saknas.");
  const values:Record<string,string>={};
  for(const f of fields){const v=d.values[f.key];if(v!==undefined&&typeof v!=="string")throw Error(`Fel värdetyp: ${f.label}`);if(v&&f.options&&!f.options.some(o=>o.value===v))throw Error(`Ogiltigt val: ${f.label}`);values[f.key]=v??"";}
  return values;
}
export function downloadBlob(blob:Blob,name:string){const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
const escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
/** Portable local form. Its export is typed draft data, never an acceptance or domain command. */
export function portableDocument(title:string,purpose:string,envelope:DocumentEnvelope,fields:DocumentField[]) {
  const payload=JSON.stringify(envelope).replace(/</g,"\\u003c");
  return `<!doctype html><html lang="sv"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escape(title)}</title><style>body{font:20px/1.6 system-ui;max-width:900px;margin:40px auto;padding:24px;color:#173f54}label{display:block;margin:24px 0}textarea,select{display:block;width:100%;min-height:70px;font:inherit;box-sizing:border-box;padding:12px}button{font:inherit;padding:12px}small{display:block}@media print{button{display:none}}</style><h1>${escape(title)}</h1><p>${escape(purpose)}</p><p>Ärende: ${escape(envelope.caseId||"Tom mall")}. Detta är ett dokumentutkast. Accept och beslut görs separat i Cockpit.</p><form>${fields.map(f=>`<label>${escape(f.label)}${f.required?' *':''}${f.options?`<select name="${escape(f.key)}"><option value="">Välj</option>${f.options.map(o=>`<option value="${escape(o.value)}"${envelope.values[f.key]===o.value?" selected":""}>${escape(o.label)}</option>`).join("")}</select>`:`<textarea name="${escape(f.key)}">${escape(envelope.values[f.key]??"")}</textarea>`}</label>`).join("")}</form><p>* Underlag som krävs i detta formulär. Behörighet, verifiering och övriga processkrav prövas i Cockpit.</p><button id="save">Spara för uppladdning i Cockpit</button> <button onclick="window.print()">Skriv ut / spara som PDF</button><small>Knappen sparar en JSON-fil. Ladda upp den vid samma dokument i Cockpit och kontrollera utkastet före registrering.</small><script>const data=${payload};document.getElementById('save').onclick=()=>{document.querySelectorAll('textarea,select').forEach(e=>data.values[e.name]=e.value);const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download='cockpit-'+data.kind+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};</script></html>`;
}
