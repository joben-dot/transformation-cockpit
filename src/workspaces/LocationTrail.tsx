import { ChevronRight, MapPin } from "lucide-react";
export function LocationTrail({items}:{items:{label:string;onClick?:()=>void}[]}) {
  return <nav className="location-trail" aria-label="Du är här"><span className="location-caption"><MapPin size={18} aria-hidden="true"/> Du är här</span><ol>{items.map((item,index)=><li key={`${index}-${item.label}`}>{index>0&&<ChevronRight size={17} aria-hidden="true"/>}{item.onClick?<button onClick={item.onClick}>{item.label}</button>:<span aria-current={index===items.length-1?"page":undefined}>{item.label}</span>}</li>)}</ol></nav>;
}
