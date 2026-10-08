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
const A={list:null,filter:'open'};
window.openRequestsAdmin=async function(){A.list=null;renderAdmin();const f=fb();try{A.list=await f.reqList(true)}catch(e){A.list=[];toast(e.message,true)}renderAdmin();badge()};
window.fpAdmClose=()=>{const e=$('fpAdm');if(e)e.remove()};
window.fpAdmFilter=v=>{A.filter=v;renderAdmin()};
function renderAdmin(){
  const chip=(on,l,js)=>`<button type="button" class="chip${on?' active':''}" onclick="${js}">${l}</button>`;
  const list=(A.list||[]).filter(x=>A.filter==='all'||(A.filter==='open'?['new','progress'].includes(x.status||'new'):x.status===A.filter));
  sheet('fpAdm',`<div class="sheet-head"><h3>📥 בקשות ממשתמשים</h3><button class="trash" onclick="fpAdmClose()" aria-label="סגור">✕</button></div>
    <div class="meal-tabs" style="flex-wrap:wrap">${chip(A.filter==='open','פתוחות',"fpAdmFilter('open')")}${chip(A.filter==='done','בוצעו',"fpAdmFilter('done')")}${chip(A.filter==='declined','נדחו',"fpAdmFilter('declined')")}${chip(A.filter==='all','הכול',"fpAdmFilter('all')")}</div>
    ${A.list===null?'<p class="muted">טוען…</p>':!list.length?'<p class="muted">אין בקשות כאן.</p>':list.map(x=>{const s=STATUS[x.status]||STATUS.new;return `<div class="card" style="margin:8px 0;padding:10px 12px">
      <div style="display:flex;justify-content:space-between;gap:8px"><b>${s[0]} ${esc(x.name||x.email||'משתמש')}</b><span class="muted" style="font-size:12px">${when(x.ts)} · ${SCOPE[x.scope]||''}</span></div>
      ${x.text?`<p style="margin:6px 0">${esc(x.text)}</p>`:''}${x.audio?`<audio controls src="data:${esc(x.audioType||'audio/mp4')};base64,${x.audio}" style="width:100%;height:36px"></audio>`:''}
      <input id="fpAdmNote_${x.id}" placeholder="תשובה למשתמש (לא חובה)" value="${esc(x.note||'')}" style="width:100%;box-sizing:border-box;margin-top:6px">
      <div class="meal-tabs" style="flex-wrap:wrap;margin-top:6px">${['progress','done','declined'].map(k=>chip(x.status===k,STATUS[k][0]+' '+STATUS[k][1],`fpAdmSet('${x.id}','${k}')`)).join('')}</div>
      ${x.scope==='me'?`<div style="display:flex;gap:6px;margin-top:6px"><input id="fpAdmFlag_${x.id}" placeholder="שם השדרוג להפעלה אצלו" style="flex:1"><button type="button" class="btn light mini" onclick="fpAdmFlag('${x.id}','${esc(x.uid)}')">הפעל אצלו</button></div>`:''}
      <button type="button" class="linkish muted" style="font-size:12.5px;margin-top:4px" onclick="fpAdmDel('${x.id}')">🗑 מחק</button></div>`}).join('')}`);
}
window.fpAdmSet=async function(id,status){const f=fb(),note=(($('fpAdmNote_'+id)||{}).value||'').trim();try{await f.reqUpdate(id,{status,note});const x=A.list.find(r=>r.id===id);if(x){x.status=status;x.note=note}renderAdmin();badge();toast('עודכן')}catch(e){toast(e.message,true)}};
window.fpAdmFlag=async function(id,uid){const key=(($('fpAdmFlag_'+id)||{}).value||'').trim();if(!key)return toast('כתוב שם לשדרוג',true);try{await fb().flagSet(uid,key,true);toast(`השדרוג "${key}" הופעל אצלו`)}catch(e){toast(e.message,true)}};
window.fpAdmDel=async function(id){if(!confirm('למחוק את הבקשה?'))return;try{await fb().reqDelete(id);A.list=A.list.filter(r=>r.id!==id);renderAdmin();badge()}catch(e){toast(e.message,true)}};

/* settings: the admin's entry, with the number of open requests */
function badge(){const b=$('fpAdmBadge');if(!b||!A.list)return;const n=A.list.filter(x=>(x.status||'new')==='new').length;b.textContent=n?` (${n} חדשות)`:''}
function injectAdmin(){
  try{const f=fb();if(!f||!f.isAdmin||!f.isAdmin()||$('fpAdmEntry'))return;const s=$('settings');if(!s)return;
    s.querySelector('h2').insertAdjacentHTML('afterend',`<button type="button" id="fpAdmEntry" class="btn secondary full" style="margin:0 0 10px" onclick="openRequestsAdmin()">📥 בקשות ממשתמשים<span id="fpAdmBadge"></span></button>`);
    f.reqList(true).then(l=>{A.list=l;badge()}).catch(()=>{});
  }catch(_){}
}
const boot=setInterval(()=>{if(window.FP2&&window.FP2.isAdmin&&typeof state!=='undefined'&&state.data){clearInterval(boot);injectAdmin()}},1500);
if(typeof renderSettings==='function'){const o=renderSettings;renderSettings=function(){const r=o.apply(this,arguments);injectAdmin();return r}}

/* per-user upgrades: code checks window.fpFlag('name') */
window.fpFlag=k=>{try{return !!(window.FP2&&window.FP2.flag&&window.FP2.flag(k))}catch(_){return false}};
})();
