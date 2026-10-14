/* FitPro 2.27.0 — from the sketches the user picked:
   1. rest timer (sketch C): a clear clock at the top left. A tap opens −15 / +15 / skip and the default time.
      It starts by itself on the first thing you do in a set (writing a result, adding a set, saving the exercise).
      Its settings moved to Settings → אימונים → כוח.
   2. journal (sketch A): a long press on a workout in a week starts choosing; choose several → delete / move to a day / edit.
   3. exercise page (sketch A): search an exercise in "האימונים שלי" and tap it, no workout needed:
      the video (or the animation, or upload one), your record, last time, the last 4 times, "add to the workout". */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const prop=k=>{try{return FP2.getProp(k)||''}catch(_){return ''}};
const setProp=(k,v)=>{try{FP2.setProp(k,v)}catch(_){}};
const J=(k,d)=>{try{const v=JSON.parse(prop(k)||'null');return v==null?d:v}catch(_){return d}};
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const n1=v=>{const n=Number(v);return Number.isFinite(n)?(Math.round(n*10)/10).toLocaleString('he-IL'):''};
const ddmm=d=>{const p=String(d||'').split('-');return p.length===3?Number(p[2])+'.'+Number(p[1]):''};
const low=s=>String(s||'').trim().toLowerCase();
const SV={clock:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9 2h6"/>',back:'<path d="M14 6l-6 6 6 6"/>',play:'<path d="M8 5v14l11-7z"/>',plus:'<path d="M12 5v14M5 12h14"/>',search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',cam:'<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',trash:'<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>',cal:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/>',edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/>',x:'<path d="M6 6l12 12M18 6L6 18"/>'};
const ic=(k,s)=>`<svg viewBox="0 0 24 24" aria-hidden="true" style="width:${s||18}px;height:${s||18}px;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round;flex:none">${SV[k]||''}</svg>`;
window.fp227=window.fp227||{};

/* =================== 1. rest timer =================== */
document.head.insertAdjacentHTML('beforeend',`<style id="fp227rest">
#restBar.rest-chip{z-index:2147482500;top:calc(env(safe-area-inset-top) + 8px);left:12px;right:auto;background:#222D17;color:var(--brand,#D7F36B);border:1.5px solid var(--brand,#D7F36B);padding:7px 14px 7px 12px;font-size:19px;font-weight:800;font-variant-numeric:tabular-nums;box-shadow:0 6px 20px rgba(0,0,0,.55);flex-direction:column;align-items:stretch;gap:0;border-radius:22px;max-width:calc(100vw - 24px)}
#restBar #restText{display:flex;align-items:center;gap:7px;justify-content:flex-start}
#restBar.done{background:var(--brand,#D7F36B);color:#14190a}
#restBar .rest-ctl{display:flex;flex-direction:column;gap:8px;padding:10px 0 4px;font-size:13px;font-weight:700}
#restBar .rest-ctl.hide{display:none}
#restBar .rc-row{display:flex;gap:6px}
#restBar .rc-row button{font:inherit;flex:1;min-width:44px;min-height:38px;border-radius:12px;border:1px solid #4B5A2A;background:#171C22;color:var(--ink,#F2F5F7);padding:0 8px;cursor:pointer}
#restBar .rc-row button.on{background:var(--brand,#D7F36B);color:#14190a;border-color:var(--brand,#D7F36B)}
#restBar .rc-lbl{font-size:11px;color:#A3ADB8;font-weight:600}
</style>`);
const rSec=()=>{let v=90;try{v=Number(localStorage.getItem('elaiRestSec'))||90}catch(_){}return v>=15&&v<=600?v:90};
const rOn=()=>{try{return localStorage.getItem('elaiRestOff')!=='1'}catch(_){return true}};
function ctlHtml(){const cur=rSec();return `<div class="rc-row"><button type="button" onclick="fp227.rAdj(-15)">−15</button><button type="button" onclick="fp227.rAdj(15)">+15</button><button type="button" onclick="fp227.rSkip()">דלג</button></div>
  <div class="rc-lbl">זמן מנוחה רגיל</div><div class="rc-row">${[60,90,120,180].map(s=>`<button type="button" class="${cur===s?'on':''}" onclick="fp227.rSet(${s})">${s<120?s:s/60+':00'}</button>`).join('')}</div>`}
function chipSetup(){const b=$('restBar'),c=$('restCtl');if(!b||!c||b.dataset.fp227)return;b.dataset.fp227='1';c.innerHTML=ctlHtml()}
/* the clock icon next to the numbers, and the "done" look */
if(typeof tickRest==='function'){const o=tickRest;tickRest=function(){const r=o.apply(this,arguments);try{chipSetup();const t=$('restText'),b=$('restBar');if(t&&!t.querySelector('svg'))t.insertAdjacentHTML('afterbegin',ic('clock',18));if(b)b.classList.toggle('done',!(state.restEnd&&state.restEnd>Date.now()))}catch(_){}return r}}
if(typeof toggleRestControls==='function'){const o=toggleRestControls;toggleRestControls=function(){try{chipSetup();const c=$('restCtl');if(c)c.innerHTML=ctlHtml()}catch(_){}return o.apply(this,arguments)}}
fp227.rAdj=d=>{if(!state.restEnd)return;state.restEnd=Math.max(Date.now()+5000,state.restEnd+d*1000);try{localStorage.setItem('elaiRestEnd',String(state.restEnd))}catch(_){}tickRest()};
fp227.rSkip=()=>{try{stopRestTimer()}catch(_){}};
fp227.rSet=s=>{try{localStorage.setItem('elaiRestSec',String(s))}catch(_){}if(state.restEnd&&state.restEnd>Date.now()){const startedAt=state.restEnd-(state.fp227Len||rSec())*1000;state.restEnd=Math.max(Date.now()+5000,startedAt+s*1000);try{localStorage.setItem('elaiRestEnd',String(state.restEnd))}catch(_){}tickRest()}state.fp227Len=s;const c=$('restCtl');if(c)c.innerHTML=ctlHtml();try{toast('מנוחה רגילה: '+(s<120?s+' שניות':s/60+' דקות'))}catch(_){}};
if(typeof startRestTimer==='function'){const o=startRestTimer;startRestTimer=function(){state.fp227Len=rSec();const r=o.apply(this,arguments);try{chipSetup();const c=$('restCtl');if(c)c.innerHTML=ctlHtml()}catch(_){}return r}}
/* the settings: inside Settings → אימונים → כוח (the old section in "הגדרות נוספות" is hidden) */
function restCard(){return `<div class="fpCard" id="fp227RestSet" style="margin:0 0 10px"><div class="fpRow" style="padding:0"><span><b>טיימר מנוחה</b><br><span class="mu">מתחיל לבד כשכותבים תוצאה בסט, מוסיפים סט או שומרים תרגיל</span></span><label class="fpSw"><input type="checkbox" ${rOn()?'checked':''} onchange="fp227.rOnSet(this.checked)" aria-label="טיימר מנוחה"><span></span></label></div>
  ${rOn()?`<div class="mu" style="margin:10px 0 6px">כמה זמן מנוחה</div><div class="fpChips">${[60,90,120,150,180].map(s=>`<button type="button" class="${rSec()===s?'on':''}" onclick="fp227.rSet(${s});fp227.restMount(1)">${s<120?s+' שנ׳':(s/60).toString().replace('.5','½')+' דק׳'}</button>`).join('')}</div>`:''}</div>`}
fp227.rOnSet=on=>{try{setRestEnabled(on)}catch(_){}fp227.restMount(1)};
fp227.restMount=force=>{const anchor=$('fpRestSet_s');if(!anchor)return;const ex=$('fp227RestSet');if(ex&&!force)return;if(ex)ex.outerHTML=restCard();else anchor.insertAdjacentHTML('beforebegin',restCard())};
setInterval(()=>{try{fp227.restMount(0);const old=$('restOnToggle'),d=old&&old.closest('details');if(d&&d.style.display!=='none')d.style.display='none'}catch(_){}},700);

/* =================== 2. journal: choose several workouts =================== */
document.head.insertAdjacentHTML('beforeend',`<style id="fp227j">
#fpJ .tl .e{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}#fpJ.fpSel .tl .e{position:relative;padding-inline-start:44px}
#fpJ .tl .e .fpCb{position:absolute;right:12px;top:50%;margin-top:-11px;width:22px;height:22px;border-radius:7px;border:2px solid #46525F;display:grid;place-items:center;font-size:14px;font-weight:900;color:#14190a}
#fpJ .tl .e.sel{border-color:var(--brand,#D7F36B)!important;background:#1C2414!important}
#fpJ .tl .e.sel .fpCb{background:var(--brand,#D7F36B);border-color:var(--brand,#D7F36B)}
#fpJBar{position:fixed;left:0;right:0;bottom:calc(64px + env(safe-area-inset-bottom));z-index:150;background:#171C22;border-top:1px solid var(--line,#2C3640);padding:10px 12px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;box-shadow:0 -10px 30px rgba(0,0,0,.45)}
#fpJBar .t{grid-column:1/-1;display:flex;justify-content:space-between;align-items:center;font-size:13.5px}
#fpJBar button{font:inherit;font-weight:700;font-size:13.5px;border-radius:12px;padding:11px 0;border:1px solid var(--line,#2C3640);background:#1F262E;color:var(--ink,#F2F5F7);display:flex;align-items:center;justify-content:center;gap:6px}
#fpJBar button.d{color:#FF8A80;border-color:#5a2a2a}#fpJBar button:disabled{opacity:.4}
#fpJBar .x{background:none;border:0;color:#A3ADB8;padding:4px 0}
#fp227Move{z-index:2147482600}#fp227Move .sheet{padding-bottom:calc(18px + env(safe-area-inset-bottom))}
</style>`);
let SEL=null;/* null = not choosing; a Set of "t:id" while choosing */
const keyOf=el=>{const m=(el.getAttribute('onclick')||'').match(/jOpen\('([src])','([^']*)'\)/);return m?m[1]+':'+m[2]:''};
function decorate(){const box=$('fpJ');if(!box)return;box.classList.toggle('fpSel',!!SEL);
  box.querySelectorAll('.tl .e').forEach(el=>{const k=keyOf(el);let cb=el.querySelector('.fpCb');
    if(!SEL){if(cb)cb.remove();el.classList.remove('sel');return}
    if(!cb){el.insertAdjacentHTML('afterbegin','<span class="fpCb" aria-hidden="true"></span>');cb=el.querySelector('.fpCb')}
    const on=SEL.has(k);el.classList.toggle('sel',on);el.setAttribute('aria-pressed',on);cb.textContent=on?'✓':''});
  bar()}
function bar(){let b=$('fpJBar');if(!SEL){if(b)b.remove();return}const n=SEL.size;
  const h=`<div class="t"><b>${n?'נבחרו '+n:'בחר אימונים'}</b><button type="button" class="x" onclick="fp227.jCancel()">ביטול</button></div>
    <button type="button" class="d" ${n?'':'disabled'} onclick="fp227.jDelete()">${ic('trash',16)}מחק${n?' ('+n+')':''}</button>
    <button type="button" ${n?'':'disabled'} onclick="fp227.jMove()">${ic('cal',16)}העבר ליום</button>
    <button type="button" ${n===1?'':'disabled'} onclick="fp227.jEdit()">${ic('edit',16)}ערוך</button>`;
  if(!b){document.body.insertAdjacentHTML('beforeend',`<div id="fpJBar" role="toolbar" aria-label="פעולות על אימונים">${h}</div>`)}else b.innerHTML=h}
function startSel(k){SEL=new Set(k?[k]:[]);try{navigator.vibrate&&navigator.vibrate(15)}catch(_){}try{hapticTick()}catch(_){}decorate()}
fp227.jCancel=()=>{SEL=null;decorate()};
/* long press (0.5 s) on a workout in a week */
let lpT=0,lpX=0,lpY=0,lpEl=null,swallow=false;
document.addEventListener('pointerdown',e=>{swallow=false;const el=e.target.closest&&e.target.closest('#fpJ .tl .e');if(!el||SEL)return;lpEl=el;lpX=e.clientX;lpY=e.clientY;clearTimeout(lpT);lpT=setTimeout(()=>{swallow=true;startSel(keyOf(el))},500)},true);
document.addEventListener('pointermove',e=>{if(lpEl&&(Math.abs(e.clientX-lpX)>10||Math.abs(e.clientY-lpY)>10)){clearTimeout(lpT);lpEl=null}},true);
['pointerup','pointercancel'].forEach(t=>document.addEventListener(t,()=>{clearTimeout(lpT);lpEl=null},true));
document.addEventListener('contextmenu',e=>{if(e.target.closest&&e.target.closest('#fpJ .tl .e'))e.preventDefault()},true);
/* while choosing, a tap marks / unmarks instead of opening */
document.addEventListener('click',e=>{const el=e.target.closest&&e.target.closest('#fpJ .tl .e');
  /* the click that ends the long press itself is not a tap */
  if(el&&swallow){swallow=false;e.preventDefault();e.stopPropagation();return}
  if(!SEL||!el)return;e.preventDefault();e.stopPropagation();const k=keyOf(el);if(!k)return;SEL.has(k)?SEL.delete(k):SEL.add(k);decorate()},true);
/* the journal draws itself again after changes: put the marks back */
const jObs=new MutationObserver(()=>{if(SEL)decorate()});const jObsT=setInterval(()=>{const b=$('fpJ');if(b){clearInterval(jObsT);jObs.observe(b,{childList:true})}},800);
if(typeof showView==='function'){const o=showView;showView=function(id){if(SEL&&id!=='workoutDiary'){SEL=null;decorate()}return o.apply(this,arguments)}}
const parts=()=>{const s=[],r=[],c=[];(SEL?[...SEL]:[]).forEach(k=>{const [t,id]=[k[0],k.slice(2)];(t==='s'?s:t==='r'?r:c).push(id)});return {s,r:r.map(Number),c:c.map(Number)}};
function redraw(){try{renderWorkouts(false)}catch(_){}try{renderWorkoutHistory()}catch(_){}try{if(window.fpW&&fpW.tab)fpW.tab(fpW.cur)}catch(_){}}
fp227.jDelete=async()=>{const P=parts(),n=P.s.length+P.r.length+P.c.length;if(!n)return;if(!confirm(n===1?'למחוק את האימון?':`למחוק ${n} אימונים?`))return;
  const runs=J('RUN_LOG',[]),cars=J('CARDIO_LOG',[]),runs0=JSON.stringify(runs),cars0=JSON.stringify(cars);
  const list=P.s.map(id=>({id,workoutIds:((state.data.workout.sessions||[]).find(x=>x.id===id)||{items:[]}).items.map(x=>x.id)}));
  SEL=null;decorate();
  try{if(P.s.length){try{loading()}catch(_){}state.data.workout=await call('deleteWorkoutSessions',P.s);if(P.s.includes(state.sessionId)){state.sessionId='';try{localStorage.removeItem('elaiWorkoutSession')}catch(_){}}
      if(state.activePlan&&P.s.includes(state.activePlan.sessionId)){state.activePlan=null;state.activePlanIndex=null;try{persistWorkoutPlanDraft()}catch(_){}}}
    if(P.r.length){P.r.sort((a,b)=>b-a).forEach(i=>runs.splice(i,1));setProp('RUN_LOG',JSON.stringify(runs))}
    if(P.c.length){P.c.sort((a,b)=>b-a).forEach(i=>cars.splice(i,1));setProp('CARDIO_LOG',JSON.stringify(cars))}
    redraw();
    const undo=async()=>{try{if(list.length)state.data.workout=await call('restoreWorkoutSessions',list);if(P.r.length)setProp('RUN_LOG',runs0);if(P.c.length)setProp('CARDIO_LOG',cars0);redraw();toast(n===1?'האימון הוחזר':'האימונים הוחזרו')}catch(e){toast(e.message,true)}};
    if(typeof undoToast==='function')undoToast(n===1?'האימון נמחק':n+' אימונים נמחקו',undo);else toast('נמחק')}
  catch(e){toast(e.message,true)}finally{try{loading(false)}catch(_){}}};
fp227.jMove=()=>{const P=parts(),n=P.s.length+P.r.length+P.c.length;if(!n)return;const t=(typeof state!=='undefined'&&(state.todayDate||state.date))||new Date().toISOString().slice(0,10);
  document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="fp227Move" onclick="if(event.target===this)this.remove()"><div class="sheet"><div class="sheet-head"><h3 style="margin:0">להעביר ${n===1?'אימון אחד':n+' אימונים'} ליום…</h3><button type="button" class="trash" aria-label="סגור" onclick="document.getElementById('fp227Move').remove()">✕</button></div>
    <div class="field"><label for="fp227MoveD">תאריך</label><input type="date" id="fp227MoveD" value="${esc(t)}" max="${esc(t)}"></div><button type="button" class="btn full" onclick="fp227.jMoveGo()">העבר</button></div></div>`)};
fp227.jMoveGo=async()=>{const d=($('fp227MoveD')||{}).value||'';if(!/^\d{4}-\d{2}-\d{2}$/.test(d))return toast('בחר תאריך',true);const o=$('fp227Move');if(o)o.remove();const P=parts();SEL=null;decorate();
  try{try{loading()}catch(_){}for(const id of P.s){const r=await call('changeWorkoutSessionDate',{id,date:d});if(r&&r.workout)state.data.workout=r.workout;else if(r&&r.sessions)state.data.workout=r}
    if(P.r.length){const L=J('RUN_LOG',[]);P.r.forEach(i=>{if(L[i])L[i].d=d});setProp('RUN_LOG',JSON.stringify(L))}
    if(P.c.length){const L=J('CARDIO_LOG',[]);P.c.forEach(i=>{if(L[i])L[i].d=d});setProp('CARDIO_LOG',JSON.stringify(L))}
    try{const w=await call('getWorkoutData');if(w&&w.sessions)state.data.workout=w}catch(_){}
    redraw();toast('הועבר ל'+ddmm(d))}catch(e){toast(e.message,true)}finally{try{loading(false)}catch(_){}}};
fp227.jEdit=()=>{const k=SEL&&[...SEL][0];if(!k)return;SEL=null;decorate();try{fp222.jOpen(k[0],k.slice(2))}catch(_){}};

/* =================== 3. exercise page =================== */
document.head.insertAdjacentHTML('beforeend',`<style id="fp227ex">
#fp227Ex .sheet{max-height:94vh;overflow:auto}
#fp227Ex .media{border-radius:16px;background:#0E1318;border:1px solid var(--line,#2C3640);margin:0 0 10px;overflow:hidden;min-height:150px;display:grid;place-items:center;text-align:center;color:#A3ADB8;position:relative}
#fp227Ex .media video{width:100%;max-height:300px;display:block;background:#000}
#fp227Ex .media svg.an{width:100%;height:230px;display:block}
#fp227Ex .media .lbl{position:absolute;bottom:8px;right:10px;font-size:11px;background:rgba(0,0,0,.55);border-radius:99px;padding:2px 9px}
#fp227Ex .kpi{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 0 10px}
#fp227Ex .kpi div{background:var(--card,#171C22);border:1px solid var(--line,#2C3640);border-radius:14px;padding:10px}
#fp227Ex .kpi small{display:block;color:#6B7682;font-size:11.5px;margin-bottom:3px}#fp227Ex .kpi b{font-size:17px}
#fp227Ex .hist{display:grid;grid-template-columns:auto 1fr auto;gap:6px 10px;font-size:13px;margin:0 0 10px;align-items:center}
#fp227Ex .hist span{color:#A3ADB8}#fp227Ex .hist b{font-weight:700}
</style>`);
const allEx=()=>{const out=[];try{Object.entries((state.data.workout&&state.data.workout.exercises)||{}).forEach(([g,l])=>(l||[]).forEach(x=>out.push(Object.assign({group:g},x))))}catch(_){}return out};
const exByName=n=>allEx().find(x=>low(x.name)===low(n))||null;
function weakSet(){const w=J('WEAK',{})||{},e=w.e||{},s=w.s||{};return h=>e[h.id]==='weak'||s[h.sessionId]==='weak'}
function histOf(name){const isWeak=weakSet();return ((state.data.workout&&state.data.workout.history)||[]).filter(h=>low(h.exercise)===low(name)).map(h=>Object.assign({weak:isWeak(h)},h)).sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(b.createdAt).localeCompare(String(a.createdAt)))}
const setsTxt=sets=>{const s=(sets||[]).filter(v=>v&&(Number(v.reps)>0));if(!s.length)return '—';const w=s.map(v=>v.weight===''||v.weight==null?null:Number(v.weight));
  if(w.every(x=>x===null))return s.map(v=>v.reps).join(', ')+' חזרות';if(w.every(x=>x===w[0]))return n1(w[0])+' × '+s.map(v=>v.reps).join(', ');return s.map((v,i)=>(w[i]===null?'':n1(w[i])+'×')+v.reps).join(', ')};
function bestOf(H){let b=null;H.filter(h=>!h.weak).forEach(h=>(h.sets||[]).forEach(v=>{const w=v.weight===''||v.weight==null?null:Number(v.weight),r=Number(v.reps)||0;if(!r)return;
  if(!b||(w!==null&&(b.w===null||w>b.w||(w===b.w&&r>b.r)))||(w===null&&b.w===null&&r>b.r))b={w,r,d:h.date}}));return b}
let ANraf=0;
/* 2.28: the demo with its angles (each exercise has two: from the side, and from the front / top / back — what shows it best) */
const anPat=name=>{try{const A=window.FP2Anim;if(!A||!A.map)return null;const m=A.map[A.norm?A.norm(name):name];if(!m)return null;const x=(A.pat||[]).find(p=>p.id===m[0]);return x?{x,m}:null}catch(_){return null}};
function animSvg(name,view){const r=anPat(name);if(!r)return '';
  return `<svg class="an" data-an="${esc(r.m[0])}" data-vi="${Number(r.m[1])||0}" data-v="${view|0}" viewBox="0 0 380 270" role="img" aria-label="הדגמה של ${esc(name)}"></svg>`}
function anChips(name,id,cur,extra){const r=anPat(name);if(!r)return '';const v=(r.x.v||[]).slice(0,(r.x.views||[]).length);
  const btns=(extra||[]).concat(v.map((t,i)=>({k:'v'+i,t})));if(btns.length<2)return '';
  return `<div class="fpAnV" role="group" aria-label="זווית">${btns.map(b=>`<button type="button" class="${b.k===cur?'on':''}" aria-pressed="${b.k===cur}" onclick="fp227.anView('${id}','${b.k}')">${esc(b.t)}</button>`).join('')}</div>`}
const ANV={};
fp227.anView=(id,k)=>{ANV[id]=k;if(id==='ex'){const n=EXN;fp227.ex(n,null,k);return}if(id==='wk'){wkAn(true)}};
document.head.insertAdjacentHTML('beforeend',`<style id="fp228an">
.fpAnV{display:flex;gap:6px;justify-content:center;margin:-2px 0 10px;flex-wrap:wrap}
.fpAnV button{font:inherit;font-size:13px;font-weight:700;border-radius:99px;padding:6px 14px;border:1px solid var(--line,#2C3640);background:#1F262E;color:#A3ADB8;cursor:pointer}
.fpAnV button.on{background:#222D17;border-color:var(--brand,#D7F36B);color:var(--brand,#D7F36B)}
#fp228Wk{background:var(--card,#171C22);border:1px solid var(--line,#2C3640);border-radius:16px;padding:10px 12px;margin:10px 0}
#fp228Wk .hd{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 6px}#fp228Wk .hd b{font-size:14.5px}
#fp228Wk .hd button{font:inherit;font-size:12.5px;background:none;border:0;color:#A3ADB8;padding:4px 2px;cursor:pointer}
#fp228Wk .media{border-radius:14px;background:#0E1318;border:1px solid var(--line,#2C3640);overflow:hidden;margin:0 0 8px;cursor:pointer}
#fp228Wk svg.an{width:100%;height:190px;display:block}
</style>`);
function animate(){cancelAnimationFrame(ANraf);const A=window.FP2Anim;if(!A)return;const t0=performance.now(),reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const vf=(x,s)=>x.views[Math.min(+s.dataset.v||0,x.views.length-1)];
  /* -1 = the right way (no "wrong form" marks); the exercise's own variant (one hand, cable…) */
  const va=(x,s)=>{const v=(x.variants||[])[+s.dataset.vi||0];return v?v.V:null};
  const fit=svg=>{try{const x=(A.pat||[]).find(p=>p.id===svg.dataset.an),f=vf(x,svg);let u=null;for(const e of [0,.25,.5,.75]){svg.innerHTML=f(e,-1,va(x,svg));const b=A.figBox(svg);if(b)u=u?{x0:Math.min(u.x0,b.x0),y0:Math.min(u.y0,b.y0),x1:Math.max(u.x1,b.x1),y1:Math.max(u.y1,b.y1)}:b}
    if(u){const w=u.x1-u.x0+30,h=u.y1-u.y0+50,W=Math.max(w,h*1.4);svg.setAttribute('viewBox',`${u.x0-15-(W-w)/2} ${u.y0-36} ${W} ${h}`)}}catch(_){}};
  const SEL='#fp227Ex svg.an,#fp228Wk svg.an';
  document.querySelectorAll(SEL).forEach(fit);
  const tick=now=>{const svgs=document.querySelectorAll(SEL);if(!svgs.length)return;svgs.forEach(s=>{const x=(A.pat||[]).find(p=>p.id===s.dataset.an);if(!x)return;const per=x.period||5.2,T=reduce?.3:((now-t0)/1000/per)%1;
    const d=x.loop?T:(T<.42?T/.42:T<.52?1:T<.92?1-(T-.52)/.4:0);try{s.innerHTML=vf(x,s)(d,-1,va(x,s)).replace(/<text[^>]*data-cap[^>]*>[\s\S]*?<\/text>/g,'')}catch(_){}});if(!reduce)ANraf=requestAnimationFrame(tick)};ANraf=requestAnimationFrame(tick)}
/* 2.28: inside a workout: the demo of the exercise you are on, with its angles. Tap it for the full demo (what to avoid, slow motion). */
const WKH='fp2.wkAnHide';
function wkName(){const sl=$('exerciseSelect');if(!sl||!sl.options.length||sl.selectedIndex<0)return '';return (sl.options[sl.selectedIndex].text||'').trim()}
function wkAn(force){const lp=$('lastPerformance');const old=$('fp228Wk');const name=wkName();
  if(!lp||!name||!anPat(name)){if(old)old.remove();cancelIfNone();return}
  if(old&&old.dataset.n===name&&!force)return;
  const hide=(()=>{try{return localStorage.getItem(WKH)==='1'}catch(_){return false}})();
  const k=ANV.wk&&ANV.wk!=='vid'?ANV.wk:'v0',v=+k.slice(1)||0;
  const h=`<div class="hd"><b>איך עושים: ${esc(name)}</b><button type="button" onclick="fp227.wkHide()">${hide?'להציג':'להסתיר'}</button></div>`+(hide?'':`<div class="media" data-n="${esc(name)}" onclick="try{FP2Anim.open(this.dataset.n)}catch(_){}">${animSvg(name,v)}</div>${anChips(name,'wk',k)}`);
  let box=old;if(!box){box=document.createElement('div');box.id='fp228Wk';lp.insertAdjacentElement('beforebegin',box)}
  box.dataset.n=name;box.innerHTML=h;if(!hide)animate();else cancelIfNone()}
function cancelIfNone(){if(!document.querySelector('#fp227Ex svg.an,#fp228Wk svg.an'))cancelAnimationFrame(ANraf)}
fp227.wkHide=()=>{try{localStorage.setItem(WKH,localStorage.getItem(WKH)==='1'?'0':'1')}catch(_){}wkAn(true)};
fp227.wkAn=wkAn;
if(typeof exerciseChanged==='function'){const o=exerciseChanged;exerciseChanged=function(){const r=o.apply(this,arguments);try{ANV.wk='v0';wkAn(true)}catch(e){console.warn('wkAn',e)}return r}}
let EXN='',EXURL='';
fp227.ex=async function(name,exId,vk){EXN=name;const ex=exByName(name),H=histOf(name),last=H.find(h=>!h.weak),best=bestOf(H);
  const old=$('fp227Ex');if(old)old.remove();if(EXURL){try{URL.revokeObjectURL(EXURL)}catch(_){}EXURL=''}
  const fid=(window.fp223&&fp223.vidFor)?fp223.vidFor(name):'',hasAn=!!anPat(name);
  /* 2.28: a video first (if there is one); the demo with its angles next to it */
  const k=vk||(fid?'vid':'v0'),showVid=fid&&k==='vid',an=!showVid&&hasAn?animSvg(name,+k.slice(1)||0):'';
  const chips=hasAn?anChips(name,'ex',k,fid?[{k:'vid',t:'סרטון'}]:[]):'';
  const media=(showVid?`<div class="media" id="fp227Media">טוען את הסרטון…</div>`:an?`<div class="media">${an}<span class="lbl">הדגמה</span></div>`:`<div class="media" style="padding:18px">${ic('cam',26)}<div style="margin-top:6px">לתרגיל הזה עוד אין סרטון</div><button type="button" class="btn light" style="margin-top:10px" onclick="fp227.vid()">להעלות סרטון</button></div>`)+chips;
  const rows=H.slice(0,5).filter(h=>h!==last).slice(0,4);
  const h=`<div class="overlay" id="fp227Ex" onclick="if(event.target===this)fp227.exClose()"><div class="sheet"><div class="sheet-head"><h3 style="margin:0">${esc(name)}</h3><button type="button" class="trash" aria-label="סגור" onclick="fp227.exClose()">✕</button></div>
    ${ex?`<p class="mu" style="margin:-4px 0 10px">${esc(ex.group||'')}${ex.equipment?' · '+esc(ex.equipment):''}</p>`:''}
    ${media}
    <div class="kpi"><div><small>השיא שלך</small><b>${best?(best.w===null?best.r+' חזרות':n1(best.w)+' ק״ג × '+best.r):'עוד אין'}</b></div><div><small>פעם אחרונה${last?' · '+ddmm(last.date):''}</small><b>${last?esc(setsTxt(last.sets)):'עוד לא עשית'}</b></div></div>
    ${rows.length?`<p class="mu" style="margin:0 0 6px">פעמים קודמות</p><div class="hist">${rows.map(r=>`<span>${ddmm(r.date)}</span><b>${esc(setsTxt(r.sets))}</b><span>${(r.sets||[]).length} סטים${r.weak?' · חלש':''}</span>`).join('')}</div>`:''}
    <button type="button" class="btn full" onclick="fp227.exAdd()">${ic('plus',16)} הוסף לאימון</button>
    ${ex&&origPick?`<button type="button" class="btn light full" style="margin-top:8px" onclick="fp227.plansWith('${esc(ex.id)}')">האימונים הקבועים עם התרגיל הזה</button>`:''}
    ${fid||an?`<button type="button" class="btn light full" style="margin-top:8px" onclick="fp227.vid()">${fid?'הסרטון: להחליף או לשתף':'להעלות סרטון משלי'}</button>`:''}
  </div></div>`;
  document.body.insertAdjacentHTML('beforeend',h);if(an)animate();
  if(showVid){try{const u=await fp223.vurl(fid);if(EXN!==name||!$('fp227Media')){URL.revokeObjectURL(u);return}EXURL=u;$('fp227Media').innerHTML=`<video src="${u}" controls playsinline loop muted autoplay></video>`}catch(e){const m=$('fp227Media');if(m)m.textContent='הסרטון לא נטען'}}};
fp227.exClose=()=>{const o=$('fp227Ex');if(o)o.remove();cancelAnimationFrame(ANraf);if(EXURL){try{URL.revokeObjectURL(EXURL)}catch(_){}EXURL=''}};
fp227.vid=()=>{const n=EXN;fp227.exClose();try{fpExV.open(n)}catch(_){}};
fp227.exAdd=()=>{const ex=exByName(EXN);fp227.exClose();
  const active=state.sessionId&&((state.data.workout&&state.data.workout.sessions)||[]).some(s=>s.id===state.sessionId&&s.status==='active');
  if(!active){try{showView('workoutHome')}catch(_){}toast('קודם מתחילים אימון, ואז מוסיפים את התרגיל');return}
  if(!ex){toast('התרגיל לא ברשימה שלך',true);return}
  try{showView('workouts');state.muscleGroup=ex.group;renderWorkouts(false);const s=$('exerciseSelect');if(s){s.value=ex.id;exerciseChanged()}toast('נבחר: '+EXN)}catch(e){toast(e.message,true)}};
/* "האימונים שלי": the search there already finds exercises — tapping one opens its page now.
   (Before, it showed the fixed workouts with that exercise; that is a button on the page now.) */
let LQ='',origPick=null;
const wrapPick=setInterval(()=>{if(!window.fp223||!fp223.exPick||fp223.exPick.__227)return;clearInterval(wrapPick);origPick=fp223.exPick;
  const w=function(id){if(!id)return origPick.apply(this,arguments);const x=allEx().find(e=>e.id===id);if(!x)return origPick.apply(this,arguments);fp227.ex(x.name,id)};w.__227=true;fp223.exPick=w},400);
fp227.plansWith=id=>{fp227.exClose();if(origPick)origPick(id)};
/* adding a new exercise from that search (״＋ להוסיף … כתרגיל חדש״) already works without a workout */
/* a new exercise added from the search opens its page */
if(typeof saveNewExercise==='function'){const o=saveNewExercise;saveNewExercise=async function(){const from=$('workoutLibrary')&&$('workoutLibrary').classList.contains('active'),name=(($('newExName')||{}).value||'').trim();const r=await o.apply(this,arguments);
  try{if(from&&name&&exByName(name)&&$('exerciseSheet')&&$('exerciseSheet').classList.contains('hide')){showView('workoutLibrary');fp227.ex(name)}}catch(_){}return r}}
/* the names in a workout of the journal open the exercise page too */
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('#fpTSheet .workout-item > .history-top > b');if(!b)return;fp227.ex(b.textContent.trim())},false);
})();
