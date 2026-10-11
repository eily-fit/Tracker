/* FitPro 2.19.0 — food:
   1. "🍽 תבנה לי תפריט" in the fixed-meals screen: what do you like → build everything / only part (keep the meals you like) /
      I build myself (with "תגביל אותי").
   2. "🎯 תגביל אותי" in the meal builder: pick the foods, say "up to 800", and the amounts are set for you.
      Change one item and the others move so the total stays; carbs and fat move first, protein stays;
      🔒 locks an item so it never moves. */
(function(){
'use strict';
if(typeof renderCustomIngredientsRaw!=='function'||!window.FPM)return;
const prop=k=>{try{return FP2.getProp(k)||''}catch(_){return ''}};
const setProp=(k,v)=>{try{FP2.setProp(k,v)}catch(_){}};
const J=(k,d)=>{try{return JSON.parse(prop(k)||'')||d}catch(_){return d}};
document.head.insertAdjacentHTML('beforeend',`<style id="fp219fcss">
#fpCapBox{background:var(--card,#171C22);border:1px solid var(--line,#2C3640);border-radius:14px;padding:10px 12px;margin:10px 0}
#fpCapBox .row{align-items:center}
.fp-lock{border:1px solid var(--line,#2C3640);background:none;color:inherit;border-radius:10px;padding:4px 7px;font-size:14px;cursor:pointer}
.fp-lock.on{background:#2B3A1B;border-color:var(--brand,#D7F36B)}
.fpF-meal{background:#1F262E;border:1px solid var(--line,#2C3640);border-radius:12px;padding:8px 10px;margin:6px 0;display:flex;justify-content:space-between;align-items:center;gap:8px;width:100%;text-align:right;color:inherit;font:inherit}
.fpF-meal.on{border-color:var(--brand,#D7F36B);background:#2B3A1B}
</style>`);

/* ---------- תגביל אותי ---------- */
let CAP=null,LOCK=new Set(),busy=false;
const kcal=x=>Number(x.calories)||0;
const isProt=x=>kcal(x)>0&&(Number(x.protein)||0)*4/kcal(x)>=.35;
function setAmount(x,amount){
  if(x.unit==='גרם'||x.unit==='מ״ל')amount=Math.max(5,Math.round(amount/5)*5);else amount=Math.max(.5,Math.round(amount*2)/2);
  if(x.per){x.amount=amount;try{recalcCustomIngredient(x)}catch(_){}return}
  const ratio=x.amount?amount/x.amount:1;['calories','protein','carbs','fat'].forEach(k=>x[k]=Math.round((Number(x[k])||0)*ratio*10)/10);x.amount=amount}
function applyCap(anchor){
  if(!CAP||busy)return;const list=state.customIngredients||[];if(!list.length)return;busy=true;
  try{for(let round=0;round<3;round++){
    const fixed=(x,i)=>LOCK.has(i)||i===anchor||!(kcal(x)>0);const fixedKc=list.reduce((s,x,i)=>s+(fixed(x,i)?kcal(x):0),0);
    const cf=list.map((x,i)=>i).filter(i=>!fixed(list[i],i)&&!isProt(list[i])),pr=list.map((x,i)=>i).filter(i=>!fixed(list[i],i)&&isProt(list[i]));
    const cfKc=cf.reduce((s,i)=>s+kcal(list[i]),0),prKc=pr.reduce((s,i)=>s+kcal(list[i]),0);const need=CAP-fixedKc;
    if(Math.abs(need-cfKc-prKc)<15)break;
    /* carbs and fat move first; protein only if they can't do it alone */
    let fCf=cfKc?(need-prKc)/cfKc:0,fPr=1;
    if(!cfKc||fCf<.25){fCf=cfKc?.25:0;fPr=prKc?Math.max(.25,(need-cfKc*fCf)/prKc):1}
    if(fCf>4){fCf=4}
    cf.forEach(i=>setAmount(list[i],list[i].amount*fCf));if(fPr!==1)pr.forEach(i=>setAmount(list[i],list[i].amount*fPr));
  }}finally{busy=false}
}
function total(){return Math.round((state.customIngredients||[]).reduce((s,x)=>s+kcal(x),0))}
function capBox(){const tot=total();
  return `<div id="fpCapBox"><b>🎯 תגביל אותי</b><p class="muted" style="margin:2px 0 8px;font-size:13px">כתוב עד כמה קלוריות, והכמויות יסתדרו לבד. משנים מצרך אחד, השאר זזים. 🔒 נועל מצרך.</p>
    <div class="row"><div class="field" style="margin:0"><input id="fpCapIn" type="number" inputmode="numeric" placeholder="למשל 800" value="${CAP||''}"></div><button type="button" class="btn ${CAP?'light':''}" onclick="fpCap()">${CAP?'עדכן':'תגביל'}</button>${CAP?'<button type="button" class="btn light" onclick="fpCapOff()">בטל</button>':''}</div>
    ${CAP?`<p style="margin:8px 0 0">עד <b>${CAP}</b> קל׳ · עכשיו <b>${tot}</b>${Math.abs(tot-CAP)>40&&tot>CAP?' · <span style="color:#F09595">אי אפשר להוריד יותר בלי לשנות מצרך נעול</span>':''}</p>`:''}</div>`}
const oRaw=renderCustomIngredientsRaw;
renderCustomIngredientsRaw=function(){const r=oRaw.apply(this,arguments);try{
  document.querySelectorAll('#customIngredients .custom-ingredient').forEach((row,i)=>{if(row.querySelector('.fp-lock'))return;const b=document.createElement('button');b.type='button';b.className='fp-lock'+(LOCK.has(i)?' on':'');b.textContent=LOCK.has(i)?'🔒':'🔓';b.setAttribute('aria-label',LOCK.has(i)?'בטל נעילה':'נעל מצרך');b.onclick=()=>{if(LOCK.has(i))LOCK.delete(i);else LOCK.add(i);renderCustomIngredients()};row.appendChild(b)});
  let box=$('fpCapBox');const html=capBox();if(box)box.outerHTML=html;else{const t=$('customTotals');if(t)t.insertAdjacentHTML('afterend',html)}}catch(e){console.error(e)}return r};
const oScale=scaleCustomIngredient;
scaleCustomIngredient=function(i){const r=oScale.apply(this,arguments);if(CAP&&!busy){applyCap(i);try{renderCustomIngredients()}catch(_){}}return r};
const oRemove=removeCustomIngredient;removeCustomIngredient=function(i){const n=new Set();LOCK.forEach(k=>{if(k<i)n.add(k);else if(k>i)n.add(k-1)});LOCK=n;return oRemove.apply(this,arguments)};
window.fpCap=function(){const v=Math.round(Number(($('fpCapIn')||{}).value)||0);if(!(v>=50&&v<=3000))return toast('כתוב מספר קלוריות, למשל 800',true);CAP=v;applyCap(-1);renderCustomIngredients();const n=($('customMealName')||{}).value;if(n){const c=J('MEAL_CAPS',{});c[n]=v;setProp('MEAL_CAPS',JSON.stringify(c))}};
window.fpCapOff=function(){CAP=null;renderCustomIngredients()};
const oOpen=openCustomMealBuilder;openCustomMealBuilder=function(){LOCK=new Set();CAP=null;const r=oOpen.apply(this,arguments);try{const n=($('customMealName')||{}).value;const c=J('MEAL_CAPS',{});if(n&&c[n])CAP=c[n];if(window.__fpCapPreset){CAP=window.__fpCapPreset;window.__fpCapPreset=null}renderCustomIngredients()}catch(_){}return r};

/* ---------- 🍽 תבנה לי תפריט ---------- */
function answers(){let p={};try{p=JSON.parse(state.data.settings.profile_json||'{}')||{}}catch(_){}
  const pref=J('MENU_PREFS',{});return{diet:p.diet||'all',no:Array.isArray(p.no)?p.no:[],prod:Array.isArray(pref.prod)?pref.prod.slice():null,bread:pref.bread||['whole','crisp'],milk:pref.milk||(p.diet==='vegan'?'soy':'reg'),
    meals:prop('MEAL_MODE')||p.meals||'3',free:Number(state.data.settings.free_calories_goal)||250,cook:String(state.data.settings.oil_profile||'k'),goal:p.goal||'recomp',dayCal:Number(state.data.settings.calorie_goal)||2200}}
let B=null;
function customMeals(){return Object.values(state.data.meals||{}).flat().filter(m=>m.isCustom)}
function sheet(body){let s=$('fpBuild');if(!s){document.body.insertAdjacentHTML('beforeend','<div class="overlay" id="fpBuild"><div class="sheet" style="max-height:92vh;overflow:auto"></div></div>');s=$('fpBuild')}
  s.querySelector('.sheet').innerHTML=`<div class="sheet-head"><h3 style="margin:0">🍽 תבנה לי תפריט</h3><button type="button" class="trash" aria-label="סגור" onclick="fpBuildClose()">✕</button></div>${body}`}
window.fpBuildClose=()=>{const s=$('fpBuild');if(s)s.remove();B=null};
window.fpBuild=function(){B={a:answers(),step:'like',keep:{}};FPM.use(B.a);if(!B.a.prod)B.a.prod=FPM.prodSet().slice();draw()};
function draw(){const a=B.a;FPM.use(a);const vp=FPM.products(),S=FPM.prodSet();
  if(B.step==='like'){const has=customMeals().length;
    sheet(`<p class="muted" style="margin:0 0 8px">מה אתה אוהב לאכול? נבנה מזה ארוחות שמתאימות ליעד שלך (${a.dayCal.toLocaleString('he-IL')} קל׳ ביום).</p>
      <div class="meal-tabs" style="flex-wrap:wrap">${vp.map(p=>`<button type="button" class="chip${S.includes(p.id)?' active':''}" onclick="fpBuildProd('${p.id}')">${a.diet==='vegan'&&p.vn?p.vn:p.n}</button>`).join('')}</div>
      ${has?'<p style="margin:12px 0 6px"><b>יש לך כבר ארוחות קבועות.</b> מה לעשות?</p>':''}
      <button type="button" class="btn full" style="margin-top:8px" onclick="fpBuildAll()">${has?'תבנה מחדש את כל התפריט':'תבנה לי תפריט'}</button>
      ${has?'<button type="button" class="btn light full" style="margin-top:8px" onclick="fpBuildPart()">רק חלק: להשאיר ארוחות שאני אוהב</button>':''}
      <button type="button" class="btn light full" style="margin-top:8px" onclick="fpBuildSelf()">אני בונה לבד, עם ״תגביל אותי״</button>`);return}
  if(B.step==='part'){const ms=customMeals();
    sheet(`<p class="muted" style="margin:0 0 8px">סמן את הארוחות שאתה רוצה להשאיר. השאר יתחלפו בחדשות.</p>${['בוקר','צהריים','ערב'].map(c=>{const l=ms.filter(m=>m.category===c);return l.length?`<b style="display:block;margin-top:8px">${c}</b>${l.map(m=>`<button type="button" class="fpF-meal${B.keep[m.id]?' on':''}" onclick="fpBuildKeep('${m.id}')"><span>${esc(m.title||m.option)}</span><span>${B.keep[m.id]?'✓ להשאיר':'להחליף'}</span></button>`).join('')}`:''}).join('')}
      <div class="row" style="margin-top:10px"><button type="button" class="btn light" onclick="fpBuildBack()">› חזרה</button><button type="button" class="btn" onclick="fpBuildRun(true)">בנה את השאר</button></div>`);return}
  if(B.step==='busy')sheet('<div style="text-align:center;padding:30px 0"><div class="fpq-spin" style="margin:0 auto 12px;width:44px;height:44px;border-radius:50%;border:4px solid #2C3640;border-top-color:#D7F36B;animation:fpqsp 1s linear infinite"></div>בונה…</div>');
}
window.fpBuildDraw=draw;window.fpBuildBack=()=>{if(B){B.step='like';draw()}};
window.fpBuildProd=id=>{FPM.use(B.a);const s=FPM.prodSet();const i=s.indexOf(id);if(i>=0)s.splice(i,1);else s.push(id);B.a.prod=s;draw()};
window.fpBuildKeep=id=>{B.keep[id]=!B.keep[id];draw()};
window.fpBuildAll=()=>{const has=customMeals().length;if(has&&!confirm('להחליף את כל הארוחות הקבועות שלך בתפריט חדש?'))return;fpBuildRun(false)};
window.fpBuildPart=()=>{B.step='part';draw()};
window.fpBuildSelf=()=>{fpBuildClose();try{showView('meals')}catch(_){}openCustomMealBuilder();toast('בוחרים מצרכים, ואז ״🎯 תגביל אותי״')};
window.fpBuildRun=async function(part){
  const a=B.a;setProp('MENU_PREFS',JSON.stringify({prod:a.prod,bread:a.bread,milk:a.milk}));B.step='busy';draw();
  try{FPM.use(a);FPM.reseed();const sets=FPM.sets(null);const ms=customMeals();const keep=part?ms.filter(m=>B.keep[m.id]):[];const remove=ms.filter(m=>!keep.includes(m)).map(m=>m.id);
    const meals=[];sets.forEach(m=>{const cat=m.name==='ביניים'?'צהריים':m.name;const kept=keep.filter(k=>k.category===cat).length;m.opts.slice(0,Math.max(0,4-kept)).forEach(o=>meals.push({category:cat,name:(m.name==='ביניים'?'ביניים: ':'')+o.t,ingredients:FPM.ingredients(o)}))});
    state.data=await call('saveMenuMeals',{meals,remove,date:state.date});try{saveCachedState()}catch(_){}try{renderAll()}catch(_){renderMeals()}fpBuildClose();
    toast(part?`נשארו ${keep.length} ארוחות, נוספו ${meals.length} חדשות`:`נבנה תפריט חדש: ${meals.length} ארוחות`)}
  catch(e){toast(e.message,true);if(B){B.step='like';draw()}}};
/* the button, in the fixed-meals screen */
function button(){const v=$('meals');if(!v||$('fpBuildBtn'))return;const b=v.querySelector('button[onclick="openCustomMealBuilder()"]');if(!b)return;
  b.insertAdjacentHTML('afterend','<button type="button" class="btn full" id="fpBuildBtn" style="margin-top:8px" onclick="fpBuild()">🍽 תבנה לי תפריט</button>')}
button();setInterval(button,3000);
})();
