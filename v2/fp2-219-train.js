/* FitPro 2.19.0 — running and cardio, on the workout screen.
   ריצה: a plan that follows the goal distance (2 runs a week by default), this week + the first month only,
   a run = pick → warm-up (choose 3–4) → run (log km/time, "רצתי בלי לעצור") → stretches (choose 3–4).
   3 km without stopping = medal, and only then fartlek / hills / intervals / sprints open, small at first.
   Long repeats (400–1,000 m) only after 10 km. Legs in the gym only once a week for runners.
   אירובי: a beginner or an advanced plan, the machine you chose with its settings and figure, and a live timer for 4×4.
   Figures are the app's own exercise figures. */
(function(){
'use strict';
const prop=k=>{try{return FP2.getProp(k)||''}catch(_){return ''}};
const setProp=(k,v)=>{try{FP2.setProp(k,v)}catch(_){}};
const J=(k,d)=>{try{return JSON.parse(prop(k)||'')||d}catch(_){return d}};
const today=()=>state.todayDate||state.date||new Date().toISOString().slice(0,10);
const mmss=x=>Math.floor(x/60)+':'+String(Math.round(x%60)).padStart(2,'0');
/* 2.23.1: "30" = 30 minutes (and "6" = 6:00), not only "30:00" */
const sec=s=>{const v=String(s||'').trim();if(/^\d{1,3}$/.test(v))return Number(v)>0?Number(v)*60:null;const m=v.match(/^(\d{1,3})[:.](\d{1,2})$/);return m?(+m[1])*60+(+m[2]):null};
/* 2.24: reset per type = a date AND a time ("2026-10-12T22:05:00"). A row is shown only if it is newer than the reset.
   Rows from before 2.24 have only a date: on the reset day itself they count as "before". New rows get t=Date.now(). */
window.fpRA=t=>{const o=J('RESET_AT',{})||{};return o[t]||''};
window.fpVis=(t,r)=>{const a=fpRA(t);if(!a||!r)return true;const d=a.slice(0,10),rd=String(r.d||r.date||'').slice(0,10);if(rd>d)return true;if(rd<d)return false;
  if(a.length<=10)return true;const ts=Date.parse(a),rt=r.t||(r.createdAt?Date.parse(r.createdAt):0);return !!(rt&&ts&&rt>=ts)};
const daysBetween=(a,b)=>Math.round((new Date(b+'T12:00:00')-new Date(a+'T12:00:00'))/864e5);
document.head.insertAdjacentHTML('beforeend',`<style id="fp219tcss">
.fpT-card{background:var(--card,#171C22);border:1px solid var(--line,#2C3640);border-radius:16px;padding:12px 14px;margin:0 0 12px}
.fpT-card h3{margin:0 0 4px;font-size:17px}.fpT-card .muted{font-size:13.5px}
.fpT-wk{display:grid;grid-template-columns:70px 1fr;gap:8px;padding:7px 0;border-bottom:1px solid var(--line,#2C3640);font-size:14px}.fpT-wk:last-child{border:0}.fpT-wk b{color:var(--brand,#D7F36B)}
.fpT-wk.now{background:#2B3A1B;border-radius:10px;padding:7px 6px}
.fpT-seg{display:flex;background:#1F262E;border:1px solid var(--line,#2C3640);border-radius:12px;padding:3px;gap:3px;margin:8px 0}
.fpT-seg button{flex:1;font:inherit;font-size:13.5px;border:0;background:none;color:var(--muted,#A3ADB8);border-radius:9px;padding:7px;cursor:pointer}.fpT-seg button.on{background:#2B3A1B;color:var(--brand,#D7F36B);font-weight:700}
.fpT-ex{display:grid;grid-template-columns:120px 1fr;gap:10px;align-items:start;background:#1F262E;border:1px solid var(--line,#2C3640);border-radius:16px;padding:10px;margin:8px 0}
.fpT-ex svg{width:120px;height:120px;background:#1B222A;border-radius:12px}
.fpT-ex h4{margin:0 0 4px;font-size:15px}.fpT-ex p{margin:2px 0;font-size:13.5px;line-height:1.5}.fpT-ex .no{color:#F09595}
.fpT-ex.pick{outline:2px solid var(--brand,#D7F36B)}
.fpT-chip{font:inherit;font-size:13px;border:1px solid var(--line,#2C3640);background:#171C22;color:inherit;border-radius:99px;padding:5px 11px;cursor:pointer;margin-top:6px}
.fpT-chip.on{background:#2B3A1B;border-color:var(--brand,#D7F36B);color:var(--brand,#D7F36B)}.fpT-chip.lock{opacity:.5}
.fpT-good{background:rgba(215,243,107,.08);border:1px solid rgba(215,243,107,.3);border-radius:14px;padding:10px 12px;margin:8px 0;line-height:1.55}
.fpT-warn{background:rgba(240,149,149,.1);border:1px solid rgba(240,149,149,.45);border-radius:14px;padding:10px 12px;margin:8px 0;line-height:1.55}
.fpT-timer{text-align:center;padding:12px;background:#1F262E;border-radius:16px;margin:8px 0}.fpT-timer .big{font-size:46px;font-weight:800}
.fpT-bar{display:flex;gap:3px;margin:8px 0}.fpT-bar span{height:24px;border-radius:6px;display:grid;place-items:center;font-size:11px;font-weight:700}.fpT-bar .h{background:var(--brand,#D7F36B);color:#14190a}.fpT-bar .e{background:#2B3A1B;color:var(--brand,#D7F36B)}.fpT-bar .cur{outline:2px solid #fff}
#fpTSheet .sheet{max-height:94vh;overflow:auto}
</style>`);

/* ---------- running plan ---------- */
const INTV=['6 × 60 מ׳ מהיר, הליכה חזרה','8 × 60 מ׳','6 × 100 מ׳','8 × 100 מ׳','6 × 150 מ׳','8 × 150 מ׳','6 × 200 מ׳','8 × 200 מ׳'];
const INTV_LONG=['6 × 400 מ׳, ריצה קלה 90 שנ׳ ביניהם','5 × 600 מ׳, 2 דק׳ קל','4 × 800 מ׳, 2.5 דק׳ קל','4 × 1,000 מ׳, 3 דק׳ קל'];
const FART=['פרטלק: 6 × 15 שנ׳ מהיר בתוך ריצה קלה','פרטלק: 6 × 20 שנ׳','פרטלק: 6 × 30 שנ׳','פרטלק: 8 × 30 שנ׳','פרטלק: 6 × 45 שנ׳'];
const HILL=['עליות: 4 × 10 שנ׳','עליות: 6 × 10 שנ׳','עליות: 6 × 15 שנ׳','עליות: 8 × 15 שנ׳'];
const DAYS=['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
/* 2.23: one list of run kinds, each one a different run (sprints are short intervals, so they are intervals).
   cat = the folder: easy / long / fast (speed) / pace (pace changes). */
const RK={easy:{n:'קלה',cat:'easy',d:'ריצה בקצב נוח שאפשר לדבר בו במשפטים שלמים. רוב הריצות בשבוע.'},
  long:{n:'ארוכה',cat:'long',d:'הריצה הכי ארוכה בשבוע, בקצב קל. בונה סיבולת.'},
  int:{n:'אינטרוולים',cat:'fast',d:'קטעים מהירים (100 מ׳ עד 1 ק״מ) עם הליכה או ריצה קלה ביניהם. ספרינטים הם אינטרוולים קצרים מאוד.'},
  hill:{n:'עליות',cat:'fast',d:'עולים מהר בעלייה של 4–8%, בין 10 ל-60 שניות, ויורדים בהליכה.'},
  tempo:{n:'טמפו',cat:'fast',d:'15–30 דקות רצופות בקצב ״קשה אבל נשלט״, אותו קצב כל הזמן. אפשר להגיד רק כמה מילים.'},
  fart:{n:'פרטלק',cat:'pace',d:'ריצה רצופה שמחליפים בה קצב לפי ההרגשה: מהר עד עמוד, לאט עד הפינה. בלי עצירות.'},
  prog:{n:'ריצת התקדמות',cat:'pace',d:'מתחילים קל ומאיצים בהדרגה. החלק האחרון הכי מהיר.'},
  track:{n:'מסלול',cat:'pace',d:'סיבובים על מסלול (בדרך כלל 400 מ׳). לוחצים ״+ סיבוב״ בסוף כל סיבוב ורואים את הזמן של כל אחד.'},
  stride:{n:'האצות',cat:'pace',d:'בסוף ריצה קלה: 4–8 האצות של 15–20 שניות, מהר אבל לא ספרינט מלא, והליכה ביניהן.'},
  plan:{n:'מהתוכנית',cat:null,d:''}};
function kindOf(r){const t=String((r&&r.type)||'');if(!t||t==='plan')return 'plan';
  if(/ספרינט|אינטרוול/.test(t))return 'int';if(/עליות/.test(t))return 'hill';if(/טמפו/.test(t))return 'tempo';if(/פרטלק/.test(t))return 'fart';if(/התקדמות/.test(t))return 'prog';if(/האצות/.test(t))return 'stride';if(/מסלול|סיבוב/.test(t))return 'track';if(/ארוכה/.test(t))return 'long';return 'easy'}
const kindByName=n=>Object.keys(RK).find(k=>RK[k].n===n)||kindOf({type:n});
/* 2.23: settings — skip the warm-up / the stretches */
const skip=()=>{const s=J('RUN_SKIP',{})||{};return {w:!!s.w,s:!!s.s}};
function plan(){const p=J('RUN_PLAN',null);if(!p)return null;p.goal=Number(p.goal)||5;p.start=Number(p.start)||0;p.runs=Math.max(1,Number(p.runs)||2);p.kind=p.start<3?'start':p.goal<=5?'k5':p.goal<=10?'k10':p.goal<=15?'k15':'half';
  p.name={start:'מתחילים לרוץ',k5:'משפרים 5 ק״מ',k10:'עד 10 ק״מ',k15:'עד 15 ק״מ',half:'עד חצי מרתון'}[p.kind];p.gp=sec(p.paceGoal);p.now=sec(p.paceNow);
  /* 2.23: a new plan "from zero" counts only the runs since it started (the old runs stay in the journal) */
  const log=J('RUN_LOG',[]).filter(r=>(!p.resetAt||(r.d||'')>=p.resetAt)&&fpVis('r',r));p.best=log.filter(r=>r.ok).reduce((m,r)=>Math.max(m,Number(r.km)||0),0);p.base=Math.max(p.start,p.best);
  /* the week moves on by itself every 7 days; "the week was hard" (weekly summary) repeats it */
  p.week=Math.max(1,Math.floor(daysBetween(p.since||today(),today())/7)+1-(Number(p.rep)||0));return p}
function savePlan(p){const keep=Object.assign({},p);['kind','name','gp','now','best','base'].forEach(k=>delete keep[k]);setProp('RUN_PLAN',JSON.stringify(keep))}
const easyBase=p=>p&&p.gp?p.gp+48:p&&p.now?p.now+15:p&&p.kind==='start'?375:360;
const easyPace=p=>'קצב '+mmss(Math.round(easyBase(p)/15)*15)+' (קל, אפשר לדבר)';
const fastPace=p=>'קצב '+mmss(Math.round(Math.max(150,p&&p.gp?p.gp-5:easyBase(p)-75)/15)*15)+' (קשה, כמעט בלי לדבר)';
function weekRuns(p,wk){
  const m3=!!p.m3,easyWk=wk%4===0,base=Math.max(1.5,p.base||1.5),cap=p.kind==='half'?16:Math.max(p.goal,3);
  let long=Math.min(cap,Math.round((base*Math.pow(1.1,wk-1-Math.floor(wk/4)))*2)/2);if(easyWk)long=Math.max(1.5,Math.round(long*.8*2)/2);
  const easy=Math.max(1.5,Math.round(long*.6*2)/2),out=[];
  if(!m3){out.push(['ריצה קלה',easy+' ק״מ']);if(p.runs>=2)out.push(['ריצה ארוכה',long+' ק״מ, קצב קל']);if(p.runs>=3)out.push(['ריצה קלה',easy+' ק״מ']);return out}
  const q=wk%3===1?(p.base>=10?INTV_LONG[Math.min(INTV_LONG.length-1,Math.floor(wk/3))]:INTV[Math.min(INTV.length-1,Math.floor(wk/3))]):wk%3===2?FART[Math.min(FART.length-1,Math.floor(wk/3))]:(p.kind!=='start'&&p.kind!=='k5'&&wk>4)?'טמפו: '+Math.min(25,10+wk)+' דק׳ מהר-נוח':HILL[Math.min(HILL.length-1,Math.floor(wk/3))];
  if(p.runs===1){out.push(['ריצה',wk%2?easy+' ק״מ קל, ואז '+q:long+' ק״מ, קצב קל']);return out}
  out.push(['ריצה איכותית','10 דק׳ קל, ואז '+q]);out.push(['ריצה ארוכה',long+' ק״מ, קצב קל']);if(p.runs>=3)out.push(['ריצה קלה',easy+' ק״מ']);return out;
}
function weekSchedule(s,r){const runDays=r>=3?[0,2,4]:r===2?[1,4]:r===1?[2]:[];const out=Array(7).fill(null);runDays.forEach((d,i)=>out[d]={t:'run',i});
  const pref=[0,3,5,2,1,6,4];let k=0;for(const d of pref){if(k>=s)break;if(out[d])continue;out[d]={t:'str',legs:k===0};k++}return out}
function runSteps(r,p){const t=r[0],d=r[1];
  if(/איכותית/.test(t)||/ואז/.test(d)){const q=d.replace(/^.*ואז /,'');return[['חימום','5 דק׳ תרגילי חימום'],['ריצה קלה','10 דק׳, '+easyPace(p)],['העיקר',q+(/פרטלק/.test(q)?' · החלק המהיר: '+fastPace(p):/עליות/.test(q)?' · עולים מהר, יורדים בהליכה':/טמפו/.test(q)?'':' · '+fastPace(p)+', בין קטע לקטע הליכה')],['שחרור','5 דק׳ ריצה איטית או הליכה'],['מתיחות','3–4 מתיחות']]}
  if(t==='ריצה משלי'||V.fixed===t)return[['חימום','5 דק׳ תרגילי חימום'],['העיקר','ריצה '+d],['שחרור','5 דק׳ הליכה ומתיחות']];
  return[['חימום','5 דק׳ תרגילי חימום'],['העיקר',d.split(',')[0]+' רצוף · '+easyPace(p)],['שחרור','5 דק׳ הליכה'],['מתיחות','3–4 מתיחות']];
}
const wk=(rows)=>rows.map((x,i)=>`<div class="fpT-wk"><b>${i+1}. ${esc(x[0])}</b><span>${esc(x[1])}</span></div>`).join('');

/* ---------- figures ---------- */
const WARM=[['walk','הליכה מהירה','1 דק׳',{mode:'brisk'}],['high_knees','הרמת ברכיים','30 שנ׳'],['butt_kicks','עקבים לישבן','30 שנ׳'],['leg_swing','נדנוד רגל','10 לכל רגל'],['lunge','לאנג׳ בהליכה','6 לכל רגל'],['jog','ריצה קלה','1 דק׳']];
const COOL=[['walk','הליכה רגועה','2 דק׳',{mode:'easy'}],['st_calf','תאומים','30 שנ׳ לכל צד'],['st_quad','ירך קדמית','30 שנ׳ לכל צד'],['st_ham','ירך אחורית','30 שנ׳ לכל צד'],['st_hip','כופף ירך','30 שנ׳ לכל צד'],['st_glute','ישבן','30 שנ׳ לכל צד']];
const VB={};
function anBox(x,bd,V){const k=x.id+bd+JSON.stringify(V||{});if(VB[k])return VB[k];const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.style.cssText='position:absolute;left:-9999px;width:380px;height:270px';document.body.appendChild(svg);let u=null;
  for(const e of [0,.25,.5,.75]){try{svg.innerHTML=x.views[0](e,bd,V||{});const b=FP2Anim.figBox(svg);if(b)u=u?{x0:Math.min(u.x0,b.x0),y0:Math.min(u.y0,b.y0),x1:Math.max(u.x1,b.x1),y1:Math.max(u.y1,b.y1)}:b}catch(_){}}
  svg.remove();if(!u)return'0 0 380 270';const w=u.x1-u.x0+30,h=u.y1-u.y0+56,W=Math.max(w,h),H=W;return VB[k]=`${u.x0-15-(W-w)/2} ${u.y0-40-(H-h)/2} ${W} ${H}`}
const pat=id=>window.FP2Anim&&FP2Anim.pat&&FP2Anim.pat.find(p=>p.id===id);
function exCard([id,name,time,V],i,sel){const x=pat(id);if(!x)return'';const bad=(x.bad[0]||[])[0];
  return `<div class="fpT-ex${sel&&sel.includes(i)?' pick':''}"><svg class="fpT-an" data-an="${id}" data-bd="-1" data-v='${JSON.stringify(V||{})}' viewBox="${anBox(x,-1,V)}" role="img" aria-label="${esc(name)}"></svg><div><h4>${esc(name)} <small class="muted">· ${time}</small></h4>
    ${x.good.map(g=>`<p>✓ ${esc(g)}</p>`).join('')}${bad?`<button type="button" class="fpT-chip" onclick="fpT.bad(this)">מה לא לעשות</button><p class="no" hidden><b>${esc(bad.t)}:</b> ${esc(bad.fix)}</p>`:''}</div></div>`}
let raf=0;
function animate(){cancelAnimationFrame(raf);const t0=performance.now(),reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const tick=now=>{const svgs=document.querySelectorAll('svg.fpT-an');if(!svgs.length)return;svgs.forEach(s=>{const x=pat(s.dataset.an);if(!x)return;const per=(x.period||5.2)*(x.loop&&x.period<2?2:1);const T=reduce?.3:((now-t0)/1000/per)%1;
    const d=x.loop?T:(T<.42?T/.42:T<.52?1:T<.92?1-(T-.52)/.4:0);try{s.innerHTML=x.views[0](d,+s.dataset.bd,JSON.parse(s.dataset.v||'{}')).replace(/<text[^>]*data-cap[^>]*>[\s\S]*?<\/text>/g,'')}catch(_){}});if(!reduce)raf=requestAnimationFrame(tick)};raf=requestAnimationFrame(tick)}

/* ---------- sheet ---------- */
function sheet(title,body){let s=$('fpTSheet');if(!s){document.body.insertAdjacentHTML('beforeend','<div class="overlay" id="fpTSheet"><div class="sheet"></div></div>');s=$('fpTSheet')}
  const sc=s.querySelector('.sheet').scrollTop;s.querySelector('.sheet').innerHTML=`<div class="sheet-head"><h3 style="margin:0">${title}</h3><button type="button" class="trash" aria-label="סגור" onclick="fpT.close()">✕</button></div>${body}`;s.querySelector('.sheet').scrollTop=sc;animate()}
let V={step:0,pick:null,own:{type:'קלה',km:'',min:''}};

/* ---------- running screens ---------- */
function planHtml(p){const sch=weekSchedule(Number(p.str)||0,p.runs),runs=weekRuns(p,p.week);
  return `<div class="fpT-card"><b>${p.name}</b> · שבוע ${p.week}<div class="muted">${p.str?p.str+' כוח + ':''}${p.runs} ${p.runs===1?'ריצה':'ריצות'} בשבוע · היעד ${p.goal===21.1?'חצי מרתון':p.goal+' ק״מ'}${p.m3?' · 3 ק״מ':''}</div></div>
   <div class="fpT-card"><h3>השבוע</h3>${sch.map((d,i)=>d?`<div class="fpT-wk"><b>${DAYS[i]}</b><span>${d.t==='str'?'כוח'+(d.legs?' · כולל רגליים לרצים':' · פלג גוף עליון'):''+(runs[d.i]?runs[d.i][0]+': '+runs[d.i][1]:'ריצה')}</span></div>`:'').join('')}
    <p class="muted" style="margin:8px 0 0">רצים עושים רגליים רק באימון כוח אחד בשבוע. ${p.m3?(p.base>=10?'רץ כבר 10 ק״מ: נפתחו קטעים ארוכים.':'הקטעים המהירים קצרים, עד 200 מ׳. ב-10 ק״מ נפתחים קטעים ארוכים.'):'עד 3 ק״מ: רק ריצות קלות.'}</p></div>
   <details class="fpT-card"><summary style="cursor:pointer;font-weight:700">החודש הראשון</summary>${[1,2,3,4].map(w=>`<div class="fpT-wk${w===p.week?' now':''}"><b>שבוע ${w}</b><span>${weekRuns(p,w).map(r=>r[0]+': '+r[1].split(',')[0]).join(' · ')}</span></div>`).join('')}<p class="muted">שבוע חדש נפתח כשמסיימים את השבוע הקודם.</p></details>`}
function runSheet(){const p=plan();if(!p&&!V.fixed&&V.pick!=='own')return setupSheet();const runs=p?weekRuns(p,p.week):[],st=V.step,sk=skip(),m3=!!(p&&p.m3);
  /* 2.23.1: a light flow — start screen (GPS or fill in) → log → done. The warm-up and the stretches are optional links. */
  const cur=V.pick==='own'?[V.fixed||'ריצה משלי',(V.own.km?V.own.km+' ק״מ':V.own.min?V.own.min+' דק׳':'')+' · '+V.own.type]:runs[V.pick];
  let b='',title=cur?esc(cur[0]):'ריצה';
  if(st===0){
    if(V.pick==null){b=`<p class="muted" style="margin:6px 0">מה רצים היום?</p>${runs.map((r,i)=>`<button type="button" class="btn light full" style="margin-top:8px;text-align:right;display:block" onclick="fpT.pick(${i})"><b>${esc(r[0])}</b><div class="muted" style="font-size:12.5px">${esc(r[1])}</div></button>`).join('')}
      <button type="button" class="btn light full" style="margin-top:8px;text-align:right;display:block" onclick="fpT.pick('own')"><b>ריצה משלי</b><div class="muted" style="font-size:12.5px">בוחר סוג ומרחק או זמן</div></button>
      ${p?`<details class="fpT-card" style="margin-top:12px"><summary style="cursor:pointer;font-weight:700">התוכנית</summary>${planHtml(p)}</details>`:''}`;return sheet('ריצה',b)}
    if(V.pick==='own'&&!V.fixed){const types=Object.keys(RK).filter(k=>RK[k].cat),ok=kindByName(V.own.type);
      b+=`<div class="fpT-card"><div>${types.map(k=>{const t=RK[k].n,lk=(RK[k].cat==='fast'||RK[k].cat==='pace')&&!m3;return `<button type="button" class="fpT-chip${ok===k&&!lk?' on':''}${lk?' lock':''}" ${lk?'aria-disabled="true"':`onclick="fpT.own('type','${t}')"`}>${t}</button>`}).join(' ')}</div>
        ${RK[ok]&&RK[ok].d?`<p class="muted" style="margin:8px 0 0;font-size:13px">${RK[ok].d}</p>`:''}${!m3?'<p class="muted" style="margin:6px 0 0;font-size:12.5px">ריצות מהירות ושינויי קצב נפתחים אחרי 3 ק״מ בלי לעצור.</p>':''}
        <div class="row" style="margin-top:8px"><div class="field"><label>מרחק (ק״מ)</label><input inputmode="decimal" value="${esc(V.own.km)}" oninput="fpT.own('km',this.value,1)"></div><div class="field"><label>או זמן (דק׳)</label><input inputmode="numeric" value="${esc(V.own.min)}" oninput="fpT.own('min',this.value,1)"></div></div></div>`}
    else if(cur)b+=`<div class="fpT-card">${wk(runSteps(cur,p))}${V.tg&&V.tg.length?`<p class="muted" style="margin:8px 0 0">יעד: <b style="color:var(--ink,#F2F5F7)">${mmss(V.tg.reduce((a,x)=>a+x,0))}</b> · ${new Set(V.tg).size>1?V.tg.map((x,i)=>(i+1)+': '+mmss(x)).join(' · '):mmss(V.tg[0])+' לכל ק״מ'}</p>`:''}</div>`;
    if(V.rec)b+=`<div class="fpT-good"><b>בפעם הקודמת</b><br>${esc(V.rec.text)}</div>`;
    if(G&&G.no)b+=`<div class="fpT-warn"><b>המדידה ב-GPS לא נפתחה.</b> ${esc(G.no)}. אפשר לרוץ ולמלא את הנתונים אחר כך.</div>`;
    b+=`<button type="button" class="btn full" style="margin-top:6px;padding:15px;font-size:17px" onclick="fpT.gps(1)">התחל ריצה עם GPS</button>
      <button type="button" class="btn light full" style="margin-top:8px" onclick="fpT.go(2)">רצתי בלי האפליקציה: למלא נתונים</button>
      ${sk.w?'':`<button type="button" class="linkb" style="display:block;margin:12px auto 0" onclick="fpT.go(1)">קודם חימום (5 דק׳)</button>`}
      ${V.fixed||V.pick===undefined?'':`<button type="button" class="linkb" style="display:block;margin:6px auto 0;color:var(--muted,#A3ADB8)" onclick="fpT.pick(null)">ריצה אחרת</button>`}`}
  if(st===1)b=`<div class="fpT-good"><b>לא חייבים את כולם.</b> בוחרים 3–4 תרגילים, 5 דקות בסך הכל. לפני ריצה לא מחזיקים מתיחות במקום, רק תנועה.</div>${WARM.map((e,i)=>exCard(e,i)).join('')}<button type="button" class="btn full" onclick="fpT.go(0)">סיימתי חימום ←</button>`;
  if(st===2){const n=Math.max(Math.floor(Number(String(V.km||'').replace(',','.'))||0),V.tg?V.tg.length:0);
    b=`<div class="fpT-card"><div class="row"><div class="field"><label>כמה רצת (ק״מ)</label><input id="fpTkm" inputmode="decimal" placeholder="3" value="${esc(V.km||'')}" oninput="fpT.km(this.value)"></div><div class="field"><label>כמה זמן (דק׳:שנ׳)</label><input id="fpTtime" inputmode="text" placeholder="20:30" value="${esc(V.tm||'')}" oninput="fpT.tm(this.value)"></div></div>
        <details id="fpSplitsBox"${V.spOpen||V.tg||(V.sp&&V.sp.length)?' open':''} ontoggle="fpT.spOpen(this.open)"><summary class="muted" style="cursor:pointer">זמן לכל ק״מ ${V.tg?'(לתכנון מול ביצוע)':'(לא חובה)'}</summary><div id="fpSplits">${splitsHtml()}</div></details>
        ${V.gps?'<p class="muted" style="margin:6px 0 0;font-size:12.5px">נמדד ב-GPS. אפשר לתקן לפני ששומרים.</p>':''}</div>
      <div class="row"><button type="button" class="btn light" onclick="fpT.ran(0)">עצרתי באמצע</button><button type="button" class="btn" onclick="fpT.ran(1)">רצתי בלי לעצור</button></div>`;title='שמירת הריצה'}
  if(st===3)b=`<div class="fpT-good"><b>לא חייבים את כולם.</b> 5 דקות: הליכה רגועה ו-3–4 מתיחות. מרגישים מתיחה, לא כאב. האדום מראה איפה מרגישים.</div>${COOL.map((e,i)=>exCard(e,i)).join('')}<button type="button" class="btn full" onclick="fpT.close()">סיימתי ✓</button>`;
  sheet(title,b);
}
/* ---------- GPS while the screen is on, per-km pace, and (2.23) the run screen ---------- */
const STRAVA={ios:'https://apps.apple.com/app/strava/id426826309',and:'https://play.google.com/store/apps/details?id=com.strava'};
const storeBtns=()=>'';
let G=null,gInt=0,gLock=null,RUNMIN=false;
const hav=(a,b)=>{const R=6371,r=x=>x*Math.PI/180,dl=r(b[0]-a[0]),dn=r(b[1]-a[1]);const h=Math.sin(dl/2)**2+Math.cos(r(a[0]))*Math.cos(r(b[0]))*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.sqrt(h))};
document.head.insertAdjacentHTML('beforeend',`<style id="fp223run">
#fpRunScr{position:fixed;inset:0;z-index:2147482000;display:flex;flex-direction:column;direction:rtl}
#fpRunScr .top{flex:0 0 13vh;background:rgba(0,0,0,.55)}
#fpRunScr .pan{flex:1;background:#000;color:#F2F5F7;border-radius:22px 22px 0 0;padding:16px 18px calc(18px + env(safe-area-inset-bottom));display:flex;flex-direction:column;gap:10px;overflow:auto}
#fpRunScr .st{display:flex;justify-content:space-between;align-items:center;font-size:13px;color:#A3ADB8}
#fpRunScr .st b{color:#7CC4FF;font-weight:700}
#fpRunScr .km{font-size:84px;font-weight:900;line-height:1;text-align:center;font-variant-numeric:tabular-nums;margin-top:8px}
#fpRunScr .km small{display:block;font-size:15px;font-weight:500;color:#A3ADB8;margin-top:6px}
#fpRunScr .two{display:grid;grid-template-columns:1fr 1fr;gap:10px;text-align:center}
#fpRunScr .two div{background:#0E1318;border:1px solid #1F262E;border-radius:16px;padding:12px 6px}
#fpRunScr .two b{display:block;font-size:30px;font-weight:800;font-variant-numeric:tabular-nums}
#fpRunScr .two span{font-size:12.5px;color:#A3ADB8}
#fpRunScr .tgt{text-align:center;font-size:15px;color:#A3ADB8;font-variant-numeric:tabular-nums}#fpRunScr .tgt b{color:#D7F36B}
#fpRunScr .sps{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;font-size:12.5px;color:#A3ADB8;font-variant-numeric:tabular-nums}
#fpRunScr .sps span{border:1px solid #1F262E;border-radius:99px;padding:3px 9px}
#fpRunScr .acts{margin-top:auto;display:grid;gap:8px}
#fpRunScr .acts button{font:inherit;font-weight:800;font-size:16px;border-radius:14px;padding:14px;cursor:pointer}
#fpRunScr .acts .min{background:#11161B;border:1px solid #2C3640;color:#F2F5F7}
#fpRunScr .acts .end{background:#D7F36B;border:0;color:#14190a}
#fpRunFloat{position:fixed;left:12px;right:12px;bottom:calc(76px + env(safe-area-inset-bottom));z-index:61;background:#0E1318;border:1px solid #7CC4FF;border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,.45);direction:rtl}
#fpRunFloat button{display:flex;justify-content:space-between;align-items:center;gap:10px;width:100%;background:none;border:0;color:#F2F5F7;font:inherit;padding:10px 14px;cursor:pointer;text-align:right}
#fpRunFloat small{display:block;color:#A3ADB8;font-size:12px}#fpRunFloat .t{font-size:20px;font-weight:800;font-variant-numeric:tabular-nums}
.fpPva{width:100%;border-collapse:collapse;font-size:14px;font-variant-numeric:tabular-nums}.fpPva th{color:#6B7682;font-weight:500;font-size:12px;text-align:right;padding:4px 2px}.fpPva td{padding:7px 2px;border-top:1px solid var(--line,#2C3640)}
.fpPill{font-size:12px;border-radius:99px;padding:2px 8px;white-space:nowrap;display:inline-block}.fpPill.g{background:rgba(110,231,135,.13);color:#6EE787}.fpPill.r{background:rgba(255,138,128,.14);color:#FF8A80}.fpPill.n{background:#1F262E;color:#A3ADB8}
.fpRec{background:linear-gradient(160deg,#1E2A33,#171C22);border:1px solid #2B3D4C;border-radius:14px;padding:10px 12px;margin:8px 0}.fpRec b{color:#7CC4FF}
</style>`);
const elapsed=()=>G&&G.t0?(Date.now()-G.t0)/1000:0;
function curPace(){if(!G)return 0;const frac=G.km-(G.nextKm-1);return frac>0.05?(elapsed()-G.lastT)/frac:0}
function gpsHtml(){
  if(G&&G.no)return `<b>המדידה ב-GPS לא זמינה כאן</b><p class="muted" style="margin:4px 0 0">${esc(G.no)}. אפשר למדוד בשעון ריצה ולהעתיק לכאן.</p>`;
  if(G&&G.on)return `<div style="display:flex;justify-content:space-between;align-items:center"><b>מודד ב-GPS</b><span class="muted" style="font-size:12.5px">${G.fix?'יש קליטה':'מחפש קליטה…'}</span></div>
    <div style="display:flex;justify-content:space-around;text-align:center;margin:10px 0"><div><div style="font-size:30px;font-weight:800;font-variant-numeric:tabular-nums" id="fpGkm">${G.km.toFixed(2)}</div><span class="muted">ק״מ</span></div><div><div style="font-size:30px;font-weight:800;font-variant-numeric:tabular-nums" id="fpGt">${mmss(elapsed())}</div><span class="muted">זמן</span></div></div>
    <button type="button" class="btn full" onclick="fpT.runMax()">מסך ריצה</button><button type="button" class="btn light full" style="margin-top:8px" onclick="fpT.gps(0)">סיום מדידה</button>`;
  return `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span><b>למדוד את הריצה</b><br><span class="muted" style="font-size:12.5px">ב-GPS של הטלפון. המסך נשאר דלוק כל הריצה</span></span><button type="button" class="btn light" onclick="fpT.gps(1)">התחל מדידה</button></div>`}
function gpsDraw(){const b=$('fpGps');if(b)b.innerHTML=gpsHtml()}
/* the run screen: black, big numbers, the screen stays on. Tap the dark top (or "להקטין") → a small box; tap the box → back. */
function scrHtml(){const ti=G.nextKm-1,tg=V.tg&&V.tg.length?V.tg[Math.min(ti,V.tg.length-1)]:0,cp=curPace();
  return `<div class="top" onclick="fpT.runMin()" aria-label="להקטין"></div><div class="pan" role="dialog" aria-label="מסך ריצה">
    <div class="st"><span>${esc(V.fixed||'ריצה')}</span><b>${G.fix?'יש קליטה':'מחפש קליטה…'}</b></div>
    <div class="km" id="fpRsKm">${G.km.toFixed(2)}<small>ק״מ</small></div>
    <div class="two"><div><b id="fpRsT">${mmss(elapsed())}</b><span>זמן</span></div><div><b id="fpRsP">${cp?mmss(cp):'—'}</b><span>קצב בק״מ ${ti+1}</span></div></div>
    ${tg?`<div class="tgt" id="fpRsTg">יעד לק״מ ${ti+1}: <b>${mmss(tg)}</b></div>`:''}
    <div class="sps" id="fpRsSp">${G.sp.map((x,i)=>`<span>${i+1}: ${mmss(x)}</span>`).join('')}</div>
    <p style="margin:0;text-align:center;font-size:12.5px;color:#6B7682">המסך נשאר דלוק. אפשר להוריד בהירות. מסך נעול עוצר את המדידה.</p>
    <div class="acts"><p style="margin:0;text-align:center;font-size:12.5px;color:#6B7682">לחיצה על החלק הכהה למעלה מקטינה. המדידה ממשיכה.</p><button type="button" class="end" onclick="fpT.gps(0)">סיום</button></div></div>`}
function scrOpen(){if(!G||!G.on)return;let s=$('fpRunScr');if(!s){document.body.insertAdjacentHTML('beforeend','<div id="fpRunScr"></div>');s=$('fpRunScr')}s.innerHTML=scrHtml();floatOff()}
function scrOff(){const s=$('fpRunScr');if(s)s.remove()}
function floatHtml(){return `<button type="button" onclick="fpT.runMax()" aria-label="לפתוח את מסך הריצה"><span><b>ריצה · ${G.km.toFixed(2)} ק״מ</b><small>מודד ב-GPS. לחיצה פותחת</small></span><span class="t">${mmss(elapsed())}</span></button>`}
function floatOn(){let f=$('fpRunFloat');if(!f){document.body.insertAdjacentHTML('beforeend','<div id="fpRunFloat" role="status"></div>');f=$('fpRunFloat')}f.innerHTML=floatHtml()}
function floatOff(){const f=$('fpRunFloat');if(f)f.remove()}
function tickRun(){if(!G||!G.on){clearInterval(gInt);return}const t=$('fpGt');if(t)t.textContent=mmss(elapsed());
  if($('fpRunScr')){const a=$('fpRsT'),k=$('fpRsKm'),p=$('fpRsP');if(a)a.textContent=mmss(elapsed());if(k)k.firstChild.nodeValue=G.km.toFixed(2);if(p){const cp=curPace();p.textContent=cp?mmss(cp):'—'}}
  if(RUNMIN)floatOn()}
function lock(){try{if(navigator.wakeLock&&!gLock)navigator.wakeLock.request('screen').then(l=>{gLock=l;l.addEventListener('release',()=>{gLock=null})}).catch(()=>{})}catch(_){}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&G&&G.on)lock()});
function gpsStop(keep){if(!G)return;try{if(G.id!=null)navigator.geolocation.clearWatch(G.id)}catch(_){}clearInterval(gInt);try{gLock&&gLock.release()}catch(_){}gLock=null;scrOff();floatOff();RUNMIN=false;
  if(keep&&G.on&&G.km>0){V.gps=1;V.km=String(Math.round(G.km*100)/100);V.tm=mmss(elapsed());if(G.sp.length){V.sp=G.sp.map(mmss);V.spOpen=true}}const no=G.no;G=no&&!keep?{no}:null}
function gpsStart(){if(!navigator.geolocation||!window.isSecureContext){G={no:'הטלפון לא נותן מיקום לאפליקציה'};V.step=0;return runSheet()}
  G={on:1,km:0,t0:Date.now(),last:null,fix:0,id:null,sp:[],lastT:0,nextKm:1};
  try{G.id=navigator.geolocation.watchPosition(pos=>{if(!G||!G.on)return;const c=pos.coords;G.fix=1;if(c.accuracy>40)return;const pt=[c.latitude,c.longitude];
      if(G.last){const d=hav(G.last,pt);if(d<0.004)return;if(d<0.25)G.km+=d}G.last=pt;
      /* 2.23: the time of every full km, by itself */
      while(G.km>=G.nextKm){const t=elapsed();G.sp.push(Math.round(t-G.lastT));G.lastT=t;G.nextKm++;const sp=$('fpRsSp');if(sp)sp.innerHTML=G.sp.map((x,i)=>`<span>${i+1}: ${mmss(x)}</span>`).join('');const s=$('fpRunScr');if(s)s.innerHTML=scrHtml()}
      const k=$('fpGkm');if(k)k.textContent=G.km.toFixed(2);else if(!RUNMIN)gpsDraw()},
    /* 2.23.1: only "no permission" stops the run. No signal yet (indoors, the first seconds) or a slow fix keeps the run screen open,
       the clock keeps going and it says "מחפש קליטה…" — before, after 30 seconds without a fix the screen closed with an error. */
    err=>{if(!G||!G.on)return;if(err&&err.code===1){const m='אין הרשאה למיקום. באייפון: הגדרות ← פרטיות ← שירותי מיקום ← Safari (או FitPro) ← בזמן השימוש';try{navigator.geolocation.clearWatch(G.id)}catch(_){}clearInterval(gInt);scrOff();floatOff();RUNMIN=false;G={no:m};V.step=0;runSheet();return}
      G.fix=0;const s=$('fpRunScr');if(s)s.innerHTML=scrHtml()},{enableHighAccuracy:true,maximumAge:0})}catch(e){G={no:'המיקום לא נפתח'};V.step=0;return runSheet()}
  lock();clearInterval(gInt);gInt=setInterval(tickRun,1000);gpsDraw();scrOpen()}
function splitsHtml(){const km=Math.floor(Number(String(V.km||'').replace(',','.'))||0),n=Math.max(km,V.tg?V.tg.length:0);if(!n)return '<p class="muted" style="margin:6px 0 0">כותבים קודם כמה ק״מ.</p>';
  V.sp=V.sp||[];return `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:8px">${Array.from({length:Math.min(n,42)},(_,i)=>`<label style="font-size:12.5px">ק״מ ${i+1}${V.tg&&V.tg[i]?` <span class="muted">(יעד ${mmss(V.tg[i])})</span>`:''}<input inputmode="text" placeholder="${V.tg&&V.tg[i]?mmss(V.tg[i]):'6:00'}" value="${esc(V.sp[i]||'')}" oninput="fpT.sp(${i},this.value)"></label>`).join('')}</div>`}
/* 2.23: plan vs actual per km (the run summary, and the same table in the journal) */
const tgAt=(tg,i)=>tg[Math.min(i,tg.length-1)];
function recFor(r){if(!r||!Array.isArray(r.tg)||!r.tg.length||!Array.isArray(r.sp)||!r.sp.length)return null;
  const n=Math.min(r.sp.length,r.tg.length),df=Array.from({length:n},(_,i)=>r.sp[i]-tgAt(r.tg,i)),hit=df.filter(d=>d<=3).length,avg=Math.round(df.reduce((a,x)=>a+x,0)/n);
  if(hit===n&&r.ok)return {k:'up',hit,n,text:`עמדת ביעד בכל ${n} הק״מ. בפעם הבאה: 5 שנ׳ מהר יותר לכל ק״מ.`,tg:r.tg.map(v=>Math.max(150,v-5))};
  if(avg>15||!r.ok)return {k:'down',hit,n,text:`${r.ok?'היית איטי ב-'+avg+' שנ׳ לק״מ בממוצע':'עצרת באמצע'}. בפעם הבאה: יעד קל יותר ב-5 שנ׳ לק״מ, ובונים משם.`,tg:r.tg.map(v=>v+5)};
  let w=0;df.forEach((d,i)=>{if(d>df[w])w=i});
  return {k:'keep',hit,n,text:`${hit} מתוך ${n} ק״מ ביעד. ק״מ ${w+1} היה הכי איטי (+${mmss(Math.max(0,df[w]))}). בפעם הבאה אותו יעד, ולהתחיל רגוע יותר.`,tg:null}}
/* 2.23.1: the summary of a run without a target: distance, time, average pace, and the pace of every km */
function runSumHtml(r){const km=Number(r.km)||0,t=Number(r.s)||0,sp=Array.isArray(r.sp)?r.sp.filter(x=>x>0):[];
  const best=sp.length?Math.min(...sp):0,worst=sp.length?Math.max(...sp):0;
  return `<div class="fpT-card"><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center"><div><b style="font-size:24px;font-variant-numeric:tabular-nums">${km?Math.round(km*100)/100:'—'}</b><div class="muted" style="font-size:12px">ק״מ</div></div><div><b style="font-size:24px;font-variant-numeric:tabular-nums">${t?mmss(t):'—'}</b><div class="muted" style="font-size:12px">זמן</div></div><div><b style="font-size:24px;font-variant-numeric:tabular-nums">${t&&km?mmss(t/km):'—'}</b><div class="muted" style="font-size:12px">קצב ממוצע</div></div></div></div>
    ${sp.length?`<div class="fpT-card"><table class="fpPva"><tr><th>ק״מ</th><th>קצב</th><th></th></tr>${sp.map((x,i)=>`<tr><td>${i+1}</td><td>${mmss(x)}</td><td>${sp.length>1&&x===best?'<span class="fpPill g">הכי מהיר</span>':sp.length>1&&x===worst?'<span class="fpPill n">הכי איטי</span>':''}</td></tr>`).join('')}</table></div>`:''}`}
window.fpRunSum=runSumHtml;
function pvaHtml(r,opt){opt=opt||{};if(!r||!Array.isArray(r.tg)||!r.tg.length)return '';const sp=Array.isArray(r.sp)?r.sp:[],n=Math.max(sp.length,0);
  const tot=r.s||sp.reduce((a,x)=>a+x,0),ttg=r.tg.slice(0,Math.max(1,Math.ceil(Number(r.km)||r.tg.length))).reduce((a,x)=>a+x,0),dt=tot&&ttg?tot-ttg:null;
  const pill=d=>d==null?'':d<0?`<span class="fpPill g" dir="ltr">−${mmss(-d)}</span>`:d>0?`<span class="fpPill r" dir="ltr">+${mmss(d)}</span>`:'<span class="fpPill n" dir="ltr">0:00</span>';
  const rec=recFor(r);
  return `<div class="fpT-card"><span class="muted">${r.d?r.d.split('-').reverse().slice(0,2).join('.')+' · ':''}${r.km?(Math.round(r.km*100)/100)+' ק״מ':''}</span>
    <div style="display:flex;justify-content:space-between;align-items:end;margin-top:4px"><span style="font-size:34px;font-weight:900;font-variant-numeric:tabular-nums">${tot?mmss(tot):'—'}</span>${dt==null?'':dt<=0?`<span class="fpPill g">${dt===0?'בדיוק ביעד':mmss(-dt)+' מתחת ליעד'}</span>`:`<span class="fpPill r">${mmss(dt)} מעל היעד</span>`}</div>
    <span class="muted" style="font-size:12.5px">יעד ${mmss(ttg)}${tot&&r.km?' · קצב '+mmss(tot/r.km):''}</span></div>
    ${n?`<div class="fpT-card"><table class="fpPva"><tr><th>ק״מ</th><th>יעד</th><th>בפועל</th><th>הפרש</th></tr>${sp.map((a,i)=>`<tr><td>${i+1}</td><td>${mmss(tgAt(r.tg,i))}</td><td>${mmss(a)}</td><td>${pill(a-tgAt(r.tg,i))}</td></tr>`).join('')}</table></div>`:`<div class="fpT-card"><table class="fpPva"><tr><th>ק״מ</th><th>יעד</th><th>בפועל</th><th>הפרש</th></tr>${r.tg.slice(0,Math.max(1,Math.ceil(Number(r.km)||r.tg.length))).map((t,i)=>`<tr><td>${i+1}</td><td>${mmss(t)}</td><td>—</td><td></td></tr>`).join('')}</table><p class="muted" style="margin:6px 0 0;font-size:12.5px">לא נרשם זמן לכל ק״מ. עם GPS זה נרשם לבד, או ממלאים ב״זמן לכל ק״מ״.</p></div>`}
    ${rec?`<div class="fpRec"><span class="muted">בפעם הבאה</span><p style="margin:3px 0 0;font-size:13.5px">${esc(rec.text)}</p></div>${rec.tg&&r.fid&&opt.apply!==false?`<button type="button" class="btn full" onclick="fpT.recApply('${esc(r.fid)}',${JSON.stringify(rec.tg)})">שמור יעדים לפעם הבאה</button>`:''}`:''}`}
/* 2.22: the run questionnaire on one organized screen: where you are today, where you want to get, your plan */
function planWeeks(start,goal){const base=Math.max(1.5,Number(start)||0),g=Number(goal)||5;let w=base>=g?4:Math.ceil(Math.log(g/base)/Math.log(1.1));w+=Math.floor(w/3);return Math.max(4,Math.min(30,w))}
function setupSheet(){const s=V.setup||(V.setup=Object.assign({mode:'zero',now:'3',runsNow:2,paceNow:'',goal:'5',runs:2,paceGoal:'',done:0},(()=>{const p=J('RUN_PLAN',null);return p?{mode:p.mode==='runs'?'runs':'zero',now:String(p.start||3),runsNow:Number(p.runsNow)||2,paceNow:p.paceNow||'',goal:String(p.goal||5),runs:Number(p.runs)||2,paceGoal:p.paceGoal||''}:{}})()));
  if(s.done)return sheet('תוכנית ריצה',`<h2 style="margin:4px 0 10px">התוכנית שלך מוכנה</h2>${planSum(s)}
    <div class="fpT-card"><b>למדוד את הריצה</b><p class="muted" style="margin:4px 0 0">האפליקציה מודדת ב-GPS במסך ריצה שנשאר דלוק, ורושמת לבד את הזמן של כל ק״מ. רצת עם שעון? אחרי הריצה מעתיקים לכאן.</p></div>
    <button type="button" class="btn full" style="margin-top:6px" onclick="fpT.run()">יאללה, מתחילים</button>`);
  const g=Number(s.goal)||5,start=s.mode==='zero'?0:Number(String(s.now).replace(',','.'))||0;
  const usual=s.mode==='zero'?0:Number(s.runsNow)||0,load=(s.mode==='zero'&&s.runs>=4)||(s.mode==='runs'&&s.runs>=Math.max(3,usual+2));
  const num=n=>`<span style="display:inline-grid;place-items:center;width:22px;height:22px;border-radius:50%;background:var(--brand,#D7F36B);color:#14190a;font-size:12px;font-weight:800;margin-inline-end:6px">${n}</span>`;
  sheet('תוכנית ריצה',`<div class="fpT-card"><b>${num(1)}איפה אתה היום</b>
     <div class="fpT-seg" role="group">${[['zero','מתחיל מ-0'],['runs','כבר רץ']].map(([k,l])=>`<button type="button" class="${s.mode===k?'on':''}" onclick="fpT.setup('mode','${k}')">${l}</button>`).join('')}</div>
     ${s.mode==='runs'?`<label style="display:flex;justify-content:space-between;margin-top:6px"><span>הכי רחוק שאתה רץ היום</span><b>${esc(s.now)} ק״מ</b></label><input type="range" min="1" max="21" step="0.5" value="${esc(s.now)}" style="width:100%" oninput="fpT.setup('now',this.value,1);this.previousElementSibling.lastElementChild.textContent=this.value+' ק״מ'" onchange="fpT.setup('now',this.value)">
       <label style="display:block;margin-top:8px">כמה פעמים בשבוע אתה רץ היום</label><div class="meal-tabs" style="flex-wrap:wrap">${[1,2,3,4].map(n=>`<button type="button" class="chip${Number(s.runsNow)===n?' active':''}" onclick="fpT.setup('runsNow',${n})">${n===4?'4+':n}</button>`).join('')}</div>
       <div class="field" style="margin-top:8px"><label>קצב נוח לך (לא חובה)</label><input inputmode="text" placeholder="6:00" value="${esc(s.paceNow)}" oninput="fpT.setup('paceNow',this.value,1)"></div>`:'<p class="muted" style="margin:6px 0 0">מתחילים בריצה והליכה, ומאריכים לאט.</p>'}</div>
   <div class="fpT-card"><b>${num(2)}לאן להגיע</b><div class="meal-tabs" style="flex-wrap:wrap;margin-top:8px">${[3,5,7,10,15,21.1].map(k=>`<button type="button" class="chip${String(s.goal)===String(k)?' active':''}" onclick="fpT.setup('goal','${k}')">${k===21.1?'חצי מרתון':k+' ק״מ'}</button>`).join('')}</div>
     <label style="display:block;margin-top:8px">כמה ריצות בשבוע תרצה</label><div class="meal-tabs">${[1,2,3,4].map(n=>`<button type="button" class="chip${s.runs===n?' active':''}" onclick="fpT.setup('runs',${n})">${n}</button>`).join('')}</div>
     ${load?`<div class="fpT-warn">זה יותר ממה שאתה רגיל. אפשר, רק תתחיל בעדינות.</div>`:''}
     <div class="field" style="margin-top:8px"><label>קצב יעד (לא חובה)</label><input inputmode="text" placeholder="5:30" value="${esc(s.paceGoal)}" oninput="fpT.setup('paceGoal',this.value,1)"></div></div>
   ${planSum(s)}
   <button type="button" class="btn full" onclick="fpT.makePlan()">צור תוכנית</button>`)}
function planSum(s){const start=s.mode==='zero'?0:Number(String(s.now).replace(',','.'))||0,g=Number(s.goal)||5,first=Math.max(1.5,Math.round(Math.max(1.5,start)*0.6*2)/2);
  const pn=sec(s.paceNow),pg=sec(s.paceGoal),ez=pg?pg+48:pn?pn+15:start<3?375:360;
  return `<div class="fpT-card" style="background:linear-gradient(160deg,#1E2A33,#171C22)"><b>התוכנית שלך</b>
    <div class="fpT-wk"><b>משך</b><span>${planWeeks(start,g)} שבועות, בערך</span></div><div class="fpT-wk"><b>ריצות בשבוע</b><span>${s.runs}</span></div>
    <div class="fpT-wk"><b>מתחילים מ</b><span>${start<3&&s.mode==='zero'?'ריצה והליכה':first+' ק״מ קל'}</span></div><div class="fpT-wk"><b>קצב קל</b><span>${mmss(Math.round(ez/15)*15)}</span></div><div class="fpT-wk"><b>שבוע קל</b><span>כל 4 שבועות</span></div></div>`}
async function logRun(ok){
  const km=Number(String(($('fpTkm')||{}).value||'').replace(',','.'))||0,tm=sec(($('fpTtime')||{}).value)||null;
  const p=plan();const log=J('RUN_LOG',[]);const sp=[...document.querySelectorAll('#fpSplits input')].map(i=>sec(i.value)).filter(x=>x!=null);gpsStop(true);V.km='';V.tm='';V.sp=[];
  const row={d:today(),t:Date.now(),km,s:tm,ok:!!ok,type:V.pick==='own'?V.own.type:'plan'};if(V.fixed)row.name=V.fixed;if(V.fid)row.fid=V.fid;if(V.tg&&V.tg.length)row.tg=V.tg.slice();if(sp.length)row.sp=sp;if(V.gps)row.gps=1;V.gps=0;log.push(row);setProp('RUN_LOG',JSON.stringify(log.slice(-400)));
  const note=(km?km+' ק״מ':'')+(tm?' · '+mmss(tm):'')+(ok?'':' · עצרתי באמצע');
  try{const r=await call('createWorkoutSession',{date:state.date,name:'ריצה',type:'אירובי'});state.data.workout=await call('saveWorkout',{date:state.date,muscleGroup:'אירובי',exercise:'ריצה',sets:[{weight:'',reps:1,note}],notes:note,sessionName:'ריצה',sessionId:r.id});
    try{state.data.workout=(await call('finishWorkoutSession',{id:r.id,minutes:tm?Math.round(tm/60):''})).workout||state.data.workout}catch(_){}try{renderWorkouts(false)}catch(_){}}catch(e){console.warn(e)}
  const total=log.reduce((s,r)=>s+(Number(r.km)||0),0);shoes(total);
  const sk=skip(),next=`<button type="button" class="btn full" onclick="fpT.close()">סיום ✓</button>`+(sk.s?'':`<button type="button" class="linkb" style="display:block;margin:10px auto 0" onclick="fpT.go(3)">מתיחות (5 דק׳)</button>`);
  /* 2.23: a new medal pops up right away, over the summary */
  const medals=()=>setTimeout(()=>{try{fp219Week.checkMedals(false)}catch(_){}},350);
  if(ok&&km>=3&&p&&!p.m3){p.m3=true;savePlan(p);
    sheet('',`<div style="text-align:center"><h2>3 ק״מ בלי לעצור!</h2><p>עלית שלב. נפתחו לך ריצות מהירות ושינויי קצב: אינטרוולים, עליות, טמפו, פרטלק, התקדמות והאצות. מתחילים קטן, פעם בשבוע.</p>${next}</div>`);medals();return}
  if(!ok){const c=(Number(prop('RUN_STOPS'))||0)+1;setProp('RUN_STOPS',String(c))}else setProp('RUN_STOPS','0');
  /* a fixed run with a target per km: the plan vs actual table */
  if(row.tg)sheet(esc(row.name||'הריצה'),pvaHtml(row)+next);
  else sheet(esc(row.name||'הריצה'),runSumHtml(row)+(ok?'':`<p class="muted" style="text-align:center">${Number(prop('RUN_STOPS'))>=2?'פעמיים ברצף עצרת. בפעם הבאה נכניס הפסקות הליכה קצרות באמצע, וזה בסדר.':'בפעם הבאה אותה ריצה שוב. ככה בונים בלי להיפצע.'}</p>`)+next);
  medals();
}
function shoes(total){total=Math.max(0,total-(Number(prop('SHOE_START'))||0));const warned=J('SHOE_WARN',[]);for(const at of [550,700,800]){if(total>=at&&!warned.includes(at)){warned.push(at);setProp('SHOE_WARN',JSON.stringify(warned));try{toast(`הנעליים עברו ${at} ק״מ. כדאי לחשוב על זוג חדש`)}catch(_){}break}}}

/* ---------- cardio ---------- */
/* 2.23: checked against sources. Machine levels (״רמה 6–8״) differ between machines, so they were removed: the talk test decides.
   Rowing: Concept2 — steady 18–26 strokes a minute, intervals 27+. Brisk walking: 5 km/h and up. */
const MACH={walk:{n:'הליכה מהירה',fig:['walk',{mode:'brisk'}],easy:'5 קמ״ש ומעלה, צעדים מהירים, ידיים זזות. אפשר לדבר',hard:'הכי מהר שאפשר בלי לרוץ, או בעלייה'},
  tread:{n:'הליכון',fig:['jog',{tm:1}],easy:'הליכה מהירה, עם שיפוע שבו עדיין אפשר לדבר',hard:'מעלים שיפוע או מהירות עד שאפשר להגיד רק כמה מילים, או ריצה קלה'},
  bike:{n:'אופני כושר',fig:['bike',{}],easy:'סיבוב רגליים קליל, התנגדות שבה אפשר לדבר',hard:'מעלים התנגדות עד שאפשר להגיד רק כמה מילים'},
  ell:{n:'אליפטיקל',fig:['elliptical',{}],easy:'קצב קבוע, התנגדות שבה אפשר לדבר',hard:'מעלים התנגדות או קצב עד שאפשר להגיד רק כמה מילים'},
  row:{n:'חתירה',fig:['rower',{}],easy:'18–26 משיכות לדקה, משיכה רגועה',hard:'28 משיכות לדקה ומעלה, כוח מלא בכל משיכה'},
  swim:{n:'שחייה',fig:['swim',{}],easy:'שחייה רצופה בקצב נוח. מותר לעצור 15 שנ׳ בסוף בריכה',hard:'שחייה מהירה. בקטע הקל: שחייה איטית או עמידה'},
  stairs:{n:'מדרגות',fig:['stairs',{}],easy:'קצב שבו אפשר לדבר, בלי להישען על המעקה',hard:'מעלים רמה עד שאפשר להגיד רק כמה מילים'}};
function cplan(){const t=J('TRAIN_PLAN',null);if(!t||!(t.car>0))return null;return Object.assign({lvl:(Number(t.carNow)||0)<2?'beg':'adv',kinds:Array.isArray(t.carKinds)&&t.carKinds.length?t.carKinds:['ell'],week:Math.max(1,Math.floor(daysBetween(t.set||today(),today())/7)+1)},t)}
let C={mach:null,day:'easy',run:null};
function carSteps(lvl,day,m){return day==='easy'?[['חימום','3 דק׳ איטי מאוד'],['העיקר',(lvl==='beg'?'15':'40')+' דק׳ קל · '+m.easy],['סיום','2 דק׳ איטי']]:[['חימום','10 דק׳ קל · '+m.easy],['העיקר',(lvl==='beg'?'3 × 3':'4 × 4')+' דק׳ חזק · '+m.hard+'. בין כל אחד 3 דק׳ קל'],['סיום','5 דק׳ קל']]}
function carPhases(lvl,day){if(day==='easy')return[['חימום',180,'e'],['קל',(lvl==='beg'?15:40)*60,'e'],['סיום',120,'e']];const n=lvl==='beg'?3:4,len=(lvl==='beg'?3:4)*60,ph=[['חימום',600,'e']];for(let i=0;i<n;i++){ph.push(['חזק',len,'h']);if(i<n-1)ph.push(['קל',180,'e'])}ph.push(['סיום',300,'e']);return ph}
function cardioSheet(){const t=cplan()||{lvl:'beg',kinds:['ell'],carGoal:2,week:1};const k=C.mach||t.kinds.find(x=>MACH[x])||'ell',m=MACH[k],lvl=C.lvl||t.lvl;
  const beg=[['שבוע 1','2–3 × 20 דק׳ קל'],['שבוע 2','2–3 × 25 דק׳ קל'],['שבוע 3','2 × 30 דק׳ קל + 3 × 3 דק׳ חזק'],['שבוע 4','2 × 30 דק׳ קל + 4 × 3 דק׳ חזק'],['שבוע 5','2 × 35 דק׳ קל + 4 × 4 דק׳ חזק'],['שבוע 6','2 × 40 דק׳ קל + 4 × 4 דק׳ חזק']];
  const adv=[['שבועות 1–2','2 × 4×4 עם 3 קטעים · 1–2 × 45 דק׳ קל'],['שבועות 3–4','2 × 4×4 עם 4 קטעים · 1–2 × 50 דק׳ קל'],['שבועות 5–6','2 × 4×4, הקטעים האחרונים חזקים מאוד · 1–2 × 60 דק׳ קל'],['שבועות 7–8','כמו 5–6, אפשר 4×4 שלישי'],['שבוע 9','שבוע קל: 4×4 אחד ואימון קל'],['אחר כך','לשמירה: 4×4 אחד ו-2–3 קלים בשבוע']];
  const ph=carPhases(lvl,C.day);const tot=ph.reduce((s,x)=>s+x[1],0);
  let timer='';if(C.run){const r=C.run,cur=ph[r.i]||ph[ph.length-1],left=Math.max(0,cur[1]-r.t);timer=`<div class="fpT-timer"><div class="muted">${cur[0]} · שלב ${r.i+1} מתוך ${ph.length}</div><div class="big">${mmss(left)}</div><div class="fpT-bar">${ph.map((x,i)=>`<span class="${x[2]}${i===r.i?' cur':''}" style="flex:${x[1]}">${x[0]==='חזק'?'חזק':''}</span>`).join('')}</div><div class="row"><button type="button" class="btn light" onclick="fpT.cStop(0)">עצור</button><button type="button" class="btn" onclick="fpT.cStop(1)">סיימתי ושמור</button></div></div>`}
  sheet('אירובי',`<div class="fpT-seg" role="group"><button type="button" class="${lvl==='beg'?'on':''}" onclick="fpT.c('lvl','beg')">מתחיל</button><button type="button" class="${lvl==='adv'?'on':''}" onclick="fpT.c('lvl','adv')">מתקדם</button></div>
   <div class="fpT-card"><h3>על מה מתאמנים</h3><div>${[...new Set([...t.kinds.filter(x=>MACH[x]),k])].map(x=>`<button type="button" class="fpT-chip${x===k?' on':''}" onclick="fpT.c('mach','${x}')">${MACH[x].n}</button>`).join(' ')}</div>
    ${m.fig?exCard([m.fig[0],m.n,C.day==='easy'?'קל':'4×4',m.fig[1]],0):`<p class="muted">הדמיה של ${m.n} תתווסף.</p>`}
    <div class="fpT-wk"><b>קל</b><span>${m.easy}</span></div><div class="fpT-wk"><b>חזק</b><span>${m.hard}</span></div><p class="muted" style="margin:6px 0 0">המספרים משתנים בין מכונות. הכלל: קל = אפשר לדבר, לא לשיר. חזק = רק כמה מילים.</p></div>
   <div class="fpT-card"><h3>האימון של היום</h3><div class="fpT-seg" role="group"><button type="button" class="${C.day==='easy'?'on':''}" onclick="fpT.c('day','easy')">יום קל</button><button type="button" class="${C.day==='hard'?'on':''}" onclick="fpT.c('day','hard')">יום 4×4</button></div>
    ${wk(carSteps(lvl,C.day,m))}<p class="muted" style="margin:6px 0 0">סה״כ ${Math.round(tot/60)} דקות.</p>${timer||`<button type="button" class="btn full" style="margin-top:8px" onclick="fpT.cStart()">▶ התחל, הטיימר מוביל אותך</button>`}</div>
   <details class="fpT-card"><summary style="cursor:pointer;font-weight:700">${lvl==='beg'?'תוכנית למתחילים':'תוכנית למתקדמים'}</summary>${(lvl==='beg'?beg:adv).map((x,i)=>`<div class="fpT-wk${i===Math.min(5,t.week-1)?' now':''}"><b>${x[0]}</b><span>${x[1]}</span></div>`).join('')}<p class="muted">${lvl==='beg'?'מוסיפים 5 דקות כל שבוע. האימון החזק נכנס רק כשמרגישים שמתאוששים טוב.':'בין שני אימוני 4×4 לפחות 48 שעות.'} שבוע שהיה קשה מדי? חוזרים עליו.</p></details>`)}
let cInt=0;
function cTick(){const lvl=C.lvl||(cplan()||{lvl:'beg'}).lvl,ph=carPhases(lvl,C.day);if(!C.run)return;C.run.t++;if(C.run.t>=ph[C.run.i][1]){C.run.i++;C.run.t=0;try{fpRestSound&&fpRestSound()}catch(_){}if(C.run.i>=ph.length){clearInterval(cInt);return fpT.cStop(1)}}
  const big=document.querySelector('#fpTSheet .fpT-timer .big');if(big){const cur=ph[C.run.i];big.textContent=mmss(Math.max(0,cur[1]-C.run.t))}}
async function saveCardio(minutes,k){const m=MACH[k]||{n:'אירובי'};const log=J('CARDIO_LOG',[]);log.push({d:today(),t:Date.now(),min:minutes,k,hard:C.day==='hard'});setProp('CARDIO_LOG',JSON.stringify(log.slice(-400)));
  try{const r=await call('createWorkoutSession',{date:state.date,name:'אירובי',type:'אירובי'});state.data.workout=await call('saveWorkout',{date:state.date,muscleGroup:'אירובי',exercise:m.n,sets:[{weight:'',reps:1,note:minutes+' דקות'}],notes:minutes+' דקות',sessionName:'אירובי',sessionId:r.id});
    try{state.data.workout=(await call('finishWorkoutSession',{id:r.id,minutes})).workout||state.data.workout}catch(_){}try{renderWorkouts(false)}catch(_){}}catch(e){console.warn(e)}}

/* ---------- cards on the workout screen ---------- */
function cards(){const host=$('homeActiveWorkout');if(!host)return;let box=$('fpTCards');if(!box){host.insertAdjacentHTML('afterend','<div id="fpTCards"></div>');box=$('fpTCards')}
  const p=plan(),c=cplan();let h='';
  if(p){const runs=weekRuns(p,p.week);h+=`<div class="fpT-card"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><div><h3>${p.name}</h3><div class="muted">שבוע ${p.week} · ${runs.map(r=>r[0]).join(' · ')}</div></div><button type="button" class="btn" onclick="fpT.run()">▶ לריצה</button></div></div>`}
  else{const t=J('TRAIN_PLAN',null);if(!t||!(t.want||[]).includes('run'))h+=`<button type="button" class="btn secondary full" style="margin-bottom:10px" onclick="fpT.setupOpen()">רוצה להתחיל לרוץ? תוכנית ריצה</button>`}
  if(c){const k=c.kinds.find(x=>MACH[x])||'ell';h+=`<div class="fpT-card"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><div><h3>אירובי · ${MACH[k].n}</h3><div class="muted">${c.lvl==='beg'?'תוכנית למתחילים':'תוכנית למתקדמים'} · ${c.carGoal||c.car} בשבוע</div></div><button type="button" class="btn" onclick="fpT.cardio()">▶ לאימון</button></div></div>`}
  box.innerHTML=h}
if(typeof renderWorkoutHome==='function'){const o=renderWorkoutHome;renderWorkoutHome=function(){const r=o.apply(this,arguments);try{cards()}catch(e){console.error(e)}return r}}

window.fpT={
  run(){V={step:0,pick:null,own:{type:'קלה',km:'',min:''}};runSheet()},
  /* 2.23.1: "התחל ריצה" on the run tab: the clock and the GPS start right away, no target. Or fill in a run done without the app. */
  quick(type){V={step:0,pick:'own',own:{type:type||'קלה',km:'',min:''},quick:1};gpsStart()},
  fill(type){V={step:2,pick:'own',own:{type:type||'קלה',km:'',min:''},quick:1};runSheet()},
  runFixed(x){const last=J('RUN_LOG',[]).filter(r=>(r.fid?r.fid===x.id:r.name===x.name)&&Array.isArray(r.tg)&&Array.isArray(r.sp)&&r.sp.length&&!(window.fp224&&fp224.markR&&fp224.markR('r',r)==='weak')).pop();
    V={step:0,pick:'own',own:{type:x.type||'קלה',km:x.km?String(x.km):'',min:x.min?String(x.min):''},fixed:x.name,fid:x.id,tg:Array.isArray(x.tg)&&x.tg.length?x.tg.slice():null,rec:recFor(last)};runSheet()},
  recApply(fid,tg){const a=J('RUN_MY',[]),x=a.find(r=>r.id===fid);if(!x||!Array.isArray(tg))return;x.tg=tg.map(Number);const tot=x.tg.slice(0,Math.ceil(Number(x.km)||x.tg.length)).reduce((s,v)=>s+v,0);x.tm=mmss(tot);x.tmode='total';x.per=new Set(x.tg).size>1;setProp('RUN_MY',JSON.stringify(a));try{toast('היעדים לפעם הבאה נשמרו')}catch(_){}
    document.querySelectorAll('#fpTSheet button').forEach(b=>{if(/שמור יעדים לפעם הבאה/.test(b.textContent)){b.disabled=true;b.textContent='✓ נשמר'}})},
  /* 2.24: a run with sets (fp2-224) saves through here: the log, the journal, shoes and medals */
  async saveRow(row,note){const log=J('RUN_LOG',[]);row.d=row.d||today();row.t=row.t||Date.now();log.push(row);setProp('RUN_LOG',JSON.stringify(log.slice(-400)));const tm=row.s||0;
    try{const r=await call('createWorkoutSession',{date:state.date,name:'ריצה',type:'אירובי'});state.data.workout=await call('saveWorkout',{date:state.date,muscleGroup:'אירובי',exercise:'ריצה',sets:[{weight:'',reps:1,note}],notes:note,sessionName:'ריצה',sessionId:r.id});
      try{state.data.workout=(await call('finishWorkoutSession',{id:r.id,minutes:tm?Math.round(tm/60):''})).workout||state.data.workout}catch(_){}try{renderWorkouts(false)}catch(_){}}catch(e){console.warn(e)}
    try{shoes(log.reduce((a,r)=>a+(Number(r.km)||0),0))}catch(_){}if(row.ok)setProp('RUN_STOPS','0');setTimeout(()=>{try{fp219Week.checkMedals(false)}catch(_){}},350);return row},
  gpsOn(){return !!(G&&G.on)},
  runMin(){if(!G||!G.on)return;RUNMIN=true;scrOff();const s=$('fpTSheet');if(s)s.remove();cancelAnimationFrame(raf);floatOn()},
  runMax(){if(!G||!G.on)return;RUNMIN=false;floatOff();if(!$('fpTSheet'))runSheet();scrOpen()},
  setupOpen(){V.setup=null;setupSheet()},
  setup(k,v,quiet){V.setup[k]=v;if(!quiet)setupSheet()},
  makePlan(choice){const s=V.setup;const start=s.mode==='zero'?0:Number(String(s.now).replace(',','.'))||0;const old=J('RUN_PLAN',null)||{};
    /* 2.23: a new plan over an old one asks what to do with the progress. The runs always stay in the journal. */
    if(old.since&&!choice)return sheet('תוכנית חדשה',`<div class="fpT-card"><b>מה לעשות עם ההתקדמות שלך?</b><p class="muted" style="margin:6px 0 0">כל הריצות נשארות ביומן בכל מקרה. אם תרצה, אפשר למחוק ריצה מהיומן בעצמך.</p></div>
      <button type="button" class="btn full" onclick="fpT.makePlan('zero')">להתחיל מאפס</button><p class="muted" style="margin:4px 2px 12px;font-size:12.5px">התוכנית החדשה מתחשבת רק בריצות מהיום. טוב למי שמקטין מרחק או חוזר אחרי הפסקה.</p>
      <button type="button" class="btn light full" onclick="fpT.makePlan('keep')">להמשיך ממה שכבר רצתי</button><p class="muted" style="margin:4px 2px 0;font-size:12.5px">הריצה הכי ארוכה שעשית בלי לעצור נשארת נקודת ההתחלה. טוב למי שמגדיל יעד.</p>`);
    const keep=choice==='keep';
    setProp('RUN_PLAN',JSON.stringify({mode:s.mode,start,runsNow:s.mode==='zero'?0:Number(s.runsNow)||0,paceNow:s.paceNow||'',goal:Number(s.goal)||5,paceGoal:s.paceGoal||'',runs:s.runs,str:Number((J('TRAIN_PLAN',{})||{}).str)||0,since:today(),week:1,m3:start>=3||(keep&&!!old.m3),resetAt:choice==='zero'?today():(old.resetAt||'')}));
    try{const t=J('TRAIN_PLAN',null)||{};t.want=Array.isArray(t.want)?t.want:[];if(!t.want.includes('run'))t.want.push('run');t.run=s.runs;setProp('TRAIN_PLAN',JSON.stringify(t))}catch(_){}
    try{renderWorkoutHome()}catch(_){}try{window.fp222&&fp222.planChanged&&fp222.planChanged()}catch(_){}s.done=1;V={step:0,pick:null,own:{type:'קלה',km:'',min:''},setup:s};setupSheet()},
  go(i){V.step=i;runSheet();const s=document.querySelector('#fpTSheet .sheet');if(s)s.scrollTop=0},
  pick(i){V.pick=i;V.step=0;if(i===null){V.fixed=null;V.fid=null;V.tg=null;V.rec=null}runSheet()},
  own(k,v,quiet){V.own[k]=v;if(!quiet)runSheet()},
  ran:logRun,
  gps(on){if(on)gpsStart();else{gpsStop(true);V.step=2;runSheet()}},
  km(v){V.km=v;const b=$('fpSplits');if(b)b.innerHTML=splitsHtml()},
  tm(v){V.tm=v},sp(i,v){V.sp=V.sp||[];V.sp[i]=v},spOpen(o){V.spOpen=o},
  bad(b){const card=b.closest('.fpT-ex'),svg=card.querySelector('svg'),p=card.querySelector('.no'),on=svg.dataset.bd==='-1';svg.dataset.bd=on?'0':'-1';const x=pat(svg.dataset.an);if(x)svg.setAttribute('viewBox',anBox(x,on?0:-1,JSON.parse(svg.dataset.v||'{}')));p.hidden=!on;b.textContent=on?'✓ ככה נכון':'מה לא לעשות'},
  cardio(){C={mach:null,day:'easy',run:null};cardioSheet()},
  c(k,v){if(C.run)return;C[k]=v;cardioSheet()},
  cStart(){C.run={i:0,t:0,at:Date.now()};clearInterval(cInt);cInt=setInterval(cTick,1000);try{fpRestSound&&0}catch(_){}cardioSheet()},
  async cStop(save){clearInterval(cInt);const r=C.run;C.run=null;const t=cplan()||{kinds:['ell']};const k=C.mach||t.kinds.find(x=>MACH[x])||'ell';
    if(save&&r){const min=Math.max(1,Math.round((Date.now()-r.at)/60000));await saveCardio(min,k);try{toast('נשמר: '+min+' דקות אירובי')}catch(_){}}cardioSheet()},
  close(){if(G&&G.on){fpT.runMin();return}gpsStop(false);clearInterval(cInt);C.run=null;cancelAnimationFrame(raf);const s=$('fpTSheet');if(s)s.remove()},
  _:{RK,kindOf,kindByName,recFor,pvaHtml,skip,planWeeks,storeBtns,STRAVA,exCard,animate,sheet,MACH,runSteps,wk,weekSchedule,pat,anBox,easyPace,fastPace,stop(){cancelAnimationFrame(raf)}},
  plan,weekRuns,cplan,repeatWeek(){const p=J('RUN_PLAN',null);if(!p)return;p.rep=(Number(p.rep)||0)+1;setProp('RUN_PLAN',JSON.stringify(p))}
};
})();
