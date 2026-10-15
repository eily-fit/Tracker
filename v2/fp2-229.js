/* FitPro 2.29.0
   1. one name = one exercise / one food: a name that is already taken is stopped, with "open the one that exists"
   2. long press on an exercise in the lists: open its page, rename, move to another muscle group, remove
   (the recording, the sounds and the video upload are not touched here) */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const low=s=>String(s||'').trim().replace(/\s+/g,' ').toLowerCase();
const isAdmin=()=>{try{return !!(window.FP2&&FP2.isAdmin&&FP2.isAdmin())}catch(_){return false}};
window.fp229=window.fp229||{};
const allEx=()=>{const out=[];try{Object.entries((state.data.workout&&state.data.workout.exercises)||{}).forEach(([g,l])=>(l||[]).forEach(x=>out.push(Object.assign({group:g},x))))}catch(_){}return out};
const exById=id=>allEx().find(x=>String(x.id)===String(id))||null;
const shared=name=>{try{return !!(window.fp223&&fp223.isShared&&fp223.isShared(name))}catch(_){return false}};
/* 2.30: the app's own exercises and exercises others added (approved for everyone) are locked for users. The admin can change everything. */
const builtin=x=>{try{if(x&&x.builtin)return true;const A=window.FP2Anim;return !!(x&&A&&A.map&&A.map[A.norm?A.norm(x.name):x.name])}catch(_){return false}};
const lockOf=x=>isAdmin()||!x?'':builtin(x)?'app':shared(x.name)?'shared':'';
fp229.lockOf=lockOf;
/* a name taken by an app exercise or an approved one, even if it is not in your list */
const takenOutside=name=>{const n=low(name);if(!n)return '';if(allEx().some(x=>low(x.name)===n))return '';
  try{const A=window.FP2Anim;if(A&&A.map){const k=Object.keys(A.map).find(k=>low(k)===n);if(k)return k}}catch(_){}
  try{if(window.fp223&&fp223.isShared&&fp223.isShared(name))return name.trim()}catch(_){}return ''};
fp229.takenOutside=takenOutside;

document.head.insertAdjacentHTML('beforeend',`<style id="fp229css">
#fp229Dup{position:fixed;inset:0;z-index:2147482800;background:rgba(0,0,0,.62);display:grid;place-items:center;padding:20px}
#fp229Dup .c{width:100%;max-width:360px;background:#171C22;border:1px solid var(--line,#2C3640);border-radius:20px;padding:18px 16px 14px;box-shadow:0 20px 60px rgba(0,0,0,.6);color:var(--ink,#F2F5F7)}
#fp229Dup h3{margin:0 0 6px;font-size:18px}#fp229Dup p{margin:0 0 14px;color:#C9D1D9;font-size:14.5px;line-height:1.5}
#fp229Dup .r{display:flex;flex-direction:column;gap:8px}#fp229Dup .r button{font:inherit;font-weight:800;font-size:15px;border-radius:13px;padding:12px 8px;border:0;cursor:pointer}
#fp229Dup .y{background:#D7F36B;color:#14190a}#fp229Dup .no{background:#1F262E;color:#F2F5F7;border:1px solid var(--line,#2C3640)!important}
#fp229Ex{z-index:2147482600}#fp229Ex .sheet{padding-bottom:calc(18px + env(safe-area-inset-bottom))}
#fp229Ex .mi{display:flex;align-items:center;gap:10px;width:100%;font:inherit;font-size:15px;font-weight:700;text-align:start;background:#1F262E;color:var(--ink,#F2F5F7);border:1px solid var(--line,#2C3640);border-radius:13px;padding:13px 14px;margin:0 0 8px;cursor:pointer}
#fp229Ex .mi.d{color:#FF8A80;border-color:#5a2a2a}#fp229Ex .mi svg{flex:none}
#fp229Ex .gr{display:flex;flex-wrap:wrap;gap:8px;margin:4px 0 12px}
#fp229Ex .gr button{font:inherit;font-size:14px;font-weight:700;border-radius:99px;padding:8px 14px;border:1px solid var(--line,#2C3640);background:#1F262E;color:#C9D1D9;cursor:pointer}
#fp229Ex .gr button.on{background:#222D17;border-color:var(--brand,#D7F36B);color:var(--brand,#D7F36B)}
</style>`);
const ic=(p,s=18)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const IC={open:'<path d="M4 12s3-7 8-7 8 7 8 7-3 7-8 7-8-7-8-7z"/><circle cx="12" cy="12" r="2.5"/>',edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/>',move:'<path d="M5 12h14M13 6l6 6-6 6"/>',del:'<path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13"/>'};

/* ============ 1. a name that is taken ============ */
function dup(kind,name){const old=$('fp229Dup');if(old)old.remove();
  const ex=kind==='ex';
  const h=`<div id="fp229Dup" role="dialog" aria-modal="true" aria-labelledby="fp229DupT"><div class="c"><h3 id="fp229DupT">${ex?'יש כבר תרגיל בשם הזה':'יש כבר מאכל בשם הזה'}</h3>
    <p>״${esc(name)}״ ${ex?'כבר קיים. כל תרגיל מופיע פעם אחת, אז צריך שם אחר.':'כבר קיים במאגר. כל מאכל מופיע פעם אחת, אז צריך שם אחר. אפשר גם לחפש אותו בחיפוש.'}</p>
    <div class="r">${ex?`<button type="button" class="y" onclick="fp229.dupOpen()">לפתוח את התרגיל הקיים</button>`:''}<button type="button" class="${ex?'no':'y'}" onclick="fp229.dupClose()">לכתוב שם אחר</button></div></div></div>`;
  document.body.insertAdjacentHTML('beforeend',h);fp229._dup=name}
fp229.dupClose=()=>{const o=$('fp229Dup');if(o)o.remove()};
fp229.dupOpen=()=>{const n=fp229._dup;fp229.dupClose();
  ['exerciseSheet'].forEach(id=>{try{const s=$(id);if(s&&!s.classList.contains('hide'))closeSheet(id)}catch(_){}});
  try{fp227.ex(n)}catch(_){}};
fp229.dup=dup;
/* the server stops a taken exercise name with "יש כבר תרגיל בשם ״…״" — every place that adds or renames shows it with toast, so the window opens instead */
if(typeof toast==='function'){const o=toast;toast=function(msg){const m=String(msg||'').match(/^יש כבר תרגיל בשם ״(.+)״$/);if(m){dup('ex',m[1]);return}return o.apply(this,arguments)}}
/* a new food in "המזונות שלי": your foods and the foods everyone has */
const foodTaken=name=>{const n=low(name);if(!n)return '';
  try{const a=(state.data&&state.data.myFoods)||[];const f=a.find(x=>low(x.name)===n);if(f)return f.name}catch(_){}
  try{const a=(window.FP2&&FP2.sharedAll&&FP2.sharedAll())||[];const f=a.find(x=>low(x.name)===n);if(f)return f.name}catch(_){}
  return ''};
fp229.foodTaken=foodTaken;
if(typeof saveFoodOnly==='function'){const o=saveFoodOnly;saveFoodOnly=async function(){
  try{const name=(($('foodName')||{}).value||'').trim(),sf=state.selectedFood;
    /* changing the food you opened is fine (same name) */
    if(name&&!(sf&&low(sf.name)===low(name))){const t=foodTaken(name);if(t){dup('food',t);return}}}catch(_){}
  return o.apply(this,arguments)}}

/* ============ 2. long press on an exercise ============ */
const GROUPS=['חזה','גב','כתפיים','יד קדמית','יד אחורית','רגליים','בטן'];
function exMenu(id){const x=exById(id);if(!x){toast('התרגיל לא נמצא ברשימה',true);return}
  const old=$('fp229Ex');if(old)old.remove();
  const locked=lockOf(x),fromPage=!!$('fp227Ex');
  let b=fromPage?'':`<button type="button" class="mi" onclick="fp229.exGo('open','${esc(x.id)}')">${ic(IC.open)}לפתוח את עמוד התרגיל</button>`;
  if(locked)b+=`<p class="mu" style="margin:4px 2px 0;font-size:13px">${locked==='app'?'זה תרגיל של האפליקציה. אפשר לפתוח אותו ולהשתמש בו, אבל לא לשנות או למחוק.':'התרגיל הזה אושר לכולם. רק המנהל משנה אותו.'}</p>`;
  else b+=`<button type="button" class="mi" onclick="fp229.exGo('rename','${esc(x.id)}')">${ic(IC.edit)}שינוי שם</button>
    <button type="button" class="mi" onclick="fp229.exGo('move','${esc(x.id)}')">${ic(IC.move)}להעביר לקבוצת שריר אחרת</button>
    <button type="button" class="mi d" onclick="fp229.exGo('del','${esc(x.id)}')">${ic(IC.del)}להסיר מהרשימה</button>`;
  document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="fp229Ex" onclick="if(event.target===this)this.remove()"><div class="sheet"><div class="sheet-head"><h3 style="margin:0">${esc(x.name)}</h3><button type="button" class="trash" aria-label="סגור" onclick="document.getElementById('fp229Ex').remove()">✕</button></div>
    <p class="mu" style="margin:-4px 0 12px">${esc(x.group)}</p>${b}</div></div>`)}
fp229.exMenu=exMenu;
const close=()=>{const o=$('fp229Ex');if(o)o.remove()};
fp229.exGo=async(a,id)=>{const x=exById(id);if(!x)return close();
  if(a==='open'){close();try{fp227.ex(x.name)}catch(_){}return}
  if(lockOf(x)){close();toast('את התרגיל הזה אי אפשר לשנות',true);return}
  if(a==='del'){close();try{fp227.exClose()}catch(_){}try{await removeExercise(id)}catch(e){toast(e.message,true)}return}
  if(a==='rename'){const box=$('fp229Ex');if(!box)return;box.querySelector('.sheet').innerHTML=`<div class="sheet-head"><h3 style="margin:0">שינוי שם</h3><button type="button" class="trash" aria-label="סגור" onclick="document.getElementById('fp229Ex').remove()">✕</button></div>
      <div class="field"><label for="fp229N">שם התרגיל</label><input id="fp229N" value="${esc(x.name)}" maxlength="60"></div><button type="button" class="btn full" onclick="fp229.exRename('${esc(id)}')">שמור</button>`;setTimeout(()=>{const i=$('fp229N');if(i){i.focus();i.select()}},50);return}
  if(a==='move'){const box=$('fp229Ex');if(!box)return;const gs=[...new Set(GROUPS.concat(Object.keys((state.data.workout&&state.data.workout.exercises)||{})))].filter(g=>g!=='אירובי');
    box.querySelector('.sheet').innerHTML=`<div class="sheet-head"><h3 style="margin:0">להעביר את ״${esc(x.name)}״</h3><button type="button" class="trash" aria-label="סגור" onclick="document.getElementById('fp229Ex').remove()">✕</button></div>
      <p class="mu" style="margin:0 0 6px">עכשיו ב${esc(x.group)}. לאן להעביר?</p><div class="gr">${gs.map(g=>`<button type="button" class="${g===x.group?'on':''}" ${g===x.group?'disabled':''} onclick="fp229.exMove('${esc(id)}',this.textContent)">${esc(g)}</button>`).join('')}</div>
      <p class="mu" style="margin:0;font-size:12.5px">אימונים קבועים עם התרגיל עוברים איתו. אימונים שכבר עשית נשארים כמו שהיו.</p>`;return}};
fp229.exRename=async id=>{const x=exById(id),n=(($('fp229N')||{}).value||'').trim().replace(/\s+/g,' ');if(!x)return close();if(!n)return toast('כתוב שם',true);if(n===x.name)return close();
  const t=takenOutside(n);if(t){close();dup('ex',t);return}
  try{try{loading()}catch(_){}state.data.workout=await call('updateExercise',{id,name:n});close();try{renderWorkouts(false)}catch(_){}redrawLists();if($('fp227Ex'))try{fp227.ex(n)}catch(_){}toast('השם עודכן')}
  catch(e){if(/^יש כבר תרגיל בשם/.test(e.message||''))close();toast(e.message,true)}finally{try{loading(false)}catch(_){}}};
fp229.exMove=async(id,g)=>{const x=exById(id);g=String(g||'').trim();if(!x||!g)return close();
  try{try{loading()}catch(_){}state.data.workout=await call('moveExerciseGroup',{id,group:g});close();if(state.muscleGroup===x.group)state.muscleGroup=g;try{renderWorkouts(false)}catch(_){}redrawLists();if($('fp227Ex'))try{fp227.ex(x.name)}catch(_){}toast('הועבר ל'+g)}
  catch(e){toast(e.message,true)}finally{try{loading(false)}catch(_){}}};
function redrawLists(){try{const q=$('fpLibQ');if(q&&q.value)q.dispatchEvent(new Event('input',{bubbles:true}))}catch(_){}try{if(typeof renderExerciseManager==='function'&&$('exerciseManager'))renderExerciseManager()}catch(_){}}
/* the long press that already exists (exercise lists, the picker) opens this menu now */
if(typeof openLongPressMenu==='function'){const o=openLongPressMenu;openLongPressMenu=function(el){
  const lp=String((el&&el.dataset&&el.dataset.lp)||'');if(lp.startsWith('exercise:')){exMenu(lp.slice(9));return}return o.apply(this,arguments)}}
/* the search in "האימונים שלי": its exercise rows get the long press too */
function markRows(){document.querySelectorAll('button.ri[onclick^="fp223.exPick"]:not([data-lp])').forEach(b=>{const m=(b.getAttribute('onclick')||'').match(/exPick\('([^']+)'\)/);if(!m)return;b.dataset.lp='exercise:'+m[1];const t=b.querySelector('b');if(t)b.dataset.lpTitle=t.textContent})}
let mT=0;new MutationObserver(()=>{if(mT)return;mT=setTimeout(()=>{mT=0;markRows();pageBtn();mgrLock()},60)}).observe(document.body,{childList:true,subtree:true});
/* inside the exercise page: "עריכת התרגיל" (rename / move / remove), and a long press on its name does the same */
function pageBtn(){const o=$('fp227Ex');if(!o||o.dataset.fp230)return;o.dataset.fp230='1';const name=(o.querySelector('h3')||{}).textContent||'';const x=allEx().find(e=>low(e.name)===low(name));if(!x)return;
  const h=o.querySelector('h3');if(h){h.dataset.lp='exercise:'+x.id;h.dataset.lpTitle=x.name}
  if(lockOf(x))return;const add=[...o.querySelectorAll('button')].find(b=>/הוסף לאימון/.test(b.textContent));if(!add)return;
  add.insertAdjacentHTML('afterend',`<button type="button" class="btn light full" style="margin-top:8px" onclick="fp229.exMenu('${esc(x.id)}')">${ic(IC.edit,16)} עריכת התרגיל: שם, קבוצה, הסרה</button>`)}
/* settings → the exercises list: no "ערוך" / "מחק" on locked ones */
function mgrLock(){const m=$('exerciseManager');if(!m)return;m.querySelectorAll('.manage-row[data-lp^="exercise:"]').forEach(r=>{if(r.dataset.fp230)return;r.dataset.fp230='1';const x=exById(r.dataset.lp.slice(9));const lk=lockOf(x);if(!lk)return;const a=r.querySelector('.inline-actions');if(a)a.innerHTML=`<span class="mu" style="font-size:12px">${lk==='app'?'של האפליקציה':'של כולם'}</span>`})}
/* the old ways in (rename / remove from the list) check the lock too */
['renameExercise','removeExercise'].forEach(fn=>{if(typeof window[fn]!=='function')return;const o=window[fn];window[fn]=function(id){const x=exById(id);if(lockOf(x)){toast('את התרגיל הזה אי אפשר לשנות',true);return}return o.apply(this,arguments)}});
/* a new exercise: the name of an app exercise or an approved one is taken even if it is not in your list */
if(typeof saveNewExercise==='function'){const o=saveNewExercise;saveNewExercise=async function(){const n=(($('newExName')||{}).value||'').trim();const t=takenOutside(n);if(t){dup('ex',t);return}return o.apply(this,arguments)}}
})();
