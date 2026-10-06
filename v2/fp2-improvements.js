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
    rows[i].insertAdjacentHTML('beforeend',`<details class="prep-details"><summary>שמן למרכיב הזה${x.extraOil?' · בחירה אישית':''}</summary>${oilControls('ingredientOil-'+i,x.extraOil||state.mealOil,`setIngredientOil.bind(null,${i})`,ingredientMass(x))}</details>`);
  });
}
(function(){
  const select=selectFood;selectFood=function(){state.foodOil=null;return select.apply(this,arguments)};
  const manual=manualFoodFromQuery;manualFoodFromQuery=function(){state.foodOil=null;const r=manual.apply(this,arguments);renderFoodOil();return r};
  const update=updateFoodChoice;updateFoodChoice=function(){const r=update.apply(this,arguments);renderFoodOil(true);return r};
  const totals=updateFoodChoiceTotals;updateFoodChoiceTotals=function(){const r=totals.apply(this,arguments),el=$('quickFoodTotals'),g=foodOilGrams();if(el&&g){const f=state.selectedFood,u=$('foodUnit').value,m=portionMacros(f,$('foodAmount').value,u,u==='גרם'||u==='מ״ל'?0:Number(state.foodGramsPerUnit)||foodUnitGrams(f,u));el.textContent=`סה״כ עם השמן: ${fmt(m.calories+g*9)} קל׳ · ${fmt(m.protein)} ג׳ חלבון · ${fmt(m.carbs)} ג׳ פחמימות · ${fmt(m.fat+g)} ג׳ שומן`}return r};
  const open=openCustomMealBuilder;openCustomMealBuilder=function(){state.mealOil=null;const r=open.apply(this,arguments);state.customIngredients.forEach(x=>{const c=boneCutFor(x.name);if(c&&x.unit==='גרם'&&!x.cut){x.cut=c.label;x.cutInfo={...c,weighedSkin:false};x.bone=false;x.skin=c.skinOn;x.weighed=x.amount}});renderCustomIngredients();return r};
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
  button.insertAdjacentHTML('beforebegin',`<div class="saved-prep">${oilControls('savedOil-'+i,s.all,`setSavedMealOil.bind(null,${i},-1)`,meal.ingredients.reduce((n,x,j)=>n+ingredientMass(x,Number($(`meal-${i}-${j}`).value)),0))}<details><summary>שמן לכל מרכיב בנפרד</summary>${meal.ingredients.map((x,j)=>`<div><b>${esc(x.name)}</b>${oilControls('savedOil-'+i+'-'+j,s.items[j]||s.all,`setSavedMealOil.bind(null,${i},${j})`,ingredientMass(x,Number($(`meal-${i}-${j}`).value)))}</div>`).join('')}</details><button type="button" class="btn light full" onclick="openCustomMealBuilder('${esc(meal.isCustom?meal.id:meal.key)}')">עריכת מרכיבים, עור ועצמות</button></div>`);
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
  const style=document.createElement('style');style.textContent=`.trash,.delete-action{background:#35282C!important;color:#D6A1A7!important;border:1px solid #594047!important;box-shadow:none!important;font-weight:600}.trash:active{background:#483139!important}.plus-fab{width:48px;height:48px;background:#A9BD69!important;color:#19200D!important;box-shadow:0 3px 10px rgba(0,0,0,.2)!important;font-size:26px}.step-btn,.stepper button{box-shadow:none!important;border-color:#59683C!important}.prep-oil{margin:10px 0;padding:10px;border:1px solid var(--line);border-radius:12px;line-height:1.5}.prep-oil .skin-chips{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0}.prep-oil small,.prep-assumption{display:block;font-size:12px;line-height:1.6}.prep-oil input{width:90px;padding:8px;margin:6px;border:1px solid var(--line);border-radius:8px}.prep-details,.bone-line,.prep-assumption{grid-column:1/-1}.prep-details{width:100%;margin:6px 0}.prep-details summary{color:var(--muted);font-size:13px}.saved-prep{margin:12px 0}#healthSetup .steps{padding-right:22px;line-height:1.8}#healthSetup li{margin-bottom:12px}#healthSetup a{color:var(--brand)}`;document.head.appendChild(style);
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
