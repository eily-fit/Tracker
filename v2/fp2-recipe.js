/* FitPro 2.12.0 — a recipe from a link.
   Paste a link → the app reads the ingredients and servings (schema.org Recipe, through the push web app),
   matches every ingredient in the food database, and gives the values of one serving.
   No link? Paste the ingredient list itself. */
(function(){
'use strict';
const R={step:'link',title:'',servings:4,rows:[],site:null,busy:false,url:''};
const FR={'½':.5,'¼':.25,'¾':.75,'⅓':.333,'⅔':.667,'⅛':.125};
function cleanLine(t){
  let s=String(t||'').replace(/[½¼¾⅓⅔⅛]/g,m=>' '+FR[m]).replace(/(\d+)\s+(0?\.\d+)/g,(_,a,b)=>String(Number(a)+Number(b)))
    .replace(/(\d+)\s*\/\s*(\d+)/g,(_,a,b)=>String(Math.round(Number(a)/Number(b)*100)/100)).replace(/\([^)]*\)/g,' ')
    .replace(/^[-•*·▢☐\s]+/,'')
    .replace(/\s+/g,' ').trim();
  s=s.split(/[,،;]| או /)[0].trim();
  s=s.replace(/^חצי\s+/,'0.5 ').replace(/^רבע\s+/,'0.25 ');
  return s;
}
/* what a recipe usually means by the plain word */
const PREF=[[/^קמח$/,/קמח חיטה לבן/],[/^ביצ(ה|ים)$/,/ביצה שלמה בלי קליפה/],[/^שמן$/,/^שמן \(זית|^שמן צמחי/],[/^חלב$/,/^חלב 3%/],[/^סוכר$/,/^סוכר/],[/^חמאה$/,/^חמאה$/]];
const CUP=[[/קמח/,140],[/אבקת סוכר/,120],[/סוכר/,200],[/קקאו/,90],[/שמן/,216],[/חמאה/,227],[/אורז/,190],[/שיבולת|קוואקר/,90],[/פירורי לחם|פירורים/,110],[/אגוז|שקד/,130],[/חלב|מים|שמנת|מיץ|יוגורט|רוטב/,240]];
const SPOON=[[/קמח/,8],[/סוכר/,12],[/שמן/,14],[/קקאו/,7],[/חמאה/,14],[/דבש|סילאן|ריבה/,21]];
const pick=(tbl,label,d)=>{const m=tbl.find(x=>x[0].test(label));return m?m[1]:d};
function matchRow(text){
  const t=cleanLine(text);let r={results:[],parsed:null};try{r=localFoodSearch(t,6)}catch(_){}
  const P=r.parsed||{},label=(P.tokens||[]).join(' ');
  let base=r.results[0];const pr=PREF.find(x=>x[0].test(label));if(pr){const f=r.results.find(o=>pr[1].test(o.name));if(f)base=f}
  const food=base?withHouseholdUnits(base):null;let amount=1,unit='גרם';
  if(food){const d=defaultPortion(food,r.parsed);amount=d.amount;unit=d.unit;const n=Number(P.amount)||0,u=String(P.unitHint||''),opts=foodUnitOptions(food);
    if(n>0&&P.grams){amount=n;unit='גרם'}
    else if(n>0&&/כוס/.test(u)){amount=Math.round(n*pick(CUP,label,200));unit='גרם'}
    else if(n>0&&/כפית/.test(u)){amount=Math.round(n*pick(SPOON,label,15)/3*10)/10;unit='גרם'}
    else if(n>0&&/כף/.test(u)){amount=Math.round(n*pick(SPOON,label,15));unit='גרם'}
    else if(n>0&&/מ.?ל|ליטר/.test(u)){amount=Math.round(n*(/ליטר/.test(u)?1000:1));unit='גרם'}
    else if(n>0&&!u){const eu=opts.find(x=>x==='ביצה L')||opts.find(x=>x==='יחידה')||opts.find(x=>/יחידה|פרוסה/.test(x));if(eu){amount=n;unit=eu}}
    else if(!n&&/כוס/.test(u)){amount=pick(CUP,label,200);unit='גרם'}
    if(opts.indexOf(unit)<0){unit='גרם'}}
  return {text:String(text),q:t,options:r.results.slice(0,6),food,amount,unit,on:!!food};
}
const mac=r=>r.on&&r.food&&r.amount>0?portionMacros(r.food,r.amount,r.unit):null;
function totals(){const t={calories:0,protein:0,carbs:0,fat:0};R.rows.forEach(r=>{const m=mac(r);if(m)Object.keys(t).forEach(k=>t[k]+=Number(m[k])||0)});return t}
const per=t=>{const n=Math.max(1,Number(R.servings)||1);const o={};Object.keys(t).forEach(k=>o[k]=Math.round(t[k]/n*10)/10);return o};

function sheet(){let s=$('fpRecipe');if(!s){document.body.insertAdjacentHTML('beforeend','<div class="overlay hide" id="fpRecipe"><div class="sheet" style="max-height:92vh;overflow:auto"><div class="sheet-head"><h3 style="margin:0">🔗 מתכון מקישור</h3><button type="button" class="trash" aria-label="סגור" onclick="fpRecipeClose()">✕</button></div><div id="fpRecipeBody"></div></div></div>');s=$('fpRecipe')}return s}
function render(){
  const b=$('fpRecipeBody');if(!b)return;
  if(R.step==='link'){
    b.innerHTML=`<p class="muted" style="margin:0 0 8px">מדביקים קישור למתכון מאתר, והאפליקציה מחשבת כמה יש במנה אחת.</p>
      <div class="field"><input id="fpRecipeUrl" inputmode="url" placeholder="https://..." value="${esc(R.url)}"></div>
      <button type="button" class="btn full" ${R.busy?'disabled':''} onclick="fpRecipeFetch()">${R.busy?'קורא את המתכון…':'קרא מתכון'}</button>
      <details style="margin-top:12px"><summary class="muted">אין קישור? הדבק את רשימת המצרכים</summary>
        <div class="field" style="margin-top:8px"><textarea id="fpRecipeText" rows="6" placeholder="2 כוסות קמח&#10;3 ביצים&#10;חצי כוס שמן&#10;200 גרם שוקולד"></textarea></div>
        <button type="button" class="btn secondary full" onclick="fpRecipeFromText()">חשב</button></details>`;
    return;
  }
  const t=totals(),p=per(t),miss=R.rows.filter(r=>!r.food).length;
  b.innerHTML=`<div class="field"><label>שם</label><input id="fpRecipeTitle" value="${esc(R.title)}" oninput="fpRecipeSet('title',this.value)"></div>
    <div class="field"><label>כמה מנות יוצא המתכון?</label><input id="fpRecipeServ" type="number" min="1" step="1" inputmode="numeric" value="${R.servings}" onchange="fpRecipeSet('servings',this.value)"></div>
    <div class="card" style="padding:10px 12px;margin:8px 0"><div style="font-size:17px;font-weight:800">מנה אחת: ${kc(p.calories)} קל׳</div><div class="muted">${fmt(p.protein)} ג׳ חלבון · ${fmt(p.carbs)} ג׳ פחמימות · ${fmt(p.fat)} ג׳ שומן</div>
      ${R.site&&R.site.calories?`<div class="muted" style="font-size:12.5px;margin-top:4px">האתר כותב ${kc(R.site.calories)} קל׳ למנה. <button type="button" class="linkish" onclick="fpRecipeUseSite()">להשתמש בערכים של האתר</button></div>`:''}</div>
    ${miss?`<p class="muted" style="margin:4px 0">${miss===1?'מצרך אחד לא נמצא במאגר':miss+' מצרכים לא נמצאו במאגר'}. אפשר לכתוב שם אחר או לדלג.</p>`:''}
    <h4 style="margin:12px 0 6px">המצרכים (${R.rows.length})</h4>
    ${R.rows.map((r,i)=>{const m=mac(r);return `<div class="history-card${r.on?'':' off'}" style="padding:8px 10px">
      <div class="history-top"><label style="display:flex;gap:8px;align-items:center;min-width:0"><input type="checkbox" style="width:auto" ${r.on?'checked':''} ${r.food?'':'disabled'} onchange="fpRecipeRow(${i},'on',this.checked)"><span style="min-width:0">${esc(r.text)}</span></label>${m?`<span class="muted" style="flex:none">${kc(m.calories)} קל׳</span>`:''}</div>
      ${r.food?`<select onchange="fpRecipeRow(${i},'pick',this.value)">${r.options.map((o,k)=>`<option value="${k}" ${o.name===r.food.name?'selected':''}>${esc(o.name)}</option>`).join('')}</select>
        <div class="row"><div class="field"><input type="number" min="0" step="0.1" inputmode="decimal" value="${r.amount}" onchange="fpRecipeRow(${i},'amount',this.value)"></div><div class="field"><select onchange="fpRecipeRow(${i},'unit',this.value)">${foodUnitOptions(r.food).map(u=>`<option value="${esc(u)}" ${u===r.unit?'selected':''}>${esc(unitLabel(r.food,u))}</option>`).join('')}</select></div></div>`
        :`<div class="row"><div class="field"><input placeholder="שם אחר לחיפוש" onchange="fpRecipeRow(${i},'q',this.value)"></div></div>`}</div>`}).join('')}
    <button type="button" class="btn full" style="margin-top:12px" onclick="fpRecipeAdd()">הוסף מנה אחת ליומן</button>
    <button type="button" class="btn secondary full" style="margin-top:8px" onclick="fpRecipeSave()">רק לשמור במאגר שלי</button>
    <button type="button" class="linkish muted" style="margin-top:8px" onclick="fpRecipeReset()">מתכון אחר</button>`;
}
window.fpRecipeOpen=function(){if(typeof tz!=='undefined'&&!tz.ready){toast('המאגר עוד נטען, נסה שוב בעוד רגע',true);return}sheet().classList.remove('hide');render();setTimeout(()=>{const i=$('fpRecipeUrl');if(i)i.focus()},200)};
window.fpRecipeClose=()=>{const s=$('fpRecipe');if(s)s.classList.add('hide')};
window.fpRecipeReset=()=>{Object.assign(R,{step:'link',title:'',servings:4,rows:[],site:null,url:''});render()};
function load(title,servings,lines,site){
  R.title=title||'מתכון';R.servings=servings>0?Math.round(servings):4;R.site=site||null;
  R.rows=lines.map(cleanLine).filter(x=>x.length>=2).length?lines.filter(l=>cleanLine(l).length>=2).slice(0,60).map(matchRow):[];
  if(!R.rows.length){toast('לא מצאתי מצרכים',true);return}
  R.step='calc';render();
}
window.fpRecipeFetch=async function(){
  const url=(($('fpRecipeUrl')||{}).value||'').trim();R.url=url;
  if(!/^https?:\/\//i.test(url))return toast('הדבק קישור שמתחיל ב-https://',true);
  if(!(window.FP2&&FP2.push))return toast('אין חיבור לשרת',true);
  R.busy=true;render();
  try{const r=await FP2.push('fetchRecipe',{url});R.busy=false;
    if(!r||!r.ingredients||!r.ingredients.length){render();toast('לא מצאתי מתכון בעמוד הזה. אפשר להדביק את המצרכים למטה',true);const d=$('fpRecipeBody').querySelector('details');if(d)d.open=true;return}
    load(r.title,r.servings,r.ingredients,r.nutrition);
  }catch(e){R.busy=false;render();toast(String(e.message||e).replace('push-not-configured','ההתראות לא מוגדרות, אז אי אפשר לקרוא קישורים. אפשר להדביק את המצרכים'),true)}
};
window.fpRecipeFromText=function(){const t=(($('fpRecipeText')||{}).value||'');const lines=t.split(/\n+/).map(x=>x.trim()).filter(Boolean);if(!lines.length)return toast('הדבק את רשימת המצרכים',true);load('',4,lines.length===1?splitSentence(lines[0]):lines,null)};
window.fpRecipeSet=(k,v)=>{if(k==='servings'){const n=Math.round(Number(v));if(!(n>=1&&n<=100))return toast('בין 1 ל-100',true);R.servings=n;render()}else R[k]=v};
window.fpRecipeRow=(i,k,v)=>{const r=R.rows[i];if(!r)return;
  if(k==='on')r.on=!!v;
  else if(k==='pick'){const f=r.options[Number(v)];if(f){r.food=withHouseholdUnits(f);const d=defaultPortion(r.food,null);if(foodUnitOptions(r.food).indexOf(r.unit)<0){r.unit=d.unit;r.amount=d.amount}}}
  else if(k==='amount')r.amount=Math.max(0,Number(v)||0);
  else if(k==='unit')r.unit=v;
  else if(k==='q'){const n=matchRow(v);if(n.food){n.text=r.text;R.rows[i]=n}else toast('לא נמצא',true)}
  render()};
window.fpRecipeUseSite=()=>{R.override=R.site;fpRecipeAdd()};
async function save(addToDay){
  const p=R.override||per(totals());R.override=null;
  if(!(Number(p.calories)>0))return toast('אין ערכים. בחר לפחות מצרך אחד',true);
  const name=(R.title||'מתכון').trim().slice(0,60)+' (מנה)';
  const item={name,amount:1,baseQty:1,unit:'מנה',calories:Math.round(p.calories),protein:Math.round(p.protein*10)/10,carbs:Math.round(p.carbs*10)/10,fat:Math.round(p.fat*10)/10};
  try{
    if(addToDay){fpRecipeClose();optimisticMutate('saveFood',Object.assign({date:state.date,category:addCategoryValue(),source:'מתכון'},item),'');toast(`${name} נוסף · ${kc(item.calories)} קל׳`);showView('today')}
    else{queueSaveMine([{name,amount:1,unit:'מנה',calories:item.calories,protein:item.protein,carbs:item.carbs,fat:item.fat}],'נשמר במאגר שלך. יופיע ראשון בחיפוש')}
  }catch(e){toast(e.message,true)}
}
window.fpRecipeAdd=()=>save(true);
window.fpRecipeSave=()=>save(false);
/* the button, next to "📸 צלם את הארוחה" */
function ensureBtn(){if($('fpRecipeBtn'))return;const ph=document.querySelector("#add button[onclick*='mealPhotoFile']");if(!ph)return;
  ph.insertAdjacentHTML('afterend','<button type="button" class="btn light full" id="fpRecipeBtn" style="margin-top:8px" onclick="fpRecipeOpen()">🔗 מתכון מקישור</button>')}
ensureBtn();setInterval(ensureBtn,3000);
window.fpRecipeLoad=load;
})();
