/* FitPro 2.9.0 — "💡 בקשה או רעיון":
   - in the + menu: write (or dictate with the keyboard mic) and/or record up to a minute, "just for me" or "for everyone".
   - "הבקשות שלי" with the status of each one.
   - admin: all requests, status (בטיפול / בוצע / נדחה), a note back to the user, and a per-user upgrade switch (flags/{uid}).
   Stored in Firestore: requests/{id}, flags/{uid}. */
(function(){
'use strict';
if(typeof PLUS_ACTIONS==='undefined')return;
const STATUS={new:['🆕','התקבלה'],progress:['🔧','בטיפול'],done:['✅','בוצע'],declined:['✋','לא הפעם']};
const SCOPE={me:'רק לי',all:'לכולם'};
const fb=()=>window.FP2&&window.FP2.reqAdd?window.FP2:null;
const when=ts=>{try{return new Date(ts).toLocaleDateString('he-IL',{day:'numeric',month:'numeric'})}catch(_){return ''}};

PLUS_ACTIONS.push({id:'request',icon:'💡',label:'בקשה או רעיון',run:()=>openRequest()});

/* ---------- the user's sheet ---------- */
let rec=null,chunks=[],audio=null,timer=null,secs=0;
const R={text:'',scope:'me',audio:'',audioType:'',sending:false,list:null};
function sheet(id,html){let el=$(id);if(!el){document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="${id}"><div class="sheet" id="${id}Body"></div></div>`);el=$(id)}el.classList.remove('hide');$(id+'Body').innerHTML=html}
window.openRequest=function(){try{closePlusMenu()}catch(_){}R.text='';R.audio='';R.scope='me';renderReq();loadMine()};
window.fpReqClose=function(){stopRec(true);const e=$('fpReq');if(e)e.remove()};
function renderReq(){
  const chip=(on,l,js)=>`<button type="button" class="chip${on?' active':''}" onclick="${js}">${l}</button>`;
  const recBtn=rec?`<button type="button" class="btn danger full" onclick="fpRecStop()">⏹ עצור (${60-secs})</button>`:
    R.audio?`<div style="display:flex;gap:8px;align-items:center"><audio controls src="data:${R.audioType};base64,${R.audio}" style="flex:1;height:36px"></audio><button type="button" class="trash" aria-label="מחק הקלטה" onclick="fpRecDel()">🗑</button></div>`:
    `<button type="button" class="btn light full" onclick="fpRecStart()">🎙 הקלטה (עד דקה)</button>`;
  sheet('fpReq',`<div class="sheet-head"><h3>💡 בקשה או רעיון</h3><button class="trash" onclick="fpReqClose()" aria-label="סגור">✕</button></div>
    <p class="muted" style="margin:0 0 8px">משהו שחסר לך? משהו שמציק? כתוב, או לחץ על המיקרופון במקלדת כדי להכתיב.</p>
    <textarea id="fpReqText" rows="4" placeholder="למשל: הייתי רוצה לראות כמה חלבון נשאר לי בארוחת ערב" oninput="fpReqSetText(this.value)" style="width:100%;box-sizing:border-box">${esc(R.text)}</textarea>
    <div style="margin-top:8px">${recBtn}</div>
    <div class="field" style="margin-top:10px"><label>למי זה?</label><div class="meal-tabs">${chip(R.scope==='me','🙋 רק לי',"fpReqScope('me')")}${chip(R.scope==='all','👥 לכולם',"fpReqScope('all')")}</div>
      <p class="muted" style="font-size:12.5px;margin:4px 0 0">${R.scope==='me'?'שדרוג אישי: אם יאושר, הוא יופעל רק אצלך.':'רעיון לכל המשתמשים: אם יאושר, הוא ייכנס לגרסה הבאה.'}</p></div>
    <button type="button" class="btn full" style="margin-top:12px" ${R.sending?'disabled':''} onclick="fpReqSend()">${R.sending?'שולח…':'שלח'}</button>
    <h3 style="margin:18px 0 6px">הבקשות שלי</h3><div id="fpReqMine">${mineHtml()}</div>`);
}
function mineHtml(){
  if(R.list===null)return '<p class="muted">טוען…</p>';
  if(!R.list.length)return '<p class="muted">עוד לא שלחת בקשות.</p>';
  return R.list.map(x=>{const s=STATUS[x.status]||STATUS.new;return `<div class="bank-line" style="align-items:flex-start"><span style="flex:1;min-width:0"><b>${s[0]} ${s[1]}</b> <span class="muted" style="font-size:12px">· ${when(x.ts)} · ${SCOPE[x.scope]||''}</span><br>${esc(x.text||'(הקלטה)')}${x.note?`<br><span class="muted">תשובה: ${esc(x.note)}</span>`:''}</span></div>`}).join('');
}
async function loadMine(){const f=fb();if(!f){R.list=[];return}try{R.list=await f.reqList(false)}catch(e){R.list=[]}const el=$('fpReqMine');if(el)el.innerHTML=mineHtml()}
window.fpReqSetText=v=>{R.text=v};
window.fpReqScope=v=>{R.scope=v;R.text=($('fpReqText')||{}).value||R.text;renderReq()};
window.fpReqSend=async function(){
  R.text=(($('fpReqText')||{}).value||'').trim();
  if(!R.text&&!R.audio)return toast('כתוב או הקלט משהו',true);
  const f=fb();if(!f)return toast('צריך חיבור לחשבון',true);
  R.sending=true;renderReq();
  try{await f.reqAdd({text:R.text,audio:R.audio,audioType:R.audioType,scope:R.scope,name:(typeof personalName==='function'?personalName():'')});
    try{if(f.push)f.push('notifyNewRequest',{name:(typeof personalName==='function'?personalName():''),text:R.text.slice(0,120)}).catch(()=>{})}catch(_){}
    R.text='';R.audio='';toast('נשלח, תודה! 🙏 תראה כאן כשיש עדכון');R.list=null}
  catch(e){toast(e.message,true)}
  R.sending=false;renderReq();loadMine();
};
/* recording: up to 60 seconds, low bitrate so it fits one document */
window.fpRecStart=async function(){
  if(!navigator.mediaDevices||typeof MediaRecorder==='undefined')return toast('ההקלטה לא נתמכת כאן. אפשר להכתיב עם המיקרופון במקלדת',true);
  R.text=(($('fpReqText')||{}).value||R.text);
  try{const stream=await navigator.mediaDevices.getUserMedia({audio:true});
    const type=['audio/mp4','audio/webm;codecs=opus','audio/webm'].find(t=>MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(t))||'';
    rec=new MediaRecorder(stream,Object.assign({audioBitsPerSecond:24000},type?{mimeType:type}:{}));chunks=[];secs=0;
    rec.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
    rec.onstop=()=>{stream.getTracks().forEach(t=>t.stop());if(rec&&rec._cancel){rec=null;return}const blob=new Blob(chunks,{type:rec.mimeType||type||'audio/mp4'});rec=null;
      const fr=new FileReader();fr.onload=()=>{const s=String(fr.result);R.audioType=s.slice(5,s.indexOf(';'))||'audio/mp4';R.audio=s.split(',')[1]||'';if(R.audio.length>900000){R.audio='';toast('ההקלטה ארוכה מדי',true)}renderReq()};fr.readAsDataURL(blob)};
    rec.start(1000);timer=setInterval(()=>{secs++;if(secs>=60)fpRecStop();else{const b=document.querySelector('#fpReq .btn.danger');if(b)b.textContent=`⏹ עצור (${60-secs})`}},1000);renderReq();
  }catch(e){toast('אין גישה למיקרופון',true)}
};
function stopRec(cancel){clearInterval(timer);if(rec){if(cancel)rec._cancel=true;try{rec.stop()}catch(_){}}}
window.fpRecStop=()=>stopRec(false);
window.fpRecDel=()=>{R.audio='';renderReq()};

/* ---------- admin ---------- */
const A={list:null,filter:'open',open:null};
const SEEN_KEY='fp2.reqSeen';
const seen=()=>{try{return JSON.parse(localStorage.getItem(SEEN_KEY)||'[]')}catch(_){return []}};
const markSeen=id=>{const a=seen();if(a.indexOf(id)<0){a.push(id);try{localStorage.setItem(SEEN_KEY,JSON.stringify(a.slice(-500)))}catch(_){}}};
const isNew=x=>(x.status||'new')==='new'&&seen().indexOf(x.id)<0;
document.head.insertAdjacentHTML('beforeend',`<style>
.fp-req-list{max-height:62vh;overflow-y:auto;-webkit-overflow-scrolling:touch;margin-top:8px}
.fp-req-row{display:flex;align-items:center;gap:8px;width:100%;padding:10px;border:1px solid var(--line,#2a323b);border-radius:12px;margin:6px 0;background:none;color:inherit;font:inherit;text-align:right;cursor:pointer}
.fp-req-row.new{border-color:var(--brand,#D7F36B);background:rgba(215,243,107,.07)}
.fp-req-row .t{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fp-req-row .dot{width:9px;height:9px;border-radius:50%;background:var(--brand,#D7F36B);flex:none}
.fp-req-full{border:1px solid var(--line,#2a323b);border-top:0;border-radius:0 0 12px 12px;margin:-8px 0 8px;padding:10px}
.fp-badge{display:inline-grid;place-items:center;min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:#E5484D;color:#fff;font-size:11px;font-weight:700;line-height:1}
nav button[data-tab="more"]{position:relative}
nav button[data-tab="more"] .fp-badge{position:absolute;top:2px;left:50%;margin-left:6px}
</style>`);
window.openRequestsAdmin=async function(){A.list=A.list||null;renderAdmin();const f=fb();try{A.list=await f.reqList(true)}catch(e){A.list=A.list||[];toast(e.message,true)}renderAdmin();badge()};
window.fpAdmClose=()=>{const e=$('fpAdm');if(e)e.remove()};
window.fpAdmFilter=v=>{A.filter=v;A.open=null;renderAdmin()};
window.fpAdmToggle=id=>{A.open=A.open===id?null:id;if(A.open){markSeen(id);badge()}renderAdmin();const r=document.getElementById('fpReqRow_'+id);if(r)r.scrollIntoView({block:'nearest'})};
function renderAdmin(){
  const chip=(on,l,js)=>`<button type="button" class="chip${on?' active':''}" onclick="${js}">${l}</button>`;
  const all=A.list||[],list=all.filter(x=>A.filter==='all'||(A.filter==='open'?['new','progress'].includes(x.status||'new'):x.status===A.filter));
  const nOpen=all.filter(x=>['new','progress'].includes(x.status||'new')).length;
  sheet('fpAdm',`<div class="sheet-head"><h3>📥 בקשות ממשתמשים</h3><button class="trash" onclick="fpAdmClose()" aria-label="סגור">✕</button></div>
    <div class="meal-tabs" style="flex-wrap:wrap">${chip(A.filter==='open',`פתוחות${nOpen?' ('+nOpen+')':''}`,"fpAdmFilter('open')")}${chip(A.filter==='done','בוצעו',"fpAdmFilter('done')")}${chip(A.filter==='declined','נדחו',"fpAdmFilter('declined')")}${chip(A.filter==='all','הכול',"fpAdmFilter('all')")}</div>
    <div class="fp-req-list">${A.list===null?'<p class="muted">טוען…</p>':!list.length?'<p class="muted">אין בקשות כאן.</p>':list.map(x=>{const s=STATUS[x.status]||STATUS.new,open=A.open===x.id,nw=isNew(x);
      return `<button type="button" class="fp-req-row${nw?' new':''}" id="fpReqRow_${x.id}" onclick="fpAdmToggle('${x.id}')">${nw?'<span class="dot" aria-label="חדשה"></span>':''}<span>${s[0]}</span><span class="t"><b>${esc(x.name||x.email||'משתמש')}</b> · ${esc((x.text||'').slice(0,60)||'(הקלטה)')}</span>${x.audio?'<span>🎙</span>':''}<small class="muted">${when(x.ts)}</small></button>`+
      (open?`<div class="fp-req-full"><div class="muted" style="font-size:12px">${SCOPE[x.scope]||''} · ${s[1]}${x.email?' · '+esc(x.email):''}</div>
        ${x.text?`<p style="margin:6px 0;white-space:pre-wrap">${esc(x.text)}</p>`:''}${x.audio?`<audio controls src="data:${esc(x.audioType||'audio/mp4')};base64,${x.audio}" style="width:100%;height:36px"></audio>`:''}
        <input id="fpAdmNote_${x.id}" placeholder="תשובה למשתמש (לא חובה)" value="${esc(x.note||'')}" style="width:100%;box-sizing:border-box;margin-top:6px">
        <div class="meal-tabs" style="flex-wrap:wrap;margin-top:6px">${['progress','done','declined'].map(k=>chip(x.status===k,STATUS[k][0]+' '+STATUS[k][1],`fpAdmSet('${x.id}','${k}')`)).join('')}</div>
        ${x.scope==='me'?`<div style="display:flex;gap:6px;margin-top:6px"><input id="fpAdmFlag_${x.id}" placeholder="שם השדרוג להפעלה אצלו" style="flex:1"><button type="button" class="btn light mini" onclick="fpAdmFlag('${x.id}','${esc(x.uid)}')">הפעל אצלו</button></div>`:''}
        <button type="button" class="linkish muted" style="font-size:12.5px;margin-top:4px" onclick="fpAdmDel('${x.id}')">🗑 מחק</button></div>`:'')}).join('')}</div>`);
}
window.fpAdmSet=async function(id,status){const f=fb(),note=(($('fpAdmNote_'+id)||{}).value||'').trim();try{await f.reqUpdate(id,{status,note});const x=A.list.find(r=>r.id===id);if(x){x.status=status;x.note=note}markSeen(id);renderAdmin();badge();toast('עודכן')}catch(e){toast(e.message,true)}};
window.fpAdmFlag=async function(id,uid){const key=(($('fpAdmFlag_'+id)||{}).value||'').trim();if(!key)return toast('כתוב שם לשדרוג',true);try{await fb().flagSet(uid,key,true);toast(`השדרוג "${key}" הופעל אצלו`)}catch(e){toast(e.message,true)}};
window.fpAdmDel=async function(id){if(!confirm('למחוק את הבקשה?'))return;try{await fb().reqDelete(id);A.list=A.list.filter(r=>r.id!==id);renderAdmin();badge()}catch(e){toast(e.message,true)}};

/* the red number: on "עוד" in the bottom bar and on the admin entry in Settings */
function badge(){
  if(!A.list)return;const n=A.list.filter(isNew).length;
  const b=$('fpAdmBadge');if(b)b.innerHTML=n?` <span class="fp-badge">${n}</span>`:'';
  const nav=document.querySelector('nav button[data-tab="more"]');
  if(nav){let x=nav.querySelector('.fp-badge');if(!n){if(x)x.remove()}else{if(!x){nav.insertAdjacentHTML('beforeend','<span class="fp-badge"></span>');x=nav.querySelector('.fp-badge')}x.textContent=n>99?'99+':String(n)}}
}
async function refreshBadge(){const f=fb();if(!f||!f.isAdmin||!f.isAdmin())return;try{A.list=await f.reqList(true);badge()}catch(_){}}
function injectAdmin(){
  try{const f=fb();if(!f||!f.isAdmin||!f.isAdmin()||$('fpAdmEntry'))return;const s=$('settings');if(!s)return;
    s.querySelector('h2').insertAdjacentHTML('afterend',`<button type="button" id="fpAdmEntry" class="btn secondary full" style="margin:0 0 10px" onclick="openRequestsAdmin()">📥 בקשות ממשתמשים<span id="fpAdmBadge"></span></button>`);
    injectTimeMachine();badge();
  }catch(_){}
}
const boot=setInterval(()=>{if(window.FP2&&window.FP2.isAdmin&&typeof state!=='undefined'&&state.data){clearInterval(boot);injectAdmin();refreshBadge();setInterval(refreshBadge,5*60000);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refreshBadge()})}},1500);
if(typeof renderSettings==='function'){const o=renderSettings;renderSettings=function(){const r=o.apply(this,arguments);injectAdmin();badge();return r}}

/* ---------- admin "time machine": pretend today is another day, to test day-to-day rules ---------- */
function injectTimeMachine(){
  const e=$('fpAdmEntry');if(!e||$('fpTM'))return;
  e.insertAdjacentHTML('afterend',`<details class="settings-section" id="fpTM"><summary>🕰 מכונת זמן (בדיקות, רק לך)</summary><div class="settings-body">
    <p class="muted">האפליקציה תתנהג כאילו היום הוא התאריך שתבחר: הודעות בוקר, אירועים, צ׳ק-אין ומה שעובר מיום ליום. <b>שים לב:</b> מה שתרשום בזמן הזה נשמר באמת, על התאריך הזה. אחרי הבדיקה אפשר למחוק את הימים מיומן התזונה.</p>
    <div class="row"><div class="field"><input id="fpTMDate" type="date"></div><button type="button" class="btn" onclick="fpTimeMachine(document.getElementById('fpTMDate').value)">הפעל</button></div>
    <div class="quick-grid"><button type="button" class="btn light" onclick="fpTimeShift(1)">יום קדימה ›</button><button type="button" class="btn secondary" onclick="fpTimeMachine('')">כבה, חזור להיום</button></div></div></details>`);
  try{$('fpTMDate').value=(state.data.settings&&state.data.settings.debug_today)||state.todayDate||''}catch(_){}
}
window.fpTimeMachine=async function(date){
  loading();
  try{await call('saveSettings',{debug_today:date||''});
    ['fp2.cutAsked','fp2.twoAsked'].forEach(k=>{try{localStorage.removeItem(k)}catch(_){}});
    state.data=await call('getBootstrapData');state.date=state.data.date;state.todayDate=state.data.date;renderAll();tmBanner();
    toast(date?'מכונת זמן: היום = '+displayDate(date):'חזרת להיום האמיתי');
    setTimeout(()=>{try{window.fpMorningChecks&&window.fpMorningChecks()}catch(_){}},600);
  }catch(e){toast(e.message,true)}finally{loading(false)}
};
window.fpTimeShift=function(n){const cur=(state.data.settings&&state.data.settings.debug_today)||state.todayDate;const d=new Date(cur+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);fpTimeMachine(d.toISOString().slice(0,10))};
function tmBanner(){
  const on=state.data&&state.data.settings&&/^\d{4}-\d{2}-\d{2}$/.test(String(state.data.settings.debug_today||''));
  let b=$('fpTMBanner');
  if(!on){if(b)b.remove();return}
  if(!b){document.body.insertAdjacentHTML('afterbegin','<div id="fpTMBanner" style="position:sticky;top:0;z-index:70;background:#E5484D;color:#fff;font-size:13px;padding:6px 10px;display:flex;justify-content:space-between;align-items:center;gap:8px"></div>');b=$('fpTMBanner')}
  b.innerHTML=`<span>🕰 מצב בדיקה: היום = ${esc(displayDate(state.data.settings.debug_today))}</span><span><button type="button" style="background:#fff;color:#000;border:0;border-radius:8px;padding:3px 8px;margin-left:6px" onclick="fpTimeShift(1)">יום קדימה</button><button type="button" style="background:#fff;color:#000;border:0;border-radius:8px;padding:3px 8px" onclick="fpTimeMachine('')">כבה</button></span>`;
}
if(typeof renderAll==='function'){const oRA=renderAll;renderAll=function(){const r=oRA.apply(this,arguments);try{tmBanner()}catch(_){}return r}}
const tmBoot=setInterval(()=>{if(typeof state!=='undefined'&&state.data&&state.data.settings){clearInterval(tmBoot);tmBanner()}},1000);

/* per-user upgrades: code checks window.fpFlag('name') */
window.fpFlag=k=>{try{return !!(window.FP2&&window.FP2.flag&&window.FP2.flag(k))}catch(_){return false}};
})();
