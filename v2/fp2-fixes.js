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
