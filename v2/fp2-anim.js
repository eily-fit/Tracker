/* FitPro 2 — exercise animations (auto-built) */
(function(){'use strict';
/* ===== FitPro exercise animation rig (slim, athletic "swimmer" build). Everything returns SVG strings in screen coords (y down). =====
   Pattern authors only provide JOINT POSITIONS; the rig draws a figure from them. Use ik() to get elbows/knees from hands/feet. */
const R=Math.PI/180,G=262;
const SK='#DDA27F',SKD='#A9754F',SKL='#EDBB99',SKS='#B77D5A',PN='#2F3A46',PND='#1F2830',WH='#F2F5F7',WHD='#A9B1BA',RED='#E5484D',BAR='#C5CDD6',PAD='#46525F',HAIR='#2A2E35',HOTC='255,60,60';
let INT=.5;
const f=v=>(+v).toFixed(1),lerp=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t),ease=t=>t*t*(3-2*t),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,k)=>a.map(v=>v*k),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),len=a=>Math.hypot(...a),nrm=a=>mul(a,1/(len(a)||1));
const pts=a=>a.map(p=>f(p[0])+','+f(p[1])).join(' ');
const rot=(v,deg)=>{const c=Math.cos(deg*R),s=Math.sin(deg*R);return[v[0]*c-v[1]*s,v[0]*s+v[1]*c]};
const polar=(p,deg,l)=>[p[0]+Math.cos(deg*R)*l,p[1]+Math.sin(deg*R)*l]; // deg: 0=right, 90=down (screen)
const hot=()=>`rgba(${HOTC},${(.22+.5*INT).toFixed(2)})`;
/* ---- proportions (px). Standing height ~205. ---- */
const D={thigh:50,shin:48,torso:56,uarm:32,farm:30,neck:9,headR:13.5,sw:24 /* half shoulder width, front view */,hw:14 /* half hip width, front */,stance:17 /* half stance width (ankles), front */};
/* 2-bone IK: joint between A and B (bone lengths l1,l2); pole = direction the joint bends toward (screen vector) */
function ik(A,B,l1,l2,pole){const d=sub(B,A),Dd=len(d)||1,m=Math.min(Dd,l1+l2-.5),a=(l1*l1-l2*l2+m*m)/(2*m),h=Math.sqrt(Math.max(0,l1*l1-a*a)),u=mul(d,1/Dd);
 const pr=sub(pole,mul(u,dot(pole,u))),p=nrm(pr);return add(A,add(mul(u,a),mul(p,h)))}
/* reach: end point clamped to what the limb can reach */
const reach=(A,B,l1,l2)=>{const d=sub(B,A),Dd=len(d),m=l1+l2-.5;return Dd>m?add(A,mul(d,m/Dd)):B};
/* ---- primitives ---- */
function limb(a,b,r1,r2,c){const dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L;
 return `<polygon points="${pts([[a[0]+nx*r1,a[1]+ny*r1],[b[0]+nx*r2,b[1]+ny*r2],[b[0]-nx*r2,b[1]-ny*r2],[a[0]-nx*r1,a[1]-ny*r1]])}" fill="${c}"/><circle cx="${f(a[0])}" cy="${f(a[1])}" r="${r1}" fill="${c}"/><circle cx="${f(b[0])}" cy="${f(b[1])}" r="${r2}" fill="${c}"/>`}
const circ=(p,r,c,o)=>`<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${r}" fill="${c}" ${o?`opacity="${o}"`:''}/>`;
const ell=(p,rx,ry,rt,c,o)=>`<ellipse cx="${f(p[0])}" cy="${f(p[1])}" rx="${rx}" ry="${ry}" transform="rotate(${f(rt||0)} ${f(p[0])} ${f(p[1])})" fill="${c}" ${o?`opacity="${o}"`:''}/>`;
/* muscle belly bulging one side of a segment; ref = direction (vector) of the bulging side */
function belly(a,b,r1,r2,t0,t1,ref,bulge,o){o=o||{};if(o.hot)bulge*=1.7;const dx=b[0]-a[0],dy=b[1]-a[1],L=Math.hypot(dx,dy)||1,nx=-dy/L,ny=dx/L;
 const side=typeof ref==='number'?ref:((nx*ref[0]+ny*ref[1])>=0?1:-1),N=10,base=[],top=[],hl=[],hl2=[];
 for(let i=0;i<=N;i++){const t=t0+(t1-t0)*i/N,r=r1+(r2-r1)*t,cx=a[0]+dx*t,cy=a[1]+dy*t,s=Math.pow(Math.sin(Math.PI*i/N),.75);
  base.push([cx+nx*side*r*.8,cy+ny*side*r*.8]);top.push([cx+nx*side*(r+bulge*s),cy+ny*side*(r+bulge*s)]);hl.push([cx+nx*side*(r*.35+bulge*s*.35),cy+ny*side*(r*.35+bulge*s*.35)]);hl2.push([cx+nx*side*(r+bulge*s*.7),cy+ny*side*(r+bulge*s*.7)])}
 const poly=base.concat(top.slice().reverse()),col=o.fill||SK;
 let s=`<polygon points="${pts(poly)}" fill="${col}"/>`;
 s+=`<polygon points="${pts(hl.concat(hl2.slice().reverse()))}" fill="${SKL}" opacity="${o.far?.12:.45}"/>`;
 s+=`<polyline points="${pts(top)}" fill="none" stroke="${SKS}" stroke-width="1.1" opacity="${o.far?.25:.55}" stroke-linejoin="round"/>`;
 if(o.hot)s+=`<polygon points="${pts(poly)}" fill="${hot()}"/>`;return s}
const mark=(p,r)=>`<circle cx="${f(p[0])}" cy="${f(p[1])}" r="${r||18}" fill="none" stroke="${RED}" stroke-width="3" stroke-dasharray="5 4"/>`;
const arrow=(a,b,c)=>{const d=nrm(sub(b,a)),n=[-d[1],d[0]],h=add(b,mul(d,-8));return `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(h[0])}" y2="${f(h[1])}" stroke="${c||RED}" stroke-width="2.5" stroke-linecap="round"/><polygon points="${pts([b,add(h,mul(n,5)),sub(h,mul(n,5))])}" fill="${c||RED}"/>`};
const floorSvg=(y)=>`<rect x="-400" y="${y==null?G:y}" width="1100" height="200" fill="#171C22"/><line x1="-400" y1="${y==null?G:y}" x2="700" y2="${y==null?G:y}" stroke="#3A4652" stroke-width="3"/>`;
const bgTop=`<rect x="-400" y="-400" width="1100" height="1100" fill="#1B222A"/>`; // top-down background (no floor line)
/* ================= SIDE RIG =================
 p = { H:hip joint, S:shoulder joint, hu:[head direction unit vec from S], 
       n:[front normal of torso] (optional, auto), 
       near:{el,wr,kn,an,toe}, far:{el,wr,kn,an,toe}   (positions; toe = toe tip x offset, default 24)
       hot:{chest,lats,delts,biceps,triceps,quads,hams,glutes,calves,abs,traps,forearm}, bend:number (torso curve), noTop:true (no shirt waistband) }
 A figure faces RIGHT (front of the body = +x when upright). */
function headSide(S,u){const fc=[-u[1],u[0]],nk=add(S,mul(u,D.neck)),hd=add(S,mul(u,D.neck+D.headR*.95));
 return limb(S,nk,5,4.8,SKS)+circ(hd,D.headR,HAIR)+circ(add(add(hd,mul(fc,3)),mul(u,1.2)),D.headR-1.6,SK)+circ(add(add(hd,mul(fc,D.headR-1.3)),mul(u,-.8)),2.8,SK)+ell(add(hd,add(mul(fc,-2),mul(u,-1.8))),2.2,3.6,0,SKS,.7)}
function torsoSide(H,S,F,o){o=o||{};const u=nrm(sub(S,H)),M=lerp(H,S,.45);if(o.bend){const n=[-u[1],u[0]];M[0]+=n[0]*o.bend;M[1]+=n[1]*o.bend}
 const nF=mul(F,-1),h=o.hot||{};
 return limb(H,M,11.5,10,SK)+limb(M,S,10,12,SK)+
 belly(H,S,12,11.5,.36,1.0,nF,3.5,{hot:h.lats})+belly(H,lerp(H,S,.35),12,10.5,-.05,.95,nF,6,{hot:h.glutes})+belly(H,S,11.5,11.5,.86,1.06,nF,3,{hot:h.traps})+
 belly(H,S,11.5,11.5,.08,.5,F,2.5,{hot:h.abs})+belly(H,S,11.5,11.5,.5,.96,F,7,{hot:h.chest})+
 (o.noTop?'':limb(H,lerp(H,M,.6),12.5,10.8,PN))}
function legSide(H,K,A,F,far,toe,o){o=o||{};const c=far?SKD:SK,sh=far?PND:PN,h=o.hot||{},ft=toe==null?22:toe;
 const u1=nrm(sub(K,H)),fr1=[u1[1],-u1[0]],u2=nrm(sub(A,K)),fr2=[u2[1],-u2[0]];
 return limb(H,K,11,7.4,c)+belly(H,K,11,7.4,.1,.92,fr1,3.8,{hot:h.quads&&!far,fill:c,far})+belly(H,K,11,7.4,.12,.9,mul(fr1,-1),3.2,{hot:h.hams&&!far,fill:c,far})+
 limb(K,A,6.8,4.4,c)+belly(K,A,6.8,4.4,.04,.62,mul(fr2,-1),4.6,{hot:h.calves&&!far,fill:c,far})+limb(H,lerp(H,K,.42),11.5,9.8,sh)+limb([A[0]-2,A[1]+3],[A[0]+ft,A[1]+3],4.3,3.6,far?WHD:WH)}
function armSide(S,E,W,F,far,h){h=h||{};const c=far?SKD:SK,u1=nrm(sub(E,S)),fr=[u1[1],-u1[0]],fo=nrm(sub(W,E));
 return limb(S,E,6.3,5,c)+belly(S,E,6.3,5,.1,.88,fr,2.8,{fill:c,far,hot:h.biceps&&!far})+belly(S,E,6.3,5,.12,.9,mul(fr,-1),3.4,{fill:c,far,hot:h.triceps&&!far})+
 limb(E,W,5,3.5,c)+belly(E,W,5,3.5,.05,.55,fr,2.2,{fill:c,far,hot:h.forearm&&!far})+circ(S,(h.delts&&!far)?7:6.5,c)+(h.delts&&!far?circ(S,7,hot()):'')+circ(W,4.2,c)}
function side(p){const F=p.n||(()=>{const u=nrm(sub(p.S,p.H));return[-u[1],u[0]]})(),hu=p.hu||nrm(sub(p.S,p.H)),h=p.hot||{},nr=p.near||{},fa=p.far||{};
 let s='';
 if(fa.kn)s+=legSide(p.H,fa.kn,fa.an,F,true,fa.toe,{});
 s+=torsoSide(p.H,p.S,F,{bend:p.bend,hot:h,noTop:p.noTop});
 if(nr.kn)s+=legSide(p.H,nr.kn,nr.an,F,false,nr.toe,{hot:h});
 s+=headSide(p.S,hu);
 if(fa.el)s+=armSide(add(p.S,[1.5,-1]),add(fa.el,[1.5,-1]),add(fa.wr,[1.5,-1]),F,true,{});
 if(nr.el)s+=armSide(p.S,nr.el,nr.wr,F,false,h);
 return s}
/* ================= FRONT / BACK / TOP RIG =================
 p = { N:neck base (shoulder line centre), P:pelvis centre, hd:head centre,
       SL,SR (shoulder joints; default N±[D.sw,0] along the shoulder line), HL,HR (hips default P±[D.hw,0]),
       L:{el,wr,kn,an}, Rr:{el,wr,kn,an}  (left/right of the SCREEN),
       back:true (see the back: hair, lats/traps/glutes), hot:{...}, noLegs:true, toes:[dxL,dxR] }
 Works for a standing person seen from the front/back and for a person lying down seen from above (head at the top of the screen). */
function bodyFront(p){const N=p.N,P=p.P,ax=nrm(sub(P,N)),pr=[ax[1],-ax[0]],SLp=p.SL||add(N,mul(pr,-D.sw)),SRp=p.SR||add(N,mul(pr,D.sw)),HLp=p.HL||add(P,mul(pr,-D.hw)),HRp=p.HR||add(P,mul(pr,D.hw)),h=p.hot||{},back=!!p.back;
 const T=(t,w)=>add(add(N,mul(sub(P,N),t)),mul(pr,w)),wd=[[ -D.sw+2,.0],[-D.sw+4,.22],[-D.sw+8,.5],[-D.hw-2,.9],[-D.hw-3,1]],
 pathPts=[];
 // torso outline (left side top->bottom then right side bottom->top)
 const prof=[[0,D.sw-1],[.12,D.sw-1],[.3,D.sw-5],[.55,D.sw-9.5],[.8,D.hw+4],[1,D.hw+4]];
 const left=prof.map(([t,w])=>T(t,-w)),right=prof.map(([t,w])=>T(t,w)).reverse();
 const outline=left.concat(right);
 let s='';
 // legs first
 if(!p.noLegs){for(const [sd,HH] of [[p.L,HLp],[p.Rr,HRp]]){if(!sd||!sd.kn)continue;const out=Math.sign(HH[0]-P[0])||1;
   s+=limb(HH,sd.kn,9.4,6.8,SK)+belly(HH,sd.kn,9.4,6.8,.1,.9,1,2.6,{hot:h.quads||h.hams})+belly(HH,sd.kn,9.4,6.8,.1,.9,-1,2.6,{hot:h.quads||h.hams})+limb(sd.kn,sd.an,6.8,4.4,SK)+belly(sd.kn,sd.an,6.8,4.4,.05,.6,1,3.4,{hot:h.calves})+belly(sd.kn,sd.an,6.8,4.4,.05,.6,-1,3.4,{hot:h.calves})+
   limb(HH,lerp(HH,sd.kn,.38),10,8.8,PN)+limb(sd.an,add(sd.an,[(p.toes?p.toes[sd===p.L?0:1]:out*5),5]),4.4,3.6,WH)}}
 s+=`<polygon points="${pts(outline)}" fill="${SK}"/>`;
 // abs / pecs (front) or lats / traps / lower back (back)
 if(!back){
  for(const sx of [-1,1]){const c1=T(.1,sx*3),c2=T(.12,sx*(D.sw-8)),c3=T(.3,sx*(D.sw-9)),c4=T(.34,sx*3);
   s+=`<polygon points="${pts([c1,c2,c3,c4])}" fill="${SKL}" opacity=".7"/><polygon points="${pts([c1,c2,c3,c4])}" fill="none" stroke="${SKS}" stroke-width="1" opacity=".6"/>`+(h.chest?`<polygon points="${pts([c1,c2,c3,c4])}" fill="${hot()}"/>`:'');
   for(let i=0;i<3;i++){const a=T(.42+i*.14,sx*2),b=T(.42+i*.14,sx*9),c=T(.5+i*.14,sx*9),d=T(.5+i*.14,sx*2);s+=`<polygon points="${pts([a,b,c,d])}" fill="${SKS}" opacity="${h.abs?.5:.28}"/>`+(h.abs?`<polygon points="${pts([a,b,c,d])}" fill="${hot()}"/>`:'')}}
 }else{
  for(const sx of [-1,1]){const a=T(.14,sx*3),b=T(.1,sx*(D.sw-5)),c=T(.5,sx*(D.hw+2)),d=T(.52,sx*2);
   s+=`<polygon points="${pts([a,b,c,d])}" fill="${SKL}" opacity=".55"/><polygon points="${pts([a,b,c,d])}" fill="none" stroke="${SKS}" stroke-width="1" opacity=".5"/>`+(h.lats?`<polygon points="${pts([a,b,c,d])}" fill="${hot()}"/>`:'');
   const t1=T(.0,sx*3),t2=T(.02,sx*(D.sw-4)),t3=T(.16,sx*4);s+=(h.traps?`<polygon points="${pts([t1,t2,t3])}" fill="${hot()}"/>`:`<polygon points="${pts([t1,t2,t3])}" fill="${SKL}" opacity=".5"/>`);
   if(h.lowback){const a2=T(.6,sx*1),b2=T(.6,sx*9),c2=T(.95,sx*9),d2=T(.95,sx*1);s+=`<polygon points="${pts([a2,b2,c2,d2])}" fill="${hot()}"/>`}}
  s+=`<line x1="${f(T(0,0)[0])}" y1="${f(T(0,0)[1])}" x2="${f(T(1,0)[0])}" y2="${f(T(1,0)[1])}" stroke="${SKS}" stroke-width="1" opacity=".5"/>`;
 }
 if(h.lats&&!back){for(const sx of [-1,1]){const a=T(.3,sx*(D.sw-6)),b=T(.32,sx*(D.sw-1)),c=T(.7,sx*(D.hw+4)),d=T(.7,sx*(D.hw)),poly=[a,b,c,d];s+=`<polygon points="${pts(poly)}" fill="${hot()}"/>`}}
 // shorts
 s+=`<polygon points="${pts([T(.86,-D.hw-4),T(.86,D.hw+4),add(P,add(mul(pr,D.hw+6),mul(ax,15))),add(P,add(mul(pr,-D.hw-6),mul(ax,15)))])}" fill="${PN}"/>`;
 if(back&&h.glutes){for(const sx of [-1,1]){s+=ell(add(P,add(mul(pr,sx*8),mul(ax,8))),9,9,0,hot())}}
 // arms
 const arm=(S0,a)=>{if(!a||!a.el)return'';return limb(S0,a.el,6.3,5,SK)+belly(S0,a.el,6.3,5,.1,.88,1,2.6,{hot:h.biceps||h.triceps})+belly(S0,a.el,6.3,5,.1,.88,-1,2.6,{hot:h.biceps||h.triceps})+limb(a.el,a.wr,5,3.5,SK)+belly(a.el,a.wr,5,3.5,.05,.55,1,2.2,{hot:h.forearm})+circ(S0,h.delts?7.5:6.8,SK)+(h.delts?circ(S0,7.5,hot()):'')+circ(a.wr,4.2,SK)};
 s+=arm(SLp,p.L)+arm(SRp,p.Rr);
 // head
 const hd=p.hd||add(N,mul(ax,-(D.neck+D.headR)));
 s+=limb(add(N,mul(ax,-2)),add(hd,mul(ax,D.headR*.7)),5.2,5,SKS)+circ(hd,D.headR,back?HAIR:HAIR)+(back?'':circ(add(hd,mul(ax,-0)),D.headR-1.4,SK)+circ(add(add(hd,mul(pr,-5)),mul(ax,-.5)),1.4,'#3b2a20')+circ(add(add(hd,mul(pr,5)),mul(ax,-.5)),1.4,'#3b2a20')+ell(add(hd,mul(pr,-D.headR+.3)),2.2,3.8,0,SKS,.9)+ell(add(hd,mul(pr,D.headR-.3)),2.2,3.8,0,SKS,.9));
 return s}
/* ---- props ---- */
const plateSide=(p,r)=>circ(p,r||15,'#2B3540')+circ(p,(r||15)-3,'#46525F')+circ(p,5,'#9AA5B1')+circ(p,2,'#46525F');
const dbSide=(p,r)=>circ(p,r||10,'#2B3540')+circ(p,(r||10)-2.5,'#46525F')+circ(p,3,'#9AA5B1');             // dumbbell seen end-on from the side
const dbFront=(p,ang,o)=>{o=o||{};const a=(ang||0);return `<g transform="rotate(${f(a)} ${f(p[0])} ${f(p[1])})"><rect x="${f(p[0]-13)}" y="${f(p[1]-2)}" width="26" height="4" rx="2" fill="${BAR}"/><rect x="${f(p[0]-14)}" y="${f(p[1]-8)}" width="8" height="16" rx="3" fill="#2B3540"/><rect x="${f(p[0]+6)}" y="${f(p[1]-8)}" width="8" height="16" rx="3" fill="#2B3540"/></g>`};
const barFront=(a,b,ext)=>{const d=nrm(sub(b,a)),e=ext||34,A=sub(a,mul(d,e)),B=add(b,mul(d,e)),n=[-d[1],d[0]];let s=`<line x1="${f(A[0])}" y1="${f(A[1])}" x2="${f(B[0])}" y2="${f(B[1])}" stroke="${BAR}" stroke-width="4.5" stroke-linecap="round"/>`;
 for(const [c,sg] of [[A,1],[B,-1]]){const q=add(c,mul(d,sg*(e>0?-6:0)));s+=limb(add(q,mul(n,16)),sub(q,mul(n,16)),3.6,3.6,'#2B3540')}return s};
const pad=(a,b,w,c)=>`<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="${c||PAD}" stroke-width="${w}" stroke-linecap="round"/>`;
const cable=(a,b)=>`<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="#8791A0" stroke-width="2"/>`;
const pulley=p=>circ(p,6,'#46525F')+circ(p,2.5,'#9AA5B1');
const benchSide=(x0,x1,y)=>pad([x0,y],[x1,y],11)+pad([x0+16,y],[x0+16,G],7)+pad([x1-16,y],[x1-16,G],7);
const label=(t,ok)=>`<text x="0" y="0" data-cap="1" fill="${ok?'#6EE787':RED}" font-size="17" font-weight="700" text-anchor="middle">${ok?'✓':'✗'} ${t}</text>`;
const tick=t=>label(t,true),cross=t=>label(t,false);

const PAT=[];
/* ===== CHEST patterns: bench, incline, floor_press, pushup, fly_db, cable_fly, chest_machine, dips ===== */
/* ---- shared helpers (3D arm solver, top-down projection) ---- */
(function(){
const s3=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],a3=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],m3=(a,k)=>[a[0]*k,a[1]*k,a[2]*k],d3=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],l3=a=>Math.hypot(a[0],a[1],a[2]),n3=a=>m3(a,1/(l3(a)||1));
/* 3D two-bone IK: joint between A and B, bends toward pole (3D vector). coords [x,y,z] */
function ik3(A,B,l1,l2,pole){const d=s3(B,A),Dd=l3(d)||1,m=Math.min(Dd,l1+l2-.5),a=(l1*l1-l2*l2+m*m)/(2*m),h=Math.sqrt(Math.max(0,l1*l1-a*a)),u=m3(d,1/Dd);
 const pr=s3(pole,m3(u,d3(pole,u))),p=n3(pr);return a3(A,a3(m3(u,a),m3(p,h)))}
const reach3=(A,B,l1,l2)=>{const d=s3(B,A),Dd=l3(d),m=l1+l2-.6;return Dd>m?a3(A,m3(d,m/Dd)):B};
/* top-down perspective: point [x,y,z] -> screen, camera above (cx,cy); higher = bigger */
const TK=.0045;
const tp=(p,c)=>{const s=1+p[2]*TK;return[c[0]+(p[0]-c[0])*s,c[1]+(p[1]-c[1])*s]};
const lerp3=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
/* arc interpolation of a hand target about the shoulder (keeps arm length ~constant) */
const arcTo=(S3,W0,W1,e,k)=>{const v0=s3(W0,S3),v1=s3(W1,S3),r=(l3(v0)+(l3(v1)-l3(v0))*e)*(k||1);return a3(S3,m3(n3(lerp3(n3(v0),n3(v1),e)),r))};
/* side projection of a 3D point (lat,fwd,up) relative to shoulder joint S (screen); sx=+1 near arm, -1 far arm; mild oblique so lateral reach shows */
const sideP=(p,S,sx,sh)=>{const out=(p[0]*sx-D.sw);return[S[0]+p[1],S[1]-p[2]+sx*(sh==null?.18:sh)*out]};
const frontP=(p,N)=>[N[0]+p[0],N[1]+4-p[2]];
window.__CH={ik3,reach3,tp,a3,s3,m3,n3,l3,TK,lerp3,arcTo,sideP,frontP};
})();

/* ---------------- 1. BENCH PRESS ---------------- */
(function(){
const {ik3,reach3,tp}=window.__CH;
const BT=214; // bench pad centre y (top surface 208.5)
function legsFor(H,A1,A2){const k1=ik(H,A1,D.thigh,D.shin,[1,-1]),k2=ik(H,A2,D.thigh,D.shin,[1,-1]);return{near:{kn:k1,an:A1},far:{kn:k2,an:A2}}}
function wpath(e,bd){ // wrist relative to shoulder S=[194,196.5]
 const top=[200,136],bot=bd===1?[197,172]:[216,175.5];
 return lerp(top,bot,e)}
function bnSide(e,bd,V){V=V||{};const lift=bd===0?e*14:0;
 const S=[194,196.5],H=[250,191.5-lift],W=wpath(e,bd),E=ik(S,W,D.uarm,D.farm,[.5,1]);
 const lg=legsFor(H,[292,G-9],[298,G-9]);
 let s=floorSvg();
 // rack post + hook
 s+=pad([140,112],[140,G-2],8)+pad([140,G-2],[170,G-2],6)+pad([140,138],[152,138],4,BAR);
 s+=benchSide(150,276,BT);
 s+=side({H,S,hot:{chest:true,triceps:true,delts:true},near:{el:E,wr:W,kn:lg.near.kn,an:lg.near.an},far:{el:E,wr:W,kn:lg.far.kn,an:lg.far.an}});
 s+=V.db?dbSide(W,10):plateSide(W,15);
 return s+(bd===0?mark(H,18)+cross('הישבן מתרומם מהספסל'):bd===1?mark(W,22)+cross('המוט יורד גבוה מדי'):tick(V.db?'המשקולות יורדות לגובה החזה':'המוט נוגע באמצע החזה'))}
function bnTop(e,bd,V){V=V||{};const N=[190,70],P=[190,126],C=[190,96],sg=[-1,1];
 const grip=V.db?30:36,zTop=60,zBot=24,wide=bd===0?1:0;
 let s=bgTop+`<rect x="166" y="26" width="48" height="124" rx="8" fill="${PAD}"/>`;
 const arms=sg.map(sx=>{const S3=[N[0]+sx*D.sw,N[1]+4,12];
  const tilt=bd===1?sx*9:0,Wt=[N[0]+sx*(grip-(V.db?4:0)),N[1]+6+tilt*e,zTop],Wb=[N[0]+sx*(grip+(bd===0?4:0)),N[1]+22+tilt,zBot];
  const W3=reach3(S3,lerp(Wt,Wb,e),D.uarm,D.farm);
  const E3=ik3(S3,W3,D.uarm,D.farm,[sx*(bd===0?1.7:.85),.25,-1]);
  return{S:[S3[0],S3[1]],E:tp(E3,C),W:tp(W3,C),W3}});
 const legs=(sx)=>({kn:[P[0]+sx*24,P[1]+32],an:[P[0]+sx*24,P[1]+68]});
 s+=bodyFront({N,P,SL:arms[0].S,SR:arms[1].S,HL:[P[0]-14,P[1]],HR:[P[0]+14,P[1]],hot:{chest:true,triceps:true,delts:true},L:Object.assign({el:arms[0].E,wr:arms[0].W},legs(-1)),Rr:Object.assign({el:arms[1].E,wr:arms[1].W},legs(1))});
 if(V.db){s+=dbFront(arms[0].W,0)+dbFront(arms[1].W,0)}else s+=barFront(arms[0].W,arms[1].W,36);
 return s+(bd===0?mark(arms[0].E,15)+mark(arms[1].E,15)+cross('המרפקים נפתחים ל-90°'):bd===1?mark([N[0],N[1]+22],40)+cross('המוט לא ישר'):tick('המרפקים בזווית של כ-45°'))}
PAT.push({id:'bench',n:'בנץ׳ פרס',m:'חזה',v:['מהצד','מלמעלה'],ph:['מורידים לחזה','נוגעים בחזה','לוחצים למעלה','נעילה למעלה'],
 good:['הרגליים יציבות על הרצפה, השכמות צמודות לספסל','המוט יורד לאמצע החזה, המרפקים בזווית של כ-45°','הישבן נשאר על הספסל לכל אורך התנועה','לוחצים למעלה בנשיפה עד זרועות ישרות'],
 bad:[[{t:'הישבן מתרומם מהספסל',fix:'מורידים משקל. הישבן, הגב והראש נשארים על הספסל והרגליים דוחפות לרצפה.'},{t:'המוט יורד גבוה מדי',fix:'מורידים את המוט לאמצע החזה ולא לצוואר, כך הכתפיים מוגנות.'}],
      [{t:'המרפקים נפתחים ל-90°',fix:'מקרבים את המרפקים לגוף, זווית של כ-45° מהצלעות.'},{t:'המוט לא ישר',fix:'שתי הידיים לוחצות באותה מהירות והמוט נשאר אופקי.'}]],
 variants:[{n:'במוט',V:{bar:1}},{n:'במשקולות',V:{db:1}}],
 views:[bnSide,bnTop]});
})();

/* ---- shared top-down press scene (incline / floor press) ---- */
(function(){
const {ik3,reach3,tp,lerp3}=window.__CH;
window.__CH.pressTop=function(o){const {e,bd,V,N,P,zS,top,bot,grip,pad,mat,hot,cap}=o;const C=[N[0],N[1]+26],sg=[-1,1];
 let s=bgTop+(mat?`<rect x="${mat[0]}" y="${mat[1]}" width="${mat[2]}" height="${mat[3]}" rx="10" fill="#27323C"/>`:'')+(pad?`<rect x="${pad[0]}" y="${pad[1]}" width="${pad[2]}" height="${pad[3]}" rx="8" fill="${PAD}"/>`:'');
 const neutral=!!V.narrow;
 const arms=sg.map(sx=>{const S3=[N[0]+sx*D.sw,N[1]+4,zS],ea=V.alt?(sx<0?e:1-e):e,tilt=bd===1?sx*9:0;
  const Wt=[N[0]+sx*grip,N[1]+4+top[0]+tilt*ea,zS+top[1]],Wb=[N[0]+sx*(grip+(bd===0?5:0)),N[1]+4+bot[0]+tilt,zS+bot[1]];
  const W3=reach3(S3,lerp3(Wt,Wb,ea),D.uarm,D.farm),fl=V.narrow?.25:(bd===0?1.7:.85);
  const E3=ik3(S3,W3,D.uarm,D.farm,[sx*fl,.25,-1]);return{S:[S3[0],S3[1]],E:tp(E3,C),W:tp(W3,C)}});
 const lg=sx=>({kn:[P[0]+sx*24,P[1]+32],an:[P[0]+sx*24,P[1]+68]});
 s+=bodyFront({N,P,SL:arms[0].S,SR:arms[1].S,HL:[P[0]-14,P[1]],HR:[P[0]+14,P[1]],hot:hot||{chest:true,triceps:true,delts:true},L:Object.assign({el:arms[0].E,wr:arms[0].W},lg(-1)),Rr:Object.assign({el:arms[1].E,wr:arms[1].W},lg(1))});
 if(V.db){for(const a of arms)s+=dbFront(a.W,neutral?90:0)}else s+=barFront(arms[0].W,arms[1].W,36);
 return s+(bd===0?mark(arms[0].E,15)+mark(arms[1].E,15)+cross('המרפקים נפתחים ל-90°'):bd===1?mark([N[0],N[1]+26],40)+cross(V.db?'המשקולות לא ברמה אחת':'המוט לא ישר'):tick(cap))};
})();

/* ---------------- 2. INCLINE PRESS ---------------- */
(function(){
const A35=35*R,u=[-Math.cos(A35),-Math.sin(A35)],F=[-u[1],u[0]];
function icSide(e,bd,V){V=V||{};const lift=bd===0?e*13:0,H0=[255,196],H=[255,196-lift],S=add(H0,mul(u,56));
 const top=add(S,[4,-60.5]);let bot=add(add(H0,mul(u,42)),mul(F,21));if(bd===1)bot=add(S,[-4,-25]);
 const W=lerp(top,bot,e),E=ik(S,W,D.uarm,D.farm,[.3,1]);
 const A1=[H0[0]+44,G-9],A2=[H0[0]+50,G-9],k1=ik(H,A1,D.thigh,D.shin,[1,-1]),k2=ik(H,A2,D.thigh,D.shin,[1,-1]);
 const p0=add(add(H0,mul(F,-17.5)),mul(u,-10)),p1=add(add(add(S,mul(F,-17.5)),mul(u,52)),[0,0]);
 let s=floorSvg();
 s+=pad([H0[0]+36,213.5],[H0[0]+36,G],8)+pad([H0[0]-12,214],[H0[0]-22,G],7)+pad(add(p0,mul(u,60)),[add(p0,mul(u,60))[0]-26,G],7)+pad([H0[0]-48,G-3],[H0[0]+58,G-3],6);
 s+=pad([H0[0]-12,213.5],[H0[0]+42,213.5],11)+pad(p0,p1,11);
 s+=side({H,S,hot:{chest:true,triceps:true,delts:true},near:{el:E,wr:W,kn:k1,an:A1},far:{el:E,wr:W,kn:k2,an:A2}});
 s+=V.bar?plateSide(W,15):dbSide(W,10);
 return s+(bd===0?mark(H,18)+cross('הישבן מתרומם מהמושב'):bd===1?mark(W,22)+cross('המוט יורד גבוה מדי'):tick(V.bar?'המוט נוגע בחלק העליון של החזה':'המשקולות יורדות לגובה החזה'))}
function icTop(e,bd,V){V=V||{};const vv=Object.assign({},V,V.bar?{}:{db:1});
 return window.__CH.pressTop({e,bd,V:vv,N:[190,64],P:[190,110],zS:46,top:[6,60],bot:[22,10],grip:V.bar?36:30,pad:[168,24,44,112],hot:{chest:true,delts:true,triceps:true},cap:'הגב צמוד למשענת'})}
PAT.push({id:'incline',n:'אינקליין פרס',m:'חזה עליון',v:['מהצד','מלמעלה'],ph:['מורידים לחזה העליון','נוגעים בחזה','לוחצים למעלה','נעילה למעלה'],
 good:['המשענת בשיפוע של כ-35°, הגב מלא על הספסל','המשקולות או המוט יורדים לחלק העליון של החזה','הישבן נשאר על המושב והרגליים יציבות','לוחצים למעלה בנשיפה עד זרועות ישרות'],
 bad:[[{t:'הישבן מתרומם מהמושב',fix:'מורידים משקל. הישבן והגב נשארים צמודים לספסל.'},{t:'המוט יורד גבוה מדי',fix:'מורידים לחלק העליון של החזה, לא לצוואר ולא לכתפיים.'}],
      [{t:'המרפקים נפתחים ל-90°',fix:'מקרבים מרפקים לגוף, זווית של כ-45° מהצלעות.'},{t:'המוט לא ישר',fix:'שתי הידיים לוחצות באותה מהירות. בעבודה עם משקולות שתיהן באותו גובה.'}]],
 variants:[{n:'במשקולות',V:{db:1}},{n:'במוט',V:{bar:1}}],
 views:[icSide,icTop]});
})();

/* ---------------- 3. FLOOR PRESS ---------------- */
(function(){
function fpSide(e,bd,V){V=V||{};const lift=bd===0?e*11:0,S=[194,248.5],H=[250,245-lift],nar=!!V.narrow;
 const path=t=>lerp([S[0]+6,S[1]-60.5],[S[0]+(nar?27:31),226],t);
 const ea=V.alt?1-e:e,W=path(e),W2=V.alt?path(ea):W; // near arm follows e, far arm opposite when alternating
 const E=ik(S,W,D.uarm,D.farm,[1,1]),E2=ik(S,W2,D.uarm,D.farm,[1,1]);
 const A1=[292,G-9],A2=[298,G-9],k1=ik(H,A1,D.thigh,D.shin,[1,-1]),k2=ik(H,A2,D.thigh,D.shin,[1,-1]);
 let s=floorSvg()+`<rect x="130" y="${G-3}" width="190" height="3" rx="1.5" fill="#27323C"/>`;
 s+=side({H,S,hot:{chest:true,triceps:true,delts:true},near:{el:E,wr:W,kn:k1,an:A1},far:{el:E2,wr:W2,kn:k2,an:A2}});
 const wt=(P,off)=>{const Q=bd===1?add(P,[-12,-3]):P;return nar?dbFront(Q,0):dbSide(Q,10)};
 if(V.alt)s+=wt(W2)+wt(W);else s+=wt(W);
 return s+(bd===0?mark(H,18)+cross('הגב מתקמר מהרצפה'):bd===1?mark(W,20)+cross('המשקולת לא מעל פרק היד'):tick(nar?'מרפקים קרובים לגוף':'המרפק נוגע ברצפה ועוצר'))}
function fpTop(e,bd,V){V=V||{};const vv=Object.assign({db:1},V);
 return window.__CH.pressTop({e,bd,V:vv,N:[190,70],P:[190,126],zS:14,top:[6,58],bot:[30,24],grip:V.narrow?9:30,mat:[130,20,120,140],cap:V.narrow?'מרפקים צמודים לגוף':'המרפקים בזווית של כ-45°'})}
PAT.push({id:'floor_press',n:'לחיצת חזה על הרצפה',m:'חזה, תלת ראשי',v:['מהצד','מלמעלה'],ph:['מורידים עד הרצפה','המרפקים נוגעים ברצפה','לוחצים למעלה','נעילה למעלה'],
 good:['שוכבים עם הגב על הרצפה והברכיים כפופות','יורדים עד שהזרועות נוגעות ברצפה, בלי לקפוץ','המשקולות מעל פרקי הידיים','לוחצים למעלה בנשיפה עד זרועות ישרות'],
 bad:[[{t:'הגב מתקמר מהרצפה',fix:'מורידים משקל ודוחפים את הרגליים לרצפה. הגב התחתון נשאר יציב.'},{t:'המשקולת לא מעל פרק היד',fix:'משאירים את פרק היד ישר מעל המרפק. המשקולת לא נופלת אחורה.'}],
      [{t:'המרפקים נפתחים ל-90°',fix:'מקרבים את המרפקים לגוף, כ-45° מהצלעות.'},{t:'המשקולות לא ברמה אחת',fix:'שתי הידיים נעות יחד ובאותו גובה.'}]],
 variants:[{n:'רגילה',V:{}},{n:'אחיזה צרה',V:{narrow:1}},{n:'מתחלפת',V:{alt:1}}],
 views:[fpSide,fpTop]});
})();

/* ---------------- 5. DUMBBELL FLY ---------------- */
(function(){
const {ik3,tp,sideP,a3}=window.__CH;
function armF(sx,e,bd,S3){const ph0=-16*R,ph1=(bd===1?125:88)*R,lag=(bd===2&&sx>0)?.6:1,ph=ph0+(ph1-ph0)*e*lag,d=bd===0?44:57;
 const W3=a3(S3,[sx*d*Math.sin(ph),4,d*Math.cos(ph)]);
 const E3=ik3(S3,W3,D.uarm,D.farm,[sx*Math.cos(ph),.15,-Math.sin(ph)]);return{E3,W3}}
function fySide(e,bd,V){const S=[194,196.5],H=[250,191.5],S3=[0,0,0],A1=[292,G-9],A2=[298,G-9],k1=ik(H,A1,D.thigh,D.shin,[1,-1]),k2=ik(H,A2,D.thigh,D.shin,[1,-1]);
 const mk=sx=>{const S3=[sx*D.sw,0,0],a=armF(sx,e,bd,S3);return{E:sideP(a.E3,S,sx,.15),W:sideP(a.W3,S,sx,.15)}};
 const n=mk(1),f=mk(-1);
 let s=floorSvg()+benchSide(150,276,214)+side({H,S,hot:{chest:true,delts:true},near:{el:n.E,wr:n.W,kn:k1,an:A1},far:{el:f.E,wr:f.W,kn:k2,an:A2}});
 s+=dbFront(f.W,0)+dbFront(n.W,0);
 return s+(bd===0?mark(n.E,16)+cross('המרפקים מתכופפים - זו לחיצה'):bd===1?mark(n.W,20)+cross('יורדים נמוך מדי'):tick('מרפקים כפופים מעט וקבועים'))}
function fyTop(e,bd,V){const N=[190,70],P=[190,126],C=[190,96];
 let s=bgTop+`<rect x="166" y="26" width="48" height="124" rx="8" fill="${PAD}"/>`;
 const arms=[-1,1].map(sx=>{const S3=[N[0]+sx*D.sw,N[1]+4,12],a=armF(sx,e,bd===1?2:bd===0?0:-1,S3);const W3=a.W3.slice();W3[2]+=12;const E3=a.E3.slice();E3[2]+=12;return{S:[S3[0],S3[1]],E:tp(E3,C),W:tp(W3,C)}});
 const lg=sx=>({kn:[P[0]+sx*24,P[1]+32],an:[P[0]+sx*24,P[1]+68]});
 s+=bodyFront({N,P,SL:arms[0].S,SR:arms[1].S,HL:[P[0]-14,P[1]],HR:[P[0]+14,P[1]],hot:{chest:true,delts:true},L:Object.assign({el:arms[0].E,wr:arms[0].W},lg(-1)),Rr:Object.assign({el:arms[1].E,wr:arms[1].W},lg(1))});
 s+=dbFront(arms[0].W,90)+dbFront(arms[1].W,90);
 return s+(bd===0?mark(arms[0].E,15)+mark(arms[1].E,15)+cross('המרפקים מתכופפים'):bd===1?mark(arms[1].W,22)+cross('זרוע אחת עייפה ונשארת גבוהה'):tick('קשת רחבה וסימטרית'))}
PAT.push({id:'fly_db',n:'פרפר במשקולות',m:'חזה',v:['מהצד','מלמעלה'],ph:['פותחים בקשת','מתיחה בחזה','סוגרים למעלה','משקולות נפגשות'],
 good:['שוכבים על הספסל, המרפקים כפופים מעט וקבועים','פותחים בקשת רחבה עד שמרגישים מתיחה בחזה','לא יורדים מתחת לגובה הכתף','סוגרים בקשת כאילו מחבקים חבית'],
 bad:[[{t:'המרפקים מתכופפים - זו לחיצה',fix:'שומרים על זווית מרפק קבועה וקלה, התנועה באה מהכתף ומהחזה.'},{t:'יורדים נמוך מדי',fix:'עוצרים כשהזרועות בגובה החזה, בלי להעמיס על הכתפיים.'}],
      [{t:'המרפקים מתכופפים',fix:'שומרים על מרפקים כפופים מעט וקבועים לאורך כל הקשת.'},{t:'זרוע אחת עייפה ונשארת גבוהה',fix:'שתי הזרועות נעות יחד. אם אחת מפגרת, מורידים משקל.'}]],
 views:[fySide,fyTop]});
})();

/* ---------------- 4. PUSH-UP ---------------- */
(function(){
const {ik3,tp}=window.__CH;
/* one pose function shared by side + top views. Side x = forward (toward head), y = screen */
function pose(e,bd,V){const kn=!!V.kn,wall=!!V.wall;let A,Sn,Hn,K,wx,W,toe,L;
 if(wall){const ax=100,Ay=G-9,th=lerp([22*R],[38*R],e)[0];A=[ax,Ay];Sn=[ax+154*Math.sin(th),Ay-154*Math.cos(th)];
  const dir=nrm(sub(Sn,A));K=add(A,mul(dir,D.shin));Hn=add(A,mul(dir,D.shin+D.thigh));W=[216,118];wx=216;toe=22;
  if(bd===0)Hn=add(Hn,[-12*(.4+.6*e),0]);if(bd===1)Hn=add(Hn,[12*(.4+.6*e),0])}
 else{const kx=60,Sy=lerp([197],[230],e)[0];
  if(kn){const Kp=[kx,G-8],th=Math.asin((Kp[1]-Sy)/106);const dir=[Math.cos(th),-Math.sin(th)];K=Kp;Hn=add(Kp,mul(dir,D.thigh));Sn=add(Kp,mul(dir,106));A=[kx-44,G-8-14];
   wx=lerp([kx+106*Math.cos(Math.asin((Kp[1]-197)/106))-4],[kx+106*Math.cos(Math.asin((Kp[1]-197)/106))-4],0)[0]}
  else{const ay=G-17,th=Math.asin((ay-Sy)/154),dir=[Math.cos(th),-Math.sin(th)];A=[kx,ay];Sn=add(A,mul(dir,154));K=add(A,mul(dir,D.shin));Hn=add(A,mul(dir,D.shin+D.thigh));
   wx=kx+154*Math.cos(Math.asin((ay-197)/154))-4}
  W=[wx,G-4];toe=0;
  const off=(bd===0?18:bd===1?-16:0)*(.4+.6*e);if(off){const b=nrm(sub(Sn,A)),n=[b[1],-b[0]*-1];/* perpendicular pointing down */const dn=[-Math.abs(b[1]),Math.abs(b[0])];Hn=add(Hn,mul([0,1],off));}
 }
 return{A,S:Sn,H:Hn,K,W,wx,toe,kn,wall}}
function puSide(e,bd,V){V=V||{};const q=pose(e,bd,V);let {A,S,H,K,W}=q;
 const E=ik(S,W,D.uarm,D.farm,[-1,-.5]);
 let kk=q.kn?K:ik(A,H,D.shin,D.thigh,[-.2,1]);// knee: between ankle and hip
 let kne=q.kn?K:kk;
 const near={el:E,wr:W,kn:kne,an:A,toe:q.toe},far={el:E,wr:W,kn:add(kne,[-2,0]),an:add(A,[-3,0]),toe:q.toe};
 let s=floorSvg();
 if(q.wall)s+=`<rect x="${W[0]+4.5}" y="30" width="46" height="${G-30}" fill="#2A333D"/><line x1="${W[0]+4.5}" y1="30" x2="${W[0]+4.5}" y2="${G}" stroke="#3A4652" stroke-width="3"/>`;
 s+=side({H,S,hot:{chest:true,triceps:true,delts:true},near,far});
 if(!q.wall){ // custom shoe pointing down to the floor
  const T=q.kn?[A[0]-10,G-4]:[A[0]-9,G-4];s+=limb(A,T,4.3,3.6,WH);}
 if(q.kn)s+=circ([K[0],G-6],5,SK);
 const cap=V.kn?'ברכיים על הרצפה, גב ישר':V.wall?'הידיים על הקיר בגובה הכתפיים':V.wide?'הידיים רחבות מהכתפיים':V.narrow?'הידיים קרובות זו לזו':'גוף ישר מהראש לעקבים';
 return s+(bd===0?mark(H,18)+cross('האגן צונח'):bd===1?mark(H,18)+cross('האגן בולט למעלה'):tick(cap))}
function puTop(e,bd,V){V=V||{};const q=pose(e,bd,V),hy=130,grip=V.wide?54:V.narrow?10:30,N0=190;
 const py=x=>hy+(q.wx-x),zz=y=>G-y;
 const hyy=hy;
 const pt=(P2,z)=>{const c=[N0,hy+30];return tp([N0,py(P2[0]),z],c)};
 const N=pt(q.S,zz(q.S[1])),P=pt(q.H,zz(q.H[1])),C=[N0,hy+30];
 const Nn=[N0,py(q.S[0])],Pn=[N0,py(q.H[0])];
 const Kk=pt(q.K,zz(q.K[1])),Aa=pt(q.A,zz(q.A[1]));
 let s=bgTop;if(q.wall)s+=`<rect x="-400" y="-400" width="1100" height="${hy-4.5+400}" fill="#2A333D"/><line x1="-400" y1="${hy-4.5}" x2="700" y2="${hy-4.5}" stroke="#3A4652" stroke-width="3"/>`;
 const fl=V.narrow?.15:V.wide?1.3:(bd===0?2.2:.7);
 const arms=[-1,1].map(sx=>{const S3=[N0+sx*D.sw,Nn[1]+4,zz(q.S[1])],W3=[N0+sx*grip,hyy+(bd===1&&sx>0?20:0),4],E3=ik3(S3,W3,D.uarm,D.farm,[sx*fl,.5,.8]);return{S:[S3[0],Nn[1]+4],E:tp(E3,C),W:[W3[0],W3[1]]}});
 const hipy=Pn[1],lg=sx=>({kn:[N0+sx*9,Kk[1]],an:[N0+sx*9,Aa[1]]});
 s+=bodyFront({N:Nn,P:Pn,back:true,SL:arms[0].S,SR:arms[1].S,HL:[N0-14,Pn[1]],HR:[N0+14,Pn[1]],hot:{triceps:true,delts:true,chest:true,lats:false},L:Object.assign({el:arms[0].E,wr:arms[0].W},lg(-1)),Rr:Object.assign({el:arms[1].E,wr:arms[1].W},lg(1))});
 const cap=V.kn?'הברכיים על הרצפה':V.wall?'הידיים על הקיר':V.wide?'ידיים רחבות מהכתפיים':V.narrow?'ידיים צרות, מרפקים צמודים':'המרפקים בזווית של כ-45°';
 return s+(bd===0?mark(arms[0].E,15)+mark(arms[1].E,15)+cross('המרפקים נפתחים החוצה'):bd===1?mark(arms[1].W,18)+cross(V.wall?'יד אחת לא על הקיר':'הידיים לא באותו קו'):tick(cap))}
PAT.push({id:'pushup',n:'שכיבות סמיכה',m:'חזה, תלת ראשי',v:['מהצד','מלמעלה'],ph:['יורדים עם החזה','כמעט נוגעים ברצפה','דוחפים למעלה','זרועות ישרות'],
 good:['גוף ישר כמו קרש, בטן ואחוריים מכווצים','הידיים מתחת לכתפיים או מעט רחבות מהן','המרפקים בזווית של כ-45° מהגוף','יורדים עד שהחזה כמעט נוגע ברצפה'],
 bad:[[{t:'האגן צונח',fix:'מכווצים בטן ועכוז. הגוף נשאר ישר מהראש לעקבים.'},{t:'האגן בולט למעלה',fix:'מורידים את האגן עד שהגוף בקו אחד ישר.'}],
      [{t:'המרפקים נפתחים החוצה',fix:'מקרבים את המרפקים לגוף, כ-45° מהצלעות.'},{t:'הידיים לא באותו קו',fix:'שתי הידיים על אותו קו, מתחת לכתפיים ובמרחק זהה מהגוף.'}]],
 variants:[{n:'רגילות',V:{}},{n:'על הברכיים',V:{kn:1}},{n:'לקיר',V:{wall:1}},{n:'רחבות',V:{wide:1}},{n:'צרות',V:{narrow:1}}],
 views:[puSide,puTop]});
})();

/* ---------------- 6. CABLE FLY ---------------- */
(function(){
const {ik3,arcTo,sideP,frontP,a3}=window.__CH;
function armC(sx,e,bd){const S3=[sx*D.sw,0,0],W0=[sx*76,-8,0],W1=[sx*4,36,-32],W3=arcTo(S3,W0,W1,e,bd===1?.66:1);
 const E3=ik3(S3,W3,D.uarm,D.farm,[sx*1,0,-1]);return{E3,W3}}
const handle=p=>circ(p,5.5,'#2B3540')+circ(p,2.6,BAR);
function cfSide(e,bd,V){const lean=14+(bd===0?e*17:0),H=[150,158],S=add(H,rot([0,-D.torso],lean)),A1=[172,G-9],A2=[128,G-9];
 const k1=ik(H,A1,D.thigh,D.shin,[1,-.3]),k2=ik(H,A2,D.thigh,D.shin,[1,-.3]);
 const mk=sx=>{const a=armC(sx,e,bd);return{E:sideP(a.E3,S,sx,.12),W:sideP(a.W3,S,sx,.12)}};const n=mk(1),f=mk(-1);
 const px=S[0]-12,pp=[px,50];
 let s=floorSvg()+pad([px,44],[px,G],12,'#303B47')+pad([px-26,G-3],[px+26,G-3],6,'#303B47')+pulley(pp);
 s+=cable(pp,f.W)+side({H,S,hot:{chest:true,delts:true},near:{el:n.E,wr:n.W,kn:k1,an:A1},far:{el:f.E,wr:f.W,kn:k2,an:A2}})+cable(pp,n.W)+handle(f.W)+handle(n.W);
 return s+(bd===0?mark(add(H,[6,-20]),20)+cross('הגב מתכופף יותר מדי'):bd===1?mark(n.E,16)+cross('המרפקים מתכופפים'):tick('מרפקים כפופים מעט וקבועים'))}
function cfFront(e,bd,V){const sh=bd===0?e*9:0,N=[190,99-sh],P=[190,155],px=124;
 const arms=[-1,1].map(sx=>{const S3=[sx*D.sw,0,0],a=armC(sx,e,bd===1?1:0);return{S:[N[0]+sx*D.sw,N[1]+4],E:frontP(a.E3,N),W:frontP(a.W3,N)}});
 let s=floorSvg();for(const sx of[-1,1])s+=pad([190+sx*(px+8),38],[190+sx*(px+8),G],12,'#303B47')+pad([190+sx*(px+8-26),G-3],[190+sx*(px+8+14),G-3],6,'#303B47')+pulley([190+sx*px,48]);
 for(const [sx,a] of[[-1,arms[0]],[1,arms[1]]])s+=cable([190+sx*px,48],a.W);
 s+=bodyFront({N,P,hd:[190,N[1]-D.neck-D.headR+(bd===0?e*6:0)],SL:arms[0].S,SR:arms[1].S,hot:{chest:true,delts:true},L:{el:arms[0].E,wr:arms[0].W,kn:[173,G-9-D.shin],an:[190-D.stance,G-9]},Rr:{el:arms[1].E,wr:arms[1].W,kn:[207,G-9-D.shin],an:[190+D.stance,G-9]}});
 s+=handle(arms[0].W)+handle(arms[1].W);
 return s+(bd===0?mark([N[0]-D.sw,N[1]+4],14)+mark([N[0]+D.sw,N[1]+4],14)+cross('הכתפיים מתרוממות'):bd===1?mark(arms[0].E,15)+mark(arms[1].E,15)+cross('המרפקים מתכופפים'):tick('קשת חלקה, הידיים נפגשות'))}
PAT.push({id:'cable_fly',n:'פרפר בכבלים',m:'חזה',v:['מהצד','מלפנים'],ph:['סוגרים בקשת','מכווצים את החזה','פותחים לאט','התחלה'],
 good:['הכבלים מגבוה, עמידה יציבה והטיה קלה קדימה','המרפקים כפופים מעט וקבועים','מביאים את הידיים יחד בקשת כלפי מטה','פותחים לאט עד מתיחה בחזה'],
 bad:[[{t:'הגב מתכופף יותר מדי',fix:'שומרים על הטיה קלה וקבועה. הגב ישר והתנועה מהחזה.'},{t:'המרפקים מתכופפים',fix:'מקבעים זווית מרפק קלה. אחרת זו לחיצה ולא פרפר.'}],
      [{t:'הכתפיים מתרוממות',fix:'מורידים כתפיים מהאוזניים ומרפים את הצוואר.'},{t:'המרפקים מתכופפים',fix:'מקבעים זווית מרפק קלה לאורך כל הקשת.'}]],
 views:[cfSide,cfFront]});
})();

/* ---------------- 7. CHEST MACHINE (press / pec deck) ---------------- */
(function(){
const {ik3,reach3,lerp3,sideP,frontP}=window.__CH;
function armM(sx,e,bd,V,side){const S3=[sx*D.sw,0,0],ee=(bd===1&&!side&&sx>0)?e*.6:e;let W0,W1,pole;
 if(V.deck){W0=[sx*64,16,-4];W1=[sx*6,46,-4];pole=[sx*1,-.6,0]}else{W0=[sx*34,24,-8];W1=[sx*34,58,-6];pole=[sx*1,-.5,-.3]}
 const W3=reach3(S3,lerp3(W0,W1,ee),D.uarm,D.farm),E3=ik3(S3,W3,D.uarm,D.farm,pole);return{E3,W3}}
function mcSide(e,bd,V){V=V||{};const H=[160,205],lean=bd===0?e*14:0,S0=add(H,rot([0,-D.torso],-4+lean)),S=[S0[0],S0[1]-(bd===1?e*7:0)];
 const A1=[H[0]+49,G-9],A2=[H[0]+55,G-9],k1=ik(H,A1,D.thigh,D.shin,[1,-1]),k2=ik(H,A2,D.thigh,D.shin,[1,-1]);
 const mk=sx=>{const a=armM(sx,e,-1,V,true);return{E:sideP(a.E3,S,sx,.15),W:sideP(a.W3,S,sx,.15)}};const n=mk(1),f=mk(-1);
 const piv=[S0[0]-28,S0[1]+(V.deck?-8:4)];
 let s=floorSvg()+pad([H[0]-28,H[1]+16],[S0[0]-30,S0[1]-50],9,'#303B47')+pad([H[0]+14,H[1]+22],[H[0]+14,G],8)+pad([H[0]-44,G-3],[H[0]+70,G-3],6)+pad([H[0]-12,H[1]+16.5],[H[0]+38,H[1]+16.5],11)+pad([H[0]-17,H[1]+10],[S0[0]-19,S0[1]-28],11);
 s+=pad(piv,f.W,6,'#46525F')+pad(piv,n.W,6,'#5B6877');
 s+=side({H,S,hot:{chest:true,delts:true,triceps:!V.deck},near:{el:n.E,wr:n.W,kn:k1,an:A1},far:{el:f.E,wr:f.W,kn:k2,an:A2}});
 const grip=p=>V.deck?pad([p[0],p[1]-11],[p[0],p[1]+11],6.5,'#9AA5B1'):circ(p,5.5,'#9AA5B1')+circ(p,2.2,'#46525F');
 s+=grip(f.W)+grip(n.W);
 return s+(bd===0?mark(add(S,[-2,6]),22)+cross('הגב מתנתק מהמשענת'):bd===1?mark(S,16)+cross('הכתפיים מתרוממות'):tick(V.deck?'מרפקים בגובה הכתפיים':'הגב צמוד למשענת'))}
function mcFront(e,bd,V){V=V||{};const sh=bd===0?e*8:0,N=[190,151-sh],P=[190,205];
 const arms=[-1,1].map(sx=>{const a=armM(sx,e,bd,V,false);return{S:[N[0]+sx*D.sw,N[1]+4],E:frontP(a.E3,N),W:frontP(a.W3,N)}});
 let s=floorSvg()+pad([190-64,N[1]-50],[190-64,G],8,'#303B47')+pad([190+64,N[1]-50],[190+64,G],8,'#303B47')+pad([190-78,G-3],[190+78,G-3],6,'#303B47');
 s+=`<rect x="166" y="${N[1]-34}" width="48" height="${P[1]-N[1]+40}" rx="8" fill="${PAD}"/><rect x="156" y="${P[1]+8}" width="68" height="12" rx="5" fill="${PAD}"/>`;
 for(const [sx,a] of[[-1,arms[0]],[1,arms[1]]])s+=pad([190+sx*84,N[1]+2],a.W,6,'#46525F');
 s+=bodyFront({N,P,hd:[190,N[1]-D.neck-D.headR+(bd===0?e*5:0)],SL:arms[0].S,SR:arms[1].S,hot:{chest:true,delts:true},L:{el:arms[0].E,wr:arms[0].W,kn:[190-24,P[1]+3],an:[190-26,G-9]},Rr:{el:arms[1].E,wr:arms[1].W,kn:[190+24,P[1]+3],an:[190+26,G-9]}});
 s+=circ(arms[0].W,5.5,'#9AA5B1')+circ(arms[1].W,5.5,'#9AA5B1');
 return s+(bd===0?mark([N[0]-D.sw,N[1]+4],14)+mark([N[0]+D.sw,N[1]+4],14)+cross('הכתפיים מתרוממות'):bd===1?mark(arms[1].W,18)+cross('ידיים לא סימטריות'):tick(V.deck?'הזרועות נפגשות מול החזה':'שתי הידיים לוחצות יחד'))}
PAT.push({id:'chest_machine',n:'מכונת חזה',m:'חזה',v:['מהצד','מלפנים'],ph:['מתקרבים','לוחצים את החזה','חוזרים לאט','התחלה'],
 good:['הגב והראש צמודים למשענת','המושב כך שהידיות בגובה החזה','הכתפיים למטה ואחורה, לא מתרוממות','חוזרים לאט ובשליטה, בלי לטרוק משקל'],
 bad:[[{t:'הגב מתנתק מהמשענת',fix:'מורידים משקל. הגב נשאר צמוד למשענת והלחיצה מהחזה.'},{t:'הכתפיים מתרוממות',fix:'מורידים כתפיים מהאוזניים ומרפים את הצוואר.'}],
      [{t:'הכתפיים מתרוממות',fix:'מורידים כתפיים מהאוזניים, חזה פתוח.'},{t:'ידיים לא סימטריות',fix:'שתי הידיים נעות יחד. אם אחת מפגרת, מורידים משקל.'}]],
 variants:[{n:'לחיצה',V:{}},{n:'פרפר',V:{deck:1}}],
 views:[mcSide,mcFront]});
})();

/* ---------------- 8. DIPS ---------------- */
(function(){
const {ik3,frontP}=window.__CH,wy=116,wx=200;
function pose(e,bd,V,front){const tri=!!V.tri,lean=tri?4:28,bot=bd===0&&!front?wy-8:bd===1&&!front?wy-54:wy-34;
 const Sy=lerp([wy-61],[bot],e)[0]-(front&&bd===1?e*8:0),Sx=tri?lerp([wx],[wx-3],e)[0]:lerp([wx+4],[wx+16],e)[0];
 const S=[Sx,Sy],u=[Math.sin(lean*R),-Math.cos(lean*R)],H=sub(S,mul(u,D.torso));
 const fl=tri?.12:(front&&bd===0?1.5:.45);
 const arm=sx=>{const S3=[sx*D.sw,Sx,G-Sy],W3=[sx*28,wx,G-wy],E3=ik3(S3,W3,D.uarm,D.farm,[sx*fl,-1,0]);return{S3,W3,E3}};
 return{S,H,arm,Sy,Sx}}
function dpSide(e,bd,V){V=V||{};const q=pose(e,bd,V,false),H=q.H,a=q.arm(1),b=q.arm(-1);
 const E=[a.E3[1],G-a.E3[2]],E2=[b.E3[1],G-b.E3[2]],W=[wx,wy];
 const A1=add(H,[-30,58]),A2=add(H,[-37,52]),k1=ik(H,A1,D.thigh,D.shin,[1,.3]),k2=ik(H,A2,D.thigh,D.shin,[1,.3]);
 let s=floorSvg()+pad([wx-34,wy+5],[wx+46,wy+5],6,BAR)+pad([wx-30,wy+5],[wx-30,G],7,'#46525F')+pad([wx+42,wy+5],[wx+42,G],7,'#46525F')+pad([wx-44,G-3],[wx+58,G-3],6,'#46525F');
 s+=side({H,S:q.S,hot:V.tri?{triceps:true,delts:true}:{chest:true,triceps:true,delts:true},near:{el:E,wr:W,kn:k1,an:A1,toe:-14},far:{el:E2,wr:W,kn:k2,an:A2,toe:-14}});
 return s+(bd===0?mark(E,17)+cross('יורדים עמוק מדי'):bd===1?mark(E,17)+cross('ירידה חלקית בלבד'):tick(V.tri?'הגוף זקוף, המרפקים אחורה':'הגוף נוטה קדימה, החזה יורד'))}
function dpFront(e,bd,V){V=V||{};const q=pose(e,bd,V,true),N=[190,q.Sy-4],P=[190,q.H[1]],ar=[-1,1].map(sx=>{const a=q.arm(sx);return{S:[190+sx*D.sw,q.Sy],E:[190+a.E3[0],G-a.E3[2]],W:[190+a.W3[0],wy]}});
 let s=floorSvg();for(const sx of[-1,1])s+=pad([190+sx*38,wy+5],[190+sx*38,G],8,'#46525F')+pad([190+sx*38-16,G-3],[190+sx*38+16,G-3],6,'#46525F')+circ([190+sx*28,wy+5],4.2,BAR);
 s+=bodyFront({N,P,hd:[190,N[1]-D.neck-D.headR+(bd===1?e*8:0)],SL:ar[0].S,SR:ar[1].S,hot:V.tri?{triceps:true,delts:true}:{chest:true,triceps:true,delts:true},L:{el:ar[0].E,wr:ar[0].W,kn:[P[0]-8,P[1]+50],an:[P[0]+2,P[1]+62]},Rr:{el:ar[1].E,wr:ar[1].W,kn:[P[0]+8,P[1]+50],an:[P[0]-2,P[1]+62]}});
 return s+(bd===0?mark(ar[0].E,15)+mark(ar[1].E,15)+cross('המרפקים נפתחים החוצה'):bd===1?mark([N[0]-D.sw,q.Sy],14)+mark([N[0]+D.sw,q.Sy],14)+cross('הכתפיים מתרוממות'):tick(V.tri?'המרפקים צמודים לגוף':'המרפקים בזווית קלה החוצה'))}
PAT.push({id:'dips',n:'מקבילים',m:'חזה, תלת ראשי',v:['מהצד','מלפנים'],ph:['יורדים לאט','עומק מלא','דוחפים למעלה','זרועות ישרות'],
 good:['נתלים על המקבילים, הרגליים כפופות ומוצלבות','יורדים עד זווית של כ-90° במרפקים','לחזה: מטים את הגוף קדימה. לתלת: גוף זקוף','דוחפים למעלה עד זרועות ישרות, בלי לנעול בכוח'],
 bad:[[{t:'יורדים עמוק מדי',fix:'עוצרים כשהמרפקים בזווית של כ-90°. ירידה עמוקה מדי מעמיסה על הכתפיים.'},{t:'ירידה חלקית בלבד',fix:'יורדים עד שהמרפקים כפופים בכ-90° כדי לעבוד על כל הטווח.'}],
      [{t:'המרפקים נפתחים החוצה',fix:'מקרבים את המרפקים לגוף ושומרים עליהם מעל פרקי הידיים.'},{t:'הכתפיים מתרוממות',fix:'דוחפים את הכתפיים הרחק מהאוזניים ומרפים את הצוואר.'}]],
 variants:[{n:'לחזה',V:{}},{n:'ליד אחורית',V:{tri:1}}],
 views:[dpSide,dpFront]});
})();

/* ===== pat_back.js : back / core-posterior patterns ===== */
const bkBF=p=>bodyFront(Object.assign({SL:[p.N[0]-D.sw,p.N[1]],SR:[p.N[0]+D.sw,p.N[1]],HL:[p.P[0]-D.hw,p.P[1]],HR:[p.P[0]+D.hw,p.P[1]]},p));
/* ---------- 1. lat pulldown ---------- */
(function(){
const PL=[170,48];
const frameS=()=>pad([252,G],[252,40],8)+pad([252,42],PL,6)+pulley(PL);
function sideF(e,bd,V){
 const H=[140,205],K=[190,203],A=[193,251];
 const lean=-8-e*6-(bd===0?e*28:0);
 const S=add(H,rot([0,-56],lean)),S0=add(H,rot([0,-56],-8));
 const u=nrm(sub(S,H)),F=[-u[1],u[0]];
 const W0=add(S0,[24,-54]);
 let W1=add(add(S,mul(F,20)),mul(u,-12)),W;
 if(bd===1){W1=add(S,[-17,-9]);const C=add(S0,[-30,-62]);W=add(add(mul(W0,(1-e)*(1-e)),mul(C,2*e*(1-e))),mul(W1,e*e))}
 else W=lerp(W0,W1,e);
 const hu=bd===1?rot(u,24*e):u;
 const el=ik(S,W,D.uarm,D.farm,[-1,bd===1?.2:.9]);
 let s=floorSvg()+frameS()+pad([100,222],[165,222],10)+pad([128,222],[128,G],8)+pad([252,190],[200,190],5)+pad([170,189],[204,189],9);
 s+=cable(PL,W);
 s+=side({H,S,hu,hot:{lats:true,biceps:true,forearm:true},near:{el,wr:W,kn:K,an:A},far:{el:add(el,[-3,0]),wr:add(W,[-3,0]),kn:[K[0]-3,K[1]],an:[A[0]-4,A[1]]}});
 s+=circ(W,4.2,BAR)+circ(W,2,'#7B8794');
 return s+(bd===0?mark(S,22)+cross('נשענים אחורה ומנדנדים'):bd===1?mark(W,17)+cross('מושכים מאחורי הראש'):tick('חזה גבוה, מרפקים למטה'))}
function backF(e,bd,V){
 const cx=190,gw=48;let sh=bd===0?9*e:0;
 const N=[cx,151-sh],P=[cx,205],hd=[cx,151-22.5+(bd===0?0:0)];
 const tl=bd===1?7*e:0;
 const SL=[cx-24,N[1]+tl],SR=[cx+24,N[1]-tl];
 const y0=151-50,y1=151+8;
 const wy=e0=>y0+(y1-y0)*e0;
 const WL=[cx-gw,wy(e)+(bd===1?13*e:0)],WR=[cx+gw,wy(e)-(bd===1?5*e:0)];
 const eL=ik(SL,WL,D.uarm,D.farm,[-1,.8]),eR=ik(SR,WR,D.uarm,D.farm,[1,.8]);
 let s=floorSvg();
 s+=pad([cx,44],[cx,50],8)+pulley([cx,52]);
 s+=pad([cx-70,206],[cx+70,206],11)+pad([cx,206],[cx,G],9);
 s+=pad([cx-52,190],[cx+52,190],9);
 s+=cable([cx,52],[WL[0]-4,WL[1]])+cable([cx,52],[WR[0]+4,WR[1]]);
 s+=`<line x1="${f(WL[0]-12)}" y1="${f(WL[1]+4)}" x2="${f(WL[0]-4)}" y2="${f(WL[1])}" stroke="${BAR}" stroke-width="4.5" stroke-linecap="round"/><line x1="${f(WL[0]-4)}" y1="${f(WL[1])}" x2="${f(WR[0]+4)}" y2="${f(WR[1])}" stroke="${BAR}" stroke-width="4.5" stroke-linecap="round"/><line x1="${f(WR[0]+4)}" y1="${f(WR[1])}" x2="${f(WR[0]+12)}" y2="${f(WR[1]+4)}" stroke="${BAR}" stroke-width="4.5" stroke-linecap="round"/>`;
 s+=bkBF({N,P,hd,SL,SR,back:true,hot:{lats:true,traps:true,delts:false},L:{el:eL,wr:WL,kn:[cx-24,208],an:[cx-24,G-9]},Rr:{el:eR,wr:WR,kn:[cx+24,208],an:[cx+24,G-9]}});
 s+=circ(WL,3.2,BAR)+circ(WR,3.2,BAR);
 return s+(bd===0?mark([cx-24,N[1]],15)+mark([cx+24,N[1]],15)+cross('הכתפיים מתרוממות לאוזניים'):bd===1?mark(WL,15)+cross('משיכה לא שווה בשני הצדדים'):tick('מרפקים למטה, כתפיים רחוקות מהאוזניים'))}
PAT.push({id:'pulldown',n:'פולי עליון',m:'הגב הרחב (לאטים)',v:['מהצד','מאחור'],ph:['מושכים למטה','לוחצים לחזה','חוזרים לאט','זרועות ישרות'],
 good:['מתיישבים עם הירכיים מתחת לכרית','נשענים מעט אחורה, החזה מורם','מושכים את המוט לחזה העליון בעזרת המרפקים','חוזרים לאט עד זרועות ישרות'],
 bad:[[{t:'נשענים אחורה ומנדנדים',fix:'מורידים משקל. הגוף כמעט נייח והמרפקים עושים את העבודה.'},{t:'מושכים מאחורי הראש',fix:'מושכים את המוט לפנים, לחזה העליון, והראש נשאר ישר.'}],
      [{t:'הכתפיים מתרוממות לאוזניים',fix:'מורידים את הכתפיים למטה ומושכים את המרפקים לכיוון הרצפה.'},{t:'משיכה לא שווה בשני הצדדים',fix:'מושכים את שתי הידיים יחד כך שהמוט נשאר ישר.'}]],
 views:[sideF,backF]});
})();
/* ---------- 2. seated row ---------- */
(function(){
function sideF(e,bd,V){
 V=V||{};const mach=V.m!==0;
 const H=mach?[120,205]:[112,213];
 const lean0=mach?0:14,lean1=mach?-3:-4;
 let lean=lean0+(lean1-lean0)*e;
 if(bd===0)lean=lean0+(-30-lean0)*e;
 if(bd===1)lean=lean0+(22-lean0)*e;
 const S=add(H,rot([0,-56],lean));
 const K=mach?[170,203]:ik(H,[205,236],D.thigh,D.shin,[0,-1]),A=mach?[173,251]:[205,236];
 const S0=add(H,rot([0,-56],lean0));
 const W0=add(S0,[59,mach?8:10]);
 const u=nrm(sub(S,H)),F=[-u[1],u[0]];
 const W1=add(S,add(mul(u,-4),mul(F,24)));
 const W=lerp(W0,W1,e);
 const el=ik(S,W,D.uarm,D.farm,[-1,.2]);
 let s=floorSvg();
 if(mach){s+=pad([88,222],[150,222],10)+pad([118,222],[118,G],8);
  const px=S0[0]+21;s+=pad([px,S0[1]-6],[px,S0[1]+16],9)+pad([px,S0[1]+16],[px+8,G],7)+pad(W0,[W0[0]+55,W0[1]],5)+pulley([W0[0]+55,W0[1]])}
 else{s+=pad([70,228],[130,228],10)+pad([100,228],[100,G],8)+pad([A[0]+14,A[1]-22],[A[0]+14,G],7)+pad([A[0]+14,A[1]-22],[A[0]+3,A[1]-22],6);
  s+=pulley([240,222])+cable(W,[240,222])+pad([240,222],[240,G],6)}
 s+=side({H,S,hot:{lats:true,traps:true,forearm:true,biceps:true},bend:bd===1?-7*e:0,near:{el,wr:W,kn:K,an:A,toe:mach?22:8},far:{el:add(el,[-3,0]),wr:add(W,[-3,0]),kn:[K[0]-2,K[1]-1],an:[A[0]-3,A[1]],toe:mach?22:8}});
 s+=circ(W,4.2,BAR)+circ(W,2,'#7B8794');
 return s+(bd===0?mark(S,22)+cross('נשענים אחורה ומנדנדים'):bd===1?mark(lerp(H,S,.6),20)+cross('הגב מתעגל קדימה'):tick('המרפקים עוברים את הגוף'))}
function backF(e,bd,V){
 const cx=190,P=[cx,205],sh=bd===0?9*e:0;
 const N=[cx,150-sh],hd=[cx,150-22.5],tw=bd===1?8*e:0;
 const SL=[cx-24,N[1]+tw],SR=[cx+24,N[1]-tw];
 const mk=(S,sx,t)=>{const E=[S[0]+sx*(3+t*10),S[1]+9+t*18],W=[S[0]+sx*(5-t*13),S[1]+17+t*21];return{E,W}};
 const a=mk(SL,-1,e),b=mk(SR,1,e);
 let s=floorSvg()+pad([cx-45,206],[cx+45,206],11)+pad([cx,206],[cx,G],9);
 s+=bkBF({N,P,hd,SL,SR,back:true,hot:{lats:true,traps:true},L:{el:a.E,wr:a.W,kn:[cx-24,208],an:[cx-24,G-9]},Rr:{el:b.E,wr:b.W,kn:[cx+24,208],an:[cx+24,G-9]}});
 if(e>.5&&bd<0)s+=arrow([cx-24,N[1]+14],[cx-7,N[1]+14],'#6EE787')+arrow([cx+24,N[1]+14],[cx+7,N[1]+14],'#6EE787');
 return s+(bd===0?mark(SL,15)+mark(SR,15)+cross('הכתפיים מתרוממות לאוזניים'):bd===1?mark(SR,15)+cross('הגוף מסתובב לצד'):tick('מצמידים את השכמות'))}
PAT.push({id:'seated_row',n:'חתירה בישיבה',m:'אמצע הגב (שכמות ולאטים)',v:['מהצד','מאחור'],ph:['מושכים אחורה','לוחצים שכמות','חוזרים לאט','זרועות ישרות'],
 good:['הגב ישר והחזה גבוה','מושכים את המרפקים אחורה, מעבר לגוף','מצמידים את השכמות בסוף התנועה','חוזרים לאט ומאפשרים לשכמות להיפתח'],
 bad:[[{t:'נשענים אחורה ומנדנדים',fix:'מורידים משקל. הגוף כמעט נייח, רק הזרועות והשכמות זזות.'},{t:'הגב מתעגל קדימה',fix:'מזקפים חזה ומושכים את השכמות אחורה לפני שמכופפים מרפקים.'}],
      [{t:'הכתפיים מתרוממות לאוזניים',fix:'מורידים כתפיים ומושכים את המרפקים לכיוון האגן.'},{t:'הגוף מסתובב לצד',fix:'מושכים את שתי הידיים באותה מידה והחזה פונה ישר.'}]],
 variants:[{n:'במכונה (כרית חזה)',V:{m:1}},{n:'בכבל',V:{m:0}}],
 views:[sideF,backF]});
})();
/* ---------- helpers shared by the lower patterns ---------- */
const bkOrange='#E8A33D';
const bkLow=(H,S,dy)=>{const m=lerp(H,S,.3),a=Math.atan2(S[1]-H[1],S[0]-H[0])/R;return ell(add(m,[0,dy==null?-9:dy]),12,4.5,a,hot())};
/* ---------- 3. bent-over row ---------- */
(function(){
function sideF(e,bd,V){
 V=V||{};const eq=V.eq||'bar',cs=!!V.cs;
 const A=[150,253],H=[122,158],K=ik(H,A,D.thigh,D.shin,[1,0]);
 let ang=45;if(bd===1)ang=45-e*27;
 const S=add(H,rot([0,-56],ang)),S0=add(H,rot([0,-56],45)),u=nrm(sub(S,H)),F=[-u[1],u[0]];
 const W0=add(S0,[3,60]);let W1=add(lerp(S,H,.5),mul(F,19));
 const k=bd===2?.45:1;const W=lerp(W0,W1,e*k);
 const el=ik(S,W,D.uarm,D.farm,[-1,-.5*e-.05]);
 const hu=rot(u,-18-(bd===0?18*e:0));
 let s=floorSvg();
 if(cs){const Pb=add(H,add(mul(F,19),mul(u,-4))),Pt=add(S,add(mul(F,19),mul(u,34)));
  s+=pad(Pb,Pt,14)+pad(lerp(Pb,Pt,.78),[lerp(Pb,Pt,.78)[0]+20,G],8)+pad(Pb,[Pb[0]+14,G],8)}
 const eqd=(p,far)=>eq==='bar'?(far?'':plateSide(p,15)):eq==='db'?dbSide(p,10):dbFront(p,0);
 if(eq!=='bar')s+=eqd(add(W,[-6,-3]),1);
 s+=side({H,S,hu,bend:bd===0?-9*e:0,hot:{lats:true,traps:true,glutes:false},near:{el,wr:W,kn:K,an:A},far:{el:add(el,[-2,0]),wr:add(W,[-2,0]),kn:[K[0]-2,K[1]],an:[A[0]-4,A[1]]}});
 s+=eqd(W);
 return s+(bd===0?mark(lerp(H,S,.55),22)+cross('הגב מתעגל'):bd===1?mark(S,20)+cross('מנפנפים את הגוף למעלה'):bd===2?mark(el,17)+cross('המרפקים לא עוברים את הגוף'):tick('גב ישר, מרפקים אחורה'))}
function backF(e,bd,V){
 V=V||{};const eq=V.eq||'bar',cs=!!V.cs,cx=190,P=[cx,158],sh=bd===0?8*e:0,tw=bd===1?8*e:0;
 const N=[cx,118-sh],hd=[cx,104];
 const SL=[cx-24,N[1]+tw],SR=[cx+24,N[1]-tw];
 const gw=eq==='bar'?36:eq==='db'?27:24;
 const WL=[cx-gw,SL[1]+60-26*e+(tw?4*e:0)],WR=[cx+gw,SR[1]+60-26*e-(tw?4*e:0)];
 const eL=ik(SL,WL,D.uarm,D.farm,[-1,-.4*e]),eR=ik(SR,WR,D.uarm,D.farm,[1,-.4*e]);
 let s=floorSvg();
 if(cs)s+=pad([cx,92],[cx,P[1]+2],60);
 if(eq==='bar')s+=barFront(WL,WR,30);
 s+=bkBF({N,P,hd,SL,SR,back:true,hot:{lats:true,traps:true},L:{el:eL,wr:WL,kn:[cx-15,208],an:[cx-17,G-9]},Rr:{el:eR,wr:WR,kn:[cx+15,208],an:[cx+17,G-9]}});
 if(eq==='db')s+=dbFront(WL,0)+dbFront(WR,0);if(eq==='neu')s+=dbSide(WL,9)+dbSide(WR,9);
 return s+(bd===0?mark(SL,15)+mark(SR,15)+cross('הכתפיים מתרוממות לאוזניים'):bd===1?mark(SL,15)+cross('הגוף מסתובב'):tick('מרפקים החוצה והשכמות ביחד'))}
PAT.push({id:'bent_row',n:'חתירה בהטיית גוף',m:'הגב (לאטים ואמצע הגב)',v:['מהצד','מאחור'],ph:['מושכים לבטן','לוחצים שכמות','יורדים לאט','זרועות ישרות'],
 good:['מטים את הגוף בערך 45 מעלות, הגב ישר','הברכיים כפופות מעט והמבט למטה','מושכים את המרפקים אחורה, מעבר לגוף','יורדים לאט ולא מנפנפים עם הגוף'],
 bad:[[{t:'הגב מתעגל',fix:'מזקפים חזה, מהדקים את הבטן ומורידים משקל.'},{t:'מנפנפים את הגוף למעלה',fix:'הגוף נשאר באותה זווית וכל העבודה במרפקים.'},{t:'המרפקים לא עוברים את הגוף',fix:'מושכים עד שהמרפקים עוברים את קו הגב ואז עוצרים.'}],
      [{t:'הכתפיים מתרוממות לאוזניים',fix:'מורידים את הכתפיים ומושכים את השכמות אחורה ולמטה.'},{t:'הגוף מסתובב',fix:'האגן והכתפיים נשארים ישרים, מושכים שתי ידיים יחד.'}]],
 variants:[{n:'במוט',V:{eq:'bar'}},{n:'בשתי משקולות',V:{eq:'db'}},{n:'אחיזה ניטרלית',V:{eq:'neu'}},{n:'עם תמיכת חזה',V:{eq:'db',cs:1}}],
 views:[sideF,backF]});
})();
/* ---------- 4. one-arm dumbbell row ---------- */
(function(){
function sideF(e,bd,V){
 const H=[150,156],K=[175.5,199],Ap=[164,253],Kp=ik(H,Ap,D.thigh,D.shin,[1,0]);
 const lean=75-(bd===0?e*28:0);
 const S=add(H,rot([0,-56],lean)),S0=add(H,rot([0,-56],75));
 const Ws=reach(S0,[S0[0]+20,201],D.uarm,D.farm),Es=ik(S0,Ws,D.uarm,D.farm,[-.3,-1]);
 const W0=add(S0,[-2,60]),W1=add(lerp(H,S0,.55),[2,15]);
 const W=lerp(W0,W1,e),el=ik(S,W,D.uarm,D.farm,[-.5,-1]);
 let s=floorSvg()+benchSide(105,245,210);
 const hu=rot(nrm(sub(S,H)),-8);
 s+=side({H,S,hu,bend:bd===1?-9*e:0,hot:{lats:true,traps:true},near:{el,wr:W,kn:Kp,an:Ap},far:{el:add(Es,[-1.5,1]),wr:add(Ws,[-1.5,1]),kn:K,an:[K[0]-47,K[1]-1],toe:-18}});
 s+=dbFront(W,0);
 return s+(bd===0?mark(S,22)+cross('הגוף מסתובב ומתרומם'):bd===1?mark(lerp(H,S,.55),21)+cross('הגב מתעגל'):tick('גב ישר, מרפק עובר את הגוף'))}
function backF(e,bd,V){
 const cx=190,P=[cx,156],N=[cx,142],hd=[cx,128];
 const up=bd===0?10*e:0;
 const SL=[cx-24,N[1]-up],SR=[cx+24,N[1]];
 const WsR=[cx+22,201],eR=ik(SR,WsR,D.uarm,D.farm,[1,0]);
 const WL=[cx-26-(bd===1?24*e:0),SL[1]+60-(60-26)*e+(bd===0?-4*e:0)];
 const eL=ik(SL,WL,D.uarm,D.farm,[-1,-.3-(bd===1?.7:0)]);
 let s=floorSvg()+pad([cx+4,210],[cx+40,210],11)+pad([cx+8,210],[cx+8,G],7)+pad([cx+36,210],[cx+36,G],7);
 s+=bkBF({N,P,hd,SL,SR,back:true,hot:{lats:true,traps:true},L:{el:eL,wr:WL,kn:[cx-24,205],an:[cx-26,G-9]},Rr:{el:eR,wr:WsR,kn:[cx+16,199],an:[cx+16,201]}});
 s+=dbSide(WL,9);
 return s+(bd===0?mark(SL,16)+cross('הכתף מתרוממת והגוף מסתובב'):bd===1?mark(eL,17)+cross('המרפק יוצא רחוק מהגוף'):tick('המרפק קרוב לגוף'))}
PAT.push({id:'one_arm_row',n:'חתירה עם משקולת ביד אחת',m:'הגב (לאטים)',v:['מהצד','מאחור'],ph:['מושכים לצלעות','לוחצים שכמה','יורדים לאט','זרוע ישרה'],
 good:['ברך ויד אחת על הספסל, הגב ישר ומקביל לרצפה','מושכים את המרפק אל האגן, קרוב לגוף','הכתפיים נשארות ישרות, בלי סיבוב','יורדים לאט עד זרוע ישרה'],
 bad:[[{t:'הגוף מסתובב ומתרומם',fix:'הגוף נשאר שטוח ונייח. מורידים משקל אם צריך להסתובב.'},{t:'הגב מתעגל',fix:'מזקפים חזה והמבט נשאר על הספסל.'}],
      [{t:'הכתף מתרוממת והגוף מסתובב',fix:'הכתפיים מקבילות לרצפה, מושכים בעזרת הגב.'},{t:'המרפק יוצא רחוק מהגוף',fix:'מושכים את המרפק לאורך הצלעות, לכיוון האגן.'}]],
 views:[sideF,backF]});
})();
/* ---------- 5. cable pullover ---------- */
(function(){
const PL=[252,30];
const fr=()=>pad([268,G],[268,24],8)+pad([268,26],PL,6)+pulley(PL);
function sideF(e,bd,V){
 const H=[140,158],A=[148,253],K=ik(H,A,D.thigh,D.shin,[1,0]);
 const lean=18+(bd===1?e*32:0);
 const S=add(H,rot([0,-56],lean));
 const ang=(-50+132*e)*R;let L=59;if(bd===0)L=59-17*e;
 const W=add(S,[Math.cos(ang)*L,Math.sin(ang)*L]);
 const el=ik(S,W,D.uarm,D.farm,bd===0?[-1,.1]:[-.3,-1]);
 const u=nrm(sub(S,H));
 let s=floorSvg()+fr()+cable(PL,W);
 s+=side({H,S,hu:u,hot:{lats:true,triceps:true},near:{el,wr:W,kn:K,an:A},far:{el:add(el,[-2,0]),wr:add(W,[-2,0]),kn:[K[0]-2,K[1]],an:[A[0]-4,A[1]]}});
 s+=circ(W,4.6,'#7B8794');
 return s+(bd===0?mark(el,18)+cross('מכופפים את המרפקים'):bd===1?mark(S,22)+cross('מנדנדים את הגוף'):tick('זרועות ישרות, מושכים בגב'))}
function frontF(e,bd,V){
 const cx=190,P=[cx,158],sh=bd===1?8*e:0,N=[cx,105-sh],hd=[cx,86];
 const SL=[cx-24,N[1]],SR=[cx+24,N[1]];
 const mk=(S,sx)=>{let W0=[S[0]+sx*6,S[1]-46],W1=reach(S,[cx+sx*16,168],D.uarm,D.farm);if(bd===0)W1=[cx+sx*12,N[1]+34];
  const W=lerp(W0,W1,e);return{W,E:ik(S,W,D.uarm,D.farm,[sx,bd===0?.5:.1])}};
 const a=mk(SL,-1),b=mk(SR,1);
 let s=floorSvg()+pulley([cx,30])+cable([cx,30],lerp(a.W,b.W,.5));
 s+=bkBF({N,P,hd,SL,SR,hot:{lats:true,triceps:true},L:{el:a.E,wr:a.W,kn:[cx-15,205],an:[cx-17,G-9]},Rr:{el:b.E,wr:b.W,kn:[cx+15,205],an:[cx+17,G-9]}});
 s+=`<line x1="${f(a.W[0])}" y1="${f(a.W[1])}" x2="${f(b.W[0])}" y2="${f(b.W[1])}" stroke="#7B8794" stroke-width="3"/>`;
 return s+(bd===0?mark(a.E,15)+mark(b.E,15)+cross('המרפקים מתכופפים'):bd===1?mark(SL,15)+mark(SR,15)+cross('הכתפיים מתרוממות'):tick('זרועות ישרות, כתפיים למטה'))}
PAT.push({id:'cable_pullover',n:'פולאובר בכבל',m:'הגב הרחב (לאטים)',v:['מהצד','מלפנים'],ph:['מושכים מטה','לוחצים בגב','חוזרים לאט','זרועות למעלה'],
 good:['עומדים בהטיה קלה מהירכיים, ברכיים רכות','הזרועות כמעט ישרות לכל אורך התנועה','מושכים בכוח הגב עד הירכיים','חוזרים לאט עד שהגב נמתח'],
 bad:[[{t:'מכופפים את המרפקים',fix:'שומרים על זרועות כמעט ישרות, התנועה יוצאת מהכתף והגב.'},{t:'מנדנדים את הגוף',fix:'הגוף נשאר בזווית קבועה. מורידים משקל.'}],
      [{t:'המרפקים מתכופפים',fix:'מחזיקים זרועות ישרות ומושכים בעזרת הגב.'},{t:'הכתפיים מתרוממות',fix:'מורידים את הכתפיים ורחוק מהאוזניים.'}]],
 views:[sideF,frontF]});
})();
/* ---------- 6. pull-up ---------- */
(function(){
const BY=26;
const GR={pro:{gw:54,n:'pro'},neu:{gw:24,n:'neu'},sup:{gw:26,n:'sup'},supn:{gw:12,n:'sup'}};
function sideF(e,bd,V){
 V=V||{};const g=V.g||'pro',band=!!V.band,W=[150,BY];
 const S0=[144,86],S1=[137,BY+6];
 let k=1;if(bd===1)k=.5;if(bd===2)k=.72;
 const S=lerp(S0,S1,e*k);
 let lean=-3-9*e;if(bd===0)lean=-3-24*e;
 const H=add(S,rot([0,56],lean)),u=nrm(sub(S,H));
 const hu=bd===2?rot(u,36*e):u;
 const pdy=bd===0?-34:0;
 const A=add(H,[-18+(bd===0?-22*e:0),88+(bd===0?-8*e:0)]),K=ik(H,A,D.thigh,D.shin,[1,0]);
 const A2=add(A,[-6,2]),K2=ik(H,A2,D.thigh,D.shin,[1,0]);
 const el=ik(S,W,D.uarm,D.farm,[.15,1]);
 let s=floorSvg()+pad([W[0],BY],[238,BY],6)+pad([238,BY],[238,G],8);
 if(band){const b=add(A,[7,9]);s+=`<polyline points="${pts([[W[0]+4,BY+3],[b[0]+9,b[1]],[b[0]-9,b[1]],[W[0]-2,BY+3]])}" fill="none" stroke="${bkOrange}" stroke-width="5" stroke-linejoin="round"/>`}
 s+=side({H,S,hu,hot:{lats:true,biceps:g==='sup'||g==='supn',forearm:true},near:{el,wr:W,kn:K,an:A,toe:-14},far:{el:add(el,[-2,0]),wr:add(W,[-2,0]),kn:K2,an:A2,toe:-14}});
 if(g==='neu')s+=`<rect x="${W[0]-15}" y="${BY-2.5}" width="30" height="5" rx="2.5" fill="${BAR}"/>`;
 else s+=circ(W,5,BAR)+circ(W,2,'#7B8794');
 return s+(bd===0?mark(H,22)+cross('מתנדנדים עם הגוף'):bd===1?mark(S,20)+cross('הסנטר לא מגיע למוט'):bd===2?mark(add(S,mul(u,22)),19)+cross('מושכים את הצוואר קדימה'):tick('חזה למוט, מרפקים למטה'))}
function backF(e,bd,V){
 V=V||{};const g=V.g||'pro',band=!!V.band,cx=190,gw=GR[g].gw;
 const dx=gw-24,Lm=60,Nb=BY+Math.sqrt(Lm*Lm-dx*dx),Nt=BY+14;
 let N0=Nb+(Nt-Nb)*e;const tl=bd===0?7*e:0;
 const N=[cx,N0],P=[cx,N0+55],hd=[cx,N0-22.5-(e>0?3*e:0)];
 const SL=[cx-24,N0+tl],SR=[cx+24,N0-tl];
 const WL=[cx-gw,BY],WR=[cx+gw,BY];
 const pl=[-1,.7],pr=[1,.7];
 const eL=ik(SL,WL,D.uarm,D.farm,pl),eR=ik(SR,WR,D.uarm,D.farm,pr);
 const sw=bd===1?16*e:0;
 const an1=[P[0]-8+sw,P[1]+90],an2=[P[0]+8+sw,P[1]+90];
 let s=floorSvg()+pad([cx-92,BY-2],[cx+92,BY-2],6)+pad([cx-88,BY],[cx-88,G],8)+pad([cx+88,BY],[cx+88,G],8)+`<line x1="${cx-gw}" y1="${BY}" x2="${cx+gw}" y2="${BY}" stroke="${BAR}" stroke-width="5" stroke-linecap="round"/>`;
 if(g==='neu')s+=circ([cx-gw,BY],5.5,'#7B8794')+circ([cx+gw,BY],5.5,'#7B8794');
 if(band)s+=`<polyline points="${pts([[cx+30,BY+2],[an2[0]+7,an2[1]+8],[an2[0]-7,an2[1]+8],[cx+24,BY+2]])}" fill="none" stroke="${bkOrange}" stroke-width="5" stroke-linejoin="round"/>`;
 s+=bkBF({N,P,hd,SL,SR,back:true,hot:{lats:true,traps:true},L:{el:eL,wr:WL,kn:[P[0]-10+sw*.5,P[1]+48],an:an1},Rr:{el:eR,wr:WR,kn:[P[0]+10+sw*.5,P[1]+48],an:an2}});
 s+=circ(WL,4.4,SK)+circ(WR,4.4,SK);
 return s+(bd===0?mark(SL,15)+cross('עולים בצד אחד'):bd===1?mark(an2,20)+cross('הרגליים מתנדנדות'):tick('מושכים את המרפקים למטה'))}
PAT.push({id:'pullup',n:'מתח',m:'הגב הרחב (לאטים) והזרועות',v:['מהצד','מאחור'],ph:['מושכים למעלה','סנטר מעל המוט','יורדים לאט','תלייה ישרה'],
 good:['מתחילים מתלייה עם כתפיים פעילות','מושכים את המרפקים למטה, החזה למוט','הסנטר עובר את המוט, בלי למתוח צוואר','יורדים לאט עד זרועות ישרות'],
 bad:[[{t:'מתנדנדים עם הגוף',fix:'מהדקים בטן ורגליים, הגוף נשאר ישר ונייח.'},{t:'הסנטר לא מגיע למוט',fix:'עולים עד שהסנטר מעל המוט, אחרת משתמשים בהקלה (גומייה).'},{t:'מושכים את הצוואר קדימה',fix:'הראש נשאר ישר והחזה הוא שעולה אל המוט.'}],
      [{t:'עולים בצד אחד',fix:'מושכים בשתי הידיים בצורה שווה והכתפיים ישרות.'},{t:'הרגליים מתנדנדות',fix:'מצמידים את הרגליים ומהדקים את הבטן.'}]],
 variants:[{n:'מתח',V:{g:'pro'}},{n:'אחיזה ניטרלית',V:{g:'neu'}},{n:'אחיזה הפוכה',V:{g:'sup'}},{n:'הפוכה צרה',V:{g:'supn'}},{n:'עם תמיכת רגליים',V:{g:'sup',band:1}}],
 views:[sideF,backF]});
})();
/* ---------- 7. bird dog ---------- */
(function(){
function sideF(e,bd,V){
 const H=[124,204],K=[124,254],A=[76,255.5];
 const bend=bd===0?10*e:(bd===1?7*e:0);
 const S=[H[0]+55,H[1]-10],u=nrm(sub(S,H));
 const hu=rot(u,5);
 const ang=(90-96*e)*R,Wn=add(S,[Math.cos(ang)*61.5,Math.sin(ang)*61.5]);
 const Wp=[S[0]+1,256.5];
 const el=ik(S,Wn,D.uarm,D.farm,[-.3,-1]),elp=ik(S,Wp,D.uarm,D.farm,[-1,0]);
 const la=(bd===1?208:184)*R,A1=add(H,[Math.cos(la)*98,Math.sin(la)*98]);
 const Af=lerp([77,255.5],A1,e),Kf=ik(H,Af,D.thigh,D.shin,[0,1]);
 const Kf2=e<.02?[H[0]-1,254]:Kf;
 let s=floorSvg();
 s+=side({H,S,hu,bend,hot:{glutes:true,delts:true},near:{el,wr:Wn,kn:K,an:A,toe:-20},far:{el:add(elp,[0,0]),wr:Wp,kn:Kf2,an:Af,toe:-16}});
 s+=bkLow(H,S);
 return s+(bd===0?mark(lerp(H,S,.4),22)+cross('הגב שוקע'):bd===1?mark(add(H,[-70,-30]),19)+cross('הרגל גבוהה והגב מתקמר'):tick('גב ישר, ידיים ורגל בקו אחד'))}
function topF(e,bd,V){
 const cx=190,N=[cx,100],P=[cx,156],hd=[cx,78];
 const pitch=Math.sin(e*Math.PI/2),a=bd===1?22*e:0,l=bd===0?-9*e:0;
 const SL=[cx-24,100],SR=[cx+24,100];
 const HL=[cx-14,156-(bd===0?7*e:0)],HR=[cx+14,156+(bd===0?7*e:0)];
 const eL=[SL[0],SL[1]-4],wL=[SL[0],SL[1]-9];
 const eR=[SR[0]+a*.4,SR[1]-4-27*pitch],wR=[SR[0]+a,SR[1]-9-53*pitch];
 const kL=[HL[0]+l*.4,HL[1]+3+47*pitch],aL=[HL[0]+l,kL[1]+48];
 const kR=[HR[0],HR[1]+3],aR=[HR[0],kR[1]+48];
 let s=bgTop+bkBF({N,P,hd,SL,SR,HL,HR,back:true,hot:{glutes:true,lowback:true,traps:true,delts:true},L:{el:eL,wr:wL,kn:kL,an:aL},Rr:{el:eR,wr:wR,kn:kR,an:aR},toes:[0,0]});
 return s+(bd===0?mark(aL,18)+mark(P,16)+cross('האגן מסתובב והרגל נפתחת'):bd===1?mark(wR,16)+cross('היד נפתחת הצידה'):tick('האגן ישר, הגב שטוח'))}
PAT.push({id:'bird_dog',n:'בירד דוג',m:'שרירי הליבה, הגב התחתון והישבן',v:['מהצד','מלמעלה'],ph:['מושיטים יד ורגל','מחזיקים','חוזרים לאט','על ארבע'],
 good:['ידיים מתחת לכתפיים וברכיים מתחת לאגן','מושיטים יד אחת ורגל נגדית לאט','הגב שטוח והאגן ישר כמו שולחן','מחזיקים רגע וחוזרים בשליטה'],
 bad:[[{t:'הגב שוקע',fix:'מהדקים בטן ומעלים את הגב. מקטינים את הטווח אם צריך.'},{t:'הרגל גבוהה והגב מתקמר',fix:'הרגל עולה רק עד קו הגב. לא מקמרים את הגב התחתון.'}],
      [{t:'האגן מסתובב והרגל נפתחת',fix:'מכווצים בטן, האגן נשאר ישר והרגל נמתחת ישר אחורה.'},{t:'היד נפתחת הצידה',fix:'היד נמתחת ישר קדימה, בקו עם הכתף והראש.'}]],
 views:[sideF,topF]});
})();
/* ---------- 8. superman ---------- */
const bkShadow=(s)=>`<g opacity=".3">${s}</g>`;
(function(){
function sideF(e,bd,V){
 const H=[100,250];
 let ld=9*e,aa=5-27*e,th=177+15*e,neck=-(6+4*e);
 if(bd===0)neck=-38*e-6;
 if(bd===1){ld=24*e;aa=5-46*e;}
 const S=add(H,[Math.cos(-ld*R)*56,Math.sin(-ld*R)*56]);
 const hu=[Math.cos(neck*R),Math.sin(neck*R)];
 const mk=(a,o)=>{const W=add(S,[Math.cos(a*R)*61.5,Math.sin(a*R)*61.5]);return{W,E:ik(S,W,D.uarm,D.farm,[0,-1])}};
 const ar=mk(aa);
 const lg=(t,o)=>{let K=add(H,[Math.cos(t*R)*50,Math.sin(t*R)*50]),A;
  if(bd===2){K=add(H,[Math.cos((t+4)*R)*50,Math.sin((t+4)*R)*50]);A=add(K,[Math.cos((180+60*e+(t-177))*R)*48,Math.sin((180+60*e+(t-177))*R)*48])}
  else A=add(H,[Math.cos(t*R)*98,Math.sin(t*R)*98]);return{K,A}};
 const l1=lg(th),l2=lg(th-2);
 let s=floorSvg();
 s+=side({H,S,hu,hot:{glutes:true,hams:true,traps:true,delts:true},near:{el:ar.E,wr:ar.W,kn:l1.K,an:l1.A,toe:-18},far:{el:ar.E,wr:ar.W,kn:l2.K,an:l2.A,toe:-18}});
 s+=bkLow(H,S);
 return s+(bd===0?mark(add(S,mul(hu,24)),19)+cross('הראש נזרק אחורה'):bd===1?mark(lerp(H,S,.2),20)+cross('מקמרים את הגב יותר מדי'):bd===2?mark(l1.K,18)+cross('הברכיים מתכופפות'):tick('מרימים גבוה מעט, צוואר ניטרלי'))}
function topF(e,bd,V){
 const cx=190,N=[cx,92],P=[cx,148],hd=[cx,70];
 const h=15*e,sp=bd===0?9*e:0,tl=bd===1?7*e:0;
 const SL=[cx-24,92+tl],SR=[cx+24,92-tl],HL=[cx-14,148],HR=[cx+14,148];
 const arm=(S,sx,hh)=>({E:[S[0]+sx*2,S[1]-31],W:[S[0]+sx*(2+(bd===1&&sx>0?8*e:0)),S[1]-61],h:hh});
 const aL=arm(SL,-1,h),aR=arm(SR,1,bd===1?h*.4:h);
 const leg=(sx,hh)=>({kn:[cx+sx*(14+sp*.4),148+50],an:[cx+sx*(13+sp*2.4),148+98],h:hh});
 const lL=leg(-1,h),lR=leg(1,bd===1?h*.4:h);
 const sh=(a,b,hh)=>limb(add(a,[hh*.5,hh*.5]),add(b,[hh*.5,hh*.5]),6,4,'#000');
 let s=bgTop+bkShadow(sh(SL,aL.E,h)+sh(aL.E,aL.W,h)+sh(SR,aR.E,aR.h)+sh(aR.E,aR.W,aR.h)+sh(HL,lL.kn,h)+sh(lL.kn,lL.an,h)+sh(HR,lR.kn,lR.h)+sh(lR.kn,lR.an,lR.h));
 s+=bkBF({N,P,hd,SL,SR,HL,HR,back:true,hot:{glutes:true,lowback:true,traps:true},L:{el:aL.E,wr:aL.W,kn:lL.kn,an:lL.an},Rr:{el:aR.E,wr:aR.W,kn:lR.kn,an:lR.an},toes:[-2,2]});
 return s+(bd===0?mark(lL.an,18)+mark(lR.an,18)+cross('הרגליים נפתחות'):bd===1?mark(aR.W,16)+cross('מרימים לא שווה'):tick('ידיים ורגליים ישרות וצמודות'))}
PAT.push({id:'superman',n:'סופרמן',m:'הגב התחתון והישבן',v:['מהצד','מלמעלה'],ph:['מרימים','מחזיקים','יורדים לאט','שוכבים'],
 good:['שוכבים על הבטן, ידיים לפנים','מרימים ידיים ורגליים מעט מהרצפה','הצוואר ניטרלי, המבט לרצפה','מחזיקים שניה ויורדים לאט'],
 bad:[[{t:'הראש נזרק אחורה',fix:'המבט נשאר על הרצפה והצוואר בקו עם הגב.'},{t:'מקמרים את הגב יותר מדי',fix:'מרימים רק כמה סנטימטרים. הגב התחתון לא נדחס.'},{t:'הברכיים מתכופפות',fix:'הרגליים נשארות ישרות ומורמות מהישבן.'}],
      [{t:'הרגליים נפתחות',fix:'מצמידים רגליים ומהדקים ישבן.'},{t:'מרימים לא שווה',fix:'מרימים את שני הצדדים באותה מידה, הגוף נשאר ישר.'}]],
 views:[sideF,topF]});
})();
/* ---------- 9. prone W / Y / T raise ---------- */
(function(){
const LET={Y:{u:[40,20],f:[40,20]},T:{u:[88,14],f:[88,14]},W:{u:[120,10],f:[35,25]}};
const dir=(az,el)=>[Math.cos(el*R)*Math.cos(az*R),Math.cos(el*R)*Math.sin(az*R),Math.sin(el*R)];
// returns {E:[f,l,h],W:[f,l,h]} (forward, lateral, up)
function arm3(k,e,az2){const L=LET[k],az0=12,x=a=>a+0;
 const u=dir(az0+(L.u[0]-az0)*e*(az2||1),L.u[1]*e),fo=dir(az0+(L.f[0]-az0)*e*(az2||1),L.f[1]*e);
 const E=mul(u,D.uarm),W=add(E,mul(fo,D.farm));return{E,W}}
function sideF(e,bd,V){
 V=V||{};const k=V.k||'Y',H=[100,250];
 let ld=8*e,neck=-(6+3*e);if(bd===0)neck=-6-36*e;if(bd===1)ld=8*e+18*e;
 const S=add(H,[Math.cos(-ld*R)*56,Math.sin(-ld*R)*56]),hu=[Math.cos(neck*R),Math.sin(neck*R)];
 const a=arm3(k,e),sd=1-e,pr=p=>[S[0]+p[0],S[1]-p[2]+5*sd*(len(p)/60)];
 const E=pr(a.E),W=pr(a.W);
 const K=add(H,[Math.cos(177*R)*50,Math.sin(177*R)*50]),A=add(H,[Math.cos(177*R)*98,Math.sin(177*R)*98]);
 const K2=add(H,[Math.cos(175.5*R)*50,Math.sin(175.5*R)*50]),A2=add(H,[Math.cos(175.5*R)*98,Math.sin(175.5*R)*98]);
 let s=floorSvg();
 s+=side({H,S,hu,hot:{traps:true,delts:true},near:{el:E,wr:W,kn:K,an:A,toe:-18},far:{el:E,wr:W,kn:K2,an:A2,toe:-18}});
 s+=bkLow(H,S);
 return s+(bd===0?mark(add(S,mul(hu,24)),19)+cross('הראש נזרק אחורה'):bd===1?mark(lerp(H,S,.25),20)+cross('מקמרים את הגב התחתון'):tick('שכמות יחד, צוואר ניטרלי'))}
function topF(e,bd,V){
 V=V||{};const k=V.k||'Y',cx=190,sh=bd===0?8*e:0;
 const N=[cx,110-sh],P=[cx,166],hd=[cx,88];
 const SL=[cx-24,N[1]],SR=[cx+24,N[1]],HL=[cx-12,166],HR=[cx+12,166];
 const aL=arm3(k,e),aR=arm3(k,e,bd===1?.55:1);
 const pj=(S,sx,p)=>[S[0]+sx*p[1],S[1]-p[0]];
 const L={el:pj(SL,-1,aL.E),wr:pj(SL,-1,aL.W)},Rr={el:pj(SR,1,aR.E),wr:pj(SR,1,aR.W)};
 const sw=(S,sx,a,m)=>{const o=p=>add(pj(S,sx,p),[p[2]*.5,p[2]*.5]);return limb(S,o(a.E),6,4.5,'#000')+limb(o(a.E),o(a.W),4.5,3.5,'#000')};
 let s=bgTop+bkShadow(sw(SL,-1,aL)+sw(SR,1,aR));
 s+=bkBF({N,P,hd,SL,SR,HL,HR,back:true,hot:{traps:true,delts:true,lowback:true},L:{el:L.el,wr:L.wr,kn:[cx-11,216],an:[cx-10,264]},Rr:{el:Rr.el,wr:Rr.wr,kn:[cx+11,216],an:[cx+10,264]},toes:[-2,2]});
 return s+(bd===0?mark(SL,15)+mark(SR,15)+cross('הכתפיים עולות לאוזניים'):bd===1?mark(Rr.wr,16)+cross('הידיים לא סימטריות'):tick('זרועות בצורת האות'))}
PAT.push({id:'prone_raise',n:'הרמות W Y T בשכיבה',m:'אמצע וחלק תחתון של הגב, כתפיים אחוריות',v:['מהצד','מלמעלה'],ph:['מרימים ידיים','לוחצים שכמות','יורדים לאט','שוכבים'],
 good:['שוכבים על הבטן, מצח קרוב לרצפה','מרימים ידיים לצורת האות, כפות ידיים לצדדים','מצמידים שכמות והצוואר ניטרלי','יורדים לאט, בלי לקמר את הגב'],
 bad:[[{t:'הראש נזרק אחורה',fix:'המבט נשאר על הרצפה והראש בקו עם הגב.'},{t:'מקמרים את הגב התחתון',fix:'הגוף נשאר על הרצפה, רק הידיים והשכמות עולות.'}],
      [{t:'הכתפיים עולות לאוזניים',fix:'מורידים כתפיים ומרחיקים אותן מהאוזניים.'},{t:'הידיים לא סימטריות',fix:'שתי הידיים באותה זווית, באותו גובה.'}]],
 variants:[{n:'W',V:{k:'W'}},{n:'Y',V:{k:'Y'}},{n:'T',V:{k:'T'}}],
 views:[sideF,topF]});
})();

/* ---------- SHOULDERS: ohp, lateral_raise, front_raise, reverse_fly, pike_press, shoulder_tap ---------- */
const _sh={
 /* circle intersection: point at distance ra from A and rb from B; up=true picks the higher one on screen */
 ci(A,ra,B,rb,up){const d=sub(B,A),L=len(d)||1,a=(ra*ra-rb*rb+L*L)/(2*L),h=Math.sqrt(Math.max(0,ra*ra-a*a)),u=mul(d,1/L),n=[-u[1],u[0]],P=add(A,mul(u,a)),p1=add(P,mul(n,h)),p2=sub(P,mul(n,h));return((p1[1]<p2[1])===!!up)?p1:p2},
 /* seated bench seen from the side: seat under hip H0, back pad behind torso (axis H0->S0) */
 benchSeat(H0,S0,back){const u=nrm(sub(S0,H0)),F=[-u[1],u[0]],o=mul(F,-17);
  let s=pad([H0[0]-26,H0[1]+11],[H0[0]+30,H0[1]+11],11)+pad([H0[0]+4,H0[1]+14],[H0[0]+4,G],7)+pad([H0[0]-34,H0[1]+14],[H0[0]-34,G],6);
  if(back)s+=pad(add(add(H0,o),mul(u,-6)),add(add(H0,o),mul(u,104)),9);return s},
 grip:(p)=>circ(p,4.6,'#8791A0')+circ(p,2,'#46525F')
};
/* ============ 1. OHP ============ */
(function(){
const base=m=>m==='stand'?{H:[150,155]}:{H:[122,205]};
function ohpSide(e,bd,V){const m=(V&&V.mode)||'stand',seat=m!=='stand',arch=bd===0?e:0,mach=m==='machine';
 let H,A,K,tilt,bend;
 if(!seat){H=[150+arch*6,155];A=[150,G-9];tilt=-arch*16;bend=arch*11}
 else{H=[122+arch*9,205];A=[172,253];tilt=-8-arch*10;bend=arch*10}
 K=ik(H,A,D.thigh,D.shin,seat?[0,-1]:[1,0]);
 const S=add(H,rot([0,-D.torso],tilt)),hu=nrm(sub(S,H));
 const p0=[S[0]+(mach?14:9),S[1]-(mach?14:16)],p1=bd===1?[S[0]+24,S[1]-52]:[S[0]+(mach?9:3),S[1]-58];
 const W=reach(S,lerp(p0,p1,e),D.uarm,D.farm),E=ik(S,W,18+14*e,D.farm,[.45,1]);
 const hh=nrm(sub(S,H));
 let s=floorSvg();
 if(seat){const H0=[122,205],S0=add(H0,rot([0,-D.torso],-8));
  if(mach){const pv=[S0[0]-24,S0[1]-4];
   s+=_sh.benchSeat(H0,S0,true)+pad([pv[0]-10,G],[pv[0]-10,pv[1]-30],9,'#2B3540')+`<line x1="${f(pv[0])}" y1="${f(pv[1])}" x2="${f(W[0])}" y2="${f(W[1])}" stroke="${BAR}" stroke-width="5" stroke-linecap="round"/>`+circ(pv,6,'#46525F')}
  else s+=_sh.benchSeat(H0,S0,true)}
 s+=side({H,S,hu,bend,hot:{delts:true,triceps:true},near:{el:E,wr:W,kn:K,an:A},far:{el:add(E,[-2,0]),wr:add(W,[-2,0]),kn:add(K,[-3,0]),an:add(A,[-4,0])}});
 s+=mach?_sh.grip(W)+pad(add(W,[0,-12]),add(W,[0,12]),4,'#8791A0'):dbSide(W,10);
 return s+(bd===0?mark(add(H,rot([0,-26],tilt)),17)+cross('קימור בגב התחתון'):bd===1?mark(W,17)+cross('הידיים נדחפות קדימה'):tick('בטן מכווצת, גב ישר'))}
function ohpFront(e,bd,V){const m=(V&&V.mode)||'stand',seat=m!=='stand',mach=m==='machine';
 const N=seat?[190,149]:[190,99],P=seat?[190,205]:[190,155],sh=bd===1?-e*9:0,eR=bd===0?e*.5:e;
 const mk=(sx,ee)=>{const S=[N[0]+sx*D.sw,N[1]+sh],x0=mach?28:30,x1=mach?20:16,W=[N[0]+sx*(x0+(x1-x0)*ee),S[1]-20-38*ee],E=ik(S,W,D.uarm,D.farm,[sx,.5]);return{S,E,W}};
 const a=mk(-1,e),b=mk(1,eR);
 let s=floorSvg();
 if(seat)s+=pad([N[0],N[1]-14],[N[0],P[1]+4],mach?46:38)+pad([P[0]-32,P[1]+11],[P[0]+32,P[1]+11],11)+pad([P[0],P[1]+14],[P[0],G],8);
 if(mach)for(const q of [a,b]){const sx=q===a?-1:1;s+=pad([N[0]+sx*84,G],[N[0]+sx*84,N[1]-70],8,'#2B3540')+pad([N[0]+sx*84,N[1]-70],[N[0]+sx*84,N[1]-70],8,'#2B3540')+`<line x1="${f(N[0]+sx*84)}" y1="${f(N[1]-62)}" x2="${f(q.W[0])}" y2="${f(q.W[1])}" stroke="${BAR}" stroke-width="5"/>`}
 const kn=sx=>seat?[P[0]+sx*24,P[1]+9]:[P[0]+sx*16,G-9-D.shin],an=sx=>[P[0]+sx*(D.stance+(seat?6:0)),G-9];
 s+=bodyFront({N,P,HL:[P[0]-D.hw,P[1]],HR:[P[0]+D.hw,P[1]],SL:a.S,SR:b.S,hot:{delts:true,triceps:true},L:{el:a.E,wr:a.W,kn:kn(-1),an:an(-1)},Rr:{el:b.E,wr:b.W,kn:kn(1),an:an(1)}});
 if(mach){for(const q of [a,b])s+=pad(add(q.W,[-9,0]),add(q.W,[9,0]),5,'#8791A0')}
 else s+=dbFront(a.W,0)+dbFront(b.W,0);
 return s+(bd===0?mark(b.W,18)+cross('יד אחת עולה לפני השנייה'):bd===1?mark([N[0]-D.sw,N[1]+sh],13)+mark([N[0]+D.sw,N[1]+sh],13)+cross('הכתפיים עולות לאוזניים'):tick('שתי הידיים יחד, כתפיים למטה'))}
PAT.push({id:'ohp',n:'לחיצת כתפיים',m:'כתפיים (דלתא קדמית)',v:['מהצד','מלפנים'],ph:['לוחצים למעלה','ידיים למעלה','יורדים לאט','גובה האוזניים'],
 good:['המשקולות מתחילות בגובה האוזניים','לוחצים למעלה וקצת פנימה','בטן מכווצת, בלי קימור בגב התחתון','יורדים לאט עד גובה האוזניים'],
 bad:[[{t:'קימור בגב התחתון',fix:'מכווצים בטן ובישבן, הצלעות למטה, והמשקולות נעות ישר מעל הכתפיים.'},{t:'הידיים נדחפות קדימה',fix:'לוחצים ישר למעלה כך שהמשקולות נעצרות מעל הכתפיים ולא לפניהן.'}],
      [{t:'יד אחת עולה לפני השנייה',fix:'מרימים את שתי הידיים יחד באותה מהירות, ובוחרים משקל שמאפשר זאת.'},{t:'הכתפיים עולות לאוזניים',fix:'מורידים את הכתפיים הרחק מהאוזניים וגם בראש התנועה שומרים צוואר רפוי.'}]],
 variants:[{n:'בעמידה (משקולות)',V:{mode:'stand'}},{n:'בישיבה (משקולות)',V:{mode:'seat'}},{n:'במכונה',V:{mode:'machine'}}],
 views:[ohpSide,ohpFront]});
})();
/* ============ 2. LATERAL RAISE ============ */
(function(){
const K0=.6;
function armPose(S,sx,th,thf,k){const E=add(S,[sx*D.uarm*k*Math.sin(th),D.uarm*Math.cos(th)]);return{E,W:add(E,[sx*D.farm*k*Math.sin(thf),D.farm*Math.cos(thf)])}}
function latSide(e,bd,V){const cab=V&&V.cable,lean=bd===0?(8-e*22):0,H=[150,155],S=add(H,rot([0,-D.torso],lean)),A=[150,G-9],K=ik(H,A,D.thigh,D.shin,[1,0]);
 const th=(6+((bd===1?118:90)-6)*e)*R,thf=th+(8*(1-e)-14*e)*R,a=armPose(S,1,th,thf,K0);
 const hang={E:add(S,[1,D.uarm]),W:add(S,[2.5,D.uarm+D.farm])},fa=cab?hang:{E:add(a.E,[-3,1]),W:add(a.W,[-3,1])};
 let s=floorSvg();
 const P0=[S[0]+40,G-16];
 if(cab)s+=`<rect x="${P0[0]+4}" y="${G-110}" width="16" height="110" rx="3" fill="#2B3540"/>`;
 if(cab)s+=cable(a.W,P0);
 s+=side({H,S,hot:{delts:true},near:{el:a.E,wr:a.W,kn:K,an:A},far:Object.assign({kn:add(K,[-3,0]),an:add(A,[-4,0])},cab?{}:{el:fa.E,wr:fa.W})});
 if(cab)s+=pulley(P0)+_sh.grip(a.W);
 else s+=dbSide(fa.W,9)+dbSide(a.W,10);
 return s+(bd===0?mark(add(H,rot([0,-26],lean)),17)+cross('הגוף מתנדנד'):bd===1?mark(a.W,17)+cross('מעל גובה הכתפיים'):tick('המרפקים מובילים, עד גובה כתף'))}
function latFront(e,bd,V){const cab=V&&V.cable,N=[190,99],P=[190,155],sh=bd===0?-e*9:0,
 th=(7+83*e)*R,thf=bd===1?th+(34*e)*R:th+(4*(1-e)-12*e)*R;
 const mk=(sx,work)=>{const S=[N[0]+sx*D.sw,N[1]+sh];if(!work){const E=add(S,[sx*1.5,D.uarm]);return{S,E,W:add(E,[sx*1,D.farm])}}const q=armPose(S,sx,th,thf,1);return{S,E:q.E,W:q.W}};
 const a=cab?mk(-1,false):mk(-1,true),b=mk(1,true);
 let s=floorSvg();const PL=[N[0]-66,G-16];
 if(cab)s+=`<rect x="${PL[0]-12}" y="${G-110}" width="24" height="110" rx="3" fill="#2B3540"/>`;
 s+=bodyFront({N,P,HL:[P[0]-D.hw,P[1]],HR:[P[0]+D.hw,P[1]],SL:a.S,SR:b.S,hot:{delts:true},L:{el:a.E,wr:a.W,kn:[P[0]-16,G-9-D.shin],an:[P[0]-D.stance,G-9]},Rr:{el:b.E,wr:b.W,kn:[P[0]+16,G-9-D.shin],an:[P[0]+D.stance,G-9]}});
 if(cab)s+=cable(b.W,PL)+pulley(PL)+_sh.grip(b.W);
 else s+=dbSide(a.W,9)+dbSide(b.W,9);
 return s+(bd===0?mark([N[0]-D.sw,N[1]+sh],13)+mark([N[0]+D.sw,N[1]+sh],13)+cross('הכתפיים מתרוממות'):bd===1?mark(b.W,15)+cross('כף היד מובילה'):tick('הידיים קשת עד גובה כתף'))}
PAT.push({id:'lateral_raise',n:'הרחקת כתפיים לצדדים',m:'כתפיים (דלתא אמצעית)',v:['מהצד','מלפנים'],ph:['מרימים לצדדים','בגובה כתף','יורדים לאט','ידיים לצד הגוף'],
 good:['כיפוף קל במרפקים שנשאר קבוע','המרפקים מובילים והידיים אחריהם','עולים עד גובה הכתפיים ולא יותר','בלי נדנוד, יורדים לאט'],
 bad:[[{t:'הגוף מתנדנד',fix:'מורידים משקל ושומרים גוף יציב. הכתפיים מרימות, לא התנופה.'},{t:'מעל גובה הכתפיים',fix:'עוצרים כשהזרוע בגובה הכתף, מעבר לזה הצוואר לוקח את העבודה.'}],
      [{t:'הכתפיים מתרוממות',fix:'מורידים כתפיים הרחק מהאוזניים לפני כל חזרה.'},{t:'כף היד מובילה',fix:'חושבים על הרמת המרפקים. כף היד נשארת נמוכה מהמרפק.'}]],
 variants:[{n:'במשקולות',V:{db:1}},{n:'בכבל (יד אחת)',V:{cable:1}}],
 views:[latSide,latFront]});
})();

/* ============ 3. FRONT RAISE ============ */
(function(){
function frSide(e,bd,V){const lean=bd===0?-e*16:0,H=[150+(bd===0?e*5:0),155],S=add(H,rot([0,-D.torso],lean)),A=[150,G-9],K=ik(H,A,D.thigh,D.shin,[1,0]);
 const a=(4+((bd===1?128:90)-4)*e)*R,d=[Math.sin(a),Math.cos(a)],W=add(S,mul(d,58)),E=ik(S,W,D.uarm,D.farm,[-Math.cos(a),Math.sin(a)]);
 const W2=add(W,[-3,0]),E2=add(E,[-3,0]);
 let s=floorSvg()+side({H,S,hot:{delts:true},near:{el:E,wr:W,kn:K,an:A},far:{el:E2,wr:W2,kn:add(K,[-3,0]),an:add(A,[-4,0])}});
 s+=dbSide(W2,9)+dbSide(W,10);
 return s+(bd===0?mark(add(H,rot([0,-26],lean)),17)+cross('הגוף מתנדנד אחורה'):bd===1?mark(W,17)+cross('מעל גובה הכתפיים'):tick('עד גובה כתף, בלי תנופה'))}
function frFront(e,bd,V){const N=[190,99],P=[190,155],sh=bd===1?-e*9:0,a=(4+86*e)*R,out=bd===0?e*16:0;
 const mk=sx=>{const S=[N[0]+sx*D.sw,N[1]+sh],E=[S[0]-sx*3+sx*out*.5,S[1]+D.uarm*Math.cos(a)+9*Math.sin(a)],W=[E[0]-sx*(0)+sx*out*.5,E[1]+D.farm*Math.cos(a)+8.4*Math.sin(a)];return{S,E,W}};
 const l=mk(-1),r=mk(1);
 return floorSvg()+bodyFront({N,P,HL:[P[0]-D.hw,P[1]],HR:[P[0]+D.hw,P[1]],SL:l.S,SR:r.S,hot:{delts:true},L:{el:l.E,wr:l.W,kn:[P[0]-16,G-9-D.shin],an:[P[0]-D.stance,G-9]},Rr:{el:r.E,wr:r.W,kn:[P[0]+16,G-9-D.shin],an:[P[0]+D.stance,G-9]}})+dbFront(l.W,0)+dbFront(r.W,0)
 +(bd===0?mark(l.W,17)+mark(r.W,17)+cross('הידיים נפתחות הצידה'):bd===1?mark([N[0]-D.sw,N[1]+sh],13)+mark([N[0]+D.sw,N[1]+sh],13)+cross('הכתפיים מתרוממות'):tick('הידיים ישר קדימה'))}
PAT.push({id:'front_raise',n:'הרמה קדמית במשקולות',m:'כתפיים (דלתא קדמית)',v:['מהצד','מלפנים'],ph:['מרימים קדימה','בגובה כתף','יורדים לאט','ידיים מול הירכיים'],
 good:['כיפוף קל במרפקים','מרימים ישר קדימה עד גובה הכתפיים','הגוף יציב, בלי נדנוד','יורדים לאט ובשליטה'],
 bad:[[{t:'הגוף מתנדנד אחורה',fix:'מורידים משקל, מכווצים בטן והגוף נשאר זקוף לכל אורך התנועה.'},{t:'מעל גובה הכתפיים',fix:'עוצרים בגובה הכתף. מעבר לכך הגב התחתון נכנס לעבודה.'}],
      [{t:'הידיים נפתחות הצידה',fix:'מרימים בקו ישר קדימה, ידיים בקו הכתפיים.'},{t:'הכתפיים מתרוממות',fix:'מורידים כתפיים הרחק מהאוזניים ושומרים צוואר רפוי.'}]],
 views:[frSide,frFront]});
})();
/* ============ 4. REVERSE FLY ============ */
(function(){
function rfSide(e,bd,V){const mach=V&&V.mode==='machine';let s=floorSvg();
 if(!mach){const tl=(52-(bd===0?e*24:0))*R,H=[128,161],A=[150,G-9],K=ik(H,A,D.thigh,D.shin,[1,0]),S=add(H,[Math.sin(tl)*D.torso,-Math.cos(tl)*D.torso]),u=nrm(sub(S,H)),hu=rot(u,-12);
  const th=(5+80*e)*R,thf=th-8*e*R,E=add(S,[-.25*D.uarm*Math.sin(th),D.uarm*Math.cos(th)]),W=add(E,[-.25*D.farm*Math.sin(thf),D.farm*Math.cos(thf)]);
  s+=side({H,S,hu,bend:bd===1?-e*11:0,hot:{delts:true,traps:true},near:{el:E,wr:W,kn:K,an:A},far:{el:add(E,[-3,0]),wr:add(W,[-3,0]),kn:add(K,[-3,0]),an:add(A,[-4,0])}})+dbSide(add(W,[-3,0]),9)+dbSide(W,10);
  return s+(bd===0?mark(S,17)+cross('הגוף מזדקף בתנופה'):bd===1?mark(lerp(H,S,.55),17)+cross('הגב מתעגל'):tick('גב ישר, המרפקים נפתחים'))}
 const H0=[122,205],A=[172,253],lean=bd===0?-e*14:0,H=[122,205],S=add(H,rot([0,-D.torso],4+lean)),K=ik(H,A,D.thigh,D.shin,[0,-1]),u=nrm(sub(S,H));
 const ph=(8+92*e)*R,phf=ph-14*R,E=[S[0]+D.uarm*Math.cos(ph),S[1]+3],W=[E[0]+D.farm*Math.cos(phf),S[1]+5];
 const pv=[S[0]+42,S[1]+4];
 s+=pad([H0[0]-26,H0[1]+11],[H0[0]+30,H0[1]+11],11)+pad([H0[0]+4,H0[1]+14],[H0[0]+4,G],7)+pad([S[0]+34,G],[S[0]+34,S[1]-30],9,'#2B3540')+`<line x1="${f(pv[0])}" y1="${f(pv[1])}" x2="${f(W[0])}" y2="${f(W[1])}" stroke="${BAR}" stroke-width="5" stroke-linecap="round"/>`+pad([S[0]+20,S[1]-30],[S[0]+20,S[1]+50],12);
 s+=side({H,S,hu:u,bend:bd===1?-e*10:0,hot:{delts:true,traps:true},near:{el:E,wr:W,kn:K,an:A},far:{el:add(E,[-2,0]),wr:add(W,[-2,0]),kn:add(K,[-3,0]),an:add(A,[-4,0])}})+pad(add(W,[0,-11]),add(W,[0,11]),5,'#8791A0');
 return s+(bd===0?mark(S,17)+cross('נשענים אחורה בתנופה'):bd===1?mark(lerp(H,S,.55),17)+cross('הגב מתעגל'):tick('החזה צמוד, גב זקוף'))}
function rfBack(e,bd,V){const mach=V&&V.mode==='machine',sh=bd===0?-e*9:0;let s=floorSvg();
 let N,P,hd,kn,an,arm;
 if(!mach){N=[190,126];P=[190,161];hd=[190,N[1]-20];kn=sx=>[P[0]+sx*17,208];an=sx=>[P[0]+sx*D.stance,G-9];
  const th=(8+(bd===1?107:80)*e)*R,thf=th-8*e*R;
  arm=(sx,S)=>{const E=add(S,[sx*D.uarm*Math.sin(th),D.uarm*Math.cos(th)]);return{E,W:add(E,[sx*D.farm*Math.sin(thf),D.farm*Math.cos(thf)])}}}
 else{N=[190,149];P=[190,205];hd=null;kn=sx=>[P[0]+sx*24,P[1]+9];an=sx=>[P[0]+sx*(D.stance+6),G-9];
  const ph=(10+90*e)*R,phf=ph-14*R;
  arm=(sx,S)=>{const E=[S[0]+sx*D.uarm*Math.sin(ph),S[1]+3];return{E,W:[E[0]+sx*D.farm*Math.sin(phf),S[1]+3]}}
  s+=pad([N[0],N[1]-10],[N[0],N[1]+62],66)+pad([P[0]-32,P[1]+11],[P[0]+32,P[1]+11],11)+pad([P[0],P[1]+14],[P[0],G],8)}
 const SL=[N[0]-D.sw,N[1]+sh],SR=[N[0]+D.sw,N[1]+sh],a=arm(-1,SL),b=arm(1,SR);
 s+=bodyFront({N,P,HL:[P[0]-D.hw,P[1]],HR:[P[0]+D.hw,P[1]],hd:hd||undefined,back:true,SL,SR,hot:{delts:true,traps:true},L:{el:a.E,wr:a.W,kn:kn(-1),an:an(-1)},Rr:{el:b.E,wr:b.W,kn:kn(1),an:an(1)}});
 if(mach)s+=pad(add(a.W,[0,-11]),add(a.W,[0,11]),5,'#8791A0')+pad(add(b.W,[0,-11]),add(b.W,[0,11]),5,'#8791A0');
 else s+=dbSide(a.W,9)+dbSide(b.W,9);
 return s+(bd===0?mark(SL,13)+mark(SR,13)+cross('הכתפיים מתרוממות'):bd===1?mark(a.W,16)+mark(b.W,16)+cross('הידיים גבוהות מדי'):tick('פותחים עד קו הכתפיים'))}
PAT.push({id:'reverse_fly',n:'פרפר הפוך',m:'כתף אחורית',v:['מהצד','מאחור'],ph:['פותחים לצדדים','סוחטים את השכמות','חוזרים לאט','ידיים לפנים'],
 good:['גב ישר והמרפקים מכופפים מעט','פותחים לצדדים עד קו הכתפיים','מקרבים שכמות בסוף התנועה','חוזרים לאט, בלי תנופה'],
 bad:[[{t:'הגוף מזדקף בתנופה',fix:'מורידים משקל, שומרים את זווית הגוף וממשיכים עם הכתפיים בלבד.'},{t:'הגב מתעגל',fix:'מכווצים בטן, החזה למעלה והגב נשאר ישר לכל אורך התנועה.'}],
      [{t:'הכתפיים מתרוממות',fix:'מורידים כתפיים הרחק מהאוזניים לפני שפותחים את הידיים.'},{t:'הידיים גבוהות מדי',fix:'עוצרים בגובה הכתפיים. מעבר לכך הטרפז לוקח את העבודה.'}]],
 variants:[{n:'במשקולות (רכון)',V:{mode:'db'}},{n:'במכונה (ישיבה)',V:{mode:'machine'}}],
 views:[rfSide,rfBack]});
})();
/* ============ 5. PIKE PRESS ============ */
(function(){
function pose(e,bd){const A=[60,G-9],Wx=bd===0?198:166,W=[Wx,G-3],S0=[Wx-15,W[1]-58],S1=[Wx+10,W[1]-40],S=lerp(S0,S1,e),H=_sh.ci(A,bd===1?80:96.5,S,D.torso,true);return{A,W,S,H}}
function pikeSide(e,bd,V){const{A,W,S,H}=pose(e,bd),K=ik(H,A,D.thigh,D.shin,[1,.1]),u=nrm(sub(S,H)),hu=rot(u,32),E=ik(S,W,D.uarm,D.farm,[-1,-.35]);
 const A2=[A[0]-5,A[1]],K2=ik(H,A2,D.thigh,D.shin,[1,.1]);
 const s=floorSvg()+side({H,S,hu,hot:{delts:true,triceps:true},near:{el:E,wr:W,kn:K,an:A},far:{el:add(E,[-3,0]),wr:add(W,[-3,0]),kn:K2,an:A2}});
 return s+(bd===0?mark(H,18)+cross('הירכיים נמוכות מדי'):bd===1?mark(K,15)+cross('הברכיים כפופות'):tick('אגן גבוה, הראש בין הידיים'))}
function pikeFront(e,bd,V){const{S,H}=pose(e,-1),N=[190,S[1]],P=[190,H[1]],hx=bd===0?62:bd===1?12:30,
 mk=sx=>{const Sh=[N[0]+sx*D.sw,N[1]],W=[N[0]+sx*(D.sw+hx-24+(bd===null?0:0)),G-3];return{S:Sh,W,E:ik(Sh,W,D.uarm,D.farm,[sx,.25])}};
 const a=mk(-1),b=mk(1);
 const s=floorSvg()+bodyFront({N,P,HL:[P[0]-D.hw,P[1]],HR:[P[0]+D.hw,P[1]],SL:a.S,SR:b.S,hot:{delts:true,triceps:true},L:{el:a.E,wr:a.W,kn:[P[0]-14,(P[1]+G)/2],an:[P[0]-D.stance,G-9]},Rr:{el:b.E,wr:b.W,kn:[P[0]+14,(P[1]+G)/2],an:[P[0]+D.stance,G-9]}});
 return s+(bd===0?mark(a.W,16)+mark(b.W,16)+cross('הידיים רחבות מדי'):bd===1?mark(a.W,16)+mark(b.W,16)+cross('הידיים צרות מדי'):tick('ידיים ברוחב הכתפיים'))}
PAT.push({id:'pike_press',n:'לחיצת כתפיים פייק',m:'כתפיים (דלתא קדמית)',v:['מהצד','מלפנים'],ph:['הראש יורד לרצפה','למטה','דוחפים למעלה','V הפוך'],
 good:['גוף בצורת V הפוך, אגן גבוה','הראש יורד בין הידיים','המרפקים מתכופפים אחורה ולצדדים','דוחפים חזרה עד זרועות ישרות'],
 bad:[[{t:'הירכיים נמוכות מדי',fix:'מקרבים את הרגליים לידיים ומרימים את האגן גבוה כך שהגוף יוצר V.'},{t:'הברכיים כפופות',fix:'מיישרים ברכיים ככל האפשר, ואם קשה מקרבים מעט את הרגליים.'}],
      [{t:'הידיים רחבות מדי',fix:'מניחים ידיים ברוחב הכתפיים בערך.'},{t:'הידיים צרות מדי',fix:'מרחיקים ידיים לרוחב הכתפיים כדי לתת לראש מקום לרדת.'}]],
 views:[pikeSide,pikeFront]});
})();
/* ============ 6. SHOULDER TAP ============ */
(function(){
const st={f:0,last:0};
const who=e=>{if(e<.02&&st.last>.2)st.f^=1;st.last=e;return st.f};
const Wx=196,Wy=G-3,Sy=Wy-61,Ax=Wx-Math.sqrt(153*153-(G-9-Sy)*(G-9-Sy));
function tapSide(e,bd,V){const f0=0,A=[Ax+(bd!==-1?e*7:0),G-9],S=[Wx,Sy],H=_sh.ci(A,97,S,D.torso,bd!==1),K=ik(H,A,D.thigh,D.shin,[1,0]),u=nrm(sub(S,H)),hu=rot(u,-8);
 const Wf=[Wx,Wy],Wt=add(S,[4,9]),k=ease(e),Wk=add(lerp(Wf,Wt,k),[0,-Math.sin(Math.PI*e)*14]);
 const Ek=ik(S,Wk,D.uarm,D.farm,lerp([-1,0],[1,.7],k)),Es=ik(S,Wf,D.uarm,D.farm,[-1,0]);
 const near=f0===0?{el:Ek,wr:Wk}:{el:Es,wr:Wf},far=f0===0?{el:add(Es,[-3,0]),wr:add(Wf,[-3,0])}:{el:add(Ek,[0,0]),wr:add(Wk,[0,0])};
 far.kn=add(K,[-3,0]);far.an=add(A,[-4,0]);near.kn=K;near.an=A;
 const s=floorSvg()+side({H,S,hu,hot:{delts:true,abs:true},near,far});
 return s+(bd===0?mark(H,18)+cross('הירכיים עולות'):bd===1?mark(H,18)+cross('הירכיים צונחות'):tick('אגן יציב, גוף בקו ישר'))}
function tapFront(e,bd,V){const f0=who(e),sx=f0?-1:1,N=[190,Sy],sw=bd===0?e*15*sx:0,P=[190+sw,Sy+(G-9-Sy)*97/153+0*e],tilt=bd===1?e*8:0;
 const SL=[N[0]-D.sw,N[1]+(sx===1?tilt:-tilt)],SR=[N[0]+D.sw,N[1]+(sx===1?-tilt:tilt)],Sa=sx===1?SR:SL,So=sx===1?SL:SR,k=ease(e);
 const Wf=[Sa[0]+sx*2,Wy],Wt=add(So,[-sx*(-4),8]),Wk=add(lerp(Wf,Wt,k),[0,-Math.sin(Math.PI*e)*16]);
 const Ek=ik(Sa,Wk,D.uarm,D.farm,[sx*.3,1]),Wo=[So[0]-sx*2,Wy],Eo=ik(So,Wo,D.uarm,D.farm,[-sx,0]);
 const A=sx===1?{el:Eo,wr:Wo}:{el:Ek,wr:Wk},B=sx===1?{el:Ek,wr:Wk}:{el:Eo,wr:Wo};
 const kn=q=>[P[0]+q*13,(P[1]+G)/2];
 const s=floorSvg()+bodyFront({N,P,HL:[P[0]-D.hw,P[1]],HR:[P[0]+D.hw,P[1]],hd:[N[0],N[1]-15],SL,SR,hot:{delts:true,abs:true},L:{el:A.el,wr:A.wr,kn:kn(-1),an:[P[0]-14,G-9]},Rr:{el:B.el,wr:B.wr,kn:kn(1),an:[P[0]+14,G-9]}});
 return s+(bd===0?mark(P,18)+cross('האגן מתנדנד לצדדים'):bd===1?mark(SL,14)+mark(SR,14)+cross('הכתפיים מוטות לצד'):tick('אגן וכתפיים ישרים'))}
PAT.push({id:'shoulder_tap',n:'נגיעות כתף בפלאנק',m:'כתפיים וליבה',v:['מהצד','מלפנים'],ph:['נוגעים בכתף','נגיעה','מחזירים לרצפה','פלאנק גבוה'],
 good:['פלאנק גבוה, כפות ידיים מתחת לכתפיים','נוגעים בכתף ההפוכה בכל פעם','האגן יציב ולא מתנדנד','רגליים רחבות מעט לשיפור היציבות'],
 bad:[[{t:'הירכיים עולות',fix:'מכווצים בטן ובישבן, הגוף בקו ישר מהראש עד העקבים.'},{t:'הירכיים צונחות',fix:'מכווצים בטן וישבן כדי שהאגן לא ירד לכיוון הרצפה.'}],
      [{t:'האגן מתנדנד לצדדים',fix:'מרחיקים רגליים רחב מעט ונוגעים לאט כך שהאגן נשאר במקום.'},{t:'הכתפיים מוטות לצד',fix:'הכתף התומכת נשארת מעל כף היד והגוף לא מסתובב.'}]],
 views:[tapSide,tapFront]});
})();

/* ===== pat_arms.js: curl, resist_curl, pushdown, overhead_ext, skullcrusher, kickback, wall_triceps ===== */
const ARMH=(()=>{
 const AMB='#F5C542';
 const armF=(S0,E,W,hotb)=>limb(S0,E,6.3,5,SK)+belly(S0,E,6.3,5,.1,.88,1,2.6,{hot:hotb})+belly(S0,E,6.3,5,.1,.88,-1,2.6,{hot:hotb})+limb(E,W,5,3.5,SK)+belly(E,W,5,3.5,.05,.55,1,2.2,{})+circ(S0,6.8,SK)+circ(W,4.2,SK);
 const seatSide=H=>benchSide(H[0]-26,H[0]+44,H[1]+16.5)+pad([H[0]-22,H[1]+8],[H[0]-27,H[1]-84],8);
 const seatFront=(N,P)=>`<rect x="${f(P[0]-30)}" y="${f(P[1]+9)}" width="60" height="10" rx="4" fill="${PAD}"/><rect x="${f(P[0]-4)}" y="${f(P[1]+19)}" width="8" height="${f(G-P[1]-19)}" fill="#2B3540"/>`;
 const backFront=(N)=>`<rect x="${f(N[0]-30)}" y="${f(N[1]-30)}" width="60" height="112" rx="9" fill="${PAD}"/>`;
 const legsSeatF=P=>({L:{kn:[P[0]-22,P[1]+5],an:[P[0]-D.stance-3,G-9]},Rr:{kn:[P[0]+22,P[1]+5],an:[P[0]+D.stance+3,G-9]}});
 const legsStandF=P=>({L:{kn:[P[0]-16,G-9-D.shin],an:[P[0]-D.stance,G-9]},Rr:{kn:[P[0]+16,G-9-D.shin],an:[P[0]+D.stance,G-9]}});
 const seatLegsSide={K:H=>[H[0]+50,H[1]],A:H=>[H[0]+50,G-9]};
 return {AMB,armF,seatSide,seatFront,backFront,legsSeatF,legsStandF,seatLegsSide};
})();

/* ================= 1. CURL ================= */
(function(){
const TH=e=>(4+e*142)*R;
function curlSide(e,bd,V){
 const k=(V&&V.k)||'db',seat=k==='seat',mach=k==='mach',alt=k==='alt',bar=k==='bar',cab=k==='cab',ham=k==='ham',sit=seat||mach;
 let H,K,A,lean=0,bg='';
 if(sit){H=[150,205];K=[200,205];A=[200,G-9]}else{H=[150,G-9-D.shin-D.thigh];K=[152,G-9-D.shin];A=[150,G-9]}
 if(mach)lean=14-(bd===0?e*26:0);else if(bd===0)lean=seat?e*12:-e*13;
 const S=add(H,rot([0,-D.torso],lean)),th=TH(e),a0=36;
 let E,W,E2,W2;
 if(mach){const a=a0-(bd===1?e*38:0);E=polar(S,a,D.uarm);W=polar(E,a-2-e*153,D.farm);E2=add(E,[-3,0]);W2=add(W,[-3,0])}
 else{E=bd===1?add(S,[4+e*20,30-e*8]):add(S,[4,31]);W=add(E,[Math.sin(th)*D.farm,Math.cos(th)*D.farm]);E2=add(E,[-3,0]);W2=add(W,[-3,0]);
  if(alt){const t2=TH(1-e);E2=add(S,[1,31]);W2=add(E2,[Math.sin(t2)*D.farm,Math.cos(t2)*D.farm])}}
 // backgrounds
 let s=floorSvg();
 if(sit)s+=ARMH.seatSide(H);
 if(mach){const u=[Math.cos(a0*R),Math.sin(a0*R)],off=[-6.5,6.5],p0=add(add(S,mul(u,2)),off),p1=add(add(S,mul(u,46)),off);
  s+=pad(add(p1,[4,4]),[p1[0]+4,G],9,'#2B3540')+pad(p0,p1,15,'#6B7886');
  s+=circ(add(E,[0,0]),8,'#2B3540')+limb(E,W,3,3,'#46525F')}
 if(cab){const PL=[H[0]+92,G-14];s+=`<rect x="${f(PL[0]-4)}" y="${G-80}" width="18" height="80" rx="4" fill="#2B3540"/>`+pulley(PL)}
 const hu=nrm(sub(S,H));
 const far={el:E2,wr:W2,kn:[K[0]-3,K[1]],an:[A[0]-4,A[1]]};
 s+=side({H,S,hu:[hu[0]*.9+.1,hu[1]],hot:{biceps:true,forearm:true},near:{el:E,wr:W,kn:K,an:A},far});
 const dv=[Math.sin(th),Math.cos(th)];
 if(cab)s+=cable([H[0]+92,G-14],W);
 if(mach)s+=circ(W,6.5,'#2B3540')+circ(W,3.5,BAR);
 else if(bar)s+=plateSide(add(W,mul(dv,4)),13);
 else if(cab)s+=circ(W,5,'#2B3540')+circ(W,3,BAR);
 else if(ham)s+=dbFront(W,-th/R);
 else{if(alt)s+=dbSide(add(W2,[Math.sin(TH(1-e))*5,Math.cos(TH(1-e))*5]),9);s+=dbSide(add(W,mul(dv,5)),9)}
 let cap;
 if(bd===0)cap=mark(lerp(H,S,.25),16)+cross(mach?'החזה עוזב את הכרית':seat?'הגב עוזב את המשענת':'הגוף מתנדנד אחורה');
 else if(bd===1)cap=mark(E,14)+cross(mach?'המרפק עוזב את הכרית':'המרפק זז קדימה');
 else cap=tick(mach?'המרפק צמוד לכרית':seat?'הגב צמוד למשענת':'המרפק צמוד לגוף');
 return s+cap}
function curlFront(e,bd,V){
 const k=(V&&V.k)||'db',seat=k==='seat',mach=k==='mach',alt=k==='alt',bar=k==='bar',cab=k==='cab',ham=k==='ham',sit=seat||mach;
 const N=sit?[190,149]:[190,99],P=sit?[190,205]:[190,155],th=TH(e),sh=bd===1?-e*5:0,out=bd===0?e*16:0,a0=48;
 const arm=sx=>{const S=[N[0]+sx*D.sw,N[1]+sh],t=alt&&sx>0?TH(1-e):th;
  if(mach){const E=[S[0]+sx*(4+out),S[1]+D.uarm*Math.sin(a0*R)],b=(a0-2-e*153)*R;return{S,E,W:[E[0]-sx*4,E[1]+D.farm*Math.sin(b)]}}
  const E=[S[0]+sx*(2+out),S[1]+32],W=[E[0]-sx*Math.sin(t)*5+sx*out*.3,E[1]+Math.cos(t)*D.farm*.96];return{S,E,W}};
 const a=arm(-1),b=arm(1),lg=sit?ARMH.legsSeatF(P):ARMH.legsStandF(P);
 let s=floorSvg();
 if(sit)s+=ARMH.backFront(N)+ARMH.seatFront(N,P);
 if(cab){const pl=[P[0],G+10];s+=`<rect x="${P[0]-20}" y="${G+6}" width="40" height="8" rx="3" fill="#2B3540"/>`}
 const hot={biceps:true,forearm:true};
 if(mach){
  s+=bodyFront({N,P,HL:[P[0]-D.hw,P[1]],HR:[P[0]+D.hw,P[1]],SL:a.S,SR:b.S,hot,L:lg.L,Rr:lg.Rr});
  const t0=N[1]+6+sh,t1=N[1]+58;
  s+=`<polygon points="${pts([[N[0]-40,t0],[N[0]+40,t0],[N[0]+56,t1],[N[0]-56,t1]])}" fill="${PAD}"/><line x1="${N[0]-40}" y1="${f(t0)}" x2="${N[0]+40}" y2="${f(t0)}" stroke="#5A6775" stroke-width="3"/>`;
  s+=ARMH.armF(a.S,a.E,a.W,true)+ARMH.armF(b.S,b.E,b.W,true)+circ(a.W,5.5,'#2B3540')+circ(b.W,5.5,'#2B3540');
 }else{
  s+=bodyFront({N,P,HL:[P[0]-D.hw,P[1]],HR:[P[0]+D.hw,P[1]],SL:a.S,SR:b.S,hot,L:{el:a.E,wr:a.W,...lg.L},Rr:{el:b.E,wr:b.W,...lg.Rr}});
  if(bar)s+=barFront(a.W,b.W,26)+circ(a.W,5,SK)+circ(b.W,5,SK);
  else if(cab){const m=[(a.W[0]+b.W[0])/2,(a.W[1]+b.W[1])/2];s+=cable(m,[P[0],G+9])+circ([P[0],G+9],6,'#46525F')+circ([P[0],G+9],2.5,'#9AA5B1')+pad(a.W,b.W,5,'#C5CDD6')+circ(a.W,4.6,SK)+circ(b.W,4.6,SK)}
  else if(ham)s+=dbSide(a.W,10)+dbSide(b.W,10);
  else s+=dbFront(a.W,0)+dbFront(b.W,0);
 }
 return s+(bd===0?mark(a.E,13)+mark(b.E,13)+cross('המרפקים נפתחים החוצה'):bd===1?mark([N[0]-D.sw,N[1]+sh],13)+mark([N[0]+D.sw,N[1]+sh],13)+cross('הכתפיים מתרוממות'):tick('המרפקים צמודים לצלעות'))}
PAT.push({id:'curl',n:'כפיפת מרפקים',m:'יד קדמית',v:['מהצד','מלפנים'],ph:['מקפלים למעלה','לוחצים את השריר','יורדים לאט','זרוע ישרה'],
 good:['המרפקים צמודים לגוף ולא זזים','עולים בנשיפה ויורדים לאט פי שניים','בלי נדנוד של הגוף, הגב ישר','יורדים עד סוף הטווח, בלי לנעול בכוח'],
 bad:[[{t:'הגוף מתנדנד',fix:'מורידים משקל. הגוף נשאר יציב וכל העבודה בידיים.'},{t:'המרפק זז קדימה',fix:'המרפק נשאר צמוד לצלעות, הכתף לא עוזרת.'}],
      [{t:'המרפקים נפתחים החוצה',fix:'מצמידים מרפקים לצלעות לכל אורך התנועה.'},{t:'הכתפיים מתרוממות',fix:'מורידים כתפיים רחוק מהאוזניים ומרפים את הצוואר.'}]],
 variants:[{n:'כפיפת מרפקים במשקולות',V:{k:'db'}},{n:'פטישים',V:{k:'ham'}},{n:'בישיבה במשקולות',V:{k:'seat'}},{n:'כפיפה מתחלפת',V:{k:'alt'}},{n:'במוט',V:{k:'bar'}},{n:'כפיפה בכבל',V:{k:'cab'}},{n:'במכונה',V:{k:'mach'}}],
 views:[curlSide,curlFront]});
})();

/* ================= 2. RESIST CURL ================= */
(function(){
const AMB=ARMH.AMB;
function rcSide(e,bd,V){
 const k=(V&&V.k)||'res',iso=k==='iso',ham=k==='ham';
 let H,K,A,lean=0;
 if(iso){H=[150,205];K=[200,205];A=[200,G-9]}else{H=[150,G-9-D.shin-D.thigh];K=[152,G-9-D.shin];A=[150,G-9]}
 if(bd===1)lean=-e*13;
 const S=add(H,rot([0,-D.torso],lean));
 const E=add(S,[4+(bd===0?e*(iso?10:20):0),31-(bd===0&&!iso?e*8:0)]);
 const th=iso?(58+e*17)*R:(14+e*118)*R,d=[Math.sin(th),Math.cos(th)],W=add(E,mul(d,D.farm)),n=[Math.cos(th),-Math.sin(th)];
 const Fh=ham?add(W,mul(n,7)):add(add(W,mul(d,-9)),mul(n,6.5));
 const S2=add(S,[1.5,-1]);
 let s=floorSvg();
 if(iso){s+=ARMH.seatSide(H).replace(/<line[^>]*x1="[^"]*"[^>]*>$/,'');
  const ty=S[1]+35;s+=`<rect x="${f(S[0]+24)}" y="${f(ty-9)}" width="130" height="9" rx="2" fill="#6B5B4B"/><rect x="${f(S[0]+146)}" y="${f(ty)}" width="7" height="${f(G-ty)}" fill="#5A4B3C"/>`}
 const hu=nrm(sub(S,H));
 const E2=ik(S2,Fh,D.uarm,D.farm,[-.4,1]);
 s+=side({H,S,hu:[hu[0]*.9+.1,hu[1]],hot:{biceps:true,forearm:true},near:{el:E,wr:W,kn:K,an:A},far:{el:E2,wr:Fh,kn:[K[0]-3,K[1]],an:[A[0]-4,A[1]]}});
 if(ham)s+=circ(W,5.5,SK)+limb(add(W,[0,-4]),add(W,[3,-8]),1.8,1.8,SKL);
 if(!iso)s+=circ(add(Fh,[1.5,-1]),4.6,SKD)+arrow(add(Fh,[1.5,-26]),add(Fh,[1.5,-12]),AMB);
 else s+=arrow(add(W,[0,26]),add(W,[0,12]),AMB);
 let cap;
 if(bd===0)cap=mark(E,14)+cross('המרפק זז קדימה');else if(bd===1)cap=mark(lerp(H,S,.3),16)+cross('הגוף נשען אחורה');
 else cap=tick(iso?'דוחפים בלי להזיז':'היד השנייה מתנגדת');
 return s+cap}
function rcFront(e,bd,V){
 const k=(V&&V.k)||'res',iso=k==='iso',ham=k==='ham';
 const N=iso?[190,149]:[190,99],P=iso?[190,205]:[190,155],sh=bd===1?-e*5:0,out=bd===0?e*14:0;
 const lg=iso?ARMH.legsSeatF(P):ARMH.legsStandF(P);
 const SL=[N[0]-D.sw,N[1]],SR=[N[0]+D.sw,N[1]+sh];
 let ER,WR,EL,WL;
 if(iso){ER=[SR[0]+2+out,SR[1]+30];WR=[ER[0]-6,ER[1]+3-e*1.5];EL=[SL[0]-2-out,SL[1]+30];WL=[EL[0]+6,EL[1]+3-e*1.5]}
 else{const t=(60+e*72)*R;ER=[SR[0]+2+out,SR[1]+32];WR=[ER[0]-Math.sin(t)*14,ER[1]+Math.cos(t)*28];
  const tgt=ham?[WR[0]-1,WR[1]-8]:[WR[0]+2,WR[1]-5],F=reach(SL,tgt,D.uarm,D.farm);EL=ik(SL,F,D.uarm,D.farm,[-.2,1]);WL=F}
 let s=floorSvg();
 if(iso)s+=ARMH.seatFront(N,P);
 s+=bodyFront({N,P,HL:[P[0]-D.hw,P[1]],HR:[P[0]+D.hw,P[1]],SL,SR,hot:{biceps:true,forearm:true},L:{el:EL,wr:WL,...lg.L},Rr:{el:ER,wr:WR,...lg.Rr}});
 if(iso){const ty=N[1]+27;s+=`<rect x="${N[0]-72}" y="${ty-10}" width="144" height="10" rx="2" fill="#6B5B4B"/><rect x="${N[0]-70}" y="${ty}" width="6" height="${G-ty}" fill="#5A4B3C"/><rect x="${N[0]+64}" y="${ty}" width="6" height="${G-ty}" fill="#5A4B3C"/>`+arrow([WR[0],WR[1]+22],[WR[0],WR[1]+8],AMB)+arrow([WL[0],WL[1]+22],[WL[0],WL[1]+8],AMB)}
 else s+=circ(WR,ham?5.5:4.6,SK)+circ(WL,4.8,SKD)+arrow([WL[0],WL[1]-24],[WL[0],WL[1]-10],AMB);
 return s+(bd===0?mark(ER,13)+mark(EL,13)+cross('המרפקים נפתחים החוצה'):bd===1?mark(SL,13)+mark(SR,13)+cross('הכתפיים מתרוממות'):tick(iso?'המרפקים צמודים':'המרפק צמוד לצלעות'))}
PAT.push({id:'resist_curl',n:'כפיפה בהתנגדות היד',m:'יד קדמית',v:['מהצד','מלפנים'],ph:['מקפלים נגד ההתנגדות','לוחצים את השריר','יורדים לאט','זרוע ישרה'],
 good:['היד החופשית מתנגדת ללא ציוד','המרפק צמוד לגוף ולא זז','התנועה איטית ושולטת','נושמים כל הזמן, בלי לעצור נשימה'],
 bad:[[{t:'המרפק זז קדימה',fix:'המרפק נשאר צמוד לצלעות, רק האמה זזה.'},{t:'הגוף נשען אחורה',fix:'עומדים זקוף, ומורידים את ההתנגדות של היד השנייה.'}],
      [{t:'המרפקים נפתחים החוצה',fix:'מצמידים את המרפק לצלעות לכל אורך התנועה.'},{t:'הכתפיים מתרוממות',fix:'מורידים את הכתפיים ומרפים את הצוואר.'}]],
 variants:[{n:'התנגדות היד השנייה',V:{k:'res'}},{n:'פטיש בהתנגדות היד השנייה',V:{k:'ham'}},{n:'איזומטרית',V:{k:'iso'}}],
 views:[rcSide,rcFront]});
})();

/* ================= 3. PUSHDOWN ================= */
(function(){
function pdSide(e,bd,V){
 const k=(V&&V.k)||'bar',mach=k==='mach',rope=k==='rope';
 let H,K,A,lean;
 if(mach){H=[150,205];K=[200,205];A=[200,G-9];lean=4}else{H=[150,155];K=[152,205];A=[150,253];lean=5}
 if(bd===1)lean+=e*14;
 const S=add(H,rot([0,-D.torso],lean));
 const E=bd===0?add(S,[-2+e*16,32-e*6]):add(S,[-2,32]),W=polar(E,-5+e*98,D.farm);
 let s=floorSvg();
 if(mach){s+=ARMH.seatSide(H);const P0=add(S,[104,8]);s+=`<line x1="${f(W[0])}" y1="${f(W[1])}" x2="${f(P0[0])}" y2="${f(P0[1])}" stroke="#6B7886" stroke-width="6" stroke-linecap="round"/><rect x="${f(S[0]+88)}" y="${f(S[1]-40)}" width="46" height="${f(G-S[1]+40)}" rx="5" fill="#2B3540"/>`+circ(P0,7,'#46525F')}
 const PL=[H[0]+34,40];
 if(!mach)s+=`<rect x="${PL[0]}" y="30" width="14" height="${G-30}" rx="4" fill="#2B3540"/>`+pulley(PL);
 const hu=nrm(sub(S,H));
 s+=side({H,S,hu:[hu[0]*.9+.1,hu[1]],hot:{triceps:true},near:{el:E,wr:W,kn:K,an:A},far:{el:add(E,[-2,0]),wr:add(W,[-2,0]),kn:[K[0]-3,K[1]],an:[A[0]-4,A[1]]}});
 if(mach)s+=circ(W,6.5,'#2B3540')+circ(W,3.5,BAR);
 else{s+=cable(PL,W);
  if(rope){const d=nrm(sub(PL,W)),R_=add(W,mul(d,16));s+=limb(R_,add(W,mul(d,-8)),2.2,2.2,'#7A6A55')+circ(R_,3,'#46525F')+circ(add(W,mul(d,-8)),3.6,'#46525F')}
  else s+=circ(W,4.5,'#2B3540')+circ(W,2.4,BAR)}
 return s+(bd===0?mark(E,14)+cross('המרפקים זזים קדימה'):bd===1?mark(lerp(H,S,.6),16)+cross('הגוף נשען על המשקל'):tick('המרפקים נעולים לצלעות'))}
function pdFront(e,bd,V){
 const k=(V&&V.k)||'bar',mach=k==='mach',rope=k==='rope';
 const N=mach?[190,149]:[190,99],P=mach?[190,205]:[190,155],sh=bd===1?-e*5:0,out=bd===0?e*16:0,a=(-5+e*98)*R;
 const arm=sx=>{const S=[N[0]+sx*D.sw,N[1]+sh],E=[S[0]+sx*(2+out),S[1]+32];return{S,E,W:[E[0]-sx*4,E[1]+D.farm*Math.sin(a)]}};
 const L=arm(-1),Rr=arm(1),lg=mach?ARMH.legsSeatF(P):ARMH.legsStandF(P);
 let s=floorSvg();
 if(mach)s+=ARMH.backFront(N)+ARMH.seatFront(N,P);
 else s+=`<rect x="${N[0]-22}" y="16" width="44" height="12" rx="4" fill="#2B3540"/>`;
 s+=bodyFront({N,P,HL:[P[0]-D.hw,P[1]],HR:[P[0]+D.hw,P[1]],SL:L.S,SR:Rr.S,hot:{triceps:true},L:{el:L.E,wr:L.W,...lg.L},Rr:{el:Rr.E,wr:Rr.W,...lg.Rr}});
 const m=[N[0],L.W[1]];
 if(mach)s+=circ(L.W,5.5,'#2B3540')+circ(Rr.W,5.5,'#2B3540');
 else if(rope){const R_=[N[0],m[1]-18];s+=cable([N[0],28],R_)+cable(R_,L.W)+cable(R_,Rr.W)+circ(R_,3,'#46525F')+circ([L.W[0]-3,L.W[1]+3],3.6,'#46525F')+circ([Rr.W[0]+3,Rr.W[1]+3],3.6,'#46525F')+circ(L.W,4.3,SK)+circ(Rr.W,4.3,SK)}
 else s+=cable([N[0],28],m)+pad(L.W,Rr.W,5,BAR)+circ(L.W,4.6,SK)+circ(Rr.W,4.6,SK);
 if(!mach)s+=circ([N[0],28],6,'#46525F')+circ([N[0],28],2.5,'#9AA5B1');
 return s+(bd===0?mark(L.E,13)+mark(Rr.E,13)+cross('המרפקים נפתחים החוצה'):bd===1?mark(L.S,13)+mark(Rr.S,13)+cross('הכתפיים מתרוממות'):tick('המרפקים צמודים לצלעות'))}
PAT.push({id:'pushdown',n:'פשיטת מרפקים בכבל',m:'יד אחורית',v:['מהצד','מלפנים'],ph:['דוחפים למטה','מיישרים ולוחצים','חוזרים לאט','מרפקים כפופים'],
 good:['המרפקים צמודים לצלעות ולא זזים','רק האמות זזות, הכתפיים יציבות','מיישרים עד הסוף ולוחצים רגע','חוזרים לאט עד זווית ישרה'],
 bad:[[{t:'המרפקים זזים קדימה',fix:'מצמידים את המרפקים לצלעות. רק האמות זזות.'},{t:'הגוף נשען על המשקל',fix:'מורידים משקל ועומדים זקוף. הגוף לא עוזר לדחוף.'}],
      [{t:'המרפקים נפתחים החוצה',fix:'מצמידים מרפקים לצלעות לכל אורך התנועה.'},{t:'הכתפיים מתרוממות',fix:'מורידים כתפיים רחוק מהאוזניים ומרפים את הצוואר.'}]],
 variants:[{n:'בכבל במוט',V:{k:'bar'}},{n:'בכבל בחבל',V:{k:'rope'}},{n:'במכונה',V:{k:'mach'}}],
 views:[pdSide,pdFront]});
})();

/* ================= 4. OVERHEAD EXTENSION ================= */
(function(){
function ovSide(e,bd,V){
 const k=(V&&V.k)||'seat',seat=k==='seat',cab=k==='cab';
 let H,K,A,lean=0;
 if(seat){H=[150,205];K=[200,205];A=[200,G-9]}else{H=[150,G-9-D.shin-D.thigh];K=[152,G-9-D.shin];A=[150,G-9]}
 if(cab)lean=9;
 const S=add(H,rot([0,-D.torso],lean));
 const ua=-74+(bd===0?e*28:0),E=polar(S,ua,D.uarm),W=polar(E,ua-(1-e)*126,D.farm);
 let hu=nrm(sub(S,H));if(bd===1)hu=rot(hu,e*32);
 let s=floorSvg();
 if(seat)s+=ARMH.seatSide(H);
 const PL=[H[0]-92,G-110];
 if(cab)s+=`<rect x="${PL[0]-8}" y="${G-150}" width="16" height="150" rx="4" fill="#2B3540"/>`+pulley(PL);
 s+=side({H,S,hu,hot:{triceps:true},near:{el:E,wr:W,kn:K,an:A},far:{el:add(E,[-1,0]),wr:add(W,[-1,0]),kn:[K[0]-3,K[1]],an:[A[0]-4,A[1]]}});
 s+=headSide(S,hu);
 if(cab)s+=cable(PL,W)+circ(W,4,'#46525F')+circ(add(W,[0,-5]),3.4,'#46525F');
 else s+=dbFront(W,90)+circ(W,4.4,SK);
 return s+(bd===0?mark(E,15)+cross('המרפקים נפתחים קדימה'):bd===1?mark(add(S,mul(hu,24)),16)+cross('הראש בולט קדימה'):tick('המרפקים ליד האוזניים'))}
function ovBack(e,bd,V){
 const k=(V&&V.k)||'seat',seat=k==='seat',cab=k==='cab';
 const N=seat?[190,149]:[190,99],P=seat?[190,205]:[190,155],sh=bd===1?-e*6:0,out=bd===0?e*14:0;
 const lg=seat?ARMH.legsSeatF(P):ARMH.legsStandF(P);
 const SL=[N[0]-D.sw,N[1]+sh],SR=[N[0]+D.sw,N[1]+sh];
 const arm=sx=>{const S=sx<0?SL:SR,E=[S[0]-sx*12+sx*out,S[1]-29.6],W=[E[0]-sx*(6.5+out*.5),E[1]+29*Math.cos(Math.PI*e)];return{S,E,W}};
 const L=arm(-1),Rr=arm(1);
 let s=floorSvg();
 if(seat)s+=ARMH.backFront(N)+ARMH.seatFront(N,P);
 s+=bodyFront({N,P,HL:[P[0]-D.hw,P[1]],HR:[P[0]+D.hw,P[1]],SL,SR,back:true,hot:{triceps:true},L:{...lg.L},Rr:{...lg.Rr}});
 const wy=L.W[1],c=[N[0],wy];
 if(cab){s+=cable(c,[N[0],G-52])+circ([N[0],G-52],6,'#46525F')+`<rect x="${N[0]-6}" y="${G-48}" width="12" height="48" fill="#2B3540"/>`}
 s+=ARMH.armF(SL,L.E,L.W,true)+ARMH.armF(SR,Rr.E,Rr.W,true);
 if(cab)s+=circ([N[0]-5,wy],3.6,'#46525F')+circ([N[0]+5,wy],3.6,'#46525F');
 else s+=dbFront(c,90)+circ(L.W,4.4,SK)+circ(Rr.W,4.4,SK);
 return s+(bd===0?mark(L.E,14)+mark(Rr.E,14)+cross('המרפקים נפתחים החוצה'):bd===1?mark(SL,13)+mark(SR,13)+cross('הכתפיים מתרוממות'):tick('המרפקים צרים וקרובים לראש'))}
PAT.push({id:'overhead_ext',n:'פשיטה מעל הראש',m:'יד אחורית',v:['מהצד','מאחור'],ph:['מיישרים למעלה','לוחצים בשיא','יורדים לאט','מאחורי הראש'],
 good:['המרפקים מכוונים לתקרה, קרובים לאוזניים','רק האמות זזות, הזרועות העליונות יציבות','הגב ישר והבטן מכווצת קלות','מיישרים עד הסוף בלי לנעול בכוח'],
 bad:[[{t:'המרפקים נפתחים קדימה',fix:'מחזירים את המרפקים לכיוון התקרה, קרוב לאוזניים.'},{t:'הראש בולט קדימה',fix:'הסנטר מעט פנימה והמבט קדימה. מורידים משקל אם צריך.'}],
      [{t:'המרפקים נפתחים החוצה',fix:'מקרבים את המרפקים זה לזה לכל אורך התנועה.'},{t:'הכתפיים מתרוממות',fix:'מורידים כתפיים רחוק מהאוזניים ומרפים את הצוואר.'}]],
 variants:[{n:'במשקולת בישיבה',V:{k:'seat'}},{n:'במשקולת בעמידה',V:{k:'stand'}},{n:'בכבל',V:{k:'cab'}}],
 views:[ovSide,ovBack]});
})();

/* ================= 5. SKULLCRUSHER ================= */
(function(){
function skSide(e,bd,V){
 const bar=((V&&V.k)||'db')==='bar';
 const H0=[210,bar?G-55:G-12],S=[H0[0]-56,H0[1]],H=[H0[0],H0[1]-(bd===1?e*9:0)],A=[H0[0]+58,G-9];
 const K=ik(H,A,D.thigh,D.shin,[0,-1]);
 const ua=-100-(bd===0?e*28:0),E=polar(S,ua,D.uarm),phi=ua-e*103,W=polar(E,phi,D.farm);
 let s=floorSvg();
 if(bar)s+=benchSide(S[0]-34,H0[0]+10,G-38);
 s+=side({H,S,hu:[-1,0],hot:{triceps:true},near:{el:E,wr:W,kn:K,an:A},far:{el:add(E,[-1,0]),wr:add(W,[-1,0]),kn:add(K,[-3,0]),an:add(A,[-4,0])}});
 if(bar)s+=plateSide(W,13);else s+=dbFront(W,phi/R*R-90)+circ(W,4.4,SK);
 return s+(bd===0?mark(E,15)+cross('המרפקים זזים אחורה'):bd===1?mark(lerp(S,H,.7),16)+cross(bar?'הגב מתקער מהספסל':'הגב מתקער מהרצפה'):tick('הזרועות העליונות אנכיות'))}
function skTop(e,bd,V){
 const bar=((V&&V.k)||'db')==='bar';
 const N=[190,172],P=[190,228],out=bd===0?e*13:0;
 const arm=(sx,ee)=>{const S=[N[0]+sx*D.sw,N[1]],E=[S[0]+sx*(-2+out),S[1]-6],W=[lerp([E[0]],[N[0]+sx*(17+out)],ee)[0],E[1]-2-ee*20];return{S,E,W}};
 const a=arm(-1,e),b=arm(1,bd===1?e*.55:e);
 let s=bgTop;
 if(bar)s+=`<rect x="${N[0]-22}" y="${N[1]-44}" width="44" height="${P[1]-N[1]+70}" rx="8" fill="${PAD}"/>`;
 s+=bodyFront({N,P,HL:[P[0]-D.hw,P[1]],HR:[P[0]+D.hw,P[1]],SL:a.S,SR:b.S,hot:{triceps:true},L:{kn:[P[0]-16,P[1]+30],an:[P[0]-18,P[1]+56]},Rr:{kn:[P[0]+16,P[1]+30],an:[P[0]+18,P[1]+56]}});
 s=s.replace(/$/,'');
 s+=ARMH.armF(a.S,a.E,a.W,true)+ARMH.armF(b.S,b.E,b.W,true);
 if(bar)s+=barFront(a.W,b.W,20)+circ(a.W,5,SK)+circ(b.W,5,SK);
 else s+=dbFront(a.W,90)+dbFront(b.W,90)+circ(a.W,4.4,SK)+circ(b.W,4.4,SK);
 return s+(bd===0?mark(a.E,13)+mark(b.E,13)+cross('המרפקים נפתחים החוצה'):bd===1?mark(b.W,14)+cross('צד אחד יורד פחות'):tick('המרפקים צרים ומקבילים'))}
PAT.push({id:'skullcrusher',n:'לחיצה צרפתית',m:'יד אחורית',v:['מהצד','מלמעלה'],ph:['מורידים לראש','עצירה קצרה','מיישרים','זרועות ישרות'],
 good:['הזרועות העליונות אנכיות ולא זזות','מורידים לאט אל המצח או מעט מעבר לראש','הגב והראש צמודים לספסל או לרצפה','מיישרים עד הסוף ולוחצים את השריר'],
 bad:[[{t:'המרפקים זזים אחורה',fix:'מחזירים את הזרועות העליונות לאנך. רק האמות זזות.'},{t:'הגב מתקער',fix:'כופפים ברכיים, מצמידים את הגב ומורידים משקל.'}],
      [{t:'המרפקים נפתחים החוצה',fix:'מקרבים מרפקים זה לזה, במקביל זה לזה.'},{t:'צד אחד יורד פחות',fix:'מורידים ומיישרים שתי הידיים יחד באותו קצב.'}]],
 variants:[{n:'במשקולות על הרצפה',V:{k:'db'}},{n:'במוט',V:{k:'bar'}}],
 views:[skSide,skTop]});
})();

/* ================= 6. KICKBACK ================= */
(function(){
function kbSide(e,bd,V){
 const one=((V&&V.k)||'both')==='one';
 const H=[128,G-9-80],A=[150,G-9],K=ik(H,A,D.thigh,D.shin,[1,0]);
 const th=(bd===1?70-e*28:72)*R,S=add(H,[Math.sin(th)*D.torso,-Math.cos(th)*D.torso]);
 const ang=155,E=polar(S,ang,D.uarm);const E_=bd===0?add(E,[0,e*14]):E;
 const phi=65+e*92-(bd===0?e*28:0),W=polar(E_,phi,D.farm);
 const hu=[Math.cos(-40*R),Math.sin(-40*R)];
 let s=floorSvg(),W2,E2;
 if(one){const by=G-50;s+=benchSide(S[0]+8,S[0]+92,by);W2=[S[0]+26,by-9];E2=ik(add(S,[1.5,-1]),W2,D.uarm,D.farm,[-1,.2])}
 else{E2=add(E_,[1,0]);W2=add(W,[1,0])}
 s+=side({H,S,hu,hot:{triceps:true},near:{el:E_,wr:W,kn:K,an:A},far:{el:E2,wr:W2,kn:add(K,[4,0]),an:add(A,[14,0])}});
 s+=dbFront(W,phi-90)+circ(W,4.4,SK);
 if(!one)s+=''; 
 return s+(bd===0?mark(E_,15)+cross('המרפק נופל למטה'):bd===1?mark(lerp(H,S,.6),16)+cross('הגב מתרומם'):tick('הזרוע העליונה מקבילה לגב'))}
function kbBack(e,bd,V){
 const one=((V&&V.k)||'both')==='one';
 const P=[190,173],N=[190,149],out=bd===0?e*14:0;
 const tw=bd===1?e*7:0,SL=[N[0]-D.sw,N[1]-tw],SR=[N[0]+D.sw,N[1]+tw];
 const phi=(65+e*92)*R;
 const arm=(sx,S,kick)=>{const E=[S[0]-sx*2+sx*out,S[1]+13.5];return{S,E,W:[E[0],E[1]+(kick?D.farm*Math.sin(phi):27)]}};
 const Lh=arm(-1,SL,!one),Rh=arm(1,SR,true);
 let s=floorSvg();
 if(one){s+=`<rect x="${N[0]-62}" y="${N[1]+30}" width="64" height="9" rx="3" fill="${PAD}"/><rect x="${N[0]-58}" y="${N[1]+39}" width="6" height="${G-N[1]-39}" fill="#2B3540"/><rect x="${N[0]-8}" y="${N[1]+39}" width="6" height="${G-N[1]-39}" fill="#2B3540"/>`;Lh.W=[SL[0]-3,N[1]+30];Lh.E=ik(SL,Lh.W,D.uarm,D.farm,[-.5,.2])}
 s+=bodyFront({N,P,HL:[P[0]-D.hw,P[1]],HR:[P[0]+D.hw,P[1]],SL,SR,hd:[N[0],N[1]-15],back:true,hot:{triceps:true},L:{kn:[P[0]-17,P[1]+38],an:[P[0]-D.stance-2,G-9]},Rr:{kn:[P[0]+17,P[1]+38],an:[P[0]+D.stance+2,G-9]}});
 s+=ARMH.armF(SL,Lh.E,Lh.W,true)+ARMH.armF(SR,Rh.E,Rh.W,true);
 s+=dbSide(add(Rh.W,[0,3]),9);if(!one)s+=dbSide(add(Lh.W,[0,3]),9);
 return s+(bd===0?mark(Lh.E,14)+mark(Rh.E,14)+cross('המרפקים נפתחים החוצה'):bd===1?mark(SL,13)+mark(SR,13)+cross('הגוף מסתובב'):tick('המרפקים צמודים לגוף'))}
PAT.push({id:'kickback',n:'פשיטת מרפקים בהטיית גו',m:'יד אחורית',v:['מהצד','מאחור'],ph:['מיישרים אחורה','לוחצים בשיא','חוזרים לאט','מרפק כפוף'],
 good:['הגב ישר והגוף מוטה קדימה','הזרוע העליונה מקבילה לגב ולא זזה','רק האמה נעה אחורה','מיישרים עד הסוף ולוחצים רגע'],
 bad:[[{t:'המרפק נופל למטה',fix:'מרימים את המרפק עד גובה הגב ומקפיאים אותו שם.'},{t:'הגב מתרומם',fix:'מחזיקים את הגב באותה זווית ומורידים משקל.'}],
      [{t:'המרפקים נפתחים החוצה',fix:'מצמידים את המרפקים לגוף לכל אורך התנועה.'},{t:'הגוף מסתובב',fix:'שומרים כתפיים מקבילות לרצפה ומסתכלים לרצפה.'}]],
 variants:[{n:'בשתי ידיים',V:{k:'both'}},{n:'ביד אחת עם תמיכה',V:{k:'one'}}],
 views:[kbSide,kbBack]});
})();

/* ================= 7. WALL TRICEPS ================= */
(function(){
const A0=[120,G-9],W0=(()=>{const a=15*R;const S=add(A0,[Math.sin(a)*154,-Math.cos(a)*154]);return add(S,[58,12])})();
function solve(d){let lo=15,hi=38;const dist=a=>{const r=a*R,S=add(A0,[Math.sin(r)*154,-Math.cos(r)*154]);return len(sub(W0,S))};
 for(let i=0;i<30;i++){const m=(lo+hi)/2;if(dist(m)>d)lo=m;else hi=m}return(lo+hi)/2*R}
function wallSide(e,bd,V){
 const al=solve(60-18*e),A=A0,W=W0;
 let H=add(A,[Math.sin(al)*98,-Math.cos(al)*98]);const S=add(A,[Math.sin(al)*154,-Math.cos(al)*154]);
 let Sx=S;
 if(bd===0){H=add(H,[-e*14,0]);}
 const K=ik(H,A,D.thigh,D.shin,[1,0]);
 let hu=nrm(sub(Sx,H));if(bd===0)hu=nrm(sub(Sx,H));if(bd===1)hu=rot(hu,e*34);
 const E=ik(Sx,W,D.uarm,D.farm,[-.3,1]);
 let s=floorSvg()+`<rect x="${f(W[0]+4.5)}" y="${G-240}" width="90" height="240" fill="#2A333D"/><line x1="${f(W[0]+4.5)}" y1="${G-240}" x2="${f(W[0]+4.5)}" y2="${G}" stroke="#4A5866" stroke-width="3"/>`;
 s+=side({H,S:Sx,hu,hot:{triceps:true},near:{el:E,wr:W,kn:K,an:A},far:{el:add(E,[1,0]),wr:add(W,[1,0]),kn:add(K,[3,0]),an:add(A,[6,0])}});
 return s+(bd===0?mark(H,17)+cross('האגן בולט אחורה'):bd===1?mark(add(Sx,mul(hu,22)),16)+cross('הראש נופל קדימה'):tick('הגוף קו ישר אחד'))}
function wallFront(e,bd,V){
 const N=[190,99],P=[190,155],sh=bd===1?-e*5:0,out=bd===0?e*16:0,lg=ARMH.legsStandF(P);
 const SL=[N[0]-D.sw,N[1]+sh],SR=[N[0]+D.sw,N[1]+sh];
 const arm=(sx,S)=>{const E0=[S[0]-sx*9.5,S[1]+7],E1=[S[0]+sx*(2+out),S[1]+30],E=lerp(E0,E1,e),W=[N[0]+sx*5,N[1]+14+e*8+sh];return{E,W}};
 const L=arm(-1,SL),Rr=arm(1,SR);
 let s=floorSvg();
 s+=bodyFront({N,P,HL:[P[0]-D.hw,P[1]],HR:[P[0]+D.hw,P[1]],SL,SR,hot:{triceps:true},L:{el:L.E,wr:L.W,...lg.L},Rr:{el:Rr.E,wr:Rr.W,...lg.Rr}});
 s+=`<rect x="${N[0]-100}" y="${N[1]-62}" width="200" height="132" rx="10" fill="rgba(255,255,255,.05)" stroke="#4A5866" stroke-width="3"/>`+circ(L.W,8,'#9AA5B1',.25)+circ(Rr.W,8,'#9AA5B1',.25);
 return s+(bd===0?mark(L.E,14)+mark(Rr.E,14)+cross('המרפקים נפתחים החוצה'):bd===1?mark(SL,13)+mark(SR,13)+cross('הכתפיים מתרוממות'):tick('הידיים צרות והמרפקים קרובים'))}
PAT.push({id:'wall_triceps',n:'פשיטת מרפקים לקיר',m:'יד אחורית',v:['מהצד','מלפנים'],ph:['מתקרבים לקיר','עצירה קצרה','דוחפים החוצה','זרועות ישרות'],
 good:['הגוף קו ישר אחד מהעקבים עד הראש','הידיים צרות על הקיר בגובה החזה','המרפקים צמודים ולא נפתחים','דוחפים עד זרועות ישרות'],
 bad:[[{t:'האגן בולט אחורה',fix:'מכווצים בטן ופלג גוף תחתון עד שהגוף קו ישר.'},{t:'הראש נופל קדימה',fix:'שומרים את הצוואר ישר, ומביטים לקיר.'}],
      [{t:'המרפקים נפתחים החוצה',fix:'מצמידים את המרפקים לגוף לכל אורך התנועה.'},{t:'הכתפיים מתרוממות',fix:'מורידים כתפיים רחוק מהאוזניים ומרפים את הצוואר.'}]],
 views:[wallSide,wallFront]});
})();

/* ===== pat_legs.js : squat, lunge, bulgarian, bridge, rdl, calf_raise, leg_press, leg_curl, leg_ext ===== */
/* ---- shared helpers (global LG) ---- */
const LG=(()=>{
 const dbSil=(p,ang)=>`<g transform="rotate(${f(ang||0)} ${f(p[0])} ${f(p[1])})"><rect x="${f(p[0]-12)}" y="${f(p[1]-1.8)}" width="24" height="3.6" rx="1.8" fill="${BAR}"/><rect x="${f(p[0]-15)}" y="${f(p[1]-8)}" width="7" height="16" rx="2.5" fill="#2B3540"/><rect x="${f(p[0]+8)}" y="${f(p[1]-8)}" width="7" height="16" rx="2.5" fill="#2B3540"/></g>`;
 // full leg for front/back style views, drawn on top of anything drawn before
 const legF=(HH,K,A,dx,h,hamHot)=>{h=h||{};return limb(HH,K,9.4,6.8,SK)+belly(HH,K,9.4,6.8,.1,.9,1,2.6,{hot:h.quads||h.hams})+belly(HH,K,9.4,6.8,.1,.9,-1,2.6,{hot:h.quads||h.hams})+limb(K,A,6.8,4.4,SK)+belly(K,A,6.8,4.4,.05,.6,1,3.4,{hot:h.calves})+belly(K,A,6.8,4.4,.05,.6,-1,3.4,{hot:h.calves})+limb(HH,lerp(HH,K,.38),10,8.8,PN)+limb(A,add(A,[dx,5]),4.4,3.6,WH)};
 // foot drawn from heel to toe at an angle (deg, positive = toes pointing down)
 const foot=(A,ang,far,len)=>{len=len||24;const hl=[A[0]-2,A[1]+3],t=polar(hl,ang,len);return limb(hl,t,4.3,3.6,far?WHD:WH)};
 const bf=o=>{const N=o.N,P=o.P;o.SL=o.SL||[N[0]-D.sw,N[1]];o.SR=o.SR||[N[0]+D.sw,N[1]];o.HL=o.HL||[P[0]-D.hw,P[1]];o.HR=o.HR||[P[0]+D.hw,P[1]];return bodyFront(o)};
 return {dbSil,legF,foot,bf};
})();

/* ================= SQUAT ================= */
(function(){
const A0=G-9;
function sqSide(e,bd,V){V=V||{};const m=V.m||'bw';
 const lean=e*(m==='bar'?40:m==='gob'?28:30)+(bd===0?e*14:0);
 const H=[150-26*e,155+58*e],S=add(H,rot([0,-D.torso],lean)),u=nrm(sub(S,H)),F=[-u[1],u[0]];
 const hl=bd===1?e*10:0,An=[150,A0-hl],An2=[146,A0-hl];
 const K=ik(H,An,D.thigh,D.shin,[1,0]),K2=ik(H,An2,D.thigh,D.shin,[1,0]);
 let E,W,hold='';
 if(m==='bw'){const a=lerp([82],[3],ease(Math.min(1,e*1.6)))[0];W=polar(S,a,62);E=ik(S,W,D.uarm,D.farm,[0,1])}
 else if(m==='gob'){const C=add(add(S,mul(u,-14)),mul(F,13));W=C;E=ik(S,W,D.uarm,D.farm,[0,1]);hold=LG.dbSil(add(C,[0,-1]),90)}
 else{const B=add(add(S,mul(F,-8)),mul(u,2));W=add(B,mul(F,4));E=ik(S,W,D.uarm,D.farm,[.3,1]);hold=plateSide(B,15)}
 const ft=bd===1?{toe:0}:{};
 let s=floorSvg()+side({H,S,hu:u,bend:bd===0?-13*e:0,hot:{quads:true,glutes:true},near:{el:E,wr:W,kn:K,an:An,toe:bd===1?0:undefined},far:{el:E,wr:W,kn:K2,an:An2,toe:bd===1?0:undefined}});
 if(bd===1)s+=LG.foot(An2,Math.asin(hl/24)*180/Math.PI,true,24)+LG.foot(An,Math.asin(hl/24)*180/Math.PI,false,24);
 s+=hold;
 return s+(bd===0?mark(lerp(H,S,.5),19)+cross('הגב מתעגל'):bd===1?mark([An[0],A0+4],15)+cross('העקבים מתרוממים'):tick('גב ישר, עקבים על הרצפה'))}
function sqFront(e,bd,V){V=V||{};const m=V.m||'bw';
 const lean=e*(m==='bar'?40:m==='gob'?28:30),sh=bd===1?11*e:0,P=[190+sh,155+58*e],N=[190+sh*.3,P[1]-D.torso*Math.cos(lean*R)];
 const cv=bd===0?-9*e:0;
 const kL=[P[0]-14-(2+8*e)+(-cv)*1+ (bd===1?7*e:0),205+10*e],kR=[P[0]+14+(2+8*e)+cv+(bd===1?7*e:0),205+10*e];
 const aL=[190-22,A0],aR=[190+22,A0];
 const SL=[N[0]-D.sw,N[1]],SR=[N[0]+D.sw,N[1]];
 let pre='',post='',L={},Rr={};
 if(m==='bw'){const t=ease(Math.min(1,e*1.4));for(const [sx,S0] of [[-1,SL],[1,SR]]){const W=lerp([S0[0]+sx*3,S0[1]+60],[N[0]+sx*6,N[1]+24],t),E=ik(S0,W,D.uarm,D.farm,[sx*.6,1]);(sx<0?L:Rr).el=E;(sx<0?L:Rr).wr=W}}
 else if(m==='gob'){for(const [sx,S0] of [[-1,SL],[1,SR]]){const W=[N[0]+sx*5,N[1]+27],E=ik(S0,W,D.uarm,D.farm,[sx*.7,1]);(sx<0?L:Rr).el=E;(sx<0?L:Rr).wr=W}post=dbFront([N[0],N[1]+25],90)}
 else{const yb=N[1]-2;pre=barFront([N[0]-D.sw-16,yb],[N[0]+D.sw+16,yb],22);for(const [sx,S0] of [[-1,SL],[1,SR]]){const W=[N[0]+sx*(D.sw+16),yb+1],E=ik(S0,W,D.uarm,D.farm,[sx*.2,1]);(sx<0?L:Rr).el=E;(sx<0?L:Rr).wr=W}}
 L.kn=kL;L.an=aL;Rr.kn=kR;Rr.an=aR;
 const s=floorSvg()+pre+LG.bf({N,P,SL,SR,hot:{quads:true},L,Rr,toes:[-6,6]})+post;
 return s+(bd===0?mark(kL,14)+mark(kR,14)+cross('הברכיים קורסות פנימה'):bd===1?mark(P,17)+cross('האגן זז הצידה'):tick('ברכיים לכיוון הבהונות'))}
PAT.push({id:'squat',n:'סקוואט',m:'ירכיים וישבן',v:['מהצד','מלפנים'],ph:['יורדים לאט','למטה','דוחפים למעלה','זקופים'],
 good:['הירכיים יורדות עד מקביל לרצפה','העקבים נשארים על הרצפה','הברכיים הולכות לכיוון הבהונות','הגב ישר והחזה פתוח'],
 bad:[[{t:'הגב מתעגל',fix:'מרימים את החזה, מותחים את הגב ומורידים משקל אם צריך.'},{t:'העקבים מתרוממים',fix:'מעבירים את המשקל לעקבים ומרחיבים מעט את הצעד.'}],
      [{t:'הברכיים קורסות פנימה',fix:'דוחפים את הברכיים החוצה, בכיוון הבהונות.'},{t:'האגן זז הצידה',fix:'יורדים ישר למטה ומחלקים את המשקל על שתי הרגליים.'}]],
 variants:[{n:'משקל גוף',V:{m:'bw'}},{n:'גביע',V:{m:'gob'}},{n:'במוט',V:{m:'bar'}}],
 views:[sqSide,sqFront]});
})();

/* ================= LUNGE (reverse) ================= */
(function(){
const A0=G-9,clampE=v=>Math.max(0,Math.min(1,v));
function lgSide(e,bd,V){V=V||{};const db=V.m==='db';
 const lean=8+(bd===1?e*22:0),sx=bd===0?100:68,hx=bd===0?22:42;
 const H=[170-hx*e,155+41*e],S=add(H,rot([0,-D.torso],lean)),u=nrm(sub(S,H));
 const Af=[170,A0],te=ease(clampE(e));
 const Ar=[lerp([166],[sx],te)[0],lerp([253],[236],te)[0]-14*Math.sin(Math.PI*e)];
 const Kf=ik(H,Af,D.thigh,D.shin,[1,0]),Kr=ik(H,Ar,D.thigh,D.shin,[1,0]);
 let E=null,W=null,hold='';
 if(db){W=add(S,[2,58]);E=ik(S,W,D.uarm,D.farm,[-1,.1]);hold=LG.dbSil(add(W,[0,2]))}
 else{W=add(S,rot([0,1],0).map((v,i)=>[3,53][i]));E=ik(S,W,D.uarm,D.farm,[-1,.1])}
 let s=floorSvg()+side({H,S,hu:u,hot:{quads:true,glutes:true},near:{el:E,wr:W,kn:Kf,an:Af},far:{el:E,wr:W,kn:Kr,an:Ar,toe:0}});
 s+=LG.foot(Ar,lerp([0],[68],ease(clampE(e*1.3)))[0],true,24)+hold;
 return s+(bd===0?mark(Kf,16)+cross('הברך עוברת את הבהונות'):bd===1?mark(lerp(H,S,.6),18)+cross('הגוף נופל קדימה'):tick('שוק קדמית אנכית, גב זקוף'))}
function lgFront(e,bd,V){V=V||{};const db=V.m==='db';
 const P=[190,155+41*e],N=[190,P[1]-D.torso],te=ease(clampE(e));
 const cv=bd===0?-10*e:0,sh=bd===1?9*e:0;
 const Rr={kn:[206+cv,205+2*e],an:[205,A0]},L={kn:[174,lerp([205],[250],e)[0]],an:[175,lerp([253],[237],te)[0]]};
 const SL=[N[0]-D.sw+sh*.5,N[1]],SR=[N[0]+D.sw+sh*.5,N[1]];
 let post='';
 for(const [sx,S0,T] of [[-1,SL,L],[1,SR,Rr]]){const W=[S0[0]+sx*(db?2:-2),S0[1]+(db?60:56)];T.el=ik(S0,W,D.uarm,D.farm,[sx,.1]);T.wr=W;if(db)post+=dbSide(W,10)}
 const s=floorSvg()+LG.bf({N:[N[0]+sh,N[1]],P:[P[0]+sh*0,P[1]],SL,SR,hot:{quads:true},L,Rr,toes:[0,5]})+post;
 return s+(bd===0?mark(Rr.kn,14)+cross('הברך קורסת פנימה'):bd===1?mark([N[0]+sh,N[1]],17)+cross('הגוף נוטה הצידה'):tick('הברך מעל כף הרגל'))}
PAT.push({id:'lunge',n:'מכרעים',m:'ירכיים וישבן',v:['מהצד','מלפנים'],ph:['צעד אחורה וירידה','למטה','דוחפים וחוזרים','זקופים'],
 good:['צעד גדול אחורה, שתי הברכיים כמעט 90 מעלות','השוק הקדמית אנכית והברך מעל כף הרגל','הגו זקוף והחזה פתוח','דוחפים בעקב של הרגל הקדמית'],
 bad:[[{t:'הברך עוברת את הבהונות',fix:'עושים צעד גדול יותר אחורה כדי שהשוק הקדמית תישאר אנכית.'},{t:'הגוף נופל קדימה',fix:'מרימים את החזה ומחזיקים את הגו זקוף לכל אורך התנועה.'}],
      [{t:'הברך קורסת פנימה',fix:'דוחפים את הברך הקדמית החוצה, מעל האצבעות.'},{t:'הגוף נוטה הצידה',fix:'מייצבים את האגן והכתפיים ויורדים ישר למטה.'}]],
 variants:[{n:'משקל גוף',V:{m:'bw'}},{n:'במשקולות',V:{m:'db'}}],
 views:[lgSide,lgFront]});
})();

/* ================= BULGARIAN SPLIT SQUAT ================= */
(function(){
const A0=G-9;
const bench=(x1,y)=>benchSide(x1-56,x1,y);
function bgSide(e,bd,V){
 const lean=15+(bd===1?e*22:0),fx=bd===0?140:158;
 const H=[lerp([150],[bd===0?108:118],e)[0],157+46*e],S=add(H,rot([0,-D.torso],lean)),u=nrm(sub(S,H));
 const Af=[fx,A0],Ar=[68,203],Kf=ik(H,Af,D.thigh,D.shin,[1,0]),Kr=ik(H,Ar,D.thigh,D.shin,[0,1]);
 const W=add(S,[2,58]),E=ik(S,W,D.uarm,D.farm,[-1,.1]);
 let s=floorSvg()+bench(Ar[0]-3,216)+side({H,S,hu:u,hot:{quads:true,glutes:true},near:{el:E,wr:W,kn:Kf,an:Af},far:{el:E,wr:W,kn:Kr,an:Ar,toe:0}});
 s+=limb([Ar[0]+2,Ar[1]+3],[Ar[0]-22,Ar[1]+3],4.3,3.6,WHD)+LG.dbSil(add(W,[0,2]));
 return s+(bd===0?mark(Kf,17)+cross('הברך רחוקה מעבר לבהונות'):bd===1?mark(lerp(H,S,.6),18)+cross('הגוף נופל קדימה'):tick('הברך מעל הבהונות, גו מעט קדימה'))}
function bgFront(e,bd,V){
 const sh=bd===1?9*e:0,P=[190,157+46*e],N=[190+sh,P[1]-D.torso*.97],cv=bd===0?-10*e:0;
 const SL=[N[0]-D.sw,N[1]],SR=[N[0]+D.sw,N[1]];
 const L={kn:[174,lerp([206],[243],e)[0]],an:[172,203]},Rr={kn:[207+cv,206+3*e],an:[206,A0]};
 let post='';
 for(const [sx,S0,T] of [[-1,SL,L],[1,SR,Rr]]){const W=[S0[0]-sx*2,S0[1]+57];T.el=ik(S0,W,D.uarm,D.farm,[sx,.1]);T.wr=W;post+=dbSide(W,10)}
 const s=floorSvg()+pad([132,216],[188,216],11)+pad([140,216],[140,G],7)+pad([180,216],[180,G],7)+LG.bf({N,P,SL,SR,hot:{quads:true},L,Rr,toes:[-4,5]})+post;
 return s+(bd===0?mark(Rr.kn,14)+cross('הברך קורסת פנימה'):bd===1?mark(N,17)+cross('הגוף נוטה הצידה'):tick('הברך מעל כף הרגל'))}
PAT.push({id:'bulgarian',n:'בולגרי',m:'ירכיים וישבן',v:['מהצד','מלפנים'],ph:['יורדים','למטה','דוחפים למעלה','זקופים'],
 good:['כף הרגל האחורית נחה על הספסל','הברך הקדמית מעל הבהונות','הגו מעט קדימה והגב ישר','יורדים עד שהירך הקדמית כמעט מקבילה'],
 bad:[[{t:'הברך רחוקה מעבר לבהונות',fix:'מרחיקים את הרגל הקדמית קדימה כדי שהשוק תהיה כמעט אנכית.'},{t:'הגוף נופל קדימה',fix:'מחזיקים חזה פתוח והגב ישר, הגו נוטה רק מעט.'}],
      [{t:'הברך קורסת פנימה',fix:'דוחפים את הברך הקדמית החוצה, בכיוון האצבעות.'},{t:'הגוף נוטה הצידה',fix:'מייצבים את האגן ויורדים ישר למטה.'}]],
 views:[bgSide,bgFront]});
})();

/* ================= BRIDGE / HIP THRUST ================= */
(function(){
const A0=G-9;
function brPose(e,bd,V){V=V||{};const bar=V.m==='bar';let S,H,A,K,hu=[-1,0],bend=0;
 if(bar){S=[95,198];const ph=(55-(55+10)*e)*R+0;const top=bd===0?-8:0;const phi=(55*(1-e)+top*e)*R;H=[S[0]+56*Math.cos(phi),S[1]+56*Math.sin(phi)];A=[bd===1?228:200,A0];bend=bd===0?9*e:0}
 else{S=[94,246];const hh=e*22+(bd===0?e*13:0);H=[S[0]+Math.sqrt(56*56-hh*hh),246-hh];A=[bd===1?226:192,A0];bend=bd===0?10*e:0}
 K=ik(H,A,D.thigh,D.shin,[0,-1]);return{S,H,A,K,hu,bend,bar}}
function brSide(e,bd,V){const p=brPose(e,bd,V),{S,H,A,K,bar}=p,A2=[A[0]-3,A[1]],K2=ik(H,A2,D.thigh,D.shin,[0,-1]),u=nrm(sub(S,H)),F=[-u[1],u[0]];
 let W,E,hold='',pre=floorSvg();
 if(bar){pre+=benchSide(35,100,216);const B=add(add(H,mul(F,12)),mul(nrm(sub(K,H)),6));W=reach(S,B,D.uarm,D.farm);E=ik(S,W,D.uarm,D.farm,[0,-1]);hold=plateSide(B,15)}
 else{W=[S[0]+55,251];E=ik(S,W,D.uarm,D.farm,[0,1])}
 const s=pre+side({H,S,hu:p.hu,bend:p.bend,hot:{glutes:true,hams:true},near:{el:E,wr:W,kn:K,an:A},far:{el:E,wr:W,kn:K2,an:A2}})+hold;
 return s+(bd===0?mark(lerp(H,S,.45),18)+cross('הגב התחתון מתקמר'):bd===1?mark(A,16)+cross('הרגליים רחוקות מדי'):tick('אגן למעלה, צלעות למטה'))}
function brTop(e,bd,V){V=V||{};const p=brPose(e,bd,V),{S,H,A,K,bar}=p,N=[190,86],M=x=>86+(x-S[0]),sh=bd===1?10*e:0;
 const P=[190+sh,M(H[0])],cv=bd===0?-8*e:0;
 const Lg={kn:[190-15-cv*-1+0,M(K[0])],an:[190-17,M(A[0])]},Rg={kn:[190+15+cv,M(K[0])],an:[190+17,M(A[0])]};
 Lg.kn[0]=190-15-cv*0-(bd===0?-8*e:0);Rg.kn[0]=190+15+(bd===0?-8*e:0);
 const SL=[N[0]-D.sw,N[1]],SR=[N[0]+D.sw,N[1]];
 for(const [sx,S0,T] of [[-1,SL,Lg],[1,SR,Rg]]){const W=[S0[0]+sx*2,S0[1]+61];T.el=ik(S0,W,D.uarm,D.farm,[sx*.3,.2]);T.wr=W}
 let pre=bgTop,post='';
 if(bar){pre+=`<rect x="156" y="48" width="68" height="66" rx="9" fill="${PAD}"/>`;post=barFront([190-26,P[1]+3],[190+26,P[1]+3],36)}
 const sdw=`<ellipse cx="${f(P[0])}" cy="${f(P[1]+4)}" rx="22" ry="9" fill="#000" opacity="${(.28*e).toFixed(2)}"/>`;
 const s=pre+sdw+LG.bf({N,P,SL,SR,hot:{quads:true,hams:true},L:Lg,Rr:Rg,toes:[-4,4]})+post;
 return s+(bd===0?mark(Lg.kn,13)+mark(Rg.kn,13)+cross('הברכיים נסגרות פנימה'):bd===1?mark(P,18)+cross('האגן זז הצידה'):tick('ברכיים ישרות מעל הקרסוליים'))}
PAT.push({id:'bridge',n:'גשר ישבן',m:'ישבן ורצועת ירך אחורית',v:['מהצד','מלמעלה'],ph:['מרימים את האגן','סוחטים למעלה','יורדים לאט','שוכבים'],
 good:['דוחפים דרך העקבים','האגן עולה עד שהגוף בקו ישר מהכתפיים לברכיים','הצלעות למטה, בלי קימור בגב התחתון','סוחטים את הישבן בנקודה העליונה'],
 bad:[[{t:'הגב התחתון מתקמר',fix:'מכווצים בטן, מורידים צלעות ועוצרים כשהגוף בקו ישר.'},{t:'הרגליים רחוקות מדי',fix:'מקרבים את העקבים לישבן כך שהשוק כמעט אנכית בעליה.'}],
      [{t:'הברכיים נסגרות פנימה',fix:'דוחפים ברכיים החוצה קלות, מעל הקרסוליים.'},{t:'האגן זז הצידה',fix:'מעלים את האגן ישר למעלה ומחלקים משקל על שתי הרגליים.'}]],
 variants:[{n:'גשר ישבן (על הרצפה)',V:{m:'bw'}},{n:'היפ טראסט במוט',V:{m:'bar'}}],
 views:[brSide,brTop]});
})();

/* ================= ROMANIAN DEADLIFT ================= */
(function(){
const A0=G-9;
function rdPose(e,bd,V){V=V||{};const sq=bd===2;const H=sq?[150-14*e,155+36*e]:[150-32*e,155+10*e],lean=sq?e*52:e*68,A=[150,A0];
 const S=add(H,rot([0,-D.torso],lean)),u=nrm(sub(S,H));return{H,S,u,A,lean}}
function rdSide(e,bd,V){V=V||{};const bar=V.m==='bar',p=rdPose(e,bd,V),{H,S,A}=p;
 const K=ik(H,A,D.thigh,D.shin,[1,0]),K2=ik(H,[A[0]-3,A[1]],D.thigh,D.shin,[1,0]);
 const W=add(S,[2+(bd===1?24*e:0),60]),E=ik(S,W,D.uarm,D.farm,[-1,0]);
 const hu=bd===0?rot(p.u,-18*e):p.u;
 const hold=bar?plateSide(add(W,[0,0]),15):LG.dbSil(W);
 const s=floorSvg()+side({H,S,hu,bend:bd===0?-14*e:0,hot:{hams:true,glutes:true},near:{el:E,wr:W,kn:K,an:A},far:{el:E,wr:W,kn:K2,an:[A[0]-3,A[1]]}})+hold;
 return s+(bd===0?mark(lerp(H,S,.5),19)+cross('הגב מתעגל'):bd===1?mark(W,17)+cross('המשקל רחוק מהרגליים'):bd===2?mark(K,16)+cross('הברכיים מתכופפות יותר מדי'):tick('גב ישר, האגן נשלח אחורה'))}
function rdBack(e,bd,V){V=V||{};const bar=V.m==='bar',p=rdPose(e,0,V),P=[190,p.H[1]],N0=P[1]-D.torso*Math.cos(p.lean*R),tw=bd===0?9*e:0;
 const N=[190,N0],SL=[N[0]-D.sw,N0+tw],SR=[N[0]+D.sw,N0-tw];const cv=bd===1?-7*e:0;
 const hipL=[P[0]-D.hw,P[1]],hipR=[P[0]+D.hw,P[1]],aL=[190-17,A0],aR=[190+17,A0];
 const kL=[lerp([hipL[0]],[aL[0]],.5)[0]-cv*-1+0,(hipL[1]+aL[1])/2],kR=[lerp([hipR[0]],[aR[0]],.5)[0]+cv,(hipR[1]+aR[1])/2];
 kL[0]=(hipL[0]+aL[0])/2-cv*-1;kR[0]=(hipR[0]+aR[0])/2+cv;
 const L={kn:kL,an:aL},Rr={kn:kR,an:aR};let pre='',post='';
 for(const [sx,S0,T] of [[-1,SL,L],[1,SR,Rr]]){const W=[S0[0]+sx*3,S0[1]+60],E=ik(S0,W,D.uarm,D.farm,[sx*.8,0]);T.el=E;T.wr=W;if(!bar)post+=dbSide(W,10)}
 if(bar)pre=barFront([SL[0]+3,SL[1]+60],[SR[0]-3,SR[1]+60],22);
 const s=floorSvg()+pre+LG.bf({N,P,SL,SR,back:true,hot:{glutes:true,hams:true,lowback:true},L,Rr,toes:[-4,4],hd:[N[0],N0-12]})+post;
 return s+(bd===0?mark(SL,14)+mark(SR,14)+cross('הכתפיים לא ישרות'):bd===1?mark(kL,13)+mark(kR,13)+cross('הברכיים נסגרות פנימה'):tick('כתפיים ואגן ישרים'))}
PAT.push({id:'rdl',n:'דדליפט רומני',m:'ירכיים אחוריות וישבן',v:['מהצד','מאחור'],ph:['שולחים אגן אחורה','למטה','דוחפים אגן קדימה','זקופים'],
 good:['האגן נשלח אחורה, לא למטה','ברכיים רכות, כמעט ישרות','הגב ישר, המשקל גולש על הירכיים','יורדים עד מתיחה בירכיים האחוריות'],
 bad:[[{t:'הגב מתעגל',fix:'מורידים עד איפה שהגב נשאר ישר, החזה פתוח והמבט קדימה.'},{t:'המשקל רחוק מהרגליים',fix:'מצמידים את המשקל לירכיים ולשוקיים לכל אורך התנועה.'},{t:'הברכיים מתכופפות יותר מדי',fix:'זו לא סקוואט. הברכיים כמעט קבועות והאגן נשלח אחורה.'}],
      [{t:'הכתפיים לא ישרות',fix:'מחזיקים כתפיים ואגן ישרים ומסתובבים רק דרך הצירים.'},{t:'הברכיים נסגרות פנימה',fix:'הברכיים נשארות מעל כפות הרגליים לכל אורך התנועה.'}]],
 variants:[{n:'במשקולות',V:{m:'db'}},{n:'במוט',V:{m:'bar'}}],
 views:[rdSide,rdBack]});
})();

/* ================= CALF RAISE ================= */
(function(){
const A0=G-9;
function ccGeom(e,bd,V){V=V||{};const m=V.m||'bw',mach=m==='mach';
 const base=mach?G-13:G,th0=mach?-18:0,th1=55,t=bd===1?e*.4:e,th=(th0+(th1-th0)*t)*R,bp=[168,base-3.6];
 const hp=[bp[0]-18*Math.cos(th),bp[1]-18*Math.sin(th)],A=[hp[0]+2,hp[1]-3];return{A,bp,hp,th,base,mach,m}}
function ccSide(e,bd,V){const g=ccGeom(e,bd,V),A=g.A,m=g.m;
 let H=add(A,[-2,-96.5]);if(bd===0)H=add(A,[-9,-84]);
 const lean=bd===1?e*0:0,S0=add(H,[0,-D.torso]);const S=bd===1?add(H,rot([0,-D.torso],e*26)):S0,u=nrm(sub(S,H));
 const K=ik(H,A,D.thigh,D.shin,[1,0]),A2=[A[0]-3,A[1]],K2=ik(H,A2,D.thigh,D.shin,[1,0]);
 let pre=floorSvg(),W,E,post='';
 if(g.mach){pre+=`<rect x="156" y="${g.base}" width="36" height="${G-g.base}" rx="3" fill="${PAD}"/><rect x="156" y="${g.base}" width="36" height="3" rx="1.5" fill="#5D6A78"/>`;
  const Pc=add(S,[1,-11]);pre+=`<rect x="36" y="56" width="26" height="206" rx="4" fill="#2B3540"/><rect x="40" y="70" width="18" height="6" fill="#46525F"/><rect x="40" y="86" width="18" height="6" fill="#46525F"/><rect x="40" y="102" width="18" height="6" fill="#46525F"/>`+
   `<line x1="62" y1="64" x2="${f(Pc[0]-10)}" y2="${f(Pc[1]-2)}" stroke="${BAR}" stroke-width="5" stroke-linecap="round"/>`;
  W=add(Pc,[9,4]);E=ik(S,W,D.uarm,D.farm,[.4,1]);post=pad(add(Pc,[-12,0]),add(Pc,[12,0]),13)}
 else{W=add(S,[1,58]);E=ik(S,W,D.uarm,D.farm,[-1,0]);if(m==='db')post=LG.dbSil(add(W,[0,2]))}
 const ft=(a,far)=>{const hp=[a[0]-2,a[1]+3],bp=[g.bp[0]-(far?3:0),g.bp[1]];return limb(hp,bp,4.3,3.6,far?WHD:WH)+limb(bp,add(bp,[8,0]),3.6,3.2,far?WHD:WH)};
 let s=pre+side({H,S,hu:u,hot:{calves:true},near:{el:E,wr:W,kn:K,an:A,toe:0},far:{el:E,wr:W,kn:K2,an:A2,toe:0}})+ft(A2,true)+ft(A,false)+post;
 return s+(bd===0?mark(K,16)+cross('הברכיים מתכופפות'):bd===1?mark(A,16)+cross('טווח קצר, העקב לא עולה'):tick('עולים גבוה על קצות האצבעות'))}
function ccBack(e,bd,V){V=V||{};const g=ccGeom(e,bd,V),{A}=g,m=g.m,dy=A[1]-A0,P=[190,155+dy+(bd===0?0:0)];
 const N=[190,P[1]-D.torso],uneven=bd===1?e*7:0,out=bd===0?e*8:0;
 const aL=[190-17-out,A0+dy+uneven],aR=[190+17+out,A0+dy];
 const hipL=[P[0]-D.hw,P[1]],hipR=[P[0]+D.hw,P[1]];
 const SL=[N[0]-D.sw,N[1]],SR=[N[0]+D.sw,N[1]];
 const L={kn:[(hipL[0]+aL[0])/2,(hipL[1]+aL[1])/2],an:aL},Rr={kn:[(hipR[0]+aR[0])/2,(hipR[1]+aR[1])/2],an:aR};
 let pre='',post='';
 if(g.mach){const y=N[1]-6;pre+=`<line x1="${N[0]-D.sw-12}" y1="${y}" x2="${N[0]-D.sw-12}" y2="38" stroke="${BAR}" stroke-width="5"/><line x1="${N[0]+D.sw+12}" y1="${y}" x2="${N[0]+D.sw+12}" y2="38" stroke="${BAR}" stroke-width="5"/><line x1="${N[0]-D.sw-12}" y1="38" x2="${N[0]+D.sw+12}" y2="38" stroke="${BAR}" stroke-width="5"/>`;
  pre+=`<rect x="${N[0]-48}" y="${G-13}" width="96" height="13" rx="3" fill="${PAD}"/>`;
  for(const [sx,S0,T] of [[-1,SL,L],[1,SR,Rr]]){const W=[S0[0]+sx*4,S0[1]-8];T.el=ik(S0,W,D.uarm,D.farm,[sx*.7,1]);T.wr=W}
  post=pad([N[0]-D.sw-14,N[1]-6],[N[0]-6,N[1]-6],13)+pad([N[0]+6,N[1]-6],[N[0]+D.sw+14,N[1]-6],13)}
 else{for(const [sx,S0,T] of [[-1,SL,L],[1,SR,Rr]]){const W=[S0[0]+sx*3,S0[1]+58],E=ik(S0,W,D.uarm,D.farm,[sx*.8,0]);T.el=E;T.wr=W;if(m==='db')post+=dbSide(W,10)}}
 const base=g.mach?G-13:G,shoe=a=>limb(a,[a[0],base-4],4.2,4.6,WH)+ell([a[0],base-3.5],6.2,3.6,0,WH);
 const s=floorSvg()+pre+LG.bf({N,P,SL,SR,back:true,hot:{calves:true},L,Rr,toes:[0,0]})+shoe(aL)+shoe(aR)+post;
 return s+(bd===0?mark(aL,13)+mark(aR,13)+cross('הקרסוליים נופלים החוצה'):bd===1?mark(aL,13)+cross('עקב אחד עולה פחות'):tick('שני העקבים עולים ביחד'))}
PAT.push({id:'calf_raise',n:'תאומים',m:'שרירי השוק',v:['מהצד','מאחור'],ph:['עולים על קצות האצבעות','למעלה','יורדים לאט','שוק מתוחה'],
 good:['עולים עד הסוף על כרית כף הרגל','עוצרים שנייה למעלה','יורדים לאט עד מתיחה','הברכיים כמעט ישרות והגוף זקוף'],
 bad:[[{t:'הברכיים מתכופפות',fix:'מחזיקים ברכיים כמעט ישרות, התנועה רק בקרסול.'},{t:'טווח קצר, העקב לא עולה',fix:'עולים עד הסוף ויורדים עד מתיחה מלאה.'}],
      [{t:'הקרסוליים נופלים החוצה',fix:'דוחפים דרך האגודל ושומרים על קרסול ישר.'},{t:'עקב אחד עולה פחות',fix:'מחלקים משקל שווה ועולים בשתי הרגליים באותו גובה.'}]],
 variants:[{n:'ללא ציוד',V:{m:'bw'}},{n:'במשקולות',V:{m:'db'}},{n:'במכונה',V:{m:'mach'}}],
 views:[ccSide,ccBack]});
})();

/* ================= LEG PRESS ================= */
(function(){
const d=[Math.SQRT1_2,-Math.SQRT1_2],t=[-Math.SQRT1_2,-Math.SQRT1_2],nn=[-Math.SQRT1_2,Math.SQRT1_2],pole=[-1,-1];
function lpPose(e,bd){const H0=[110,225],u=[-.766,-.643],S=add(H0,mul(u,56)),lift=bd===0?e:0;
 const H=add(H0,[6*lift,-10*lift]);const L=bd===2?97.4+(64-97.4)*e:90+(64-90)*e;
 const A=add(H0,mul(d,L)),A2=add(A,[-2,3]);return{H0,H,S,u,A,L}}
function lpSide(e,bd,V){const p=lpPose(e,bd),{H,S,u,A}=p;
 const K=ik(H,A,D.thigh,D.shin,pole),A2=add(A,mul(d,-4)),K2=ik(H,A2,D.thigh,D.shin,pole);
 const bk=[u[1],-u[0]],C=add(A,mul(nn,-11)),heel=bd===1?8:0;
 let s=floorSvg();
 // rails + frame
 const q=sub(add(C,mul(t,-26)),mul(d,0));const k0=(G-2-q[1])/(-d[1])*-1;const rs=add(q,mul(d,-Math.abs((G-2-q[1])/d[1])));
 s+=`<line x1="${f(rs[0])}" y1="${f(rs[1])}" x2="${f(rs[0]+d[0]*230)}" y2="${f(rs[1]+d[1]*230)}" stroke="#3A4652" stroke-width="7" stroke-linecap="round"/>`;
 s+=pad([p.H0[0]-30,G-3],[p.H0[0]+60,G-3],6)+pad([p.H0[0]+4,p.H0[1]+28],[p.H0[0]+4,G],8)+pad([p.H0[0]-16,p.H0[1]+23],[p.H0[0]+34,p.H0[1]+23],10);
 s+=pad(add(p.H0,mul(bk,15)),add(add(S,mul(bk,15)),mul(u,24)),10);
 s+=pad(add(C,mul(t,34)),add(C,mul(t,-30)),7,'#6B7886');
 const hu=u,W=reach(S,add(p.H0,[18,-14]),D.uarm,D.farm),E=ik(S,W,D.uarm,D.farm,[.2,1]);
 s+=side({H,S,hu,bend:bd===0?6*e:0,hot:{quads:true,glutes:true},near:{el:E,wr:W,kn:K,an:A,toe:0},far:{el:E,wr:W,kn:K2,an:A2,toe:0}});
 const ft=(a,far)=>limb(add(add(a,mul(t,-4)),mul(nn,-4+heel)),add(add(a,mul(t,20)),mul(nn,-4)),4.3,3.6,far?WHD:WH);
 s+=ft(A2,true)+ft(A,false)+circ(W,5,'#6B7886')+circ(W,4.2,SK);
 return s+(bd===0?mark(add(H,[-6,14]),19)+cross('האגן מתרומם מהכרית'):bd===1?mark(add(A,mul(nn,-6)),15)+cross('העקבים מתרוממים'):bd===2?mark(K,16)+cross('נועלים את הברכיים'):tick('גב תחתון על הכרית'))}
function lpFront(e,bd,V){const p=lpPose(e,0),Y=q=>.7071*(q[0]+q[1])-36.9,N=[190,Y(p.S)],P=[190,Y(p.H0)];
 const K=ik(p.H,p.A,D.thigh,D.shin,pole),ky=Y(K),ay=Y(p.A);const cv=bd===0?-9*e:0,asym=bd===1?8*e:0;
 const aL=[173,ay+asym],aR=[207,ay],kL=[190-18-2*e-cv,ky],kR=[190+18+2*e+cv,ky],hL=[176,P[1]],hR=[204,P[1]];
 const SL=[N[0]-D.sw,N[1]],SR=[N[0]+D.sw,N[1]];
 const L={},Rr={};for(const [sx,S0,T] of [[-1,SL,L],[1,SR,Rr]]){const W=[N[0]+sx*(D.hw+14),P[1]-6],E=ik(S0,W,D.uarm,D.farm,[sx,0]);T.el=E;T.wr=W}
 let s=bgTop+`<rect x="${N[0]-30}" y="${N[1]-34}" width="60" height="${P[1]-N[1]+44}" rx="10" fill="${PAD}"/>`+`<rect x="${N[0]-52}" y="${f(Math.max(ay,aL[1])-16)}" width="104" height="${f(34+asym)}" rx="6" fill="#3A4652"/>`;
 s=s.replace(/<rect x="[^"]*" y="[^"]*" width="104"[^>]*\/>/,'');
 s+=LG.bf({N,P,SL,SR,noLegs:true,hot:{quads:true},L,Rr});
 s+=`<rect x="${N[0]-54}" y="${f(Math.max(ay,aL[1])-12)}" width="108" height="${f(30+asym)}" rx="6" fill="#3A4652"/>`;
 s+=LG.legF(hL,kL,aL,-4,{quads:true})+LG.legF(hR,kR,aR,4,{quads:true});
 return s+(bd===0?mark(kL,14)+mark(kR,14)+cross('הברכיים קורסות פנימה'):bd===1?mark(aL,15)+cross('רגל אחת דוחפת פחות'):tick('ברכיים מעל כפות הרגליים'))}
PAT.push({id:'leg_press',n:'לחיצת רגליים',m:'ירכיים וישבן',v:['מהצד','מלפנים'],ph:['מורידים לאט','למטה','דוחפים','רגליים כמעט ישרות'],
 good:['הגב התחתון צמוד לכרית כל הזמן','מורידים עד ברכיים כ-90 מעלות','דוחפים דרך כל כף הרגל','לא נועלים את הברכיים למעלה'],
 bad:[[{t:'האגן מתרומם מהכרית',fix:'מקצרים את הטווח ועוצרים לפני שהאגן מתקפל, הגב התחתון נשאר על הכרית.'},{t:'העקבים מתרוממים',fix:'מעבירים את הלחץ לעקבים וקרוב לאמצע הפלטפורמה.'},{t:'נועלים את הברכיים',fix:'עוצרים כשהברכיים כמעט ישרות, בלי נעילה חזקה.'}],
      [{t:'הברכיים קורסות פנימה',fix:'דוחפים את הברכיים החוצה, בכיוון הבהונות.'},{t:'רגל אחת דוחפת פחות',fix:'מחלקים את הדחיפה שווה בין שתי הרגליים.'}]],
 views:[lpSide,lpFront]});
})();

/* ===== shared seated-machine pieces for leg curl / leg extension ===== */
const SEATM=(H,S,kx)=>{const u=nrm(sub(S,H)),bk=[u[1],-u[0]];
 return pad([H[0]-42,G-3],[kx+26,G-3],6)+pad([H[0]+6,H[1]+26],[H[0]+6,G],8)+pad([H[0]-18,H[1]+22],[kx-6,H[1]+22],10)+pad(add(H,mul(bk,15)),add(add(S,mul(bk,15)),mul(u,24)),10)};

/* ================= LEG CURL ================= */
(function(){
function lcGeom(e,bd,V){V=V||{};const lie=V.m==='lie',t=bd===1?e*.5:e;
 if(lie){const H=[150,196-(bd===0?9*e:0)],S=[H[0]+56,196],K=[100,196],th=(3+102*t)*R,s=[-Math.cos(th),-Math.sin(th)],bn=[Math.sin(th),-Math.cos(th)];
  return{lie,H,S,K,A:add(K,mul(s,48)),s,bn,th}}
 const H=[110,205-(bd===0?8*e:0)],lb=bd===0?e*22:0,S=add(H,rot([0,-D.torso],-12-lb)),K=add(H,[50,-2]),ph=(-5+100*t)*R,s=[Math.cos(ph),Math.sin(ph)],bn=[-Math.sin(ph),Math.cos(ph)];
 return{lie,H,S,K,A:add(K,mul(s,48)),s,bn,ph}}
function lcSide(e,bd,V){const g=lcGeom(e,bd,V),{H,S,K,A,s,bn,lie}=g,u=nrm(sub(S,H)),pc=add(add(K,mul(s,40)),mul(bn,14)),A2=add(A,[lie?0:-2,lie?-2:0]),K2=add(K,[lie?0:-2,0]);
 let pre=floorSvg(),W,E,hu,fn=undefined;
 if(lie){pre+=pad([96,216],[240,216],12)+pad([110,216],[110,G],7)+pad([226,216],[226,G],7);hu=[1,0];fn=[0,1];W=[S[0]+14,S[1]+14];E=ik(S,W,D.uarm,D.farm,[.2,1])}
 else{pre+=SEATM(g.H,g.S,K[0]);hu=u;W=reach(S,add(H,[16,-10]),D.uarm,D.farm);E=ik(S,W,D.uarm,D.farm,[-.3,1])}
 // lever arm behind the leg, then figure, then pad on top
 pre+=`<line x1="${f(K[0]+bn[0]*14)}" y1="${f(K[1]+bn[1]*14)}" x2="${f(pc[0])}" y2="${f(pc[1])}" stroke="${BAR}" stroke-width="5" stroke-linecap="round"/>`;
 if(!lie)pre+=pad([K[0]-24,H[1]-20],[K[0]-8,H[1]-20],9)+`<line x1="${K[0]-16}" y1="${H[1]-20}" x2="${K[0]-16}" y2="${H[1]-60}" stroke="${BAR}" stroke-width="4"/>`;
 const kn=ik(H,K,.1,.1,[0,-1]);
 let sv=side({H,S,hu,n:fn,hot:{hams:true,glutes:true},near:{el:E,wr:W,kn:K,an:A,toe:0},far:{el:E,wr:W,kn:K2,an:A2,toe:0}});
 const ft=(a,far)=>limb(a,add(add(a,mul(bn,-17)),mul(s,4)),4.3,3.6,far?WHD:WH);
 sv+=ft(A2,true)+ft(A,false)+circ(pc,7,PAD)+circ(pc,3,'#6B7886');
 return pre+sv+(bd===0?mark(add(H,[0,10]),19)+cross(lie?'האגן מתרומם מהספסל':'האגן מתרומם מהמושב'):bd===1?mark(A,16)+cross('טווח קצר'):tick(lie?'האגן צמוד לספסל':'גב צמוד, כפיפה מלאה'))}
function lcFront(e,bd,V){const g=lcGeom(e,0,V),lie=g.lie;let N,P,kL,kR,aL,aR,s='';
 const spread=bd===0?9*e:0,asym=bd===1?e*.45:0;
 if(lie){N=[190,76];P=[190,128];const ky=P[1]+50,ay=t=>ky+48*Math.cos(t);const thR=g.th,thL=bd===1?g.th*(1-asym):g.th;
  kL=[190-15-spread,ky];kR=[190+15+spread,ky];aL=[190-17,ay(thL)];aR=[190+17,ay(thR)];
  s=bgTop+`<rect x="150" y="${ky-18}" width="80" height="22" rx="8" fill="${PAD}" opacity="0"/><rect x="154" y="56" width="72" height="${ky-50}" rx="10" fill="${PAD}"/>`;
  const SL=[N[0]-D.sw,N[1]],SR=[N[0]+D.sw,N[1]],L={kn:kL,an:aL},Rr={kn:kR,an:aR};for(const [sx,S0,T] of [[-1,SL,L],[1,SR,Rr]]){const W=[S0[0]+sx*6,S0[1]+18];T.el=ik(S0,W,D.uarm,D.farm,[sx,.6]);T.wr=W}
  s+=LG.bf({N,P,back:true,hot:{hams:true,glutes:true},L,Rr,toes:[-4,4]});
  const ph=g.th;s+=`<rect x="${190-34}" y="${f(ky+30*Math.cos(ph)-6)}" width="68" height="11" rx="5.5" fill="${PAD}"/>`}
 else{P=[190,196-(0)];N=[190,P[1]-D.torso*.97];const ky=P[1]+16,ay=t=>ky+48*Math.sin(t);const phR=g.ph,phL=bd===1?-.09+(g.ph+.09)*(1-asym):g.ph;
  kL=[190-16-spread,ky];kR=[190+16+spread,ky];aL=[190-17,ay(phL)];aR=[190+17,ay(phR)];
  s=bgTop+`<rect x="${N[0]-32}" y="${N[1]-26}" width="64" height="${P[1]-N[1]+36}" rx="10" fill="${PAD}"/>`;
  const SL=[N[0]-D.sw,N[1]],SR=[N[0]+D.sw,N[1]],L={},Rr={};for(const [sx,S0,T] of [[-1,SL,L],[1,SR,Rr]]){const W=[N[0]+sx*(D.hw+13),P[1]-4];T.el=ik(S0,W,D.uarm,D.farm,[sx,0]);T.wr=W}
  s+=LG.bf({N,P,noLegs:true,hot:{hams:true},L,Rr})+LG.legF([176,P[1]],kL,aL,-4,{hams:true})+LG.legF([204,P[1]],kR,aR,4,{hams:true});
  s+=`<rect x="${190-36}" y="${f(ky+30*Math.sin(g.ph)-6)}" width="72" height="11" rx="5.5" fill="${PAD}"/>`}
 return s+(bd===0?mark(kL,13)+mark(kR,13)+cross('הברכיים נפתחות החוצה'):bd===1?mark(aL,14)+cross('רגל אחת מתקפלת פחות'):tick('שתי הרגליים מתקפלות ביחד'))}
PAT.push({id:'leg_curl',n:'כפיפת ברך',m:'ירכיים אחוריות',v:['מהצד','מלמעלה / מלפנים'],ph:['מקפלים את הברכיים','סוחטים','חוזרים לאט','רגליים ישרות'],
 good:['האגן והגב צמודים למכונה','מקפלים עד שהעקבים קרובים לישבן','סוחטים שנייה למעלה','חוזרים לאט, בלי לנעול בכוח'],
 bad:[[{t:'האגן מתרומם',fix:'מורידים משקל ומצמידים את האגן למושב או לספסל לכל אורך התנועה.'},{t:'טווח קצר',fix:'מקפלים עד הסוף וחוזרים לאט עד כמעט ישר.'}],
      [{t:'הברכיים נפתחות החוצה',fix:'שומרים ברכיים ורגליים צמודות בכיוון אחד.'},{t:'רגל אחת מתקפלת פחות',fix:'מקפלים שתי רגליים באותה מהירות ובאותו טווח.'}]],
 variants:[{n:'שכיבה',V:{m:'lie'}},{n:'ישיבה',V:{m:'sit'}}],
 views:[lcSide,lcFront]});
})();

/* ================= LEG EXTENSION ================= */
(function(){
function leGeom(e,bd){const t=bd===1?e*.5:e,H=[110,205-(bd===0?8*e:0)],lb=bd===0?e*22:0,S=add(H,rot([0,-D.torso],-10-lb)),K=add(H,[50,-2]),ph=(95-103*t)*R,s=[Math.cos(ph),Math.sin(ph)],bk=[-Math.sin(ph),Math.cos(ph)];
 return{H,S,K,ph,s,bk,A:add(K,mul(s,48))}}
function leSide(e,bd,V){const g=leGeom(e,bd),{H,S,K,A,s,bk}=g,u=nrm(sub(S,H)),fr=mul(bk,-1),pc=add(add(K,mul(s,40)),mul(fr,14)),A2=add(A,[-2,0]),K2=add(K,[-2,0]);
 let pre=floorSvg()+SEATM(H,S,K[0]);
 const W=reach(S,add(H,[16,-10]),D.uarm,D.farm),E=ik(S,W,D.uarm,D.farm,[-.3,1]);
 const a=add(K,mul(bk,14)),b=add(add(K,mul(s,40)),mul(bk,14));
 pre+=`<polyline points="${pts([a,b,pc])}" fill="none" stroke="${BAR}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;
 pre+=pad([K[0]-24,H[1]-20],[K[0]-8,H[1]-20],9)+`<line x1="${K[0]-16}" y1="${H[1]-20}" x2="${K[0]-16}" y2="${H[1]-60}" stroke="${BAR}" stroke-width="4"/>`;
 let sv=side({H,S,hu:u,hot:{quads:true},near:{el:E,wr:W,kn:K,an:A,toe:0},far:{el:E,wr:W,kn:K2,an:A2,toe:0}});
 const ft=(a,far)=>limb(a,add(add(a,mul(fr,17)),mul(s,4)),4.3,3.6,far?WHD:WH);
 sv+=ft(A2,true)+ft(A,false)+circ(pc,7,PAD)+circ(pc,3,'#6B7886');
 return pre+sv+(bd===0?mark(add(H,[0,10]),19)+cross('האגן מתרומם מהמושב'):bd===1?mark(A,16)+cross('טווח קצר'):tick('גב צמוד, מיישרים בלי לנעול'))}
function leFront(e,bd,V){const g=leGeom(e,0),P=[190,196],N=[190,P[1]-D.torso*.97],ky=P[1]+16,spread=bd===0?9*e:0,asym=bd===1?e*.45:0;
 const ay=ph=>ky+48*Math.sin(ph),phR=g.ph,phL=bd===1?(95*R)+(phR-95*R)*(1-asym):phR;
 const kL=[190-16-spread,ky],kR=[190+16+spread,ky],aL=[190-17,ay(phL)],aR=[190+17,ay(phR)];
 let s=bgTop+`<rect x="${N[0]-32}" y="${N[1]-26}" width="64" height="${P[1]-N[1]+36}" rx="10" fill="${PAD}"/>`;
 const SL=[N[0]-D.sw,N[1]],SR=[N[0]+D.sw,N[1]],L={},Rr={};for(const [sx,S0,T] of [[-1,SL,L],[1,SR,Rr]]){const W=[N[0]+sx*(D.hw+13),P[1]-4];T.el=ik(S0,W,D.uarm,D.farm,[sx,0]);T.wr=W}
 s+=LG.bf({N,P,noLegs:true,hot:{quads:true},L,Rr})+LG.legF([176,P[1]],kL,aL,-4,{quads:true})+LG.legF([204,P[1]],kR,aR,4,{quads:true});
 s+=`<rect x="${190-36}" y="${f(ky+34*Math.sin(Math.min(phL,phR))-6)}" width="72" height="11" rx="5.5" fill="${PAD}"/>`;
 return s+(bd===0?mark(kL,13)+mark(kR,13)+cross('הברכיים נפתחות החוצה'):bd===1?mark(aL,14)+cross('רגל אחת מיישרת פחות'):tick('שתי הרגליים מתיישרות ביחד'))}
PAT.push({id:'leg_ext',n:'פשיטת ברך',m:'ירכיים קדמיות',v:['מהצד','מלפנים'],ph:['מיישרים את הברכיים','סוחטים','יורדים לאט','ברכיים בזווית 90'],
 good:['הגב צמוד למשענת והאגן למושב','מיישרים עד שהרגל כמעט ישרה','סוחטים שנייה למעלה, בלי נעילה חזקה','יורדים לאט בשליטה'],
 bad:[[{t:'האגן מתרומם',fix:'מורידים משקל ומצמידים את האגן למושב לכל אורך התנועה.'},{t:'טווח קצר',fix:'מיישרים עד הסוף ויורדים עד זווית של כ-90 מעלות.'}],
      [{t:'הברכיים נפתחות החוצה',fix:'שומרים על הברכיים בקו אחד עם כפות הרגליים.'},{t:'רגל אחת מיישרת פחות',fix:'מיישרים שתי רגליים יחד ובאותה מהירות.'}]],
 views:[leSide,leFront]});
})();

/* ===== core + cardio patterns: crunch, plank, leg_raise, dead_bug, cable_crunch, cable_twist, walk, jog, bike, elliptical ===== */
/* ---------- shared local helpers (namespaced on window.__CC so other pattern files cannot collide) ---------- */
(function(){
const C={};
/* foot as a rounded capsule; f = direction of the toes (unit-ish vector); sole is on the side rot(f,+90) */
C.footV=(A,f,far,ft)=>{f=nrm(f||[1,0]);const n=[-f[1],f[0]];return limb(add(sub(A,mul(f,2)),mul(n,3)),add(add(A,mul(f,ft||21)),mul(n,3)),4.3,3.6,far?WHD:WH)};
C.foot=(A,ang,far)=>C.footV(A,[Math.cos(ang*R),-Math.sin(ang*R)],far);
/* copy of rig legSide without the foot */
C.legC=(H,K,A,F,far,h)=>{h=h||{};const c=far?SKD:SK,sh=far?PND:PN;
 const u1=nrm(sub(K,H)),fr1=[u1[1],-u1[0]],u2=nrm(sub(A,K)),fr2=[u2[1],-u2[0]];
 return limb(H,K,11,7.4,c)+belly(H,K,11,7.4,.1,.92,fr1,3.8,{hot:h.quads&&!far,fill:c,far})+belly(H,K,11,7.4,.12,.9,mul(fr1,-1),3.2,{hot:h.hams&&!far,fill:c,far})+
 limb(K,A,6.8,4.4,c)+belly(K,A,6.8,4.4,.04,.62,mul(fr2,-1),4.6,{hot:h.calves&&!far,fill:c,far})+limb(H,lerp(H,K,.42),11.5,9.8,sh)};
/* side figure with free foot directions and optional layers.
   p: like rig side(); near/far get .f (toe direction). farUnder drawn first, nearUnder after the torso (before the near leg), over after the near leg. */
C.sideC=p=>{const F=p.n||(()=>{const u=nrm(sub(p.S,p.H));return[-u[1],u[0]]})(),hu=p.hu||nrm(sub(p.S,p.H)),h=p.hot||{},nr=p.near||{},fa=p.far||{};
 let s=p.farUnder||'';
 if(fa.kn)s+=C.legC(p.H,fa.kn,fa.an,F,true,{})+C.footV(fa.an,fa.f,true);
 s+=torsoSide(p.H,p.S,F,{bend:p.bend,hot:h,noTop:p.noTop});
 s+=p.nearUnder||'';
 if(nr.kn)s+=C.legC(p.H,nr.kn,nr.an,F,false,h)+C.footV(nr.an,nr.f,false);
 s+=p.mid||'';
 s+=headSide(p.S,hu);
 if(fa.el)s+=armSide(add(p.S,[1.5,-1]),add(fa.el,[1.5,-1]),add(fa.wr,[1.5,-1]),F,true,{});
 if(nr.el)s+=armSide(p.S,nr.el,nr.wr,F,false,h);
 return s+(p.over||'')};
/* leg drawn for top-down views (limbs from above) ; s = closeness scale */
C.legTop=(HH,K,A,s,fdir,o)=>{o=o||{};s=s||1;fdir=nrm(fdir||[0,1]);
 return limb(HH,K,9.6*s,7.8*s,SK)+limb(K,A,7.4*s,5*s,SK)+limb(HH,lerp(HH,K,.45),10.4*s,9.2*s,PN)+(o.nofoot?'':limb(add(A,mul(fdir,-1)),add(A,mul(fdir,15)),5*s,4.2*s,WH))};
/* floor mat for lying exercises (side/top) */
C.matSide=(x0,x1)=>`<rect x="${x0}" y="${G-2}" width="${x1-x0}" height="6" rx="3" fill="#2E6F8E"/>`;
C.matTop=(cx,y0,y1,w)=>`<rect x="${cx-(w||70)}" y="${y0}" width="${(w||70)*2}" height="${y1-y0}" rx="10" fill="#244E63"/>`;
window.__CC=C;
})();
/* ---------- 1. CRUNCH ---------- */
(function(){const C=window.__CC,FL=G-13;
function crunchSide(e,bd,V){V=V||{};
 const H=[236,FL],th=(bd===1?e*66:e*30)*R,P0=bd===1?H:add(H,[-20,0]),seg=bd===1?56:36;
 const S=add(P0,[-Math.cos(th)*seg,-Math.sin(th)*seg]);
 let bend=0;if(bd!==1){const u=nrm(sub(S,H)),n=[-u[1],u[0]],Mc=lerp(H,S,.45);bend=Math.abs(n[1])>.05?(H[1]-Mc[1])/n[1]:0}
 const base=nrm(sub(S,P0)),hu=rot(base,(bd===0?36:10)*e),hd=add(S,mul(hu,21.8)),fc=[-hu[1],hu[0]];
 const Fu=[-base[1],base[0]],dn=nrm(sub(P0,S));let E,W;
 if(V.cross){E=add(add(S,mul(dn,29)),mul(Fu,10));W=add(add(S,mul(Fu,11)),mul(dn,3))}
 else{W=sub(sub(hd,mul(fc,3)),mul(hu,1));E=ik(S,W,D.uarm,D.farm,[.5,-1])}
 const A=[H[0]+72,G-9],A2=[H[0]+80,G-9],K=ik(H,A,D.thigh,D.shin,[0,-1]),K2=ik(H,A2,D.thigh,D.shin,[0,-1]);
 const s=floorSvg()+C.sideC({H,S,hu,bend,hot:{abs:true},near:{el:E,wr:W,kn:K,an:A,f:[1,0]},far:{el:add(E,[-3,-2]),wr:add(W,[-3,-2]),kn:K2,an:A2,f:[1,0]}});
 return s+(bd===0?mark(add(S,mul(hu,8)),17)+cross('הסנטר נצמד לחזה'):bd===1?mark(add(H,[-14,-8]),19)+cross('קמים יותר מדי'):tick('הגב התחתון צמוד לרצפה'))}
function crunchTop(e,bd,V){V=V||{};
 const P=[200,178],th=e*30*R,N=[200,P[1]-(20+36*Math.cos(th))],SL=[N[0]-24,N[1]],SR=[N[0]+24,N[1]];
 const hd=bd===0?[N[0],N[1]-(22.5-9*e)]:[N[0],N[1]-22.5];
 let aL,aR;
 if(V.cross){aL={el:[SL[0]+4,SL[1]+27],wr:[N[0]+9,N[1]+18]};aR={el:[SR[0]-4,SR[1]+25],wr:[N[0]-9,N[1]+16]}}
 else{const wl=[hd[0]-(bd===0?6:11),hd[1]+(bd===0?6:3)],wr=[hd[0]+(bd===0?6:11),hd[1]+(bd===0?6:3)];
  aL={el:ik(SL,wl,D.uarm,D.farm,[bd===0?-.3:-1,-.1]),wr:wl};aR={el:ik(SR,wr,D.uarm,D.farm,[bd===0?.3:1,-.1]),wr:wr}}
 const sp=bd===1?e*24:0,HL=[P[0]-14,P[1]],HR=[P[0]+14,P[1]];
 const legs=C.legTop(HL,[HL[0]-sp-1,P[1]+36],[HL[0]-3,P[1]+72],1,[0,1])+C.legTop(HR,[HR[0]+sp+1,P[1]+36],[HR[0]+3,P[1]+72],1,[0,1]);
 const s=bgTop+C.matTop(200,N[1]-52,P[1]+104,62)+legs+bodyFront({N,P,SL,SR,HL,HR,hd,hot:{abs:true},noLegs:true,L:aL,Rr:aR});
 return s+(bd===0?mark(hd,19)+cross('הסנטר נצמד לחזה'):bd===1?mark([HR[0]+sp+1,P[1]+36],16)+mark([HL[0]-sp-1,P[1]+36],16)+cross('הברכיים נפתחות'):tick('הראש ניטרלי, מרימים מהבטן'))}
PAT.push({id:'crunch',n:'כפיפות בטן',m:'שרירי הבטן',v:['מהצד','מלמעלה'],ph:['מקפלים למעלה','לוחצים את הבטן','יורדים לאט','שוכבים'],
 good:['הברכיים כפופות, כפות הרגליים על הרצפה','מרימים רק את השכמות, הגב התחתון נשאר צמוד','נושפים בעלייה ויורדים לאט','המבט למעלה, אגרוף בין הסנטר לחזה'],
 bad:[[{t:'הסנטר נצמד לחזה',fix:'שומרים מרחק אגרוף בין הסנטר לחזה. אם הידיים מאחורי הראש, הן רק תומכות. מרימים מהבטן והמבט נשאר למעלה.'},{t:'קמים יותר מדי',fix:'מספיק להרים את השכמות. קימה מלאה מפעילה את הירכיים והגב התחתון.'}],
      [{t:'הסנטר נצמד לחזה',fix:'הראש נשאר ניטרלי, בלי למשוך אותו קדימה, והסנטר רחוק מהחזה.'},{t:'הברכיים נפתחות',fix:'הברכיים נשארות ברוחב האגן לאורך כל התנועה.'}]],
 variants:[{n:'ידיים ליד האוזניים',V:{}},{n:'ידיים על החזה',V:{cross:1}}],
 views:[crunchSide,crunchTop]});
})();

/* ---------- 2. PLANK (forearm plank, a hold) ---------- */
(function(){const C=window.__CC;
function plankSide(e,bd,V){const mic=e*1.0+Math.sin(e*42)*.45*e;
 const Sx=300,S=[Sx,G-37],E=[Sx-1,G-5],W=[Sx+26,G-4.5];
 const a1=(bd===0?4.8+(15-4.8)*e:bd===1?4.8+(-10-4.8)*e:4.8)+mic*.35*(bd<0?1:0.2);
 const H=add(S,[-Math.cos(a1*R)*56,Math.sin(a1*R)*56]),Ay=G-24,sa=clamp((Ay-H[1])/97.5,-1,1),a2=Math.asin(sa);
 const A=add(H,[-Math.cos(a2)*97.5,Math.sin(a2)*97.5]),K=lerp(H,A,50/98);
 const hu=nrm(sub(S,H)),hu2=rot(hu,-14);
 const s=floorSvg()+C.sideC({H,S,hu:hu2,hot:{abs:true},near:{el:E,wr:W,kn:K,an:A,f:[-.1,1]},far:{el:add(E,[0,0]),wr:add(W,[0,0]),kn:add(K,[1,0]),an:add(A,[2,0]),f:[-.1,1]}});
 return s+(bd===0?mark(add(H,[0,4]),20)+cross('האגן שוקע'):bd===1?mark(add(H,[0,-4]),20)+cross('האגן גבוה מדי'):tick('קו ישר מהראש עד העקבים'))}
function plankTop(e,bd,V){const mic=e+Math.sin(e*42)*.4*e;
 const N=[200,118],P0=[200,174],sw=bd===0?e*17:0,P=[P0[0]+sw,P0[1]];
 const SL=[N[0]-24,N[1]],SR=[N[0]+24,N[1]],wide=bd===1?e*15:0;
 const eL=[SL[0]-wide,SL[1]+3],eR=[SR[0]+wide,SR[1]+3],wL=[N[0]-23-wide*.2,N[1]-31],wR=[N[0]+23+wide*.2,N[1]-31];
 const HL=[P[0]-14,P[1]],HR=[P[0]+14,P[1]],aL=[205-14,P0[1]+98],aR=[205+14,P0[1]+98];
 const kL=lerp(HL,[200-8,P0[1]+98],.5),kR=lerp(HR,[200+8,P0[1]+98],.5);
 const aLf=[200-8,P0[1]+98],aRf=[200+8,P0[1]+98];
 const s=bgTop+C.matTop(200,N[1]-46,P0[1]+118,66)+bodyFront({N,P,SL,SR,HL,HR,back:true,hot:{lowback:true},noLegs:true,L:{el:eL,wr:wL},Rr:{el:eR,wr:wR}})
  +C.legTop(HL,kL,aLf,1,[0,1],{nofoot:1})+C.legTop(HR,kR,aRf,1,[0,1],{nofoot:1})+ell(add(aLf,[0,5]),5.5,7.5,0,WH)+ell(add(aRf,[0,5]),5.5,7.5,0,WH);
 return s+(bd===0?mark(P,22)+cross('האגן זז הצידה'):bd===1?mark(eL,15)+mark(eR,15)+cross('המרפקים רחוקים מדי'):tick('המרפקים מתחת לכתפיים'))}
PAT.push({id:'plank',n:'פלאנק',m:'שרירי הבטן והליבה',v:['מהצד','מלמעלה'],ph:['נכנסים לעמדה','מחזיקים ונושמים','ממשיכים להחזיק','מנוחה'],
 good:['המרפקים ישר מתחת לכתפיים','גוף ישר כמו קרש, מהראש עד העקבים','מכווצים בטן ועכוז, נושמים רגיל','המבט לרצפה והצוואר ארוך'],
 bad:[[{t:'האגן שוקע',fix:'מכווצים את הבטן והעכוז ומחזירים את האגן לקו ישר עם הכתפיים והעקבים.'},{t:'האגן גבוה מדי',fix:'מורידים את האגן עד שהגוף בקו ישר. הבטן עובדת, לא הכתפיים.'}],
      [{t:'האגן זז הצידה',fix:'האגן נשאר ישר באמצע ושני הצדדים עובדים שווה. מקרבים את הרגליים אם צריך.'},{t:'המרפקים רחוקים מדי',fix:'המרפקים ברוחב הכתפיים, הזרועות מקבילות זו לזו.'}]],
 views:[plankSide,plankTop]});
})();

/* ---------- 3. LEG RAISE ---------- */
(function(){const C=window.__CC,FL=G-13,dv=a=>[Math.sin(a*R),-Math.cos(a*R)]; // angle from vertical toward the feet side
function legRaiseSide(e,bd,V){ // e=0 legs vertical, e=1 lowest (hovering)
 const H=[250,FL],S=[194,FL],psi=90-e*82; // elevation above floor
 let tA=psi,sA=psi;if(bd===1){tA=90-e*48;sA=90-e*82}
 const d1=[Math.cos(tA*R),-Math.sin(tA*R)],d2=[Math.cos(sA*R),-Math.sin(sA*R)];
 const K=add(H,mul(d1,50)),A=add(K,mul(d2,48)),K2=add(H,mul(d1,50)),A2=add(K2,mul(d2,48)),sh=[-d2[1],d2[0]];
 const bend=bd===0?15*e:0,W=[H[0]-4,G-5],E=ik(S,W,D.uarm,D.farm,[0,-1]);
 const s=floorSvg()+C.sideC({H,S,bend,hot:{abs:true},near:{el:E,wr:W,kn:K,an:A,f:rot(d2,-90)},far:{el:add(E,[-3,0]),wr:add(W,[-3,0]),kn:add(K2,[1,-1]),an:add(A2,[2,-1]),f:rot(d2,-90)}});
 return s+(bd===0?mark(lerp(H,S,.4).map((v,i)=>v+(i?-12:0)),19)+cross('הגב התחתון נעקר'):bd===1?mark(K,17)+cross('הברכיים מתכופפות'):tick('הגב התחתון צמוד לרצפה'))}
function legRaiseTop(e,bd,V){
 const P=[200,150],lift=bd===1?e*40*R:0,N=[200,P[1]-(20+36*Math.cos(lift))],SL=[N[0]-24,N[1]],SR=[N[0]+24,N[1]];
 const psi=(90-e*82)*R,sp=bd===0?e*18:0,s1=1+.22*Math.sin(psi),HL=[P[0]-14,P[1]],HR=[P[0]+14,P[1]];
 const prj=L=>L*Math.cos(psi)+.2*L*Math.sin(psi);
 const kL=[HL[0]-sp*.5,HL[1]+prj(50)],aL=[HL[0]-sp,kL[1]+prj(48)],kR=[HR[0]+sp*.5,HR[1]+prj(50)],aR=[HR[0]+sp,kR[1]+prj(48)];
 const hd=[N[0],N[1]-22.5+(bd===1?12*e:0)];
 const s=bgTop+C.matTop(200,N[1]-52,P[1]+112,62)+bodyFront({N,P,SL,SR,HL,HR,hd,hot:{abs:true},noLegs:true,L:{el:[SL[0]+3,SL[1]+28],wr:[P[0]-22,P[1]-2]},Rr:{el:[SR[0]-3,SR[1]+28],wr:[P[0]+22,P[1]-2]}})
  +C.legTop(HL,kL,aL,s1,[0,1])+C.legTop(HR,kR,aR,s1,[0,1]);
 return s+(bd===0?mark(aL,18)+mark(aR,18)+cross('הרגליים נפתחות'):bd===1?mark(hd,19)+cross('הראש והכתפיים מורמים'):tick('הרגליים צמודות וישרות'))}
PAT.push({id:'leg_raise',n:'הרמת רגליים',m:'הבטן התחתונה',v:['מהצד','מלמעלה'],ph:['מורידים לאט','עוצרים נמוך','מרימים','רגליים למעלה'],
 good:['שוכבים על הגב, הידיים לצד הגוף','הרגליים ישרות ועולות עד אנך','מורידים לאט, בלי שהגב התחתון מתקער','נושפים בעלייה ונושמים בירידה'],
 bad:[[{t:'הגב התחתון נעקר',fix:'מורידים את הרגליים רק עד המקום שבו הגב התחתון עדיין צמוד לרצפה. אפשר לכופף ברכיים קלות כהקלה.'},{t:'הברכיים מתכופפות',fix:'משאירים את הרגליים ישרות. אם קשה, מורידים פחות נמוך.'}],
      [{t:'הרגליים נפתחות',fix:'מצמידים את הרגליים זו לזו ושומרים אותן באמצע.'},{t:'הראש והכתפיים מורמים',fix:'הראש והכתפיים נשארים על הרצפה והצוואר רפוי.'}]],
 views:[legRaiseSide,legRaiseTop]});
})();

/* ---------- 4. DEAD BUG ---------- */
(function(){const C=window.__CC,FL=G-13;
function deadSide(e,bd,V){
 const H=[240,FL],S=[184,FL],t=e*80*R,dir=[-Math.sin(t),-Math.cos(t)];
 const W=add(S,mul(dir,58)),E=ik(S,W,D.uarm,D.farm,[.4,-1]),W2=add(S,[2,-58]),E2=add(S,[1,-30]);
 const K=add(H,[2,-50]),A=add(K,[48,0]),th1=e*75*R,th2=(90-15*e)*R,d2=[Math.sin(th2),-Math.cos(th2)];
 const K2=add(H,[Math.sin(th1)*50,-Math.cos(th1)*50]),A2=add(K2,mul(d2,48));
 const base=[-1,0],hu=bd===1?rot(base,30*e):base,bend=bd===0?15*e:0;
 const s=floorSvg()+C.sideC({H,S,hu,bend,hot:{abs:true},near:{el:E,wr:W,kn:K,an:A,f:[0,-1]},far:{el:E2,wr:W2,kn:K2,an:A2,f:rot(d2,-90)}});
 return s+(bd===0?mark(lerp(H,S,.4).map((v,i)=>v+(i?-12:0)),19)+cross('הגב התחתון נעקר'):bd===1?mark(add(S,mul(hu,22)),19)+cross('הראש מתרומם'):tick('הגב התחתון צמוד לרצפה'))}
function deadTop(e,bd,V){
 const P=[200,150],N=[200,94],SL=[176,94],SR=[224,94],t=e*80*R,HL=[186,P[1]],HR=[214,P[1]],ob=.25;
 const sw=bd===0?e*30:0; // arm out to the side instead of overhead
 const wL=bd===0?[SL[0]-sw*.9,SL[1]-(58*Math.sin(t))*(1-.55*e)+ob*58*Math.cos(t)]:[SL[0]-1,SL[1]-58*Math.sin(t)+ob*58*Math.cos(t)];
 const eL=lerp(SL,wL,.52),wR=[SR[0]+1,SR[1]+ob*58],eR=lerp(SR,wR,.5);
 const th1=e*75*R,th2=(90-15*e)*R,spl=bd===1?e*22:0;
 const kT=[HL[0]-1,HL[1]+ob*50],aT=[kT[0],kT[1]+48];
 const kE=[HR[0]+spl*.4,HR[1]+50*Math.sin(th1)+ob*50*Math.cos(th1)],aE=[kE[0]+spl*.6,kE[1]+48*Math.sin(th2)+ob*48*Math.cos(th2)];
 const s=bgTop+C.matTop(200,N[1]-52,P[1]+114,70)+bodyFront({N,P,SL,SR,HL,HR,hot:{abs:true},noLegs:true,L:{el:eL,wr:wL},Rr:{el:eR,wr:wR}})
  +C.legTop(HL,kT,aT,1.12,[0,1])+C.legTop(HR,kE,aE,1.05+.1*Math.cos(th1),[0,1]);
 return s+(bd===0?mark(wL,17)+cross('היד יוצאת הצידה'):bd===1?mark(aE,18)+cross('הרגל נפתחת הצידה'):tick('יד ורגל נגדיות, באמצע'))}
PAT.push({id:'dead_bug',n:'דד באג',m:'שרירי הבטן והליבה',v:['מהצד','מלמעלה'],ph:['מותחים יד ורגל','מחזיקים נמוך','חוזרים לאמצע','ידיים ורגליים למעלה'],
 good:['שוכבים, ידיים למעלה וברכיים ב-90 מעלות','יד אחת ורגל נגדית מתיישרות לאט','הגב התחתון נשאר צמוד לרצפה','חוזרים לאמצע ומחליפים צד'],
 bad:[[{t:'הגב התחתון נעקר',fix:'מקצרים את הטווח: מתחילים עם רגל שיורדת פחות ומצמידים את הגב לרצפה.'},{t:'הראש מתרומם',fix:'הראש נשאר על הרצפה והצוואר רפוי.'}],
      [{t:'היד יוצאת הצידה',fix:'היד נמתחת ישר מעל הראש, בקו עם הכתף.'},{t:'הרגל נפתחת הצידה',fix:'הרגל נמתחת ישר קדימה ולא נפתחת החוצה.'}]],
 views:[deadSide,deadTop]});
})();
/* ---------- 5. CABLE / MACHINE CRUNCH ---------- */
(function(){const C=window.__CC;
const ut=th=>[Math.sin(th*R),-Math.cos(th*R)];                 // upright-based torso direction (deg forward)
function spine(H,th){const L=add(H,mul(ut(th*.3),20)),S=add(L,mul(ut(th),36)),c=lerp(H,S,.45),u=nrm(sub(S,H)),n=[-u[1],u[0]];return{L,S,bend:dot(sub(L,c),n),u:ut(th)}}
function ropeStr(Pu,W){const d=nrm(sub(W,Pu)),a=sub(W,mul(d,16));return cable(Pu,a)+`<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(W[0])}" y2="${f(W[1])}" stroke="#B9854A" stroke-width="4.5" stroke-linecap="round"/>`}
function cableSide(e,bd,V){
 const KN=[240,G-7.4],AN=[KN[0]-47,G-3];let H=[232,KN[1]-49.4],th=e*52,sp,S,bend,ar=0;
 if(bd===0){const ph=e*50*R;H=add(KN,[-50*Math.sin(ph),-50*Math.cos(ph)]);S=add(H,mul(ut(48*e),56));bend=0;sp={u:ut(48*e)};th=48*e}
 else{if(bd===1)th=e*18;sp=spine(H,th);S=sp.S;bend=sp.bend}
 const hu=rot(sp.u,14*e+ (bd===0?10*e:0)),hd=add(S,mul(hu,21.8)),fc=[-hu[1],hu[0]];
 const Wh=sub(hd,mul(hu,3));let W=Wh;
 if(bd===1)W=lerp(Wh,add(H,[34,-34]),e);
 const E=ik(S,W,D.uarm,D.farm,rot([1,.8],(bd===0?48*e:th)));
 const Pu=[258,G-186],K=KN,A=AN;
 const tower=`<rect x="322" y="${G-206}" width="16" height="${206}" fill="#2B3540"/><rect x="258" y="${G-194}" width="70" height="8" rx="3" fill="#46525F"/>`;
 const s=floorSvg()+tower+pulley(Pu)+ropeStr(Pu,W)+C.sideC({H,S,hu,bend,hot:{abs:true},near:{el:E,wr:W,kn:K,an:A,f:[-1,0]},far:{el:add(E,[-2,0]),wr:add(W,[-2,0]),kn:add(K,[-3,0]),an:add(A,[-3,0]),f:[-1,0]}});
 return s+(bd===0?mark(H,19)+cross('הירכיים זזות אחורה'):bd===1?mark(W,17)+cross('מושכים עם הידיים'):tick('הירכיים במקום, העמוד מתעגל'))}
function machineSide(e,bd,V){
 const H0=[232,G-58.8],H=bd===0?[H0[0]+2*e,H0[1]-13*e]:H0,th=bd===1?-6+e*14:-6+e*58,sp=spine(H,th),S=sp.S,Fu=[Math.cos(th*R),Math.sin(th*R)],u=sp.u;
 const hu=rot(u,10+8*e),K=add(H0,[50,2]),A=[K[0]+4,G-9];
 const Q=add(add(S,mul(Fu,13)),mul(u,-6)),Q0=(()=>{const s0=spine(H,-6),F0=[Math.cos(-6*R),Math.sin(-6*R)];return add(add(s0.S,mul(F0,13)),mul(s0.u,-6))})(),
  Q1=(()=>{const s0=spine(H,52),F0=[Math.cos(52*R),Math.sin(52*R)];return add(add(s0.S,mul(F0,13)),mul(s0.u,-6))})();
 const mq=lerp(Q0,Q1,.5),dq=nrm(sub(Q1,Q0));let pp=[-dq[1],dq[0]];if(pp[1]>0)pp=mul(pp,-1);const Pv=add(mq,mul(pp,100));
 const W=add(add(Q,mul(Fu,6)),mul(u,5)),E=ik(S,W,D.uarm,D.farm,[.3,1]);
 const frame=`<rect x="${Pv[0]+10}" y="${Pv[1]-8}" width="16" height="${G-Pv[1]+8}" fill="#2B3540"/>`+pad([H[0]-20,H[1]+14],[H[0]+30,H[1]+14],11)+pad([H[0]-4,H[1]+19],[H[0]-4,G],8,'#2B3540')+pad([H[0]-22,H[1]+2],[H[0]-30,H[1]-84],10);
 const lever=`<line x1="${f(Pv[0])}" y1="${f(Pv[1])}" x2="${f(Q[0])}" y2="${f(Q[1])}" stroke="${BAR}" stroke-width="7" stroke-linecap="round"/>`+circ(Pv,8,'#46525F')+circ(Pv,3,'#9AA5B1')+pad(add(Q,mul(u,15)),sub(Q,mul(u,15)),10,'#58667A');
 const s=floorSvg()+frame+C.sideC({H,S,hu,bend:sp.bend,hot:{abs:true},nearUnder:'',near:{el:E,wr:W,kn:K,an:A,f:[1,0]},far:{el:add(E,[-2,0]),wr:add(W,[-2,0]),kn:add(K,[0,-2]),an:add(A,[3,0]),f:[1,0]},over:lever+circ(W,4.4,SK)});
 return s+(bd===0?mark(H,19)+cross('הירכיים מתרוממות'):bd===1?mark(S,19)+cross('הכתפיים כמעט לא יורדות'):tick('מכווצים את הבטן, הירכיים יציבות'))}
function crunchSideAll(e,bd,V){return V&&V.machine?machineSide(e,bd,V):cableSide(e,bd,V)}
function cableFront(e,bd,V){V=V||{};
 const th=e*56,tw=bd===0?e*16*R:0;
 const Pb=V.machine?[190,G-58]:[190,G-57],P=bd===1?[Pb[0],Pb[1]-e*10]:Pb;
 const tl=20*Math.cos(th*R*.3)+36*Math.cos(th*R),N=[190+(bd===0?e*9:0),P[1]-tl],ax=nrm(sub(P,N));
 const SL=[N[0]-24*Math.cos(tw),N[1]+24*Math.sin(tw)*-1],SR=[N[0]+24*Math.cos(tw),N[1]+24*Math.sin(tw)];
 const hd=[N[0]+(bd===0?e*4:0),N[1]-22.5*Math.cos((th*.55+10*e)*R)+(th>0?2*e:0)],HL=[P[0]-14,P[1]],HR=[P[0]+14,P[1]];
 const WL=V.machine?[N[0]-30,N[1]+22+e*6]:[hd[0]-17,hd[1]+7],WR=V.machine?[N[0]+30,N[1]+22+e*6]:[hd[0]+17,hd[1]+7];
 let wl=WL,wr=WR;if(bd===1&&!V.machine){wl=lerp(WL,[N[0]-18,N[1]+30],e);wr=lerp(WR,[N[0]+18,N[1]+30],e)}
 const aL={el:ik(SL,wl,D.uarm,D.farm,[-.5,1]),wr:wl},aR={el:ik(SR,wr,D.uarm,D.farm,[.5,1]),wr:wr};
 let st='';
 if(V.machine){
  const Kl=[P[0]-17,P[1]+6],Kr=[P[0]+17,P[1]+6];
  st=bgTop===undefined?'':'';
  const seat=`<rect x="${P[0]-30}" y="${P[1]+9}" width="60" height="11" rx="5" fill="${PAD}"/><rect x="${P[0]-5}" y="${P[1]+20}" width="10" height="${G-P[1]-20}" fill="#2B3540"/><rect x="${P[0]-40}" y="${N[1]-60}" width="80" height="6" rx="3" fill="#2B3540"/>`;
  const lev=`<line x1="${f(N[0]-36)}" y1="${f(N[1]-58)}" x2="${f(WL[0]-4)}" y2="${f(WL[1]-2)}" stroke="${BAR}" stroke-width="6" stroke-linecap="round"/><line x1="${f(N[0]+36)}" y1="${f(N[1]-58)}" x2="${f(WR[0]+4)}" y2="${f(WR[1]-2)}" stroke="${BAR}" stroke-width="6" stroke-linecap="round"/>`;
  const padc=pad([N[0]-34,N[1]+12+e*4],[N[0]+34,N[1]+12+e*4],14,'#58667A');
  return floorSvg()+seat+lev+bodyFront({N,P,SL,SR,HL,HR,hd,hot:{abs:true},L:{el:aL.el,wr:aL.wr,kn:Kl,an:[P[0]-19,G-9]},Rr:{el:aR.el,wr:aR.wr,kn:Kr,an:[P[0]+19,G-9]},toes:[-3,3]})+padc+circ(WL,4.4,SK)+circ(WR,4.4,SK)
   +(bd===0?mark(SL,16)+mark(SR,16)+cross('הגוף מתפתל לצד'):bd===1?mark(P,22)+cross('הירכיים מתרוממות'):tick('שני הצדדים עובדים שווה'))}
 const Kl=[P[0]-17,G-8],Kr=[P[0]+17,G-8],Pu=[190,G-190];
 const ropeMid=[(wl[0]+wr[0])/2,(wl[1]+wr[1])/2];
 const legs=C.legTop(HL,Kl,Kl,1,[0,1],{nofoot:1})+C.legTop(HR,Kr,Kr,1,[0,1],{nofoot:1});
 const s=floorSvg()+`<rect x="130" y="${G-198}" width="120" height="9" rx="4" fill="#2B3540"/>`+pulley(Pu)+cable(Pu,ropeMid)+legs+`<line x1="${f(wl[0])}" y1="${f(wl[1])}" x2="${f(wr[0])}" y2="${f(wr[1])}" stroke="#B9854A" stroke-width="4.5" stroke-linecap="round"/>`+bodyFront({N,P,SL,SR,HL,HR,hd,hot:{abs:true},noLegs:true,L:aL,Rr:aR})+circ(wl,4.4,SK)+circ(wr,4.4,SK);
 return s+(bd===0?mark(SL,16)+mark(SR,16)+cross('הגוף מתפתל לצד'):bd===1?mark(P,22)+cross('הירכיים מתרוממות'):tick('שני הצדדים עובדים שווה'))}
PAT.push({id:'cable_crunch',n:'קרנץ׳ בכבל / במכונה',m:'שרירי הבטן',v:['מהצד','מלפנים'],ph:['מעגלים את הגב','לוחצים את הבטן','חוזרים לאט','ישרים'],
 good:['הירכיים נשארות במקום, רק הגב העליון יורד','מעגלים את עמוד השדרה, לא מתקפלים מהירכיים','הידיים נשארות צמודות לראש ולא מושכות','חוזרים לאט ועוצרים לפני שהגב נפתח לגמרי'],
 bad:[[{t:'הירכיים זזות אחורה',fix:'הירכיים קבועות מעל הברכיים. הכיפוף בא מהבטן ולא מהירכיים.'},{t:'מושכים עם הידיים',fix:'הידיים רק מחזיקות את החבל ליד הראש, והבטן היא שמורידה את הגוף.'}],
      [{t:'הגוף מתפתל לצד',fix:'יורדים ישר קדימה, שני הכתפיים באותו גובה.'},{t:'הירכיים מתרוממות',fix:'הירכיים נשארות במקום, על הברכיים או על המושב.'}]],
 variants:[{n:'בכבל',V:{}},{n:'במכונה',V:{machine:1}}],
 views:[crunchSideAll,cableFront]});
})();

/* ---------- 6. CABLE TWIST ---------- */
(function(){const C=window.__CC;
const phi=e=>(52-e*95)*R;
function twistFront(e,bd,V){
 const P=[190,155],N=[190,99],ph=phi(e),psi=bd===0?ph*.85:0,d=bd===1?52-26*e:52,sx=Math.sin(ph),cx=Math.cos(ph);
 const SL=[N[0]-24*cx,N[1]],SR=[N[0]+24*cx,N[1]],W=[N[0]+d*sx,N[1]+18];
 const pc=Math.cos(psi),ps=Math.sin(psi),HL=[P[0]-14*pc,P[1]],HR=[P[0]+14*pc,P[1]];
 const ank=[[P[0]-21,G-9],[P[0]+21,G-9]];
 const kn=[[P[0]-17*pc-(-ps)*10,G-9-D.shin],[P[0]+17*pc+ps*10,G-9-D.shin]].map((k,i)=>[k[0]+ (i?0:0),k[1]]);
 let aL,aR;
 if(bd===1){aL={el:ik(SL,W,D.uarm,D.farm,[-.2,1]),wr:W};aR={el:ik(SR,W,D.uarm,D.farm,[.2,1]),wr:W}}
 else{aL={el:lerp(SL,W,.5),wr:W};aR={el:lerp(SR,W,.5),wr:W}}
 const px=N[0]+150,tower=`<rect x="${px-14}" y="${G-232}" width="36" height="232" fill="#2B3540"/><rect x="${px-4}" y="${G-224}" width="9" height="212" fill="#1B222A"/><rect x="${px-24}" y="${W[1]-10}" width="30" height="20" rx="4" fill="#46525F"/>`;
 const obl=sx=>{const a=[N[0]+sx*(D.sw-11),N[1]+34],b=[N[0]+sx*(D.sw-8),N[1]+40],c=[N[0]+sx*(D.hw+5),P[1]-6],dd=[N[0]+sx*(D.hw+1),P[1]-8];return `<polygon points="${pts([a,b,c,dd])}" fill="${hot()}"/>`};
 const s=floorSvg()+tower+pulley([px-18,W[1]])+cable([px-18,W[1]],W)+bodyFront({N,P,SL,SR,HL,HR,hot:{abs:true},L:{el:aL.el,wr:aL.wr,kn:kn[0],an:ank[0]},Rr:{el:aR.el,wr:aR.wr,kn:kn[1],an:ank[1]},toes:[-3,3]})+obl(-1)+obl(1)
  +`<rect x="${W[0]-5}" y="${W[1]-5}" width="10" height="10" rx="3" fill="#B9854A"/>`;
 return s+(bd===0?mark(P,26)+cross('הירכיים מסתובבות'):bd===1?mark(aL.el,15)+mark(aR.el,15)+cross('המרפקים מתקפלים'):tick('מסובבים את הגו, האגן יציב'))}
function twistTop(e,bd,V){
 const Cn=[190,140],ph=phi(e),psi=bd===0?ph*.85:0,d=bd===1?52-26*e:52,fv=[Math.sin(ph),Math.cos(ph)],rv=[Math.cos(ph),-Math.sin(ph)];
 const SLp=sub(Cn,mul(rv,24)),SRp=add(Cn,mul(rv,24)),W=add(Cn,mul(fv,d));
 const px=Cn[0]+150,Pp=[px-18,Cn[1]+26];
 const pr=Math.cos(psi),fvp=[Math.sin(psi),Math.cos(psi)];
 const shoes=[-1,1].map(sg=>limb([Cn[0]+sg*21,Cn[1]+22],[Cn[0]+sg*21,Cn[1]+38],5,4.5,WH)).join('');
 const arm=S0=>{const E=bd===1?ik(S0,W,D.uarm,D.farm,[S0[0]<Cn[0]?-.4:.4,.3]):lerp(S0,W,.5);return limb(S0,E,6.3,5,SK)+limb(E,W,5,3.5,SK)+circ(S0,7,SK)};
 const tower=`<rect x="${px-14}" y="${Cn[1]-40}" width="36" height="120" rx="3" fill="#2B3540"/><rect x="${px-4}" y="${Cn[1]-34}" width="9" height="108" fill="#1B222A"/>`;
 const s=bgTop+tower+shoes+ell(add(Cn,[0,10]),20,11,-psi/R,PN)+ell(add(Cn,[0,8]),16,8,-ph/R*.6,SK)+
  ell(Cn,27,11.5,-ph/R,SK)+ell(add(Cn,mul(fv,2)),22,6,-ph/R,SKL,.45)+arm(SLp)+arm(SRp)+
  circ(add(Cn,mul(fv,1)),D.headR,HAIR)+ell(add(Cn,add(mul(fv,11),mul(rv,0))),5.5,3.6,-ph/R,SK)+ell(add(Cn,mul(rv,-13)),2.2,3.8,-ph/R,SK)+ell(add(Cn,mul(rv,13)),2.2,3.8,-ph/R,SK)+
  `<line x1="${f(Pp[0])}" y1="${f(Pp[1])}" x2="${f(W[0])}" y2="${f(W[1])}" stroke="#8791A0" stroke-width="2"/>`+pulley(Pp)+`<circle cx="${f(W[0])}" cy="${f(W[1])}" r="5" fill="#B9854A"/>`;
 return s+(bd===0?mark(add(Cn,[0,10]),27)+cross('הירכיים מסתובבות'):bd===1?mark(W,15)+cross('הידיים מתקפלות'):tick('מסתובבים מהגו, האגן יציב'))}
PAT.push({id:'cable_twist',n:'סיבוב גו בכבל',m:'שרירי הבטן הצדדיים',v:['מלפנים','מלמעלה'],ph:['מסובבים את הגו','לוחצים בצד','חוזרים לאט','מול הכבל'],
 good:['עומדים עם הצד לכבל, רגליים ברוחב הכתפיים','הכבל בגובה החזה והידיים ישרות','מסתובבים מהגו, האגן פונה קדימה','חוזרים לאט ובשליטה'],
 bad:[[{t:'הירכיים מסתובבות',fix:'מקבעים את הרגליים והאגן ומסובבים רק את הכתפיים והחזה.'},{t:'המרפקים מתקפלים',fix:'הידיים נשארות ישרות, המרפקים לא מושכים את הכבל.'}],
      [{t:'הירכיים מסתובבות',fix:'האגן נשאר פונה קדימה לאורך כל התנועה.'},{t:'הידיים מתקפלות',fix:'מותחים את הידיים לפנים ומסובבים רק את הגו.'}]],
 views:[twistFront,twistTop]});
})();
/* ---------- gait helpers shared by walk + jog (namespaced) ---------- */
(function(){const C=window.__CC;
const sm=t=>t*t*(3-2*t),cl=clamp;
C.sm=sm;
/* one leg, phase q in [0,1): returns {x (rel. to hip), lf (ankle lift), ang (foot pitch, deg, toe up +)} */
C.footTraj=(q,P)=>{q=((q%1)+1)%1;const d=P.d,s=P.s,xc=P.xc||0;let x,lf,ang;
 const AT=Math.asin(cl(P.hr/21,0,1))/R,A0=P.a0;
 if(q<d){const u=q/d;x=xc+s/2-s*u;lf=P.hr*sm(cl((u-.62)/.38,0,1));ang=A0*Math.pow(Math.max(0,1-u/.2),2)-Math.asin(cl(lf/21,0,1))/R}
 else{const u=(q-d)/(1-d),m=-s/d*(1-d),b=3*s-3*m,a=2*m-2*s;x=xc-s/2+m*u+b*u*u+a*u*u*u;lf=P.hr*Math.pow(1-u,2)+P.lift*Math.sin(Math.PI*u);
  ang=-AT*(1-sm(cl(u/.65,0,1)))+A0*sm(cl((u-.5)/.5,0,1))}
 return{x,lf,ang}};
/* full sagittal pose of a gait cycle. P: {hx,gy,hipH,amp,sgn,s,d,xc,hr,lift,a0,lean,armA,armB,armV,headDn,march}. */
C.gait=(e,P)=>{const gy=P.gy||G,hx=P.hx||200,TP=2*Math.PI;let H,legs=[],arms=[];
 if(P.march){
  const hh=P.hipH+1.6*Math.cos(2*TP*e);H=[hx,gy-9-hh];
  for(const off of [0,.5]){const ph=((e+off)%1+1)%1,m=ph<.5?Math.sin(Math.PI*ph*2):0,mm=sm(m),tt=82*mm*R,ts=(82*mm-(10+78*mm)*(m>0?1:0))*R;
   const K=add(H,[Math.sin(tt)*50,Math.cos(tt)*50]),A=add(K,[Math.sin(ts)*48,Math.cos(ts)*48]);
   const Ar=m>0?A:[hx+2-off*3,gy-9];legs.push({K:m>0?K:ik(H,Ar,50,48,[1,0]),A:Ar,f:[Math.cos(-20*mm*R),-Math.sin(-20*mm*R)],lf:m>0?1:0})}
 }else{
  const ph=2*TP*(e-P.d/2);H=[hx,gy-9-(P.hipH+P.sgn*P.amp*Math.cos(ph))];
  for(const off of [0,.5]){const t=C.footTraj(e+off,P),A=reach(H,[hx+t.x,gy-9-t.lf],50,48),K=ik(H,A,50,48,[1,0]);
   legs.push({K,A,f:[Math.cos(t.ang*R),-Math.sin(t.ang*R)],x:t.x,lf:t.lf,st:((e+off)%1)<P.d?1:0})}
 }
 const lean=P.lean||0,S=add(H,rot([0,-56],lean)),u=nrm(sub(S,H)),hu=rot(u,-lean*.5+(P.headDn||0));
 for(const sg of [-1,1]){ // near arm opposes the near leg
  const a=(P.march?sg*-1*Math.sin(TP*e):sg*-1*Math.cos(TP*e))*P.armA*R*(sg<0?1:1),fw=(sg*(P.march?-Math.sin(TP*e):-Math.cos(TP*e))+1)/2,
   fl=(P.armB+P.armV*sm(fw))*R,E=add(S,[Math.sin(a)*32,Math.cos(a)*32]),W=add(E,[Math.sin(a+fl)*30,Math.cos(a+fl)*30]);
  arms.push({E,W,fl:fl/R,a})}
 // arms[0]: sg=-1 -> far? we want arms[0]=near: near arm = opposite of near leg => cos sign -1 ; far arm sign +1
 return{H,S,hu,legs,arms:[arms[1],arms[0]],lean}};
/* sagittal pose -> side svg (near leg=legs[0]) */
C.gaitSide=(pz,hot)=>{const [n,fr]=pz.legs,[an,af]=pz.arms;
 return C.sideC({H:pz.H,S:pz.S,hu:pz.hu,hot:hot,near:{el:an.E,wr:an.W,kn:n.K,an:n.A,f:n.f},far:{el:af.E,wr:af.W,kn:fr.K,an:fr.A,f:fr.f}})};
/* scrolling ground ticks. speed = px of ground per cycle; n = ticks per cycle shift */
C.ticks=(e,hx,y,speed,lam,span,col)=>{let s='';const off=((-e*speed)%lam+lam)%lam;for(let x=hx-span;x<=hx+span;x+=lam){const X=x+off;if(X>hx-span&&X<hx+span)s+=`<rect x="${f(X)}" y="${y+7}" width="16" height="3" rx="1.5" fill="${col||'#2E3A46'}"/>`}return s};
/* front view from the sagittal pose */
C.gaitFront=(e,pz,o)=>{o=o||{};const cx=190,sway=o.sway==null?3:o.sway,d=o.d,gy=o.gy||G,st=o.stance||17,TP=2*Math.PI;
 const ph=Math.cos(TP*(e-d/2)),Px=cx-sway*ph,H=pz.H,S=pz.S;
 const P=[Px,H[1]],N=[cx+.5*sway*ph+(o.nx||0),S[1]+(o.ny||0)];
 const SL=[N[0]-D.sw,N[1]+(o.shrug?-7:0)],SR=[N[0]+D.sw,N[1]+(o.shrug?-7:0)],HL=[P[0]-D.hw,P[1]],HR=[P[0]+D.hw,P[1]];
 const lg=[0,1].map(i=>{const sg=i?1:-1,l=pz.legs[i],cave=o.cave?(l.st?1:0):0,hip=i?HR:HL;
  return{kn:[P[0]+sg*(st*.96)-sg*cave*14,l.K[1]],an:[P[0]+sg*st+(o.stepOut?sg*o.stepOut:0),l.A[1]]}});
 const arm=(i,S0)=>{const sg=i?1:-1,a=pz.arms[i],k=cl(a.fl/90,0,1),cross=o.armCross?k*(o.armCross):0;
  return{el:[S0[0]+sg*3+(S0[1]-S[1]),a.E[1]+(S0[1]-S[1])],wr:[S0[0]-sg*(2+8*k)-sg*cross*1.0,a.W[1]+(S0[1]-S[1])]}};
 const aL=arm(0,SL),aR=arm(1,SR);
 return{N,P,SL,SR,HL,HR,L:{el:aL.el,wr:aL.wr,kn:lg[0].kn,an:lg[0].an},Rr:{el:aR.el,wr:aR.wr,kn:lg[1].kn,an:lg[1].an}}};
})();

/* ---------- 7. WALK ---------- */
(function(){const C=window.__CC;
const HOT={quads:true,hams:true,calves:true,glutes:true};
const MODES={easy:{s:52,d:.62,hr:10,lift:11,a0:13,hipH:93,amp:1.8,sgn:1,lean:2,armA:20,armB:14,armV:12},
 brisk:{s:64,d:.58,hr:10.5,lift:12,a0:14,hipH:93,amp:2,sgn:1,lean:5,armA:34,armB:62,armV:18},
 march:{march:1,hipH:95,armA:32,armB:78,armV:6}};
function P_(V,bd){V=V||{};const m=Object.assign({},MODES[V.mode||'easy']);m.hx=200;
 if(bd===0&&m.march){m.lean=18;m.headDn=24}else if(bd===0){m.lean=(m.lean||0)+15;m.headDn=24}
 if(bd===1){m.lean=-13}
 return m}
function walkSide(e,bd,V){const P=P_(V,bd),pz=C.gait(e,P);
 let s=floorSvg();if(!P.march)s+=C.ticks(e,200,G,P.s/P.d,(P.s/P.d)/2,100);
 s+=C.gaitSide(pz,HOT);
 return s+(bd===0?mark(add(pz.S,mul(pz.hu,10)),20)+cross('הגב מתעגל והראש יורד'):bd===1?mark(add(pz.S,[-4,14]),20)+cross('הגוף נשען אחורה'):tick(V&&V.mode==='march'?'הברכיים עולות לגובה הירך':'צעד רגוע, הידיים מתנדנדות'))}
function walkFront(e,bd,V){const P=P_(V,-1),pz=C.gait(e,P),o={d:P.d||.5,sway:P.march?2:3};
 if(bd===0){o.stepOut=12;o.stance=24;o.sway=7}if(bd===1){o.shrug=1}
 const b=C.gaitFront(e,pz,o);
 const s=floorSvg()+bodyFront(Object.assign({hot:{quads:true,hams:true},toes:[-3,3]},b));
 return s+(bd===0?mark(b.L.an,17)+mark(b.Rr.an,17)+cross('הרגליים רחבות מדי'):bd===1?mark(b.SL,15)+mark(b.SR,15)+cross('הכתפיים מורמות'):tick('כתפיים רפויות, צעדים ישרים'))}
PAT.push({id:'walk',n:'הליכה',m:'שרירי הרגליים',v:['מהצד','מלפנים'],ph:['צעד אחר צעד','','',''],loop:true,period:1.3,
 good:['גוף זקוף, מבט קדימה','הידיים מתנדנדות בניגוד לרגליים','דורכים מהעקב ומגלגלים לאצבעות','נושמים בנוחות ושומרים על קצב קבוע'],
 bad:[[{t:'הגב מתעגל והראש יורד',fix:'מרימים את המבט קדימה, פותחים את החזה ומחזירים את הגב לישר.'},{t:'הגוף נשען אחורה',fix:'הגוף נשאר זקוף מעל הרגליים ולא נשען אחורה.'}],
      [{t:'הרגליים רחבות מדי',fix:'כפות הרגליים בקו ברוחב האגן והצעדים ישרים קדימה.'},{t:'הכתפיים מורמות',fix:'מורידים את הכתפיים ומרפים את הצוואר והידיים.'}]],
 variants:[{n:'הליכה בקצב נוח',V:{mode:'easy'}},{n:'הליכה לסירוגין',V:{mode:'brisk'}},{n:'צעידה במקום',V:{mode:'march'}}],
 views:[walkSide,walkFront]});
})();

/* ---------- 8. JOG ---------- */
(function(){const C=window.__CC;
const HOT={quads:true,hams:true,calves:true,glutes:true};
const GY=G-12;
function P_(V,bd,tm){const m={s:46,d:.38,xc:-5,hr:12,lift:36,a0:4,hipH:88,amp:4,sgn:-1,lean:8,armA:38,armB:82,armV:10,hx:196,gy:tm?GY:G};
 if(bd===0){m.xc=16;m.a0=28;m.lean=-6;m.lift=26;m.s=44}
 if(bd===1){m.lean=22;m.headDn=26}
 return m}
function treadSide(e,P){const hx=P.hx,x0=hx-130,x1=hx+80,gy=P.gy,v=P.s/P.d,lam=v/2;
 let s=`<rect x="${x0-8}" y="${gy+10}" width="${x1-x0+24}" height="${G-gy-6}" rx="4" fill="#232C35"/><rect x="${x0}" y="${gy}" width="${x1-x0}" height="11" rx="5.5" fill="#2E3944"/>`;
 const off=((-e*v)%lam+lam)%lam;for(let x=x0+6;x<x1-2;x+=lam){const X=x+off;if(X>x0+4&&X<x1-6)s+=`<rect x="${f(X)}" y="${gy+2}" width="14" height="3" rx="1.5" fill="#566474"/>`}
 s+=circ([x0+6,gy+5.5],6,'#46525F')+circ([x1-6,gy+5.5],6,'#46525F');
 const px=x1+12;
 s+=`<line x1="${px}" y1="${gy+8}" x2="${px+6}" y2="${gy-128}" stroke="#46525F" stroke-width="10" stroke-linecap="round"/>`+
  `<rect x="${px-18}" y="${gy-168}" width="62" height="40" rx="7" fill="#2B3540" transform="rotate(-10 ${px+13} ${gy-148})"/><rect x="${px-12}" y="${gy-160}" width="42" height="17" rx="3" fill="#163B2C" transform="rotate(-10 ${px+13} ${gy-148})"/><circle cx="${px+5}" cy="${gy-134}" r="3" fill="#9AA5B1"/><circle cx="${px+16}" cy="${gy-136}" r="3" fill="#6EE787"/>`+
  `<line x1="${px-4}" y1="${gy-104}" x2="${px-58}" y2="${gy-100}" stroke="#8791A0" stroke-width="5" stroke-linecap="round"/>`;
 return s}
function jogSide(e,bd,V){V=V||{};const tm=!!V.tm,P=P_(V,bd,tm),pz=C.gait(e,P);
 let s=floorSvg();s+=tm?treadSide(e,P):C.ticks(e,200,G,P.s/P.d,(P.s/P.d)/2,100);
 s+=C.gaitSide(pz,HOT);
 let fo=pz.legs[0].x>pz.legs[1].x?pz.legs[0].A:pz.legs[1].A;
 return s+(bd===0?mark(fo,18)+cross('נוחתים רחוק מדי קדימה'):bd===1?mark(add(pz.S,mul(pz.hu,10)),20)+cross('הראש יורד והגב מתעגל'):tick('נוחתים מתחת לגוף, גוף נוטה מעט'))}
function treadFront(e,P){const cx=190,gy=P.gy,v=P.s/P.d,lam=v/5;
 let s=`<polygon points="${cx-64},${gy+9} ${cx+64},${gy+9} ${cx+50},${gy-34} ${cx-50},${gy-34}" fill="#2E3944"/>`;
 const off=((e*v)%lam+lam)%lam;
 for(let y=-lam;y<=60;y+=lam){const Y=(gy+9)-(y+off)*.7,t=(gy+9-Y)/43;if(t>0&&t<1){const w=64-14*t;s+=`<line x1="${f(cx-w+4)}" y1="${f(Y)}" x2="${f(cx+w-4)}" y2="${f(Y)}" stroke="#566474" stroke-width="2"/>`}}
 s+=`<rect x="${cx-70}" y="${gy+9}" width="140" height="${G-gy-9}" rx="3" fill="#232C35"/>`+
  `<line x1="${cx-62}" y1="${gy-30}" x2="${cx-62}" y2="${gy-118}" stroke="#46525F" stroke-width="8" stroke-linecap="round"/><line x1="${cx+62}" y1="${gy-30}" x2="${cx+62}" y2="${gy-118}" stroke="#46525F" stroke-width="8" stroke-linecap="round"/>`+
  `<rect x="${cx-62}" y="${gy-134}" width="124" height="30" rx="7" fill="#2B3540"/><rect x="${cx-34}" y="${gy-129}" width="68" height="14" rx="3" fill="#163B2C"/><circle cx="${cx-46}" cy="${gy-112}" r="3" fill="#9AA5B1"/><circle cx="${cx+46}" cy="${gy-112}" r="3" fill="#6EE787"/>`;
 return s}
function jogFront(e,bd,V){V=V||{};const tm=!!V.tm,P=P_(V,-1,tm),pz=C.gait(e,P),o={d:P.d,sway:4,gy:P.gy};
 if(bd===0)o.cave=1;if(bd===1)o.armCross=26;
 const b=C.gaitFront(e,pz,o),gy=P.gy;
 let s=floorSvg();if(tm)s+=treadFront(e,P);
 s+=bodyFront(Object.assign({hot:{quads:true,hams:true},toes:[-3,3]},b));
 const cav=bd===0?(pz.legs[0].st?b.L.kn:pz.legs[1].st?b.Rr.kn:b.L.kn):null;
 return s+(bd===0?mark(cav,17)+cross('הברך נופלת פנימה'):bd===1?mark(b.L.wr,15)+mark(b.Rr.wr,15)+cross('הידיים חוצות את קו האמצע'):tick('הידיים קרובות לגוף, ריצה ישרה'))}
PAT.push({id:'jog',n:'ריצה קלה',m:'שרירי הרגליים',v:['מהצד','מלפנים'],ph:['ריצה קלה','','',''],loop:true,period:.9,
 good:['גוף נוטה מעט קדימה, מבט קדימה','נוחתים בקלות מתחת לגוף ולא על העקב רחוק','זרועות כפופות ב-90 מעלות ומתנדנדות קדימה ואחורה','קצב שמאפשר לדבר'],
 bad:[[{t:'נוחתים רחוק מדי קדימה',fix:'מקצרים את הצעד ונוחתים עם כף הרגל מתחת לגוף, בצעדים קטנים ומהירים יותר.'},{t:'הראש יורד והגב מתעגל',fix:'המבט קדימה, החזה פתוח והגוף נוטה מעט מהקרסוליים.'}],
      [{t:'הברך נופלת פנימה',fix:'הברך נעה באותו קו עם אצבעות כף הרגל. מחזקים ירכיים ועכוז.'},{t:'הידיים חוצות את קו האמצע',fix:'הידיים מתנדנדות ישר קדימה ואחורה, בלי לחצות את החזה.'}]],
 variants:[{n:'ריצה קלה',V:{}},{n:'הליכון',V:{tm:1}}],
 views:[jogSide,jogFront]});
})();
/* ---------- 9. STATIONARY BIKE ---------- */
(function(){const C=window.__CC;
const HOT={quads:true,hams:true,calves:true,glutes:true};
const Cn=[262,G-30],RC=17,HX=222;
const pedal=ps=>[Cn[0]+RC*Math.sin(ps),Cn[1]-RC*Math.cos(ps)];
function ankle(ps){const pd=pedal(ps),a=-8*Math.sin(ps)*R,f=[Math.cos(a),-Math.sin(a)];return{A:add(sub(pd,mul(f,14)),[0,-10]),f,pd}}
function hipY(Lmax){let m=-1e9;for(let i=0;i<72;i++){const A=ankle(i/72*2*Math.PI).A,dx=A[0]-HX;m=Math.max(m,A[1]-Math.sqrt(Math.max(0,Lmax*Lmax-dx*dx)))}return m}
const HY0=hipY(95),LEAN=30,S0=add([HX,HY0],rot([0,-56],LEAN)),B=add(S0,[46,28]);
function pose(e,bd){const hy=bd===0?hipY(79):HY0,H=[HX,hy],lean=bd===1?42:LEAN,S=add(H,rot([0,-56],lean)),hu=rot(nrm(sub(S,H)),-lean*.45+(bd===1?20:0));
 const ps=e*2*Math.PI,legs=[ps,ps+Math.PI].map(p=>{const a=ankle(p);return{A:a.A,f:a.f,pd:a.pd,K:ik(H,a.A,50,48,[1,-.1])}});
 return{H,S,hu,legs,lean}}
function machine(H){const sad=[H[0]-1,H[1]+13];
 return `<line x1="150" y1="${G-5}" x2="352" y2="${G-5}" stroke="#2B3540" stroke-width="9" stroke-linecap="round"/>`+
 `<line x1="${f(Cn[0])}" y1="${f(Cn[1])}" x2="${f(sad[0]-3)}" y2="${f(sad[1])}" stroke="${BAR}" stroke-width="8" stroke-linecap="round"/>`+
 `<line x1="${f(Cn[0])}" y1="${f(Cn[1])}" x2="196" y2="${G-5}" stroke="#46525F" stroke-width="7" stroke-linecap="round"/>`+
 `<line x1="${f(Cn[0])}" y1="${f(Cn[1])}" x2="330" y2="${G-40}" stroke="#46525F" stroke-width="8" stroke-linecap="round"/>`+
 `<line x1="336" y1="${G-8}" x2="${f(B[0]+9)}" y2="${f(B[1]+4)}" stroke="${BAR}" stroke-width="9" stroke-linecap="round"/>`+
 `<circle cx="330" cy="${G-40}" r="24" fill="#2B3540"/><circle cx="330" cy="${G-40}" r="16" fill="#1B222A"/><circle cx="330" cy="${G-40}" r="4" fill="#9AA5B1"/>`+
 pad([sad[0]-17,sad[1]],[sad[0]+14,sad[1]],9)+circ(Cn,9,'#46525F')+circ(Cn,3,'#9AA5B1')+
 `<line x1="${f(B[0]+9)}" y1="${f(B[1]+4)}" x2="${f(B[0])}" y2="${f(B[1])}" stroke="#46525F" stroke-width="7" stroke-linecap="round"/>`}
function crank(ps,far){const pd=pedal(ps),c=far?'#6B7683':BAR;return `<line x1="${f(Cn[0])}" y1="${f(Cn[1])}" x2="${f(pd[0])}" y2="${f(pd[1])}" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`+pad([pd[0]-9,pd[1]+1],[pd[0]+9,pd[1]+1],4,far?'#2B3540':'#46525F')}
function bikeSide(e,bd,V){const pz=pose(e,bd),ps=e*2*Math.PI,[n,fr]=pz.legs,E=ik(pz.S,B,D.uarm,D.farm,[.2,1]);
 const s=floorSvg()+machine(pz.H)+C.sideC({H:pz.H,S:pz.S,hu:pz.hu,hot:HOT,farUnder:crank(ps+Math.PI,true),nearUnder:crank(ps,false),
  near:{el:E,wr:B,kn:n.K,an:n.A,f:n.f},far:{el:add(E,[-2,-1]),wr:add(B,[-2,-1]),kn:fr.K,an:fr.A,f:fr.f},over:circ(B,5,'#46525F')+circ(B,3.2,SK)});
 return s+(bd===0?mark(n.K[1]<fr.K[1]?n.K:fr.K,19)+cross('האוכף נמוך, הברכיים כפופות'):bd===1?mark(add(pz.S,[2,-6]),20)+cross('הגב מעוגל והכתפיים מורמות'):tick('ברך כפופה מעט בנקודה הנמוכה'))}
function bikeFront(e,bd,V){const pz=pose(e,-1),ps=e*2*Math.PI,cx=190,hy=pz.H[1],rock=bd===0?9*Math.sin(ps):0;
 const P=[cx+rock,hy],N=[cx-rock*.4,pz.S[1]],SL=[N[0]-D.sw,N[1]],SR=[N[0]+D.sw,N[1]],HL=[P[0]-D.hw,hy],HR=[P[0]+D.hw,hy],hd=null;
 const splay=bd===1?11:0,lg=[0,1].map(i=>{const sg=i?1:-1,l=pz.legs[i];return{kn:[P[0]+sg*(15+splay),l.K[1]],an:[cx+sg*17,l.A[1]]}});
 const gl=[cx-22,B[1]],gr=[cx+22,B[1]];
 const aL={el:ik(SL,gl,D.uarm,D.farm,[-.7,.9]),wr:gl},aR={el:ik(SR,gr,D.uarm,D.farm,[.7,.9]),wr:gr};
 const pedL=[cx-17,pedal(ps)[1]],pedR=[cx+17,pedal(ps+Math.PI)[1]],hub=[cx,Cn[1]];
 const mach=`<line x1="${cx-64}" y1="${G-5}" x2="${cx+64}" y2="${G-5}" stroke="#2B3540" stroke-width="9" stroke-linecap="round"/><line x1="${cx}" y1="${G-8}" x2="${cx}" y2="${f(B[1]+4)}" stroke="${BAR}" stroke-width="8"/><ellipse cx="${cx}" cy="${G-40}" rx="7" ry="24" fill="#2B3540"/>`+
  pad([cx-30,B[1]],[cx+30,B[1]],6,'#46525F')+`<line x1="${cx}" y1="${hub[1]}" x2="${cx}" y2="${P[1]+14}" stroke="${BAR}" stroke-width="7"/>`+pad([P[0]-12,hy+13],[P[0]+12,hy+13],10)+
  `<line x1="${cx-5}" y1="${hub[1]}" x2="${pedL[0]}" y2="${pedL[1]}" stroke="${BAR}" stroke-width="5" stroke-linecap="round"/><line x1="${cx+5}" y1="${hub[1]}" x2="${pedR[0]}" y2="${pedR[1]}" stroke="#6B7683" stroke-width="5" stroke-linecap="round"/>`+
  pad([pedL[0]-9,pedL[1]],[pedL[0]+9,pedL[1]],5,'#46525F')+pad([pedR[0]-9,pedR[1]],[pedR[0]+9,pedR[1]],5,'#2B3540');
 const s=floorSvg()+mach+bodyFront({N,P,SL,SR,HL,HR,hot:{quads:true,hams:true},toes:[-3,3],L:{el:aL.el,wr:aL.wr,kn:lg[0].kn,an:lg[0].an},Rr:{el:aR.el,wr:aR.wr,kn:lg[1].kn,an:lg[1].an}})+circ(gl,4.6,SK)+circ(gr,4.6,SK);
 return s+(bd===0?mark(P,24)+cross('האוכף גבוה, האגן מתנדנד'):bd===1?mark(lg[0].kn,17)+mark(lg[1].kn,17)+cross('הברכיים נפתחות החוצה'):tick('אגן יציב, ברכיים מעל כפות הרגליים'))}
PAT.push({id:'bike',n:'אופני כושר',m:'שרירי הרגליים',v:['מהצד','מלפנים'],ph:['מסובבים רגליים','','',''],loop:true,period:1.4,
 good:['גובה האוכף: הברך כפופה מעט בנקודה הנמוכה','הידיים על הכידון, הגב ישר והכתפיים רפויות','האגן יציב והברכיים מעל כפות הרגליים','סיבוב חלק בקצב קבוע'],
 bad:[[{t:'האוכף נמוך, הברכיים כפופות',fix:'מעלים את האוכף עד שהברך כמעט נמתחת בנקודה הנמוכה של הדיווש.'},{t:'הגב מעוגל והכתפיים מורמות',fix:'מרפים את הכתפיים, מרימים את החזה ומחזיקים את הכידון בקלילות.'}],
      [{t:'האוכף גבוה, האגן מתנדנד',fix:'מורידים את האוכף כך שהאגן יישאר יציב ולא יזוז מצד לצד.'},{t:'הברכיים נפתחות החוצה',fix:'הברכיים נעות ישר מעל כפות הרגליים ולא נפתחות הצידה.'}]],
 views:[bikeSide,bikeFront]});
})();

/* ---------- 10. ELLIPTICAL ---------- */
(function(){const C=window.__CC;
const HOT={quads:true,hams:true,calves:true,glutes:true};
const Cr=[170,G-34],RC=15,LP=116,PV=[286,G-80],LA=56,KK=1.7,TF=.6,HX=234;
function plate(ps){const Q=[Cr[0]+RC*Math.sin(ps),Cr[1]-RC*Math.cos(ps)],d=sub(PV,Q),dl=len(d),a=(LP*LP-LA*LA+dl*dl)/(2*dl),h=Math.sqrt(Math.max(0,LP*LP-a*a)),u=mul(d,1/dl),n=[-u[1],u[0]];
 const F1=add(add(Q,mul(u,a)),mul(n,h)),F2=sub(add(Q,mul(u,a)),mul(n,h)),F=F1[1]>F2[1]?F1:F2,Pf=lerp(Q,F,TF),dd=nrm(sub(F,Q)),nU=[dd[1],-dd[0]],Hd=sub(PV,mul(sub(F,PV),KK));
 return{Q,F,Pf,dd,nU,Hd}}
function ankleOf(ps,toeUp){const p=plate(ps);let A=add(sub(p.Pf,mul(p.dd,9.5)),mul(p.nU,11.3)),f=p.dd;
 if(toeUp){f=rot(p.dd,24);A=sub(add(add(p.Pf,mul(p.dd,11)),mul(p.nU,8)),mul(f,21))}
 return{A,f,p}}
const HY=(()=>{let m=-1e9;for(let i=0;i<72;i++){const A=ankleOf(i/72*2*Math.PI).A,dx=A[0]-HX;m=Math.max(m,A[1]-Math.sqrt(Math.max(0,95*95-dx*dx)))}return m})();
function pose(e,bd){const H=[HX,HY],lean=bd===0?20:4,S=add(H,rot([0,-56],lean)),hu=rot(nrm(sub(S,H)),-lean*.4+(bd===0?18:0)),ps=e*2*Math.PI;
 const legs=[ps,ps+Math.PI].map(p=>{const a=ankleOf(p,bd===1);return{A:a.A,f:a.f,p:a.p,K:ik(H,a.A,50,48,[1,-.1])}});return{H,S,hu,legs,ps}}
function levers(p,far){const c=far?'#6B7683':BAR;return `<line x1="${f(p.Q[0])}" y1="${f(p.Q[1])}" x2="${f(p.F[0])}" y2="${f(p.F[1])}" stroke="${far?'#2B3540':'#46525F'}" stroke-width="9" stroke-linecap="round"/>`+
 `<line x1="${f(p.F[0])}" y1="${f(p.F[1])}" x2="${f(p.Hd[0])}" y2="${f(p.Hd[1])}" stroke="${c}" stroke-width="7" stroke-linecap="round"/>`+circ(p.Hd,5.5,far?'#2B3540':'#46525F')}
function elSide(e,bd,V){const pz=pose(e,bd),[n,fr]=pz.legs,E=ik(pz.S,n.p.Hd,D.uarm,D.farm,[-.2,1]),E2=ik(pz.S,fr.p.Hd,D.uarm,D.farm,[-.2,1]);
 const st=`<line x1="110" y1="${G-5}" x2="342" y2="${G-5}" stroke="#2B3540" stroke-width="9" stroke-linecap="round"/><rect x="132" y="${G-66}" width="76" height="58" rx="14" fill="#2B3540"/><circle cx="${Cr[0]}" cy="${Cr[1]}" r="${RC+3}" fill="#1B222A"/>`+
  `<rect x="294" y="${G-214}" width="14" height="${208}" fill="#2B3540"/><rect x="270" y="${G-236}" width="52" height="30" rx="7" fill="#2B3540"/><rect x="276" y="${G-231}" width="40" height="15" rx="3" fill="#163B2C"/>`+
  `<line x1="${Cr[0]}" y1="${Cr[1]}" x2="${f(n.p.Q[0])}" y2="${f(n.p.Q[1])}" stroke="#6B7683" stroke-width="6" stroke-linecap="round"/><line x1="${Cr[0]}" y1="${Cr[1]}" x2="${f(fr.p.Q[0])}" y2="${f(fr.p.Q[1])}" stroke="#6B7683" stroke-width="6" stroke-linecap="round"/>`+circ(Cr,6,'#9AA5B1')+circ(PV,6,'#9AA5B1');
 const s=floorSvg()+st+C.sideC({H:pz.H,S:pz.S,hu:pz.hu,hot:HOT,farUnder:levers(fr.p,true),nearUnder:levers(n.p,false),
  near:{el:E,wr:n.p.Hd,kn:n.K,an:n.A,f:n.f},far:{el:add(E2,[-2,-1]),wr:add(fr.p.Hd,[-2,-1]),kn:fr.K,an:fr.A,f:fr.f},over:circ(n.p.Hd,3.4,SK)});
 return s+(bd===0?mark(add(pz.S,[4,-4]),21)+cross('נשענים על הידיים'):bd===1?mark(n.A,18)+cross('העקבים עולים מהמשטח'):tick('גוף זקוף, כל כף הרגל על הפדל'))}
function elFront(e,bd,V){const pz=pose(e,-1),[n,fr]=pz.legs,cx=190,sw=bd===1?7*Math.sin(pz.ps):0,hy=pz.H[1],P=[cx+sw,hy],N=[cx-sw*.3,pz.S[1]];
 const SL=[N[0]-D.sw,N[1]],SR=[N[0]+D.sw,N[1]],HL=[P[0]-D.hw,hy],HR=[P[0]+D.hw,hy],cave=bd===0?[Math.max(0,Math.sin(pz.ps+1))*10,Math.max(0,-Math.sin(pz.ps+1))*10]:[0,0];
 const lg=[0,1].map(i=>{const sg=i?1:-1,l=pz.legs[i];return{kn:[P[0]+sg*(15-cave[i]),l.K[1]],an:[cx+sg*17,l.A[1]]}});
 const gl=[cx-40,n.p.Hd[1]],gr=[cx+40,fr.p.Hd[1]];
 const aL={el:ik(SL,gl,D.uarm,D.farm,[-.35,1]),wr:gl},aR={el:ik(SR,gr,D.uarm,D.farm,[.35,1]),wr:gr};
 const pl=(i,y)=>{const sg=i?1:-1;return pad([cx+sg*17-19,y],[cx+sg*17+19,y],8,i?'#2B3540':'#46525F')};
 const mach=`<line x1="${cx-66}" y1="${G-5}" x2="${cx+66}" y2="${G-5}" stroke="#2B3540" stroke-width="9" stroke-linecap="round"/><rect x="${cx-8}" y="${G-215}" width="16" height="${210}" fill="#2B3540"/>`+
  `<line x1="${cx-40}" y1="${G-70}" x2="${cx-40}" y2="${gl[1]}" stroke="${BAR}" stroke-width="7" stroke-linecap="round"/><line x1="${cx+40}" y1="${G-70}" x2="${cx+40}" y2="${gr[1]}" stroke="#6B7683" stroke-width="7" stroke-linecap="round"/>`+
  pl(0,n.p.Pf[1]+3)+pl(1,fr.p.Pf[1]+3);
 const s=floorSvg()+mach+bodyFront({N,P,SL,SR,HL,HR,hot:{quads:true,hams:true},toes:[-3,3],L:{el:aL.el,wr:aL.wr,kn:lg[0].kn,an:lg[0].an},Rr:{el:aR.el,wr:aR.wr,kn:lg[1].kn,an:lg[1].an}})+circ(gl,4.6,SK)+circ(gr,4.6,SK);
 return s+(bd===0?mark(lg[0].kn,17)+mark(lg[1].kn,17)+cross('הברכיים נכנסות פנימה'):bd===1?mark(P,24)+cross('האגן מתנדנד הצידה'):tick('אגן יציב, ידיים על הידיות'))}
PAT.push({id:'elliptical',n:'אליפטיקל',m:'שרירי הרגליים',v:['מהצד','מלפנים'],ph:['גולשים באליפסה','','',''],loop:true,period:1.6,
 good:['עומדים זקופים, כל כף הרגל על הפדל','הידיים על הידיות הנעות, המרפקים רפויים','הפדלים נעים בתנועה חלקה ואגן יציב','לא נשענים על הידיים'],
 bad:[[{t:'נשענים על הידיים',fix:'מזקפים את הגוף ומעבירים את המשקל לרגליים. הידיים רק מלוות.'},{t:'העקבים עולים מהמשטח',fix:'לוחצים את כל כף הרגל, כולל העקב, על הפדל.'}],
      [{t:'הברכיים נכנסות פנימה',fix:'הברכיים נעות באותו קו עם אצבעות כף הרגל.'},{t:'האגן מתנדנד הצידה',fix:'מקבעים את האגן ומורידים עומס מהידיים.'}]],
 views:[elSide,elFront]});
})();

const EXMAP={"שכיבות סמיכה": ["pushup", 0], "שכיבות סמיכה על הברכיים": ["pushup", 1], "שכיבות סמיכה לקיר": ["pushup", 2], "שכיבות סמיכה רחבות ללא ציוד": ["pushup", 3], "בירד דוג ללא ציוד": ["bird_dog", 0], "סופרמן ללא ציוד": ["superman", 0], "הרמת ידיים W בשכיבה ללא ציוד": ["prone_raise", 0], "הרמת ידיים Y בשכיבה ללא ציוד": ["prone_raise", 1], "לחיצת כתפיים פייק ללא ציוד": ["pike_press", 0], "נגיעות כתף בפלאנק ללא ציוד": ["shoulder_tap", 0], "הרמת ידיים T בשכיבה ללא ציוד": ["prone_raise", 2], "שכיבות סמיכה צרות ללא ציוד": ["pushup", 4], "שכיבות סמיכה צרות על הברכיים ללא ציוד": ["pushup", 4], "פשיטת מרפקים לקיר ללא ציוד": ["wall_triceps", 0], "סקוואט ללא ציוד": ["squat", 0], "מכרעים לאחור ללא ציוד": ["lunge", 0], "גשר ישבן ללא ציוד": ["bridge", 0], "תאומים ללא ציוד": ["calf_raise", 0], "כפיפות בטן": ["crunch", 0], "פלאנק": ["plank", 0], "הרמת רגליים": ["leg_raise", 0], "דד באג ללא ציוד": ["dead_bug", 0], "כפיפת מרפקים בהתנגדות היד השנייה ללא ציוד": ["resist_curl", 0], "כפיפת מרפקים בפטיש בהתנגדות היד השנייה ללא ציוד": ["resist_curl", 1], "כפיפת מרפקים איזומטרית ללא ציוד": ["resist_curl", 2], "לחיצת חזה במשקולות על הרצפה": ["floor_press", 0], "לחיצת חזה באחיזה צרה במשקולות על הרצפה": ["floor_press", 1], "לחיצת חזה מתחלפת במשקולות על הרצפה": ["floor_press", 2], "חתירה עם משקולת": ["one_arm_row", 0], "חתירה בשתי משקולות": ["bent_row", 1], "חתירה באחיזה ניטרלית במשקולות": ["bent_row", 2], "לחיצת כתפיים במשקולות": ["ohp", 0], "הרחקת כתפיים לצדדים": ["lateral_raise", 0], "הרמה קדמית במשקולות": ["front_raise", 0], "פרפר הפוך במשקולות": ["reverse_fly", 0], "כפיפת מרפקים במשקולות": ["curl", 0], "פטישים": ["curl", 1], "כפיפת מרפקים בישיבה במשקולות": ["curl", 2], "כפיפת מרפקים מתחלפת במשקולות": ["curl", 3], "פשיטת מרפקים במשקולת בהטיית גו": ["kickback", 0], "פשיטה מעל הראש במשקולת": ["overhead_ext", 0], "לחיצה צרפתית במשקולות על הרצפה": ["skullcrusher", 0], "סקוואט גביע במשקולת": ["squat", 1], "דדליפט רומני במשקולות": ["rdl", 0], "מכרעים במשקולות": ["lunge", 1], "תאומים במשקולות": ["calf_raise", 1], "לחיצת חזה במשקולות": ["bench", 1], "לחיצת חזה בשיפוע עם משקולות": ["incline", 0], "פרפר במשקולות": ["fly_db", 0], "חתירה במשקולות עם תמיכת חזה": ["bent_row", 3], "בולגרי במשקולות": ["bulgarian", 0], "לחיצת חזה במוט": ["bench", 0], "חתירה במוט": ["bent_row", 0], "כפיפת מרפקים במוט": ["curl", 4], "לחיצה צרפתית במוט": ["skullcrusher", 1], "דדליפט רומני במוט": ["rdl", 1], "היפ טראסט במוט": ["bridge", 1], "לחיצת חזה במכונה": ["chest_machine", 0], "פרפר בכבלים": ["cable_fly", 0], "פרפר במכונה": ["chest_machine", 1], "פולי עליון": ["pulldown", 0], "חתירה במכונה": ["seated_row", 0], "פולאובר בכבל": ["cable_pullover", 0], "לחיצת כתפיים במכונה": ["ohp", 2], "כתף אחורית במכונה": ["reverse_fly", 1], "הרחקה בכבל": ["lateral_raise", 1], "כפיפה בכבל": ["curl", 5], "כפיפת מרפקים במכונה": ["curl", 6], "כפיפת מרפקים בכבל באחיזה ניטרלית": ["curl", 5], "פשיטת מרפקים בכבל": ["pushdown", 0], "פשיטה מעל הראש בכבל": ["overhead_ext", 2], "פשיטת מרפקים במכונה": ["pushdown", 2], "לחיצת רגליים": ["leg_press", 0], "כפיפת ברך": ["leg_curl", 0], "פשיטת ברך": ["leg_ext", 0], "תאומים במכונה": ["calf_raise", 2], "קרנץ׳ בכבל": ["cable_crunch", 0], "כפיפות בטן במכונה": ["cable_crunch", 1], "סיבוב גו בכבל": ["cable_twist", 0], "מתח": ["pullup", 0], "מתח באחיזה ניטרלית": ["pullup", 1], "מתח באחיזה הפוכה": ["pullup", 2], "מתח באחיזה הפוכה צרה": ["pullup", 3], "מתח באחיזה הפוכה עם תמיכת רגליים": ["pullup", 4], "מקבילים לחזה": ["dips", 0], "מקבילים ליד אחורית": ["dips", 1], "הליכה בקצב נוח": ["walk", 0], "צעידה במקום ללא ציוד": ["walk", 2], "הליכה לסירוגין": ["walk", 1], "ריצה קלה": ["jog", 0], "אופני כושר במכונה": ["bike", 0], "אליפטיקל במכונה": ["elliptical", 0], "הליכון במכונה": ["jog", 1]};
/* ===== app integration ===== */
const SHEET_HTML=`<div class="sheet an-sheet"><div class="sheet-head"><h3 id="an_title" style="margin:0"></h3><button class="btn light mini" id="an_x" type="button">✕</button></div>
<div class="an-chips" id="an_vchips"></div><div class="an-row2"><button id="an_vs" type="button"></button><button id="an_vf" type="button"></button></div>
<svg viewBox="0 0 380 270" id="an_s" class="good"></svg><div class="an-phase" id="an_ph"></div>
<div class="an-row2"><button class="g on" id="an_mg" type="button">✅ ככה עושים</button><button class="b" id="an_mb" type="button">❌ טעויות נפוצות</button></div><div class="an-chips" id="an_chips"></div>
<ul id="an_cues" class="good"></ul><div class="an-note g" id="an_note"></div><button class="an-pb" id="an_pb" type="button">⏸ עצור</button></div>`;
const CSS=`#anOv{z-index:140}#anOv .an-sheet{max-height:92vh}#anOv svg{width:100%;height:auto;background:#1F262E;border-radius:16px;display:block;margin-top:8px}#anOv svg.bad{box-shadow:0 0 0 2px #E5484D inset}#anOv svg.good{box-shadow:0 0 0 2px #3FB950 inset}
#anOv h3 small{display:block;color:#FF8A80;font-weight:600;font-size:13px;margin-top:2px}
.an-row2{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0 0}.an-row2 button{border:2px solid transparent;border-radius:12px;padding:9px;font:inherit;font-weight:700;background:#1F262E;color:#A3ADB8}
.an-row2 .on{background:#26301A;color:#D7F36B;border-color:#D7F36B}.an-row2 .g.on{background:#12301C;color:#6EE787;border-color:#3FB950}.an-row2 .b.on{background:#3A1517;color:#FF8A80;border-color:#E5484D}
.an-chips{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.an-chips:empty{display:none}.an-chips .chip{border:1px solid #5a2a2d;background:#2a1517;color:#FFC9C4;border-radius:99px;padding:6px 11px;font:inherit;font-size:13px}.an-chips .chip.on{background:#E5484D;color:#fff;border-color:#E5484D}.an-chips .chip.vc{border-color:#3a4a2a;background:#1d2615;color:#D7F36B}.an-chips .chip.vc.on{background:#D7F36B;color:#0E1217;border-color:#D7F36B}
.an-phase{text-align:center;color:#D7F36B;font-weight:700;min-height:22px;margin:6px 0 0}
#anOv ul{margin:6px 0 0;padding-inline-start:20px;line-height:1.85;font-size:15px}#anOv .good li::marker{color:#6EE787}#anOv .bad li::marker{color:#FF8A80}
.an-note{margin-top:8px;font-size:14px;line-height:1.6;border-radius:12px;padding:9px 12px}.an-note.g{background:#12301C;color:#B6F1C4}.an-note.b{background:#3A1517;color:#FFC9C4}
.an-pb{width:100%;margin-top:10px;border:0;border-radius:12px;padding:10px;background:#26301A;color:#D7F36B;font:inherit;font-weight:700}
.exAnim{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;margin-inline-start:6px;border-radius:50%;background:#26301A;color:#D7F36B;font-size:14px;line-height:1;vertical-align:middle;cursor:pointer;flex:0 0 auto}
.exAnimBtn{flex:0 0 auto;padding:0 12px}`;
let anOpen=false,rafId=0;
function A$(id){return document.getElementById('an_'+id)}
function mount(){if(document.getElementById('anOv'))return;const st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);
 const ov=document.createElement('div');ov.className='overlay hide';ov.id='anOv';ov.innerHTML=SHEET_HTML;document.body.appendChild(ov);
 ov.addEventListener('click',e=>{if(e.target===ov)closeAn()});A$('x').onclick=closeAn;
 A$('mg').onclick=()=>{bad=-1;ui()};A$('mb').onclick=()=>{bad=0;ui()};A$('vs').onclick=()=>{view=0;bad=-1;ui()};A$('vf').onclick=()=>{view=1;bad=-1;ui()};
 A$('vchips').onclick=e=>{const b=e.target.closest('.vc');if(b){vi=+b.dataset.i;bad=-1;ui()}};A$('chips').onclick=e=>{const b=e.target.closest('.chip');if(b){bad=+b.dataset.i;ui()}};
 A$('pb').onclick=()=>{play=!play;A$('pb').textContent=play?'⏸ עצור':'▶ הפעל'}}
function ui(){const x=PAT[cur];const vs=x.variants||[];if(vi>=vs.length)vi=0;A$('vchips').innerHTML=vs.length>1?vs.map((v,i)=>`<button type="button" class="chip vc ${i===vi?'on':''}" data-i="${i}">${v.n}</button>`).join(''):'';VAR=vs.length?vs[vi].V:null;
 A$('title').innerHTML=`${exName||x.n}<small>🔴 שריר עובד: ${x.m}</small>`;
 A$('vs').textContent='👁 '+x.v[0];A$('vf').style.display=x.views[1]?'':'none';if(x.views[1])A$('vf').textContent='👁 '+x.v[1];
 A$('vs').classList.toggle('on',view===0);A$('vf').classList.toggle('on',view===1);
 const bl=x.bad[view]||[];if(bad>=bl.length)bad=-1;
 A$('mg').classList.toggle('on',bad<0);A$('mb').classList.toggle('on',bad>=0);A$('mb').style.display=bl.length?'':'none';
 A$('chips').innerHTML=bl.length&&bad>=0?bl.map((b,i)=>`<button type="button" class="chip ${i===bad?'on':''}" data-i="${i}">${b.t}</button>`).join(''):'';
 A$('s').setAttribute('class',bad>=0?'bad':'good');A$('cues').className=bad>=0?'bad':'good';
 A$('cues').innerHTML=bad>=0?`<li><b>${bl[bad].t}</b> <small style="color:#FF8A80">(מוצג באנימציה)</small></li>`:x.good.map(c=>`<li>${c}</li>`).join('');
 A$('note').className='an-note '+(bad>=0?'b':'g');A$('note').innerHTML=bad>=0?('<b>איך מתקנים:</b> '+bl[bad].fix):'הדגש האדום מראה איזה שריר עובד עכשיו.'}
function figBox(svg){let b=null;[...svg.children].forEach(el=>{const t=el.tagName;if(t==='text')return;if(t==='rect'&&+el.getAttribute('width')>=900)return;if(t==='line'&&(el.getAttribute('stroke')==='#3A4652'))return;
 let r;try{r=el.getBBox()}catch(_){return}if(!r||(!r.width&&!r.height))return;b=b?{x0:Math.min(b.x0,r.x),y0:Math.min(b.y0,r.y),x1:Math.max(b.x1,r.x+r.width),y1:Math.max(b.y1,r.y+r.height)}:{x0:r.x,y0:r.y,x1:r.x+r.width,y1:r.y+r.height}});return b}
const VBC={};
function fitBox(x,v){const k=x.id+'_'+v+'_'+vi;if(VBC[k])return VBC[k];let u=null;const svg=A$('s'),nb=(x.bad[v]||[]).length;
 for(let bd=-1;bd<nb;bd++)for(const e of [0,.35,.7,1]){svg.innerHTML=x.views[v](e,bd,VAR);const b=figBox(svg);if(b)u=u?{x0:Math.min(u.x0,b.x0),y0:Math.min(u.y0,b.y0),x1:Math.max(u.x1,b.x1),y1:Math.max(u.y1,b.y1)}:b}
 if(!u)return{x:0,y:0,w:380,h:270};
 const AR=380/270,w0=u.x1-u.x0+34,h0=u.y1-u.y0+66;let w=Math.max(w0,h0*AR),h=w/AR;const cx=(u.x0+u.x1)/2,top=u.y0-42;
 return VBC[k]={x:cx-w/2,y:top-Math.max(0,(h-h0)/2),w,h}}
const depth=T=>T<.42?ease(T/.42):T<.52?1:T<.92?1-ease((T-.52)/.40):0;
let cur=0,play=true,bad=-1,view=0,T=0,last=0,now0=0,VAR=null,vi=0,exName='';
function render(){const x=PAT[cur];if(!x.views[view])view=0;const d=x.loop?T:depth(T),mv=T>=.52&&T<.92;INT=(mv?.95:.4)*(.82+.18*Math.sin((performance.now()-now0)/200));
 const svg=A$('s'),vb=fitBox(x,view);svg.innerHTML=x.views[view](d,bad,VAR);svg.setAttribute('viewBox',`${vb.x.toFixed(1)} ${vb.y.toFixed(1)} ${vb.w.toFixed(1)} ${vb.h.toFixed(1)}`);
 svg.querySelectorAll('text[data-cap]').forEach(t=>{t.setAttribute('x',(vb.x+vb.w/2).toFixed(1));t.setAttribute('y',(vb.y+22).toFixed(1))});
 svg.querySelectorAll('rect').forEach(r=>{if(+r.getAttribute('width')>=900){r.setAttribute('x',vb.x-300);r.setAttribute('width',vb.w+600);if(+r.getAttribute('height')>=900){r.setAttribute('y',vb.y-300);r.setAttribute('height',vb.h+600)}}});
 A$('ph').textContent=x.loop?x.ph[0]:T<.42?x.ph[0]:T<.52?x.ph[1]:T<.92?x.ph[2]:x.ph[3]}
function frame(n){if(!anOpen)return;const dt=Math.min(.1,(n-last)/1000);last=n;if(play)T=(T+dt/((PAT[cur]&&PAT[cur].period)||5.2))%1;try{render()}catch(e){}rafId=requestAnimationFrame(frame)}
const norm=s=>String(s||'').replace(/^\s*\d+\s*[.)]\s*/,'').replace(/[▾◂▸›‹←→🎬]/g,'').replace(/\s+/g,' ').trim();
function openAn(name){const n=norm(name);const m=EXMAP[n];mount();exName=n;
 if(!m){requestExercise(n);toast0('עוד אין הדגמה לתרגיל הזה. שלחתי למנהל בקשה להוסיף');return}
 const i=PAT.findIndex(x=>x.id===m[0]);if(i<0)return;cur=i;T=0;bad=-1;view=0;vi=Math.min(m[1]|0,(PAT[i].variants||[1]).length-1);play=true;A$('pb').textContent='⏸ עצור';
 const ov=document.getElementById('anOv');ov.classList.remove('hide');anOpen=true;ui();last=performance.now();now0=last;cancelAnimationFrame(rafId);rafId=requestAnimationFrame(frame)}
function closeAn(){anOpen=false;cancelAnimationFrame(rafId);const ov=document.getElementById('anOv');if(ov)ov.classList.add('hide')}
function toast0(m){try{if(typeof toast==='function')toast(m);else alert(m)}catch(_){}}
/* ----- exercise requests to admin ----- */
const ASKED=new Set();
function requestExercise(name,group,equipment){name=norm(name);if(!name||EXMAP[name]||ASKED.has(name))return;ASKED.add(name);try{if(window.FP2&&FP2.push)FP2.push('logExerciseRequest',{name,group:group||'',equipment:equipment||''})}catch(_){}}
function hookSave(){if(!window.FP2||!FP2.call||FP2.__anHook)return false;const orig=FP2.call;FP2.call=async function(fn,args){const r=await orig.apply(this,arguments);if(fn==='saveExercise'&&args&&args[0]&&args[0].name)requestExercise(args[0].name,args[0].muscleGroup,args[0].equipment);return r};FP2.__anHook=true;return true}
/* ----- arrows ----- */
const ROOTS='#workoutHome,#workoutLibrary,#workouts,#workoutDiary,#workoutPlans,.overlay:not(#anOv)';
let scanT=0,mo=null;
function scan(){if(!mo)return;mo.disconnect();try{document.querySelectorAll(ROOTS).forEach(root=>{
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const hits=[];let t;while(t=w.nextNode()){const s=t.nodeValue;if(!s||s.length>60)continue;const n=norm(s);if(n&&EXMAP[n]){const el=t.parentElement;if(el&&!el.closest('.exAnim,#anOv,option,select,button.exAnimBtn,input,textarea,script,style')&&!hits.includes(el))hits.push(el)}}
  hits.forEach(el=>{const nx=el.nextElementSibling;if(nx&&nx.classList.contains('exAnim'))return;if(el.querySelector(':scope>.exAnim'))return;const b=document.createElement('span');b.className='exAnim';b.setAttribute('role','button');b.setAttribute('aria-label','הדגמה');b.dataset.ex=norm(el.textContent);b.textContent='🎬';
   if(el.tagName==='B'||el.tagName==='SPAN'||el.tagName==='STRONG'||el.tagName==='DIV'||el.tagName==='SMALL'||el.tagName==='H4'||el.tagName==='H3')el.appendChild(b);else el.after(b)})});
 /* the runner pick-line */
 const pl=document.querySelector('.pick-line');if(pl&&!pl.querySelector('.exAnimBtn')){const b=document.createElement('button');b.type='button';b.className='btn secondary pick-plus exAnimBtn';b.textContent='🎬';b.setAttribute('aria-label','הדגמה');pl.insertBefore(b,pl.querySelector('.pick-plus'))}
 }catch(e){}
 observe()}
function observe(){mo.observe(document.body,{childList:true,subtree:true,characterData:true})}
function queue(){clearTimeout(scanT);scanT=setTimeout(scan,250)}
document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('.exAnim');if(a){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openAn(a.dataset.ex);return}
 const b=e.target.closest&&e.target.closest('.exAnimBtn');if(b){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();const n=document.getElementById('exercisePickName');openAn(n?n.textContent:'')}},true);
function boot(){mount();mo=new MutationObserver(queue);observe();scan();let k=0;const iv=setInterval(()=>{if(hookSave()||++k>60)clearInterval(iv)},500)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
window.FP2Anim={open:openAn,close:closeAn,request:requestExercise,map:EXMAP,count:PAT.length};

})();
