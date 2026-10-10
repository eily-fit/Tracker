/* FitPro 2.12.0 — the week around the user:
   - holidays from every calendar (Jewish, Muslim, Christian, civil): a week before, "save calories for it?".
   - Shabbat: after 3 weeks the app knows what you eat on Friday night and Saturday, offers once to save for it
     during the week and/or to fill the meals in by itself (asked every Friday).
   - when a new day starts (midnight, 2, 4 or 6 in the morning): questionnaire + settings. */
(function(){
'use strict';
const LS={get(k){try{return localStorage.getItem(k)}catch(_){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(_){}}};
const addD=(d,n)=>{const x=new Date(d+'T12:00:00Z');x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10)};
const dow=d=>new Date(d+'T12:00:00Z').getUTCDay();
const todayISO=()=>state.todayDate||(state.data&&state.data.date);
const NAMES=['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
const busy=()=>{try{return $('fpWelcome')||$('fpTour')||document.documentElement.classList.contains('onboarding-mode')||document.documentElement.classList.contains('entry-mode')||[...document.querySelectorAll('.overlay')].some(o=>!o.classList.contains('hide')&&getComputedStyle(o).display!=='none')}catch(_){return false}};
function whenFree(fn,tries){tries=tries||0;if(busy()){if(tries<200)setTimeout(()=>whenFree(fn,tries+1),3000);return}fn()}
const S=k=>String((state.data&&state.data.settings&&state.data.settings[k])??'');

/* ---------------- holidays ---------------- */
const CALS={jewish:'✡️ יהודיים',muslim:'☪️ מוסלמיים',christian:'✝️ נוצריים',civil:'🎆 לועזיים'};
function easter(y,orth){
  if(orth){const a=y%4,b=y%7,c=y%19,d=(19*c+15)%30,e=(2*a+4*b-d+34)%7,m=Math.floor((d+e+114)/31),day=((d+e+114)%31)+1;const j=new Date(Date.UTC(y,m-1,day));j.setUTCDate(j.getUTCDate()+13);return j.toISOString().slice(0,10)}
  const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),mo=Math.floor((h+l-7*m+114)/31),da=((h+l-7*m+114)%31)+1;
  return `${y}-${String(mo).padStart(2,'0')}-${String(da).padStart(2,'0')}`;
}
/* 2.13.0: holidays never run out.
   - Jewish and Israeli: from hebcal.com (the internet), saved on the phone; without internet the phone's own Hebrew calendar.
   - Muslim: the phone's built-in Umm al-Qura calendar (the official Saudi calendar). The real day can still move by one, by moon sighting.
   - Christian: computed (Easter by the church's own rule). Civil: fixed dates. */
const PARTS=(cal,d)=>{try{const o={};new Intl.DateTimeFormat('en-u-ca-'+cal,{day:'numeric',month:cal==='hebrew'?'long':'numeric',timeZone:'UTC'}).formatToParts(d).forEach(x=>o[x.type]=x.value);return o}catch(_){return {}}};
const JEW=[['Tishri',1,-1,'ראש השנה','🍎','large'],['Tishri',15,-1,'סוכות','🌿','medium'],['Kislev',25,-1,'חנוכה','🕎','medium'],['ADAR',14,0,'פורים','🎭','medium'],['Nisan',15,-1,'ליל הסדר','🍷','large'],['Nisan',22,-1,'מימונה','🥞','medium'],['Iyar',5,0,'יום העצמאות','🇮🇱','medium'],['Sivan',6,-1,'שבועות','🧀','medium']];
const LOCAL={};
function localYear(y){
  if(LOCAL[y])return LOCAL[y];const out=[];
  for(let t=Date.UTC(y,0,1);t<Date.UTC(y+1,0,1);t+=864e5){const d=new Date(t),iso=d.toISOString().slice(0,10),h=PARTS('hebrew',d),m=PARTS('islamic-umalqura',d);
    JEW.forEach(([mon,day,off,name,emoji,size])=>{const ok=mon==='ADAR'?(h.month==='Adar'||h.month==='Adar II'):h.month===mon;if(ok&&Number(h.day)===day){let date=addD(iso,off);
      if(name==='יום העצמאות'){const w=dow(date);if(w===5)date=addD(date,-1);else if(w===6)date=addD(date,-2);else if(w===1)date=addD(date,1)}
      out.push({date,name,emoji,cal:'jewish',size})}});
    if(m.month==='10'&&m.day==='1')out.push({date:iso,name:'עיד אל-פיטר',emoji:'🌙',cal:'muslim',size:'large',approx:true});
    if(m.month==='12'&&m.day==='10')out.push({date:iso,name:'עיד אל-אדחא',emoji:'🐑',cal:'muslim',size:'large',approx:true});
  }
  return LOCAL[y]=out;
}
/* hebcal.com: [title in the feed, name, emoji, size] */
const HEB=[["Erev Rosh Hashana",'ראש השנה','🍎','large'],["Erev Sukkot",'סוכות','🌿','medium'],["Chanukah: 1 Candle",'חנוכה','🕎','medium'],["Purim",'פורים','🎭','medium'],["Erev Pesach",'ליל הסדר','🍷','large'],["Pesach VII",'מימונה','🥞','medium'],["Yom HaAtzma",'יום העצמאות','🇮🇱','medium'],["Erev Shavuot",'שבועות','🧀','medium']];
function hebcalYear(y){try{const c=JSON.parse(LS.get('fp2.hebcal.'+y)||'null');return c&&Array.isArray(c.list)?c:null}catch(_){return null}}
async function fetchHebcal(y){
  const c=hebcalYear(y);if(c&&Date.now()-c.t<30*864e5)return;
  try{const r=await fetch(`https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&min=off&mod=on&nx=off&year=${y}&month=x&ss=off&mf=off&c=off&i=on&geo=none`);if(!r.ok)return;const j=await r.json();
    const list=[];(j.items||[]).forEach(it=>{const h=HEB.find(x=>String(it.title||'').indexOf(x[0])===0);if(h&&/^\d{4}-\d{2}-\d{2}/.test(it.date||''))list.push({date:it.date.slice(0,10),name:h[1],emoji:h[2],cal:'jewish',size:h[3],src:'hebcal'})});
    if(list.length>=5)LS.set('fp2.hebcal.'+y,JSON.stringify({t:Date.now(),list}));}catch(_){}
}
window.fpHolidaysRefresh=async()=>{const y=new Date().getFullYear();await fetchHebcal(y);await fetchHebcal(y+1)};
function holidayList(){
  const now=todayISO()||new Date().toISOString().slice(0,10),y0=Number(now.slice(0,4)),out=[];
  for(let y=y0-1;y<=y0+2;y++){
    const web=hebcalYear(y),loc=localYear(y);
    out.push(...(web?web.list:loc.filter(h=>h.cal==='jewish')),...loc.filter(h=>h.cal==='muslim'));
    out.push({date:`${y}-12-24`,name:'ערב חג המולד',emoji:'🎄',cal:'christian',size:'large'});
    out.push({date:easter(y),name:'פסחא',emoji:'🐣',cal:'christian',size:'large'});
    const o=easter(y,true);if(o!==easter(y))out.push({date:o,name:'פסחא (אורתודוקסי)',emoji:'🐣',cal:'christian',size:'large'});
    out.push({date:`${y}-12-31`,name:'סילבסטר',emoji:'🎆',cal:'civil',size:'medium'});
  }
  return out.sort((a,b)=>a.date.localeCompare(b.date));
}
function myCals(){const v=S('holidays');if(!v)return ['jewish'];if(v==='none')return [];return v.split(',').filter(x=>CALS[x])}
window.fpHolidays=holidayList;
function holAsked(){try{return JSON.parse(LS.get('fp2.holAsked')||'[]')}catch(_){return []}}
function holCheck(){
  const t=todayISO();if(!t||$('fpHoliday'))return false;
  const cals=myCals(),asked=holAsked(),evs=bankEvents();
  const h=holidayList().find(x=>cals.indexOf(x.cal)>=0&&x.date>=t&&x.date<=addD(t,7)&&asked.indexOf(x.date+x.name)<0&&!evs.some(e=>e.date===x.date));
  if(!h)return false;whenFree(()=>showHoliday(h));return true;
}
let HP={pct:null};
function showHoliday(h){
  const old=$('fpHoliday');if(old)old.remove();
  if(!h.demo){const a=holAsked();a.push(h.date+h.name);LS.set('fp2.holAsked',JSON.stringify(a.slice(-60)))}
  const c=bankCtx(),t=todayISO(),n=Math.round((new Date(h.date+'T12:00:00Z')-new Date(t+'T12:00:00Z'))/864e5);
  const when=n===0?'היום':n===1?'מחר':`בעוד ${n} ימים`;
  const range=c.saveRange||[10,15],opts=[...new Set([range[0],Math.round((range[0]+range[1])/2),range[1]])];
  if(HP.pct==null||opts.indexOf(HP.pct)<0)HP.pct=c.savePct&&opts.indexOf(c.savePct)>=0?c.savePct:range[1];
  const canSave=!c.noDeficit&&n>=1;
  const opt=(m,title,sub,rec)=>`<button type="button" class="remind-opt${rec?' rec':''}" onclick="fpHolidayGo('${m}')"><b>${title}${rec?' (מומלץ)':''}</b>${sub?`<span>${sub}</span>`:''}</button>`;
  document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="fpHoliday"><div class="sheet"><div class="sheet-head"><h3 style="margin:0">${h.emoji} ${esc(h.name)} ${when}</h3><button type="button" class="trash" aria-label="סגור" onclick="document.getElementById('fpHoliday').remove()">✕</button></div>
    <p class="muted" style="margin:0 0 10px">יום ${NAMES[dow(h.date)]} ${displayDate(h.date)}${h.approx?' (לפי הלוח הרשמי. יכול לזוז ביום לפי הירח)':''}. ארוחת חג זה בדרך כלל הרבה. לשמור לך קלוריות?</p>
    ${canSave?`<div class="field" style="margin:0 0 4px"><label>עד כמה לחסוך ביום?</label><div class="meal-tabs" style="flex-wrap:wrap">${opts.map(v=>`<button type="button" class="chip${HP.pct===v?' active':''}" onclick="fpHolidayPct(${v})">${v}% · <bdi>${kc(Math.round((c.goal||2200)*v/1000)*10)}</bdi> קל׳</button>`).join('')}</div></div>`:''}
    ${canSave?opt('spread','לחסוך כל יום עד החג','מה שנחסך מחכה לך בחג.',true):''}
    ${opt('day','רק ביום עצמו','שאר הימים רגילים.',!canSave)}
    ${opt('no','לא צריך','')}</div></div>`);
  window.fpHolidayPct=v=>{HP.pct=v;showHoliday(Object.assign({},h,{demo:true}))};
  window.fpHolidayGo=async function(m){const s=$('fpHoliday');if(s)s.remove();if(h.demo&&!h.real)return;if(m==='no')return toast('בסדר');
    try{if(m==='spread'&&HP.pct&&HP.pct!==c.savePct){try{await fpSetSavePct(HP.pct)}catch(_){}}
      const r=await bankMutate('saveBankEvent',{date:h.date,type:'family',size:h.size,method:'none',note:h.name});
      if(r&&r.savedId)await chooseMethodUI(r.savedId,m);}catch(e){toast(e.message,true)}
    setTimeout(()=>whenFree(daily),900)};
}
window.fpHolidayPreview=()=>showHoliday({date:addD(todayISO(),5),name:'ראש השנה',emoji:'🍎',cal:'jewish',size:'large',demo:true});

/* ---------------- Shabbat ---------------- */
const AUTO='שבת אוטומטי';
const MEALS=[{k:'fri',day:5,cat:'ערב',name:'שישי בערב'},{k:'satB',day:6,cat:'בוקר',name:'שבת בבוקר'},{k:'satL',day:6,cat:'צהריים',name:'שבת בצהריים'}];
function shab(){try{return JSON.parse(S('shabbat_json')||'{}')||{}}catch(_){return {}}}
async function saveShab(o){state.data=await call('saveSettings',{shabbat_json:JSON.stringify(o)})}
const isAuto=e=>String(e.source||'')===AUTO||/\(ממוצע\)/.test(String(e.name||''));
async function learnShabbat(){
  const t=todayISO(),base=Number(S('calorie_goal'))||2200;let fri=addD(t,-((dow(t)+2)%7));if(addD(fri,1)>=t)fri=addD(fri,-7); // the last Friday that ended
  const weeks=[];
  for(let w=0;w<5;w++){const F=addD(fri,-7*w),Sa=addD(F,1);let a=null,b=null;try{a=await call('getDayView',F);b=await call('getDayView',Sa)}catch(_){continue}
    weeks.push({F:a,S:b})}
  const meals={};
  MEALS.forEach(m=>{const vals=[];weeks.forEach(w=>{const d=m.day===5?w.F:w.S;const es=(d&&d.entries||[]).filter(e=>e.category===m.cat&&!isAuto(e));if(es.length){const s={calories:0,protein:0,carbs:0,fat:0};es.forEach(e=>['calories','protein','carbs','fat'].forEach(k=>s[k]+=Number(e[k])||0));vals.push(s)}});
    if(vals.length>=3){const avg={};['calories','protein','carbs','fat'].forEach(k=>avg[k]=Math.round(vals.reduce((n,v)=>n+v[k],0)/vals.length));meals[m.k]=avg}});
  const overOf=key=>{const v=weeks.map(w=>w[key]).filter(d=>d&&d.totals&&Number(d.totals.calories)>0&&!(d.entries||[]).every(isAuto)).map(d=>Number(d.totals.calories)-base);return v.length>=3?Math.max(0,Math.round(v.reduce((n,x)=>n+x,0)/v.length/10)*10):0};
  return {meals,over:{fri:overOf('F'),sat:overOf('S')}};
}
async function shabbatCheck(){
  const t=todayISO(),o=shab();if(!t)return false;
  if(!o.asked){
    if(LS.get('fp2.shabLook')===t)return false;LS.set('fp2.shabLook',t);
    const L=await learnShabbat();if(!L.meals.fri&&!L.meals.satB&&!L.meals.satL)return false;
    whenFree(()=>showShabOffer(L));return true;
  }
  // every Friday: fill the meals in?
  if(o.fill&&dow(t)===5&&LS.get('fp2.shabFill')!==t){const day=await call('getDayView',t);if(!(day.entries||[]).some(isAuto)){LS.set('fp2.shabFill',t);whenFree(()=>showShabFill(o));return true}}
  // save for this week's Shabbat (once per week, from Sunday)
  if(o.save){const fri=addD(t,(5-dow(t)+7)%7),key='w:'+fri;
    if(fri>=t&&LS.get('fp2.shabSaved')!==key){LS.set('fp2.shabSaved',key);const evs=bankEvents();let made=0;
      for(const [d,amt,label] of [[fri,o.over&&o.over.fri,'ארוחת שישי'],[addD(fri,1),o.over&&o.over.sat,'שבת']]){
        if(Number(amt)>=150&&!evs.some(e=>e.date===d)){try{const r=await call('saveBankEvent',{date:d,type:'family',size:'medium',extra:amt,method:'none',note:label,viewDate:state.date});if(r&&r.savedId&&d>t){await call('chooseBankMethod',{id:r.savedId,method:'spread',viewDate:state.date})}made++}catch(e){console.warn('shab save',e&&e.message)}}}
      if(made){try{const r=await call('getBootstrapData');state.data.bank=r.bank;const v=await call('getDayView',state.date);applyDay(v);renderDay()}catch(_){}toast('🕯️ התחלתי לשמור לך לשבת')}}}
  return false;
}
function mealRows(meals){return MEALS.filter(m=>meals[m.k]).map(m=>`<div class="bank-line"><span>${m.name}</span><span><b>בערך ${kc(meals[m.k].calories)}</b> קל׳</span></div>`).join('')}
function showShabOffer(L){
  const old=$('fpShab');if(old)old.remove();
  const over=(L.over.fri||0)+(L.over.sat||0),canSave=over>=150;let save=canSave,fill=true;
  const draw=()=>{$('fpShabChoices').innerHTML=`${canSave?`<button type="button" class="remind-opt${save?' rec':''}" onclick="fpShabT('save')"><b>${save?'☑':'☐'} לחסוך לזה במהלך השבוע</b><span>כל שבוע, בלי קשר לאירועים אחרים. אם יש גם אירוע, האפליקציה חוסכת לשניהם.</span></button>`:''}
    <button type="button" class="remind-opt${fill?' rec':''}" onclick="fpShabT('fill')"><b>${fill?'☑':'☐'} למלא את הארוחות לבד</b><span>בכל שישי בבוקר תישאל אם למלא. אחרי שבת אפשר לתקן.</span></button>`};
  document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="fpShab"><div class="sheet"><div class="sheet-head"><h3 style="margin:0">🕯️ הבנתי מה אתה אוכל בשבת</h3><button type="button" class="trash" aria-label="סגור" onclick="fpShabDone(false)">✕</button></div>
    <p class="muted" style="margin:0 0 6px">הממוצע שלך מהשבועות האחרונים:</p>${mealRows(L.meals)}
    ${over>0?`<p style="margin:8px 0 0">בשישי ובשבת אתה עובר בממוצע ב-<b>${kc(over)}</b> קל׳ מעל היעד.</p>`:''}
    <div id="fpShabChoices" style="margin-top:10px"></div>
    <button type="button" class="btn full" style="margin-top:12px" onclick="fpShabDone(true)">שמור</button>
    <button type="button" class="btn secondary full" style="margin-top:8px" onclick="fpShabDone(false)">לא, תודה</button></div></div>`);
  draw();
  window.fpShabT=k=>{if(k==='save')save=!save;else fill=!fill;draw()};
  window.fpShabDone=async ok=>{const s=$('fpShab');if(s)s.remove();if(L.demo)return;
    try{await saveShab({asked:todayISO(),meals:L.meals,over:L.over,save:ok&&save,fill:ok&&fill});toast(ok&&(save||fill)?'מעולה, מעכשיו זה אוטומטי':'בסדר. אפשר לשנות בהגדרות');if(ok&&save)setTimeout(()=>whenFree(daily),800)}catch(e){toast(e.message,true)}};
}
window.fpShabPreview=()=>showShabOffer({demo:true,meals:{fri:{calories:1100},satB:{calories:600}},over:{fri:650,sat:300}});
function showShabFill(o){
  const old=$('fpShabFill');if(old)old.remove();
  document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="fpShabFill"><div class="sheet"><div class="sheet-head"><h3 style="margin:0">🕯️ למלא את ארוחות שבת?</h3><button type="button" class="trash" aria-label="סגור" onclick="document.getElementById('fpShabFill').remove()">✕</button></div>
    ${mealRows(o.meals||{})}<p class="muted" style="margin:8px 0 0">לפי הממוצע שלך. אחרי שבת אפשר לתקן.</p>
    <button type="button" class="btn full" style="margin-top:12px" onclick="fpShabFillGo(true)">כן, למלא</button>
    <button type="button" class="btn secondary full" style="margin-top:8px" onclick="fpShabFillGo(false)">לא השבוע</button></div></div>`);
  window.fpShabFillGo=async ok=>{const s=$('fpShabFill');if(s)s.remove();if(!ok||o.demo)return;
    const t=todayISO(),fri=addD(t,(5-dow(t)+7)%7);
    try{for(const m of MEALS){const v=(o.meals||{})[m.k];if(!v)continue;
        await call('saveFood',{date:m.day===5?fri:addD(fri,1),category:m.cat,name:`ארוחת ${m.name} (ממוצע)`,amount:1,baseQty:1,unit:'מנה',calories:v.calories,protein:v.protein,carbs:v.carbs,fat:v.fat,source:AUTO})}
      const d=await call('getDayView',state.date);applyDay(d);renderDay();toast('מילאתי את ארוחות שבת. שבת שלום 🕯️')}catch(e){toast(e.message,true)}};
}
window.fpShabFillPreview=()=>showShabFill({demo:true,meals:{fri:{calories:1100},satB:{calories:600}}});

/* ---------------- settings: the day, holidays, Shabbat ---------------- */
const HOURS=[[0,'חצות'],[2,'2 בלילה'],[4,'4 לפנות בוקר'],[6,'6 בבוקר']];
function curHour(){const v=S('day_rollover_hour');return v===''?1:Number(v)}
function renderSet(){
  const sec=$('settings');if(!sec||!state.data)return;let box=$('fpWeekSet');
  if(!box){box=document.createElement('details');box.className='settings-section';box.id='fpWeekSet';const anchor=$('calendarSettings')||$('notificationSettings');if(anchor)anchor.insertAdjacentElement('afterend',box);else{const h=sec.querySelector('h2');if(!h)return;h.insertAdjacentElement('afterend',box)}}
  const open=box.open,h=curHour(),cals=myCals(),o=shab();
  box.innerHTML=`<summary>🗓 היום, חגים ושבת</summary><div class="settings-body">
    <label style="font-weight:700">מתי להתחיל לך יום חדש?</label><p class="muted" style="margin:2px 0 6px;font-size:13px">בשעה הזאת העיגול מתאפס. עובד במשמרות לילה? בחר שעה מאוחרת.</p>
    <div class="meal-tabs" style="flex-wrap:wrap">${HOURS.map(([v,l])=>`<button type="button" class="chip${h===v?' active':''}" onclick="fpSetDayStart(${v})">${l}</button>`).join('')}${HOURS.some(x=>x[0]===h)?'':`<button type="button" class="chip active">${h}:00</button>`}</div>
    <label style="font-weight:700;display:block;margin-top:14px">אילו חגים?</label><p class="muted" style="margin:2px 0 6px;font-size:13px">שבוע לפני חג תישאל אם לשמור לו קלוריות.</p>
    <div class="meal-tabs" style="flex-wrap:wrap">${Object.keys(CALS).map(k=>`<button type="button" class="chip${cals.indexOf(k)>=0?' active':''}" onclick="fpToggleCal('${k}')">${CALS[k]}</button>`).join('')}</div>
    <label style="font-weight:700;display:block;margin-top:14px">🕯️ שבת</label>
    ${o.asked?`${mealRows(o.meals||{})}<div class="meal-tabs" style="flex-wrap:wrap;margin-top:6px"><button type="button" class="chip${o.save?' active':''}" onclick="fpShabSet('save')">לחסוך במהלך השבוע</button><button type="button" class="chip${o.fill?' active':''}" onclick="fpShabSet('fill')">למלא את הארוחות לבד</button></div><button type="button" class="linkish muted" style="margin-top:6px" onclick="fpShabRelearn()">ללמוד מחדש</button>`
      :`<p class="muted" style="margin:2px 0 0;font-size:13px">רושמים את ארוחות שישי ושבת כרגיל (שומר שבת? ממלאים מראש). אחרי 3 שבועות האפליקציה תדע כמה אתה אוכל, ותציע לשמור לזה ולמלא לבד.</p>`}
  </div>`;box.open=open;
}
window.fpSetDayStart=async v=>{try{state.data=await call('saveSettings',{day_rollover_hour:v});renderSet();toast('יום חדש מתחיל ב'+(HOURS.find(x=>x[0]===v)||[0,v+':00'])[1])}catch(e){toast(e.message,true)}};
window.fpToggleCal=async k=>{const c=myCals();const i=c.indexOf(k);if(i>=0)c.splice(i,1);else c.push(k);try{state.data=await call('saveSettings',{holidays:c.join(',')||'none'});renderSet()}catch(e){toast(e.message,true)}};
window.fpShabSet=async k=>{const o=shab();o[k]=!o[k];try{await saveShab(o);renderSet()}catch(e){toast(e.message,true)}};
window.fpShabRelearn=async()=>{try{await saveShab({});LS.set('fp2.shabLook','');renderSet();toast('בסדר, לומד מחדש')}catch(e){toast(e.message,true)}};
if(typeof renderSettings==='function'){const o=renderSettings;renderSettings=function(){const r=o.apply(this,arguments);try{renderSet()}catch(e){console.error(e)}return r}}

/* ---------------- questionnaire: the day + holidays (activity step) ---------------- */
if(typeof renderOnb==='function'){
  const oR=renderOnb;
  renderOnb=function(){
    const r=oR.apply(this,arguments);
    try{const o=state.onb;if(!o||o.step!==1)return r;if(o.d.dayStart===undefined)o.d.dayStart=0;if(!Array.isArray(o.d.hol))o.d.hol=['jewish'];
      const fs=$('onbBody')&&$('onbBody').querySelector('fieldset');if(!fs||$('fpOnbDay'))return r;
      const html=`<div class="field" id="fpOnbDay" style="margin-top:14px"><label>מתי להתחיל לך יום חדש?</label>${chipRow('dayStart',HOURS)}<p class="muted" style="font-size:12px;margin:4px 0 0">בשעה הזאת העיגול מתאפס. עובד בלילות? בחר שעה מאוחרת.</p></div>
        <div class="field" id="fpOnbHol" style="margin-top:14px"><label>אילו חגים אתה חוגג?</label><div class="onb-options">${Object.keys(CALS).map(k=>`<button type="button" class="onb-choice ${o.d.hol.indexOf(k)>=0?'selected':''}" aria-pressed="${o.d.hol.indexOf(k)>=0}" onclick="fpOnbHol('${k}')">${CALS[k]}</button>`).join('')}</div><p class="muted" style="font-size:12px;margin:4px 0 0">שבוע לפני חג האפליקציה תשאל אם לשמור לו קלוריות.</p></div>`;
      const cal=$('fpOnbCal');if(cal)cal.insertAdjacentHTML('afterend',html);else fs.insertAdjacentHTML('beforeend',html);
    }catch(e){console.error(e)}
    return r;
  };
  window.fpOnbHol=k=>{const a=state.onb.d.hol;const i=a.indexOf(k);if(i>=0)a.splice(i,1);else a.push(k);renderOnb()};
  const oF=finishOnboarding;
  finishOnboarding=async function(){const d=state.onb&&state.onb.d||{},ds=d.dayStart,hol=d.hol;const r=await oF.apply(this,arguments);
    try{const sh=$('onbSheet');if(sh&&sh.classList.contains('hide')){const p={};if(Number.isInteger(ds))p.day_rollover_hour=ds;if(Array.isArray(hol))p.holidays=hol.join(',')||'none';if(Object.keys(p).length)state.data=await call('saveSettings',p)}}catch(e){console.warn(e)}
    return r};
}

/* ---------------- daily ---------------- */
async function daily(){
  try{if(holCheck())return;await shabbatCheck()}catch(e){console.warn('week checks',e&&e.message)}
}
window.fpWeekChecks=()=>whenFree(daily);
const boot=setInterval(()=>{if(typeof state!=='undefined'&&state.data&&state.data.settings&&typeof call==='function'){clearInterval(boot);try{window.fpHolidaysRefresh()}catch(_){}setTimeout(()=>whenFree(daily),12000)}},1000);
})();
