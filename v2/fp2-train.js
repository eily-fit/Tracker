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
    try{wire();[...$('setRows').children].forEach((c,i)=>{const d=c.querySelector(':scope > details');if(d&&(open[i]||d.querySelector('.subsegment')))d.open=true})}catch(e){console.error(e)}
    return r;
  };
}
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
})();
