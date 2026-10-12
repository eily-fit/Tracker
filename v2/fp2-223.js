/* FitPro 2.23.0
   1. The strength library ("שלי" in strength): a big search on top (an exercise: where it is and in how many plans; not found → add it),
      one line for place and equipment (gym / home · free weights / machines / body weight) with "שנה", category chips with "מועדפים" first,
      a star on every plan, favorites on top, then my plans, then the app's plans.
   2. A video for an exercise you added: kept in your Google Drive through Push.gs, only you see it. "שלח למנהל כהצעה" → the admin approves →
      the exercise and the video go to everyone, and only the admin changes them. Rename the exercise on the same screen.
   3. Settings → התראות → "בדיקת התראות": every step, with the real error.
   4. Your request was handled → a card in the app too (not only a push). */
(function(){
'use strict';
const prop=k=>{try{return FP2.getProp(k)||''}catch(_){return ''}};
const setProp=(k,v)=>{try{FP2.setProp(k,v)}catch(_){}};
const J=(k,d)=>{try{const v=JSON.parse(prop(k)||'null');return v==null?d:v}catch(_){return d}};
const LS={get(k){try{return localStorage.getItem(k)}catch(_){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(_){}},del(k){try{localStorage.removeItem(k)}catch(_){}}};
const ic=n=>window.fpIc?fpIc(n):'';
const norm=s=>String(s||'').replace(/^\s*\d+\s*[.)]\s*/,'').replace(/[▾◂▸›‹←→✓]/g,'').replace(/\s+/g,' ').trim();
const low=s=>norm(s).toLowerCase();
const isAdmin=()=>{try{return !!(window.FP2&&FP2.isAdmin&&FP2.isAdmin())}catch(_){return false}};
const push=(a,d)=>{if(!window.FP2||!FP2.push)return Promise.reject(new Error('אין חיבור לשרת. נסה שוב בעוד רגע'));return FP2.push(a,d)};
const errMsg=e=>{const m=String((e&&e.message)||e||'');return m==='push-not-configured'?'השרת עוד לא מחובר':m==='FORBIDDEN'?'אין הרשאה':m};

document.head.insertAdjacentHTML('beforeend',`<style id="fp223css">
#workoutLibrary #planPlaceChips,#workoutLibrary #planEquipmentChips,#workoutLibrary #planFilterChips,#workoutLibrary #planLibraryInfo,#workoutLibrary #planHomeOptions,#workoutLibrary>p.muted{display:none!important}
#fpLib{margin:0 0 10px}
#fpLib .srch{display:flex;align-items:center;gap:8px;background:#1F262E;border:1px solid #3A4652;border-radius:14px;padding:0 12px;margin:0 0 8px}
#fpLib .srch input{flex:1;min-width:0;background:none;border:0;color:inherit;font:inherit;font-size:15px;padding:12px 0;outline:none}
#fpLib .srch button{background:none;border:0;color:var(--muted,#A3ADB8);font:inherit;cursor:pointer;padding:6px}
#fpLib .res{background:var(--card,#171C22);border:1px solid var(--line,#2C3640);border-radius:14px;padding:8px 10px;margin:0 0 10px}
#fpLib .res .h{font-size:11.5px;color:#6B7682;margin:2px 2px 6px}
#fpLib .ri{display:flex;align-items:center;gap:8px;width:100%;font:inherit;color:inherit;text-align:right;background:#1F262E;border:1px solid var(--line,#2C3640);border-radius:12px;padding:9px 10px;margin:0 0 6px;cursor:pointer}
#fpLib .ri b{display:block;font-size:14px}#fpLib .ri small{display:block;color:var(--muted,#A3ADB8);font-size:12px}#fpLib .ri .t{flex:1;min-width:0}
#fpLib .pill{font-size:11px;border-radius:99px;padding:2px 8px;background:rgba(124,196,255,.14);color:#7CC4FF;white-space:nowrap}
#fpLib .add{font:inherit;background:none;border:0;color:var(--brand,#D7F36B);font-weight:700;cursor:pointer;padding:6px 2px;text-align:right}
#fpLib .flt{display:flex;justify-content:space-between;align-items:center;gap:10px;background:var(--card,#171C22);border:1px solid var(--line,#2C3640);border-radius:14px;padding:9px 12px;margin:0 0 8px}
#fpLib .flt small{display:block;font-size:11.5px;color:#6B7682}#fpLib .flt b{font-size:14px}
#fpLib .flt button{font:inherit;font-size:13px;border:1px solid var(--line,#2C3640);background:#1F262E;color:var(--ink,#F2F5F7);border-radius:99px;padding:6px 12px;cursor:pointer}
#fpLib .cats{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;margin:0 0 6px;scrollbar-width:none}#fpLib .cats::-webkit-scrollbar{display:none}
#fpLib .cats button{flex:none;font:inherit;font-size:13px;border:1px solid var(--line,#2C3640);background:#1F262E;color:var(--muted,#A3ADB8);border-radius:99px;padding:6px 12px;cursor:pointer;display:inline-flex;gap:5px;align-items:center}
#fpLib .cats button.on{background:#26301A;color:var(--ink,#F2F5F7);border-color:#4B5A2A}#fpLib .cats svg.ic{width:14px;height:14px}
#fpLib .cats button.on svg.ic{fill:var(--brand,#D7F36B);color:var(--brand,#D7F36B)}
#fpLib .exf{display:flex;gap:6px;align-items:center;margin:0 0 8px}
#workoutPlans .fpSep{font-size:11.5px;color:#6B7682;margin:12px 2px 6px;letter-spacing:.02em}
#workoutPlans .plan-line{display:flex;align-items:center;gap:8px}
#workoutPlans .plan-line .plan-peek-toggle{flex:1;min-width:0}
.fpStar{flex:none;width:34px;height:34px;display:grid;place-items:center;background:none;border:0;color:#46525F;cursor:pointer;padding:0;border-radius:10px}
.fpStar svg.ic{width:20px;height:20px}.fpStar.on{color:var(--brand,#D7F36B)}.fpStar.on svg.ic{fill:var(--brand,#D7F36B)}
.fpTagS{font-size:10.5px;border-radius:99px;padding:1px 7px;background:#26301A;color:var(--brand,#D7F36B);margin-inline-start:6px;vertical-align:middle}
/* the exercise video sheet */
#fpExV{z-index:2147481500}
#fpExV .vid{width:100%;max-height:46vh;border-radius:14px;background:#0B0F13;display:block}
#fpExV .ph{height:180px;border-radius:14px;background:repeating-linear-gradient(135deg,#1B222A 0 10px,#171C22 10px 20px);display:grid;place-items:center;color:var(--muted,#A3ADB8);text-align:center;padding:10px;margin:0 0 10px}
#fpExV .who{display:flex;justify-content:space-between;align-items:center;background:var(--card,#171C22);border:1px solid var(--line,#2C3640);border-radius:12px;padding:9px 11px;margin:10px 0}
#fpExV .pill{font-size:12px;border-radius:99px;padding:3px 10px;white-space:nowrap}
#fpExV .pill.me{background:rgba(124,196,255,.14);color:#7CC4FF}#fpExV .pill.wait{background:rgba(245,196,81,.14);color:#F5C451}#fpExV .pill.all{background:rgba(110,231,135,.13);color:#6EE787}
#fpExV .tiles{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 0 8px}
#fpExV .tile{font:inherit;color:inherit;background:#1F262E;border:1px solid var(--line,#2C3640);border-radius:14px;padding:14px 8px;text-align:center;font-weight:700;font-size:13.5px;cursor:pointer;display:block}
#fpExV .tile svg.ic{width:26px;height:26px;display:block;margin:0 auto 6px;color:var(--brand,#D7F36B)}#fpExV .tile small{display:block;font-weight:400;color:var(--muted,#A3ADB8);font-size:11.5px;margin-top:3px}
#fpExV .tile[disabled]{opacity:.55}
#fpExV .prog{height:8px;background:#2C3640;border-radius:6px;overflow:hidden;margin:10px 0 4px}#fpExV .prog i{display:block;height:100%;width:0;background:var(--brand,#D7F36B);transition:width .3s linear}
#fpExV .nm{display:flex;gap:8px;align-items:end;margin:0 0 4px}#fpExV .nm .field{flex:1;margin:0}
.fpChk{list-style:none;margin:8px 0 0;padding:0;display:grid;gap:6px}.fpChk li{display:grid;grid-template-columns:22px 1fr;gap:8px;font-size:13.5px;line-height:1.45}.fpChk li i{font-style:normal;font-weight:800}.fpChk li.ok i{color:#6EE787}.fpChk li.no i{color:#FF8A80}.fpChk li.wait i{color:#A3ADB8}.fpChk small{display:block;color:var(--muted,#A3ADB8)}
</style>`);

/* =========================================================
   1. the strength library
   ========================================================= */
const CATS=()=>(typeof LIBRARY_CATEGORIES!=='undefined'?LIBRARY_CATEGORIES:['רגליים','משיכה','דחיפה','גב','חזה','ידיים']);
const MODES=[['free','משקולות חופשיות'],['machines','מתקנים'],['bodyweight','משקל גוף']];
const PLACES=[['gym','חדר כושר'],['home','בית']];
const curPlace=()=>state.libraryPlace||((typeof getProfile==='function'&&getProfile()||{}).place==='home'?'home':'gym');
const curMode=()=>['machines','bodyweight'].includes(state.libraryMode)?state.libraryMode:'free';
const favs=()=>{const a=J('FAV_PLANS',[]);return Array.isArray(a)?a:[]};
const favKey=p=>p.builtin?'b:'+(p.libraryPlace||'')+'|'+(p.libraryMode||'')+'|'+(p.libraryDisplayName||p.name):'u:'+p.id;
const isFav=p=>favs().includes(favKey(p));
/* body-weight plans: the same builder the app uses for the other two (planFor), for both places */
if(typeof workoutLibrary==='function'&&typeof planFor==='function'){const o=workoutLibrary;workoutLibrary=function(){const plans=o.apply(this,arguments);
  try{if(!plans.some(p=>p.libraryMode==='bodyweight')){const p=libraryProfile(),catalog=state.data?.workout?.exercises||{},homeOptions=state.libraryHomeOptions||{};
    ['gym','home'].forEach(place=>{planFor({...p,place,libraryMode:'bodyweight',homeOptions}).forEach((x,i)=>{plans.push({...x,name:'ספרייה · '+(place==='home'?'בית':'חדר כושר')+' · '+equipmentModeLabel('bodyweight')+' · '+x.name,libraryDisplayName:x.name,id:'builtin:'+place+':bodyweight:'+i+':'+p.duration,builtin:true,libraryPlace:place,libraryMode:'bodyweight',library:true,items:x.items.map(it=>({...it,name:(catalog[it.group]||[]).find(e=>e.id===it.exerciseId)?.name||'תרגיל'}))})})})}}catch(e){console.warn(e)}
  return plans}}
function hiddenPlans(){try{const x=JSON.parse(state.data.settings.hidden_workout_plans||'[]');return Array.isArray(x)?x:[]}catch(_){return []}}
/* which plans the list shows, in this order: favorites, mine, the app's */
if(typeof visibleLibraryPlans==='function'){visibleLibraryPlans=function(){
  const place=curPlace(),mode=curMode(),cat=state.planFilter||'',hidden=hiddenPlans(),F=favs(),exId=state.fpLibEx||'';
  let L=planList().map((p,i)=>[p,i]).filter(([p])=>!hidden.includes(p.id));
  if(exId)L=L.filter(([p])=>(p.items||[]).some(it=>it.exerciseId===exId));
  else if(cat==='fav')L=L.filter(([p])=>F.includes(favKey(p)));
  else if(cat==='personal')L=L.filter(([p])=>!p.library);
  else if(cat)L=L.filter(([p])=>p.category===cat&&(p.library?p.libraryPlace===place&&p.libraryMode===mode:true));
  else L=[];
  const rank=([p])=>(F.includes(favKey(p))?0:!p.library?1:2);
  return L.map((x,k)=>[x,k]).sort((a,b)=>rank(a[0])-rank(b[0])||a[1]-b[1]).map(x=>x[0])}}
/* the header: search, the filter line and the categories */
let SQ='',sT=0;
function exList(){const cat=(state.data&&state.data.workout&&state.data.workout.exercises)||{},out=[];Object.keys(cat).forEach(g=>(cat[g]||[]).forEach(x=>out.push(Object.assign({group:g},x))));return out}
const eqLabel=e=>/גוף/.test(e||'')?'משקל גוף':/מכונ|מתקן|machine/i.test(e||'')?'מתקנים':'משקולות חופשיות';
function searchHtml(){const q=low(SQ);if(q.length<2)return '';
  const ex=exList().filter(x=>low(x.name).includes(q)).slice(0,8),plans=planList(),exact=exList().some(x=>low(x.name)===q);
  const inPlans=id=>plans.filter(p=>(p.items||[]).some(it=>it.exerciseId===id)).length;
  const pl=plans.map((p,i)=>[p,i]).filter(([p])=>low(p.library?p.libraryDisplayName||p.name:p.name).includes(q)).slice(0,4);
  let h=`<div class="res">`;
  if(ex.length)h+=`<div class="h">תרגילים</div>`+ex.map(x=>{const n=inPlans(x.id);return `<button type="button" class="ri" onclick="fp223.exPick('${esc(x.id)}')"><span class="t"><b>${esc(x.name)}</b><small>${esc(x.group)} · ${eqLabel(x.equipment)}</small></span>${n?`<span class="pill">ב-${n} ${n===1?'תוכנית':'תוכניות'}</span>`:'<span class="pill" style="background:#1F262E;color:#A3ADB8">לא בתוכנית</span>'}</button>`}).join('');
  if(pl.length)h+=`<div class="h">תוכניות</div>`+pl.map(([p,i])=>`<button type="button" class="ri" onclick="fp223.planPick(${i})"><span class="t"><b>${esc(p.library?p.libraryDisplayName||p.name:p.name)}</b><small>${esc(p.category||'כללי')} · ${p.library?(p.libraryPlace==='home'?'בית':'חדר כושר')+' · '+equipmentModeLabel(p.libraryMode):'שלי'}</small></span></button>`).join('');
  if(!ex.length&&!pl.length)h+=`<p class="mu" style="margin:4px 2px 6px">לא מצאנו ״${esc(norm(SQ))}״.</p>`;
  if(!exact)h+=`<button type="button" class="add" onclick="fp223.exAdd()">＋ להוסיף ״${esc(norm(SQ))}״ כתרגיל חדש</button>`;
  return h+'</div>'}
function libHtml(){const place=curPlace(),mode=curMode(),cat=state.planFilter||'',exId=state.fpLibEx,ex=exId&&exList().find(x=>x.id===exId);
  return `<div class="srch"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg><input id="fpLibQ" type="search" placeholder="חפש תרגיל או תוכנית" value="${esc(SQ)}" oninput="fp223.q(this.value)" aria-label="חיפוש">${SQ?`<button type="button" onclick="fp223.q('',1)" aria-label="ניקוי">✕</button>`:''}</div>
    <div id="fpLibRes">${searchHtml()}</div>
    <div class="flt"><span><small>מסנן</small><b>${PLACES.find(x=>x[0]===place)[1]} · ${MODES.find(x=>x[0]===mode)[1]}</b></span><button type="button" onclick="fp223.fltOpen()">שנה</button></div>
    ${ex?`<div class="exf"><span class="mu">תוכניות עם:</span><div class="cats" style="margin:0"><button type="button" class="on" onclick="fp223.exPick('')">${esc(ex.name)} ✕</button></div></div>`:
    `<div class="cats" role="tablist" aria-label="קטגוריה"><button type="button" class="${cat==='fav'?'on':''}" onclick="fp223.cat('fav')">${ic('star')}מועדפים</button>${CATS().map(c=>`<button type="button" class="${cat===c?'on':''}" onclick="fp223.cat('${c}')">${c}</button>`).join('')}<button type="button" class="${cat==='personal'?'on':''}" onclick="fp223.cat('personal')">כל התוכניות שלי</button></div>`}`}
function mountLib(){const lib=$('workoutLibrary'),plans=$('workoutPlans');if(!lib||!plans)return;let b=$('fpLib');if(!b){const hd=$('fpLibHd');(hd||plans).insertAdjacentHTML(hd?'afterend':'beforebegin','<div id="fpLib"></div>');b=$('fpLib')}
  {const hd=$('fpLibHd');if(hd&&b.previousElementSibling!==hd)hd.after(b)}
  const f=document.activeElement&&document.activeElement.id==='fpLibQ',pos=f?document.activeElement.selectionStart:0;b.innerHTML=libHtml();if(f){const i=$('fpLibQ');i.focus();try{i.setSelectionRange(pos,pos)}catch(_){}}}
/* stars and the group titles on the list the app drew */
function decorate(){const box=$('workoutPlans');if(!box)return;const F=favs(),list=planList();let last='';
  if(!state.planFilter&&!state.fpLibEx){box.innerHTML='<div class="fpCard"><p class="mu" style="margin:0">בחר קטגוריה, או חפש תרגיל למעלה.</p></div>';return}
  box.querySelectorAll(':scope > .plan-line').forEach(el=>{const b=el.querySelector('button[onclick^="startWorkoutPlan"]');if(!b)return;const i=Number((b.getAttribute('onclick').match(/\d+/)||[])[0]),p=list[i];if(!p)return;
    const g=F.includes(favKey(p))?'מועדפים':!p.library?'התוכניות שלי':'של האפליקציה';
    if(g!==last){last=g;if(state.planFilter!=='fav'||g!=='מועדפים')el.insertAdjacentHTML('beforebegin',`<div class="fpSep">${g}</div>`)}
    if(!el.querySelector('.fpStar')){const on=F.includes(favKey(p));el.insertAdjacentHTML('afterbegin',`<button type="button" class="fpStar${on?' on':''}" aria-pressed="${on}" aria-label="${on?'להוציא ממועדפים':'להוסיף למועדפים'}" onclick="event.stopPropagation();fp223.fav(${i})">${ic('star')}</button>`)}
    const t=el.querySelector('.plan-peek-toggle b');if(t&&!t.querySelector('.fpTagS')){if(!p.library&&(state.planFilter==='fav'||state.fpLibEx))t.insertAdjacentHTML('beforeend',`<span class="fpTagS">שלי</span>`);else if(p.library&&(state.planFilter==='fav'||state.fpLibEx))t.insertAdjacentHTML('beforeend',`<span class="fpTagS">${p.libraryPlace==='home'?'בית':'חדר כושר'} · ${esc(MODES.find(m=>m[0]===p.libraryMode)?MODES.find(m=>m[0]===p.libraryMode)[1]:'')}</span>`)}});
  if(!box.querySelector('.plan-line')){box.innerHTML=`<div class="fpCard"><p class="mu" style="margin:0">${state.planFilter==='fav'?'עוד אין מועדפים. לוחצים על הכוכב ליד תוכנית.':state.fpLibEx?'התרגיל לא מופיע באף תוכנית כאן.':'אין תוכניות בבחירה הזו. נסה ציוד אחר ב״שנה״.'}</p></div>`}}
if(typeof renderWorkoutPlans==='function'){const o=renderWorkoutPlans;renderWorkoutPlans=function(){const r=o.apply(this,arguments);try{mountLib();decorate()}catch(e){console.error(e)}return r}}
function fltSheet(){const place=curPlace(),mode=curMode(),opts=state.libraryHomeOptions||{},pr=(typeof getProfile==='function'&&getProfile())||{};
  fpT._.sheet('מקום וציוד',`<p class="mu" style="margin:0 0 6px">מקום</p><div class="fpSeg" role="group">${PLACES.map(([k,l])=>`<button type="button" class="${place===k?'on':''}" onclick="fp223.flt('place','${k}')">${l}</button>`).join('')}</div>
    <p class="mu" style="margin:8px 0 6px">ציוד</p><div class="fpSeg" role="group">${MODES.map(([k,l])=>`<button type="button" class="${mode===k?'on':''}" onclick="fp223.flt('mode','${k}')">${l}</button>`).join('')}</div>
    <p class="fpHint" style="margin:0 0 10px">תרגיל כמו מתח מופיע גם בציוד חופשי וגם במשקל גוף.</p>
    ${place==='home'&&mode==='free'?`<div class="fpCard"><b style="font-size:14px">ציוד נוסף שיש בבית</b>${[['barbell','מוט',pr.equipment==='barbell'],['bench','ספסל אימון',false]].map(([k,l,fb])=>`<div class="fpRow" style="padding:8px 0"><span>${l}</span><label class="fpSw"><input type="checkbox" ${opts[k]??fb?'checked':''} onchange="fp223.flt('${k}',this.checked)" aria-label="${l}"><span></span></label></div>`).join('')}</div>`:''}
    <button type="button" class="btn full" onclick="fpT.close()">הצג תוכניות</button>`)}
window.fp223={
  q(v,re){SQ=v;clearTimeout(sT);if(re){mountLib();return}sT=setTimeout(()=>{const r=$('fpLibRes');if(r)r.innerHTML=searchHtml()},150)},
  exPick(id){state.fpLibEx=id||'';state.planFilter=id?'__ex':'';SQ='';try{renderWorkoutPlans()}catch(_){}setTimeout(()=>{const g=$('workoutPlans');if(g&&id)g.scrollIntoView({behavior:'smooth',block:'start'})},60)},
  planPick(i){const p=planList()[i];if(!p)return;SQ='';state.fpLibEx='';if(p.library){state.libraryPlace=p.libraryPlace;state.libraryMode=p.libraryMode;state.planFilter=p.category||'personal'}else state.planFilter=p.category&&CATS().includes(p.category)?p.category:'personal';state.planPeek=p.id;try{renderWorkoutPlans()}catch(_){}},
  exAdd(){const n=norm(SQ);if(!n)return;try{openNewExerciseSheet();const i=$('newExName');if(i)i.value=n}catch(e){toast(e.message,true)}},
  cat(c){state.fpLibEx='';state.planPeek='';state.planFilter=state.planFilter===c&&c==='fav'?'':c;try{renderWorkoutPlans()}catch(_){}},
  fltOpen:fltSheet,
  flt(k,v){if(k==='place')state.libraryPlace=v;else if(k==='mode')state.libraryMode=v;else{state.libraryHomeOptions=Object.assign({},state.libraryHomeOptions||{},{[k]:v});state.libraryCache=null}
    state.planPeek='';try{renderWorkoutPlans()}catch(_){}fltSheet()},
  fav(i){const p=planList()[i];if(!p)return;const k=favKey(p),a=favs(),j=a.indexOf(k);if(j>=0)a.splice(j,1);else a.push(k);setProp('FAV_PLANS',JSON.stringify(a.slice(-200)));try{toast(j>=0?'הוצא מהמועדפים':'נוסף למועדפים')}catch(_){}try{renderWorkoutPlans()}catch(_){}}
};
if(typeof chooseLibraryCategory==='function'){const o=chooseLibraryCategory;chooseLibraryCategory=function(){state.fpLibEx='';return o.apply(this,arguments)}}
/* "שלי" in strength opens on the favorites when there are any */
if(typeof showView==='function'){const o=showView;showView=function(id){if(id==='workoutLibrary'&&!state.planFilter&&!state.fpLibEx&&favs().length)state.planFilter='fav';const r=o.apply(this,arguments);try{if(id==='workoutLibrary')mountLib()}catch(_){}return r}}

/* =========================================================
   2. exercise videos
   ========================================================= */
const EXV=()=>J('EXV',{})||{};
const exvSave=m=>setProp('EXV',JSON.stringify(m));
const exKey=x=>x?x.id:'';
const findEx=name=>{const n=low(name);return exList().find(x=>low(x.name)===n)||null};
let SHARED=(()=>{try{return JSON.parse(LS.get('fp2.sharedEx')||'null')||{t:0,items:[]}}catch(_){return {t:0,items:[]}}})();
async function loadShared(force){if(!force&&Date.now()-SHARED.t<6*36e5)return SHARED.items;try{const r=await push('listSharedExercises',{});SHARED={t:Date.now(),items:(r&&r.items)||[]};LS.set('fp2.sharedEx',JSON.stringify(SHARED))}catch(_){}return SHARED.items}
const sharedOf=name=>(SHARED.items||[]).find(x=>low(x.name)===low(name));
/* video files on this phone (IndexedDB), so a video downloads once */
const vdb=()=>new Promise((ok,no)=>{const r=indexedDB.open('fp2vids',1);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('v'))r.result.createObjectStore('v')};r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
const vget=async k=>{try{const d=await vdb();return await new Promise(ok=>{const t=d.transaction('v','readonly').objectStore('v').get(k);t.onsuccess=()=>ok(t.result||null);t.onerror=()=>ok(null)})}catch(_){return null}};
const vput=async(k,b)=>{try{const d=await vdb();await new Promise(ok=>{const t=d.transaction('v','readwrite');t.objectStore('v').put(b,k);t.oncomplete=ok;t.onerror=ok})}catch(_){}};
const b64ToBlob=(b64,type)=>{const bin=atob(b64),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return new Blob([u],{type})};
const blobToB64=b=>new Promise((ok,no)=>{const fr=new FileReader();fr.onload=()=>ok(String(fr.result).split(',')[1]||'');fr.onerror=()=>no(fr.error);fr.readAsDataURL(b)});
async function videoUrl(fid){let b=await vget(fid);if(!b){const r=await push('exVideoGet',{fid});b=b64ToBlob(r.b64,r.type||'video/mp4');vput(fid,b)}return URL.createObjectURL(b)}
/* make a phone video small: 480 px, no sound, up to 30 seconds (the time it takes = the length of the clip). If that is not possible, a short file goes as it is. */
const MAXS=30;
async function shrink(file,onp){const okType=/^video\//.test(file.type||'video/mp4');if(!okType)throw new Error('זה לא קובץ וידאו');
  const url=URL.createObjectURL(file),v=document.createElement('video');v.muted=true;v.playsInline=true;v.setAttribute('playsinline','');v.preload='auto';v.src=url;
  await new Promise((ok,no)=>{v.onloadedmetadata=ok;v.onerror=()=>no(new Error('הסרטון לא נפתח'));setTimeout(()=>no(new Error('הסרטון לא נפתח')),15000)});
  const dur=Math.min(MAXS,v.duration||MAXS),cv=document.createElement('canvas'),sc=Math.min(1,480/Math.max(v.videoWidth||480,v.videoHeight||480));cv.width=Math.round((v.videoWidth||480)*sc/2)*2;cv.height=Math.round((v.videoHeight||480)*sc/2)*2;
  const can=!!(cv.captureStream&&window.MediaRecorder);
  if(!can){URL.revokeObjectURL(url);if(file.size>9e6)throw new Error('הסרטון גדול מדי לטלפון הזה. צלם קטע קצר יותר, עד 15 שניות');return {blob:file,type:file.type||'video/mp4',sec:dur}}
  const types=['video/mp4;codecs=avc1','video/mp4','video/webm;codecs=vp8','video/webm'].filter(t=>{try{return MediaRecorder.isTypeSupported(t)}catch(_){return false}});
  const st=cv.captureStream(30),rec=new MediaRecorder(st,Object.assign({videoBitsPerSecond:1200000},types[0]?{mimeType:types[0]}:{})),chunks=[],g=cv.getContext('2d');
  rec.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
  const done=new Promise(ok=>{rec.onstop=ok});let raf=0;
  const draw=()=>{try{g.drawImage(v,0,0,cv.width,cv.height)}catch(_){}if(onp)onp(Math.min(1,v.currentTime/dur));if(v.currentTime>=dur||v.ended){try{rec.state!=='inactive'&&rec.stop()}catch(_){}v.pause();return}raf=requestAnimationFrame(draw)};
  rec.start(500);await v.play().catch(()=>{});draw();setTimeout(()=>{try{rec.state!=='inactive'&&rec.stop()}catch(_){}},(dur+3)*1000);
  await done;cancelAnimationFrame(raf);URL.revokeObjectURL(url);const type=(rec.mimeType||types[0]||'video/mp4').split(';')[0];const blob=new Blob(chunks,{type});
  if(!blob.size){if(file.size>9e6)throw new Error('הסרטון לא נדחס. צלם קטע קצר יותר');return {blob:file,type:file.type||'video/mp4',sec:dur}}
  return {blob,type,sec:dur}}
/* the sheet */
let XV=null;
function xvSheet(){const x=XV;if(!x)return;let o=$('fpExV');if(!o){document.body.insertAdjacentHTML('beforeend','<div class="overlay" id="fpExV"><div class="sheet" style="max-height:92vh;overflow:auto"></div></div>');o=$('fpExV');o.addEventListener('click',e=>{if(e.target===o&&!x.busy)fp223.xvClose()})}
  const ex=x.ex,sh=sharedOf(x.name),mine=ex?EXV()[exKey(ex)]:null,adm=isAdmin(),canName=ex&&!sh&&!ex.sourceUrl;
  let h=`<div class="sheet-head"><h3 style="margin:0">${esc(x.name)}</h3><button type="button" class="trash" aria-label="סגור" onclick="fp223.xvClose()">✕</button></div>`;
  if(canName)h+=`<div class="nm"><div class="field"><label for="fpXvN">שם התרגיל</label><input id="fpXvN" value="${esc(x.name)}" maxlength="60"></div><button type="button" class="btn light" onclick="fp223.xvRename()">שמור שם</button></div>`;
  if(x.busy)h+=`<div class="ph"><div><b>${esc(x.busy)}</b><div class="prog" style="width:220px"><i id="fpXvP" style="width:${Math.round((x.p||0)*100)}%"></i></div><small class="mu">אפשר להשאיר את המסך פתוח עד שזה נגמר</small></div></div>`;
  else if(sh||mine)h+=x.url?`<video class="vid" src="${x.url}" controls playsinline loop muted autoplay></video>`:`<div class="ph">${x.err?esc(x.err):'טוען את הסרטון…'}</div>`;
  if(!x.busy&&sh){h+=`<div class="who"><span class="mu">מי רואה</span><span class="pill all">כולם</span></div>`;
    if(adm)h+=`<label class="btn light full" style="display:block;text-align:center">להחליף את הסרטון לכולם<input type="file" accept="video/*" style="display:none" onchange="fp223.xvUp(this.files&&this.files[0],'admin')"></label>`;
    else h+=`<p class="mu" style="margin:0">התרגיל והסרטון אושרו לכולם. רק המנהל משנה אותם.</p>`}
  else if(!x.busy&&mine){const st=mine.status||'private';
    h+=`<div class="who"><span class="mu">מי רואה</span><span class="pill ${st==='suggested'?'wait':'me'}">${st==='suggested'?'נשלח למנהל':'רק אתה'}</span></div>`;
    if(st==='suggested')h+=`<p class="mu" style="margin:0 0 8px">ממתין לאישור המנהל. בינתיים רק אתה רואה את הסרטון. תקבל הודעה כשיאושר.</p><button type="button" class="btn light full" onclick="fp223.xvUnsug()">לבטל את ההצעה</button>`;
    else h+=`<button type="button" class="btn full" onclick="fp223.xvSug()">שלח למנהל כהצעה</button><p class="fpHint" style="margin:6px 2px 10px">אם המנהל יאשר, התרגיל והסרטון ייכנסו לכולם. בלי זה, הסרטון נשאר רק שלך.</p>`;
    h+=`<label class="btn light full" style="display:block;text-align:center;margin-top:8px">להחליף סרטון<input type="file" accept="video/*" style="display:none" onchange="fp223.xvUp(this.files&&this.files[0])"></label>
      <button type="button" class="btn light full" style="margin-top:8px;color:#F09595" onclick="fp223.xvDel()">למחוק את הסרטון</button>`}
  else if(!x.busy){const asked=window.FP2Anim&&FP2Anim.asked&&FP2Anim.asked(x.name);
    h+=`<div class="ph"><div>${ic('film')}<br>לתרגיל הזה עוד אין הדגמה</div></div>
      <div class="tiles"><label class="tile">${ic('cam')}להעלות סרטון שלי<small>מצלמים או בוחרים, עד 30 שנ׳. רק אתה רואה</small><input type="file" accept="video/*" style="display:none" onchange="fp223.xvUp(this.files&&this.files[0])"></label>
      <button type="button" class="tile" ${asked?'disabled':''} onclick="fp223.xvAsk()">${ic('chat')}${asked?'הבקשה כבר נשלחה':'לבקש הדגמה מהמנהל'}<small>${asked?'המנהל יראה אותה ברשימה':'פעם אחת, הבקשה נשמרת'}</small></button></div>
      ${!ex?'<p class="fpHint" style="margin:0">כדי להעלות סרטון, התרגיל צריך להיות ברשימת התרגילים שלך.</p>':''}`}
  o.querySelector('.sheet').innerHTML=h;o.classList.remove('hide')}
async function xvLoad(){const x=XV;if(!x)return;const sh=sharedOf(x.name),mine=x.ex?EXV()[exKey(x.ex)]:null,fid=sh?sh.fid:mine&&mine.fid;if(!fid)return;
  try{const u=await videoUrl(fid);if(XV!==x)return URL.revokeObjectURL(u);if(x.url)URL.revokeObjectURL(x.url);x.url=u;x.err=''}catch(e){x.err='הסרטון לא נטען: '+errMsg(e)}xvSheet()}
async function xvSyncStatus(){const x=XV;if(!x||!x.ex)return;const m=EXV(),k=exKey(x.ex),mine=m[k];if(!mine||mine.status!=='suggested')return;await loadShared(true);if(XV!==x)return;
  if((SHARED.items||[]).some(s=>s.fid===mine.fid)){mine.status='public';m[k]=mine;exvSave(m)}xvSheet()}
window.fp223 && (window.fp223._sync=async()=>{await loadShared(true);return syncShared()});
window.fpExV={open(name){const n=norm(name);if(!n)return;XV={name:n,ex:findEx(n),url:'',busy:'',p:0};xvSheet();loadShared(false).then(()=>{if(XV&&XV.name===n){xvSheet();xvLoad();xvSyncStatus()}})}};
Object.assign(window.fp223,{
  xvClose(){const o=$('fpExV');if(o)o.remove();if(XV&&XV.url)URL.revokeObjectURL(XV.url);XV=null},
  async xvUp(file,mode){const x=XV;if(!x||!file)return;if(!x.ex&&mode!=='admin'){toast('קודם מוסיפים את התרגיל לרשימה',true);return}
    x.busy='מכין את הסרטון';x.p=0;xvSheet();
    try{const s=await shrink(file,p=>{x.p=p*0.8;const b=$('fpXvP');if(b)b.style.width=Math.round(x.p*100)+'%'});x.busy='מעלה';x.p=0.85;xvSheet();
      const b64=await blobToB64(s.blob);const ex=x.ex||{},m=EXV(),k=exKey(ex),old=m[k];
      if(mode==='admin'){const r=await push('adminSetSharedVideo',{b64,type:s.type,name:x.name,group:ex.group||'',equipment:ex.equipment||''});vput(r.fid,s.blob);await loadShared(true);toast('הסרטון הוחלף אצל כולם')}
      else{const r=await push('exVideoUpload',{b64,type:s.type,name:x.name,group:ex.group||'',equipment:ex.equipment||'',exId:k,replace:old&&old.status!=='public'?old.fid:''});vput(r.fid,s.blob);m[k]={fid:r.fid,status:'private',name:x.name,ts:new Date().toISOString()};exvSave(m);toast('הסרטון נשמר. רק אתה רואה אותו')}
      x.busy='';if(x.url)URL.revokeObjectURL(x.url);x.url='';xvSheet();xvLoad()}
    catch(e){x.busy='';xvSheet();toast('הסרטון לא נשמר: '+errMsg(e),true)}},
  async xvSug(){const x=XV;if(!x||!x.ex)return;const m=EXV(),k=exKey(x.ex),mine=m[k];if(!mine)return;
    try{await push('exVideoSuggest',{fid:mine.fid,name:x.name,group:x.ex.group||'',equipment:x.ex.equipment||''});mine.status='suggested';m[k]=mine;exvSave(m);toast('נשלח למנהל. תקבל הודעה כשיאושר');xvSheet()}catch(e){toast(errMsg(e),true)}},
  async xvUnsug(){const x=XV;if(!x||!x.ex)return;const m=EXV(),k=exKey(x.ex),mine=m[k];if(!mine)return;
    try{await push('exVideoUnsuggest',{fid:mine.fid});mine.status='private';m[k]=mine;exvSave(m);toast('ההצעה בוטלה');xvSheet()}catch(e){toast(errMsg(e),true)}},
  async xvDel(){const x=XV;if(!x||!x.ex)return;const m=EXV(),k=exKey(x.ex),mine=m[k];if(!mine||!confirm('למחוק את הסרטון?'))return;
    try{await push('exVideoDelete',{fid:mine.fid})}catch(e){if(!/לא נמצא|FORBIDDEN/.test(errMsg(e))){toast(errMsg(e),true);return}}
    delete m[k];exvSave(m);if(x.url)URL.revokeObjectURL(x.url);x.url='';toast('הסרטון נמחק');xvSheet()},
  async xvAsk(){const x=XV;if(!x)return;try{const ok=await FP2Anim.request(x.name,x.ex&&x.ex.group,x.ex&&x.ex.equipment);toast(ok?'הבקשה נשלחה למנהל':'הבקשה תישלח כשיהיה חיבור')}catch(_){toast('הבקשה תישלח כשיהיה חיבור')}xvSheet()},
  async xvRename(){const x=XV;if(!x||!x.ex)return;const n=norm(($('fpXvN')||{}).value);if(!n||n===x.name)return;
    if(findEx(n))return toast('כבר יש תרגיל בשם הזה',true);
    try{state.data.workout=await call('updateExercise',{id:x.ex.id,name:n});const m=EXV(),k=exKey(x.ex);if(m[k]){m[k].name=n;exvSave(m)}x.name=n;x.ex=findEx(n)||x.ex;try{renderWorkouts(false)}catch(_){}toast('השם עודכן');xvSheet()}catch(e){toast(errMsg(e),true)}}
});
/* approved exercises from other people come into my list of exercises (once each) */
async function syncShared(){if(!state.data||!state.data.workout)return;const items=await loadShared(false);const added=J('SHARED_ADDED',[]);let ch=false;
  for(const s of items){const n=low(s.name);if(added.includes(n))continue;if(!findEx(s.name)){try{state.data.workout=await call('saveExercise',{muscleGroup:s.group||'כללי',name:s.name,equipment:s.equipment||'משקולות חופשיות'});ch=true}catch(_){continue}}added.push(n)}
  setProp('SHARED_ADDED',JSON.stringify(added.slice(-300)));if(ch){try{if($('workoutLibrary')&&$('workoutLibrary').classList.contains('active'))renderWorkoutPlans()}catch(_){}}}
/* the admin: suggestions to approve (Settings) */
let SUG=null;
function sugHtml(){if(SUG===null)return '<p class="mu">טוען…</p>';if(SUG.err)return `<p class="mu">${esc(SUG.err)}</p>`;if(!SUG.items.length)return '<p class="mu" style="margin:0">אין הצעות חדשות.</p>';
  return SUG.items.map(s=>`<div class="fpCard" style="padding:10px 12px"><b>${esc(s.name)}</b><small class="mu" style="display:block">${esc(s.by||'משתמש')} · ${esc(s.group||'')} · ${esc(eqLabel(s.equipment))}</small>
    ${SUG.url&&SUG.url[s.fid]?`<video src="${SUG.url[s.fid]}" controls playsinline loop muted style="width:100%;border-radius:12px;margin-top:8px;background:#0B0F13"></video>`:`<button type="button" class="btn light full" style="margin-top:8px" onclick="fp223.sugPlay('${esc(s.fid)}')">▶ לצפות בסרטון</button>`}
    <div class="field" style="margin:8px 0 0"><label>שם לכולם</label><input id="fpSugN_${esc(s.fid)}" value="${esc(s.name)}" maxlength="60"></div>
    <input id="fpSugT_${esc(s.fid)}" placeholder="הערה למשתמש (לא חובה)" style="width:100%;margin-top:6px">
    <div class="row" style="margin-top:8px"><button type="button" class="btn light" onclick="fp223.sugDo('${esc(s.fid)}',0)">לא לאשר</button><button type="button" class="btn" onclick="fp223.sugDo('${esc(s.fid)}',1)">לאשר לכולם</button></div></div>`).join('')}
async function sugLoad(){SUG=null;sugRender();try{const r=await push('adminListExSuggestions',{});SUG={items:(r&&r.items)||[],url:{}}}catch(e){SUG={items:[],err:'לא נטען: '+errMsg(e)}}sugRender()}
function sugRender(){const b=$('fpSugBody');if(b)b.innerHTML=sugHtml()}
Object.assign(window.fp223,{
  async sugPlay(fid){try{const u=await videoUrl(fid);SUG.url[fid]=u;sugRender()}catch(e){toast(errMsg(e),true)}},
  async sugDo(fid,ok){const name=norm(($('fpSugN_'+fid)||{}).value),note=String(($('fpSugT_'+fid)||{}).value||'').trim();
    try{await push('adminDecideExSuggestion',{fid,ok:!!ok,name,note});SUG.items=SUG.items.filter(s=>s.fid!==fid);sugRender();toast(ok?'אושר. התרגיל והסרטון אצל כולם':'לא אושר. נשאר אצל המשתמש');if(ok){await loadShared(true);syncShared()}}catch(e){toast(errMsg(e),true)}}
});
function renderSugSet(){const sec=$('settings');if(!sec||!state.data||!isAdmin())return;let box=$('fpSugSet');
  if(!box){box=document.createElement('details');box.className='settings-section admin-only';box.id='fpSugSet';box.addEventListener('toggle',()=>{if(box.open)sugLoad()});sec.appendChild(box);box.innerHTML='<summary>הצעות לתרגילים</summary><div class="settings-body"><p class="mu" style="margin:0 0 8px">תרגילים עם סרטון שמשתמשים הציעו. אישור מכניס את התרגיל והסרטון לכולם.</p><div id="fpSugBody"></div></div>'}}

/* =========================================================
   3. the notification check (Settings → התראות)
   ========================================================= */
let CHK=null;
const ios=()=>/iPhone|iPad|iPod/.test(navigator.userAgent)||navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1;
const standalone=()=>!!(navigator.standalone||matchMedia('(display-mode: standalone)').matches);
async function runCheck(send){const L=[];const add=(ok,t,s)=>L.push({ok,t,s});CHK={busy:true,L};chkRender();
  const sup='Notification' in window&&'serviceWorker' in navigator&&'PushManager' in window;
  add(sup,'המכשיר תומך בהתראות',sup?'':'בדפדפן הזה אין התראות. באייפון צריך iOS 16.4 ומעלה.');
  if(ios())add(standalone(),'האפליקציה פתוחה ממסך הבית',standalone()?'':'באייפון התראות עובדות רק מהאייקון במסך הבית: שיתוף ← הוסף למסך הבית, ופותחים משם.');
  const perm=typeof Notification!=='undefined'?Notification.permission:'none';
  add(perm==='granted','יש הרשאה להתראות',perm==='denied'?'ההרשאה חסומה. בהגדרות של הטלפון ← התראות ← FitPro ← לאפשר.':perm==='default'?'עוד לא אישרת. לוחצים ״הפעל התראות לטלפון״ ומאשרים.':'');
  let sub=null;try{const reg=await navigator.serviceWorker.getRegistration();sub=reg&&reg.pushManager?await reg.pushManager.getSubscription():null}catch(_){}
  add(!!sub,'הטלפון רשום לקבלת התראות',sub?'':'לוחצים ״הפעל התראות לטלפון״ כדי לרשום מחדש.');
  let st=null;try{st=await push('pushStatus',{})}catch(e){add(false,'חיבור לשרת ההתראות','השרת לא ענה: '+errMsg(e)+'. אם עדכנת את Push.gs, צריך Deploy ← New version.')}
  if(st){add(!!st.vapid,'השרת מוגדר (מפתח VAPID)',st.vapid?'':'חסר VAPID_PUBLIC_KEY ב-Script properties.');add(st.fcm==='ok','השרת מחובר ל-Firebase Cloud Messaging',st.fcm==='ok'?'':st.fcm);
    add(st.devices>0,'המכשיר רשום בשרת',st.devices>0?st.devices+(st.devices===1?' מכשיר':' מכשירים')+' בחשבון שלך':'אין מכשיר רשום. לוחצים ״הפעל התראות לטלפון״.');
    if(st.lastError)add(false,'שגיאה אחרונה בשליחה',st.lastError)}
  if(send&&st&&st.devices>0){try{const r=await push('sendTestNotification',{});add(true,'התראת בדיקה יצאה',(r&&r.sent||1)+' מכשירים. היא אמורה להגיע תוך כמה שניות.')}catch(e){add(false,'התראת בדיקה',errMsg(e))}}
  CHK={busy:false,L};chkRender()}
function chkHtml(){if(!CHK)return '';return `<ul class="fpChk">${CHK.L.map(x=>`<li class="${x.ok?'ok':'no'}"><i>${x.ok?'✓':'✗'}</i><span>${esc(x.t)}${x.s?`<small>${esc(x.s)}</small>`:''}</span></li>`).join('')}${CHK.busy?'<li class="wait"><i>…</i><span>בודק</span></li>':''}</ul>`}
function chkRender(){const b=$('fpChkBody');if(b)b.innerHTML=chkHtml()}
window.fp223.check=send=>runCheck(!!send);
function renderChk(){const box=$('notificationSettings');if(!box)return;const body=box.querySelector('.settings-body');if(!body||$('fpChkWrap'))return;
  body.insertAdjacentHTML('beforeend',`<div id="fpChkWrap" style="margin-top:14px"><h3>בדיקת התראות</h3><p class="muted">בודק כל שלב, מההרשאה בטלפון ועד השרת, ואומר מה לתקן.</p><div class="row"><button type="button" class="btn light" onclick="fp223.check(0)">לבדוק</button><button type="button" class="btn secondary" onclick="fp223.check(1)">לבדוק ולשלוח בדיקה</button></div><div id="fpChkBody">${chkHtml()}</div></div>`)}

/* =========================================================
   4. my requests: when the admin handled one, a card in the app too
   ========================================================= */
const RS_KEY='fp2.reqStatusSeen';
async function reqInbox(){if(!window.FP2||!FP2.reqList||$('fpReqNews')||$('fpI'))return;let list=[];try{list=await FP2.reqList(false)}catch(_){return}
  let seen={};try{seen=JSON.parse(LS.get(RS_KEY)||'{}')||{}}catch(_){}
  const first=!LS.get(RS_KEY),news=list.filter(x=>['progress','done','declined'].includes(x.status)&&seen[x.id]!==x.status);
  if(first){list.forEach(x=>seen[x.id]=x.status||'new');LS.set(RS_KEY,JSON.stringify(seen));return}
  if(!news.length)return;const T={progress:'אושרה ונכנסה לטיפול',done:'בוצעה, כבר באפליקציה',declined:'לא אושרה'};
  document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="fpReqNews"><div class="sheet" style="max-height:80vh;overflow:auto"><div class="sheet-head"><h3 style="margin:0">עדכון על הבקשות שלך</h3><button type="button" class="trash" aria-label="סגור" onclick="fp223.reqSeen()">✕</button></div>
    ${news.map(x=>`<div class="fpCard"><b>${esc(T[x.status])}</b><p style="margin:4px 0 0">״${esc((x.text||'הקלטה').slice(0,120))}״</p>${x.note?`<p class="mu" style="margin:6px 0 0">תשובה: ${esc(x.note)}</p>`:''}</div>`).join('')}
    <button type="button" class="btn full" onclick="fp223.reqSeen()">הבנתי</button></div></div>`);
  window.fp223.reqSeen=()=>{news.forEach(x=>seen[x.id]=x.status);LS.set(RS_KEY,JSON.stringify(seen));const e=$('fpReqNews');if(e)e.remove()}}

/* ---------- hooks ---------- */
if(typeof renderSettings==='function'){const o=renderSettings;renderSettings=function(){const r=o.apply(this,arguments);try{renderSugSet()}catch(e){console.error(e)}try{renderChk()}catch(e){console.error(e)}return r}}
if(typeof renderNotificationSettings==='function'){const o=renderNotificationSettings;renderNotificationSettings=function(){const r=o.apply(this,arguments);try{renderChk()}catch(_){}return r}}
const boot=setInterval(()=>{if(typeof state==='undefined'||!state.data||!window.FP2)return;clearInterval(boot);
  setTimeout(()=>{syncShared().catch(()=>{})},3000);setTimeout(()=>{reqInbox().catch(()=>{})},5000);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')setTimeout(()=>{reqInbox().catch(()=>{})},1500)})},800);
})();
