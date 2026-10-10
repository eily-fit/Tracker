/* FitPro 2.14.0 — drinks in מ״ל, not grams. For a drink 1 מ״ל is counted as 1 גרם (close enough for drinks). */
(function(){
'use strict';
const DRINK=/^(משקה|מיץ|מיצי|יין|בירה|וודקה|ערק|ויסקי|קוניאק|ברנדי|ליקר|רום|ג'ין|טקילה|קולה|סודה|מים|חלב(?!ון|ה)|קפה|תה(?=[\s,]|$)|שוקו|לימונדה|נקטר|שייק|קוקטייל|סיידר|קפוצ'ינו|אספרסו|לאטה|אייס|פריגת|ספרייט|פאנטה|רד בול|משקאות)/;
const NOT=/אבקה|יבש|גרגרים|טחון|עלים|מרוכז|מוצק|ממרח|ריבת|פודינג|גלידה|קרם|עוגה|עוגיות|שוקולד(?! חלב)|מאפה|מוס/;
function isDrink(x){if(!x)return false;const n=String(x.name||x.n||'').trim();return DRINK.test(n)&&!NOT.test(n)}
window.fpIsDrink=isDrink;
/* "חלב 3%", "קוטג׳ 5%": the percent is fat, not an amount */
if(typeof localFoodSearch==='function'){const o=localFoodSearch;localFoodSearch=function(q){const r=o.apply(this,arguments);try{const m=String(q||'').match(/(\d+(?:[.,]\d+)?)\s*%/);if(m&&r&&r.parsed&&Number(r.parsed.amount)===Number(m[1].replace(',','.'))){const rest=String(q).replace(m[0],'');if(!/\d/.test(rest))r.parsed=Object.assign({},r.parsed,{amount:null,grams:false})}}catch(_){}return r}}
if(typeof foodUnitOptions==='function'){const o=foodUnitOptions;foodUnitOptions=function(x){const r=o.apply(this,arguments);if(!isDrink(x))return r;const out=r.map(u=>u==='גרם'?'מ״ל':u);return [...new Set(out)]}}
if(typeof foodUnitGrams==='function'){const o=foodUnitGrams;foodUnitGrams=function(x,u){if(u==='מ״ל'&&isDrink(x))return 1;return o.apply(this,arguments)}}
if(typeof defaultPortion==='function'){const o=defaultPortion;defaultPortion=function(x){const r=o.apply(this,arguments);if(r&&r.unit==='גרם'&&isDrink(x))return {amount:r.amount,unit:'מ״ל'};return r}}
if(typeof portionMacros==='function'){const o=portionMacros;portionMacros=function(x,amount,unit,g){if(unit==='מ״ל'&&isDrink(x)&&!(g>0))return o.call(this,x,amount,'גרם',g);return o.apply(this,arguments)}}
})();
