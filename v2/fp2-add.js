/* FitPro 2.14.0 — adding food:
   - one "חשב בעזרת AI" button and one "＋ עוד דרכים" that opens: photo of the meal, barcode, photo of a recipe / ingredient list, recipe link.
   - "ה-AI חושב…" while it works.
   - after an estimate: "כמה אכלת מזה?" (part of the dish or grams) before saving.
   - "💾 שמור כמוצר משלי": several foods saved as one product you find later in the search.
   - several foods added together are saved as one meal.
   - a logged meal (or one item): ×½ ×1.5 ×2 or a new amount for the whole thing. */
(function(){
'use strict';
const n1=v=>Math.round((Number(v)||0)*10)/10;
document.head.insertAdjacentHTML('beforeend',`<style>
#add button[onclick*="mealPhotoFile"],#fpRecipeBtn,#add details.fp-hide{display:none!important}
.fp-ai-think{display:flex;align-items:center;gap:12px;margin:14px 0;padding:14px;border:1px solid var(--line,#2A333C);border-radius:14px;background:var(--card,#171C22);font-weight:700}
.fp-ai-think i{width:22px;height:22px;border-radius:50%;border:3px solid rgba(215,243,107,.25);border-top-color:var(--brand,#D7F36B);animation:fpSpin .8s linear infinite;flex:none}
@keyframes fpSpin{to{transform:rotate(360deg)}}
.fp-portion{margin:12px 0;padding:12px;border:1px solid var(--brand,#D7F36B);border-radius:14px;background:rgba(215,243,107,.06)}
.fp-portion b{display:block;margin-bottom:8px}
.fp-portion .row2{display:flex;gap:8px;align-items:center;margin-top:8px}
.fp-portion .row2 input{width:110px}
.fp-more-opt{display:flex;gap:12px;align-items:center;width:100%;text-align:right;background:var(--card,#171C22);border:1px solid var(--line,#2A333C);border-radius:14px;padding:13px;margin-top:8px;color:inherit;font:inherit}
.fp-more-opt .ic{font-size:22px;flex:none;width:30px;text-align:center}.fp-more-opt span{display:block;color:var(--muted,#93A09A);font-size:13px;margin-top:2px}
.fp-meal-tools{display:flex;flex-wrap:wrap;gap:6px}
.fp-step{display:inline-flex;align-items:center;gap:2px;border:1px solid var(--line,#2A333C);border-radius:10px;padding:2px}
.fp-step button{width:30px;height:30px;border:0;border-radius:8px;background:var(--card,#171C22);color:inherit;font:inherit;font-size:18px}
.fp-step b{display:inline-block;min-width:30px;text-align:center;margin:0}
.fp-portion .fp-units{flex-wrap:wrap}
.fp-dish-name{margin-top:16px}.fp-dish-name input{font-weight:700;font-size:17px}
#dishPreview:not(.fp-oil-each) .dish-row:not(.fp-own-oil) .prep-oil{display:none}
</style>`);

/* ---------- the add screen: AI + "＋ עוד דרכים" ---------- */
function tidy(){
  const add=$('add');if(!add)return;
  add.querySelectorAll('.admin-only').forEach(s=>{if(/בתשלום/.test(s.textContent))s.remove()});
  add.querySelectorAll('details').forEach(d=>{const s=d.querySelector('summary');if(s&&/ברקוד/.test(s.textContent))d.classList.add('fp-hide')});
  const ai=add.querySelector('button[onclick="estimateWithOpenAI()"]');
  if(ai&&!$('fpAddMoreBtn'))ai.insertAdjacentHTML('afterend','<button type="button" class="btn light full" id="fpAddMoreBtn" style="margin-top:8px" onclick="fpAddMore()">＋ עוד דרכים: צילום, ברקוד, מתכון</button>');
}
tidy();setInterval(tidy,2000);
function sheet(id,title,body){
  let s=$(id);if(s)s.remove();
  document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="${id}"><div class="sheet" style="max-height:92vh;overflow:auto"><div class="sheet-head"><h3 style="margin:0">${title}</h3><button type="button" class="trash" aria-label="סגור" onclick="document.getElementById('${id}').remove()">✕</button></div>${body}</div></div>`);
  return $(id);
}
const opt=(ic,t,sub,fn)=>`<button type="button" class="fp-more-opt" onclick="${fn}"><span class="ic">${ic}</span><div><b>${t}</b><span>${sub}</span></div></button>`;
window.fpAddMore=function(){
  sheet('fpAddMoreSheet','עוד דרכים להוסיף',
    opt('📸','לצלם את הארוחה','ה-AI מזהה מה בצלחת וכמה','fpMore(\'photo\')')+
    opt('📷','לסרוק ברקוד','מוצר ארוז: הערכים מגיעים לבד','fpMore(\'barcode\')')+
    opt('🖼','תמונה של מתכון או רשימת מרכיבים','ה-AI קורא את המרכיבים ומחשב','fpMore(\'recipePhoto\')')+
    opt('🔗','מתכון מקישור','מדביקים קישור לאתר מתכונים','fpMore(\'link\')')+
    opt('⌨️','להקליד מספר ברקוד','אם הסריקה לא עובדת','fpMore(\'barcodeType\')'));
};
window.fpMore=function(k){
  const s=$('fpAddMoreSheet');if(s)s.remove();
  if(k==='photo'){const i=$('mealPhotoFile');if(i)i.click();return}
  if(k==='barcode'){try{startLiveScan()}catch(e){toast(e.message,true)}return}
  if(k==='barcodeType'){const d=[...document.querySelectorAll('#add details')].find(x=>/ברקוד/.test(x.textContent));if(d){d.classList.remove('fp-hide');d.open=true;const b=$('barcode');if(b)setTimeout(()=>{b.scrollIntoView({block:'center'});b.focus()},200)}return}
  if(k==='link'){try{fpRecipeOpen()}catch(e){toast(e.message,true)}return}
  if(k==='recipePhoto')recipePhotoSheet();
};

/* ---------- "ה-AI חושב…" ---------- */
function thinking(text){const el=$('dishPreview');if(!el)return;el.innerHTML=`<div class="fp-ai-think" role="status"><i></i><span>${esc(text||'ה-AI חושב…')}</span></div>`;try{el.scrollIntoView({behavior:'smooth',block:'center'})}catch(_){}}
function done(){const el=$('dishPreview');if(el&&el.querySelector('.fp-ai-think')&&!state.dishEstimate)el.innerHTML=''}
if(typeof estimateWithOpenAI==='function'){const o=estimateWithOpenAI;estimateWithOpenAI=async function(){const q=($('foodQuery').value||'').trim(),ex=(($('dishExtras')||{}).value||'').trim();if(q.length>=2){state.dishEstimate=null;thinking('ה-AI חושב על המנה…')}try{const r=await o.apply(this,arguments);try{const d=state.dishEstimate;if(d){const got=applyText(d,q+(ex?', '+ex:''));renderDishEstimate();if(got)toast('לפי מה שכתבת: '+got)}}catch(e){console.error(e)}return r}finally{done()}}}
if(typeof estimateMealPhoto==='function'){const o=estimateMealPhoto;estimateMealPhoto=async function(file){const ex=(($('dishExtras')||{}).value||'').trim();if(file){showView('add');state.dishEstimate=null;setTimeout(()=>thinking('ה-AI מסתכל על התמונה…'),30)}try{const r=await o.apply(this,arguments);try{const d=state.dishEstimate;if(d&&ex){const got=applyText(d,ex);renderDishEstimate();if(got)toast('לפי מה שכתבת: '+got)}}catch(e){console.error(e)}return r}finally{done()}}}

/* ---------- photo of a recipe or an ingredient list ---------- */
let SERV=4;
function recipePhotoSheet(){
  sheet('fpRecipePhoto','🖼 תמונה של מתכון',`<p class="muted" style="margin:0 0 8px">מצלמים את המתכון או את רשימת המרכיבים (גם צילום מסך). ה-AI קורא ומחשב.</p>
    <div class="field"><label>כמה מנות יוצא המתכון?</label><input id="fpRpServ" type="number" min="1" max="50" step="1" inputmode="numeric" value="${SERV}"></div>
    <input id="fpRpFile" type="file" accept="image/*" style="display:none">
    <button type="button" class="btn full" onclick="document.getElementById('fpRpFile').click()">בחר תמונה או צלם</button>`);
  $('fpRpFile').onchange=e=>{const f=e.target.files&&e.target.files[0];SERV=Math.max(1,Math.min(50,Math.round(Number($('fpRpServ').value)||1)));const s=$('fpRecipePhoto');if(s)s.remove();if(f)recipeFromPhoto(f,SERV)};
}
async function recipeFromPhoto(file,serv){
  showView('add');state.dishEstimate=null;thinking('ה-AI קורא את המתכון…');
  try{const image=await shrinkImage(file,1600,0.8);
    const note='זו תמונה של מתכון או של רשימת מרכיבים, לא של צלחת. קרא כל מרכיב והכמות שכתובה לידו, המר לגרמים, והחזר את כל המתכון כמו שהוא (כל המנות יחד). אל תוסיף מרכיבים שלא כתובים. השם: שם המתכון.';
    const r=await call('estimateFoodPhoto',{image,note});
    state.dishEstimate=r;state.dishSkin=null;state.dishBone=null;state.dishFor=null;if($('foodQuery'))$('foodQuery').value=r.name;
    setBase(r);r._serv=serv;r._units={n:serv,k:1};scale(r,1/serv);
    toast(serv>1?`חישבתי מנה אחת מתוך ${serv}. אפשר לשנות למטה`:'בדוק את הכמויות לפני הוספה');
  }catch(e){done();toast(e.message,true)}
}

/* ---------- 2.15: the dish after AI — name, how much you ate (part, grams or units), one save ---------- */
function setBase(r){r._base=r.items.map(x=>Number(x.amount)||0);r._f=1}
function U(d){if(!d._units)d._units={n:1,k:1};return d._units}
function scale(r,f){if(!r._base||r._base.length!==r.items.length)setBase(r);r._f=f;r.items.forEach((x,i)=>{x.amount=Math.max(0.1,Math.round(r._base[i]*f*10)/10)});renderDishEstimate()}
const FR=[[0.25,'¼'],[1/3,'⅓'],[0.5,'½'],[0.75,'¾'],[1,'הכל'],[1.5,'1½'],[2,'2']];
const r2=v=>Math.round(v*100)/100;
window.fpDishScale=f=>{const r=state.dishEstimate;if(!r)return;f=Number(f);const u=U(r);u.k=r2(u.n*f);scale(r,f)};
window.fpDishGrams=g=>{const r=state.dishEstimate;if(!r)return;if(!r._base)setBase(r);const G=r._base.reduce((n,a)=>n+a,0);g=Number(g);if(!(g>0)||!G)return;const u=U(r);u.k=r2(u.n*g/G);scale(r,g/G)};
window.fpDishUnits=(which,delta)=>{const r=state.dishEstimate;if(!r)return;const u=U(r);
  if(which==='n')u.n=Math.max(1,Math.min(60,Math.round(u.n+delta)));else u.k=Math.max(0.5,Math.min(60,r2(u.k+delta)));scale(r,u.k/u.n)};
window.fpDishName=v=>{const r=state.dishEstimate;if(r)r.name=String(v||'')};
window.fpDishOilEach=()=>{const el=$('dishPreview');if(el)el.classList.toggle('fp-oil-each')};
const step=(which,val,d)=>`<span class="fp-step"><button type="button" onclick="fpDishUnits('${which}',-${d})">−</button><b>${fmt(val)}</b><button type="button" onclick="fpDishUnits('${which}',${d})">+</button></span>`;
if(typeof renderDishEstimate==='function'){
  const o=renderDishEstimate;
  renderDishEstimate=function(){
    const r=o.apply(this,arguments);
    try{const d=state.dishEstimate,el=$('dishPreview');if(!d||!el||!d.items||!d.items.length)return r;
      if(!d._base||d._base.length!==d.items.length)setBase(d);const u=U(d);
      const G=Math.round(d._base.reduce((n,a)=>n+a,0)),now=Math.round(d.items.reduce((n,x)=>n+(Number(x.amount)||0),0));
      const name=`<div class="field fp-dish-name"><label>שם המנה</label><input id="fpDishName" maxlength="60" value="${esc(d.name||'')}" oninput="fpDishName(this.value)"></div>`;
      const box=`<div class="fp-portion"><b>🍽 כמה אכלת מזה?</b><div class="meal-tabs" style="flex-wrap:wrap">${FR.map(([v,l])=>`<button type="button" class="chip${Math.abs((d._f||1)-v)<0.01?' active':''}" onclick="fpDishScale(${v})"><bdi dir="ltr">${l}</bdi></button>`).join('')}</div>
        <div class="row2"><span>בגרמים:</span><input id="fpDishG" type="number" min="1" step="1" inputmode="numeric" value="${now}" onchange="fpDishGrams(this.value)"><span class="muted">מתוך ${G} ג׳</span></div>
        <div class="row2 fp-units"><span>ביחידות:</span><span class="muted">כל המנה =</span>${step('n',u.n,1)}<span class="muted">${u.n===1?'יחידה':'יחידות'}</span></div><div class="row2 fp-units"><span style="visibility:hidden">ביחידות:</span><span class="muted">אכלתי</span>${step('k',u.k,0.5)}<span class="muted">${u.k===1?'יחידה':'יחידות'}</span></div>
        <p class="muted" style="margin:8px 0 0;font-size:12.5px">למשל בצל ממולא, קציצות, פרוסות פיצה. אפשר גם לשנות כל רכיב בנפרד למטה.</p></div>`;
      const h=el.querySelector('h3');if(h){h.insertAdjacentHTML('afterend',name+box);h.remove()}else el.insertAdjacentHTML('afterbegin',name+box);
      /* oil: one choice for the whole dish; each item only on request */
      const all=$('dishOilAll');if(all&&!$('fpOilEachBtn'))all.insertAdjacentHTML('beforeend','<button type="button" class="chip" id="fpOilEachBtn" style="margin-top:6px" onclick="fpDishOilEach()">שמן שונה לכל רכיב</button>');
      el.querySelectorAll('.dish-row').forEach((row,i)=>{const x=d.items[i];if(x&&x.extraOil)row.classList.add('fp-own-oil')});
      /* one clear way to save */
      const b1=el.querySelector('button[onclick="saveDishEstimate(false)"]'),b2=el.querySelector('button[onclick="saveDishEstimate(true)"]'),b3=el.querySelector('button[onclick="saveDishOnly()"]');
      if(b1)b1.textContent='הוסף ליומן';if(b2)b2.textContent='הוסף ליומן ושמור במאגר שלי';if(b3){b3.textContent='רק לשמור במאגר שלי';b3.insertAdjacentHTML('afterend','<p class="muted" style="margin:6px 0 0;font-size:12.5px;text-align:center">נשמר כמנה אחת בשם שבחרת, ותמצא אותו בחיפוש.</p>')}
    }catch(e){console.error(e)}
    return r;
  };
}
if(typeof setDishAmount==='function'){const o=setDishAmount;setDishAmount=function(i){const r=o.apply(this,arguments);try{const d=state.dishEstimate,x=d&&d.items[i];if(d&&d._base&&x)d._base[i]=(Number(x.amount)||0)/(d._f||1)}catch(_){}return r}}
if(typeof removeDishPart==='function'){const o=removeDishPart;removeDishPart=function(i){try{const d=state.dishEstimate;if(d&&d._base)d._base.splice(i,1)}catch(_){}return o.apply(this,arguments)}}

/* "200 גרם עוף, 150 גרם תפוחי אדמה" → those grams go to the matching items. "2 בצלים ממולאים" → 2 units. */
const GU='(?:גרם|גרמים|גר׳|גר\'|גר|ג׳|ג\'|g|gr|מ״ל|מ"ל|מל)';
function textParts(text){
  const out=[];
  String(text||'').split(/[,+;\n]|\s+עם\s+/).forEach(ch=>{
    let subs=[ch];if(((ch.match(/\d+(?:[.,]\d+)?/g)||[]).length)>=2)subs=ch.split(/\s+ו(?=-?\s*\d|[א-ת])/);
    subs.forEach(s=>{const m=s.match(new RegExp('(\\d+(?:[.,]\\d+)?)\\s*'+GU+'(?![א-תa-z])','i'));if(!m)return;const g=Number(m[1].replace(',','.'));
      const name=(s.slice(0,m.index)+' '+s.slice(m.index+m[0].length)).replace(/(^|\s)של(?=\s|$)/g,' ').replace(/\s+/g,' ').trim().replace(/^ו(?=[א-ת]{3})/,'').replace(/\s+(?:ו|עם|ועוד)$/,'');
      if(g>0&&name.length>=2)out.push({g,name})});
  });
  return out;
}
const STOP=new Set(['של','עם','ועוד','קצת','מעט','הרבה','בערך']);
function toks(s){return normHe(s).split(' ').filter(w=>w.length>=2&&!STOP.has(w)).map(w=>w.replace(/^ו(?=[א-ת]{3})/,''))}
function hits(label,tk){const L=' '+normHe(label)+' ';return tk.filter(w=>L.indexOf(w)>=0||(w.length>4&&L.indexOf(w.replace(/(ים|ות|ה)$/,''))>=0)).length}
window.fpTextParts=textParts;
function applyText(d,text){
  if(!d||!d.items||!d.items.length)return '';const parts=textParts(text),done=[],used=new Set();
  /* one amount for the whole dish ("בצל ממולא 300 גרם"): the whole dish gets it, not one of its parts */
  if(parts.length===1&&d.items.length>1){const tk=toks(parts[0].name),ds=hits(d.name||'',tk);let bi=0;d.items.forEach(x=>{bi=Math.max(bi,hits(x.label,tk))});
    if(ds>0&&ds>=bi){const G=d.items.reduce((n,x)=>n+(Number(x.amount)||0),0);if(G>0){const f=parts[0].g/G;d.items.forEach(x=>{x.amount=Math.max(0.1,Math.round(x.amount*f*10)/10)});setBase(d);const u=U(d);d._f=u.k/u.n;return 'כל המנה '+fmt(parts[0].g)+' ג׳'}}}
  parts.forEach(p=>{const tk=toks(p.name);if(!tk.length)return;let best=-1,bs=0;d.items.forEach((x,i)=>{if(used.has(i))return;const s=hits(x.label,tk);if(s>bs){bs=s;best=i}});
    if(best>=0){used.add(best);const x=d.items[best];x.measure='גרם';x.amount=p.g;done.push(x.label+' '+fmt(p.g)+' ג׳')}});
  if(!parts.length){const m=String(text||'').trim().match(/^(\d+(?:[.,]\d+)?)\s+(?!גרם|גר|ג׳|g|מ״ל)[א-ת]/);const n=m?Number(m[1].replace(',','.')):0;if(n>=1&&n<=20&&Number.isInteger(n)){d._units={n,k:n}}}
  if(done.length){setBase(d);const u=U(d);d._f=u.k/u.n}
  return done.join(', ');
}
window.fpApplyDishText=applyText;

/* the whole dish as one product: per 100 ג׳, with "מנה" (what you ate) and "יחידה" */
function dishProduct(d){
  const t=dishTotals();let G=d.items.reduce((n,x)=>n+(Number(x.amount)||0),0);try{G+=Number(dishOilGrams())||0}catch(_){}
  const name=String(($('fpDishName')||{}).value||d.name||'').trim();if(!name||!(G>0)||!(t.calories||t.protein))return null;
  const u=U(d),units=[['מנה',Math.round(G)]];if(u.k>0&&(u.n>1||u.k!==1))units.push(['יחידה',Math.round(G/u.k)]);
  const per=k=>Math.round((Number(t[k])||0)*1000/G)/10;
  return {name,amount:100,unit:'גרם',calories:per('calories'),protein:per('protein'),carbs:per('carbs'),fat:per('fat'),units};
}
window.fpDishProduct=()=>state.dishEstimate?dishProduct(state.dishEstimate):null;
function mealUnits(){try{return JSON.parse((window.FP2&&FP2.getProp&&FP2.getProp('MEAL_UNITS'))||localStorage.getItem('fp2.mealUnits')||'{}')||{}}catch(_){return {}}}
function setMealUnits(name,k){if(!name)return;const m=mealUnits();m[name]=k;const s=JSON.stringify(m);try{localStorage.setItem('fp2.mealUnits',s)}catch(_){}try{if(window.FP2&&FP2.setProp)FP2.setProp('MEAL_UNITS',s)}catch(_){}}
window.fpMealUnits=mealUnits;
if(typeof saveDishEstimate==='function'){
  const o=saveDishEstimate;
  saveDishEstimate=async function(perm){
    const d=state.dishEstimate;if(!d)return o.apply(this,arguments);
    const nm=String(($('fpDishName')||{}).value||'').trim();if(nm)d.name=nm;else if(!String(d.name||'').trim())return toast('תן שם למנה',true);
    const prod=perm?dishProduct(d):null,u=U(d),name=d.name,keep=keepDishItemsInLibrary;
    if(perm)keepDishItemsInLibrary=function(){};
    try{const r=await o.apply(this,arguments);
      if(perm&&state.dishEstimate!==d){if(prod)queueSaveMine([prod],'');if(u.n>1||u.k!==1)setMealUnits(name,u.k)}
      return r}finally{keepDishItemsInLibrary=keep}
  };
}
if(typeof saveDishOnly==='function'){
  saveDishOnly=function(){const d=state.dishEstimate;if(!d||!d.items.length)return toast('אין מה לשמור',true);
    const p=dishProduct(d);if(!p)return toast(String(($('fpDishName')||{}).value||'').trim()?'אין ערכים לשמירה':'תן שם למנה',true);
    d.name=p.name;queueSaveMine([p],`״${p.name}״ נשמר. בפעם הבאה תמצא אותו בחיפוש`)};
}

/* ---------- "💾 שמור כמוצר משלי" for a sentence or a logged meal ---------- */
function askName(def,sub,cb){
  sheet('fpNameProd','💾 שמור כמוצר משלי',`<p class="muted" style="margin:0 0 8px">${sub}</p><div class="field"><label>איך לקרוא לו?</label><input id="fpProdName" maxlength="60" value="${esc(def)}"></div><button type="button" class="btn full" id="fpProdGo">שמור</button>`);
  const go=()=>{const v=($('fpProdName').value||'').trim();if(!v)return toast('כתוב שם',true);$('fpNameProd').remove();cb(v)};
  $('fpProdGo').onclick=go;$('fpProdName').addEventListener('keydown',e=>{if(e.key==='Enter')go()});setTimeout(()=>{try{$('fpProdName').select()}catch(_){}},200);
}
function saveProduct(name,t,grams){
  const it=grams>0?{name,amount:100,unit:'גרם',calories:Math.round(t.calories*1000/grams)/10,protein:Math.round(t.protein*1000/grams)/10,carbs:Math.round(t.carbs*1000/grams)/10,fat:Math.round(t.fat*1000/grams)/10,units:[['מנה',Math.round(grams)]]}
    :{name,amount:1,unit:'מנה',calories:n1(t.calories),protein:n1(t.protein),carbs:n1(t.carbs),fat:n1(t.fat),units:[]};
  if(queueSaveMine([it],`״${name}״ נשמר. בפעם הבאה תמצא אותו בחיפוש`))return true;toast('אין ערכים לשמור',true);return false;
}
window.fpSaveDishProduct=function(){const d=state.dishEstimate;if(!d)return;const p=dishProduct(d);if(p)queueSaveMine([p],`״${p.name}״ נשמר`)};
function sentenceRows(){return (state.sentence||[]).filter(r=>r.on&&r.food&&r.amount>0)}
function sentenceTotals(){const t={calories:0,protein:0,carbs:0,fat:0};sentenceRows().forEach(r=>{const m=sentenceMacros(r);if(m)Object.keys(t).forEach(k=>t[k]+=Number(m[k])||0)});return t}
function sentenceGrams(){let g=0;for(const r of sentenceRows()){const per=r.unit==='גרם'||r.unit==='מ״ל'?1:foodUnitGrams(r.food,r.unit);if(!(per>0))return 0;g+=r.amount*per}return g}
window.fpSaveSentenceProduct=function(){const t=sentenceTotals();if(!t.calories)return toast('לא נבחר כלום',true);
  askName(($('foodQuery').value||'').trim().slice(0,60),`${kc(t.calories)} קל׳ · ${fmt(n1(t.protein))} ג׳ חלבון. נשמר כמנה אחת.`,v=>saveProduct(v,t,sentenceGrams()))};
if(typeof renderSentence==='function'){const o=renderSentence;renderSentence=function(){const r=o.apply(this,arguments);try{const L=$('sentenceList');if(L&&!$('fpSentProd'))L.insertAdjacentHTML('afterend','<button type="button" class="btn light full" id="fpSentProd" style="margin-top:8px" onclick="fpSaveSentenceProduct()">💾 שמור כמוצר משלי</button>')}catch(_){}return r}}

/* ---------- several foods added together = one meal ---------- */
async function groupFresh(before,name,category){
  for(let k=0;k<40;k++){await new Promise(r=>setTimeout(r,250));const all=state.data.entries||[];const fresh=all.filter(x=>!before.has(String(x.id)));if(fresh.length&&!fresh.some(x=>x.pending||/^tmp/.test(String(x.id))))break}
  try{await waitForSync()}catch(_){}
  const fresh=(state.data.entries||[]).filter(x=>!before.has(String(x.id))&&!x.pending&&!/^tmp/.test(String(x.id))).map(x=>String(x.id));
  if(fresh.length<2)return;
  try{const r=await call('groupEntries',{ids:fresh,name,category});applyDay(r.day);renderDay()}catch(e){console.warn('group',e&&e.message)}
}
if(typeof addSentence==='function'){
  const o=addSentence;
  addSentence=async function(){
    const rows=(state.sentence||[]).filter(r=>r.on&&r.food&&r.amount>0),text=($('foodQuery').value||'').trim(),cat=addCategoryValue();
    const before=new Set((state.data.entries||[]).map(x=>String(x.id)));const date=state.date;
    const r=await o.apply(this,arguments);
    if(rows.length>=2&&!state.fpAddToGroup&&state.date===date){const name=(text||rows.map(x=>x.food.name).join(', ')).slice(0,40);groupFresh(before,name,cat)}
    return r;
  };
}

/* ---------- a logged meal: ×½ ×1.5 ×2 or a new amount ---------- */
function mealTools(){
  document.querySelectorAll('#entries .fp-meal-tools').forEach(t=>{
    if(t.dataset.fpq)return;const b=t.querySelector('button[onclick^="fpAddToMeal"]');if(!b)return;const m=String(b.getAttribute('onclick')).match(/fpAddToMeal\('([^']+)'\)/);if(!m)return;
    t.dataset.fpq='1';t.insertAdjacentHTML('beforeend',`<button type="button" class="chip" onclick="fpMealQty('${m[1]}')">⚖ כמות</button><button type="button" class="chip" onclick="fpMealProduct('${m[1]}')">💾 כמוצר</button>`);
  });
}
if(typeof renderEntries==='function'){const o=renderEntries;renderEntries=function(){const r=o.apply(this,arguments);try{mealTools()}catch(e){console.error(e)}return r}}
const items=gid=>(state.data.entries||[]).filter(x=>String(x.groupId)===String(gid));
window.fpMealQty=function(gid){
  const its=items(gid);if(!its.length)return;const name=its[0].mealOption||its[0].name||'הארוחה';
  const kcal=its.reduce((n,x)=>n+(Number(x.calories)||0),0),allG=its.every(x=>x.unit==='גרם'),G=allG?Math.round(its.reduce((n,x)=>n+(Number(x.amount)||0),0)):0;
  sheet('fpMealQtySheet','⚖ כמות של '+esc(name),`<p class="muted" style="margin:0 0 8px">עכשיו: ${kc(kcal)} קל׳${G?` · ${G} ג׳`:''}. כל הפריטים בארוחה משתנים ביחד.</p>
    <div class="meal-tabs" style="flex-wrap:wrap">${[[0.5,'חצי'],[0.75,'¾'],[1.5,'פי 1.5'],[2,'פי 2'],[3,'פי 3']].map(([v,l])=>`<button type="button" class="chip" onclick="fpMealScale('${gid}',${v})">${l}</button>`).join('')}</div>
    ${G?`<div class="field" style="margin-top:12px"><label>או כמה גרם אכלת בסך הכל</label><div style="display:flex;gap:8px"><input id="fpMealG" type="number" min="1" step="1" inputmode="numeric" value="${G}" style="flex:1"><button type="button" class="btn" onclick="fpMealScale('${gid}',Number(document.getElementById('fpMealG').value)/${G})">שמור</button></div></div>`:''}`);
};
window.fpMealScale=async function(gid,f){
  f=Number(f);if(!(f>0)||Math.abs(f-1)<0.001)return;const s=$('fpMealQtySheet');if(s)s.remove();
  const its=items(gid);loading();
  try{let last=null;for(const x of its){last=await call('updateEntry',{entryId:x.id,amount:Math.round((Number(x.amount)||0)*f*100)/100})}
    if(last){applyDay(last);renderDay()}toast(`עודכן: פי ${n1(f)}`)}catch(e){toast(e.message,true)}finally{loading(false)}
};
window.fpMealProduct=function(gid){const its=items(gid);if(!its.length)return;const t={calories:0,protein:0,carbs:0,fat:0};its.forEach(x=>Object.keys(t).forEach(k=>t[k]+=Number(x[k])||0));
  const G=its.every(x=>x.unit==='גרם')?its.reduce((n,x)=>n+(Number(x.amount)||0),0):0;
  askName(its[0].mealOption||its[0].name||'',`${kc(t.calories)} קל׳ · ${fmt(n1(t.protein))} ג׳ חלבון. נשמר כמנה אחת.`,v=>saveProduct(v,t,G))};

/* ---------- one item: ×½ ×1.5 ×2 in the edit sheet ---------- */
function editChips(){const a=$('entryEditAmount');if(!a||$('fpEditX'))return;const row=a.closest('.row');if(!row)return;
  row.insertAdjacentHTML('afterend',`<div class="meal-tabs" id="fpEditX" style="flex-wrap:wrap;margin:4px 0 8px">${[[0.5,'חצי'],[1.5,'פי 1.5'],[2,'פי 2'],[3,'פי 3']].map(([v,l])=>`<button type="button" class="chip" onclick="fpEditX(${v})">${l}</button>`).join('')}</div>`)}
window.fpEditX=f=>{const a=$('entryEditAmount');if(!a)return;a.value=Math.round((Number(a.value)||0)*f*100)/100;try{updateEntryEditTotals()}catch(_){}};
editChips();setInterval(editChips,3000);
})();
