/* FitPro 2.3.1: food preparation controls and watch setup. */
'use strict';
const OIL_CHOICES=[['included','כבר כלול / ללא תוספת'],['none','בלי שמן נוסף'],['little','מעט'],['normal','רגיל'],['lots','הרבה'],['exact','כמות ידועה']];
function oilControls(id,selection,handler,mass){
  const sel=selection||{mode:'included'},g=FP2Nutrition.oilGrams(sel,mass);
  return `<div class="prep-oil" id="${id}"><b>שמן נוסף</b><div class="skin-chips">${OIL_CHOICES.map(([key,label])=>`<button type="button" class="chip${sel.mode===key?' active':''}" onclick="${handler}('${key}')">${label}</button>`).join('')}</div>${sel.mode==='exact'?`<label>גרם שמן <input aria-label="גרם שמן" type="number" min="0" step="0.1" value="${sel.grams||0}" onchange="${handler}('exact',this.value)"></label>`:''}<small class="muted">${g?`תוספת: ${fmt(g)} ג׳ שמן · ${fmt(g*9)} קל׳ · ${fmt(g)} ג׳ שומן. `:''}מעט / רגיל / הרבה הם אומדן של 1 / 3 / 7 ג׳ לכל 100 ג׳ מזון אכיל. הערכים המקוריים נשמרים; אם השמן כבר כלול, בחר ״כבר כלול״.${!mass?' לכמות ללא משקל ידוע, בחר ״כמות ידועה״.':''}</small></div>`;
}
function foodMass(){
  const f=state.selectedFood,amount=Number($('foodAmount').value)||0,u=$('foodUnit').value;
  if(u==='גרם'||u==='מ״ל'){const s=state.foodBone;return s&&!state.choiceBone&&!state.savingEdibleFood?boneEdible(s,amount):amount}
  const g=Number(state.foodGramsPerUnit)||(f?foodUnitGrams(f,u):0);return g>0?amount*g:0;
}
function foodOilGrams(){return FP2Nutrition.oilGrams(state.foodOil,foodMass())}
function setFoodOil(mode,grams){state.foodOil={mode,grams:Number(grams)||0};renderFoodOil();updateFoodChoiceTotals()}
function renderFoodOil(){
  const quick=$('quickFoodTotals'),form=$('foodForm');if(!form)return;
  const old=$('foodOilControls');if(old)old.remove();
  const target=quick||form.querySelector('button[onclick="saveFood()"]')||form.lastElementChild;
  if(target)target.insertAdjacentHTML(quick?'afterend':'beforebegin',oilControls('foodOilControls',state.foodOil,'setFoodOil',foodMass()));
}
function ingredientMass(x,amount){
  const a=amount==null?Number(x.amount)||0:Number(amount)||0;
  if(x.unit==='גרם'||x.unit==='מ״ל')return a;
  const g=foodUnitGrams({name:x.name,units:x.units||[],unit:x.per&&x.per.unit||x.unit},x.unit);return g>0?a*g:0;
}
function customOilGrams(){return (state.customIngredients||[]).reduce((sum,x)=>sum+FP2Nutrition.oilGrams(x.extraOil||state.mealOil,ingredientMass(x)),0)}
function customPayloadIngredients(){
  const xs=(state.customIngredients||[]).filter(x=>x.name.trim()&&Number(x.amount)>0).map(x=>Object.fromEntries(['name','amount','unit','calories','protein','carbs','fat'].map(k=>[k,x[k]])));
  const g=Math.round(customOilGrams()*10)/10;if(g)xs.push({name:'שמן נוסף',amount:g,unit:'גרם',calories:Math.round(g*90)/10,protein:0,carbs:0,fat:g});return xs;
}
function setMealOil(mode,grams){state.mealOil={mode,grams:Number(grams)||0};state.customIngredients.forEach(x=>delete x.extraOil);renderCustomIngredients()}
function setIngredientOil(i,mode,grams){state.customIngredients[i].extraOil={mode,grams:Number(grams)||0};renderCustomIngredients()}
// An exact whole-meal amount is one amount, not the same amount per ingredient.
const oilSumBase=customOilGrams;
customOilGrams=function(){
  if(state.mealOil&&state.mealOil.mode==='exact')return FP2Nutrition.oilGrams(state.mealOil,0)+(state.customIngredients||[]).reduce((s,x)=>s+FP2Nutrition.oilGrams(x.extraOil,ingredientMass(x)),0);
  return oilSumBase();
};
function predictedOil(p,gid){const g=Number(p.oilGrams);return Number.isFinite(g)&&g>0?tmpEntry({name:'שמן נוסף',amount:g,unit:'גרם',category:p.category,source:'תוספת שמן',groupId:gid,calories:Math.round(g*90)/10,fat:g}):null}
function renderBuilderOil(){
  if(!$('customIngredients'))return;let all=$('mealOilControls');if(all)all.remove();
  $('customIngredients').insertAdjacentHTML('beforebegin',oilControls('mealOilControls',state.mealOil,'setMealOil',(state.customIngredients||[]).reduce((s,x)=>s+ingredientMass(x),0)));
  const rows=document.querySelectorAll('#customIngredients .custom-ingredient');state.customIngredients.forEach((x,i)=>{
    if(!rows[i])return;
    const og=FP2Nutrition.oilGrams(x.extraOil||(state.mealOil&&state.mealOil.mode!=='exact'?state.mealOil:null),ingredientMass(x));
    if(og>0){const kc=fmt((Number(x.calories)||0)+og*9),wide=rows[i].querySelector('.macro-wide'),short=rows[i].querySelector('.macro-short');
      if(wide)wide.textContent=`${kc} קל׳ (כולל ${fmt(og)} ג׳ שמן) · ${fmt(x.protein)} חלבון · ${fmt(x.carbs)} פחמ׳ · ${fmt((Number(x.fat)||0)+og)} שומן`;
      if(short)short.innerHTML=`${kc} קל׳<br>+${fmt(og)} ג׳ שמן`}
    state.openOilRows=state.openOilRows||{};
    rows[i].insertAdjacentHTML('beforeend',`<details class="prep-details"${state.openOilRows[i]?' open':''} ontoggle="state.openOilRows=state.openOilRows||{};state.openOilRows[${i}]=this.open"><summary>שמן למרכיב הזה${x.extraOil?' · בחירה אישית':''}</summary>${oilControls('ingredientOil-'+i,x.extraOil||state.mealOil,`setIngredientOil.bind(null,${i})`,ingredientMass(x))}</details>`);
  });
}
(function(){
  const select=selectFood;selectFood=function(){state.foodOil=null;return select.apply(this,arguments)};
  const manual=manualFoodFromQuery;manualFoodFromQuery=function(){state.foodOil=null;const r=manual.apply(this,arguments);renderFoodOil();return r};
  const update=updateFoodChoice;updateFoodChoice=function(){const r=update.apply(this,arguments);renderFoodOil(true);return r};
  const totals=updateFoodChoiceTotals;updateFoodChoiceTotals=function(){const r=totals.apply(this,arguments),el=$('quickFoodTotals'),g=foodOilGrams();if(el&&g){const f=state.selectedFood,u=$('foodUnit').value,m=portionMacros(f,$('foodAmount').value,u,u==='גרם'||u==='מ״ל'?0:Number(state.foodGramsPerUnit)||foodUnitGrams(f,u));el.textContent=`סה״כ עם השמן: ${fmt(m.calories+g*9)} קל׳ · ${fmt(m.protein)} ג׳ חלבון · ${fmt(m.carbs)} ג׳ פחמימות · ${fmt(m.fat+g)} ג׳ שומן`}return r};
  const open=openCustomMealBuilder;openCustomMealBuilder=function(){state.mealOil=null;state.openOilRows={};const r=open.apply(this,arguments);state.customIngredients.forEach(x=>{const c=boneCutFor(x.name);if(c&&x.unit==='גרם'&&!x.cut){x.cut=c.label;x.cutInfo={...c,weighedSkin:false};x.bone=false;x.skin=c.skinOn;x.weighed=x.amount}});renderCustomIngredients();return r};
  const close=closeCustomMealBuilder;closeCustomMealBuilder=function(){state.mealOil=null;return close.apply(this,arguments)};
  const raw=renderCustomIngredientsRaw;renderCustomIngredientsRaw=function(){const r=raw.apply(this,arguments);renderBuilderOil();return r};
  const customTotals=renderCustomTotals;renderCustomTotals=function(){const r=customTotals.apply(this,arguments),el=$('customTotals'),g=customOilGrams();if(el&&state.customIngredients.length){const xs=customPayloadIngredients(),sum=k=>xs.reduce((s,x)=>s+(Number(x[k])||0),0);el.innerHTML=`סה״כ הארוחה: ${fmt(sum('calories'))} קל׳ · ${fmt(sum('protein'))} ג׳ חלבון<small>${fmt(sum('carbs'))} פחמימות · ${fmt(sum('fat'))} שומן${g?` · כולל ${fmt(g)} ג׳ שמן נוסף`:''}</small>`}return r};
  // Both +/- and a typed quantity go through the same bone calculation.
  adjustIngredient=function(i,dir,mult){const x=state.customIngredients[i];if(!x)return;const base=x.unit==='גרם'||x.unit==='מ״ל'?1:.5,current=x.cut?x.weighed:x.amount;scaleCustomIngredient(i,Math.max(0,Math.round((Number(current)+dir*base*mult)*10)/10))};
  const change=changeCustomUnit;changeCustomUnit=function(i,u){const x=state.customIngredients[i];if(x.cut&&u!=='גרם'){delete x.cut;delete x.cutInfo;delete x.weighed;delete x.bone;delete x.skin}return change.apply(this,arguments)};
  const choose=chooseCustomIngredient;chooseCustomIngredient=function(){const before=state.customIngredients.length,r=choose.apply(this,arguments);if(state.customIngredients.length>before){const x=state.customIngredients.at(-1);if(!x.cut){if(!x.per&&x.amount>0)x.per={baseQty:x.amount,unit:x.unit,calories:x.calories,protein:x.protein,carbs:x.carbs,fat:x.fat};boneInit(x);if(x.per)recalcCustomIngredient(x);renderCustomIngredients()}}return r};
})();
// Cards provide a whole-meal choice plus per-ingredient overrides.
function mealOilState(i){state.savedMealOil=state.savedMealOil||{};const meal=state.data.meals[state.category][i],key=state.category+':'+(meal.id||meal.key||i);return state.savedMealOil[key]||(state.savedMealOil[key]={all:null,items:{}})}
function setSavedMealOil(i,j,mode,grams){const s=mealOilState(i),v={mode,grams:Number(grams)||0};if(j<0){s.all=v;s.items={}}else s.items[j]=v;renderSavedMealOil(i);updateMealPreview(i)}
function mealOilGrams(i){const meal=state.data.meals[state.category][i],s=mealOilState(i);let g=s.all&&s.all.mode==='exact'?FP2Nutrition.oilGrams(s.all,0):0;meal.ingredients.forEach((x,j)=>{const sel=s.items[j]||(s.all&&s.all.mode!=='exact'?s.all:null);g+=FP2Nutrition.oilGrams(sel,ingredientMass(x,Number($(`meal-${i}-${j}`).value)))});return Math.round(g*10)/10}
function renderSavedMealOil(i){
  const meal=state.data.meals[state.category][i],body=$('meal-'+i),s=mealOilState(i);if(!body)return;
  body.querySelectorAll('.saved-prep').forEach(el=>el.remove());const button=body.querySelector('button[onclick="addMeal('+i+')"]');if(!button)return;
  button.insertAdjacentHTML('beforebegin',`<div class="saved-prep">${oilControls('savedOil-'+i,s.all,`setSavedMealOil.bind(null,${i},-1)`,meal.ingredients.reduce((n,x,j)=>n+ingredientMass(x,Number($(`meal-${i}-${j}`).value)),0))}<details${(state.savedOilOpen||{})[i]?' open':''} ontoggle="state.savedOilOpen=state.savedOilOpen||{};state.savedOilOpen[${i}]=this.open"><summary>שמן לכל מרכיב בנפרד</summary>${meal.ingredients.map((x,j)=>`<div><b>${esc(x.name)}</b>${oilControls('savedOil-'+i+'-'+j,s.items[j]||s.all,`setSavedMealOil.bind(null,${i},${j})`,ingredientMass(x,Number($(`meal-${i}-${j}`).value)))}</div>`).join('')}</details><button type="button" class="btn light full" onclick="openCustomMealBuilder('${esc(meal.isCustom?meal.id:meal.key)}')">עריכת מרכיבים, עור ועצמות</button></div>`);
}
(function(){
  const render=renderMeals;renderMeals=function(){const r=render.apply(this,arguments);((state.data.meals||{})[state.category]||[]).forEach((m,i)=>{renderSavedMealOil(i);updateMealPreview(i)});return r};
  const preview=updateMealPreview;updateMealPreview=function(i){const r=preview.apply(this,arguments),meal=state.data.meals[state.category][i],el=$('meal-total-'+i);if(!meal||!el)return r;const t=mealPreviewValues(meal,meal.ingredients.map((x,j)=>$(`meal-${i}-${j}`).value)).total,g=mealOilGrams(i);if(g)el.innerHTML=`${fmt(t.calories+g*9)} קל׳ · ${t.protein} חלבון<div class="source">${t.carbs} פחמ׳ · ${fmt(t.fat+g)} שומן · כולל ${g} ג׳ שמן נוסף</div>`;return r};
})();
// Show the assumptions whenever skin/bone changes food weight.
(function(){
  const line=boneLine;boneLine=function(w,e,k,p,k100,p100,skin,onSkin,bone,onBone){
    let obj=state.choiceBone||state.foodBone;
    const ing=String(onBone||'').match(/ingBone\.bind\(null,(\d+)\)/),dish=String(onBone||'').match(/dishBone\.bind\(null,(\d+)\)/);
    if(ing)obj=state.customIngredients[Number(ing[1])];if(dish)obj=state.dishEstimate.items[Number(dish[1])];
    const c=obj&&(obj.cutInfo||boneCutFor(obj.name||obj.label));if(c&&!c.skin)onSkin='';
    const v=obj&&state.cutVariants&&state.cutVariants[obj.name||obj.label];
    return line(w,e,k,p,k100,p100,skin,onSkin,bone,onBone)+`<small class="muted prep-assumption">הפחתת עצם${c&&c.skin?' ועור':''} היא אומדן לפי הנתח. משקל אכיל שנשקל אחרי ההסרה מדויק יותר.${onSkin&&(!v||!v.verified)?' אין במאגר זוג ערכים תואם עם ובלי עור; נשמרו ערכי המקור. אפשר לתקן אותם לפי האריזה.':''}</small>`;
  };
  // Rebuild metadata when a manually entered name becomes a meat/fish name.
  const edit=updateCustomIngredient;updateCustomIngredient=function(i,k,v){const r=edit.apply(this,arguments);if(k==='name'){const x=state.customIngredients[i],c=boneCutFor(x.name);if(c&&x.unit==='גרם'){x.cut=c.label;x.cutInfo=c;x.bone=false;x.skin=c.skinOn;x.weighed=x.amount}else{delete x.cut;delete x.cutInfo}}return r};
})();
function watchConnection(){return window.FP2&&window.FP2.oldConfig?window.FP2.oldConfig():apiConf()}
function copyWatchField(field){const c=watchConnection();if(c)copyText(c[field])}
function watchPayload(){const c=watchConnection();return c?JSON.stringify({token:c.pass,fn:'saveHealthData',data:{sleep_h:7.5,source:'shortcut'}},null,2):''}
function copyWatchPayload(){copyText(watchPayload());toast('הועתקה דוגמה. החלף 7.5 במשתנה שעות השינה לפני שימוש')}
async function refreshWatchData(){const b=$('watchRefresh');if(b)b.disabled=true;try{if(window.FP2&&window.FP2.refreshHealth)await window.FP2.refreshHealth();else{const d=await call('getBootstrapData',state.date);state.data.health=d.health}renderHealthSetup();renderDay();toast('נתוני השעון עודכנו')}catch(e){toast(e.message,true)}finally{if(b)b.disabled=false}}
renderHealthSetup=function(){
  const el=$('healthSetup');if(!el)return;const c=watchConnection(),last=[...healthList()].reverse().find(x=>/shortcut/.test(x.source||''));
  el.innerHTML=`<p>החיבור עובד בשלושה שלבים: Garmin Connect ← השעון, Apple Health ← Garmin Connect, ו־FitPro ← קיצור דרך באייפון.</p>
  <p class="muted">מתחילים משינה בלבד. דופק רגיל אינו דופק מנוחה; מוסיפים דופק מנוחה רק אם יש ב־Apple Health מדידה מתאימה. Body Battery ו־HRV אינם חלק מהחיבור הזה.</p>
  ${c?`<div class="field"><label>כתובת שרת השעון</label><div class="copy-row"><input readonly dir="ltr" value="${esc(c.url)}"><button class="btn light mini" onclick="copyWatchField('url')">העתק</button></div></div><div class="field"><label>קוד אישי</label><div class="copy-row"><input readonly type="password" value="${esc(c.pass)}"><button class="btn light mini" onclick="copyWatchField('pass')">העתק</button></div></div>`:'<p>לפני בניית הקיצור, חבר את שרת Google Apps Script ב״חשבון וענן״. Firebase שומר את הנתונים, אך אינו קורא ישירות את Apple Health.</p>'}
  <details class="subtle" open><summary><b>1. העברת השינה מהשעון לאייפון</b></summary><ol class="steps"><li>סנכרן את השעון ב־Garmin Connect.</li><li>ב־Garmin Connect: עוד → הגדרות → אפליקציות מחוברות → Apple Health. אפשר שיתוף שינה. אם נתיב זה שונה, פתח ב־Apple Health את הפרופיל → אפליקציות → Connect והרשה כתיבת שינה.</li><li>פתח בריאות → עיון → שינה → הצג את כל הנתונים. בדוק שיש רשומות עדכניות שמקורן Garmin Connect. עד שהן מופיעות כאן, אין טעם לבנות אוטומציה.</li></ol></details>
  <details class="subtle"><summary><b>2. בניית ״FitPro בוקר״ בקיצורים</b></summary><ol class="steps"><li>פתח ״קיצורים״ → ＋ → קיצור חדש בשם ״FitPro בוקר״.</li><li>הוסף ״מצא דגימות בריאות״ (Find Health Samples): סוג ״ניתוח שינה״ (Sleep Analysis), תאריך התחלה ב־18 השעות האחרונות, מקור Garmin Connect / Connect בלבד. שמור את הרשימה כמשתנה ״דגימות שינה״. בחר את שלבי השינה בלבד: ישן, שינה בסיסית, עמוקה ו־REM; אל תסכם גם ״במיטה״ או ״ער״. אם יש אצלך גם רשומת ״ישן״ כללית וגם שלבים חופפים, השתמש רק באחד משני הסוגים.</li><li>הוסף ״ספירה״ (Count) של המשתנה ״דגימות שינה״. אם התוצאה 0, הצג הודעה ״אין עדיין שינה מהשעון״ ועצור את הקיצור — אל תשלח 0.</li><li>הוסף ״חזור על כל פריט״ מתוך המשתנה ״דגימות שינה״. לכל דגימה קבל תאריך התחלה ותאריך סיום באמצעות ״קבל פרטים של דגימות בריאות״. חשב ״זמן בין תאריכים״ בדקות. בסיום הלולאה חשב ״סטטיסטיקה → סכום״ של תוצאות החזרה, ואז ״חשב״: הסכום חלקי 60. קרא למשתנה ״שעות שינה״.</li><li>הוסף ״קבל תוכן של כתובת URL״ (Get Contents of URL). הדבק את כתובת השרת שלמעלה. שיטה POST, גוף בקשה JSON: שדה token מסוג טקסט = הקוד האישי; שדה fn מסוג טקסט = saveHealthData; שדה data מסוג מילון (Dictionary), ובתוכו sleep_h מסוג מספר = המשתנה ״שעות שינה״ ו־source מסוג טקסט = shortcut.</li><li>הוסף ״הצג תוצאה״ לתשובת השרת. הרץ פעם אחת כשהאייפון פתוח ואשר קריאת נתוני בריאות וגישה לכתובת. תשובה מוצלחת מכילה ok: true. בדוק את השעות מול Garmin Connect.</li></ol>${c?'<button class="btn light full" onclick="copyWatchPayload()">העתק דוגמת JSON להגדרות הבקשה</button>':''}<p class="muted">דוגמת JSON מציגה 7.5 שעות להמחשה. בקיצור עצמו יש לבחור משתנה, לא לשלוח ערך קבוע.</p></details>
  <details class="subtle"><summary><b>3. הפעלה בכל בוקר</b></summary><ol class="steps"><li>בקיצורים → אוטומציה → ＋ → שעה ביום. בחר שעה אחרי הסנכרון הרגיל של השעון.</li><li>בחר ״הפעל מיד״ (Run Immediately), ואז את הקיצור ״FitPro בוקר״.</li><li>אם בלילה הבא אין נתון חדש, סנכרן ידנית ב־Garmin Connect, בדוק את Apple Health והרץ שוב את הקיצור.</li></ol></details>
  <details class="subtle"><summary><b>דופק מנוחה — רק אם קיים</b></summary><p>בדוק בריאות → לב → דופק במנוחה. אם יש מדידה עדכנית, הוסף Find Health Samples מסוג Resting Heart Rate ב־24 השעות האחרונות, מיין מהחדש לישן ובחר Limit 1. קבל את Value כערך מספרי והוסף למילון data שדה resting_hr. אם לא נמצאה מדידה, השמט את השדה. אל תחליף אותו בדופק רגיל.</p></details>
  <p class="muted">${last?`✓ התקבל מקיצור ב־${displayDate(last.date)}: ${esc(healthValues(last))}`:'עדיין לא התקבל נתון מקיצור דרך.'}</p>${c?'<button class="btn secondary full" id="watchRefresh" onclick="refreshWatchData()">בדוק עכשיו אם הגיעו נתונים</button>':''}
  <p class="muted"><a href="https://support.garmin.com/en-US/?faq=lK5FPB9iPF5PXFkIpFlFPA" target="_blank" rel="noopener">הנחיות Garmin לשיתוף עם Apple Health</a> · <a href="https://support.apple.com/guide/shortcuts/apdfbdbd7123/ios" target="_blank" rel="noopener">הנחיות Apple לאוטומציות</a></p>`;
  renderWatchToggle();
};
(function(){
  const style=document.createElement('style');style.textContent=`.trash,.delete-action{background:#452A30!important;color:#F0A0A8!important;border:1px solid #9A515C!important;box-shadow:none!important;font-weight:600}.trash:active{background:#483139!important}.plus-fab{width:48px;height:48px;background:#A9BD69!important;color:#19200D!important;box-shadow:0 3px 10px rgba(0,0,0,.2)!important;font-size:26px}.step-btn,.stepper button{box-shadow:none!important;border-color:#59683C!important}.prep-oil{margin:10px 0;padding:10px;border:1px solid var(--line);border-radius:12px;line-height:1.5}.prep-oil .skin-chips{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0}.prep-oil small,.prep-assumption{display:block;font-size:12px;line-height:1.6}.prep-oil input{width:90px;padding:8px;margin:6px;border:1px solid var(--line);border-radius:8px}.prep-details,.bone-line,.prep-assumption{grid-column:1/-1}.prep-details{width:100%;margin:6px 0}.prep-details summary{color:var(--muted);font-size:13px}.saved-prep{margin:12px 0}#healthSetup .steps{padding-right:22px;line-height:1.8}#healthSetup li{margin-bottom:12px}#healthSetup a{color:var(--brand)}`;document.head.appendChild(style);
  // Form fields also work when a food was entered manually.
  ['foodName','foodAmount','foodUnit','foodCalories','foodProtein','foodCarbs','foodFat'].forEach(id=>{const el=$(id);if(el)el.addEventListener('change',()=>{renderFoodBone();renderFoodOil()})});
})();
function preparationObject(kind,i){if(kind==='ingredient')return state.customIngredients[i];if(kind==='dish')return state.dishEstimate&&state.dishEstimate.items[i];return kind==='choice'?state.choiceBone:state.foodBone}
function setWeighedSkin(kind,i,v){const x=preparationObject(kind,i);if(!x||!x.cutInfo)return;x.cutInfo={...x.cutInfo,weighedSkin:v};if(kind==='ingredient'){x.amount=boneEdible(x,x.weighed);if(x.per)recalcCustomIngredient(x);renderCustomIngredients()}else if(kind==='dish'){x.amount=boneEdible(x,x.bw);renderDishEstimate()}else if(kind==='choice'){$('foodAmount').value=boneEdible(x,x.weighed);updateFoodChoiceTotals();renderChoiceBoneLine()}else renderFoodBone()}
(function(){
  const line=boneLine;boneLine=function(){const a=[...arguments];let kind='food',i=0;const cb=String(a[9]||''),ing=cb.match(/ingBone\.bind\(null,(\d+)\)/),dish=cb.match(/dishBone\.bind\(null,(\d+)\)/);if(ing){kind='ingredient';i=Number(ing[1])}else if(dish){kind='dish';i=Number(dish[1])}else if(cb==='choiceBoneSet')kind='choice';const x=preparationObject(kind,i),c=x&&x.cutInfo;
    return line.apply(this,a)+(c&&c.skin?`<div class="skin-chips prep-details"><button type="button" class="chip${c.weighedSkin?' active':''}" onclick="setWeighedSkin('${kind}',${i},true)">המשקל כולל עור</button><button type="button" class="chip${!c.weighedSkin?' active':''}" onclick="setWeighedSkin('${kind}',${i},false)">שקלתי ללא עור</button></div>`:'');
  };
  const open=openCustomMealBuilder;openCustomMealBuilder=function(){const r=open.apply(this,arguments);state.customIngredients.forEach(x=>{if(x.cut&&!x.per&&x.amount>0)x.per={baseQty:x.amount,unit:x.unit,calories:Number(x.calories)||0,protein:Number(x.protein)||0,carbs:Number(x.carbs)||0,fat:Number(x.fat)||0}});return r};
  const boneState=foodBoneState;foodBoneState=function(){if(state.selectedFood)return boneState();const name=$('foodName').value,c=boneCutFor(name);if(!c||$('foodUnit').value!=='גרם')return null;if(!state.foodBone||state.foodBone.name!==name)state.foodBone={name,cutInfo:c,bone:false,skin:c.skinOn};state.foodBone.weighed=Number($('foodAmount').value)||0;return state.foodBone};
  const render=renderFoodOil;renderFoodOil=function(inQuick){const q=$('quickFoodTotals'),sheet=$('foodChoiceSheet');if(!inQuick&&q&&sheet&&sheet.classList.contains('hide')){const old=$('foodOilControls');if(old)old.remove();const form=$('foodForm'),target=form&&(form.querySelector('button[onclick="saveFood()"]')||form.lastElementChild);if(target)target.insertAdjacentHTML('beforebegin',oilControls('foodOilControls',state.foodOil,'setFoodOil',foodMass()));return}return render()};
})();
function setDishOil(i,mode,grams){const xs=state.dishEstimate.items;if(i<0){state.dishEstimate.extraOil={mode,grams:Number(grams)||0};xs.forEach(x=>delete x.extraOil)}else xs[i].extraOil={mode,grams:Number(grams)||0};renderDishEstimate()}
function dishOilGrams(){const r=state.dishEstimate;if(!r)return 0;const all=r.extraOil;let g=all&&all.mode==='exact'?FP2Nutrition.oilGrams(all,0):0;r.items.forEach(x=>{if(/^שמן|^oil\b/i.test(x.label))return;g+=FP2Nutrition.oilGrams(x.extraOil||(all&&all.mode!=='exact'?all:null),x.amount)});return Math.round(g*10)/10}
(function(){
  const totals=dishTotals;dishTotals=function(){const t=totals(),g=dishOilGrams();t.calories=fmt(t.calories+g*9);t.fat=fmt(t.fat+g);return t};
  const render=renderDishEstimate;renderDishEstimate=function(){const r=render.apply(this,arguments),result=state.dishEstimate;if(!result)return r;const el=$('dishPreview'),rows=el.querySelectorAll('.dish-row');result.items.forEach((x,i)=>{if(rows[i]&&!/^שמן|^oil\b/i.test(x.label))rows[i].insertAdjacentHTML('beforeend',oilControls('dishOil-'+i,x.extraOil||result.extraOil,`setDishOil.bind(null,${i})`,x.amount))});const total=el.querySelector('.dish-total');if(total)total.insertAdjacentHTML('beforebegin',oilControls('dishOilAll',result.extraOil,'setDishOil.bind(null,-1)',result.items.filter(x=>!/^שמן|^oil\b/i.test(x.label)).reduce((s,x)=>s+Number(x.amount||0),0)));return r};
  const save=saveDishEstimate;saveDishEstimate=async function(){const r=state.dishEstimate,g=dishOilGrams();if(!r||!g)return save.apply(this,arguments);const oil={label:'שמן נוסף',amount:g,measure:'גרם',choices:[],manual:{calories:900,protein:0,carbs:0,fat:100},manualOverride:true,assumption:'תוספת שמן שנבחרה במפורש',source:'תוספת שמן'};const prev=r.extraOil,extras=r.items.map(x=>x.extraOil);r.extraOil=null;r.items.forEach(x=>delete x.extraOil);r.items.push(oil);try{return await save.apply(this,arguments)}finally{if(state.dishEstimate===r){r.items.pop();r.extraOil=prev;r.items.forEach((x,i)=>x.extraOil=extras[i])}}};
})();
(function(){
  const edit=updateCustomIngredient;updateCustomIngredient=function(i,key,value){const r=edit.apply(this,arguments),x=state.customIngredients[i];if(x.cut&&['calories','protein','carbs','fat'].includes(key)&&x.amount>0)x.per={baseQty:x.amount,unit:x.unit,calories:Number(x.calories)||0,protein:Number(x.protein)||0,carbs:Number(x.carbs)||0,fat:Number(x.fat)||0};return r};
  const change=changeCustomUnit;changeCustomUnit=function(i,unit){const r=change.apply(this,arguments),x=state.customIngredients[i];if(unit==='גרם'&&!x.cut){const c=boneCutFor(x.name);if(c){x.cut=c.label;x.cutInfo={...c,weighedSkin:false};x.weighed=x.amount;x.bone=false;x.skin=c.skinOn;if(!x.per&&x.amount>0)x.per={baseQty:x.amount,unit:x.unit,calories:Number(x.calories)||0,protein:Number(x.protein)||0,carbs:Number(x.carbs)||0,fat:Number(x.fat)||0};renderCustomIngredients()}}return r};
})();

(function(){
  const open=openFoodChoice;openFoodChoice=function(){state.foodOil=null;state.foodBone=null;const r=open.apply(this,arguments);renderFoodOil(true);return r};
  const smart=selectSmartFood;selectSmartFood=function(){state.foodOil=null;state.foodBone=null;state.choiceBone=null;const r=smart.apply(this,arguments);renderFoodOil(true);return r};
  const select=selectFood;selectFood=function(){const r=select.apply(this,arguments);renderFoodOil();return r};
  const box=$('customIngredients');if(box)box.addEventListener('change',e=>{if(e.target&&e.target.matches('input[aria-label="שם מרכיב"]'))renderCustomIngredients()});
})();

/* 2.4.0: current workout first, two equipment buckets, independent notifications. */
function equipmentBucket(value){return /מכונ|machine/i.test(String(value||''))?'מכונה':'משקולות חופשיות'}
function openCurrentWorkoutBuilder(){openWorkoutPlanBuilder();state.workoutBuilderMode='current';$('workoutPlanHeading').textContent='בניית אימון נוכחי';$('planBuilderSave').textContent='התחל את האימון';renderBuilderContext()}
function renderBuilderContext(){
  const current=state.workoutBuilderMode==='current';let box=$('workoutBuilderContext');
  if(!box){box=document.createElement('div');box.id='workoutBuilderContext';$('workoutPlanItems').insertAdjacentElement('beforebegin',box)}
  box.innerHTML=`${current?`<div class="field"><label>תאריך האימון</label><input id="currentBuilderDate" type="date" value="${esc(workoutStartDateValue())}"></div>`:''}<div class="field"><label>ציוד</label><div class="meal-tabs">${[['מכונה','מכונות ומתקנים'],['משקולות חופשיות','משקולות חופשיות']].map(([v,l])=>`<button type="button" class="chip ${equipmentBucket(state.equipment)===v?'active':''}" onclick="setEquipment('${v}',true);renderBuilderContext()">${l}</button>`).join('')}</div></div>`;
}
async function beginCurrentPlan(plan,date){
  if(!plan.items.length)return toast('הוסף לפחות תרגיל אחד',true);
  if((state.activePlan||state.sessionId)&&state.data.workout?.sessions?.some(s=>s.status==='active'&&(s.id===state.sessionId||s.id===state.activePlan?.sessionId))&&!confirm('יש אימון פעיל. להתחיל אימון נוסף? התרגילים שכבר שמרת יישארו ביומן.'))return false;
  loading();try{const r=await call('createWorkoutSession',{date,name:plan.name,type:plan.category});if(date!==state.date){const day=await call('getDayView',date);state.date=date;applyDay(day);renderDate()}state.data.workout=r.workout;state.sessionId=r.id;localStorage.setItem('elaiWorkoutSession',JSON.stringify({id:r.id,name:plan.name,date}));state.activePlan={...plan,id:plan.id||'current:'+r.id,sessionId:r.id,date,ephemeral:true};state.activePlanDone=[];state.activePlanIndex=null;$('sessionName').value=plan.name;cancelWorkoutEdit();persistWorkoutPlanDraft();renderWorkouts(false);if(plan.category!=='אירובי')selectPlanExercise(0);$('activeWorkoutPlan').scrollIntoView({behavior:'smooth'});toast('האימון הנוכחי התחיל');return true}catch(e){toast(e.message,true);return false}finally{loading(false)}
}
(function(){
  const open=openWorkoutPlanBuilder;openWorkoutPlanBuilder=function(i){state.workoutBuilderMode='fixed';const r=open.apply(this,arguments);$('fixedWorkoutSheet').classList.remove('hide');$('workoutPlanHeading').textContent=Number.isInteger(i)?'עריכת אימון':'אימון חדש';$('planBuilderSave').textContent='שמור באימונים שלי';renderBuilderContext();return r};
  const close=closeWorkoutPlanBuilder;closeWorkoutPlanBuilder=function(){const r=close.apply(this,arguments);$('fixedWorkoutSheet').classList.add('hide');return r};
  const save=saveWorkoutPlan;saveWorkoutPlan=async function(){if(state.workoutBuilderMode!=='current')return save.apply(this,arguments);const name=$('workoutPlanName').value.trim(),category=$('workoutPlanCategory').value.trim();if(!name||!state.planItems.length)return toast('תן שם לאימון והוסף תרגיל',true);const catalog=state.data.workout.exercises,items=state.planItems.map(x=>({...x,name:(catalog[x.group]||[]).find(e=>e.id===x.exerciseId)?.name||'תרגיל'}));const date=$('currentBuilderDate').value||state.date;if(await beginCurrentPlan({name,category:category||'כללי',items},date))closeWorkoutPlanBuilder()};
  const start=startWorkoutPlan;startWorkoutPlan=async function(i){const p=planList()[i];if(p)return beginCurrentPlan(p,workoutStartDateValue());return start.apply(this,arguments)};
  const persist=persistWorkoutPlanDraft;persistWorkoutPlanDraft=function(){if(state.activePlan?.ephemeral){try{localStorage.setItem('elaiActiveWorkoutPlan',JSON.stringify({date:state.activePlan.date,planId:state.activePlan.id,sessionId:state.activePlan.sessionId,snapshot:state.activePlan}))}catch(_){}return}return persist.apply(this,arguments)};
  const restore=restoreWorkoutPlanDraft;restoreWorkoutPlanDraft=function(){try{const d=JSON.parse(localStorage.getItem('elaiActiveWorkoutPlan')||'null');if(d?.date===state.date&&d.snapshot?.ephemeral&&state.data.workout.sessions?.some(s=>s.id===d.sessionId&&s.status==='active')){state.activePlan=d.snapshot;state.sessionId=d.sessionId;state.activePlanIndex=null;$('sessionName').value=d.snapshot.name;reconcileWorkoutPlan();return}}catch(_){}return restore.apply(this,arguments)};
  const render=renderWorkouts;renderWorkouts=function(){state.equipment=equipmentBucket(state.equipment);state.libraryMode=state.libraryMode==='machines'?'machines':'free';return render.apply(this,arguments)};
  const finish=finishPlanWorkout;finishPlanWorkout=async function(){const id=state.activePlan?.sessionId;await finish.apply(this,arguments);if(!state.activePlan&&state.sessionId===id){state.sessionId='';localStorage.removeItem('elaiWorkoutSession');renderSessionBanner()}};
  const set=setEquipment;setEquipment=function(v,silent){return set(equipmentBucket(v),silent)};
  const picker=openPlanExercisePicker;openPlanExercisePicker=function(i){picker(i);if(state.pickMode){state.pickMode.all=false;state.pickMode.equipment=equipmentBucket(state.equipment);renderExercisePicker()}};
})();
function notificationDate(now=new Date()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jerusalem',year:'numeric',month:'2-digit',day:'2-digit'}).format(now)}
function weeklyNotice(events,today){const week=weekStartOf(today),end=isoAdd(week,6),items=(events||[]).filter(e=>e.date>=today&&e.date<=end);return {week,items,title:items.length?'האירועים שלך השבוע':'יש לך אירוע השבוע?',body:items.length?items.map(e=>`${e.label} · ${displayDate(e.date)}`).join(' · '):'אירוע, מסעדה או משהו חשוב? אפשר להוסיף ליומן ולתכנן מראש.'}}
function notificationKey(part){return 'fp2:'+((window.FP2&&FP2.userId&&FP2.userId())||'local')+':'+part}
function inAppNotificationsOn(){return state.data?.settings?.notifications_in_app!=='off'}
function dismissWeeklyNotice(week){localStorage.setItem(notificationKey('weekSeen'),week);$('weeklyNoticeSheet')?.classList.add('hide')}
function openWeeklyEvent(week,id){dismissWeeklyNotice(week);if(id)openEventSheet({edit:id});else openEventSheet()}
function showWeeklyNotice(force=false){
  if(!state.data||!inAppNotificationsOn()||document.visibilityState==='hidden')return;
  if(document.querySelector('.overlay:not(.hide)')||$('fp2ov'))return;
  const n=weeklyNotice(bankEvents(),notificationDate());if(!force&&localStorage.getItem(notificationKey('weekSeen'))===n.week)return;
  let el=$('weeklyNoticeSheet');if(!el){el=document.createElement('div');el.id='weeklyNoticeSheet';el.className='overlay hide';document.body.appendChild(el)}
  el.innerHTML=`<div class="sheet"><div class="history-top"><h2>${esc(n.title)}</h2><button class="trash" aria-label="סגור" onclick="dismissWeeklyNotice('${n.week}')">✕</button></div>${n.items.length?`<p>יש אירוע השבוע שהוספת ליומן. אפשר לפתוח אותו ולתכנן את יום האירוע מראש.</p>${n.items.map(e=>`<button class="pick-row" onclick="openWeeklyEvent('${n.week}','${esc(e.id)}')"><b>${esc(e.label)}</b><small>${esc(displayDate(e.date))}</small></button>`).join('')}<p class="muted">שמור על שגרת האכילה והחלבון. תכנן מקום לארוחה באירוע, בלי צום או קיצוץ חד.</p>`:`<p>${esc(n.body)}</p><button class="btn full" onclick="openWeeklyEvent('${n.week}')">＋ הוסף אירוע לשבוע</button>`}<button class="btn light full" style="margin-top:10px" onclick="dismissWeeklyNotice('${n.week}')">${n.items.length?'הבנתי':'לא עכשיו'}</button></div>`;el.classList.remove('hide');
}
async function setInAppNotifications(on){try{const r=await call('saveSettings',{notifications_in_app:on?'on':'off'});state.data.settings=r.settings;if(!on)$('weeklyNoticeSheet')?.classList.add('hide')}catch(e){toast(e.message,true)}renderNotificationSettings()}
async function enablePhonePush(){const b=$('enablePhonePush');if(b)b.disabled=true;try{if(!window.FP2?.enablePush)throw new Error('החשבון עדיין נטען');await FP2.enablePush();toast('התראות לטלפון הופעלו');localStorage.setItem(notificationKey('pushPrompt'),'done');$('pushWelcome')?.remove()}catch(e){toast(e.message==='push-not-configured'?'שירות ההתראות טרם הופעל. ההודעות בתוך האפליקציה זמינות':e.message,true)}finally{if(b)b.disabled=false;renderNotificationSettings()}}
async function testPhonePush(){const b=$('testPhonePush');if(b)b.disabled=true;try{await FP2.sendTestPush();toast('נשלחה התראת בדיקה. היא תגיע תוך כמה שניות')}catch(e){toast(e.message==='push-not-configured'?'שירות ההתראות טרם הופעל':e.message,true)}finally{if(b)b.disabled=false}}
async function disablePhonePush(){try{await FP2.disablePush();toast('התראות לטלפון כבויות במכשיר הזה')}catch(e){toast(e.message,true)}renderNotificationSettings()}
function renderNotificationSettings(){
  const sec=$('settings');if(!sec||!state.data)return;let box=$('notificationSettings');if(!box){box=document.createElement('details');box.id='notificationSettings';box.className='settings-section';const h=sec.querySelector('h2');h.insertAdjacentElement('afterend',box)}
  const enabled=window.FP2?.pushEnabled?.();box.innerHTML=`<summary>🔔 התראות</summary><div class="settings-body"><h3>התראות לטלפון — Push</h3><p class="muted">תזכורת לאירועי השבוע ביום ראשון ב־09:00, גם כשהאפליקציה סגורה. ההגדרה היא למכשיר הזה.</p><button class="btn ${enabled?'light':'secondary'} full" id="enablePhonePush" onclick="${enabled?'disablePhonePush()':'enablePhonePush()'}">${enabled?'בטל התראות לטלפון':'הפעל התראות לטלפון'}</button>${enabled?'<button class="btn secondary full" style="margin-top:8px" id="testPhonePush" onclick="testPhonePush()">שלח לי התראת בדיקה</button>':''}<p class="muted" id="pushStatus">${enabled?'פעיל במכשיר הזה':typeof Notification!=='undefined'&&Notification.permission==='denied'?'ההרשאה חסומה בטלפון. אפשר לשנות אותה בהגדרות ההתראות של FitPro.':'באייפון: הוסף למסך הבית ופתח משם, ואז לחץ להפעלה.'}</p><h3>התראות בתוך האפליקציה</h3><label class="bone-row"><span>הודעה שבועית על אירועים</span><input type="checkbox" ${inAppNotificationsOn()?'checked':''} onchange="setInAppNotifications(this.checked)"></label><p class="muted">בפתיחה הראשונה בשבוע: אירועים קרובים, או שאלה אם תרצה להוסיף אירוע. נפרד מהתראות לטלפון.</p></div>`;
}
function offerPhonePush(){if(!state.data||localStorage.getItem(notificationKey('pushPrompt'))||window.FP2?.pushEnabled?.())return;const t=$('today');if(!t||$('pushWelcome'))return;const el=document.createElement('div');el.id='pushWelcome';el.className='card';el.innerHTML=`<b>🔔 תזכורת לאירועים שלך</b><p class="muted">הפעל התראות לטלפון כדי לקבל תזכורת בתחילת השבוע. אפשר לבטל בהגדרות.</p><button class="btn secondary full" onclick="enablePhonePush()">הפעל התראות לטלפון</button><button class="btn light full" onclick="localStorage.setItem(notificationKey('pushPrompt'),'later');$('pushWelcome').remove()">אחר כך</button>`;t.insertAdjacentElement('afterbegin',el)}
(function(){
  const r=renderSettings;renderSettings=function(){const result=r.apply(this,arguments);renderNotificationSettings();return result};
  const all=renderAll;renderAll=function(){const result=all.apply(this,arguments);offerPhonePush();setTimeout(showWeeklyNotice,600);return result};
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')showWeeklyNotice()});
  // No ambient oil controls above the AI entry buttons.
  renderOilChips();
})();
if('serviceWorker' in navigator)navigator.serviceWorker.addEventListener('message',event=>{if(event.data?.type==='FITPRO_OPEN_WEEKLY'){showView('today');showWeeklyNotice(true)}});

// 2.4.1: plain ingredients share one nutrition baseline, independent of recipes.
const PLAIN_POULTRY=[
  ['פרגית',121,19.66,4.12,179,24.76,8.15,'173627','172388'],
  ['ירך עוף',121,19.66,4.12,179,24.76,8.15,'173627','172388'],
  ['חזה עוף',120,22.5,2.62,165,31.02,3.57,'171077','171477']
].flatMap(([cut,k,p,f,ck,cp,cf,rid,cid])=>[
  {name:cut+' נא — ללא עור וללא עצם · ללא שמן נוסף',calories:k,protein:p,fat:f,sourceId:rid},
  {name:cut+' צלוי — ללא עור וללא עצם · ללא שמן נוסף',calories:ck,protein:cp,fat:cf,sourceId:cid}
].map(x=>({...x,baseQty:100,unit:'גרם',carbs:0,units:[],source:'USDA · חומר גלם בסיסי',plainIngredient:true})));
(function(){
  const search=localFoodSearch;localFoodSearch=function(q,limit=40){
    const r=search.apply(this,arguments),n=String(q||'');
    const cut=/פרגי/.test(n)?'פרגית':/ירך|ירכיים/.test(n)?'ירך עוף':/חזה/.test(n)&&/עוף/.test(n)?'חזה עוף':null;
    if(!cut)return r;
    const raw=/נא|לפני בישול/.test(n),cooked=/מבושל|צלוי|אפוי/.test(n);
    const plain=PLAIN_POULTRY.filter(x=>x.name.startsWith(cut+' ')&&(!raw||x.name.includes(' נא '))&&(!cooked||x.name.includes(' צלוי ')));
    r.results=plain.map(x=>({...x})).concat(r.results||[]).slice(0,limit);return r;
  };
  const card=foodResultCard;foodResultCard=function(x,onTap){const html=card.apply(this,arguments);return x.plainIngredient?html.replace('המזונות שלי',esc(x.source)+' · אפשר להוסיף שמן בנפרד'):html};
})();

// The journal-only action cannot overwrite a saved recipe, even while editing it.
async function saveCustomToJournalOnly(){
  const id=state.editingMealId,key=state.replaceBuiltinKey,checked=$('customSavePermanent').checked;
  state.editingMealId='';state.replaceBuiltinKey='';$('customSavePermanent').checked=false;
  try{return await saveCustomMeal(true,false)}finally{
    if($('customMealBuilder').style.display!=='none'){state.editingMealId=id;state.replaceBuiltinKey=key;$('customSavePermanent').checked=checked}
  }
}

function fitRowMacros(r){const x=state.customIngredients[r.i];return x.per?portionMacros({...x.per,units:x.units,name:x.name},r.amount,r.unit):Object.fromEntries(['calories','protein','carbs','fat'].map(k=>[k,x.amount?Number(x[k]||0)*r.amount/x.amount:0]))}
function updateFitTotals(){
  const s=state.fit?.result;if(!s)return;
  const totals={calories:0,protein:0,carbs:0,fat:0};let oil=state.mealOil?.mode==='exact'?FP2Nutrition.oilGrams(state.mealOil,0):0;
  s.rows.forEach(r=>{const x=state.customIngredients[r.i],m=fitRowMacros(r);Object.keys(totals).forEach(k=>totals[k]+=m[k]);const selection=x.extraOil||(state.mealOil?.mode!=='exact'?state.mealOil:null);oil+=FP2Nutrition.oilGrams(selection,ingredientMass({...x,unit:r.unit},r.amount));const el=$('fitMacro-'+r.i);if(el)el.textContent=`${fmt(m.calories)} קל׳ · ${fmt(m.protein)} חלבון · ${fmt(m.carbs)} פחמ׳ · ${fmt(m.fat)} שומן`});
  totals.calories+=oil*9;totals.fat+=oil;s.kcal=totals.calories;s.protein=totals.protein;s.totals=totals;
  $('fitTotal').textContent=`סה״כ: ${fmt(totals.calories)} קל׳ · ${fmt(totals.protein)} חלבון · ${fmt(totals.carbs)} פחמימות · ${fmt(totals.fat)} שומן${oil?' · כולל שמן נוסף':''}`;
}
function setFitAmount(i,value){
  if(value==='')return;const amount=Number(value);if(!Number.isFinite(amount)||amount<0)return;
  const r=state.fit?.result?.rows.find(r=>r.i===i);if(!r)return;
  (state.fit.prefs[i]||(state.fit.prefs[i]={})).fixed=amount;r.amount=amount;r.fixed=amount;updateFitTotals();
}
previewFit=function(){
  const K=Math.max(0,Number($('fitKcal').value)||0),P=Math.max(0,Number($('fitProtein').value)||0);
  const s=suggestPortions(K,P,state.fit.prefs);state.fit.result=s;
  $('fitPreview').innerHTML=s.rows.map(r=>`<div class="fit-row"><b>${esc(r.name)}</b><div class="field"><label>כמות (${esc(r.unit)}) — אפשר להקליד</label><input aria-label="כמות ${esc(r.name)}" type="number" min="0" step="0.1" inputmode="decimal" value="${r.amount}" oninput="setFitAmount(${r.i},this.value)"></div><div id="fitMacro-${r.i}" class="muted"></div><div class="fit-ctl">${[[.5,'פחות'],[1,'רגיל'],[2,'יותר']].map(([v,l])=>`<button class="chip mini ${r.fixed==null&&r.w===v?'active':''}" onclick="setFitPref(${r.i},'w',${v})">${l}</button>`).join('')}<button class="chip mini" onclick="setFitPref(${r.i},'fixed',null)">חשב אוטומטית</button></div></div>`).join('')+'<p id="fitTotal" style="font-weight:700"></p><p class="muted">כמות שהקלדת נשמרת גם בחישוב הבא. 0 מסיר את המרכיב מהאוכל שיוסף ליומן.</p>';
  updateFitTotals();
};
applyFit=function(){
  const s=state.fit?.result;if(!s)return;
  s.rows.forEach(r=>{const x=state.customIngredients[r.i];if(!x)return;if(x.per){x.unit=r.unit;x.amount=r.amount;recalcCustomIngredient(x)}else{const ratio=x.amount?r.amount/x.amount:0;['calories','protein','carbs','fat'].forEach(k=>x[k]=fmt(Number(x[k]||0)*ratio));x.amount=r.amount}if(x.cut){const factor=boneEdible(x,100)/100;x.weighed=factor?r.amount/factor:r.amount}});
  closeSheet('fitSheet');renderCustomIngredients();toast('הכמויות עודכנו לפי הבחירה שלך');
};

/* 2.4.2: compact portions, workout library separate from the running session. */
previewFit=function(){
  const K=Math.max(0,Number($('fitKcal').value)||0),P=Math.max(0,Number($('fitProtein').value)||0),s=suggestPortions(K,P,state.fit.prefs);state.fit.result=s;
  $('fitPreview').innerHTML=s.rows.map(r=>`<div class="fit-row"><div class="history-top"><span>${esc(r.name)}</span><label class="fit-amount"><input aria-label="כמות ${esc(r.name)}" type="number" min="0" step="0.1" inputmode="decimal" value="${r.amount}" oninput="setFitAmount(${r.i},this.value)"> ${esc(r.unit)}</label></div><div class="fit-ctl">${[[.5,'פחות'],[1,'רגיל'],[2,'יותר']].map(([v,l])=>`<button class="chip mini ${r.fixed==null&&r.w===v?'active':''}" onclick="setFitPref(${r.i},'w',${v})">${l}</button>`).join('')}<button class="chip mini ${r.fixed!=null?'active':''}" onclick="setFitPref(${r.i},'fixed',null)">אוטומטי</button></div><small id="fitMacro-${r.i}" class="muted"></small></div>`).join('')+'<p id="fitTotal" style="font-weight:700"></p>';
  updateFitTotals();
};
(function(){const style=document.createElement('style');style.textContent='.fit-amount{display:flex;align-items:center;gap:5px;white-space:nowrap}.fit-amount input{width:76px!important;padding:5px 7px!important;margin:0!important;font:inherit;color:var(--brand);background:var(--card);border:1px solid var(--line);border-radius:8px}.fit-row{padding:8px!important}.fit-row .fit-ctl{margin:5px 0}.fit-row small{font-size:11px}.sub-tabs{flex-wrap:wrap}#currentWorkoutRunner[hidden]{display:none!important}#currentWorkoutRunner.plan-running #muscleTabs,#currentWorkoutRunner.plan-running #equipmentTabs,#currentWorkoutRunner.plan-running .session-edit-name,#currentWorkoutRunner.plan-running .manual-session-tools{display:none!important}';document.head.appendChild(style)})();
function hiddenWorkoutPlans(){try{const x=JSON.parse(state.data.settings.hidden_workout_plans||'[]');return Array.isArray(x)?x:[]}catch(_){return []}}
visibleLibraryPlans=function(){
  const place=state.libraryPlace||(getProfile()?.place==='home'?'home':'gym'),category=state.planFilter||'',mode=state.libraryMode==='machines'?'machines':'free',hidden=hiddenWorkoutPlans();
  return planList().map((p,i)=>[p,i]).filter(([p])=>!hidden.includes(p.id)&&(category==='personal'?!p.library:p.category===category&&(p.library?p.libraryPlace===place&&p.libraryMode===mode:(!p.trainingPlace||p.trainingPlace===place)&&(!p.trainingMode||p.trainingMode===mode))));
};
function renderCurrentWorkoutView(){
  const active=!!(state.activePlan||state.sessionId||state.editingWorkoutId),runner=$('currentWorkoutRunner');runner.hidden=!active;$('currentWorkoutEmpty').hidden=active;
  runner.classList.toggle('plan-running',!!state.activePlan&&!state.editingWorkoutId);
  const name=$('sessionName')?.closest('.card');if(name)name.classList.add('session-edit-name');
  const freestyle=$('workoutStartType')?.closest('details');if(freestyle)freestyle.classList.add('manual-session-tools');
  const manager=$('exerciseManager')?.closest('details');if(manager)manager.classList.add('manual-session-tools');
  const extra=runner.querySelector('button[onclick="addCustomExercise()"]')?.parentElement;if(extra)extra.classList.add('manual-session-tools');
  const picker=$('exercisePickBtn');if(picker){picker.disabled=!!state.activePlan&&!state.editingWorkoutId;picker.setAttribute('aria-label',state.activePlan?'התרגיל הנבחר מתוך התוכנית':'בחר תרגיל')}
  const plus=runner.querySelector('button[onclick="openNewExerciseSheet()"]');if(plus)plus.hidden=!!state.activePlan&&!state.editingWorkoutId;
  const strength=picker?.closest('.card');if(strength)strength.hidden=!!state.activePlan&&!state.editingWorkoutId&&(state.activePlan.category==='אירובי'||state.activePlanDone.length===state.activePlan.items.length);
  const date=$('libraryStartDate');if(date&&!date.value)date.value=state.date;
}
async function setBuiltinPlanHidden(id,hide){const ids=hiddenWorkoutPlans().filter(x=>x!==id);if(hide)ids.push(id);const r=await call('saveSettings',{hidden_workout_plans:JSON.stringify(ids)});state.data.settings=r.settings;renderWorkoutPlans()}
async function restoreBuiltinPlans(){try{const r=await call('saveSettings',{hidden_workout_plans:'[]'});state.data.settings=r.settings;renderWorkoutPlans();toast('התוכניות המובנות הוחזרו')}catch(e){toast(e.message,true)}}
(function(){
  const remove=removeWorkoutPlan;removeWorkoutPlan=async function(i,skipConfirm){const p=planList()[i];if(!p?.builtin)return remove.apply(this,arguments);if(!skipConfirm&&!confirm('להסיר את התוכנית מהאימונים שלי? האימון הפעיל והיומן יישארו.'))return;try{await setBuiltinPlanHidden(p.id,true);undoToast('התוכנית הוסרה',()=>setBuiltinPlanHidden(p.id,false))}catch(e){toast(e.message,true)}};
  const plans=renderWorkoutPlans;renderWorkoutPlans=function(){const r=plans.apply(this,arguments);const box=$('workoutPlans');box.querySelectorAll('.plan-line').forEach(el=>{const button=el.querySelector('button[onclick^="startWorkoutPlan"]');if(!button)return;const i=Number(button.getAttribute('onclick').match(/\d+/)?.[0]);if(planList()[i]?.builtin&&!el.querySelector('.trash'))el.querySelector('.inline-actions').insertAdjacentHTML('beforeend',`<button class="trash mini" aria-label="הסר תוכנית" onclick="removeWorkoutPlan(${i})">✕</button>`)});if(hiddenWorkoutPlans().length)$('planLibraryInfo').insertAdjacentHTML('beforeend','<button class="btn light mini" onclick="restoreBuiltinPlans()">החזר תוכניות מובנות שהוסרו</button>');renderCurrentWorkoutView();return r};
  const workouts=renderWorkouts;renderWorkouts=function(){const r=workouts.apply(this,arguments);if(state.activePlan&&state.activePlan.category!=='אירובי'&&state.activePlanIndex==null&&!state.editingWorkoutId){const next=state.activePlan.items.findIndex((_,i)=>!state.activePlanDone.includes(i));if(next>=0)selectPlanExercise(next)}renderCurrentWorkoutView();return r};
  const select=selectPlanExercise;selectPlanExercise=function(i){const r=select.apply(this,arguments),x=state.activePlan?.items[i];if(x&&x.group!=='אירובי'){state.setCount=Math.max(1,Math.min(10,Number(x.sets)||1));renderSetRows(false);if(x.reps)document.querySelectorAll('.set-reps').forEach(input=>input.value=x.reps)}return r};
  const start=startWorkoutPlan;startWorkoutPlan=async function(i){const date=$('libraryStartDate').value||state.date;$('workoutStartDate').value=date;$('workoutStartDate').dataset.touched='1';const r=await start.apply(this,arguments);if(r){showView('workouts');renderCurrentWorkoutView()}return r};
  const begin=beginCurrentPlan;beginCurrentPlan=async function(){const r=await begin.apply(this,arguments);if(r){showView('workouts');renderCurrentWorkoutView()}return r};
  const open=openWorkoutPlanBuilder;openWorkoutPlanBuilder=function(i){const p=Number.isInteger(i)?planList()[i]:null;state.workoutBuilderPlace=p?.trainingPlace||p?.libraryPlace||state.libraryPlace||'gym';state.equipment=(p?.trainingMode||p?.libraryMode||state.libraryMode)==='machines'?'מכונה':'משקולות חופשיות';const r=open.apply(this,arguments);return r};
  const context=renderBuilderContext;renderBuilderContext=function(){const r=context.apply(this,arguments);if(state.workoutBuilderMode==='fixed')$('workoutBuilderContext').insertAdjacentHTML('afterbegin',`<div class="field"><label>מקום האימון</label><div class="meal-tabs">${[['gym','חדר כושר'],['home','בית']].map(([v,l])=>`<button type="button" class="chip ${(state.workoutBuilderPlace||'gym')===v?'active':''}" onclick="state.workoutBuilderPlace='${v}';renderBuilderContext()">${l}</button>`).join('')}</div></div>`);return r};
  const save=saveWorkoutPlan;saveWorkoutPlan=async function(){const fixed=state.workoutBuilderMode==='fixed';if(fixed&&state.planItems.length)state.planItems[0].planContext={place:state.workoutBuilderPlace||'gym',mode:equipmentBucket(state.equipment)==='מכונה'?'machines':'free'};const r=await save.apply(this,arguments);if(fixed&&$('fixedWorkoutSheet').classList.contains('hide')){state.planFilter='personal';showView('workoutLibrary')}return r};
})();

// Nutrition pairs: matching cut and cooking state; no arbitrary skin percentage.
const POULTRY_SKIN_REFERENCE={
  thigh:{raw:{noSkin:{calories:121,protein:19.66,carbs:0,fat:4.12},skin:{calories:221,protein:16.52,carbs:.25,fat:16.61}},roasted:{noSkin:{calories:179,protein:24.76,carbs:0,fat:8.15},skin:{calories:232,protein:23.26,carbs:0,fat:14.71}}},
  breast:{raw:{noSkin:{calories:120,protein:22.5,carbs:0,fat:2.62},skin:{calories:172,protein:20.85,carbs:0,fat:9.25}},roasted:{noSkin:{calories:165,protein:31.02,carbs:0,fat:3.57},skin:{calories:197,protein:29.8,carbs:0,fat:7.78}}}
};
function poultryReferenceCut(name){const n=String(name||'');if(/הודו|turkey|ברווז|duck|רוטב|מרינדה|מטוגן|fried/i.test(n))return null;return /פרגי|ירך|ירכיים|thigh/i.test(n)?'thigh':/חזה.*עוף|עוף.*חזה|chicken.*breast|breast.*chicken/i.test(n)?'breast':null}
function skinCookingState(name){return /(^|[^א-ת])נא(?=$|[^א-ת])|לפני בישול|\braw\b/i.test(name)?'raw':/צלוי|אפוי|roasted|baked/i.test(name)?'roasted':''}
(function(){
  const ensure=ensureVariants;ensureVariants=function(name,vals,prep){
    ensure(name,vals);
    if(vals&&!state.cutVariants[name]?.verified){
      const norm=f=>Object.fromEntries(['calories','protein','carbs','fat'].map(k=>[k,Number(f[k]||0)*100/(Number(f.baseQty)||100)])),clean=s=>String(s).toLowerCase().replace(/\s+/g,' ').trim(),n=String(vals.name||name);
      const pool=[...(tz.ready?tz.foods:[]),...(state.data?.myFoods||[]),...(state.localResults||[]),...(state.customSearchResults||[]),...(state.dishEstimate?.items||[]).flatMap(x=>x.choices||[])];
      for(const [a,b] of [['נאכל עם עור','נאכל ללא עור'],['בשר ועור','בשר בלבד'],['כולל עור','ללא עור'],['with skin','without skin'],['meat and skin','meat only'],['skin-on','skinless']]){
        const skin=clean(n).includes(a),without=clean(n).includes(b);if(!skin&&!without)continue;const target=clean(n).replace(skin?a:b,skin?b:a),twin=pool.find(f=>clean(f.name)===target);if(!twin)continue;
        const me=norm(vals),other=norm(twin);state.cutVariants[name]={skin:skin?me:other,noSkin:skin?other:me,verified:true,source:twin.source||'מאגר · זוג ערכים תואם'};break;
      }
    }
    const cut=poultryReferenceCut(name),cooking=prep||skinCookingState(name),pair=cut&&POULTRY_SKIN_REFERENCE[cut][cooking];
    if(pair&&(prep||!state.cutVariants[name]?.verified))state.cutVariants[name]={...pair,verified:true,source:'USDA · '+(cooking==='raw'?'נא':'צלוי'),preparation:cooking};
  };
})();
function skinObject(kind,i){return preparationObject(kind,i)}
function skinObjectName(kind,i){const x=skinObject(kind,i);return x?.nutritionName||(kind==='food'?$('foodName').value:kind==='choice'?state.selectedFood?.name:x?.name||x?.label||'')}
function skinPairFor(kind,i){const x=skinObject(kind,i),name=skinObjectName(kind,i);if(!x)return null;const vals=x.per||state.selectedFood||x.manual||x.choices?.[x.choice||0]||x;ensureVariants(name,vals,x.skinPreparation);const v=state.cutVariants[name];return v?.verified&&['calories','protein','carbs','fat'].some(k=>Math.abs(v.skin[k]-v.noSkin[k])>.01)?v:null}
function setSkinPreparation(kind,i,prep){const x=skinObject(kind,i);if(!x)return;x.skinPreparation=prep;changeNutritionSkin(kind,i,x.skin===true)}
function skinAdjustedName(name,on,prep){const plain=String(name).replace(/(?:נאכל\s+)?(?:ללא|בלי|עם(?: ה)?)\s*עור|בשר ועור|בשר בלבד/g,'').replace(/—\s*ו?ללא עצם/,'— ללא עצם').replace(/\s*·\s*$/,'').replace(/\s{2,}/g,' ').trim();return plain+(prep&&!skinCookingState(plain)?' · '+(prep==='raw'?'נא':'צלוי'):'')+' · '+(on?'עם עור':'ללא עור')}
function changeNutritionSkin(kind,i,on){
  const x=skinObject(kind,i),pair=skinPairFor(kind,i);if(!x||!pair)return toast('אין זוג ערכים תואם. בחר צורת הכנה או תקן את הערכים לפי המזון.',true);
  const values=pair[on?'skin':'noSkin'];x.nutritionName=skinObjectName(kind,i);x.skin=on;const name=skinAdjustedName(x.nutritionName,on,pair.preparation);state.cutVariants[name]=pair;
  if(kind==='ingredient')x.name=name;else if(kind==='dish')x.label=name;else{x.name=name;$('foodName').value=name;if(state.selectedFood){state.selectedFood.name=name;state.selectedFood.sourceId='';state.selectedFood.source=pair.source||'מאגר · בחירת עור'}}
  if(kind==='ingredient'){if(!x.per){const b=Number(x.amount)||100;x.per={baseQty:b,unit:x.unit,calories:x.calories,protein:x.protein,carbs:x.carbs,fat:x.fat}}const scale=(Number(x.per.baseQty)||100)/100;Object.keys(values).forEach(k=>x.per[k]=values[k]*scale);x.amount=boneEdible(x,x.weighed);recalcCustomIngredient(x);renderCustomIngredients()}
  else if(kind==='dish'){x.manual={...values};x.manualOverride=true;x.source=pair.source||'מאגר · בחירת עור';x.amount=boneEdible(x,x.bw);renderDishEstimate()}
  else if(kind==='choice'){setChoiceValues(values);$('foodAmount').value=boneEdible(x,x.weighed);updateFoodChoice();renderFoodOil(true)}
  else{const scale=(Number($('foodBase').value)||100)/100;Object.keys(values).forEach(k=>{const v=values[k]*scale;$('food'+k[0].toUpperCase()+k.slice(1)).value=v;if(state.selectedFood)state.selectedFood[k]=v});renderFoodBone();renderFoodOil()}
}
ingSkin=(i,v)=>changeNutritionSkin('ingredient',i,v);
dishSkin=(i,v)=>changeNutritionSkin('dish',i,v);
choiceSkin=v=>changeNutritionSkin('choice',0,v);
foodSkin=v=>changeNutritionSkin('food',0,v);
boneLine=function(w,e,k,p,k100,p100,skin,onSkin,bone,onBone){
  let kind='food',i=0;const ing=String(onBone).match(/ingBone\.bind\(null,(\d+)\)/),dish=String(onBone).match(/dishBone\.bind\(null,(\d+)\)/);if(ing){kind='ingredient';i=Number(ing[1])}else if(dish){kind='dish';i=Number(dish[1])}else if(onBone==='choiceBoneSet')kind='choice';
  const x=skinObject(kind,i),c=x?.cutInfo,pair=skinPairFor(kind,i),name=skinObjectName(kind,i),cut=poultryReferenceCut(name),prep=x?.skinPreparation||skinCookingState(name),hasSkin=!!c?.skin;
  return `<div class="bone-line"><div class="skin-chips"><button type="button" class="chip${bone?' active':''}" onclick="${onBone}(true)">המשקל כולל עצם</button><button type="button" class="chip${!bone?' active':''}" onclick="${onBone}(false)">המשקל ללא עצם</button></div>${cut&&hasSkin?`<label class="muted">צורת הכנה לערכי העור <select aria-label="צורת הכנה לערכי העור" onchange="setSkinPreparation('${kind}',${i},this.value)"><option value="" ${!prep?'selected':''}>בחר נא או צלוי</option><option value="raw" ${prep==='raw'?'selected':''}>נא</option><option value="roasted" ${prep==='roasted'?'selected':''}>צלוי / אפוי ללא שמן נוסף</option></select></label>`:''}${hasSkin&&onSkin?`<div class="skin-chips"><button type="button" class="chip${skin?' active':''}" ${!pair?'disabled':''} onclick="${onSkin}(true)">נאכל עם עור</button><button type="button" class="chip${!skin?' active':''}" ${!pair?'disabled':''} onclick="${onSkin}(false)">נאכל בלי עור</button></div>`:''}<div>שקלת <b>${fmt(w)} ג׳</b> · משקל אכיל <b>${fmt(e)} ג׳</b></div><small class="muted">${fmt(k)} קל׳ · ${fmt(p)} חלבון${k100!=null?` · ל־100 ג׳: ${fmt(k100)} קל׳, ${fmt(p100)} חלבון`:''}</small>${hasSkin?`<div class="skin-chips"><button type="button" class="chip${c.weighedSkin?' active':''}" onclick="setWeighedSkin('${kind}',${i},true)">המשקל כולל עור</button><button type="button" class="chip${!c.weighedSkin?' active':''}" onclick="setWeighedSkin('${kind}',${i},false)">שקלתי ללא עור</button></div>`:''}<small class="muted prep-assumption">הפחתת עצם ועור מהמשקל היא אומדן. ${hasSkin&&!pair?'אין כרגע זוג ערכים תואם עם ובלי עור; הכפתורים מושבתים. '+(cut?'בחר צורת הכנה כדי להשתמש בערכי הבסיס, והוסף שמן בנפרד.':'אפשר לתקן ערכים לפי תווית או מקור מתאים.'):'בחירת עור משנה את ערכי המזון; בחירת עצם משנה רק את המשקל האכיל.'}${pair?.source?' מקור: '+esc(pair.source):''}</small></div>`;
};

/* 2.5.0: the training home screen, and "my workouts" opens on the user's own workouts. */
(function(){
  const plans=renderWorkoutPlans;renderWorkoutPlans=function(){if(state.planFilter==null)state.planFilter=(state.data?.workout?.plans||[]).length?'personal':'';return plans.apply(this,arguments)};
  const render=renderWorkouts;renderWorkouts=function(){const r=render.apply(this,arguments);try{renderWorkoutHome()}catch(e){console.error(e)}return r};
})();

/* ---------- Calendar link: one calendar (iCloud / Google / Outlook) feeds the events list ---------- */
let calBusy=false,calStarted=false;
function calStatusText(){
  const url=window.FP2?.getProp?.('CAL_URL');if(!url)return 'לא מחובר.';
  const last=Number(window.FP2.getProp('CAL_LAST'))||0,n=Object.keys(JSON.parse(window.FP2.getProp('CAL_MAP')||'{}')).length;
  return `מחובר · ${n} אירועים מהיומן${last?' · סונכרן '+new Date(last).toLocaleString('he-IL',{day:'numeric',month:'numeric',hour:'2-digit',minute:'2-digit'}):''}`;
}
function renderCalendarSettings(){
  const sec=$('settings');if(!sec||!state.data||!window.FP2?.getProp)return;
  let box=$('calendarSettings');if(!box){box=document.createElement('details');box.id='calendarSettings';box.className='settings-section';const n=$('notificationSettings');(n||sec.querySelector('h2')).insertAdjacentElement('afterend',box)}
  const keepOpen=box.open,url=window.FP2.getProp('CAL_URL');
  box.innerHTML=`<summary>📅 חיבור יומן</summary><div class="settings-body"><p class="muted">האירועים מיומן אחד שתבחר יתווספו לאפליקציה בעצמם, בלי להקליד אותם פעמיים. מומלץ ליצור יומן נפרד (למשל ״FitPro״) ולשים בו רק אירועי אוכל: מסעדות וארוחות משפחתיות.</p><p class="muted" id="calStatus">${esc(calStatusText())}</p><div class="field"><label>קישור ליומן</label><input id="calUrlInput" type="url" inputmode="url" placeholder="webcal://… או https://…" value="${esc(url)}"></div><button class="btn full" id="calConnect">${url?'עדכן קישור וסנכרן':'חבר יומן'}</button>${url?'<button class="btn light full" style="margin-top:8px" id="calSync">סנכרן עכשיו</button><button class="btn light full" style="margin-top:8px" id="calDisconnect">נתק את היומן</button>':''}<details style="margin-top:10px"><summary class="muted">איך מקבלים קישור?</summary><p class="muted"><b>iPhone (iCloud):</b> ביומן ← יומנים ← לחץ ⓘ ליד היומן ← הפעל ״יומן ציבורי״ ← ״שתף קישור״ ← העתק. היומן חייב להיות ב-iCloud, לא ״באייפון שלי״.</p><p class="muted"><b>Google / Galaxy:</b> ב-Google Calendar מהמחשב (או בדפדפן במצב ״אתר למחשב״): ⚙ הגדרות ← בחר את היומן ← ״כתובת סודית בפורמט iCal״ ← העתק.</p><p class="muted"><b>Outlook:</b> הגדרות ← יומן ← יומנים משותפים ← פרסום יומן ← קישור ICS.</p><p class="muted">אירוע שנמחק מהיומן יוסר גם מהאפליקציה. אירוע חוזר פשוט (יומי, שבועי, חודשי, שנתי) נתמך. בכל תאריך אפשר אירוע אחד.</p></details></div>`;
  box.open=keepOpen;
  $('calConnect').onclick=connectCalendar;if($('calSync'))$('calSync').onclick=()=>syncCalendar(true);if($('calDisconnect'))$('calDisconnect').onclick=disconnectCalendar;
}
async function connectCalendar(){
  const v=($('calUrlInput').value||'').trim().replace(/^webcal:\/\//i,'https://');
  if(!/^https:\/\/\S+$/.test(v))return toast('הדבק קישור תקין ליומן',true);
  try{
    const old=window.FP2.getProp('CAL_URL');window.FP2.setProp('CAL_URL',v);if(old&&old!==v){window.FP2.setProp('CAL_MAP','')}
    await syncCalendar(true,true);
  }catch(e){toast(e.message,true)}
  renderCalendarSettings();
}
function disconnectCalendar(){
  if(!confirm('לנתק את היומן? אירועים שכבר נוספו יישארו באפליקציה.'))return;
  try{window.FP2.setProp('CAL_URL','');window.FP2.setProp('CAL_MAP','');window.FP2.setProp('CAL_LAST','')}catch(e){return toast(e.message,true)}
  toast('היומן נותק');renderCalendarSettings();
}
async function syncCalendar(manual,fresh){
  if(calBusy||!window.FP2?.getProp||!state.data)return;
  const url=window.FP2.getProp('CAL_URL');if(!url){if(manual)toast('הדבק קישור ליומן',true);return}
  calBusy=true;
  try{
    const res=await window.FP2.calendarFetch(url),fetched=res.events||[];
    let map={};try{map=JSON.parse(window.FP2.getProp('CAL_MAP')||'{}')}catch(_){}
    const bank=(await call('getBootstrapData',state.date)).bank||{events:[]},byId={},taken=new Set();
    (bank.events||[]).forEach(e=>{byId[e.id]=e;taken.add(e.date)});
    let added=0,removed=0,updated=0;const seen={};
    for(const ev of fetched){
      seen[ev.id]=true;const m=map[ev.id],ex=m&&byId[m[0]];
      if(m&&!ex)continue; // the user removed it in the app: leave it removed
      if(ex){if(m[1]!==ev.title){try{await call('saveBankEvent',{id:m[0],date:ex.date,type:ex.type,size:ex.size,method:ex.method==='later'?'half':ex.method,note:ev.title.slice(0,120)});m[1]=ev.title;updated++}catch(_){}}continue}
      if(taken.has(ev.date)||added>=60)continue; // one event per date
      try{const r=await call('saveBankEvent',{date:ev.date,type:'other',size:'medium',method:'half',note:ev.title.slice(0,120)});if(r&&r.savedId){map[ev.id]=[r.savedId,ev.title];taken.add(ev.date);added++}}catch(_){}
    }
    for(const k of Object.keys(map)){
      if(seen[k])continue;const ex=byId[map[k][0]];
      if(ex&&ex.date>=(res.today||'')){try{await call('deleteBankEvent',{id:ex.id});removed++}catch(_){}}
      delete map[k];
    }
    window.FP2.setProp('CAL_MAP',JSON.stringify(map));window.FP2.setProp('CAL_LAST',String(Date.now()));
    if(added||removed||updated){state.data=await call('getBootstrapData',state.date);renderAll()}
    if(manual)toast(added||removed||updated?`היומן סונכרן: ${added} נוספו${removed?`, ${removed} הוסרו`:''}${updated?`, ${updated} עודכנו`:''}`:'היומן מעודכן');
  }catch(e){if(manual)toast(e.message==='push-not-configured'?'שירות הענן עוד לא מוגדר':e.message,true)}
  finally{calBusy=false;const st=$('calStatus');if(st)st.textContent=calStatusText()}
}
(function(){
  const r=renderSettings;renderSettings=function(){const result=r.apply(this,arguments);try{renderCalendarSettings()}catch(e){console.error(e)}return result};
  const all=renderAll;renderAll=function(){const result=all.apply(this,arguments);if(!calStarted&&window.FP2?.getProp?.('CAL_URL')){calStarted=true;setTimeout(()=>syncCalendar(false),2500)}return result};
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&window.FP2?.getProp?.('CAL_URL')){const last=Number(window.FP2.getProp('CAL_LAST'))||0;if(Date.now()-last>20*1000)syncCalendar(false)}});
})();

/* ===== כפתור יומן בכותרת + "הוסף ליומן שלי" באירוע ===== */
function addEventToPhoneCalendar(){
  const ev=state.ev;if(!ev||!ev.date)return toast('בחר תאריך',true);
  const t=(BANK_TYPES_UI.find(x=>x[0]===ev.type)||['','🎉','אירוע']),title=(ev.note||(t[1]+' '+t[2])).replace(/[\r\n]+/g,' ');
  const d=s=>s.replace(/-/g,''),end=isoAdd(ev.date,1);
  const esc2=s=>s.replace(/\\/g,'\\\\').replace(/;/g,'\;').replace(/,/g,'\\,');
  const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//FitPro//HE','BEGIN:VEVENT','UID:fitpro-'+d(ev.date)+'-'+Date.now()+'@fitpro','DTSTAMP:'+new Date().toISOString().replace(/[-:]|\.\d+/g,''),'DTSTART;VALUE=DATE:'+d(ev.date),'DTEND;VALUE=DATE:'+d(end),'SUMMARY:'+esc2(title),'END:VEVENT','END:VCALENDAR'].join('\r\n');
  const blob=new Blob([ics],{type:'text/calendar;charset=utf-8'}),file=new File([blob],'fitpro-event.ics',{type:'text/calendar'});
  (async()=>{
    try{if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title});toast('בחר "יומן" כדי להוסיף את האירוע');return}}catch(e){if(e&&e.name==='AbortError')return}
    try{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='fitpro-event.ics';a.rel='noopener';document.body.appendChild(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(url)},4000);toast('הקובץ ירד. פתח אותו כדי להוסיף ליומן')}
    catch(e){toast('לא הצלחתי להוסיף ליומן. האירוע נשמר באפליקציה',true)}
  })();
}
(function(){
  const oo=openEventSheet;openEventSheet=function(opts){
    const r=oo.apply(this,arguments);
    try{const o=opts||{},e=o.edit?bankEvents().find(x=>x.id===o.edit):null;
      state.ev.note=e?String(e.note||''):'';state.ev.locked=!!(o.date||o.edit);renderEventSheet()}catch(err){console.error(err)}
    return r};
  const oe=eventRow;eventRow=function(e){return oe.call(this,e&&e.note?Object.assign({},e,{label:e.note}):e)};
  const o=renderEventSheet;renderEventSheet=function(){
    const result=o.apply(this,arguments);
    try{const ev=state.ev,body=$('eventBody');if(!ev||!body)return result;
      const fields=[...body.querySelectorAll('.field')];
      if(ev.locked&&ev.date&&fields[0]&&/מתי\?/.test(fields[0].textContent)){
        const d=document.createElement('div');d.className='field';d.innerHTML='<label>📅 '+esc(dayName(ev.date)+' '+displayDate(ev.date))+'</label>';fields[0].replaceWith(d);
        const hint=body.querySelector(':scope > p.muted');if(hint&&/עד חצי שנה/.test(hint.textContent))hint.remove()}
      const typeField=[...body.querySelectorAll('.field')].find(x=>/מה האירוע\?/.test(x.textContent));
      if(typeField&&!body.querySelector('#evName')){
        const f=document.createElement('div');f.className='field';
        f.innerHTML='<label>'+(ev.type==='other'?'איך קוראים לאירוע?':'שם לאירוע (לא חובה)')+'</label><input id="evName" type="text" maxlength="60" placeholder="'+(ev.type==='other'?'למשל: יום הולדת של דנה':'למשל: ארוחת ערב אצל סבתא')+'">';
        f.querySelector('input').value=ev.note||'';f.querySelector('input').oninput=function(){state.ev.note=this.value};
        typeField.before(f)}
      const save=[...body.querySelectorAll('button.btn.full')].find(x=>/שמור|בחר תאריך/.test(x.textContent));
      if(save&&!body.querySelector('#evSaveCal')){
        const ready=ev.date&&ev.type&&!save.disabled;
        save.onclick=function(){saveEventUI(false)};
        const b=document.createElement('button');b.id='evSaveCal';b.type='button';b.className='btn light full';b.style.marginTop='8px';b.textContent='📅 שמור והוסף ליומן שלי';
        if(!ready){b.disabled=true;b.style.opacity='.5'}
        b.onclick=function(){saveEventUI(true)};save.after(b)}}catch(e){console.error(e)}
    return result};
  saveEventUI=async function(addCal){const ev=state.ev;if(!ev||!ev.date||!ev.type)return;
    const note=String(ev.note||'').trim().slice(0,60);
    if(addCal){try{addEventToPhoneCalendar()}catch(e){console.error(e)}}
    if(ev.type==='other'&&!note&&!ev.id&&false)return;
    const r=await bankMutate('saveBankEvent',{id:ev.id||'',date:ev.date,type:ev.type,size:ev.size,method:ev.method,note});if(!r)return;
    const ws=weekStartOf(bankToday());if(state.data.settings&&ev.date>=ws&&ev.date<=isoAdd(ws,6))state.data.settings.bank_week_asked='w:'+ws;closeSheet('eventSheet');renderBankCard();
    const p=r.plan||{};toast(p.mode==='pending'?`האירוע נשמר · תזכורת ב${relDate(remindDate(ev.date))}`:p.mode==='past'?'האירוע נרשם':p.banked?`האירוע נשמר · ${kc(p.banked)} קל׳ בבנק`:'האירוע נשמר · ביום עצמו תקבל תוכנית');};
  function addHeaderBtn(){
    const h=document.querySelector('header');if(!h||h.querySelector('#hdrCal'))return;
    const b=document.createElement('button');b.id='hdrCal';b.type='button';b.setAttribute('aria-label','יומן אירועים');b.innerHTML='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D7F36B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>';b.onclick=()=>openCalendar();h.appendChild(b)}
  const st=document.createElement('style');
  st.textContent='#hdrCal{justify-self:end;width:42px;height:42px;border-radius:14px;border:1px solid var(--line);background:#171C22;font-size:20px;line-height:1;display:grid;place-items:center;padding:0;box-shadow:var(--shadow);color:inherit}#hdrCal:active{transform:scale(.94);background:#2B3A1B}';
  document.head.appendChild(st);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addHeaderBtn);else addHeaderBtn();
})();

/* ===== אייפד: כותרת ברורה ומרווח עליון ===== */
(function(){const st=document.createElement('style');
st.textContent='@media(min-width:700px){.app{padding-top:calc(env(safe-area-inset-top) + 14px)!important}header{position:relative;z-index:35;padding-top:18px!important;padding-bottom:16px!important;align-items:center}.brand h1,#personalTitle{font-size:28px!important;color:#F2F5F7!important;opacity:1!important;-webkit-text-fill-color:#F2F5F7!important;background:none!important;filter:none!important;text-shadow:none!important;letter-spacing:0!important}.brand small{font-size:15px!important;color:#A3ADB8!important}.header-logo{font-size:30px!important}#hdrCal{width:48px;height:48px}.plus-fab{left:max(16px,calc(50% - 380px))!important}}';
document.head.appendChild(st)})();

/* ===== ניהול משתמשים (רק למנהל): רשימה, חסימה ומחיקה. השרת בודק לפי האימייל, ולמנהל אין גישה לנתוני האוכל של אחרים ===== */
(function(){
  const fmtD=iso=>{if(!iso)return '—';try{return new Date(iso).toLocaleDateString('he-IL',{day:'numeric',month:'short',year:'numeric'})}catch(_){return '—'}};
  let busy=false;
  function box(){return document.getElementById('adminUsers')}
  function draw(b,users){
b.innerHTML=`<div class="row" style="justify-content:space-between;align-items:center;margin:14px 0 6px"><b>👥 כל המשתמשים (${users.length})</b><button class="btn light" style="min-height:36px;padding:6px 12px" onclick="adminLoadUsers()">רענן</button></div>`+
      users.map(u=>`<div class="manage-row" style="align-items:flex-start;gap:8px"><span style="flex:1;min-width:0"><b>${esc(u.name||u.email.split('@')[0]||'ללא שם')}</b>${u.me?' <small class="muted">(אתה)</small>':''}${u.disabled?' <small style="color:var(--danger)">· חסום</small>':''}<div class="muted" dir="ltr" style="text-align:right;overflow-wrap:anywhere">${esc(u.email)}</div><div class="muted">נרשם ${fmtD(u.created)} · כניסה אחרונה ${fmtD(u.lastLogin)}</div></span>${u.me?'':`<span style="display:flex;flex-direction:column;gap:6px"><button class="btn light" style="min-height:36px;padding:6px 12px" onclick="adminBlockUser('${u.uid}',${!u.disabled})">${u.disabled?'שחרר':'חסום'}</button><button class="btn light" style="min-height:36px;padding:6px 12px;color:var(--danger)" onclick="adminDeleteUserUI('${u.uid}','${esc(u.name||u.email).replace(/'/g,'')}')">מחק</button></span>`}</div>`).join('')+
      '<p class="muted">חסימה מונעת כניסה (אפשר לשחרר). מחיקה מסירה את המשתמש וכל הנתונים שלו לצמיתות. לא מוצגים כאן נתוני אוכל או אימונים.</p>';
  }
  async function load(){
    const b=box();if(!b||busy||!window.FP2||!FP2.push)return;busy=true;
    let cached=null;try{cached=JSON.parse(localStorage.getItem('fp2AdminUsers')||'null')}catch(_){}
    if(cached&&cached.length){draw(b,cached)}else b.innerHTML='<p class="muted">טוען משתמשים…</p>';
    try{
      const r=await FP2.push('adminListUsers');const users=r.users||[];
      try{localStorage.setItem('fp2AdminUsers',JSON.stringify(users))}catch(_){}
      draw(b,users);
    }catch(e){
      const m=String(e&&e.message||e);
      if(/^Firebase /.test(m))b.innerHTML=`<p class="muted" style="color:var(--danger)">רשימת המשתמשים לא נטענה: ${esc(m)}</p>`;else if(!(cached&&cached.length))b.innerHTML='';
    }finally{busy=false}
    loadReq();loadFoods();
  }
  async function loadFoods(){
    if(!window.FP2||!FP2.push)return;let b=document.getElementById('adminFoodReq');
    if(!b){const a=document.getElementById('adminExReq');if(!a)return;a.insertAdjacentHTML('afterend','<div id="adminFoodReq"></div>');b=document.getElementById('adminFoodReq')}
    try{
      const r=await FP2.push('adminListFoodProposals');const it=r.items||[];window.__foodProps={};it.forEach(x=>window.__foodProps[x.id]=x);
      const mac=f=>`${Math.round(f.calories)} קל׳ · ח ${Math.round(f.protein*10)/10} · פ ${Math.round(f.carbs*10)/10} · ש ${Math.round(f.fat*10)/10} (ל-${f.baseQty} ${esc(f.unit)})`;
      b.innerHTML=`<div style="margin:18px 0 6px"><b>🍽 מזונות לאישור (${it.length})</b></div>`+(it.length?it.map(x=>x.kind==='report'?`<div class="manage-row"><span style="flex:1;min-width:0"><b>⚠ דיווח: ${esc(x.name||x.code)}</b><div class="muted">${esc(x.note||'ללא הערה')}${x.by&&x.by.length?' · '+esc(x.by.join(', ')):''}</div></span><button class="btn secondary" data-i="${esc(x.id)}" onclick="adminFoodAct(this,'del')">הסר מהמאגר</button><button class="btn secondary" data-i="${esc(x.id)}" onclick="adminFoodAct(this,'skip')">התעלם</button></div>`:`<div class="manage-row"><span style="flex:1;min-width:0"><b>${esc(x.food.name)}</b>${x.count>1?` <small class="muted">· ${x.count} משתמשים</small>`:''}<div class="muted">${mac(x.food)}${x.by&&x.by.length?' · '+esc(x.by.join(', ')):''}</div></span><button class="btn" data-i="${esc(x.id)}" onclick="adminFoodAct(this,'share')">שתף עם כולם</button><button class="btn secondary" data-i="${esc(x.id)}" onclick="adminFoodAct(this,'skip')">השאר פרטי</button></div>`).join(''):'<p class="muted">אין מזונות שממתינים.</p>');
    }catch(e){b.innerHTML=''}
  }
  window.adminFoodAct=async function(btn,act){
    const x=(window.__foodProps||{})[btn.dataset.i];if(!x)return;btn.disabled=true;
    try{
      if(act==='share')await FP2.sharedPut(x.id,x.food);
      if(act==='del')await FP2.sharedDel(x.code);
      await FP2.push('adminResolveFoodProposal',{id:x.id});toast(act==='share'?'שותף עם כולם':act==='del'?'הוסר מהמאגר':'נסגר');loadFoods();
    }catch(e){btn.disabled=false;toast(e.message||'שגיאה',true)}
  };
  async function loadReq(){
    const b=document.getElementById('adminExReq');if(!b||!window.FP2||!FP2.push)return;
    try{
      const r=await FP2.push('adminListExerciseRequests');const it=r.items||[];
      b.innerHTML=`<div style="margin:18px 0 6px"><b>🏋 תרגילים שהמשתמשים הוסיפו (${it.length})</b></div>`+(it.length?it.map(x=>`<div class="manage-row"><span style="flex:1;min-width:0"><b>${esc(x.name)}</b>${x.count>1?` <small class="muted">· ${x.count} משתמשים</small>`:''}<div class="muted">${esc([x.group,x.equipment].filter(Boolean).join(' · '))}${x.by&&x.by.length?' · '+esc(x.by.join(', ')):''}</div></span><button class="btn light" style="min-height:36px;padding:6px 12px" onclick="adminResolveEx(this)" data-n="${esc(x.name)}">בוצע</button></div>`).join('')+'<p class="muted">אלה תרגילים שאין להם עדיין אנימציה. אחרי שתוסיף אנימציה באפליקציה, לחץ ״בוצע״.</p>':'<p class="muted">אין בקשות פתוחות.</p>');
    }catch(e){b.innerHTML=''}
  }
  window.adminResolveEx=async function(btn){try{await FP2.push('adminResolveExerciseRequest',{name:btn.dataset.n});loadReq()}catch(e){toast(e.message||'שגיאה',true)}};
  window.adminLoadUsers=load;
  window.adminBlockUser=async function(uid,blocked){
    if(blocked&&!confirm('לחסום את המשתמש? הוא לא יוכל להיכנס עד שתשחרר אותו.'))return;
    try{loading()}catch(_){}
    try{await FP2.push('adminSetBlocked',{uid,blocked});toast(blocked?'המשתמש נחסם':'המשתמש שוחרר')}catch(e){toast(e.message||'שגיאה',true)}
    try{loading(false)}catch(_){}busy=false;load();
  };
  window.adminDeleteUserUI=async function(uid,name){
    if(!confirm(`למחוק את "${name}" לצמיתות? כל הנתונים שלו יימחקו ואי אפשר לשחזר.`))return;
    try{loading()}catch(_){}
    try{const r=await FP2.push('adminDeleteUser',{uid});toast('המשתמש נמחק'+(r&&r.note?' (חלק מהנתונים לא נמחקו)':''))}catch(e){toast(e.message||'שגיאה',true)}
    try{loading(false)}catch(_){}busy=false;load();
  };
  setTimeout(()=>{try{if(window.FP2&&FP2.isAdmin&&FP2.isAdmin()&&FP2.push)FP2.push('adminListFoodProposals').then(r=>{const n=(r.items||[]).length;if(n)toast('יש '+n+' מזונות שממתינים לאישור (הגדרות › משתמשים)')}).catch(()=>{})}catch(_){}},9000);
  setTimeout(()=>{try{if(window.FP2&&FP2.isAdmin&&FP2.isAdmin()&&FP2.push)FP2.push('adminListUsers').then(r=>{try{localStorage.setItem('fp2AdminUsers',JSON.stringify(r.users||[]))}catch(_){}}).catch(()=>{})}catch(_){}},6000);
  const t=setInterval(()=>{
    const s=[...document.querySelectorAll('#settings summary')].find(x=>/משתמשים/.test(x.textContent));if(!s)return;
    clearInterval(t);const d=s.parentElement,body=d.querySelector('.settings-body');
    if(!box())body.insertAdjacentHTML('beforeend','<div id="adminUsers"></div><div id="adminExReq"></div><div id="adminFoodReq"></div>');
    d.addEventListener('toggle',()=>{if(d.open)load()});
  },700);
})();


/* ===== הרשאות לפי תפקיד: רק המנהל רואה ניהול, מפתחות ומאגרים טכניים. משתמש רגיל רואה מעקב ואימונים ===== */
(function(){
  const isAdmin=()=>!!(window.FP2&&FP2.isAdmin&&FP2.isAdmin());
  const TECH=/צמרת|USDA|OpenAI|מתקדם|משתמשים/;
  function mark(){const sec=document.getElementById('settings');if(!sec)return;
    sec.querySelectorAll('details.settings-section').forEach(d=>{const s=d.querySelector(':scope > summary');if(s&&TECH.test(s.textContent))d.classList.add('admin-only')})}
  function apply(){mark();document.body.classList.toggle('hide-admin',!isAdmin());document.body.classList.toggle('is-admin',isAdmin())}
  const old=window.applyRole;
  window.applyRole=function(){try{if(typeof old==='function')old.apply(this,arguments)}catch(e){}apply()};
  const rs=window.renderSettings;if(typeof rs==='function')window.renderSettings=function(){const r=rs.apply(this,arguments);try{apply()}catch(e){}return r};
  document.addEventListener('DOMContentLoaded',apply);
  let n=0;const t=setInterval(()=>{apply();if(++n>40)clearInterval(t)},500);
})();

/* ===== מאגר צמרת לכולם: קובץ סטטי tzameret.json (ללא שרת ישן) + ייצוא למנהל ===== */
(function(){
  let tried=false;
  const ol=window.loadTzameret;
  if(typeof ol==='function')window.loadTzameret=function(force){
    return ol.apply(this,arguments).then(async ready=>{
      if(!tz.ready&&!tried){tried=true;
        try{const r=await fetch('tzameret.json',{cache:'no-cache'});if(r.ok){const t=await r.text();tzIngest(t);try{localStorage.setItem(TZ_STORE_KEY,t)}catch(_){}try{renderTzStatus()}catch(_){}}}catch(_){}}
      return tz.ready});
  };
  const boot=setInterval(()=>{if(typeof state!=='undefined'&&state.data){clearInterval(boot);setTimeout(()=>{try{loadTzameret()}catch(_){}},1200)}},700);
  async function exportTz(){
    let t='';try{t=localStorage.getItem(TZ_STORE_KEY)||''}catch(_){}
    if(!t)return toast('המאגר עוד לא נטען במכשיר הזה. פתח חיפוש מזון ונסה שוב',true);
    const blob=new Blob([t],{type:'application/json'}),file=new File([blob],'tzameret.json',{type:'application/json'});
    try{if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file]});return}}catch(e){if(e&&e.name==='AbortError')return}
    const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download='tzameret.json';document.body.appendChild(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(u)},4000);toast('הקובץ ירד. העלה אותו ל-GitHub ליד index.html')}
  window.exportTzameretFile=exportTz;
  function inject(){const s=[...document.querySelectorAll('#settings summary')].find(x=>/צמרת/.test(x.textContent));if(!s)return;const b=s.parentElement.querySelector('.settings-body');if(b&&!b.querySelector('#tzExport'))b.insertAdjacentHTML('beforeend','<button id="tzExport" type="button" class="btn light full" style="margin-top:8px" onclick="exportTzameretFile()">⬇️ ייצוא המאגר לקובץ (לפרסום לכל המשתמשים)</button><p class="muted">מעלים את tzameret.json ל-GitHub ליד index.html, וכל משתמש חדש יקבל את המאגר בלי חיבור לשרת הישן.</p>')}
  const rs=window.renderSettings;if(typeof rs==='function')window.renderSettings=function(){const r=rs.apply(this,arguments);try{inject()}catch(e){}return r};
})();

/* ===== פירוק משפט למוצרים גם בלי פסיקים: כמות חדשה או סוף כמות+יחידה פותחים פריט חדש ===== */
(function(){
  const UNITS=new Set(['גרם','גרמים','גר','ג','ג׳',"ג'",'מ״ל','מל','יחידה','יחידות','פרוסה','פרוסות','כוס','כוסות','כף','כפות','כפית','כפיות','מנה','מנות','פחית','פחיות','גביע','גביעים','קילו','ק״ג','ליטר']);
  const NUMW=new Set(['חצי','רבע','שתי','שני','שתיים','שניים','שלוש','שלושה','ארבע','ארבעה','חמש','חמישה','שש','שישה','שבע','שבעה','שמונה','תשע','תשעה','עשר','עשרה']);
  const isNum=t=>/^\d+(?:[.,]\d+)?$/.test(t)||NUMW.has(t);
  function smart(part){
    const w=part.split(/\s+/).filter(Boolean);if(w.length<3)return [part];
    const out=[];let cur=[];
    if(isNum(w[0])){ /* quantity first: "2 ביצים 100 גרם אורז" */
      w.forEach((t,i)=>{if(i>0&&isNum(t)&&cur.some(x=>!isNum(x)&&!UNITS.has(x))&&!UNITS.has(w[i-1])&&!(isNum(w[i-1])))if(!NUMW.has(w[i-1])){out.push(cur.join(' '));cur=[]}cur.push(t)});
    }else{ /* name first: "אורז 100 גרם ביצה 2 יחידות" */
      let seenNum=false;
      w.forEach((t,i)=>{
        if(seenNum&&!isNum(t)&&!UNITS.has(t)){out.push(cur.join(' '));cur=[];seenNum=false}
        cur.push(t);if(isNum(t)&&cur.some(x=>!isNum(x)&&!UNITS.has(x)))seenNum=true;
      });
    }
    if(cur.length)out.push(cur.join(' '));
    return out.length>1&&out.every(x=>x.length>=2)?out:[part];
  }
  if(typeof window.splitSentence==='function'){
    const base=window.splitSentence;
    window.splitSentence=function(q){return base(q).flatMap(smart)};
    window.__smartSplit=smart;
  }
})();


/* ===== מאגר מזונות משותף (2.6.5) ===== */
(function(){
  const oSearch=window.localFoodSearch;
  if(typeof oSearch==='function'){
    window.localFoodSearch=function(q,limit){
      const sh=(window.FP2&&FP2.sharedAll&&FP2.sharedAll())||[];
      if(!sh.length||!window.state||!state.data)return oSearch.apply(this,arguments);
      const mf=state.data.myFoods||[],codes=new Set(mf.map(x=>x.sourceId).filter(Boolean)),names=new Set(mf.map(x=>String(x.name||'').trim().toLowerCase()));
      const extra=sh.filter(x=>!(x.sourceId&&codes.has(x.sourceId))&&!names.has(String(x.name||'').trim().toLowerCase()));
      state.data.myFoods=mf.concat(extra);
      try{return oSearch.apply(this,arguments)}finally{state.data.myFoods=mf}
    };
  }
  const oUpd=window.updateFoodChoice;
  if(typeof oUpd==='function'){
    window.updateFoodChoice=function(){
      const r=oUpd.apply(this,arguments);
      try{
        const x=state.selectedFood,box=document.getElementById('foodChoice');
        if(x&&x.source==='מאגר משותף'&&box&&box.firstElementChild&&!box.querySelector('.rep-shared'))
          box.firstElementChild.insertAdjacentHTML('beforeend','<button class="btn secondary rep-shared" style="margin-top:8px" onclick="reportSharedFoodUI()">⚠ דווח על נתון שגוי</button>');
      }catch(_){}
      return r;
    };
  }
  window.reportSharedFoodUI=async function(){
    const x=state.selectedFood;if(!x)return;
    const note=prompt('מה לא נכון בנתונים של "'+x.name+'"?','');if(note===null)return;
    try{await FP2.push('reportSharedFood',{code:x.sharedId||x.sourceId||x.name,name:x.name,note});toast('תודה, הדיווח נשלח')}catch(e){toast(e.message||'שגיאה',true)}
  };
})();
