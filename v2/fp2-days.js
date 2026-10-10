/* FitPro 2.8.0 — the daily goal that moves with yesterday, by percent of the goal:
   - yesterday under/over: today gets exactly that gap, up to the limit of the process (computed on the server, dayShift_).
   - in the week of an event the gap goes to the event day instead.
   - morning message after a day over the goal (the cut is already applied; the user can change it).
   - two days in a row more than 10% away from the goal: "was there an event?".
   - crossing the daily quota: an alert (logging is never blocked).
   - an event that came from the calendar: ask once how to prepare.
   - "יתרת פינוק": where the number comes from. */
(function(){
'use strict';
if(typeof recalcTotalsLocal!=='function')return;
const LS={get(k){try{return localStorage.getItem(k)}catch(_){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(_){}}};
const addD=(d,n)=>{const x=new Date(d+'T12:00:00Z');x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10)};
const todayISO=()=>state.todayDate||(state.data&&state.data.bank&&state.data.bank.today)||(state.data&&state.data.date);
const busy=()=>{try{const av=document.querySelector('.view.active');return (av&&av.id!=='today')||$('fpI')||$('fpWelcome')||$('fpTour')||document.documentElement.classList.contains('onboarding-mode')||document.documentElement.classList.contains('entry-mode')||[...document.querySelectorAll('.overlay')].some(o=>!o.classList.contains('hide')&&getComputedStyle(o).display!=='none')}catch(_){return false}};
function whenFree(fn,tries){tries=tries||0;if(busy()){if(tries<200)setTimeout(()=>whenFree(fn,tries+1),3000);return}fn()}

/* The server sends the shift with every day it returns. When the device recalculates a day by itself it keeps
   the shift of the totals it replaces (same day only). There is no separate cache, so a shift that the server
   changed (an event was added, an older day was fixed) is never kept by mistake. */
const oRecalc=recalcTotalsLocal;
recalcTotalsLocal=function(){
  let prev=null;try{const t=state.data&&state.data.totals;if(t&&t.shift&&(state.data.date||state.date)===state.date)prev=t.shift}catch(_){}
  const r=oRecalc.apply(this,arguments);
  try{const t=state.data.totals;if(prev&&t){t.shift=prev;if(prev.total){t.calorieGoal=Math.round(t.calorieGoal+prev.total);t.remaining=Math.round((t.calorieGoal-t.calories)*10)/10}}}catch(_){}
  return r;
};

/* small line under the ring: why today's goal is different */
function shiftNote(){
  try{
    const t=state.data&&state.data.totals,sh=t&&t.shift;let el=$('fpShiftNote');
    let text='';
    if(sh&&sh.source==='event')text='';  // on the event day the event bar says it all
    else if(sh&&sh.total&&sh.source==='after-event')text='היעד היום: '+(sh.total<0?`−${kc(-sh.total)} כי באירוע אתמול עברת ב-${kc(sh.over||-sh.total)}`:`+${kc(sh.total)} שנשארו מהאירוע אתמול`);
    else if(sh&&sh.total){const parts=[];if(sh.plus)parts.push(`+${kc(sh.plus)} שלא אכלת אתמול`);if(sh.cut)parts.push(`−${kc(sh.cut)} כי אתמול עברת את היעד`);if(!parts.length)parts.push((sh.total>0?'+':'')+kc(sh.total));text='היעד היום: '+parts.join(' · ')}
    else if(sh&&sh.source==='streak'&&sh.streak)text='היעד היום רגיל · '+(sh.streak.dir==='under'?`3 ימים ברצף חסרים לך בערך ${kc(sh.streak.avg)} ביום`:`3 ימים ברצף עברת בערך ב-${kc(sh.streak.avg)} ביום`);
    else if(sh&&sh.source==='event-week'&&state.date===todayISO())text='השבוע יש אירוע: מה שנשאר מאתמול נשמר ליום האירוע';
    if(!text){if(el)el.remove();return}
    const anchor=document.querySelector('#today .progress-wrap');if(!anchor)return;
    if(!el){anchor.insertAdjacentHTML('afterend','<div id="fpShiftNote" class="muted" style="text-align:center;font-size:13px;margin:6px 0"></div>');el=$('fpShiftNote')}
    el.textContent=text;
  }catch(_){}
}

/* ---------- crossing the quota: an alert, logging continues ---------- */
const overSeen={};
function quotaCheck(){
  try{
    const t=state.data&&state.data.totals,d=state.date;if(!t||!d||d!==todayISO())return;
    const g=Number(t.calorieGoal)-heldBack(),over=Number(t.calories)>g+5,key=d+':'+Math.round(g);
    if(overSeen[key]===undefined){overSeen[key]=over;return}       // first look at this day: no alert for what was already there
    if(over&&!overSeen[key]){
      quotaAlert(`עברת את הערך הקלורי של היום ב-${kc(t.calories-g)} קל׳`);
    }
    overSeen[key]=over;
  }catch(_){}
}
function quotaAlert(text){
  const old=$('fpQuota');if(old)old.remove();
  document.body.insertAdjacentHTML('beforeend',`<div id="fpQuota" role="status" style="position:fixed;left:12px;right:12px;bottom:calc(84px + env(safe-area-inset-bottom));z-index:60;background:#3a1d1f;color:#fff;border:1px solid #E5484D;border-radius:14px;padding:12px 14px 12px 34px;box-shadow:0 8px 24px rgba(0,0,0,.35);font-size:14px;line-height:1.45">
    <b>⚠️ ${esc(text)}</b>
    <button type="button" onclick="this.parentNode.remove()" style="position:absolute;top:6px;left:8px;background:none;border:0;color:#fff;font-size:18px" aria-label="סגור">✕</button></div>`);
  setTimeout(()=>{const e=$('fpQuota');if(e)e.remove()},9000);
}
window.fpQuotaPreview=quotaAlert;

if(typeof renderTotals==='function'){const o=renderTotals;renderTotals=function(){
  // on an event day, before "התחלתי את האירוע", the ring shows a regular day
  let held=0,real=null;try{held=heldBack();if(held>0&&state.data&&state.data.totals){real=state.data.totals;state.data.totals=Object.assign({},real,{calorieGoal:real.calorieGoal-held,remaining:Math.round((real.remaining-held)*10)/10})}}catch(_){}
  let r;try{r=o.apply(this,arguments)}finally{if(real)state.data.totals=real}
  shiftNote();quotaCheck();return r}}

/* ---------- morning: yesterday over the goal (already applied, can be changed) ---------- */
function showOver(today,sh){
  const cap=Number(sh.cap)||Math.round((Number(state.data.settings.calorie_goal)||2200)*0.1/10)*10,over=Number(sh.over)||0,cut=Number(sh.cut)||0;
  document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="fpOverSheet"><div class="sheet"><h3 style="margin:0 0 8px">${sh.source==='after-event'?`באירוע אתמול עברת ב-${kc(over)} קל׳ מעבר למה שנשמר`:`אתמול עברת את היעד ב-${kc(over)} קל׳`}</h3>
    <p style="margin:0">לכן היעד של היום ירד ב-<b>${kc(cut)}</b> קל׳${over>cut?` (זה הגבול ליום אחד בתהליך שלך)`:''}.</p>
    <p class="muted" style="margin:6px 0 0">זה רק ליום אחד. מחר חוזרים ליעד הרגיל.</p>
    <button type="button" class="btn full" style="margin-top:12px" onclick="fpSetCut(-1)">בסדר 👍</button>
    <div style="display:flex;gap:8px;margin-top:8px;align-items:center"><input id="fpCutAmt" type="number" inputmode="numeric" min="0" max="${Math.min(cap,over)}" step="10" placeholder="כמות אחרת (עד ${kc(Math.min(cap,over))})" style="flex:1"><button type="button" class="btn light" onclick="fpSetCut(Number(document.getElementById('fpCutAmt').value))">שמור</button></div>
    <button type="button" class="btn secondary full" style="margin-top:10px" onclick="fpSetCut(0)">לא להוריד היום</button></div></div>`);
  window.fpSetCut=async function(amount){
    const s=$('fpOverSheet');
    if(amount<0){if(s)s.remove();return}
    amount=Math.round((Number(amount)||0)/10)*10;
    if(amount<0||amount>Math.min(cap,over))return toast('אפשר בין 0 ל-'+kc(Math.min(cap,over)),true);
    if(s)s.remove();
    try{await call('saveSettings',{day_cut:{date:today,amount}});
      let m={};try{m=JSON.parse(String(state.data.settings.day_cuts||'{}'))||{}}catch(_){}m[today]=amount;state.data.settings.day_cuts=JSON.stringify(m);
      if(state.date===today){const d=await call('getDayView',today);applyDay(d);renderDay()}
      toast(amount?`היעד של היום ירד ב-${kc(amount)}`:'בסדר, היעד של היום נשאר רגיל')}
    catch(e){toast(e.message,true)}
  };
}
window.fpOverPreview=()=>showOver(todayISO(),{over:380,cut:245,cap:245});

/* ---------- two days in a row more than 10% from the goal ---------- */
function showTwoDays(rows){
  const line=r=>{const pct=Math.round((r.cal-r.goal)/r.goal*100);return `<div class="bank-line"><span>${esc(r.name)}</span><span>${kc(r.cal)} מתוך ${kc(r.goal)} <b style="color:${pct>0?'#FF8A8A':'#7FB2FF'}">(${pct>0?'+':''}${pct}%)</b></span></div>`};
  document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="fpTwoDays"><div class="sheet"><h3 style="margin:0 0 6px">יומיים שאתה לא בטווח</h3>
    <p class="muted" style="margin:0 0 8px">הטווח הוא עד 10% מעל או מתחת ליעד.</p>${rows.map(line).join('')}
    <div id="fpTwoBody"><p style="margin:12px 0 0"><b>היה אירוע באחד הימים?</b></p>
    <div class="quick-grid" style="margin-top:8px"><button type="button" class="btn" onclick="fpTwoYes('${rows[0].date}')">כן, להוסיף אירוע</button><button type="button" class="btn light" onclick="fpTwoNo()">לא</button></div></div></div></div>`);
  window.fpTwoYes=function(d){const s=$('fpTwoDays');if(s)s.remove();try{openEventSheet({date:d})}catch(e){toast(e.message,true)}};
  window.fpTwoNo=function(){$('fpTwoBody').innerHTML=`<p style="margin:12px 0 0">כדי לראות תוצאות, הכי חשוב להתמיד: להישאר קרוב ליעד, עד 10% למעלה או למטה. יום-יומיים לא הורסים כלום, הרצף הוא מה שקובע.</p><button type="button" class="btn full" style="margin-top:12px" onclick="document.getElementById('fpTwoDays').remove()">הבנתי 💪</button>`};
}
window.fpTwoDaysPreview=()=>{const t=todayISO();showTwoDays([{date:addD(t,-1),name:'אתמול',cal:1980,goal:2450},{date:addD(t,-2),name:'שלשום',cal:2010,goal:2450}])};

/* ---------- 2.12.0: 3 days in a row ---------- */
function showStreak(st){
  const old=$('fpStreak');if(old)old.remove();
  const c=bankCtx(),base=Number(state.data.settings.calorie_goal)||c.goal||2200,under=st.dir==='under';
  let to=under?base-st.avg:base+st.avg;to=Math.round(to/10)*10;if(under&&c.minDay)to=Math.max(c.minDay,to);
  const opt=(fn,title,sub)=>`<button type="button" class="remind-opt" onclick="${fn}"><b>${title}</b>${sub?`<span>${sub}</span>`:''}</button>`;
  document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="fpStreak"><div class="sheet"><div class="sheet-head"><h3 style="margin:0">${under?`3 ימים ברצף חסרים לך בערך ${kc(st.avg)} קל׳ ביום`:`3 ימים ברצף עברת בערך ב-${kc(st.avg)} קל׳ ביום`}</h3><button type="button" class="trash" aria-label="סגור" onclick="document.getElementById('fpStreak').remove()">✕</button></div>
    <p class="muted" style="margin:0 0 10px">לכן ההפרש לא עובר להיום. מה קרה?</p><div id="fpStreakBody">
    ${opt("fpStreakAns('event')",'היה אירוע','')}
    ${under?opt("fpStreakAns('add')",'להוסיף משהו קבוע','למשל שייק. נכנס כקיצור, לחיצה אחת ביום.'):''}
    ${to!==base?opt(`fpStreakAns('goal',${to})`,`${under?'להוריד':'להעלות'} את היעד ל-${kc(to)}`,under?'היעד שאתה באמת אוכל. התוצאה תגיע לאט יותר.':'היעד שאתה באמת אוכל. התוצאה תגיע לאט יותר.'):''}
    ${opt("fpStreakAns('keep')",'להשאיר, אני אנסה','')}</div></div></div>`);
  window.fpStreakAns=async function(a,v){
    const s=$('fpStreak');
    if(a==='event'){$('fpStreakBody').innerHTML='<p style="margin:0">סגור. ההפרש לא עובר הלאה, והיעד ממשיך כרגיל.</p><button type="button" class="btn full" style="margin-top:12px" onclick="document.getElementById(\'fpStreak\').remove()">הבנתי</button>';return}
    if(s)s.remove();
    if(a==='add'){try{showView('settings');const n=$('quickName'),k=$('quickCalories');if(n){let d=n.closest('details');while(d){d.open=true;d=d.parentElement&&d.parentElement.closest('details')}n.value='תוספת יומית';if(k)k.value=st.avg;setTimeout(()=>{n.scrollIntoView({block:'center',behavior:'smooth'});n.focus()},250)}toast('תשנה שם וערכים ותשמור')}catch(e){toast(e.message,true)}return}
    if(a==='goal'){try{state.data=await call('saveSettings',{calorie_goal:v});try{renderAll()}catch(_){}toast('היעד היומי: '+kc(v))}catch(e){toast(e.message,true)}return}
  };
}
window.fpStreakPreview=(dir)=>showStreak({dir:dir||'under',avg:350,start:'',end:''});

/* ---------- 2.12.0: the morning after an event ---------- */
function showEventSummary(ev,t,sh,today){
  const old=$('fpEvSum');if(old)old.remove();
  const b=Math.max(0,Number(t.bank&&t.bank.delta)||0),toEv=t.shift&&t.shift.source==='event'?Math.max(0,Number(t.shift.toEvent)||0):0,saved=Math.round(b+toEv);
  const goal=Math.round(Number(t.calorieGoal)||0),ate=Math.round(Number(t.calories)||0),diff=ate-goal,ok=diff<=30;
  const cut=sh&&sh.source==='after-event'?Math.max(0,Number(sh.cut)||0):0,over=Math.max(0,diff);
  const row=(a,b)=>`<div class="bank-line"><span>${a}</span><span><b>${b}</b></span></div>`;
  document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="fpEvSum"><div class="sheet"><div class="sheet-head"><h3 style="margin:0">${esc(ev.label)}: סיכום</h3><button type="button" class="trash" aria-label="סגור" onclick="document.getElementById('fpEvSum').remove()">✕</button></div>
    ${row('שמרת לאירוע',saved>0?'+'+kc(saved):'0')}${row('היעד של היום ההוא',kc(goal))}${row('אכלת',kc(ate))}
    <div style="margin:12px 0 0;font-size:16px;font-weight:700;color:${ok?'#7FD67F':'#FF8A8A'}">${ok?'✓ עמדת במה ששמרת':'✗ עברת ב-'+kc(diff)+' קל׳'}</div>
    ${ok?(sh&&sh.plus?`<p style="margin:6px 0 0">${kc(sh.plus)} שנשארו עוברים להיום.</p>`:''):`<p style="margin:6px 0 0">${cut?`היום היעד יורד ב-${kc(cut)}.${over>cut?' זה הגבול ליום אחד, השאר לא מתקזז.':''}`:'היום היעד לא יורד.'}</p>`}
    <button type="button" class="btn full" style="margin-top:12px" onclick="document.getElementById('fpEvSum').remove()">הבנתי</button>
    ${!ok&&cut?`<button type="button" class="btn secondary full" style="margin-top:8px" id="fpEvSumCut">לשנות את ההורדה</button>`:''}</div></div>`);
  const bc=$('fpEvSumCut');if(bc)bc.onclick=()=>{$('fpEvSum').remove();showOver(today,sh)};
}
window.fpEvSumPreview=(ok)=>showEventSummary({label:'חתונה'},{calories:ok?3050:3800,calorieGoal:3200,bank:{delta:600},shift:{source:'event',toEvent:300}},ok?{source:'after-event',plus:150}:{source:'after-event',cut:350,over:600},todayISO());

const NAMES=['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
async function morningChecks(){
  const today=todayISO();if(!today)return;
  try{
    const shT=state.date===today&&state.data.totals&&state.data.totals.shift?state.data.totals.shift:(await call('getDayView',today)).totals.shift;
    // 1. 2.12.0: 3 days in a row on the same side → "what happened?" (once per streak)
    if(shT&&shT.source==='streak'&&shT.streak){const st=shT.streak,last=LS.get('fp2.streakEnd')||'';
      if(!last||st.start>last){LS.set('fp2.streakEnd',st.end);LS.set('fp2.cutAsked',today);return whenFree(()=>showStreak(st))}}
    // 1b. 2.12.0: the morning after an event: the numbers, nothing else
    {const y=addD(today,-1),ev=(state.data.bank&&state.data.bank.events||[]).find(e=>e.date===y);let seenS=[];try{seenS=JSON.parse(LS.get('fp2.evSum')||'[]')}catch(_){}
      if(ev&&seenS.indexOf(y)<0){const t=(await call('getDayView',y)).totals;
        if(t&&Number(t.calories)>0){seenS.push(y);LS.set('fp2.evSum',JSON.stringify(seenS.slice(-20)));LS.set('fp2.cutAsked',today);return whenFree(()=>showEventSummary(ev,t,shT,today))}}}
    // 2. yesterday over the goal
    if(LS.get('fp2.cutAsked')!==today){
      let cuts={};try{cuts=JSON.parse(String(state.data.settings.day_cuts||'{}'))||{}}catch(_){}
      if(!Object.prototype.hasOwnProperty.call(cuts,today)){
        const sh=state.date===today&&state.data.totals&&state.data.totals.shift?state.data.totals.shift:(await call('getDayView',today)).totals.shift;
        if(sh&&(sh.source==='yesterday'||sh.source==='after-event')&&Number(sh.over)>=Math.max(50,Number(state.data.settings.calorie_goal||2200)*0.03)){LS.set('fp2.cutAsked',today);return whenFree(()=>showOver(today,sh))}
      }
    }
    // 3. an event from the calendar that nobody chose a plan for
    unplannedCheck();
  }catch(e){console.warn('morningChecks',e&&e.message)}
}

/* ---------- an event that came from the calendar: how to prepare? ---------- */
function calIds(){try{const m=JSON.parse((window.FP2&&window.FP2.getProp&&window.FP2.getProp('CAL_MAP'))||'{}');return new Set(Object.values(m).map(x=>x&&x[0]))}catch(_){return new Set()}}
function askedList(){try{return JSON.parse(LS.get('fp2.evAsked')||'[]')}catch(_){return []}}
function markAsked(id){const a=askedList();if(a.indexOf(id)<0){a.push(id);LS.set('fp2.evAsked',JSON.stringify(a.slice(-80)))}}
function unplannedCheck(){
  try{
    if($('fpUnplanned'))return;
    const t=todayISO(),ids=calIds(),asked=askedList();
    // 2.10.0: every event that came from the phone calendar in the next two weeks is asked about once, right after it arrives
    const e=(state.data.bank&&state.data.bank.events||[]).find(x=>x.date>=t&&x.date<=addD(t,14)&&ids.has(x.id)&&asked.indexOf(x.id)<0);
    if(e)whenFree(()=>showUnplanned(e));
  }catch(_){}
}
window.fpUnplannedCheck=unplannedCheck;
let UP={pct:null};
function showUnplanned(e){
  const old=$('fpUnplanned');if(old)old.remove();
  if(e.id!=='demo')markAsked(e.id);
  const c=bankCtx(),t=todayISO(),when=e.date===t?'היום':e.date===addD(t,1)?'מחר':'ביום '+NAMES[new Date(e.date+'T12:00:00').getDay()]+' '+displayDate(e.date);
  const range=c.saveRange||[10,15],lo=range[0],hi=range[1],opts=[...new Set([lo,Math.round((lo+hi)/2),hi])];
  if(UP.pct==null||opts.indexOf(UP.pct)<0)UP.pct=c.savePct&&opts.indexOf(c.savePct)>=0?c.savePct:hi;
  const others=bankEvents().filter(x=>x.id!==e.id),cut=Math.round((c.goal||2200)*UP.pct/1000)*10;
  const p=bankPlanFor(e.date,e.extra||700,'spread',others),days=p.days.length;
  const daysTxt=days?(days===1?'יום אחד':days+' ימים'):'';
  const opt=(m,title,sub,rec)=>`<button type="button" class="remind-opt${rec?' rec':''}" onclick="fpUnplanned('${e.id}','${m}')"><b>${title}${rec?' (מומלץ)':''}</b><span>${sub}</span></button>`;
  const canSave=!c.noDeficit&&days>0;
  document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="fpUnplanned"><div class="sheet"><div class="sheet-head"><h3 style="margin:0">📅 אירוע חדש מהיומן: ${esc(e.label)}</h3><button type="button" class="trash" aria-label="סגור" onclick="document.getElementById('fpUnplanned').remove();setTimeout(()=>window.fpUnplannedCheck&&fpUnplannedCheck(),600)">✕</button></div>
    <p class="muted" style="margin:0 0 10px">${esc(when)} · איך להתכונן? עד שתבחר, היעדים לא משתנים.</p>
    ${canSave?`<div class="field" style="margin:0 0 4px"><label>אם חוסכים, עד כמה ביום?</label><div class="meal-tabs" style="flex-wrap:wrap">${opts.map(v=>`<button type="button" class="chip${UP.pct===v?' active':''}" onclick="fpUnplannedPct('${e.id}',${v})">${v}% · <bdi>${kc(Math.round((c.goal||2200)*v/1000)*10)}</bdi> קל׳</button>`).join('')}</div></div>`:''}
    ${canSave?opt('spread','לחסוך כל יום עד האירוע',`${daysTxt}, עד ${kc(cut)} קל׳ פחות ביום. מה שנחסך מחכה לך ביום האירוע.`,true):''}
    ${opt('day','רק ביום עצמו','שאר הימים רגילים. ביום האירוע אוכלים קל וחלבוני עד האירוע.',!canSave)}
    ${opt('none','ללא שינוי','היעדים לא משתנים. אם תעבור ביום האירוע, זה מתאזן למחרת.')}
    <button type="button" class="linkish muted" style="margin-top:10px" onclick="document.getElementById('fpUnplanned').remove();${e.id==='demo'?'':`openEventSheet({edit:'${e.id}'})`}">✏️ לשנות פרטים</button></div></div>`);
  window.fpUnplannedPct=function(id,v){UP.pct=v;showUnplanned(id==='demo'?e:(bankEvents().find(x=>x.id===id)||e))};
  window.fpUnplanned=async function(id,m){const s=$('fpUnplanned');if(s)s.remove();if(id==='demo')return;
    if(m==='spread'&&UP.pct&&UP.pct!==c.savePct){try{await fpSetSavePct(UP.pct)}catch(_){}}
    await chooseMethodUI(id,m);setTimeout(unplannedCheck,800)};
}
window.fpUnplannedPreview=()=>{const t=todayISO();showUnplanned({id:'demo',date:addD(t,3),label:'יום הולדת לדנה',extra:700,plan:{}})};

/* ---------- the event day: a slim bar instead of the big card, and "I started the event" ---------- */
const EVK='fp2.evStart';
function evStart(d){try{const m=JSON.parse(LS.get(EVK)||'{}');return m[d]||null}catch(_){return null}}
function setEvStart(d,v){let m={};try{m=JSON.parse(LS.get(EVK)||'{}')||{}}catch(_){}Object.keys(m).forEach(k=>{if(k<addD(d,-7))delete m[k]});if(v)m[d]=v;else delete m[d];LS.set(EVK,JSON.stringify(m))}
/* 2.11.0: the extra calories of an event day stay outside the ring until "התחלתי את האירוע" */
function eventExtra(d){
  try{const t=state.data.totals||{},ev=bankEvents().find(e=>e.date===d);if(!ev||!ev.plan||ev.plan.mode==='past'||ev.plan.mode==='pending')return 0;
    const b=Math.max(0,Number(t.bank&&t.bank.delta)||0),sh=t.shift&&t.shift.source==='event'?Number(t.shift.toEvent)||0:0;
    return Math.max(0,Math.round(b+sh));}catch(_){return 0}
}
function heldBack(){const d=state.date;if(d!==todayISO())return 0;if(evStart(d))return 0;return eventExtra(d)}
window.fpEventHeld=heldBack;
function eventBar(ev,d){
  const p=ev.plan||{},t=state.data.totals||{},sh=t.shift||{},isView=d===state.date,today=d===todayISO(),none=p.method==='none';
  const saved=Math.max(0,Math.round((Number(p.eventMeal)||0)+(isView?Number(sh.toEvent)||0:0)));
  const st=today&&isView?evStart(d):null;
  if(st){
    // 2.10.0: once the event started, the ring is the only counter: whatever is left today is for the event
    return `<div class="card fp-evbar" style="padding:10px 12px;margin:8px 0;display:flex;align-items:center;justify-content:space-between;gap:8px">
      <span style="font-size:15px"><b>🎉 ${esc(ev.label)} התחיל!</b></span>
      <button type="button" class="btn light mini" style="flex:none;padding:6px 10px;min-height:0;font-size:13px" onclick="fpEventStop('${d}')">עדיין לא התחיל</button></div>`;
  }
  const X=isView?eventExtra(d):Math.max(0,Number(p.adj&&p.adj[d])||0),goal=(Number(t.calorieGoal)||0)-(isView&&today?X:0),eaten=Number(t.calories)||0;let pct=0,over=false,sub='',btn='';
  const line=`🎉 ${today?'היום':esc(dayName(d))}: ${esc(ev.label)} · `+(X>0?`שמורים לך לאירוע <b>+${kc(X)}</b> קל׳`:'מה שנשאר בעיגול הוא לאירוע');
  if(isView&&goal){pct=Math.min(100,eaten/goal*100);over=eaten>goal;sub=`אכלת היום ${kc(eaten)} מתוך ${kc(goal)}`}
  if(today&&isView)btn=`<button type="button" class="btn mini" style="padding:6px 12px;min-height:0;font-size:13px" onclick="fpEventStart('${d}')">התחלתי את האירוע</button>`;
  return `<div class="card fp-evbar" style="padding:10px 12px;margin:8px 0">
    <div style="display:flex;align-items:center;gap:8px;justify-content:space-between"><span style="font-size:14px;line-height:1.4">${line}</span><button type="button" class="icon-btn" aria-label="עריכת האירוע" style="flex:none" onclick="openEventSheet({edit:'${ev.id}'})">✏️</button></div>
    ${isView?`<div class="meter" style="margin:6px 0 4px"><i style="width:${pct}%;${over?'background:#E5484D':''}"></i></div>`:''}
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px"><span class="muted" style="font-size:12.5px">${sub}</span>${btn}</div></div>`;
}
window.fpEventStart=function(d){const X=eventExtra(d);setEvStart(d,{ts:Date.now(),ids:(state.data.entries||[]).map(x=>String(x.id))});try{renderTotals()}catch(_){}renderBankCard();toast(X>0?`תהנה! 🎉 נוספו לעיגול ${kc(X)} קל׳ לאירוע`:'תהנה! 🎉 מה שנשאר בעיגול הוא לאירוע')};
window.fpEventStop=function(d){setEvStart(d,null);try{renderTotals()}catch(_){}renderBankCard()};
if(typeof renderBankCard==='function'){
  const o=renderBankCard;
  renderBankCard=function(){
    const r=o.apply(this,arguments);
    try{const el=$('bankCard'),card=el&&el.querySelector('.card.bank-event');
      if(card){const d=state.date,ev=bankEvents().find(e=>e.date===d);if(ev)card.outerHTML=eventBar(ev,d)}}catch(e){console.warn('eventBar',e&&e.message)}
    return r;
  };
}
/* the bar follows every change of the day */
if(typeof renderTotals==='function'){const o2=renderTotals;renderTotals=function(){const r=o2.apply(this,arguments);try{if(bankEvents().some(e=>e.date===state.date))renderBankCard()}catch(_){}return r}}

/* ---------- how much to save per day for an event ---------- */
window.fpSetSavePct=async function(v){
  try{await call('saveSettings',{event_cut_pct:v});
    const c=state.data.bank&&state.data.bank.ctx;if(c){c.savePct=v;c.maxCut=c.noDeficit?0:Math.max(0,Math.min(Math.round(c.goal*v/1000)*10,c.goal-c.minDay))}
    if(state.data.settings)state.data.settings.event_cut_pct=v;
    if(state.ev)renderEventSheet();
  }catch(e){toast(e.message,true)}
};

window.fpMorningChecks=()=>whenFree(morningChecks);
const boot1=setInterval(()=>{if(typeof state!=='undefined'&&state.data&&state.data.settings&&typeof call==='function'){clearInterval(boot1);setTimeout(()=>whenFree(morningChecks),7000)}},1000);

/* ---------- "יתרת פינוק": the week without the day shifts, and where the number comes from ---------- */
if(typeof openTreat==='function'){
  openTreat=async function(){
    try{closePlusMenu()}catch(_){}
    const t=state.todayDate||state.date,d0=new Date(t+'T12:00:00'),start=new Date(d0);start.setDate(d0.getDate()-d0.getDay());
    const rows=[];let eaten=0,goal=0,todayLeft=0;
    for(let i=0;i<=d0.getDay();i++){const d=new Date(start);d.setDate(start.getDate()+i);const iso=d.toISOString().slice(0,10);
      let tot=null;try{tot=iso===state.date&&state.data.totals?state.data.totals:(await call('getDayView',iso)).totals}catch(_){}
      const e=Number(tot&&tot.calories)||0,gReal=Number(tot&&tot.calorieGoal)||settingsNum('calorie_goal',2200),sh=Number(tot&&tot.shift&&tot.shift.total)||0,g=gReal-sh;
      eaten+=e;goal+=g;rows.push([NAMES[i],e,g]);if(iso===t)todayLeft=Math.round(gReal-e)}
    const left=Math.round(goal-eaten),pct=goal?Math.min(100,eaten/goal*100):0,before=left-todayLeft;
    $('treatBody').innerHTML=`<p class="muted">מיום ראשון ועד היום (${NAMES[d0.getDay()]}): כמה אכלת, מול כמה היית אמור לאכול.</p>
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
