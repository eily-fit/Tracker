/* FitPro 2.6.6 — מאגר המזון המתוקן:
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
const getProfile=()=>{try{const p=localStorage.getItem(PROFILE_KEY);return PROFILES[p]?p:''}catch(_){return ''}};

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
    if(!getProfile())askProfile();
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
    const bs=basicHits(p.tokens).slice(0,4).map(basicFood);
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
/* ---------- default portion of a basic food ---------- */
const oPortion=defaultPortion;
defaultPortion=function(x,parsed){
  if(x&&x.fpBasic&&!(parsed&&(parsed.amount!=null||parsed.unitHint||parsed.grams))){
    if(x.fpUnit==='גרם'&&x.fpGrams)return {amount:x.fpGrams,unit:'גרם'};
    if((x.units||[]).some(u=>u[0]===x.fpUnit))return {amount:1,unit:x.fpUnit};
  }
  return oPortion.apply(this,arguments);
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
function setProfile(k){
  if(!PROFILES[k])return;
  try{localStorage.setItem(PROFILE_KEY,k)}catch(_){}
  if(tz.ready)applySpoon();
  const s=$('fpOilSheet');if(s)s.remove();
  try{injectSettings(true)}catch(_){}
  toast('נשמר: '+PROFILES[k].label);
}
window.fpSetOilProfile=setProfile;
function askProfile(){
  if($('fpOilSheet'))return;
  document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="fpOilSheet"><div class="sheet"><h3 style="margin:0 0 6px">איך אתה מבשל בבית?</h3><p class="muted" style="margin:0">לפי זה נקבעת ברירת המחדל של ״שמן נוסף״ במזונות מבושלים, וגודל ״כף שמן״ (10 או 13.5 גרם). אפשר לשנות תמיד בהגדרות, ובכל מזון אפשר לבחור אחרת.</p>${profileButtons('', 'fpSetOilProfile')}</div></div>`);
}
window.fpAskOilProfile=askProfile;

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
})();
