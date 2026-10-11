/* FitPro 2.17.0 — three kinds of tour to try (Settings → "🎓 סיורים"):
   א. משימות — a list of real things to do; each one is guided, and you do it with your own hands. ✓ when done.
   ב. כשזה רלוונטי — 3 short steps now; the first time you open each screen, it shows what's there.
   ג. מגרש משחקים — the same tasks one after another on demo data; at the end everything is deleted.
   Every tour has "‹ חזרה". */
(function(){
'use strict';
const q=s=>document.querySelector(s);
const vis=el=>{if(!el)return false;const r=el.getBoundingClientRect();return r.width>0&&r.height>0};
const byText=(sel,re)=>[...document.querySelectorAll(sel)].find(e=>re.test(e.textContent||'')&&vis(e));
const LS={get(k){try{return localStorage.getItem(k)}catch(_){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(_){}},del(k){try{localStorage.removeItem(k)}catch(_){}}};
const openSheet=()=>[...document.querySelectorAll('.overlay')].filter(o=>!o.classList.contains('hide')&&o.id!=='fpI'&&vis(o.querySelector('.sheet')||o)).map(o=>o.querySelector('.sheet')||o).pop();
const nEntries=()=>((state.data&&state.data.entries)||[]).length;
const nEvents=()=>((state.data&&state.data.bank&&state.data.bank.events)||[]).length;
const nHist=()=>((state.data&&state.data.workout&&state.data.workout.history)||[]).length;
const B={};

/* ---------- the tasks ---------- */
const TASKS=[
 {id:'meal',ic:'🍽',title:'לרשום ארוחה',sub:'כותבים מה אכלת ושומרים',steps:()=>[
   {kind:'b',view:'today',start:()=>{B.e=nEntries()},t:()=>q('.quick-row .btn'),title:'מוסיפים אוכל',text:'לחץ על ״＋ אוכל״.',tap:true,done:()=>(q('#add')||{}).classList&&q('#add').classList.contains('active')},
   {kind:'b',view:'add',t:()=>q('#foodQuery'),title:'כותבים מה אכלת',text:'למשל ״2 ביצים״ או ״פיתה עם חומוס״. ואז ״מצא״.',tap:true,tapText:'כתוב ולחץ מצא',done:()=>((q('#foodQuery')||{}).value||'').trim().length>=2&&!!q('#foodResults .result, #foodResults [onclick], #dishPreview .dish-row')},
   {kind:'b',view:'add',t:()=>q('#foodResults')&&vis(q('#foodResults'))&&q('#foodResults').children.length?q('#foodResults'):q('#dishPreview'),title:'בוחרים',text:'לחץ על מה שאכלת. לא מצאת? ״חשב בעזרת AI״.',tap:true,done:()=>!!q('#foodChoiceSheet:not(.hide)')||nEntries()>B.e},
   {kind:'b',view:'add',t:()=>nEntries()>B.e?null:q('#foodChoiceSheet:not(.hide) .sheet'),title:'כמה ושומרים',text:'בוחרים כמות ולוחצים ״הוסף״.',tap:true,done:()=>nEntries()>B.e},
   {kind:'end',view:'today',t:()=>q('#calRing'),title:'✓ נרשם',text:'העיגול מראה כמה נשאר לך היום.'}]},
 {id:'event',ic:'🎉',title:'להוסיף אירוע',sub:'חתונה או מסעדה, וחוסכים לה מראש',steps:()=>[
   {kind:'s',view:'today',start:()=>{B.v=nEvents()},t:()=>q('#hdrCal'),title:'✨ אירוע',text:'לחץ על היומן למעלה.',tap:true,done:()=>!!openSheet()},
   {kind:'s',view:'today',t:()=>openSheet(),title:'✨ ממלאים',text:'בוחרים יום וסוג, ואיך לחסוך. אפשר לשנות אחר כך.',tap:true,done:()=>nEvents()>B.v},
   {kind:'end',view:'today',t:null,title:'✓ יש אירוע',text:'מעכשיו האפליקציה חוסכת לו. למחרת תקבל סיכום. אירוע ביומן של הטלפון נקלט לבד.'}]},
 {id:'workout',ic:'🏋',title:'להתחיל אימון ולשמור סט',sub:'מנוחה, צליל, ומה עשית בפעם הקודמת',steps:()=>[
   {kind:'b',view:'workoutHome',start:()=>{B.h=nHist()},t:()=>byText('#startWorkoutCard button',/התחל/),title:'מתחילים',text:'בוחרים סוג ולוחצים ״התחל אימון״.',tap:true,done:()=>!!(state.sessionId||state.activePlan)},
   {kind:'b',view:'workouts',t:()=>q('#setRows'),title:'סט ראשון',text:'כתוב משקל וחזרות. כשממלאים חזרות, המנוחה מתחילה לבד.',tap:true,done:()=>[...document.querySelectorAll('#setRows .set-reps')].some(i=>Number(i.value)>0)},
   {kind:'b',view:'workouts',t:()=>vis(q('#restBar'))?q('#restBar'):null,title:'המנוחה רצה',text:'לחץ על השעון: ״⏹ עצור״ או ״+30 שנ׳״. בסוף יש צליל, קול או הקלטה שלך (בהגדרות).',tap:true},
   {kind:'b',view:'workouts',t:()=>q('#saveWorkoutBtn'),title:'שומרים',text:'לחץ שמור. התרגיל נכנס ליומן האימונים.',tap:true,done:()=>nHist()>B.h},
   {kind:'end',view:'workouts',t:()=>q('#lastPerformance'),title:'✓ נשמר',text:'בפעם הבאה בתרגיל הזה תראה מה עשית עכשיו, כולל תת־סטים.'}]},
 {id:'sound',ic:'🔔',title:'לבחור צליל סוף מנוחה',sub:'צפצוף, קול, משפט שלך או הקלטה',steps:()=>[
   {kind:'s',view:'settings',before:()=>{const d=q('#fpRestSet');if(d){d.open=true}},t:()=>q('#fpRestSet'),title:'✨ צליל סוף מנוחה',text:'בחר צליל ולחץ ▶ לשמוע. ״✏️ משפט שלי״: הטלפון יקריא מה שתכתוב.',tap:true},
   {kind:'end',view:'settings',t:null,title:'✓ מוכן',text:'בסוף כל מנוחה תשמע את מה שבחרת.'}]},
 {id:'goal',ic:'🎯',title:'להחליט איך היעד זז',sub:'לפי אתמול, וכמה לחסוך לאירוע',steps:()=>[
   {kind:'s',view:'settings',before:()=>{const d=q('#fpGoalSet');if(d)d.open=true},t:()=>q('#fpGoalSet'),title:'✨ היעד מתאזן לבד',text:'אכלת פחות אתמול? היום מקבל את ההפרש. עברת? היום יורד. כתוב כמה מומלץ ולמה. אפשר גם לכבות.',tap:true},
   {kind:'end',view:'settings',t:null,title:'✓ זהו',text:'בכל בוקר תראה מתחת לעיגול למה היעד של היום שונה.'}]},
 {id:'request',ic:'💬',title:'לבקש משהו מהאפליקציה',sub:'בהקלטה או בטקסט',steps:()=>[
   {kind:'s',view:'today',before:()=>{try{openPlusMenu()}catch(_){}},t:()=>byText('#plusList button, #plusList .plus-item, #plusList [onclick]',/בקשה|רעיון/)||q('#plusList'),title:'✨ חסר לך משהו?',text:'לחץ ״בקשה״. כותבים או מקליטים, ומקבלים הודעה כשזה מוכן.',tap:true,done:()=>!!q('#fpReq')},
   {kind:'end',view:'today',t:null,title:'✓ ככה שולחים',text:'כל בקשה מגיעה ישר אליי.'}]},
 {id:'progress',ic:'📈',title:'לרשום משקל',sub:'פעם בשבוע, עם תמונות והשוואה',steps:()=>[
   {kind:'b',view:'process',t:()=>q('#fpWeekCard')||q('#photoCard'),title:'ההתקדמות',text:'פעם בשבוע: משקל, היקף טבור ותמונות. רואים את השינוי לאורך זמן.',tap:true},
   {kind:'end',view:'process',t:null,title:'✓ זהו',text:'האפליקציה תזכיר לך פעם בשבוע.'}]}
];
const done=()=>{try{return JSON.parse(LS.get('fp2.tasksDone')||'{}')||{}}catch(_){return {}}};
function markDone(id){const d=done();d[id]=1;LS.set('fp2.tasksDone',JSON.stringify(d))}
function sheet(id,title,body){let s=document.getElementById(id);if(s)s.remove();document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="${id}"><div class="sheet" style="max-height:90vh;overflow:auto"><div class="sheet-head"><h3 style="margin:0">${title}</h3><button type="button" class="trash" aria-label="סגור" onclick="document.getElementById('${id}').remove()">✕</button></div>${body}</div></div>`)}
const css=`<style>.fp-task{display:flex;gap:12px;align-items:center;width:100%;text-align:right;background:var(--card,#171C22);border:1px solid var(--line,#2A333C);border-radius:14px;padding:12px;margin-top:8px;color:inherit;font:inherit}
.fp-task .ic{font-size:22px;width:30px;text-align:center;flex:none}.fp-task span.s{display:block;color:var(--muted,#93A09A);font-size:13px}.fp-task.ok{border-color:#7FD67F}.fp-task .ck{margin-inline-start:auto;font-weight:800;color:#7FD67F}
.fp-tbar{height:6px;border-radius:6px;background:var(--line,#2A333C);overflow:hidden;margin:4px 0 6px}.fp-tbar i{display:block;height:100%;background:var(--brand,#D7F36B)}</style>`;
document.head.insertAdjacentHTML('beforeend',css);

window.fpTasks=function(){const d=done(),n=TASKS.filter(t=>d[t.id]).length;
  sheet('fpTasks','✅ המשימות שלך',`<p class="muted" style="margin:0">כל משימה מודרכת, ואתה עושה אותה בעצמך. ${n} מתוך ${TASKS.length}.</p><div class="fp-tbar"><i style="width:${Math.round(n/TASKS.length*100)}%"></i></div>
    ${TASKS.map(t=>`<button type="button" class="fp-task${d[t.id]?' ok':''}" onclick="fpTaskRun('${t.id}')"><span class="ic">${t.ic}</span><span><b>${t.title}</b><span class="s">${t.sub}</span></span>${d[t.id]?'<span class="ck">✓</span>':''}</button>`).join('')}`)};
window.fpTaskRun=function(id,then){const t=TASKS.find(x=>x.id===id);if(!t)return;const s=$('fpTasks');if(s)s.remove();
  const steps=t.steps();fpIntro(0,steps,{endLabel:then?'הבא ›':'חזרה למשימות',onFinish:()=>{markDone(id);if(then)then();else setTimeout(fpTasks,300)}})};

/* ---------- ב. when it's relevant ---------- */
const CTX_VIEWS=['add','workoutHome','workouts','workoutDiary','meals','process','settings'];
function ctxSteps(view){const all=window.fpIntroAll||[];return all.filter(s=>s.view===view&&s.kind!=='end').map(s=>Object.assign({},s))}
window.fpTourCtx=function(){LS.set('fp2.tourMode','ctx');LS.set('fp2.ctxSeen','{}');
  const all=window.fpIntroAll||[];const first=[all[0],all[1]].filter(Boolean).map(s=>Object.assign({},s,{tap:false}));
  first.push({kind:'end',view:'today',t:()=>q('nav')||q('.bottom-nav')||q('.tabbar'),title:'זהו בינתיים',text:'בפעם הראשונה שתיכנס לכל מסך, אראה לך מה יש בו. ככה לומדים כשזה רלוונטי.'});
  fpIntro(0,first,{endLabel:'יאללה',onFinish:()=>{showView('today')}})};
if(typeof showView==='function'){const o=showView;showView=function(id){const r=o.apply(this,arguments);
  try{if(LS.get('fp2.tourMode')==='ctx'&&CTX_VIEWS.indexOf(id)>=0&&!document.getElementById('fpI')){let seen={};try{seen=JSON.parse(LS.get('fp2.ctxSeen')||'{}')||{}}catch(_){}
    if(!seen[id]){const st=ctxSteps(id);if(st.length){seen[id]=1;LS.set('fp2.ctxSeen',JSON.stringify(seen));if(Object.keys(seen).length>=CTX_VIEWS.length)LS.del('fp2.tourMode');
      st.push({kind:'end',view:id,t:null,title:'✓',text:'זה מה שיש במסך הזה.'});setTimeout(()=>{if(!document.getElementById('fpI'))fpIntro(0,st,{endLabel:'הבנתי',onFinish:()=>{try{showView(id)}catch(_){}}})},500)}}}}catch(e){console.error(e)}
  return r}}

/* ---------- ג. playground: the tasks one after another on demo data, then everything is deleted ---------- */
window.fpTourPlay=async function(){
  if(state.data&&state.data.settings&&state.data.settings.debug_since)return toast('כבר יש מצב בדיקה פעיל. כבה אותו קודם',true);
  if(!confirm('מגרש משחקים: כל מה שתעשה עכשיו יימחק בסוף. להתחיל?'))return;
  try{loading()}catch(_){}
  try{await call('debugStart',{});LS.set('fp2.playground','1');state.data=await call('getBootstrapData');state.date=state.data.date;state.todayDate=state.data.date;renderAll()}catch(e){toast(e.message,true);return}finally{try{loading(false)}catch(_){}}
  const order=['meal','event','workout','sound','goal'];let i=0;
  const next=()=>{if(i>=order.length)return endPlay();const id=order[i++];fpTaskRun(id,next)};
  fpIntro(0,[{kind:'s',view:'today',t:null,title:'🎮 מגרש משחקים',text:'עכשיו הכל אמיתי, אבל על נתוני ניסיון. תרשום ארוחה, תוסיף אירוע, תתחיל אימון. בסוף הכל נמחק.'}],{endLabel:'יאללה',onFinish:next});
};
async function endPlay(){
  try{loading()}catch(_){}
  try{await call('debugEnd',{});['fp2.streakEnd','fp2.evSum','fp2.holAsked','fp2.cutAsked','fp2.weekOver','fp2.leftovers'].forEach(k=>LS.del(k));LS.del('fp2.playground');
    state.sessionId='';try{finishWorkoutPlan()}catch(_){}try{stopRestTimer()}catch(_){}try{localStorage.removeItem('elaiWorkoutSession')}catch(_){}
    state.data=await call('getBootstrapData');state.date=state.data.date;state.todayDate=state.data.date;renderAll();showView('today');toast('🎮 סיימת. כל הניסיון נמחק')}
  catch(e){toast(e.message,true)}finally{try{loading(false)}catch(_){}}
}
/* if the app was closed in the middle of the playground, clean up when it opens */
const boot=setInterval(()=>{if(typeof state==='undefined'||!state.data||!state.data.settings||typeof call!=='function')return;clearInterval(boot);
  if(LS.get('fp2.playground')==='1'&&!document.getElementById('fpI')){endPlay()}},1500);

/* ---------- the chooser (Settings → 🎓) ---------- */
window.fpTourChooser=function(){
  const opt=(fn,ic,t,s)=>`<button type="button" class="fp-task" onclick="document.getElementById('fpTourPick').remove();${fn}"><span class="ic">${ic}</span><span><b>${t}</b><span class="s">${s}</span></span></button>`;
  sheet('fpTourPick','🎓 איזה סיור לנסות?',`<p class="muted" style="margin:0 0 4px">שלוש דרכים. תנסה ותבחר.</p>
    ${opt('fpTasks()','✅','א. משימות','רשימה של דברים לעשות בעצמך: לרשום ארוחה, להוסיף אירוע, לשמור סט. כל אחד מודרך, ומקבלים ✓.')}
    ${opt('fpTourCtx()','📍','ב. כשזה רלוונטי','שני צעדים עכשיו. בפעם הראשונה שנכנסים לכל מסך, הוא מראה מה יש בו.')}
    ${opt('fpTourPlay()','🎮','ג. מגרש משחקים','המשימות אחת אחרי השנייה על נתוני ניסיון. בסוף הכל נמחק.')}
    ${opt("showView('today');fpIntro()",'🎬','הסיור הקודם','29 שלבים על כל האפליקציה.')}`)};
setInterval(()=>{const b=document.getElementById('tourRerun');if(b&&!b.dataset.fp217){b.dataset.fp217='1';b.textContent='🎓 סיורים: לבחור ולנסות';b.onclick=()=>fpTourChooser()}},1000);
})();
