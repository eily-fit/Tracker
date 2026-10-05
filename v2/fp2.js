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
const oldConf=()=>{try{const c=JSON.parse(localStorage.getItem('elaiApi')||'null');return c&&c.url&&c.pass?c:null}catch(_){return null}};
async function remote(fn,args){
  if(!oldConf())throw new Error('לפעולה הזו צריך חיבור לשרת הישן. חבר אותו בהגדרות');
  return window.httpCall(fn,args||[]);
}

/* ---------- saving to Firebase ---------- */
function persist(ch,wait){
  if(!col)return Promise.resolve();
  const ops=[];
  ch.writes.forEach(w=>ops.push(b=>b.set(doc(col,w.id),{t:w.t,n:w.n,size:w.size,rows:w.rows,u:Date.now()})));
  ch.deletes.forEach(id=>ops.push(b=>b.delete(doc(col,id))));
  if(ch.props)ops.push(b=>b.set(doc(col,'__props'),{t:'__props',rows:ch.props,u:Date.now()}));
  const commits=[];
  for(let i=0;i<ops.length;i+=400){const b=writeBatch(db);ops.slice(i,i+400).forEach(f=>f(b));commits.push(b.commit())}
  const all=Promise.all(commits);
  /* The phone copy is updated at once; the upload to the cloud finishes in the background (also after being offline). */
  all.catch(e=>console.error('sync',e));
  if(wait)return all;
  pendingCommits.push(all);all.finally(()=>{pendingCommits=pendingCommits.filter(x=>x!==all)});
  return Promise.resolve();
}

/* ---------- screens: sign-in and first import ---------- */
const CSS=`.fp2-ov{position:fixed;inset:0;z-index:10000;background:var(--bg,#f2f6f5);display:flex;align-items:flex-start;justify-content:center;padding:calc(40px + env(safe-area-inset-top)) 18px 20px;overflow:auto;direction:rtl;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Arial,sans-serif}
.fp2-box{width:100%;max-width:420px;background:#fff;border-radius:20px;padding:22px;box-shadow:0 10px 30px rgba(0,0,0,.08)}
.fp2-box h1{margin:0 0 4px;font-size:28px;color:#1c6b5c}.fp2-box p{color:#5f6b68;line-height:1.55;margin:6px 0 14px}
.fp2-box input{width:100%;box-sizing:border-box;font-size:17px;padding:13px 14px;border:1px solid #d5e0dc;border-radius:12px;margin:6px 0;direction:ltr;text-align:left;background:#fff}
.fp2-btn{display:block;width:100%;border:0;border-radius:14px;padding:14px;font-size:17px;font-weight:700;margin-top:10px;background:#1c6b5c;color:#fff}.fp2-btn.light{background:#e9f2ef;color:#1c6b5c}.fp2-link{background:none;border:0;color:#1c6b5c;font-size:15px;margin-top:12px;padding:6px}
.fp2-msg{min-height:22px;color:#b03a3a;font-size:15px;margin-top:8px}.fp2-bar{height:10px;background:#e9f2ef;border-radius:6px;overflow:hidden;margin:14px 0 6px}.fp2-bar i{display:block;height:100%;background:#1c6b5c;width:0;transition:width .3s}`;
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
    try{await sendPasswordResetEmail(auth,e);$id('fp2Msg').style.color='#1c6b5c';$id('fp2Msg').textContent='נשלח מייל לאיפוס סיסמה'}catch(err){$id('fp2Msg').textContent=authErr(err)}};
}
function showImport(){
  const c=oldConf();
  overlay(`<h1>ברוך הבא 👋</h1><p>זו הכניסה הראשונה לחשבון הזה. להעביר את כל הנתונים מהאפליקציה הישנה? ארוחות, אימונים, משקלים, תוכניות, אירועים ודופק. זה לוקח בערך דקה, פעם אחת.</p>
    ${c?'<p style="color:#1c6b5c">✓ השרת הישן מחובר בטלפון הזה</p>':`<input id="fp2Url" placeholder="כתובת השרת הישן (מסתיימת ב-/exec)"><input id="fp2Code" type="password" placeholder="הקוד האישי מהאפליקציה הישנה">`}
    <button class="fp2-btn" id="fp2Imp">העבר את הנתונים שלי</button><button class="fp2-btn light" id="fp2Fresh">התחל מאפס</button>
    <div class="fp2-bar"><i id="fp2Prog"></i></div><div id="fp2Step" style="color:#5f6b68;font-size:15px"></div><div class="fp2-msg" id="fp2Msg"></div>`);
  $id('fp2Imp').onclick=async()=>{
    if(!c){const url=$id('fp2Url').value.trim(),pass=$id('fp2Code').value;if(!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(url)||!pass)return $id('fp2Msg').textContent='כתוב את הכתובת והקוד';localStorage.setItem('elaiApi',JSON.stringify({url,pass}))}
    $id('fp2Imp').disabled=$id('fp2Fresh').disabled=true;$id('fp2Msg').textContent='';
    const say=(t,p)=>{$id('fp2Step').textContent=t;$id('fp2Prog').style.width=p+'%'};
    try{core=newCore();await core.importFromOld(say);await Promise.all(pendingCommits);say('מסיים…',98);await flushAll(true);say('הכול הועבר ✓',100);setTimeout(()=>location.reload(),600)}
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
    <p class="muted">השרת הישן (ל-AI, לתמונות ולשעון): ${oldConf()?'✓ מחובר':'לא מחובר'}</p>
    <button class="btn light full" id="fp2Out">התנתק</button></div>`;
  const h=view.querySelector('h2');(h||view.firstChild).insertAdjacentElement(h?'afterend':'beforebegin',card);
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
