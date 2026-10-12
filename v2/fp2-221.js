/* FitPro 2.21.0 — the workout tab gets three tabs: כוח / ריצה / אירובי, and "השבוע שלי".
   ריצה: today's run, the week, the way to the goal, the plan, my runs, records, shoes, running medals, run settings.
   אירובי: today's session (machine, figure, easy/hard settings, timer), minutes of the week (150), how the days are split,
   the plan in 3 levels (מתחיל: time first, intervals from week 5 / ממשיך: one interval day / 4×4: twice a week, at least 48h apart,
   3 intervals at first, an easy week every 4th), easy vs hard, my machines, my sessions, cardio medals, cardio settings.
   השבוע שלי: a weekly plan (what I do on each day) or free. The app marks easy/hard by the rules:
   at most 2 hard sessions a week together with running, 2 days apart, none on legs day or the day before it. */
(function(){
'use strict';
const prop=k=>{try{return FP2.getProp(k)||''}catch(_){return ''}};
const setProp=(k,v)=>{try{FP2.setProp(k,v)}catch(_){}};
const J=(k,d)=>{try{const v=JSON.parse(prop(k)||'null');return v==null?d:v}catch(_){return d}};
const LS={get(k){try{return localStorage.getItem(k)}catch(_){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(_){}}};
const iso=d=>d.toISOString().slice(0,10);
const D=s=>new Date(s+'T12:00:00');
const addDays=(s,n)=>{const d=D(s);d.setDate(d.getDate()+n);return iso(d)};
const today=()=>state.todayDate||state.date||iso(new Date());
const dow=s=>D(s).getDay();
const weekStart=s=>addDays(s,-dow(s));
const nextDay=(days,t,from)=>{for(let k=1;k<=7;k++){const d=(from+k)%7;if(days[d].includes(t))return d}return -1};
const mmss=x=>Math.floor(x/60)+':'+String(Math.round(x%60)).padStart(2,'0');
const sec=s=>{const m=String(s||'').trim().match(/^(\d{1,3})[:.](\d{1,2})$/);return m?(+m[1])*60+(+m[2]):null};
const daysBetween=(a,b)=>Math.round((D(b)-D(a))/864e5);
const W=['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳'];
const T_=()=>window.fpT&&fpT._;

document.head.insertAdjacentHTML('beforeend',`<style id="fp221css">
#fpTCards{display:none!important}
#fp221Tabs{display:flex;gap:6px;margin:0 0 10px}
#fp221Tabs button{flex:1;font:inherit;font-weight:700;font-size:14.5px;border:1px solid var(--line,#2C3640);background:#1F262E;color:var(--muted,#A3ADB8);border-radius:12px;padding:9px 4px;cursor:pointer}
#fp221Tabs button.on{background:var(--brand,#D7F36B);color:#14190a;border-color:var(--brand,#D7F36B)}
#fp221Week{display:flex;justify-content:space-between;align-items:center;gap:8px;width:100%;font:inherit;background:var(--card,#171C22);border:1px solid var(--line,#2C3640);color:inherit;border-radius:14px;padding:10px 12px;margin:0 0 12px;cursor:pointer;text-align:right}
#fp221Week b{color:var(--brand,#D7F36B);font-weight:700}
#workoutHome.fpTab-r>*:not(.fp221keep),#workoutHome.fpTab-c>*:not(.fp221keep){display:none!important}
#workoutHome:not(.fpTab-r) #fp221Run,#workoutHome:not(.fpTab-c) #fp221Car{display:none}
.f21 .sec{background:var(--card,#171C22);border:1px solid var(--line,#2C3640);border-radius:16px;padding:12px 14px;margin:0 0 12px}
.f21 h3{margin:0 0 8px;font-size:16.5px}.f21 .mu{color:var(--muted,#A3ADB8);font-size:13px}
.f21 .big{font-size:22px;font-weight:800;margin:2px 0 6px;line-height:1.3}
.f21 .steps{display:grid;gap:5px;margin:8px 0}.f21 .steps div{display:flex;justify-content:space-between;gap:8px;font-size:14px;padding:6px 10px;background:#1F262E;border-radius:10px}.f21 .steps b{color:var(--brand,#D7F36B);font-weight:700;text-align:left}
.f21 .wkrow{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center;font-size:12px}
.f21 .wkrow div{background:#1F262E;border-radius:10px;padding:6px 0;min-width:0}.f21 .wkrow i{display:block;font-style:normal;font-size:15px;margin-top:2px}.f21 .wkrow .now{outline:2px solid var(--brand,#D7F36B)}
.f21 .gb{position:relative;height:12px;background:var(--line,#2C3640);border-radius:8px;margin:28px 10px 10px}
.f21 .gb .fill{position:absolute;inset-block:0;right:0;background:var(--brand,#D7F36B);border-radius:8px}
.f21 .gb .d{position:absolute;top:-5px;width:22px;height:22px;transform:translateX(50%);border-radius:50%;background:#1F262E;border:2px solid var(--line,#2C3640);display:grid;place-items:center;font-size:10.5px;font-weight:700}
.f21 .gb .d.got{background:var(--brand,#D7F36B);border-color:var(--brand,#D7F36B);color:#14190a}
.f21 .gb .d span{position:absolute;top:-19px;white-space:nowrap;color:var(--muted,#A3ADB8);font-weight:400}
.f21 .pl{display:flex;gap:10px;align-items:flex-start;padding:8px 0;border-bottom:1px solid var(--line,#2C3640);font-size:14px}.f21 .pl:last-child{border:0}
.f21 .pl>i{font-style:normal;flex:none;min-width:28px;padding:0 4px;height:26px;border-radius:8px;display:grid;place-items:center;background:#1F262E;font-size:12.5px;font-weight:800}
.f21 .pl.done>i{background:#2B3A1B;color:var(--brand,#D7F36B)}.f21 .pl.cur>i{background:var(--brand,#D7F36B);color:#14190a}.f21 .pl.lock{color:var(--muted,#A3ADB8)}
.f21 .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:10px}.f21 .stats div{background:#1F262E;border-radius:12px;padding:8px 4px;text-align:center}.f21 .stats b{display:block;font-size:18px;font-variant-numeric:tabular-nums}.f21 .stats span{font-size:11.5px;color:var(--muted,#A3ADB8)}
.f21 svg.ch{width:100%;height:auto;display:block}
.f21 .ls .r{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--line,#2C3640);font-size:14px;font-variant-numeric:tabular-nums}.f21 .ls .r:last-child{border:0}.f21 .ls small{display:block;color:var(--muted,#A3ADB8);font-size:12px}
.f21 .pill{font-size:11px;border-radius:99px;padding:2px 8px;background:#1F262E;color:var(--muted,#A3ADB8);white-space:nowrap}.f21 .pill.g{background:rgba(110,231,135,.12);color:#6EE787}.f21 .pill.w{background:rgba(245,196,81,.12);color:#F5C451}.f21 .pill.h{background:rgba(255,138,128,.14);color:#FF8A80}
.f21 .bar{height:10px;background:var(--line,#2C3640);border-radius:6px;overflow:hidden;margin:8px 0 4px}.f21 .bar i{display:block;height:100%;background:var(--brand,#D7F36B);border-radius:6px}
.f21 .md{display:flex;gap:8px;overflow-x:auto;padding-bottom:4px}.f21 .md>div{flex:none;width:78px;background:#1F262E;border-radius:12px;padding:8px 4px;text-align:center;font-size:11.5px;line-height:1.3}.f21 .md i{display:block;font-style:normal;font-size:24px}.f21 .md .no{color:var(--muted,#A3ADB8)}
.f21 .rw{display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--line,#2C3640);font-size:14px}.f21 .rw:last-child{border:0}
.f21 .chips{display:flex;gap:6px;flex-wrap:wrap}.f21 .chips button{font:inherit;font-size:13px;border:1px solid var(--line,#2C3640);background:#1F262E;color:var(--muted,#A3ADB8);border-radius:99px;padding:5px 11px;cursor:pointer}.f21 .chips button.on{background:#2B3A1B;color:var(--brand,#D7F36B);border-color:var(--brand,#D7F36B)}
.f21 .seg{display:flex;background:#1F262E;border:1px solid var(--line,#2C3640);border-radius:12px;padding:3px;gap:3px;margin:0 0 10px}.f21 .seg button{flex:1;font:inherit;font-size:13.5px;border:0;background:none;color:var(--muted,#A3ADB8);border-radius:9px;padding:7px 4px;cursor:pointer}.f21 .seg button.on{background:#2B3A1B;color:var(--brand,#D7F36B);font-weight:700}
.f21 ul.rl{margin:0;padding-inline-start:18px;display:grid;gap:6px;font-size:14px}
.f21 .why{background:#1F262E;border-radius:12px;padding:8px 10px;font-size:13px;color:var(--muted,#A3ADB8);margin-top:8px;line-height:1.5}
.f21 .k{font-size:11px;border-radius:99px;padding:2px 8px;white-space:nowrap}.f21 .k.e{background:rgba(110,231,135,.12);color:#6EE787}.f21 .k.h{background:rgba(255,138,128,.14);color:#FF8A80}
.f21 .wd{display:grid;grid-template-columns:28px 1fr auto;gap:8px;align-items:center;padding:7px 0;border-bottom:1px solid var(--line,#2C3640)}.f21 .wd:last-child{border:0}.f21 .wd>i{font-style:normal;font-weight:800;color:var(--muted,#A3ADB8);text-align:center}
.f21 .fpT-ex{grid-template-columns:110px 1fr}.f21 .fpT-ex svg{width:110px;height:110px}
.f21 input.sm{width:84px;font:inherit;background:#1F262E;color:inherit;border:1px solid var(--line,#2C3640);border-radius:9px;padding:6px 8px}
</style>`);

/* =========================================================
   the week: rules engine (shared with the questionnaire)
   ========================================================= */
const STR={0:[],1:[0],2:[0,3],3:[0,2,4],4:[0,1,3,4],5:[0,1,2,4,5],6:[0,1,2,3,4,5],7:[0,1,2,3,4,5,6]};
/* fill a week: S strength, R runs, C cardio; hardR/hardC = how many of them may be hard */
function build(S,R,C,hardR,hardC){
  S=Math.min(6,S|0);R=Math.min(5,R|0);C=Math.min(5,C|0);
  const day=W.map(()=>[]),legs=S?0:-1;STR[S].forEach(d=>day[d].push('s'));
  const free=()=>day.filter(x=>!x.length).length,busy=d=>day[d].length>0,has=(d,t)=>day[(d+7)%7].includes(t);
  const hardDays=[];const badHard=d=>d===legs||(legs>=0&&(d+1)%7===legs);
  const far=d=>hardDays.every(h=>{const g=Math.abs(h-d);return Math.min(g,7-g)>=2});
  const want=[];for(let i=0;i<Math.min(hardR,R);i++)want.push(['r',1]);for(let i=0;i<Math.min(hardC,C);i++)want.push(['c',1]);
  for(let i=0;i<R-Math.min(hardR,R);i++)want.push(['r',0]);for(let i=0;i<C-Math.min(hardC,C);i++)want.push(['c',0]);
  const order=[1,4,5,2,6,3,0];
  for(const [t,h] of want){
    const tries=h?[d=>!busy(d)&&!badHard(d)&&far(d),d=>!badHard(d)&&far(d)&&day[d].length<2&&!day[d].some(x=>x!=='s')&&d!==legs,d=>!busy(d)]
      :t==='r'?[d=>!busy(d)&&!has(d-1,'r')&&!has(d+1,'r'),d=>!busy(d),d=>day[d].length<2&&d!==legs&&!day[d].includes('r')]
      :[d=>!busy(d)&&free()>1,d=>day[d].length<2&&has(d,'s')&&d!==legs,d=>!busy(d),d=>day[d].length<2&&!day[d].includes('c')];
    let pick=-1;for(const ok of tries){const f=order.find(ok);if(f!==undefined){pick=f;break}}
    if(pick<0)continue;day[pick].push(t);if(h)hardDays.push(pick);
  }
  return day;
}
/* label a week the user built: which run/cardio day is hard, and warnings */
function label(days,hardR,hardC){
  const legs=days.findIndex(d=>d.includes('s')),hard=W.map(()=>''),warn=[];let n=0;
  const okH=i=>i!==legs&&(legs<0||(i+1)%7!==legs)&&hard.every((h,j)=>!h||Math.min(Math.abs(i-j),7-Math.abs(i-j))>=2);
  const pick=(t,max)=>{let k=0;for(let i=0;i<7&&k<max&&n<2;i++){const d=[1,4,2,5,3,6,0][i];if(days[d].includes(t)&&!hard[d]&&okH(d)){hard[d]=t;k++;n++}}};
  pick('r',hardR);pick('c',hardC);
  for(let i=0;i<7;i++)if(days[i].includes('r')&&days[(i+1)%7].includes('r'))warn.push(`ריצה ביום ${W[i]} וגם ביום ${W[(i+1)%7]}: עדיף יום הפסקה בין ריצות.`);
  if(!days.some(d=>!d.length))warn.push('אין יום מנוחה. עדיף לפחות יום אחד.');
  if(legs>=0&&days[legs].includes('r'))warn.push(`ריצה ביום רגליים (${W[legs]}): רק קלה, ועדיף כמה שעות אחרי.`);
  const cnt={s:0,r:0,c:0};days.forEach(d=>d.forEach(t=>cnt[t]++));
  return {hard,warn,cnt,legs};
}
window.FPW={build,label,W};

/* =========================================================
   data
   ========================================================= */
const TP=()=>J('TRAIN_PLAN',null)||{};
const wantOf=()=>{const t=TP();const w=Array.isArray(t.want)?t.want:[];return {s:w.includes('str'),r:w.includes('run')||!!J('RUN_PLAN',null),c:w.includes('car')||Number(t.car)>0}};
const runLog=()=>J('RUN_LOG',[]);
const carLog=()=>J('CARDIO_LOG',[]);
const sessions=()=>((state.data&&state.data.workout&&state.data.workout.sessions)||[]);
const isCardioS=s=>s.type==='אירובי'||/^ריצה$|^אירובי$/.test(s.name||'');
function weekDone(ws){const we=addDays(ws,6),inW=d=>d&&d>=ws&&d<=we;
  const out=W.map(()=>[]);
  sessions().forEach(s=>{if(inW(s.date)&&!isCardioS(s)&&(s.items||[]).length)out[dow(s.date)].push('s')});
  runLog().forEach(r=>{if(inW(r.d))out[dow(r.d)].push('r')});
  carLog().forEach(r=>{if(inW(r.d))out[dow(r.d)].push('c')});
  return out}
function weekPlan(){let wp=J('WEEK_PLAN',null);
  if(!wp||!Array.isArray(wp.days)||wp.days.length!==7){const t=TP(),p=J('RUN_PLAN',null),wn=wantOf();
    const S=wn.s?Number(t.str)||3:0,R=wn.r?Number((p&&p.runs)||t.run)||2:0,C=wn.c?Number(t.car)||2:0;
    wp={mode:'P',days:build(S,R,C,p&&p.m3&&R>=2?1:0,carHardMax()),auto:1}}
  return wp}
function saveWeek(wp){delete wp.auto;setProp('WEEK_PLAN',JSON.stringify(wp))}

/* =========================================================
   cardio plan: 3 levels, by week
   ========================================================= */
const LV={beg:'מתחיל',mid:'ממשיך',adv:'4×4'};
const E=(min)=>({k:'e',min}),I=(n,h,r)=>({k:'h',n,h,r});
const CPLAN={
  beg:{intro:'קודם מאריכים את הזמן, ורק משבוע 5 מוסיפים קטעים חזקים.',next:'mid',w:[
    {t:'3 × 20 דק׳ קל',s:[E(20),E(20),E(20)]},{t:'3 × 20 דק׳ קל',s:[E(20),E(20),E(20)]},
    {t:'3 × 25–30 דק׳ קל',s:[E(25),E(30),E(25)]},{t:'3 × 30 דק׳ קל',s:[E(30),E(30),E(30)]},
    {t:'2 × 30 קל + 6 × 1 דק׳ חזק',s:[E(30),I(6,1,2),E(30)]},{t:'2 × 30 קל + 8 × 1 דק׳ חזק',s:[E(30),I(8,1,2),E(30)]},
    {t:'2 × 35 קל + 5 × 2 דק׳ חזק',s:[E(35),I(5,2,2),E(35)]},{t:'שבוע קל: 3 × 25 דק׳',s:[E(25),E(25),E(25)]}]},
  mid:{intro:'אימון קטעים אחד בשבוע. השאר קל וקצת יותר ארוך.',next:'adv',w:[
    {t:'2 × 35 קל + 4 × 3 דק׳ חזק',s:[E(35),I(4,3,2),E(35)]},{t:'2 × 40 קל + 5 × 3 דק׳ חזק',s:[E(40),I(5,3,2),E(40)]},
    {t:'2 × 40 קל + 3 × 4 דק׳ חזק',s:[E(40),I(3,4,3),E(40)]},{t:'שבוע קל: 3 × 30 דק׳',s:[E(30),E(30),E(30)]},
    {t:'2 × 45 קל + 4 × 4 דק׳ חזק',s:[E(45),I(4,4,3),E(45)]},{t:'2 × 45 קל + 4 × 4 דק׳ חזק',s:[E(45),I(4,4,3),E(45)]}]},
  adv:{intro:'4 קטעים של 4 דק׳ חזק (85–95% מהדופק המקסימלי), 3 דק׳ קל ביניהם. פעמיים בשבוע, לפחות 48 שעות ביניהם. שאר הימים קל וארוך.',next:null,w:[
    {t:'2 × 4×4 עם 3 קטעים · 45 דק׳ קל',s:[I(3,4,3),E(45),I(3,4,3)]},{t:'2 × 4×4 עם 3 קטעים · 45 דק׳ קל',s:[I(3,4,3),E(45),I(3,4,3)]},
    {t:'2 × 4×4 · 45–60 דק׳ קל',s:[I(4,4,3),E(50),I(4,4,3)]},{t:'2 × 4×4 · 45–60 דק׳ קל',s:[I(4,4,3),E(55),I(4,4,3)]},
    {t:'2 × 4×4, קטעים 3–4 חזקים מאוד · 60 דק׳ קל',s:[I(4,4,3),E(60),I(4,4,3)]},{t:'2 × 4×4 · 60 דק׳ קל',s:[I(4,4,3),E(60),I(4,4,3)]},
    {t:'שבוע קל: 4×4 אחד + 2 × 40 דק׳ קל',s:[E(40),I(4,4,3),E(40)]},{t:'בדיקה: אותו 4×4, רואים כמה התקדמת',s:[I(4,4,3),E(45),I(4,4,3)]}]}};
function clv(){let c=J('CARDIO_LVL',null);if(!c){const t=TP();const now=Number(t.carNow)||0;c={lvl:now>=4?'adv':now>=2?'mid':'beg',since:t.set||today()}}
  const P=CPLAN[c.lvl]||CPLAN.beg;let wk=Math.max(1,Math.floor(daysBetween(weekStart(c.since),weekStart(today()))/7)+1-(Number(c.rep)||0));
  let lvl=c.lvl;if(wk>P.w.length){if(P.next){lvl=P.next;wk=1;setProp('CARDIO_LVL',JSON.stringify({lvl,since:weekStart(today())}))}else wk=4+((wk-5)%4)+1}
  return {lvl,wk:Math.min(wk,CPLAN[lvl].w.length),P:CPLAN[lvl]}}
function carHardMax(){const c=clv();return c.P.w[c.wk-1].s.filter(x=>x.k==='h').length}
/* the sessions of this week, taking the chosen count per week into account */
function carWeek(){const c=clv(),wkx=c.P.w[c.wk-1],per=Math.max(1,Math.min(5,Number(TP().car)||wkx.s.length));
  let s=wkx.s.slice();while(s.length<per)s.push(E(s.find(x=>x.k==='e')?s.find(x=>x.k==='e').min:30));
  if(s.length>per){const hs=s.filter(x=>x.k==='h'),es=s.filter(x=>x.k==='e');s=hs.slice(0,Math.min(hs.length,per)).concat(es.slice(0,Math.max(0,per-hs.length)))}
  return {c,wkx,sessions:s}}
const sName=x=>x.k==='e'?x.min+' דק׳ קל':(x.n===3&&x.h===4||x.n===4&&x.h===4?'4×4'+(x.n===3?' (3 קטעים)':''):x.n+' × '+x.h+' דק׳ חזק');
const sMin=x=>x.k==='e'?x.min:10+x.n*x.h+(x.n-1)*x.r+5;
function phases(x){if(x.k==='e')return[['חימום',180,'e'],['קל',Math.max(5,x.min-5)*60,'e'],['סיום',120,'e']];
  const ph=[['חימום',600,'e']];for(let i=0;i<x.n;i++){ph.push(['חזק',x.h*60,'h']);if(i<x.n-1)ph.push(['קל',x.r*60,'e'])}ph.push(['סיום',300,'e']);return ph}

/* =========================================================
   tabs on the workout screen
   ========================================================= */
let TAB=LS.get('fp2.wTab')||'s';
function mount(){const home=$('workoutHome');if(!home)return;
  if(!$('fp221Tabs')){home.insertAdjacentHTML('afterbegin',`<div id="fp221Tabs" class="fp221keep" role="tablist"><button type="button" data-t="s" onclick="fpW.tab('s')">כוח</button><button type="button" data-t="r" onclick="fpW.tab('r')">ריצה</button><button type="button" data-t="c" onclick="fpW.tab('c')">אירובי</button></div>
    <button type="button" id="fp221Week" class="fp221keep" onclick="fpW.week()"><span>השבוע שלי</span><span><b id="fp221WkSum"></b> ›</span></button><div id="fp221Run" class="fp221keep f21"></div><div id="fp221Car" class="fp221keep f21"></div>`)}
  const act=$('homeActiveWorkout');if(act)act.classList.add('fp221keep');
  home.classList.toggle('fpTab-r',TAB==='r');home.classList.toggle('fpTab-c',TAB==='c');
  document.querySelectorAll('#fp221Tabs button').forEach(b=>{b.classList.toggle('on',b.dataset.t===TAB);b.setAttribute('aria-selected',b.dataset.t===TAB)});
  const wp=J('WEEK_PLAN',null);$('fp221WkSum').textContent=wp&&wp.mode==='F'?'חופשי':'תוכנית שבועית';
  if(TAB==='r')renderRun();else if(TAB==='c')renderCar();else stopAnim();try{window.fp222&&fp222.hdr()}catch(_){}}
if(typeof renderWorkoutHome==='function'){const o=renderWorkoutHome;renderWorkoutHome=function(){const r=o.apply(this,arguments);try{mount()}catch(e){console.error(e)}return r}}
if(typeof showView==='function'){const o=showView;showView=function(id){const r=o.apply(this,arguments);try{if(id==='workoutHome')mount();else stopAnim()}catch(_){}return r}}

/* inline figure animation, only while the tab is on screen */
let raf=0;
function stopAnim(){cancelAnimationFrame(raf);raf=0}
function anim(){stopAnim();const t0=performance.now(),reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tick=now=>{const home=$('workoutHome');if(!home||!home.classList.contains('active')){raf=0;return}
    const svgs=[...document.querySelectorAll('#fp221Car svg.fpT-an')];if(!svgs.length){raf=0;return}
    svgs.forEach(s=>{const x=T_().pat(s.dataset.an);if(!x)return;const per=(x.period||5.2)*(x.loop&&x.period<2?2:1),T=reduce?.3:((now-t0)/1000/per)%1;const d=x.loop?T:(T<.42?T/.42:T<.52?1:T<.92?1-(T-.52)/.4:0);
      try{s.innerHTML=x.views[0](d,+s.dataset.bd,JSON.parse(s.dataset.v||'{}')).replace(/<text[^>]*data-cap[^>]*>[\s\S]*?<\/text>/g,'')}catch(_){}});
    if(!reduce)raf=requestAnimationFrame(tick)};raf=requestAnimationFrame(tick)}

/* =========================================================
   2.22: the running tab = what to do today + the way to the goal + the plan.
   "שלי" (the star at the top) holds my fixed runs in folders, my runs, records, shoes and medals.
   The settings live in Settings → אימונים.
   ========================================================= */
const RUN_MEDALS=['run1','run1k','run3','run5','run7','run10','run12','run15','run21','run42','sub30','sub25','km50','km100','km250','km500','km1000','shoe'];
const CAR_MEDALS=['c50','c100','c150'];
const RECO=()=>{const r=J('RECO',null)||{};return {s:r.s!==0,r:r.r!==0,c:r.c!==0}};
let MINE={r:false,c:false},FOLD={r:'',c:''};
function medalsHtml(ids){let have={},got={};try{have=J('MEDALS',{});got=fp219Week.earned()}catch(_){}const M=(window.fp219Week&&fp219Week.MEDALS)||[];
  const B=(id,on)=>window.fpMedalBadge?fpMedalBadge(id,on,'sm'):'';
  return `<div class="md">${ids.map(id=>M.find(m=>m[0]===id)).filter(Boolean).map(m=>{const on=have[m[0]]||got[m[0]];return `<div class="${on?'':'no'}">${B(m[0],on)}${esc(m[2])}</div>`}).join('')}</div>`}
function weekRowHtml(){return ''}
function chartHtml(vals,labels,max,line){const H=70,top=20,bw=34,gap=(284-vals.length*bw)/(vals.length+1);const y=v=>top+H-(max?v/max*H:0);
  let s=`<svg class="ch" viewBox="0 0 320 120" role="img" aria-label="לפי שבוע"><g stroke="#2C3640" stroke-width="1"><line x1="28" y1="${top}" x2="312" y2="${top}"/><line x1="28" y1="${top+H/2}" x2="312" y2="${top+H/2}"/><line x1="28" y1="${top+H}" x2="312" y2="${top+H}"/></g>`+
    `<g fill="#A3ADB8" font-size="10" text-anchor="end"><text x="22" y="${top+3}">${Math.round(max)}</text><text x="22" y="${top+H/2+3}">${Math.round(max/2)}</text><text x="22" y="${top+H+3}">0</text></g>`;
  if(line)s+=`<line x1="28" y1="${y(line)}" x2="312" y2="${y(line)}" stroke="#6EE787" stroke-dasharray="4 4"/>`;
  vals.forEach((v,i)=>{const x=28+gap+i*(bw+gap),last=i===vals.length-1;s+=`<rect x="${x.toFixed(1)}" y="${y(v).toFixed(1)}" width="${bw}" height="${Math.max(0,top+H-y(v)).toFixed(1)}" rx="5" fill="${last?'#D7F36B':'#46525F'}"/><text x="${(x+bw/2).toFixed(1)}" y="${(y(v)-4).toFixed(1)}" fill="#F2F5F7" font-size="10" text-anchor="middle">${Math.round(v*10)/10}</text><text x="${(x+bw/2).toFixed(1)}" y="106" fill="#A3ADB8" font-size="10" text-anchor="middle">${labels[i]}</text>`});
  return s+'</svg>'}
function lastWeeks(n,fn){const ws=weekStart(today()),out=[];for(let i=n-1;i>=0;i--){const a=addDays(ws,-7*i),b=addDays(a,6);out.push(fn(a,b))}return out}
const wkLabels=n=>Array.from({length:n},(_,i)=>i===n-1?'השבוע':'לפני '+(n-1-i));
const kmTxt=k=>{const v=Math.round((Number(k)||0)*10)/10;return String(v)};
const mineHd=(t,title)=>`<div class="mhd"><button type="button" class="linkish" onclick="fpW.mine('${t}',0)">→ חזרה</button><b>${title}</b><span></span></div>`+(window.fp222&&fp222.planRow?fp222.planRow():'');

function goalBar(p){const best=p.best||0,goal=Number(p.goal)||5,ms=[1,3,5,7,10,15,21.1].filter(k=>k<goal).concat([goal]);const pos=k=>Math.min(100,k/goal*100);
  const here=best>0&&!ms.includes(best)?`<span class="here" style="right:${pos(best)}%"><span>${kmTxt(best)}</span></span>`:'';
  return `<div class="gb"><div class="fill" style="width:${pos(best)}%"></div>${ms.map(k=>`<span class="d${best>=k?' got':''}" style="right:${pos(k)}%"><span>${k===21.1?'21.1':k}</span>${best>=k?'✓':''}</span>`).join('')}${here}</div>
    <p class="mu" style="margin:0">הכי רחוק בלי לעצור: <b style="color:var(--text,#F2F5F7)">${best?kmTxt(best)+' ק״מ':'עוד לא'}</b>.${ms.find(k=>k>best)?' הבא: '+ms.find(k=>k>best)+' ק״מ.':''}</p>`}

function renderRun(){const box=$('fp221Run');if(!box)return;const T=T_();if(!T)return;
  if(MINE.r)return renderMineRun(box);
  const p=fpT.plan();
  if(!p){box.innerHTML=`<div class="sec"><h3>ריצה</h3><p class="mu" style="margin:0 0 10px">עוד אין תוכנית ריצה. כמה שאלות, ויש תוכנית לפי היעד שלך: מתחילים מ-0, או ממשיכים ממה שאתה רץ היום.</p><button type="button" class="btn full" onclick="fpT.setupOpen()">צור תוכנית ריצה</button></div>`;return}
  const runs=fpT.weekRuns(p,p.week),ws=weekStart(today()),doneW=runLog().filter(r=>r.d>=ws).length,idx=Math.min(doneW,runs.length-1),next=runs[idx],fin=doneW>=runs.length;
  const wp=weekPlan(),plan=wp.mode==='P',td=dow(today()),todayPlan=plan?wp.days[td]:[],nd=plan?nextDay(wp.days,'r',td):-1,rest=plan&&!todayPlan.includes('r');
  let h='';
  if(RECO().r){
    const title=fin?'סיימת את הריצות של השבוע ✓':rest&&nd>=0?'הריצה הבאה, יום '+W[nd]:'ריצה';
    h+=`<div class="sec reco"><div class="mu">מומלץ להיום · ${p.name} · שבוע ${p.week}</div>
      <div class="big">${rest&&!fin?'היום מנוחה מריצה':esc(next[0])+(/ק״מ/.test(next[1])?' '+esc(next[1].split(',')[0]):'')}</div>
      ${rest&&!fin?`<p class="mu" style="margin:0 0 8px">${title}: ${esc(next[0])}${/ק״מ/.test(next[1])?' '+esc(next[1].split(',')[0]):''}.</p>`:''}
      ${fin?'<p class="mu" style="margin:0 0 8px">רוצה עוד? ריצה קלה משלך, או מנוחה.</p>':rest?'':`<div class="steps">${T.runSteps(next,p).map(s=>`<div><span>${esc(s[0])}</span><b>${esc(s[1])}</b></div>`).join('')}</div>`}
      ${fin?'':`<button type="button" class="btn full" onclick="fpW.runGo(${idx})">${rest?'בכל זאת לרוץ היום':'מתחילים'}</button>`}<button type="button" class="btn light full" style="margin-top:8px" onclick="fpW.runGo('own')">ריצה משלי</button></div>`}
  else h+=`<div class="sec"><h3>ריצה</h3><div class="mu" style="margin-bottom:8px">${p.name} · שבוע ${p.week} · ${doneW} מתוך ${runs.length} השבוע</div><button type="button" class="btn full" onclick="fpT.run()">ריצה מהתוכנית</button><button type="button" class="btn light full" style="margin-top:8px" onclick="fpW.runGo('own')">ריצה משלי</button></div>`;
  const goal=Number(p.goal)||5;
  h+=`<div class="sec"><h3>בדרך ל-${goal===21.1?'חצי מרתון':goal+' ק״מ'}</h3>${goalBar(p)}</div>`;
  const wks=[];for(let w=Math.max(1,p.week-1);w<=p.week+2;w++)wks.push(w);const total=T.planWeeks?Math.max(12,T.planWeeks(p.start,goal)):12;
  h+=`<div class="sec"><h3>התוכנית</h3>${wks.map(w=>`<div class="pl ${w<p.week?'done':w===p.week?'cur':'lock'}"><i>${w}</i><div>${fpT.weekRuns(p,w).map(r=>esc(r[0])+': '+esc(r[1].split(',')[0])).join(' · ')}<div class="mu">${w<p.week?'✓ עבר':w===p.week?`השבוע · ${doneW} מתוך ${runs.length}`:w%4===0?'שבוע קל':''}</div></div></div>`).join('')}
    <details><summary class="mu" style="cursor:pointer;margin-top:6px">כל ${total} השבועות</summary>${Array.from({length:total},(_,i)=>i+1).map(w=>`<div class="pl ${w<p.week?'done':w===p.week?'cur':'lock'}"><i>${w}</i><div>${fpT.weekRuns(p,w).map(r=>esc(r[0])+': '+esc(r[1].split(',')[0])).join(' · ')}</div></div>`).join('')}</details>
    <p class="mu" style="margin:6px 0 0">${p.m3?'אחרי 3 ק״מ: נפתחו פרטלק, עליות ואינטרוולים.':'עד 3 ק״מ בלי לעצור: רק ריצות קלות.'}</p></div>`;
  box.innerHTML=h}

/* ---------- my fixed runs, in folders ---------- */
const runMy=()=>J('RUN_MY',[]);
function lastOf(name,log){const l=log.filter(r=>r.name===name).map(r=>r.d).sort().pop();if(!l)return 'עוד לא';const n=daysBetween(l,today());return n<=0?'היום':n===1?'אתמול':'לפני '+n+' ימים'}
function folderTiles(t,cats,list,catOf){return `<div class="tiles">${cats.map(([k,l])=>{const n=list.filter(x=>catOf(x)===k).length;return `<button type="button" class="tile${FOLD[t]===k?' on':''}" onclick="fpW.fold('${t}','${k}')"><b>${l}</b><small>${n?n+(n===1?' קבוע':' קבועים'):'ריק'}</small></button>`}).join('')}</div>`}
function renderMineRun(box){const my=runMy(),L=runLog();
  let h=mineHd('r','הריצות שלי');
  h+=`<div class="sec"><h3>הריצות הקבועות שלי</h3>${folderTiles('r',RCAT,my,x=>x.cat||'easy')}`;
  if(FOLD.r){const list=my.filter(x=>(x.cat||'easy')===FOLD.r);
    h+=list.length?`<div class="cards">${list.map(x=>`<div class="card2"><div><b>${esc(x.name)}</b><small>${[x.km?kmTxt(x.km)+' ק״מ':'',x.min?x.min+' דק׳':'',esc(x.type||'')].filter(Boolean).join(' · ')}</small>${Array.isArray(x.tg)&&x.tg.length?`<small>יעד ${mmss(x.tg.slice(0,Math.ceil(Number(x.km)||x.tg.length)).reduce((a,v)=>a+v,0))}${new Set(x.tg).size>1?' · לפי ק״מ':' · '+mmss(x.tg[0])+' לק״מ'}</small>`:''}<small>פעם אחרונה: ${lastOf(x.name,L)}</small></div><div class="acts"><button type="button" class="btn" onclick="fpW.myRunGo('${x.id}')">התחל</button><button type="button" class="btn light" onclick="fpW.myRunEdit('${x.id}')">עריכה</button></div></div>`).join('')}</div>`:`<p class="mu" style="margin:8px 0 0">אין עדיין ריצות בתיקייה הזו.</p>`}
  h+=`<button type="button" class="btn secondary full" style="margin-top:10px" onclick="fpW.myRunEdit('')">＋ ריצה קבועה חדשה</button></div>`;
  h+=`<div class="sec"><h3>הסיכום</h3>${runStats()}</div>`;
  h+=`<div class="sec"><h3>השיאים שלי</h3>${runRecords()}<p class="mu" style="margin:0">שיא חדש מקבל קונפטי. מדליה רק על אבן דרך.</p></div>`;
  const total=L.reduce((s,r)=>s+(Number(r.km)||0),0),onShoe=Math.max(0,total-(Number(prop('SHOE_START'))||0));
  h+=`<div class="sec"><h3>הנעליים</h3><div class="rw" style="border:0;padding:0"><span>הנעליים הנוכחיות</span><b style="font-variant-numeric:tabular-nums">${kmTxt(onShoe)} / 550 ק״מ</b></div><div class="bar"><i style="width:${Math.min(100,onShoe/550*100)}%;background:${onShoe>=550?'#FF8A80':'#6EE787'}"></i></div><p class="mu" style="margin:0 0 8px">תזכורת ב-550, 700 ו-800 ק״מ.</p><button type="button" class="btn light full" onclick="fpW.shoes()">קניתי זוג חדש</button></div>`;
  h+=`<div class="sec"><h3>מדליות ריצה</h3>${medalsHtml(RUN_MEDALS)}</div>`;
  box.innerHTML=h}
function runStats(){const L=runLog(),km=L.reduce((s,r)=>s+(Number(r.km)||0),0),ts=L.filter(r=>r.s&&r.km),pace=ts.length?ts.reduce((s,r)=>s+r.s,0)/ts.reduce((s,r)=>s+Number(r.km),0):0;
  const vals=lastWeeks(4,(a,b)=>L.filter(r=>r.d>=a&&r.d<=b).reduce((s,r)=>s+(Number(r.km)||0),0)),max=Math.max(4,...vals);
  return `<div class="stats"><div><b>${kmTxt(km)}</b><span>ק״מ בסך הכל</span></div><div><b>${L.length}</b><span>ריצות</span></div><div><b>${pace?mmss(pace):'—'}</b><span>קצב ממוצע</span></div></div>
   ${L.length?chartHtml(vals,wkLabels(4),Math.ceil(max/2)*2)+`<div class="ls">${L.slice(-5).reverse().map(r=>`<div class="r"><div>${W[dow(r.d)]} ${r.d.slice(8,10)}.${r.d.slice(5,7)} · ${r.km?kmTxt(r.km):'?'} ק״מ${r.name?' · '+esc(r.name):''}<small>${r.s?mmss(r.s)+(r.km?' · קצב '+mmss(r.s/r.km):''):''}</small></div><span class="pill ${r.ok?'g':'w'}">${r.ok?'בלי לעצור':'עצרתי'}</span></div>`).join('')}</div><p class="mu" style="margin:6px 0 0">לעריכה: ביומן.</p>`:'<p class="mu" style="margin:0">עוד אין ריצות. אחרי הריצה הראשונה יופיעו כאן.</p>'}`}
function runRecords(){const L=runLog(),ok=L.filter(r=>r.ok),far=ok.reduce((m,r)=>Math.max(m,Number(r.km)||0),0);
  const pc=L.filter(r=>r.s&&Number(r.km)>=1).map(r=>r.s/Number(r.km)),fast=pc.length?Math.min(...pc):0;
  const k5=L.filter(r=>r.s&&Number(r.km)>=5).map(r=>r.s*5/Number(r.km)),b5=k5.length?Math.min(...k5):0;
  return `<div class="stats"><div><b>${far?kmTxt(far):'—'}</b><span>הכי רחוק (ק״מ)</span></div><div><b>${fast?mmss(fast):'—'}</b><span>הקצב הכי מהיר</span></div><div><b>${b5?mmss(b5):'—'}</b><span>5 ק״מ</span></div></div>`}
/* 2.23: the folders follow the run kinds: easy / long / speed / pace changes */
const RCAT=[['easy','קלות'],['long','ארוכות'],['fast','מהירות'],['pace','שינויי קצב']];
const RKx=()=>fpT._.RK;
function tgOf(x){const km=Number(String(x.km||'').replace(',','.'))||0,n=Math.ceil(km),t=sec(x.tm);if(!km||!t)return null;const avg=x.tmode==='pace'?t:t/km;
  if(x.per&&Array.isArray(x.tgIn)){return Array.from({length:n},(_,i)=>sec(x.tgIn[i])||Math.round(avg))}return Array(n).fill(Math.round(avg))}
function tgLine(x){const km=Number(String(x.km||'').replace(',','.'))||0,t=sec(x.tm);if(!km||!t)return 'כותבים מרחק ויעד, והאפליקציה מחשבת.';const avg=x.tmode==='pace'?t:t/km,tot=x.tmode==='pace'?t*km:t;
  const tg=tgOf(x),sum=tg?tg.slice(0,Math.ceil(km)).reduce((a,v,i)=>a+v*Math.min(1,km-i),0):tot;
  return x.per?`סה״כ לפי הקילומטרים: <b>${mmss(sum)}</b> · ממוצע ${mmss(sum/km)} לק״מ`:x.tmode==='pace'?`זמן כולל: <b>${mmss(tot)}</b>`:`ממוצע: <b>${mmss(avg)}</b> לק״מ`}
function myRunForm(id){const T=T_(),p=fpT.plan(),RK=RKx(),x=id===null?WK.edit:Object.assign({id:'',name:'',cat:FOLD.r||'easy',type:'',km:'',min:'',tm:'',tmode:'total',per:false,tgIn:null},JSON.parse(JSON.stringify(runMy().find(r=>r.id===id)||{})));WK={edit:x};id=x.id;
  const m3=!!(p&&p.m3),kinds=Object.keys(RK).filter(k=>RK[k].cat===x.cat);if(!kinds.some(k=>RK[k].n===x.type))x.type=RK[kinds[0]].n;const kk=kinds.find(k=>RK[k].n===x.type);
  if(Array.isArray(x.tg)&&!x.tgIn){x.tgIn=x.tg.map(mmss);if(!x.tm){x.tm=mmss(x.tg.reduce((a,v)=>a+v,0));x.tmode='total'}}
  if(!x.per)x.tgIn=null;
  const km=Number(String(x.km||'').replace(',','.'))||0,n=Math.ceil(km),t=sec(x.tm),avg=t?(x.tmode==='pace'?t:t/(km||1)):0;
  if(x.per){x.tgIn=Array.from({length:n},(_,i)=>(x.tgIn&&x.tgIn[i])||(avg?mmss(Math.round(avg)):''))}
  T.sheet(id?'עריכת ריצה קבועה':'ריצה קבועה חדשה',`<div class="f21"><div class="field"><label>שם</label><input id="fpMyN" value="${esc(x.name)}" placeholder="למשל: סיבוב השכונה" oninput="fpW._e('name',this.value)"></div>
    <label>תיקייה</label><div class="chips" style="margin:4px 0 10px">${RCAT.map(([k,l])=>`<button type="button" class="${x.cat===k?'on':''}" onclick="fpW._e('cat','${k}',1)">${l}</button>`).join('')}</div>
    ${kinds.length>1?`<label>סוג</label><div class="chips" style="margin:4px 0 6px">${kinds.map(k=>`<button type="button" class="${x.type===RK[k].n?'on':''}" onclick="fpW._e('type','${RK[k].n}',1)">${RK[k].n}</button>`).join('')}</div>`:''}
    <div class="why" style="margin:0 0 10px"><b>${esc(x.type)}:</b> ${esc(RK[kk].d)}</div>
    ${(x.cat==='fast'||x.cat==='pace')&&!m3?'<p class="mu" style="margin:0 0 8px">ריצות מהירות ושינויי קצב נפתחים אחרי 3 ק״מ בלי לעצור. אפשר לשמור עכשיו ולהשתמש אחר כך.</p>':''}
    <div class="row"><div class="field"><label>מרחק (ק״מ)</label><input inputmode="decimal" value="${esc(x.km)}" oninput="fpW._e('km',this.value)" onchange="fpW._e('km',this.value,1)"></div><div class="field"><label>או זמן (דק׳)</label><input inputmode="numeric" value="${esc(x.min)}" oninput="fpW._e('min',this.value)"></div></div>
    <div class="sec" style="padding:10px 12px"><b>יעד</b> <span class="mu">(לא חובה)</span>
      <div class="seg" style="margin:8px 0"><button type="button" class="${x.tmode!=='pace'?'on':''}" onclick="fpW._e('tmode','total',1)">זמן כולל</button><button type="button" class="${x.tmode==='pace'?'on':''}" onclick="fpW._e('tmode','pace',1)">קצב לק״מ</button></div>
      <div class="field" style="margin:0"><label>${x.tmode==='pace'?'קצב לק״מ (דק׳:שנ׳)':'זמן לכל המרחק (דק׳:שנ׳)'}</label><input inputmode="text" placeholder="${x.tmode==='pace'?'6:00':'30:00'}" value="${esc(x.tm)}" oninput="fpW._e('tm',this.value);fpW._tgl()" onchange="fpW._e('tm',this.value,1)"></div>
      <p class="mu" id="fpTgL" style="margin:6px 0 0">${tgLine(x)}</p>
      ${km&&t?(x.per?`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:8px">${x.tgIn.map((v,i)=>`<label style="font-size:12.5px">ק״מ ${i+1}${km-i<1?' ('+(Math.round((km-i)*10)/10)+')':''}<input class="sm" style="width:100%" inputmode="text" value="${esc(v)}" oninput="fpW._tgi(${i},this.value)"></label>`).join('')}</div>
        <button type="button" class="linkb" style="margin-top:6px" onclick="fpW._e('per',false,1)">אותו קצב לכל הקילומטרים</button>`:`<button type="button" class="linkb" style="margin-top:6px" onclick="fpW._e('per',true,1)">לשנות לפי ק״מ</button>`):''}</div>
    <button type="button" class="btn full" onclick="fpW.myRunSave()">שמור</button>${id?`<button type="button" class="btn light full" style="margin-top:8px" onclick="fpW.myDel('RUN_MY','${id}')">מחק</button>`:''}</div>`)}

/* =========================================================
   the cardio tab
   ========================================================= */
let CV={mach:LS.get('fp2.carMach')||'',pick:null,lvlView:null};
function kinds(){const t=TP();const M=T_().MACH;const k=(Array.isArray(t.carKinds)?t.carKinds:[]).filter(x=>M[x]);return k.length?k:['ell']}
/* minutes of the week: cardio + runs (a run without time: about 6.5 minutes a km). A hard minute counts twice. */
function weekMinutes(a,b){let m=0;carLog().forEach(r=>{if(r.d>=a&&r.d<=b)m+=(Number(r.min)||0)+(Number(r.hm)||0)});runLog().forEach(r=>{if(r.d>=a&&r.d<=b)m+=r.s?r.s/60:(Number(r.km)||0)*6.5});return Math.round(m)}
function carToday(){const {c,wkx,sessions:ss}=carWeek(),ws=weekStart(today()),we=addDays(ws,6),doneL=carLog().filter(r=>r.d>=ws&&r.d<=we);
  const doneH=doneL.filter(r=>r.hard).length,doneE=doneL.length-doneH;let h1=doneH,e1=doneE;const done=ss.map(x=>x.k==='h'?(h1-->0):(e1-->0));
  const wp=weekPlan(),lab=label(wp.days,0,carHardMax()),td=dow(today());
  const hardWeek=doneH+runLog().filter(r=>r.d>=ws&&r.d<=we&&r.type&&r.type!=='plan'&&/פרטלק|אינטרוולים|עליות|ספרינטים|האצות|טמפו|התקדמות/.test(r.type)).length,yHard=carLog().some(r=>r.hard&&r.d===addDays(today(),-1));
  const todayHard=wp.mode==='P'?lab.hard[td]==='c':(hardWeek<2&&!yHard);
  let sug=ss.findIndex((x,i)=>!done[i]&&(todayHard?x.k==='h':x.k==='e'));if(sug<0)sug=ss.findIndex((x,i)=>!done[i]);
  return {c,wkx,ss,done,sug,wp,td,ws,we}}
function renderCar(){const box=$('fp221Car');if(!box)return;const T=T_();if(!T)return;const wn=wantOf();
  if(MINE.c)return renderMineCar(box);
  if(!wn.c){box.innerHTML=`<div class="sec"><h3>אירובי</h3><p class="mu" style="margin:0 0 10px">אירובי משפר את הלב והריאות, עוזר להתאושש בין אימונים ושורף קלוריות. מתחילים בקל, 2–3 פעמים בשבוע.</p><button type="button" class="btn full" onclick="fpW.carStart()">להוסיף אירובי</button></div>`;stopAnim();return}
  const M=T.MACH,ks=kinds(),k=ks.includes(CV.mach)?CV.mach:ks[0],m=M[k];
  const {c,ss,done,sug,wp,td,ws,we}=carToday();const pick=CV.pick!=null&&ss[CV.pick]?CV.pick:sug,cur=ss[pick];
  const plan=wp.mode==='P',rest=plan&&!wp.days[td].includes('c'),nd=plan?nextDay(wp.days,'c',td):-1;
  let h='';
  if(RECO().c&&rest&&cur&&!CV.force){
    h+=`<div class="sec reco"><div class="mu">מומלץ להיום · ${LV[c.lvl]} · שבוע ${c.wk}</div><div class="big">היום מנוחה מאירובי</div><p class="mu" style="margin:0 0 8px">${nd>=0?'האירובי הבא, יום '+W[nd]+': '+sName(cur)+'.':''}</p>
      <button type="button" class="btn light full" onclick="fpW.cforce()">בכל זאת להתאמן היום</button></div>`}
  else if(RECO().c){
    h+=`<div class="sec reco"><div class="mu">מומלץ להיום · ${LV[c.lvl]} · שבוע ${c.wk}</div>
    <div class="big">${!cur?'סיימת את האירובי של השבוע ✓':sName(cur)}</div>
    <div class="chips" style="margin:0 0 8px">${ss.map((x,i)=>`<button type="button" class="${i===pick?'on':''}" onclick="fpW.cpick(${i})">${done[i]?'✓ ':''}${sName(x)}</button>`).join('')}</div>
    <div class="chips" style="margin:0 0 4px">${ks.map(x=>`<button type="button" class="${x===k?'on':''}" onclick="fpW.mach('${x}')">${M[x].n}</button>`).join('')}</div>
    ${m.fig?T.exCard([m.fig[0],m.n,cur&&cur.k==='h'?'חזק':'קל',m.fig[1]],0):''}
    <div class="steps"><div><span>קל</span><b>${esc(m.easy)}</b></div><div><span>חזק</span><b>${esc(m.hard)}</b></div></div>
    ${cur?`<div class="steps">${phasesSummary(cur).map(s=>`<div><span>${s[0]}</span><b>${s[1]}</b></div>`).join('')}</div><button type="button" class="btn full" onclick="fpW.cgo(${pick})">התחל, הטיימר מוביל אותך</button>`:''}
    <button type="button" class="btn light full" style="margin-top:8px" onclick="fpW.cgo('own')">אימון משלי</button></div>`}
  else h+=`<div class="sec"><h3>אירובי</h3><div class="mu" style="margin-bottom:8px">${LV[c.lvl]} · שבוע ${c.wk}</div><div class="chips" style="margin:0 0 8px">${ss.map((x,i)=>`<button type="button" class="${i===pick?'on':''}" onclick="fpW.cpick(${i})">${done[i]?'✓ ':''}${sName(x)}</button>`).join('')}</div>
    ${cur?`<button type="button" class="btn full" onclick="fpW.cgo(${pick})">התחל: ${sName(cur)}</button>`:''}<button type="button" class="btn light full" style="margin-top:8px" onclick="fpW.cgo('own')">אימון משלי</button></div>`;
  const mins=weekMinutes(ws,we);
  h+=`<div class="sec"><h3>השבוע</h3><div class="rw" style="border:0;padding:0"><span>דקות אירובי, כולל ריצה</span><b style="font-variant-numeric:tabular-nums">${mins} / 150</b></div><div class="bar"><i style="width:${Math.min(100,mins/150*100)}%"></i></div>
    <p class="mu" style="margin:8px 0 0">150 דקות בשבוע זו ההמלצה הבריאותית. דקה חזקה נספרת כמו 2 קלות.</p></div>`;
  h+=`<div class="sec"><h3>איך מחלקים את הימים</h3><ul class="rl"><li><b>הכי הרבה 2 אימונים חזקים בשבוע</b>, ביחד עם הריצה.</li><li>לפחות 48 שעות בין שני אימונים חזקים.</li><li>לא חזק ביום רגליים ולא יום לפניו.</li><li>אירובי קל אפשר אחרי כוח. עדיף כמה שעות הפרש.</li><li>בשבוע עם ריצה איכותית, האירובי קל יותר.</li><li>כל שבוע רביעי בערך קל, כדי להתאושש.</li></ul></div>`;
  const lv=CV.lvlView||c.lvl,P=CPLAN[lv];
  h+=`<div class="sec"><h3>התוכנית</h3><div class="seg">${Object.keys(LV).map(x=>`<button type="button" class="${x===lv?'on':''}" onclick="fpW.lv('${x}')">${LV[x]}${x===c.lvl?' · אתה כאן':''}</button>`).join('')}</div>
    <p class="mu" style="margin:0 0 6px">${P.intro}</p>${P.w.map((w,i)=>`<div class="pl ${lv===c.lvl?(i+1<c.wk?'done':i+1===c.wk?'cur':'lock'):''}"><i>${i+1}</i><div>${esc(w.t)}</div></div>`).join('')}
    ${lv==='adv'?'<div class="why">לפני 4×4: צריך להחזיק 30 דק׳ קל ברצף. לא מחזיק את הקצב? חוזרים ל-3 קטעים לשבוע-שבועיים.</div>':''}
    ${lv!==c.lvl?`<button type="button" class="btn light full" style="margin-top:8px" onclick="fpW.cset('lvl','${lv}')">לעבור ל${LV[lv]}</button>`:''}</div>`;
  const age=Number((getProfile&&getProfile()||{}).age)||0,hm=age?Math.round(208-.7*age):0;
  h+=`<div class="sec"><h3>כמה חזק זה ״קל״ ו״חזק״?</h3><div class="steps"><div><span>קל</span><b>מדברים במשפטים שלמים</b></div><div><span>בינוני</span><b>משפטים קצרים</b></div><div><span>חזק</span><b>רק כמה מילים</b></div></div>
    ${hm?`<p class="mu" style="margin:6px 0 0">עם שעון: הדופק המקסימלי שלך בערך ${hm}. קל = ${Math.round(hm*.6)}–${Math.round(hm*.7)}, חזק = ${Math.round(hm*.85)}–${Math.round(hm*.95)}.</p>`:''}</div>`;
  box.innerHTML=h;anim()}
function phasesSummary(x){if(x.k==='e')return[['חימום','3 דק׳ איטי'],['העיקר',Math.max(5,x.min-5)+' דק׳ קל'],['סיום','2 דק׳ איטי']];
  return[['חימום','10 דק׳ קל'],['העיקר',x.n+' × '+x.h+' דק׳ חזק, '+x.r+' דק׳ קל ביניהם'],['סיום','5 דק׳ קל'],['סה״כ',sMin(x)+' דק׳']]}
const CCAT=[['e','קל'],['h','קטעים']];
const carMy=()=>J('CAR_MY',[]);
function renderMineCar(box){const T=T_(),M=T.MACH,my=carMy(),L=carLog();
  let h=mineHd('c','האירובי שלי');
  h+=`<div class="sec"><h3>האירובי הקבוע שלי</h3>${folderTiles('c',CCAT,my,x=>x.kind||'e')}`;
  if(FOLD.c){const list=my.filter(x=>(x.kind||'e')===FOLD.c);
    h+=list.length?`<div class="cards">${list.map(x=>`<div class="card2"><div><b>${esc(x.name)}</b><small>${esc((M[x.k]||{n:''}).n)} · ${x.kind==='h'?x.n+' × '+x.h+' דק׳ חזק':x.min+' דק׳ קל'}</small><small>פעם אחרונה: ${lastOf(x.name,L)}</small></div><div class="acts"><button type="button" class="btn" onclick="fpW.myCarGo('${x.id}')">התחל</button><button type="button" class="btn light" onclick="fpW.myCarEdit('${x.id}')">עריכה</button></div></div>`).join('')}</div>`:`<p class="mu" style="margin:8px 0 0">אין עדיין אימונים בתיקייה הזו.</p>`}
  h+=`<button type="button" class="btn secondary full" style="margin-top:10px" onclick="fpW.myCarEdit('')">＋ אירובי קבוע חדש</button></div>`;
  const tot=L.reduce((s,r)=>s+(Number(r.min)||0),0),vals=lastWeeks(4,(a,b)=>weekMinutes(a,b));
  h+=`<div class="sec"><h3>הסיכום</h3><div class="stats"><div><b>${Math.round(tot/6)/10}</b><span>שעות בסך הכל</span></div><div><b>${L.length}</b><span>אימונים</span></div><div><b>${L.filter(r=>r.hard).length}</b><span>אימונים חזקים</span></div></div>
    ${chartHtml(vals,wkLabels(4),Math.max(200,Math.ceil(Math.max(...vals)/50)*50),150)}
    ${L.length?`<div class="ls">${L.slice(-5).reverse().map(r=>`<div class="r"><div>${W[dow(r.d)]} ${r.d.slice(8,10)}.${r.d.slice(5,7)} · ${esc(r.name||(M[r.k]||{n:'אירובי'}).n)}<small>${r.min} דק׳</small></div><span class="pill ${r.hard?'h':''}">${r.hard?'חזק':'קל'}</span></div>`).join('')}</div><p class="mu" style="margin:6px 0 0">לעריכה: ביומן.</p>`:'<p class="mu" style="margin:0">עוד אין אימונים.</p>'}</div>`;
  h+=`<div class="sec"><h3>מדליות אירובי</h3>${medalsHtml(CAR_MEDALS)}</div>`;
  box.innerHTML=h;stopAnim()}
function myCarForm(id){const T=T_(),M=T.MACH,x=id===null?WK.edit:Object.assign({id:'',name:'',kind:FOLD.c||'e',k:kinds()[0],min:30,n:4,h:4,r:3},carMy().find(r=>r.id===id)||{});WK={edit:x};id=x.id;
  T.sheet(id?'עריכת אירובי קבוע':'אירובי קבוע חדש',`<div class="f21"><div class="field"><label>שם</label><input value="${esc(x.name)}" placeholder="למשל: אופניים אחרי כוח" oninput="fpW._e('name',this.value)"></div>
    <label>מכשיר</label><div class="chips" style="margin:4px 0 10px">${Object.keys(M).map(k=>`<button type="button" class="${x.k===k?'on':''}" onclick="fpW._e('k','${k}',2)">${M[k].n}</button>`).join('')}</div>
    <label>סוג</label><div class="chips" style="margin:4px 0 10px">${CCAT.map(([k,l])=>`<button type="button" class="${x.kind===k?'on':''}" onclick="fpW._e('kind','${k}',2)">${l}</button>`).join('')}</div>
    ${x.kind==='h'?`<div class="row"><div class="field"><label>כמה קטעים</label><input inputmode="numeric" value="${esc(x.n)}" oninput="fpW._e('n',this.value)"></div><div class="field"><label>דק׳ חזק</label><input inputmode="numeric" value="${esc(x.h)}" oninput="fpW._e('h',this.value)"></div><div class="field"><label>דק׳ קל ביניהם</label><input inputmode="numeric" value="${esc(x.r)}" oninput="fpW._e('r',this.value)"></div></div><p class="mu" style="margin:0 0 8px">כולל 10 דק׳ חימום ו-5 דק׳ סיום.</p>`
      :`<div class="field"><label>כמה דקות</label><input inputmode="numeric" value="${esc(x.min)}" oninput="fpW._e('min',this.value)"></div>`}
    <button type="button" class="btn full" onclick="fpW.myCarSave()">שמור</button>${id?`<button type="button" class="btn light full" style="margin-top:8px" onclick="fpW.myDel('CAR_MY','${id}')">מחק</button>`:''}</div>`)}

/* ---------- timer: keeps running when the sheet is closed (a small box at the bottom) ---------- */
let TM=null,tInt=0;
const tmTotal=()=>TM.ph.reduce((s,x)=>s+x[1],0);
function tmState(){const el=(Date.now()-TM.at)/1000;let acc=0,i=0;for(;i<TM.ph.length;i++){if(el<acc+TM.ph[i][1])break;acc+=TM.ph[i][1]}return {el,i,left:i<TM.ph.length?acc+TM.ph[i][1]-el:0}}
function timerSheet(){const T=T_(),M=T.MACH,k=TM.k,m=M[k],ph=TM.ph;let i=TM.i,left=ph[0][1],el=0;if(TM.run){const s=tmState();i=Math.min(s.i,ph.length-1);left=s.left;el=s.el}const cur=ph[i];TM.open=1;hideFloat();
  T.sheet(esc(TM.title),`<div class="fpT-timer" id="fpWtBox"><div class="muted" id="fpWtPh">${cur[0]} · שלב ${i+1} מתוך ${ph.length} · ${esc(m.n)}</div><div class="big" id="fpWtBig">${mmss(Math.max(0,left))}</div>
    <div class="tprog"><i id="fpWtProg" style="width:${Math.min(100,el/tmTotal()*100)}%"></i></div><div class="muted" style="font-size:12.5px;margin:-2px 0 8px" id="fpWtTot">${mmss(el)} מתוך ${mmss(tmTotal())}</div>
    <div class="muted" style="margin:6px 0" id="fpWtWhat">${cur[2]==='h'?'חזק: '+esc(m.hard):'קל: '+esc(m.easy)}</div>
    ${TM.run?`<div class="row"><button type="button" class="btn stopb" onclick="fpW.tstop(0)">עצור</button><button type="button" class="btn" onclick="fpW.tstop(1)">סיימתי ושמור</button></div><button type="button" class="btn light full" style="margin-top:8px" onclick="fpT.close()">להקטין, הטיימר ממשיך</button>`:`<button type="button" class="btn full" onclick="fpW.tstart()">התחל</button>`}</div>
    <p class="mu" style="font-size:12.5px;margin:0 0 8px">במעבר בין שלבים ובסוף יש צליל, אותו צליל של סוף מנוחה (בהגדרות).</p>
    ${m.fig?T.exCard([m.fig[0],m.n,cur[2]==='h'?'חזק':'קל',m.fig[1]],0):''}`)}
function floatHtml(){const s=tmState(),cur=TM.ph[Math.min(s.i,TM.ph.length-1)];return `<button type="button" class="fl" onclick="fpW.topen()" aria-label="פתח את הטיימר"><span><b>${esc(TM.title)}</b><small>${cur[0]}</small></span><b class="t">${mmss(Math.max(0,s.left))}</b></button><span class="pr"><i style="width:${Math.min(100,s.el/tmTotal()*100)}%"></i></span>`}
function showFloat(){let f=$('fpCarFloat');if(!f){document.body.insertAdjacentHTML('beforeend','<div id="fpCarFloat" role="status"></div>');f=$('fpCarFloat')}f.innerHTML=floatHtml()}
function hideFloat(){const f=$('fpCarFloat');if(f)f.remove()}
function tTick(){if(!TM||!TM.run)return;const s=tmState();
  if(s.i!==TM.i){TM.i=s.i;try{fpRestSound&&fpRestSound()}catch(_){}if(s.i>=TM.ph.length){clearInterval(tInt);return fpW.tstop(1,1)}if(TM.open&&$('fpTSheet'))timerSheet();}
  const cur=TM.ph[Math.min(s.i,TM.ph.length-1)];
  if(TM.open&&$('fpWtBig')){$('fpWtBig').textContent=mmss(Math.max(0,s.left));const pr=$('fpWtProg');if(pr)pr.style.width=Math.min(100,s.el/tmTotal()*100)+'%';const tt=$('fpWtTot');if(tt)tt.textContent=mmss(s.el)+' מתוך '+mmss(tmTotal())}
  else if(!TM.open)showFloat()}
async function saveCardio(min,k,hard,hm,name){const T=T_(),m=T.MACH[k]||{n:'אירובי'};const log=carLog();const row={d:today(),min,k,hard:!!hard,hm:hm||0};if(name)row.name=name;log.push(row);setProp('CARDIO_LOG',JSON.stringify(log.slice(-400)));
  try{const r=await call('createWorkoutSession',{date:state.date,name:'אירובי',type:'אירובי'});state.data.workout=await call('saveWorkout',{date:state.date,muscleGroup:'אירובי',exercise:m.n,sets:[{weight:'',reps:1,note:min+' דקות'+(hard?' · חזק':'')}],notes:min+' דקות',sessionName:'אירובי',sessionId:r.id});
    try{state.data.workout=(await call('finishWorkoutSession',{id:r.id,minutes:min})).workout||state.data.workout}catch(_){}}catch(e){console.warn(e)}}

/* =========================================================
   settings pages (shown from Settings → אימונים)
   ========================================================= */
/* 2.23: skip the warm-up screen and/or the stretches */
function skipHtml(){const k=fpT._.skip(),sw=(on,key,l,sub)=>`<div class="rw"><span>${l}<br><small class="mu">${sub}</small></span><label class="fpSw"><input type="checkbox" ${on?'checked':''} onchange="fpW.rskip('${key}',this.checked)" aria-label="${l}"><span></span></label></div>`;
  return `<div class="sec"><b>שלבים בריצה</b>${sw(k.w,'w','לדלג על החימום','ישר מהבחירה לריצה')}${sw(k.s,'s','לדלג על המתיחות','אחרי הריצה: סיום')}</div>`}
function runSetHtml(){const T=T_(),p=fpT.plan();
  if(!p)return `<div class="f21"><div class="sec"><p class="mu" style="margin:0 0 10px">עוד אין תוכנית ריצה.</p><button type="button" class="btn full" onclick="fpT.setupOpen()">צור תוכנית ריצה</button></div>${skipHtml()}</div>`;
  const goal=Number(p.goal)||5,total=T.planWeeks?Math.max(12,T.planWeeks(p.start,goal)):12;
  return `<div class="f21"><div class="sec planc"><span class="mu">התוכנית שלך</span><div class="big">מ-${kmTxt(p.start)} ל-${goal===21.1?'חצי מרתון':goal+' ק״מ'}</div><div class="bar"><i style="width:${Math.min(100,p.week/total*100)}%;background:#7CC4FF"></i></div><span class="mu">שבוע ${p.week} מתוך ${total}</span></div>
    <div class="sec"><div class="rw"><span>יעד</span><span class="chips">${[3,5,7,10,15,21.1].map(k=>`<button type="button" class="${Number(p.goal)===k?'on':''}" onclick="fpW.rset('goal',${k})">${k===21.1?'חצי':k}</button>`).join('')}</span></div>
    <div class="rw"><span>ריצות בשבוע</span><span class="stp"><button type="button" aria-label="פחות" onclick="fpW.rset('runs',${Math.max(1,p.runs-1)})">−</button><b>${p.runs}</b><button type="button" aria-label="יותר" onclick="fpW.rset('runs',${Math.min(5,p.runs+1)})">+</button></span></div>
    <div class="rw"><span>קצב נוח שלי (דק׳ לק״מ)</span><input class="sm" value="${esc(p.paceNow||'')}" placeholder="6:00" onchange="fpW.rset('paceNow',this.value)"></div>
    <div class="rw"><span>קצב יעד (לא חובה)</span><input class="sm" value="${esc(p.paceGoal||'')}" placeholder="5:30" onchange="fpW.rset('paceGoal',this.value)"></div></div>
    <div class="sec"><div class="rw"><span>השבוע היה קשה</span><button type="button" class="linkb" onclick="fpW.rrep()">לחזור על השבוע</button></div>
    <div class="rw" style="display:block"><span>מדידה ב-GPS</span><p class="mu" style="margin:4px 0 0">בזמן ריצה: ״התחל מדידה״ פותח מסך ריצה שנשאר דלוק, ורושם לבד את הזמן של כל ק״מ. מסך נעול עוצר את המדידה. רצת עם שעון? מעתיקים לכאן אחרי הריצה.</p></div>
    <div class="rw"><span>תוכנית חדשה</span><button type="button" class="linkb" onclick="fpT.setupOpen()">להתחיל מחדש</button></div></div>${skipHtml()}</div>`}
function carSetHtml(){const T=T_(),M=T.MACH,t=TP(),wn=wantOf();
  if(!wn.c)return `<div class="f21"><div class="sec"><p class="mu" style="margin:0 0 10px">אין אירובי בתוכנית.</p><button type="button" class="btn full" onclick="fpW.carStart()">להוסיף אירובי</button></div></div>`;
  const c=clv(),ks=kinds(),n=Number(t.car)||carWeek().sessions.length;
  return `<div class="f21"><div class="sec"><div class="rw"><span>רמה</span><span class="chips">${Object.keys(LV).map(x=>`<button type="button" class="${x===c.lvl?'on':''}" onclick="fpW.cset('lvl','${x}')">${LV[x]}</button>`).join('')}</span></div>
    <div class="rw"><span>אימונים בשבוע</span><span class="stp"><button type="button" aria-label="פחות" onclick="fpW.cset('car',${Math.max(1,n-1)})">−</button><b>${n}</b><button type="button" aria-label="יותר" onclick="fpW.cset('car',${Math.min(5,n+1)})">+</button></span></div>
    <div class="rw" style="display:block"><span>מכשירים</span><div class="chips" style="margin-top:6px">${Object.keys(M).map(x=>`<button type="button" class="${ks.includes(x)?'on':''}" onclick="fpW.cset('kind','${x}')">${M[x].n}</button>`).join('')}</div></div></div>
    <div class="sec"><div class="rw"><span>שבוע קשה מדי</span><button type="button" class="linkb" onclick="fpW.cset('rep',1)">לחזור על השבוע</button></div>
    <p class="mu" style="margin:6px 0 0">הצליל בין קל לחזק הוא צליל סוף המנוחה.</p></div></div>`}

/* =========================================================
   actions
   ========================================================= */
let WK=null;
const refreshPage=()=>{try{window.fp222&&fp222.refreshPage&&fp222.refreshPage()}catch(_){}};
const uid=()=>Math.random().toString(36).slice(2,9);
window.fpW={
  tab(t){TAB=t;LS.set('fp2.wTab',t);MINE.r=MINE.c=false;mount();window.scrollTo(0,0)},
  get cur(){return TAB},
  mine(t,on){if(t==='s'){if(on!==0)showView('workoutLibrary');return}MINE[t]=on===undefined?!MINE[t]:!!on;mount();window.scrollTo(0,0)},
  isMine(t){return !!MINE[t]},
  fold(t,k){FOLD[t]=FOLD[t]===k?'':k;mount()},
  _e(k,v,re){if(!WK||!WK.edit)return;WK.edit[k]=v;if(re===1)myRunForm(null);if(re===2)myCarForm(null)},
  _tgl(){const l=$('fpTgL');if(l&&WK&&WK.edit)l.innerHTML=tgLine(WK.edit)},
  _tgi(i,v){if(!WK||!WK.edit)return;WK.edit.tgIn=WK.edit.tgIn||[];WK.edit.tgIn[i]=v;fpW._tgl()},
  myRunEdit(id){myRunForm(id)},
  myRunSave(){const x=WK.edit;x.name=String(x.name||'').trim();if(!x.name)return toast('כתוב שם',true);if(x.tm&&!sec(x.tm))return toast('היעד בפורמט דקות:שניות, למשל 30:00',true);const tg=tgOf(x);if(tg)x.tg=tg;else delete x.tg;delete x.tgIn;const a=runMy();if(!x.id)x.id=uid();const i=a.findIndex(r=>r.id===x.id);if(i>=0)a[i]=x;else a.push(x);setProp('RUN_MY',JSON.stringify(a));FOLD.r=x.cat;fpT.close();try{toast('נשמר')}catch(_){}mount()},
  myRunGo(id){const x=runMy().find(r=>r.id===id);if(x)fpT.runFixed(x)},
  myCarEdit(id){myCarForm(id)},
  myCarSave(){const x=WK.edit;x.name=String(x.name||'').trim();if(!x.name)return toast('כתוב שם',true);['min','n','h','r'].forEach(k=>x[k]=Math.max(1,Math.min(180,Number(x[k])||1)));const a=carMy();if(!x.id)x.id=uid();const i=a.findIndex(r=>r.id===x.id);if(i>=0)a[i]=x;else a.push(x);setProp('CAR_MY',JSON.stringify(a));FOLD.c=x.kind;fpT.close();try{toast('נשמר')}catch(_){}mount()},
  myCarGo(id){const x=carMy().find(r=>r.id===id);if(!x)return;const s=x.kind==='h'?I(x.n,x.h,x.r):E(x.min);TM={k:x.k||kinds()[0],ph:phases(s),title:x.name,name:x.name,hard:x.kind==='h',hm:x.kind==='h'?x.n*x.h:0,i:0,t:0,run:false};timerSheet()},
  myDel(key,id){if(!confirm('למחוק?'))return;setProp(key,JSON.stringify(J(key,[]).filter(r=>r.id!==id)));fpT.close();mount()},
  runGo(i){fpT.run();fpT.pick(i)},
  shoes(){const total=runLog().reduce((s,r)=>s+(Number(r.km)||0),0);setProp('SHOE_START',String(total));setProp('SHOE_WARN','[]');try{toast('זוג חדש, מתחילים מ-0')}catch(_){}mount()},
  rset(k,v){const p=J('RUN_PLAN',null);if(!p)return;if(k==='goal'||k==='runs')p[k]=Number(v);else p[k]=String(v||'').trim();setProp('RUN_PLAN',JSON.stringify(p));
    if(k==='runs'){const t=TP();t.run=Number(v);setProp('TRAIN_PLAN',JSON.stringify(t))}try{toast('התוכנית עודכנה')}catch(_){}mount();refreshPage()},
  rskip(k,on){const o=J('RUN_SKIP',{})||{};o[k]=on?1:0;setProp('RUN_SKIP',JSON.stringify(o));try{toast('נשמר')}catch(_){}},
  rrep(){fpT.repeatWeek();try{toast('השבוע הבא יהיה אותו שבוע שוב')}catch(_){}mount();refreshPage()},
  mach(k){CV.mach=k;LS.set('fp2.carMach',k);renderCar()},
  cpick(i){CV.pick=i;renderCar()},
  cforce(){CV.force=1;renderCar()},
  lv(x){CV.lvlView=x;renderCar()},
  cset(k,v){const t=TP();
    if(k==='lvl'){setProp('CARDIO_LVL',JSON.stringify({lvl:v,since:weekStart(today())}));CV.lvlView=null}
    if(k==='car'){t.car=v;t.carGoal=v;setProp('TRAIN_PLAN',JSON.stringify(t))}
    if(k==='kind'){const a=Array.isArray(t.carKinds)?t.carKinds.slice():[];const i=a.indexOf(v);if(i>=0){if(a.length>1)a.splice(i,1)}else a.push(v);t.carKinds=a;setProp('TRAIN_PLAN',JSON.stringify(t))}
    if(k==='rep'){const c=J('CARDIO_LVL',null)||{lvl:clv().lvl,since:weekStart(today())};c.rep=(Number(c.rep)||0)+1;setProp('CARDIO_LVL',JSON.stringify(c));try{toast('השבוע הבא יהיה אותו שבוע שוב')}catch(_){}}
    else if(k!=='kind'){try{toast('התוכנית עודכנה')}catch(_){}}
    CV.pick=null;mount();refreshPage()},
  carStart(){const t=TP();t.want=Array.isArray(t.want)?t.want:[];if(!t.want.includes('car'))t.want.push('car');t.car=t.car||2;t.carGoal=t.car;t.carKinds=Array.isArray(t.carKinds)&&t.carKinds.length?t.carKinds:['ell'];t.set=t.set||today();
    setProp('TRAIN_PLAN',JSON.stringify(t));setProp('CARDIO_LVL',JSON.stringify({lvl:'beg',since:weekStart(today())}));mount();refreshPage()},
  cgo(i){const ks=kinds(),k=ks.includes(CV.mach)?CV.mach:ks[0];
    if(TM&&TM.run)return timerSheet();
    if(i==='own'){TM={k,ph:[['אימון משלי',3600,'e']],title:'אימון משלי',hard:false,hm:0,i:0,t:0,run:false};return timerSheet()}
    const x=carWeek().sessions[i];if(!x)return;TM={k,ph:phases(x),title:sName(x),hard:x.k==='h',hm:x.k==='h'?x.n*x.h:0,i:0,t:0,run:false};timerSheet()},
  tstart(){TM.run=true;TM.at=Date.now();TM.i=0;clearInterval(tInt);tInt=setInterval(tTick,1000);timerSheet()},
  topen(){if(TM)timerSheet()},
  async tstop(save,auto){clearInterval(tInt);const r=TM;if(!r)return;const was=r.run;r.run=false;hideFloat();
    if(save&&was){const min=Math.max(1,Math.round((Date.now()-r.at)/60000));await saveCardio(min,r.k,r.hard&&min>=10,r.hard?r.hm:0,r.name);try{toast((auto?'סיימת. ':'')+'נשמר: '+min+' דקות אירובי')}catch(_){}TM=null;if($('fpTSheet'))fpT.close();CV.pick=null;try{renderWorkouts(false)}catch(_){}mount();return}
    TM=null;if($('fpTSheet'))fpT.close()},
  runSetHtml,carSetHtml,
  _:{build,label,clv,carWeek,weekPlan,phases,weekDone,weekMinutes,RUN_MEDALS,CAR_MEDALS}
};
/* closing the sheet: a running timer keeps going in a small box */
if(window.fpT){const oc=fpT.close;fpT.close=function(){if(TM){if(TM.run){TM.open=0;showFloat()}else TM=null}return oc.apply(this,arguments)}}
/* 2.23: a tap outside a running timer (or the run with GPS) makes it small, like "להקטין" */
document.addEventListener('click',e=>{const o=$('fpTSheet');if(!o||e.target!==o)return;if((TM&&TM.run)||(fpT.gpsOn&&fpT.gpsOn())){e.preventDefault();e.stopPropagation();fpT.close()}},true);
/* 2.23: run kinds — sprints became intervals; pace-change runs moved to their own folder (once) */
Object.defineProperty(window.fpW,'RK',{get:()=>fpT._.RK});window.fpW.kindOf=r=>fpT._.kindOf(r);
const mig=setInterval(()=>{if(typeof state==='undefined'||!state.data||!window.FP2||!FP2.getProp)return;clearInterval(mig);if(prop('MIG223')==='1')return;
  try{const ren=t=>t==='ספרינטים'?'אינטרוולים':t==='האצות קצרות'?'האצות':t;
    const my=runMy();let ch=false;my.forEach(x=>{const t=ren(x.type);if(t!==x.type){x.type=t;ch=true}const k=fpT._.kindByName(x.type),c=fpT._.RK[k]&&fpT._.RK[k].cat;if(c&&x.cat!==c&&(x.cat==='fast'||x.cat==='pace')){x.cat=c;ch=true}});if(ch)setProp('RUN_MY',JSON.stringify(my));
    const L=runLog();let lc=false;L.forEach(r=>{const t=ren(r.type);if(t!==r.type){r.type=t;lc=true}});if(lc)setProp('RUN_LOG',JSON.stringify(L));
    setProp('MIG223','1')}catch(e){console.warn(e)}},900);
/* after a run is saved, refresh the tab */
if(window.fpT){const or=fpT.ran;fpT.ran=async function(){const r=await or.apply(this,arguments);try{mount()}catch(_){}return r}}
})();
