/* FitPro 2.32.0 — as approved in the sketches:
   • admin: one board with tiles (B); each tile opens its own screen, with counts
   • a list that did not load: short line ״לא נטען״ + ״פרטים״ (full error, copy) + ״נסה שוב״ (C)
   • the tour: two purple steps for the weekly check-in, the real card glowing and then the summary (C)
   (the home check-in card, the questionnaire line and the chat question are in index.html, fp2-219-onb.js, fp2-231.js) */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isAdmin=()=>{try{return !!(window.FP2&&FP2.isAdmin&&FP2.isAdmin())}catch(_){return false}};

document.head.insertAdjacentHTML('beforeend',`<style id="fp232css">
.fpLE{display:flex;align-items:center;justify-content:space-between;gap:8px;background:var(--card,#171C22);border:1px solid var(--line,#2C3640);border-radius:12px;padding:9px 11px;margin:8px 0}
.fpLE .t{min-width:0}.fpLE .t b{display:block;font-size:13.5px}.fpLE .t span{color:#FF8A80;font-size:13px}
.fpLE .r{display:flex;gap:6px;flex:none}.fpLE .r button{min-height:34px;padding:5px 12px;font-size:13px}
.fpLEd{background:#11161b;border:1px solid var(--line,#2C3640);border-radius:12px;padding:9px 11px;margin:-2px 0 8px}
.fpLEd pre{margin:4px 0 8px;font:11.5px/1.5 ui-monospace,Menlo,monospace;direction:ltr;text-align:left;white-space:pre-wrap;word-break:break-word;color:#D9DEE3}
.fpLEd button{min-height:32px;padding:4px 12px;font-size:12.5px}
body.fp232adm #fpFolderAdm>.settings-body>*:not(#fpAdmDash){display:none!important}
#fpAdmDash{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:2px 0 4px}
#fpAdmDash button{font:inherit;text-align:right;display:flex;flex-direction:column;align-items:flex-start;gap:2px;min-height:92px;background:var(--card,#171C22);border:1px solid var(--line,#2C3640);border-radius:14px;padding:11px 12px;color:var(--ink,#F2F5F7);cursor:pointer}
#fpAdmDash button b{font-size:14.5px}
#fpAdmDash .n{font-size:24px;font-weight:800;line-height:1.15;font-variant-numeric:tabular-nums;color:var(--brand,#D7F36B)}
#fpAdmDash .n.z{color:#6B7682}#fpAdmDash .n.e{color:#FF8A80}
#fpAdmDash small{color:#A3ADB8;font-size:12px;line-height:1.35}
#fpAdmDash button.wait{border-color:rgba(215,243,107,.55)}
#fpAdmSh .sheet{max-height:92vh;overflow-y:auto}
#fpAdmSh .fpAdmBody>details{margin-top:8px}
.checkin-due .ci4{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:9px 0 6px}
.checkin-due .ci4 span{display:flex;flex-direction:column;align-items:center;gap:4px;font-size:12px;color:var(--ink,#F2F5F7);background:rgba(0,0,0,.18);border-radius:10px;padding:7px 2px}
.checkin-due .ci4 svg{width:22px;height:22px;fill:none;stroke:var(--brand,#D7F36B);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.checkin-due .ci4+p{margin:0 0 10px}
/* the ״מצא״ button was cut on the iPhone: the field did not shrink */
#add .search-row{grid-template-columns:minmax(0,1fr) auto!important}#add .search-row .clear-wrap{min-width:0}#add .search-row #foodQuery{min-width:0;width:100%}
</style>`);

/* ---------- a list that did not load (C) ---------- */
const RETRY={};let LEn=0;
window.fpLoadErr=function(el,title,err,retry){if(!el)return;const id='fpLE'+(++LEn);RETRY[id]=retry;
  const msg=String((err&&err.message)||err||'שגיאה'),when=new Date().toLocaleString('he-IL',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
  const full=`${title}: ${msg}\n${when}`;
  el.innerHTML=`<div class="fpLE" id="${id}"><div class="t"><b>${esc(title)}</b><span>לא נטען</span></div><div class="r"><button type="button" class="btn light" onclick="fpLoadErrMore('${id}')">פרטים</button><button type="button" class="btn" onclick="fpLoadErrRetry('${id}')">נסה שוב</button></div></div><div class="fpLEd" hidden id="${id}d"><small class="muted">השגיאה המלאה</small><pre>${esc(full)}</pre><button type="button" class="btn light" onclick="fpLoadErrCopy('${id}')">העתק</button></div>`;
  el.dataset.err=full};
window.fpLoadErrMore=id=>{const d=$(id+'d');if(d)d.hidden=!d.hidden};
window.fpLoadErrRetry=id=>{const f=RETRY[id];const e=$(id);if(e){const s=e.querySelector('.t span');if(s){s.textContent='טוען…';s.style.color='#A3ADB8'}}try{if(typeof f==='function')f()}catch(_){}};
window.fpLoadErrCopy=async id=>{const d=$(id+'d');const t=d?d.querySelector('pre').textContent:'';try{await navigator.clipboard.writeText(t);toast('הועתק')}catch(_){try{const a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();document.execCommand('copy');a.remove();toast('הועתק')}catch(__){}}};

/* ---------- admin board (B) ---------- */
const CNT={req:null,ex:null,sug:null,food:null,users:null,err:{}};
let lastCount=0,counting=false;
function cachedUsers(){try{const u=JSON.parse(localStorage.getItem('fp2AdminUsers')||'null');return Array.isArray(u)?u:null}catch(_){return null}}
/* the requests module tells the 2.23 module its count; listen in */
(function hookReq(n){try{if(window.fp223&&fp223.setReq&&!fp223.setReq.fp232){const o=fp223.setReq;fp223.setReq=function(x){CNT.req=Number(x)||0;drawDash();return o.apply(this,arguments)};fp223.setReq.fp232=1;return}}catch(_){}if(n<40)setTimeout(()=>hookReq(n+1),500)})(0);
async function counts(force){if(!isAdmin()||!window.FP2||!FP2.push||counting)return;if(!force&&Date.now()-lastCount<120000)return;counting=true;lastCount=Date.now();
  const one=async(k,act,f)=>{try{const r=await FP2.push(act,{});CNT[k]=f(r);delete CNT.err[k]}catch(e){CNT.err[k]=String((e&&e.message)||e)}};
  try{await Promise.all([
    one('ex','adminListExerciseRequests',r=>((r&&r.items)||[]).length),
    one('sug','adminListExSuggestions',r=>((r&&r.items)||[]).length),
    one('food','adminListFoodProposals',r=>((r&&r.items)||[]).filter(Boolean).length),
    one('users','adminListUsers',r=>{const u=(r&&r.users)||[];try{localStorage.setItem('fp2AdminUsers',JSON.stringify(u))}catch(_){}return u.length})]);
    try{if(window.fpReqRefresh)await fpReqRefresh()}catch(_){}}
  finally{counting=false;drawDash()}}
const fmtLast=u=>{const l=(u||[]).filter(x=>x&&x.lastLogin&&!x.me).sort((a,b)=>String(b.lastLogin).localeCompare(String(a.lastLogin)))[0];if(!l)return '';let d='';try{const t=new Date(l.lastLogin),n=new Date();d=t.toDateString()===n.toDateString()?'היום':t.toLocaleDateString('he-IL',{day:'numeric',month:'numeric'})}catch(_){}return 'אחרון: '+String(l.name||String(l.email||'').split('@')[0]||'').slice(0,14)+(d?', '+d:'')};
function num(k,v,lab0,labN){if(CNT.err[k])return `<span class="n e">!</span><small>לא נטען</small>`;if(v==null)return `<span class="n z">…</span><small>טוען</small>`;return `<span class="n${v?'':' z'}">${v}</span><small>${v?labN:lab0}</small>`}
const TILES=[
  {k:'req',t:'בקשות',h:()=>num('req',CNT.req,'אין חדשות','מחכות לתשובה'),w:()=>CNT.req>0,go:()=>{try{openRequestsAdmin()}catch(e){toast('הבקשות עוד נטענות',true)}}},
  {k:'ex',t:'תרגילים וסרטונים',h:()=>{if(CNT.err.ex&&CNT.err.sug)return num('ex',0);const a=CNT.ex,b=CNT.sug;if(a==null&&b==null)return num('ex',null);const n=(a||0)+(b||0);return `<span class="n${n?'':' z'}">${n}</span><small>תרגילים: ${a||0} · הצעות לסרטונים: ${b||0}</small>`},w:()=>(CNT.ex||0)+(CNT.sug||0)>0,go:()=>openTopic('ex')},
  {k:'food',t:'מזונות לאישור',h:()=>num('food',CNT.food,'אין חדשים','מחכים לאישור'),w:()=>CNT.food>0,go:()=>openTopic('food')},
  {k:'users',t:'משתמשים',h:()=>{const u=cachedUsers();const n=CNT.users!=null?CNT.users:u?u.length:null;if(n==null)return num('users',null);return `<span class="n">${n}</span><small>${esc(fmtLast(u))||'רשומים'}</small>`},go:()=>openTopic('users')},
  {k:'tools',t:'כלים',h:()=>`<small style="margin-top:4px">מכונת זמן · בדיקת AI · מאגרים · מתקדם</small>`,go:()=>openTopic('tools')},
  {k:'del',t:'מחק מכולם',h:()=>`<small style="margin-top:4px">תרגיל, ריצה או מאכל, אצל כל המשתמשים</small>`,go:()=>openTopic('del')}];
function drawDash(){const d=$('fpAdmDash');if(!d)return;d.innerHTML=TILES.map(T=>`<button type="button" data-k="${T.k}" class="${T.w&&T.w()?'wait':''}" onclick="fp232.tile('${T.k}')"><b>${T.t}</b>${T.h()}</button>`).join('')}
function mountDash(){const f=$('fpFolderAdm');if(!f||!isAdmin()){document.body.classList.remove('fp232adm');return}
  const body=f.querySelector(':scope > .settings-body');if(!body)return;
  if(!$('fpAdmDash')){const d=document.createElement('div');d.id='fpAdmDash';body.prepend(d);drawDash();
    f.addEventListener('toggle',()=>{if(f.open){drawDash();counts(false)}})}
  else if($('fpAdmDash').parentElement!==body)body.prepend($('fpAdmDash'));
  document.body.classList.add('fp232adm')}

/* the topic screen: the real sections move in while it is open, and back when it closes */
const sumOf=d=>{const s=d&&d.querySelector&&d.querySelector(':scope > summary');return s?s.textContent.trim():''};
function admKids(){const f=$('fpFolderAdm');return f?[...f.querySelectorAll(':scope > .settings-body > details')]:[]}
function find(re){return admKids().find(d=>re.test(sumOf(d)))}
const TOPIC={
  ex:{t:'תרגילים וסרטונים',els:()=>[$('adminExReq'),$('fpSugSet')],load:()=>{try{window.adminLoadReq&&adminLoadReq()}catch(_){}const s=$('fpSugSet');if(s)s.open=true}},
  food:{t:'מזונות לאישור',els:()=>[$('adminFoodReq')],load:()=>{try{window.adminLoadFoods&&adminLoadFoods()}catch(_){}}},
  users:{t:'משתמשים',els:()=>[$('adminUsers')],load:()=>{try{window.adminLoadUsers&&adminLoadUsers()}catch(_){}}},
  tools:{t:'כלים',els:()=>[$('fpTM'),$('fpAiCheck'),find(/^מתקדם/),find(/צמרת/),find(/USDA/),find(/OpenAI/)],load:()=>{}},
  del:{t:'מחק מכולם',els:()=>[$('fpDelAll')],load:()=>{const d=$('fpDelAll');if(d)d.open=true}}};
let MOVED=[];
function back(){MOVED.forEach(([el,par,next])=>{try{if(next&&next.parentNode===par)par.insertBefore(el,next);else par.appendChild(el)}catch(_){}});MOVED=[]}
function openTopic(k){const T=TOPIC[k];if(!T)return;closeTopic();
  document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="fpAdmSh" style="z-index:2147482300" onclick="if(event.target===this)fp232.close()"><div class="sheet"><div class="sheet-head"><h3 style="margin:0">${esc(T.t)}</h3><button type="button" class="btn light" onclick="fp232.close()">סגור</button></div><div class="fpAdmBody"></div></div></div>`);
  const box=$('fpAdmSh').querySelector('.fpAdmBody');
  T.els().filter(Boolean).forEach(el=>{MOVED.push([el,el.parentNode,el.nextSibling]);box.appendChild(el)});
  if(!box.children.length)box.innerHTML='<p class="muted">עוד נטען. נסה שוב בעוד רגע.</p>';
  T.load()}
function closeTopic(){const o=$('fpAdmSh');back();if(o)o.remove();drawDash();lastCount=0;setTimeout(()=>counts(true),300)}
window.fp232={tile:k=>{const T=TILES.find(x=>x.k===k);if(T)T.go()},open:openTopic,close:closeTopic,counts:()=>counts(true),CNT,drawDash};
setInterval(()=>{try{if($('settings')&&$('settings').classList.contains('active'))mountDash()}catch(_){}},1000);

/* ---------- the tour: the weekly check-in (C), right after ״היעד מתאזן לבד״ ---------- */
(function tour(){const all=window.fpIntroAll;if(!Array.isArray(all)||all.some(s=>s&&s.fp232))return;
  let forced=false;
  const show=()=>{const c=$('checkinDue');if(c&&c.classList.contains('hide')){c.classList.remove('hide');forced=true;const w=setInterval(()=>{if(!$('fpI')){clearInterval(w);hide()}},600)}if(c)try{c.scrollIntoView({block:'center'})}catch(_){}};
  const hide=()=>{if(forced){forced=false;try{renderCheckinDue()}catch(_){const c=$('checkinDue');if(c)c.classList.add('hide')}}};
  const MOCK_SUM=`<div class="fpI-mock" style="background:#171C22;border:1px solid #B693FF;box-shadow:0 0 0 2px rgba(182,147,255,.45),0 0 20px rgba(182,147,255,.35)"><b style="display:block;margin-bottom:2px">סיכום השבוע</b><div style="color:#A3ADB8;font-size:12.5px">דוגמה</div>
    <div class="ci-grid"><div><b>2,310</b><span>ממוצע קלוריות (יעד 2,350)</span></div><div><b>5/7</b><span>ימים ביעד חלבון</span></div><div><b>4</b><span>אימונים</span></div><div><b>-0.4 ק״ג</b><span>שינוי במשקל הממוצע</span></div></div>
    <div class="ci-sugg" style="margin:6px 0 0;padding:9px 11px"><b>✓ אתה בקצב שתכננת</b><p class="muted" style="margin:3px 0 0;font-size:13px">או, אם לא: הצעה לעדכן את היעד, וסימון אחד כדי לעדכן.</p></div></div>`;
  const S1={fp232:1,kind:'s',view:'today',before:show,t:()=>$('checkinDue'),title:'צ׳ק-אין שבועי',text:'פעם בשבוע, ביום שבחרת, הכרטיס הזה מופיע כאן: נשקלים, מודדים היקפים ומצלמים. כ-3 דקות.',hint:true,after:hide};
  const S2={fp232:1,kind:'s',view:'today',t:null,mock:MOCK_SUM,title:'בסוף: סיכום השבוע',text:'ממוצע הקלוריות, ימים בחלבון, אימונים ושינוי במשקל. ואז ״אתה בקצב״, או הצעה לעדכן את היעד. ככה היעד נשאר נכון לאורך זמן.',hint:true};
  let i=all.findIndex(s=>s&&/היעד מתאזן/.test(String(s.title||'')));if(i<0)i=all.findIndex(s=>s&&s.view==='today'&&s.kind==='s');
  all.splice(i<0?all.length-1:i+1,0,S1,S2);window.fpIntroSteps=all.length})();

/* ---------- which meal (Or's note, sketch A): one row of meals on the add screen and before "הוסף הכול" — the meal of this hour is marked, a tap changes it ---------- */
(function meals(){
  const cats=()=>{try{return [...fpCats(),'נוספים']}catch(_){return ['בוקר','צהריים','ערב','נוספים']}};
  const lbl=c=>c==='שלישית'?'ארוחה שלישית':c;
  const cur=()=>{try{return state.addCategory||defaultMealSection()}catch(_){return 'צהריים'}};
  const row=id=>`<div class="fpMealRow" id="${id}"><span class="mu">מוסיפים ל:</span>${cats().map(c=>`<button type="button" class="chip mini ${cur()===c?'active':''}" onclick="fp232.meal('${c}')">${lbl(c)}</button>`).join('')}</div>`;
  document.head.insertAdjacentHTML('beforeend','<style>.fpMealRow{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:4px 0 10px}.fpMealRow .mu{color:#A3ADB8;font-size:13px;margin-inline-end:2px}</style>');
  function paint(){
    const add=$('add');if(add&&!$('fpAddCat')){const h=add.querySelector(':scope > h2');if(h)h.insertAdjacentHTML('afterend',row('fpAddCat'))}
    const ss=$('sentenceSheet');if(ss&&!$('fpSentCat')){const b=ss.querySelector('button[onclick="addSentence()"]');if(b)b.insertAdjacentHTML('beforebegin',row('fpSentCat'))}
    ['fpAddCat','fpSentCat'].forEach(id=>{const e=$(id);if(e){const h=row(id);if(e.outerHTML!==h)e.outerHTML=h}});
    const b=$('sentenceSheet')&&$('sentenceSheet').querySelector('button[onclick="addSentence()"]');if(b)b.textContent='הוסף הכול ל'+lbl(cur())}
  window.fp232=window.fp232||{};
  let mine=null,mineAt=0;
  fp232.meal=c=>{state.addCategory=c;mine=c;mineAt=Date.now();paint();try{renderAddCatChips()}catch(_){}};
  if(typeof renderAddCatChips==='function'){const o=renderAddCatChips;renderAddCatChips=function(){const r=o.apply(this,arguments);try{paint()}catch(_){}return r}}
  /* "＋ אוכל" from the home screen: back to the meal of this hour */
  if(typeof showView==='function'){const o=showView;showView=function(v){const r=o.apply(this,arguments);try{if(v==='add'){if(mine&&state.addCategory===mine&&Date.now()-mineAt>30*60000){state.addCategory=null;mine=null}paint()}}catch(_){}return r}}
  setInterval(()=>{try{if($('add')&&$('add').classList.contains('active'))paint();else if($('sentenceSheet')&&!$('sentenceSheet').classList.contains('hide'))paint()}catch(_){}},1500);
})();

/* ---------- push / pull / legs (Or's note, sketch A): what each one works, under its name ---------- */
(function ppl(){
  const M={'דחיפה':['חזה, כתפיים, יד אחורית','דחיפה: תרגילים שדוחפים משקל מהגוף. עובדים חזה, כתפיים ויד אחורית.'],
           'משיכה':['גב, יד קדמית','משיכה: תרגילים שמושכים משקל אל הגוף. עובדים גב ויד קדמית.'],
           'רגליים':['ירכיים, ישבן, שוקיים','רגליים: ירכיים (קדמי ואחורי), ישבן ושוקיים.']};
  document.head.insertAdjacentHTML('beforeend','<style>.fpPPL{display:block;font-size:10.5px;line-height:1.3;color:#8A949F;font-weight:400;margin-top:1px}.fpQ button.on .fpPPL{color:#C9D3B0}.fpPPLx{font-size:12.5px;color:#A3ADB8;line-height:1.5;margin:-4px 0 10px}</style>');
  function deco(){
    document.querySelectorAll('.fpQ button').forEach(b=>{if(b.querySelector('.fpPPL'))return;const t=[...b.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim();if(M[t])b.insertAdjacentHTML('beforeend',`<small class="fpPPL">${M[t][0]}</small>`)});
    document.querySelectorAll('.fpQ').forEach(q=>{const on=q.querySelector('button.on');const t=on?[...on.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim():'';
      let x=q.nextElementSibling&&q.nextElementSibling.classList.contains('fpPPLx')?q.nextElementSibling:null;
      if(!M[t]||!q.querySelector('.fpPPL')){if(x)x.remove();return}
      if(!x){q.insertAdjacentHTML('afterend','<p class="fpPPLx"></p>');x=q.nextElementSibling}if(x.textContent!==M[t][1])x.textContent=M[t][1]})}
  let qd=0;new MutationObserver(()=>{if(qd)return;qd=setTimeout(()=>{qd=0;try{deco()}catch(_){}},120)}).observe(document.body,{childList:true,subtree:true});setTimeout(deco,800);
})();

/* ---------- settings: a plain line and an example in every part that had none (Or's note, sketch C) ---------- */
(function help(){
  const H=[
   [/^היעד והאירועים/,'היעד שלך ליום, ואיך הוא מתאזן לפי אתמול ולפי אירועים.','אכלת אתמול 200 פחות? היום היעד גבוה ב-200.'],
   [/^יעדים יומיים/,'כמה קלוריות וחלבון ביום. מחושב לפי השאלון, ואפשר לשנות.','2,450 קלוריות ו-130 גרם חלבון ביום.'],
   [/^שעות הארוחות/,'מתי מתחילה כל ארוחה. ככה אוכל שמוסיפים נכנס לבד לארוחה של השעה.','מ-12:00 עד 17:00 זה צהריים: ביצה שמוסיפים ב-13:00 נכנסת לצהריים.'],
   [/^ארבע ארוחות/,'אוכל 4 ארוחות? נוספת ״ארוחה שלישית״ בין הצהריים לערב.','בוקר, צהריים, ארוחה שלישית ב-17:00, ערב.'],
   [/^איך אתה מבשל/,'כמה שמן אתה שם בבישול, כדי שהקלוריות של מה שאתה מבשל יהיו נכונות.','״קצת״ = כפית שמן למחבת, נוסף לבד לכל מה שמסומן ״על המחבת״.'],
   [/^אימונים: כוח/,'מה עושים בשבוע ומה מופיע בלשונית האימון. אפשר לכבות סוג שלא עושים.','3 כוח ו-2 ריצה בשבוע. ריצה כבויה? היא נעלמת מהמסך.'],
   [/^היום, חגים ושבת/,'מתי מתחיל אצלך יום חדש, ומה קורה בחגים ובשבת.','עובד במשמרות לילה? בוחרים 04:00, ומה שאכלת ב-02:00 נשאר באותו יום.'],
   [/^מדליות וסיכום שבוע/,'מדליות על התמדה, וסיכום של השבוע במוצאי שבת.','30 יום ברצף שרשמת אוכל = מדליה. 5 ק״מ ראשונים = מדליה.'],
   [/^השם שלי/,'השם שמופיע בראש המסך.','כותבים ״אור״, ולמעלה כתוב ״המעקב של אור״.'],
   [/^חיבור יומן/,'מחבר את היומן של הטלפון, כדי שאירועים ייקלטו לבד ותוכל לחסוך להם קלוריות מראש.','״חתונה של דני״ ביומן → האפליקציה שואלת כמה לחסוך לפניה.'],
   [/^צ׳ק-אין שבועי/,'פעם בשבוע: שקילה, היקפים, תמונות וסיכום. בסוף: האם לעדכן את היעד.','בחרת שישי → בכל שישי הכרטיס מופיע במסך הבית.'],
   [/^שינה והתאוששות/,'יש לך שעון? השינה וההתאוששות מהלילה מופיעות במסך הבית.','בבוקר רואים כמה ישנת, בלי לפתוח את השעון.'],
   [/^קיצורי דרך/,'משהו שאתה אוכל הרבה? שומרים פעם אחת, ומוסיפים אותו ליום בלחיצה מהפלוס הקטן.','ככה זה ייראה בפלוס: נס קפה · 25 קל׳. לחיצה אחת = נוסף להיום.'],
   [/^טיימר מנוחה/,'מנוחה בין סטים. מתחילה לבד כשרושמים סט, ובסוף צליל, קול או הקלטה שלך.','90 שניות, ובסוף קול: ״סט חדש!״.'],
   [/^שייק חלבון/,'השייק שאתה שותה, כדי להוסיף אותו ליום בלחיצה.','סקופ אבקה + כוס חלב = בערך 220 קל׳ ו-30 ג׳ חלבון.']];
  document.head.insertAdjacentHTML('beforeend','<style>.fpHelp{margin:0 0 10px}.fpHelp p{margin:0 0 6px;color:#A3ADB8;font-size:13.5px;line-height:1.5}.fpHelp .ex{background:#1F262E;border:1px dashed #2C3640;border-radius:10px;padding:7px 10px;font-size:12.5px;line-height:1.5;color:#D9DEE3}.fpHelp .ex b{color:#F2F5F7}</style>');
  function put(){const sec=$('settings');if(!sec)return;
    sec.querySelectorAll('details.settings-section:not(.fp-folder)').forEach(d=>{if(d.closest('#fpFolderAdm')||d.querySelector(':scope > .fpHelp, :scope > .settings-body > .fpHelp'))return;
      const sm=d.querySelector(':scope > summary');if(!sm)return;const t=sm.textContent.trim(),h=H.find(x=>x[0].test(t));if(!h)return;
      const html=`<div class="fpHelp"><p>${esc(h[1])}</p><div class="ex"><b>דוגמה:</b> ${esc(h[2])}</div></div>`;
      const body=d.querySelector(':scope > .settings-body');if(body)body.insertAdjacentHTML('afterbegin',html);else sm.insertAdjacentHTML('afterend',html)})}
  setInterval(()=>{try{if($('settings')&&$('settings').classList.contains('active'))put()}catch(_){}},1200);
})();
})();
