/* FitPro 2.13.0 — workout fixes:
   - "הערה / תת־סט": one tap opens the note AND a sub-set row (weight change inside the set), and it stays open.
   - "לאימון הקודם" from the middle of a workout: the back button returns to the set, not to the workouts home. */
(function(){
'use strict';
/* ---------- note + sub-set together ---------- */
function wire(){
  const root=$('setRows');if(!root)return;
  root.querySelectorAll(':scope > .card > details').forEach(d=>{
    if(d.dataset.fp)return;d.dataset.fp='1';
    const s=d.querySelector('summary');if(s)s.textContent='הערה / תת־סט (שינוי משקל בתוך הסט)';
    const btn=d.querySelector('button[onclick^="addSegment"]');if(btn){btn.type='button';btn.textContent='＋ עוד תת־סט'}
    d.addEventListener('toggle',()=>{if(d.open&&!d.querySelector('.subsegment')){const box=d.querySelector('.subsegments');if(box)box.insertAdjacentHTML('beforeend',renderSubsegment())}});
  });
}
if(typeof renderSetRows==='function'){
  const o=renderSetRows;
  renderSetRows=function(){
    /* keep open the notes that were open */
    let open=[];try{open=[...$('setRows').children].map(c=>{const d=c.querySelector(':scope > details');return !!(d&&d.open)})}catch(_){}
    const r=o.apply(this,arguments);
    try{wire();const collapse=state.fpCollapseNotes;state.fpCollapseNotes=false;
      [...$('setRows').children].forEach((c,i)=>{const d=c.querySelector(':scope > details');if(!d)return;
        const filled=[...d.querySelectorAll('.subsegment')].some(r=>(r.querySelector('.sub-weight')||{}).value||(r.querySelector('.sub-reps')||{}).value||(r.querySelector('.sub-note')||{}).value)||((d.querySelector('.set-note')||{}).value||'').trim();
        /* 2.14.1: adding a set closes the notes that are still empty */
        if(filled||(open[i]&&!collapse))d.open=true;else{d.open=false;d.querySelectorAll('.subsegment').forEach(r=>{if(!((r.querySelector('.sub-weight')||{}).value||(r.querySelector('.sub-reps')||{}).value||(r.querySelector('.sub-note')||{}).value))r.remove()})}})}catch(e){console.error(e)}
    return r;
  };
}
if(typeof addSetRow==='function'){const o=addSetRow;addSetRow=function(){state.fpCollapseNotes=true;return o.apply(this,arguments)}}
/* an empty sub-set row is not saved (saveWorkout keeps only rows with reps), so opening the note never adds junk */

/* ---------- back from "the previous workout" straight to the set ---------- */
let backToSet=false;
if(typeof goToPreviousWorkout==='function'){
  const o=goToPreviousWorkout;
  goToPreviousWorkout=function(){
    const from=!!($('workouts')&&$('workouts').classList.contains('active'));
    let y=0;try{y=window.scrollY}catch(_){}
    backToSet=from;const r=o.apply(this,arguments);
    if(from)fixBack(y);
    return r;
  };
}
function fixBack(y){
  const b=document.querySelector('#workoutDiary .sub-back');if(!b)return;
  b.textContent='‹ חזרה לסט';
  b.onclick=e=>{e.preventDefault();backToSet=false;showView('workouts');setTimeout(()=>{try{window.scrollTo(0,y||0);if(!y){const s=$('setRows');if(s)s.scrollIntoView({block:'center'})}}catch(_){}},60)};
}
if(typeof showView==='function'){const o=showView;showView=function(id){const r=o.apply(this,arguments);try{if(id==='workoutDiary'&&backToSet)fixBack(0);else if(id!=='workoutDiary')backToSet=false}catch(_){}return r}}
setInterval(wire,1500);

/* ---------- 2.14.0: looks and the workout builder ---------- */
document.head.insertAdjacentHTML('beforeend',`<style>
.subsegment select,.subsegment input{border:1px solid var(--line,#2A333C)!important;border-radius:10px;padding:8px;background:var(--bg2,#11161b);color:inherit;min-width:0}
@media (max-width:360px){.set-row input{padding:8px 4px!important;font-size:14px!important}.set-row{gap:5px!important}}
#workoutPlanItems .plan-row.fp-pr{padding:12px}
.fp-pr-head{display:flex;align-items:center;gap:10px}
.fp-ord{flex:none;width:34px;height:34px;border-radius:10px;background:var(--brand,#D7F36B);color:#14190a;font-weight:800;display:grid;place-items:center;font-size:16px}
.fp-pr-name{flex:1;min-width:0;font-weight:700;font-size:16px;line-height:1.35}
.fp-pr-name .exAnim{width:auto!important;height:auto!important;padding:4px 10px;border-radius:99px;font-size:13px;margin-top:6px;display:inline-flex}
.fp-pr-name .exAnim::after{content:' סרטון והסבר';margin-inline-start:4px}
.fp-pr-head .inline-actions{flex:none;display:flex;gap:6px}
.fp-pr-grid{display:grid;grid-template-columns:1fr;gap:8px;margin-top:10px}
.fp-pr-grid .pick-btn{width:100%;justify-content:space-between}
.fp-pr .fp-newex{background:none;border:0;color:var(--muted,#93A09A);font:inherit;font-size:13px;padding:6px 0;text-decoration:underline}
.fp-pr-hint{font-size:12.5px;color:var(--muted,#93A09A);margin:0 0 8px}
</style>`);
function exName(x){try{const c=state.data.workout.exercises||{};return ((c[x.group]||[]).find(e=>e.id===x.exerciseId)||{}).name||'בחר תרגיל'}catch(_){return 'בחר תרגיל'}}
if(typeof renderWorkoutPlanItems==='function'){
  const o=renderWorkoutPlanItems;
  renderWorkoutPlanItems=function(){
    const r=o.apply(this,arguments);
    try{const box=$('workoutPlanItems');if(!box)return r;const rows=[...box.querySelectorAll(':scope > .plan-row')],n=rows.length;if(!n)return r;
      const built=rows.map((row,i)=>{const x=state.planItems[i]||{};
        const grp=row.querySelector('.plan-builder-selects .field'),pick=row.querySelector('.pick-btn'),nums=row.querySelector('.plan-numbers'),mk=row.querySelector('button[onclick^="addPlanExercise"]');
        const el=document.createElement('div');el.className='plan-row fp-pr';
        el.innerHTML=`<div class="fp-pr-head"><span class="fp-ord" title="מקום באימון">${i+1}</span><div class="fp-pr-name"><span>${esc(exName(x))}</span></div><span class="inline-actions"><button type="button" class="btn light mini" aria-label="למעלה" onclick="moveWorkoutPlanItem(${i},1)">↑</button><button type="button" class="btn light mini" aria-label="למטה" onclick="moveWorkoutPlanItem(${i},-1)">↓</button><button type="button" class="trash mini" aria-label="הסר" onclick="removeWorkoutPlanItem(${i})">✕</button></span></div><div class="fp-pr-grid"></div>`;
        const g=el.querySelector('.fp-pr-grid');if(grp)g.appendChild(grp);
        if(pick){pick.innerHTML='<span>החלף תרגיל</span><span>▾</span>';const f=document.createElement('div');f.className='field';f.appendChild(pick);g.appendChild(f)}
        if(nums)el.appendChild(nums);
        if(mk){mk.className='fp-newex';mk.textContent='＋ התרגיל לא ברשימה? צור תרגיל חדש';el.appendChild(mk)}
        return el});
      box.innerHTML=`<p class="fp-pr-hint">התרגיל האחרון שהוספת למעלה. המספר בצד הוא הסדר באימון.</p>`;
      built.slice().reverse().forEach(el=>box.appendChild(el));
    }catch(e){console.error(e)}
    return r;
  };
}

/* ---------- 2.14.1: after "שמור ועבור לתרגיל הבא" the rest timer starts by itself ---------- */
if(typeof saveWorkout==='function'){
  const o=saveWorkout;
  saveWorkout=async function(){
    const P=state.activePlan,idx=state.activePlanIndex,editing=!!state.editingWorkoutId,cardio=state.muscleGroup==='אירובי'||(P&&P.category==='אירובי');
    const H=()=>((state.data.workout&&state.data.workout.history)||[]).length,h0=H(),w0=state.data.workout;
    const r=await o.apply(this,arguments);try{state.fpRested=null}catch(_){}
    /* 2.16: the rest starts after every saved exercise — not after editing, cardio, or the last exercise of a saved workout */
    try{const saved=state.data.workout!==w0&&H()>=h0;const planOver=P&&state.activePlan===P&&state.activePlanIndex===null&&idx!==null;
      if(saved&&!editing&&!cardio&&!planOver&&!restingNow())startRestTimer()}catch(e){console.warn(e)}
    return r;
  };
}
/* ---------- 2.16: the list on top follows the saves (it looked for the date of the day, and missed when the workout's date was different) ---------- */
if(typeof reconcileWorkoutPlan==='function'){reconcileWorkoutPlan=function(){if(!state.activePlan)return;const P=state.activePlan;
  state.activePlanDone=[...new Set(((state.data.workout&&state.data.workout.history)||[]).filter(x=>x.sessionId===P.sessionId&&Number.isInteger(x.planItemIndex)&&x.planItemIndex>=0&&x.planItemIndex<P.items.length).map(x=>x.planItemIndex))]}}

/* ---------- 2.16: a workout in the diary: "＋ הוסף תרגיל לאימון" ---------- */
function addExBtns(){document.querySelectorAll('details.session-card[data-session] > .session-body').forEach(b=>{if(b.querySelector('.fp-addex'))return;const id=b.parentElement.dataset.session;
  b.insertAdjacentHTML('beforeend',`<button type="button" class="btn secondary full fp-addex" style="margin-top:10px" onclick="fpAddExToSession('${esc(id)}')">＋ הוסף תרגיל לאימון</button>`)})}
window.fpAddExToSession=async function(id){const s=((state.data.workout&&state.data.workout.sessions)||[]).find(x=>x.id===id);if(!s)return;
  if(state.activePlan&&state.activePlan.sessionId!==id)return toast('יש אימון פעיל אחר. סיים אותו קודם',true);
  if(state.activePlan&&state.activePlan.sessionId===id){showView('workouts');return}
  if(s.status==='finished')return reopenSession(id);
  state.sessionId=id;$('sessionName').value=s.name;try{localStorage.setItem('elaiWorkoutSession',JSON.stringify({id,name:s.name,date:state.date}))}catch(_){}
  renderWorkouts(false);try{renderSessionBanner()}catch(_){}showView('workouts');toast('אפשר להוסיף תרגיל לאימון')};
if(typeof renderWorkoutHistory==='function'){const o=renderWorkoutHistory;renderWorkoutHistory=function(){const r=o.apply(this,arguments);try{addExBtns()}catch(e){console.error(e)}return r}}

/* ---------- 2.16: "לאימון הקודם" opens only that workout, with a button back to the set ---------- */
if(typeof goToPreviousWorkout==='function'){const o2=goToPreviousWorkout;goToPreviousWorkout=function(sessionId,workoutId){
  try{if(!($('workouts')&&$('workouts').classList.contains('active')))return o2.apply(this,arguments);
    const ss=(state.data.workout&&state.data.workout.sessions)||[],s=ss.find(x=>x.id===sessionId)||ss.find(x=>(x.items||[]).some(i=>i.id===workoutId));if(!s)return o2.apply(this,arguments);
    const cur=($('exerciseSelect')&&$('exerciseSelect').selectedOptions[0]||{}).text||'';
    const sets=x=>(x.sets||[]).map((v,i)=>`<span class="set-badge"><strong>סט ${Number(v.set)||i+1}</strong> · ${v.side?esc(v.side)+' · ':''}${v.weight===null||v.weight===''?'ללא משקל':fmt(v.weight)+' ק״ג'} × ${v.reps}${(v.segments||[]).map(g=>` ← ${g.weight?fmt(g.weight)+' ק״ג':''} × ${g.reps}`).join('')}${v.note?' · '+esc(v.note):''}</span>`).join('');
    let el=$('fpPrevW');if(el)el.remove();
    document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="fpPrevW"><div class="sheet" style="max-height:88vh;overflow:auto"><div class="sheet-head"><h3 style="margin:0">${esc(displayDate(s.date))} · ${esc(s.name)}</h3><button type="button" class="trash" aria-label="סגור" onclick="document.getElementById('fpPrevW').remove()">✕</button></div>
      ${(s.items||[]).map(x=>`<div class="workout-item" style="${x.exercise===cur?'border:1px solid var(--brand,#D7F36B);border-radius:12px;padding:8px':''}"><b>${esc(x.exercise)}</b>${x.notes?`<div class="muted">${esc(x.notes)}</div>`:''}<div class="set-badges">${sets(x)}</div></div>`).join('')}
      <button type="button" class="btn full" style="margin-top:12px;position:sticky;bottom:0" onclick="document.getElementById('fpPrevW').remove()">‹ חזרה לסט</button></div></div>`);
    setTimeout(()=>{try{const h=[...document.querySelectorAll('#fpPrevW .workout-item')].find(d=>d.style.border);if(h)h.scrollIntoView({block:'center'})}catch(_){}},50);
  }catch(e){console.error(e);return o2.apply(this,arguments)}}}


/* ---------- 2.17: the rest starts when a set is filled (reps written), a set is added, or an exercise is saved. Tap the timer: stop or +30 ---------- */
/* 2.22: the rest starts the moment you start writing a set's results (the first key in its weight or reps), once per set */
const restingNow=()=>state.restEnd&&state.restEnd>Date.now();
/* 2.32: three cases where the rest did not start —
   (1) weight written BEFORE lifting used up the set, and the reps written after lifting did nothing;
   (2) "＋ הוסף סט" counted the last row on the screen, not the set just done (a plan opens 3 rows at once), so set 3 had no rest;
   (3) rows already full (reps from the plan) and nothing typed. Now:
   - reps written in a set start the rest (once per set);
   - weight starts it only when that set already has reps (then reps can still restart it once);
   - "＋ הוסף סט" starts the rest unless one is already running. */
const restSetup=ex=>{if(!state.fpRested||state.fpRestedEx!==ex){state.fpRested=new Set();state.fpRestedEx=ex}};
const restOnSet=e=>{try{const t=e.target;if(!t||!t.classList)return;const isR=t.classList.contains('set-reps'),isW=t.classList.contains('set-weight');if(!isR&&!isW)return;if(!String(t.value).trim())return;
  if(state.editingWorkoutId||state.muscleGroup==='אירובי')return;const card=t.closest('#setRows > .card');if(!card)return;
  if(isW){const r=card.querySelector('.set-reps');if(!r||!String(r.value).trim())return}
  const ex=(document.getElementById('exerciseSelect')||{}).value||'',key=ex+'|'+[...card.parentElement.children].indexOf(card)+'|'+(isR?'r':'w');
  restSetup(ex);if(state.fpRested.has(key))return;state.fpRested.add(key);startRestTimer()}catch(_){}};
document.addEventListener('input',restOnSet,true);document.addEventListener('change',restOnSet,true);
function restOnAdd(){try{if(state.editingWorkoutId||state.muscleGroup==='אירובי')return;if(!document.getElementById('setRows'))return;if(restingNow())return;startRestTimer()}catch(_){}}
['addSetRow','addSetRowSameWeight'].forEach(fn=>{if(typeof window[fn]==='function'){const o=window[fn];window[fn]=function(){restOnAdd();return o.apply(this,arguments)}}});
window.fpRestingNow=restingNow;
function restLabels(){const c=$('restCtl');if(!c||c.dataset.fp)return;c.dataset.fp='1';const b=c.querySelectorAll('button');if(b[0])b[0].textContent='+30 שנ׳';if(b[1])b[1].textContent='עצור';
  const t=$('restText');if(t&&!t.title)t.title='לחץ: לעצור או להוסיף חצי דקה'}
restLabels();setInterval(restLabels,3000);

/* ---------- 2.17: inside a running workout: "＋ הוסף תרגיל לאימון" (continue the workout) ---------- */
function addExInRun(){const card=$('activeWorkoutPlan');if(!card||!state.activePlan||card.style.display==='none'||card.querySelector('.fp-addrun'))return;
  card.insertAdjacentHTML('beforeend','<button type="button" class="btn secondary full fp-addrun" style="margin-top:8px" onclick="fpAddExRun()">＋ הוסף תרגיל לאימון</button>')}
window.fpAddExRun=function(){if(!state.activePlan)return;const cat=(state.data.workout&&state.data.workout.exercises)||{};
  state.pickMode={group:state.muscleGroup,current:'',all:state.equipment==='משולב',equipment:state.equipment,onPick:id=>{
    let g=state.muscleGroup,x=null;Object.keys(cat).some(k=>{const f=(cat[k]||[]).find(e=>e.id===id);if(f){g=k;x=f;return true}return false});if(!x)return;
    const P=state.activePlan;P.items=P.items.concat([{group:g,exerciseId:id,name:x.name,sets:3,reps:''}]);
    try{renderWorkouts(false)}catch(_){}selectPlanExercise(P.items.length-1);try{renderWorkoutPlans()}catch(_){}toast('נוסף לאימון: '+x.name)},reopen:()=>fpAddExRun()};
  try{renderExercisePicker()}catch(e){toast(e.message,true)}};
if(typeof renderWorkoutPlans==='function'){const o=renderWorkoutPlans;renderWorkoutPlans=function(){const r=o.apply(this,arguments);try{addExInRun()}catch(e){console.error(e)}return r}}

/* ---------- a saved workout: "שמור ועבור לתרגיל הבא" ---------- */
function saveLabel(){
  const b=$('saveWorkoutBtn');if(!b)return;
  if(state.editingWorkoutId){return}
  const P=state.activePlan;let t='שמור תרגיל';
  if(P&&state.activePlanIndex!==null&&state.activePlanIndex!==undefined&&P.category!=='אירובי'){
    const left=P.items.map((_,i)=>i).filter(i=>i!==state.activePlanIndex&&!(state.activePlanDone||[]).includes(i));
    t=left.length?'שמור ועבור לתרגיל הבא ←':'שמור וסיים את האימון ✓';
  }
  if(b.textContent!==t)b.textContent=t;
}
setInterval(saveLabel,700);
})();
