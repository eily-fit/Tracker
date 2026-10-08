/* FitPro 2.6.10 — ארוחה ביומן מוצגת כארוחה אחת:
   שם + סה״כ קלוריות וחלבון/פחמ׳/שומן, לחיצה פותחת את הפריטים.
   בתוך הארוחה: לשנות כמות, להוריד פריט, להחזיר פריט שהורד, להוסיף פריט חדש לארוחה.
   פריטים שנוספו לבד נשארים לבד, כמו קודם. */
(function(){
'use strict';
if(typeof renderEntries!=='function')return;

document.head.insertAdjacentHTML('beforeend',`<style>
.fp-meal{position:relative;border:1px solid var(--line,#2a323b);border-radius:14px;margin:8px 0;overflow:hidden}
.fp-meal-head{padding-left:52px!important}
.fp-meal-x{position:absolute;left:8px;top:10px}
.fp-meal.sel{outline:2px solid var(--brand,#D7F36B)}
.fp-sec-total{display:flex;justify-content:space-between;margin-top:10px;padding-top:10px;border-top:1px dashed var(--line,#2a323b);font-weight:700}
.fp-sec-total small{font-weight:400;opacity:.7}
.fp-meal-head{display:flex;justify-content:space-between;align-items:center;gap:10px;width:100%;padding:12px;background:none;border:0;color:inherit;font:inherit;text-align:right;cursor:pointer}
.fp-meal-head b{font-size:16px}
.fp-meal-head small{display:block;opacity:.7;font-size:12px;margin-top:2px}
.fp-meal-kcal{white-space:nowrap;font-weight:700;font-size:18px}
.fp-meal-kcal small{display:inline;font-weight:400}
.fp-meal-chev{opacity:.6;transition:transform .2s}
.fp-meal.open .fp-meal-chev{transform:rotate(180deg)}
.fp-meal-items{padding:0 10px 10px;display:none}
.fp-meal.open .fp-meal-items{display:block}
.fp-meal-tools{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.fp-meal-removed{margin-top:8px;font-size:13px;opacity:.85}
.fp-meal-removed button{margin:4px 0 0 6px}
</style>`);

const OPEN_KEY='fp2.mealOpen',REM_KEY='fp2.mealRemoved';
const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'')||d}catch(_){return d}};
const store=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}};
let OPEN=load(OPEN_KEY,{});
let REMOVED=load(REM_KEY,[]);
function pruneRemoved(){const cut=Date.now()-3*86400000;REMOVED=REMOVED.filter(r=>r.t>cut);store(REM_KEY,REMOVED)}
pruneRemoved();

const n1=v=>Math.round((Number(v)||0)*10)/10;
function enhanceMeals(){
  const root=$('entries');if(!root)return;
  const entries=state.data.entries||[];
  root.querySelectorAll('[data-lp^="group:"]').forEach(box=>{
    if(box.dataset.fpMeal)return;box.dataset.fpMeal='1';
    const gid=box.dataset.lp.slice(6),name=box.dataset.lpTitle||'ארוחה';
    const items=entries.filter(x=>String(x.groupId)===gid);
    const t=k=>items.reduce((s,x)=>s+(Number(x[k])||0),0);
    const old=box.querySelector('.logged-meal-name');if(old)old.remove();
    const del=box.querySelector('button[onclick^="removeGroup"]');if(del)del.remove();
    const list=document.createElement('div');list.className='fp-meal-items';
    while(box.firstChild)list.appendChild(box.firstChild);
    const pending=items.some(x=>x.pending)||/^tmpg/.test(gid);
    const removed=REMOVED.filter(r=>r.gid===gid&&r.date===state.date);
    list.insertAdjacentHTML('beforeend',
      (removed.length?`<div class="fp-meal-removed">הורדו מהארוחה:${removed.map(r=>`<button type="button" class="chip" onclick="fpRestoreItem('${esc(r.id)}')">↩ ${esc(r.name)}</button>`).join('')}</div>`:'')+
      `<div class="fp-meal-tools"><button type="button" class="chip" onclick="fpAddToMeal('${esc(gid)}')"${pending?' disabled':''}>＋ הוסף פריט לארוחה</button></div>`);
    box.classList.add('fp-meal');if(OPEN[gid])box.classList.add('open');
    box.insertAdjacentHTML('afterbegin',`<div role="button" tabindex="0" class="fp-meal-head" onclick="fpToggleMeal(this,'${esc(gid)}')"><span><b>${esc(name)}</b><small>${items.length} פריטים · ${fmt(n1(t('protein')))} חלבון · ${fmt(n1(t('carbs')))} פחמ׳ · ${fmt(n1(t('fat')))} שומן</small></span><span class="fp-meal-kcal">${fmt(Math.round(t('calories')))} <small>קל׳</small> <span class="fp-meal-chev">▾</span></span></div><button type="button" class="trash fp-meal-x" aria-label="מחק את הארוחה" onclick="removeGroup('${esc(gid)}')">✕</button>`);
    if(state.select&&state.select.mode==='ent'&&items.length&&items.every(x=>state.select.set.has(x.id)))box.classList.add('sel');
    box.appendChild(list);
  });
}
window.fpToggleMeal=function(btn,gid){const box=btn.closest('.fp-meal');if(!box)return;
  if(state.select&&state.select.mode==='ent'){selectMeal(gid,!box.classList.contains('sel'));return}const on=!box.classList.contains('open');box.classList.toggle('open',on);if(on)OPEN[gid]=1;else delete OPEN[gid];store(OPEN_KEY,OPEN)};

const oRender=renderEntries;
renderEntries=function(){const r=oRender.apply(this,arguments);try{enhanceMeals()}catch(e){console.error(e)}return r};

/* remove an item from a meal: remember it so it can come back */
const oRemove=removeEntry;
removeEntry=async function(id,skip){
  const x=(state.data.entries||[]).find(e=>String(e.id)===String(id));
  const inMeal=x&&x.groupId&&['meal','dish'].includes(x.sourceType)&&!x.pending;
  const r=await oRemove.apply(this,arguments);
  if(inMeal&&!(state.data.entries||[]).some(e=>String(e.id)===String(id))){
    REMOVED.push({id:String(id),name:x.name,gid:String(x.groupId),date:x.date||state.date,t:Date.now()});store(REM_KEY,REMOVED);
    try{renderEntries()}catch(_){}
  }
  return r;
};
window.fpRestoreItem=async function(id){
  await waitForSync();
  const ok=await mutate('restoreEntry',id,'הפריט חזר לארוחה');
  if(ok!==false){REMOVED=REMOVED.filter(r=>r.id!==String(id));store(REM_KEY,REMOVED);try{renderEntries()}catch(_){}}
};

/* add a new food into an existing meal */
window.fpAddToMeal=function(gid){
  const items=(state.data.entries||[]).filter(x=>String(x.groupId)===gid);
  if(!items.length)return;
  if(items.some(x=>x.pending))return toast('רגע, עוד שומר את הארוחה…',true);
  state.fpAddToGroup={t:Date.now(),gid,name:items[0].mealOption||items[0].name||'ארוחה',category:items[0].category,date:state.date};
  state.addCategory=['בוקר','צהריים','ערב'].includes(items[0].category)?items[0].category:state.addCategory;
  showView('add');
  toast('בחר מה להוסיף ל״'+state.fpAddToGroup.name+'״');
};
async function joinToMeal(before,target){
  await waitForSync();
  if(state.date!==target.date)return;
  const all=state.data.entries||[];
  const fresh=all.filter(x=>!before.has(String(x.id))&&!x.pending).map(x=>String(x.id));
  const members=all.filter(x=>String(x.groupId)===target.gid).map(x=>String(x.id));
  if(!fresh.length||!members.length)return toast('המזון נוסף, אבל לא הצלחתי לצרף אותו לארוחה. אפשר לצרף בבחירה מרובה',true);
  try{
    const r=await call('groupEntries',{ids:members.concat(fresh),name:target.name,category:target.category});
    applyDay(r.day);renderDay();
    if(OPEN[target.gid]){delete OPEN[target.gid];OPEN[r.groupId]=1;store(OPEN_KEY,OPEN)}
    toast('נוסף ל״'+target.name+'״');
  }catch(e){toast(e.message,true)}
}
const oSave=saveFood;
saveFood=async function(){
  const target=state.fpAddToGroup;state.fpAddToGroup=null;
  if(!target||target.date!==state.date||Date.now()-target.t>15*60000)return oSave.apply(this,arguments);
  const before=new Set((state.data.entries||[]).map(x=>String(x.id)));
  const r=await oSave.apply(this,arguments);
  joinToMeal(before,target);
  return r;
};
/* leaving the add screen without saving cancels "add to meal" */
if(typeof showView==='function'){const oShow=showView;showView=function(v){if(v==='today')state.fpAddToGroup=null;return oShow.apply(this,arguments)}}

/* ---------- each part of the day: count meals as one item, total at the bottom ---------- */
const SEC_NAME={'בוקר':'בוקר','צהריים':'צהריים','ערב':'ערב','נוספים':'ביניים ונוספים'};
function enhanceSections(){
  const entries=state.data.entries||[],secOf=x=>['בוקר','צהריים','ערב'].includes(x.category)?x.category:'נוספים';
  document.querySelectorAll('#entries details.meal-sec').forEach(d=>{
    const c=d.dataset.sec,list=entries.filter(x=>secOf(x)===c);
    const add=d.querySelector('.add-to-sec');if(add)add.style.display=list.length?'none':'';
    if(!list.length)return;
    const units=new Set(list.map(x=>x.groupId||x.id)).size;
    const small=d.querySelector('.sec-head small');
    const kc=Math.round(list.reduce((n,x)=>n+(Number(x.calories)||0),0)),pr=n1(list.reduce((n,x)=>n+(Number(x.protein)||0),0));
    if(small)small.textContent=`${units} ${units===1?'פריט':'פריטים'} · ${fmt(pr)} ג׳ חלבון`;
    const body=d.querySelector('.session-body');
    if(body&&!body.querySelector('.fp-sec-total'))body.insertAdjacentHTML('beforeend',`<div class="fp-sec-total"><span>סה״כ ${SEC_NAME[c]||c}</span><span>${fmt(kc)} <small>קל׳ · ${fmt(pr)} ג׳ חלבון</small></span></div>`);
  });
}
const oRender2=renderEntries;
renderEntries=function(){const r=oRender2.apply(this,arguments);try{enhanceSections()}catch(e){console.error(e)}return r};

/* ---------- long press on a meal: select it (and more meals/items) ---------- */
function selectMeal(gid,on){
  const ids=(state.data.entries||[]).filter(x=>String(x.groupId)===gid).map(x=>x.id);
  if(ids.some(id=>/^tmp-/.test(String(id))))return toast('רגע, עוד שומר…');
  ids.forEach(id=>{if(on)state.select.set.add(id);else state.select.set.delete(id);const el=document.querySelector(`#entries [data-sel="${id}"]`);if(el)el.classList.toggle('sel',on)});
  const box=document.querySelector(`#entries [data-lp="group:${CSS.escape(gid)}"]`);if(box)box.classList.toggle('sel',on);
  updateBulkBar();
}
const oLP=openLongPressMenu;
openLongPressMenu=function(el){
  const lp=String(el.dataset.lp||'');
  if(lp.startsWith('group:')){
    if(!(state.select&&state.select.mode==='ent'))toggleSelectMode('ent');
    selectMeal(lp.slice(6),true);return;
  }
  return oLP.apply(this,arguments);
};

/* ---------- bulk bar: move to another part of the day, rename a meal ---------- */
function selectedIds(){return [...(state.select&&state.select.set||[])]}
function selectedSingleMeal(){
  const ids=selectedIds();if(!ids.length)return null;
  const es=(state.data.entries||[]).filter(x=>ids.includes(x.id)),g=es[0]&&es[0].groupId;
  if(!g||!es.every(x=>x.groupId===g))return null;
  const all=(state.data.entries||[]).filter(x=>x.groupId===g);
  return all.length===es.length?{gid:String(g),name:es[0].mealOption||es[0].name}:null;
}
function ensureBulkButtons(){
  const bar=$('bulkBar');if(!bar||$('fpMoveBtn'))return;
  const del=bar.querySelector('.btn.danger');
  const html='<button class="btn light" id="fpMoveBtn" style="display:none" onclick="fpOpenMove()">העבר ל…</button><button class="btn light" id="fpRenameBtn" style="display:none" onclick="fpRenameMeal()">שנה שם</button>';
  if(del)del.insertAdjacentHTML('beforebegin',html);else bar.insertAdjacentHTML('beforeend',html);
}
const oBulk=updateBulkBar;
updateBulkBar=function(){
  const r=oBulk.apply(this,arguments);
  try{ensureBulkButtons();const ent=state.select&&state.select.mode==='ent',n=selectedIds().length;
    $('fpMoveBtn').style.display=ent&&n?'inline-block':'none';
    $('fpRenameBtn').style.display=ent&&selectedSingleMeal()?'inline-block':'none';
    if(ent&&n){const es=(state.data.entries||[]).filter(x=>selectedIds().includes(x.id)),meals=new Set(es.filter(x=>x.groupId&&['meal','dish'].includes(x.sourceType)).map(x=>x.groupId)).size,loose=es.filter(x=>!(x.groupId&&['meal','dish'].includes(x.sourceType))).length;
      $('bulkCount').textContent='נבחרו: '+[meals?(meals===1?'ארוחה אחת':meals+' ארוחות'):'',loose?(loose===1?'פריט אחד':loose+' פריטים'):''].filter(Boolean).join(' ו');}}catch(e){}
  return r;
};
window.fpOpenMove=function(){
  const ids=selectedIds();if(!ids.length)return;
  if(ids.some(id=>/^tmp-/.test(String(id))))return toast('רגע, עוד שומר…',true);
  const old=$('fpMoveSheet');if(old)old.remove();
  document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="fpMoveSheet" onclick="if(event.target===this)this.remove()"><div class="sheet"><h3 style="margin:0 0 10px">להעביר ל…</h3>${[['בוקר','בוקר'],['צהריים','צהריים'],['ערב','ערב'],['נוסף','ביניים ונוספים']].map(([v,l])=>`<button type="button" class="btn light full" style="margin-top:8px" onclick="fpMoveTo('${v}')">${l}</button>`).join('')}<button type="button" class="btn secondary full" style="margin-top:12px" onclick="document.getElementById('fpMoveSheet').remove()">ביטול</button></div></div>`);
};
window.fpMoveTo=async function(cat){
  const ids=selectedIds();const s=$('fpMoveSheet');if(s)s.remove();
  await waitForSync();exitSelectMode();loading();
  try{const day=await call('moveEntries',{ids,category:cat});applyDay(day);renderDay();toast('הועבר ל'+(cat==='נוסף'?'ביניים ונוספים':cat))}
  catch(e){toast(e.message,true)}finally{loading(false)}
};
window.fpRenameMeal=async function(){
  const m=selectedSingleMeal();if(!m)return;
  const name=prompt('שם חדש לארוחה',m.name||'');if(name===null||!name.trim())return;
  await waitForSync();exitSelectMode();loading();
  try{const day=await call('renameMealGroup',{groupId:m.gid,name:name.trim()});applyDay(day);renderDay();toast('השם עודכן')}
  catch(e){toast(e.message,true)}finally{loading(false)}
};
})();
