/* FitPro 2.14.0 — setup:
   - questionnaire order: details (+BMI) → goal → activity & training (+type) → workout length → meals → summary with
     the short settings: calendars (several), holidays (several), Shabbat.
   - settings "היעד והאירועים": how much the goal may move after yesterday (or off), how much to save before an event.
   - the first day: no "יש לך אירוע השבוע?". */
(function(){
'use strict';
const LS={get(k){try{return localStorage.getItem(k)}catch(_){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(_){}}};
const ORDER=[0,2,1,4,3,5];
/* 2.17: the bar with "חזרה / המשך" had a dark box behind it; now it fades into the screen */
document.head.insertAdjacentHTML('beforeend','<style>.onboarding-screen .onb-nav,#onbNav{background:transparent!important;box-shadow:none!important;border:0!important;backdrop-filter:none!important}#onbNav button:not(:last-child),#onbNav .btn.light,#onbNav .btn.secondary{border:1.5px solid var(--brand,#D7F36B)!important;background:var(--bg2,#1A2027)!important;color:var(--brand,#D7F36B)!important;border-radius:14px}</style>');
const LABELS={0:'פרטים',1:'פעילות',2:'מטרה',3:'ארוחות',4:'אימונים',5:'סיכום'};
const pos=s=>Math.max(0,ORDER.indexOf(s));

if(typeof onbNext==='function'){
  onbNext=function(){if(state.onb.saving)return;const st=state.onb.step,err=onbValid(st);if(err)return onbError(err);const p=pos(st);state.onb.step=ORDER[Math.min(ORDER.length-1,p+1)];renderOnb();try{$('onbBody').scrollTop=0}catch(_){}};
  onbBack=function(){if(state.onb.saving)return;const p=pos(state.onb.step);if(p>0){state.onb.step=ORDER[p-1];renderOnb();try{$('onbBody').scrollTop=0}catch(_){}}};
}
const TT={strength:'כוח',cardio:'אירובי',mixed:'משולב'};/* ריצה: when there are running plans */
const TTN={strength:'אימון כוח',cardio:'אימון אירובי',mixed:'אימון משולב',run:'ריצה'};
/* 2.18: what each length gives you, and what is recommended */
const DUR={strength:{30:'3–4 תרגילים, 2–3 סטים. מספיק כדי לשמור ולהתקדם בהתחלה, אבל פחות נפח בשבוע. טוב לימים עמוסים.',40:'4–5 תרגילים, 3 סטים לכל אחד. נפח טוב לבניית שריר לרוב האנשים.',50:'5–6 תרגילים, 3–4 סטים, ויותר מנוחה בין סטים כבדים. הכי הרבה נפח, טוב למתקדמים או למי שמתאמן מעט פעמים בשבוע.'},
  cardio:{30:'הליכה מהירה, אופניים או אליפטיקל בקצב שאפשר לדבר בו. מספיק לבריאות הלב.',40:'יותר זמן באותו קצב: יותר שריפה ויותר סיבולת.',50:'אימון סיבולת ארוך. הכי הרבה שריפה, אבל דורש יותר התאוששות.'},
  mixed:{30:'כ-20 דקות כוח ו-10 דקות אירובי. בסיס טוב כשאין זמן.',40:'כ-30 דקות כוח ו-10 אירובי. איזון טוב בין שריר לכושר.',50:'כ-35 דקות כוח ו-15 אירובי. הכי שלם, אבל ארוך.'}};
function durRec(k,d){const days=Number(d.days)||3;if(k==='strength')return days>=4?40:50;if(k==='cardio')return 30;return 40}
window.fpOnbTT=function(k){const d=state.onb.d,a=d.trainTypes||(d.trainTypes=[]);const i=a.indexOf(k);if(i>=0){if(a.length>1)a.splice(i,1)}else a.push(k);d.trainType=a.join(',');const e=$('fpOnbType');if(e)e.remove();renderOnb()};
window.fpOnbDur=function(k,v){const d=state.onb.d;d.durs=d.durs||{};d.durs[k]=v;const e=$('fpOnbDur');if(e)e.remove();renderOnb()};
const CALS={apple:'אפל (iCloud)',google:'Google Calendar',other:'סמסונג / Outlook / אחר'};
const HOLS={jewish:'יהודיים',muslim:'מוסלמיים',christian:'נוצריים',civil:'לועזיים'};
function bmi(d){const h=Number(d.height)/100,w=Number(d.weight);if(!(h>1&&w>20))return '';const b=w/(h*h);const t=b<18.5?'מתחת לתקין':b<25?'תקין':b<30?'מעל התקין':'גבוה';return `BMI: <b>${b.toFixed(1)}</b> · ${t}`}
if(typeof renderOnb==='function'){
  const o=renderOnb;
  renderOnb=function(){
    const r=o.apply(this,arguments);
    try{const O=state.onb;if(!O)return r;const d=O.d,st=O.step,p=pos(st);
      /* progress in the new order */
      const pr=$('onbProgress');if(pr)pr.innerHTML=ORDER.map((s,i)=>`<span class="${i===p?'on':i<p?'done':''}" ${i===p?'aria-current="step"':''}>${LABELS[s]}</span>`).join('');
      const sc=$('onbStepCount');if(sc)sc.textContent=`שלב ${p+1} מתוך ${ORDER.length}`;
      const nav=$('onbNav');if(nav&&st!==5){const b=[...nav.querySelectorAll('button')].pop();if(b&&!O.saving){b.textContent='המשך';b.setAttribute('onclick','onbNext()')}}
      const fs=$('onbBody')&&$('onbBody').querySelector('fieldset');if(!fs)return r;
      if(st===0&&!$('fpBmi')){const f=fs.querySelector('.onb-fields');if(f){f.insertAdjacentHTML('afterend',`<p id="fpBmi" class="muted" style="margin:8px 0 0">${bmi(d)}</p>`);
        ['onb-height','onb-weight'].forEach(id=>{const i=$(id);if(i)i.addEventListener('input',()=>{const e=$('fpBmi');if(e)e.innerHTML=bmi(state.onb.d)})})}}
      if(st===1&&!$('fpOnbType')){if(!Array.isArray(d.trainTypes))d.trainTypes=d.trainType?String(d.trainType).split(',').filter(k=>TT[k]):['strength'];d.trainType=d.trainTypes.join(',');const panel=fs.querySelector('.onb-panel');
        if(panel)panel.insertAdjacentHTML('beforeend',`<div class="field" id="fpOnbType"><label>איזה סוג אימון? (אפשר כמה)</label><div class="onb-options">${Object.keys(TT).map(k=>`<button type="button" class="onb-choice ${d.trainTypes.indexOf(k)>=0?'selected':''}" aria-pressed="${d.trainTypes.indexOf(k)>=0}" onclick="fpOnbTT('${k}')">${TT[k]}</button>`).join('')}</div></div>`)}
      /* 2.17: how long, for each kind of training you chose, and what that means */
      if(st===4&&!$('fpOnbDur')){const types=(Array.isArray(d.trainTypes)&&d.trainTypes.length?d.trainTypes:['strength']);d.durs=d.durs||{};types.forEach(k=>{if(![30,40,50].includes(Number(d.durs[k])))d.durs[k]=durRec(k,d)});
        const main=types.indexOf('strength')>=0?'strength':types.indexOf('mixed')>=0?'mixed':types[0];d.duration=d.durs[main];
        const panel=fs.querySelector('.onb-panel');if(panel){const lab=panel.querySelector(':scope > label'),opts=panel.querySelector(':scope > .onb-options');if(lab)lab.style.display='none';if(opts)opts.style.display='none';
          panel.querySelectorAll('.onb-info').forEach(x=>x.style.display='none');
          const h=fs.querySelector('h2'),pi=fs.querySelector('.onb-intro');if(h)h.textContent='כמה זמן יש לך לאימון?';if(pi)pi.textContent='בחר, ותראה מה מקבלים בכל אורך.';
          panel.insertAdjacentHTML('afterbegin',`<div id="fpOnbDur">${types.map(k=>{const rec=durRec(k,d);return `<div class="field"><label>כמה זמן ${TTN[k]}?</label><div class="onb-options">${[30,40,50].map(v=>`<button type="button" class="onb-choice ${Number(d.durs[k])===v?'selected':''}" onclick="fpOnbDur('${k}',${v})">${v} דקות${v===rec?' · מומלץ':''}</button>`).join('')}</div><p style="font-size:13.5px;margin:6px 0 0">${DUR[k][d.durs[k]]||''}</p><p class="muted" style="font-size:12.5px;margin:4px 0 0">מומלץ לך: ${rec} דקות${k==='strength'?` (לפי ${Number(d.days)||3} אימונים בשבוע)`:''}.</p></div>`}).join('')}</div>`)}}
      if(st===5&&!$('fpOnbSet')){
        if(!Array.isArray(d.calKinds)){let k=[];try{k=JSON.parse(LS.get('fp2.calKinds')||'[]')}catch(_){}if(!k.length&&d.calKind)k=[d.calKind];d.calKinds=k.length?k:[/iPhone|iPad|Mac/.test(navigator.userAgent)?'apple':'google']}
        if(!Array.isArray(d.hol))d.hol=['jewish'];if(d.shab===undefined)d.shab=null;if(!Array.isArray(d.shabPick))d.shabPick=['fri','satB'];
        const multi=(key,map,arr)=>`<div class="onb-options">${Object.keys(map).map(k=>`<button type="button" class="onb-choice ${arr.indexOf(k)>=0?'selected':''}" aria-pressed="${arr.indexOf(k)>=0}" onclick="fpOnbMulti('${key}','${k}')">${map[k]}</button>`).join('')}</div>`;
        fs.insertAdjacentHTML('afterbegin',`<div class="onb-panel" id="fpOnbSet"><b style="display:block;margin-bottom:8px">עוד 3 שאלות קצרות</b>
          <div class="field"><label>באיזה יומן אתה משתמש בטלפון? (אפשר כמה)</label>${multi('calKinds',CALS,d.calKinds)}<p class="muted" style="font-size:12px;margin:4px 0 0">אירועים כמו מסעדות וחתונות עוברים בין היומן לאפליקציה.</p></div>
          <div class="field"><label>אילו חגים לחגוג באפליקציה? (אפשר כמה)</label>${multi('hol',HOLS,d.hol)}<p class="muted" style="font-size:12px;margin:4px 0 0">שבוע לפני חג תישאל אם לשמור לו קלוריות.</p></div>
          <div class="field"><label>שהאפליקציה תלמד כמה אתה אוכל בשבת ותמלא את זה לבד?</label><p class="muted" style="font-size:12.5px;margin:0 0 6px">האפליקציה עוקבת כמה קלוריות אתה אוכל בארוחות שבת. אחרי כמה שבועות היא יודעת את הממוצע, ויכולה למלא את זה לבד ולחסוך לזה במהלך השבוע.</p>${chipRow('shab',[[true,'כן'],[false,'לא צריך']])}
            ${d.shab===true?`<label style="display:block;margin-top:10px">אילו ארוחות?</label><div class="onb-options">${[['friD','שישי'],['fri','ערב שבת'],['satB','שבת בוקר'],['satL','שבת צהריים']].map(([k,l])=>`<button type="button" class="onb-choice ${d.shabPick.indexOf(k)>=0?'selected':''}" aria-pressed="${d.shabPick.indexOf(k)>=0}" onclick="fpOnbMulti('shabPick','${k}')">${l}</button>`).join('')}</div>`:''}</div></div>`);
      }
    }catch(e){console.error(e)}
    return r;
  };
}
window.fpOnbMulti=function(key,k){const d=state.onb.d,a=d[key]||(d[key]=[]);const i=a.indexOf(k);if(i>=0){if(a.length>1||key==='hol')a.splice(i,1)}else a.push(k);if(key==='calKinds')d.calKind=a[0]||'';const s=$('fpOnbSet');if(s)s.remove();renderOnb()};
if(typeof finishOnboarding==='function'){
  const o=finishOnboarding;
  finishOnboarding=async function(){
    const d=state.onb&&state.onb.d||{};if(Array.isArray(d.calKinds)&&d.calKinds.length)d.calKind=d.calKinds[0];
    const kinds=d.calKinds,shab=d.shab,shabPick=d.shabPick,durs=d.durs;
    const r=await o.apply(this,arguments);
    try{const sh=$('onbSheet');if(sh&&sh.classList.contains('hide')){
      if(Array.isArray(kinds))LS.set('fp2.calKinds',JSON.stringify(kinds));
      try{if(durs){const v=JSON.stringify(durs);LS.set('fp2.trainDurs',v);if(window.FP2&&FP2.setProp)FP2.setProp('TRAIN_DURS',v)}}catch(_){}
      if(shab===false)state.data=await call('saveSettings',{shabbat_json:JSON.stringify({asked:'onboarding-no'})});
      if(shab===true)state.data=await call('saveSettings',{shabbat_json:JSON.stringify({want:true,pick:Array.isArray(shabPick)&&shabPick.length?shabPick:['fri','satB']})});
      LS.set('fp2.firstDay',state.todayDate||state.date||'');
    }}catch(e){console.warn(e)}
    return r;
  };
}

/* several calendars: "add to my calendar" asks which one */
if(typeof addEventToPhoneCalendar==='function'){
  const o=addEventToPhoneCalendar;
  addEventToPhoneCalendar=function(){let k=[];try{k=JSON.parse(LS.get('fp2.calKinds')||'[]')}catch(_){}
    if(k.length>1){const cur=LS.get('fp2.calKind');try{localStorage.removeItem('fp2.calKind')}catch(_){}const sv=state.data&&state.data.settings&&state.data.settings.calendar_kind;if(state.data&&state.data.settings)state.data.settings.calendar_kind='';
      const r=o.apply(this,arguments);if(cur)LS.set('fp2.calKind',cur);if(sv!==undefined&&state.data&&state.data.settings)state.data.settings.calendar_kind=sv;return r}
    return o.apply(this,arguments)};
}

/* ---------- the first day: no weekly event question ---------- */
const today=()=>state.todayDate||(state.data&&state.data.date)||'';
if(typeof showWeeklyNotice==='function'){const o=showWeeklyNotice;showWeeklyNotice=function(force){if(document.getElementById('fpI'))return;if(!force&&LS.get('fp2.firstDay')&&LS.get('fp2.firstDay')===today())return;return o.apply(this,arguments)}}

/* ---------- settings: how the goal moves, and saving before an event ---------- */
function renderGoalSet(){
  const sec=$('settings');if(!sec||!state.data)return;let box=$('fpGoalSet');
  if(!box){box=document.createElement('details');box.className='settings-section';box.id='fpGoalSet';const a=$('fpWeekSet')||$('calendarSettings')||$('notificationSettings');if(a)a.insertAdjacentElement('beforebegin',box);else{const h=sec.querySelector('h2');if(!h)return;h.insertAdjacentElement('afterend',box)}}
  const open=box.open,c=bankCtx(),mx=Number(c.shiftMax)||15,cur=Number.isFinite(Number(c.shiftPct))?Number(c.shiftPct):mx;
  const shiftOpts=[...new Set([0,5,10,mx].filter(v=>v<=mx))];
  const range=c.saveRange||[10,15],saveOpts=[...new Set([range[0],Math.round((range[0]+range[1])/2),range[1]])],sp=c.saveOff?-1:(Number(c.savePct)||range[1]);
  box.innerHTML=`<summary>היעד והאירועים</summary><div class="settings-body">
    <label style="font-weight:700">היעד מתאזן לפי אתמול</label>
    <p class="muted" style="margin:2px 0 6px;font-size:13px">לא אכלת מספיק אתמול? היום מקבל את ההפרש. עברת? היום יורד. בחרת ${esc(c.goalName||'')}, אז ברירת המחדל היא עד ${mx}% ביום.</p>
    <p class="muted" style="margin:0 0 6px;font-size:13px"><b>למה ${mx}% מומלץ?</b> ${({gain:'במסה כל יום שחסר בו אוכל מאט את בניית השריר, אז מחזירים כמעט את כל ההפרש למחרת.',lose:'בחיטוב מספיק 10% כדי לאזן, בלי יום ענק שמקשה לשמור על הגירעון.',recomp:'בשמירה על שריר וירידה בשומן רוצים יציבות: מאזנים, אבל בלי קפיצות גדולות.',maintain:'בשמירה רוצים יציבות: מאזנים, אבל בלי קפיצות גדולות.'})[c.goalType]||''}</p>
    <div class="meal-tabs" style="flex-wrap:wrap">${shiftOpts.map(v=>`<button type="button" class="chip${cur===v?' active':''}" onclick="fpSetShift(${v})">${v===0?'כבוי':`עד ${v}% · <bdi>${kc(Math.round((c.goal||2200)*v/1000)*10)}</bdi>`}${v===mx?' · מומלץ':''}</button>`).join('')}</div>
    <label style="font-weight:700;display:block;margin-top:14px">כמה לחסוך ביום לפני אירוע</label>
    <p class="muted" style="margin:2px 0 6px;font-size:13px">עד 4 ימים לפני אירוע, כל יום קצת פחות. מה שנחסך מחכה לך באירוע.</p>
    <p class="muted" style="margin:0 0 6px;font-size:13px"><b>למה ${range[1]}% מומלץ?</b> ${c.goalType==='lose'?'בחיטוב אתה כבר בגירעון. יותר מזה ביום פוגע באנרגיה ובאימונים.':'זה מספיק כדי לשמור לאירוע כמה מאות קלוריות, בלי ימים רעבים לפניו.'}</p>
    <div class="meal-tabs" style="flex-wrap:wrap"><button type="button" class="chip${c.saveOff?' active':''}" onclick="fpSetSavePct(0).then(()=>fpGoalSetRender())">כבוי</button>${saveOpts.map(v=>`<button type="button" class="chip${sp===v?' active':''}" onclick="fpSetSavePct(${v}).then(()=>fpGoalSetRender())">${v}% · <bdi>${kc(Math.round((c.goal||2200)*v/1000)*10)}</bdi> קל׳${v===range[1]?' · מומלץ':''}</button>`).join('')}</div>
  </div>`;box.open=open;
}
window.fpGoalSetRender=()=>{try{renderGoalSet()}catch(_){}};
window.fpSetShift=async v=>{try{state.data=await call('saveSettings',{shift_pct:v});renderGoalSet();toast(v===0?'היעד לא ישתנה לפי אתמול':'היעד יזוז עד '+v+'% ביום');try{const d=await call('getDayView',state.date);applyDay(d);renderDay()}catch(_){}}catch(e){toast(e.message,true)}};
function logoutBtn(){const sec=$('settings');if(!sec||$('fpLogout'))return;sec.insertAdjacentHTML('beforeend','<button type="button" class="btn light full" id="fpLogout" style="margin-top:16px" onclick="fpLogout()">התנתק / כניסה למשתמש אחר</button>')}
window.fpLogout=function(){if(window.FP2Logout)return FP2Logout();const b=$('fp2Out');if(b){b.click();return}try{if(typeof logoutApp==='function')return logoutApp()}catch(_){}toast('אין כאן חשבון להתנתק ממנו',true)};
if(typeof renderSettings==='function'){const o=renderSettings;renderSettings=function(){const r=o.apply(this,arguments);try{renderGoalSet()}catch(e){console.error(e)}try{logoutBtn()}catch(_){}return r}}
})();
