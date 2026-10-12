/* FitPro 2.19.0 — medals (only for real milestones; a new record in an exercise gets confetti, not a medal)
   and the weekly summary on Saturday night (the weekly checklist stays on Sunday):
   did you meet your goals (workouts, runs, calories, protein), what improved, new medals,
   "the week was hard?" (runs / workouts / both — with a way to switch the question off),
   and if the workouts goal was missed: "שבוע חריג" or "אני מתאמן פחות, תעדכן". */
(function(){
'use strict';
const prop=k=>{try{return FP2.getProp(k)||''}catch(_){return ''}};
const setProp=(k,v)=>{try{FP2.setProp(k,v)}catch(_){}};
const J=(k,d)=>{try{return JSON.parse(prop(k)||'')||d}catch(_){return d}};
const LS={get(k){try{return localStorage.getItem(k)}catch(_){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(_){}}};
const iso=d=>d.toISOString().slice(0,10);
const D=s=>new Date(s+'T12:00:00');
const addDays=(s,n)=>{const d=D(s);d.setDate(d.getDate()+n);return iso(d)};
const today=()=>state.todayDate||state.date||iso(new Date());
const sunday=x=>{const d=D(x);d.setDate(d.getDate()-d.getDay());return iso(d)};
const mmss=x=>Math.floor(x/60)+':'+String(Math.round(x%60)).padStart(2,'0');
document.head.insertAdjacentHTML('beforeend',`<style id="fp219wcss">
.fpW-stat{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:8px 0}.fpW-stat div{background:#1F262E;border-radius:12px;padding:8px;text-align:center}.fpW-stat b{display:block;font-size:19px}.fpW-stat span{font-size:12.5px;color:var(--muted,#A3ADB8)}
.fpW-up{display:flex;justify-content:space-between;gap:8px;padding:6px 0;border-bottom:1px solid var(--line,#2C3640);font-size:14px}.fpW-up:last-child{border:0}.fpW-up b{color:var(--brand,#D7F36B)}
.fpW-good{background:rgba(215,243,107,.08);border:1px solid rgba(215,243,107,.3);border-radius:14px;padding:12px;margin:8px 0;text-align:center;line-height:1.55}
.fpW-bad{background:rgba(240,149,149,.1);border:1px solid rgba(240,149,149,.45);border-radius:14px;padding:12px;margin:8px 0;line-height:1.55}
.fpW-box{background:var(--card,#171C22);border:1px solid var(--line,#2C3640);border-radius:14px;padding:10px 12px;margin:8px 0}
.fpW-md{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.fpW-md div{background:#1F262E;border:1px solid var(--line,#2C3640);border-radius:14px;padding:10px 6px;text-align:center;font-size:12.5px;line-height:1.35}
.fpW-md .off{color:var(--muted,#A3ADB8)}
</style>`);
function sheet(id,title,body){let s=$(id);if(s)s.remove();document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="${id}"><div class="sheet" style="max-height:92vh;overflow:auto"><div class="sheet-head"><h3 style="margin:0">${title}</h3><button type="button" class="trash" aria-label="סגור" onclick="document.getElementById('${id}').remove()">✕</button></div>${body}</div></div>`)}

/* ---------- data ---------- */
const settingsNum=(k,d)=>{const v=Number(state.data&&state.data.settings&&state.data.settings[k]);return v>0?v:d};
const profile=()=>{try{return JSON.parse(state.data.settings.profile_json||'null')||{}}catch(_){return {}}};
const sessions=()=>((state.data&&state.data.workout&&state.data.workout.sessions)||[]);
const history=()=>((state.data&&state.data.workout&&state.data.workout.history)||[]);
const isCardio=s=>s.type==='אירובי'||/^ריצה$|^אירובי$/.test(s.name||'');
const strSessions=()=>sessions().filter(s=>!isCardio(s)&&(s.items||[]).length);
function bestByExercise(before){const m={};history().forEach(h=>{if(before&&h.date>=before)return;(h.sets||[]).forEach(s=>{const w=Number(s.weight)||0;if(w>0&&(!m[h.exercise]||w>m[h.exercise]))m[h.exercise]=w})});return m}
function tonnage(){let t=0;history().forEach(h=>(h.sets||[]).forEach(s=>{t+=(Number(s.weight)||0)*(Number(s.reps)||0)}));return t}

/* ---------- medals ---------- */
const MEDALS=[
 ['run1','','ריצה ראשונה','רושמים ריצה ראשונה באפליקציה.'],['run1k','','1 ק״מ בלי לעצור','הריצה הרצופה הראשונה.'],['run3','','3 ק״מ בלי לעצור','פותח פרטלק, עליות ואינטרוולים.'],
 ['run5','','5 ק״מ','המרחק הקלאסי הראשון.'],['run7','','7 ק״מ','בדרך ל-10.'],['run10','','10 ק״מ','פותח קטעי אינטרוולים ארוכים.'],['run12','','12 ק״מ','ריצה ארוכה ראשונה מעל 10.'],['run15','','15 ק״מ','בדרך לחצי מרתון.'],['run21','','חצי מרתון','21.1 ק״מ.'],['run42','','מרתון','42.2 ק״מ.'],
 ['sub30','','5 ק״מ מתחת ל-30 דק׳','קצב 6:00 לק״מ.'],['sub25','','5 ק״מ מתחת ל-25 דק׳','קצב 5:00 לק״מ.'],
 ['km50','','50 ק״מ בסך הכל','כל הריצות ביחד.'],['km100','','100 ק״מ',''],['km250','','250 ק״מ',''],['km500','','500 ק״מ',''],['km1000','','1,000 ק״מ',''],['shoe','','זוג נעליים ראשון ״נגמר״','550 ק״מ על אותן נעליים.'],
 ['w25','','25 אימונים','בערך חודשיים.'],['w100','','100 אימונים',''],['w200','','200 אימונים',''],['w500','','500 אימונים',''],
 ['bwsq','','סקוואט עם משקל הגוף שלך',''],['bwbp','','לחיצת חזה עם משקל הגוף שלך',''],['pull10','','10 מתחים ברצף',''],
 ['s4','','4 שבועות ברצף','4 שבועות שבהם עשית את כל האימונים והריצות שתכננת.'],['s12','','12 שבועות ברצף',''],['s26','','חצי שנה ברצף',''],['s52','','שנה ברצף',''],
 ['log30','','30 יום ברצף של רישום','רשמת אוכל כל יום, חודש שלם.'],['log100','','100 יום ברצף של רישום',''],
 ['prot30','','חודש שלם ביעד החלבון','30 ימים ברצף שהגעת לחלבון.'],['cal30','','חודש שלם ביעד הקלוריות','רוב הימים בחודש בתוך היעד.'],
 ['c50','','50 שעות אירובי','כל דקות האירובי ביחד.'],['c100','','100 שעות אירובי',''],['c150','','חודש של 150 דקות כל שבוע','4 שבועות ברצף, 150 דקות אירובי ומעלה.'],
 ['goalw','','הגעת ליעד המשקל','המשקל הממוצע בשבוע הגיע ליעד.'],['waist5','','5 ס״מ פחות בהיקף הטבור','מהמדידה הראשונה.']];
function earned(){
  const got={},log=J('RUN_LOG',[]),ok=log.filter(r=>r.ok),maxOk=ok.reduce((m,r)=>Math.max(m,Number(r.km)||0),0),km=log.reduce((s,r)=>s+(Number(r.km)||0),0);
  if(log.length)got.run1=1;if(maxOk>=1)got.run1k=1;if(maxOk>=3)got.run3=1;[[5,'run5'],[7,'run7'],[10,'run10'],[15,'run15'],[21,'run21']].forEach(([k,id])=>{if(maxOk>=k)got[id]=1});
  log.forEach(r=>{if(Number(r.km)>=5&&r.s){if(r.s<=1800)got.sub30=1;if(r.s<=1500)got.sub25=1}});
  [[50,'km50'],[100,'km100'],[250,'km250'],[500,'km500'],[1000,'km1000']].forEach(([k,id])=>{if(km>=k)got[id]=1});
  const n=strSessions().length;[[1,'w1'],[25,'w25'],[50,'w50'],[100,'w100'],[200,'w200'],[500,'w500']].forEach(([k,id])=>{if(n>=k)got[id]=1});
  const t=tonnage();if(t>=10000)got.t10=1;if(t>=100000)got.t100=1;
  const bw=Number(profile().weight)||0,best=bestByExercise();if(bw){Object.keys(best).forEach(e=>{if(/סקוואט/.test(e)&&best[e]>=bw)got.bwsq=1;if(/לחיצת חזה|בנץ/.test(e)&&best[e]>=bw)got.bwbp=1})}
  history().forEach(h=>{if(/מתח/.test(h.exercise)&&!/מתח בכבל|פולי/.test(h.exercise))(h.sets||[]).forEach(s=>{if(s.reps>=1)got.pull1=1;if(s.reps>=10)got.pull10=1})});
  const wr=J('WEEK_RES',[]);let streak=0,bestS=0;wr.forEach(w=>{streak=w.ok?streak+1:0;bestS=Math.max(bestS,streak)});[[4,'s4'],[8,'s8'],[12,'s12'],[26,'s26'],[52,'s52']].forEach(([k,id])=>{if(bestS>=k)got[id]=1});
  const h=((state.data&&state.data.history)||[]).slice().sort((a,b)=>a.date.localeCompare(b.date));let run=0,bestL=0,prev='';h.forEach(x=>{if(x.calories>0){run=prev&&addDays(prev,1)===x.date?run+1:1;prev=x.date;bestL=Math.max(bestL,run)}});if(bestL>=30)got.log30=1;if(bestL>=100)got.log100=1;
  const pg=settingsNum('protein_goal',130);let pr=0,bestP=0,pp='';h.forEach(x=>{if(x.protein>=pg*.95){pr=pp&&addDays(pp,1)===x.date?pr+1:1;pp=x.date;bestP=Math.max(bestP,pr)}});if(bestP>=7)got.prot7=1;
  if(maxOk>=12)got.run12=1;if(maxOk>=42)got.run42=1;if(km>=550)got.shoe=1;
  let pr30=0,b30=0,pp30='';h.forEach(x=>{if(x.protein>=pg*.95){pr30=pp30&&addDays(pp30,1)===x.date?pr30+1:1;pp30=x.date;b30=Math.max(b30,pr30)}});if(b30>=30)got.prot30=1;
  {const cg=settingsNum('calorie_goal',0);if(cg){const by={};h.forEach(x=>{if(x.calories>0){const m=x.date.slice(0,7);(by[m]=by[m]||{n:0,ok:0}).n++;if(x.calories<=cg*1.05&&x.calories>=cg*.85)by[m].ok++}});const cur=today().slice(0,7);if(Object.keys(by).some(m=>m<cur&&by[m].n>=25&&by[m].ok>=20))got.cal30=1}}
  {const wk={};J('CARDIO_LOG',[]).forEach(r=>{const k=sunday(r.d);wk[k]=(wk[k]||0)+(Number(r.min)||0)});log.forEach(r=>{if(r.d&&r.s){const k=sunday(r.d);wk[k]=(wk[k]||0)+r.s/60}});const ks=Object.keys(wk).sort();let st=0,last='';ks.forEach(k=>{if(wk[k]>=150){st=last&&addDays(last,7)===k?st+1:1;last=k;if(st>=4)got.c150=1}else{st=0;last=''}})}
  {const rows=((state.data&&state.data.process&&state.data.process.rows)||[]).slice().sort((a,b)=>a.date.localeCompare(b.date));const ws=rows.filter(r=>Number(r.waist)>0);if(ws.length>1&&Number(ws[0].waist)-Number(ws[ws.length-1].waist)>=5)got.waist5=1;
   const pf=profile(),tw=Number(pf.targetWeight||pf.target_weight)||0;if(tw){const wv=h.filter(x=>Number(x.weight)>0).slice(-7).map(x=>Number(x.weight));const lastWeek=wv.filter((_,i)=>i>=wv.length-4);if(lastWeek.length>=2){const avg=lastWeek.reduce((s,v)=>s+v,0)/lastWeek.length;const start=Number(pf.weight)||avg;if((tw<start&&avg<=tw)||(tw>start&&avg>=tw))got.goalw=1}}}
  const cmin=J('CARDIO_LOG',[]).reduce((s,r)=>s+(Number(r.min)||0),0);if(cmin>=600)got.c10=1;if(cmin>=3000)got.c50=1;if(cmin>=6000)got.c100=1;if(J('CARDIO_LOG',[]).some(r=>r.hard))got.c44=1;
  const ids=new Set(MEDALS.map(m=>m[0]));Object.keys(got).forEach(k=>{if(!ids.has(k))delete got[k]});
  return got;
}
/* 2.22: designed round medals with a number, and their own popup (a record still gets confetti) */
const ML={run1:'1',run1k:'1',run3:'3',run5:'5',run7:'7',run10:'10',run12:'12',run15:'15',run21:'21',run42:'42',sub30:'30',sub25:'25',km50:'50',km100:'100',km250:'250',km500:'500',km1000:'1000',shoe:'550',
  w25:'25',w100:'100',w200:'200',w500:'500',bwsq:'גוף',bwbp:'גוף',pull10:'10',s4:'4',s12:'12',s26:'26',s52:'52',log30:'30',log100:'100',prot30:'30',cal30:'30',c50:'50',c100:'100',c150:'150',goalw:'יעד',waist5:'5'};
const MT={run1:'l',run1k:'l',run3:'b',run5:'b',run7:'s',run10:'s',run12:'s',run15:'s',run21:'g',run42:'g',sub30:'s',sub25:'g',km50:'b',km100:'s',km250:'s',km500:'g',km1000:'g',shoe:'l',
  w25:'b',w100:'s',w200:'g',w500:'g',bwsq:'s',bwbp:'s',pull10:'s',s4:'b',s12:'s',s26:'g',s52:'g',log30:'b',log100:'s',prot30:'b',cal30:'b',c50:'s',c100:'g',c150:'s',goalw:'g',waist5:'s'};
document.head.insertAdjacentHTML('beforeend',`<style id="fp222md">
.fpMd{width:56px;height:56px;border-radius:50%;margin:0 auto 4px;display:grid;place-items:center;font-weight:900;font-size:15px;color:#14190a;position:relative;font-variant-numeric:tabular-nums;line-height:1}
.fpMd::after{content:"";position:absolute;inset:5px;border-radius:50%;border:2px solid rgba(255,255,255,.38)}
.fpMd.g{background:linear-gradient(145deg,#F6D97A,#C9971F)}.fpMd.s{background:linear-gradient(145deg,#E6EBF0,#9AA5B1)}.fpMd.b{background:linear-gradient(145deg,#E8B07A,#9A5B26)}.fpMd.l{background:linear-gradient(145deg,#E6F7A0,#9DBA2E)}
.fpMd.off{background:#1F262E;color:#6B7682;border:1px solid #2C3640}.fpMd.off::after{border-color:#2C3640}
.fpMd.sm{width:44px;height:44px;font-size:12.5px}.fpMd.big{width:104px;height:104px;font-size:30px}.fpMd.big::after{inset:8px;border-width:3px}
.fpMd.long{font-size:12px}.fpMd.big.long{font-size:24px}
#fpMedalPop{position:fixed;inset:0;z-index:2147483000;background:rgba(8,10,13,.72);display:grid;place-items:center;padding:16px}
#fpMedalPop .in{background:var(--card,#171C22);border:1px solid var(--line,#2C3640);border-radius:22px;padding:22px 20px 16px;max-width:320px;width:100%;text-align:center;animation:fpMdIn .5s cubic-bezier(.2,1.4,.4,1)}
#fpMedalPop .fpMd.big{animation:fpMdTurn 1.1s ease-out}
#fpMedalPop .k{color:var(--brand,#D7F36B);font-weight:800;font-size:17px;margin:14px 0 2px}#fpMedalPop h3{margin:0 0 6px;font-size:20px}#fpMedalPop p{margin:0 0 14px;color:var(--muted,#A3ADB8);font-size:14px;line-height:1.5}
@keyframes fpMdIn{from{transform:scale(.7);opacity:0}to{transform:none;opacity:1}}@keyframes fpMdTurn{from{transform:rotateY(180deg)}to{transform:none}}
@media (prefers-reduced-motion:reduce){#fpMedalPop .in,#fpMedalPop .fpMd.big{animation:none}}
</style>`);
function badge(id,on,size){const l=ML[id]||'';return `<div class="fpMd ${on?(MT[id]||'l'):'off'}${size?' '+size:''}${l.length>=4?' long':''}" aria-hidden="true">${l}</div>`}
window.fpMedalBadge=badge;
/* 2.23: "קיבלת מדליה!" — no confetti, a link to "המדליות שלי", and more than one new medal comes one after another */
let MQ=[];
function medalPop(m){const old=$('fpMedalPop');if(old)old.remove();
  document.body.insertAdjacentHTML('beforeend',`<div id="fpMedalPop" role="dialog" aria-modal="true" aria-label="קיבלת מדליה" onclick="if(event.target===this)fpMedalNext()"><div class="in">${badge(m[0],1,'big')}<div class="k">קיבלת מדליה!</div><h3>${esc(m[2])}</h3><p>כל הכבוד, עמדת בהישג.${m[3]?' '+esc(m[3]):''}</p><button type="button" class="btn full" onclick="fpMedalMine()">המדליות שלי</button><button type="button" class="btn light full" style="margin-top:8px" onclick="fpMedalNext()">${MQ.length?'למדליה הבאה ('+MQ.length+')':'סגור'}</button></div></div>`);
  try{hapticTick()}catch(_){}}
window.fpMedalNext=()=>{const e=$('fpMedalPop');if(e)e.remove();const n=MQ.shift();if(n)medalPop(n)};
window.fpMedalMine=()=>{MQ=[];const e=$('fpMedalPop');if(e)e.remove();try{fpMedals()}catch(_){}};
window.fpMedalPop=id=>{const m=MEDALS.find(x=>x[0]===id);if(m)medalPop(m)};
/* new medals since last time → popups right away (and they wait for the weekly summary too) */
function checkMedals(quiet){const have=J('MEDALS',{}),got=earned(),fresh=Object.keys(got).filter(k=>!have[k]);if(!fresh.length)return[];
  fresh.forEach(k=>have[k]=today());setProp('MEDALS',JSON.stringify(have));
  const onb=$('onbSheet');if(!quiet&&!$('fpI')&&(!onb||onb.classList.contains('hide'))){const ms=fresh.map(k=>MEDALS.find(x=>x[0]===k)).filter(Boolean);if(ms.length){if($('fpMedalPop'))MQ=MQ.concat(ms);else{MQ=ms.slice(1);try{medalPop(ms[0])}catch(_){}}}}
  return fresh}
window.fpMedalGive=k=>{const have=J('MEDALS',{});if(!have[k]){have[k]=today();setProp('MEDALS',JSON.stringify(have))}};
window.fpMedals=function(){checkMedals(true);const have=J('MEDALS',{});
  sheet('fpMedalSheet','המדליות שלי',`<p class="muted" style="margin:0 0 8px">מדליה רק על אבן דרך. ${MEDALS.filter(m=>have[m[0]]).length} מתוך ${MEDALS.length}.</p><div class="fpW-md">${MEDALS.map(([id,ic,t,d])=>`<div class="${have[id]?'':'off'}" title="${esc(d)}">${badge(id,have[id])}${esc(t)}${have[id]?`<br><small class="muted">${have[id].split('-').reverse().slice(0,2).join('.')}</small>`:''}</div>`).join('')}</div>`)};

/* ---------- the weekly summary ---------- */
function weekRange(){const t=today(),d=D(t),dow=d.getDay(),h=new Date().getHours();
  /* Saturday from 18:00 → this week (Sun..Sat); any other time → the week that ended last Saturday */
  const sat=dow===6&&h>=18?t:addDays(t,-(dow===6?7:dow+1));return{from:addDays(sat,-6),to:sat}}
function summary(r){
  const T=J('TRAIN_PLAN',null),P=J('RUN_PLAN',null),p=profile();
  const inW=d=>d>=r.from&&d<=r.to;
  const strDone=strSessions().filter(s=>inW(s.date)).length,strGoal=T?Number(T.str)||0:(p.want?0:Number(p.days)||0);
  const runs=J('RUN_LOG',[]).filter(x=>inW(x.d)),runGoal=P?Number(P.runs)||0:0,km=runs.reduce((s,x)=>s+(Number(x.km)||0),0);
  const cmin=J('CARDIO_LOG',[]).filter(x=>inW(x.d)).reduce((s,x)=>s+(Number(x.min)||0),0),carGoal=T?Number(T.car)||0:0,carDone=J('CARDIO_LOG',[]).filter(x=>inW(x.d)).length;
  const goal=settingsNum('calorie_goal',2200),pg=settingsNum('protein_goal',130);const days=((state.data&&state.data.history)||[]).filter(x=>inW(x.date)&&x.calories>0);
  const calOk=days.filter(x=>Math.abs(x.calories-goal)<=goal*.1).length,protOk=days.filter(x=>x.protein>=pg*.95).length;
  const trainOk=strDone>=strGoal&&runs.length>=runGoal&&carDone>=carGoal;const foodOk=calOk>=5&&protOk>=5;
  /* what improved: heavier than ever before this week */
  const before=bestByExercise(r.from),ups=[];const thisW={};history().filter(h=>inW(h.date)).forEach(h=>(h.sets||[]).forEach(s=>{const w=Number(s.weight)||0;if(w>(thisW[h.exercise]||0))thisW[h.exercise]=w}));
  Object.keys(thisW).forEach(e=>{if(before[e]&&thisW[e]>before[e])ups.push([e,before[e]+' ← '+thisW[e]+' ק״ג'])});
  const oldRuns=J('RUN_LOG',[]).filter(x=>x.d<r.from&&x.s&&x.km>0),bestOld=oldRuns.length?Math.min(...oldRuns.map(x=>x.s/x.km)):0;const newBest=runs.filter(x=>x.s&&x.km>0).map(x=>x.s/x.km).sort((a,b)=>a-b)[0];
  if(bestOld&&newBest&&newBest<bestOld)ups.push(['קצב ריצה',mmss(bestOld)+' ← '+mmss(newBest)+' לק״מ']);
  return{strDone,strGoal,runs:runs.length,runGoal,km,cmin,carDone,carGoal,calOk,protOk,days:days.length,trainOk,foodOk,ups};
}
window.fpWeekSummary=function(force){
  const r=weekRange(),S=summary(r),hasPlan=S.strGoal||S.runGoal||S.carGoal;const fresh=checkMedals(true),have=J('MEDALS',{});
  const newM=Object.keys(have).filter(k=>have[k]>=r.from&&have[k]<=addDays(r.to,1)).map(k=>MEDALS.find(m=>m[0]===k)).filter(Boolean);
  const all=S.trainOk&&S.foodOk;const hard=prop('HARD_ASK')!=='off'&&(S.runGoal||S.strGoal);
  const miss=[!S.trainOk&&hasPlan?`אימונים: ${S.strGoal?`כוח ${S.strDone} מתוך ${S.strGoal}`:''}${S.runGoal?` · ריצות ${S.runs} מתוך ${S.runGoal}`:''}${S.carGoal?` · אירובי ${S.carDone} מתוך ${S.carGoal}`:''}`:'',S.calOk<5?`קלוריות: ${S.calOk} ימים ביעד מתוך 7`:'',S.protOk<5?`חלבון: ${S.protOk} ימים ביעד מתוך 7`:''].filter(Boolean);
  sheet('fpWeekSum','סיכום השבוע',`<p class="muted" style="margin:0">${r.from.split('-').reverse().slice(0,2).join('.')}–${r.to.split('-').reverse().slice(0,2).join('.')}${new Date().getDay()===6?' · מחר יש צ׳קליסט שבועי':''}</p>
    ${all?`<div class="fpW-good"><div style="font-size:34px"></div><b>כל הכבוד! עמדת בכל היעדים השבוע.</b><br><small class="muted">אימונים, קלוריות וחלבון</small></div>`:`<div class="fpW-bad"><b>השבוע לא עמדת בכל היעדים.</b><br>${miss.map(esc).join('<br>')}</div>`}
    <div class="fpW-stat">${S.strGoal?`<div><b>${S.strDone}/${S.strGoal}</b><span>אימוני כוח</span></div>`:''}${S.runGoal?`<div><b>${S.runs}/${S.runGoal}</b><span>ריצות · ${Math.round(S.km*10)/10} ק״מ</span></div>`:''}${S.carGoal?`<div><b>${S.cmin}</b><span>דקות אירובי</span></div>`:''}<div><b>${S.calOk}/7</b><span>ימים ביעד הקלוריות</span></div><div><b>${S.protOk}/7</b><span>ימים ביעד החלבון</span></div></div>
    ${!S.trainOk&&hasPlan?`<div class="fpW-box" id="fpWkTrain"><b>מה עושים עם האימונים?</b><p class="muted" style="margin:4px 0 8px">היעד היומי מחושב לפי כמה שתכננת להתאמן. בלי האימונים אתה אוכל קצת יותר ממה שצריך.</p><div class="row"><button type="button" class="btn light" onclick="this.closest('#fpWkTrain').innerHTML='<p>סבבה. ממשיכים עם אותו יעד.</p>'">שבוע חריג, ממשיכים</button><button type="button" class="btn" onclick="fpWeekLower()">אני מתאמן פחות, תעדכן</button></div></div>`:''}
    ${hard?`<div class="fpW-box" id="fpWkHard"><b>היה קשה השבוע?</b><div class="meal-tabs" style="flex-wrap:wrap;margin-top:8px">${S.runGoal?`<button type="button" class="chip" onclick="fpWeekHard('run')">הריצות</button>`:''}${S.strGoal?`<button type="button" class="chip" onclick="fpWeekHard('str')">האימונים</button>`:''}${S.runGoal&&S.strGoal?`<button type="button" class="chip" onclick="fpWeekHard('both')">שניהם</button>`:''}<button type="button" class="chip" onclick="fpWeekHard('ok')">לא, היה בסדר</button></div><button type="button" class="btn light full" style="margin-top:8px" onclick="fpWeekHard('off')">לא צריך את השאלה הזו</button><p class="muted" style="margin:4px 0 0;font-size:12.5px">למי שלא לוקח תוכנית מהאפליקציה. אפשר להחזיר בהגדרות.</p></div>`:''}
    ${S.ups.length?`<div class="fpW-box"><b>במה השתפרת</b>${S.ups.slice(0,6).map(([a,b])=>`<div class="fpW-up"><span>${esc(a)}</span><b>${esc(b)}</b></div>`).join('')}</div>`:''}
    ${newM.length?`<div class="fpW-box" style="text-align:center"><div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">${newM.map(m=>badge(m[0],1,'sm')).join('')}</div><b>${newM.length===1?'מדליה חדשה: ':'מדליות חדשות: '}${newM.map(m=>esc(m[2])).join(', ')}</b></div>`:''}
    <button type="button" class="btn light full" style="margin-top:6px" onclick="fpMedals()">כל המדליות</button>`);
  const wr=J('WEEK_RES',[]).filter(w=>w.w!==r.from);if(hasPlan){wr.push({w:r.from,ok:S.trainOk});setProp('WEEK_RES',JSON.stringify(wr.slice(-104)))}
  LS.set('fp2.weekSum',r.to);
};
window.fpWeekHard=function(k){const b=$('fpWkHard');if(k==='off'){setProp('HARD_ASK','off');if(b)b.innerHTML='<p>השאלה כבויה. מחזירים אותה בהגדרות.</p>';return}
  if(k==='run'||k==='both'){try{fpT&&fpT.repeatWeek&&fpT.repeatWeek()}catch(_){}}
  if(b)b.innerHTML=`<p>${k==='ok'?'מעולה, ממשיכים לשבוע הבא.':'אין בעיה. חוזרים על אותו שבוע'+(k==='run'?' בריצות':k==='str'?' באימונים':'')+', ככה בונים בלי להיפצע.'}</p>`};
window.fpWeekLower=async function(){const T=J('TRAIN_PLAN',{})||{};const r=weekRange(),S=summary(r);const newStr=Math.max(0,S.strDone),p=profile();
  T.str=newStr;setProp('TRAIN_PLAN',JSON.stringify(T));const box=$('fpWkTrain');
  try{const prof=Object.assign({},p,{days:Math.min(6,newStr+(Number(T.run)||0)+(Number(T.car)||0))});delete prof.calculation;state.data=await call('saveProfile',{profile:prof,targetMode:'calculated'});
    if(box)box.innerHTML=`<p>עודכן: ${newStr} אימוני כוח בשבוע. היעד היומי עכשיו ${settingsNum('calorie_goal',2200).toLocaleString('he-IL')} קלוריות.</p>`;try{renderAll()}catch(_){}}catch(e){if(box)box.innerHTML='<p>לא הצלחתי לעדכן: '+esc(e.message)+'</p>'}};

/* when: Saturday from 18:00 (or the first open after it), once a week, not in the first week */
function due(){if(!state.data||!state.data.settings)return false;if($('fpI')||!$('onbSheet')?.classList.contains('hide')||$('fpWeekSum'))return false;
  const r=weekRange(),first=LS.get('fp2.firstDay')||'';
  /* the first time after the update: start from next Saturday, don't show an old week */
  if(!LS.get('fp2.weekSum')){LS.set('fp2.weekSum',r.to);return false}if(first&&first>r.from)return false;if(!getProfile())return false;return(LS.get('fp2.weekSum')||'')<r.to}
setInterval(()=>{try{if(due()&&(document.querySelector('#today.active')))fpWeekSummary()}catch(e){}},5000);
setInterval(()=>{try{if(state.data&&!$('fpI'))checkMedals(false)}catch(_){}},15000);

/* ---------- settings ---------- */
function renderSet(){const sec=$('settings');if(!sec||!state.data)return;let box=$('fpMedalSet');
  if(!box){box=document.createElement('details');box.className='settings-section';box.id='fpMedalSet';const a=$('fpAiCheck')||$('fpLogout');if(a)a.insertAdjacentElement('beforebegin',box);else sec.appendChild(box)}
  const open=box.open;box.innerHTML=`<summary>מדליות וסיכום שבוע</summary><div class="settings-body"><button type="button" class="btn light full" onclick="fpMedals()">המדליות שלי</button>
    <button type="button" class="btn light full" style="margin-top:8px" onclick="fpWeekSummary(true)">סיכום השבוע עכשיו</button>
    <label style="display:flex;gap:8px;align-items:center;margin-top:12px"><input type="checkbox" style="width:auto" ${prop('HARD_ASK')==='off'?'':'checked'} onchange="FP2.setProp('HARD_ASK',this.checked?'':'off')"> לשאול בסיכום השבוע ״היה קשה?״</label></div>`;box.open=open}
if(typeof renderSettings==='function'){const o=renderSettings;renderSettings=function(){const r=o.apply(this,arguments);try{renderSet()}catch(e){console.error(e)}return r}}
window.fp219Week={earned,summary,weekRange,MEDALS,checkMedals};
})();
