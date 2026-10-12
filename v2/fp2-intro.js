/* FitPro 2.14.0 — the intro for a new user: learn by doing, on the real screens.
   The screen dims, one thing glows. Green glow = what every app has. Purple glow = only here.
   Tap what glows (it really works) or press "הבא". Shown once after the questionnaire; again from Settings. */
(function(){
'use strict';
const q=s=>document.querySelector(s);
const vis=el=>{if(!el)return false;const r=el.getBoundingClientRect();return r.width>0&&r.height>0};
const byText=(sel,re)=>[...document.querySelectorAll(sel)].find(e=>re.test(e.textContent||'')&&vis(e));
const closeAll=()=>{['fpUnplanned','fpEvSum','fpStreak','fpHoliday','fpShab','fpShabFill','fpAddMoreSheet','fpWeekOver'].forEach(i=>{const e=document.getElementById(i);if(e)e.remove()});try{closePlusMenu()}catch(_){}};
const ctx=()=>{try{return bankCtx()}catch(_){return {}}};
/* steps. kind: 'b' basic (green) | 's' special (purple). tap: the user may tap the target (it really works). */
const STEPS=[
  {kind:'b',view:'today',t:()=>q('#calRing'),title:'כמה נשאר לך היום',text:'העיגול מראה כמה נשאר לאכול היום. מתחת: חלבון, פחמימות ושומן.'},
  {kind:'b',view:'today',t:()=>q('.quick-row .btn'),title:'מוסיפים אוכל',text:'זה הכפתור שתשתמש בו הכי הרבה.',tap:true,tapText:'לחץ עליו'},
  {kind:'b',view:'add',t:()=>q('#foodQuery'),title:'כותבים מה אכלת',text:'כמו בוואטסאפ: ״2 ביצים וקוטג׳״. כמה דברים ביחד נשמרים כארוחה אחת.'},
  {kind:'b',view:'add',t:()=>q('#fpAddMoreBtn'),title:'עוד דרכים',text:'צילום של הצלחת, ברקוד, תמונה של מתכון, או קישור למתכון.',tap:true,tapText:'לחץ ותראה'},
  {kind:'b',view:'add',before:()=>{if(!q('#fpAddMoreSheet'))try{fpAddMore()}catch(_){}},t:()=>q('#fpAddMoreSheet .sheet'),title:'הכל פה',text:'כל אחת מהדרכים נותנת ערכים שאפשר לתקן לפני ששומרים.',after:closeAll},
  {kind:'s',view:'today',t:null,title:'ככה נראה משהו שיש רק אצלנו',text:'כשמשהו זוהר בסגול, זה משהו שלא תמצא באפליקציות אחרות. בוא נראה מה.'},
  {kind:'b',view:'today',t:null,mock:'<div class="fpI-mock"><b>חזה עוף בגריל</b> · 150 ג׳ · 248 קל׳<div class="fpI-oil">כולל 5 ג׳ שמן · <u>לשנות</u></div></div>',title:'השמן כבר בפנים',text:'מאכל מבושל כבר כולל את השמן בקלוריות. בישלת עם יותר או בלי? לוחצים על השורה ומשנים.'},
  {kind:'s',view:'today',t:()=>q('#hdrCal'),title:'אירוע? חוסכים מראש',text:'יש חתונה או מסעדה? שמים ביומן של הטלפון, והאפליקציה קולטת את זה ושואלת איך להתכונן.'},
  {kind:'s',view:'today',before:()=>{try{fpUnplannedPreview()}catch(_){}},t:()=>q('#fpUnplanned .sheet'),title:'אתה מחליט כמה לחסוך',text:'בוחרים כמה פחות ביום ואיך. מה שנחסך מחכה לך באירוע. אפשר לשנות גם בהגדרות.',after:closeAll},
  {kind:'s',view:'today',t:null,mock:'<div class="fpI-mock"><b>היום: חתונה</b> · שמורים לך <b>+960</b> קל׳<div style="margin-top:8px"><span class="fpI-btn">התחלתי את האירוע</span></div></div>',title:'ביום האירוע',text:'מגיעים לאירוע? לוחצים ״התחלתי את האירוע״, ומה ששמרת נכנס לעיגול.'},
  {kind:'s',view:'today',before:()=>{try{fpEvSumPreview(false)}catch(_){}},t:()=>q('#fpEvSum .sheet'),title:'למחרת: סיכום',text:'כמה שמרת, כמה אכלת, ועמדת או לא. בלי לייפות.',after:closeAll},
  {kind:'s',view:'today',t:()=>q('#calRing'),title:'היעד מתאזן לבד',text:()=>{const c=ctx();return `לא סיימת אתמול? ההפרש עובר להיום. עברת? היום קצת פחות. בחרת ${c.goalName||'מטרה'}, אז עד ${c.shiftPct!=null?c.shiftPct:15}% ביום. לא רוצה? משנים או מכבים בהגדרות.`}},
  {kind:'s',view:'today',before:()=>{try{fpStreakPreview('under')}catch(_){}},t:()=>q('#fpStreak .sheet'),title:'3 ימים ברצף? שואלים מה קרה',text:'אם 3 ימים אתה רחוק מהיעד באותו כיוון, האפליקציה לא ממשיכה להעביר, ושואלת מה קרה.',after:closeAll},
  {kind:'s',view:'today',before:()=>{try{fpHolidayPreview()}catch(_){}},t:()=>q('#fpHoliday .sheet'),title:'חגים',text:'שבוע לפני חג: ״לשמור לך?״. מכל הלוחות שבחרת.',after:closeAll},
  {kind:'s',view:'today',before:()=>{try{fpShabPreview()}catch(_){}},t:()=>q('#fpShab .sheet'),title:'שבת',text:'אחרי כמה שבתות האפליקציה יודעת כמה אתה אוכל, ויכולה לחסוך לזה ולמלא לבד.',after:closeAll},
  {kind:'s',view:'today',before:()=>{try{openPlusMenu()}catch(_){}},t:()=>byText('#plusList button, #plusList .plus-item, #plusList [onclick]',/בקשה|רעיון/)||q('#plusList'),title:'חסר לך משהו? תגיד',text:'בכפתור הפלוס: ״בקשה או רעיון״. מקליטים או כותבים. כשהבקשה מאושרת, מקבלים התראה.',after:closeAll},
  {kind:'b',view:'workoutHome',t:()=>q('#startWorkoutCard'),title:'מתחילים אימון',text:'בוחרים סוג, מקום וציוד, או אימון מוכן מהספרייה, ולוחצים ״התחל״.'},
  {kind:'b',view:'workoutHome',t:()=>byText('#workoutHome > button',/צור אימון חדש/),title:'אימון משלך',text:'בונים פעם אחת את התרגילים לפי הסדר. בפעם הבאה מתחילים בלחיצה, ו״שמור ועבור לתרגיל הבא״ מעביר אותך הלאה.'},
  {kind:'b',view:'workoutHome',t:null,mock:'<div class="fpI-mock" style="border-color:rgba(215,243,107,.45)"><b>לחיצת חזה</b><div style="margin-top:6px">סט 1 · <b>20</b> ק״ג × <b>8</b></div><div class="muted" style="font-size:13px;margin-top:4px">הערה / תת־סט (שינוי משקל בתוך הסט)</div></div>',title:'רושמים סטים',text:'משקל וחזרות לכל סט. ירדת במשקל באמצע הסט? ״תת־סט״. ואפשר הערה.'},
  {kind:'s',view:'workoutHome',t:null,mock:'<div class="fpI-mock"><b>בפעם הקודמת · יום ג׳</b><div style="margin-top:4px">סט 1: 14 ק״ג × 7 ← 10 ק״ג × 4</div><div style="margin-top:8px"><span class="fpI-btn">לאימון הקודם ←</span></div></div>',title:'מה עשית בפעם הקודמת',text:'בכל תרגיל רואים את הפעם הקודמת, כולל תת־סטים. לחיצה פותחת את האימון הקודם, וכפתור אחד מחזיר לסט.'},
  {kind:'b',view:'workoutHome',t:null,mock:'<div class="fpI-mock" style="text-align:center;border-color:rgba(215,243,107,.45)"><div style="font-size:30px;font-weight:800">1:30</div><div>מנוחה · <b>+30 שנ׳</b> · <b>עצור</b></div></div>',title:'מנוחה',text:'המנוחה מתחילה לבד: כשממלאים סט, כשמוסיפים סט או כששומרים תרגיל. לחיצה על השעון: לעצור או להוסיף חצי דקה. בסוף יש צליל, קול או הקלטה שלך.'},
  {kind:'b',view:'workoutHome',t:null,mock:'<div class="fpI-mock" style="text-align:center;font-size:18px;border-color:rgba(215,243,107,.45)"><div style="font-weight:800;margin-top:4px">שיא חדש בלחיצת חזה!</div></div>',title:'שיא חדש',text:'שברת שיא במשקל או בחזרות? קונפטי.'},
  {kind:'b',view:'workoutDiary',t:()=>q('#workoutHistory .journal-day')||q('#workoutHistory'),title:'יומן האימונים',text:'כל אימון נשמר עם הסטים. אפשר לערוך, להעביר תרגיל, או להוסיף תרגיל לאימון שכבר נגמר.'},
  {kind:'b',view:'process',t:()=>q('#fpWeekCard')||q('#photoCard'),title:'ההתקדמות שלך',text:'כל שבוע במקום אחד: תמונות, משקל והיקף טבור, עם השוואה.'},
  {kind:'b',view:'settings',before:()=>{try{const d=q('#fpGoalSet');if(d)d.open=false}catch(_){}},t:()=>q('#fpGoalSet'),title:'ההגדרות: היעד',text:'״היעד והאירועים״: כמה היעד זז לפי אתמול (או לכבות), וכמה לחסוך לפני אירוע.'},
  {kind:'b',view:'settings',t:()=>q('#fpWeekSet'),title:'יום, חגים ושבת',text:'מתי היום שלך מתחיל (אם אתה אוכל אחרי חצות), אילו חגים, ושבת.'},
  {kind:'b',view:'settings',t:()=>q('#fpRestSet'),title:'צליל סוף מנוחה',text:'צפצוף, קול, משפט שלך או הקלטה. ועוצמה.'},
  {kind:'b',view:'settings',t:()=>q('#notificationSettings'),title:'התראות',text:'תזכורת לאירועי השבוע, גם כשהאפליקציה סגורה.'},
  {kind:'end',view:'today',t:null,title:'זהו, אתה מוכן',text:'יאללה, תרשום את הארוחה הראשונה.'}
];
const css=`#fpI{position:fixed;inset:0;z-index:2147482400;pointer-events:none}
#fpI .fpI-blk{position:fixed;background:rgba(5,8,11,.62);pointer-events:auto;transition:all .25s ease}
#fpI .fpI-ring{position:fixed;border-radius:14px;pointer-events:none;transition:all .25s ease}
#fpI .fpI-ring.b{border:2px solid rgba(215,243,107,.9);box-shadow:0 0 0 4px rgba(215,243,107,.18),0 0 22px rgba(215,243,107,.35);animation:fpIb 1.8s ease-in-out infinite}
#fpI .fpI-ring.s{border:2px solid rgba(182,147,255,.95);box-shadow:0 0 0 4px rgba(182,147,255,.2),0 0 24px rgba(182,147,255,.45);animation:fpIs 1.8s ease-in-out infinite}
@keyframes fpIb{50%{box-shadow:0 0 0 6px rgba(215,243,107,.12),0 0 30px rgba(215,243,107,.45)}}
@keyframes fpIs{50%{box-shadow:0 0 0 6px rgba(182,147,255,.14),0 0 32px rgba(182,147,255,.55)}}
#fpI .fpI-card{position:fixed;left:12px;right:12px;pointer-events:auto;background:var(--card,#171C22);border:1px solid var(--line,#2A333C);border-radius:18px;padding:14px 14px 12px;box-shadow:0 14px 40px rgba(0,0,0,.5);transition:top .25s ease}
#fpI .fpI-card.s{border-color:rgba(182,147,255,.6)}
#fpI .fpI-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-size:12px;color:var(--muted,#93A09A)}
#fpI .fpI-tag{font-weight:800;border-radius:99px;padding:3px 10px;font-size:12px}
#fpI .fpI-tag.b{background:rgba(215,243,107,.15);color:#D7F36B}#fpI .fpI-tag.s{background:rgba(182,147,255,.18);color:#C9B2FF}
#fpI h3{margin:2px 0 6px;font-size:19px}#fpI p{margin:0;font-size:15.5px;line-height:1.55}
#fpI .fpI-tap{margin-top:8px;font-size:13.5px;font-weight:700}#fpI .fpI-hint{margin:8px 0 0;font-size:12px;color:#6B7682}#fpI .fpI-card.swap{animation:fpIsw .3s ease}@keyframes fpIsw{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
#fpI .fpI-tap.b{color:#D7F36B}#fpI .fpI-tap.s{color:#C9B2FF}
#fpI .fpI-back{border:1px solid var(--line,#2A333C);border-radius:14px;padding:13px 14px;font:inherit;font-weight:700;background:none;color:inherit}
#fpI .fpI-next{margin-top:12px;width:100%;border:0;border-radius:14px;padding:13px;font:inherit;font-weight:800;font-size:16px;background:var(--brand,#D7F36B);color:#14190a}
#fpI .fpI-card.s .fpI-next{background:#B693FF;color:#170f2b}
#fpI .fpI-bar{height:3px;background:var(--line,#2A333C);border-radius:3px;margin-bottom:8px;overflow:hidden}#fpI .fpI-bar i{display:block;height:100%;background:currentColor}
.fpI-mock{margin:10px 0 2px;padding:12px;border-radius:12px;background:#11161b;border:1px solid rgba(182,147,255,.45);font-size:14.5px;line-height:1.5}
.fpI-oil{margin-top:4px;color:#C9B2FF;font-size:13px}
.fpI-btn{display:inline-block;background:var(--brand,#D7F36B);color:#14190a;border-radius:10px;padding:6px 12px;font-weight:800;font-size:13px}
#fpI .fpI-nav{position:fixed;left:0;right:0;bottom:0;display:flex;justify-content:space-between;align-items:center;gap:10px;padding:12px 14px calc(14px + env(safe-area-inset-bottom));pointer-events:auto;background:linear-gradient(rgba(5,8,11,0),rgba(5,8,11,.92) 35%)}
#fpI .fpI-nav button{font:inherit;font-weight:800;font-size:15.5px;border-radius:14px;padding:13px 20px;min-width:104px;cursor:pointer}
#fpI .fpI-nav .bk{border:1px solid var(--line,#2A333C);background:var(--card,#171C22);color:inherit}#fpI .fpI-nav .bk[disabled]{visibility:hidden}
#fpI .fpI-nav .nx{border:0;background:var(--brand,#D7F36B);color:#14190a}#fpI .fpI-nav .nx.s{background:#B693FF;color:#170f2b}
#fpI .fpI-dots{display:flex;gap:4px;align-items:center;font-size:12px;color:var(--muted,#93A09A);font-variant-numeric:tabular-nums}
#fpI .fpI-end{position:fixed;top:calc(10px + env(safe-area-inset-top));left:12px;pointer-events:auto;font:inherit;font-size:13px;border:1px solid var(--line,#2A333C);background:var(--card,#171C22);color:var(--muted,#93A09A);border-radius:99px;padding:7px 12px;cursor:pointer}
#fpI .fpI-fold{background:none;border:0;color:var(--muted,#93A09A);font:inherit;font-size:12.5px;cursor:pointer;padding:2px 4px}
#fpI .fpI-card.min{padding:10px 14px}#fpI .fpI-card.min p,#fpI .fpI-card.min .fpI-mock,#fpI .fpI-card.min .fpI-hint,#fpI .fpI-card.min .fpI-bar{display:none}#fpI .fpI-card.min h3{font-size:15px;margin:0}#fpI .fpI-card.min .fpI-tap{margin-top:4px}
@media (prefers-reduced-motion:reduce){#fpI .fpI-card.swap{animation:none}#fpI .fpI-ring{animation:none}#fpI .fpI-blk,#fpI .fpI-ring,#fpI .fpI-card{transition:none}}`;
let I=-1,root=null,timer=null,tgt=null,clickHook=null,ST=STEPS,OPT={},doneAt=-1,scrolled=-1,lastRect='',FOLD=false;
const NAVH=()=>{const n=root&&root.querySelector('.fpI-nav');return n?n.offsetHeight:76};
function el(){return document.getElementById('fpI')}
function place(){
  if(!root)return;const s=ST[I];let r=null;
  if(tgt&&vis(tgt)){const b=tgt.getBoundingClientRect(),p=6;r={l:Math.max(0,b.left-p),t:Math.max(0,b.top-p),r:Math.min(innerWidth,b.right+p),b:Math.min(innerHeight,b.bottom+p)}}
  const [b0,b1,b2,b3]=root.querySelectorAll('.fpI-blk'),ring=root.querySelector('.fpI-ring'),card=root.querySelector('.fpI-card');
  const set=(e,l,t,w,h)=>{e.style.left=l+'px';e.style.top=t+'px';e.style.width=Math.max(0,w)+'px';e.style.height=Math.max(0,h)+'px'};
  const ch=card.offsetHeight,bot=innerHeight-NAVH()-8;
  if(!r){set(b0,0,0,innerWidth,innerHeight);[b1,b2,b3].forEach(x=>set(x,0,0,0,0));ring.style.display='none';card.style.top=Math.max(12,(bot-ch)/2)+'px';return}
  set(b0,0,0,innerWidth,r.t);set(b1,0,r.b,innerWidth,innerHeight-r.b);set(b2,0,r.t,r.l,r.b-r.t);set(b3,r.r,r.t,innerWidth-r.r,r.b-r.t);
  ring.style.display='block';ring.className='fpI-ring '+(s.kind==='s'?'s':'b');set(ring,r.l,r.t,r.r-r.l,r.b-r.t);
  /* the glowing thing is clickable only when the step says so; otherwise a clear layer covers it */
  const cover=root.querySelector('.fpI-cover');if(s.tap||s.free){set(cover,0,0,0,0)}else set(cover,r.l,r.t,r.r-r.l,r.b-r.t);
  /* 2.23: the card never covers the buttons at the bottom; a folded card sits just above them */
  const below=bot-r.b,above=r.t-56,gap=12;let top;
  if(FOLD)top=bot-ch;else if(below>=ch+gap)top=r.b+gap;else if(above>=ch+gap)top=r.t-ch-gap;else top=below>above?bot-ch:56;
  card.style.top=Math.max(52,Math.min(bot-ch,top))+'px';
}
function draw(){
  const s=ST[I],kind=s.kind==='s'?'s':'b',card=root.querySelector('.fpI-card'),n=ST.length,text=typeof s.text==='function'?s.text():s.text;
  card.className='fpI-card '+kind;
  card.innerHTML=`<div class="fpI-bar" style="color:${kind==='s'?'#B693FF':'#D7F36B'}"><i style="width:${Math.round((I+1)/n*100)}%"></i></div><div class="fpI-top"><span class="fpI-tag ${kind}">${kind==='s'?'רק אצלנו':'הבסיס'}</span><span>${I+1} / ${n}</span></div>
    <h3>${esc(s.title)}</h3><p>${esc(text)}</p>${s.mock||''}${s.tap||s.free?`<div class="fpI-tap ${kind}">${esc(s.tapText||'לחץ על מה שזוהר')}</div>`:''}${s.hint?'<p class="fpI-hint">ניתן לשינוי בהגדרות</p>':''}
`;
  card.classList.toggle('min',FOLD);
  const top=card.querySelector('.fpI-top');if(top&&s.kind!=='end')top.insertAdjacentHTML('beforeend',`<button type="button" class="fpI-fold" aria-expanded="${!FOLD}">${FOLD?'להציג ▴':'להסתיר ▾'}</button>`);
  const fb=card.querySelector('.fpI-fold');if(fb)fb.onclick=()=>{FOLD=!FOLD;draw();place()};if(FOLD)card.onclick=e=>{if(!e.target.closest('.fpI-fold')){FOLD=false;draw();place()}};else card.onclick=null;
  const nav=root.querySelector('.fpI-nav');nav.innerHTML=`<button type="button" class="bk" ${I>0?'':'disabled'}>‹ חזרה</button><span class="fpI-dots">${I+1} / ${n}</span><button type="button" class="nx ${kind}">${s.kind==='end'?(OPT.endLabel||'יאללה, לרשום ארוחה ראשונה'):s.done?'דלג ›':'הבא ›'}</button>`;
  nav.querySelector('.nx').onclick=()=>go(I+1);nav.querySelector('.bk').onclick=()=>{if(I>0)go(I-1)};
}
function go(n){
  const prev=ST[I];if(prev&&prev.after)try{prev.after()}catch(_){}
  if(n>=ST.length)return finish(true);
  I=n;const s=ST[I];tgt=null;FOLD=!!s.free; /* 2.23: on a 'try it' step (the demo) the card starts folded, so it does not hide what you try */
  try{if(s.view&&!(q('#'+s.view)||{}).classList?.contains('active'))showView(s.view)}catch(_){}
  try{window.scrollTo(0,0)}catch(_){}
  if(s.before)try{s.before()}catch(_){}
  draw();lastRect='';place();try{const c=root.querySelector('.fpI-card');c.classList.remove('swap');void c.offsetWidth;c.classList.add('swap')}catch(_){}
  {const t0=performance.now();const follow=()=>{if(!root||ST[I]!==s)return;if(tgt&&vis(tgt))place();if(performance.now()-t0<900)requestAnimationFrame(follow)};requestAnimationFrame(follow)}
  let tries=0;clearInterval(timer);
  doneAt=-1;try{if(s.start)s.start()}catch(_){}
  timer=setInterval(()=>{if(!root)return clearInterval(timer);const s2=ST[I];try{if(s2.done&&doneAt!==I&&s2.done()){doneAt=I;const at=I;const c=root.querySelector('.fpI-card');if(c)c.querySelector('.fpI-next').textContent='✓ יופי';setTimeout(()=>{if(I===at)go(I+1)},700)}}catch(_){}if(s2.t&&(!tgt||!tgt.isConnected||!vis(tgt))){tries++;try{const e=s2.t();if(e&&vis(e)){tgt=e;if(scrolled!==I){scrolled=I;try{e.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})}catch(_){}{const t1=performance.now();const fl=()=>{if(!root)return;place();if(performance.now()-t1<800)requestAnimationFrame(fl)};requestAnimationFrame(fl)}}}}catch(_){}}const rr=tgt&&vis(tgt)?(()=>{const b=tgt.getBoundingClientRect();return [b.left,b.top,b.width,b.height].map(Math.round).join(',')})():'-';if(rr!==lastRect){lastRect=rr;place()}},250);
}
function finish(toAdd){
  clearInterval(timer);closeAll();if(clickHook)document.removeEventListener('click',clickHook,true);clickHook=null;
  const r=el();if(r)r.remove();root=null;I=-1;tgt=null;
  if(OPT.onFinish){const f=OPT.onFinish;ST=STEPS;OPT={};try{f(toAdd)}catch(e){console.error(e)}return}
  try{FP2.setProp('TOUR_DONE','1')}catch(_){}
  try{localStorage.getItem('fp2.firstDay')||localStorage.setItem('fp2.firstDay',state.todayDate||state.date||'')}catch(_){}
  try{showView(toAdd?'add':'today');if(toAdd){const f=$('foodQuery');if(f)setTimeout(()=>f.focus(),300)}}catch(_){}
}
window.fpIntro=function(start,steps,opt){
  if(el())return;ST=Array.isArray(steps)&&steps.length?steps:STEPS;OPT=opt||{};
  if(!document.getElementById('fpICss'))document.head.insertAdjacentHTML('beforeend',`<style id="fpICss">${css}</style>`);
  /* 2.23: "סיים סיור" for someone who already knows the app (the tour after the first one, and the short tours) */
  let can=OPT.canEnd;if(can==null){try{can=FP2.getProp('TOUR_DONE')==='1'}catch(_){can=false}}
  document.body.insertAdjacentHTML('beforeend','<div id="fpI" role="dialog" aria-label="היכרות עם האפליקציה" dir="rtl"><div class="fpI-blk"></div><div class="fpI-blk"></div><div class="fpI-blk"></div><div class="fpI-blk"></div><div class="fpI-blk fpI-cover" style="background:transparent"></div><div class="fpI-ring b"></div><div class="fpI-card"></div><div class="fpI-nav"></div>'+(can?'<button type="button" class="fpI-end">סיים סיור ✕</button>':'')+'<i id="fpTour" hidden></i></div>');
  root=el();const eb=root.querySelector('.fpI-end');if(eb)eb.onclick=()=>finish(false);
  /* 2.23: the old "tour when it is relevant" mode is off for good: it started a tour on the next screen you opened */
  try{localStorage.removeItem('fp2.tourMode')}catch(_){}
  try{document.querySelectorAll('.overlay:not(.hide)').forEach(o=>{if(o.id!=='onbSheet')o.classList.add('hide')})}catch(_){}
  /* a tap on what glows does its real job, then the tour moves on */
  clickHook=e=>{if(!root||I<0)return;const s=ST[I];if(!s||!s.tap||!tgt||s.done)return;if(tgt.contains(e.target)){const at=I;setTimeout(()=>{if(I===at)go(I+1)},450)}};
  document.addEventListener('click',clickHook,true);
  addEventListener('resize',place);
  go(Math.max(0,Math.min(ST.length-1,Number(start)||0)));
};
window.fpIntroSteps=STEPS.length;window.fpIntroAll=STEPS;
})();
