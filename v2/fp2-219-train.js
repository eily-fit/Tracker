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
const sec=s=>{const m=String(s||'').trim().match(/^(\d{1,3})[:.](\d{1,2})$/);return m?(+m[1])*60+(+m[2]):null};
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
function plan(){const p=J('RUN_PLAN',null);if(!p)return null;p.goal=Number(p.goal)||5;p.start=Number(p.start)||0;p.runs=Math.max(1,Number(p.runs)||2);p.kind=p.start<3?'start':p.goal<=5?'k5':p.goal<=10?'k10':p.goal<=15?'k15':'half';
  p.name={start:'מתחילים לרוץ',k5:'משפרים 5 ק״מ',k10:'עד 10 ק״מ',k15:'עד 15 ק״מ',half:'עד חצי מרתון'}[p.kind];p.gp=sec(p.paceGoal);p.now=sec(p.paceNow);
  const log=J('RUN_LOG',[]);p.best=log.filter(r=>r.ok).reduce((m,r)=>Math.max(m,Number(r.km)||0),0);p.base=Math.max(p.start,p.best);
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
  if(t==='ריצה משלי')return[['חימום','5 דק׳ תרגילי חימום'],['העיקר','ריצה '+d],['שחרור','5 דק׳ הליכה ומתיחות']];
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
    ${x.good.map(g=>`<p>✓ ${esc(g)}</p>`).join('')}${bad?`<button type="button" class="fpT-chip" onclick="fpT.bad(this)">❌ מה לא לעשות</button><p class="no" hidden><b>${esc(bad.t)}:</b> ${esc(bad.fix)}</p>`:''}</div></div>`}
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
  return `<div class="fpT-card"><b>${p.name}</b> · שבוע ${p.week}<div class="muted">${p.str?p.str+' כוח + ':''}${p.runs} ${p.runs===1?'ריצה':'ריצות'} בשבוע · היעד ${p.goal===21.1?'חצי מרתון':p.goal+' ק״מ'}${p.m3?' · 🏅 3 ק״מ':''}</div></div>
   <div class="fpT-card"><h3>השבוע</h3>${sch.map((d,i)=>d?`<div class="fpT-wk"><b>${DAYS[i]}</b><span>${d.t==='str'?'🏋️ כוח'+(d.legs?' · כולל רגליים לרצים':' · פלג גוף עליון'):'🏃 '+(runs[d.i]?runs[d.i][0]+': '+runs[d.i][1]:'ריצה')}</span></div>`:'').join('')}
    <p class="muted" style="margin:8px 0 0">רצים עושים רגליים רק באימון כוח אחד בשבוע. ${p.m3?(p.base>=10?'רץ כבר 10 ק״מ: נפתחו קטעים ארוכים.':'הקטעים המהירים קצרים, עד 200 מ׳. ב-10 ק״מ נפתחים קטעים ארוכים.'):'עד 3 ק״מ: רק ריצות קלות.'}</p></div>
   <details class="fpT-card"><summary style="cursor:pointer;font-weight:700">החודש הראשון</summary>${[1,2,3,4].map(w=>`<div class="fpT-wk${w===p.week?' now':''}"><b>שבוע ${w}</b><span>${weekRuns(p,w).map(r=>r[0]+': '+r[1].split(',')[0]).join(' · ')}</span></div>`).join('')}<p class="muted">שבוע חדש נפתח כשמסיימים את השבוע הקודם.</p></details>`}
function runSheet(){const p=plan();if(!p)return setupSheet();const runs=weekRuns(p,p.week),st=V.step;
  const seg=`<div class="fpT-seg" role="group">${['בוחרים','חימום','ריצה','מתיחות'].map((t,i)=>`<button type="button" class="${i===st?'on':''}" onclick="fpT.go(${i})">${i+1}. ${t}</button>`).join('')}</div>`;
  let b='';
  if(st===0){const types=[['קלה',0],['ארוכה',0],['האצות קצרות',1],['פרטלק',1],['עליות',1],['אינטרוולים',1],['ספרינטים',1]];
    b=`<p class="muted" style="margin:6px 0">מה רצים היום?</p>${runs.map((r,i)=>`<button type="button" class="btn ${V.pick===i?'':'light '}full" style="margin-top:8px;text-align:right;display:block" onclick="fpT.pick(${i})"><b>${esc(r[0])}</b><div class="muted" style="font-size:12.5px">${esc(r[1])}</div></button>`).join('')}
      <button type="button" class="btn ${V.pick==='own'?'':'light '}full" style="margin-top:8px;text-align:right;display:block" onclick="fpT.pick('own')"><b>ריצה משלי</b><div class="muted" style="font-size:12.5px">בוחר סוג ומרחק או זמן</div></button>
      ${V.pick==='own'?`<div class="fpT-card" style="margin-top:10px">${types.map(([t,l])=>{const lk=l&&!p.m3;return `<button type="button" class="fpT-chip${V.own.type===t&&!lk?' on':''}${lk?' lock':''}" ${lk?'aria-disabled="true"':`onclick="fpT.own('type','${t}')"`}>${lk?'🔒 ':''}${t}</button>`}).join(' ')}
        ${!p.m3?'<div class="fpT-warn"><b>🔒 נפתח ב-3 ק״מ.</b> אימונים מהירים לפני שיש בסיס הם הדרך הכי מהירה להיפצע.</div>':''}
        <div class="row"><div class="field"><label>מרחק (ק״מ)</label><input inputmode="decimal" value="${esc(V.own.km)}" oninput="fpT.own('km',this.value,1)"></div><div class="field"><label>או זמן (דק׳)</label><input inputmode="numeric" value="${esc(V.own.min)}" oninput="fpT.own('min',this.value,1)"></div></div></div>`:''}
      ${V.pick!=null&&V.pick!=='own'&&runs[V.pick]?`<div class="fpT-card" style="margin-top:10px"><h3>האימון של היום</h3>${wk(runSteps(runs[V.pick],p))}</div>`:''}
      <button type="button" class="btn full" style="margin-top:12px" ${V.pick==null?'disabled':''} onclick="fpT.go(1)">לחימום ←</button>
      <details class="fpT-card" style="margin-top:12px"><summary style="cursor:pointer;font-weight:700">📋 התוכנית</summary>${planHtml(p)}</details>`}
  if(st===1)b=`<div class="fpT-good"><b>לא חייבים את כולם.</b> בוחרים 3–4 תרגילים, 5 דקות בסך הכל. לפני ריצה לא מחזיקים מתיחות במקום, רק תנועה.</div>${WARM.map((e,i)=>exCard(e,i)).join('')}<button type="button" class="btn full" onclick="fpT.go(2)">סיימתי חימום, רצים ←</button>`;
  if(st===2){const t=V.pick==='own'?['ריצה משלי',(V.own.km?V.own.km+' ק״מ':V.own.min?V.own.min+' דק׳':'')+' · '+V.own.type]:runs[V.pick||0]||runs[0];
    b=`<div class="fpT-card"><h3>האימון של היום</h3>${wk(runSteps(t,p))}<p class="muted" style="margin:6px 0 0">הקצב בדקות לקילומטר. יש שעון? תסתכל עליו. אין? לפי הדיבור.</p></div>
      <div class="fpT-card"><div class="row"><div class="field"><label>כמה רצת (ק״מ)</label><input id="fpTkm" inputmode="decimal" placeholder="3"></div><div class="field"><label>כמה זמן (דק׳:שנ׳)</label><input id="fpTtime" inputmode="text" placeholder="20:30"></div></div><p class="muted" style="margin:0">📱 מדדת ב-Strava? רק תעתיק לכאן.</p></div>
      <div class="row"><button type="button" class="btn light" onclick="fpT.ran(0)">עצרתי באמצע</button><button type="button" class="btn" onclick="fpT.ran(1)">רצתי בלי לעצור</button></div>`}
  if(st===3)b=`<div class="fpT-good"><b>לא חייבים את כולם.</b> 5 דקות: הליכה רגועה ו-3–4 מתיחות. מרגישים מתיחה, לא כאב. האדום מראה איפה מרגישים.</div>${COOL.map((e,i)=>exCard(e,i)).join('')}<button type="button" class="btn full" onclick="fpT.close()">סיימתי ✓</button>`;
  sheet('🏃 ריצה',seg+b);
}
function setupSheet(){const s=V.setup||(V.setup={mode:'zero',now:'',goal:'5',runs:2});
  sheet('🏃 תוכנית ריצה',`<p class="muted" style="margin:0 0 8px">כמה שאלות, ויש תוכנית.</p>
   <label>איך אתה רוצה לרוץ?</label>${[['zero','מתחיל מ-0'],['runs','כבר רץ, תדריך אותי']].map(([k,l])=>`<button type="button" class="btn ${s.mode===k?'':'light '}full" style="margin-top:6px" onclick="fpT.setup('mode','${k}')">${l}</button>`).join('')}
   ${s.mode==='runs'?`<div class="field" style="margin-top:10px"><label>כמה אתה רץ היום, הכי הרבה (ק״מ)?</label><input inputmode="decimal" value="${esc(s.now)}" oninput="fpT.setup('now',this.value,1)"></div>`:''}
   <label style="margin-top:10px;display:block">לאן תרצה להגיע?</label><div class="meal-tabs" style="flex-wrap:wrap">${[3,5,7,10,12,15,21.1].map(k=>`<button type="button" class="chip${String(s.goal)===String(k)?' active':''}" onclick="fpT.setup('goal','${k}')">${k===21.1?'חצי מרתון':k+' ק״מ'}</button>`).join('')}</div>
   <label style="margin-top:10px;display:block">כמה ריצות בשבוע?</label><div class="meal-tabs">${[1,2,3].map(n=>`<button type="button" class="chip${s.runs===n?' active':''}" onclick="fpT.setup('runs',${n})">${n}${n===2?' ⭐':''}</button>`).join('')}</div>
   <button type="button" class="btn full" style="margin-top:14px" onclick="fpT.makePlan()">צור תוכנית</button>`)}
async function logRun(ok){
  const km=Number(String(($('fpTkm')||{}).value||'').replace(',','.'))||0,tm=sec(($('fpTtime')||{}).value)||null;
  const p=plan();const log=J('RUN_LOG',[]);log.push({d:today(),km,s:tm,ok:!!ok,type:V.pick==='own'?V.own.type:'plan'});setProp('RUN_LOG',JSON.stringify(log.slice(-400)));
  const note=(km?km+' ק״מ':'')+(tm?' · '+mmss(tm):'')+(ok?'':' · עצרתי באמצע');
  try{const r=await call('createWorkoutSession',{date:state.date,name:'ריצה',type:'אירובי'});state.data.workout=await call('saveWorkout',{date:state.date,muscleGroup:'אירובי',exercise:'ריצה',sets:[{weight:'',reps:1,note}],notes:note,sessionName:'ריצה',sessionId:r.id});
    try{state.data.workout=(await call('finishWorkoutSession',{id:r.id,minutes:tm?Math.round(tm/60):''})).workout||state.data.workout}catch(_){}try{renderWorkouts(false)}catch(_){}}catch(e){console.warn(e)}
  const total=log.reduce((s,r)=>s+(Number(r.km)||0),0);shoes(total);
  if(ok&&km>=3&&p&&!p.m3){p.m3=true;savePlan(p);try{fpMedalGive&&fpMedalGive('run3')}catch(_){}try{fpConfetti&&fpConfetti('🏅 3 ק״מ בלי לעצור!')}catch(_){}
    return sheet('🏅',`<div style="text-align:center"><div style="font-size:56px">🏅</div><h2>3 ק״מ בלי לעצור!</h2><p>עלית שלב. נפתחו לך: האצות קצרות, פרטלק, עליות ואינטרוולים. מתחילים קטן, פעם בשבוע.</p><button type="button" class="btn full" onclick="fpT.go(3)">למתיחות ←</button></div>`)}
  if(!ok){const c=(Number(prop('RUN_STOPS'))||0)+1;setProp('RUN_STOPS',String(c))}else setProp('RUN_STOPS','0');
  sheet('🏃',`<div style="text-align:center"><h2>${ok?'יפה, נרשם ✓':'זה בסדר גמור'}</h2><p>${ok?'עכשיו מתיחות.':Number(prop('RUN_STOPS'))>=2?'פעמיים ברצף עצרת. בפעם הבאה נכניס הפסקות הליכה קצרות באמצע, וזה בסדר.':'בפעם הבאה אותה ריצה שוב. ככה בונים בלי להיפצע.'}</p><button type="button" class="btn full" onclick="fpT.go(3)">למתיחות ←</button></div>`);
}
function shoes(total){total=Math.max(0,total-(Number(prop('SHOE_START'))||0));const warned=J('SHOE_WARN',[]);for(const at of [550,700,800]){if(total>=at&&!warned.includes(at)){warned.push(at);setProp('SHOE_WARN',JSON.stringify(warned));try{toast(`👟 הנעליים עברו ${at} ק״מ. כדאי לחשוב על זוג חדש`)}catch(_){}break}}}

/* ---------- cardio ---------- */
const MACH={walk:{n:'הליכה מהירה',fig:['walk',{mode:'brisk'}],easy:'5.5–6.5 קמ״ש, צעדים מהירים, ידיים זזות',hard:'הכי מהר שאפשר בלי לרוץ, או בעלייה'},
  tread:{n:'הליכון',fig:['jog',{tm:1}],easy:'הליכה 5.5–6.5 קמ״ש, שיפוע 6–10%',hard:'שיפוע 12–15% באותה מהירות, או ריצה קלה'},
  bike:{n:'אופני כושר',fig:['bike',{}],easy:'70–90 סיבובים לדקה, התנגדות בינונית (6–8)',hard:'התנגדות גבוהה (12–14), 80–95 סיבובים לדקה'},
  ell:{n:'אליפטיקל',fig:['elliptical',{}],easy:'רמה 6–8, קצב קבוע',hard:'רמה 12–14, או אותה רמה בקצב מהיר'},
  row:{n:'חתירה',fig:['rower',{}],easy:'22–26 משיכות לדקה, משיכה רגועה',hard:'28–32 משיכות לדקה, כוח מלא בכל משיכה'},
  swim:{n:'שחייה',fig:['swim',{}],easy:'שחייה רצופה בקצב נוח. מותר לעצור 15 שנ׳ בסוף בריכה',hard:'שחייה מהירה. בקטע הקל: שחייה איטית או עמידה'},
  stairs:{n:'מדרגות',fig:['stairs',{}],easy:'רמה 5–7, אוחזים קלות במעקה',hard:'רמה 9–11'}};
function cplan(){const t=J('TRAIN_PLAN',null);if(!t||!(t.car>0))return null;return Object.assign({lvl:(Number(t.carNow)||0)<2?'beg':'adv',kinds:Array.isArray(t.carKinds)&&t.carKinds.length?t.carKinds:['ell'],week:Math.max(1,Math.floor(daysBetween(t.set||today(),today())/7)+1)},t)}
let C={mach:null,day:'easy',run:null};
function carSteps(lvl,day,m){return day==='easy'?[['חימום','3 דק׳ איטי מאוד'],['העיקר',(lvl==='beg'?'15':'40')+' דק׳ קל · '+m.easy],['סיום','2 דק׳ איטי']]:[['חימום','10 דק׳ קל · '+m.easy],['העיקר',(lvl==='beg'?'3 × 3':'4 × 4')+' דק׳ חזק · '+m.hard+'. בין כל אחד 3 דק׳ קל'],['סיום','5 דק׳ קל']]}
function carPhases(lvl,day){if(day==='easy')return[['חימום',180,'e'],['קל',(lvl==='beg'?15:40)*60,'e'],['סיום',120,'e']];const n=lvl==='beg'?3:4,len=(lvl==='beg'?3:4)*60,ph=[['חימום',600,'e']];for(let i=0;i<n;i++){ph.push(['חזק',len,'h']);if(i<n-1)ph.push(['קל',180,'e'])}ph.push(['סיום',300,'e']);return ph}
function cardioSheet(){const t=cplan()||{lvl:'beg',kinds:['ell'],carGoal:2,week:1};const k=C.mach||t.kinds.find(x=>MACH[x])||'ell',m=MACH[k],lvl=C.lvl||t.lvl;
  const beg=[['שבוע 1','2–3 × 20 דק׳ קל'],['שבוע 2','2–3 × 25 דק׳ קל'],['שבוע 3','2 × 30 דק׳ קל + 3 × 3 דק׳ חזק'],['שבוע 4','2 × 30 דק׳ קל + 4 × 3 דק׳ חזק'],['שבוע 5','2 × 35 דק׳ קל + 4 × 4 דק׳ חזק'],['שבוע 6','2 × 40 דק׳ קל + 4 × 4 דק׳ חזק']];
  const adv=[['שבועות 1–2','2 × 4×4 עם 3 קטעים · 1–2 × 45 דק׳ קל'],['שבועות 3–4','2 × 4×4 עם 4 קטעים · 1–2 × 50 דק׳ קל'],['שבועות 5–6','2 × 4×4, הקטעים האחרונים חזקים מאוד · 1–2 × 60 דק׳ קל'],['שבועות 7–8','כמו 5–6, אפשר 4×4 שלישי'],['שבוע 9','שבוע קל: 4×4 אחד ואימון קל'],['אחר כך','לשמירה: 4×4 אחד ו-2–3 קלים בשבוע']];
  const ph=carPhases(lvl,C.day);const tot=ph.reduce((s,x)=>s+x[1],0);
  let timer='';if(C.run){const r=C.run,cur=ph[r.i]||ph[ph.length-1],left=Math.max(0,cur[1]-r.t);timer=`<div class="fpT-timer"><div class="muted">${cur[0]} · שלב ${r.i+1} מתוך ${ph.length}</div><div class="big">${mmss(left)}</div><div class="fpT-bar">${ph.map((x,i)=>`<span class="${x[2]}${i===r.i?' cur':''}" style="flex:${x[1]}">${x[0]==='חזק'?'חזק':''}</span>`).join('')}</div><div class="row"><button type="button" class="btn light" onclick="fpT.cStop(0)">⏹ עצור</button><button type="button" class="btn" onclick="fpT.cStop(1)">סיימתי ושמור</button></div></div>`}
  sheet('🚴 אירובי',`<div class="fpT-seg" role="group"><button type="button" class="${lvl==='beg'?'on':''}" onclick="fpT.c('lvl','beg')">מתחיל</button><button type="button" class="${lvl==='adv'?'on':''}" onclick="fpT.c('lvl','adv')">מתקדם</button></div>
   <div class="fpT-card"><h3>על מה מתאמנים</h3><div>${[...new Set([...t.kinds.filter(x=>MACH[x]),k])].map(x=>`<button type="button" class="fpT-chip${x===k?' on':''}" onclick="fpT.c('mach','${x}')">${MACH[x].n}</button>`).join(' ')}</div>
    ${m.fig?exCard([m.fig[0],m.n,C.day==='easy'?'קל':'4×4',m.fig[1]],0):`<p class="muted">הדמיה של ${m.n} תתווסף.</p>`}
    <div class="fpT-wk"><b>קל</b><span>${m.easy}</span></div><div class="fpT-wk"><b>חזק</b><span>${m.hard}</span></div><p class="muted" style="margin:6px 0 0">המספרים משתנים בין מכונות. הכלל: קל = אפשר לדבר, לא לשיר. חזק = רק כמה מילים.</p></div>
   <div class="fpT-card"><h3>האימון של היום</h3><div class="fpT-seg" role="group"><button type="button" class="${C.day==='easy'?'on':''}" onclick="fpT.c('day','easy')">יום קל</button><button type="button" class="${C.day==='hard'?'on':''}" onclick="fpT.c('day','hard')">יום 4×4</button></div>
    ${wk(carSteps(lvl,C.day,m))}<p class="muted" style="margin:6px 0 0">סה״כ ${Math.round(tot/60)} דקות.</p>${timer||`<button type="button" class="btn full" style="margin-top:8px" onclick="fpT.cStart()">▶ התחל, הטיימר מוביל אותך</button>`}</div>
   <details class="fpT-card"><summary style="cursor:pointer;font-weight:700">📋 ${lvl==='beg'?'תוכנית למתחילים':'תוכנית למתקדמים'}</summary>${(lvl==='beg'?beg:adv).map((x,i)=>`<div class="fpT-wk${i===Math.min(5,t.week-1)?' now':''}"><b>${x[0]}</b><span>${x[1]}</span></div>`).join('')}<p class="muted">${lvl==='beg'?'מוסיפים 5 דקות כל שבוע. האימון החזק נכנס רק כשמרגישים שמתאוששים טוב.':'בין שני אימוני 4×4 לפחות 3 ימים.'} שבוע שהיה קשה מדי? חוזרים עליו.</p></details>`)}
let cInt=0;
function cTick(){const lvl=C.lvl||(cplan()||{lvl:'beg'}).lvl,ph=carPhases(lvl,C.day);if(!C.run)return;C.run.t++;if(C.run.t>=ph[C.run.i][1]){C.run.i++;C.run.t=0;try{fpRestSound&&fpRestSound()}catch(_){}if(C.run.i>=ph.length){clearInterval(cInt);return fpT.cStop(1)}}
  const big=document.querySelector('#fpTSheet .fpT-timer .big');if(big){const cur=ph[C.run.i];big.textContent=mmss(Math.max(0,cur[1]-C.run.t))}}
async function saveCardio(minutes,k){const m=MACH[k]||{n:'אירובי'};const log=J('CARDIO_LOG',[]);log.push({d:today(),min:minutes,k,hard:C.day==='hard'});setProp('CARDIO_LOG',JSON.stringify(log.slice(-400)));
  try{const r=await call('createWorkoutSession',{date:state.date,name:'אירובי',type:'אירובי'});state.data.workout=await call('saveWorkout',{date:state.date,muscleGroup:'אירובי',exercise:m.n,sets:[{weight:'',reps:1,note:minutes+' דקות'}],notes:minutes+' דקות',sessionName:'אירובי',sessionId:r.id});
    try{state.data.workout=(await call('finishWorkoutSession',{id:r.id,minutes})).workout||state.data.workout}catch(_){}try{renderWorkouts(false)}catch(_){}}catch(e){console.warn(e)}}

/* ---------- cards on the workout screen ---------- */
function cards(){const host=$('homeActiveWorkout');if(!host)return;let box=$('fpTCards');if(!box){host.insertAdjacentHTML('afterend','<div id="fpTCards"></div>');box=$('fpTCards')}
  const p=plan(),c=cplan();let h='';
  if(p){const runs=weekRuns(p,p.week);h+=`<div class="fpT-card"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><div><h3>🏃 ${p.name}</h3><div class="muted">שבוע ${p.week} · ${runs.map(r=>r[0]).join(' · ')}</div></div><button type="button" class="btn" onclick="fpT.run()">▶ לריצה</button></div></div>`}
  else{const t=J('TRAIN_PLAN',null);if(!t||!(t.want||[]).includes('run'))h+=`<button type="button" class="btn secondary full" style="margin-bottom:10px" onclick="fpT.setupOpen()">🏃 רוצה להתחיל לרוץ? תוכנית ריצה</button>`}
  if(c){const k=c.kinds.find(x=>MACH[x])||'ell';h+=`<div class="fpT-card"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><div><h3>🚴 אירובי · ${MACH[k].n}</h3><div class="muted">${c.lvl==='beg'?'תוכנית למתחילים':'תוכנית למתקדמים'} · ${c.carGoal||c.car} בשבוע</div></div><button type="button" class="btn" onclick="fpT.cardio()">▶ לאימון</button></div></div>`}
  box.innerHTML=h}
if(typeof renderWorkoutHome==='function'){const o=renderWorkoutHome;renderWorkoutHome=function(){const r=o.apply(this,arguments);try{cards()}catch(e){console.error(e)}return r}}

window.fpT={
  run(){V={step:0,pick:null,own:{type:'קלה',km:'',min:''}};runSheet()},
  setupOpen(){V.setup=null;setupSheet()},
  setup(k,v,quiet){V.setup[k]=v;if(!quiet)setupSheet()},
  makePlan(){const s=V.setup;const start=s.mode==='zero'?0:Number(String(s.now).replace(',','.'))||0;
    setProp('RUN_PLAN',JSON.stringify({mode:s.mode,start,runsNow:0,paceNow:'',goal:Number(s.goal)||5,paceGoal:'',runs:s.runs,str:Number((J('TRAIN_PLAN',{})||{}).str)||0,since:today(),week:1,m3:start>=3}));
    try{renderWorkoutHome()}catch(_){}V={step:0,pick:null,own:{type:'קלה',km:'',min:''}};runSheet()},
  go(i){V.step=i;runSheet();const s=document.querySelector('#fpTSheet .sheet');if(s)s.scrollTop=0},
  pick(i){V.pick=i;runSheet()},
  own(k,v,quiet){V.own[k]=v;if(!quiet)runSheet()},
  ran:logRun,
  bad(b){const card=b.closest('.fpT-ex'),svg=card.querySelector('svg'),p=card.querySelector('.no'),on=svg.dataset.bd==='-1';svg.dataset.bd=on?'0':'-1';const x=pat(svg.dataset.an);if(x)svg.setAttribute('viewBox',anBox(x,on?0:-1,JSON.parse(svg.dataset.v||'{}')));p.hidden=!on;b.textContent=on?'✅ ככה נכון':'❌ מה לא לעשות'},
  cardio(){C={mach:null,day:'easy',run:null};cardioSheet()},
  c(k,v){if(C.run)return;C[k]=v;cardioSheet()},
  cStart(){C.run={i:0,t:0,at:Date.now()};clearInterval(cInt);cInt=setInterval(cTick,1000);try{fpRestSound&&0}catch(_){}cardioSheet()},
  async cStop(save){clearInterval(cInt);const r=C.run;C.run=null;const t=cplan()||{kinds:['ell']};const k=C.mach||t.kinds.find(x=>MACH[x])||'ell';
    if(save&&r){const min=Math.max(1,Math.round((Date.now()-r.at)/60000));await saveCardio(min,k);try{toast('נשמר: '+min+' דקות אירובי')}catch(_){}}cardioSheet()},
  close(){clearInterval(cInt);C.run=null;cancelAnimationFrame(raf);const s=$('fpTSheet');if(s)s.remove()},
  _:{exCard,animate,sheet,MACH,runSteps,wk,weekSchedule,pat,anBox,easyPace,fastPace,stop(){cancelAnimationFrame(raf)}},
  plan,weekRuns,cplan,repeatWeek(){const p=J('RUN_PLAN',null);if(!p)return;p.rep=(Number(p.rep)||0)+1;setProp('RUN_PLAN',JSON.stringify(p))}
};
})();
