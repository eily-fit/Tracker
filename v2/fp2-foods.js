/* FitPro 2.6.13 — מאגר המזון המתוקן:
   - מזונות בסיסיים בשמות יומיומיים (פרגית, לחם שחור...) ראשונים בחיפוש
   - כל הגרסאות של אותו מזון מקובצות, והשאר תחת "עוד אפשרויות"
   - פריטים מוסתרים (FFQ ופריטים חשודים) לא מופיעים בחיפוש
   - שאלון "איך אתה מבשל" שקובע את ברירת המחדל של השמן ואת גודל כף השמן
   - טעינת גרסה חדשה של tzameret.json גם כשיש עותק ישן שמור בטלפון
   הנתונים עצמם בקובץ tzameret.json (מפתחות נוספים: hidden, basics, families, oils). */
(function(){
'use strict';
if(typeof tzIngest!=='function'||typeof localFoodSearch!=='function')return;

const PROFILE_KEY='fp2.oilProfile';
const PROFILES={
  s:{label:'ספריי / כמעט בלי שמן',hint:'ריסוס במחבת, בלי כפות שמן',oil:'little',spoon:10},
  r:{label:'רגיל',hint:'כף שמן פה ושם בבישול',oil:'normal',spoon:10},
  g:{label:'בנדיבות',hint:'שמן בכל בישול, בכמות יפה',oil:'lots',spoon:13.5}
};
const X={hidden:new Set(),basics:[],famOf:new Map(),families:[],oils:new Set()};
const getProfile=()=>{
  try{const v=String(state&&state.data&&state.data.settings&&state.data.settings.oil_profile||'');if(PROFILES[v])return v}catch(_){}
  try{const p=localStorage.getItem(PROFILE_KEY);return PROFILES[p]?p:''}catch(_){return ''}};
/* something else is on screen (welcome, questionnaire, tour, another sheet): don't pop up over it */
function uiBusy(){
  try{
    if($('fpWelcome')||$('fpTour')||document.documentElement.classList.contains('onboarding-mode')||document.documentElement.classList.contains('entry-mode'))return true;
    if([...document.querySelectorAll('.overlay')].some(o=>!o.classList.contains('hide')&&getComputedStyle(o).display!=='none'))return true;
    if(window.FP2&&FP2.getProp&&FP2.getProp('NEW_ACCOUNT')==='1'&&FP2.getProp('TOUR_DONE')!=='1')return true;
  }catch(_){}
  return false;
}
function whenFree(fn,tries){tries=tries||0;if(tries>400)return;if(uiBusy())return setTimeout(()=>whenFree(fn,tries+1),3000);fn()}

/* ---------- ingest: keep the extra keys, drop hidden foods, apply the oil spoon ---------- */
function applySpoon(){
  const p=getProfile(),g=p?PROFILES[p].spoon:10;
  tz.foods.forEach(f=>{if(X.oils.has(f.code))f.units=f.units.map(u=>u[0]==='כף'?['כף',g]:u)});
}
const oIngest=tzIngest;
tzIngest=function(raw){
  const d=typeof raw==='string'?JSON.parse(raw):raw;
  oIngest.call(this,d);
  X.hidden=new Set(d.hidden||[]);X.oils=new Set(d.oils||[]);
  if(X.hidden.size)tz.foods=tz.foods.filter(f=>!X.hidden.has(f.code));
  const byCode=new Map(tz.foods.map(f=>[f.code,f]));
  X.families=(d.families||[]).map(([key,def,ids])=>({key,def,ids:ids.filter(i=>byCode.has(i))}));
  X.famOf=new Map();X.families.forEach((fam,i)=>fam.ids.forEach(id=>X.famOf.set(id,i)));
  X.basics=(d.basics||[]).map(([name,aliases,id,unit,grams,cooked])=>{
    const al=String(aliases||'').split(',').map(s=>s.trim()).filter(Boolean);
    return {name,id,unit,grams,cooked:!!cooked,n:normHe(name),al:al.map(normHe)};
  }).filter(b=>byCode.has(b.id));
  X.byCode=byCode;
  applySpoon();
};

/* ---------- newer tzameret.json on GitHub replaces an older saved copy ---------- */
let checked=false;
async function refreshData(){
  if(checked)return;checked=true;
  try{
    const r=await fetch('tzameret.json',{cache:'no-cache'});if(!r.ok)return;
    const t=await r.text(),v=(JSON.parse(t)||{}).v;
    if(v&&v!==tz.version){tzIngest(t);try{localStorage.setItem(TZ_STORE_KEY,t)}catch(_){}try{renderTzStatus()}catch(_){}}
  }catch(e){console.error(e)}
}
/* a saved copy from before this version has no extras: read it again through the new ingest */
const boot=setInterval(()=>{
  if(typeof state==='undefined'||!state.data)return;
  clearInterval(boot);
  setTimeout(async()=>{
    try{if(tz.ready&&!X.basics.length){const c=localStorage.getItem(TZ_STORE_KEY);if(c)tzIngest(c)}}catch(_){}
    await refreshData();
    try{const local=localStorage.getItem(PROFILE_KEY),acc=state.data.settings&&state.data.settings.oil_profile;if(PROFILES[local]&&!PROFILES[acc])saveProfileToAccount(local)}catch(_){}
    if(tz.ready)applySpoon();
    if(!getProfile())whenFree(()=>{if(!getProfile())askProfile()});
  },1500);
},700);

/* ---------- search: basics first, one result per family ---------- */
function basicHits(tokens){
  if(!tokens||!tokens.length||!X.basics.length)return [];
  const q=tokens.join(' '),vars=tokens.map(tzTokenVariants);
  const has=s=>vars.every(vs=>vs.some(v=>(' '+s+' ').includes(v)));
  const hits=[];
  X.basics.forEach(b=>{
    let s=0;
    if(b.n===q||b.al.includes(q))s=100;
    else if(b.n.startsWith(q)||b.al.some(a=>a.startsWith(q)))s=80;
    else if(has(b.n)||b.al.some(has))s=60;
    if(s)hits.push([s-b.n.length/100,b]);
  });
  return hits.sort((a,b)=>b[0]-a[0]).map(([,b])=>b);
}
function basicFood(b){
  const f=X.byCode.get(b.id);
  return {...f,name:b.name,fpSrc:f.name,fpBasic:true,fpUnit:b.unit,fpGrams:b.grams,fpCooked:b.cooked};
}
const oSearch=localFoodSearch;
localFoodSearch=function(q,limit=40){
  const r=oSearch.apply(this,arguments);
  try{
    if(!tz.ready||!X.basics.length||state.fpInMore)return r;
    const p=r.parsed||{};
    const bs=basicHits(p.tokens).slice(0,8).map(basicFood);
    const usedFam=new Set(),usedCode=new Set(),out=[];
    const fam=c=>X.famOf.get(c);
    bs.forEach(x=>{usedCode.add(x.code);const fi=fam(x.code);if(fi!=null)usedFam.add(fi);out.push(x)});
    (r.results||[]).forEach(x=>{
      if(x.source==='צמרת'&&x.code!=null){
        if(X.hidden.has(x.code)||usedCode.has(x.code))return;
        const fi=fam(x.code);
        if(fi!=null){if(usedFam.has(fi))return;usedFam.add(fi)}
        usedCode.add(x.code);
      }
      out.push(x);
    });
    r.results=out.slice(0,limit);
  }catch(e){console.error(e)}
  return r;
};

/* ---------- result card: source line + "עוד אפשרויות" ---------- */
function moreCount(x){
  if(state.fpInMore||x.source!=='צמרת'||x.code==null)return 0;
  const fi=X.famOf.get(x.code);return fi==null?0:X.families[fi].ids.length-1;
}
const oCard=foodResultCard;
foodResultCard=function(x,onTap){
  let html=oCard.apply(this,arguments);
  try{
    if(x.fpSrc)html=html.replace(/(<b>[\s\S]*?<\/b>)/,`$1<div class="muted" style="font-size:12px">${esc(x.fpSrc)}</div>`);
    const ctx=/^selectLocalFood/.test(onTap)?'local':/^chooseCustomIngredient/.test(onTap)?'custom':'';
    const n=ctx?moreCount(x):0;
    if(n>0){
      const btn=`<button type="button" class="chip" style="margin-top:8px" onclick="event.stopPropagation();fpShowMore(${x.code},'${ctx}')">עוד אפשרויות (${n})</button>`;
      const i=html.lastIndexOf('</div>');html=html.slice(0,i)+btn+html.slice(i);
    }
  }catch(e){console.error(e)}
  return html;
};
window.fpShowMore=function(code,ctx){
  const fi=X.famOf.get(code);if(fi==null)return;
  const items=X.families[fi].ids.map(id=>X.byCode.get(id)).filter(Boolean).sort((a,b)=>a.name.length-b.name.length);
  const local=ctx==='local',key=local?'localResults':'customSearchResults',box=local?'foodResults':'customFoodResults';
  state.fpPrev={ctx,list:state[key]};state[key]=items;
  if(local)state.showAllFoods=true;else state.customShowAll=true;
  state.fpInMore=true;
  try{local?renderLocalFoodResults():renderCustomLocalResults()}finally{state.fpInMore=false}
  const el=$(box);if(el)el.insertAdjacentHTML('afterbegin',`<button type="button" class="btn light full" style="margin-top:10px" onclick="fpBackFromMore()">→ חזרה לתוצאות</button><div class="muted" style="margin-top:8px">כל הגרסאות של ${esc(X.families[fi].key)}:</div>`);
};
window.fpBackFromMore=function(){
  const p=state.fpPrev;if(!p)return;state.fpPrev=null;
  if(p.ctx==='local'){state.localResults=p.list;state.showAllFoods=false;renderLocalFoodResults()}
  else{state.customSearchResults=p.list;state.customShowAll=false;renderCustomLocalResults()}
};

/* ---------- generic word (לחם, גבינה, אורז): first only the basic foods ---------- */
function basicsFirst(listKey,showKey,boxId,render,ctxFn){
  return function(){
    const all=state[listKey]||[],n=all.findIndex(x=>!x.fpBasic),nb=n<0?all.length:n;
    if(state[showKey]||nb<2||all.length<=nb)return render.apply(this,arguments);
    state[listKey]=all.slice(0,nb);state[showKey]=true;
    try{render.apply(this,arguments)}finally{state[listKey]=all;state[showKey]=false}
    const box=$(boxId);
    if(box){box.querySelectorAll('button.btn.light.full').forEach(b=>{if(/הצג עוד/.test(b.textContent))b.remove()});
      box.insertAdjacentHTML('beforeend',`<button class="btn light full" onclick="${ctxFn}">עוד ${all.length-nb} סוגים</button>`)}
  };
}
renderLocalFoodResults=basicsFirst('localResults','showAllFoods','foodResults',renderLocalFoodResults,"state.showAllFoods=true;renderLocalFoodResults()");
renderCustomLocalResults=basicsFirst('customSearchResults','customShowAll','customFoodResults',renderCustomLocalResults,"state.customShowAll=true;renderCustomLocalResults()");

/* ---------- default portion of a basic food ---------- */
const oPortion=defaultPortion;
defaultPortion=function(x,parsed){
  try{const L=x&&LASTU[calKey(x)];
    if(L&&!(parsed&&(parsed.amount!=null||parsed.unitHint||parsed.grams))){
      if(L.u==='גרם'&&L.a>0)return {amount:L.a,unit:'גרם'};
      if((x.units||[]).some(u=>u[0]===L.u))return {amount:1,unit:L.u};
    }}catch(_){}
  if(x&&x.fpBasic&&!(parsed&&(parsed.amount!=null||parsed.unitHint||parsed.grams))){
    if(x.fpUnit==='גרם'&&x.fpGrams)return {amount:x.fpGrams,unit:'גרם'};
    if((x.units||[]).some(u=>u[0]===x.fpUnit))return {amount:1,unit:x.fpUnit};
  }
  return oPortion.apply(this,arguments);
};


/* ---------- unit weights: package > mine > users' average > ≈ database estimate ---------- */
const CAL_KEY='fp2.unitCal',CROWD_MIN=3;
let CAL={};try{CAL=JSON.parse(localStorage.getItem(CAL_KEY)||'{}')||{}}catch(_){CAL={}}
const saveCal=()=>{try{localStorage.setItem(CAL_KEY,JSON.stringify(CAL))}catch(_){}};
function calKey(x){if(!x)return '';const id=String(x.sourceId||'');return id||('n:'+normHe(x.fpSrc||x.name||''))}
function calInfo(x,unit){
  if(!x||!unit||unit==='גרם'||unit==='מ״ל')return null;
  const raw=(x.units||[]).find(u=>u[0]===unit);
  if(unit==='מנה מהאריזה'&&raw)return {g:raw[1],src:'package'};
  const c=CAL[calKey(x)+'|'+unit];
  if(c&&c.mine)return {g:c.mine,src:'mine'};
  if(c&&c.crowd&&c.n>=CROWD_MIN)return {g:c.crowd,src:'crowd',n:c.n};
  return raw?{g:raw[1],src:raw[2]?'guess':'db'}:null;
}
async function syncCal(){
  try{if(!window.FP2||!FP2.calLoad)return;const r=await FP2.calLoad();if(!r)return;
    const merged={};Object.keys(r).forEach(k=>merged[k]=r[k]);
    Object.keys(CAL).forEach(k=>{if(CAL[k]&&CAL[k].mine&&!(merged[k]&&merged[k].mine))merged[k]=Object.assign({},merged[k]||{},{mine:CAL[k].mine,pending:true})});
    CAL=merged;saveCal();
    Object.keys(CAL).filter(k=>CAL[k].pending).forEach(k=>{const i=k.lastIndexOf('|');FP2.calPut(k.slice(0,i),k.slice(i+1),CAL[k].mine).then(()=>{delete CAL[k].pending;saveCal()}).catch(()=>{})});
  }catch(e){console.warn('unitCal',e&&e.message)}
}
setTimeout(syncCal,4000);setInterval(syncCal,6*3600*1000);

const oUnitGrams=foodUnitGrams;
foodUnitGrams=function(x,unit){
  const c=calInfo(x,unit);if(c&&(c.src==='mine'||c.src==='crowd'))return c.g;
  return oUnitGrams.apply(this,arguments);
};
const oUnitLabel=unitLabel;
unitLabel=function(x,u){
  const c=calInfo(x,u);if(!c)return oUnitLabel.apply(this,arguments);
  const tag=c.src==='mine'?' · שלך':c.src==='crowd'?' · ממוצע משתמשים':c.src==='package'?' · מהאריזה':'';
  return `${u} (${fmt(c.g)} ג׳${tag})`;
};
function weightHint(){
  const f=$('foodWeightField'),x=state.selectedFood;if(!f||!x)return;
  let h=$('fpWeightHint');if(!h){f.insertAdjacentHTML('beforeend','<div id="fpWeightHint" class="muted" style="font-size:12px;margin-top:4px"></div>');h=$('fpWeightHint')}
  const c=calInfo(x,$('foodUnit').value);
  h.textContent=!c?'':c.src==='mine'?'✓ המשקל שלך — נשמר מפעם קודמת.':c.src==='crowd'?`✓ ממוצע של ${c.n} משתמשים ששקלו את המוצר הזה.`:c.src==='package'?'✓ לפי האריזה.':'';
}
const oUpd=updateFoodChoice;
updateFoodChoice=function(){const r=oUpd.apply(this,arguments);try{weightHint()}catch(e){}return r};
const LASTU_KEY='fp2.lastUnit';
let LASTU={};try{LASTU=JSON.parse(localStorage.getItem(LASTU_KEY)||'{}')||{}}catch(_){LASTU={}}
const oSave=saveFood;
saveFood=async function(){
  try{const x=state.selectedFood,u=$('foodUnit').value,a=Number($('foodAmount').value)||0,k=calKey(x);
    if(k&&u){LASTU[k]={u,a};const ks=Object.keys(LASTU);if(ks.length>400)delete LASTU[ks[0]];try{localStorage.setItem(LASTU_KEY,JSON.stringify(LASTU))}catch(_){}}}catch(_){}
  try{
    const x=state.selectedFood,u=$('foodUnit').value,g=Number(state.foodGramsPerUnit);
    if(x&&u&&u!=='גרם'&&u!=='מ״ל'&&u!=='מנה מהאריזה'&&g>0){
      const c=calInfo(x,u),k=calKey(x);
      if(k&&(!c||Math.abs(g-c.g)>=1)){
        CAL[k+'|'+u]=Object.assign({},CAL[k+'|'+u]||{},{mine:g,pending:true});saveCal();
        if(window.FP2&&FP2.calPut)FP2.calPut(k,u,g).then(()=>{delete CAL[k+'|'+u].pending;saveCal()}).catch(()=>{});
      }
    }
  }catch(e){console.error(e)}
  return oSave.apply(this,arguments);
};

/* ---------- oil default for food cooked at home ---------- */
const NOFAT=/ללא תוספת (שומן|שמן)|ללא שמן|בלי שמן/;
const oOpen=openFoodChoice;
openFoodChoice=function(x){
  const r=oOpen.apply(this,arguments);
  try{
    const p=getProfile(),f=state.selectedFood||x;
    if(p&&f&&(f.fpCooked||(f.source==='צמרת'&&NOFAT.test(f.fpSrc||f.name)))){
      state.foodOil={mode:PROFILES[p].oil,grams:0};renderFoodOil(true);updateFoodChoiceTotals();
    }
  }catch(e){console.error(e)}
  return r;
};

/* ---------- questionnaire ---------- */
function profileButtons(cur,handler){
  return Object.keys(PROFILES).map(k=>`<button type="button" class="btn ${cur===k?'':'light '}full" style="margin-top:8px;text-align:right;display:block" onclick="${handler}('${k}')"><b>${PROFILES[k].label}</b><div class="muted" style="font-size:12px">${PROFILES[k].hint}</div></button>`).join('');
}
function saveProfileToAccount(k){
  try{if(state.data&&state.data.settings)state.data.settings.oil_profile=k}catch(_){}
  try{if(typeof call==='function')call('saveSettings',{oil_profile:k}).catch(e=>console.warn('oil_profile',e&&e.message))}catch(_){}
}
function setProfile(k,silent){
  if(!PROFILES[k])return;
  try{localStorage.setItem(PROFILE_KEY,k)}catch(_){}
  saveProfileToAccount(k);
  if(tz.ready)applySpoon();
  const s=$('fpOilSheet');if(s)s.remove();
  try{injectSettings(true)}catch(_){}
  if(!silent)toast('נשמר: '+PROFILES[k].label);
}
window.fpSetOilProfile=setProfile;
function askProfile(){
  if($('fpOilSheet'))return;
  document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="fpOilSheet"><div class="sheet"><h3 style="margin:0 0 6px">איך אתה מבשל בבית?</h3><p class="muted" style="margin:0">לפי זה נקבעת ברירת המחדל של ״שמן נוסף״ במזונות מבושלים, וגודל ״כף שמן״ (10 או 13.5 גרם). אפשר לשנות תמיד בהגדרות, ובכל מזון אפשר לבחור אחרת.</p>${profileButtons('', 'fpSetOilProfile')}</div></div>`);
}
window.fpAskOilProfile=askProfile;


/* ---------- the same question inside the onboarding questionnaire (step "הארוחות הקבועות שלך") ---------- */
if(typeof renderOnb==='function'){
  const ONB_OIL_STEP=3;
  const oRenderOnb=renderOnb;
  renderOnb=function(){
    const r=oRenderOnb.apply(this,arguments);
    try{
      const o=state.onb;if(!o)return r;
      if(o.d.oil===undefined)o.d.oil=getProfile()||'';
      if(o.step===ONB_OIL_STEP){
        const fs=$('onbBody')&&$('onbBody').querySelector('fieldset');
        const panel=fs&&fs.querySelector('.onb-panel');
        const html=`<div class="field" id="fpOnbOil" style="margin-top:14px"><label>ואיך אתה מבשל בבית?</label>${chipRow('oil',Object.keys(PROFILES).map(k=>[k,PROFILES[k].label]))}</div>`;
        if(panel)panel.insertAdjacentHTML('beforeend',html);else if(fs)fs.insertAdjacentHTML('beforeend',html);
      }
    }catch(e){console.error(e)}
    return r;
  };
  const oValid=onbValid;
  onbValid=function(step){const e=oValid.apply(this,arguments);if(e)return e;try{if(step===ONB_OIL_STEP&&!PROFILES[state.onb.d.oil])return 'בחר איך אתה מבשל בבית'}catch(_){}return ''};
  const oFinish=finishOnboarding;
  finishOnboarding=async function(){
    const k=state.onb&&state.onb.d&&state.onb.d.oil;
    const r=await oFinish.apply(this,arguments);
    try{const sheet=$('onbSheet');if(PROFILES[k]&&sheet&&sheet.classList.contains('hide'))setProfile(k,true)}catch(e){console.error(e)}
    return r;
  };
}

/* ---------- settings: the same choice inside the Tzameret section ---------- */
function injectSettings(force){
  const s=[...document.querySelectorAll('#settings summary')].find(x=>/צמרת/.test(x.textContent));if(!s)return;
  const body=s.parentElement.querySelector('.settings-body');if(!body)return;
  let el=$('fpOilSettings');
  if(el&&!force)return;
  if(!el){body.insertAdjacentHTML('afterbegin','<div id="fpOilSettings" style="margin-bottom:12px"></div>');el=$('fpOilSettings')}
  const p=getProfile();
  el.innerHTML=`<b>איך אתה מבשל בבית?</b><div class="muted" style="font-size:12px">${p?'כף שמן = '+PROFILES[p].spoon+' ג׳ · שמן נוסף ברירת מחדל: '+({little:'מעט',normal:'רגיל',lots:'הרבה'})[PROFILES[p].oil]:'עוד לא נבחר'}</div>${profileButtons(p,'fpSetOilProfile')}`;
}
const oSettings=window.renderSettings;
if(typeof oSettings==='function')window.renderSettings=function(){const r=oSettings.apply(this,arguments);try{injectSettings(true)}catch(e){}return r};

/* ---------- layer 5: the weight trend checks the food log (every 10 days, last 14 days), by the goal of the process ---------- */
const CALIB_KEY='fp2.calibShown';
const daysBetween=(a,b)=>Math.round((new Date(b+'T12:00:00Z')-new Date(a+'T12:00:00Z'))/86400000);
async function calibCheck(force){
  try{
    if(typeof call!=='function'||!state.data||!state.data.settings||$('fpOilSheet'))return;
    const today=state.todayDate||state.data.date;if(!today)return;
    let last='';try{last=localStorage.getItem(CALIB_KEY)||''}catch(_){}
    if(!force&&last&&daysBetween(last,today)<10)return;
    const lc=String(state.data.settings.last_checkin||'').replace(/^ci:/,'');
    if(!force&&lc&&daysBetween(lc,today)<3)return;            // a check-in just showed the same numbers
    const r=await call('getWeeklyReview',today),s=r&&r.suggestion;
    if(s&&s.ready&&s.onTrack&&(s.weighIns||0)>=6){try{localStorage.setItem(CALIB_KEY,today)}catch(_){}toast(`בדקתי את השבועיים האחרונים: ${goalMonthLine(s)} ✓ ממשיכים ככה`);return}
    if(!s||!s.ready||s.onTrack||(s.weighIns||0)<6){if(force)toast(s&&!s.ready?s.message:'הכל בקצב. אין מה לשנות.');return}
    try{localStorage.setItem(CALIB_KEY,today)}catch(_){}
    showCalib(s);
  }catch(e){console.warn('calib',e&&e.message)}
}
const GOAL_NAMES={lose:'חיטוב',gain:'מסה נקייה',recomp:'שמירה על שריר וירידה בשומן',maintain:'שמירה'};
const kgMonth=w=>{const m=Math.round(w*4.3*10)/10;return (m>0?'+':m<0?'−':'')+Math.abs(m).toFixed(1)+' ק״ג בחודש'};
function goalMonthLine(s){return `${GOAL_NAMES[s.goal]||'המטרה'}: מתוכנן ${kgMonth(s.plannedWeek||0)}, בפועל ${kgMonth(s.actualWeek||0)}`}
function showCalib(s){
  if($('fpCalibSheet'))return;
  let prof={};try{prof=JSON.parse(state.data.settings.profile_json||'{}')}catch(_){}
  const est=prof.calculation&&Number(prof.calculation.tdee);
  const lines=[`לפי היומן אכלת בממוצע <b>${s.intake}</b> קל׳ ביום.`];
  if(est){const exp=(s.intake-est)*7/7700;lines.push(`לפי זה היית אמור: <b>${kgWeek(exp)}</b>.`)}
  lines.push(`בפועל: <b>${kgWeek(s.actualWeek)}</b>.`);
  lines.push(`🎯 ${goalMonthLine(s)}.`);
  let why='';
  if(est){const gap=Math.round((est-s.tdee)/10)*10;
    if(gap>=50)why=`כלומר בערך <b>${gap} קל׳ ביום</b> לא נכנסים לחשבון: שמן, רטבים, יחידות גדולות ממה שחשבנו. זה קורה כמעט לכולם, ולכן מתקנים את היעד ולא את הרישום.`;
    else if(gap<=-50)why=`כלומר הגוף שלך שורף בערך <b>${-gap} קל׳ ביום</b> יותר ממה שחישבנו.`}
  const up=s.delta>0;
  document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="fpCalibSheet"><div class="sheet"><h3 style="margin:0 0 8px">בדקתי את השבועיים האחרונים</h3>
    <div style="display:grid;gap:4px">${lines.map(l=>`<div>${l}</div>`).join('')}</div>
    ${why?`<p class="muted" style="margin:10px 0 0">${why}</p>`:''}
    <p style="margin:12px 0 0"><b>ההמלצה: ${up?'להעלות':'להוריד'} את היעד היומי ל-${s.suggested} קל׳</b> <span class="muted">(${Math.abs(s.delta)} ${up?'יותר':'פחות'}. משנים עד 150 בכל פעם)</span></p>
    <button type="button" class="btn full" style="margin-top:12px" onclick="fpCalibApply(${s.suggested})">עדכן ל-${s.suggested}</button>
    <button type="button" class="btn light full" style="margin-top:8px" onclick="fpCalibClose()">לא עכשיו</button>
    <p class="muted" style="font-size:12px;margin:8px 0 0">החישוב לפי ${s.loggedDays} ימי רישום ו-${s.weighIns} שקילות. נבדוק שוב בעוד 10 ימים.</p></div></div>`);
}
window.fpCalibClose=function(){const el=$('fpCalibSheet');if(el)el.remove()};
window.fpCalibApply=async function(cal){
  try{const r=await call('applyCalorieGoal',cal);if(r)state.data.settings=r;try{recalcTotalsLocal()}catch(_){}try{renderDay()}catch(_){}toast('היעד עודכן ל-'+cal+' קל׳')}
  catch(e){toast(e.message||'לא הצלחתי לעדכן',true)}
  fpCalibClose();
};
window.fpCalibCheck=()=>calibCheck(true);
window.fpCalibPreview=showCalib;
const calibBoot=setInterval(()=>{if(typeof state!=='undefined'&&state.data&&state.data.settings){clearInterval(calibBoot);setTimeout(()=>whenFree(()=>calibCheck(false)),5000)}},1000);
})();
