/* FitPro 2.24.0
   1. fresh badges / "request approved" card right after a send or an approval (not only every few minutes)
   (more parts are added below, each with its own header) */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const prop=k=>{try{return FP2.getProp(k)||''}catch(_){return ''}};
const setProp=(k,v)=>{try{FP2.setProp(k,v)}catch(_){}};
const J=(k,d)=>{try{const v=JSON.parse(prop(k)||'null');return v==null?d:v}catch(_){return d}};
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>(typeof state!=='undefined'&&(state.todayDate||state.date))||new Date().toISOString().slice(0,10);
window.fp224=window.fp224||{};

/* ============ 1. badges and the request card: refresh now ============ */
let lastR=0;
function fresh(force){const n=Date.now();if(!force&&n-lastR<30000)return;lastR=n;
  try{window.fp223&&fp223.badgeLoad&&fp223.badgeLoad()}catch(_){}
  try{window.fpReqRefresh&&fpReqRefresh()}catch(_){}
  try{window.fp223&&fp223.reqInbox&&fp223.reqInbox()}catch(_){}}
fp224.fresh=fresh;
const LIVE=/^(exVideoSuggest|adminDecideExSuggestion|notifyNewRequest|notifyRequestDone|adminSetExVideo)$/;
const wrapPush=setInterval(()=>{if(!window.FP2||!FP2.push||FP2.push.__224)return;clearInterval(wrapPush);
  const o=FP2.push;const w=function(a){const r=o.apply(this,arguments);try{if(LIVE.test(String(a||'')))Promise.resolve(r).then(()=>setTimeout(()=>fresh(true),1500),()=>{})}catch(_){}return r};w.__224=true;try{FP2.push=w}catch(_){}},700);
const wrapReq=setInterval(()=>{if(typeof window.fpReqSend!=='function'||typeof window.fpAdmSet!=='function')return;clearInterval(wrapReq);
  ['fpReqSend','fpAdmSet'].forEach(n=>{const o=window[n];if(o.__224)return;const w=async function(){const r=await o.apply(this,arguments);setTimeout(()=>fresh(true),1200);return r};w.__224=true;window[n]=w})},700);
if(typeof showView==='function'){const o=showView;showView=function(id){const r=o.apply(this,arguments);try{if(id==='today'||id==='more'||id==='settings')fresh(false)}catch(_){}return r}}

/* ============ 6. iPhone / iPad: the top of the screen stays in place ============
   After the keyboard closes (or the iPad turns), iOS sometimes leaves the page shifted up, so the top looks cut.
   The viewport now has viewport-fit=cover from the first paint (index.html), and here the page is put back. */
function settle(){try{const vv=window.visualViewport;if(vv&&vv.offsetTop>0.5&&!document.activeElement.matches('input,textarea,select,[contenteditable]'))window.scrollTo(window.scrollX,window.scrollY)}catch(_){}
  try{if(document.scrollingElement&&document.scrollingElement.scrollTop<0)document.scrollingElement.scrollTop=0}catch(_){}}
document.addEventListener('focusout',()=>setTimeout(settle,250),true);
window.addEventListener('orientationchange',()=>setTimeout(settle,400));
if(window.visualViewport)visualViewport.addEventListener('resize',()=>setTimeout(settle,200));

/* ============ 8. "תרגיל חדש": muscles in squares, and the new exercise goes straight where you were picking ============ */
document.head.insertAdjacentHTML('beforeend',`<style id="fp224css8">
#newExGroups,#newExEquip{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:4px 0 10px}
#newExEquip{grid-template-columns:repeat(2,minmax(0,1fr))}
#newExGroups .chip,#newExEquip .chip{font:inherit;font-size:13.5px;border-radius:14px!important;min-height:50px;margin:0!important;padding:8px 4px!important;display:flex;align-items:center;justify-content:center;text-align:center;line-height:1.2;white-space:normal!important;background:#1F262E!important;border:1px solid var(--line,#2C3640)!important;color:var(--muted,#A3ADB8)!important}
#newExGroups .chip.active,#newExEquip .chip.active{background:#222D17!important;border-color:var(--brand,#D7F36B)!important;color:var(--ink,#F2F5F7)!important;font-weight:700}
</style>`);
let pendPick=null;
const waitLib=setInterval(()=>{if(!window.FP2Lib||!FP2Lib.addNew||FP2Lib.addNew.__224)return;clearInterval(waitLib);
  const o=FP2Lib.addNew;FP2Lib.addNew=function(){pendPick=state.pickMode&&state.pickMode.onPick?state.pickMode:null;viaAdd=true;return o.apply(this,arguments)};FP2Lib.addNew.__224=true},500);
if(typeof saveNewExercise==='function'){const o=saveNewExercise;saveNewExercise=async function(){
  const pm=pendPick,name=(($('newExName')||{}).value||'').trim(),n=state.newEx||{},group=n.newGroup?(($('newExGroupName')||{}).value||'').trim():n.group;
  const r=await o.apply(this,arguments);
  try{if(pm&&name&&$('exerciseSheet')&&$('exerciseSheet').classList.contains('hide')){pendPick=null;const ex=((state.data.workout.exercises||{})[group]||[]).find(x=>x.name===name);if(ex&&pm.onPick&&pm.current!==ex.id)pm.onPick(ex.id)}}catch(e){console.warn(e)}
  return r}}
/* opened from anywhere else = nothing to fill afterwards */
let viaAdd=false;
if(typeof openNewExerciseSheet==='function'){const o=openNewExerciseSheet;openNewExerciseSheet=function(){if(!viaAdd)pendPick=null;viaAdd=false;return o.apply(this,arguments)}}

/* ============ 10. settings: only the admin sees the technical things ============
   "בדיקת AI" and "מתקדם" (all the food databases, OpenAI) move to "ניהול (רק למנהל)".
   "אפליקציה אמיתית (מסך הבית)" and "שייק חלבון" come out of "מתקדם", so every user keeps them (in "הגדרות נוספות"). */
function adminSets(){const root=$('settings'),adm=$('fpFolderAdm');if(!root||!adm)return;const admBody=adm.querySelector(':scope > .settings-body');if(!admBody)return;
  const sum=d=>((d.querySelector(':scope > summary')||{}).textContent||'').trim();
  const adv=[...root.querySelectorAll('details.settings-section')].find(d=>/^מתקדם/.test(sum(d)));
  const more=$('moreSettings'),moreBody=more&&more.querySelector(':scope > .settings-body');
  if(adv&&moreBody){const body=adv.querySelector(':scope > .settings-body')||adv;[...body.querySelectorAll(':scope > details.settings-section')].forEach(d=>{if(/אפליקציה אמיתית|שייק חלבון/.test(sum(d))){d.classList.remove('admin-only');moreBody.insertBefore(d,adv.parentElement===moreBody?adv:null)}})}
  if(adv&&adv.parentElement!==admBody){adv.classList.add('admin-only');admBody.appendChild(adv)}
  const ai=$('fpAiCheck');if(ai){ai.classList.add('admin-only');if(ai.parentElement!==admBody)admBody.appendChild(ai)}}
fp224.adminSets=adminSets;
if(typeof renderSettings==='function'){const o=renderSettings;renderSettings=function(){const r=o.apply(this,arguments);try{setTimeout(adminSets,0);setTimeout(adminSets,600)}catch(_){}return r}}
setInterval(()=>{try{if($('settings')&&$('settings').classList.contains('active'))adminSets()}catch(_){}},2000);

/* ============ 12. strength: every new exercise in a fixed workout starts with 2 sets (Settings → אימונים → כוח changes it) ============ */
const defSetsN=()=>{const v=Number(prop('DEF_SETS'));return v>=1&&v<=10?v:2};
fp224.defSetsN=defSetsN;
fp224.defSets=d=>{const v=Math.max(1,Math.min(10,defSetsN()+d));setProp('DEF_SETS',String(v));const b=$('fpDefSets');if(b)b.textContent=v};
if(typeof addWorkoutPlanItem==='function'){const o=addWorkoutPlanItem;addWorkoutPlanItem=function(){const n0=(state.planItems||[]).length;const r=o.apply(this,arguments);
  try{const it=state.planItems;if(it&&it.length>n0){const x=it[it.length-1];if(x&&Number(x.sets)===3){x.sets=defSetsN();renderWorkoutPlanItems()}}}catch(e){console.warn(e)}return r}}

/* ============ 13. "התאמה למה שנשאר": a household measure + grams ============
   Bread in slices, cheese in a cup / half a cup / a spoon, tuna in a can — with the grams next to it ("2 פרוסות (80 ג׳)").
   The suggested amount is rounded to that measure, so it is something you can really take. */
const PL={'פרוסה':'פרוסות','כף':'כפות','כפית':'כפיות','גביע':'גביעים','פחית':'פחיות','קופסה':'קופסאות','יחידה':'יחידות','כוס':'כוסות','מנה':'מנות','חתיכה':'חתיכות','ביצה':'ביצים','פיתה':'פיתות','לחמנייה':'לחמניות','קערה':'קערות','מנה מהאריזה':'מנות מהאריזה'};
const BIG=/גביע|פחית|קופסה|קערה|כוס|מנה מהאריזה/;
function genericUnits(name){const n=String(name||'');const u=[];
  if(/לחם|טוסט|חלה/.test(n))u.push(['פרוסה',30]);
  if(/טונה/.test(n))u.push(['פחית',120]);
  if(/קוטג|גבינה לבנה|גבינת שמנת|גבינה רכה|יוגורט|לבנה|לבן|שמנת|גבינת שמנת|ריקוטה|סקי/.test(n))u.push(['גביע',250],['כף',20],['כפית',7]);
  if(/טחינה|חמאת|ממרח|דבש|ריבה|שמן|חמאה|מיונז|קטשופ|רוטב|חומוס/.test(n))u.push(['כף',15],['כפית',5]);
  if(/אורז|פסטה|קינואה|בורגול|פתיתים|קוסקוס|עדשים|שעועית/.test(n))u.push(['כוס',160]);
  return u}
function unitsOf(x){const own=((x&&x.units)||[]).filter(u=>u&&u[0]&&u[0]!=='גרם'&&u[0]!=='מ״ל'&&Number(u[1])>0).map(u=>[u[0],Number(u[1])]);
  const have=new Set(own.map(u=>u[0]));genericUnits(x&&x.name).forEach(u=>{if(!have.has(u[0]))own.push(u)});return own}
const half=v=>Math.round(v*2)/2,quarter=v=>Math.round(v*4)/4;
function countTxt(c,u){const pl=PL[u]||u,multi=/\s/.test(u);if(c===0.25)return 'רבע '+u;if(c===0.5)return 'חצי '+u;if(c===0.75)return '3/4 '+u;
  if(c===1)return multi?'1 '+u:u+' '+(/^(גביע|כוס)$/.test(u)&&u==='גביע'?'אחד':'אחת');return (Number.isInteger(c)?c:String(c))+' '+pl}
/* the best measure for a weight: the biggest unit that still gives a sensible number (½ … 6) */
function measureFor(x,g){if(!(g>0))return null;const us=unitsOf(x).sort((a,b)=>b[1]-a[1]);let best=null;
  for(const [u,ug] of us){const step=BIG.test(u)?quarter:half;const c=step(g/ug);if(c<0.5||c>6)continue;const m={u,ug,c,g:Math.round(c*ug)},err=Math.abs(m.g-g)/g;
    if(err<=0.1)return m;if(!best||err<best.err)best=Object.assign(m,{err})}
  return best}
const mLabel=m=>m?`${countTxt(m.c,m.u)} (${m.g} ג׳)`:'';
fp224.measureFor=measureFor;fp224.mLabel=mLabel;
/* round the suggestion to the measure */
if(typeof suggestPortions==='function'){const o=suggestPortions;suggestPortions=function(){const s=o.apply(this,arguments);
  try{(s.rows||[]).forEach(r=>{const x=state.customIngredients[r.i];if(!x||r.unit!=='גרם'||x.cut)return;const m=measureFor(x,r.amount);if(!m)return;r.measure=m;
      if(r.fixed==null&&r.amount>0&&m.g>0){const f=m.g/r.amount;r.kcal*=f;r.protein*=f;r.amount=m.g}});
    s.kcal=(s.rows||[]).reduce((a,r)=>a+(r.kcal||0),0);s.protein=(s.rows||[]).reduce((a,r)=>a+(r.protein||0),0)}catch(e){console.warn(e)}return s}}
/* show it under each name, and keep it in step when you type grams */
/* 2.25 (sketch C): the measure with + / − next to the grams; the grams can still be typed */
function fitM(r){const x=state.customIngredients[r.i];if(!x||x.cut)return null;
  if(r.unit==='גרם'){const m=measureFor(x,r.amount);return m?Object.assign({g:true},m):null}
  const ug=(typeof foodUnitGrams==='function'&&foodUnitGrams(x.per?{units:x.units,unit:x.per.unit,name:x.name}:x,r.unit))||0;return {g:false,u:r.unit,c:Number(r.amount)||0,ug}}
function fitLabels(){const s=state.fit&&state.fit.result;if(!s||!$('fitPreview'))return;const rows=[...$('fitPreview').querySelectorAll('.fit-row')];
  s.rows.forEach((r,k)=>{const el=rows[k];if(!el)return;const old=el.querySelector('.fpMeas');if(old)old.remove();const m=fitM(r);let t=el.querySelector('.fpMs');
    if(!m){if(t)t.remove();return}
    if(!t){t=document.createElement('div');t.className='fpMs';const f=el.querySelector('.fit-amount')||el.querySelector('.field');if(f){f.before(t);el.classList.add('fpMsRow')}else el.appendChild(t)}
    const txt=m.g?countTxt(m.c,m.u):countTxt(m.c,m.u)+(m.ug?` (${Math.round(m.c*m.ug)} ג׳)`:'');
    t.innerHTML=`<span class="lb">מידה</span><span class="row2"><button type="button" aria-label="יותר" onclick="fp224.fitStep(${r.i},1)">+</button><b>${esc(txt)}</b><button type="button" aria-label="פחות" onclick="fp224.fitStep(${r.i},-1)">−</button></span>`})}
fp224.fitStep=(i,d)=>{const s=state.fit&&state.fit.result;if(!s)return;const r=s.rows.find(z=>z.i===i);if(!r)return;const m=fitM(r);if(!m)return;
  const st=m.g?(BIG.test(m.u)?0.25:0.5):0.5,c=Math.max(st,Math.round((m.c+d*st)/st)*st),v=m.g?Math.round(c*m.ug):c;
  if(typeof setFitAmount==='function')setFitAmount(i,String(v));const inp=[...$('fitPreview').querySelectorAll('.fit-row')][s.rows.indexOf(r)];const box=inp&&inp.querySelector('.fit-amount input,.field input');if(box)box.value=v;try{fitLabels()}catch(_){}};
document.head.insertAdjacentHTML('beforeend',`<style id="fp225fit">#fitPreview .fpMsRow .history-top{flex-wrap:wrap;gap:8px;align-items:center}#fitPreview .fpMsRow .history-top>span:first-child{flex:0 0 100%;font-weight:700}
#fitPreview .fpMs{flex:1;min-width:0}#fitPreview .fpMs .lb{display:none}
#fitPreview .fpMs .row2{display:flex;align-items:center;justify-content:space-between;background:#1F262E;border:1px solid var(--line,#2C3640);border-radius:12px;padding:3px}
#fitPreview .fpMs button{width:34px;height:34px;border-radius:9px;border:0;background:#171C22;color:var(--ink,#F2F5F7);font:inherit;font-size:18px;font-weight:800;cursor:pointer}
#fitPreview .fpMs b{color:var(--brand,#D7F36B);font-size:13.5px;text-align:center;flex:1}</style>`);
if(typeof previewFit==='function'){const o=previewFit;previewFit=function(){const r=o.apply(this,arguments);try{fitLabels()}catch(_){}return r}}
if(typeof updateFitTotals==='function'){const o=updateFitTotals;updateFitTotals=function(){const r=o.apply(this,arguments);try{fitLabels()}catch(_){}return r}}
/* after "החל כמויות" the meal shows the measure too ("2 פרוסה (30 ג׳)") */
if(typeof applyFit==='function'){const o=applyFit;applyFit=function(){const rows=((state.fit&&state.fit.result&&state.fit.result.rows)||[]).map(r=>Object.assign({},r));const r0=o.apply(this,arguments);
  try{let ch=false;rows.forEach(r=>{const x=state.customIngredients[r.i];if(!x||!x.per||x.cut||r.unit!=='גרם'||!(r.amount>0))return;const m=measureFor(x,r.amount);if(!m||Math.abs(m.g-r.amount)>Math.max(2,r.amount*0.04))return;
      x.units=(x.units||[]).slice();if(!x.units.some(u=>u[0]===m.u))x.units.push([m.u,m.ug,true]);x.unit=m.u;x.amount=m.c;recalcCustomIngredient(x);ch=true});
    if(ch)renderCustomIngredients()}catch(e){console.warn(e)}return r0}}

/* ============ 14. "ארוחה חדשה": the category follows the clock (the meal hours from the settings); still changeable ============ */
if(typeof openCustomMealBuilder==='function'){const o=openCustomMealBuilder;openCustomMealBuilder=function(mealId){const r=o.apply(this,arguments);
  try{if(!mealId&&typeof defaultMealSection==='function'){const c=$('customMealCategory'),v=defaultMealSection();if(c&&[...c.options].some(x=>x.value===v||x.textContent===v))c.value=v}}catch(_){}return r}}

/* ============ 16. the small run / cardio box: drag it anywhere, like the strength pill; a tap opens it ============ */
document.head.insertAdjacentHTML('beforeend',`<style id="fp224css16">
#fpRunFloat.fpDrag,#fpCarFloat.fpDrag,#fpSRFloat.fpDrag{right:auto!important;bottom:auto!important;width:min(300px,calc(100vw - 24px));touch-action:none;user-select:none;-webkit-user-select:none}
#fpRunFloat.fpDrag::before,#fpCarFloat.fpDrag::before,#fpSRFloat.fpDrag::before{content:"";position:absolute;top:4px;left:50%;width:28px;height:3px;margin-left:-14px;border-radius:3px;background:#46525F}
</style>`);
const FKEY={fpRunFloat:'fp2.runFloatXY',fpCarFloat:'fp2.carFloatXY',fpSRFloat:'fp2.runFloatXY'};
function dragify(el){if(!el||el.__fpDrag)return;el.__fpDrag=1;el.classList.add('fpDrag');const key=FKEY[el.id];
  const H=()=>window.innerHeight,Wd=()=>window.innerWidth;let x0=0,y0=0,l0=0,t0=0,moved=false,down=false;
  const put=(l,t)=>{const w=el.offsetWidth||280,h=el.offsetHeight||60;el.style.left=Math.max(6,Math.min(Wd()-w-6,l))+'px';el.style.top=Math.max(50,Math.min(H()-h-70,t))+'px'};
  let xy=null;try{xy=JSON.parse(localStorage.getItem(key)||'null')}catch(_){}
  requestAnimationFrame(()=>put(xy&&xy[0]>=0&&xy[0]<1?xy[0]*Wd():(Wd()-(el.offsetWidth||280))/2,xy&&xy[1]>0&&xy[1]<1?xy[1]*H():H()-(el.offsetHeight||60)-90));
  el.addEventListener('pointerdown',e=>{down=true;moved=false;x0=e.clientX;y0=e.clientY;const r=el.getBoundingClientRect();l0=r.left;t0=r.top;try{el.setPointerCapture(e.pointerId)}catch(_){}});
  el.addEventListener('pointermove',e=>{if(!down)return;const dx=e.clientX-x0,dy=e.clientY-y0;if(Math.abs(dx)>6||Math.abs(dy)>6)moved=true;if(moved)put(l0+dx,t0+dy)});
  el.addEventListener('pointerup',()=>{down=false;if(moved){try{localStorage.setItem(key,JSON.stringify([parseFloat(el.style.left)/Wd(),parseFloat(el.style.top)/H()]))}catch(_){}}});
  el.addEventListener('pointercancel',()=>{down=false});
  /* after a drag the tap does not open it */
  el.addEventListener('click',e=>{if(moved){moved=false;e.preventDefault();e.stopPropagation()}},true)}
new MutationObserver(()=>{['fpRunFloat','fpCarFloat','fpSRFloat'].forEach(id=>{const el=$(id);if(el)dragify(el)})}).observe(document.body,{childList:true});

/* ============ 11. "צור אימון קבוע": "הוסף תרגיל" on top (new exercises already show right under it, last in the workout); "שמור" stays at the bottom ============ */
function addOnTop(){const b=$('workoutPlanBuilder'),items=$('workoutPlanItems');if(!b||!items)return;const btn=[...b.querySelectorAll(':scope > button')].find(x=>/addWorkoutPlanItem/.test(x.getAttribute('onclick')||''));
  if(btn&&btn.nextElementSibling!==items){btn.style.margin='4px 0 10px';items.before(btn)}}
if(typeof openWorkoutPlanBuilder==='function'){const o=openWorkoutPlanBuilder;openWorkoutPlanBuilder=function(){const r=o.apply(this,arguments);try{addOnTop()}catch(_){}return r}}
setTimeout(addOnTop,1500);

/* ============ 17. "היה חלש" / "היה טוב מאוד" ============
   Per exercise and for the whole workout, at the end of a workout (the journal sheet opens by itself) or later in the journal.
   - "פעם שעברה" in the exercise screen skips what was marked weak (it shows the last normal result).
   - "טוב מאוד" is only a pat on the back: next time a short line says so. Progression stays as it is.
   - the same exercise weak twice in a row → right under it: lower the weight and climb back slowly? "כן" → a reminder the next times. */
const MK=()=>{const o=J('WEAK',{})||{};o.s=o.s||{};o.e=o.e||{};return o};
const mkSave=o=>setProp('WEAK',JSON.stringify(o));
const hist=()=>((state.data&&state.data.workout&&state.data.workout.history)||[]);
const sessList=()=>((state.data&&state.data.workout&&state.data.workout.sessions)||[]);
function markOf(h,o){o=o||MK();return (h&&(o.e[h.id]||o.s[h.sessionId]))||''}
fp224.markOf=h=>markOf(h);
const tOf=h=>{const t=Date.parse(h.createdAt||'');return String(h.date||'')+'|'+(isFinite(t)?String(t).padStart(15,'0'):'')};
const topW=h=>Math.max(0,...((h&&h.sets)||[]).map(x=>Number(x.weight)||0));
const stepFor=w=>w<20?1:2.5;
const roundTo=(v,st)=>Math.round(v/st)*st;
/* the entry before this one, same exercise, another workout */
function before(h){return hist().filter(x=>x.exercise===h.exercise&&x.sessionId!==h.sessionId&&tOf(x)<tOf(h)).sort((a,b)=>tOf(b).localeCompare(tOf(a)))}
function twiceWeak(h,o){o=o||MK();if(markOf(h,o)!=='weak')return null;const prev=before(h);if(!prev.length||markOf(prev[0],o)!=='weak')return null;
  /* 2.27: also for a new exercise (no earlier good result): lower from the heavier of the two weak ones. Without weights: a short note. */
  const base=prev.find(x=>markOf(x,o)!=='weak');const from=base?topW(base):Math.max(topW(h),topW(prev[0]));if(!(from>0))return {bw:true,name:h.exercise};
  const st=stepFor(from),w=Math.max(st,roundTo(from*0.9,st));if(w>=from)return null;return {from,w,st,name:h.exercise}}
const DL=()=>J('DELOAD',{})||{};const ASK=()=>J('DELOAD_ASKED',{})||{};
/* the marks inside the journal sheet of a strength workout */
document.head.insertAdjacentHTML('beforeend',`<style id="fp224css17">
.fpMk{display:flex;gap:7px;margin:8px 0 2px}.fpMk button{flex:1;font:inherit;font-size:13px;font-weight:700;border-radius:12px;padding:8px 6px;border:1px solid var(--line,#2C3640);background:#1F262E;color:var(--muted,#A3ADB8);cursor:pointer}
.fpMk button.w.on{background:#2E2114;border-color:#FFB86B;color:#FFB86B}.fpMk button.g.on{background:#16261B;border-color:#6EE787;color:#6EE787}
.fpMk button.inh{opacity:.7;border-style:dashed}
.fpMkTop{background:var(--card,#171C22);border:1px solid var(--line,#2C3640);border-radius:16px;padding:11px 12px;margin:0 0 10px}
.fpMkTop b{font-size:14.5px}.fpMkTop small{display:block;color:var(--muted,#A3ADB8);font-size:12px;margin-top:2px}
.fpDlQ{background:#2A2410;border:1px solid #6b5a22;border-radius:14px;padding:10px 11px;margin:8px 0 2px;color:#FFD98A}
.fpDlQ b{font-size:13.5px}.fpDlQ p{margin:3px 0 8px;font-size:13px}.fpDlQ .r{display:flex;gap:7px}.fpDlQ .r button{flex:1;font:inherit;font-weight:800;border-radius:11px;padding:8px;border:0;cursor:pointer}
.fpDlQ .r .y{background:#D7F36B;color:#14190a}.fpDlQ .r .n{background:#1F262E;color:#F2F5F7;border:1px solid var(--line,#2C3640)}
.fpJtag{font-size:10.5px;border-radius:99px;padding:1px 7px;margin-inline-start:6px;vertical-align:middle;font-weight:700}
.fpJtag.w{background:rgba(255,184,107,.15);color:#FFB86B}.fpJtag.g{background:rgba(110,231,135,.13);color:#6EE787}
.fpRemind{background:#14222E;border:1px solid #2F4A60;border-radius:14px;padding:10px 12px;margin:0 0 8px;font-size:13.5px}
.fpRemind.good{background:#16261B;border-color:#2F5A3A}.fpRemind b{display:block;margin-bottom:2px}
</style>`);
let JUST='';
function mkBtns(kind,id,cur,inh){const on=v=>cur===v?' on':'',ih=v=>!cur&&inh===v?' on inh':'';
  return `<div class="fpMk"><button type="button" class="w${on('weak')}${ih('weak')}" onclick="fp224.mk('${kind}','${esc(id)}','weak')">היה חלש</button><button type="button" class="g${on('good')}${ih('good')}" onclick="fp224.mk('${kind}','${esc(id)}','good')">היה טוב מאוד</button></div>`}
function decorate(sid){const sh=$('fpTSheet');if(!sh)return;const s=sessList().find(x=>x.id===sid);if(!s)return;const o=MK(),dl=DL(),ask=ASK();
  sh.querySelectorAll('.fpMkTop,.fpMk,.fpDlQ').forEach(e=>e.remove());
  const items=[...sh.querySelectorAll('.workout-item')];if(!items.length)return;
  items[0].insertAdjacentHTML('beforebegin',`<div class="fpMkTop">${JUST===sid?'<b>סיימת! איך היה?</b>':'<b>איך היה האימון?</b>'}<small>לכל האימון, או לכל תרגיל לחוד למטה. ״חלש״ לא נכנס ל״פעם שעברה״.</small>${mkBtns('s',sid,o.s[sid]||'','')}</div>`);
  (s.items||[]).forEach((h,i)=>{const el=items[i];if(!el)return;el.insertAdjacentHTML('beforeend',mkBtns('e',h.id,o.e[h.id]||'',o.s[sid]||''));
    const q=twiceWeak(h,o);if(q&&q.bw&&!ask[h.id])el.insertAdjacentHTML('beforeend',`<div class="fpDlQ" id="fpDlQ_${esc(h.id)}"><b>פעמיים ברצף זה היה חלש</b><p>בפעם הבאה כדאי קצת פחות חזרות או גרסה קלה יותר, ולעלות חזרה לאט לאט.</p><div class="r"><button type="button" class="y" onclick="fp224.dl('${esc(h.id)}',0)">הבנתי</button></div></div>`);
    else if(q&&!q.bw&&!ask[h.id]&&!dl[h.exercise])el.insertAdjacentHTML('beforeend',`<div class="fpDlQ" id="fpDlQ_${esc(h.id)}"><b>פעמיים ברצף זה היה חלש</b><p>להוריד ל-${q.w} ק״ג ולעלות חזרה לאט לאט עד ${q.from}?</p><div class="r"><button type="button" class="y" onclick="fp224.dl('${esc(h.id)}',1)">כן</button><button type="button" class="n" onclick="fp224.dl('${esc(h.id)}',0)">לא, נשאר</button></div></div>`);
    else if(ask[h.id]==='yes')el.insertAdjacentHTML('beforeend',`<div class="fpDlQ"><b>סגור.</b><p style="margin:3px 0 0">בפעם הבאה ב${esc(h.exercise)} מתחילים ב-${(dl[h.exercise]||{}).w||''} ק״ג ועולים לאט.</p></div>`)})}
/* 2.25: right after "סיים אימון": only "איך היה האימון?" (no list of sets), then "שמור" */
function finishSheet(sid){const s=sessList().find(x=>x.id===sid);if(!s||!window.fpT)return;
  fpT._.sheet('סיימת!',`<p class="mu" style="margin:0 0 8px">${esc(s.name||'אימון')} · ${(s.items||[]).length} תרגילים</p>${(s.items||[]).map(h=>`<div class="workout-item fpFinIt"><div class="history-top"><b>${esc(h.exercise)}</b></div></div>`).join('')}
    <button type="button" class="btn full" style="margin-top:10px" onclick="fp224.finSave()">שמור</button>`);decorate(sid)}
fp224.finSave=()=>{try{fpT.close()}catch(_){}try{toast('האימון נשמר ביומן')}catch(_){}};
fp224.finishSheet=finishSheet;
fp224.mk=(kind,id,v)=>{const o=MK(),m=kind==='s'?o.s:o.e;m[id]=m[id]===v?'':v;if(!m[id])delete m[id];mkSave(o);
  const sid=kind==='s'?id:((hist().find(h=>h.id===id)||{}).sessionId);try{decorate(sid)}catch(e){console.warn(e)}try{jTags()}catch(_){}};
fp224.dl=(hid,yes)=>{const h=hist().find(x=>x.id===hid);if(!h)return;const a=ASK();a[hid]=yes?'yes':'no';setProp('DELOAD_ASKED',JSON.stringify(a));
  if(yes){const q=twiceWeak(h);if(q&&!q.bw){const d=DL();d[h.exercise]={w:q.w,from:q.from,st:q.st,d:h.date,since:tOf(h)};setProp('DELOAD',JSON.stringify(d))}}
  const el=$('fpDlQ_'+hid);if(el){if(yes)decorate(h.sessionId);else el.remove()}};
const waitJ=setInterval(()=>{if(!window.fp222||!fp222.jOpen||fp222.jOpen.__224)return;clearInterval(waitJ);const o=fp222.jOpen;
  fp222.jOpen=function(t,id){const r=o.apply(this,arguments);if(t==='s')try{decorate(id)}catch(e){console.warn(e)}return r};fp222.jOpen.__224=true},400);
/* the end of a workout opens that sheet, so you can mark right away */
['finishPlanWorkout','finishActiveWorkout'].forEach(n=>{if(typeof window[n]!=='function')return;const o=window[n];window[n]=async function(){
  const id=(state.activePlan&&state.activePlan.sessionId)||state.sessionId;const r=await o.apply(this,arguments);
  try{const s=sessList().find(x=>x.id===id);if(id&&s&&s.status!=='active'&&(s.items||[]).length){JUST=id;setTimeout(()=>{finishSheet(id);setTimeout(()=>{JUST=''},500)},350)}}catch(e){console.warn(e)}return r}});
/* tags in the journal list */
function jTags(){const box=$('fpJ');if(!box)return;const o=MK();const bySess={};Object.keys(o.s).forEach(k=>bySess[k]=o.s[k]);
  hist().forEach(h=>{const m=o.e[h.id];if(m&&!bySess[h.sessionId])bySess[h.sessionId]=bySess[h.sessionId]||('part_'+m)});
  /* runs and cardio too */
  [['r','RUN_LOG'],['c','CARDIO_LOG']].forEach(([t,key])=>{const L=J(key,[]);box.querySelectorAll('button.e.'+t).forEach(b=>{const m=(b.getAttribute('onclick')||'').match(/jOpen\('[rc]','(\d+)'\)/);if(!m)return;const v=o.e[rKey(t,L[Number(m[1])])]||'';const nm=b.querySelector('b');if(!nm)return;let tg=nm.querySelector('.fpJtag');if(!v){if(tg)tg.remove();return}if(!tg){tg=document.createElement('span');nm.appendChild(tg)}tg.className='fpJtag '+(v==='weak'?'w':'g');tg.textContent=v==='weak'?'חלש':'מעולה'})});
  box.querySelectorAll('button.e.s').forEach(b=>{const m=(b.getAttribute('onclick')||'').match(/jOpen\('s','([^']+)'\)/);if(!m)return;const v=bySess[m[1]]||'';const nm=b.querySelector('b');if(!nm)return;let t=nm.querySelector('.fpJtag');
    if(!v){if(t)t.remove();return}const w=/weak/.test(v);if(!t){t=document.createElement('span');nm.appendChild(t)}t.className='fpJtag '+(w?'w':'g');t.textContent=v.startsWith('part_')?(w?'תרגיל חלש':'תרגיל מעולה'):(w?'חלש':'מעולה')})}
let jT=0;new MutationObserver(()=>{clearTimeout(jT);jT=setTimeout(()=>{try{jTags()}catch(_){}},60)}).observe(document.body,{childList:true,subtree:true});
/* the exercise screen: "פעם שעברה" = the last result that was not weak; a line after "טוב מאוד"; the slow climb back after a lighter start */
if(typeof exerciseChanged==='function'){const o=exerciseChanged;exerciseChanged=function(){
  /* 2.25: no exercise marked in the list (it belongs to another muscle tab) → take the first one instead of a red error */
  try{const sl=$('exerciseSelect');if(sl&&sl.options.length&&sl.selectedIndex<0)sl.selectedIndex=0}catch(_){}
  const W=state.data&&state.data.workout;let keep=null;const mk=MK();
  try{if(W&&Array.isArray(W.history)&&(Object.keys(mk.e).length||Object.keys(mk.s).length)){keep=W.history;W.history=keep.filter(h=>markOf(h,mk)!=='weak'||h.sessionId===((state.activePlan&&state.activePlan.sessionId)||state.sessionId))}}catch(_){}
  let r;try{r=o.apply(this,arguments)}finally{if(keep)W.history=keep}
  try{remind()}catch(e){console.warn(e)}return r}}
function remind(){const lp=$('lastPerformance'),sel=$('exerciseSelect');if(!lp||!sel||!sel.options.length||sel.selectedIndex<0)return;const name=sel.options[sel.selectedIndex].text;const old=lp.querySelector('.fpRemind');if(old)old.remove();
  const mk=MK(),cur=(state.activePlan&&state.activePlan.sessionId)||state.sessionId,mine=hist().filter(h=>h.exercise===name&&h.sessionId!==cur);
  const d=DL(),x=d[name];let html='';
  if(x){const after=mine.filter(h=>tOf(h)>x.since&&markOf(h,mk)!=='weak').sort((a,b)=>tOf(b).localeCompare(tOf(a)));const lastW=after.length?topW(after[0]):0;
    if(lastW>=x.from){delete d[name];setProp('DELOAD',JSON.stringify(d))}
    else{lp.querySelectorAll('.suggest').forEach(e=>e.remove());const target=after.length?Math.min(x.from,Math.max(x.w,lastW+x.st)):x.w;
      html=after.length?`<div class="fpRemind"><b>הדרך חזרה ל-${x.from} ק״ג</b>היום ${target} ק״ג. לאט ובטוח. <button type="button" class="btn light mini" onclick="fillSuggestion(${target},0)">מלא</button></div>`
        :`<div class="fpRemind"><b>עברנו ל-${x.w} ק״ג</b>כי היו 2 אימונים חלשים ברצף. תן את המקסימום שלך, ומכאן נעלה. <button type="button" class="btn light mini" onclick="fillSuggestion(${x.w},0)">מלא</button></div>`}}
  if(!html){const last=mine.filter(h=>markOf(h,mk)!=='weak').sort((a,b)=>tOf(b).localeCompare(tOf(a)))[0];if(last&&markOf(last,mk)==='good')html='<div class="fpRemind good"><b>פעם שעברה היה אימון מעולה</b>נתת 100%. ככה ממשיכים.</div>'}
  if(html)lp.insertAdjacentHTML('afterbegin',html)}
fp224.remind=remind;

/* ============ 18. runs with sets: intervals, hills, fartlek, track ============
   Built from parts (sketch 18B): warm-up · repeat × N (run + rest) · cool-down, and you can add parts. You set the sets, the meters and the rest.
   A suggested run comes in the same form and can be changed. On the run: a ring per set (sketch 18A), and it can be made small.
   Fartlek has a big "שינוי קצב" button, the track a "+ סיבוב" button (planned: "סיבוב 3 מתוך 8"; spontaneous: laps until you stop).
   Next time, the same fixed run asks: "פעם שעברה עשית X. ההמלצה עכשיו: Y. רוצה?" */
const mmss=x=>{x=Math.max(0,Math.round(x||0));return Math.floor(x/60)+':'+String(x%60).padStart(2,'0')};
const STK=['int','hill','fart','track'];
const kindOfType=t=>{try{return fpT._.kindOf({type:t})}catch(_){return 'easy'}};
const KN=k=>{try{return fpT._.RK[k].n}catch(_){return k}};
function defST(k){if(k==='track')return {k,b:[{k:'wu',min:10},{k:'laps',n:8,len:400},{k:'cd',min:5}]};
  if(k==='hill')return {k,b:[{k:'wu',min:10},{k:'rep',n:6,u:'t',v:30,rt:90,rm:'walk'},{k:'cd',min:5}]};
  if(k==='fart')return {k,b:[{k:'wu',min:10},{k:'rep',n:6,u:'t',v:60,rt:120,rm:'jog'},{k:'cd',min:5}]};
  return {k:'int',b:[{k:'wu',min:10},{k:'rep',n:6,u:'d',v:400,rt:90,rm:'walk'},{k:'cd',min:5}]}}
const vTxt=b=>b.u==='d'?(b.v>=1000?(b.v/1000)+' ק״מ':b.v+' מ׳'):(b.v<60?b.v+' שנ׳':mmss(b.v)+' דק׳');
function stName(st){const r=st.b.find(b=>b.k==='rep'),l=st.b.find(b=>b.k==='laps');if(l)return `${l.n} סיבובים × ${l.len} מ׳`;if(r)return `${r.n} × ${vTxt(r)}`;return KN(st.k)}
function stEst(st){let t=0,m=0;const pace=330;st.b.forEach(b=>{if(b.k==='wu'||b.k==='cd'||b.k==='run'){t+=b.min*60;m+=b.min*60/400*1000}
  if(b.k==='rep'){const w=b.u==='d'?b.v/1000*270:b.v;t+=b.n*w+(b.n-1)*b.rt;m+=b.u==='d'?b.n*b.v:b.n*b.v/270*1000;if(b.rm==='jog')m+=(b.n-1)*b.rt/400*1000}
  if(b.k==='laps'){t+=b.n*b.len/1000*pace;m+=b.n*b.len}});return {t,km:Math.round(m/100)/10}}
const PARTN={wu:'חימום',cd:'שחרור',run:'ריצה רצופה'};
document.head.insertAdjacentHTML('beforeend',`<style id="fp224css18">
.fpBlk{background:#1F262E;border:1px solid var(--line,#2C3640);border-radius:14px;padding:8px 10px;margin:0 0 8px;position:relative}
.fpBlk.rep{border-color:#2F4A60;background:#14222E}.fpBlk .hd{display:flex;justify-content:space-between;align-items:center;gap:8px;margin:0 0 2px}
.fpBlk .hd b{font-size:14px}.fpBlk .x{background:none;border:0;color:#F09595;font:inherit;font-size:13px;cursor:pointer;padding:2px 6px}
.fpBlk .rw{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:5px 0}.fpBlk .rw>span{font-size:13.5px;color:var(--muted,#A3ADB8)}
.fpSt2{display:flex;align-items:center;gap:8px}.fpSt2 button{width:34px;height:34px;border-radius:10px;border:1px solid var(--line,#2C3640);background:#171C22;color:var(--ink,#F2F5F7);font:inherit;font-size:18px;font-weight:800;cursor:pointer}
.fpSt2 b{min-width:62px;text-align:center;font-size:16px;font-variant-numeric:tabular-nums}
.fpTg2{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:4px 0}.fpTg2 button{font:inherit;font-size:13px;border-radius:11px;padding:8px 4px;border:1px solid var(--line,#2C3640);background:#171C22;color:var(--muted,#A3ADB8);cursor:pointer}
.fpTg2 button.on{border-color:#7CC4FF;color:var(--ink,#F2F5F7);background:#16222D;font-weight:700}
.fpAddP{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:0 0 8px}
.fpAddP button{font:inherit;font-size:13px;border-radius:12px;padding:9px 4px;border:1px dashed #3A4652;background:none;color:var(--ink,#F2F5F7);cursor:pointer}
.fpEst{font-size:12.5px;color:var(--muted,#A3ADB8);margin:0 0 10px}
#fpSR{position:fixed;inset:0;z-index:2147482000;display:flex;flex-direction:column;direction:rtl}
#fpSR .top{flex:0 0 11vh;background:rgba(0,0,0,.55)}
#fpSR .pan{flex:1;background:#000;color:#F2F5F7;border-radius:22px 22px 0 0;padding:14px 18px calc(16px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:10px;overflow:auto}
#fpSR .st{display:flex;justify-content:space-between;align-items:center;font-size:13px;color:#A3ADB8}#fpSR .st b{color:#7CC4FF;font-weight:700}
#fpSR .lab{text-align:center;color:#7CC4FF;font-weight:800;font-size:16px}
#fpSR .fpRg{width:min(62vw,250px);height:min(62vw,250px);margin:0 auto;position:relative}
#fpSR .fpRg svg{width:100%;height:100%;transform:rotate(-90deg)}#fpSR .fpRg .c{position:absolute;inset:0;display:grid;place-items:center;text-align:center}
#fpSR .fpRg .c b{display:block;font-size:52px;font-weight:900;font-variant-numeric:tabular-nums;line-height:1}#fpSR .fpRg .c span span{font-size:13px;color:#A3ADB8}#fpSR .fpRg .c>span{background:none}
#fpSR .three{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center}#fpSR .three div{background:#0E1318;border:1px solid #1F262E;border-radius:14px;padding:9px 4px}
#fpSR .three b{display:block;font-size:22px;font-weight:800;font-variant-numeric:tabular-nums}#fpSR .three span{font-size:11.5px;color:#A3ADB8}
#fpSR .nx{text-align:center;font-size:13.5px;color:#A3ADB8;background:#0E1318;border:1px solid #1F262E;border-radius:12px;padding:8px}
#fpSR .big{text-align:center}#fpSR .big b{display:block;font-size:64px;font-weight:900;font-variant-numeric:tabular-nums;line-height:1.05}#fpSR .big span{color:#A3ADB8;font-size:14px}
#fpSR .lst{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;font-size:12.5px;color:#A3ADB8;font-variant-numeric:tabular-nums}#fpSR .lst span{border:1px solid #1F262E;border-radius:99px;padding:3px 9px}
#fpSR .acts{margin-top:auto;display:grid;gap:8px}#fpSR .acts .r2{display:grid;grid-template-columns:1fr 1fr;gap:8px}
#fpSR .acts button{font:inherit;font-weight:800;font-size:16px;border-radius:14px;padding:14px;cursor:pointer;border:1px solid #2C3640;background:#11161B;color:#F2F5F7}
#fpSR .acts .huge{background:#7CC4FF;color:#06121c;border:0;padding:24px;font-size:20px}#fpSR .acts .end{background:#D7F36B;border:0;color:#14190a}
#fpSRFloat{position:fixed;z-index:61;background:#0E1318;border:1px solid #7CC4FF;border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,.45);direction:rtl}
#fpSRFloat button{display:flex;justify-content:space-between;align-items:center;gap:10px;width:100%;background:none;border:0;color:#F2F5F7;font:inherit;padding:10px 14px;cursor:pointer;text-align:right}
#fpSRFloat small{display:block;color:#A3ADB8;font-size:12px}#fpSRFloat .t{font-size:20px;font-weight:800;font-variant-numeric:tabular-nums}
.fpSets{width:100%;border-collapse:collapse;font-size:14px;font-variant-numeric:tabular-nums}.fpSets th{color:#6B7682;font-weight:500;font-size:12px;text-align:right;padding:4px 2px}.fpSets td{padding:7px 2px;border-top:1px solid var(--line,#2C3640)}
</style>`);
/* ---- the parts editor (inside "ריצה קבועה" for these kinds, and for a one-off suggested run) ---- */
let ONE=null;
const tgt=w=>w==='one'?ONE:(window.fpW&&fpW._edit&&fpW._edit());
const redraw=w=>{if(w==='one')oneSheet();else fpW._form()};
function stp(w,i,f,d,val){return `<span class="fpSt2"><button type="button" aria-label="פחות" onclick="fp224.rb('${w}',${i},'${f}',-1)">−</button><b>${val}</b><button type="button" aria-label="יותר" onclick="fp224.rb('${w}',${i},'${f}',1)">+</button></span>`}
function blocksHtml(x,kk,w){w=w||'my';if(!x.st||x.st.k!==kk)x.st=defST(kk);const st=x.st,fart=kk==='fart';
  const rows=st.b.map((b,i)=>{const del=(b.k==='rep'&&st.b.filter(z=>z.k==='rep').length>1)||b.k==='run'?`<button type="button" class="x" onclick="fp224.rb('${w}',${i},'del',0)">✕ הסר</button>`:'';
    if(b.k==='wu'||b.k==='cd'||b.k==='run')return `<div class="fpBlk"><div class="rw" style="padding:2px 0"><span style="color:var(--ink,#F2F5F7);font-weight:700">${PARTN[b.k]}</span>${stp(w,i,'min',1,b.min?b.min+' דק׳':'בלי')}</div>${del?`<div style="text-align:left">${del}</div>`:''}</div>`;
    if(b.k==='laps')return `<div class="fpBlk rep"><div class="hd"><b>סיבובים</b></div><div class="rw"><span>כמה סיבובים</span>${stp(w,i,'n',1,b.n)}</div><div class="rw"><span>אורך סיבוב</span>${stp(w,i,'len',1,b.len+' מ׳')}</div></div>`;
    return `<div class="fpBlk rep"><div class="hd"><b>חוזר × ${b.n}</b>${del}</div>
      <div class="rw"><span>כמה סטים</span>${stp(w,i,'n',1,b.n)}</div>
      ${fart?'':`<div class="fpTg2"><button type="button" class="${b.u==='d'?'on':''}" onclick="fp224.rb('${w}',${i},'u','d')">לפי מרחק</button><button type="button" class="${b.u==='t'?'on':''}" onclick="fp224.rb('${w}',${i},'u','t')">לפי זמן</button></div>`}
      <div class="rw"><span>${fart?'מהיר':'כל סט'}</span>${stp(w,i,'v',1,vTxt(b))}</div>
      <div class="rw"><span>${fart?'קל':'מנוחה בין סטים'}</span>${stp(w,i,'rt',1,b.rt?mmss(b.rt):'בלי')}</div>
      ${fart?'':`<div class="fpTg2"><button type="button" class="${b.rm!=='jog'?'on':''}" onclick="fp224.rb('${w}',${i},'rm','walk')">עמידה / הליכה</button><button type="button" class="${b.rm==='jog'?'on':''}" onclick="fp224.rb('${w}',${i},'rm','jog')">ריצה קלה</button></div>`}</div>`}).join('');
  const e=stEst(st);
  return `<div style="margin:12px 0 0">${rows}</div>${kk==='track'?'':`<div class="fpAddP"><button type="button" onclick="fp224.rb('${w}',-1,'addRep',0)">+ עוד סטים</button><button type="button" onclick="fp224.rb('${w}',-1,'addRun',0)">+ ריצה רצופה</button></div>`}
    <p class="fpEst">בערך ${Math.round(e.t/60)} דק׳ · ${e.km} ק״מ · ${esc(stName(st))}</p>`}
fp224.blocksHtml=(x,kk)=>blocksHtml(x,kk,'my');
const STEPS={min:1,n:1,len:100,rt:15};
fp224.rb=(w,i,f,d)=>{const x=tgt(w);if(!x||!x.st)return;const b=x.st.b[i];
  if(f==='addRep'){const last=[...x.st.b].reverse().find(z=>z.k==='rep')||defST(x.st.k).b[1];const at=x.st.b.findIndex(z=>z.k==='cd');x.st.b.splice(at<0?x.st.b.length:at,0,Object.assign({},last));return redraw(w)}
  if(f==='addRun'){const at=x.st.b.findIndex(z=>z.k==='cd');x.st.b.splice(at<0?x.st.b.length:at,0,{k:'run',min:10});return redraw(w)}
  if(!b)return;if(f==='del'){x.st.b.splice(i,1);return redraw(w)}
  if(f==='u'){if(b.u!==d){b.u=d;b.v=d==='d'?400:60}return redraw(w)}
  if(f==='rm'){b.rm=d;return redraw(w)}
  if(f==='v'){if(b.u==='d'){const s=b.v<400?50:b.v<1000?100:200;b.v=Math.max(50,Math.min(5000,b.v+d*s))}else{const s=b.v<60?5:b.v<180?15:30;b.v=Math.max(5,Math.min(1200,b.v+d*s))}return redraw(w)}
  if(f==='min'){b.min=Math.max(b.k==='run'?1:0,Math.min(60,(b.min||0)+d*(b.min>=10||(b.min===9&&d>0)?5:1)));if(b.min>10&&b.min%5)b.min=Math.round(b.min/5)*5;return redraw(w)}
  if(f==='n'){b.n=Math.max(1,Math.min(b.k==='laps'?60:30,b.n+d));return redraw(w)}
  if(f==='len'){b.len=Math.max(100,Math.min(2000,b.len+d*100));return redraw(w)}
  if(f==='rt'){b.rt=Math.max(0,Math.min(600,b.rt+d*15));return redraw(w)}};
/* the name fills itself if you left it empty */
const waitW=setInterval(()=>{if(!window.fpW||!fpW.myRunSave||fpW.myRunSave.__224)return;clearInterval(waitW);
  const os=fpW.myRunSave;fpW.myRunSave=function(){const x=fpW._edit&&fpW._edit();if(x&&x.st&&STK.includes(kindOfType(x.type))&&x.st.k===kindOfType(x.type)){if(!String(x.name||'').trim())x.name=KN(x.st.k)+' '+stName(x.st);x.km=String(stEst(x.st).km)}else if(x&&x.st&&x.st.k!==kindOfType(x.type))delete x.st;return os.apply(this,arguments)};fpW.myRunSave.__224=true;
  const og=fpW.myRunGo;fpW.myRunGo=function(id){const x=J('RUN_MY',[]).find(r=>r.id===id);if(x&&x.st&&STK.includes(x.st.k))return startFixed(x);return og.apply(this,arguments)};
  /* the plan's quality run ("10 דק׳ קל, ואז 6 × 400 מ׳…") comes as parts too, ready to change */
  const orn=fpW.runGo;fpW.runGo=function(i){try{const p=fpT.plan(),r=p&&fpT.weekRuns(p,p.week)[i],st=r&&parsePlan(r[1]);if(st){ONE={name:KN(st.k),type:KN(st.k),st,why:'מהתוכנית שלך, שבוע '+p.week};return oneSheet()}}catch(e){console.warn(e)}return orn.apply(this,arguments)}},400);
function parsePlan(d){d=String(d||'');if(!/ואז/.test(d))return null;const q=d.replace(/^.*ואז /,''),wu=(d.match(/^(\d+) דק׳/)||[])[1];
  const m=q.replace(/,(?=\d{3})/g,'').match(/(\d+)\s*×\s*([\d.]+)\s*(מ׳|שנ׳|דק׳|ק״מ)/);if(!m)return null;
  const k=/פרטלק/.test(q)?'fart':/עליות/.test(q)?'hill':/טמפו/.test(q)?null:'int';if(!k)return null;
  const n=Number(m[1]),u=m[3]==='מ׳'||m[3]==='ק״מ'?'d':'t',v=m[3]==='ק״מ'?Number(m[2])*1000:m[3]==='דק׳'?Number(m[2])*60:Number(m[2]);
  const rm=/ריצה קלה|קל\b|קל$|דק׳ קל/.test(q)&&!/הליכה/.test(q)?'jog':'walk';let rt=0;const r1=q.match(/(\d+(?:\.\d+)?)\s*(שנ׳|דק׳)\s*(?:קל|ביניהם)/)||q.match(/ריצה קלה (\d+)\s*(שנ׳|דק׳)/);
  if(r1)rt=Math.round(Number(r1[1])*(r1[2]==='דק׳'?60:1));if(!rt)rt=k==='fart'?90:k==='hill'?60:(u==='d'&&v<=200?60:90);
  return {k,b:[{k:'wu',min:Number(wu)||10},{k:'rep',n,u,v,rt,rm:k==='fart'?'jog':rm},{k:'cd',min:5}]}}
fp224.parsePlan=parsePlan;
const waitT=setInterval(()=>{if(!window.fpT||!fpT.quick||fpT.quick.__224)return;clearInterval(waitT);const o=fpT.quick;
  fpT.quick=function(type){const k=kindOfType(type);if(k==='int'||k==='hill')return oneOff(k);if(k==='fart'||k==='track')return srStart({name:KN(k),type:KN(k),k,spont:k});return o.apply(this,arguments)};fpT.quick.__224=true},400);
/* a suggested run with sets: the same parts, ready, and you can change everything */
function lastOf(f){return J('RUN_LOG',[]).filter(r=>r.st&&f(r)&&fp224.markR('r',r)!=='weak').pop()}
function recST(r){if(!r||!r.st)return null;const st=JSON.parse(JSON.stringify(r.st)),done=(r.sets||[]).length,plan=st.b.filter(b=>b.k==='rep').reduce((a,b)=>a+b.n,0),laps=st.b.find(b=>b.k==='laps');
  if(laps){const got=(r.laps||[]).length;if(got>=laps.n&&r.ok){laps.n=Math.min(60,laps.n+1);return {st,why:`עשית את כל ${got} הסיבובים`}}return {st,why:`עשית ${got} מתוך ${laps.n} סיבובים, אז שוב אותו דבר`}}
  if(!plan)return null;
  if(done>=plan&&r.ok){const b=st.b.filter(z=>z.k==='rep').pop();if(b.n<10){b.n++;return {st,why:`עשית את כל ${done} הסטים`}}if(b.rt>45){b.rt-=15;return {st,why:'כל הסטים, אז מנוחה קצרה יותר'}}if(b.u==='d')b.v+=100;else b.v+=15;return {st,why:'כל הסטים, אז קטע קצת ארוך יותר'}}
  if(done<plan*0.6){const b=st.b.filter(z=>z.k==='rep').pop();b.n=Math.max(2,b.n-1);return {st,why:`עשית ${done} מתוך ${plan} סטים, אז קצת פחות`}}
  return {st,why:`עשית ${done} מתוך ${plan} סטים, אז שוב אותו דבר`}}
function oneOff(k){const prev=lastOf(r=>r.st.k===k&&!r.fid),rec=recST(prev);ONE={name:KN(k),type:KN(k),st:rec?rec.st:defST(k),why:rec?rec.why:''};oneSheet()}
function oneSheet(){const x=ONE;if(!x)return;fpT._.sheet(esc(KN(x.st.k)),`<div class="f21">${x.why?`<p class="mu" style="margin:0 0 6px">ההצעה להיום. ${esc(x.why)}. אפשר לשנות הכל.</p>`:'<p class="mu" style="margin:0 0 6px">ההצעה להיום. אפשר לשנות הכל.</p>'}${blocksHtml(x,x.st.k,'one')}
  <button type="button" class="btn full" style="background:#7CC4FF;color:#06121c" onclick="fp224.oneGo()">התחל</button><button type="button" class="btn light full" style="margin-top:8px" onclick="fp224.oneKeep()">לשמור כריצה קבועה</button></div>`)}
fp224.oneGo=()=>{if(!ONE)return;const x=ONE;ONE=null;srStart({name:x.name+' '+stName(x.st),type:x.type,k:x.st.k,st:x.st})};
fp224.oneKeep=()=>{if(!ONE)return;const a=J('RUN_MY',[]),x={id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),name:KN(ONE.st.k)+' '+stName(ONE.st),cat:(fpT._.RK[ONE.st.k]||{}).cat||'fast',type:KN(ONE.st.k),km:String(stEst(ONE.st).km),st:JSON.parse(JSON.stringify(ONE.st))};a.push(x);setProp('RUN_MY',JSON.stringify(a));try{toast('נשמר ב״שלי״')}catch(_){}try{fpW._mount()}catch(_){}};
/* a fixed run: "פעם שעברה עשית X. ההמלצה עכשיו: Y. רוצה?" */
function setsLine(r){const s=r.sets||[];if(!s.length)return (r.laps&&r.laps.length)?`${r.laps.length} סיבובים, ממוצע ${mmss(r.laps.reduce((a,v)=>a+v,0)/r.laps.length)}`:'';return `${s.length} סטים, ממוצע לסט ${mmss(s.reduce((a,v)=>a+(v.t||0),0)/s.length)}`}
function startFixed(x){const prev=lastOf(r=>r.fid===x.id),rec=recST(prev);
  if(!prev||!rec||stName(rec.st)===stName(x.st)&&JSON.stringify(rec.st)===JSON.stringify(x.st))return srStart({name:x.name,type:x.type,k:x.st.k,st:x.st,fid:x.id});
  const dd=prev.d.split('-').reverse().slice(0,2).join('.');
  fpT._.sheet(esc(x.name),`<div class="fpCard"><span class="mu">פעם שעברה (${dd})</span><p style="margin:3px 0 0;font-size:15px"><b>${esc(stName(prev.st))}</b>${setsLine(prev)?' · '+esc(setsLine(prev)):''}</p></div>
    <div class="fpRec"><span class="muted">ההמלצה עכשיו</span><p style="margin:3px 0 0;font-size:16px"><b>${esc(stName(rec.st))}</b></p><p class="mu" style="margin:2px 0 0;font-size:12.5px">${esc(rec.why)}. כדי להשתפר לאט.</p></div>
    <p style="margin:6px 0 10px;font-weight:700">רוצה?</p>
    <button type="button" class="btn full" style="background:#7CC4FF;color:#06121c" onclick="fp224.fxGo('${esc(x.id)}',1)">כן, ההמלצה (${esc(stName(rec.st))})</button>
    <button type="button" class="btn light full" style="margin-top:8px" onclick="fp224.fxGo('${esc(x.id)}',0)">לא, הריצה שלי (${esc(stName(x.st))})</button>`);
  FXREC[x.id]=rec.st}
const FXREC={};
fp224.fxGo=(id,yes)=>{const x=J('RUN_MY',[]).find(r=>r.id===id);if(!x)return;srStart({name:x.name,type:x.type,k:x.st.k,st:yes&&FXREC[id]?FXREC[id]:x.st,fid:x.id})};
/* ---- the run screen ---- */
let SR=null,srInt=0,srWatch=null,srLock=null;
const hav=(a,b)=>{const R=6371,r=x=>x*Math.PI/180,dl=r(b[0]-a[0]),dn=r(b[1]-a[1]);const h=Math.sin(dl/2)**2+Math.cos(r(a[0]))*Math.cos(r(b[0]))*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.sqrt(h))};
function expand(st){const out=[];(st.b||[]).forEach(b=>{if((b.k==='wu'||b.k==='cd'||b.k==='run')&&b.min>0)out.push({k:b.k,lab:PARTN[b.k],t:b.min*60});
  if(b.k==='rep')for(let j=1;j<=b.n;j++){out.push({k:'work',lab:st.k==='fart'?'קצב מהיר':st.k==='hill'?'עלייה':'ריצה מהירה',set:j,of:b.n,u:b.u,v:b.v});if(b.rt>0&&j<b.n)out.push({k:'rest',lab:st.k==='fart'?'קצב קל':b.rm==='jog'?'ריצה קלה':'מנוחה',t:b.rt,rm:b.rm,after:j})}
  if(b.k==='laps')out.push({k:'laps',lab:'סיבובים',n:b.n,len:b.len})});return out}
const now=()=>Date.now();
const srEl=()=>SR?((SR.pausedAt||now())-SR.t0-SR.pausedMs)/1000:0;
const stEl=()=>SR?((SR.pausedAt||now())-SR.s0-SR.sPaused)/1000:0;
function srStart(o){if(SR)return srMax();try{fpT.close()}catch(_){}
  SR={o,k:o.k,steps:o.st?expand(o.st):[],i:0,t0:now(),s0:now(),pausedMs:0,sPaused:0,pausedAt:0,km:0,last:null,fix:0,skm:0,sets:[],laps:[],lapT:0,lapKm:0,segs:[],seg:{f:1,t0:0},min:false,done:false};
  if(!SR.steps.length&&!o.spont)SR.o.spont=o.k;
  try{if(navigator.geolocation&&window.isSecureContext)srWatch=navigator.geolocation.watchPosition(pos=>{if(!SR||SR.pausedAt)return;const c=pos.coords;SR.fix=1;if(c.accuracy>40)return;const pt=[c.latitude,c.longitude];if(SR.last){const d=hav(SR.last,pt);if(d<0.004)return;if(d<0.25)SR.km+=d}SR.last=pt},err=>{if(SR&&err&&err.code===1)SR.noGps=1},{enableHighAccuracy:true,maximumAge:0});else SR.noGps=1}catch(_){SR.noGps=1}
  try{if(navigator.wakeLock)navigator.wakeLock.request('screen').then(l=>{srLock=l}).catch(()=>{})}catch(_){}
  clearInterval(srInt);srInt=setInterval(tick,500);draw()}
function cur(){return SR&&SR.steps[SR.i]}
function remain(s){if(!s)return {v:0,of:1,txt:'',sub:''};if(s.k==='work'&&s.u==='d'){const done=(SR.km-SR.skm)*1000,left=Math.max(0,s.v-done);return {v:left,of:s.v,txt:String(Math.round(left)),sub:'מ׳ נשארו'}}
  if(s.k==='work')return {v:Math.max(0,s.v-stEl()),of:s.v,txt:mmss(Math.max(0,s.v-stEl())),sub:'נשארו'};
  if(s.k==='laps')return {v:Math.max(0,s.n-SR.laps.length),of:s.n,txt:String(SR.laps.length+1>s.n?s.n:SR.laps.length+1),sub:'סיבוב מתוך '+s.n};
  return {v:Math.max(0,s.t-stEl()),of:s.t,txt:mmss(Math.max(0,s.t-stEl())),sub:'נשארו'}}
function nextTxt(){const n=SR.steps[SR.i+1];if(!n)return 'הבא: סוף הריצה';return 'הבא: '+(n.k==='work'?`סט ${n.set}: ${vTxt(n)}`:n.k==='rest'?`${n.lab} ${mmss(n.t)}${n.rm==='walk'?', עמידה או הליכה':''}`:n.k==='laps'?`${n.n} סיבובים`:`${n.lab} ${Math.round(n.t/60)} דק׳`)}
function beep(){try{if(window.fpRestSound)fpRestSound('r')}catch(_){}try{navigator.vibrate&&navigator.vibrate(300)}catch(_){}}
function advance(auto){const s=cur();if(!s)return;const t=stEl(),d=Math.round((SR.km-SR.skm)*1000);
  if(s.k==='work')SR.sets.push({set:s.set,t:Math.round(t),d:SR.fix?d:0});
  SR.i++;SR.s0=now();SR.sPaused=0;SR.skm=SR.km;if(auto)beep();if(SR.i>=SR.steps.length){SR.done=true}draw()}
function tick(){if(!SR)return;const s=cur();if(s&&!SR.pausedAt){const r=remain(s);if(s.k!=='laps'&&r.v<=0)advance(true)}
  if(SR.min)floatDraw();else upd()}
function ringSvg(p){const C=2*Math.PI*44;return `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="none" stroke="#1F262E" stroke-width="7"/><circle id="fpSRring" cx="50" cy="50" r="44" fill="none" stroke="#7CC4FF" stroke-width="7" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${(C*(1-p)).toFixed(1)}"/></svg>`}
function pace(){const s=stEl(),d=SR.km-SR.skm;return d>0.03?s/d:0}
function body(){const s=cur(),o=SR.o,sp=o.spont;
  const head=`<div class="st"><span>${esc(o.name||KN(SR.k))}</span><b>${SR.noGps?'בלי GPS':SR.fix?'יש קליטה':'מחפש קליטה…'}</b></div>`;
  const three=`<div class="three"><div><b id="fpSRp">${pace()?mmss(pace()):'—'}</b><span>קצב</span></div><div><b id="fpSRs">${mmss(stEl())}</b><span>${sp?'בקטע':'בחלק הזה'}</span></div><div><b id="fpSRk">${SR.km.toFixed(2)}</b><span>ק״מ סה״כ</span></div></div>`;
  const ctl=`<div class="r2"><button type="button" onclick="fp224.sr('pause')">${SR.pausedAt?'המשך':'עצור'}</button><button type="button" onclick="fp224.sr('next')">${sp?'לסיים':'דלג ›'}</button></div>`;
  if(sp==='fart'){const f=SR.seg.f;return head+`<div class="big"><span>פרטלק · <i id="fpSRtot" style="font-style:normal">${mmss(srEl())}</i></span><b style="font-size:48px;color:${f?'#7CC4FF':'#F2F5F7'}">${f?'קצב מהיר':'קצב קל'}</b><span id="fpSRseg">כבר ${mmss(stEl())}</span></div>${three}
    ${lapRows(SR.segs.map((g,i)=>({n:i+1,t:g.t,lab:g.f?'מהיר':'קל'})))}
    <div class="acts"><button type="button" class="huge" onclick="fp224.sr('pace')">שינוי קצב</button><div class="r2"><button type="button" onclick="fp224.sr('pause')">${SR.pausedAt?'המשך':'עצור'}</button><button type="button" class="end" onclick="fp224.sr('end')">סיום</button></div></div>`}
  if(sp==='track'||(s&&s.k==='laps')){const n=s&&s.k==='laps'?s.n:0,best=SR.laps.length?Math.min(...SR.laps):0;
    return head+`<div class="big"><span>${n?'סיבוב '+Math.min(SR.laps.length+1,n)+' מתוך '+n:'סיבוב '+(SR.laps.length+1)+' · סה״כ <i id="fpSRtot" style="font-style:normal">'+mmss(srEl())+'</i>'}</span><b id="fpSRlapT">${mmss(stEl()-SR.lapT)}</b><span>${SR.laps.length?'אחרון '+mmss(SR.laps[SR.laps.length-1])+' · הכי טוב '+mmss(best):'לוחצים בסוף כל סיבוב'}</span></div>${three}
    ${(()=>{const len=(cur()&&cur().len)||400,best=SR.laps.length?Math.min(...SR.laps):0;return lapRows(SR.laps.map((x,i)=>({n:i+1,t:x,pace:x/(len/1000),dist:len,best:x===best&&SR.laps.length>1})))})()}
    <div class="acts"><button type="button" class="huge" onclick="fp224.sr('lap')">+ סיבוב</button>${sp?`<div class="r2"><button type="button" onclick="fp224.sr('pause')">${SR.pausedAt?'המשך':'עצור'}</button><button type="button" class="end" onclick="fp224.sr('end')">סיום</button></div>`:ctl+`<button type="button" class="end" onclick="fp224.sr('end')">סיום</button>`}</div>`}
  if(SR.done||!s)return head+`<div class="big" style="margin-top:20px"><b style="font-size:40px">סיימת!</b><span>${SR.sets.length} סטים · ${SR.km.toFixed(2)} ק״מ · ${mmss(srEl())}</span></div><div class="acts"><button type="button" class="end" onclick="fp224.sr('end')">שמור וסיים</button></div>`;
  const r=remain(s),gpsHint=s.k==='work'&&s.u==='d'&&(SR.noGps||!SR.fix)?'<p style="margin:0;text-align:center;font-size:13px;color:#FFD98A">בלי קליטת GPS: בסוף הסט לוחצים ״דלג ›״</p>':'',lab=s.k==='work'?`סט ${s.set} מתוך ${s.of} · ${s.lab}`:s.k==='rest'?`${s.lab} · אחרי סט ${s.after}`:s.lab;
  return head+`<div class="lab" id="fpSRlab">${lab}</div><div class="fpRg">${ringSvg(1-r.v/(r.of||1))}<div class="c"><span><b id="fpSRbig">${r.txt}</b><span>${r.sub}</span></span></div></div>${three}${gpsHint}<div class="nx">${nextTxt()}</div>${lapRows(SR.sets.map(x=>{const st=SR.steps.find(z=>z.k==='work'&&z.set===x.set)||{};const d=x.d||(st.u==='d'?st.v:0);return {n:x.set,t:x.t,dist:d,pace:d?x.t/(d/1000):0}}))}
    <div class="acts">${ctl}<button type="button" class="end" onclick="fp224.sr('end')">סיום</button></div>`}
/* 2.25 (sketch 11B): every lap / set / fast part in a wide row: number in a circle, big time, pace and distance. The newest on top, in blue. */
function lapRows(a){if(!a.length)return '';return '<div class="fpLaps">'+a.slice().reverse().map((x,i)=>`<div class="lr${i===0?' new':''}${x.best?' best':''}"><span class="n">${x.n}</span><b>${mmss(x.t)}</b><span class="m">${x.lab?esc(x.lab):''}${x.pace?'קצב '+mmss(x.pace):''}${x.dist?'<br>'+(x.dist>=1000?(x.dist/1000)+' ק״מ':x.dist+' מ׳'):''}${x.best?'<br><i>הכי טוב</i>':''}</span></div>`).join('')+'</div>'}
document.head.insertAdjacentHTML('beforeend',`<style id="fp225laps">#fpSR .fpLaps{display:grid;gap:7px}#fpSR .fpLaps .lr{display:flex;align-items:center;gap:12px;background:#0E1318;border:1px solid #1F262E;border-radius:14px;padding:10px 12px}
#fpSR .fpLaps .lr.new{background:#14222E;border-color:#7CC4FF}#fpSR .fpLaps .lr.best{border-color:#6EE787}#fpSR .fpLaps .n{width:32px;height:32px;border-radius:50%;background:#1F262E;display:grid;place-items:center;font-weight:800;flex:none}
#fpSR .fpLaps b{flex:1;font-size:26px;font-weight:800;color:#fff;font-variant-numeric:tabular-nums}#fpSR .fpLaps .m{text-align:left;color:#C9D1D9;font-size:12.5px;line-height:1.4}#fpSR .fpLaps .m i{font-style:normal;color:#6EE787}</style>`);
function draw(){if(!SR)return;if(SR.min)return floatDraw();let e=$('fpSR');if(!e){document.body.insertAdjacentHTML('beforeend','<div id="fpSR" role="dialog" aria-label="מסך ריצה"></div>');e=$('fpSR')}
  e.innerHTML=`<div class="top" onclick="fp224.sr('min')" aria-label="להקטין"></div><div class="pan">${body()}<p style="margin:0;text-align:center;font-size:12px;color:#6B7682">לחיצה על החלק הכהה למעלה מקטינה. המדידה ממשיכה.</p></div>`;SR.lastI=SR.i}
function upd(){const e=$('fpSR');if(!e)return;if(SR.lastI!==SR.i)return draw();const s=cur();const set=(id,v)=>{const x=$(id);if(x)x.textContent=v};
  set('fpSRtot',mmss(srEl()));set('fpSRlapT',mmss(stEl()-SR.lapT));set('fpSRseg','כבר '+mmss(stEl()));set('fpSRp',pace()?mmss(pace()):'—');set('fpSRs',mmss(stEl()));set('fpSRk',SR.km.toFixed(2));
  if(!s||s.k==='laps'||SR.o.spont)return;const r=remain(s),C=2*Math.PI*44;set('fpSRbig',r.txt);set('fpSRp',pace()?mmss(pace()):'—');set('fpSRs',mmss(stEl()));set('fpSRk',SR.km.toFixed(2));
  const rg=$('fpSRring');if(rg)rg.setAttribute('stroke-dashoffset',(C*(r.v/(r.of||1))).toFixed(1))}
function floatDraw(){let f=$('fpSRFloat');if(!f){document.body.insertAdjacentHTML('beforeend','<div id="fpSRFloat" role="status"></div>');f=$('fpSRFloat')}const s=cur(),r=s?remain(s):null;
  f.innerHTML=`<button type="button" onclick="fp224.sr('max')" aria-label="לפתוח את מסך הריצה"><span><b>${esc(SR.o.spont==='track'?'מסלול · סיבוב '+(SR.laps.length+1):SR.o.spont==='fart'?(SR.seg.f?'פרטלק · מהיר':'פרטלק · קל'):s?(s.k==='work'?`סט ${s.set}/${s.of}`:s.lab):'סיימת')}</b><small>${SR.km.toFixed(2)} ק״מ · לחיצה פותחת</small></span><span class="t">${r&&s.k!=='laps'?r.txt:mmss(srEl())}</span></button>`}
async function srEnd(){if(!SR)return;const o=SR.o,s=cur();if(s&&s.k==='work'&&!SR.pausedAt&&stEl()>5&&!SR.done)SR.sets.push({set:s.set,t:Math.round(stEl()),d:SR.fix?Math.round((SR.km-SR.skm)*1000):0});
  if(o.spont==='fart'&&stEl()>3)SR.segs.push({f:SR.seg.f,t:Math.round(stEl())});
  const tot=Math.round(srEl()),plan=SR.steps.filter(x=>x.k==='work').length,lapsN=(SR.steps.find(x=>x.k==='laps')||{}).n||0;
  const ok=o.spont?true:plan?SR.sets.length>=plan:lapsN?SR.laps.length>=lapsN:SR.done;
  const row={d:today(),t:Date.now(),km:Math.round(SR.km*100)/100,s:tot,ok,type:o.type||KN(SR.k),gps:SR.fix?1:0};if(o.name)row.name=o.name;if(o.fid)row.fid=o.fid;if(o.st)row.st=o.st;if(SR.sets.length)row.sets=SR.sets;if(SR.laps.length)row.laps=SR.laps;if(SR.segs.length)row.segs=SR.segs;
  stopSR();const note=[o.st?stName(o.st):KN(SR.k),row.km?row.km+' ק״מ':'',mmss(tot),SR.sets.length?SR.sets.length+' סטים':'',SR.laps.length?SR.laps.length+' סיבובים':''].filter(Boolean).join(' · ');
  SR=null;try{await fpT.saveRow(row,note)}catch(e){console.warn(e)}try{fpW._mount()}catch(_){}
  fpT._.sheet(esc(row.name||KN(kindOfType(row.type))),sumHtml(row)+`<button type="button" class="btn full" onclick="fpT.close()">סיום ✓</button>`)}
function sumHtml(r,jr){const sets=r.sets||[],laps=r.laps||[],segs=r.segs||[];
  return `${jr?'':`<div class="fpT-card"><span class="muted">${r.d.split('-').reverse().slice(0,2).join('.')}${r.st?' · '+esc(stName(r.st)):''}</span><div style="display:flex;justify-content:space-between;align-items:end;margin-top:4px"><span style="font-size:34px;font-weight:900;font-variant-numeric:tabular-nums">${mmss(r.s)}</span><span class="muted">${r.km?r.km+' ק״מ':''}</span></div></div>`}
   ${(()=>{const plan=r.st?expand(r.st).filter(x=>x.k==='work'):[];const rows=plan.length?plan.map((p,i)=>Object.assign({set:i+1,plan:vTxt(p)},sets[i]||{})):sets;if(!rows.length)return '';
     return `<div class="fpT-card"><table class="fpSets"><tr><th>סט</th>${plan.length?'<th>מתוכנן</th>':''}<th>זמן</th><th>${sets.some(x=>x.d)?'מרחק':''}</th></tr>${rows.map(x=>`<tr><td>${x.set}</td>${plan.length?`<td>${esc(x.plan)}</td>`:''}<td>${x.t!=null?mmss(x.t):'—'}</td><td>${x.d?x.d+' מ׳':''}</td></tr>`).join('')}</table>${plan.length&&sets.length<plan.length?`<p class="mu" style="margin:6px 0 0;font-size:12.5px">עשית ${sets.length} מתוך ${plan.length} סטים.</p>`:''}</div>`})()}
   ${laps.length?`<div class="fpT-card"><table class="fpSets"><tr><th>סיבוב</th><th>זמן</th></tr>${laps.map((x,i)=>`<tr><td>${i+1}</td><td>${mmss(x)}${x===Math.min(...laps)?' <span class="fpPill g">הכי טוב</span>':''}</td></tr>`).join('')}</table></div>`:''}
   ${segs.length?`<div class="fpT-card"><b>${segs.filter(g=>g.f).length} קטעים מהירים</b><div class="muted" style="margin-top:4px">${segs.map(g=>(g.f?'מהיר ':'קל ')+mmss(g.t)).join(' · ')}</div></div>`:''}
   ${r.fid&&r.st&&!jr?'<p class="mu" style="text-align:center">בפעם הבאה של הריצה הזו תקבל המלצה איך להתקדם.</p>':''}`}
fp224.sumHtml=sumHtml;
function stopSR(){clearInterval(srInt);try{if(srWatch!=null)navigator.geolocation.clearWatch(srWatch)}catch(_){}srWatch=null;try{srLock&&srLock.release()}catch(_){}srLock=null;const e=$('fpSR');if(e)e.remove();const f=$('fpSRFloat');if(f)f.remove()}
function srMax(){if(!SR)return;SR.min=false;const f=$('fpSRFloat');if(f)f.remove();draw()}
fp224.sr=a=>{if(!SR)return;
  if(a==='min'){SR.min=true;const e=$('fpSR');if(e)e.remove();floatDraw();return}
  if(a==='max')return srMax();
  if(a==='pause'){if(SR.pausedAt){const d=now()-SR.pausedAt;SR.pausedMs+=d;SR.sPaused+=d;SR.pausedAt=0}else SR.pausedAt=now();return draw()}
  if(a==='next'){if(SR.o.spont)return fp224.sr('end');return advance(false)}
  if(a==='pace'){SR.segs.push({f:SR.seg.f,t:Math.round(stEl())});SR.seg.f=SR.seg.f?0:1;SR.s0=now();SR.sPaused=0;SR.skm=SR.km;beep();return draw()}
  if(a==='lap'){const t=stEl()-SR.lapT;SR.laps.push(Math.round(t));SR.lapT=stEl();const s=cur();if(s&&s.k==='laps'&&SR.laps.length>=s.n){SR.lapT=0;advance(true)}else draw();return}
  if(a==='end'){if(!SR.done&&!confirm('לסיים את הריצה ולשמור?'))return;srEnd()}};
fp224.srOn=()=>!!SR;fp224._SR=()=>SR;fp224.srStart=srStart;fp224.expand=expand;fp224.recST=recST;fp224.stName=stName;
/* the journal shows the sets / laps of such a run */
const waitJR=setInterval(()=>{if(!window.fp222||!fp222.jOpen)return;clearInterval(waitJR);const o=fp222.jOpen;fp222.jOpen=function(t,id){const r=o.apply(this,arguments);
  if(t==='r')try{const row=J('RUN_LOG',[])[Number(id)];if(row&&(row.sets||row.laps||row.segs)){const sh=$('fpTSheet');const box=sh&&sh.querySelector('.sheet');if(box&&!box.querySelector('.fpSets'))box.insertAdjacentHTML('beforeend',sumHtml(row,1))}}catch(e){console.warn(e)}return r};fp222.jOpen.__224=true},450);

/* ============ 2.25 · the video chooser: the chosen tile ============ */
document.head.insertAdjacentHTML('beforeend','<style id="fp225vid">#fpExV .tile.on{border-color:var(--brand,#D7F36B);background:#222D17}</style>');

/* ============ 2.25 · the red number also inside Settings, on "ניהול (רק למנהל)" ============ */
function admBadge(){const sm=document.querySelector('#fpFolderAdm>summary');if(!sm)return;const nav=document.querySelector('nav button[data-tab="more"]');
  const num=sel=>{const e=nav&&nav.querySelector(sel);return e?parseInt(e.textContent,10)||0:0};const n=num('.fpBadge');
  let b=sm.querySelector('.fpAdmN');if(!n){if(b)b.remove();return}if(!b){sm.insertAdjacentHTML('beforeend',' <span class="fpBadge in fpAdmN"></span>');b=sm.querySelector('.fpAdmN')}b.textContent=n>99?'99+':n}
setInterval(()=>{try{admBadge()}catch(_){}},1500);

/* ============ 2.25 · your video was approved → a card in the app too (also when the phone's notifications are off) ============ */
async function vidNews(){try{const m=J('EXV',{})||{};const wait=Object.keys(m).filter(k=>m[k]&&m[k].status==='suggested');if(!wait.length||!window.fp223||!fp223._sync)return;
  await fp223._sync();const sh=(()=>{try{return (JSON.parse(localStorage.getItem('fp2.sharedEx')||'{}').items)||[]}catch(_){return []}})();let ch=false,got=[];
  wait.forEach(k=>{if(sh.some(x=>x.fid===m[k].fid)){m[k].status='public';ch=true;got.push(m[k].name)}});
  if(ch){setProp('EXV',JSON.stringify(m));const home=$('today');if(home&&!$('fpVidNews'))home.insertAdjacentHTML('afterbegin',`<div class="fpCard" id="fpVidNews" style="border-color:#2F5A3A;background:#16261B"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><b>הסרטון שלך אושר לכולם</b><button type="button" class="trash" aria-label="סגור" onclick="this.closest('.fpCard').remove()">✕</button></div><p style="margin:4px 0 0">״${esc(got.join('״, ״'))}״ — עכשיו כולם רואים את ההדגמה שלך. תודה!</p></div>`)}}catch(e){console.warn(e)}}
setTimeout(vidNews,7000);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(vidNews,2500)});

/* ============ 2.25 · a new user (tour not finished yet) does not get "יש לך אירוע השבוע?" ============ */
if(typeof showWeeklyNotice==='function'){const o=showWeeklyNotice;showWeeklyNotice=function(force){if(!force&&(prop('TOUR_DONE')!=='1'||$('fpI')||document.documentElement.classList.contains('onboarding-mode')))return;return o.apply(this,arguments)}}
{const close=()=>{const n=$('weeklyNoticeSheet');if(n&&$('fpI'))n.classList.add('hide')};new MutationObserver(close).observe(document.body,{childList:true})}

/* ============ 2.25 · run texts brighter (sketch 10A): numbers white and bold, labels light grey ============ */
document.head.insertAdjacentHTML('beforeend',`<style id="fp225run">
#fpSR .st,#fpSR .three span,#fpSR .nx,#fpSR .fpRg .c span span,#fpSR .big span,#fpSR .lst,#fpRunScr .st,#fpRunScr .two span,#fpRunScr .tgt,#fpRunScr .sps,#fpRunScr .km small{color:#C9D1D9!important}
#fpSR .three b,#fpSR .fpRg .c b,#fpSR .big b,#fpRunScr .two b,#fpRunScr .km{color:#FFFFFF;font-weight:800}
#fpSR p[style*="#6B7682"],#fpRunScr p[style*="#6B7682"]{color:#A3ADB8!important}
.fpBlk .rw>span,.fpEst{color:#C9D1D9!important;font-size:14px}.fpBlk .hd b{color:#FFFFFF}.fpSt2 b{color:#FFFFFF;font-weight:800;font-size:17px}
.fpTg2 button{color:#C9D1D9}.fpAddP button{color:#FFFFFF}
</style>`);

/* ============ 2.25 · "היה חלש" / "היה טוב מאוד" also for a run and for cardio ============
   Right after saving (on the summary) and later in the journal. A weak run is not used for "פעם שעברה" / the next suggestion. */
const rKey=(t,r)=>t+':'+(r&&(r.t||r.d)||'');
fp224.markR=(t,r)=>{const o=MK();return o.e[rKey(t,r)]||''};
function mkCard(t,r){const k=rKey(t,r),cur=MK().e[k]||'';return `<div class="fpMkTop fpMkR" data-k="${esc(k)}" data-t="${t}"><b>${t==='r'?'איך הייתה הריצה?':'איך היה האירובי?'}</b><small>״חלש״ לא נכנס להשוואה ולהמלצה של הפעם הבאה.</small>${mkBtns('R',k,cur,'').replace(/fp224\.mk\('R',/g,"fp224.mkR(")}</div>`}
fp224.mkR=(k,v)=>{const o=MK();o.e[k]=o.e[k]===v?'':v;if(!o.e[k])delete o.e[k];mkSave(o);document.querySelectorAll('.fpMkR').forEach(c=>{if(c.dataset.k===k){const t=c.dataset.t,[ty,...rest]=k.split(':');c.outerHTML=mkCard(ty,{t:rest.join(':')})}})};
const SEENR=new Set();
function addRunMarks(){const sh=$('fpTSheet');if(!sh||sh.querySelector('.fpMkR')||$('fpSR'))return;const box=sh.querySelector('.sheet');if(!box)return;
  for(const [t,key] of [['r','RUN_LOG'],['c','CARDIO_LOG']]){const L=J(key,[]),r=L[L.length-1];if(r&&r.t&&Date.now()-r.t<120000&&!SEENR.has(rKey(t,r))){SEENR.add(rKey(t,r));const btn=[...box.querySelectorAll('button.btn.full')].pop();if(btn)btn.insertAdjacentHTML('beforebegin',mkCard(t,r));else box.insertAdjacentHTML('beforeend',mkCard(t,r));return}}}
let arT=0;new MutationObserver(()=>{clearTimeout(arT);arT=setTimeout(()=>{try{addRunMarks()}catch(_){}},120)}).observe(document.body,{childList:true,subtree:true});
const waitJR2=setInterval(()=>{if(!window.fp222||!fp222.jOpen)return;clearInterval(waitJR2);const o=fp222.jOpen;fp222.jOpen=function(t,id){const r=o.apply(this,arguments);
  if(t==='r'||t==='c')try{const row=J(t==='r'?'RUN_LOG':'CARDIO_LOG',[])[Number(id)];const box=$('fpTSheet')&&$('fpTSheet').querySelector('.sheet');if(row&&box&&!box.querySelector('.fpMkR'))box.insertAdjacentHTML('beforeend',mkCard(t,row))}catch(e){console.warn(e)}return r}},500);

/* ============ 2.25 · admin: "מחק מכולם" (Settings → ניהול) ============
   Exercises approved for everyone (with their video) and shared foods. An app that got an exercise from the shared list drops it on its next sync. */
let DA={q:'',ex:null,food:null};
async function daLoad(){try{DA.ex=await fp223.loadShared(true)}catch(_){DA.ex=[]}try{DA.food=window.FP2&&FP2.sharedLoad?await FP2.sharedLoad(true):[]}catch(_){DA.food=[]}daDraw()}
function daDraw(){const b=$('fpDelAllBody');if(!b)return;const q=DA.q.trim();const f=x=>!q||String(x.name||'').includes(q);
  const ex=(DA.ex||[]).filter(f),fo=(DA.food||[]).filter(f).slice(0,60);
  b.innerHTML=`<input type="search" placeholder="חיפוש…" value="${esc(DA.q)}" oninput="fp224.daQ(this.value)" style="width:100%;margin:0 0 8px">
   <div class="lbl" style="margin:6px 0">תרגילים שאושרו לכולם${DA.ex?' ('+DA.ex.length+')':''}</div>${DA.ex===null?'<p class="muted">טוען…</p>':ex.length?ex.map(x=>`<div class="fpRow" style="padding:6px 0"><span>${esc(x.name)}<br><small class="muted">${esc(x.group||'')}${x.fid?' · עם סרטון':''}</small></span><button type="button" class="btn light mini" style="color:#F09595" onclick="fp224.daEx('${esc(x.name)}')">מחק מכולם</button></div>`).join(''):'<p class="muted">אין.</p>'}
   <div class="lbl" style="margin:12px 0 6px">מזונות משותפים${DA.food?' ('+DA.food.length+')':''}</div>${DA.food===null?'<p class="muted">טוען…</p>':fo.length?fo.map(x=>`<div class="fpRow" style="padding:6px 0"><span>${esc(x.name)}${x.brand?'<br><small class="muted">'+esc(x.brand)+'</small>':''}</span><button type="button" class="btn light mini" style="color:#F09595" onclick="fp224.daFood('${esc(x.sharedId||'')}')">מחק מכולם</button></div>`).join(''):'<p class="muted">אין.</p>'}
   <p class="muted" style="font-size:12.5px;margin-top:10px">ריצות ואירובי לא משותפים בין משתמשים, לכן אין מה למחוק שם.</p>`}
fp224.daQ=v=>{DA.q=v;clearTimeout(DA.t);DA.t=setTimeout(()=>{daDraw();const i=$('fpDelAllBody')&&$('fpDelAllBody').querySelector('input');if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length)}},250)};
fp224.daEx=async n=>{if(!confirm(`למחוק את ״${n}״ מכולם? גם הסרטון יימחק.`))return;try{await FP2.push('adminDeleteSharedEx',{name:n});toast('נמחק מכולם');daLoad()}catch(e){toast((e&&e.message)||'לא נמחק',true)}};
fp224.daFood=async id=>{if(!id||!confirm('למחוק את המזון הזה מכולם?'))return;try{await FP2.sharedDel(id);toast('נמחק מכולם');daLoad()}catch(e){toast((e&&e.message)||'לא נמחק',true)}};
function daMount(){const adm=$('fpFolderAdm');const body=adm&&adm.querySelector(':scope > .settings-body');if(!body||$('fpDelAll'))return;
  body.insertAdjacentHTML('beforeend','<details class="settings-section admin-only" id="fpDelAll" ontoggle="if(this.open)fp224.daOpen()"><summary>מחק מכולם</summary><div class="settings-body" id="fpDelAllBody"></div></details>')}
fp224.daOpen=()=>{DA.ex=null;DA.food=null;daDraw();daLoad()};
setInterval(()=>{try{if($('settings')&&$('settings').classList.contains('active'))daMount()}catch(_){}},1500);

/* ============ 2.25 · 21. events: saving before them follows the goal ============
   When a new event is added: a popup with the recommendation for this user's goal (in % of maintenance, up to 3 days before;
   rest days first, a training day saves half). He can only choose less: a smaller %, fewer days, only on the day, or nothing.
   On the event day itself: "איך תרצה להתנהל היום?" with a short reminder. */
document.head.insertAdjacentHTML('beforeend',`<style id="fp225ev">
#fpEvPick .fpEvRec,#fpEvDay .fpEvRec{background:#1A2430;border:1px solid #2C3A48;border-radius:12px;padding:10px 12px;margin:0 0 10px;font-size:13.5px;line-height:1.5}
#fpEvPick .fpEvDays{display:block;font-size:12.5px;color:#9AA7B4;margin-top:4px}
#fpEvDay ul{margin:6px 0 0;padding-inline-start:18px;font-size:13px;color:#C9D3DC;line-height:1.5}
</style>`);
const KC=n=>Math.round(Number(n)||0).toLocaleString('he-IL');
const HED=['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
const dnm=d=>{try{return dayName(d)}catch(_){return 'יום '+HED[new Date(d+'T12:00:00').getDay()]}};
const evById=id=>{try{return bankEvents().find(e=>e.id===id)}catch(_){return null}};
const EP={};
function availDays(date){const t=bankToday(),out=[];for(let i=3;i>=1;i--){const d=isoAdd(date,-i);if(d>=t)out.push(d)}return out}
function pctOpts(rec){return [...new Set([rec,Math.round(rec*2/3),Math.round(rec/3)])].filter(v=>v>=1).sort((a,b)=>b-a)}
function evPick(id){const e=evById(id);if(!e)return;const old=$('fpEvPick');
  const c=bankCtx(),t=bankToday(),av=availDays(e.date),rec=Number(c.recPct!=null?c.recPct:c.savePct)||0;
  if(!EP[id])EP[id]={pct:rec,days:av.length};const P=EP[id];P.pct=Math.min(P.pct,rec);P.days=Math.min(P.days,av.length);
  const others=bankEvents().filter(x=>x.id!==id);
  const when=e.date===isoAdd(t,1)?'מחר':'ב'+relDate(e.date);
  const canSave=!c.noDeficit&&!c.noRoom&&rec>=1&&av.length>0;
  const opt=(m,title,sub,primary)=>`<button type="button" class="remind-opt${primary?' rec':''}" onclick="fp224.evGo('${id}','${m}')"><b>${title}</b><span>${sub}</span></button>`;
  let h=`<div class="overlay" id="fpEvPick"><div class="sheet"><div class="sheet-head"><h3 style="margin:0">${esc(e.label)} ${esc(when)}</h3><button type="button" class="trash" aria-label="סגור" onclick="document.getElementById('fpEvPick').remove()">✕</button></div>`;
  if(c.noDeficit)h+=`<div class="fpEvRec">לפי הפרופיל שלך לא מורידים קלוריות בימים שלפני. ביום האירוע אוכלים קל וחלבוני עד האירוע.</div>`;
  else if(c.noRoom)h+=`<div class="fpEvRec"><b>המטרה שלך: ${esc(c.goalName||'מסה נקייה')}.</b> במסה לא יורדים מתחת לתחזוקה, והיעד שלך כבר קרוב אליה. לכן לא חוסכים לפני. ביום האירוע אוכלים קל וחלבוני עד האירוע.</div>`;
  else if(!av.length)h+=`<div class="fpEvRec">אין ימים לחסוך לפני האירוע. מטפלים ביום עצמו.</div>`;
  else{
    const p=bankPlanFor(e.date,e.extra,'spread',others,{pct:P.pct,days:P.days});
    const why=c.goalType==='lose'?'בחיטוב אתה כבר בגירעון, אז הגירעון הכולל לא עובר 25% מהתחזוקה.':c.goalType==='gain'?'במסה חוסכים רק מהעודף, אף פעם לא מתחת לתחזוקה.':'הגירעון הכולל לא עובר 10% מהתחזוקה, כדי לא לפגוע באימונים.';
    h+=`<div class="fpEvRec"><b>ההמלצה לפי המטרה שלך (${esc(c.goalName||'')}):</b> לחסוך עד ${rec}% ביום, עד ${av.length===1?'יום אחד':av.length+' ימים'} לפני. ${why} קודם מימי מנוחה, וביום אימון רק חצי. החלבון לא יורד. אפשר רק להוריד.</div>`;
    h+=`<div class="field" style="margin:0 0 6px"><label>כמה לחסוך ביום?</label><div class="meal-tabs" style="flex-wrap:wrap">${pctOpts(rec).map(v=>`<button type="button" class="chip${P.pct===v?' active':''}" onclick="fp224.evSet('${id}','pct',${v})">${v}%${v===rec?' · מומלץ':''}</button>`).join('')}</div></div>`;
    if(av.length>1)h+=`<div class="field" style="margin:0 0 6px"><label>כמה ימים לפני?</label><div class="meal-tabs" style="flex-wrap:wrap">${av.map((_,i)=>av.length-i).map(n=>`<button type="button" class="chip${P.days===n?' active':''}" onclick="fp224.evSet('${id}','days',${n})">${n===1?'יום אחד':n+' ימים'}</button>`).join('')}</div></div>`;
    const tr=(function(){try{return bankTrain(e.date)}catch(_){return []}})();
    const det=p.days.length?p.days.map(d=>`${dnm(d.date)} −${KC(d.cut)}${tr.includes(d.date)?' (אימון, חצי)':''}`).join(' · '):'';
    h+=opt('spread',`לחסוך ${P.pct}% ל-${P.days===1?'יום אחד':P.days+' ימים'}`,p.days.length?`${KC(p.banked)} קל׳ נחסכים לאירוע. ביום האירוע יעד ${KC(p.dayGoal)}.<span class="fpEvDays">${det}</span>`:'אין מה לחסוך בימים האלה. מטפלים ביום עצמו.',true);
  }
  h+=opt('day','רק ביום האירוע','שאר הימים רגילים. ביום עצמו אוכלים קל וחלבוני עד האירוע.',!canSave);
  h+=opt('none','לא לגעת','היעדים לא משתנים. אם תעבור ביום האירוע, זה מתאזן למחרת.',false);
  h+=`</div></div>`;
  /* 2.27: a change of % or days updates the open window in place (it is not closed and opened again) */
  if(old){const t=document.createElement('div');t.innerHTML=h;const ns=t.querySelector('.sheet'),os=old.querySelector('.sheet');if(ns&&os){const sc=os.scrollTop;os.innerHTML=ns.innerHTML;os.scrollTop=sc;return}old.remove()}
  document.body.insertAdjacentHTML('beforeend',h)}
fp224.evPick=evPick;
fp224.evSet=(id,k,v)=>{EP[id]=EP[id]||{};EP[id][k]=v;evPick(id)};
fp224.evGo=async(id,m)=>{const s=$('fpEvPick');if(s)s.remove();const P=EP[id]||{};
  const r=await bankMutate('chooseBankMethod',m==='spread'?{id,method:m,pct:P.pct,days:P.days}:{id,method:m});if(!r)return;try{renderBankCard()}catch(_){}
  const p=r.plan||{};toast(m==='none'?'בסדר, היעדים לא משתנים':p.banked?`מעולה · ${KC(p.banked)} קל׳ נחסכים לאירוע`:'מעולה · ביום האירוע תקבל תוכנית')};
/* a new event: saved without a plan, then the popup */
if(typeof saveEventUI==='function'){const o=saveEventUI;saveEventUI=async function(){const ev=state.ev||{},isNew=!ev.id,before=new Set(bankEvents().map(e=>e.id));
  if(isNew&&ev.date>bankToday())ev.method='none';
  const r=await o.apply(this,arguments);
  try{if(isNew){const n=bankEvents().find(e=>!before.has(e.id));if(n&&n.date>bankToday())setTimeout(()=>evPick(n.id),350)}}catch(e){console.warn(e)}return r}}
/* the event day: "איך תרצה להתנהל היום?" once, with a short reminder */
const EDK='fp2.evDayAsked';
const asked=()=>{try{return JSON.parse(localStorage.getItem(EDK)||'[]')}catch(_){return []}};
function evDay(id,force){const e=evById(id);if(!e)return;const old=$('fpEvDay');if(old)old.remove();
  if(!force){const a=asked();if(a.includes(id))return;a.push(id);try{localStorage.setItem(EDK,JSON.stringify(a.slice(-40)))}catch(_){}}
  const p=e.plan||{},others=bankEvents().filter(x=>x.id!==id),banked=Number(p.banked)||0;
  const q=p.method==='none'?bankPlanFor(e.date,e.extra,'day',others):p;
  const tips=(typeof EVENT_TIPS!=='undefined'?EVENT_TIPS:['לא להגיע רעב: ארוחה עם חלבון 3–4 שעות לפני.','להתחיל בסלט או מרק, ולאכול לאט.','למחרת ממשיכים כרגיל, בלי לקזז.']);
  const opt=(m,title,sub,primary)=>`<button type="button" class="remind-opt${primary?' rec':''}" onclick="fp224.evDayGo('${id}','${m}')"><b>${title}</b><span>${sub}</span></button>`;
  let h=`<div class="overlay" id="fpEvDay"><div class="sheet"><div class="sheet-head"><h3 style="margin:0">היום: ${esc(e.label)}</h3><button type="button" class="trash" aria-label="סגור" onclick="document.getElementById('fpEvDay').remove()">✕</button></div>
    <p style="margin:0 0 8px;font-weight:700">איך תרצה להתנהל היום?</p>`;
  if(banked)h+=`<div class="fpEvRec">חסכת ${KC(banked)} קל׳ בימים שלפני. היעד היום ${KC(p.dayGoal)}.</div>`;
  h+=opt('day','קל וחלבוני עד האירוע (מומלץ)',`עד האירוע כ-${KC(q.preBudget)} קל׳, ולפחות ${q.proteinBefore} ג׳ חלבון. לאירוע נשמרו כ-${KC(q.eventMeal)}.`,true);
  if(!banked)h+=opt('none','יום רגיל, בלי שינוי','היעד לא משתנה. מה שעובר מתאזן מחר כמו בכל יום.',false);
  h+=`<div class="fpEvRec" style="margin-top:10px"><b>תזכורת קטנה</b><ul>${tips.slice(0,3).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div></div></div>`;
  document.body.insertAdjacentHTML('beforeend',h)}
fp224.evDay=evDay;
fp224.evDayGo=async(id,m)=>{const s=$('fpEvDay');if(s)s.remove();const e=evById(id);if(!e)return;const p=e.plan||{};
  if(m==='day'&&p.method==='none'){await bankMutate('chooseBankMethod',{id,method:'day'});try{renderBankCard()}catch(_){}toast('מעולה · קל וחלבוני עד האירוע')}
  else if(m==='none'&&p.method!=='none'){await bankMutate('chooseBankMethod',{id,method:'none'});try{renderBankCard()}catch(_){}toast('בסדר, יום רגיל')}
  else toast(m==='none'?'בסדר, יום רגיל':'מעולה · קל וחלבוני עד האירוע')};
function evDayCheck(){try{if(typeof state==='undefined'||!state.data||!state.data.bank)return;if(prop('TOUR_DONE')!=='1')return;
  const tv=$('today');if(!tv||!tv.classList.contains('active'))return;if(document.querySelector('.overlay:not(.hide),#fpSR,#fpRunScr,.tour-pop,#fpTour'))return;
  const t=bankToday();if(state.date!==t)return;const e=bankEvents().find(x=>x.date===t&&x.plan&&x.plan.mode!=='past');if(!e||asked().includes(e.id))return;evDay(e.id)}catch(err){console.warn('evDay',err)}}
setTimeout(()=>setInterval(evDayCheck,4000),6000);

})();
