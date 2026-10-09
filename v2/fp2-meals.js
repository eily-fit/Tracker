/* FitPro 2.7.0 — ארוחה ביומן מוצגת כארוחה אחת:
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
window.fpMealsCollapseAll=function(){OPEN={};store(OPEN_KEY,OPEN)};
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
    if(OPEN[target.gid]){delete OPEN[target.gid];store(OPEN_KEY,OPEN)}
    target.gid=String(r.groupId);
    toast('נוסף ל״'+target.name+'״');
    return r.groupId;
  }catch(e){toast(e.message,true)}
}
const oSave=saveFood;
saveFood=async function(){
  const R=state.fpReplace;
  if(R){state.fpReplace=null;
    if(R.date===state.date&&Date.now()-R.t<15*60000){const before=new Set((state.data.entries||[]).map(x=>String(x.id)));const r=await oSave.apply(this,arguments);finishReplace(before,R);return r}}
  const target=state.fpAddToGroup;state.fpAddToGroup=null;
  if(!target||target.date!==state.date||Date.now()-target.t>30*60000)return oSave.apply(this,arguments);
  const before=new Set((state.data.entries||[]).map(x=>String(x.id)));
  const r=await oSave.apply(this,arguments);
  /* 2.10.0: stay in "add to this meal" until the user taps "סיום" */
  target.t=Date.now();state.fpAddToGroup=target;showView('add');addMode();
  await joinToMeal(before,target);
  if(state.fpAddToGroup===target)addMode();
  return r;
};
if(typeof addMeal==='function'){
  const oAddMeal=addMeal;
  addMeal=async function(){
    const target=state.fpAddToGroup;
    if(!target||target.date!==state.date)return oAddMeal.apply(this,arguments);
    const before=new Set((state.data.entries||[]).map(x=>String(x.id)));
    const r=await oAddMeal.apply(this,arguments);
    target.t=Date.now();state.fpAddToGroup=target;
    await joinToMeal(before,target);addMode();
    return r;
  };
}
/* the "adding to a meal" banner on the food and meals screens */
function addMode(){
  const T=state.fpAddToGroup;
  ['add','meals'].forEach(v=>{const sec=$(v);if(!sec)return;let b=sec.querySelector('.fp-addmode');
    if(!T){if(b)b.remove();return}
    if(!b){sec.insertAdjacentHTML('afterbegin','<div class="card fp-addmode" style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;margin-bottom:10px;border:1.5px solid var(--brand,#D7F36B)"></div>');b=sec.querySelector('.fp-addmode')}
    b.innerHTML=`<span style="font-size:14px">🍽 מוסיף ל<b>״${esc(T.name)}״</b><br><small class="muted">כל מה שתבחר ייכנס לארוחה</small></span><button type="button" class="btn mini" style="flex:none" onclick="fpAddModeDone()">✓ סיום</button>`;});
}
window.fpAddModeDone=function(){state.fpAddToGroup=null;addMode();showView('today')};
window.fpAddModeRefresh=addMode;
/* leaving the add screen without saving cancels "add to meal" */
if(typeof showView==='function'){const oShow=showView;showView=function(v){if(v==='today'){state.fpAddToGroup=null;state.fpReplace=null}const r=oShow.apply(this,arguments);try{addMode()}catch(_){}return r}}

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
  const html='<button class="btn light" id="fpMoveBtn" style="display:none" onclick="fpOpenMove()">העבר ל…</button><button class="btn light" id="fpRenameBtn" style="display:none" onclick="fpRenameMeal()">שנה שם</button><button class="btn light" id="fpReplaceBtn" style="display:none" onclick="fpReplaceItem()">החלף מוצר</button>';
  if(del)del.insertAdjacentHTML('beforebegin',html);else bar.insertAdjacentHTML('beforeend',html);
}
const oBulk=updateBulkBar;
updateBulkBar=function(){
  const r=oBulk.apply(this,arguments);
  try{ensureBulkButtons();const ent=state.select&&state.select.mode==='ent',n=selectedIds().length;
    $('fpMoveBtn').style.display=ent&&n?'inline-block':'none';
    $('fpRenameBtn').style.display=ent&&selectedSingleMeal()?'inline-block':'none';
    $('fpReplaceBtn').style.display=ent&&n===1?'inline-block':'none';
    if(ent&&n){const es=(state.data.entries||[]).filter(x=>selectedIds().includes(x.id)),meals=new Set(es.filter(x=>x.groupId&&['meal','dish'].includes(x.sourceType)).map(x=>x.groupId)).size,loose=es.filter(x=>!(x.groupId&&['meal','dish'].includes(x.sourceType))).length;
      $('bulkCount').textContent='נבחרו: '+[meals?(meals===1?'ארוחה אחת':meals+' ארוחות'):'',loose?(loose===1?'פריט אחד':loose+' פריטים'):''].filter(Boolean).join(' ו');}}catch(e){}
  return r;
};
window.fpOpenMove=function(){
  const ids=selectedIds();if(!ids.length)return;
  if(ids.some(id=>/^tmp-/.test(String(id))))return toast('רגע, עוד שומר…',true);
  const old=$('fpMoveSheet');if(old)old.remove();
  const sel=new Set(ids.map(String)),groups={};
  (state.data.entries||[]).forEach(x=>{if(x.groupId&&['meal','dish'].includes(x.sourceType)&&!x.pending)(groups[x.groupId]||(groups[x.groupId]=[])).push(x)});
  const meals=Object.entries(groups).filter(([g,xs])=>!xs.every(x=>sel.has(String(x.id)))).map(([g,xs])=>({gid:g,name:xs[0].mealOption||xs[0].name||'ארוחה',cat:xs[0].category,kcal:Math.round(xs.reduce((n,x)=>n+(Number(x.calories)||0),0))}));
  document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="fpMoveSheet" onclick="if(event.target===this)this.remove()"><div class="sheet"><h3 style="margin:0 0 10px">להעביר ל…</h3>${meals.length?`<div class="muted" style="margin-top:4px">לתוך ארוחה:</div>${meals.map(m=>`<button type="button" class="btn light full" style="margin-top:8px" onclick="fpMoveIntoMeal('${esc(m.gid)}')">🍽 ${esc(m.name)} <small class="muted">· ${esc(m.cat)} · ${fmt(m.kcal)} קל׳</small></button>`).join('')}<div class="muted" style="margin-top:12px">או לחלק אחר ביום:</div>`:''}${[['בוקר','בוקר'],['צהריים','צהריים'],['ערב','ערב'],['נוסף','ביניים ונוספים']].map(([v,l])=>`<button type="button" class="btn light full" style="margin-top:8px" onclick="fpMoveTo('${v}')">${l}</button>`).join('')}<button type="button" class="btn secondary full" style="margin-top:12px" onclick="document.getElementById('fpMoveSheet').remove()">ביטול</button></div></div>`);
};
window.fpMoveTo=async function(cat){
  const ids=selectedIds();const s=$('fpMoveSheet');if(s)s.remove();
  await waitForSync();exitSelectMode();loading();
  try{const day=await call('moveEntries',{ids,category:cat});applyDay(day);renderDay();toast('הועבר ל'+(cat==='נוסף'?'ביניים ונוספים':cat))}
  catch(e){toast(e.message,true)}finally{loading(false)}
};

window.fpMoveIntoMeal=async function(gid){
  const ids=selectedIds().map(String);const s=$('fpMoveSheet');if(s)s.remove();
  await waitForSync();
  const members=(state.data.entries||[]).filter(x=>String(x.groupId)===gid);
  if(!members.length)return toast('הארוחה לא נמצאה. רענן ונסה שוב',true);
  const name=members[0].mealOption||members[0].name||'ארוחה',cat=members[0].category;
  exitSelectMode();loading();
  try{const r=await call('groupEntries',{ids:[...new Set(members.map(x=>String(x.id)).concat(ids))],name,category:cat});applyDay(r.day);renderDay();
    if(OPEN[gid]){delete OPEN[gid];OPEN[r.groupId]=1;store(OPEN_KEY,OPEN)}toast('נוסף ל״'+name+'״')}
  catch(e){toast(e.message,true)}finally{loading(false)}
};

/* ---------- replace a logged food with another one, same place and amount ---------- */
window.fpReplaceItem=function(){
  const ids=selectedIds();if(ids.length!==1)return;
  const x=(state.data.entries||[]).find(e=>String(e.id)===String(ids[0]));if(!x||x.pending)return toast('רגע, עוד שומר…',true);
  state.fpReplace={t:Date.now(),date:state.date,old:x};
  exitSelectMode();
  state.addCategory=['בוקר','צהריים','ערב'].includes(x.category)?x.category:state.addCategory;
  showView('add');
  toast('חפש ובחר במה להחליף את ״'+x.name+'״');
};
const oPortion=defaultPortion;
defaultPortion=function(f,parsed){
  const R=state.fpReplace;
  if(R&&f&&!(parsed&&(parsed.amount!=null||parsed.unitHint))){
    const u=R.old.unit;
    if(u==='גרם'||u==='מ״ל')return {amount:Number(R.old.amount)||100,unit:'גרם'};
    if((f.units||[]).some(v=>v[0]===u))return {amount:Number(R.old.amount)||1,unit:u};
  }
  return oPortion.apply(this,arguments);
};
async function finishReplace(before,R){
  await waitForSync();
  if(state.date!==R.date)return;
  const all=state.data.entries||[],fresh=all.filter(x=>!before.has(String(x.id))&&!x.pending).map(x=>String(x.id));
  if(!fresh.length)return toast('המוצר החדש נוסף, אבל הישן לא הוחלף. אפשר למחוק אותו ידנית',true);
  try{
    const old=R.old,gid=old.groupId&&['meal','dish'].includes(old.sourceType)?String(old.groupId):'';
    if(gid){const members=all.filter(x=>String(x.groupId)===gid&&String(x.id)!==String(old.id)).map(x=>String(x.id));
      const r=await call('groupEntries',{ids:members.concat(fresh),name:old.mealOption||'ארוחה',category:old.category});applyDay(r.day);
      if(OPEN[gid]){delete OPEN[gid];OPEN[r.groupId]=1;store(OPEN_KEY,OPEN)}}
    else{const d=await call('moveEntries',{ids:fresh,category:old.category||'נוסף'});applyDay(d)}
    const d2=await call('deleteEntry',old.id);applyDay(d2);renderDay();
    toast('הוחלף: ״'+old.name+'״');
  }catch(e){toast(e.message,true);try{renderDay()}catch(_){}}
}

/* ---------- － / ＋ next to every amount ---------- */
const stepOf=u=>(u==='גרם'||u==='מ״ל')?10:1;
window.fpStep=function(id,dir){
  const x=(state.data.entries||[]).find(e=>String(e.id)===String(id));if(!x)return;
  if(x.pending)return toast('רגע, עוד שומר…');
  const st=stepOf(x.unit),cur=Number(x.amount)||0;let v=Math.round((cur+dir*st)*10)/10;
  if(v<=0)v=st===1?(cur>0.5?0.5:cur):Math.max(1,cur);
  if(v===cur)return;
  changeAmount(id,v);
};
if(typeof entryHtml==='function'){
  const oEntry=entryHtml;
  entryHtml=function(x){
    let h=oEntry.apply(this,arguments);
    try{h=h.replace(/(<input class="qty"[^>]*>)/,`<button type="button" class="fp-step" aria-label="פחות" onclick="event.stopPropagation();fpStep('${esc(x.id)}',-1)">－</button>$1<button type="button" class="fp-step" aria-label="יותר" onclick="event.stopPropagation();fpStep('${esc(x.id)}',1)">＋</button>`)}catch(_){}
    return h;
  };
}
function stepFoodSheet(dir){
  const a=$('quickFoodAmount'),u=$('foodUnit');if(!a)return;
  const st=stepOf(u&&u.value),cur=Number(a.value)||0;let v=Math.round((cur+dir*st)*10)/10;if(v<=0)v=st===1?0.5:st;
  a.value=v;a.dispatchEvent(new Event('input',{bubbles:true}));
}
window.fpStepFood=stepFoodSheet;
const oUpd=updateFoodChoice;
updateFoodChoice=function(){
  const r=oUpd.apply(this,arguments);
  try{const a=$('quickFoodAmount');if(a&&!a.dataset.fpStep){a.dataset.fpStep='1';
    const wrap=document.createElement('div');wrap.className='fp-step-wrap';a.parentNode.insertBefore(wrap,a);
    wrap.insertAdjacentHTML('beforeend','<button type="button" class="fp-step" aria-label="פחות" onclick="fpStepFood(-1)">－</button>');wrap.appendChild(a);
    wrap.insertAdjacentHTML('beforeend','<button type="button" class="fp-step" aria-label="יותר" onclick="fpStepFood(1)">＋</button>');}
    const T=state.fpAddToGroup,addBtn=$('foodChoice')&&[...$('foodChoice').querySelectorAll('button')].find(b=>/saveFood\(\)/.test(b.getAttribute('onclick')||''));
    if(addBtn)addBtn.textContent=state.fpReplace?'החלף':T?'הוסף ל״'+T.name+'״':'הוסף ליום';
    const R=state.fpReplace,box=$('foodChoice');
    if(R&&box&&!box.querySelector('.fp-replace-note'))box.insertAdjacentHTML('afterbegin',`<div class="fp-replace-note muted" style="margin-bottom:6px">מחליף את: <b>${esc(R.old.name)}</b></div>`);
  }catch(e){console.error(e)}
  return r;
};
document.head.insertAdjacentHTML('beforeend','<style>.fp-step{min-width:34px;height:34px;border-radius:10px;border:1px solid var(--line,#2a323b);background:none;color:inherit;font-size:18px;line-height:1;cursor:pointer}.fp-step-wrap{display:flex;gap:6px;align-items:center}.fp-step-wrap input{flex:1;min-width:0}.entry-actions .qty{width:56px}</style>');

window.fpRenameMeal=async function(){
  const m=selectedSingleMeal();if(!m)return;
  const name=prompt('שם חדש לארוחה',m.name||'');if(name===null||!name.trim())return;
  await waitForSync();exitSelectMode();loading();
  try{const day=await call('renameMealGroup',{groupId:m.gid,name:name.trim()});applyDay(day);renderDay();toast('השם עודכן')}
  catch(e){toast(e.message,true)}finally{loading(false)}
};
})();
