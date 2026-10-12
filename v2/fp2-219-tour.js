/* FitPro 2.19.0 — the tour, as approved in the simulation: screen by screen on the real app.
   Food first (ring, + אוכל, typing, AI, more ways), the specials in purple (events, goal balancing, holidays & Shabbat with Friday
   marked, requests inside the small +), workouts (ready workouts, real-time workout, the video: how, which muscle, what not to do,
   last time, rest), running & cardio, progress (weekly, photos, the trend), settings last. Settings → 🎓 runs it again. */
(function(){
'use strict';
if(typeof window.fpIntro!=='function')return;
const q=s=>document.querySelector(s);
const vis=el=>{if(!el)return false;const r=el.getBoundingClientRect();return r.width>0&&r.height>0};
const byText=(sel,re)=>[...document.querySelectorAll(sel)].find(e=>re.test(e.textContent||'')&&vis(e));
const closeAll=()=>{['fpAddMoreSheet','fpUnplanned','fpEvSum','fpStreak','fpHoliday','fpShab'].forEach(i=>{const e=document.getElementById(i);if(e)e.remove()});try{closePlusMenu()}catch(_){}try{FP2Anim&&FP2Anim.close()}catch(_){}};
const active=id=>{const e=q('#'+id);return !!(e&&e.classList.contains('active'))};
const ctx=()=>{try{return bankCtx()}catch(_){return {}}};
function markFriday(on){const s=q('#dateStrip');if(!s)return;const b=s.children[5];if(!b)return;
  if(on){b.style.outline='2px solid #B693FF';b.style.outlineOffset='2px';if(!q('#fpShabMark'))b.insertAdjacentHTML('beforeend','<i id="fpShabMark" style="display:block;font-style:normal;font-size:11px">🕯</i>')}
  else{b.style.outline='';b.style.outlineOffset='';const m=q('#fpShabMark');if(m)m.remove()}}
const MOCK_SET='<div class="fpI-mock" style="border-color:rgba(215,243,107,.45)"><b>לחיצת חזה במשקולות</b> · תרגיל 2 מתוך 5<div style="margin-top:6px">סט 1 · <b>16</b> ק״ג × <b>8</b> ✓</div><div>סט 2 · <b>16</b> ק״ג × <b>—</b></div><div style="margin-top:8px"><span class="fpI-btn">שמור ועבור לתרגיל הבא ←</span></div></div>';
const MOCK_LAST='<div class="fpI-mock"><b>בפעם הקודמת · יום ג׳</b><div style="margin-top:4px">סט 1: 14 ק״ג × 7 ← 10 ק״ג × 4</div></div>';
const MOCK_REST='<div class="fpI-mock" style="text-align:center;border-color:rgba(215,243,107,.45)"><div style="font-size:30px;font-weight:800">1:30</div><div>⏱ מנוחה · <b>+30 שנ׳</b> · <b>⏹ עצור</b></div></div>';
const STEPS=[
 {kind:'b',view:'today',t:()=>q('#calRing'),title:'כמה נשאר לך היום',text:'העיגול מראה כמה נשאר לאכול היום. מתחת: חלבון, פחמימות ושומן.'},
 {kind:'b',view:'today',t:()=>q('.quick-row .btn'),title:'מוסיפים אוכל',text:'זה הכפתור שתשתמש בו הכי הרבה.',tap:true,tapText:'לחץ על ״＋ אוכל״'},
 {kind:'b',view:'add',t:()=>q('#foodQuery'),title:'כותבים מה אכלת',text:'כמו בוואטסאפ: ״2 ביצים, פרוסת לחם, סלט״. כמה דברים ביחד נשמרים כארוחה אחת. אפשר לחפש רק במזונות שלך או רק במאגר.'},
 {kind:'b',view:'add',t:()=>byText('#add button',/חשב בעזרת AI/),title:'AI למנות מסובכות',text:'שקשוקה? מקלובה? ה-AI מפרק לרכיבים, ואתה בוחר כמה אכלת: חצי, בגרמים, ביחידות, או כמה גרם מכל רכיב.'},
 {kind:'b',view:'add',t:()=>q('#fpAddMoreBtn'),title:'עוד דרכים',text:'צילום של הצלחת, ברקוד, תמונה של מתכון, או קישור למתכון.',tap:true,tapText:'לחץ ותראה'},
 {kind:'b',view:'add',before:()=>{if(!q('#fpAddMoreSheet'))try{fpAddMore()}catch(_){}},t:()=>q('#fpAddMoreSheet .sheet'),title:'הכל פה',text:'כל אחת מהדרכים נותנת ערכים שאפשר לתקן לפני ששומרים.',after:closeAll},
 {kind:'s',view:'today',t:()=>q('#hdrCal'),title:'✨ אירועים: חוסכים מראש',text:'חתונה או מסעדה ביומן של הטלפון? האפליקציה קולטת לבד (או שמוסיפים כאן) ושואלת כמה לחסוך. ביום האירוע ״התחלתי את האירוע״, ולמחרת סיכום אמיתי: עמדת או לא. ⚙️ כמה לחסוך, אפשר לשנות בהגדרות.'},
 {kind:'s',view:'today',t:()=>q('#calRing'),title:'✨ היעד מתאזן לבד',text:()=>{const c=ctx();return `לא אכלת מספיק אתמול? היום מקבל את ההפרש. עברת? היום קצת פחות${c.shiftPct!=null?` (עד ${c.shiftPct}% ביום)`:''}. 3 ימים ברצף באותו כיוון? שואלים מה קרה, במקום להעניש. ⚙️ כמה היעד זז, או לכבות.`}},
 {kind:'s',view:'today',before:()=>markFriday(true),t:()=>q('#dateStrip'),title:'✨ חגים ושבת',text:'רואים את יום שישי מסומן 🕯. שבוע לפני חג: ״לשמור לך קלוריות?״. בשבת האפליקציה לומדת כמה אתה אוכל, וממלאת לבד אם תרצה.',after:()=>markFriday(false)},
 {kind:'b',view:'today',t:()=>q('#plusFab'),title:'הקיצורים',text:'הפלוס הקטן למטה: ממתק, אירוע, משקל ועוד, בלחיצה אחת. ⚙️ מה מופיע בפלוס, משנים בהגדרות.',tap:true,tapText:'לחץ על הפלוס'},
 {kind:'s',view:'today',before:()=>{if(!vis(q('#plusList')))try{openPlusMenu()}catch(_){}},t:()=>byText('#plusList button, #plusList .plus-item, #plusList [onclick]',/בקשה|רעיון/)||q('#plusList'),title:'✨ חסר לך משהו? תגיד',text:'גם זה בפלוס: בקשה או רעיון, בהקלטה או בטקסט. כשזה מוכן מקבלים הודעה.',after:closeAll},
 {kind:'b',view:'today',t:()=>q('nav button[data-tab="train"]'),title:'אימונים',text:'עוברים ללשונית האימון.',tap:true,tapText:'לחץ על ״אימון״'},
 {kind:'b',view:'workoutHome',t:()=>q('#startWorkoutCard'),title:'אימונים מוכנים',text:'האפליקציה באה עם אימונים מוכנים. בוחרים סוג, מקום וציוד, ולוחצים ״התחל״. רוצה משהו משלך? ״צור אימון חדש״.'},
 {kind:'b',view:'workoutHome',t:null,mock:MOCK_SET,title:'אימון בזמן אמת',text:'באימון רושמים כל סט תוך כדי. ״שמור ועבור לתרגיל הבא״ מעביר אותך הלאה.'},
 {kind:'b',view:'workoutHome',before:()=>{try{FP2Anim.open('שכיבות סמיכה')}catch(_){}},t:()=>q('#anOv:not(.hide) .an-sheet'),title:'סרטון לכל תרגיל',text:'איך עושים, איזה שריר עובד (באדום), ומה לא לעשות: ״טעויות נפוצות״ מראה את הטעות בדמות עצמה.',after:()=>{try{FP2Anim.close()}catch(_){}}},
 {kind:'s',view:'workoutHome',t:null,mock:MOCK_LAST,title:'✨ מה עשית בפעם הקודמת',text:'רואים את הסטים מהפעם הקודמת, כולל תת־סטים, כדי לדעת כמה להרים.'},
 {kind:'b',view:'workoutHome',t:null,mock:MOCK_REST,title:'מנוחה של דקה וחצי',text:'מתחילה לבד כשממלאים סט, מוסיפים סט או שומרים. לחיצה על השעון: לעצור או +30 שניות. בסוף צליל, קול שאומר משפט שלך, או הקלטה שלך. ⚙️ זמן המנוחה והצליל, בהגדרות.'},
 {kind:'b',view:'workoutHome',t:()=>q('#fp221Tabs'),title:'כוח, ריצה ואירובי',text:'למעלה 3 לשוניות. בריצה ובאירובי: האימון של היום, התוכנית, הדמויות, הטיימר וההיסטוריה. ״📅 השבוע שלי״: קובעים איזה יום מה, או מתאמנים חופשי.'},
 {kind:'b',view:'workoutHome',t:()=>q('nav button[data-tab="progress"]'),title:'התהליך',text:'עוברים להתקדמות.',tap:true,tapText:'לחץ על ״התקדמות״'},
 {kind:'b',view:'process',t:()=>q('#fpWeekCard')||q('#photoCard'),title:'פעם בשבוע',text:'משקל, היקף טבור ותמונות. רואים את הקו לאורך זמן ולא נלחצים מיום אחד. במוצאי שבת מגיע סיכום שבוע: עמדת ביעדים או לא, ובמה השתפרת.'},
 {kind:'b',view:'process',t:()=>vis(q('#photoCompare'))?q('#photoCompare'):(q('#photoCard')||q('#photoProgress')),title:'השוואת תמונות',text:'לפני ואחרי, מאותה זווית. השינוי שהמשקל לא מראה.'},
 {kind:'b',view:'process',t:()=>q('#processTrends'),title:'המגמה',text:'הקו של כל התהליך: לאן אתה הולך, ולא מה קרה ביום אחד.'},
 {kind:'b',view:'process',t:()=>q('nav button[data-tab="more"]'),title:'ההגדרות',text:'עוברים להגדרות.',tap:true,tapText:'לחץ על ״עוד״'},
 {kind:'b',view:'settings',t:()=>q('#fpGoalSet')||q('#settings h2'),title:'כל מה שאמרנו, משתנה כאן',text:'היעד והאירועים, איך אתה מבשל, חגים ושבת, צליל מנוחה, הקיצורים, מדליות וסיכום שבוע. הכל כבר מוגדר לפי השאלון, ואפשר לשנות מתי שרוצים.'},
 {kind:'end',view:'today',t:null,title:'זהו, אתה מוכן',text:'יאללה, תרשום את הארוחה הראשונה. הסיור נשאר בהגדרות.'}
];
const old=window.fpIntro;
window.fpIntro=function(start,steps,opt){return old(start,Array.isArray(steps)&&steps.length?steps:STEPS,opt||{endLabel:'יאללה, לרשום ארוחה ראשונה'})};
window.fpIntroAll=STEPS;window.fpIntroSteps=STEPS.length;
/* Settings: one tour */
setInterval(()=>{const b=document.getElementById('tourRerun');if(b&&b.dataset.fp219!=='1'){b.dataset.fp219='1';b.dataset.fp217='1';b.textContent='🎓 הסיור באפליקציה';b.onclick=()=>{try{showView('today')}catch(_){}fpIntro()}}},1000);
})();
