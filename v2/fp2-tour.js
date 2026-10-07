/* FitPro 2 — welcome (name) → questionnaire → interactive in-app tour.
   The tour highlights REAL buttons (clicks go through to the app), can open sheets, is skippable
   and can be re-run from Settings. Loaded after fp2-improvements.js. */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const prop=k=>{try{return FP2.getProp(k)}catch(_){return ''}};
  const setProp=(k,v)=>{try{FP2.setProp(k,v)}catch(_){}};
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const Q=s=>document.querySelector(s);
  const byText=(sel,re)=>[...document.querySelectorAll(sel)].find(e=>re.test(e.textContent))||null;
  const det=re=>{const s=byText('#settings summary',re);return s?s.parentElement:null};

  /* ---------- styles ---------- */
  const css=document.createElement('style');
  css.textContent=`
  #fpTour{position:fixed;inset:0;z-index:2147483000;direction:rtl;font-family:inherit;pointer-events:none}
  #fpTour .tb{position:fixed;background:rgba(5,8,11,.78);pointer-events:auto}
  #fpTour .tr{position:fixed;border:2px solid var(--brand,#D7F36B);border-radius:14px;box-shadow:0 0 0 4px rgba(215,243,107,.22),0 0 22px rgba(215,243,107,.35);pointer-events:none;transition:all .18s ease;animation:fpPulse 1.6s ease-in-out infinite}
  @keyframes fpPulse{50%{box-shadow:0 0 0 8px rgba(215,243,107,.12),0 0 28px rgba(215,243,107,.5)}}
  #fpTour .tc{position:fixed;left:50%;transform:translateX(-50%);width:min(348px,calc(100vw - 24px));box-sizing:border-box;background:var(--card,#171C22);color:var(--ink,#F2F5F7);border:1px solid var(--line,#2C3640);border-radius:18px;padding:16px 16px 12px;box-shadow:0 14px 44px rgba(0,0,0,.55);pointer-events:auto;transition:top .18s ease}
  #fpTour .tc h3{margin:0 0 6px;font-size:18px;line-height:1.3}
  #fpTour .tc p{margin:0 0 10px;font-size:15px;line-height:1.55;color:var(--ink,#F2F5F7)}
  #fpTour .tc .hint{display:inline-block;background:var(--brand2,#26301A);color:var(--brand,#D7F36B);border-radius:10px;padding:4px 10px;font-size:13.5px;font-weight:600;margin:0 0 10px}
  #fpTour .tbar{height:4px;border-radius:4px;background:var(--line,#2C3640);overflow:hidden;margin:2px 0 12px}
  #fpTour .tbar i{display:block;height:100%;background:var(--brand,#D7F36B);transition:width .25s}
  #fpTour .tn{display:flex;gap:8px;align-items:center}
  #fpTour .tn button{font:inherit;font-size:15px;border:0;border-radius:12px;padding:10px 16px;min-height:44px;cursor:pointer}
  #fpTour .tn .nx{flex:1;background:var(--brand,#D7F36B);color:#14190a;font-weight:700}
  #fpTour .tn .pv{background:var(--line,#2C3640);color:var(--ink,#F2F5F7)}
  #fpTour .tskip{display:block;margin:8px auto 0;background:none;border:0;color:var(--muted,#A3ADB8);font:inherit;font-size:13.5px;padding:6px;cursor:pointer;text-decoration:underline}
  #fpTour .tcount{font-size:12.5px;color:var(--muted,#A3ADB8);margin-bottom:4px}
  #fpWelcome{position:fixed;inset:0;z-index:2147483000;background:var(--bg,#0E1217);display:flex;align-items:center;justify-content:center;padding:24px;direction:rtl}
  #fpWelcome .w{width:min(420px,100%);text-align:center}
  #fpWelcome h1{font-size:30px;margin:0 0 8px}
  #fpWelcome p{color:var(--muted,#A3ADB8);font-size:16px;line-height:1.6;margin:0 0 20px}
  #fpWelcome input{width:100%;box-sizing:border-box;font:inherit;font-size:20px;text-align:center;padding:14px;border-radius:14px;border:1px solid var(--line,#2C3640);background:var(--card,#171C22);color:var(--ink,#F2F5F7);margin-bottom:12px}
  #fpWelcome button{width:100%;font:inherit;font-size:18px;font-weight:700;padding:14px;border:0;border-radius:14px;background:var(--brand,#D7F36B);color:#14190a;cursor:pointer}
  #fpWelcome .e{color:var(--danger,#F09595);min-height:22px;font-size:14px;margin-bottom:6px}
  `;
  document.head.appendChild(css);

  /* ---------- helpers ---------- */
  function openAncestors(e){for(let n=e;n&&n!==document.body;n=n.parentElement)if(n.tagName==='DETAILS')n.open=true}
  function resetUI(){
    try{closePlusMenu()}catch(_){}
    ['calendarSheet','eventSheet'].forEach(id=>{const e=$(id);if(e)e.classList.add('hide')});
    document.querySelectorAll('.overlay:not(.hide)').forEach(o=>{if(o.id!=='onbSheet'&&!o.closest('#fpTour'))o.classList.add('hide')});
    const p=$('extrasPanel');if(p)p.style.display='none';
  }
  const allEls=t=>{
    const list=Array.isArray(t)?t:[t],out=[];
    list.forEach(x=>{const r=typeof x==='function'?x():(typeof x==='string'?document.querySelector(x):x);if(r)out.push(r)});
    return out;
  };
  function unionRect(els){
    let r=null;
    els.forEach(e=>{const b=e.getBoundingClientRect();if(b.width<1&&b.height<1)return;
      r=r?{l:Math.min(r.l,b.left),t:Math.min(r.t,b.top),r:Math.max(r.r,b.right),b:Math.max(r.b,b.bottom)}:{l:b.left,t:b.top,r:b.right,b:b.bottom}});
    return r;
  }

  /* ---------- the steps ---------- */
  const S=[
    {title:'ברוך הבא ל־FitPro 👋',text:'זה סיור קצר באפליקציה האמיתית. אני אסמן כל פעם כפתור או אזור, ואפשר ללחוץ ולנסות. אפשר לדלג בכל רגע, ולחזור לסיור מההגדרות.',view:'today'},
    {title:'הימים שלך',text:'הפס הזה הוא השבוע. לוחצים על יום כדי לעבור אליו, לראות מה אכלת ולהוסיף או לתקן אוכל גם בדיעבד.',view:'today',t:'#dateStrip'},
    {title:'כמה נשאר לך היום',text:'הטבעת מראה כמה קלוריות נשארו לפי היעד שהגדרת, ומתחתיה חלבון, פחמימות ושומן. מה שאוכלים מתמלא כאן בעצמו.',view:'today',t:'#calRing'},
    {title:'מוסיפים אוכל',text:'זה הכפתור שתשתמש בו הכי הרבה.',hint:'לחץ עליו עכשיו, באמת',view:'today',t:'.quick-row .btn',click:true},
    {title:'כותבים כמו שמדברים',text:'כותבים מה אכלת בשפה חופשית, למשל: ״2 ביצים, קוטג׳ 5%, פרוסת לחם״. כשיש כמה פריטים מופרדים בפסיקים יופיע כפתור ✨ שמפרק ומוסיף את כולם בבת אחת.',hint:'נסה לכתוב משהו',view:'add',t:['#foodQuery',"button[onclick='searchFood()']"]},
    {title:'כלי AI למקרים קשים',text:'מנה שאין במאגר, כמו מסעדה או אוכל ביתי? ה־AI מעריך לפי תיאור, או שמצלמים את הצלחת והוא מזהה ומעריך. זה כלי בתשלום קטן, ולכן משתמשים בו כשהמאגר לא מספיק.',view:'add',t:["button[onclick='estimateWithOpenAI()']","button[onclick*='mealPhotoFile']"]},
    {title:'מוצר ארוז? ברקוד',text:'סורקים את הברקוד עם המצלמה, או מצלמים אותו, או מקלידים את המספר, והערכים התזונתיים מגיעים לבד.',view:'add',t:()=>byText('#add summary',/ברקוד/),open:true},
    {title:'הזנה ידנית',text:'יש לך ערכים מהאריזה או מהדיאטנית? כאן מזינים בעצמך שם, כמות, קלוריות וחלבון, ואפשר גם לתקן ערכים של מזון שנמצא.',view:'add',t:()=>byText('#add summary',/הזנה ידנית/)},
    {title:'ספריית הארוחות',text:'ארוחות שאתה אוכל שוב ושוב נשמרות כאן: פעם אחת בונים, ואחר כך לחיצה אחת מוסיפה את כל הארוחה ליום.',hint:'״＋ צור ארוחה חדשה״ בונה ארוחה משלך',view:'meals',t:["button[onclick='openCustomMealBuilder()']",'#mealTabs']},
    {title:'יומן התזונה',text:'כל הימים שעברו במקום אחד: ממוצעי קלוריות וחלבון, וסינון לפי שבוע, חודש או תאריכים, כדי לראות מגמות ולא רק יום בודד.',view:'history',t:['#nutritionPeriod','#nutritionJournalSummary']},
    {title:'קיצורי דרך',text:'לדברים קבועים כמו שייק חלבון יש קיצורים. לוחצים על ״＋ נוספים״ ורואים אותם.',hint:'לחץ עליו עכשיו',view:'today',t:()=>byText('.quick-row .btn',/נוספים/),click:true},
    {title:'לחיצה אחת והוא ביומן',text:'כאן מופיעים הקיצורים שלך. לחיצה על קיצור מוסיפה אותו ליום מיד, בלי חיפוש ובלי הקלדה.',view:'today',extras:true,t:'#extrasPanel'},
    {title:'יוצרים קיצור משלך',text:'בהגדרות מוסיפים קיצור: שם (למשל ״שייק חלבון״), קלוריות, חלבון, פחמימות ושומן. מכאן הוא מופיע ברשימת ״＋ נוספים״ לתמיד.',view:'settings',open:true,t:['#quickName','#quickCalories','#quickProtein']},
    {title:'כפתור הפלוס',text:'הכפתור הצף ״＋״ זמין מכל מסך. הוא פותח את כל הפעולות המהירות.',view:'today',t:'#plusFab',click:true,optional:true},
    {title:'מה יש בתפריט הפלוס',text:'צילום ארוחה, עדכון משקל, רישום אימון, אירוע או יום חופשי, יומן אירועים, צ׳ק־אין שבועי ועוד. אפשר לבחור ולסדר מה מופיע בהגדרות ← ״כפתור הפלוס״.',view:'today',plus:true,t:'#plusList'},
    {title:'יומן ואירועים',text:'הכפתור הזה בראש המסך פותח את היומן.',hint:'לחץ עליו עכשיו',view:'today',t:'#hdrCal',click:true},
    {title:'אירוע שהתזונה מתאימה סביבו',text:'לוחצים על יום, בוחרים סוג אירוע (חתונה, חופשה, ארוחה גדולה…) ונותנים לו שם. האפליקציה מפזרת את הקלוריות בימים שלפני ואחרי. ״שמור והוסף ליומן שלי״ שומר גם ביומן של הטלפון. אפשר גם לחבר יומן מהטלפון, בהגדרות, ואירועים ייכנסו לבד.',view:'today',cal:true,t:()=>{const s=$('calendarSheet');return s&&(s.querySelector('.sheet')||s.firstElementChild)}},
    {title:'אימונים',text:'בוחרים סוג אימון (דחיפה, משיכה, רגליים…), מקום וציוד, ולוחצים ״התחל אימון״. בזמן האימון רושמים משקל וחזרות לכל סט, יש טיימר מנוחה, והכול נשמר.',view:'workoutHome',t:'#startWorkoutCard',small:true},
    {title:'האימונים שלי ויומן אימונים',text:'״האימונים שלי״ הם תוכניות מוכנות שאפשר לבנות ולערוך בעצמך. ״יומן אימונים״ מראה מה עשית ואיך התקדמת במשקלים.',view:'workoutHome',t:["button[onclick=\"showView('workoutLibrary')\"]","button[onclick=\"showView('workoutDiary')\"]"]},
    {title:'צ׳ק־אין שבועי',text:'פעם בשבוע: שוקלים, מודדים היקפים, מצלמים תמונות ורושמים סיכום קצר. זה לוקח כ־3 דקות, והוא מה שמראה אם אתה באמת מתקדם, גם כשהמשקל עומד במקום.',hint:'אפשר ללחוץ ולנסות, וגם לסגור',view:'process',t:"#process button[onclick='openCheckin()']"},
    {title:'תמונות התקדמות',text:'שלוש תמונות: חזית, צד וגב. הסוד להשוואה אמיתית: אותה תאורה, אותו מרחק, אותה שעה ואותו לבוש. כפתור המצלמה מצלם או בוחר מהגלריה.',view:'process',t:['#photoCard']},
    {title:'משקל והיקפים',text:'כאן רושמים משקל והיקפים: מותן, זרוע, חזה וירך, ואפילו תחושת נפיחות. היקפים חשובים כי שריר עולה בזמן ששומן יורד, והמשקל לבד לא תמיד מספר את זה.',view:'process',t:['#processWeight','#processWaist','#processArm','#processChest','#processThigh']},
    {title:'מגמות והשוואות',text:'כל המדידות הופכות כאן להשוואות: מה השתנה בשבוע, בחודש ובסך הכול.',view:'process',t:'#processTrends'},
    {title:'התראות',text:'כאן מפעילים התראות לטלפון, כמו תזכורת לאירוע. באייפון קודם מוסיפים את FitPro למסך הבית ופותחים משם.',view:'settings',t:'#notificationSettings'},
    {title:'חיבור יומן הטלפון',text:'מדביקים קישור ליומן אחד (למשל מ־iCloud או Google) ואירועים מהיומן נכנסים לבד לאפליקציה, בלי להקליד אותם פעמיים.',view:'settings',t:()=>det(/חיבור יומן/)},
    {title:'יעדים ופרטים',text:'אפשר בכל רגע לעדכן יעד קלוריות וחלבון, או להריץ שוב את השאלון עם משקל ונתונים חדשים.',view:'settings',t:()=>det(/יעדים/)},
    {title:'שמירה וגיבוי',text:'הכול נשמר בענן ומסתנכרן בין המכשירים שלך. ״גיבוי וייצוא״ מוריד הכול לקובץ Excel.',view:'settings',t:()=>det(/גיבוי/)},
    {title:'חוזרים לסיור מתי שרוצים',text:'הכפתור הזה מריץ את ההדרכה מחדש.',view:'settings',t:'#tourRerun'},
    {title:'זהו, אתה מוכן! 🎉',text:'התחל ברישום הארוחה הראשונה שלך. כל מה שהראיתי זמין תמיד, וההדרכה מחכה לך בהגדרות.',view:'today',last:true}
  ];

  /* ---------- engine ---------- */
  let T=null;
  function ensureRoot(){
    if(T&&T.root)return;
    const root=document.createElement('div');root.id='fpTour';
    root.innerHTML='<div class="tb"></div><div class="tb"></div><div class="tb"></div><div class="tb"></div><div class="tr"></div><div class="tc" role="dialog" aria-live="polite"></div>';
    document.body.appendChild(root);
    T.root=root;T.bl=[...root.querySelectorAll('.tb')];T.ring=root.querySelector('.tr');T.card=root.querySelector('.tc');
  }
  function paintCard(){
    const s=S[T.i],last=T.i===S.length-1;
    T.card.innerHTML=`<div class="tcount">${T.i+1} מתוך ${S.length}</div><div class="tbar"><i style="width:${Math.round((T.i+1)/S.length*100)}%"></i></div><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p>${s.hint?`<div class="hint">👆 ${esc(s.hint)}</div>`:''}<div class="tn">${T.i>0?'<button class="pv" data-a="prev">הקודם</button>':''}<button class="nx" data-a="next">${last?'סיום':T.i===0?'בוא נתחיל':'הבא'}</button></div>${last?'':'<button class="tskip" data-a="skip">דלג על ההדרכה</button>'}`;
  }
  function place(){
    if(!T||!T.root)return;
    const s=S[T.i],els=T.els||[],r=els.length?unionRect(els):null,vw=innerWidth,vh=innerHeight,card=T.card;
    const key=r?[r.l,r.t,r.r,r.b,vw,vh,card.offsetHeight].map(Math.round).join():'none'+vw+vh+card.offsetHeight;
    if(key===T.key)return;T.key=key;
    const set=(el,l,t,w,h)=>{el.style.left=l+'px';el.style.top=t+'px';el.style.width=Math.max(0,w)+'px';el.style.height=Math.max(0,h)+'px'};
    const ch=card.offsetHeight,gap=14;
    if(!r){
      set(T.bl[0],0,0,vw,vh);[1,2,3].forEach(k=>set(T.bl[k],0,0,0,0));T.ring.style.display='none';
      card.style.top=Math.max(12,(vh-ch)/2)+'px';return;
    }
    const pad=6,L=Math.max(0,r.l-pad),Tp=Math.max(0,r.t-pad),R=Math.min(vw,r.r+pad),B=Math.min(vh,r.b+pad);
    set(T.bl[0],0,0,vw,Tp);set(T.bl[1],0,B,vw,vh-B);set(T.bl[2],0,Tp,L,B-Tp);set(T.bl[3],R,Tp,vw-R,B-Tp);
    T.ring.style.display='block';set(T.ring,L,Tp,R-L,B-Tp);
    const below=vh-B,above=Tp;let top;
    if(below>=ch+gap)top=B+gap;else if(above>=ch+gap)top=Tp-ch-gap;
    else top=below>above?Math.min(vh-ch-12,B+gap):Math.max(12,Tp-ch-gap);
    card.style.top=Math.max(8,Math.min(vh-ch-8,top))+'px';
  }
  async function enter(i){
    if(!T)return;T.i=i;const s=S[i];T.key='';resetUI();T.els=[];
    try{if(s.view){showView(s.view)}}catch(_){}
    if(s.extras){const p=$('extrasPanel');if(p)p.style.display='block'}
    if(s.plus){try{openPlusMenu()}catch(_){}}
    if(s.cal){try{openCalendar()}catch(_){}}
    ensureRoot();paintCard();
    /* wait (up to ~2.5 s) for the target to exist and be visible */
    let els=[];
    for(let n=0;n<16;n++){
      if(!T||T.i!==i)return;
      if(!s.t){break}
      if(s.open)allEls(s.t).forEach(openAncestors);
      els=allEls(s.t).filter(e=>{const b=e.getBoundingClientRect();return b.width>0&&b.height>0});
      if(els.length)break;await new Promise(r=>setTimeout(r,160));
    }
    if(!T||T.i!==i)return;
    if(s.open)els.forEach(openAncestors);
    if(els.length){
      const b=unionRect(els);
      if(b&&(b.t<60||b.b>innerHeight-90)){els[0].scrollIntoView({block:'center',behavior:'instant'})}
      await new Promise(r=>setTimeout(r,60));
      els=s.t?allEls(s.t).filter(e=>{const b=e.getBoundingClientRect();return b.width>0&&b.height>0}):[];
    }
    T.els=els;paintCard();place();
  }
  function go(i){
    if(!T)return;
    if(i>=S.length)return finish(true);
    if(i<0)i=0;enter(i);
  }
  function onClickCapture(e){
    if(!T||!T.els||!T.els.length)return;const s=S[T.i];if(!s.click)return;
    if(T.els.some(x=>x.contains(e.target))){const at=T.i;setTimeout(()=>{if(T&&T.i===at)go(at+1)},450)}
  }
  function onCardClick(e){
    const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a;
    if(a==='next')go(T.i+1);else if(a==='prev')go(T.i-1);else if(a==='skip')finish(false);
  }
  function startTour(){
    if(T)return;
    T={i:0,els:[],key:''};ensureRoot();
    T.card.addEventListener('click',onCardClick);
    document.addEventListener('click',onClickCapture,true);
    T.timer=setInterval(()=>{
      if(!T)return;const s=S[T.i];
      if(s.t&&(!T.els||!T.els.length)){const els=allEls(s.t).filter(e=>{const b=e.getBoundingClientRect();return b.width>0&&b.height>0});if(els.length){T.els=els;T.key=''}}
      place();
    },180);
    addEventListener('resize',place);
    enter(0);
  }
  function finish(completed){
    if(!T)return;
    clearInterval(T.timer);document.removeEventListener('click',onClickCapture,true);removeEventListener('resize',place);
    if(T.root)T.root.remove();T=null;resetUI();
    try{showView('today')}catch(_){}
    setProp('TOUR_DONE','1');
    try{toast(completed?'ההדרכה הסתיימה. היא תמיד זמינה בהגדרות':'אפשר לחזור להדרכה בהגדרות')}catch(_){}
  }

  /* ---------- welcome (name) → questionnaire ---------- */
  function welcome(){
    if($('fpWelcome'))return;
    const w=document.createElement('div');w.id='fpWelcome';
    w.innerHTML=`<div class="w"><h1>ברוך הבא ל־FitPro 👋</h1><p>נתחיל בהיכרות קצרה: איך קוראים לך? אחר כך כמה שאלות להתאמת היעדים, ואז סיור קצר באפליקציה.</p><input id="fpName" maxlength="40" autocomplete="given-name" placeholder="השם שלך"><div class="e" id="fpNameErr"></div><button id="fpNameGo">המשך</button></div>`;
    document.body.appendChild(w);
    const go=async()=>{
      const name=$('fpName').value.trim();
      if(!name||name.length>40){$('fpNameErr').textContent='כתוב שם עד 40 תווים';return}
      $('fpNameGo').disabled=true;
      try{state.data=await call('saveSettings',{display_name:name});renderPersonalHeader();saveCachedState();try{FP2.register&&FP2.register(name)}catch(_){}}
      catch(e){$('fpNameErr').textContent=e.message||'שגיאה';$('fpNameGo').disabled=false;return}
      w.remove();beginQuestionnaire(name);
    };
    $('fpNameGo').onclick=go;$('fpName').addEventListener('keydown',e=>{if(e.key==='Enter')go()});
    setTimeout(()=>{try{$('fpName').focus()}catch(_){}},200);
  }
  function beginQuestionnaire(name){
    openOnboarding(true);
    /* a brand-new account: calculate targets, don't carry over the 2200 default */
    state.onb.preserveExisting=false;
    Object.assign(state.onb.d,{name:name||state.onb.d.name,targetMode:'calculated',manualCalories:'',manualProtein:''});
    renderOnb();
  }
  const fo=window.finishOnboarding;
  window.finishOnboarding=async function(){
    const r=await fo.apply(this,arguments);
    try{
      const sheet=$('onbSheet');
      if(sheet&&sheet.classList.contains('hide')&&prop('NEW_ACCOUNT')==='1'&&prop('TOUR_DONE')!=='1')setTimeout(startTour,600);
    }catch(_){}
    return r;
  };

  /* ---------- settings button + boot ---------- */
  function ensureButton(){
    const v=$('settings');if(!v||$('tourRerun'))return;
    const b=document.createElement('button');b.id='tourRerun';b.className='btn secondary full';b.style.margin='6px 0 12px';
    b.textContent='🎓 הדרכה מחדש — סיור באפליקציה';
    b.onclick=()=>{try{showView('today')}catch(_){}startTour()};
    const h=v.querySelector('h2');(h||v.firstChild).insertAdjacentElement(h?'afterend':'beforebegin',b);
  }
  window.FP2Tour={start:startTour,welcome};
  let booted=false;
  const poll=setInterval(()=>{
    if(!(typeof state!=='undefined'&&state.data&&window.FP2&&FP2.getProp&&typeof call==='function'))return;
    ensureButton();
    if(booted)return;
    try{FP2.getProp('X')}catch(_){return}
    booted=true;
    try{FP2.register&&FP2.register((state.data.settings||{}).display_name||'')}catch(_){}
    if(prop('NEW_ACCOUNT')==='1'&&prop('TOUR_DONE')!=='1'){
      const hasName=!!String((state.data.settings||{}).display_name||'').trim();
      if(!hasName)welcome();
      else if(!getProfile())beginQuestionnaire(state.data.settings.display_name);
      else setTimeout(startTour,800);
    }
  },400);
  setInterval(ensureButton,2500);
})();
