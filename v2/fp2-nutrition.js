/* FitPro nutrition helpers. Quantities of oil are grams of additional oil per
   100 g of edible food. No selection changes the original nutrition values. */
(function(root){
'use strict';
const levels={included:0,none:0,little:1,normal:3,lots:7};
function oilGrams(selection,mass){
  if(!selection||selection.mode==='included'||selection.mode==='none')return 0;
  const g=selection.mode==='exact'?Number(selection.grams):Number(mass)*levels[selection.mode]/100;
  return Number.isFinite(g)&&g>0?Math.round(g*10)/10:0;
}
function classify(name){
  const n=String(name||'').toLowerCase();
  if(/שוקולד|מרק|ציר|סלט|ממרח|נקניק|פסטרמה|משומר|שימור|קציצ|קבב|נאגט|טחון|שניצל|מעושן|sausage|soup|salad|canned|ground|nugget/.test(n))return null;
  const fish=/(^|[^א-ת])(דג|דגים|סול)(?=$|[^א-ת])|סלמון|אמנון|דניס|לברק|מושט|בורי|פורל|הליבוט|טונה|בקלה|קרפיון|סרדין|מקרל|לוקוס|נסיכת הנילוס|salmon|fish|tilapia|tuna|cod|trout|sea bass|mackerel|sardine|halibut/.test(n);
  const poultry=/עוף|הודו|פרגי[תות]|chicken|turkey|duck|ברווז/.test(n);
  const meat=/בשר|בקר|עגל|כבש|טלה|אסאדו|צלע|אוסובוקו|אנטריקוט|סינטה|פילה|שייטל|כתף|צלי|סטייק|beef|veal|lamb|steak|rib|brisket|t-?bone/.test(n);
  if(!fish&&!poultry&&!meat)return null;
  const boneless=/בלי עצם|ללא עצם|ללא עצמות|בלי עצמות|מפורק|boneless|פילה|fillet|פרגי[תות]/.test(n);
  const explicit=/עם עצם|עם עצמות|כולל עצם|על העצם|bone-in|with bone/.test(n);
  const whole=/שלם|whole/.test(n);
  const skinless=/ללא עור|בלי עור|בשר בלבד|meat only|skinless|without skin/.test(n);
  const skinOn=/עם עור|עם העור|בשר ועור|with skin|meat and skin/.test(n);
  const rules=[[/כנפ|wing/,'כנפיים',.40,.25,true],[/שוק|כרע|drumstick/,'שוק',.30,.12,true],[/ירך|פרגי|thigh/,'ירך',.20,.15,true],[/גב|back/,'גב',.45,.20,true],[/רבע|quarter/,'רבע עוף',.25,.13,true],[/חזה|breast/,'חזה',.15,.08,false]];
  const cut=poultry?rules.find(x=>x[0].test(n)):null;
  const skin=poultry?(cut?cut[3]:.12):fish?.08:0;
  const bone=poultry?(whole?.30:cut?cut[2]:.25):fish?(whole?.35:.05):.30;
  const natural=poultry?(whole||!!(cut&&cut[4])):fish?whole:/אסאדו|צלע|אוסובוקו|rib|t-?bone/.test(n);
  return {label:fish?'דג':poultry?(cut?cut[1]:'עוף / הודו'):'בשר',bone,skin,
    defBone:!boneless&&(explicit||natural),skinOn,
    weighedSkin:skin>0&&!skinless&&(skinOn||fish||whole||!!(cut&&cut[4]))};
}
function edible(info,bone,skin,weighed){
  const factor=info?Math.max(.2,1-(bone===true?info.bone:0)-(!skin&&info.weighedSkin?info.skin:0)):1;
  return Math.round(Math.max(0,Number(weighed)||0)*factor);
}
root.FP2Nutrition={oilGrams,classify,edible,levels};
})(typeof window==='undefined'?globalThis:window);
