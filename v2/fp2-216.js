/* FitPro 2.16.0
   - drinks show מ״ל in every unit (כוס ליין 150 מ״ל).
   - building a meal: a new item comes in on top.
   - search: "הכל / המזונות שלי / מאגר" before you search (and "המזונות שלי" with nothing typed shows your whole list).
   - ate only part (½ of the dish, ⅓ of a meal): "אכלתי את השאר" later, one tap.
   - a name changed once changes everywhere: the diary, your saved food, your saved meal. */
(function(){
'use strict';
const LS={get(k){try{return localStorage.getItem(k)}catch(_){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(_){}}};
const n1=v=>Math.round((Number(v)||0)*10)/10;
document.head.insertAdjacentHTML('beforeend',`<style>
.fp-src{display:flex;gap:6px;margin:8px 0 0;flex-wrap:wrap}
#fpLeft .fp-left{display:flex;align-items:center;gap:8px;justify-content:space-between;padding:10px 12px;border:1px dashed var(--brand,#D7F36B);border-radius:14px;margin:0 0 8px;background:rgba(215,243,107,.05)}
#fpLeft .fp-left span{min-width:0}#fpLeft .fp-left small{display:block;color:var(--muted,#93A09A)}
#fpLeft .fp-left .acts{display:flex;gap:6px;flex:none}
</style>`);

/* ---------- drinks: מ״ל ---------- */
if(typeof unitLabel==='function'){const o=unitLabel;unitLabel=function(x,u){const r=o.apply(this,arguments);try{if(window.fpIsDrink&&fpIsDrink(x))return String(r).replace(/ ג׳/g,' מ״ל').replace(/^גרם$/,'מ״ל')}catch(_){}return r}}

/* ---------- building a meal: new item on top ---------- */
function toFront(n){const a=state.customIngredients||[];if(a.length>n&&a.length>1){const add=a.splice(n);a.unshift(...add.reverse());return true}return false}
['chooseCustomIngredient','addBlankCustomIngredient'].forEach(fn=>{if(typeof window[fn]!=='function')return;const o=window[fn];window[fn]=function(){const n=(state.customIngredients||[]).length;const r=o.apply(this,arguments);
  try{if(toFront(n)){renderCustomIngredients();if(fn==='addBlankCustomIngredient'){const row=document.querySelector('#customIngredients .custom-ingredient');if(row){const d=row.querySelector('details');if(d)d.open=true;const i=row.querySelector('input');if(i)i.focus();row.scrollIntoView({block:'center'})}}}}catch(e){console.error(e)}return r}});
if(typeof fpBuilderAI==='function'){const o=fpBuilderAI;window.fpBuilderAI=async function(){const n=(state.customIngredients||[]).length;const r=await o.apply(this,arguments);try{if(toFront(n))renderCustomIngredients()}catch(_){}return r}}

/* ---------- search: all / mine / database ---------- */
const SRC=[['','הכל'],['mine','המזונות שלי'],['db','מאגר']];
const mineSet=()=>new Set(((state.data&&state.data.myFoods)||[]).map(x=>x.name));
if(typeof localFoodSearch==='function'){const o=localFoodSearch;localFoodSearch=function(){const r=o.apply(this,arguments);try{const s=state.fpSrc;if(s&&r&&r.results){const m=mineSet();r.results=r.results.filter(x=>s==='mine'?m.has(x.name)&&!x.fpBasic:!m.has(x.name)||x.fpBasic)}}catch(_){}return r}}
function chips(where){return `<div class="fp-src" id="fpSrc-${where}">${SRC.map(([v,l])=>`<button type="button" class="chip${(state.fpSrc||'')===v?' active':''}" onclick="fpSrc('${v}','${where}')">${l}</button>`).join('')}</div>`}
function srcChips(){
  const q=$('foodQuery'),row=q&&q.closest('.search-row');if(row&&!$('fpSrc-add'))row.insertAdjacentHTML('afterend',chips('add'));
  const q2=$('customFoodQuery'),row2=q2&&q2.closest('.search-row');if(row2&&!$('fpSrc-build'))row2.insertAdjacentHTML('afterend',chips('build'));
}
srcChips();setInterval(srcChips,2000);
function allMine(){return ((state.data&&state.data.myFoods)||[]).slice().sort((a,b)=>String(a.name).localeCompare(String(b.name),'he'))}
window.fpSrc=function(v,where){state.fpSrc=v;['add','build'].forEach(w=>{const e=$('fpSrc-'+w);if(e)e.outerHTML=chips(w)});
  if(where==='add'){const q=($('foodQuery').value||'').trim();
    if(q.length>=2){try{searchFood(true)}catch(_){}}
    else if(v==='mine'){state.localQuery='';state.localResults=allMine();state.localParsed=null;state.showAllFoods=true;renderLocalFoodResults();if(!state.localResults.length)$('foodResults').innerHTML='<div class="empty">עוד אין לך מזונות שמורים.</div>'}
    else $('foodResults').innerHTML='';}
  else{const q=($('customFoodQuery').value||'').trim();
    if(q.length>=2){try{searchCustomIngredient()}catch(_){}}
    else if(v==='mine'){state.customSearchLocal=true;state.customSearchResults=allMine();state.customSearchParsed={};state.customShowAll=true;try{renderCustomLocalResults()}catch(_){}}
    else $('customFoodResults').innerHTML='';}
};

/* ---------- ate only part: "אכלתי את השאר" ---------- */
const LK='fp2.leftovers';
function lefts(){let a=[];try{a=JSON.parse((window.FP2&&FP2.getProp&&FP2.getProp('LEFTOVERS'))||LS.get(LK)||'[]')||[]}catch(_){}const cut=Date.now()-3*864e5;return a.filter(x=>x&&x.t>cut)}
function setLefts(a){const s=JSON.stringify(a.slice(-12));LS.set(LK,s);try{if(window.FP2&&FP2.setProp)FP2.setProp('LEFTOVERS',a.length?s:'')}catch(_){}renderLefts()}
const FRAC=f=>{const r=Math.round((1-f)*100)/100;return r===0.5?'חצי':r===0.25?'רבע':r===0.75?'שלושה רבעים':Math.abs(r-2/3)<0.02?'שני שליש':Math.abs(r-1/3)<0.02?'שליש':Math.round(r*100)+'%'};
window.fpLeftAdd=function(name,f,rest,cat){if(!name||!rest||!(Number(rest.calories)>0))return;const a=lefts();a.push({id:'l'+Date.now().toString(36),name,f,rest,cat:cat||'',t:Date.now()});setLefts(a)};
window.fpLeftEat=function(id){const a=lefts(),x=a.find(v=>v.id===id);if(!x)return;
  const h=new Date().getHours(),cat=h<11?'בוקר':h<17?'צהריים':'ערב';
  const item={date:state.date,category:cat,source:'השאר',noCache:true,name:x.name+' (השאר)',amount:1,baseQty:1,unit:'מנה',calories:Math.round(x.rest.calories),protein:n1(x.rest.protein),carbs:n1(x.rest.carbs),fat:n1(x.rest.fat)};
  try{optimisticMutate('saveFood',item,'');toast(`נוסף: ${item.name} · ${kc(item.calories)} קל׳`)}catch(e){return toast(e.message,true)}
  setLefts(a.filter(v=>v.id!==id))};
window.fpLeftDrop=function(id){setLefts(lefts().filter(v=>v.id!==id))};
function renderLefts(){const t=$('today');if(!t)return;let box=$('fpLeft');const a=lefts();
  if(!a.length){if(box)box.remove();return}
  if(!box){box=document.createElement('div');box.id='fpLeft';const ring=t.querySelector('.progress-wrap');if(ring)ring.insertAdjacentElement('beforebegin',box);else t.prepend(box)}
  box.innerHTML=a.map(x=>`<div class="fp-left"><span><b>נשאר ${FRAC(x.f)} מ${esc(x.name)}</b><small>כ-${kc(x.rest.calories)} קל׳ · ${fmt(n1(x.rest.protein))} ג׳ חלבון</small></span><span class="acts"><button type="button" class="btn mini" onclick="fpLeftEat('${x.id}')">אכלתי את השאר</button><button type="button" class="trash mini" aria-label="לא אוכל" onclick="fpLeftDrop('${x.id}')">✕</button></span></div>`).join('')}
if(typeof renderDay==='function'){const o=renderDay;renderDay=function(){const r=o.apply(this,arguments);try{renderLefts()}catch(e){console.error(e)}return r}}
/* a saved meal eaten in part (the "כמה אכלת?" chips) */
if(typeof fpMealX==='function'){const o=fpMealX;window.fpMealX=function(i,f){state.fpMealF=state.fpMealF||{};state.fpMealF[state.category+':'+i]=f;return o.apply(this,arguments)}}
if(typeof addMeal==='function'){const o=addMeal;addMeal=async function(i){const key=state.category+':'+i,f=(state.fpMealF||{})[key]||1,meals=(state.data.meals||{})[state.category]||[],m=meals[i];
  const before=(state.data.entries||[]).length;const r=await o.apply(this,arguments);
  try{if(m&&f<0.99&&(state.data.entries||[]).length>before){const rest={};['calories','protein','carbs','fat'].forEach(k=>rest[k]=Math.round((Number(m[k])||0)*(1-f)*10)/10);fpLeftAdd(m.title||m.option||'הארוחה',f,rest,state.category)}
    if(state.fpMealF)delete state.fpMealF[key]}catch(e){console.error(e)}
  return r}}

/* ---------- a name changed once changes everywhere ---------- */
function known(name){try{return ((state.data.myFoods||[]).some(x=>x.name===name))||Object.values(state.data.meals||{}).flat().some(m=>(m.title||m.option)===name)}catch(_){return false}}
async function renameAll(from,to){
  const r=await call('renameFoodEverywhere',{from,to,date:state.date});
  if(r){if(r.entries)applyDay(r);if(r.myFoods)state.data.myFoods=r.myFoods;if(r.meals)state.data.meals=r.meals}
  try{const mu=JSON.parse((window.FP2&&FP2.getProp&&FP2.getProp('MEAL_UNITS'))||LS.get('fp2.mealUnits')||'{}')||{};if(mu[from]!=null){mu[to]=mu[from];delete mu[from];const s=JSON.stringify(mu);LS.set('fp2.mealUnits',s);if(window.FP2&&FP2.setProp)FP2.setProp('MEAL_UNITS',s)}}catch(_){}
  try{const a=lefts();a.forEach(x=>{if(x.name===from)x.name=to});setLefts(a)}catch(_){}
  renderDay();try{renderMeals()}catch(_){}
  return r;
}
window.fpRenameAll=renameAll;
if(typeof openEntryEdit==='function'){const o=openEntryEdit;openEntryEdit=function(){const r=o.apply(this,arguments);try{const E=state.entryEdit;if(!E)return r;const sh=$('entryEditSheet');let f=$('fpEdNameF');if(f)f.remove();
    const row=sh.querySelector('.row');if(row)row.insertAdjacentHTML('beforebegin',`<div class="field" id="fpEdNameF"><label>שם</label><input id="fpEdName" maxlength="60" value="${esc(E.entry.name||'')}"></div>`)}catch(e){console.error(e)}return r}}
if(typeof saveEntryEdit==='function'){const o=saveEntryEdit;saveEntryEdit=async function(){const E=state.entryEdit,from=E&&E.entry&&E.entry.name,to=String((($('fpEdName')||{}).value)||'').trim();
  const r=await o.apply(this,arguments);
  try{if(from&&to&&to!==from){
      if(known(from)){await renameAll(from,to);toast('השם עודכן בכל מקום')}
      else{const d=await call('renameFoodEverywhere',{from,to,date:state.date,entryId:E.entry.id});if(d&&d.entries)applyDay(d);renderDay();toast('השם עודכן')}}}catch(e){toast(e.message,true)}
  return r}}
/* a meal in the diary: "שם" next to its tools */
function nameChips(){document.querySelectorAll('#entries .fp-meal-tools').forEach(t=>{if(t.dataset.fpn)return;const b=t.querySelector('button[onclick^="fpAddToMeal"]');if(!b)return;const m=String(b.getAttribute('onclick')).match(/fpAddToMeal\('([^']+)'\)/);if(!m)return;
  t.dataset.fpn='1';t.insertAdjacentHTML('beforeend',`<button type="button" class="chip" onclick="fpMealName('${m[1]}')">שם</button>`)})}
if(typeof renderEntries==='function'){const o=renderEntries;renderEntries=function(){const r=o.apply(this,arguments);try{nameChips()}catch(e){console.error(e)}return r}}
window.fpMealName=async function(gid){const its=(state.data.entries||[]).filter(x=>String(x.groupId)===String(gid));if(!its.length)return;const from=its[0].mealOption||its[0].name||'';
  const to=prompt('שם חדש',from);if(to===null||!to.trim()||to.trim()===from)return;
  try{await waitForSync();const d=await call('renameMealGroup',{groupId:gid,name:to.trim()});applyDay(d);if(from)await renameAll(from,to.trim());else renderDay();toast('השם עודכן בכל מקום')}catch(e){toast(e.message,true)}};
})();
