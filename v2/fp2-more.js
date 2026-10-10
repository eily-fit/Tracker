/* FitPro 2.15.0
   - your own foods: grams work for a food you saved as "מנה" or "יחידה" (it was counted as if 1 ג׳ = 1 מנה).
   - your own foods come first in the search.
   - a logged meal: change the total calories too; tapping a food opens its edit; edit calories by hand.
   - saved meals: "כמה אכלת?" — ½, 1, 2… or units (בצל ממולא ×2).
   - meal builder: add items with AI.
   - the days on top: move a week back or forward (plan food ahead).
   - popups only on the home screen, never in the middle of adding food or a workout. */
(function(){
'use strict';
const n1=v=>Math.round((Number(v)||0)*10)/10;
document.head.insertAdjacentHTML('beforeend',`<style>
#fpWeekNav{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 6px}
#fpWeekNav button{border:0;background:none;color:var(--brand,#D7F36B);font:inherit;font-size:14px;padding:6px 4px;cursor:pointer}
#fpWeekNav span{color:var(--muted,#93A09A);font-size:13px}
#fpWeekNav .fp-wk-today{border:1px solid var(--brand,#D7F36B);border-radius:10px;padding:3px 10px}
.fp-mealx{margin:4px 0 10px;padding:10px;border:1px solid var(--line,#2A333C);border-radius:12px}
.fp-mealx b{display:block;margin-bottom:6px;font-size:14px}
.fp-mealx .fp-step{display:inline-flex;align-items:center;gap:2px;border:1px solid var(--line,#2A333C);border-radius:10px;padding:2px}
.fp-mealx .fp-step button{width:30px;height:30px;border:0;border-radius:8px;background:var(--card,#171C22);color:inherit;font:inherit;font-size:18px}
.fp-mealx .fp-step b{display:inline-block;min-width:30px;text-align:center;margin:0}
#entries .entry>div:first-child{cursor:pointer}
</style>`);

/* ---------- 1. grams for a food saved per "מנה" / "יחידה" ---------- */
const GR=u=>!u||u==='גרם'||u==='מ״ל';
function baseGrams(x){if(!x)return 0;if(GR(x.unit))return Number(x.baseQty)||100;const h=(x.units||[]).find(v=>v[0]===x.unit);return h&&h[1]>0?(Number(x.baseQty)||1)*h[1]:0}
if(typeof portionMacros==='function'){const o=portionMacros;portionMacros=function(x,amount,unit,g){
  try{if(x&&!GR(x.unit)&&unit!==x.unit){const bg=baseGrams(x),per=GR(unit)?1:(g>0?g:foodUnitGrams(x,unit));
    if(bg>0&&per>0){const r=(Number(amount)||0)*per/bg;return {calories:(Number(x.calories)||0)*r,protein:(Number(x.protein)||0)*r,carbs:(Number(x.carbs)||0)*r,fat:(Number(x.fat)||0)*r}}}}catch(_){}
  return o.apply(this,arguments)}}
if(typeof foodUnitOptions==='function'){const o=foodUnitOptions;foodUnitOptions=function(x){const r=o.apply(this,arguments);
  try{if(x&&!GR(x.unit)&&!(baseGrams(x)>0)){/* no way to know the grams: only its own unit */return [x.unit]}
    if(x&&!GR(x.unit)&&r.indexOf(x.unit)<0)return [x.unit,...r]}catch(_){}return r}}


/* a food of yours that already has its own units (a dish you saved): don't add guessed units from its name ("בצל ממולא" is not "בצל") */
if(typeof withHouseholdUnits==='function'){const o=withHouseholdUnits;withHouseholdUnits=function(x){try{if(x&&(x.units||[]).some(u=>u[0]==='מנה'||u[0]==='יחידה')&&(x.source==='המזונות שלי'||(state.data.myFoods||[]).some(m=>m.name===x.name)))return Object.assign({},x,{units:(x.units||[]).map(u=>[u[0],Number(u[1]),!!u[2]])})}catch(_){}return o.apply(this,arguments)}}

/* ---------- 2. your own foods first ---------- */
if(typeof localFoodSearch==='function'){const o=localFoodSearch;localFoodSearch=function(q){const r=o.apply(this,arguments);
  try{const tk=(r.parsed&&r.parsed.tokens)||[];if(!tk.length||!r.results||!r.results.length)return r;const mine=new Set((state.data.myFoods||[]).map(x=>x.name));
    const V=tk.map(t=>{try{return tzTokenVariants(t)}catch(_){return [t]}});
    const strong=f=>mine.has(f.name)&&!f.fpBasic&&V.every(vs=>{const n=' '+normHe(f.name+' '+(f.brand||''))+' ';return vs.some(v=>n.indexOf(' '+v)>=0)});
    const own=f=>(f.units||[]).some(u=>u[0]==='מנה'||u[0]==='יחידה')?0:1;const a=r.results.filter(strong).map((f,i)=>[f,i]).sort((x,y)=>own(x[0])-own(y[0])||x[1]-y[1]).map(x=>x[0]);if(a.length){const s=new Set(a);r.results=[...a,...r.results.filter(x=>!s.has(x))]}}catch(_){}
  return r}}

/* ---------- 3. a logged meal: total calories; edit a food by tapping it; calories by hand ---------- */
if(typeof fpMealQty==='function'){const o=fpMealQty;window.fpMealQty=function(gid){o.apply(this,arguments);
  try{const its=(state.data.entries||[]).filter(x=>String(x.groupId)===String(gid)),kcal=its.reduce((n,x)=>n+(Number(x.calories)||0),0),s=$('fpMealQtySheet');if(!s||!kcal)return;
    s.querySelector('.sheet').insertAdjacentHTML('beforeend',`<div class="field" style="margin-top:12px"><label>או כמה קלוריות היו בסך הכל</label><div style="display:flex;gap:8px"><input id="fpMealK" type="number" min="1" step="1" inputmode="numeric" value="${Math.round(kcal)}" style="flex:1"><button type="button" class="btn" onclick="fpMealScale('${gid}',Number(document.getElementById('fpMealK').value)/${kcal})">שמור</button></div><p class="muted" style="margin:4px 0 0;font-size:12.5px">כל הפריטים משתנים באותו יחס. כדי לשנות פריט אחד, לחץ עליו בארוחה.</p></div>`)}catch(e){console.error(e)}}}
let downAt=0,downX=0,downY=0;
document.addEventListener('pointerdown',e=>{downAt=Date.now();downX=e.clientX;downY=e.clientY},true);
document.addEventListener('click',e=>{
  try{const host=e.target.closest&&e.target.closest('#entries .entry');if(!host)return;if(state.select&&state.select.mode)return;
    if(e.target.closest('input,button,select,a,.fp-oil-note'))return;if(Date.now()-downAt>450||Math.abs(e.clientX-downX)>10||Math.abs(e.clientY-downY)>10)return;
    const id=host.dataset.sel||(host.dataset.lp||'').replace(/^entry:/,'');if(!id||/^tmp/.test(id))return;openEntryEdit(id)}catch(err){console.error(err)}});
if(typeof openEntryEdit==='function'){const o=openEntryEdit;openEntryEdit=function(){const r=o.apply(this,arguments);try{const E=state.entryEdit;if(!E)return r;E.manual=null;
    let box=$('fpEditManual');if(box)box.remove();const tot=$('entryEditTotals');if(!tot)return r;
    tot.insertAdjacentHTML('afterend',`<details id="fpEditManual" style="margin:0 0 10px"><summary class="muted">✎ לתקן קלוריות וחלבון ידנית</summary><div class="row" style="margin-top:8px"><div class="field"><label>קלוריות</label><input id="fpEdK" type="number" min="0" step="1" inputmode="numeric" oninput="fpEditManual()"></div><div class="field"><label>חלבון (ג׳)</label><input id="fpEdP" type="number" min="0" step="0.1" inputmode="decimal" oninput="fpEditManual()"></div></div><p class="muted" style="margin:0;font-size:12.5px">מה שתכתוב כאן נשמר כמו שהוא, במקום החישוב.</p></details>`);
    const m=entryEditMacros();$('fpEdK').placeholder=Math.round(m.calories);$('fpEdP').placeholder=n1(m.protein);}catch(e){console.error(e)}return r}}
window.fpEditManual=function(){const E=state.entryEdit;if(!E)return;const k=$('fpEdK').value,p=$('fpEdP').value;E.manual=(k!==''||p!=='')?{k:k===''?null:Number(k),p:p===''?null:Number(p)}:null;updateEntryEditTotals()};
if(typeof entryEditMacros==='function'){const o=entryEditMacros;entryEditMacros=function(){const m=o.apply(this,arguments);try{const E=state.entryEdit;if(E&&E.manual){const out=Object.assign({},m);if(E.manual.k!=null&&E.manual.k>=0)out.calories=E.manual.k;if(E.manual.p!=null&&E.manual.p>=0)out.protein=E.manual.p;return out}}catch(_){}return m}}

/* ---------- 4. saved meals: how much did you eat ---------- */
function mealUnits(){try{return (window.fpMealUnits&&fpMealUnits())||{}}catch(_){return {}}}
const XS=[[0.5,'חצי'],[1,'1'],[1.5,'1½'],[2,'2'],[3,'3']];
function mealX(i){const meals=(state.data.meals||{})[state.category]||[],m=meals[i],body=$('meal-'+i);if(!m||!body||body.querySelector('.fp-mealx'))return;
  const n=Number(mealUnits()[m.title||m.option||''])||0;state.fpMealK=state.fpMealK||{};
  const units=n>0?`<div style="display:flex;align-items:center;gap:8px;margin-top:8px;flex-wrap:wrap"><span class="muted">ביחידות (הארוחה השמורה = ${fmt(n)}):</span><span class="fp-step"><button type="button" onclick="fpMealUnitsStep(${i},-0.5)">−</button><b id="fpMealU-${i}">${fmt(n)}</b><button type="button" onclick="fpMealUnitsStep(${i},0.5)">+</button></span></div>`:'';
  body.insertAdjacentHTML('afterbegin',`<div class="fp-mealx"><b>כמה אכלת?</b><div class="meal-tabs" style="flex-wrap:wrap">${XS.map(([v,l])=>`<button type="button" class="chip${v===1?' active':''}" data-x="${v}" onclick="fpMealX(${i},${v})">${l}${v===1?' מנה':''}</button>`).join('')}</div>${units}</div>`)}
window.fpMealX=function(i,f){const meals=(state.data.meals||{})[state.category]||[],m=meals[i];if(!m)return;
  m.ingredients.forEach((x,j)=>{const el=$(`meal-${i}-${j}`);if(el)el.value=Math.round((Number(x.amount)||0)*f*10)/10});
  const body=$('meal-'+i);if(body)body.querySelectorAll('.fp-mealx .chip').forEach(c=>c.classList.toggle('active',Math.abs(Number(c.dataset.x)-f)<0.001));
  const n=Number(mealUnits()[m.title||m.option||''])||0,u=$('fpMealU-'+i);if(u&&n)u.textContent=fmt(Math.round(n*f*100)/100);
  try{updateMealPreview(i)}catch(_){}};
window.fpMealUnitsStep=function(i,d){const meals=(state.data.meals||{})[state.category]||[],m=meals[i];if(!m)return;const n=Number(mealUnits()[m.title||m.option||''])||1,u=$('fpMealU-'+i);
  const k=Math.max(0.5,(Number(u&&u.textContent)||n)+d);fpMealX(i,k/n);if(u)u.textContent=fmt(k)};
if(typeof renderMeals==='function'){const o=renderMeals;renderMeals=function(){const r=o.apply(this,arguments);try{const meals=(state.data.meals||{})[state.category]||[];meals.forEach((_,i)=>mealX(i))}catch(e){console.error(e)}return r}}

/* ---------- 5. meal builder: ✨ add with AI ---------- */
function builderAiBtn(){const q=$('customFoodQuery');if(!q||$('fpBuildAi'))return;const row=q.closest('.search-row');if(!row)return;
  row.insertAdjacentHTML('afterend','<button type="button" class="btn light full" id="fpBuildAi" style="margin-top:8px" onclick="fpBuilderAI()">✨ להוסיף עם AI (למשל: 200 גרם עוף, 150 גרם תפוחי אדמה)</button>')}
builderAiBtn();setInterval(builderAiBtn,2000);
window.fpBuilderAI=async function(){
  const q=($('customFoodQuery').value||'').trim();if(q.length<2){toast('כתוב מה להוסיף, ואז לחץ שוב',true);$('customFoodQuery').focus();return}
  const b=$('fpBuildAi');if(b){b.disabled=true;b.textContent='ה-AI חושב…'}
  try{const d=await call('estimateFoodWithOpenAI',q,'');if(!d||!d.items||!d.items.length)throw new Error('ה-AI לא החזיר רכיבים');
    let got='';try{got=window.fpApplyDishText?fpApplyDishText(d,q):''}catch(_){}
    let n=0;d.items.forEach(x=>{const f=x.manualOverride?x.manual:(x.choices&&x.choices.length?x.choices[x.choice||0]:x.manual)||{};if(!(Number(f.calories)||Number(f.protein)))return;
      const ing={name:x.label,src:'AI',amount:Math.round((Number(x.amount)||0)*10)/10||100,unit:'גרם',per:{baseQty:100,unit:'גרם',calories:Number(f.calories)||0,protein:Number(f.protein)||0,carbs:Number(f.carbs)||0,fat:Number(f.fat)||0},units:[],mine:true};
      recalcCustomIngredient(ing);state.customIngredients.push(ing);n++});
    if(!n)throw new Error('לא נמצאו ערכים');renderCustomIngredients();$('customFoodQuery').value='';$('customFoodResults').innerHTML='';
    toast(`נוספו ${n} רכיבים${got?' · '+got:''}. בדוק את הכמויות`)}
  catch(e){toast(e.message,true)}finally{if(b){b.disabled=false;b.textContent='✨ להוסיף עם AI (למשל: 200 גרם עוף, 150 גרם תפוחי אדמה)'}}
};

/* ---------- 6. the days on top: week back / forward ---------- */
const MON=['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];
const iso=d=>d.toISOString().slice(0,10),D=s=>new Date(s+'T12:00:00Z');
function weekStart(s){const d=D(s);d.setUTCDate(d.getUTCDate()-d.getUTCDay());return d}
function weekNav(){const strip=$('dateStrip');if(!strip||!state.date)return;let nav=$('fpWeekNav');if(!nav){nav=document.createElement('div');nav.id='fpWeekNav';strip.insertAdjacentElement('beforebegin',nav)}
  const today=state.todayDate||state.date,a=weekStart(state.date),b=new Date(a);b.setUTCDate(a.getUTCDate()+6);
  const same=iso(a)===iso(weekStart(today)),label=a.getUTCMonth()===b.getUTCMonth()?`${a.getUTCDate()}–${b.getUTCDate()} ב${MON[b.getUTCMonth()]}`:`${a.getUTCDate()} ב${MON[a.getUTCMonth()]} – ${b.getUTCDate()} ב${MON[b.getUTCMonth()]}`;
  const ahead=(a-weekStart(today))/864e5/7;
  nav.innerHTML=`<button type="button" onclick="fpWeek(-1)" aria-label="שבוע קודם">› שבוע קודם</button><span>${same?'השבוע':label}${same?'':` <button type="button" class="fp-wk-today" onclick="goToday()">היום</button>`}</span><button type="button" onclick="fpWeek(1)" aria-label="שבוע הבא"${ahead>=8?' disabled style="opacity:.3"':''}>שבוע הבא ‹</button>`}
window.fpWeek=async function(d){const today=state.todayDate||state.date;let t=D(state.date);t.setUTCDate(t.getUTCDate()+7*d);
  /* the same weekday, but back to today when landing on this week */
  if(iso(weekStart(iso(t)))===iso(weekStart(today)))t=D(today);
  await loadDate(iso(t));if(state.date>today)toast('יום עתידי: אפשר לרשום מראש מה תאכל')};
if(typeof renderDateStrip==='function'){const o=renderDateStrip;renderDateStrip=function(){const r=o.apply(this,arguments);try{weekNav()}catch(e){console.error(e)}return r}}

/* ---------- 7. popups wait for the home screen ---------- */
if(typeof showWeeklyNotice==='function'){const o=showWeeklyNotice;showWeeklyNotice=function(force){const v=document.querySelector('.view.active');if(!force&&v&&v.id!=='today')return;return o.apply(this,arguments)}}
})();
