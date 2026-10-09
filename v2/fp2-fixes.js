/* FitPro 2.10.0 — fixes from the phone check of 2.9.0:
   - the selection bar: ✕ to cancel (always visible), wraps on small screens, says exactly what is selected, "שכפל".
   - every logged item: ⧉ duplicate; oil that was added shows under the item ("כולל X ג׳ שמן") and can be changed.
   - the day opens with all parts of the day and all meals closed. */
(function(){
'use strict';
if(typeof renderEntries!=='function')return;
document.head.insertAdjacentHTML('beforeend',`<style>
#bulkBar{flex-wrap:wrap;row-gap:6px}
#bulkBar .fp-bulk-x{order:-1;min-width:38px;height:38px;padding:0;font-size:18px;line-height:1}
#bulkBar #bulkCount{order:-1;flex:1;min-width:120px}
.fp-dup{min-width:34px;height:34px;border-radius:10px;border:1px solid var(--line,#2a323b);background:none;color:inherit;font-size:15px;cursor:pointer}
#entries .entry{grid-template-columns:1fr;row-gap:6px}
#entries .entry-actions{justify-content:flex-end;gap:6px}
.fp-oil-note{display:inline-block;margin-top:2px;font-size:12px;color:var(--muted,#A3ADB8);background:none;border:0;padding:0;text-decoration:underline dotted;cursor:pointer;font-family:inherit}
</style>`);
const oilOf=x=>{const m=/שמן:([\d.]+)ג/.exec(String(x&&x.notes||''));return m?Number(m[1])||0:0};
window.fpOilOf=oilOf;

/* ---------- the selection bar ---------- */
function ensureBar(){
  const bar=$('bulkBar');if(!bar||$('fpBulkX'))return;
  bar.insertAdjacentHTML('afterbegin','<button type="button" class="btn light fp-bulk-x" id="fpBulkX" aria-label="ביטול הבחירה" onclick="exitSelectMode()">✕</button>');
  const old=[...bar.querySelectorAll('button')].find(b=>b.textContent.trim()==='ביטול');if(old)old.remove();
  const del=bar.querySelector('.btn.danger');
  if(del)del.insertAdjacentHTML('beforebegin','<button class="btn light" id="fpDupBtn" style="display:none" onclick="fpDuplicateSelected()">שכפל</button>');
}
const oBar=updateBulkBar;
updateBulkBar=function(){
  const r=oBar.apply(this,arguments);
  try{ensureBar();const sel=state.select||{},ent=sel.mode==='ent',ids=[...(sel.set||[])];
    if($('fpDupBtn'))$('fpDupBtn').style.display=ent&&ids.length?'inline-block':'none';
    if(ent&&ids.length){
      // a meal counts as "a meal" only when ALL its items are selected; otherwise the items are counted one by one
      const all=state.data.entries||[],chosen=all.filter(x=>ids.includes(x.id)),groups={};let loose=0;
      chosen.forEach(x=>{const g=x.groupId&&['meal','dish'].includes(x.sourceType)?x.groupId:'';if(g&&all.filter(y=>y.groupId===g).every(y=>ids.includes(y.id)))groups[g]=1;else loose++});
      const meals=Object.keys(groups).length;
      $('bulkCount').textContent='נבחרו: '+[meals?(meals===1?'ארוחה אחת':meals+' ארוחות'):'',loose?(loose===1?'פריט אחד':loose+' פריטים'):''].filter(Boolean).join(' ו');
      document.querySelectorAll('#entries .fp-meal').forEach(b=>{const g=String(b.dataset.lp||'').slice(6);b.classList.toggle('sel',!!groups[g])});
    }
  }catch(e){console.error(e)}
  return r;
};
window.fpDuplicateSelected=async function(){
  const ids=[...(state.select&&state.select.set||[])];if(!ids.length)return;
  if(ids.some(id=>/^tmp-/.test(String(id))))return toast('רגע, עוד שומר…',true);
  await waitForSync();exitSelectMode();loading();
  try{const d=await call('duplicateEntries',{ids});applyDay(d);renderDay();toast(ids.length===1?'שוכפל':'שוכפלו '+ids.length+' פריטים')}
  catch(e){toast(e.message,true)}finally{loading(false)}
};
window.fpDuplicateOne=async function(id){
  if(/^tmp-/.test(String(id)))return toast('רגע, עוד שומר…');
  await waitForSync();loading();
  try{const d=await call('duplicateEntries',{ids:[id]});applyDay(d);renderDay();toast('שוכפל')}
  catch(e){toast(e.message,true)}finally{loading(false)}
};

/* ---------- each item: ⧉ duplicate, and the oil note ---------- */
const oEntry=entryHtml;
entryHtml=function(x){
  let h=oEntry.apply(this,arguments);
  try{
    const og=oilOf(x);
    if(og)h=h.replace(/(<div class="entry-meta">[^<]*<\/div>)/,`$1<button type="button" class="fp-oil-note" onclick="event.stopPropagation();openEntryEdit('${esc(x.id)}')">כולל ${fmt(og)} ג׳ שמן · לשנות</button>`);
    h=h.replace(/(<button class="trash" onclick="removeEntry)/,`<button type="button" class="fp-dup" aria-label="שכפל" title="שכפל" onclick="event.stopPropagation();fpDuplicateOne('${esc(x.id)}')">⧉</button>$1`);
  }catch(_){}
  return h;
};

/* ---------- editing an item: change the oil too ---------- */
const OIL_LEVELS=[['none','בלי'],['little','מעט'],['normal','רגיל'],['lots','הרבה']];
function editMass(){
  const E=state.entryEdit;if(!E)return 0;const a=Number(($('entryEditAmount')||{}).value)||0,u=($('entryEditUnit')||{}).value;
  if(u==='גרם'||u==='מ״ל')return a;
  const g=E.food?foodUnitGrams(E.food,u):0;return g?a*g:0;
}
function editOilGrams(){
  const E=state.entryEdit;if(!E||!E.oil)return 0;const o=E.oil;
  if(o.mode==='exact')return Math.max(0,Number(o.grams)||0);
  if(o.mode==='none')return 0;
  const m=editMass();if(m)return FP2Nutrition.oilGrams(o,m);
  return {little:2,normal:5,lots:10}[o.mode]||0;
}
function renderEditOil(){
  const E=state.entryEdit,sheet=$('entryEditSheet');if(!E||!sheet)return;
  let box=$('fpEditOil');const tot=$('entryEditTotals');if(!tot)return;
  if(!box){tot.insertAdjacentHTML('beforebegin','<div class="field" id="fpEditOil"></div>');box=$('fpEditOil')}
  const g=editOilGrams(),cur=E.oil.mode;
  box.innerHTML=`<label>שמן שהוספת (לא כלול בערכים של המזון עצמו)</label><div class="meal-tabs" style="flex-wrap:wrap">${OIL_LEVELS.map(([k,l])=>`<button type="button" class="chip${cur===k?' active':''}" onclick="fpEditOil('${k}')">${l}${k!=='none'?` <small>(${fmt(k===cur?g:(()=>{const s=E.oil;E.oil={mode:k};const v=editOilGrams();E.oil=s;return v})())} ג׳)</small>`:''}</button>`).join('')}</div>
    <div style="display:flex;gap:8px;align-items:center;margin-top:6px"><span class="muted" style="font-size:13px">או בגרמים:</span><input id="fpEditOilG" type="number" min="0" step="1" inputmode="decimal" value="${fmt(g)}" style="width:90px" oninput="fpEditOil('exact',this.value)"></div>`;
}
window.fpEditOil=function(mode,grams){
  const E=state.entryEdit;if(!E)return;E.oil=mode==='exact'?{mode,grams:Number(grams)||0}:{mode,grams:0};
  if(mode!=='exact')renderEditOil();else{try{const b=$('fpEditOil');b.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'))}catch(_){}}
  updateEntryEditTotals();
};
const oOpenEdit=openEntryEdit;
openEntryEdit=function(id){
  const e=(state.data.entries||[]).find(x=>x.id===id);
  const r=oOpenEdit.apply(this,arguments);
  try{if(e&&state.entryEdit){state.entryEdit.oil0=oilOf(e);state.entryEdit.oil=state.entryEdit.oil0?{mode:'exact',grams:state.entryEdit.oil0}:{mode:'none',grams:0};renderEditOil();updateEntryEditTotals()}}catch(err){console.error(err)}
  return r;
};
const oMacros=entryEditMacros;
entryEditMacros=function(){
  const E=state.entryEdit;if(!E)return oMacros.apply(this,arguments);
  const e=E.entry,o0=Number(E.oil0)||0;
  // the saved values include the old oil: take it out before scaling, then add the oil chosen now
  const plain=o0?Object.assign({},e,{calories:Math.max(0,e.calories-o0*9),fat:Math.max(0,(e.fat||0)-o0)}):e;
  E.entry=plain;let m;try{m=oMacros.apply(this,arguments)}finally{E.entry=e}
  const g=editOilGrams();
  return {calories:(m.calories||0)+g*9,protein:m.protein||0,carbs:m.carbs||0,fat:(m.fat||0)+g};
};
const oEditTotals=updateEntryEditTotals;
updateEntryEditTotals=function(){const r=oEditTotals.apply(this,arguments);try{const E=state.entryEdit;if(E&&E.oil&&E.oil.mode!=='exact'){const i=$('fpEditOilG');if(i&&document.activeElement!==i)i.value=fmt(editOilGrams())}}catch(_){}return r};
saveEntryEdit=async function(){
  if(!state.entryEdit)return;const {entry:e}=state.entryEdit,m=entryEditMacros(),amount=Number($('entryEditAmount').value);
  if(!(amount>0))return toast('כמות לא תקינה',true);
  const oilGrams=Math.round(editOilGrams()*10)/10;
  closeSheet('entryEditSheet');
  await mutate('editEntry',{entryId:e.id,amount,unit:$('entryEditUnit').value,calories:m.calories,protein:m.protein,carbs:m.carbs,fat:m.fat,oilGrams},'הפריט עודכן');
};

/* ---------- the day opens closed ---------- */
function collapseAll(){state.openSecs={'בוקר':false,'צהריים':false,'ערב':false,'נוספים':false};try{fpMealsCollapseAll()}catch(_){}}
collapseAll();
let lastView='';
const oShow=showView;
showView=function(v){
  if(v==='today'&&lastView!=='today')collapseAll();
  lastView=v;
  const r=oShow.apply(this,arguments);
  if(v==='today'){try{renderEntries()}catch(_){}}
  return r;
};
})();

/* ---------- 2.11.0: "📅 הוסף ליומן שלי" — per phone/calendar ----------
   iPhone (and Samsung, Outlook): subscribe ONCE to the app's own calendar link; from then on every event made in the app
   appears in the phone calendar by itself. Google: the "add event" page opens with the details filled in. */
(function(){
const KEY='fp2.calAdd';
const get=()=>{try{return localStorage.getItem(KEY)||''}catch(_){return ''}};
const set=v=>{try{if(v)localStorage.setItem(KEY,v);else localStorage.removeItem(KEY)}catch(_){}};
function evInfo(){const ev=state.ev||{};const t=(typeof BANK_TYPES_UI!=='undefined'&&BANK_TYPES_UI.find(x=>x[0]===ev.type))||['','🎉','אירוע'];return {date:ev.date,title:String(ev.note||(t[1]+' '+t[2])).replace(/[\r\n]+/g,' ').trim()}}
function googleUrl(i){const d=String(i.date||'').replace(/-/g,''),x=new Date(i.date+'T12:00:00Z');x.setUTCDate(x.getUTCDate()+1);const e=x.toISOString().slice(0,10).replace(/-/g,'');return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text='+encodeURIComponent(i.title)+'&dates='+d+'/'+e}
async function feed(){if(!window.FP2||!FP2.calendarFeed)throw new Error('שרת ההתראות לא מחובר');const r=await FP2.calendarFeed();if(!r||!r.url)throw new Error('לא הצלחתי לקבל קישור');return r}
/* 2.11.1: which calendar the user uses is asked once (questionnaire / settings) and used from then on */
const KIND_KEY='fp2.calKind',KINDS={apple:'📱 אפל (iCloud)',google:'Google Calendar',other:'סמסונג / Outlook / אחר'};
function guessKind(){try{return /iPhone|iPad|Macintosh/.test(navigator.userAgent)?'apple':/Android/.test(navigator.userAgent)?'google':''}catch(_){return ''}}
function kind(){let k='';try{k=(state.data&&state.data.settings&&state.data.settings.calendar_kind)||localStorage.getItem(KIND_KEY)||''}catch(_){}return KINDS[k]?k:''}
async function setKind(k,silent){
  if(!KINDS[k])return;try{localStorage.setItem(KIND_KEY,k)}catch(_){}
  if(state.data&&state.data.settings)state.data.settings.calendar_kind=k;
  if(k==='google')set('google');else if(get()==='google')set('');
  try{await call('saveSettings',{calendar_kind:k})}catch(_){}
  try{injectCalSettings(true)}catch(_){}
  if(!silent)toast('היומן שלך: '+KINDS[k]);
}
window.fpSetCalKind=setKind;window.fpCalKind=kind;window.fpCalKinds=KINDS;window.fpGuessCalKind=guessKind;
async function addByKind(k,i){
  if(k==='google'){window.open(googleUrl(i),'_blank');return}
  if(get()==='feed')return toast('📅 האירוע יופיע ביומן שלך לבד, תוך כמה דקות');
  // first time with Apple / other: subscribe once to the app's calendar link
  try{loading();const f=await feed();loading(false);
    if(k==='apple'){set('feed');location.href=f.webcal;setTimeout(()=>toast('אשר "הירשם" ביומן. מעכשיו האירועים של האפליקציה יופיעו שם לבד'),800);return}
    try{await navigator.clipboard.writeText(f.url)}catch(_){}
    set('feed');
    const old=$('fpCalAdd');if(old)old.remove();
    document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="fpCalAdd" onclick="if(event.target===this)this.remove()"><div class="sheet"><h3 style="margin:0 0 8px">📋 הקישור הועתק</h3><p>ביומן: <b>הוספת יומן ← מקישור / מכתובת URL</b>, מדביקים ושומרים. פעם אחת, ומאז האירועים של האפליקציה מופיעים שם לבד.</p><input readonly value="${esc(f.url)}" style="width:100%;box-sizing:border-box;font-size:12px" onclick="this.select()"><button type="button" class="btn full" style="margin-top:10px" onclick="document.getElementById('fpCalAdd').remove()">הבנתי</button></div></div>`);
  }catch(e){loading(false);toast(e.message,true)}
}
window.addEventToPhoneCalendar=function(){
  const i=evInfo();if(!i.date)return toast('בחר תאריך',true);
  const k=kind();
  if(k)return addByKind(k,i);
  if(get()==='feed')return toast('📅 האירוע יופיע ביומן שלך לבד, תוך כמה דקות');
  if(get()==='google'){window.open(googleUrl(i),'_blank');return}
  fpCalAddChooser(i);
};
window.fpCalAddChooser=function(i){
  i=i||evInfo();const old=$('fpCalAdd');if(old)old.remove();
  document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="fpCalAdd" onclick="if(event.target===this)this.remove()"><div class="sheet"><div class="sheet-head"><h3 style="margin:0">📅 לאיזה יומן להוסיף?</h3><button type="button" class="trash" aria-label="סגור" onclick="document.getElementById('fpCalAdd').remove()">✕</button></div>
    <p class="muted" style="margin:4px 0 10px">בוחרים פעם אחת, והאפליקציה זוכרת.</p>
    <button type="button" class="remind-opt rec" onclick="fpCalAddPick('apple')"><b>📱 יומן של אפל (אייפון)</b><span>פעם אחת מאשרים "הירשם", ומאז כל אירוע שתוסיף באפליקציה מופיע ביומן לבד.</span></button>
    <button type="button" class="remind-opt" onclick="fpCalAddPick('google')"><b>Google Calendar</b><span>נפתח דף "הוסף אירוע" עם הפרטים, לוחצים "שמור".</span></button>
    <button type="button" class="remind-opt" onclick="fpCalAddPick('other')"><b>סמסונג / Outlook / אחר</b><span>מעתיקים קישור אחד ומוסיפים אותו ביומן כ"יומן מקישור". פעם אחת, ומאז הכול לבד.</span></button>
  </div></div>`);
  window.fpCalAddPick=async function(kind){
    const s=$('fpCalAdd');try{const kk=kind==='apple'?'apple':kind==='google'?'google':'other';localStorage.setItem(KIND_KEY,kk);if(state.data&&state.data.settings)state.data.settings.calendar_kind=kk;call('saveSettings',{calendar_kind:kk}).catch(()=>{})}catch(_){}
    if(kind==='google'){set('google');if(s)s.remove();if(i.date)window.open(googleUrl(i),'_blank');else toast('נבחר Google Calendar');return}
    try{loading();const f=await feed();loading(false);
      if(kind==='apple'){set('feed');if(s)s.remove();location.href=f.webcal;setTimeout(()=>toast('אשר "הירשם" ביומן. מעכשיו האירועים של האפליקציה יופיעו שם לבד'),800);return}
      try{await navigator.clipboard.writeText(f.url)}catch(_){}
      set('feed');
      if(s)s.querySelector('.sheet').innerHTML=`<h3 style="margin:0 0 8px">📋 הקישור הועתק</h3><p>ביומן: <b>הוספת יומן ← מקישור / מכתובת URL</b>, מדביקים ושומרים.</p><input readonly value="${esc(f.url)}" style="width:100%;box-sizing:border-box;font-size:12px" onclick="this.select()"><button type="button" class="btn full" style="margin-top:10px" onclick="document.getElementById('fpCalAdd').remove()">הבנתי</button>`;
    }catch(e){loading(false);toast(e.message,true)}
  };
};
/* in Settings → "📅 חיבור יומן": which calendar is mine, and help that fits it */
const HELP={apple:'<b>איך מחברים יומן אפל:</b> באפליקציית היומן ← יומנים ← ⓘ ליד היומן ← הפעל "יומן ציבורי" ← "שתף קישור" ← העתק, והדבק כאן.',
  google:'<b>איך מחברים Google Calendar:</b> במחשב, calendar.google.com ← ⚙️ הגדרות ← בוחרים את היומן ← "כתובת סודית בפורמט iCal" ← העתק, והדבק כאן.',
  other:'<b>איך מחברים:</b> ברוב היומנים (סמסונג, Outlook) יש בהגדרות של היומן "שיתוף" או "פרסום" עם קישור iCal (מסתיים ב-.ics). מעתיקים ומדביקים כאן.'};
function injectCalSettings(force){
  const s=$('settings');if(!s)return;
  const d=[...s.querySelectorAll('details.settings-section summary')].find(x=>/חיבור יומן/.test(x.textContent));if(!d)return;
  const body=d.parentElement.querySelector('.settings-body');if(!body)return;
  let el=$('fpCalAddSet');if(el&&!force)return;
  if(!el){body.insertAdjacentHTML('afterbegin','<div id="fpCalAddSet" style="margin-bottom:12px"></div>');el=$('fpCalAddSet')}
  const k=kind();
  el.innerHTML=`<b>היומן שלי</b><div class="meal-tabs" style="flex-wrap:wrap;margin-top:6px">${Object.keys(KINDS).map(x=>`<button type="button" class="chip${k===x?' active':''}" onclick="fpSetCalKind('${x}')">${KINDS[x]}</button>`).join('')}</div>
    <p class="muted" style="margin:6px 0 0;font-size:13px">${k?'אירוע שתוסיף באפליקציה ייכנס ליומן הזה, וההסבר למטה מתאים אליו.':'בחר, ואז "📅 הוסף ליומן שלי" יעבוד בלי לשאול.'}</p>
    ${k?`<p class="muted" style="margin:8px 0 0;font-size:13px">${HELP[k]}</p>`:''}`;
}
if(typeof renderSettings==='function'){const o=renderSettings;renderSettings=function(){const r=o.apply(this,arguments);try{injectCalSettings()}catch(_){}return r}}
/* the calendar box is drawn again by renderCalendarSettings */
if(typeof renderCalendarSettings==='function'){const o=renderCalendarSettings;renderCalendarSettings=function(){const r=o.apply(this,arguments);try{injectCalSettings(true)}catch(_){}return r}}
/* questionnaire: one small question in the activity step */
if(typeof renderOnb==='function'){
  const oR=renderOnb;
  renderOnb=function(){
    const r=oR.apply(this,arguments);
    try{const o=state.onb;if(!o)return r;if(o.d.calKind===undefined)o.d.calKind=kind()||guessKind();
      if(o.step===1){const fs=$('onbBody')&&$('onbBody').querySelector('fieldset');const panels=fs?fs.querySelectorAll('.onb-panel'):[];const panel=panels[panels.length-1];
        const html=`<div class="field" id="fpOnbCal" style="margin-top:14px"><label>באיזה יומן אתה משתמש בטלפון?</label>${chipRow('calKind',Object.keys(KINDS).map(x=>[x,KINDS[x]]))}<p class="muted" style="font-size:12px;margin:4px 0 0">ככה אירועים כמו מסעדות וארוחות משפחתיות יעברו בין היומן לאפליקציה. אפשר לשנות בהגדרות.</p></div>`;
        if(!$('fpOnbCal')){if(panel)panel.insertAdjacentHTML('beforeend',html);else if(fs)fs.insertAdjacentHTML('beforeend',html)}}
    }catch(e){console.error(e)}
    return r;
  };
  const oF=finishOnboarding;
  finishOnboarding=async function(){const k=state.onb&&state.onb.d&&state.onb.d.calKind;const r=await oF.apply(this,arguments);try{const sh=$('onbSheet');if(KINDS[k]&&sh&&sh.classList.contains('hide'))setKind(k,true)}catch(_){}return r};
}
})();
