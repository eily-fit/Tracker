/* FitPro 2: Firebase sign-in, storage and sync. The app logic itself lives in fp2-core.js + server.js. */
import {initializeApp} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut,sendPasswordResetEmail} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';
import {initializeFirestore,persistentLocalCache,persistentMultipleTabManager,collection,doc,writeBatch,getDocs,getDocsFromCache,onSnapshot} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

const firebaseConfig={apiKey:"AIzaSyCNaUpS96A4wiZ_ahFWX1fr5omzjP9qm9M",authDomain:"fitpro-250c7.firebaseapp.com",projectId:"fitpro-250c7",storageBucket:"fitpro-250c7.firebasestorage.app",messagingSenderId:"753223506846",appId:"1:753223506846:web:59b211f5f9d206d729d48f"};
const app=initializeApp(firebaseConfig);
const auth=getAuth(app);
const db=initializeFirestore(app,{localCache:persistentLocalCache({tabManager:persistentMultipleTabManager()})});

let core=null,col=null,user=null,pendingCommits=[];
const $id=id=>document.getElementById(id);
const oldConf=()=>{try{const c=JSON.parse(localStorage.getItem('elaiApi')||'null');if(c&&c.url&&c.pass)return c}catch(_){}
  const p=core&&core.store&&core.store.props;return p&&p.OLD_URL&&p.OLD_PASS?{url:p.OLD_URL,pass:p.OLD_PASS}:null};
function rememberOld(url,pass){try{localStorage.setItem('elaiApi',JSON.stringify({url,pass}))}catch(_){}if(core&&core.store){core.store.props.OLD_URL=url;core.store.props.OLD_PASS=pass;core.store.propsDirty=true;core.flush()}}
/* The old server is reached with a normal POST first (works best inside installed iPhone/iPad apps),
   and only if that fails with the older script-tag method. */
async function postOld(fn,args){
  const c=oldConf(),ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),60000);let res;
  try{res=await fetch(c.url,{method:'POST',body:JSON.stringify({fn,args:args||[],token:c.pass}),redirect:'follow',signal:ctl.signal})}
  catch(e){throw new Error('NET:'+(e&&e.name==='AbortError'?'timeout':(e&&e.message||'fetch')))}finally{clearTimeout(timer)}
  const txt=await res.text();let j;try{j=JSON.parse(txt)}catch(_){throw new Error('NET:status '+res.status)}
  if(!j.ok)throw new Error(String(j.error||'שגיאה').replace(/^AUTH:\s*/,''));
  return j.result;
}
async function remote(fn,args){
  if(!oldConf())throw new Error('לפעולה הזו צריך חיבור לשרת הישן. חבר אותו בהגדרות');
  let first;
  for(let k=0;k<3;k++){
    try{return await postOld(fn,args)}catch(e){if(!/^NET:/.test(e.message))throw e;first=first||e.message.slice(4)}
    try{return await window.httpCall(fn,args||[])}catch(e){if(!/חיבור|timeout|זמן/i.test(e.message))throw e;if(k===2)throw new Error('אין חיבור לשרת הישן ('+first+')')}
    await new Promise(r=>setTimeout(r,1500*(k+1)));
  }
}

/* ---------- saving to Firebase ---------- */
let syncState={pending:0,error:''};
function syncNote(){const el=$id('fp2Sync');if(el)el.innerHTML=syncState.error?'⚠️ '+syncState.error:syncState.pending?'⏳ שומר בענן…':'✓ הכול שמור בענן';
  let bar=$id('fp2SyncErr');if(syncState.error){if(!bar){bar=document.createElement('div');bar.id='fp2SyncErr';bar.style.cssText='position:fixed;z-index:9000;left:10px;right:10px;top:calc(8px + env(safe-area-inset-top));background:#8f3434;color:#fff;padding:10px 12px;border-radius:12px;font:14px/1.4 -apple-system,sans-serif;direction:rtl;text-align:right';bar.onclick=()=>bar.remove();document.body.appendChild(bar)}bar.textContent='⚠️ השמירה לענן נכשלה: '+syncState.error+' (נוגע כדי לסגור)'}else if(bar)bar.remove()}
function persist(ch,wait,retried){
  if(!col)return Promise.resolve();
  const ops=[];
  ch.writes.forEach(w=>ops.push({bytes:(w.bytes||w.rows.length*2)+200,t:w.t,f:b=>b.set(doc(col,w.id),{t:w.t,n:w.n,size:w.size,rows:w.rows,u:Date.now()})}));
  ch.deletes.forEach(id=>ops.push({bytes:100,f:b=>b.delete(doc(col,id))}));
  if(ch.props)ops.push({bytes:ch.props.length*2+200,f:b=>b.set(doc(col,'__props'),{t:'__props',rows:ch.props,u:Date.now()})});
  /* Firebase takes at most ~10 MB per request: group the writes into batches of up to 6 MB */
  const groups=[];let cur=[],size=0;ops.forEach(o=>{if(cur.length&&(cur.length>=400||size+o.bytes>6000000)){groups.push(cur);cur=[];size=0}cur.push(o);size+=o.bytes});if(cur.length)groups.push(cur);
  const commits=groups.map(g=>{const b=writeBatch(db);g.forEach(o=>o.f(b));syncState.pending++;syncNote();
    return b.commit().then(()=>{syncState.pending--;syncState.error='';syncNote()},e=>{syncState.pending--;
      console.error('sync',e);syncState.error=(e&&e.code==='permission-denied')?'אין הרשאה. בדוק את חוקי האבטחה ב-Firebase':((e&&e.message)||'שגיאה');syncNote();
      /* too large or rejected: rewrite those tables in smaller pieces, once */
      if(!retried&&core){const names=new Set(g.map(o=>o.t).filter(Boolean));names.forEach(n=>{const t=core.store.table(n);if(t){t.size=Math.max(1,Math.floor(t.size/3));core.store.markAll(t)}});
        const again=core.store.takeChanges();return persist(again,true,true)}
      throw e})});
  const all=Promise.all(commits);
  /* The phone copy is updated at once; the upload to the cloud finishes in the background (also after being offline). */
  all.catch(()=>{});
  if(wait)return all;
  pendingCommits.push(all);all.finally(()=>{pendingCommits=pendingCommits.filter(x=>x!==all)});
  return Promise.resolve();
}

/* ---------- screens: sign-in and first import ---------- */
const CSS=`.fp2-ov{position:fixed;inset:0;z-index:10000;background:#0E1217;display:flex;align-items:flex-start;justify-content:center;padding:calc(40px + env(safe-area-inset-top)) 18px 20px;overflow:auto;direction:rtl;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif}
.fp2-box{width:100%;max-width:420px;background:#171C22;color:#F2F5F7;border-radius:20px;padding:22px;box-shadow:none}
.fp2-box h1{margin:0 0 4px;font-size:28px;color:#D7F36B}.fp2-box p{color:#A3ADB8;line-height:1.55;margin:6px 0 14px}
.fp2-box input{width:100%;box-sizing:border-box;font-size:17px;padding:13px 14px;border:1px solid #2C3640;border-radius:12px;margin:6px 0;direction:ltr;text-align:left;background:#1F262E;color:#F2F5F7}
.fp2-btn{display:block;width:100%;border:0;border-radius:14px;padding:14px;font-size:17px;font-weight:700;margin-top:10px;background:#D7F36B;color:#1A2205}.fp2-btn.light{background:#26301A;color:#D7F36B}.fp2-link{background:none;border:0;color:#D7F36B;font-size:15px;margin-top:12px;padding:6px}
.fp2-msg{min-height:22px;color:#F09595;font-size:15px;margin-top:8px}.fp2-bar{height:10px;background:#2C3640;border-radius:6px;overflow:hidden;margin:14px 0 6px}.fp2-bar i{display:block;height:100%;background:#D7F36B;width:0;transition:width .3s}`;
function overlay(html){
  if(!$id('fp2css')){const s=document.createElement('style');s.id='fp2css';s.textContent=CSS;document.head.appendChild(s)}
  let o=$id('fp2ov');if(!o){o=document.createElement('div');o.id='fp2ov';o.className='fp2-ov';document.body.appendChild(o)}
  o.innerHTML='<div class="fp2-box">'+html+'</div>';window.__booted=true;
  const b=document.getElementById('bootSlow');if(b)b.remove();
  return o;
}
const AUTH_ERRORS={'auth/invalid-credential':'האימייל או הסיסמה לא נכונים','auth/wrong-password':'הסיסמה לא נכונה','auth/user-not-found':'אין משתמש עם האימייל הזה','auth/email-already-in-use':'כבר יש משתמש עם האימייל הזה. נסה להיכנס','auth/weak-password':'הסיסמה צריכה להיות לפחות 6 תווים','auth/invalid-email':'האימייל לא תקין','auth/network-request-failed':'אין חיבור לאינטרנט','auth/too-many-requests':'יותר מדי ניסיונות. חכה כמה דקות'};
const authErr=e=>AUTH_ERRORS[e&&e.code]||('שגיאה: '+(e&&e.message||e));
function showAuth(mode){
  const reg=mode==='register';
  overlay(`<h1>FitPro</h1><p>${reg?'פתיחת משתמש חדש. השתמש באימייל אמיתי, כדי שתוכל לשחזר סיסמה.':'כניסה לחשבון שלך.'}</p>
    <input id="fp2Email" type="email" autocomplete="username" placeholder="אימייל" inputmode="email">
    <input id="fp2Pass" type="password" autocomplete="${reg?'new-password':'current-password'}" placeholder="סיסמה (לפחות 6 תווים)">
    <button class="fp2-btn" id="fp2Go">${reg?'פתח משתמש':'כניסה'}</button>
    <button class="fp2-btn light" id="fp2Switch">${reg?'כבר יש לי משתמש':'משתמש חדש'}</button>
    ${reg?'':'<button class="fp2-link" id="fp2Forgot">שכחתי סיסמה</button>'}<div class="fp2-msg" id="fp2Msg"></div>`);
  $id('fp2Switch').onclick=()=>showAuth(reg?'login':'register');
  $id('fp2Go').onclick=async()=>{const e=$id('fp2Email').value.trim(),p=$id('fp2Pass').value;$id('fp2Msg').textContent='רגע…';
    try{reg?await createUserWithEmailAndPassword(auth,e,p):await signInWithEmailAndPassword(auth,e,p)}catch(err){$id('fp2Msg').textContent=authErr(err)}};
  if(!reg)$id('fp2Forgot').onclick=async()=>{const e=$id('fp2Email').value.trim();if(!e)return $id('fp2Msg').textContent='כתוב קודם את האימייל';
    try{await sendPasswordResetEmail(auth,e);$id('fp2Msg').style.color='#5DCAA5';$id('fp2Msg').textContent='נשלח מייל לאיפוס סיסמה'}catch(err){$id('fp2Msg').textContent=authErr(err)}};
}
function showImport(){
  const c=oldConf();
  overlay(`<h1>ברוך הבא 👋</h1><p>זו הכניסה הראשונה לחשבון הזה. להעביר את כל הנתונים מהאפליקציה הישנה? ארוחות, אימונים, משקלים, תוכניות, אירועים ודופק. זה לוקח בערך דקה, פעם אחת.</p>
    ${c?'<p style="color:#5DCAA5">✓ השרת הישן מחובר בטלפון הזה</p>':`<input id="fp2Url" placeholder="כתובת השרת הישן (מסתיימת ב-/exec)"><input id="fp2Code" type="password" placeholder="הקוד האישי מהאפליקציה הישנה">`}
    <button class="fp2-btn" id="fp2Imp">העבר את הנתונים שלי</button><button class="fp2-btn light" id="fp2Fresh">התחל מאפס</button>
    <div class="fp2-bar"><i id="fp2Prog"></i></div><div id="fp2Step" style="color:#5f6b68;font-size:15px"></div><div class="fp2-msg" id="fp2Msg"></div>`);
  $id('fp2Imp').onclick=async()=>{
    if(!c){const url=$id('fp2Url').value.trim(),pass=$id('fp2Code').value;if(!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(url)||!pass)return $id('fp2Msg').textContent='כתוב את הכתובת והקוד';localStorage.setItem('elaiApi',JSON.stringify({url,pass}))}
    $id('fp2Imp').disabled=$id('fp2Fresh').disabled=true;$id('fp2Msg').textContent='';
    const say=(t,p)=>{$id('fp2Step').textContent=t;$id('fp2Prog').style.width=p+'%'};
    try{core=newCore();const cc=oldConf();await core.importFromOld(say);if(cc){core.store.props.OLD_URL=cc.url;core.store.props.OLD_PASS=cc.pass;core.store.propsDirty=true}await Promise.all(pendingCommits);say('מסיים…',98);await flushAll(true);say('הכול הועבר ✓',100);setTimeout(()=>location.reload(),600)}
    catch(e){$id('fp2Msg').textContent='ההעברה נכשלה: '+e.message+'. אפשר לנסות שוב.';$id('fp2Imp').disabled=$id('fp2Fresh').disabled=false}
  };
  $id('fp2Fresh').onclick=async()=>{core=newCore();core.start();await flushAll(true);location.reload()};
}
function newCore(){return new window.FP2Core.Core({user:{uid:user.uid,email:user.email},remote,onChanges:ch=>persist(ch)})}
async function flushAll(wait){const ch=core.store.takeChanges();await persist(ch,wait);if(wait)await Promise.all(pendingCommits)}

/* ---------- live sync from other devices ---------- */
let refreshTimer=null;
function scheduleRefresh(){clearTimeout(refreshTimer);refreshTimer=setTimeout(async()=>{
  try{if(typeof state==='undefined'||!state.data)return;const fresh=await core.call('getBootstrapData',[]);const viewing=state.date;
    state.data=fresh;state.todayDate=fresh.date;
    if(viewing&&viewing!==fresh.date){state.date=viewing;const d=await core.call('getDayView',[viewing]);if(window.applyDay)applyDay(d)}else state.date=fresh.date;
    if(window.renderAll)renderAll()}catch(e){console.error(e)}},700)}
function listen(){
  let first=true;
  onSnapshot(col,s=>{
    if(first){first=false;return}
    let changed=false;
    s.docChanges().forEach(c=>{if(c.doc.metadata.hasPendingWrites)return;const d=c.doc.data();
      if(c.type==='removed')core.store.removeChunk(c.doc.id);
      else if(d.t==='__props'){try{core.store.props=JSON.parse(d.rows||'{}')}catch(_){}}
      else core.store.applyChunk(d);changed=true});
    if(changed)scheduleRefresh();
  },e=>console.error('listen',e));
}

/* ---------- after the app is on screen ---------- */
let lastHealth=0;
function pullHealth(){if(!oldConf()||Date.now()-lastHealth<10*60*1000)return;lastHealth=Date.now();
  core.pullHealth().then(ch=>{if(ch)scheduleRefresh()}).catch(e=>console.warn('health',e))}
function accountCard(){
  const view=$id('settings');if(!view||$id('fp2Account'))return;
  const card=document.createElement('details');card.className='settings-section';card.id='fp2Account';card.open=false;
  card.innerHTML=`<summary>👤 חשבון וענן</summary><div class="settings-body"><p class="muted">מחובר בתור <b dir="ltr">${(user.email||'').replace(/[<>&"]/g,'')}</b>. הנתונים נשמרים בטלפון ומסתנכרנים ל-Firebase.</p>
    <p class="muted" id="fp2Sync"></p>
    <p class="muted">השרת הישן (ל-AI, לתמונות ולשעון): <b>${oldConf()?'✓ מחובר':'לא מחובר'}</b></p>
    ${oldConf()?'':`<div class="field"><input id="fp2OldUrl" placeholder="כתובת השרת הישן (מסתיימת ב-/exec)" dir="ltr"></div><div class="field"><input id="fp2OldCode" type="password" placeholder="הקוד האישי מהאפליקציה הישנה" dir="ltr"></div><button class="btn full" id="fp2Connect">חבר</button>`}
    <button class="btn secondary full" style="margin-top:10px" id="fp2Repair">🔄 השלם נתונים מהאפליקציה הישנה</button>
    <p class="muted" id="fp2RepairMsg">מוסיף מהאפליקציה הישנה כל מה שחסר כאן: ארוחות, מזונות, אימונים, משקלים ועוד. מה שרשמת באפליקציה החדשה נשאר.</p>
    <button class="btn light full" id="fp2Out">התנתק</button></div>`;
  const h=view.querySelector('h2');(h||view.firstChild).insertAdjacentElement(h?'afterend':'beforebegin',card);
  syncNote();
  const cn=$id('fp2Connect');if(cn)cn.onclick=()=>{const u=$id('fp2OldUrl').value.trim(),p=$id('fp2OldCode').value;if(!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(u)||!p)return toast('כתוב כתובת וקוד',true);rememberOld(u,p);toast('השרת הישן חובר ✓');const c=$id('fp2Account');if(c)c.remove();accountCard();const d=$id('fp2Account');if(d)d.open=true};
  $id('fp2Repair').onclick=async()=>{if(!oldConf())return toast('חבר קודם את השרת הישן',true);const b=$id('fp2Repair'),m=$id('fp2RepairMsg');b.disabled=true;
    try{const n=await core.repairFromOld((t,p)=>{m.textContent=t+' · '+p+'%'});await flushAll(true);m.textContent='✓ הושלם. נוספו '+n+' שורות שהיו חסרות.';scheduleRefresh()}
    catch(e){m.textContent='לא הצליח: '+e.message}finally{b.disabled=false}};
  $id('fp2Out').onclick=async()=>{if(!confirm('להתנתק? הנתונים שמורים בענן ויחזרו בכניסה הבאה.'))return;await Promise.all(pendingCommits).catch(()=>{});await signOut(auth);location.reload()};
}
window.FP2={
  call:(fn,args)=>{if(!core)return Promise.reject(new Error('האפליקציה עוד נטענת'));return core.call(fn,args)},
  afterBoot(){accountCard();pullHealth();document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')pullHealth()})}
};

onAuthStateChanged(auth,async u=>{
  if(!u){user=null;showAuth('login');return}
  if(user&&user.uid===u.uid)return;
  user=u;col=collection(db,'users',u.uid,'chunks');
  let snap=null;
  try{snap=await getDocsFromCache(col)}catch(_){}
  if(!snap||snap.empty){
    try{snap=await getDocs(col)}catch(e){overlay('<h1>FitPro</h1><p>בכניסה הראשונה צריך אינטרנט כדי להוריד את הנתונים. התחבר לרשת ונסה שוב.</p><button class="fp2-btn" onclick="location.reload()">נסה שוב</button>');return}
  }
  const docs=snap.docs.map(d=>d.data());
  if(!docs.length){showImport();return}
  core=newCore();core.load(docs);core.start();
  const ov=$id('fp2ov');if(ov)ov.remove();
  listen();
  window.__fp2Ready();
});
