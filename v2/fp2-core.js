/* FitPro 2 core: the app's own server logic (Code.gs) runs inside the phone, on tables kept in memory.
   Every change is written to Firebase in chunks of rows. Things that truly need the internet
   (AI, the American food database, Drive photos and videos) still go to the old Apps Script server. */
(function(){
'use strict';
const TZ='Asia/Jerusalem';
const reviveRow=r=>r.map(x=>x&&typeof x==='object'&&x.$d?new Date(x.$d):x);
const packRow=r=>(r||[]).map(x=>x instanceof Date?{$d:x.toISOString()}:(x===undefined?'':x));
const utf8Len=str=>{let n=0;for(let i=0;i<str.length;i++){const c=str.charCodeAt(i);n+=c<128?1:c<2048?2:(c>=0xD800&&c<=0xDBFF)?(i++,4):3}return n};
const MAX_CHUNK=500000;
const uuid=()=>(typeof crypto!=='undefined'&&crypto.randomUUID)?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return (c==='x'?r:(r&3|8)).toString(16)});
function fmtDate(d,tz,pat){
  d=new Date(d);if(isNaN(d))return '';
  const o={};new Intl.DateTimeFormat('en-GB',{timeZone:tz||TZ,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(d).forEach(p=>{o[p.type]=p.value});
  return String(pat).replace(/yyyy|MM|dd|HH|H|mm|ss/g,t=>({yyyy:o.year,MM:o.month,dd:o.day,HH:o.hour,H:String(Number(o.hour)),mm:o.minute,ss:o.second})[t]);
}
function needRemote(){const e=new Error('NEED_REMOTE');e.needRemote=true;throw e}
/* Anything not modelled (formatting, validations, triggers…) is accepted and ignored. */
function loose(target){const p=new Proxy(target,{get(t,k){if(k in t)return t[k];if(typeof k==='symbol')return undefined;return function(){return p}}});return p}

/* ---------- tables ---------- */
function Store(){
  this.tables=new Map();this.props={};this.propsDirty=false;
}
Store.prototype.table=function(name){return this.tables.get(name)};
Store.prototype.create=function(name,size){const t={name,data:[],size:size||100,dirty:new Set(),known:0,removed:false};this.tables.set(name,t);return t};
Store.prototype.markAll=function(t){for(let i=0;i<t.data.length;i++)t.dirty.add(i);if(!t.data.length)t.dirty.add(0)};
/* chunk docs: {t, n, size, rows:"json"} ; returns writes/deletes and clears dirty marks */
Store.prototype.takeChanges=function(){
  const writes=[],deletes=[];
  this.tables.forEach(t=>{
    if(t.removed){for(let n=0;n*t.size<Math.max(t.known,1);n++)deletes.push(t.name+'~'+n);this.tables.delete(t.name);return}
    let chunks=new Set();t.dirty.forEach(i=>chunks.add(Math.floor(i/t.size)));t.dirty.clear();
    let lastChunk=Math.max(0,Math.ceil(t.data.length/t.size)-1);
    const pack=n=>JSON.stringify(t.data.slice(n*t.size,(n+1)*t.size).map(packRow));
    /* a chunk that grew too big: make the table's chunks smaller and rewrite all of it */
    let tooBig=false;chunks.forEach(n=>{if(!tooBig&&n<=lastChunk&&utf8Len(pack(n))>MAX_CHUNK)tooBig=true});
    if(tooBig){let maxB=1;for(let n=0;n<=lastChunk;n++)maxB=Math.max(maxB,utf8Len(pack(n)));
      t.size=Math.max(1,Math.floor(t.size*MAX_CHUNK*0.7/maxB));t.known=Math.max(t.known,t.data.length);
      lastChunk=Math.max(0,Math.ceil(t.data.length/t.size)-1);chunks=new Set();for(let n=0;n<=lastChunk;n++)chunks.add(n);t.knownChunks=Math.max(t.knownChunks||0,Math.ceil(t.known/1))}
    chunks.forEach(n=>{if(n>lastChunk&&t.data.length)return;const rows=pack(n);writes.push({id:t.name+'~'+n,t:t.name,n,size:t.size,rows,bytes:utf8Len(rows)})});
    const oldLast=Math.max(t.maxChunk||0,Math.max(0,Math.ceil(t.known/t.size)-1));
    for(let n=lastChunk+1;n<=oldLast;n++)deletes.push(t.name+'~'+n);
    t.maxChunk=lastChunk;
    t.known=t.data.length;
  });
  let props=null;if(this.propsDirty){props=JSON.stringify(this.props);this.propsDirty=false}
  return {writes,deletes,props};
};
/* apply one chunk doc (from Firebase) */
Store.prototype.applyChunk=function(doc){
  let t=this.tables.get(doc.t);if(!t)t=this.create(doc.t,doc.size||100);t.size=doc.size||t.size;
  const rows=JSON.parse(doc.rows||'[]').map(reviveRow),start=doc.n*t.size;
  for(let i=0;i<rows.length;i++)t.data[start+i]=rows[i];
  for(let i=0;i<start;i++)if(!t.data[i])t.data[i]=[];
  t.known=Math.max(t.known,t.data.length);t.maxChunk=Math.max(t.maxChunk||0,doc.n);
};
Store.prototype.removeChunk=function(id){
  const k=id.lastIndexOf('~'),name=id.slice(0,k),n=Number(id.slice(k+1)),t=this.tables.get(name);if(!t)return;
  if((n+1)*t.size>=t.data.length){t.data.length=Math.min(t.data.length,n*t.size);t.known=t.data.length}
};

/* ---------- a Google Sheets look-alike over the tables ---------- */
function makeSpreadsheet(store){
  function sheetObj(t){
    const width=()=>{let w=1;for(const r of t.data)if(r&&r.length>w)w=r.length;return w};
    const mark=i=>t.dirty.add(i);
    const range=(r,c,nr,nc)=>{nr=nr||1;nc=nc||1;
      const self=loose({
        getValues(){const out=[];for(let i=0;i<nr;i++){const row=t.data[r-1+i]||[];const o=[];for(let j=0;j<nc;j++){const v=row[c-1+j];o.push(v===undefined||v===null?'':(v instanceof Date?new Date(v.getTime()):v))}out.push(o)}return out},
        getDisplayValues(){return self.getValues().map(r=>r.map(v=>v instanceof Date?fmtDate(v,TZ,'yyyy-MM-dd'):String(v)))},
        getValue(){return self.getValues()[0][0]},
        setValues(v){v.forEach((row,i)=>{const ri=r-1+i;while(t.data.length<ri)t.data.push([]);const cur=(t.data[ri]||[]).slice();row.forEach((x,j)=>{cur[c-1+j]=x});for(let k=0;k<cur.length;k++)if(cur[k]===undefined)cur[k]='';t.data[ri]=cur;mark(ri)});return self},
        setValue(x){return self.setValues([[x]])},
        clearContent(){const v=[];for(let i=0;i<nr;i++)v.push(new Array(nc).fill(''));return self.setValues(v)},
        getDataValidations(){return Array.from({length:nr},()=>Array(nc).fill(null))},
        getNumRows(){return nr},getNumColumns(){return nc},getRow(){return r},getColumn(){return c},getLastRow(){return r+nr-1}
      });return self};
    const sh=loose({
      getName:()=>t.name,getSheetId:()=>0,
      getDataRange:()=>range(1,1,Math.max(1,t.data.length),width()),
      getRange(a,b,c,d){if(typeof a==='string'){const m=/^([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$/.exec(a);const col=s=>s.split('').reduce((n,ch)=>n*26+ch.charCodeAt(0)-64,0);if(!m)return range(1,1,1,1);const r1=+m[2],c1=col(m[1]),r2=m[4]?+m[4]:r1,c2=m[3]?col(m[3]):c1;return range(r1,c1,r2-r1+1,c2-c1+1)}return range(a,b,c,d)},
      getLastRow(){let n=t.data.length;while(n>0&&(!t.data[n-1]||t.data[n-1].every(v=>v===''||v===null||v===undefined)))n--;return n},
      getLastColumn:()=>t.data.length?width():0,getMaxRows:()=>Math.max(1,t.data.length),getMaxColumns:()=>Math.max(26,width()),
      appendRow(row){t.data.push(row.slice());mark(t.data.length-1);return sh},
      deleteRow(r){t.data.splice(r-1,1);for(let i=r-1;i<=t.data.length;i++)mark(i);return sh},
      deleteRows(r,n){t.data.splice(r-1,n);for(let i=r-1;i<=t.data.length;i++)mark(i);return sh},
      clear(){t.data=[];mark(0);return sh},isSheetHidden:()=>false
    });return sh}
  const cache=new Map();
  const get=name=>{const t=store.table(name);if(!t)return null;if(!cache.has(t))cache.set(t,sheetObj(t));return cache.get(t)};
  return loose({
    getSheetByName:get,
    insertSheet(name){if(!store.table(name)){const t=store.create(name);t.dirty.add(0)}return get(name)},
    deleteSheet(sh){const t=store.table(sh.getName());if(t)t.removed=true},
    getSheets(){return [...store.tables.keys()].map(get)},
    getId:()=>'local',getName:()=>'FitPro',getUrl:()=>'',getSpreadsheetTimeZone:()=>TZ
  });
}

/* ---------- the rest of the Apps Script services ---------- */
function makeEnv(store,user){
  const ss=makeSpreadsheet(store);
  const props=loose({
    getProperty:k=>Object.prototype.hasOwnProperty.call(store.props,k)?store.props[k]:null,
    setProperty(k,v){store.props[k]=String(v);store.propsDirty=true;return props},
    deleteProperty(k){delete store.props[k];store.propsDirty=true;return props},
    getProperties:()=>Object.assign({},store.props),
    setProperties(o,del){if(del)store.props={};Object.keys(o||{}).forEach(k=>{store.props[k]=String(o[k])});store.propsDirty=true;return props},
    getKeys:()=>Object.keys(store.props)
  });
  const mem=new Map();
  const cache=loose({get:k=>mem.has(k)?mem.get(k):null,put(k,v){mem.set(k,String(v))},remove(k){mem.delete(k)},
    getAll:ks=>{const o={};ks.forEach(k=>{if(mem.has(k))o[k]=mem.get(k)});return o},putAll(o){Object.keys(o).forEach(k=>mem.set(k,String(o[k])))},removeAll(ks){ks.forEach(k=>mem.delete(k))}});
  const lock=loose({waitLock(){},tryLock:()=>true,releaseLock(){},hasLock:()=>true});
  const thrower=new Proxy({},{get:()=>needRemote});
  const enc=new TextEncoder();
  return {
    SpreadsheetApp:loose({getActiveSpreadsheet:()=>ss,openById:()=>ss,create:()=>ss,flush(){},newDataValidation:()=>loose({build:()=>({})})}),
    PropertiesService:loose({getScriptProperties:()=>props,getUserProperties:()=>props,getDocumentProperties:()=>props}),
    CacheService:loose({getScriptCache:()=>cache,getUserCache:()=>cache,getDocumentCache:()=>cache}),
    LockService:loose({getScriptLock:()=>lock,getUserLock:()=>lock,getDocumentLock:()=>lock}),
    Session:loose({getActiveUser:()=>({getEmail:()=>user.email||''}),getEffectiveUser:()=>({getEmail:()=>user.email||''}),getScriptTimeZone:()=>TZ,getTemporaryActiveUserKey:()=>user.uid}),
    Utilities:loose({getUuid:uuid,formatDate:fmtDate,sleep(){},
      computeDigest:(alg,s)=>{let h=2166136261;const b=enc.encode(String(s));const out=[];for(let r=0;r<32;r++){for(const x of b)h=Math.imul(h^x^r,16777619);out.push((h>>>0)%256-128)}return out},
      DigestAlgorithm:{SHA_256:'SHA_256',MD5:'MD5'},Charset:{UTF_8:'UTF_8'},
      base64Encode:s=>btoa(typeof s==='string'?unescape(encodeURIComponent(s)):String.fromCharCode.apply(null,Array.from(s,x=>x&255))),
      /* 2.14.1: was missing, so every "same workout saved twice" check got the same key and a second exercise saved within a minute was dropped */
      base64EncodeWebSafe:s=>btoa(typeof s==='string'?unescape(encodeURIComponent(s)):String.fromCharCode.apply(null,Array.from(s,x=>x&255))).replace(/\+/g,'-').replace(/\//g,'_'),
      base64Decode:s=>Array.from(atob(s),c=>c.charCodeAt(0)),newBlob:needRemote,parseCsv:needRemote}),
    UrlFetchApp:thrower,DriveApp:thrower,MailApp:thrower,GmailApp:thrower,
    ScriptApp:loose({getProjectTriggers:()=>[],deleteTrigger(){},newTrigger:()=>loose({}),getService:()=>({getUrl:()=>location.href}),getOAuthToken:()=>''}),
    HtmlService:loose({}),ContentService:loose({MimeType:{JSON:'JSON',JAVASCRIPT:'JAVASCRIPT',TEXT:'TEXT'}}),
    Logger:{log(){}},XmlService:thrower
  };
}

/* Functions that can only run on the old server, and ones that try the phone first. */
const REMOTE_ONLY=new Set(['estimateFoodWithOpenAI','estimateFoodPhoto','lookupBarcode','testUsdaConnection','importTzameret','getTzameretData','startVideoUpload','uploadVideoChunk','checkVideoUpload','getApiInfo','setApiPassword','createInvite','deleteUser','saveProgressPhoto','getProgressPhotos','getProgressPhoto','deleteWorkoutVideo','restoreWorkoutVideo','exportSheetInfo','exportSheet','exportProps']);
const TRY_LOCAL=new Set(['searchFoods','smartFoodSearch','estimateDish']);

function Core(opts){
  this.user=opts.user;this.store=new Store();this.remote=opts.remote;this.onChanges=opts.onChanges||function(){};
  this.server=null;
}
Core.prototype.start=function(){
  const env=makeEnv(this.store,this.user);
  this.server=window.FitServerFactory(env,{id:this.user.uid,name:'',admin:true});
  try{this.server.ensure()}catch(e){console.error('ensure',e)}
  this.flush();
};
Core.prototype.flush=function(){const ch=this.store.takeChanges();if(ch.writes.length||ch.deletes.length||ch.props)this.onChanges(ch)};
Core.prototype.local=function(fn,args){
  const f=this.server.api[fn];if(!f)throw new Error('פעולה לא מוכרת: '+fn);
  try{const r=f.apply(null,args||[]);return r===undefined?null:JSON.parse(JSON.stringify(r))}
  finally{this.flush()}
};
Core.prototype.call=async function(fn,args){
  args=args||[];
  if(REMOTE_ONLY.has(fn))return this.remote(fn,args);
  if(fn==='saveSettings'&&args[0]&&(args[0].usda_api_key||args[0].openai_api_key||args[0].clear_usda_key||args[0].clear_openai_key)){
    const keys={};['usda_api_key','openai_api_key','clear_usda_key','clear_openai_key'].forEach(k=>{if(args[0][k])keys[k]=args[0][k]});
    await this.remote('saveSettings',[keys]);
    const rest=Object.assign({},args[0]);Object.keys(keys).forEach(k=>delete rest[k]);
    if(keys.usda_api_key)this.store.props.USDA_API_KEY='remote';if(keys.clear_usda_key)delete this.store.props.USDA_API_KEY;
    if(keys.openai_api_key)this.store.props.OPENAI_API_KEY='remote';if(keys.clear_openai_key)delete this.store.props.OPENAI_API_KEY;
    this.store.propsDirty=true;args=[rest];
  }
  if(TRY_LOCAL.has(fn)){try{return this.local(fn,args)}catch(e){if(e&&e.needRemote)return this.remote(fn,args);throw e}}
  try{return this.local(fn,args)}catch(e){if(e&&e.needRemote)throw new Error('הפעולה הזו דורשת את השרת הישן, ואין אליו חיבור כרגע');throw e}
};
/* data from Firebase */
Core.prototype.load=function(docs){docs.forEach(d=>{if(d.t==='__props'){try{this.store.props=JSON.parse(d.rows||'{}')}catch(_){}}else this.store.applyChunk(d)})};

/* ---------- import from the old app ---------- */
Core.prototype.importFromOld=async function(progress){
  const say=progress||function(){};
  say('בודק מה יש בשרת הישן…',0);
  const info=await this.remote('exportSheetInfo',[]);
  const known=new Set(window.FitServerSheetNames||[]);
  const sheets=info.filter(s=>s.rows>0&&(known.has(s.name)||/^App_/.test(s.name)));
  const totalRows=sheets.reduce((a,s)=>a+s.rows,0)||1;let doneRows=0;
  for(const s of sheets){
    const rows=[];
    for(let off=0;off<s.rows;off+=1000){
      say('מעביר: '+s.name,Math.round(doneRows/totalRows*90));
      const page=await this.remote('exportSheet',[{name:s.name,offset:off,limit:1000}]);
      page.rows.forEach(r=>rows.push(reviveRow(r)));doneRows+=page.rows.length;
      if(!page.rows.length)break;
    }
    let big=50;for(let i=0;i<rows.length;i+=Math.max(1,Math.floor(rows.length/400)))big=Math.max(big,utf8Len(JSON.stringify(packRow(rows[i]))));
    const size=Math.max(1,Math.min(400,Math.floor(MAX_CHUNK*0.6/big)));
    const old=this.store.table(s.name);if(old)this.store.tables.delete(s.name);
    const t=this.store.create(s.name,size);t.data=rows;this.store.markAll(t);
  }
  say('מעביר הגדרות…',92);
  const pr=await this.remote('exportProps',[]);
  Object.assign(this.store.props,pr.user||{});
  if(pr.script){Object.keys(pr.script).forEach(k=>{if(pr.script[k])this.store.props[k]=pr.script[k]})}
  if(pr.has&&pr.has.openai)this.store.props.OPENAI_API_KEY='remote';
  if(pr.has&&pr.has.usda)this.store.props.USDA_API_KEY='remote';
  this.store.props.FP2_IMPORTED=new Date().toISOString();this.store.propsDirty=true;
  this.start();
  say('שומר בענן…',95);
};
Core.prototype.repairFromOld=async function(progress){
  const say=progress||function(){};say('בודק מה יש בשרת הישן…',0);
  const info=await this.remote('exportSheetInfo',[]);
  const known=new Set(window.FitServerSheetNames||[]);
  const sheets=info.filter(s=>s.rows>0&&(known.has(s.name)||/^App_/.test(s.name)));
  const total=sheets.reduce((a,s)=>a+s.rows,0)||1;let done=0,added=0;
  const blank=r=>!r||r.every(v=>v===''||v===null||v===undefined);
  for(const s of sheets){
    const rows=[];
    for(let off=0;off<s.rows;off+=1000){say('משחזר: '+s.name,Math.round(done/total*90));
      const page=await this.remote('exportSheet',[{name:s.name,offset:off,limit:1000}]);page.rows.forEach(r=>rows.push(reviveRow(r)));done+=page.rows.length;if(!page.rows.length)break}
    let t=this.store.table(s.name);
    if(!t){t=this.store.create(s.name,100);t.data=rows;this.store.markAll(t);added+=rows.length;continue}
    const have=new Set(t.data.map(r=>r&&r[0]!==''&&r[0]!=null?String(r[0]):null).filter(Boolean));
    if(!t.data.length&&rows.length)t.data.push(rows[0]);
    for(let i=1;i<rows.length;i++){const r=rows[i];if(blank(r))continue;const id=String(r[0]);if(!have.has(id)){t.data.push(r);have.add(id);added++}}
    this.store.markAll(t);t.size=Math.min(t.size,100);
  }
  this.server&&this.flush();say('הושלם',100);return added;
};
/* Sleep and heart rate from the iPhone Shortcut still land on the old server: copy what is new. */
Core.prototype.pullHealth=async function(){
  const page=await this.remote('exportSheet',[{name:'App_Health',offset:0,limit:2000}]);
  const remote=(page.rows||[]).slice(1).map(reviveRow).filter(r=>r[0]);
  if(!remote.length)return false;
  let t=this.store.table('App_Health');if(!t){this.server.ensure();t=this.store.table('App_Health')}
  if(!t)return false;
  const key=v=>v instanceof Date?fmtDate(v,TZ,'yyyy-MM-dd'):String(v).slice(0,10);
  const stamp=v=>v instanceof Date?v.getTime():(Date.parse(v)||0);
  let changed=false;
  remote.forEach(r=>{
    const d=key(r[0]),i=t.data.findIndex((x,j)=>j>0&&x&&key(x[0])===d);
    if(i<0){t.data.push(r);t.dirty.add(t.data.length-1);changed=true}
    else if(stamp(r[6])>stamp(t.data[i][6])){t.data[i]=r;t.dirty.add(i);changed=true}
  });
  this.flush();return changed;
};
window.FP2Core={Core,Store,fmtDate,REMOTE_ONLY,TRY_LOCAL};
})();
