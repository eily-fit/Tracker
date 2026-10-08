/* FitPro 2: Firebase sign-in, storage and sync. The app logic itself lives in fp2-core.js + server.js. */
import {initializeApp} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
import {getAuth,onAuthStateChanged,signInWithEmailAndPassword,createUserWithEmailAndPassword,signOut,sendPasswordResetEmail} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';
import {initializeFirestore,persistentLocalCache,persistentMultipleTabManager,collection,doc,writeBatch,getDocs,getDocsFromCache,onSnapshot,setDoc,deleteDoc,getDoc} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';

const firebaseConfig={apiKey:"AIzaSyCNaUpS96A4wiZ_ahFWX1fr5omzjP9qm9M",authDomain:"fitpro-250c7.firebaseapp.com",projectId:"fitpro-250c7",storageBucket:"fitpro-250c7.firebasestorage.app",messagingSenderId:"753223506846",appId:"1:753223506846:web:59b211f5f9d206d729d48f"};
const app=initializeApp(firebaseConfig);
const auth=getAuth(app);
const db=initializeFirestore(app,{localCache:persistentLocalCache({tabManager:persistentMultipleTabManager()})});

let core=null,col=null,user=null,pendingCommits=[];
const ADMIN_EMAILS=['eilybshimon@gmail.com'];
const $id=id=>document.getElementById(id);
const oldConf=()=>{
  const p=core&&core.store&&core.store.props;
  if(p&&p.OLD_URL&&p.OLD_PASS)return {url:p.OLD_URL,pass:p.OLD_PASS};
  /* the device-wide copy (kept on the device for the admin) belongs to whoever connected the old server (the admin); other accounts must never inherit it */
  if(user&&ADMIN_EMAILS.indexOf(String(user.email||'').toLowerCase())>-1){try{const c=JSON.parse(localStorage.getItem('elaiApi')||'null');if(c&&c.url&&c.pass)return c}catch(_){}}
  return null};
const wipeDeviceData=()=>{['elaiStateCache','elaiWorkoutSession','elaiActiveWorkoutPlan','elaiPlanTiming','elaiEquipment','elaiRestEnd','elaiRestSec','elaiRestOff','elaiOutbox','fp_last_ci'].forEach(k=>{try{localStorage.removeItem(k)}catch(_){}});try{Object.keys(localStorage).filter(k=>/^(tz|TZ|fp2Tour)/.test(k)).forEach(k=>localStorage.removeItem(k))}catch(_){}};
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
const AUTH_ERRORS={'auth/user-disabled':'החשבון הזה נחסם. פנה למנהל','auth/invalid-credential':'האימייל או הסיסמה לא נכונים','auth/wrong-password':'הסיסמה לא נכונה','auth/user-not-found':'אין משתמש עם האימייל הזה','auth/email-already-in-use':'כבר יש משתמש עם האימייל הזה. נסה להיכנס','auth/weak-password':'הסיסמה צריכה להיות לפחות 6 תווים','auth/invalid-email':'האימייל לא תקין','auth/network-request-failed':'אין חיבור לאינטרנט','auth/too-many-requests':'יותר מדי ניסיונות. חכה כמה דקות'};
const authErr=e=>AUTH_ERRORS[e&&e.code]||('שגיאה: '+(e&&e.message||e));
function showAuth(mode){
  const reg=mode==='register';
  overlay(`<h1>FitPro</h1><p>${reg?'משתמש חדש. תשתמש באימייל אמיתי, כדי שתוכל לשחזר סיסמה אם תשכח.':'כניסה לחשבון שלך.'}</p>
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
  overlay(`<h1>ברוך הבא 👋</h1><p>פעם ראשונה פה? כמה שאלות קצרות, סיור קצר, ומתחילים.</p>
    <button class="fp2-btn" id="fp2Fresh">בוא נתחיל</button>
    <details style="margin-top:18px;text-align:right"><summary style="color:#8a9690;font-size:14px;cursor:pointer">יש לי נתונים באפליקציה הישנה</summary>
    <div style="margin-top:10px">${c?'<p style="color:#5DCAA5">✓ השרת הישן מחובר בטלפון הזה</p>':`<input id="fp2Url" placeholder="כתובת השרת הישן (מסתיימת ב-/exec)"><input id="fp2Code" type="password" placeholder="הקוד האישי מהאפליקציה הישנה">`}
    <button class="fp2-btn light" id="fp2Imp">העבר את הנתונים שלי</button></div></details>
    <div class="fp2-bar"><i id="fp2Prog"></i></div><div id="fp2Step" style="color:#5f6b68;font-size:15px"></div><div class="fp2-msg" id="fp2Msg"></div>`);
  $id('fp2Imp').onclick=async()=>{
    if(!c){const url=$id('fp2Url').value.trim(),pass=$id('fp2Code').value;if(!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(url)||!pass)return $id('fp2Msg').textContent='כתוב את הכתובת והקוד';localStorage.setItem('elaiApi',JSON.stringify({url,pass}))}
    $id('fp2Imp').disabled=$id('fp2Fresh').disabled=true;$id('fp2Msg').textContent='';
    const say=(t,p)=>{$id('fp2Step').textContent=t;$id('fp2Prog').style.width=p+'%'};
    try{core=newCore();const cc=oldConf();await core.importFromOld(say);if(cc){core.store.props.OLD_URL=cc.url;core.store.props.OLD_PASS=cc.pass;core.store.propsDirty=true}await Promise.all(pendingCommits);say('מסיים…',98);await flushAll(true);say('הכול הועבר ✓',100);setTimeout(()=>location.reload(),600)}
    catch(e){$id('fp2Msg').textContent='ההעברה נכשלה: '+e.message+'. אפשר לנסות שוב.';$id('fp2Imp').disabled=$id('fp2Fresh').disabled=false}
  };
  /* brand-new account: NEW_ACCOUNT makes the app run name -> questionnaire -> tour on first open */
  $id('fp2Fresh').onclick=async()=>{core=newCore();core.start();core.store.props.NEW_ACCOUNT='1';core.store.propsDirty=true;await flushAll(true);location.reload()};
}
function newCore(){return new window.FP2Core.Core({user:{uid:user.uid,email:user.email},remote,onChanges:ch=>persist(ch)})}
async function flushAll(wait){const ch=core.store.takeChanges();await persist(ch,wait);if(wait)await Promise.all(pendingCommits)}

/* ---------- live sync from other devices ---------- */
let refreshTimer=null;
function scheduleRefresh(){clearTimeout(refreshTimer);refreshTimer=setTimeout(async()=>{
  try{if(typeof state==='undefined'||!state.data)return;const fresh=await core.call('getBootstrapData',[]);const viewing=state.date;
    state.data=fresh;state.todayDate=fresh.date;
    if(viewing&&viewing!==fresh.date){state.date=viewing;const d=await core.call('getDayView',[viewing]);if(window.applyDay)applyDay(d)}else state.date=fresh.date;
    if(window.renderAll)renderAll();queueNotificationSync()}catch(e){console.error(e)}},700)}
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
function pullHealth(){if(!oldConf()||Date.now()-lastHealth<30*1000)return;lastHealth=Date.now();
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
  $id('fp2Out').onclick=async()=>{if(!confirm('להתנתק? הנתונים שמורים בענן ויחזרו בכניסה הבאה.'))return;await Promise.all(pendingCommits).catch(()=>{});if(localStorage.getItem(pushKey())==='on'){try{await disablePush()}catch(e){if(!confirm('אין חיבור לשירות ההתראות, ולכן ההתראות של החשבון עלולות להמשיך להגיע למכשיר הזה. להתנתק בכל זאת?'))return;try{localStorage.removeItem(pushKey())}catch(_){}}}await signOut(auth);wipeDeviceData();location.reload()};
}
/* Push goes through a free Google Apps Script web app (backend/apps-script/Push.gs), signed in with the user's Firebase login.
   No server keys live in the app. After deploying Push.gs, paste its web-app URL (ends with /exec) between the quotes. */
const PUSH_URL='https://script.google.com/macros/s/AKfycbzNHWZsYOt9sWVWdadY3Kp3mnE5ku3W2sDdeewolJibZF1DLb090hxF2JAxCFf6Bh0b/exec';
let pushSDK=null,pushConfig=null,notifyTimer=null,notifyLast='';
const pushDevice=()=>{let id=localStorage.getItem('fp2PushDevice');if(!id){id=crypto.randomUUID();localStorage.setItem('fp2PushDevice',id)}return id};
const pushKey=()=>`fp2PushEnabled:${user?.uid||''}`;
const pushUrl=()=>{let u=PUSH_URL;if(!u){try{u=localStorage.getItem('fp2PushUrl')||''}catch(_){}}return /^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(u)?u:''};
async function notificationAPI(name,data){
  const url=pushUrl();if(!url)throw new Error('push-not-configured');
  if(!auth.currentUser)throw new Error('התחבר קודם לחשבון');
  const idToken=await auth.currentUser.getIdToken();
  /* plain text body = a simple request, no CORS preflight (same way as the old server) */
  const body=JSON.stringify(Object.assign({},data||{},{push:name,idToken}));
  /* Apps Script sometimes drops the first request (cold start / redirect): retry a network failure up to 2 more times. */
  let res,lastErr;
  for(let i=0;i<3&&!res;i++){
    try{res=await fetch(url,{method:'POST',redirect:'follow',body})}catch(e){lastErr=e;if(i<2)await new Promise(r=>setTimeout(r,900*(i+1)))}
  }
  if(!res)throw new Error('אין חיבור לשירות ההתראות ('+String(lastErr&&lastErr.message||lastErr)+'). נסה שוב בעוד רגע');
  let j;try{j=await res.json()}catch(_){throw new Error('שירות ההתראות לא ענה')}
  if(!j.ok)throw new Error(j.error==='AUTH'?'ההתחברות פגה. התחבר מחדש':String(j.error||'שגיאה'));
  return j.result;
}
async function messagingSDK(){if(!pushSDK)pushSDK=await import('https://www.gstatic.com/firebasejs/11.0.2/firebase-messaging.js');return pushSDK}
function queueNotificationSync(){clearTimeout(notifyTimer);notifyTimer=setTimeout(async()=>{if(!core||!user||!pushUrl())return;try{const fresh=await core.call('getBootstrapData',[]);const events=(fresh.bank?.events||[]).map(e=>({id:e.id,date:e.date,label:e.label}));const data={events,inApp:fresh.settings?.notifications_in_app!=='off'};const sig=JSON.stringify(data);if(sig===notifyLast)return;await notificationAPI('syncNotificationEvents',data);notifyLast=sig}catch(e){console.warn('Notification server is not available yet',e.message)}},1500)}
async function enablePush(){
  if(!user)throw new Error('התחבר קודם לחשבון');
  const ios=/iPhone|iPad|iPod/.test(navigator.userAgent)||navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1;
  if(ios&&!navigator.standalone&&!matchMedia('(display-mode: standalone)').matches)throw new Error('באייפון צריך להוסיף את FitPro למסך הבית ולפתוח משם');
  if(!('Notification' in window)||!('serviceWorker' in navigator)||!('PushManager' in window))throw new Error('המכשיר או הדפדפן הזה אינו תומך בהתראות לטלפון');
  // Request synchronously within the user's tap, before any network await (iOS requirement).
  const permission=await Notification.requestPermission();if(permission!=='granted')throw new Error('לא אושרה הרשאה להתראות. ניתן לשנות בהגדרות הטלפון');
  try{pushConfig=await notificationAPI('getNotificationConfig')}catch(e){throw new Error(e.message==='AUTH'||/התחבר/.test(e.message)?e.message:'שירות ההתראות לא הופעל ('+(e.message==='push-not-configured'?'חסרה כתובת בקוד':String(e.message||e).slice(0,120))+')')}
  const sdk=await messagingSDK();if(!await sdk.isSupported())throw new Error('הדפדפן הזה אינו תומך בחיבור התראות');
  const reg=await navigator.serviceWorker.register('sw.js');await navigator.serviceWorker.ready;
  const token=await sdk.getToken(sdk.getMessaging(app),{vapidKey:pushConfig.vapidKey,serviceWorkerRegistration:reg});if(!token)throw new Error('לא התקבלה הרשמה להתראות. נסה שוב');
  await notificationAPI('registerNotificationDevice',{deviceId:pushDevice(),token});localStorage.setItem(pushKey(),'on');queueNotificationSync();
}
async function refreshPushRegistration(){if(!user||localStorage.getItem(pushKey())!=='on'||typeof Notification==='undefined'||Notification.permission!=='granted')return;try{const cfg=await notificationAPI('getNotificationConfig'),sdk=await messagingSDK();if(!await sdk.isSupported())return;const reg=await navigator.serviceWorker.ready,token=await sdk.getToken(sdk.getMessaging(app),{vapidKey:cfg.vapidKey,serviceWorkerRegistration:reg});if(token)await notificationAPI('registerNotificationDevice',{deviceId:pushDevice(),token})}catch(e){console.warn('Push registration refresh failed',e.code||e.message)}}
async function sendTestPush(){await notificationAPI('sendTestNotification')}
async function disablePush(){if(!user)return;await notificationAPI('unregisterNotificationDevice',{deviceId:pushDevice()});localStorage.removeItem(pushKey());try{const sdk=await messagingSDK();await sdk.deleteToken(sdk.getMessaging(app))}catch(_){} }


/* ---- progress photos: private to the signed-in account (this device + a best-effort Firestore mirror) ---- */
const PHOTO_FNS=new Set(['saveProgressPhoto','getProgressPhotos','getProgressPhoto','deleteProgressPhoto']);
const idb=()=>new Promise((res,rej)=>{const r=indexedDB.open('fp2photos',1);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains('p')){const st=d.createObjectStore('p',{keyPath:'id'});st.createIndex('uid','uid')}};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
const idbDo=async(mode,fn)=>{const d=await idb();return new Promise((res,rej)=>{const t=d.transaction('p',mode),st=t.objectStore('p');let out;try{out=fn(st)}catch(e){return rej(e)}t.oncomplete=()=>res(out&&out.result!==undefined?out.result:out);t.onerror=()=>rej(t.error)})};
const photoCol=()=>collection(db,'users',user.uid,'photos');
async function photosLocal(){const all=await idbDo('readonly',st=>st.index('uid').getAll(user.uid));return all||[]}
async function photosSync(){
  let list=await photosLocal();
  if(!list.length&&navigator.onLine!==false){try{const snap=await getDocs(photoCol());for(const d of snap.docs){const x=d.data();if(x&&x.id)await idbDo('readwrite',st=>st.put(Object.assign({uid:user.uid},x)))}list=await photosLocal()}catch(_){}}
  return list}
async function photoCall(fn,args){
  const admin=window.FP2.isAdmin(),a=args||[];
  if(fn==='saveProgressPhoto'){
    const p=a[0]||{},id=(crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random().toString(16).slice(2));
    const pose=['front','right','left','back'].includes(p.pose)?p.pose:'front';
    if(!/^\d{4}-\d{2}-\d{2}$/.test(String(p.date||'')))throw new Error('תאריך לא תקין');
    const img=String(p.image||'');if(!/^[A-Za-z0-9+/=]+$/.test(img)||img.length<200||img.length>900000)throw new Error('התמונה לא תקינה או גדולה מדי');
    const rec={id,uid:user.uid,date:p.date,pose,image:img,thumb:String(p.thumb||''),weight:'',note:String(p.note||'').slice(0,200),created:Date.now()};
    await idbDo('readwrite',st=>st.put(rec));
    try{await setDoc(doc(photoCol(),id),{id,date:rec.date,pose,image:rec.image,thumb:rec.thumb,weight:'',note:rec.note,created:rec.created})}catch(e){console.warn('photo mirror',e&&e.code)}
    return {id,date:rec.date,pose};
  }
  if(fn==='getProgressPhotos'){
    let list=(await photosSync()).map(x=>({id:x.id,date:x.date,pose:x.pose,weight:x.weight===undefined?'':x.weight,note:x.note||'',thumb:x.thumb||''}));
    if(admin&&oldConf()){try{const old=await core.call('getProgressPhotos',[]);list=list.concat((old||[]).map(x=>Object.assign({},x,{old:true})))}catch(_){}}
    return list.sort((x,y)=>String(y.date).localeCompare(String(x.date))||0).slice(0,80)}
  if(fn==='getProgressPhoto'){
    const id=String(a[0]||''),x=(await photosLocal()).find(v=>v.id===id);
    if(x)return {id:x.id,date:x.date,pose:x.pose,weight:x.weight===undefined?'':x.weight,image:x.image};
    if(admin&&oldConf())return core.call('getProgressPhoto',a);
    throw new Error('התמונה לא נמצאה')}
  if(fn==='deleteProgressPhoto'){
    const id=String(a[0]||''),x=(await photosLocal()).find(v=>v.id===id);
    if(x){await idbDo('readwrite',st=>st.delete(id));try{await deleteDoc(doc(photoCol(),id))}catch(_){}return true}
    if(admin&&oldConf())return core.call('deleteProgressPhoto',a);
    throw new Error('התמונה לא נמצאה')}
}


/* ===== shared food DB (2.6.5) ===== */
const BC=/^\d{8,14}$/;
let sharedList=null;
try{sharedList=JSON.parse(localStorage.getItem('fp2Shared')||'null')}catch(_){}
const sharedNorm=(id,d)=>({name:String(d.name||''),brand:String(d.brand||''),baseQty:Number(d.baseQty)||100,unit:String(d.unit||'גרם'),calories:Number(d.calories)||0,protein:Number(d.protein)||0,carbs:Number(d.carbs)||0,fat:Number(d.fat)||0,sourceId:String(d.sourceId||''),units:Array.isArray(d.units)?d.units:[],source:'מאגר משותף',sharedId:id});
const hasMacros=x=>['calories','protein','carbs','fat'].some(k=>Number(x[k])>0);
async function sharedLoad(force){
  if(!user)return sharedList||[];
  if(sharedList&&!force&&sharedList._t&&Date.now()-sharedList._t<6*3600*1000)return sharedList;
  try{const snap=await getDocs(collection(db,'sharedFoods'));const l=[];snap.forEach(d=>l.push(sharedNorm(d.id,d.data())));l._t=Date.now();sharedList=l;try{localStorage.setItem('fp2Shared',JSON.stringify(Object.assign([],l,{})));localStorage.setItem('fp2SharedT',String(l._t))}catch(_){}}catch(_){}
  return sharedList||[];
}
if(sharedList){sharedList._t=Number(localStorage.getItem('fp2SharedT')||0)}
async function sharedPut(id,x){
  const d={name:String(x.name||'').slice(0,120),brand:String(x.brand||'').slice(0,80),baseQty:Number(x.baseQty||x.amount)||100,unit:String(x.unit||'גרם'),calories:Number(x.calories)||0,protein:Number(x.protein)||0,carbs:Number(x.carbs)||0,fat:Number(x.fat)||0,sourceId:BC.test(String(x.sourceId||''))?String(x.sourceId):'',units:Array.isArray(x.units)?x.units.filter(u=>Array.isArray(u)&&u[0]&&Number(u[1])>0).slice(0,12).map(u=>[String(u[0]),Number(u[1]),u[2]?1:0]):[],ts:Date.now()};
  await setDoc(doc(db,'sharedFoods',String(id)),d);
  if(sharedList){sharedList=sharedList.filter(f=>f.sharedId!==String(id));sharedList.push(sharedNorm(String(id),d));sharedList._t=Date.now()}
}
/* ===== unit weights learned from users (2.6.6): unitCal/{food|unit} = {k,u,v:{uid:grams}} ===== */
function calMedian(a){const s=a.slice().sort((x,y)=>x-y),m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2}
async function calLoad(){
  if(!user)return null;
  const snap=await getDocs(collection(db,'unitCal'));const out={};
  snap.forEach(d=>{const x=d.data()||{},v=x.v||{},vals=Object.values(v).map(Number).filter(g=>g>0&&g<5000);if(!x.k||!x.u||!vals.length)return;
    const med=calMedian(vals),kept=vals.filter(g=>g>=med*0.6&&g<=med*1.6);
    out[x.k+'|'+x.u]={mine:Number(v[user.uid])||null,crowd:kept.length?Math.round(calMedian(kept)*10)/10:null,n:kept.length}});
  return out;
}
async function calPut(k,u,g){
  if(!user||!k||!u||!(g>0))return;
  const id=(k+'|'+u).replace(/\//g,'_').slice(0,700);
  await setDoc(doc(db,'unitCal',id),{k:String(k),u:String(u),v:{[user.uid]:Math.round(Number(g)*10)/10},ts:Date.now()},{merge:true});
}
async function offLookup(code){
  try{
    const r=await fetch('https://world.openfoodfacts.org/api/v2/product/'+encodeURIComponent(code)+'.json?fields=product_name,product_name_he,brands,nutriments,serving_quantity,serving_quantity_unit');
    if(!r.ok)return null;const b=await r.json();const p=b&&b.product;if(!p)return null;const n=p.nutriments||{};
    const base=String(p.product_name_he||p.product_name||'').trim(),brand=String(p.brands||'').split(',')[0].trim();
    const x={name:base?(brand&&base.indexOf(brand)<0?base+' – '+brand:base):'',brand:p.brands||'',baseQty:100,unit:'גרם',
      units:(Number(p.serving_quantity)>0&&String(p.serving_quantity_unit||'g').toLowerCase()!=='ml')?[['מנה מהאריזה',Math.round(Number(p.serving_quantity)*10)/10,false]]:[],
      calories:Number(n['energy-kcal_100g'])||0,protein:Number(n.proteins_100g)||0,carbs:Number(n.carbohydrates_100g)||0,fat:Number(n.fat_100g)||0,source:'Open Food Facts',sourceId:code};
    if(!hasMacros(x))x.incomplete=true;
    return x;
  }catch(_){return null}
}
async function lookupBarcodeAll(args){
  const code=String(args[0]||'').replace(/\D/g,'');
  if(code.length<8)throw new Error('ברקוד לא תקין');
  try{const mine=await core.call('saveMyFoods',[[]]);const f=(mine||[]).find(x=>x.sourceId===code);if(f)return f}catch(_){}
  try{const d=await getDoc(doc(db,'sharedFoods',code));if(d.exists()){const x=sharedNorm(code,d.data());if(hasMacros(x))return x}}catch(_){}
  const off=await offLookup(code);
  if(off&&!off.incomplete)return off;
  if(oldConf()){try{const o=await core.call('lookupBarcode',[code]);if(o&&hasMacros(o))return o}catch(_){}}
  if(off)return off;
  throw new Error('המוצר לא נמצא');
}
function shareHook(fn,args){
  try{
    const list=fn==='saveFood'?[args[0]]:(fn==='saveMyFoods'?(args[0]||[]):[]);
    list.forEach(x=>{
      if(!x||!hasMacros(x))return;
      const name=String(x.name||'').trim();if(!name)return;
      const code=String(x.sourceId||'').trim();
      if(BC.test(code)&&!/צמרת/.test(String(x.source||''))){sharedPut(code,x).catch(()=>{});return}
      const manual=fn==='saveFood'?(!code&&x.source==='הזנה ידנית'):!!x.propose;
      if(manual&&pushUrl())notificationAPI('submitFoodProposal',{food:{name,brand:x.brand||'',baseQty:Number(x.baseQty||x.amount)||100,unit:x.unit||'גרם',calories:+x.calories||0,protein:+x.protein||0,carbs:+x.carbs||0,fat:+x.fat||0}}).catch(()=>{});
    });
  }catch(_){}
}

window.FP2={
  calLoad,calPut,
  sharedAll:()=>sharedList||[],sharedLoad,sharedPut,sharedDel:async id=>{await deleteDoc(doc(db,'sharedFoods',String(id)));if(sharedList)sharedList=sharedList.filter(f=>f.sharedId!==String(id))},
  oldConfig:oldConf,
  userId:()=>user?.uid,
  isAdmin:()=>!!user&&ADMIN_EMAILS.indexOf(String(user.email||'').toLowerCase())>-1,
  push:(name,data)=>notificationAPI(name,data),
  register:name=>{if(!user||!pushUrl())return;notificationAPI('registerUser',{name:String(name||'').slice(0,40)}).catch(()=>{})},
  calendarFetch:url=>notificationAPI('fetchCalendar',{url}),getProp:k=>String((core&&core.store&&core.store.props&&core.store.props[k])||''),setProp:(k,v)=>{if(!core)throw new Error('האפליקציה עוד נטענת');if(v)core.store.props[k]=String(v);else delete core.store.props[k];core.store.propsDirty=true;core.flush()},
  enablePush,disablePush,sendTestPush,pushEnabled:()=>!!user&&localStorage.getItem(pushKey())==='on'&&typeof Notification!=='undefined'&&Notification.permission==='granted',
  async refreshHealth(){if(!core||!oldConf())throw new Error("חבר קודם את שרת השעון בחשבון וענן");await core.pullHealth();const fresh=await core.call("getBootstrapData",[]);if(typeof state!=="undefined"&&state.data)state.data.health=fresh.health},
  call:async(fn,args)=>{if(!core)throw new Error('האפליקציה עוד נטענת');if(PHOTO_FNS.has(fn))return photoCall(fn,args);if(fn==='lookupBarcode')return lookupBarcodeAll(args);const r=await core.call(fn,args);if(fn==='saveFood'||fn==='saveMyFoods')shareHook(fn,args);if(['saveBankEvent','deleteBankEvent','restoreBankEvent','saveSettings','getBootstrapData','activateBankEvent'].includes(fn))queueNotificationSync();return r},
  afterBoot(){accountCard();sharedLoad();try{if(user&&pushUrl())notificationAPI('registerUser',{}).catch(()=>{})}catch(_){}pullHealth();queueNotificationSync();refreshPushRegistration();document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){pullHealth();queueNotificationSync()}})}
};

onAuthStateChanged(auth,async u=>{
  if(!u){user=null;showAuth('login');return}
  if(user&&user.uid===u.uid)return;
  try{const last=localStorage.getItem('fp2LastUid');if(last&&last!==u.uid)wipeDeviceData();localStorage.setItem('fp2LastUid',u.uid)}catch(_){}
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
