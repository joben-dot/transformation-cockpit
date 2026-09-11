export function startStarlight(root) {
const canvas=root.querySelector('canvas'),c=canvas.getContext('2d'),pause=root.querySelector('.pause');
const wordButtons=[...root.querySelectorAll('[data-story]')],focusGroups=[[0,1],[0,2],[1,2,3,4],[3,4,5],[0,1,2,3,4,5]],storyTimes=[2,6,11,17.6,27];let hover=-1,pinned=-1,active=-1,story=0;
wordButtons.forEach((b,i)=>{b.onpointerenter=e=>{if(e.pointerType==='mouse')hover=i};b.onpointerleave=()=>hover=-1;b.onfocus=()=>hover=i;b.onblur=()=>hover=-1;b.onclick=()=>{pinned=pinned===i?-1:i;hover=-1;wordButtons.forEach((x,j)=>x.setAttribute('aria-pressed',String(pinned===j)))};b.onkeydown=e=>{if(e.key==='Escape'){pinned=-1;hover=-1;wordButtons.forEach(x=>x.setAttribute('aria-pressed','false'))}}});
const palette=[[180,145,255],[76,227,196],[104,183,255],[255,132,184],[249,203,112],[134,207,241],[183,159,200],[147,170,188]];
const groups=[[-.69,-.44,.38],[-.77,.26,.25],[.08,-.69,.49],[.63,.22,.57],[.74,-.30,.15],[-.13,.74,.35],[-.30,-.87,-.3],[.38,.79,-.22]];
const routes=[{a:0,b:2,start:.6,dur:2.8,bend:-.48},{a:1,b:2,start:2.1,dur:3.2,bend:.51},{a:2,b:4,start:6.4,dur:2.8,bend:-.42},{a:2,b:3,start:8.5,dur:3,bend:-.43},{a:4,b:3,start:11.6,dur:2.1,bend:-.42},{a:3,b:5,start:13.1,dur:2.7,bend:.38},{a:5,b:4,start:16.1,dur:2.4,bend:-.22}];
let seed=431;const random=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646};const gauss=()=>Math.sqrt(-2*Math.log(Math.max(.00001,random())))*Math.cos(6.283*random());const clamp=x=>Math.max(0,Math.min(1,x));const rgba=(rgb,a)=>`rgba(${rgb.join(',')},${clamp(a)})`;
const inside=p=>Math.hypot(p.x,p.y,p.z*.55)<1.09;
const stars=[];groups.forEach((v,g)=>{const counts=[123,64,147,98,53,116,32,25],squeeze=[.56,1.3,.85,.65,1.5,.7,1.2,.6][g],turn=g*1.37;for(let i=0;i<counts[g];i++){let u=gauss()*.16,w=gauss()*.12*squeeze;let dx=u*Math.cos(turn)-w*Math.sin(turn),dy=u*Math.sin(turn)+w*Math.cos(turn),dz=gauss()*.12;let p={x:v[0]+dx,y:v[1]+dy,z:v[2]+dz,g,d:Math.hypot(dx,dy,dz),r:.36+random()*.88,phase:random()*6.28};if(inside(p))stars.push(p)}stars.push({x:v[0],y:v[1],z:v[2],g,d:0,r:2.3,hub:true,phase:g})});
// Round overall volume, with lopsided filaments, gaps and unequal densities.
const dust=[];for(let i=0;i<1900;i++){let x=(random()-.5)*2.2,y=(random()-.5)*2.2,z=gauss()*.25;if(!inside({x,y,z}))continue;let band=Math.exp(-Math.pow((y-.42*Math.sin(x*2.8)-x*.38)/.19,2));let pocket=Math.exp(-((x+.35)**2+(y-.4)**2)/.13);if(random()>.17+band*.7+pocket*.22)continue;dust.push({x,y,z,r:.18+random()*.48,a:.08+random()*.23})}
// Extra stars do not belong to any original cluster: they only emerge once
// the selected effect clusters form a connected whole.
const connectedAt=Math.max(...routes.map(e=>e.start+e.dur));
const interstars=[],bridges=[[2,5],[1,3],[0,4],[5,4],[2,3]];
bridges.forEach(([a,b],lane)=>{for(let i=0;i<77;i++){let u=.12+random()*.76,A=groups[a],B=groups[b],curl=Math.sin(u*Math.PI)*Math.sin(u*7+lane)*.10;let p={x:A[0]*(1-u)+B[0]*u+gauss()*.075+curl,y:A[1]*(1-u)+B[1]*u+gauss()*.09-curl*.6,z:A[2]*(1-u)+B[2]*u+gauss()*.08};let nearest=Math.min(...groups.map(v=>Math.hypot(v[0]-p.x,v[1]-p.y)));if(nearest<.13||!inside(p))continue;interstars.push({...p,col:palette[a].map((v,k)=>Math.round(v*(1-u)+palette[b][k]*u)),birth:connectedAt+.45+lane*.38+Math.abs(u-.42)*5+random()*.8,r:.45+random()*.72,phase:random()*6.28})}});
const links=[];for(let i=0;i<stars.length;i++)for(let j=i+1;j<stars.length;j++){let a=stars[i],b=stars[j];if(a.g===b.g&&(a.x-b.x)**2+(a.y-b.y)**2+(a.z-b.z)**2<.013&&random()<.19)links.push([i,j])}
let W=500,H=278,R=125,angle=0,manualAngle=0,tilt=0,drag=false,lastX=0,lastY=0,prev=0,t=0,clock=0,visible=true;const reduced=matchMedia('(prefers-reduced-motion: reduce)');let stopped=reduced.matches;if(stopped){t=27;clock=27}
function sync(){pause.textContent=stopped?'Starta rörelsen':'Pausa rörelsen';pause.setAttribute('aria-pressed',String(stopped))}sync();pause.onclick=()=>{stopped=!stopped;sync()};
const intersection = new IntersectionObserver(entries=>{visible=entries[0].isIntersecting}); intersection.observe(root);
const resize=()=>{W=canvas.clientWidth;H=canvas.clientHeight;R=Math.min(W*.34,H*.405);let d=Math.min(devicePixelRatio||1,2);canvas.width=W*d;canvas.height=H*d;c.setTransform(d,0,0,d,0,0)};const observer = new ResizeObserver(resize); observer.observe(canvas);resize();
function project(p){const ca=Math.cos(angle),sa=Math.sin(angle),ct=Math.cos(tilt),st=Math.sin(tilt);let x=p.x*ca+p.z*sa,z=-p.x*sa+p.z*ca,y=p.y*ct-z*st;z=p.y*st+z*ct;return {x:W*.50+x*R,y:H*.47+y*R,z}}
const arrival=g=>routes.filter(e=>e.b===g).map(e=>e.start+e.dur);
function strength(s){if(s.g<2)return .54;let at=arrival(s.g),n=0;for(let a of at)n+=clamp((t-a-s.d*5)/.7);return Math.min(1,n*(at.length>1?.52:.86))}
function glow(x,y,r,col,a){if(a<.006)return;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,rgba(col,a));g.addColorStop(.17,rgba(col,a*.42));g.addColorStop(.48,rgba(col,a*.1));g.addColorStop(1,rgba(col,0));c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2)}
function spark(x,y,r,col,a,cross=false){glow(x,y,r*7,col,a*.48);c.fillStyle=rgba(col,a);c.beginPath();c.arc(x,y,r,0,7);c.fill();if(cross){let g=c.createLinearGradient(x-r*5,y,x+r*5,y);g.addColorStop(0,rgba(col,0));g.addColorStop(.5,rgba([245,247,255],a*.8));g.addColorStop(1,rgba(col,0));c.strokeStyle=g;c.lineWidth=.6;c.beginPath();c.moveTo(x-r*5,y);c.lineTo(x+r*5,y);c.stroke();c.strokeStyle=rgba(col,a*.32);c.beginPath();c.moveTo(x,y-r*3);c.lineTo(x,y+r*3);c.stroke();c.fillStyle=rgba([249,250,255],a);c.beginPath();c.arc(x,y,r*.40,0,7);c.fill()}}
function curve(e,P,u){let a=P[e.a],b=P[e.b],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1,bulge=e.bend*R,mid={x:(a.x+b.x)/2-dy/len*bulge,y:(a.y+b.y)/2+dx/len*bulge};return{x:(1-u)**2*a.x+2*(1-u)*u*mid.x+u*u*b.x,y:(1-u)**2*a.y+2*(1-u)*u*mid.y+u*u*b.y}}
function strokeRoute(e,P,from,to,col,alpha,width){c.strokeStyle=rgba(col,alpha);c.lineWidth=width;c.beginPath();for(let k=0;k<=45;k++){let p=curve(e,P,from+(to-from)*k/45);if(k===0)c.moveTo(p.x,p.y);else c.lineTo(p.x,p.y)}c.stroke()}
let raf=0, disposed=false, lastDraw=0, lastSignature='';
const schedule=()=>{raf=requestAnimationFrame(frame)};
function frame(ts){if(disposed||!root.isConnected)return;const dt=Math.min((ts-prev)/1000,.05)||0;prev=ts;active=hover>=0?hover:pinned;if(visible&&!document.hidden&&!stopped&&!drag&&active<0)clock=(clock+dt)%36;t=active>=0?storyTimes[active]:clock;if(!stopped&&!drag)angle=manualAngle+Math.sin(clock*.10)*.09;story=active>=0?active:t<3?0:t<8?1:t<14?2:t<19?3:4;wordButtons.forEach((b,i)=>b.classList.toggle('current',i===story));if(!visible||document.hidden){schedule();return}const signature=[t,angle,tilt,story,W,H].join('/');if(ts-lastDraw<32||signature===lastSignature){schedule();return}lastDraw=ts;lastSignature=signature;c.clearRect(0,0,W,H);
const P=groups.map(v=>project({x:v[0],y:v[1],z:v[2]}));
// Soft Milky Way filaments and uneven concentrations, without a sphere grid.
dust.forEach(d=>{const p=project(d);c.fillStyle=rgba([153,170,211],d.a);c.beginPath();c.arc(p.x,p.y,d.r,0,7);c.fill()});
groups.forEach((v,g)=>{let s=strength({g,d:0}),p=P[g],chosen=focusGroups[story].includes(g);glow(p.x,p.y,R*.47,palette[g],(.035+s*.17)*(chosen?1.5:.65))});
const S=stars.map(s=>({...s,p:project(s),power:strength(s)}));
links.forEach(([i,j])=>{let a=S[i],b=S[j];c.strokeStyle=rgba(palette[a.g],.02+Math.min(a.power,b.power)*.12);c.lineWidth=.45;c.beginPath();c.moveTo(a.p.x,a.p.y);c.lineTo(b.p.x,b.p.y);c.stroke()});
// Candidate paths remain faint; only the selected subset carries resources.
[{a:0,b:6,bend:-.18},{a:1,b:7,bend:.7}].forEach(e=>strokeRoute(e,P,0,1,[119,139,163],.11,.6));
routes.forEach(e=>{let u=clamp((t-e.start)/e.dur),col=palette[e.b],chosen=focusGroups[story].includes(e.a)&&focusGroups[story].includes(e.b),m=chosen?1.4:active>=0?.18:.65;strokeRoute(e,P,0,1,col,.095*m,.65);if(t<e.start)return;strokeRoute(e,P,0,u,col,.10*m,5);strokeRoute(e,P,0,u,col,(u===1?.35:.70)*m,1);if(u<1){for(let k=0;k<15;k++){let q=u-k*.006;if(q<0)continue;let p=curve(e,P,q);spark(p.x,p.y,k===0?1.8:.7,col,(1-k/15)*.92,k===0)}}});
S.sort((a,b)=>a.p.z-b.p.z).forEach(s=>{let twinkle=.90+Math.sin(t*.8+s.phase)*.1,p=s.p,power=s.power,col=palette[s.g];const chosen=focusGroups[story].includes(s.g),brightness=(.12+power*.84)*twinkle*(chosen?1.12:active>=0?.23:.7);
spark(p.x,p.y,s.r*(.62+power*.65),col,brightness,s.hub||s.r>1.09&&power>.65);
if(s.hub){let wave=arrival(s.g).map(a=>t-a).find(v=>v>0&&v<1.7);if(wave!==undefined){let rad=3+wave*R*.22;c.strokeStyle=rgba(col,(1-wave/1.7)*.42);c.lineWidth=.7;c.beginPath();c.arc(p.x,p.y,rad,0,7);c.stroke()}}});
// The visible surplus: entirely new, irregular star fields between clusters.
interstars.forEach(s=>{let age=t-s.birth;if(age<=0)return;let q=clamp(age/1.8),p=project(s);let shimmer=.95+.05*Math.sin(t*.6+s.phase);spark(p.x,p.y,s.r*(.35+q*.95),s.col,q*.92*shimmer,s.r>1.07);if(age<1.6)glow(p.x,p.y,5+age*5,s.col,Math.sin(age/1.6*Math.PI)*.22)});
// Quiet leader lines connect the phrases to their illuminated region.
const canvasBox=canvas.getBoundingClientRect();
wordButtons.forEach((b,i)=>{if(i!==story)return;const box=b.getBoundingClientRect(),g=[0,2,1,3,4][i],target=i===4?project({x:.08,y:.11,z:.3}):P[g],bx=box.left-canvasBox.left,by=box.top-canvasBox.top;let ax=Math.max(bx,Math.min(bx+box.width,target.x)),ay=target.y>by+box.height?by+box.height:target.y<by?by:by+box.height*.5;c.strokeStyle=rgba(palette[g],.42);c.lineWidth=.65;c.beginPath();c.moveTo(target.x,target.y);c.lineTo(ax,ay);c.stroke();spark(target.x,target.y,2,palette[g],.85,true)});
// Outcomes remain visible for ten seconds before a soft reset.
if(t>33){c.fillStyle=`rgba(6,11,16,${(t-33)/3*.88})`;c.fillRect(0,0,W,H)}
schedule()}schedule();
canvas.onpointerdown=e=>{drag=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId)};canvas.onpointermove=e=>{if(!drag)return;angle+=(e.clientX-lastX)*.005;tilt=Math.max(-.4,Math.min(.4,tilt+(e.clientY-lastY)*.004));lastX=e.clientX;lastY=e.clientY};canvas.onpointerup=canvas.onpointercancel=()=>{manualAngle=angle-Math.sin(t*.10)*.09;drag=false};

const onMotionChange=()=>{stopped=reduced.matches;if(stopped){clock=27;t=27}sync();lastSignature=''};
reduced.addEventListener('change',onMotionChange);
return ()=>{
 disposed=true;cancelAnimationFrame(raf);observer.disconnect();intersection.disconnect();
 reduced.removeEventListener('change',onMotionChange);
 pause.onclick=null;
 wordButtons.forEach(b=>{b.onpointerenter=null;b.onpointerleave=null;b.onfocus=null;b.onblur=null;b.onclick=null;b.onkeydown=null});
 canvas.onpointerdown=null;canvas.onpointermove=null;canvas.onpointerup=null;canvas.onpointercancel=null;
};
}
