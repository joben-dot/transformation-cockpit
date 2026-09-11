export interface TemplateResource {
  id: string; documentId: string; title: string; owner: string; version: string;
  addedAt: string; kind: "link" | "file"; url?: string; fileName?: string; blob?: Blob;
}
const databaseName = "cockpit-template-register";
export function templateUrl(value: string): string {
  let url: URL;
  try { url = new URL(value.trim()); } catch { throw Error("Ange en fullständig länk som börjar med https:// eller http://."); }
  if (!["https:","http:"].includes(url.protocol) || url.username || url.password) throw Error("Använd en http- eller https-länk utan inloggningsuppgifter i adressen.");
  return url.href;
}
function database(): Promise<IDBDatabase> {
  return new Promise((resolve,reject)=>{
    if(typeof indexedDB === "undefined") { reject(Error("Lokal mallagring är inte tillgänglig i den här webbläsaren.")); return; }
    const request = indexedDB.open(databaseName,1);
    request.onupgradeneeded = ()=>request.result.createObjectStore("resources",{keyPath:"id"});
    request.onsuccess = ()=>resolve(request.result);
    request.onerror = ()=>reject(request.error);
  });
}
async function transaction<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore)=>IDBRequest<T>): Promise<T> {
  const db = await database();
  return new Promise((resolve,reject)=>{
    const tx = db.transaction("resources",mode);
    const request = action(tx.objectStore("resources"));
    tx.oncomplete=()=>{db.close();resolve(request.result);};
    tx.onabort=()=>{db.close();reject(tx.error ?? Error("Mallen kunde inte sparas."));};
    tx.onerror=()=>{db.close();reject(tx.error ?? Error("Mallagringen kunde inte öppnas."));};
  });
}
export const readTemplateResources = ()=>transaction<TemplateResource[]>("readonly",store=>store.getAll());
export async function saveTemplateResource(resource: TemplateResource) {
  if (!resource.title.trim() || !resource.documentId || !resource.owner.trim() || !resource.version.trim()) throw Error("Ange namn, mallägare eller källa och version eller datum.");
  if (resource.kind === "link") resource = {...resource,url:templateUrl(resource.url??"")};
  if (resource.kind === "file" && (!resource.blob || resource.blob.size > 10*1024*1024 || !resource.fileName)) throw Error("Välj en fil på högst 10 MB.");
  await transaction("readwrite",store=>store.add(resource));
}
export const removeTemplateResource = (id: string)=>transaction("readwrite",store=>store.delete(id));
