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
    const s=d.querySelector('summary');if(s)s.textContent='📝 הערה / תת־סט (שינוי משקל בתוך הסט)';
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
        if(pick){pick.innerHTML='<span>🔄 החלף תרגיל</span><span>▾</span>';const f=document.createElement('div');f.className='field';f.appendChild(pick);g.appendChild(f)}
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
    const P=state.activePlan,before=P?(state.activePlanDone||[]).length:-1,idx=state.activePlanIndex;
    const r=await o.apply(this,arguments);
    try{if(P&&state.activePlan===P&&(state.activePlanDone||[]).length>before&&state.activePlanIndex!==null&&state.activePlanIndex!==idx&&P.category!=='אירובי')startRestTimer()}catch(e){console.warn(e)}
    return r;
  };
}
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
