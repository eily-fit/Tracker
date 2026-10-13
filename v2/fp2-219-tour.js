/* FitPro 2.19.0 — the tour, as approved in the simulation: screen by screen on the real app.
   Food first (ring, + אוכל, typing, AI, more ways), the specials in purple (events, goal balancing, holidays & Shabbat with Friday
   marked, requests inside the small +), workouts (ready workouts, real-time workout, the video: how, which muscle, what not to do,
   last time, rest), running & cardio, progress (weekly, photos, the trend), settings last. Settings → runs it again. */
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
  if(on){b.style.outline='2px solid #B693FF';b.style.outlineOffset='2px';if(!q('#fpShabMark'))b.insertAdjacentHTML('beforeend','<i id="fpShabMark" style="display:block;width:6px;height:6px;border-radius:50%;background:#B693FF;margin:2px auto 0"></i>')}
  else{b.style.outline='';b.style.outlineOffset='';const m=q('#fpShabMark');if(m)m.remove()}}
const MOCK_SET='<div class="fpI-mock" style="border-color:rgba(215,243,107,.45)"><b>לחיצת חזה במשקולות</b> · תרגיל 2 מתוך 5<div style="margin-top:6px">סט 1 · <b>16</b> ק״ג × <b>8</b> ✓</div><div>סט 2 · <b>16</b> ק״ג × <b>—</b></div><div style="margin-top:8px"><span class="fpI-btn">שמור ועבור לתרגיל הבא ←</span></div></div>';
/* 2.25 (sketch A): the real "בפעם הקודמת" window, glowing purple, with the recommendation */
const MOCK_LAST='<div class="fpI-mock" style="background:#26301A;border:1px solid #B693FF;box-shadow:0 0 0 2px rgba(182,147,255,.55),0 0 22px rgba(182,147,255,.45)"><div class="fpI-oil" style="color:#D7F36B;margin:0 0 6px;font-weight:800">בפעם הקודמת · 05.10</div><div style="display:flex;flex-wrap:wrap;gap:6px"><span style="background:#11161b;border-radius:9px;padding:3px 9px">סט 1: 80 ק״ג × 6</span><span style="background:#11161b;border-radius:9px;padding:3px 9px">סט 2: 80 ק״ג × 6</span></div><div style="border:1px dashed #D7F36B;border-radius:10px;padding:6px 9px;margin-top:8px;font-size:13.5px">השלמת הכל: עלה ל-82.5 ק״ג <span class="fpI-btn" style="padding:3px 9px;font-size:12px">מלא</span></div></div>';
const MOCK_REST='<div class="fpI-mock" style="text-align:center;border-color:rgba(215,243,107,.45)"><div style="font-size:30px;font-weight:800">1:30</div><div>מנוחה · <b>+30 שנ׳</b> · <b>עצור</b></div></div>';
const STEPS=[
 {kind:'b',view:'today',t:()=>q('#calRing'),title:'כמה נשאר לך היום',text:'העיגול מראה כמה נשאר לאכול היום. מתחת: חלבון, פחמימות ושומן.'},
 {kind:'b',view:'today',t:()=>q('.quick-row .btn'),title:'מוסיפים אוכל',text:'זה הכפתור שתשתמש בו הכי הרבה.',tap:true,tapText:'לחץ על ״＋ אוכל״'},
 {kind:'b',view:'add',t:()=>q('#foodQuery'),title:'כותבים מה אכלת',text:'כמו בוואטסאפ: ״2 ביצים, פרוסת לחם, סלט״. כמה דברים ביחד נשמרים כארוחה אחת. אפשר לחפש רק במזונות שלך או רק במאגר.'},
 {kind:'b',view:'add',t:()=>byText('#add button',/חשב בעזרת AI/),title:'AI למנות מסובכות',text:'שקשוקה? מקלובה? ה-AI מפרק לרכיבים, ואתה בוחר כמה אכלת: חצי, בגרמים, ביחידות, או כמה גרם מכל רכיב.'},
 {kind:'b',view:'add',t:()=>q('#fpAddMoreBtn'),title:'עוד דרכים',text:'צילום של הצלחת, ברקוד, תמונה של מתכון, או קישור למתכון.',tap:true,tapText:'לחץ ותראה'},
 {kind:'b',view:'add',before:()=>{if(!q('#fpAddMoreSheet'))try{fpAddMore()}catch(_){}},t:()=>q('#fpAddMoreSheet .sheet'),title:'הכל פה',text:'כל אחת מהדרכים נותנת ערכים שאפשר לתקן לפני ששומרים.',after:closeAll},
 {kind:'s',view:'today',t:()=>q('#hdrCal'),title:'אירועים: חוסכים מראש',text:'חתונה או מסעדה ביומן של הטלפון? האפליקציה קולטת לבד (או שמוסיפים כאן) ושואלת כמה לחסוך. ביום האירוע ״התחלתי את האירוע״, ולמחרת סיכום אמיתי: עמדת או לא.',hint:true},
 {kind:'s',view:'today',t:()=>q('#calRing'),title:'היעד מתאזן לבד',text:()=>{const c=ctx();return `לא אכלת מספיק אתמול? היום מקבל את ההפרש. עברת? היום קצת פחות${c.shiftPct!=null?` (עד ${c.shiftPct}% ביום)`:''}. 3 ימים ברצף באותו כיוון? האפליקציה עוצרת ושואלת מה קרה, ומתאימה את עצמה אליך.`},hint:true},
 {kind:'s',view:'today',before:()=>markFriday(true),t:()=>q('#dateStrip'),title:'חגים ושבת',text:'יום שישי מסומן בנקודה סגולה. שבוע לפני חג: ״לשמור לך קלוריות?״. בשבת האפליקציה לומדת כמה אתה אוכל (שישי, ערב שבת, שבת בוקר, שבת צהריים, מה שתבחר), וממלאת לבד אם תרצה.',hint:true,after:()=>markFriday(false)},
 {kind:'b',view:'today',t:()=>q('#plusFab'),title:'הקיצורים',text:'הפלוס הקטן למטה: ממתק, אירוע, משקל ועוד, בלחיצה אחת.',hint:true},
 {kind:'s',view:'today',before:()=>{if(!vis(q('#plusList')))try{openPlusMenu()}catch(_){}},t:()=>byText('#plusList button, #plusList .plus-item, #plusList [onclick]',/בקשה|רעיון/)||q('#plusList'),title:'חסר לך משהו? תגיד',text:'גם זה בפלוס: בקשה או רעיון, בהקלטה או בטקסט. כשזה מוכן מקבלים הודעה.',after:closeAll},
 {kind:'b',view:'today',t:()=>q('nav button[data-tab="train"]'),title:'אימונים',text:'עוברים ללשונית האימון.',tap:true,tapText:'לחץ על ״אימון״'},
 {kind:'b',view:'workoutHome',before:()=>{try{fp222.tab('s')}catch(_){}},t:()=>q('#fpHdr'),title:'כוח, ריצה ואירובי',text:'למעלה עוברים בין כוח, ריצה ואירובי. לכל אחד צבע: ירוק, כחול, כתום. הכוכב ״שלי״: האימונים הקבועים שלך בתיקיות. ״יומן״: כל מה שעשית, לפי שבועות.'},
 {kind:'b',view:'workoutHome',t:()=>q('#fpStrip'),title:'השבוע שלך',text:'נקודה מלאה = עשית. עיגול ריק = מתוכנן. לחיצה על יום מראה מה עשית בו ומה מתוכנן.'},
 {kind:'b',view:'workoutHome',t:()=>q('#fpReco .fpCard')||q('#fpReco'),title:'מומלץ להיום',text:'הדבר הראשון בכל לשונית: מה מתאים לעשות היום, לפי כמה אימונים בשבוע בחרת, מה כבר עשית, ומה שלא עשית הכי הרבה זמן. הכרטיס גם כותב למה.',hint:true},
 {kind:'b',view:'workoutHome',t:()=>q('#startWorkoutCard'),title:'אימונים מוכנים, או משלך',text:'יש אימונים מוכנים לפי סוג, מקום וציוד: בוחרים ומתחילים. רוצה משהו משלך? ״צור אימון חדש״, בונים פעם אחת ומתחילים בלחיצה.'},
 {kind:'b',view:'workoutHome',t:null,mock:MOCK_SET,title:'אימון בזמן אמת',text:'באימון רושמים כל סט תוך כדי. ״שמור ועבור לתרגיל הבא״ מעביר אותך הלאה.'},
 {kind:'b',view:'workoutHome',before:()=>{try{FP2Anim.open('שכיבות סמיכה')}catch(_){}},t:()=>q('#anOv:not(.hide) .an-sheet'),free:true,tapText:'אפשר ללחוץ ולנסות: ״מה לא לעשות״, עצירה וזווית.',title:'הדגמה לכל תרגיל',text:'איך עושים, איזה שריר עובד (באדום), ומה לא לעשות: הטעות מוצגת בדמות עצמה.',after:()=>{try{FP2Anim.close()}catch(_){}}},
 {kind:'s',view:'workoutHome',t:null,mock:MOCK_LAST,title:'מה עשית בפעם הקודמת',text:'באימון לוחצים על תרגיל שכבר עשית, ונפתח החלון הזה: כמה עשית בפעם הקודמת, והמלצה להיום. ״מלא״ ממלא את המשקל בשבילך.'},
 {kind:'b',view:'workoutHome',t:null,mock:MOCK_REST,title:'מנוחה של דקה וחצי',text:'מתחילה לבד כשמתחילים לרשום תוצאה של סט, או כשמוסיפים סט, מה שקורה קודם. לחיצה על השעון: לעצור או +30 שניות. בסוף צליל, קול שאומר משפט שלך, או הקלטה שלך.',hint:true},
 {kind:'b',view:'workoutHome',before:()=>{try{fp222.tab('r')}catch(_){}},t:()=>q('#fp221Run .sec'),title:'ריצה ואירובי',text:'בריצה: מה רצים היום, הדרך ליעד והתוכנית. אפשר למדוד ב-GPS. באירובי: האימון של היום עם טיימר שממשיך גם כשסוגרים אותו.',after:()=>{try{fp222.tab('s')}catch(_){}}},
 {kind:'b',view:'workoutHome',t:()=>q('nav button[data-tab="progress"]'),title:'התהליך',text:'עוברים להתקדמות.',tap:true,tapText:'לחץ על ״התקדמות״'},
 {kind:'b',view:'process',t:()=>q('#fpWeekCard')||q('#photoCard'),title:'פעם בשבוע',text:'משקל, היקף טבור ותמונות. רואים את הקו לאורך זמן ולא נלחצים מיום אחד. במוצאי שבת מגיע סיכום שבוע: עמדת ביעדים או לא, ובמה השתפרת.'},
 {kind:'b',view:'process',t:()=>vis(q('#photoCompare'))?q('#photoCompare'):(q('#photoCard')||q('#photoProgress')),title:'השוואת תמונות',text:'לפני ואחרי, מאותה זווית. השינוי שהמשקל לא מראה.'},
 {kind:'b',view:'process',t:()=>q('#processTrends'),title:'המגמה',text:'הקו של כל התהליך: לאן אתה הולך, ולא מה קרה ביום אחד.'},
 {kind:'b',view:'process',t:()=>q('nav button[data-tab="more"]'),title:'ההגדרות',text:'עוברים להגדרות.',tap:true,tapText:'לחץ על ״עוד״'},
 {kind:'b',view:'settings',t:()=>q('#fpGoalSet')||q('#settings h2'),title:'כל מה שאמרנו, משתנה כאן',text:'היעד והאירועים, איך אתה מבשל, חגים ושבת, צליל מנוחה, הקיצורים, מדליות וסיכום שבוע, ו״אימונים: כוח, ריצה, אירובי״ עם התוכנית השבועית. הכל כבר מוגדר לפי השאלון, ואפשר לשנות מתי שרוצים.'},
 {kind:'end',view:'today',t:null,title:'זהו, אתה מוכן',text:'יאללה, תרשום את הארוחה הראשונה. הסיור נשאר בהגדרות.'}
];
const old=window.fpIntro;
window.fpIntro=function(start,steps,opt){return old(start,Array.isArray(steps)&&steps.length?steps:STEPS,opt||{endLabel:'יאללה, לרשום ארוחה ראשונה'})};
window.fpIntroAll=STEPS;window.fpIntroSteps=STEPS.length;
/* Settings: one tour */
setInterval(()=>{const b=document.getElementById('tourRerun');if(b&&b.dataset.fp219!=='1'){b.dataset.fp219='1';b.dataset.fp217='1';b.textContent='הסיור באפליקציה';b.onclick=()=>{try{showView('today')}catch(_){}fpIntro()}}},1000);
})();
