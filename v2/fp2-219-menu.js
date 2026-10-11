/* FitPro 2.19.0 — the starter menu, built without AI.
   Kosher basics only; a meal is dairy or meat (never both); breakfast is light; lunch = a carb portion + a protein portion;
   dinner is like breakfast or like lunch, different from both. Vegetarians see only vegetarian foods, vegans only vegan.
   FPM.use(answers) sets the answers; FPM.sets() gives 4 options for every meal; FPM.ingredients(option) gives what the app saves. */
(function(){
'use strict';
let A={diet:'all',no:[],prod:null,bread:['whole'],milk:'reg',meals:'3',free:250,cook:'r',goal:'recomp',dayCal:2000};
/* ---------- foods: kcal and protein per unit; k = d dairy, m meat, p pareve ---------- */
const F={
 b_white:{n:'לחם לבן',u:'פרוסה',us:'פרוסות',kc:80,p:2.5,k:'p',c:15,fat:1},
 b_whole:{n:'לחם שחור',u:'פרוסה',us:'פרוסות',kc:70,p:3.5,k:'p',c:12,fat:1},
 b_grain:{n:'לחם דגנים',u:'פרוסה',us:'פרוסות',kc:75,p:3.5,k:'p',c:12,fat:1.5},
 b_light:{n:'לחם קל',u:'פרוסה',us:'פרוסות',kc:45,p:2.5,k:'p',c:8,fat:0.5},
 b_pita:{n:'פיתה',u:'חצי פיתה',us:'חצאי פיתה',kc:130,p:4.5,k:'p',c:20,fat:0.5},
 b_crisp:{n:'צנימים',u:'צנים',us:'צנימים',kc:35,p:1,k:'p',c:7,fat:0.4},
 b_rice:{n:'פריכיות אורז',u:'פריכית',us:'פריכיות',kc:30,p:.7,k:'p',c:6.5,fat:0.3},
 egg:{n:'ביצה',u:'ביצה',us:'ביצים',kc:75,p:6.5,k:'p',c:0.5,fat:5},
 cottage:{n:'קוטג׳ 5%',g:50,kc:48,p:5.5,k:'d',c:1.5,fat:2.5},
 wcheese:{n:'גבינה לבנה 5%',g:50,kc:48,p:4.5,k:'d',c:2,fat:2.5},
 yog:{n:'יוגורט 1.5%',u:'גביע',us:'גביעים',kc:75,p:6,k:'d',c:8,fat:2},
 yogsoy:{n:'יוגורט סויה',u:'גביע',us:'גביעים',kc:90,p:5,k:'p',c:9,fat:3},
 milk:{n:'חלב 1%',ml:200,kc:85,p:6.5,k:'d',c:10,fat:2},
 milksoy:{n:'משקה סויה',ml:200,kc:80,p:6,k:'p',c:4,fat:4},
 tuna:{n:'טונה במים',u:'קופסה',us:'קופסאות',kc:110,p:25,k:'p',c:0,fat:1},
 chicken:{n:'חזה עוף',g:50,kc:83,p:15.5,k:'m',c:0,fat:1.8},
 turkey:{n:'הודו',g:50,kc:75,p:14.5,k:'m',c:0,fat:1.5},
 beef:{n:'בקר רזה',g:50,kc:110,p:13,k:'m',c:0,fat:6},
 fish:{n:'פילה אמנון',g:50,kc:65,p:13,k:'p',c:0,fat:1.3},
 rice:{n:'אורז מבושל',g:50,kc:65,p:1.3,k:'p',c:14,fat:0.2},
 pasta:{n:'פסטה מבושלת',g:50,kc:78,p:2.9,k:'p',c:15,fat:0.5},
 leg:{n:'עדשים / חומוס מבושל',g:50,kc:60,p:4.5,k:'p',c:10,fat:0.2},
 tofu:{n:'טופו',g:50,kc:72,p:7.5,k:'p',c:1.5,fat:4.3},
 salad:{n:'סלט ירקות',fix:'קערה',kc:40,p:2,k:'p',c:8,fat:0.3},
 vegcut:{n:'ירקות חתוכים',fix:'צלחת קטנה',kc:30,p:1,k:'p',c:6,fat:0.2},
 tomsauce:{n:'רוטב עגבניות',fix:'חצי כוס',kc:50,p:1.5,k:'p',c:8,fat:1.5},
 oil:{n:'שמן זית',u:'כפית',us:'כפיות',kc:40,p:0,k:'p',c:0,fat:4.5},
 fruit:{n:'פרי',u:'פרי',us:'פירות',kc:80,p:1,k:'p',c:20,fat:0.3},
 tahini:{n:'טחינה גולמית',u:'כף',us:'כפות',kc:90,p:2.5,k:'p',c:3,fat:8},
 nuts:{n:'אגוזים / שקדים',u:'חופן קטן',us:'חופנים קטנים',kc:95,p:3,k:'p',c:3,fat:8},
 prot:{n:'אבקת חלבון',u:'סקופ',us:'סקופים',kc:120,p:24,k:'d',c:3,fat:1.5},
 protv:{n:'אבקת חלבון צמחית',u:'סקופ',us:'סקופים',kc:115,p:22,k:'p',c:4,fat:2},
 oats:{n:'שיבולת שועל',g:20,kc:75,p:2.5,k:'p',c:13,fat:1.4},
 pb:{n:'חמאת בוטנים',u:'כף',us:'כפות',kc:90,p:4,k:'p',c:3,fat:7.5},
 pancake:{n:'פנקייק חלבון',u:'פנקייק',us:'פנקייקים',kc:220,p:20,k:'d',note:'שיבולת שועל, ביצה, חצי סקופ חלבון',c:22,fat:6}
};
/* the product list (what the user ticks). veg: shown to vegetarian, vegan: shown to vegan */
const P=[
 {id:'bread',n:'לחם',all:1,veg:1,vegan:1,sub:[['white','לבן'],['whole','שחור'],['grain','דגנים'],['light','קל'],['pita','פיתה'],['crisp','צנימים'],['ricecake','פריכיות']]},
 {id:'egg',n:'ביצים',all:1,veg:1},
 {id:'cottage',n:'קוטג׳ וגבינה לבנה',all:1,veg:1},
 {id:'yog',n:'יוגורט',all:1,veg:1,vegan:1,vn:'יוגורט סויה'},
 {id:'milk',n:'חלב',all:1,veg:1,vegan:1},
 {id:'tuna',n:'טונה',all:1},
 {id:'chicken',n:'עוף',all:1},
 {id:'turkey',n:'הודו',all:1},
 {id:'beef',n:'בשר',all:1},
 {id:'fish',n:'דגים',all:1},
 {id:'rice',n:'אורז',all:1,veg:1,vegan:1},
 {id:'pasta',n:'פסטה',all:1,veg:1,vegan:1},
 {id:'leg',n:'חומוס / קטניות',all:1,veg:1,vegan:1},
 {id:'tofu',n:'טופו',veg:1,vegan:1},
 {id:'oats',n:'שיבולת שועל',all:1,veg:1,vegan:1},
 {id:'pb',n:'חמאת בוטנים',all:1,veg:1,vegan:1},
 {id:'salad',n:'ירקות לסלט',all:1,veg:1,vegan:1},
 {id:'fruit',n:'פירות',all:1,veg:1,vegan:1},
 {id:'tahini',n:'טחינה / אגוזים',all:1,veg:1,vegan:1},
 {id:'prot',n:'אבקת חלבון',all:1,veg:1,vegan:1}
];
const MILK={reg:{n:'חלב 1%',kc:85,p:6.5,c:10,fat:2,k:'d',lab:'רגיל'},lf:{n:'חלב ללא לקטוז',kc:85,p:6.5,c:10,fat:2,k:'d',lab:'ללא לקטוז'},soy:{n:'משקה סויה',kc:80,p:6,c:4,fat:4,k:'p',lab:'סויה',plant:1},almond:{n:'משקה שקדים',kc:30,p:1,c:1,fat:2.5,k:'p',lab:'שקדים',plant:1},oat:{n:'משקה שיבולת שועל',kc:90,p:2,c:14,fat:3,k:'p',lab:'שיבולת שועל',plant:1}};
const NO=[['gluten','גלוטן'],['lact','לקטוז'],['fish','דגים'],['peanut','בוטנים']];
function visibleProducts(){return P.filter(p=>p[A.diet]&&!(A.no.includes('fish')&&(p.id==='fish'||p.id==='tuna'))&&!(A.no.includes('peanut')&&p.id==='pb'))}
function prodSet(){if(!A.prod)A.prod=visibleProducts().map(p=>p.id);return A.prod.filter(id=>visibleProducts().some(p=>p.id===id))}

/* ---------- the menu builder (no AI) ---------- */
let seed=Date.now()%2147483646+1;const rnd=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646};
const pick=a=>a[Math.floor(rnd()*a.length)];
const pickOr=(a,b)=>a.length?pick(a):pick(b);
function sub(id){ /* adjust a food for diet / not-eating */
  let x=Object.assign({id},F[id]);
  if(A.diet==='vegan'&&id==='prot')x=Object.assign({id:'protv'},F.protv);
  if(id==='milk'){const m=MILK[A.milk]||MILK.reg;x=Object.assign(x,m)}
  if(A.no.includes('gluten')&&/^b_(white|whole|light|pita)$|^pasta$/.test(id))x.n+=' ללא גלוטן';
  if(A.no.includes('lact')&&x.k==='d')x.n+=' ללא לקטוז';
  return x;
}
function breadIds(){const map={white:'b_white',whole:'b_whole',grain:'b_grain',light:'b_light',pita:'b_pita',crisp:'b_crisp',ricecake:'b_rice'};const b=(A.bread||[]).map(k=>map[k]).filter(Boolean);return b.length?b:['b_whole']}
function has(id){return prodSet().includes(id)}
/* a line = food + amount in units; scalable lines have min/max/step */
const L=(id,q,min,max)=>({f:sub(id),q,min:min==null?q:min,max:max==null?q:max});
function lineKc(l){const f=l.f;return f.g?f.kc*l.q/f.g:f.ml?f.kc*l.q/f.ml:f.kc*l.q}
function lineP(l){const f=l.f;return f.g?f.p*l.q/f.g:f.ml?f.p*l.q/f.ml:f.p*l.q}
function amount(l){const f=l.f;if(f.fix)return f.fix;if(f.g)return l.q+' ג׳';if(f.ml)return l.q+' מ״ל';const q=l.q;if(f.n.includes(f.u))return String(q);return(q===1?'':q+' ')+(q>1?f.us:f.u)}
function fit(lines,target){ /* grow the scalable lines one step at a time till near the target; protein first when the meal is low on protein */
  const st=l=>l.f.g?l.f.g:1,dens=l=>l.f.p/l.f.kc;let g=0;
  while(g++<40){const kc=lines.reduce((s,l)=>s+lineKc(l),0),pr=lines.reduce((s,l)=>s+lineP(l),0);
    const can=lines.filter(l=>l.q+st(l)<=l.max);if(!can.length)break;
    const wantP=pr/kc<.075;can.sort((a,b)=>wantP?dens(b)-dens(a):dens(a)-dens(b));
    const nx=can.find(l=>kc+lineKc({f:l.f,q:st(l)})/2<=target);if(!nx)break;nx.q+=st(nx)}
  return lines;
}
function kindOf(lines){if(lines.some(l=>l.f.k==='m'))return'm';if(lines.some(l=>l.f.k==='d'))return'd';return'p'}
const oilQ=()=>A.cook==='s'?0:A.cook==='g'?2:1;

/* breakfast-style meals: light, dairy or pareve */
function lightOptions(cut){
  const o=[],b=breadIds().filter(id=>id!=='b_pita'),bb=b.length?b:breadIds();
  const carb=()=>{const id=pick(bb);const f=F[id];return L(id,f.kc<=40?2:1,f.kc<=40?2:1,f.kc<=40?5:3)};
  if(has('cottage'))o.push({t:'לחם וקוטג׳',l:()=>[carb(),L(pick(['cottage','wcheese']),100,100,200),L('vegcut',1)]});
  if(has('egg'))o.push({t:'ביצים ולחם',l:()=>[carb(),L('egg',2,1,3),L('vegcut',1)]});
  if(has('egg')&&has('cottage'))o.push({t:'ביצה, גבינה ולחם',l:()=>[carb(),L('egg',1,1,2),L('wcheese',50,50,150),L('vegcut',1)]});
  if(has('yog')&&has('oats'))o.push({t:'יוגורט עם שיבולת שועל',l:()=>{const a=[L(A.diet==='vegan'?'yogsoy':'yog',1,1,2),L('oats',40,40,80)];if(has('fruit'))a.push(L('fruit',1));if(cut&&has('pb'))a.push(L('pb',1));return a}});
  if(has('oats')&&has('pb')&&cut&&has('milk'))o.push({t:'דייסת שיבולת שועל',l:()=>[L('oats',40,40,80),L('milk',200),L('pb',1),...(has('fruit')?[L('fruit',1)]:[])]});
  if(has('oats')&&has('egg')&&has('prot')&&A.diet!=='vegan')o.push({t:'מתוק: פנקייק חלבון',sweet:1,l:()=>[L('pancake',1,1,2),...(has('yog')?[L('yog',1)]:has('fruit')?[L('fruit',1)]:[])]});
  if(has('egg'))o.push({t:'שקשוקה',l:()=>[L('egg',2,1,3),L('tomsauce',1),carb()]});
  if(has('egg'))o.push({t:'חביתה עם ירקות',l:()=>[L('egg',2,2,3),L('vegcut',1),carb()]});
  if(has('cottage')&&(breadIds().includes('b_rice')||breadIds().includes('b_crisp')))o.push({t:'פריכיות עם קוטג׳',l:()=>[L(breadIds().includes('b_rice')?'b_rice':'b_crisp',3,2,5),L('cottage',100,100,200),L('vegcut',1)]});
  if(has('yog')&&has('fruit')&&has('tahini'))o.push({t:'יוגורט, פרי ואגוזים',l:()=>[L(A.diet==='vegan'?'yogsoy':'yog',1,1,2),L('fruit',1),L('nuts',1)]});
  if(has('tuna'))o.push({t:'סלט טונה עם לחם',l:()=>[L('tuna',1),L('vegcut',1),carb()]});
  if(A.diet==='vegan'){if(has('tahini'))o.push({t:'לחם עם טחינה וירקות',l:()=>[carb(),L('tahini',1,1,2),L('vegcut',1),...(has('tofu')?[L('tofu',100,100,150)]:[])]});
    if(has('pb'))o.push({t:(breadIds().includes('b_rice')?'פריכיות':'לחם')+' עם חמאת בוטנים',l:()=>[L(breadIds().includes('b_rice')?'b_rice':bb[0],2,2,4),L('pb',1),...(has('fruit')?[L('fruit',1)]:[])]})}
  if(!o.length)o.push({t:'לחם וירקות',l:()=>[carb(),L('vegcut',1),...(has('tahini')?[L('tahini',1)]:[])]});
  return o;
}
/* lunch-style meals: a carb portion + a protein portion. meat or pareve, never dairy, never eggs */
function carbList(){const c=['rice','pasta','leg'].filter(has);if(has('bread')&&breadIds().includes('b_pita'))c.push('b_pita');return c.length?c:[breadIds()[0]]}
function heavyOptions(avoidProt,forceCarb){
  const prots=['chicken','turkey','beef','fish','tuna','tofu'].filter(has).filter(x=>x!==avoidProt);
  const carbs=['rice','pasta','leg'].filter(has);if(has('bread')&&breadIds().includes('b_pita'))carbs.push('b_pita');
  if(!carbs.length)carbs.push(breadIds()[0]);
  if(A.diet!=='all'&&has('leg')&&avoidProt!=='leg')prots.push('leg');
  let ps=prots.length?prots:(has('leg')?['leg']:['tofu']);
  return ps.map(pr=>({prot:pr,t:'',l:()=>{
    let c=pr==='leg'?pickOr(carbs.filter(x=>x!=='leg'),[breadIds()[0]]):pick(carbs);if(forceCarb&&carbs.includes(forceCarb)&&!(pr==='leg'&&forceCarb==='leg'))c=forceCarb;
    const big=A.goal==='gain';const cl=F[c].g?L(c,100,100,big?400:300):L(c,1,1,big?5:4);
    const pl=pr==='tuna'?L('tuna',1,1,2):L(pr,pr==='leg'?150:100,pr==='leg'?150:100,250);
    const a=[pl,cl];if(has('salad'))a.push(L('salad',1));if(oilQ())a.push(L('oil',oilQ()));if(has('tahini')&&pr!=='tuna'&&rnd()<.4)a.push(L('tahini',1));return a}}));
}
function snackOptions(afterMeat){
  const o=[];
  if(has('fruit')&&has('tahini'))o.push(()=>[L('fruit',1),L('nuts',1)]);
  if(has('fruit'))o.push(()=>[L('fruit',2,1,2)]);
  if(!afterMeat&&has('yog'))o.push(()=>[L(A.diet==='vegan'?'yogsoy':'yog',1),...(has('fruit')?[L('fruit',1)]:[])]);
  if(!afterMeat&&has('prot'))o.push(()=>[L('prot',1),L('fruit',1)]);
  if(A.diet==='vegan'&&has('prot'))o.push(()=>[L('protv',1),...(has('fruit')?[L('fruit',1)]:[])]);
  if(has('pb'))o.push(()=>[L(breadIds().includes('b_rice')?'b_rice':'b_crisp',2),L('pb',1)]);
  return o.length?o:[()=>[L('fruit',1)]];
}
function topUp(lines,tg,slot){ /* still short? add one pareve extra at a time: fruit, tahini, nuts, peanut butter */
  const heavy=lines.some(l=>['chicken','turkey','beef','fish','tuna','tofu','rice','pasta'].includes(l.f.id));
  const extras=(heavy?['tahini']:slot==='בוקר'?['fruit','pb']:['fruit','nuts','pb']).filter(id=>(id==='nuts'?has('tahini'):has(id))&&!lines.some(l=>l.f.id===id));
  for(const id of extras){const kc=lines.reduce((s,l)=>s+lineKc(l),0);if(kc>=tg-60)break;const l=L(id,1);if(kc+lineKc(l)/2<=tg)lines.push(l)}
}
function mealNames(){return A.meals==='4'?['בוקר','צהריים','ביניים','ערב']:['בוקר','צהריים','ערב']}
function buildMeal(slot,tg,ctx){
  const cut=A.goal==='lose';
  if(slot==='בוקר'){const os=lightOptions(cut);const o=pick(os.filter(x=>!x.sweet||rnd()<.5).length?os.filter(x=>!x.sweet||rnd()<.5):os);ctx.bfast=o.t;return{t:o.t,lines:fit(o.l(),tg)}}
  if(slot==='צהריים'){const o=pick(heavyOptions());ctx.lprot=o.prot;const lines=fit(o.l(),tg);ctx.lunchKind=kindOf(lines);return{t:SHORT(o.prot)+' עם '+SHORT(lines[1].f.id),lines}}
  if(slot==='נשנוש'){const o=pick(snackOptions(ctx.lunchKind==='m'));return{t:'',lines:fit(o(),tg)}}
  if(slot==='ביניים'){ /* a small real meal; pareve if lunch was meat */
    const os=[];if(has('tuna'))os.push({t:'כריך טונה',l:()=>[L(breadIds()[0],2,1,3),L('tuna',1),L('vegcut',1)]});
    if(has('egg'))os.push({t:'ביצה ולחם',l:()=>[L(breadIds()[0],1,1,2),L('egg',2,1,2),L('vegcut',1)]});
    if(ctx.lunchKind!=='m')lightOptions(cut).filter(o=>o.t!==ctx.bfast).forEach(o=>os.push(o));
    snackOptions(ctx.lunchKind==='m').forEach(f=>os.push({t:'',l:f}));
    const o=pick(os);return{t:o.t,lines:fit(o.l(),tg)}}
  /* dinner: like breakfast or like lunch, but not the same as either */
  if(rnd()<.6){const os=lightOptions(cut).filter(o=>o.t!==ctx.bfast);const o=pick(os.length?os:lightOptions(cut));return{t:o.t,lines:fit(o.l(),tg)}}
  const o=pick(heavyOptions(ctx.lprot));const lines=fit(o.l(),tg);return{t:SHORT(o.prot)+' עם '+SHORT(lines[1].f.id),lines};
}
function shares(){return A.meals==='4'?[.2,.32,.18,.3]:[.24,.42,.34]}
function mealBudget(){return (A.dayCal||2000)-(A.meals==='3f'?A.free:0)}
const titleOf=lines=>lines.slice(0,2).map(l=>l.f.n).join(' ו');
function finish(r,m){if(!r.t)r.t=titleOf(r.lines);r.name=m;r.kind=kindOf(r.lines);r.kc=Math.round(r.lines.reduce((s,l)=>s+lineKc(l),0));r.p=Math.round(r.lines.reduce((s,l)=>s+lineP(l),0));return r}
/* one day (used by the food screen) */
function buildMenu(keep){
  const sh=shares(),B=mealBudget();const ctx={};
  return mealNames().map((m,i)=>{if(keep&&keep[i])return Object.assign({},keep[i],{kept:true});
    if(m==='ביניים')ctx.lunchKind='m';const tg=B*sh[i];const r=buildMeal(m,tg,ctx);topUp(r.lines,tg,m);return finish(r,m)});
}
/* the onboarding menu: 4 different options for every meal */
function buildSets(prev){
  const sh=shares(),B=mealBudget(),cut=A.goal==='lose';const old=new Set();(prev||[]).forEach(m=>m.opts.forEach(o=>old.add(m.name+'|'+o.t)));
  const used=new Set();
  const lightOne=(m,tg,avoid)=>{let os=lightOptions(cut).filter(o=>!avoid.has(o.t)&&!old.has(m+'|'+o.t));if(!os.length)os=lightOptions(cut).filter(o=>!avoid.has(o.t));if(!os.length)return null;const o=pick(os);return{t:o.t,lines:fit(o.l(),tg)}};
  const heavyOne=(m,tg,avoid,k)=>{const carbs=carbList();let hv=heavyOptions();for(let n=0;n<12;n++){const o=hv[(k+n+Math.floor(rnd()*hv.length))%hv.length],c=carbs[(k+n)%carbs.length];const ho=heavyOptions(null,c).find(x=>x.prot===o.prot)||o;const lines=fit(ho.l(),tg);const t=SHORT(ho.prot)+' עם '+SHORT(lines[1].f.id);if(avoid.has(t)||(old.has(m+'|'+t)&&n<10))continue;return{t,lines}}const ho=pick(hv);const lines=fit(ho.l(),tg);return{t:SHORT(ho.prot)+' עם '+SHORT(lines[1].f.id),lines}};
  return mealNames().map((m,i)=>{const tg=B*sh[i],out=[],seen=new Set();
    for(let k=0;k<4;k++){let r;
      if(m==='בוקר')r=lightOne(m,tg,seen)||heavyOne(m,tg,seen,k);
      else if(m==='צהריים')r=heavyOne(m,tg,seen,k);
      else if(m==='ערב'){const av=new Set([...seen,...used]);r=(k%2?lightOne(m,tg,av):null)||heavyOne(m,tg,av,k+2)}
      else{const ctx={lunchKind:'m'};let tries=0;do{r=buildMeal(m,tg,ctx);if(!r.t)r.t=titleOf(r.lines)}while(seen.has(r.t)&&tries++<30)}
      topUp(r.lines,tg,m);seen.add(r.t);out.push(finish(r,m))}
    seen.forEach(t=>used.add(t));
    return{name:m,opts:out,sel:0}});
}
const SHORT=id=>({leg:'קטניות',rice:'אורז',pasta:'פסטה',b_pita:'פיתה',chicken:'עוף',turkey:'הודו',beef:'בקר',fish:'דג',tuna:'טונה',tofu:'טופו'})[id]||F[id].n;
const KIND={d:['חלבי','d'],m:['בשרי','m'],p:['פרווה','n']};

function lineMacros(l){const f=l.f,k=f.g?l.q/f.g:f.ml?l.q/f.ml:l.q;return{calories:Math.round(f.kc*k*10)/10,protein:Math.round(f.p*k*10)/10,carbs:Math.round((f.c||0)*k*10)/10,fat:Math.round((f.fat||0)*k*10)/10}}
function ingredients(o){return o.lines.map(l=>{const f=l.f;const unit=f.g?'גרם':f.ml?'מ״ל':f.fix?f.fix:f.u;const amount=f.fix?1:l.q;return Object.assign({name:f.n,amount,unit},lineMacros(l))})}
window.FPM={use(a){A=a;if(!Array.isArray(A.no))A.no=[];if(!Array.isArray(A.bread)||!A.bread.length)A.bread=['whole']},
  products:visibleProducts,prodSet,P,MILK,NO,F,sets:prev=>buildSets(prev),day:keep=>buildMenu(keep),ingredients,amount,lineKc,lineP,KIND,shares,mealNames,
  reseed(){seed=Math.floor(Math.random()*2147483000)+1}};
})();
