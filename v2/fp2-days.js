/* FitPro 2.7.0 — יעד יומי שזז לפי אתמול:
   - בלי אירוע השבוע: מה שלא אכלת אתמול עובר להיום (עד 300). מחושב בשרת (dayShift_).
   - אתמול מעל היעד: הודעה בבוקר, עם בחירה כמה להוריד היום (200 / כמות אחרת עד 20% / לא).
   - יתרת פינוק: מסבירה כמה מזה מהיום וכמה מהימים הקודמים.
   - יום אירוע: "נשאר לך עכשיו לאירוע". */
(function(){
'use strict';
if(typeof recalcTotalsLocal!=='function')return;

/* the server knows the shift of each day; keep it when the device recalculates by itself */
const SHIFT={};
function keepShift(day){try{if(day&&day.totals&&day.totals.shift)SHIFT[day.date||state.date]=day.totals.shift}catch(_){}}
const oApply=applyDay;
applyDay=function(day){const r=oApply.apply(this,arguments);keepShift(day);return r};
if(typeof applyDayKeepJournal==='function'){const o=applyDayKeepJournal;applyDayKeepJournal=function(day){const r=o.apply(this,arguments);keepShift(day);return r}}
const oRecalc=recalcTotalsLocal;
recalcTotalsLocal=function(){
  const r=oRecalc.apply(this,arguments);
  try{const sh=SHIFT[state.date],t=state.data.totals;if(sh&&sh.total&&t){t.calorieGoal=Math.round(t.calorieGoal+sh.total);t.remaining=Math.round((t.calorieGoal-t.calories)*10)/10;t.shift=sh}}catch(_){}
  return r;
};
const boot0=setInterval(()=>{if(typeof state!=='undefined'&&state.data&&state.data.totals){clearInterval(boot0);if(state.data.totals.shift)SHIFT[state.date]=state.data.totals.shift}},800);

/* small line under the ring: why today's goal is different */
function shiftNote(){
  try{
    const t=state.data&&state.data.totals,sh=t&&t.shift;let el=$('fpShiftNote');
    if(!sh||!sh.total){if(el)el.remove();return}
    const parts=[];if(sh.plus)parts.push(`+${sh.plus} שלא אכלת אתמול`);if(sh.cut)parts.push(`−${sh.cut} שבחרת להוריד`);
    if(!parts.length)parts.push((sh.total>0?'+':'')+sh.total);
    const anchor=document.querySelector('#today .progress-wrap');if(!anchor)return;
    if(!el){anchor.insertAdjacentHTML('afterend','<div id="fpShiftNote" class="muted" style="text-align:center;font-size:13px;margin:6px 0"></div>');el=$('fpShiftNote')}
    el.textContent='היעד היום: '+parts.join(' · ');
  }catch(_){}
}
if(typeof renderTotals==='function'){const o=renderTotals;renderTotals=function(){const r=o.apply(this,arguments);shiftNote();return r}}

/* ---------- yesterday over the goal: ask once in the morning ---------- */
const ASK_KEY='fp2.cutAsked';
const busy=()=>{try{return $('fpWelcome')||$('fpTour')||document.documentElement.classList.contains('onboarding-mode')||document.documentElement.classList.contains('entry-mode')||[...document.querySelectorAll('.overlay')].some(o=>!o.classList.contains('hide')&&getComputedStyle(o).display!=='none')}catch(_){return false}};
const addD=(d,n)=>{const x=new Date(d+'T12:00:00Z');x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10)};
async function overCheck(tries){
  tries=tries||0;
  try{
    if(busy()){if(tries<200)setTimeout(()=>overCheck(tries+1),3000);return}
    const today=state.todayDate||state.data.date;if(!today)return;
    let asked='';try{asked=localStorage.getItem(ASK_KEY)||''}catch(_){}
    if(asked===today)return;
    let cuts={};try{cuts=JSON.parse(String(state.data.settings.day_cuts||'{}'))||{}}catch(_){}
    if(Object.prototype.hasOwnProperty.call(cuts,today))return;
    const y=addD(today,-1),t=(await call('getDayView',y)).totals;
    const over=Math.round((Number(t.calories)||0)-(Number(t.calorieGoal)||0));
    if(over<100)return;
    try{localStorage.setItem(ASK_KEY,today)}catch(_){}
    showOver(today,over);
  }catch(e){console.warn('overCheck',e&&e.message)}
}
function showOver(today,over){
  const base=Number(state.data.settings.calorie_goal)||2200,cap=Math.min(Math.round(base*0.2/10)*10,Math.round(over/10)*10),def=Math.min(200,cap);
  document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="fpOverSheet"><div class="sheet"><h3 style="margin:0 0 8px">אתמול אכלת ${fmt(over)} קל׳ מעל היעד</h3>
    <p class="muted" style="margin:0">להוריד משהו מהיעד של היום? זה לא חובה, ואחרי יום אחד חוזרים ליעד הרגיל.</p>
    <button type="button" class="btn full" style="margin-top:12px" onclick="fpSetCut(${def})">להוריד ${def} קל׳</button>
    <div style="display:flex;gap:8px;margin-top:8px;align-items:center"><input id="fpCutAmt" type="number" inputmode="numeric" min="10" max="${cap}" step="10" placeholder="כמות אחרת (עד ${cap})" style="flex:1"><button type="button" class="btn light" onclick="fpSetCut(Number(document.getElementById('fpCutAmt').value))">שמור</button></div>
    <p class="muted" style="font-size:12px;margin:6px 0 0">אפשר עד ${cap} קל׳. אם צריך יותר, עדיף לפזר על יומיים.</p>
    <button type="button" class="btn secondary full" style="margin-top:10px" onclick="fpSetCut(0)">לא, תודה</button></div></div>`);
  window.fpSetCut=async function(amount){
    amount=Math.round((Number(amount)||0)/10)*10;
    if(amount<0||amount>cap)return toast('אפשר בין 0 ל-'+cap,true);
    const s=$('fpOverSheet');if(s)s.remove();
    try{await call('saveSettings',{day_cut:{date:today,amount}});
      let m={};try{m=JSON.parse(String(state.data.settings.day_cuts||'{}'))||{}}catch(_){}m[today]=amount;state.data.settings.day_cuts=JSON.stringify(m);
      if(state.date===today){const d=await call('getDayView',today);applyDay(d);renderDay()}
      toast(amount?`היעד של היום ירד ב-${amount}`:'בסדר, היעד נשאר רגיל')}
    catch(e){toast(e.message,true)}
  };
}
const boot1=setInterval(()=>{if(typeof state!=='undefined'&&state.data&&state.data.settings&&typeof call==='function'){clearInterval(boot1);setTimeout(()=>overCheck(0),7000)}},1000);

/* ---------- "יתרת פינוק": the week without the day shifts, and where the number comes from ---------- */
if(typeof openTreat==='function'){
  openTreat=async function(){
    try{closePlusMenu()}catch(_){}
    const t=state.todayDate||state.date,d0=new Date(t+'T12:00:00'),start=new Date(d0);start.setDate(d0.getDate()-d0.getDay());
    const names=['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'],rows=[];let eaten=0,goal=0,todayLeft=0;
    for(let i=0;i<=d0.getDay();i++){const d=new Date(start);d.setDate(start.getDate()+i);const iso=d.toISOString().slice(0,10);
      let tot=null;try{tot=iso===state.date&&state.data.totals?state.data.totals:(await call('getDayView',iso)).totals}catch(_){}
      const e=Number(tot&&tot.calories)||0,gReal=Number(tot&&tot.calorieGoal)||settingsNum('calorie_goal',2200),sh=Number(tot&&tot.shift&&tot.shift.total)||0,g=gReal-sh;
      eaten+=e;goal+=g;rows.push([names[i],e,g]);if(iso===t)todayLeft=Math.round(gReal-e)}
    const left=Math.round(goal-eaten),pct=goal?Math.min(100,eaten/goal*100):0,before=left-todayLeft;
    $('treatBody').innerHTML=`<p class="muted">מיום ראשון ועד היום (${names[d0.getDay()]}): כמה אכלת, מול כמה היית אמור לאכול.</p>
      <div class="treat-big ${left<0?'over':''}">${left>=0?`נשארו לך <b>${kc(left)}</b> קל׳`:`עברת ב-<b>${kc(-left)}</b> קל׳`}</div>
      <div class="meter" style="margin:10px 0"><i style="width:${pct}%;${left<0?'background:#E5484D':''}"></i></div>
      <p>אכלת <b>${kc(eaten)}</b> מתוך <b>${kc(goal)}</b> קל׳.</p>
      <p class="muted">${before>=0?`מזה: <b>${kc(todayLeft)}</b> שנשארו מהיום, ועוד <b>${kc(before)}</b> שחסכת בימים הקודמים.`:`מזה: <b>${kc(todayLeft)}</b> שנשארו מהיום, פחות <b>${kc(-before)}</b> שעברת בימים הקודמים.`}</p>
      <p class="muted">${left>=0?(left>500?'יש לך מקום להתפנק השבוע 😋':'כמעט ביעד. פינוק קטן, לא יותר.'):'עדיף לשמור היום. מחר מתחילים מחדש עם יעד רגיל.'}</p>
      ${rows.map(r=>`<div class="bank-line"><span>${r[0]}</span><span>${kc(r[1])} / ${kc(r[2])}${r[1]>r[2]?' <span style="color:#FF8A8A">▲</span>':''}</span></div>`).join('')}`;
    $('treatSheet').classList.remove('hide');
  };
}
})();
