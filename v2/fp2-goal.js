/* FitPro 2.8.0 — change the goal without the whole questionnaire.
   Pick a goal → read what it means → choose the pace → confirm. The numbers are recalculated from the saved profile
   (age, height, activity) with the latest weigh-in. */
(function(){
'use strict';
if(typeof calculateTargets_!=='function'||typeof getProfile!=='function')return;

const GOALS={
  gain:{icon:'💪',title:'מסה נקייה',short:'לעלות במשקל בעיקר משריר',
    what:'אוכלים קצת יותר ממה שהגוף שורף (3–8%), כדי שיהיה לגוף חומר לבנות שריר.',
    how:'עודף קטן = רוב העלייה היא שריר, עם מעט שומן. עודף גדול לא בונה יותר שריר, רק מוסיף שומן.',
    expect:'עלייה איטית במשקל. הקוביות יכולות להתרכך קצת, אבל לא להיעלם. כדאי למדוד היקף טבור פעם בשבוע.',
    must:'אימוני כוח עם התקדמות (להעלות משקל או חזרות), וחלבון כל יום.'},
  lose:{icon:'🔥',title:'חיטוב',short:'להוריד שומן',
    what:'אוכלים פחות ממה שהגוף שורף (10–20%), כדי שהגוף ישתמש בשומן.',
    how:'חלבון גבוה ואימוני כוח שומרים על השריר בזמן שהשומן יורד.',
    expect:'ירידה במשקל ובהיקף הטבור. המשקל קופץ מיום ליום, אז מסתכלים על הממוצע.',
    must:'לא לרדת מהר מדי. אפשר להיות קצת רעב, אבל לא להרעיב את עצמך.'},
  recomp:{icon:'⚖️',title:'שריר + ירידה בשומן',short:'לבנות שריר ולהוריד שומן, בלי שהמשקל יזוז הרבה',
    what:'אוכלים טיפה מתחת למה שהגוף שורף (2–8%). המשקל כמעט לא זז, אבל הגוף משתנה.',
    how:'מתאים במיוחד למי שמתחיל להתאמן או חוזר אחרי הפסקה.',
    expect:'תהליך איטי. מסתכלים על היקף טבור, כוח באימונים ומראה, לא רק על המשקל.',
    must:'אימוני כוח קבועים וחלבון גבוה.'},
  maintain:{icon:'🧘',title:'שמירה',short:'להישאר באותו משקל',
    what:'אוכלים בערך מה שהגוף שורף.',how:'המשקל נשאר יציב, ושומרים על הכושר.',
    expect:'משקל יציב, עם תנודות קטנות מיום ליום.',must:'להמשיך להתאמן ולאכול מספיק חלבון.'}
};
const ORDER=['gain','lose','recomp','maintain'];
const RATES=[['slow','איטי'],['normal','מתון'],['fast','מהיר']];

function latestWeight(){try{const h=(state.data&&state.data.history)||[];for(let i=h.length-1;i>=0;i--){const w=Number(h[i]&&h[i].weight);if(w>0)return w}}catch(_){}return 0}
const perMonth=t=>{const m=Math.round(t.weeklyChange*4.3*10)/10;return Math.abs(m)<0.05?'המשקל נשאר יציב':(m>0?'עלייה של כ-':'ירידה של כ-')+Math.abs(m).toFixed(1)+' ק״ג בחודש'};
function targets(g){const p=getProfile()||{},d=Object.assign({},p,{goal:g.goal,rate:g.rate,weight:g.weight||p.weight,adj:0,adjP:0});try{return calculateTargets_(d)}catch(e){return null}}

window.openGoalSheet=function(){
  try{closePlusMenu()}catch(_){}
  const p=getProfile();
  if(!p||!p.sex||!p.age||!p.height){openOnboarding(false);return}
  state.goalDraft={step:'pick',goal:p.goal||'recomp',rate:p.rate||'normal',weight:latestWeight()||Number(p.weight)||0};
  let el=$('fpGoalSheet');if(el)el.remove();
  document.body.insertAdjacentHTML('beforeend','<div class="overlay" id="fpGoalSheet"><div class="sheet" id="fpGoalBody"></div></div>');
  renderGoal();
};
window.fpGoalClose=function(){const el=$('fpGoalSheet');if(el)el.remove();state.goalDraft=null};
window.fpGoalPick=function(g){const p=getProfile()||{};state.goalDraft.goal=g;state.goalDraft.keep=false;if(g===p.goal){const t=targets(state.goalDraft);state.goalDraft.keep=!!t&&(t.cal!==settingsNum('calorie_goal',2200)||t.prot!==settingsNum('protein_goal',130))}state.goalDraft.step='explain';renderGoal()};
window.fpGoalRate=function(r){state.goalDraft.rate=r;renderGoal()};
window.fpGoalKeep=function(v){state.goalDraft.keep=v;renderGoal()};
window.fpGoalBack=function(){state.goalDraft.step='pick';renderGoal()};
function renderGoal(){
  const g=state.goalDraft,body=$('fpGoalBody');if(!g||!body)return;
  const cur=getProfile()||{},curCal=settingsNum('calorie_goal',2200),curProt=settingsNum('protein_goal',130);
  if(g.step==='pick'){
    body.innerHTML=`<h3 style="margin:0 0 4px">מה המטרה שלך עכשיו?</h3><p class="muted" style="margin:0 0 10px">לא צריך למלא שוב גיל, גובה ופעילות. רק לבחור.</p>
      ${ORDER.map(k=>{const x=GOALS[k];return `<button type="button" class="remind-opt${cur.goal===k?' rec':''}" onclick="fpGoalPick('${k}')"><b>${x.icon} ${x.title}${cur.goal===k?' · עכשיו':''}</b><span>${x.short}</span></button>`}).join('')}
      <button type="button" class="btn light full" style="margin-top:10px" onclick="fpGoalClose()">סגור</button>`;
    return;
  }
  const x=GOALS[g.goal],t=targets(g);
  const rateChips=g.goal==='maintain'?'':`<div class="field"><label>באיזה קצב?</label><div class="meal-tabs" style="flex-wrap:wrap">${RATES.map(([r,l])=>{const tt=targets(Object.assign({},g,{rate:r}));return `<button type="button" class="chip${g.rate===r?' active':''}" onclick="fpGoalRate('${r}')">${l}${r==='normal'?' · מומלץ':''}${tt?` <small>(${perMonth(tt)})</small>`:''}</button>`}).join('')}</div></div>`;
  const safety=t&&t.safeOnly&&g.goal!=='gain'?`<p class="muted" style="color:var(--danger)">לפי הפרופיל שלך לא מורידים קלוריות (גיל, תת-משקל או מצב רפואי), אז היעד לא יורד מתחת למה שהגוף שורף.</p>`:'';
  body.innerHTML=`<button type="button" class="linkish muted" onclick="fpGoalBack()">→ חזרה</button>
    <h3 style="margin:6px 0 8px">${x.icon} ${x.title}</h3>
    <div class="ev-box"><div><b>מה זה:</b> ${x.what}</div><div><b>איך זה עובד:</b> ${x.how}</div><div><b>מה לצפות:</b> ${x.expect}</div><div><b>מה חשוב:</b> ${x.must}</div></div>
    ${rateChips}
    ${t?`<div class="card" style="margin-top:10px"><div class="bank-line"><span>קלוריות ביום</span><span><b>${kc(t.cal)}</b>${t.cal!==curCal?` <small class="muted">(עכשיו ${kc(curCal)})</small>`:''}</span></div>
      <div class="bank-line"><span>חלבון ביום</span><span><b>${t.prot} ג׳</b>${t.prot!==curProt?` <small class="muted">(עכשיו ${curProt})</small>`:''}</span></div>
      <div class="bank-line"><span>הגוף שורף בערך</span><span>${kc(t.tdee)} קל׳</span></div>
      <div class="bank-line"><span>צפי</span><span>${perMonth(t)}</span></div>
      <p class="muted" style="font-size:12px;margin:6px 0 0">לפי משקל ${g.weight?String(g.weight).replace(/\.0$/,''):cur.weight} ק״ג. אחרי שבועיים של רישום ושקילות, האפליקציה בודקת אם הקצב נכון ומציעה תיקון.</p></div>`:'<p class="muted">חסרים נתונים בפרופיל. עדכן אותם בשאלון המלא.</p>'}
    ${t&&(t.cal!==curCal||t.prot!==curProt)?`<div class="field" style="margin-top:10px"><label>אילו מספרים לשמור?</label><div class="meal-tabs" style="flex-wrap:wrap"><button type="button" class="chip${g.keep?'':' active'}" onclick="fpGoalKeep(false)">המחושבים (${kc(t.cal)} · ${t.prot} ג׳)</button><button type="button" class="chip${g.keep?' active':''}" onclick="fpGoalKeep(true)">להשאיר את שלי (${kc(curCal)} · ${curProt} ג׳)</button></div></div>`:''}
    ${safety}
    <button type="button" class="btn full" style="margin-top:12px" ${t?'':'disabled'} onclick="fpGoalSave()">מאשר, לעדכן את המטרה</button>
    <button type="button" class="btn light full" style="margin-top:8px" onclick="fpGoalClose()">ביטול</button>`;
}
window.fpGoalSave=async function(){
  const g=state.goalDraft,t=targets(g);if(!t)return;
  const p=Object.assign({},getProfile()||{});delete p.calculation;
  const profile=Object.assign(p,{name:(p.name||personalName()||'').trim()||'אני',goal:g.goal,rate:g.rate,weight:g.weight||p.weight,adj:0,adjP:0,targetMode:'calculated',updated:new Date().toISOString().slice(0,10)});
  if(!['gym','home','mixed'].includes(profile.place))profile.place='gym';
  if(![30,40,50].includes(Number(profile.duration)))profile.duration=40;
  const keep=!!g.keep,cal=keep?settingsNum('calorie_goal',2200):t.cal,prot=keep?settingsNum('protein_goal',130):t.prot;if(keep)profile.targetMode='manual';
  loading();
  try{state.data=await call('saveProfile',{profile,targetMode:keep?'manual':'calculated',calorie_goal:cal,protein_goal:prot,free_calories_goal:Math.round(cal*.1/10)*10});
    try{saveCachedState()}catch(_){}fpGoalClose();renderAll();toast(`המטרה עודכנה: ${GOALS[g.goal].title} · ${kc(cal)} קל׳ · ${prot} ג׳ חלבון`)}
  catch(e){toast(e.message,true)}finally{loading(false)}
};

/* the questionnaire: a short explanation under the goal choice */
if(typeof onbTargetPreview==='function'){
  const o=onbTargetPreview;
  onbTargetPreview=function(){const html=o.apply(this,arguments);try{const x=GOALS[state.onb.d.goal];if(x)return `<div class="onb-info"><b>${x.icon} ${x.title}</b><p>${x.what} ${x.expect}</p></div>`+html}catch(_){}return html};
}
})();
