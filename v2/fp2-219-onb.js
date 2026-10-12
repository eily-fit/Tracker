/* FitPro 2.19.0 — the new questionnaire (same look as before: big titles, big choices, labeled progress).
   פרטים (+BMI) → מטרה (+קצב, הסבר) → איך נראה היום שלך → אימונים וריצה → תזונה → מה אתה אוכל → ארוחות ובישול
   → "בונה את התוכנית" → תפריט ראשוני (4 אפשרויות לכל ארוחה, "החלף תפריט" פעמיים) → סיכום + 3 שאלות → הסיור.
   An existing user who opens it again keeps his meals: no starter menu. */
(function(){
'use strict';
if(typeof openOnboarding!=='function'||!window.FPM)return;
const LS={get(k){try{return localStorage.getItem(k)}catch(_){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(_){}}};
const prop=k=>{try{return FP2.getProp(k)}catch(_){return null}};
const setProp=(k,v)=>{try{FP2.setProp(k,v)}catch(_){}};
document.head.insertAdjacentHTML('beforeend',`<style id="fpQcss">
#onbSheet .onb-progress{grid-template-columns:repeat(7,minmax(0,1fr))!important}#onbSheet .onb-progress span{font-size:10.5px}
#onbSheet .onb-choice.col{display:flex;justify-content:space-between;align-items:center;gap:10px;width:100%;text-align:start}
#onbSheet .onb-choice small{display:block;color:var(--muted,#A3ADB8);font-weight:400;font-size:12.5px}
#onbSheet .onb-choice.selected small{color:#c4d98a}
#onbSheet .onb-choice.chip{flex:0 0 auto;min-height:40px;border-radius:99px;padding:7px 14px}
#onbSheet .fpq-grid{display:grid;gap:8px}
#onbSheet .fpq-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #2C3640}
#onbSheet .fpq-row:last-child{border:0}
#onbSheet .fpq-step{display:flex;align-items:center;gap:8px}#onbSheet .fpq-step b{min-width:22px;text-align:center;font-size:18px}
#onbSheet .fpq-step button{width:38px;height:38px;border-radius:11px;border:1px solid #2C3640;background:#1F262E;color:inherit;font:700 18px inherit}
#onbSheet .fpq-bmi{display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:12px;border-top:1px solid #2C3640}
#onbSheet .fpq-bmi b{font-size:26px;color:var(--brand,#D7F36B)}
#onbSheet .fpq-warn{background:rgba(240,149,149,.1);border:1px solid rgba(240,149,149,.45);border-radius:14px;padding:10px 12px;margin:10px 0;line-height:1.6}
#onbSheet .fpq-warn b{color:#F09595}
#onbSheet .fpq-good{background:rgba(215,243,107,.08);border:1px solid rgba(215,243,107,.3);border-radius:14px;padding:10px 12px;margin:10px 0;line-height:1.6}
#onbSheet .fpq-sub{border:1px dashed #2C3640;border-radius:12px;padding:10px;margin-top:10px}
#onbSheet .fpq-meal{background:#1F262E;border:1px solid #2C3640;border-radius:16px;padding:10px 12px;margin:10px 0}
#onbSheet .fpq-meal .h{display:flex;justify-content:space-between;align-items:center;gap:8px}
#onbSheet .fpq-seg{display:flex;background:#171C22;border:1px solid #2C3640;border-radius:12px;padding:3px;gap:3px;margin:8px 0}
#onbSheet .fpq-seg button{flex:1;font:inherit;border:0;background:none;color:var(--muted,#A3ADB8);border-radius:9px;padding:7px;cursor:pointer}
#onbSheet .fpq-seg button.on{background:#2B3A1B;color:var(--brand,#D7F36B);font-weight:700}
#onbSheet .fpq-it{display:flex;justify-content:space-between;gap:8px;padding:2px 0;font-size:14.5px}#onbSheet .fpq-it span:last-child{color:var(--muted,#A3ADB8);white-space:nowrap}
#onbSheet .fpq-tag{font-size:12px;font-weight:700;border-radius:99px;padding:2px 9px}
#onbSheet .fpq-tag.d{background:rgba(143,200,255,.16);color:#8FC8FF}#onbSheet .fpq-tag.m{background:rgba(255,196,138,.16);color:#FFC48A}#onbSheet .fpq-tag.n{background:#2C3640;color:var(--muted,#A3ADB8)}
#onbSheet .fpq-load{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;gap:18px;text-align:center}
#onbSheet .fpq-spin{width:64px;height:64px;border-radius:50%;border:5px solid #2C3640;border-top-color:var(--brand,#D7F36B);animation:fpqsp 1s linear infinite}
@keyframes fpqsp{to{transform:rotate(360deg)}}
#onbSheet .fpq-ll{text-align:start;width:260px}#onbSheet .fpq-ll div{padding:4px 0;color:var(--muted,#A3ADB8)}#onbSheet .fpq-ll div.ok{color:inherit}#onbSheet .fpq-ll div.ok::before{content:'✓ ';color:var(--brand,#D7F36B)}#onbSheet .fpq-ll div.now::before{content:'… ';color:var(--brand,#D7F36B)}
@media (prefers-reduced-motion:reduce){#onbSheet .fpq-spin{animation-duration:3s}}
</style>`);

/* ---------- the goals: same texts and paces as the goal sheet ---------- */
const GOALS={
  lose:{icon:'',title:'חיטוב',short:'להוריד שומן',what:'אוכלים פחות ממה שהגוף שורף, כדי שהגוף ישתמש בשומן.',how:'חלבון גבוה ואימוני כוח שומרים על השריר בזמן שהשומן יורד.',expect:'ירידה במשקל ובהיקף הטבור. המשקל קופץ מיום ליום, אז מסתכלים על הממוצע.',must:'לא לרדת מהר מדי. אפשר להיות קצת רעב, אבל לא להרעיב את עצמך.'},
  gain:{icon:'',title:'מסה נקייה',short:'לעלות במשקל, בעיקר שריר',what:'אוכלים קצת יותר ממה שהגוף שורף, כדי שיהיה לגוף חומר לבנות שריר.',how:'עודף קטן = רוב העלייה היא שריר. עודף גדול לא בונה יותר שריר, רק מוסיף שומן.',expect:'עלייה איטית במשקל. כדאי למדוד היקף טבור פעם בשבוע.',must:'אימוני כוח עם התקדמות, וחלבון כל יום.'},
  recomp:{icon:'',title:'שריר + ירידה בשומן',short:'לבנות שריר ולהוריד שומן, בלי שהמשקל יזוז הרבה',what:'אוכלים טיפה מתחת למה שהגוף שורף. המשקל כמעט לא זז, אבל הגוף משתנה.',how:'מתאים במיוחד למי שמתחיל להתאמן או חוזר אחרי הפסקה.',expect:'תהליך איטי. מסתכלים על היקף טבור, כוח באימונים ומראה, לא רק על המשקל.',must:'אימוני כוח קבועים וחלבון גבוה.'},
  maintain:{icon:'',title:'שמירה',short:'להישאר באותו משקל',what:'אוכלים בערך מה שהגוף שורף.',how:'המשקל נשאר יציב, ושומרים על הכושר.',expect:'משקל יציב, עם תנודות קטנות.',must:'להמשיך להתאמן ולאכול מספיק חלבון.'}};
const PCT={lose:{slow:-.10,normal:-.15,fast:-.20},gain:{slow:.03,normal:.05,fast:.08},recomp:{slow:-.02,normal:-.05,fast:-.08},maintain:{slow:0,normal:0,fast:0}};
const RATES=[['slow','איטי'],['normal','מתון'],['fast','מהיר']];
const WHY={lose:'מתון מספיק מהר כדי לראות שינוי, ומספיק לאט כדי לשמור על השריר בלי להיות רעב כל הזמן.',gain:'מתון בונה שריר כמעט באותו קצב כמו מהיר, אבל עם הרבה פחות שומן.',recomp:'מתון נותן לגוף מספיק אוכל לבנות שריר, ועדיין להוריד שומן לאט.'};
const CARK=[['walk','הליכה מהירה'],['tread','הליכון'],['bike','אופניים'],['ell','אליפטיקל'],['row','חתירה'],['swim','שחייה'],['stairs','מדרגות']];
const CALS={apple:'אפל (iCloud)',google:'Google Calendar',other:'סמסונג / Outlook / אחר'};
const HOLS={jewish:'יהודיים',muslim:'מוסלמיים',christian:'נוצריים',civil:'לועזיים'};
const COOK=[['s','ספריי','כמעט בלי שמן'],['k','קצת','כפית בסלט'],['r','בינוני','כף במחבת'],['g','הרבה','מטוגן'],['v','משתנה','כל יום אחרת']];
const STEPS=['פרטים','מטרה','היום','אימונים','תזונה','ארוחות','סיכום'];

let Q=null;
const sec=s=>{const m=String(s||'').trim().match(/^(\d{1,2})[:.](\d{1,2})$/);return m?(+m[1])*60+(+m[2]):null};
const guided=d=>d.want.includes('run')&&d.runMode&&d.runMode!=='self';
function runsPW(d){if(!d.want.includes('run'))return 0;if(!guided(d))return 2;return Math.max(1,Number(d.runsGoal)||2)}
function strPW(d){if(!d.want.includes('str'))return 0;return d.strGoal}
function carPW(d){return d.want.includes('car')?d.carGoal:0}
function weekDays(d){const R=runsPW(d),C=carPW(d);return window.FPW?FPW.build(strPW(d),R,C,(Number(d.runNow)||0)>=3&&R>=2?1:0,C>=2?1:0):[[],[],[],[],[],[],[]]}
function profileOf(d){
  const days=Math.min(6,strPW(d)+carPW(d)+runsPW(d));const dur=d.want.includes('str')?d.durS:d.want.includes('car')?d.carDur:40;
  const stepsAdj={low:-100,mid:0,high:150}[d.steps]||0;
  return{name:String(d.name||'').trim(),sex:d.sex,age:Number(d.age),height:Number(d.height),weight:Number(d.weight),job:d.job,days,duration:[30,40,50].includes(dur)?dur:40,
    place:'gym',experience:d.strNow>=2?'regular':'beginner',equipment:'dumbbells',goal:d.goal,rate:d.goal==='maintain'?'normal':d.rate,focus:[],
    trainType:[d.want.includes('str')?'strength':'',d.want.includes('car')?'cardio':'',d.want.includes('run')?'run':''].filter(Boolean).join(','),
    medical:false,adj:stepsAdj,adjP:0,targetMode:'calculated',steps:d.steps,want:d.want.slice(),strNow:d.strNow,strGoal:strPW(d),carNow:d.carNow,carGoal:carPW(d),carDur:d.carDur,carKinds:d.carKinds.slice(),
    runMode:d.want.includes('run')?d.runMode:'',runNow:Number(d.runNow)||0,runsNow:d.runsNow,paceNow:d.paceNow,runGoalKm:Number(d.runGoalKm)||0,paceGoal:d.paceGoal,runsPW:runsPW(d),
    targetWeight:Number(d.tw)>0?Number(d.tw):'',diet:d.diet,no:d.no.slice(),meals:d.meals,cook:d.cook,updated:new Date().toISOString().slice(0,10)}}
function targets(d){try{return calculateTargets_(profileOf(d))}catch(e){return null}}

/* ---------- open ---------- */
const oldOpen=openOnboarding;
openOnboarding=function(first){
  if(Q&&!$('onbSheet').classList.contains('hide')){render(true);return}
  const p=getProfile()||{},s=state.data&&state.data.settings||{};
  const fresh=!!first&&!(state.data&&state.data.meals&&Object.values(state.data.meals).flat().some(m=>m.isCustom));
  let hol=['jewish'];try{const h=String(s.holidays||'');if(h&&h!=='none')hol=h.split(',').filter(k=>HOLS[k])}catch(_){}
  let cals=[];try{cals=JSON.parse(LS.get('fp2.calKinds')||'[]')}catch(_){}
  Q={first:!!first,menu:fresh,step:0,saving:false,sets:null,prev:null,cmp:0,changes:2,loadT:[],milkOpen:false,
    d:{name:personalName(),sex:p.sex||'',age:p.age||'',height:p.height||'',weight:p.weight||'',goal:p.goal||'recomp',rate:p.rate||'normal',steps:p.steps||'mid',
      job:p.job||'desk',want:Array.isArray(p.want)?p.want.slice():['str'],strNow:p.strNow!=null?p.strNow:0,strGoal:p.strGoal||p.days||3,durS:[30,40,50].includes(Number(p.duration))?Number(p.duration):40,
      carNow:p.carNow||0,carGoal:p.carGoal||2,carDur:p.carDur||30,carKinds:Array.isArray(p.carKinds)?p.carKinds.slice():['ell'],
      runMode:p.runMode||'',runNow:p.runNow||'',runsNow:p.runsNow||0,paceNow:p.paceNow||'',runGoalKm:p.runGoalKm||5,tw:p.targetWeight||'',paceGoal:p.paceGoal||'',runsGoal:p.runsPW||2,wplan:(()=>{try{const w=JSON.parse(prop('WEEK_PLAN')||'null');return w?(w.plan||(w.mode==='F'?'none':'fixed')):'fixed'}catch(_){return 'fixed'}})(),ask:'ci',dpick:'app',edited:0,days:(()=>{try{const w=JSON.parse(prop('WEEK_PLAN')||'null');return w&&Array.isArray(w.days)&&w.days.length===7&&w.days.some(x=>x.length)?w.days.map(x=>x.slice()):null}catch(_){return null}})(),
      diet:p.diet||'all',no:Array.isArray(p.no)?p.no.slice():[],prod:null,bread:['whole','crisp'],milk:'reg',meals:p.meals||'3f',free:250,
      cook:String(s.oil_profile||'')||'k',cal:cals.length?cals:[/iPhone|iPad|Mac/.test(navigator.userAgent)?'apple':'google'],hol,shab:null,shabPick:['fri','satB']}};
  /* keep the old state.onb alive for code that still reads it */
  state.onb={first:!!first,d:Q.d,step:0,saving:false,preserveExisting:!first};
  document.documentElement.classList.add('onboarding-mode');$('onbSheet').classList.remove('hide');render();
};
window.fpQOldOnboarding=oldOpen;
const order=()=>Q.menu?['det','goal','day','train','diet','prod','meals','load','menu','cmp','sum']:['det','goal','day','train','diet','prod','meals','sum'];
const GROUP={det:0,goal:1,day:2,train:3,diet:4,prod:4,meals:5,load:5,menu:5,cmp:5,sum:6};

/* ---------- small builders ---------- */
const isOn=(k,v)=>Array.isArray(Q.d[k])?Q.d[k].includes(v):Q.d[k]===v;
const val=v=>typeof v==='string'?`'${v}'`:v;
const ch=(k,v,l,s,cls)=>`<button type="button" class="onb-choice${cls?' '+cls:''}${isOn(k,v)?' selected':''}" aria-pressed="${isOn(k,v)}" onclick="fpQ.set('${k}',${val(v)})">${l}${s?`<small>${s}</small>`:''}</button>`;
const chc=(k,v,l,s)=>`<button type="button" class="onb-choice col${isOn(k,v)?' selected':''}" aria-pressed="${isOn(k,v)}" onclick="fpQ.set('${k}',${val(v)})"><span>${l}${s?`<small>${s}</small>`:''}</span></button>`;
const tg=(k,v,l,cls)=>`<button type="button" class="onb-choice${cls?' '+cls:''}${Q.d[k].includes(v)?' selected':''}" aria-pressed="${Q.d[k].includes(v)}" onclick="fpQ.tog('${k}','${v}')">${l}</button>`;
const stp=(k,min,max,l,s)=>`<div class="fpq-row"><span>${l}${s?`<br><small class="muted">${s}</small>`:''}</span><span class="fpq-step"><button type="button" aria-label="פחות" onclick="fpQ.inc('${k}',-1,${min},${max})">−</button><b>${Q.d[k]}</b><button type="button" aria-label="יותר" onclick="fpQ.inc('${k}',1,${min},${max})">+</button></span></div>`;
const inp=(k,l,ph,mode)=>`<div class="field"><label for="fpq_${k}">${l}</label><input id="fpq_${k}" inputmode="${mode||'decimal'}" value="${esc(Q.d[k])}" placeholder="${ph||''}" oninput="fpQ.type('${k}',this.value)"></div>`;

/* ---------- screens ---------- */
function bmiHtml(){const d=Q.d,w=+d.weight,h=+d.height;const b=w&&h?w/((h/100)**2):0;const t=!b?'':b<18.5?'מתחת לטווח התקין':b<25?'בטווח התקין':b<30?'מעל הטווח התקין':'הרבה מעל הטווח';
  return `<div class="fpq-bmi"><span>BMI<br><small class="muted">${t}</small></span><b>${b?b.toFixed(1):'–'}</b></div>`}
function runLive(){
  const d=Q.d;if(!guided(d))return'';let h='';
  const gp=sec(d.paceGoal),now=sec(d.paceNow);
  if(gp!=null&&gp<150)return h+`<div class="fpq-warn"><b>הקצב לא אפשרי.</b> אף אחד לא רץ קילומטר מהר מ-2:30. תכתוב יעד אחר.</div>`;
  /* 2.23: the number of runs is checked with everything else (loadWarn); here only a goal pace 20% faster */
  if(gp&&now&&(now-gp)/now>.2)h+=`<div class="fpq-warn"><b>שים לב:</b> קצב היעד מהיר ב-20% ומעלה מהקצב שלך היום. זה לוקח חודשים. אפשר, רק בהדרגה.</div>`;
  return h;
}
/* 2.23: the days of the weekly plan, inside the questionnaire: "אני בוחר" (an empty week) or "תציע לי" (the app fills it), and every day can be changed */
const TT={s:'כוח',r:'ריצה',c:'אירובי'},TC={s:'#D7F36B',r:'#7CC4FF',c:'#FFB86B'};
const wantT=d=>[['s','str'],['r','run'],['c','car']].filter(([,k])=>d.want.includes(k)).map(([t])=>t);
function planDays(d){if(!Array.isArray(d.days)||d.days.length!==7){d.days=d.dpick==='me'?[[],[],[],[],[],[],[]]:weekDays(d)}const wt=wantT(d);d.days=d.days.map(x=>x.filter(t=>wt.includes(t)));return d.days}
function daysPicker(d){const days=planDays(d),wt=wantT(d),L=window.FPW?FPW.label(days,(Number(d.runNow)||0)>=3&&runsPW(d)>=2?1:0,carPW(d)>=2?1:0):{hard:[]};
  const cnt={s:0,r:0,c:0};days.forEach(x=>x.forEach(t=>cnt[t]++));const goal={s:strPW(d),r:runsPW(d),c:carPW(d)};
  const diff=wt.filter(t=>cnt[t]!==goal[t]);
  return `<label style="margin-top:12px;display:block">${d.wplan==='weekly'?'הימים של השבוע הזה':'הימים הקבועים'}</label>
    <div class="fpq-seg" role="group"><button type="button" class="${d.dpick!=='me'?'on':''}" onclick="fpQ.dpick('app')">תציע לי</button><button type="button" class="${d.dpick==='me'?'on':''}" onclick="fpQ.dpick('me')">אני בוחר</button></div>
    <div style="display:grid;gap:6px">${days.map((x,i)=>`<div style="display:grid;grid-template-columns:30px 1fr 40px;gap:8px;align-items:center"><b style="color:var(--muted,#A3ADB8);font-size:13px">${['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳'][i]}</b><div class="onb-options" style="margin:0;gap:6px;flex-wrap:wrap">${wt.map(t=>`<button type="button" class="onb-choice chip${x.includes(t)?' selected':''}" aria-pressed="${x.includes(t)}" onclick="fpQ.day(${i},'${t}')" style="min-height:34px;padding:5px 11px"><i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${TC[t]};margin-inline-end:5px"></i>${TT[t]}</button>`).join('')}</div><span style="font-size:11px;color:${L.hard[i]?'#FF8A80':'#6B7682'}">${!x.length?'מנוחה':L.hard[i]?'חזק':''}</span></div>`).join('')}</div>
    <p class="muted" style="margin:8px 0 0;font-size:12.5px">${diff.length?'בחרת '+wt.map(t=>cnt[t]+' '+TT[t]).join(' · ')+'. בשמירה, מספר האימונים בשבוע יתעדכן לפי הימים שבחרת.':'לחיצה על יום מוסיפה או מורידה. אפשר יותר מאחד ביום.'}</p>`}
/* 2.23: one warning for the whole week together: strength + runs + cardio, and what you do today */
function loadWarn(d){const wt=wantT(d),S=strPW(d),R=runsPW(d),C=carPW(d),tot=S+R+C;
  const now={s:wt.includes('s')?Number(d.strNow)||0:0,r:wt.includes('r')?(d.runMode==='zero'?0:Number(d.runsNow)||0):0,c:wt.includes('c')?Number(d.carNow)||0:0},goal={s:S,r:R,c:C},tot0=now.s+now.r+now.c;
  const fresh=wt.filter(t=>!now[t]),out=[];
  const days=d.wplan!=='none'&&Array.isArray(d.days)?d.days:null,noRest=days&&days.every(x=>x.length);
  if(tot>=7)out.push(`<b>${tot} אימונים בשבוע.</b> זה הרבה. הגוף מתחזק בזמן המנוחה, ובלי ימי מנוחה גדל הסיכון לפציעה. כדאי לפחות יום מנוחה אחד, עדיף שניים.`);
  else if(noRest)out.push(`<b>אין יום מנוחה בשבוע.</b> כדאי לפחות יום אחד בלי אימון.`);
  if(fresh.length>=2&&fresh.some(t=>goal[t]>1))out.push(`<b>אתה מתחיל מאפס ${fresh.map(t=>TT[t]).join(' וגם ')}.</b> לגוף לוקח זמן להתרגל, והמאמצים מצטברים גם כשהם שונים. ההמלצה: להתחיל באחד מכל סוג בשבוע, ולהוסיף אחרי 3–4 שבועות.<button type="button" class="btn light full" style="margin-top:8px" onclick="fpQ.easy()">לקחת את ההצעה: אחד מכל סוג</button>`);
  else if(fresh.length===1){const t=fresh[0];if(goal[t]>=3)out.push(`<b>${goal[t]} ${TT[t]} בשבוע, מאפס.</b> זה הרבה להתחלה. עדיף 1–2 בשבוע בחודש הראשון.`)}
  if(!out.length&&tot>=tot0+3)out.push(`<b>שים לב:</b> זה ${tot-tot0} אימונים בשבוע יותר ממה שאתה עושה היום. אפשר, רק להתחיל בעדינות.`);
  return out.length?`<div class="fpq-warn">${out.join('<br><br>')}<p style="margin:8px 0 0;font-size:12.5px;color:#A3ADB8">אפשר להמשיך בכל זאת. זו רק המלצה.</p></div>`:''}
let WSEEN='';
function warnPop(html){const sig=html.replace(/<[^>]+>/g,'').slice(0,200);if(!html){WSEEN='';return}if(sig===WSEEN)return;WSEEN=sig;
  const old=document.getElementById('fpqWarnPop');if(old)old.remove();
  document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="fpqWarnPop" style="z-index:2147483000" onclick="if(event.target===this)this.remove()"><div class="sheet" style="direction:rtl"><h3 style="margin:0 0 8px;display:flex;gap:8px;align-items:center"><svg viewBox="0 0 24 24" style="width:22px;height:22px;stroke:#F09595;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round"><path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17.2v.3"/></svg>שים לב</h3>${html.replace('class="fpq-warn"','class="fpq-warn" style="background:rgba(240,149,149,.1);border:1px solid rgba(240,149,149,.45);border-radius:14px;padding:10px 12px;line-height:1.6"')}<button type="button" class="btn full" style="margin-top:10px" onclick="document.getElementById('fpqWarnPop').remove()">הבנתי</button></div></div>`);
  const b=document.querySelector('#fpqWarnPop button[onclick="fpQ.easy()"]');if(b)b.setAttribute('onclick',"document.getElementById('fpqWarnPop').remove();fpQ.easy()")}
function trainHtml(){
  const d=Q.d,w=d.want;let h=`<h2>איך אתה רוצה להתאמן?</h2><p class="onb-intro">בחר מה מעניין אותך. אפשר כמה. מה שתבחר ייפתח למטה.</p>
    <div class="onb-options">${tg('want','str','כוח')}${tg('want','car','אירובי')}${tg('want','run','ריצה')}</div>`;
  if(!w.length)return h+`<div class="fpq-good">לא בחרת אימונים, וזה בסדר. נתמקד באוכל, ואפשר להוסיף אימונים מתי שרוצים.</div>`;
  if(w.includes('str')){const rec=d.goal==='gain'?50:40;const T={30:'גוף מלא, 4–5 תרגילים. טוב לימים עמוסים.',40:'5–6 תרגילים, עם מנוחות נוחות.',50:'6–7 תרגילים, הכי טוב לבניית שריר.'};
    h+=`<div class="onb-panel"><b style="display:block;margin-bottom:6px">כוח</b>${stp('strNow',0,7,'כמה אתה מתאמן היום?','בשבוע')}${stp('strGoal',1,6,'כמה תרצה להתאמן?','היעד שלך בשבוע')}
      <div class="field" style="margin-top:12px"><label>כמה זמן כל אימון?</label><div class="onb-options">${[30,40,50].map(v=>ch('durS',v,v+' דק׳'+(v===rec?' · מומלץ':''))).join('')}</div><p class="muted" style="margin:4px 0 0">${T[d.durS]} מומלץ לך: ${rec} דק׳</p></div></div>`}
  if(w.includes('car'))h+=`<div class="onb-panel"><b style="display:block;margin-bottom:6px">אירובי</b>${stp('carNow',0,7,'כמה אתה עושה היום?','בשבוע')}${stp('carGoal',1,6,'כמה תרצה?','בשבוע')}
      <div class="field" style="margin-top:12px"><label>מה אתה אוהב? (אפשר כמה)</label><div class="onb-options">${CARK.map(([k,l])=>tg('carKinds',k,l,'chip')).join('')}</div></div>
      <div class="field"><label>כמה זמן כל אימון?</label><div class="onb-options">${[30,40,50].map(v=>ch('carDur',v,v+' דק׳'+(v===30?' · מומלץ':''))).join('')}</div></div>
      <p class="muted" style="margin:0">${d.carNow<2?'תקבל תוכנית למתחילים: קודם מאריכים את הזמן, ומשבוע 5 מוסיפים קטעים חזקים קצרים.':d.carNow<4?'תקבל תוכנית ממשיכים: אימון קטעים אחד בשבוע, והשאר קל.':'תקבל תוכנית 4×4: פעמיים בשבוע, ו-1–2 אימונים קלים ארוכים.'}</p></div>`;
  if(w.includes('run')){
    h+=`<div class="onb-panel"><b style="display:block;margin-bottom:6px">ריצה</b><label>איך אתה רוצה לרוץ?</label><div class="fpq-grid">${chc('runMode','zero','מתחיל מ-0')}${chc('runMode','runs','כבר רץ, תדריך אותי')}${chc('runMode','self','אני בונה לבד')}</div>`;
    if(d.runMode==='runs')h+=`<label style="margin-top:14px;display:block;font-weight:700">איפה אתה היום?</label><label style="margin-top:6px">כמה אתה רץ היום, הכי הרבה?</label><div class="onb-options">${[3,5,7,10,12,15,20].map(k=>`<button type="button" class="onb-choice chip${String(d.runNow)===String(k)?' selected':''}" onclick="fpQ.set('runNow','${k}')">${k} ק״מ</button>`).join('')}</div>
      <div class="onb-fields">${inp('runNow','או כתוב (ק״מ)','למשל 4')}${inp('paceNow','קצב נוח לך (דק׳ לק״מ)','6:00','text')}</div>${stp('runsNow',0,7,'כמה פעמים בשבוע אתה רץ היום?','')}`;
    if(d.runMode==='zero')h+=`<div class="onb-fields" style="margin-top:10px">${inp('paceNow','באיזה קצב נוח לך לרוץ? (לא חובה)','6:30','text')}</div><p class="muted" style="margin:0">לא יודע? נתחיל בקצב קל ונכוון לפי הריצות הראשונות.</p>`;
    if(guided(d))h+=`<label style="margin-top:18px;display:block;font-weight:700">${d.runMode==='runs'?'ומה אתה רוצה?':'מה המטרה?'}</label><label style="margin-top:6px">לאן תרצה להגיע?</label><div class="onb-options">${[3,5,7,10,12,15,21.1].map(k=>`<button type="button" class="onb-choice chip${String(d.runGoalKm)===String(k)?' selected':''}" onclick="fpQ.set('runGoalKm','${k}')">${k===21.1?'חצי מרתון':k+' ק״מ'}</button>`).join('')}</div>
      <div class="onb-fields">${inp('runGoalKm','או כתוב (ק״מ)','')}${inp('paceGoal','קצב יעד לק״מ (לא חובה)','למשל 5:00','text')}</div>${stp('runsGoal',1,5,'כמה ריצות בשבוע תרצה?','2 זה הכי נכון להתחלה')}<div id="fpqLive">${runLive()}</div>`;
    if(d.runMode==='self')h+=`<p class="muted" style="margin:8px 0 0">אין תוכנית. רושמים ריצות מתי שרוצים.</p>`;
    h+=`</div>`}
  if(w.length&&window.FPW){const S=strPW(d),R=runsPW(d),Cc=carPW(d);
    const DN=['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'],ci=(()=>{try{return checkinDay()}catch(_){return 5}})();
    h+=`<div class="onb-panel"><b style="display:block;margin-bottom:6px">תוכנית שבועית</b><div class="fpq-row"><span>בשבוע</span><b>${[S?S+' כוח':'',R?R+' ריצה':'',Cc?Cc+' אירובי':''].filter(Boolean).join(' · ')}</b></div>
      <p class="muted" style="margin:6px 0">לקבוע מראש איזה יום מה? זה עוזר להתמיד.</p>
      <div class="fpq-grid">${chc('wplan','none','בלי תוכנית','כל יום מה שמתאים לך')}${chc('wplan','weekly','משתנה','כל שבוע בוחרים את הימים מחדש, עם תזכורת')}${chc('wplan','fixed','קבועה','אותם ימים כל שבוע')}</div>
      ${d.wplan==='weekly'?`<label style="margin-top:12px">באיזה יום לשאול אותך על השבוע הבא?</label><div class="onb-options">${[['ci','ביום הצ׳ק-אין ('+DN[ci]+')']].concat(DN.map((n,i)=>[i,n])).map(([k,l])=>`<button type="button" class="onb-choice chip${String(d.ask)===String(k)?' selected':''}" onclick="fpQ.set('ask',${typeof k==='number'?k:"'ci'"})">${l}</button>`).join('')}</div>`:''}
      ${d.wplan==='none'?'':daysPicker(d)}
      <p class="muted" style="margin:6px 0 0;font-size:12px;color:#6B7682">ניתן לשינוי בהגדרות</p></div>`;
    /* 2.23.1: the warning pops up when a limit is crossed, and does not stay on the screen */
    const lw=loadWarn(d);setTimeout(()=>warnPop(lw),0)}
  const t=targets(d);if(t)h+=`<div class="onb-info"><b>יעד יומי לפי האימונים: ${t.cal.toLocaleString('he-IL')} קלוריות</b><p>קבוע כל יום. האימונים מחולקים על כל השבוע.</p></div>`;
  return h;
}
function mealsHtml(S){const t=targets(Q.d)||{};
  const chosen=S.map(m=>m.opts[m.sel]);const tot=chosen.reduce((s,m)=>s+m.kc,0)+(Q.d.meals==='3f'?Q.d.free:0),pr=chosen.reduce((s,m)=>s+m.p,0);
  return `<div class="onb-info" style="display:flex;justify-content:space-between"><span>יום לדוגמה<br><b>${tot.toLocaleString('he-IL')} קל׳</b></span><span class="muted" style="text-align:left">יעד ${(t.cal||0).toLocaleString('he-IL')}<br>חלבון ${pr} / ${t.prot||'—'} ג׳</span></div>`+
  S.map((m,mi)=>{const o=m.opts[m.sel],K=FPM.KIND[o.kind];return `<div class="fpq-meal"><div class="h"><b>${m.name}</b><span class="fpq-tag ${K[1]}">${K[0]}</span></div>
    <div class="fpq-seg" role="group" aria-label="אפשרויות ל${m.name}">${m.opts.map((_,i)=>`<button type="button" class="${i===m.sel?'on':''}" onclick="fpQ.opt(${mi},${i})">${i+1}</button>`).join('')}</div>
    <div style="font-weight:700;margin:2px 0 4px">${esc(o.t)}</div>${o.lines.map(l=>`<div class="fpq-it"><span>${esc(l.f.n)}</span><span>${esc(FPM.amount(l))}</span></div>`).join('')}
    <div class="muted" style="font-size:13px;margin-top:2px">${o.kc} קל׳ · ${o.p} ג׳ חלבון</div></div>`}).join('')+
  (Q.d.meals==='3f'?`<div class="fpq-meal" style="border-style:dashed"><div class="h"><b>קלוריות חופשיות</b><b style="color:var(--brand,#D7F36B)">${Q.d.free}</b></div><div class="muted" style="font-size:13px">למה שבא לך: חטיף, קפה, משהו מתוק. משנים בהגדרות.</div></div>`:'');
}
function screen(id){
  const d=Q.d;
  if(id==='det')return `<h2>נתחיל מהבסיס</h2><p class="onb-intro">ככה נחשב כמה אתה צריך לאכול ביום.</p><div class="onb-panel">
    <div class="field"><label>מין לצורך החישוב</label><div class="onb-options">${ch('sex','m','גבר')}${ch('sex','f','אישה')}</div></div>
    <div class="onb-fields">${inp('age','גיל (שנים)','')}${inp('height','גובה (ס״מ)','')}${inp('weight','משקל (ק״ג)','')}</div><div id="fpqBmi">${bmiHtml()}</div></div>`;
  if(id==='goal'){const g=GOALS[d.goal];return `<h2>מה המטרה שלך?</h2><p class="onb-intro">אפשר לשנות מתי שרוצים בהגדרות.</p><div class="fpq-grid">${Object.keys(GOALS).map(k=>chc('goal',k,GOALS[k].icon+' '+GOALS[k].title,GOALS[k].short)).join('')}</div>
    <div class="onb-panel" style="margin-top:14px"><b style="display:block;margin-bottom:6px">${g.icon} ${g.title}</b><p style="margin:0 0 6px"><b>מה זה:</b> ${g.what}</p><p style="margin:0 0 6px"><b>איך זה עובד:</b> ${g.how}</p><p style="margin:0 0 6px"><b>למה לצפות:</b> ${g.expect}</p><p style="margin:0"><b>חשוב:</b> ${g.must}</p>
    ${d.goal==='maintain'?'':`<label style="margin-top:14px">באיזה קצב?</label><div class="fpq-grid">${RATES.map(([r,l])=>{const save=d.rate;d.rate=r;const t=targets(d);d.rate=save;const m=t?Math.round(t.weeklyChange*4.3*10)/10:0;const pc=PCT[d.goal][r];
      return chc('rate',r,`${l}${r==='normal'?' · מומלץ':''} · ${pc>0?'+':''}${Math.round(pc*100)}%`,t?`${m>0?'עלייה':'ירידה'} של כ-${Math.abs(m).toFixed(1)} ק״ג בחודש`:'')}).join('')}</div><p class="muted" style="margin:8px 0 0">למה מתון? ${WHY[d.goal]}</p>`}</div>${d.goal==='lose'||d.goal==='gain'?`<div class="onb-panel" style="margin-top:10px">${inp('tw','משקל יעד (לא חובה)','למשל '+(d.goal==='lose'?Math.max(40,Math.round((Number(d.weight)||80)-8)):Math.round((Number(d.weight)||70)+5)))}<p class="muted" style="margin:4px 0 0">כשתגיע אליו תקבל מדליה.</p></div>`:''}`}
  if(id==='day')return `<h2>איך נראה היום שלך?</h2><p class="onb-intro">בלי האימונים. עליהם נשאל בשלב הבא.</p><div class="onb-panel">
    <label>כמה צעדים ביום, בערך?</label><div class="fpq-grid">${chc('steps','low','פחות מ-7,000','רוב היום בישיבה')}${chc('steps','mid','7,000 עד 10,000','')}${chc('steps','high','יותר מ-10,000','הרבה הליכה')}</div>
    <label style="margin-top:14px">מה סוג העבודה?</label><div class="fpq-grid">${chc('job','desk','בישיבה','משרד, מחשב, נהיגה, שמירה')}${chc('job','feet','בעמידה ובהליכה','מכירות, הוראה, מלצרות')}${chc('job','physical','עבודה פיזית','בנייה, מחסן, שליחויות')}</div>
    <p class="muted" style="margin:10px 0 0">לא יודע כמה צעדים? באפליקציית הבריאות בטלפון.</p></div>`;
  if(id==='train')return trainHtml();
  if(id==='diet')return `<h2>איך אתה אוכל?</h2><p class="onb-intro">כל המוצרים כשרים, והתפריט לא מערבב בשר וחלב.</p><div class="onb-panel">
    <div class="fpq-grid">${chc('diet','all','אוכל הכל')}${chc('diet','veg','צמחוני','בלי בשר ודגים')}${chc('diet','vegan','טבעוני','בלי מוצרים מהחי')}</div>
    <label style="margin-top:14px">יש משהו שאתה לא אוכל?</label><div class="onb-options">${FPM.NO.map(([k,l])=>tg('no',k,l,'chip')).join('')}</div></div>`;
  if(id==='prod'){FPM.use(Object.assign(d,{dayCal:(targets(d)||{}).cal||2000}));const vp=FPM.products(),S=FPM.prodSet();const mk=Object.keys(FPM.MILK).filter(k=>d.diet!=='vegan'||FPM.MILK[k].plant);if(!mk.includes(d.milk))d.milk=mk[0];
    return `<h2>מה אתה אוכל?</h2><p class="onb-intro">סמן מה שיש אצלך בבית. מזה נבנה את התפריט.</p><div class="onb-panel"><div class="onb-options">${vp.map(p=>{const on=S.includes(p.id),nm=d.diet==='vegan'&&p.vn?p.vn:p.n;
      if(p.id==='milk')return `<button type="button" class="onb-choice chip${on?' selected':''}" aria-pressed="${on}" onclick="fpQ.prod('milk')">${nm}</button>${on?`<button type="button" class="onb-choice chip" onclick="fpQ.milk()" aria-expanded="${Q.milkOpen}">${FPM.MILK[d.milk].lab} ▾</button>`:''}`;
      return `<button type="button" class="onb-choice chip${on?' selected':''}" aria-pressed="${on}" onclick="fpQ.prod('${p.id}')">${nm}</button>`}).join('')}</div>
      ${Q.milkOpen&&S.includes('milk')?`<div class="fpq-sub"><b>איזה חלב?</b><div class="onb-options" style="margin-top:6px">${mk.map(k=>`<button type="button" class="onb-choice chip${d.milk===k?' selected':''}" onclick="fpQ.milk('${k}')">${FPM.MILK[k].lab}</button>`).join('')}</div></div>`:''}
      ${S.includes('bread')?`<div class="fpq-sub"><b>איזה לחם?</b><div class="onb-options" style="margin-top:6px">${FPM.P[0].sub.map(([k,l])=>tg('bread',k,l,'chip')).join('')}</div></div>`:''}
      <p class="muted" style="margin:10px 0 0">${d.diet==='all'?'טופו לא מופיע, כי סימנת שאתה אוכל הכל.':d.diet==='veg'?'רק מוצרים צמחוניים.':'רק מוצרים טבעוניים.'}</p></div>`}
  if(id==='meals')return `<h2>כמה ארוחות ביום?</h2><p class="onb-intro">אפשר לשנות בהגדרות, או לכבות ולבנות הכל לבד.</p><div class="onb-panel">
    <div class="fpq-grid">${chc('meals','3','3 ארוחות','בוקר, צהריים, ערב')}${chc('meals','3f','3 ארוחות + קלוריות חופשיות',d.free+' קלוריות למה שבא לך')}${chc('meals','4','4 ארוחות','בוקר, צהריים, ביניים, ערב')}</div>
    <label style="margin-top:14px">איך אתה מבשל?</label><div class="fpq-grid">${COOK.map(([k,l,s])=>chc('cook',k,l,s)).join('')}</div><p class="muted" style="margin:8px 0 0">זו רק ברירת מחדל. אפשר לשנות בכל מנה ובהגדרות.</p></div>`;
  if(id==='load')return `<div class="fpq-load"><div class="fpq-spin" aria-hidden="true"></div><h2>בונה את התוכנית שלך</h2><div class="fpq-ll" id="fpqLL"><div>מחשב כמה אתה שורף במנוחה</div><div>מנתח את הפעילות שלך</div><div>${guided(d)?'בונה תוכנית ריצה':'מכייל חלבון, פחמימות ושומן'}</div><div>בונה תפריט</div></div></div>`;
  if(id==='menu')return `<h2>התפריט הראשוני שלך</h2><div class="fpq-good">זה לא תפריט קבוע. זה תפריט ראשוני שהאפליקציה נותנת לך, כדי שיהיה לך ממה להתחיל. לכל ארוחה יש 4 אפשרויות, וכולן נשמרות אצלך בארוחות הקבועות. אפשר להחליף ארוחות ואת כל התפריט כל יום, מתי שרוצים.</div>${mealsHtml(Q.sets)}`;
  if(id==='cmp')return `<h2>איזה תפריט?</h2><p class="onb-intro">התפריט החדש בנוי מארוחות אחרות. בחר אחד וממשיכים.</p><div class="fpq-seg" role="group"><button type="button" class="${Q.cmp===0?'on':''}" onclick="fpQ.cmp(0)">החדש</button><button type="button" class="${Q.cmp===1?'on':''}" onclick="fpQ.cmp(1)">הקודם</button></div>${mealsHtml(Q.cmp===0?Q.sets:Q.prev)}`;
  if(id==='sum'){const t=targets(d)||{};return `<h2>כמעט סיימנו</h2><div class="onb-panel"><div class="fpq-row"><span>מטרה</span><b>${GOALS[d.goal].title}${d.goal==='maintain'?'':' · '+RATES.find(r=>r[0]===d.rate)[1]}</b></div><div class="fpq-row"><span>יעד יומי</span><b>${(t.cal||0).toLocaleString('he-IL')} קל׳</b></div><div class="fpq-row"><span>חלבון</span><b>${t.prot||'—'} ג׳</b></div>
      <div class="fpq-row"><span>אימונים בשבוע</span><b>${[strPW(d)?strPW(d)+' כוח':'',carPW(d)?carPW(d)+' אירובי':'',runsPW(d)?runsPW(d)+' ריצה':''].filter(Boolean).join(' · ')||'—'}</b></div>${d.meals==='3f'?`<div class="fpq-row"><span>קלוריות חופשיות</span><b>${d.free}</b></div>`:''}</div>
    <b style="display:block;margin:14px 0 8px">עוד 3 שאלות קצרות</b>
    <div class="onb-panel"><label>באיזה יומן אתה משתמש בטלפון? (אפשר כמה)</label><div class="onb-options">${Object.keys(CALS).map(k=>tg('cal',k,CALS[k])).join('')}</div><p class="muted" style="margin:0">חתונה או מסעדה ביומן? האפליקציה תשאל אם לחסוך לזה קלוריות.</p></div>
    <div class="onb-panel"><label>אילו חגים לחגוג באפליקציה? (אפשר כמה)</label><div class="onb-options">${Object.keys(HOLS).map(k=>tg('hol',k,HOLS[k])).join('')}</div><p class="muted" style="margin:0">שבוע לפני חג תישאל אם לשמור לו קלוריות.</p></div>
    <div class="onb-panel"><label>שבת</label><p style="margin:0 0 8px;line-height:1.6">יש לנו אפשרות שהאפליקציה תלמד כמה אתה אוכל בשבת, ותמלא את זה לבד. ככה לא צריך לרשום בשבת, והיא גם חוסכת לזה במהלך השבוע.</p><b>רוצה?</b><div class="onb-options" style="margin-top:6px">${ch('shab',true,'כן')}${ch('shab',false,'לא צריך')}</div>
      ${d.shab===true?`<label style="margin-top:10px">אילו ארוחות?</label><div class="onb-options">${tg('shabPick','friD','שישי')}${tg('shabPick','fri','ערב שבת')}${tg('shabPick','satB','שבת בוקר')}${tg('shabPick','satL','שבת צהריים')}</div>`:''}</div>`}
  return '';
}
function valid(id){const d=Q.d;
  if(id==='det'){if(!['m','f'].includes(d.sex))return 'בחר מין לחישוב';if(!(+d.age>=10&&+d.age<=100))return 'בדוק את הגיל';if(!(+d.height>=120&&+d.height<=230))return 'גובה בס״מ, למשל 174';if(!(+d.weight>=30&&+d.weight<=300))return 'משקל בק״ג, למשל 63'}
  if(id==='train'){if(d.want.includes('run')&&!d.runMode)return 'בחר איך אתה רוצה לרוץ';const gp=sec(d.paceGoal);if(gp!=null&&gp<150)return 'הקצב לא אפשרי. תכתוב יעד אחר';if(d.runMode==='runs'&&!(+d.runNow>0))return 'כמה אתה רץ היום? בחר או כתוב'}
  if(id==='prod'&&!FPM.prodSet().length)return 'סמן לפחות מוצר אחד';
  return '';
}
function render(keep){
  if(!Q)return;const ids=order(),id=ids[Q.step],g=GROUP[id];const body=$('onbBody'),sc=keep&&body?body.scrollTop:0;
  $('onbStepCount').textContent=`שלב ${g+1} מתוך ${STEPS.length}`;
  $('onbProgress').innerHTML=STEPS.map((s,i)=>`<span class="${i===g?'on':i<g?'done':''}" ${i===g?'aria-current="step"':''}>${s}</span>`).join('');
  body.innerHTML='<fieldset '+(Q.saving?'disabled':'')+'>'+screen(id)+'</fieldset>';$('onbError').textContent='';
  if(sc)body.scrollTop=sc;
  const back=Q.step>0&&id!=='load'?`<button class="btn light" ${Q.saving?'disabled':''} onclick="fpQ.back()">חזרה</button>`:(Q.first?'<span></span>':`<button class="btn light" onclick="closeOnboarding()">ביטול</button>`);
  let next;
  if(id==='load')next='';
  else if(id==='menu')next=`<button class="btn light" ${Q.changes?'':'disabled'} onclick="fpQ.change()">החלף תפריט${Q.changes?` (${Q.changes})`:''}</button><button class="btn" onclick="fpQ.toSum()">ממשיכים</button>`;
  else if(id==='cmp')next=`<button class="btn" onclick="fpQ.choose()">בוחר ב${Q.cmp===0?'חדש':'קודם'} וממשיך</button>`;
  else if(id==='sum')next=`<button class="btn" ${Q.saving?'disabled':''} onclick="fpQ.finish()">${Q.saving?'שומר…':Q.first?'סיימתי, בוא נתחיל':'שמור שינויים'}</button>`;
  else next=`<button class="btn" onclick="fpQ.next()">${id==='meals'&&Q.menu?'בנה לי תוכנית':'המשך'}</button>`;
  $('onbNav').innerHTML=id==='load'?'':(id==='menu'?back+next:back+next);
  if(id==='load')loader();
}
function loader(){Q.loadT.forEach(clearTimeout);Q.loadT=[];const rows=[...document.querySelectorAll('#fpqLL div')];if(!rows.length)return;rows[0].className='now';
  rows.forEach((r,i)=>Q.loadT.push(setTimeout(()=>{r.className='ok';if(rows[i+1])rows[i+1].className='now'},650*(i+1))));
  Q.loadT.push(setTimeout(()=>{buildMenu();Q.step=order().indexOf('menu');render()},650*rows.length+350))}
function buildMenu(prev){const t=targets(Q.d)||{cal:2000};FPM.use(Object.assign(Q.d,{dayCal:t.cal}));FPM.reseed();Q.sets=FPM.sets(prev||null)}
function goStep(i){Q.loadT.forEach(clearTimeout);Q.loadT=[];Q.step=i;render();try{$('onbBody').scrollTop=0}catch(_){}}

window.fpQ={
  set(k,v){if(!Q||Q.saving)return;Q.d[k]=v;if(k==='diet'){Q.d.prod=null;Q.d.milk=v==='vegan'?'soy':'reg'}if(k==='runMode'&&v==='zero'){Q.d.runNow=0;Q.d.runsNow=0}if(['runMode','runsGoal','runNow'].includes(k)&&Q.d.dpick!=='me'&&!Q.d.edited)Q.d.days=null;render(true)},
  dpick(v){Q.d.dpick=v;Q.d.edited=0;Q.d.days=v==='me'?[[],[],[],[],[],[],[]]:null;render(true)},
  day(i,t){const d=Q.d;planDays(d);const a=d.days[i],j=a.indexOf(t);if(j>=0)a.splice(j,1);else a.push(t);d.edited=1;render(true)},
  easy(){const d=Q.d;if(d.want.includes('str')&&!Number(d.strNow))d.strGoal=1;if(d.want.includes('car')&&!Number(d.carNow))d.carGoal=1;if(d.want.includes('run')&&d.runMode==='zero')d.runsGoal=1;if(d.dpick!=='me'){d.days=null;d.edited=0}render(true)},
  tog(k,v){const a=Q.d[k];const i=a.indexOf(v);if(i>=0){if(a.length>1||['no','hol','want','carKinds'].includes(k))a.splice(i,1)}else a.push(v);if(k==='no')Q.d.prod=null;if(k==='want'&&Q.d.dpick!=='me'&&!Q.d.edited)Q.d.days=null;render(true)},
  inc(k,dl,mn,mx){Q.d[k]=Math.max(mn,Math.min(mx,(Number(Q.d[k])||0)+dl));if(['strGoal','carGoal','runsGoal'].includes(k)&&Q.d.dpick!=='me'&&!Q.d.edited)Q.d.days=null;render(true)},
  type(k,v){Q.d[k]=v;const b=$('fpqBmi');if(b)b.innerHTML=bmiHtml();const l=$('fpqLive');if(l)l.innerHTML=runLive()},
  prod(id){FPM.use(Q.d);const s=FPM.prodSet();const i=s.indexOf(id);if(i>=0)s.splice(i,1);else s.push(id);Q.d.prod=s;render(true)},
  milk(k){if(k){Q.d.milk=k;Q.milkOpen=false}else Q.milkOpen=!Q.milkOpen;render(true)},
  opt(mi,i){(order()[Q.step]==='cmp'&&Q.cmp===1?Q.prev:Q.sets)[mi].sel=i;render(true)},
  cmp(v){Q.cmp=v;render(true)},
  next(){const ids=order(),id=ids[Q.step];const e=valid(id);if(e){$('onbError').textContent=e;return}goStep(Math.min(ids.length-1,Q.step+1))},
  back(){const ids=order(),id=ids[Q.step];if(id==='menu'||id==='sum'&&Q.menu){goStep(ids.indexOf(id==='menu'?'meals':'menu'));return}if(id==='cmp'){goStep(ids.indexOf('menu'));return}goStep(Math.max(0,Q.step-1))},
  toSum(){goStep(order().indexOf('sum'))},
  change(){if(!Q.changes)return;const old=Q.sets;$('onbBody').insertAdjacentHTML('beforeend','<div class="fpq-load" id="fpqChg" style="min-height:30vh"><div class="fpq-spin"></div>חושב על תפריט אחר…</div>');
    setTimeout(()=>{Q.prev=old;buildMenu(old);Q.changes--;Q.cmp=0;goStep(order().indexOf('cmp'))},900)},
  choose(){if(Q.cmp===1)Q.sets=Q.prev;Q.prev=null;goStep(order().indexOf('sum'))},
  finish
};

/* ---------- save everything, then the tour ---------- */
async function finish(){
  if(!Q||Q.saving)return;const d=Q.d;
  for(const id of ['det','train','prod']){const e=valid(id);if(e){goStep(order().indexOf(id));$('onbError').textContent=e;return}}
  if(!String(d.name||'').trim())d.name=personalName()||'אני';
  const profile=profileOf(d);let t;try{t=calculateTargets_(profile)}catch(e){$('onbError').textContent=e.message;return}
  Q.saving=true;render(true);
  try{
    state.data=await call('saveProfile',{profile,targetMode:'calculated',calorie_goal:t.cal,protein_goal:t.prot});
    const extra={holidays:d.hol.join(',')||'none'};if(d.meals==='3f')extra.free_calories_goal=d.free;
    if(d.shab===false)extra.shabbat_json=JSON.stringify({asked:'onboarding-no'});
    if(d.shab===true)extra.shabbat_json=JSON.stringify({want:true,pick:d.shabPick.length?d.shabPick:['fri','satB']});
    try{state.data=await call('saveSettings',extra)}catch(e){console.warn(e)}
    if(Q.menu&&Q.sets){const meals=[];Q.sets.forEach(m=>{const cat=m.name==='ביניים'?'צהריים':m.name;m.opts.forEach((o,i)=>meals.push({category:cat,name:(m.name==='ביניים'?'ביניים: ':'')+o.t,ingredients:FPM.ingredients(o),first:i===m.sel}))});
      meals.sort((a,b)=>(b.first?1:0)-(a.first?1:0));
      state.data=await call('saveMenuMeals',{meals,hideBuiltin:true,date:state.date})}
    try{if(window.fpSetOilProfile)fpSetOilProfile(d.cook);else await call('saveSettings',{oil_profile:d.cook})}catch(_){}
    LS.set('fp2.calKinds',JSON.stringify(d.cal));if(d.cal[0])LS.set('fp2.calKind',d.cal[0]);
    setProp('MEAL_MODE',d.meals);
    setProp('MENU_PREFS',JSON.stringify({prod:FPM.prodSet(),bread:d.bread,milk:d.milk}));
    /* 2.23: with a weekly plan, the days you set decide how many of each a week */
    if(d.wplan!=='none'&&d.want.length){const dz=planDays(d),n={s:0,r:0,c:0};dz.forEach(x=>x.forEach(t=>n[t]++));if(d.want.includes('str')&&n.s)d.strGoal=n.s;if(d.want.includes('car')&&n.c)d.carGoal=n.c;if(d.want.includes('run')&&n.r&&guided(d))d.runsGoal=n.r}
    setProp('TRAIN_PLAN',JSON.stringify({want:d.want,str:strPW(d),car:carPW(d),run:runsPW(d),durS:d.durS,carDur:d.carDur,carKinds:d.carKinds,carNow:d.carNow,set:new Date().toISOString().slice(0,10)}));
    if(d.want.includes('run'))setProp('RUN_PLAN',JSON.stringify({mode:d.runMode,start:d.runMode==='zero'?0:Number(d.runNow)||0,runsNow:d.runsNow,paceNow:d.paceNow,goal:Number(d.runGoalKm)||5,paceGoal:d.paceGoal,runs:runsPW(d),str:strPW(d),since:state.todayDate||state.date||'',week:1,m3:(Number(d.runNow)||0)>=3}));
    if(d.want.length){const ws=(()=>{const x=new Date((state.todayDate||state.date||new Date().toISOString().slice(0,10))+'T12:00:00');x.setDate(x.getDate()-x.getDay());return x.toISOString().slice(0,10)})(),dz=d.wplan==='none'?weekDays(d):planDays(d);setProp('WEEK_PLAN',JSON.stringify({plan:d.wplan,mode:d.wplan==='none'?'F':'P',days:dz,askDay:d.ask,weeks:d.wplan==='weekly'?{[ws]:dz}:{}}))}
    if(d.want.includes('car')){const n=Number(d.carNow)||0;const td=state.todayDate||state.date||new Date().toISOString().slice(0,10);const ws=new Date(td+'T12:00:00');ws.setDate(ws.getDate()-ws.getDay());setProp('CARDIO_LVL',JSON.stringify({lvl:n>=4?'adv':n>=2?'mid':'beg',since:ws.toISOString().slice(0,10)}))}
    LS.set('fp2.firstDay',state.todayDate||state.date||'');
    saveCachedState();Q.saving=false;const wasFirst=Q.first;Q=null;closeOnboarding();try{applyRole()}catch(_){}renderAll();
    toast(`נשמר: ${t.cal} קלוריות · ${t.prot} ג׳ חלבון`);
    if(wasFirst&&prop('TOUR_DONE')!=='1')setTimeout(()=>{try{showView('today');(window.FP2Tour&&FP2Tour.start)?FP2Tour.start():fpIntro()}catch(e){console.error(e)}},700);
  }catch(e){if(Q){Q.saving=false;render(true);$('onbError').textContent='לא הושלמה כל השמירה: '+e.message+'. אפשר לנסות שוב.'}}
}
/* code that still calls the old renderOnb() while the new questionnaire is open draws the new one */
const oldRender=renderOnb;renderOnb=function(){if(Q)return render(true);return oldRender.apply(this,arguments)};
const oldClose=closeOnboarding;closeOnboarding=function(){if(Q&&Q.saving)return;if(Q){Q.loadT.forEach(clearTimeout);Q=null}return oldClose.apply(this,arguments)};
})();
