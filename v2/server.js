/* Generated: the FitPro server code (Code.gs) wrapped to run inside the app. */
window.FitServerSheetNames=["App_BodyMeasurements", "App_DailySummary", "App_Entries", "App_Events", "App_Exercises", "App_Foods", "App_Health", "App_ProgressPhotos", "App_Settings", "App_Trash", "App_WeeklyCheckins", "App_WorkoutPlans", "App_WorkoutSessions", "App_WorkoutVideos", "App_Workouts", "מאגר מרכיבים"];
window.FitServerFactory=function(__env,__user){
  var SpreadsheetApp=__env.SpreadsheetApp,PropertiesService=__env.PropertiesService,CacheService=__env.CacheService,LockService=__env.LockService,Session=__env.Session,Utilities=__env.Utilities,UrlFetchApp=__env.UrlFetchApp,DriveApp=__env.DriveApp,MailApp=__env.MailApp,GmailApp=__env.GmailApp,ScriptApp=__env.ScriptApp,HtmlService=__env.HtmlService,ContentService=__env.ContentService,Logger=__env.Logger,XmlService=__env.XmlService;
const APP = Object.freeze({
  version: '0.36.0',
  spreadsheetId: '15ICIt6QZIytJyoO6Cj4dYfp2UdY5MisExvnBcXm6S1I',
  timezone: 'Asia/Jerusalem',
  sheets: {
    meals: 'מאגר מרכיבים',
    entries: 'App_Entries',
    summary: 'App_DailySummary',
    foods: 'App_Foods',
    settings: 'App_Settings',
    workouts: 'App_Workouts',
    exercises: 'App_Exercises',
    videos: 'App_WorkoutVideos',
    plans: 'App_WorkoutPlans',
    sessions: 'App_WorkoutSessions',
    measurements: 'App_BodyMeasurements'
  },
  entryHeaders: ['entry_id','date','created_at','category','source_type','meal_option','food_name','amount','unit','calories','protein','carbs','fat','source','deleted','notes','group_id']
});

let APP_SPREADSHEET_;
// v0.26: who is calling. Admin (the owner) uses the original sheet; every invited user has a sheet of their own.
let CURRENT_USER_=null;
function isAdmin_(){return !CURRENT_USER_||CURRENT_USER_.admin===true;}
function userKey_(base){return isAdmin_()?base:base+'_'+CURRENT_USER_.id;}

function doGet(e) {
  // v0.19.2: API over GET (JSONP) — Safari receives big answers through a script tag without cross-site limits.
  if(e&&e.parameter&&e.parameter.fn&&e.parameter.cb)return apiJsonp_(e.parameter);
  // v0.19: once a password exists (and the deployment is open to "Anyone" for the installed app), this page asks for it too.
  const hash=PropertiesService.getScriptProperties().getProperty('API_PASSWORD_HASH');
  const k=e&&e.parameter&&e.parameter.k;
  if(hash&&hashPassword_(k)!==hash){
    return HtmlService.createHtmlOutput('<div dir="rtl" style="font-family:-apple-system,Arial;max-width:420px;margin:40px auto;padding:20px"><h2>FitPro</h2><p>הכניסה מוגנת בסיסמה.</p><form method="get" target="_top"><input name="k" type="password" placeholder="סיסמה" style="width:100%;padding:12px;font-size:16px;border:1px solid #ccc;border-radius:10px"><button style="margin-top:10px;width:100%;padding:12px;font-size:16px;border:0;border-radius:10px;background:#1c6b5c;color:#fff">כניסה</button></form>'+(k?'<p style="color:#a33">סיסמה שגויה</p>':'')+'</div>')
      .setTitle('FitPro').addMetaTag('viewport','width=device-width, initial-scale=1');
  }
  return HtmlService.createTemplateFromFile('Index').evaluate()
    .setTitle('FitPro')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ---------- v0.19: the app outside Google (installable, fast). Same functions, called over HTTPS with a password. ----------
function doPost(e){
  let out;
  try{
    const req=JSON.parse(e&&e.postData&&e.postData.contents||'{}');
    if(req.fn==='ping'){checkApiPassword_(req.token);out={ok:true,result:{version:APP.version}};}
    else{
      checkApiPassword_(req.token);
      const fn=apiFunctions_()[String(req.fn||'')];
      if(typeof fn!=='function'||!Object.prototype.hasOwnProperty.call(apiFunctions_(),String(req.fn||'')))throw new Error('פעולה לא מוכרת בשרת '+APP.version+': '+String(req.fn||''));
      out={ok:true,result:fn.apply(null,Array.isArray(req.args)?req.args:(req.data&&typeof req.data==='object'?[req.data]:[]))};
    }
  }catch(err){out={ok:false,error:String(err&&err.message||err)};}
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function apiJsonp_(p){
  const cb=/^[A-Za-z0-9_]{1,40}$/.test(String(p.cb||''))?String(p.cb):'cb';
  let out;
  try{
    if(p.fn==='validateInvite'){out={ok:true,result:validateInvite_(p.inv)};return ContentService.createTextOutput(cb+'('+JSON.stringify(out)+');').setMimeType(ContentService.MimeType.JAVASCRIPT);}
    if(p.fn==='register'){out={ok:true,result:registerUser_(p)};return ContentService.createTextOutput(cb+'('+JSON.stringify(out)+');').setMimeType(ContentService.MimeType.JAVASCRIPT);}
    checkApiPassword_(p.t);
    if(p.fn==='ping')out={ok:true,result:{version:APP.version,admin:isAdmin_(),name:CURRENT_USER_?CURRENT_USER_.name:'',capabilities:['users-v1','invite-v2']}};
    else if(p.fn==='__part'){
      // long requests arrive in small pieces (URLs must stay short) and are joined on the last call
      if(!/^[A-Za-z0-9_-]{6,40}$/.test(String(p.id||'')))throw new Error('חלק לא תקין');
      CacheService.getScriptCache().put(userKey_('part')+'_'+p.id+'_'+Number(p.i),String(p.d||''),600);out={ok:true,result:true};
    }
    else{
      const fn=apiFunctions_()[String(p.fn||'')];
      if(typeof fn!=='function'||!Object.prototype.hasOwnProperty.call(apiFunctions_(),String(p.fn||'')))throw new Error('פעולה לא מוכרת בשרת '+APP.version+': '+String(p.fn||''));
      let raw=p.a;
      if(p.parts){const n=Number(p.parts),cache=CacheService.getScriptCache(),keys=[];for(let i=0;i<n;i++)keys.push(userKey_('part')+'_'+p.id+'_'+i);const got=cache.getAll(keys);raw=keys.map(k=>{if(got[k]==null)throw new Error('חלק מהבקשה אבד, נסה שוב');return got[k]}).join('');cache.removeAll(keys);}
      const args=raw?JSON.parse(raw):[];
      out={ok:true,result:fn.apply(null,Array.isArray(args)?args:[])};
    }
  }catch(err){out={ok:false,error:String(err&&err.message||err)};}
  return ContentService.createTextOutput(cb+'('+JSON.stringify(out)+');').setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function apiFunctions_(){
  return {getBootstrapData,getDayView,getDayData:getDayView,saveFood,saveMeal,saveDishEntries,updateEntry,editEntry,deleteEntry,deleteEntries,restoreEntry,deleteMealGroup,restoreMealGroup,groupEntries,ungroupEntries,
    addFreeCalories,addProteinShake,addQuickAction,saveQuickAction,deleteQuickAction,saveDailyMetrics,closeDay,getNutritionJournal,deleteDay,deleteDays,restoreEntries,
    saveCustomMeal,deleteCustomMeal,restoreCustomMeal,hideMeal,restoreMeal,saveSettings,smartFoodSearch,searchFoods,estimateDish,estimateFoodWithOpenAI,lookupBarcode,testUsdaConnection,
    importTzameret,getTzameretData,
    createWorkoutSession,finishWorkoutSession,reopenWorkoutSession,renameWorkoutSession,changeWorkoutSessionDate,deleteWorkoutSession,restoreWorkoutSession,deleteWorkoutSessions,restoreWorkoutSessions,
    saveWorkout,deleteWorkout,restoreWorkout,moveExerciseToSession,saveExercise,updateExercise,deleteExercise,restoreExercise,saveWorkoutPlan,deleteWorkoutPlan,restoreWorkoutPlan,
    getExerciseProgress,startVideoUpload,uploadVideoChunk,checkVideoUpload,deleteWorkoutVideo,restoreWorkoutVideo,
    getProcessData,saveProcessCheckin,deleteProcessCheckin,restoreProcessCheckin,getApiInfo,setApiPassword,getTrash,restoreTrashItem,purgeTrashItem,emptyTrash,createInvite,getUsersInfo,whoAmI,deleteUser,saveProfile,deleteMeals,saveMyFoods,saveProgressPhoto,getProgressPhotos,getProgressPhoto,deleteProgressPhoto,getWeeklyReview,applyCalorieGoal,saveWeeklyCheckin,listWeeklyCheckins,getExportData,cleanupDuplicateWorkouts,
    exportSheetInfo,exportSheet,exportProps,saveBankEvent,chooseBankMethod,mergeDuplicateEntries,saveHealthData,estimateFoodPhoto,deleteBankEvent,restoreBankEvent,setBankWeekAnswer,savePlusMenu,moveEntries,renameMealGroup};
}

function hashPassword_(p){return Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,'elai-salt-v1|'+String(p||''),Utilities.Charset.UTF_8));}

function checkApiPassword_(token){
  const props=PropertiesService.getScriptProperties(),hash=props.getProperty('API_PASSWORD_HASH');
  const cache=CacheService.getScriptCache(),h=hashPassword_(token),fkey='api_fails_'+h.slice(0,16);
  const fails=Number(cache.get('api_fails')||0),mine=Number(cache.get(fkey)||0);
  if(mine>=10||fails>=200)throw new Error('AUTH: יותר מדי ניסיונות שגויים. נסה שוב בעוד 10 דקות');
  if(hash&&h===hash){CURRENT_USER_={id:'admin',name:'',ss:APP.spreadsheetId,admin:true};APP_SPREADSHEET_=null;return;}
  const u=getUsers_().find(x=>x.tokenHash===h);
  if(u){CURRENT_USER_={id:u.id,name:u.name,ss:u.ss,admin:false};APP_SPREADSHEET_=null;return;}
  if(!hash)throw new Error('AUTH: עדיין לא הוגדרה סיסמה. הגדר אותה באפליקציה, בהגדרות');
  cache.put('api_fails',String(fails+1),600);cache.put(fkey,String(mine+1),600);throw new Error('AUTH: סיסמה שגויה');
}

// ---------- v0.26: users (family & friends) ----------
function getUsers_(){try{return JSON.parse(PropertiesService.getScriptProperties().getProperty('USERS')||'[]')}catch(e){return []}}
function saveUsers_(list){PropertiesService.getScriptProperties().setProperty('USERS',JSON.stringify(list));}
function requireAdmin_(){if(!isAdmin_())throw new Error('רק מנהל האפליקציה יכול לעשות את זה');}
function createInvite(){
  requireAdmin_();
  let url='';try{url=ScriptApp.getService().getUrl()||'';}catch(e){}
  if(!url)throw new Error('לא נמצאה כתובת שרת. פרוס את הפרויקט כאפליקציית אינטרנט');
  const lock=LockService.getScriptLock();lock.waitLock(20000);
  try{
    const code=Utilities.getUuid().replace(/-/g,'').slice(0,12);
    PropertiesService.getScriptProperties().setProperty('INVITE_CODE',code);
    return {code,serverUrl:url};
  }finally{lock.releaseLock()}
}

function getUsersInfo(){requireAdmin_();const p=PropertiesService.getScriptProperties();return {invite:p.getProperty('INVITE_CODE')||'',users:getUsers_().map(u=>({id:u.id,name:u.name,created:u.created}))};}
function validateInvite_(inv){
  const code=PropertiesService.getScriptProperties().getProperty('INVITE_CODE');
  if(!code||String(inv||'')!==code)throw new Error('INVITE: הקישור אינו תואם להזמנה הפעילה בשרת. ייתכן שנוצר קישור חדש או שהכתובת מפנה לשרת אחר. בקש את הקישור האחרון ממי שהזמין אותך.');
  if(getUsers_().length>=20)throw new Error('INVITE: אין כרגע מקום למשתמשים נוספים. פנה למי שהזמין אותך.');
  return {valid:true,version:APP.version};
}
function registerUser_(p){
  validateInvite_(p.inv);
  const props=PropertiesService.getScriptProperties();
  const name=String(p.name||'').trim().slice(0,40);
  if(name.length<2)throw new Error('כתוב את השם שלך');
  const lock=LockService.getScriptLock();lock.waitLock(20000);
  let createdSheet=null,createdId='';
  try{
    if(props.getProperty('INVITE_CODE')!==String(p.inv||''))throw new Error('קישור ההזמנה הוחלף. בקש קישור חדש');
    const users=getUsers_();
    if(users.length>=20)throw new Error('הגענו למספר המשתמשים המרבי');
    const id='u'+Utilities.getUuid().replace(/-/g,'').slice(0,10),token=Utilities.getUuid()+Utilities.getUuid();
    const ss=SpreadsheetApp.create('המעקב — '+name);createdSheet=ss;createdId=id;
    try{const folderId=props.getProperty('USERS_FOLDER_ID');let folder=null;if(folderId){try{folder=DriveApp.getFolderById(folderId)}catch(e){}}if(!folder){folder=DriveApp.createFolder('המעקב של עילאי - משתמשים');props.setProperty('USERS_FOLDER_ID',folder.getId());}DriveApp.getFileById(ss.getId()).moveTo(folder);}catch(e){}
    const record={id,name,ss:ss.getId(),tokenHash:hashPassword_(token),created:Utilities.formatDate(new Date(),APP.timezone,'yyyy-MM-dd')};
    CURRENT_USER_={id,name,ss:ss.getId(),admin:false};APP_SPREADSHEET_=null;
    ensureStructure_();seedDefaults_();
    try{const first=ss.getSheets()[0];if(first&&(first.getName()==='Sheet1'||first.getName()==='גיליון1'))ss.deleteSheet(first);}catch(e){}
    users.push(record);saveUsers_(users);
    return {token,name,userId:id};
  }catch(err){
    if(createdSheet){try{DriveApp.getFileById(createdSheet.getId()).setTrashed(true)}catch(_){} }
    if(createdId)Object.keys(props.getProperties()).forEach(k=>{if(k.endsWith('_'+createdId))props.deleteProperty(k)});
    throw err;
  }finally{CURRENT_USER_=null;APP_SPREADSHEET_=null;lock.releaseLock();}
}
function deleteUser(id){
  requireAdmin_();
  const lock=LockService.getScriptLock();lock.waitLock(20000);
  try{
    const users=getUsers_(),u=users.find(x=>x.id===String(id));if(!u)throw new Error('המשתמש לא נמצא');
    // Trash first so a failed Drive operation does not silently lose the account.
    DriveApp.getFileById(u.ss).setTrashed(true);
    saveUsers_(users.filter(x=>x.id!==u.id));
    const props=PropertiesService.getScriptProperties();Object.keys(props.getProperties()).forEach(k=>{if(k.endsWith('_'+u.id))props.deleteProperty(k);});
    return getUsersInfo();
  }finally{lock.releaseLock()}
}

// v0.27: the personal questionnaire — profile and the goals computed from it.
// Model v2: rough starting estimate, with baseline movement and training duration separated.
// Baseline PAL values and net training energy are product estimates, not measured expenditure.
function calculateTargets_(input){
  const d=input||{},w=Number(d.weight),h=Number(d.height),a=Number(d.age),days=Number(d.days),minutes=Number(d.duration)||40;
  if(!['m','f'].includes(d.sex)||!(a>=10&&a<=100)||!(h>=120&&h<=230)||!(w>=30&&w<=300))throw new Error('בדוק מין, גיל, גובה ומשקל');
  if(!Number.isInteger(days)||days<0||days>6||![30,40,50].includes(minutes))throw new Error('בדוק את מספר האימונים ומשכם');
  if(!['desk','feet','physical'].includes(d.job)||!['lose','gain','recomp','maintain'].includes(d.goal)||!['slow','normal','fast'].includes(d.rate))throw new Error('בחר פעילות, מטרה וקצב');
  const male=d.sex==='m',bmi=w/((h/100)**2),bmr=10*w+6.25*h-5*a+(male?5:-161);
  const baselineFactor={desk:1.4,feet:1.6,physical:1.8}[d.job];
  const baseline=bmr*baselineFactor,exercise=(3.5-1)*w*(minutes/60)*days/7,tdee=baseline+exercise;
  const minor=a<18,underweight=bmi<18.5,medical=d.medical===true;
  let pct={lose:{slow:-.10,normal:-.15,fast:-.20},gain:{slow:.03,normal:.05,fast:.08},recomp:{slow:-.02,normal:-.05,fast:-.08},maintain:{slow:0,normal:0,fast:0}}[d.goal][d.rate];
  if((minor||underweight||medical)&&pct<0)pct=0;
  let change=tdee*pct;
  if(change<0)change=Math.max(change,d.goal==='recomp'?-200:-500);
  const floor=male?1500:1200,rawCal=tdee+change;
  const suggested=Math.round(Math.max(floor,rawCal)/10)*10;
  const cal=Math.round((suggested+(Number(d.adj)||0))/10)*10;
  const refW=bmi>=30?25*(h/100)**2:w,gkg={lose:2,recomp:2,gain:1.8,maintain:1.6}[d.goal];
  const prot=Math.round(refW*gkg+(Number(d.adjP)||0));
  const actualChange=cal-tdee,weeklyChange=actualChange*7/7700;
  return {model:'fitpro-targets-v2',bmi:Math.round(bmi*10)/10,bmiCat:bmi<18.5?'תת-משקל':bmi<25?'תקין':bmi<30?'עודף משקל':'השמנה',bmr:Math.round(bmr),baseline:Math.round(baseline),baselineFactor,exercise:Math.round(exercise),tdee:Math.round(tdee),suggested,cal,prot,gkg,minor,underweight,safeOnly:minor||underweight||medical,medical,pct:actualChange/tdee,change:Math.round(actualChange),weeklyChange:Math.round(weeklyChange*100)/100,floorApplied:rawCal<floor};
}

function saveProfile(payload){
  const p=payload||{},profile=p.profile||{},computed=calculateTargets_(profile),name=String(profile.name||'').trim();
  if(!name||name.length>40)throw new Error('כתוב שם עד 40 תווים');
  if(!['gym','home','mixed'].includes(profile.place))throw new Error('בחר מקום אימון');
  const calculated=p.targetMode==='calculated',cal=calculated?computed.cal:Math.round(Number(p.calorie_goal)),prot=calculated?computed.prot:Math.round(Number(p.protein_goal));
  if(!(cal>=1000&&cal<=6000))throw new Error('יעד קלוריות לא סביר');
  if(!(prot>=30&&prot<=400))throw new Error('יעד חלבון לא סביר');
  const stored={...profile,name,calculation:{...computed,targetMode:calculated?'calculated':'manual',selectedCalories:cal,selectedProtein:prot}};
  delete stored.medical;
  setSetting_('display_name',name);setSetting_('profile_json',JSON.stringify(stored));setSetting_('calorie_goal',cal);setSetting_('protein_goal',prot);
  setSetting_('free_calories_goal',Math.round(cal*.1/10)*10);
  return getBootstrapData();
}

// v0.27.2: foods you typed or corrected are kept in "המזונות שלי" and come first in search
function saveMyFoods(list){
  (Array.isArray(list)?list:[]).slice(0,30).forEach(x=>{
    const name=String(x&&x.name||'').trim(),amount=Number(x&&x.amount)||0;
    if(!name||!(amount>0)||![x.calories,x.protein,x.carbs,x.fat].some(v=>Number(v)>0))return;
    cacheFood_({name,baseQty:amount,unit:String(x.unit||'מנה'),sourceBaseUnit:String(x.unit||'מנה'),calories:Number(x.calories)||0,protein:Number(x.protein)||0,carbs:Number(x.carbs)||0,fat:Number(x.fat)||0,source:'הזנה ידנית',sourceId:String(x.sourceId||''),brand:String(x.brand||''),units:Array.isArray(x.units)?x.units:[]});
  });
  return getMyFoods_();
}

// ---------- v0.29: weekly progress photos (kept private in Drive; the app shows them through the server) ----------
function photosSheet_(){
  const ss=spreadsheet_();let sh=ss.getSheetByName('App_ProgressPhotos');
  if(!sh){sh=ss.insertSheet('App_ProgressPhotos');sh.getRange(1,1,1,9).setValues([['photo_id','date','pose','file_id','thumb_id','weight','note','created_at','deleted']]);}
  return sh;
}
function photosFolder_(){
  const props=PropertiesService.getScriptProperties(),key=userKey_('PHOTOS_FOLDER_ID');let f=null;
  const id=props.getProperty(key);if(id){try{f=DriveApp.getFolderById(id);if(f.isTrashed())f=null;}catch(e){f=null;}}
  if(!f){f=DriveApp.createFolder('FitPro — תמונות התקדמות'+(isAdmin_()?'':' — '+CURRENT_USER_.name));props.setProperty(key,f.getId());}
  return f;
}
function saveProgressPhoto(payload){
  const p=payload||{},date=String(p.date||''),pose=['front','side','back'].includes(p.pose)?p.pose:'front';
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new Error('תאריך לא תקין');
  const img=String(p.image||''),thumb=String(p.thumb||'');
  if(!/^[A-Za-z0-9+/=]+$/.test(img)||img.length<200||img.length>4000000)throw new Error('התמונה לא תקינה או גדולה מדי');
  const folder=photosFolder_(),file=folder.createFile(Utilities.newBlob(Utilities.base64Decode(img),'image/jpeg',date+'_'+pose+'.jpg'));
  let thumbId='';if(/^[A-Za-z0-9+/=]+$/.test(thumb)&&thumb.length>50){thumbId=folder.createFile(Utilities.newBlob(Utilities.base64Decode(thumb),'image/jpeg',date+'_'+pose+'_thumb.jpg')).getId();}
  const row=getHistory_(0).find(x=>x.date===date),weight=row&&row.weight!==''?row.weight:'';
  const id=Utilities.getUuid();photosSheet_().appendRow([id,date,pose,file.getId(),thumbId,weight,String(p.note||'').slice(0,200),new Date(),false]);
  return {id,date,pose};
}
function listProgressPhotos_(){
  return photosSheet_().getDataRange().getValues().slice(1).filter(r=>r[0]&&r[8]!==true).map(r=>({id:String(r[0]),date:formatDateValue_(r[1]),pose:String(r[2]),weight:r[5]===''?'':Number(r[5]),note:String(r[6]||''),thumbId:String(r[4]||''),fileId:String(r[3]||'')})).sort((a,b)=>b.date.localeCompare(a.date));
}
function getProgressPhotos(){
  return listProgressPhotos_().slice(0,40).map(x=>{let thumb='';try{if(x.thumbId)thumb=Utilities.base64Encode(DriveApp.getFileById(x.thumbId).getBlob().getBytes());}catch(e){}return {id:x.id,date:x.date,pose:x.pose,weight:x.weight,note:x.note,thumb};});
}
function getProgressPhoto(id){
  const x=listProgressPhotos_().find(p=>p.id===String(id));if(!x)throw new Error('התמונה לא נמצאה');
  return {id:x.id,date:x.date,pose:x.pose,weight:x.weight,image:Utilities.base64Encode(DriveApp.getFileById(x.fileId).getBlob().getBytes())};
}
function deleteProgressPhoto(id){
  const sh=photosSheet_(),rows=sh.getDataRange().getValues(),i=rows.findIndex((r,j)=>j>0&&String(r[0])===String(id));
  if(i<1)throw new Error('התמונה לא נמצאה');sh.getRange(i+1,9).setValue(true);
  trash_('photo',String(id),'תמונת התקדמות · '+formatDateValue_(rows[i][1]));return true;
}
function restoreProgressPhoto_(id){const sh=photosSheet_(),rows=sh.getDataRange().getValues(),i=rows.findIndex((r,j)=>j>0&&String(r[0])===String(id));if(i>0)sh.getRange(i+1,9).setValue(false);}

// ---------- v0.30: weekly check-in, weekly review and calorie-goal suggestions ----------
function addDays_(date,n){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10);}
function checkinsSheet_(){const ss=spreadsheet_();let sh=ss.getSheetByName('App_WeeklyCheckins');if(!sh){sh=ss.insertSheet('App_WeeklyCheckins');sh.getRange(1,1,1,4).setValues([['date','summary_json','applied_calories','created_at']]);}return sh;}
function weekStats_(start,end,history,settings){
  const days=history.filter(x=>x.date>=start&&x.date<=end),food=days.filter(x=>x.calories>0),pg=Number(settings.protein_goal)||130;
  const weights=days.filter(x=>x.weight!==''&&x.weight!=null).map(x=>Number(x.weight));
  return {start,end,loggedDays:food.length,avgCalories:food.length?Math.round(food.reduce((s,x)=>s+x.calories,0)/food.length):0,avgProtein:food.length?Math.round(food.reduce((s,x)=>s+x.protein,0)/food.length):0,proteinDays:food.filter(x=>x.protein>=pg*0.9).length,weighIns:weights.length,avgWeight:weights.length?Math.round(weights.reduce((s,x)=>s+x,0)/weights.length*10)/10:''};
}
function getWeeklyReview(endDate){
  const end=/^\d{4}-\d{2}-\d{2}$/.test(String(endDate||''))?String(endDate):getWorkingDate_(),start=addDays_(end,-6);
  const settings=getSettings_(),history=getHistory_(0),week=weekStats_(start,end,history,settings),prev=weekStats_(addDays_(start,-7),addDays_(start,-1),history,settings);
  const sets={},sessions=new Set();
  sheet_(APP.sheets.workouts).getDataRange().getValues().slice(1).forEach(r=>{if(!r[0]||r[11]===true)return;const d=formatDateValue_(r[2]);if(d<start||d>end)return;sets[String(r[4]||'אחר')]=(sets[String(r[4]||'אחר')]||0)+1;sessions.add(String(r[13]||d));});
  let waist='';sheet_(APP.sheets.measurements).getDataRange().getValues().slice(1).forEach(r=>{const d=formatDateValue_(r[0]);if(d>=start&&d<=end&&r[1]!=='')waist=Number(r[1]);});
  let photos=0;try{photos=listProgressPhotos_().filter(p=>p.date>=start&&p.date<=end).length;}catch(e){}
  const last=checkinsSheet_().getDataRange().getValues().slice(1).filter(r=>r[0]).map(r=>formatDateValue_(r[0])).sort().pop()||'';
  return {start,end,week,prev,weightChange:week.avgWeight!==''&&prev.avgWeight!==''?Math.round((week.avgWeight-prev.avgWeight)*10)/10:'',workouts:sessions.size,setsByMuscle:sets,waist,photos,calorieGoal:Number(settings.calorie_goal)||2200,proteinGoal:Number(settings.protein_goal)||130,suggestion:calorieSuggestion_(end,history,settings),lastCheckin:last,checkinDay:settings.checkin_day===''||settings.checkin_day==null?5:Number(settings.checkin_day)};
}
function calorieSuggestion_(end,history,settings){
  const start=addDays_(end,-13),days=history.filter(x=>x.date>=start&&x.date<=end),food=days.filter(x=>x.calories>0);
  const pts=days.filter(x=>x.weight!==''&&x.weight!=null).map(x=>({t:(new Date(x.date+'T12:00:00Z')-new Date(start+'T12:00:00Z'))/86400000,w:Number(x.weight)}));
  const current=Number(settings.calorie_goal)||2200;
  if(food.length<10||pts.length<4)return {ready:false,loggedDays:food.length,weighIns:pts.length,current,message:`צריך לפחות 10 ימי רישום אוכל ו-4 שקילות בשבועיים האחרונים (יש ${food.length} ימים ו-${pts.length} שקילות).`};
  const n=pts.length,mt=pts.reduce((s,p)=>s+p.t,0)/n,mw=pts.reduce((s,p)=>s+p.w,0)/n,den=pts.reduce((s,p)=>s+(p.t-mt)*(p.t-mt),0);
  const slope=den>0?pts.reduce((s,p)=>s+(p.t-mt)*(p.w-mw),0)/den:0,actualWeek=Math.round(slope*7*100)/100;
  const intake=Math.round(food.reduce((s,x)=>s+x.calories,0)/food.length),tdee=Math.round(intake-slope*7700);
  let profile={};try{profile=JSON.parse(settings.profile_json||'{}')}catch(e){}
  const goal=profile.goal||'maintain',w=mw;
  let planned=profile.calculation&&isFinite(profile.calculation.weeklyChange)?Number(profile.calculation.weeklyChange):({lose:-0.005,gain:0.0025,recomp:-0.002,maintain:0}[goal]||0)*w;
  if(goal==='maintain')planned=0;
  let target=tdee+planned*7700/7,delta=Math.round((target-current)/10)*10;
  const minor=Number(profile.age)<18,floor=profile.sex==='m'?1500:1200;
  if(minor&&delta<0)delta=0;
  delta=Math.max(-150,Math.min(150,delta));
  let suggested=Math.max(floor,current+delta);delta=suggested-current;
  const onTrack=Math.abs(delta)<60;
  return {ready:true,onTrack,current,suggested:onTrack?current:suggested,delta:onTrack?0:delta,intake,tdee,actualWeek,plannedWeek:Math.round(planned*100)/100,loggedDays:food.length,weighIns:n,goal};
}
function applyCalorieGoal(calories){
  const s=getSettings_(),current=Number(s.calorie_goal)||2200,cal=Math.round(Number(calories)/10)*10;
  if(!isFinite(cal)||Math.abs(cal-current)>160||cal<1200)throw new Error('יעד לא תקין');
  setSetting_('calorie_goal',cal);setSetting_('free_calories_goal',Math.round(cal*.1/10)*10);return getSettings_();
}
function saveWeeklyCheckin(payload){
  const p=payload||{},date=/^\d{4}-\d{2}-\d{2}$/.test(String(p.date||''))?String(p.date):getWorkingDate_();
  const review=getWeeklyReview(date);let applied='';
  if(p.applyCalories&&review.suggestion.ready&&!review.suggestion.onTrack){applyCalorieGoal(review.suggestion.suggested);applied=review.suggestion.suggested;}
  const sh=checkinsSheet_(),rows=sh.getDataRange().getValues(),i=rows.findIndex((r,j)=>j>0&&formatDateValue_(r[0])===date);
  const row=[date,JSON.stringify(review),applied,new Date()];
  if(i>0)sh.getRange(i+1,1,1,4).setValues([row]);else sh.appendRow(row);
  setSetting_('last_checkin','ci:'+date);
  return {review,applied,checkins:listWeeklyCheckins(),settings:getSettings_()};
}
function listWeeklyCheckins(){
  return checkinsSheet_().getDataRange().getValues().slice(1).filter(r=>r[0]).map(r=>{let x={};try{x=JSON.parse(r[1])}catch(e){}return {date:formatDateValue_(r[0]),applied:r[2]===''?'':Number(r[2]),week:x.week||{},weightChange:x.weightChange,workouts:x.workouts||0,setsByMuscle:x.setsByMuscle||{},waist:x.waist,photos:x.photos||0,calorieGoal:x.calorieGoal,proteinGoal:x.proteinGoal}}).sort((a,b)=>b.date.localeCompare(a.date)).slice(0,30);
}

// v0.30: everything of the current user, for an Excel backup made on the device
function getExportData(){
  const clean=v=>Object.prototype.toString.call(v)==='[object Date]'?Utilities.formatDate(v,APP.timezone,'yyyy-MM-dd HH:mm'):v;
  const take=(name,keep)=>{let sh=null;try{sh=spreadsheet_().getSheetByName(name)}catch(e){}if(!sh)return [];const v=sh.getDataRange().getValues();return v.filter((r,i)=>i===0||(r[0]!==''&&(!keep||keep(r)))).map(r=>r.map(clean));};
  return {sheets:{
    'יומן אוכל':take(APP.sheets.entries,r=>r[14]!==true),
    'סיכום יומי':take(APP.sheets.summary),
    'אימונים':take(APP.sheets.workouts,r=>r[11]!==true),
    'מדידות':take(APP.sheets.measurements),
    'צק-אין שבועי':take('App_WeeklyCheckins').map(r=>[r[0],r[2],r[3]]),
    'המזונות שלי':take(APP.sheets.foods,r=>r[13]!==false),
    'תמונות':take('App_ProgressPhotos',r=>r[8]!==true).map(r=>[r[1],r[2],r[5],r[6]])
  },name:CURRENT_USER_?CURRENT_USER_.name:'',created:Utilities.formatDate(new Date(),APP.timezone,'yyyy-MM-dd')};
}

// v0.30.1: removes exercises that were saved more than once in the same workout (double taps). Removed ones go to "נמחקו".
function cleanupDuplicateWorkouts(){
  const sh=sheet_(APP.sheets.workouts),rows=sh.getDataRange().getValues(),byWorkout={};
  rows.forEach((r,i)=>{if(i<1||!r[0]||r[11]===true)return;(byWorkout[String(r[1])]=byWorkout[String(r[1])]||{id:String(r[1]),session:String(r[13]),ex:String(r[12]||r[5]),name:String(r[5]),date:formatDateValue_(r[2]),t:r[3] instanceof Date?r[3].getTime():0,rows:[]}).rows.push({i,set:Number(r[6]),w:r[7],reps:r[8],side:r[18]||'',note:r[16]||''});});
  const groups={};Object.values(byWorkout).forEach(w=>{w.sig=w.rows.sort((a,b)=>a.set-b.set).map(x=>[x.w,x.reps,x.side,x.note].join(':')).join('|');(groups[w.session+'|'+w.ex+'|'+w.sig]=groups[w.session+'|'+w.ex+'|'+w.sig]||[]).push(w);});
  let removed=0;const toDelete=[];
  Object.values(groups).forEach(list=>{if(list.length<2)return;list.sort((a,b)=>a.t-b.t);const keep=list[0];list.slice(1).forEach(w=>{if(!keep.t||!w.t||Math.abs(w.t-keep.t)<=180000){toDelete.push(w);}});});
  toDelete.forEach(w=>{w.rows.forEach(x=>sh.getRange(x.i+1,12).setValue(true));trash_('workout',w.id,'כפילות · '+w.name+' · '+w.date);removed++;});
  return {removed,workout:getWorkoutData_()};
}

function whoAmI(){return {name:CURRENT_USER_?CURRENT_USER_.name:'',admin:isAdmin_()};}

function setApiPassword(password){
  requireAdmin_();
  const p=String(password||'');
  if(p.length<6)throw new Error('הסיסמה חייבת להיות לפחות 6 תווים');
  PropertiesService.getScriptProperties().setProperty('API_PASSWORD_HASH',hashPassword_(p));
  return getApiInfo();
}

function getApiInfo(){
  if(!isAdmin_())return {url:'',hasPassword:true,version:APP.version,admin:false};
  let url='';try{url=ScriptApp.getService().getUrl()||'';}catch(e){}
  return {url,hasPassword:!!PropertiesService.getScriptProperties().getProperty('API_PASSWORD_HASH'),version:APP.version};
}

// ---------- v0.24: "נמחקו לאחרונה" — every deletion is kept 4 days and can be restored ----------
const TRASH_DAYS=4;
function trashSheet_(){
  const ss=spreadsheet_();let sh=ss.getSheetByName('App_Trash');
  if(!sh){sh=ss.insertSheet('App_Trash');sh.getRange(1,1,1,6).setValues([['trash_id','kind','ref','label','deleted_at','payload']]);try{sh.hideSheet()}catch(e){}}
  return sh;
}
function trash_(kind,ref,label,payload){
  try{const sh=trashSheet_();sh.appendRow([Utilities.getUuid(),String(kind),String(ref),String(label||'').slice(0,120),new Date(),payload?JSON.stringify(payload):'']);}catch(e){}
}
function untrash_(kind,ref){
  try{const sh=trashSheet_(),rows=sh.getDataRange().getValues();for(let i=rows.length-1;i>0;i--)if(String(rows[i][1])===String(kind)&&String(rows[i][2])===String(ref))sh.deleteRow(i+1);}catch(e){}
}
function getTrash(){
  const sh=trashSheet_(),rows=sh.getDataRange().getValues(),limit=Date.now()-TRASH_DAYS*86400000,out=[];
  for(let i=rows.length-1;i>0;i--){const r=rows[i];if(!r[0])continue;const at=new Date(r[4]).getTime();if(!(at>=limit)){sh.deleteRow(i+1);continue;}out.push({id:String(r[0]),kind:String(r[1]),label:String(r[3]),at:Utilities.formatDate(new Date(at),APP.timezone,'yyyy-MM-dd HH:mm')});}
  return out;
}
function findTrash_(id){const sh=trashSheet_(),rows=sh.getDataRange().getValues();const i=rows.findIndex((r,j)=>j>0&&String(r[0])===String(id));if(i<1)throw new Error('הפריט כבר לא נמצא בנמחקים');return {sh,row:i+1,kind:String(rows[i][1]),ref:String(rows[i][2]),payload:rows[i][5]?JSON.parse(rows[i][5]):null};}
function restoreTrashItem(id){
  const t=findTrash_(id);
  switch(t.kind){
    case 'entry':setEntryDeleted_(t.ref,false);break;
    case 'entries':case 'day':restoreEntries(t.payload.ids);break;
    case 'group':restoreMealGroup(t.ref);break;
    case 'meal':restoreCustomMeal(t.ref);break;
    case 'builtin':restoreMeal(t.ref);break;
    case 'workout':restoreWorkout(t.ref);break;
    case 'session':restoreWorkoutSession_({id:t.ref,workoutIds:t.payload.workoutIds||[]});break;
    case 'plan':restoreWorkoutPlan(t.ref);break;
    case 'exercise':restoreExercise(t.ref);break;
    case 'video':restoreWorkoutVideo(t.ref);break;
    case 'measure':restoreMeasureRows_(t.payload);break;
    case 'quick':saveQuickAction(t.payload);break;
    case 'photo':restoreProgressPhoto_(t.ref);break;
    default:throw new Error('סוג לא מוכר');
  }
  untrash_(t.kind,t.ref);
  try{t.sh.getDataRange();const again=t.sh.getDataRange().getValues().findIndex((r,j)=>j>0&&String(r[0])===String(id));if(again>0)t.sh.deleteRow(again+1);}catch(e){}
  return getTrash();
}
function purgeTrashItem(id){const t=findTrash_(id);t.sh.deleteRow(t.row);return getTrash();}
function emptyTrash(){const sh=trashSheet_(),n=sh.getLastRow();if(n>1)sh.deleteRows(2,n-1);return [];}

function setupApp() {
  ensureStructure_();
  seedDefaults_();
  backfillMealMacros_();
  installDailyTrigger_();
  return getBootstrapData();
}

function getBootstrapData(requestedDate) {
  ensureStructure_();
  seedDefaults_();
  const settings = getSettings_();
  const date = requestedDate || getWorkingDateFromSettings_(settings);
  const entries = getEntriesForDate_(date);
  const allMeals=getMealOptions_(true);
  const meals={};Object.keys(allMeals).forEach(k=>meals[k]=allMeals[k].filter(x=>!x.hidden));
  const workoutData=getWorkoutData_();
  return {
    date,
    settings,
    meals,
    hiddenMeals:Object.values(allMeals).flat().filter(x=>x.hidden).map(hiddenMealSummary_),
    quickActions:getQuickActions_(),
    entries,
    totals:calculateTotalsFromEntries_(entries,settings,date),
    bank:getBankState_(settings),
    health:getHealth_(21),
    history: getHistory_(30),
    recentFoods: getRecentFoods_(12),
    workout: workoutData,
    process: getProcessData_(workoutData.history),
    myFoods: getMyFoods_(),
    tzameret: getTzameretStatus_(),
    me: {name:CURRENT_USER_?CURRENT_USER_.name:'',admin:isAdmin_()}
  };
}

function saveMeal(payload) {
  if (!payload || !payload.category || !payload.option) throw new Error('חסרה בחירת ארוחה');
  const date = payload.date || getWorkingDate_();
  const all = getMealOptions_();
  const meal = (all[payload.category] || []).find(x => payload.mealId ? String(x.id) === String(payload.mealId) : String(x.option) === String(payload.option));
  if (!meal) throw new Error('הארוחה שנבחרה לא נמצאה');
  const groupId = Utilities.getUuid();
  const overrides = payload.overrides || {};
  const now = new Date();
  const rows = meal.ingredients.map((item, index) => {
    const raw = Object.prototype.hasOwnProperty.call(overrides, index) ? overrides[index] : item.amount;
    const amount = Math.max(0, Number(raw) || 0);
    const ratio = item.amount ? amount / item.amount : 0;
    return [
      Utilities.getUuid(), date, now, payload.category, 'meal', meal.title || String(payload.option), item.name,
      amount, item.unit, round1_(item.calories * ratio), round1_(item.protein * ratio),
      round1_((item.carbs || 0) * ratio), round1_((item.fat || 0) * ratio),
      'מאגר הארוחות', false, payload.notes || '', groupId
    ];
  }).filter(r => r[7] > 0);
  if (!rows.length) throw new Error('כל מרכיבי הארוחה הוסרו');
  const extraOil=extraOilRow_(payload,date,groupId,payload.category,meal.title||String(payload.option));if(extraOil)rows.push(extraOil);
  appendRows_(APP.sheets.entries, rows);
  touchDay_(date);
  return getDayData_(date);
}

function extraOilRow_(payload,date,groupId,category,title){
  const g=Number(payload&&payload.oilGrams);if(!Number.isFinite(g)||g<=0)return null;
  return [Utilities.getUuid(),date,new Date(),category||'נוסף','food',title||'','שמן נוסף',round1_(g),'גרם',round1_(g*9),0,0,round1_(g),'תוספת שמן',false,'תוספת שנבחרה במפורש; ערכי המזון המקורי נשמרו',groupId];
}

function saveFood(payload) {
  if (!payload || !String(payload.name || '').trim()) throw new Error('יש להזין שם מזון');
  const date = payload.date || getWorkingDate_();
  const amount = Math.max(0, Number(payload.amount) || 0);
  if (!amount) throw new Error('יש להזין כמות גדולה מאפס');
  const baseQty = Math.max(0.0001, Number(payload.baseQty) || 100);
  const unit=String(payload.unit||'גרם');
  const sourceUnit=String(payload.sourceBaseUnit||unit);
  const gramsPerUnit=Number(payload.gramsPerUnit);
  const listUnit=['יחידה','פרוסה','מנה','פחית'].indexOf(unit)>=0;
  // v0.16: any household unit (כף, כוס, יחידה בינונית...) converts through its known weight in grams.
  const mass=sourceUnit==='גרם'&&unit!=='גרם'&&(gramsPerUnit>0||listUnit) ? amount*(gramsPerUnit>0?gramsPerUnit:estimatedUnitGrams_(payload.name,unit)) : amount;
  const ratio = mass / baseQty;
  const row = [
    Utilities.getUuid(), date, new Date(), payload.category || 'נוסף', payload.sourceType || 'food', '',
    String(payload.name).trim(), amount, payload.unit || 'גרם',
    round1_((Number(payload.calories) || 0) * ratio), round1_((Number(payload.protein) || 0) * ratio),
    round1_((Number(payload.carbs) || 0) * ratio), round1_((Number(payload.fat) || 0) * ratio),
    payload.source || 'הזנה ידנית', false, payload.notes || '', Utilities.getUuid()
  ];
  const extraOil=extraOilRow_(payload,date,row[16],row[3],'');
  appendRows_(APP.sheets.entries, extraOil?[row,extraOil]:[row]);
  if (!/צמרת/.test(String(payload.source||''))) cacheFood_(payload);
  touchDay_(date);
  return getDayData_(date);
}

function saveDishEntries(payload) {
  const date=String(payload&&payload.date||getWorkingDate_());
  const name=String(payload&&payload.name||'').trim();
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!name)throw new Error('חסרים שם המנה או התאריך');
  const items=payload.items||[];
  if(!Array.isArray(items)||!items.length||items.length>16)throw new Error('יש לבחור בין רכיב אחד ל־16 רכיבים');
  const rows=items.map(item=>{
    const label=String(item.label||'').trim();
    const amount=Number(item.amount),calories=Number(item.calories),protein=Number(item.protein),carbs=Number(item.carbs),fat=Number(item.fat);
    if(!label||!Number.isFinite(amount)||amount<=0||![calories,protein,carbs,fat].every(n=>Number.isFinite(n)&&n>=0)||
      calories+protein+carbs+fat<=0)throw new Error('יש לבדוק כמות וערכים של '+(label||'רכיב ללא שם'));
    return {label,amount,unit:String(item.unit||'גרם'),calories,protein,carbs,fat,source:String(item.source||'אומדן מנה'),notes:String(item.notes||'')};
  });
  const id=Utilities.getUuid(),now=new Date();
  appendRows_(APP.sheets.entries,rows.map(x=>[Utilities.getUuid(),date,now,'נוסף','dish',name,x.label,x.amount,x.unit,
    round1_(x.calories),round1_(x.protein),round1_(x.carbs),round1_(x.fat),x.source,false,x.notes,id]));
  if(payload.savePermanent!==false)saveDishAsMeal_(name,rows,payload.category||'צהריים');
  rows.forEach(x=>cacheFood_({name:x.label,baseQty:x.amount,unit:x.unit,sourceBaseUnit:x.unit,
    calories:x.calories,protein:x.protein,carbs:x.carbs,fat:x.fat}));
  touchDay_(date);
  return getDayData_(date);
}

function saveDishAsMeal_(name,ingredients,category){
  const selected=['בוקר','צהריים','ערב'].includes(category)?category:'צהריים';
  const sh=sheet_(APP.sheets.meals),values=sh.getDataRange().getValues();
  const existing=values.findIndex((r,i)=>i>0&&r[12]!==false&&r[0]===selected&&String(r[10])===name&&r[13]);
  if(existing>=0)return; // Keep the saved recipe; edit it from the meals screen if needed.
  const id=Utilities.getUuid();
  appendRows_(APP.sheets.meals,ingredients.map((x,i)=>[selected,'אישי',i+1,x.label,x.amount,x.unit,round1_(x.calories),round1_(x.protein),round1_(x.carbs),round1_(x.fat),name,'אישי',true,id]));
}

function saveCustomMeal(payload) {
  if (!payload || ['בוקר','צהריים','ערב'].indexOf(String(payload.category)) < 0) throw new Error('יש לבחור קטגוריית ארוחה');
  const name=String(payload.name||'').trim();
  if (!name) throw new Error('יש להזין שם לארוחה');
  const ingredients=(payload.ingredients||[]).filter(x=>String(x.name||'').trim() && Number(x.amount)>0);
  if (!ingredients.length) throw new Error('יש להוסיף לפחות מרכיב אחד');
  const savePermanent=payload.savePermanent===true || !!payload.mealId;
  const addToToday=payload.addToToday===true;
  if(!savePermanent&&!addToToday)throw new Error('בחר הוספה להיום או שמירה כארוחה קבועה');
  const missing=ingredients.find(x=>![x.calories,x.protein,x.carbs,x.fat].some(v=>Number(v)>0));
  if(missing)throw new Error('חסרים ערכים תזונתיים עבור '+String(missing.name)+'. בחר תוצאה מהמאגר או הזן ערכים.');
  const date=payload.date||getWorkingDate_();
  if(savePermanent){
    const sh=sheet_(APP.sheets.meals),values=sh.getDataRange().getValues();
    const oldId=String(payload.mealId||''),mealId=oldId||Utilities.getUuid();
    const rows=ingredients.map((x,i)=>[
      String(payload.category), 'אישי', i+1, String(x.name).trim(), Math.max(0,Number(x.amount)||0), String(x.unit||'גרם'),
      round1_(Number(x.calories)||0), round1_(Number(x.protein)||0), round1_(Number(x.carbs)||0), round1_(Number(x.fat)||0),
      name, 'אישי', true, mealId
    ]);
    appendRows_(APP.sheets.meals,rows);
    if(oldId){for(let i=1;i<values.length;i++)if(String(values[i][13]||'')===oldId && values[i][12]!==false)sh.getRange(i+1,13).setValue(false);}
  }
  if(addToToday){
    const groupId=Utilities.getUuid(),now=new Date();
    const rows=ingredients.map(x=>[Utilities.getUuid(),date,now,String(payload.category),'meal',name,String(x.name).trim(),Number(x.amount)||0,String(x.unit||'גרם'),round1_(Number(x.calories)||0),round1_(Number(x.protein)||0),round1_(Number(x.carbs)||0),round1_(Number(x.fat)||0),savePermanent?'ארוחה אישית':'ארוחה חד-פעמית',false,'',groupId]);
    appendRows_(APP.sheets.entries,rows); touchDay_(date);
  }
  return getBootstrapData(date);
}

function deleteCustomMeal(mealId, date) {
  const id=String(mealId||''); if(!id)throw new Error('הארוחה לא נמצאה');
  const sh=sheet_(APP.sheets.meals),values=sh.getDataRange().getValues(); let changed=false;
  let title='';for(let i=1;i<values.length;i++)if(String(values[i][13]||'')===id && values[i][12]!==false){sh.getRange(i+1,13).setValue(false);changed=true;title=title||String(values[i][10]||'');}
  if(!changed)throw new Error('הארוחה לא נמצאה');
  trash_('meal',id,'ארוחה קבועה · '+title);
  return {meals:getMealOptions_(),hiddenMeals:getHiddenMealSummaries_()};
}

// v0.27.1: several meals at once (your own and the built-in ones)
function deleteMeals(payload){
  const custom=new Set((payload&&payload.custom||[]).map(String)),builtin=(payload&&payload.builtin||[]).map(String);
  if(custom.size){const sh=sheet_(APP.sheets.meals),values=sh.getDataRange().getValues(),titles={};
    for(let i=1;i<values.length;i++){const id=String(values[i][13]||'');if(id&&custom.has(id)&&values[i][12]!==false){sh.getRange(i+1,13).setValue(false);titles[id]=titles[id]||String(values[i][10]||'')}}
    Object.keys(titles).forEach(id=>trash_('meal',id,'ארוחה קבועה · '+titles[id]));}
  if(builtin.length){const hidden=getHiddenMealKeys_();builtin.forEach(k=>{if(hidden.indexOf(k)<0){hidden.push(k);trash_('builtin',k,'ארוחה · '+k.replace('|',' '))}});PropertiesService.getScriptProperties().setProperty(userKey_('HIDDEN_MEALS'),JSON.stringify(hidden));}
  return {meals:getMealOptions_(),hiddenMeals:getHiddenMealSummaries_()};
}

function restoreCustomMeal(mealId, date) {
  untrash_('meal',mealId);
  const id=String(mealId||''),sh=sheet_(APP.sheets.meals),values=sh.getDataRange().getValues();let changed=false;
  for(let i=1;i<values.length;i++)if(String(values[i][13]||'')===id&&values[i][12]===false){sh.getRange(i+1,13).setValue(true);changed=true;}
  if(!changed)throw new Error('הארוחה לא נמצאה');
  return getBootstrapData(date||getWorkingDate_());
}

function addProteinShake(date) {
  const s = getSettings_();
  return saveFood({date: date || getWorkingDate_(), category:'שייק', sourceType:'quick', name:'שייק חלבון', amount:1, baseQty:1, unit:'מנה',
    calories:Number(s.shake_calories)||140, protein:Number(s.shake_protein)||25,
    carbs:Number(s.shake_carbs)||0, fat:Number(s.shake_fat)||0, source:'הגדרה אישית'});
}

function addFreeCalories(payload) {
  const calories = Math.max(0, Number(payload && payload.calories) || 0);
  const protein=Math.max(0,Number(payload&&payload.protein)||0),carbs=Math.max(0,Number(payload&&payload.carbs)||0),fat=Math.max(0,Number(payload&&payload.fat)||0);
  if (!calories&&!protein&&!carbs&&!fat) throw new Error('יש להזין לפחות ערך אחד');
  return saveFood({date:(payload && payload.date) || getWorkingDate_(), category:'חופשי', sourceType:'free', name:(payload && payload.name) || 'קלוריות חופשיות', amount:1, baseQty:1, unit:'מנה', calories,
    protein, carbs, fat, source:'הזנה חופשית'});
}

function updateEntry(payload) {
  if (!payload || !payload.entryId) throw new Error('חסר מזהה פריט');
  const sh = sheet_(APP.sheets.entries);
  const values = sh.getDataRange().getValues();
  const idx = values.findIndex((r, i) => i > 0 && String(r[0]) === String(payload.entryId));
  if (idx < 1) throw new Error('הפריט לא נמצא');
  const row = values[idx];
  const oldAmount = Number(row[7]) || 0;
  const amount = Math.max(0, Number(payload.amount));
  if (!Number.isFinite(amount)) throw new Error('כמות לא תקינה');
  const ratio = oldAmount ? amount / oldAmount : 0;
  row[7] = amount;
  row[9] = round1_((Number(row[9]) || 0) * ratio);
  row[10] = round1_((Number(row[10]) || 0) * ratio);
  row[11] = round1_((Number(row[11]) || 0) * ratio);
  row[12] = round1_((Number(row[12]) || 0) * ratio);
  row[14] = amount === 0;
  sh.getRange(idx + 1, 1, 1, APP.entryHeaders.length).setValues([row.slice(0, APP.entryHeaders.length)]);
  touchDay_(formatDateValue_(row[1]));
  return getDayData_(formatDateValue_(row[1]));
}

// v0.19: full edit of a logged item (amount, unit and values computed on the device).
function editEntry(payload){
  if(!payload||!payload.entryId)throw new Error('חסר מזהה פריט');
  const sh=sheet_(APP.sheets.entries),values=sh.getDataRange().getValues();
  const idx=values.findIndex((r,i)=>i>0&&String(r[0])===String(payload.entryId));
  if(idx<1)throw new Error('הפריט לא נמצא');
  const amount=Number(payload.amount);
  if(!(amount>0))throw new Error('כמות לא תקינה');
  const row=values[idx].slice(0,APP.entryHeaders.length);
  row[7]=amount;row[8]=String(payload.unit||row[8]||'');
  ['calories','protein','carbs','fat'].forEach((k,j)=>{const v=Number(payload[k]);row[9+j]=round1_(Number.isFinite(v)&&v>=0?v:0);});
  row[14]=false;
  sh.getRange(idx+1,1,1,row.length).setValues([row]);
  const date=formatDateValue_(row[1]);touchDay_(date);return getDayData_(date);
}

// v0.19: several items eaten together become one meal; "בטל" restores them as they were.
function groupEntries(payload){
  const ids=new Set((payload&&payload.ids||[]).map(String));
  const name=String(payload&&payload.name||'').trim().slice(0,60),category=String(payload&&payload.category||'').trim();
  if(ids.size<2)throw new Error('בחר לפחות שני פריטים');
  if(!name)throw new Error('יש לתת שם לארוחה');
  const sh=sheet_(APP.sheets.entries),values=sh.getDataRange().getValues(),groupId=Utilities.getUuid(),prev=[];let date='';
  for(let i=1;i<values.length;i++){
    const r=values[i];if(!ids.has(String(r[0]))||r[14]===true)continue;
    prev.push({id:String(r[0]),category:r[3],sourceType:r[4],mealOption:r[5],groupId:r[16]||''});
    r[3]=category||r[3];r[4]='meal';r[5]=name;r[16]=groupId;
    sh.getRange(i+1,4,1,3).setValues([[r[3],'meal',name]]);sh.getRange(i+1,17).setValue(groupId);
    date=formatDateValue_(r[1]);
  }
  if(prev.length<2)throw new Error(prev.length?'רק פריט אחד מהבחירה נמצא בשרת. רענן את היום ונסה שוב':'הפריטים לא נמצאו בשרת. רענן את היום ונסה שוב');
  // v0.33.4: the same food twice in the new meal becomes one line with the amounts added up.
  const merged=mergeDuplicateRows_(sh,values,date,groupId);
  touchDay_(date);
  return {groupId,prev:prev.concat(merged.prev),merged:merged.names,day:getDayData_(date)};
}
// v0.33.4: the same food, in the same unit, twice in the same meal (or loose in the same section of the day) is combined into one line.
function mergeDuplicateRows_(sh,values,date,onlyGroup){
  const sec=c=>['בוקר','צהריים','ערב'].indexOf(String(c))>=0?String(c):'נוספים';
  const snap=r=>({id:String(r[0]),amount:r[7],calories:r[9],protein:r[10],carbs:r[11],fat:r[12],deleted:r[14]===true});
  const buckets={},prev=[],names=[];
  for(let i=1;i<values.length;i++){
    const r=values[i];if(!r[0]||r[14]===true||formatDateValue_(r[1])!==date)continue;
    const g=String(r[16]||'');if(onlyGroup&&g!==onlyGroup)continue;
    const key=(g?'g:'+g:'c:'+sec(r[3]))+'|'+normalize_(r[6])+'|'+String(r[8]||'');
    (buckets[key]||(buckets[key]=[])).push(i);
  }
  Object.keys(buckets).forEach(k=>{const rows=buckets[k];if(rows.length<2)return;const keep=values[rows[0]];
    prev.push(snap(keep));
    [7,9,10,11,12].forEach(col=>{keep[col]=round1_(rows.reduce((s,i)=>s+(Number(values[i][col])||0),0));});
    sh.getRange(rows[0]+1,8,1,6).setValues([[keep[7],keep[8],keep[9],keep[10],keep[11],keep[12]]]);
    rows.slice(1).forEach(i=>{prev.push(snap(values[i]));values[i][14]=true;sh.getRange(i+1,15).setValue(true);});
    names.push(String(keep[6]));
  });
  return {prev,names};
}
function mergeDuplicateEntries(payload){
  const date=String(payload&&payload.date||'');if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new Error('תאריך לא תקין');
  const sh=sheet_(APP.sheets.entries),values=sh.getDataRange().getValues(),m=mergeDuplicateRows_(sh,values,date,'');
  if(m.names.length)touchDay_(date);
  return {prev:m.prev,merged:m.names,day:getDayData_(date)};
}
// 2.6.10: move logged items (or whole meals) to another part of the day, and rename a logged meal.
function moveEntries(payload){
  const ids=new Set((payload&&payload.ids||[]).map(String)),cat=String(payload&&payload.category||'');
  if(!ids.size)throw new Error('לא נבחרו פריטים');
  if(['בוקר','צהריים','ערב','נוסף'].indexOf(cat)<0)throw new Error('בחר בוקר, צהריים, ערב או נוספים');
  const sh=sheet_(APP.sheets.entries),values=sh.getDataRange().getValues();let date='';
  for(let i=1;i<values.length;i++){const r=values[i];if(!ids.has(String(r[0]))||r[14]===true)continue;sh.getRange(i+1,4).setValue(cat);date=formatDateValue_(r[1]);}
  if(!date)throw new Error('הפריטים לא נמצאו. רענן ונסה שוב');
  touchDay_(date);return getDayData_(date);
}
function renameMealGroup(payload){
  const gid=String(payload&&payload.groupId||''),name=String(payload&&payload.name||'').trim().slice(0,60);
  if(!gid||!name)throw new Error('חסר שם לארוחה');
  const sh=sheet_(APP.sheets.entries),values=sh.getDataRange().getValues();let date='';
  for(let i=1;i<values.length;i++){const r=values[i];if(String(r[16]||'')!==gid||r[14]===true)continue;sh.getRange(i+1,6).setValue(name);if(r[4]!=='meal'&&r[4]!=='dish')sh.getRange(i+1,5).setValue('meal');date=formatDateValue_(r[1]);}
  if(!date)throw new Error('הארוחה לא נמצאה. רענן ונסה שוב');
  touchDay_(date);return getDayData_(date);
}
function ungroupEntries(prev){
  // Undo for grouping and merging: the first snapshot of a row wins, later ones only add the missing fields.
  const map={};(prev||[]).forEach(p=>{const id=String(p.id);map[id]=Object.assign({},p,map[id]||{});});
  const sh=sheet_(APP.sheets.entries),values=sh.getDataRange().getValues();let date='';
  for(let i=1;i<values.length;i++){const p=map[String(values[i][0])];if(!p)continue;
    if('category' in p)sh.getRange(i+1,4,1,3).setValues([[p.category,p.sourceType,p.mealOption]]);
    if('groupId' in p)sh.getRange(i+1,17).setValue(p.groupId);
    if('amount' in p){sh.getRange(i+1,8).setValue(p.amount);sh.getRange(i+1,10,1,4).setValues([[p.calories,p.protein,p.carbs,p.fat]]);}
    if('deleted' in p)sh.getRange(i+1,15).setValue(p.deleted===true);
    date=formatDateValue_(values[i][1]);}
  if(!date)throw new Error('הפריטים לא נמצאו');
  touchDay_(date);return getDayData_(date);
}
function deleteEntries(ids){
  const set=new Set((ids||[]).map(String)),sh=sheet_(APP.sheets.entries),values=sh.getDataRange().getValues(),done=[];let date='';
  for(let i=1;i<values.length;i++)if(set.has(String(values[i][0]))&&values[i][14]!==true){sh.getRange(i+1,15).setValue(true);done.push(String(values[i][0]));date=formatDateValue_(values[i][1]);}
  if(!done.length)throw new Error('לא נמצאו פריטים');
  trash_('entries',done[0],done.length+' פריטי אוכל · '+date,{ids:done});
  touchDay_(date);return {ids:done,day:getDayData_(date)};
}


function deleteEntry(entryId) {
  return setEntryDeleted_(entryId, true);
}

function restoreEntry(entryId) {
  return setEntryDeleted_(entryId, false);
}

// v0.16: deleting only flags the row, so "בטל" can bring it back with the same amounts.
function setEntryDeleted_(entryId, deleted) {
  const sh = sheet_(APP.sheets.entries);
  const values = sh.getDataRange().getValues();
  const idx = values.findIndex((r, i) => i > 0 && String(r[0]) === String(entryId));
  if (idx < 1) throw new Error('הפריט לא נמצא');
  sh.getRange(idx + 1, 15).setValue(deleted);
  const date = formatDateValue_(values[idx][1]);
  if(deleted)trash_('entry',entryId,String(values[idx][6])+' · '+date);else untrash_('entry',entryId);
  touchDay_(date);
  return getDayData_(date);
}

// v0.17: delete all food of one day; weight and measurements are kept.
function deleteDay(date){
  const ids=deleteDay_(date);
  return {ids,day:getDayData_(String(date))};
}

// v0.18.1: several days at once; the ids let "בטל" bring every entry back.
function deleteDays(dates){
  const list=(dates||[]).map(String).filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d));
  if(!list.length)throw new Error('לא נבחרו ימים');
  let ids=[];list.forEach(d=>{try{ids=ids.concat(deleteDay_(d));}catch(e){}});
  return {ids,history:getHistory_(60)};
}

function deleteDay_(date){
  date=String(date||'');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new Error('תאריך לא תקין');
  const sh=sheet_(APP.sheets.entries),values=sh.getDataRange().getValues(),ids=[];
  for(let i=1;i<values.length;i++)if(values[i][0]&&values[i][14]!==true&&formatDateValue_(values[i][1])===date){sh.getRange(i+1,15).setValue(true);ids.push(String(values[i][0]));}
  const summary=sheet_(APP.sheets.summary),sv=summary.getDataRange().getValues();
  const ix=sv.findIndex((r,i)=>i>0&&formatDateValue_(r[0])===date);
  if(!ids.length&&ix<1)throw new Error('אין מה למחוק ביום הזה');
  if(ids.length)trash_('day',date,'יום '+date+' · '+ids.length+' פריטים',{ids});
  if(ix>0){
    const same=[];sv.forEach((r,i)=>{if(i>0&&formatDateValue_(r[0])===date)same.push(i)});
    const keep=same.find(i=>sv[i][5]!==''||sv[i][6]!==''||String(sv[i][7]||''));
    for(let k=same.length-1;k>=0;k--)if(same[k]!==keep)summary.deleteRow(same[k]+1);
    if(keep)touchDay_(date);
  }
  return ids;
}

function restoreEntries(ids){
  try{const want=new Set((ids||[]).map(String)),sh=trashSheet_(),rows=sh.getDataRange().getValues();for(let i=rows.length-1;i>0;i--){if(!/^(day|entries)$/.test(String(rows[i][1])))continue;let p=null;try{p=JSON.parse(rows[i][5])}catch(e){}if(p&&p.ids&&p.ids.some(x=>want.has(String(x))))sh.deleteRow(i+1);}}catch(e){}
  const set=new Set((ids||[]).map(String)),sh=sheet_(APP.sheets.entries),values=sh.getDataRange().getValues(),dates=new Set();
  for(let i=1;i<values.length;i++)if(set.has(String(values[i][0]))&&values[i][14]===true){sh.getRange(i+1,15).setValue(false);dates.add(formatDateValue_(values[i][1]));}
  if(!dates.size)throw new Error('לא נמצא מה להחזיר');
  dates.forEach(touchDay_);
  return getDayData_([...dates][0]);
}

function restoreMealGroup(groupId) {
  untrash_('group',groupId);
  const sh = sheet_(APP.sheets.entries);
  const values = sh.getDataRange().getValues();
  let date = '';
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][16]) === String(groupId) && values[i][14] === true) {
      sh.getRange(i + 1, 15).setValue(false);
      date = formatDateValue_(values[i][1]);
    }
  }
  if (!date) throw new Error('הארוחה לא נמצאה');
  touchDay_(date);
  return getDayData_(date);
}

function deleteMealGroup(groupId) {
  const sh = sheet_(APP.sheets.entries);
  const values = sh.getDataRange().getValues();
  let date = '';
  let changed = false;
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][16]) === String(groupId) && values[i][14] !== true) {
      sh.getRange(i + 1, 15).setValue(true);
      date = formatDateValue_(values[i][1]);
      changed = true;
    }
  }
  if (!changed) throw new Error('הארוחה לא נמצאה');
  trash_('group',groupId,'ארוחה · '+date);
  touchDay_(date);
  return getDayData_(date);
}

function saveDailyMetrics(payload) {
  const date = (payload && payload.date) || getWorkingDate_();
  const totals = calculateTotals_(date);
  upsertSummary_({
    date,
    calories:totals.calories,
    protein:totals.protein,
    carbs:totals.carbs,
    fat:totals.fat,
    weight:nullableNumber_(payload.weight),
    bodyFat:nullableNumber_(payload.bodyFat),
    note:String(payload.note || ''),
    status:'פתוח'
  }, true);
  return getDayData_(date);
}

// The existing daily summary remains the source for body weight.
// Weekly circumferences are stored separately to preserve all prior entries.
function saveProcessCheckin(payload) {
  if (!payload) throw new Error('חסרים נתונים');
  const date=String(payload.date||'');
  const parsed=new Date(date+'T12:00:00');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||isNaN(parsed.getTime())||parsed.toISOString().slice(0,10)!==date)throw new Error('תאריך לא תקין');
  const today=Utilities.formatDate(new Date(),APP.timezone,'yyyy-MM-dd');
  if(date>today)throw new Error('אי אפשר לשמור מדידה עתידית');
  const values={};
  ['weight','waist','arm','chest','thigh'].forEach(k=>{
    const raw=payload[k],n=raw===''||raw==null?'':Number(raw);
    if(n!==''&&(!isFinite(n)||n<=0||n>(k==='weight'?350:300)))throw new Error('בדוק את הערך של '+k);
    values[k]=n;
  });
  const bloating=payload.bloating===''||payload.bloating==null?'':Number(payload.bloating);
  if(bloating!==''&&(!Number.isInteger(bloating)||bloating<0||bloating>3))throw new Error('דירוג הנפיחות אינו תקין');
  const note=String(payload.note||'').trim().slice(0,500);
  if(values.weight===''&&values.waist===''&&values.arm===''&&values.chest===''&&values.thigh===''&&bloating===''&&!note)throw new Error('יש להזין לפחות מדד אחד');
  if(values.weight!==''){
    const old=getSummaryRow_(date),totals=calculateTotals_(date);
    upsertSummary_({date,calories:totals.calories,protein:totals.protein,carbs:totals.carbs,fat:totals.fat,weight:values.weight,bodyFat:old?old.bodyFat:'',note:old?old.note:'',status:old?old.status||'פתוח':'פתוח'},true);
  }
  const sh=sheet_(APP.sheets.measurements),rows=sh.getDataRange().getValues();
  const ix=rows.findIndex((r,i)=>i>0&&formatDateValue_(r[0])===date);
  const row=[date,values.waist,values.arm,values.chest,values.thigh,bloating,note,new Date()];
  if(ix>0)sh.getRange(ix+1,1,1,row.length).setValues([row]);else appendRows_(APP.sheets.measurements,[row]);
  return getProcessData_();
}

function getProcessData(){ensureStructure_();return getProcessData_();}

// v0.16: removes the measurements of one date, including the weight saved for that date.
function deleteProcessCheckin(date){
  date=String(date||'');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new Error('תאריך לא תקין');
  const sh=sheet_(APP.sheets.measurements),rows=sh.getDataRange().getValues();
  let changed=false;const removed=[];
  for(let i=rows.length-1;i>0;i--)if(rows[i][0]&&formatDateValue_(rows[i][0])===date){removed.push(rows[i].map(v=>Object.prototype.toString.call(v)==='[object Date]'?formatDateValue_(v):v));sh.deleteRow(i+1);changed=true;}
  const summary=sheet_(APP.sheets.summary),sv=summary.getDataRange().getValues();
  const ix=sv.findIndex((r,i)=>i>0&&formatDateValue_(r[0])===date);
  let weight='';
  if(ix>0&&sv[ix][5]!==''){weight=sv[ix][5];summary.getRange(ix+1,6).setValue('');changed=true;}
  if(!changed)throw new Error('לא נמצאה מדידה בתאריך הזה');
  const undoToken=Utilities.getUuid();
  CacheService.getScriptCache().put(userKey_('meas')+'_'+undoToken,JSON.stringify({date,rows:removed,weight}),21600);
  trash_('measure',undoToken,'מדידה · '+date,{date,rows:removed,weight});
  const out=getProcessData();out.undoToken=undoToken;return out;
}

function restoreMeasureRows_(info){
  if(info.rows&&info.rows.length)appendRows_(APP.sheets.measurements,info.rows.slice().reverse());
  if(info.weight!==''&&info.weight!=null){const summary=sheet_(APP.sheets.summary),sv=summary.getDataRange().getValues();const ix=sv.findIndex((r,i)=>i>0&&formatDateValue_(r[0])===info.date);if(ix>0)summary.getRange(ix+1,6).setValue(info.weight);}
}

function restoreProcessCheckin(token){
  const raw=CacheService.getScriptCache().get(userKey_('meas')+'_'+String(token||''));
  if(!raw)throw new Error('אי אפשר כבר לבטל את המחיקה');
  const info=JSON.parse(raw);untrash_('measure',token);
  if(info.rows.length)appendRows_(APP.sheets.measurements,info.rows.reverse());
  if(info.weight!==''){
    const summary=sheet_(APP.sheets.summary),sv=summary.getDataRange().getValues();
    const ix=sv.findIndex((r,i)=>i>0&&formatDateValue_(r[0])===info.date);
    if(ix>0)summary.getRange(ix+1,6).setValue(info.weight);
  }
  CacheService.getScriptCache().remove(userKey_('meas')+'_'+token);
  return {process:getProcessData(),date:info.date,weight:info.weight};
}

function getProcessData_(workoutHistory){
  const byDate={};
  const diary=getHistory_(0);
  diary.forEach(x=>{if(x.weight!==''&&isFinite(x.weight)&&x.weight>0)byDate[x.date]={date:x.date,weight:x.weight}});
  sheet_(APP.sheets.measurements).getDataRange().getValues().slice(1).forEach(r=>{
    if(!r[0])return;
    const date=formatDateValue_(r[0]),item=byDate[date]||(byDate[date]={date});
    ['waist','arm','chest','thigh','bloating'].forEach((k,i)=>item[k]=r[i+1]===''?'':Number(r[i+1]));
    item.note=String(r[6]||'');
  });
  const rows=Object.values(byDate).sort((a,b)=>a.date.localeCompare(b.date));
  const exerciseDays={};
  const workoutSets=Array.isArray(workoutHistory)?
    workoutHistory.flatMap(x=>(x.sets||[]).map(set=>({date:x.date,name:x.exercise,kg:Number(set.weight),reps:Number(set.reps)}))):
    sheet_(APP.sheets.workouts).getDataRange().getValues().slice(1).filter(r=>r[0]&&r[11]!==true).map(r=>({date:formatDateValue_(r[2]),name:String(r[5]||''),kg:Number(r[7]),reps:Number(r[8])}));
  workoutSets.forEach(set=>{
    const date=set.date,name=String(set.name||'').trim(),kg=set.kg,reps=set.reps;
    if(!name||!kg||!reps||reps<5||reps>15)return;
    const key=name+'|'+date,score=kg*(1+reps/30);
    exerciseDays[key]=Math.max(exerciseDays[key]||0,score);
  });
  const strength=Object.keys(exerciseDays).map(key=>{const i=key.lastIndexOf('|');return {exercise:key.slice(0,i),date:key.slice(i+1),score:exerciseDays[key]}});
  const today=Utilities.formatDate(new Date(),APP.timezone,'yyyy-MM-dd');
  const start=new Date(today+'T12:00:00');start.setDate(start.getDate()-13);
  const since14=Utilities.formatDate(start,APP.timezone,'yyyy-MM-dd');
  const logged=diary.filter(x=>x.date>=since14&&x.date<=today&&x.calories>=800);
  const nutrition={loggedDays:logged.length,averageProtein:logged.length?round1_(logged.reduce((n,x)=>n+x.protein,0)/logged.length):null};
  return {today,rows,assessment:assessProcess_(rows,strength,today,nutrition),otherTrends:getOtherProcessTrends_(rows,today),nutrition};
}

function getOtherProcessTrends_(rows,today){
  const cutoff=days=>{const d=new Date(today+'T12:00:00');d.setDate(d.getDate()-days);return Utilities.formatDate(d,APP.timezone,'yyyy-MM-dd')};
  const window=rows.filter(x=>x.date>=cutoff(42)&&x.date<=today),out={};
  ['arm','chest','thigh'].forEach(key=>{
    const values=window.filter(x=>typeof x[key]==='number'&&x[key]>0);
    out[key]=values.length>=2?round1_(values[values.length-1][key]-values[0][key]):null;
  });
  const bloat=window.filter(x=>typeof x.bloating==='number'&&x.bloating>=0);
  out.bloatingCount=bloat.length;
  out.bloatingAverage=bloat.length?round1_(bloat.reduce((n,x)=>n+x.bloating,0)/bloat.length):null;
  return out;
}

function assessProcess_(rows,strength,today,nutrition){
  const settings=getSettings_();let profile={};try{profile=JSON.parse(settings.profile_json||'{}')}catch(_){}
  const goal=profile.goal||'recomp',proteinGoal=Number(settings.protein_goal)||130;
  const targetWeight=Number(profile.targetWeight||profile.target_weight)||null;
  const since=days=>{const d=new Date(today+'T12:00:00');d.setDate(d.getDate()-days);return Utilities.formatDate(d,APP.timezone,'yyyy-MM-dd')};
  const period=rows.filter(x=>x.date>=since(42)&&x.date<=today);
  const weights=period.filter(x=>typeof x.weight==='number'&&x.weight>0),waists=period.filter(x=>typeof x.waist==='number'&&x.waist>0);
  const earlyWeight=weights.filter(x=>x.date<=since(28)),recentWeight=weights.filter(x=>x.date>=since(14));
  const earlyWaist=waists.filter(x=>x.date<=since(28)),recentWaist=waists.filter(x=>x.date>=since(14));
  const weekWeight=weights.filter(x=>x.date>=since(7)),weekWaist=waists.filter(x=>x.date>=since(7));
  const avg=list=>list.reduce((s,x)=>s+x,0)/list.length;
  const median=list=>{const v=[...list].sort((a,b)=>a-b);return v.length%2?v[(v.length-1)/2]:(v[v.length/2-1]+v[v.length/2])/2};
  const days=(a,b)=>(new Date(b+'T12:00:00')-new Date(a+'T12:00:00'))/86400000;
  let weightRate=null,waistDelta=null;
  if(earlyWeight.length>=2&&recentWeight.length>=2&&days(earlyWeight[0].date,recentWeight[recentWeight.length-1].date)>=21){
    const oldCenter=earlyWeight[Math.floor(earlyWeight.length/2)].date,newCenter=recentWeight[Math.floor(recentWeight.length/2)].date;
    weightRate=(avg(recentWeight.map(x=>x.weight))-avg(earlyWeight.map(x=>x.weight)))/(days(oldCenter,newCenter)/7);
  }
  if(earlyWaist.length>=1&&recentWaist.length>=2&&days(earlyWaist[0].date,recentWaist[recentWaist.length-1].date)>=21){
    waistDelta=median(recentWaist.map(x=>x.waist))-median(earlyWaist.map(x=>x.waist));
  }
  const exercises={};strength.filter(x=>x.date>=since(42)&&x.date<=today).forEach(x=>(exercises[x.exercise]||(exercises[x.exercise]=[])).push(x));
  const changes=Object.keys(exercises).map(k=>{
    const list=exercises[k],old=list.filter(x=>x.date<=since(28)),recent=list.filter(x=>x.date>=since(14));
    if(!old.length||!recent.length)return null;
    return (Math.max(...recent.map(x=>x.score))/Math.max(...old.map(x=>x.score))-1)*100;
  }).filter(x=>x!==null);
  const strengthChange=changes.length?median(changes):null;
  const missing=[];
  if(weightRate===null)missing.push('לפחות 2 שקילות בתחילת התקופה ו־2 בסופה');
  if(waistDelta===null)missing.push('לפחות 3 מדידות טבור לאורך כ־4 שבועות');
  if(changes.length<2)missing.push('לפחות שני תרגילים שחזרו בתחילת התקופה ובסופה');
  let status='collecting',title='עדיין אוספים נתונים',message='מדוד משקל פעמיים בשבוע והיקפים פעם בשבוע. אחרי כמה שבועות אפשר יהיה לשפוט מגמה משולבת.',action='המשך לשמור באותם תנאים; אין צורך לשנות קלוריות בגלל מדידה בודדת.';
  if(!missing.length){
    if(weightRate<-.3){
      status='review';title='המשקל יורד מהר יחסית למטרה';
      message='ירידה מהירה במשקל עלולה להקשות על בניית שריר, גם אם היקף הטבור יורד.';
      action='בדוק ביצועים, התאוששות ואכילה. אם המגמה נמשכת, שקול להקטין את הגירעון בהדרגה.';
    }else if(waistDelta>=1){
      status='review';title='היקף הטבור עולה';
      message='במטרה שלך זו סיבה לבדוק את המדידות, גם אם המשקל אינו עולה. נפיחות יכולה להשפיע על היקף הבטן.';
      action='אם המגמה נמשכת עוד שבועיים, בדוק את צריכת הקלוריות בפועל ושקול התאמה קטנה, בלי קיצוץ חד.';
    }else if(weightRate>.3&&waistDelta>=-.5){
      status='review';title='המשקל עולה מהר והטבור אינו קטן';
      message='עלייה מהירה במשקל בלי ירידה בהיקף הטבור אינה סימן מספיק לבניית שריר נקי.';
      action='בדוק מדידות חוזרות ויומן אכילה. אם המגמה נמשכת, שקול לצמצם מעט את עודף האכילה.';
    }else if(strengthChange<=-5){
      status='review';title='הביצועים יורדים בתרגילים חוזרים';
      message='הירידה בביצועים היא סימן לבדוק אם האימון, השינה או כמות האוכל מתאימים למטרה.';
      action='בדוק התאוששות, עקביות אימונים וחלבון לפני שינוי קלוריות.';
    }else if(waistDelta<=-.5&&strengthChange>=-2){
      status='ontrack';title='יש סימנים טובים להרכב גוף משתפר';
      message='היקף הטבור ירד והביצועים נשמרו או השתפרו. גם משקל יציב מתאים לתהליך הזה.';
      action='המשך באותה שגרה והסתכל על המגמה, לא על יעד המשקל השבועי.';
    }else if(Math.abs(waistDelta)<.5&&strengthChange>=2&&weightRate<=.15&&weightRate>=-.2){
      status='promising';title='כוח עולה והבטן יציבה';
      message='הביצועים עולים בלי עלייה ברורה בהיקף הטבור. זה סימן מעודד, אבל עדיין לא הוכחה לעלייה במסת שריר.';
      action='המשך עוד כמה שבועות ובדוק אם מתחילה גם ירידה בהיקף הטבור.';
    }else{
      status='steady';title='אין עדיין מגמה חד־משמעית';
      message='המשקל, היקף הטבור והביצועים עדיין לא מצביעים יחד על שינוי ברור.';
      action='המשך מדידות שבועיים נוספים; בדוק עקביות אימונים וחלבון לפני התאמת קלוריות.';
    }
  }
  if(!missing.length&&goal!=='recomp'){
    title='מגמת ההתקדמות';status='steady';
    message='המגמה נבחנת ביחס למטרה האישית ולביצועים לאורך זמן.';
    action='המשך למדוד בעקביות ובחן יחד את המשקל, ההיקפים והביצועים.';
    if(goal==='lose'){
      if(weightRate<0){title='המשקל במגמת ירידה';message='מגמת המשקל תואמת את מטרת הירידה. בדוק גם את הביצועים וההתאוששות.';}
      else{title='אין כרגע מגמת ירידה במשקל';message='בחן את עקביות הרישום ואת המדידות לאורך זמן לפני שינוי היעדים.';}
    }else if(goal==='gain'){
      title=weightRate>0?'המשקל במגמת עלייה':'אין כרגע מגמת עלייה במשקל';
      message='עלייה במשקל לבדה אינה מוכיחה עלייה במסת שריר. בחן גם ביצועים והיקפים.';
    }else if(goal==='maintain'){
      title='מעקב אחר יציבות המשקל';message='בחן אם תנודות המשקל לאורך זמן מתאימות למטרת השמירה שלך.';
    }
    if(strengthChange<=-5){status='review';action='הביצועים ירדו. בדוק התאוששות, שינה ועקביות לפני שינוי היעדים.';}
  }
  const bloat=period.filter(x=>x.date>=since(14)&&typeof x.bloating==='number');
  const bloatingTip=bloat.length>=2&&avg(bloat.map(x=>x.bloating))>=2?'דיווחי הנפיחות גבוהים לאחרונה. עקוב אחר ארוחות ותסמינים בנפרד מהיקף הטבור בבוקר; אם זה מתמשך או כואב, פנה לבירור.':'';
  const proteinTip=nutrition&&nutrition.loggedDays>=10&&nutrition.averageProtein<proteinGoal*0.85?'ממוצע החלבון בימים המתועדים נמוך מהיעד האישי של '+proteinGoal+' גרם ביום.':'';
  const latestWeight=weights.length?weights[weights.length-1].weight:null;
  return {status,title,message,action,bloatingTip,proteinTip,missing,weightRate:weightRate===null?null:round1_(weightRate),waistDelta:waistDelta===null?null:round1_(waistDelta),strengthChange:strengthChange===null?null:round1_(strengthChange),matchedExercises:changes.length,weightThisWeek:weekWeight.length,measureThisWeek:weekWaist.length,latestWeight,targetWeight};
}

function closeDay(date) {
  const day = date || getWorkingDate_();
  const existing = getSummaryRow_(day);
  const totals = calculateTotals_(day);
  upsertSummary_({
    date:day, calories:totals.calories, protein:totals.protein, carbs:totals.carbs, fat:totals.fat,
    weight:existing ? existing.weight : '', bodyFat:existing ? existing.bodyFat : '',
    note:existing ? existing.note : '', status:'נסגר'
  }, true);
  return getBootstrapData(day);
}

function searchFoods(query) {
  const q = String(query || '').trim();
  if (q.length < 2) return [];
  const local = searchLocalFoods_(q);
  // USDA's public DEMO_KEY permits a few trial searches until a personal key is set.
  const apiKey = PropertiesService.getScriptProperties().getProperty('USDA_API_KEY') || 'DEMO_KEY';
  try {
    const remote = searchUsda_(q, apiKey);
    const seen = new Set(local.map(x => normalize_(x.name)));
    return local.concat(remote.filter(x => !seen.has(normalize_(x.name)))).slice(0, 60);
  } catch (err) {
    if (local.length) return local.slice(0, 60);
    if (apiKey === 'DEMO_KEY') throw new Error('מכסת הניסיון של USDA הסתיימה או שהחיבור אינו זמין. הוסף מפתח אישי חינמי בהגדרות.');
    throw new Error('לא התקבלו ערכים מ־USDA. בדוק את החיבור בהגדרות ונסה שוב. ' + String(err.message || ''));
  }
}

function smartFoodSearch(query) {
  const parsed=parseFoodQuery_(query);
  const recipe=knownRecipeEstimate_(parsed);
  if(recipe)return {parsed,results:[recipe]};
  const coffee=estimateCoffee_(parsed.name);
  if(coffee)return {parsed:Object.assign({},parsed,{amount:1,unit:'מנה'}),hasUsdaKey:!!PropertiesService.getScriptProperties().getProperty('USDA_API_KEY'),results:[coffee]};
  const produce=produceFood_(parsed.name);
  if(produce && !parsed.state){
    const fresh=searchFoods(produce.query);
    const matched=fresh.filter(x=>produce.pattern.test(String(x.englishName||x.name)) &&
      !/baby\s?food|dried|dehydrated|powder|chips|flour|juice|pie|cake|canned|fried|baked|sweetened|infant|dessert/i.test(String(x.englishName||x.name)));
    const ranges={'תפוח':[40,70],'בננה':[70,120],'תפוז':[30,65],'קלמנטינה':[30,70]};
    const range=ranges[produce.name];
    const preferred=rankFoodCandidates_(matched.filter(x=>x.calories>=range[0]&&x.calories<=range[1]),'fruit',produce.name);
    return {parsed:defaultFoodPortion_(Object.assign({},parsed,{name:produce.name,state:''})),
      results:preferred.map(x=>Object.assign({},x,{name:produce.name,state:'טרי',hebrewName:produce.name,
        assumption:'פרי טרי, חלק אכיל; המשקל של יחידה אחת הוא אומדן וניתן לשינוי'}))};
  }
  const requestedRaw=/לפני בישול|לא מבושל|\braw\b|\buncooked\b/.test(parsed.state);
  const stateQuery=requestedRaw?'raw':/על המחבת/.test(parsed.state)?'pan cooked':parsed.state;
  let results=[];
  if(isBrandedFood_(parsed.name))try{results=searchBrandedFood_(parsed.name)}catch(e){}
  const branded=results.length>0;
  if(!results.length)results=searchFoods([parsed.name,stateQuery].filter(Boolean).join(' '));
  const localFallback=parsed.state && !results.length ? searchLocalFoods_(parsed.name).filter(x=>
    String(x.state||foodStateLabel_(x.name)).indexOf(parsed.state)>=0) : [];
  const matches=(results.length?results:localFallback).map(x=>Object.assign({},x,{state:x.state||foodStateLabel_(x.name)}));
  const filtered=requestedRaw?matches.filter(x=>/\braw\b|\buncooked\b|לפני בישול|לא מבושל/i.test(x.name+' '+x.state)):matches;
  return {parsed:defaultFoodPortion_(parsed),hasUsdaKey:!!PropertiesService.getScriptProperties().getProperty('USDA_API_KEY'),
    results:rankFoodCandidates_(filtered,branded?'brand':'general',[parsed.name,stateQuery].filter(Boolean).join(' ')).map(x=>Object.assign({},x,{
      assumption:branded?'ערכי מוצר מזוהה — בדוק מול האריזה':isBrandedFood_(parsed.name)?'לא נמצא המותג המדויק; הערכים של מזון כללי דומה בלבד':
        'התאמה לרשומה במאגר; נתחים, שומן ושמן הכנה שלא צוינו עשויים לשנות את הערך'}))};
}

function defaultFoodPortion_(p){
  if(p.explicitQuantity||p.unit!=='גרם'||p.amount!==100)return p;
  const n=normalize_(p.name);let unit='גרם';
  if(/^(?:פיתה|pita|סופגניה|donut|ביצה(?: קשה)?|egg(?: whole)?|תפוח|apple|בננה|banana|תפוז|orange)$/.test(n))unit='יחידה';
  else if(/לחם|bread|פרוס|toast|עוגה|cake/.test(n))unit='פרוסה';
  else if(/פחית|cola|sprite|משקה מוגז|soda/.test(n))unit='פחית';
  return unit==='גרם'?p:Object.assign({},p,{amount:1,unit});
}

function isBrandedFood_(name){return /כריות|קורנפלקס|מילקי|דנונה|יופלה|פחית|coca.?cola|nestle|kellogg|protein bar|חטיף חלבון/i.test(String(name));}

function searchBrandedFood_(name){
  const url='https://world.openfoodfacts.org/cgi/search.pl?search_terms='+encodeURIComponent(name)+
    '&search_simple=1&action=process&json=1&page_size=12&fields=code,product_name,product_name_he,brands,nutriments';
  const response=UrlFetchApp.fetch(url,{muteHttpExceptions:true,headers:{'User-Agent':'IlayNutritionApp/0.11 (personal food diary)'}});
  if(response.getResponseCode()!==200)return [];
  const wanted=normalize_(name);
  return (JSON.parse(response.getContentText()).products||[]).map(p=>{
    const n=p.nutriments||{},title=String(p.product_name_he||p.product_name||'').trim(),brand=String(p.brands||'');
    return {name:title,englishName:title,baseQty:100,unit:'גרם',calories:Number(n['energy-kcal_100g']),
      protein:Number(n.proteins_100g),carbs:Number(n.carbohydrates_100g),fat:Number(n.fat_100g),
      source:'Open Food Facts · '+brand,sourceId:String(p.code||''),dataType:'brand'};
  }).filter(f=>f.name&&Number.isFinite(f.calories)&&f.calories>=0&&Number.isFinite(f.protein)&&
    (normalize_(f.name+' '+f.source).includes(wanted)||wanted.split(' ').every(w=>normalize_(f.name+' '+f.source).includes(w))));
}

function rankFoodCandidates_(foods,kind,name){
  const query=translateFoodQuery_(name).toLowerCase(),words=query.match(/[a-z]+/g)||[];
  const score=f=>{
    const d=String(f.englishName||f.name).toLowerCase();let n=kind==='brand'?35:0;
    n+=words.reduce((sum,w)=>sum+(d.includes(w)?15:-20),0);
    if(normalize_(f.name)===normalize_(name))n+=80;
    if(kind==='fruit')n+=/raw/.test(d)?30:0,n+=/with skin|with peel/.test(d)?10:0;
    if(/baby\s?food|infant|strained|sauce|dried|powder|juice|canned|coated|with skin|separable fat/.test(d)&&kind!=='fruit'&&!/with skin|coated|sauce|dried/.test(query))n-=75;
    if(/baby\s?food|dried|powder|juice|pie|cake/.test(d)&&kind==='fruit')n-=120;
    if(/tenderloin|fillet/.test(query)&&/tenderloin|fillet/.test(d))n+=55;
    if(/beef.*(?:tenderloin|fillet)|(?:tenderloin|fillet).*beef/.test(query)){
      if(/beef/.test(d)&&!/tenderloin|fillet/.test(d))n-=80;
      if(/tenderloin|fillet/.test(d)&&f.calories>320)n-=85;
      if(/tenderloin|fillet/.test(d)&&f.fat>20)n-=65;
    }
    if(/^egg whole$/.test(query)){if(/^egg,? whole,? raw/.test(d))n+=50;if(/fried|scrambled|omelet/.test(d))n-=25;}
    if(f.dataType==='SR Legacy')n+=12;
    if(f.dataType==='Foundation')n+=8;
    return n;
  };
  return foods.filter(f=>kind==='brand'||kind==='fruit'||foodCandidateMatches_(f,query,name))
    .sort((a,b)=>score(b)-score(a)||String(a.name).localeCompare(String(b.name))).slice(0,8);
}


// Reject a shared ingredient inside a different food (e.g. Bagels, egg).
// No numeric corrections: use the accepted source record and its original name.
function foodCandidateMatches_(food, query, originalName) {
  const d=String(food.englishName||food.name||'').toLowerCase().trim();
  const q=String(query||'').toLowerCase().trim();
  if(normalize_(food.name)===normalize_(originalName) && !/USDA/i.test(food.source||''))return true;
  const terms=s=> (s.match(/[a-z]+/g)||[]).map(w=>({eggs:'egg',potatoes:'potato',bananas:'banana',apples:'apple',noodles:'noodle',mangos:'mango',mangoes:'mango',plums:'plum',prunes:'prune',tomatoes:'tomato',onions:'onion',cucumbers:'cucumber'}[w]||w));
  const dw=terms(d), qw=terms(q).filter(w=>!['with','and','the','of'].includes(w));
  if(!qw.length)return false;
  // All meaningful query terms must be present; cooked is not uncooked.
  if(!qw.every(w=>dw.includes(w)))return false;
  if(['dried','frozen','smoked','canned','fried','sweetened'].some(w=>dw.includes(w)&&!qw.includes(w)))return false;
  const first=qw[0];
  const basic=['egg','potato','rice','quinoa','chicken','salmon','tuna','beef','milk','yogurt','oats','oatmeal','pasta','mango','plum','tomato','onion','cucumber','broccoli','carrot','almond','lentil','bean','butter','oil','sugars','cheese'];
  if(basic.includes(first)){
    const head=terms(d.split(',').slice(0,/^fish,/.test(d)?2:1).join(' '));
    if(!head.includes(first) && !(first==='tomato'&&qw.includes('sauce')&&head.includes('sauce')&&dw.includes('tomato')))return false;
    const composites=['bagel','bagels','bread','cake','cakes','cookie','cookies','sandwich','sandwiches','salad','soup','pizza','noodle','pasta','pudding','candy','chocolate','cereal','flour','powder','dehydrated','babyfood','baby','infant'];
    if(composites.some(w=>dw.includes(w)&&!qw.includes(w)))return false;
  }
  if(qw.includes('potato')&&!qw.includes('sweet')&&dw.includes('sweet'))return false;
  if(qw.includes('egg')&&qw.includes('whole')&&/\b(?:whites?|yolks?|substitute|dried|powder)\b/.test(d))return false;
  if(qw.includes('cooked')&&/\b(?:raw|uncooked|dry)\b/.test(d))return false;
  if(qw.includes('raw')&&/\b(?:cooked|roasted|fried|grilled)\b/.test(d))return false;
  return true;
}

function produceFood_(name){
  const s=normalize_(name);
  const kinds=[{names:['בננה','banana'],name:'בננה',query:'bananas raw',pattern:/^bananas?,\s*raw$|^bananas?\s+raw$/i},
    {names:['תפוז','orange'],name:'תפוז',query:'oranges raw',pattern:/^oranges?,\s*raw|^oranges?\s+raw/i},
    {names:['קלמנטינה','clementine'],name:'קלמנטינה',query:'tangerines raw',pattern:/^tangerines?,.*raw|^clementines?,\s*raw/i},
    {names:['תפוח','apple'],name:'תפוח',query:'apples raw',pattern:/^apples?,\s*raw|^apples?\s+raw/i}];
  return kinds.find(x=>x.names.includes(s))||null;
}

function getNutritionJournal(){return getHistory_(0).filter(x=>x.calories>0||x.protein>0);}

// Explicit assumptions allow everyday coffee to be logged without USDA access.
function estimateCoffee_(name) {
  const q=normalize_(name);
  if(!/(^| )(קפה|אספרסו|coffee|espresso)( |$)/.test(q))return null;
  if(/סוכר|דבש|סילאן|סירופ|שיבולת|סויה|שקדים|ללא לקטוז|נטול לקטוז|קרם|שמנת|שוקולד|sugar|honey|syrup|oat|soy|almond|cream/.test(q))return null;
  if(/חלב|milk/.test(q)){
    const ml=/קצת|מעט|טיפה|splash|little/.test(q)?30:50;
    return {name:'קפה עם '+ml+' מ״ל חלב 3% (ללא סוכר, אומדן)',baseQty:1,unit:'מנה',
      calories:Math.round(ml*0.61+2),protein:round1_(ml*0.031),carbs:round1_(ml*0.048),fat:round1_(ml*0.03),
      source:'אומדן לפי '+ml+' מ״ל חלב 3%; אפשר לתקן ערכים',sourceId:''};
  }
  if(/^(קפה|נס קפה|אספרסו|coffee|espresso)( שחור| black)?$/.test(q)){
    return {name:'קפה שחור ללא סוכר (אומדן)',baseQty:1,unit:'מנה',
      calories:2,protein:0,carbs:0,fat:0,source:'אומדן לקפה ללא תוספות',sourceId:''};
  }
  return null;
}

function testUsdaConnection() {
  const key=PropertiesService.getScriptProperties().getProperty('USDA_API_KEY');
  if(!key)throw new Error('תחילה שמור מפתח USDA בהגדרות');
  verifyUsdaKey_(key);
  return 'החיבור ל־USDA פועל';
}

function verifyUsdaKey_(key) {
  const url='https://api.nal.usda.gov/fdc/v1/foods/search?api_key='+encodeURIComponent(key);
  const response=UrlFetchApp.fetch(url,{method:'post',contentType:'application/json',payload:JSON.stringify({query:'egg',pageSize:1}),muteHttpExceptions:true});
  if(response.getResponseCode()!==200)throw new Error('מפתח USDA לא אומת. בדוק את המפתח ונסה שוב');
  if(!(JSON.parse(response.getContentText()).foods||[]).length)throw new Error('USDA לא החזיר תוצאות. נסה שוב מאוחר יותר');
}


// The only paid model call in the app. A click in the UI invokes this endpoint once.
function estimateFoodWithOpenAI(title, extras) {
  const key=PropertiesService.getScriptProperties().getProperty('OPENAI_API_KEY');
  if(!key)throw new Error('הוסף תחילה מפתח OpenAI בהגדרות האפליקציה');
  const food=String(title||'').trim(), details=String(extras||'').trim();
  if(food.length<2||food.length>500||details.length>1200)throw new Error('תיאור המזון חסר או ארוך מדי');
  const cache=CacheService.getScriptCache();
  const digest=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,food+'|'+details);
  const cacheKey=userKey_('ai')+':'+APP.version+':'+Utilities.base64EncodeWebSafe(digest);
  const hit=cache.get(cacheKey);if(hit){const saved=JSON.parse(hit);saved.fromCache=true;return saved;}
  aiQuota_();
  const result=openaiNutrition_(key,'Food: '+food+'\nMore ingredients: '+details,food,'');
  cache.put(cacheKey,JSON.stringify(result),21600);
  return result;
}

function aiQuota_(){
  const today=Utilities.formatDate(new Date(),APP.timezone,'yyyy-MM-dd');
  const prop=userKey_('OPENAI_COUNT_'+today),limit=isAdmin_()?30:10,lock=LockService.getScriptLock();lock.waitLock(10000);
  try{
    const props=PropertiesService.getScriptProperties(),count=Number(props.getProperty(prop)||0);
    if(count>=limit)throw new Error('הגעת למגבלת '+limit+' בקשות AI להיום. נסה מחר או השתמש במזון שמור.');
    props.setProperty(prop,String(count+1));
  }finally{lock.releaseLock()}
}
function openaiNutrition_(key,input,fallbackName,extra){
  const number={type:'number'};
  const schema={type:'object',additionalProperties:false,required:['name','note','items'],properties:{
    name:{type:'string'},note:{type:'string'},items:{type:'array',items:{type:'object',additionalProperties:false,
      required:['label','grams','calories','protein','carbs','fat','assumption'],properties:{
        label:{type:'string'},grams:number,calories:number,protein:number,carbs:number,fat:number,assumption:{type:'string'}
      }}}
  }};
  const request={model:'gpt-6-luna',store:false,reasoning:{effort:'low'},max_output_tokens:2400,
    instructions:extra+'You estimate nutrition for a personal food diary. Reply in the language of the user (Hebrew or Arabic). Split mixed dishes into individually editable ingredients. grams is edible weight of each ingredient (except bone-in chicken or fish pieces, explained below); calories, protein, carbs and fat are PER 100 GRAMS, never totals. Give short explicit assumptions about unknown quantity, oil, sauce, cooking state and recipe. Do not claim branded product precision without a label. Provide a reasonable estimate, not false certainty. If the input is unclear, state the uncertainty in note and assumptions. Do not include ingredients the user explicitly excludes. Use the exact counts and amounts the user states (for example 2 eggs means 2 eggs; one large egg is about 50 g edible, 72 kcal and 6.3 g protein). Assume home-cooked portions. Never count fat twice: when oil or butter is its own item, give the main ingredient plain values (raw or boiled), not fried or with-fat values. If cooking oil is not stated, assume 1 teaspoon (5 g) for a pan dish and none for boiled, baked without oil or raw food. For chicken or fish pieces that come with bone (drumstick, thigh, wing, back, leg quarter, whole chicken, whole fish): name the cut in Hebrew at the start of the item name (שוק עוף, ירך עוף, כנפיים, גב עוף, רבע עוף, עוף שלם, דג שלם), give grams exactly as the user weighed them including bone and skin, and give nutrition values for cooked meat without skin. The app removes the bone and skin itself. If the user did not give a weight, estimate a typical weighed portion with bone.',
    input,
    text:{format:{type:'json_schema',name:'nutrition_estimate',strict:true,schema}}};
  let response;
  try{response=UrlFetchApp.fetch('https://api.openai.com/v1/responses',{
    method:'post',contentType:'application/json',headers:{Authorization:'Bearer '+key},
    payload:JSON.stringify(request),muteHttpExceptions:true});}
  catch(e){throw new Error('לא ניתן להתחבר ל־OpenAI כעת. בדוק את החיבור ונסה שוב.');}
  const status=response.getResponseCode();
  if(status!==200){
    if(status===401)throw new Error('מפתח OpenAI אינו תקין. בדוק אותו בהגדרות.');
    if(status===429)throw new Error('OpenAI עצר את הבקשה בגלל מגבלה או יתרה. בדוק את חשבון ה־API.');
    throw new Error('בקשת AI נכשלה (קוד '+status+'). לא נשמר מזון.');
  }
  let body,parsed;
  try{
    body=JSON.parse(response.getContentText());
    const text=(body.output||[]).flatMap(o=>o.content||[]).filter(x=>x.type==='output_text').map(x=>x.text).join('');
    parsed=JSON.parse(text);
  }catch(e){throw new Error('התקבלה תשובה חלקית מה־AI. לא נשמר מזון ולא נשלחה בקשה חוזרת.');}
  if(body.status!=='completed'||!Array.isArray(parsed.items)||!parsed.items.length||parsed.items.length>16)
    throw new Error('תשובת ה־AI לא הושלמה או חסרים בה מרכיבים. לא נשמר מזון.');
  const items=parsed.items.map(x=>{
    const grams=Number(x.grams),vals=['calories','protein','carbs','fat'].map(k=>Number(x[k]));
    if(!String(x.label||'').trim()||!Number.isFinite(grams)||grams<=0||grams>5000||
      vals.some(v=>!Number.isFinite(v)||v<0||v>900)||!vals.some(v=>v>0))
      throw new Error('בתשובת ה־AI יש ערך לא תקין. לא נשמר מזון.');
    return {label:String(x.label).slice(0,100),amount:round1_(grams),unit:'גרם',measure:'גרם',
      assumption:String(x.assumption||'אומדן').slice(0,250),choices:[],manualOverride:true,
      manual:{calories:round1_(vals[0]),protein:round1_(vals[1]),carbs:round1_(vals[2]),fat:round1_(vals[3])},
      source:'הערכת AI · gpt-6-luna'+(extra?' · תמונה':'')};
  });
  const result={name:String(parsed.name||fallbackName).slice(0,120),note:'הערכת AI: '+String(parsed.note||'בדוק את ההנחות והכמויות').slice(0,450),items,source:'ai',
    usage:body.usage?{inputTokens:Number(body.usage.input_tokens)||0,outputTokens:Number(body.usage.output_tokens)||0}:null};
  return result;
}
// v0.33: estimate a meal from a photo. Same quota, same editable result as the text estimate.
function estimateFoodPhoto(payload){
  const key=PropertiesService.getScriptProperties().getProperty('OPENAI_API_KEY');
  if(!key)throw new Error('הוסף תחילה מפתח OpenAI בהגדרות האפליקציה');
  const p=payload||{},img=String(p.image||'').replace(/^data:image\/[a-z]+;base64,/,''),note=String(p.note||'').trim().slice(0,600);
  if(img.length<1000||img.length>3000000||!/^[A-Za-z0-9+/=]+$/.test(img))throw new Error('התמונה לא תקינה או גדולה מדי');
  aiQuota_();
  const input=[{role:'user',content:[{type:'input_text',text:'Photo of a meal for a food diary.'+(note?' User note: '+note:'')+'\nIdentify every food on the plate and estimate edible grams from the visible portion size (a standard dinner plate is about 26 cm). Include hidden fat such as cooking oil or sauce as separate items when likely.'},{type:'input_image',image_url:'data:image/jpeg;base64,'+img}]}];
  return openaiNutrition_(key,input,'ארוחה מתמונה','The input is a photo. Write the name, note, labels and assumptions in Hebrew. If the photo does not show food, return one item named "לא זוהה מזון" with grams 1 and calories 1, and say so in note. ');
}
function estimateDish(title, additions, options) {
  const key=PropertiesService.getScriptProperties().getProperty('USDA_API_KEY');
  if(!key)throw new Error('כדי להעריך מנה אוטומטית, שמור תחילה מפתח USDA בהגדרות');
  const dish=String(title||'').trim();if(dish.length<2)throw new Error('יש לכתוב שם של מנה');
  const specs=parseDishParts_(dish,String(additions||''),options||{});
  if(/פינה קולדה|piña colada|pina colada/i.test(dish)&&specs.length===1){
    let matching=[];
    try{matching=searchUsda_(specs[0].query,key).filter(f=>!/(non.?alcohol|virgin|mix)/i.test(f.name)&&f.calories>0)}catch(err){}
    if(matching.length)specs[0].preferred=matching;
    else specs.splice(0,1,
      {label:'רום',amount:45,unit:'מ״ל',query:'rum',assumption:'כ־45 מ״ל רום; כמות משוערת'},
      {label:'מיץ אננס',amount:100,unit:'מ״ל',query:'pineapple juice',assumption:'כ־100 מ״ל מיץ אננס; כמות משוערת'},
      {label:'קרם קוקוס',amount:55,unit:'גרם',query:'coconut cream',fallback:'coconut milk',assumption:'כ־55 גרם קרם קוקוס; כמות משוערת'});
  }
  const items=specs.map(spec=>{
    let foods=[];
    try{foods=rankFoodCandidates_((spec.preferred||searchUsda_(spec.query,key)).filter(f=>(f.calories>0||f.protein>0||f.carbs>0||f.fat>0)&&
      (!spec.required||spec.required.test(f.name))&&!/baby\s?food|infant|dinner|strained|powder/i.test(f.name)),'general',spec.query);}
    catch(err){throw new Error('לא ניתן לקבל נתונים מ־USDA כרגע. בדוק את המפתח או נסה שוב מאוחר יותר');}
    if(!foods.length&&spec.fallback){
      try{foods=rankFoodCandidates_(searchUsda_(spec.fallback,key).filter(f=>(f.calories>0||f.protein>0||f.carbs>0||f.fat>0)&&
        (!spec.required||spec.required.test(f.name))&&!/baby\s?food|infant|dinner|strained|powder/i.test(f.name)),'general',spec.fallback);spec.assumption+=' · ערכי מזון דומה';}catch(err){}
    }
    if(spec.skinRequested&&foods.length&&!/skin|עור/i.test(foods[0].name))spec.assumption+=' · הרשומה אינה מפרידה עור; תקן ידנית לפי מוצר/אריזה';
    if(foods.length>1&&foods[0].calories>0&&foods.some(f=>Math.abs(f.calories-foods[0].calories)/foods[0].calories>0.35))
      spec.assumption+=' · רשומות דומות במאגר שונות מאוד בערכים; בדוק סוג, נתח ושומן לפני שמירה';
    return {label:spec.label,amount:spec.amount,unit:spec.unit,assumption:spec.assumption,
      choices:foods.slice(0,1).map(f=>({name:f.name,calories:f.calories,protein:f.protein,carbs:f.carbs,fat:f.fat,sourceId:f.sourceId})),
      missing:!foods.length};
  });
  return {name:dish,items,meta:dishMeta_,note:'אומדן בלבד. הכמויות וההתאמה למאגר הן הנחות; בדוק ושנה אותן לפני השמירה.'};
}

// v0.34: meat and fish are weighed as served. The bone comes off automatically; the skin only if it was not eaten.
// Shares of the cooked weight, approximate, from standard yield tables.
const BONE_CUTS_={
  chicken:[
    {re:/כנפ|wing/,key:'wing',label:'כנפיים',bone:0.40,skin:0.25,usda:'wing'},
    {re:/(^|[^א-ת])(שוק|שוקיים|כרעיים)(?![א-ת])|drumstick/,key:'drumstick',label:'שוק עוף',bone:0.30,skin:0.12,usda:'drumstick'},
    {re:/(^|[^א-ת])(ירך|ירכיים)(?![א-ת])|thigh/,key:'thigh',label:'ירך עוף',bone:0.20,skin:0.15,usda:'thigh'},
    {re:/גב עוף|(^|[^א-ת])גב(?![א-ת])|chicken back/,key:'back',label:'גב עוף',bone:0.45,skin:0.20,usda:'back'},
    {re:/רבע עוף|כרע|leg/,key:'leg',label:'רבע עוף',bone:0.25,skin:0.13,usda:'leg'},
    {re:/עוף שלם|חצי עוף|whole chicken/,key:'whole',label:'עוף',bone:0.30,skin:0.12,usda:''},
    {re:/חזה.*(?:עצם|עצמות)|breast.*bone/,key:'breast',label:'חזה עוף עם עצם',bone:0.15,skin:0.08,usda:'breast'}],
  fish:[{re:/שלם|whole/,key:'whole',label:'דג שלם',bone:0.35,skin:0.08,usda:''}]
};
let dishMeta_=null;
function weighedGrams_(text){const m=String(text||'').match(/(\d+(?:[.,]\d+)?)\s*(?:גרם|גר[׳']?|ג[׳']|g\b)/);return m?Number(m[1].replace(',','.')):0;}
function boneCut_(text,kind,options){
  options=options||{};
  const cuts=BONE_CUTS_[kind]||[],cut=cuts.find(c=>c.re.test(text))||null;
  const hasBoneWord=/עם עצם|עם עצמות|כולל עצם|על העצם|with bone|bone-in/.test(text);
  // Weight includes bone: the user's switch wins; otherwise a bone-in cut, or the words "with bone".
  const bone=options.bone===true||options.bone===false?options.bone:!!(cut||hasBoneWord);
  // Skin: true = eaten, false = not eaten, undefined = not answered yet (counted as not eaten until answered).
  const skinAns=options.skin===true||options.skin===false?options.skin:(/בלי עור|ללא עור|without skin|skinless/.test(text)?false:/עם העור|עם עור|with skin/.test(text)?true:(getSettings_().chicken_skin==='with'));
  const skinEaten=skinAns===true;
  const boneShare=bone?(cut?cut.bone:(kind==='fish'?0.25:0.30)):0;
  // Only pieces that normally come with skin lose it: bone-in cuts, salmon, or when the user says so.
  const hasSkin=!!cut||/עם עור|עם העור|with skin|סלמון|salmon/.test(text);
  const skinShare=skinEaten||!hasSkin?0:(cut?cut.skin:(kind==='fish'?0.08:0.12));
  const label=cut?cut.label:(kind==='fish'?'דג':'עוף');
  const edible=g=>Math.max(1,Math.round(g*(1-boneShare-skinShare)));
  return {skin:skinEaten,label,
    query:kind==='chicken'?'chicken '+(cut&&cut.usda?cut.usda+' ':'')+(skinEaten?'meat and skin cooked roasted':'meat only cooked roasted'):'',
    edible,
    note:g=>{const parts=[];if(bone)parts.push('העצם (כ־'+Math.round(boneShare*100)+'%)');if(skinShare)parts.push('העור (כ־'+Math.round(skinShare*100)+'%)');
      return 'שקלת '+g+' ג׳ עם עצם · נכנס לגוף '+edible(g)+' ג׳'+(skinEaten?' עם העור':' בלי עור ועצם');},
    meta:g=>({animal:true,kind,cut:cut?cut.key:'',bone,hasSkin,skin:skinAns===undefined?null:skinAns,weighed:g,edible:edible(g)})};
}
function parseDishParts_(title,additions,options) {
  dishMeta_=null;
  const split=title.split(/\s+עם\s+/i),mainTitle=split.shift(),text=mainTitle.toLowerCase(),parts=[];
  additions=[split.join(' עם '),additions].filter(Boolean).join(', ');
  const add=(label,amount,query,fallback,assumption,unit,required,skinRequested)=>parts.push({label,amount,query,fallback:fallback||'',assumption:assumption||'כמות משוערת',unit:unit||'גרם',required,skinRequested:!!skinRequested});
  const isOmelette=/חבית|אומלט|omelet/i.test(text);
  const isShawarma=/שווארמה|shawarma/.test(text),isSausage=/נקניק|נקנקי|hot\s?dog/.test(text);
  const chickenCut=/משולש|ירך|thigh/.test(text);
  const twoPieces=/שני|שתי|2\s*(?:משולש|ירך|שוק)/.test(text);
  if(isOmelette){
    // v0.33.6: count the eggs the user wrote, use plain egg values, and add oil once (a teaspoon) unless oil was written.
    const words={'אחת':1,'אחד':1,'שתי':2,'שני':2,'שתיים':2,'שלוש':3,'שלושה':3,'ארבע':4,'ארבעה':4,'חמש':5,'חמישה':5};
    const all=title+' '+(additions||''),dm=all.match(/(\d+)\s*ביצ/),wm=all.match(/(אחת|אחד|שתיים|שתי|שני|שלושה|שלוש|ארבעה|ארבע|חמישה|חמש)\s+ביצ/);
    const eggs=dm?Math.min(12,Number(dm[1])):wm?words[wm[1]]:/מביצה(?:\s|$)|ביצה אחת/.test(all)?1:2;
    add('ביצים',eggs*50,'egg whole raw fresh','egg whole raw',(dm||wm?'':'הונחו שתי ביצים; ')+eggs+' ביצים בגודל L, כ־50 גרם אכיל כל אחת','גרם',/egg/i);
    if(!/שמן|oil|חמאה|butter|ספריי|spray/i.test(additions||''))add('שמן לחביתה (משוער)',5,'olive oil','','הונחה כפית שמן (5 גרם); שנה או הסר אם השתמשת בכמות אחרת');
    additions=String(additions||'').replace(/(?:\d+\s*|(?:אחת|אחד|שתיים|שתי|שני|שלושה|שלוש|ארבעה|ארבע|חמישה|חמש)\s+)ביצ(?:ים|ה)/g,'').replace(/^[\s,;]+|[\s,;]+$/g,'');
  }else if(isShawarma&&/פית|pita/.test(text)){
    const beef=/בקר|beef/.test(text);
    add('שווארמה',150,beef?'beef cooked lean':'chicken meat cooked roasted',beef?'beef cooked':'chicken cooked',
      'הונחו 150 גרם בשר '+(beef?'בקר':'עוף')+'; שמן הכנה אינו נכלל אם לא הוספת אותו','גרם',beef?/beef/i:/chicken/i);
    add('פיתה',90,'pita bread','bread pita','פיתה אחת: כ־90 גרם; ערך הפיתה מחושב בנפרד');
  }else if(/סלמון|דג|salmon|fish/.test(text)){
    const salmon=/סלמון|salmon/.test(text),fish=salmon?'salmon':'fish';
    const cut=boneCut_(text,'fish',options),portion=Number(options.fishGrams)||weighedGrams_(text)||150;
    add(salmon?'סלמון':'דג',cut.edible(portion),
      fish+' '+(cut.skin?'with skin ':'')+'cooked',fish+' cooked',cut.note(portion),'גרם',salmon?/salmon/i:/fish/i,true);
    dishMeta_=cut.meta(portion);
  }else if(/עוף|chicken|כנפ|wing|שוק עוף|כרעיים|drumstick/.test(text)&&/תפוחי? אדמה|potato/.test(title)){
    const cut=boneCut_(text,'chicken',options),portion=Number(options.chickenGrams)||weighedGrams_(text)||(chickenCut?(twoPieces?220:110):150);
    add(cut.label,cut.edible(portion),cut.query,'chicken cooked roasted',cut.note(portion),'גרם',/chicken/i);
    dishMeta_=cut.meta(portion);
    const potatoText=(title.match(/(?:\d+\s*(?:גרם|ג[׳']?)\s*)?תפוחי? אדמה/)||[])[0]||'תפוחי אדמה';
    const potato=parseDishPart_(potatoText);
    add('תפוחי אדמה',potato.amount,potato.query,'potatoes cooked','כמות תפוחי האדמה משוערת; שנה לפני שמירה','גרם',/potato/i);
  }else if(/עוף|chicken|כנפ|wing|כרעיים|drumstick/.test(text)){
    const cut=boneCut_(text,'chicken',options),portion=Number(options.chickenGrams)||weighedGrams_(text)||(chickenCut?(twoPieces?220:110):150);
    add(cut.label,cut.edible(portion),cut.query,'chicken cooked roasted',cut.note(portion),'גרם',/chicken/i);
    dishMeta_=cut.meta(portion);
  }else if(isSausage&&/לחמני|לחמניה|bun/.test(text)){
    add('נקניקייה',75,'hot dog sausage','frankfurter','נקניקייה אחת: כ־75 גרם');
    add('לחמנייה',70,'hot dog bun','bread roll','לחמנייה אחת: כ־70 גרם');
  }else if(/פינה קולדה|piña colada|pina colada/.test(text)){
    add('פינה קולדה',200,'pina colada alcoholic beverage','pina colada','כוס משוערת של 200 מ״ל; תלוי באלכוהול, במיץ ובחלב הקוקוס','מ״ל');
  }else {
    const main=parseDishPart_(mainTitle);add(main.label,main.amount,main.query,main.fallback,main.assumption,main.unit);
  }
  if(/מטוגנ|fried/i.test(additions+' '+title)&&!/שמן|oil/i.test(additions))add('שמן טיגון (משוער)',5,'olive oil','','הונחו 5 גרם שמן; אפשר לשנות או להסיר');
  if(/עוף|chicken/.test(text)&&/תפוחי? אדמה|potato/.test(title))additions=String(additions||'').replace(/(?:\d+\s*(?:גרם|ג[׳']?)\s*)?תפוחי? אדמה(?:\s+(?:אפוי|אפויה|מבושל|מבושלת))?/g,'').replace(/^\s*,/,'');
  const extras=String(additions||'').split(/[,\n;+]+|\s+וגם\s+|\s+ו(?=[א-ת\d])/).map(s=>s.trim()).filter(Boolean);
  extras.slice(0,Math.max(0,6-parts.length)).forEach(raw=>{const p=parseDishPart_(raw);add(p.label,p.amount,p.query,p.fallback,p.assumption,p.unit)});
  return parts;
}

function parseDishPart_(raw) {
  const input=String(raw||'').trim();
  const m=input.match(/(\d+(?:[.,]\d+)?)\s*(ק["״]?ג|קילו|גרם|ג[׳']?|מ["״]?ל|כפות?|כפיות?|כוסות?|יחידות?|פרוסות?)/i);
  let amount=m?Number(m[1].replace(',','.')):0,unit='גרם';
  if(m){const u=m[2];if(/ק["״]?ג|קילו/.test(u))amount*=1000;else if(/כפיות?/.test(u))amount*=5;else if(/כפות?/.test(u))amount*=15;else if(/כוסות?/.test(u)){amount*=200;unit='מ״ל'}else if(/מ["״]?ל/.test(u))unit='מ״ל';else if(/יחיד|פרוס/.test(u))amount*=50;}
  const implicit=!m&&input.match(/^(?:עם\s+)?(חצי\s+)?(כף|כפית|כוס)\s+/);
  if(implicit){amount=(implicit[2]==='כף'?15:implicit[2]==='כפית'?5:200)*(implicit[1]?0.5:1);if(implicit[2]==='כוס')unit='מ״ל'}
  let label=input.replace(m?m[0]:implicit?implicit[0]:'','').replace(/^(?:עם|ו)\s*/,'').trim()||input;
  const dict=[[/תפוחי? אדמה|potato/i,'potatoes baked',150],[/פטרי|mushroom/i,'mushrooms cooked',80],[/ביצ|egg/i,'egg whole cooked',100],[/חומוס|hummus/i,'hummus',30],[/טחינה|tahini/i,'tahini sauce',25],[/סלט|salad/i,'salad vegetables',50],[/פיתה|pita/i,'pita bread',90],[/לחמני|לחמניה|bun/i,'bread roll',70],[/נקניק|נקנקי|hot dog/i,'frankfurter',75],[/ציפס|צ׳יפס|צ'יפס|fries/i,'french fries',100],[/שמן|oil/i,'olive oil',5],[/בצל|onion/i,'onion',30],[/עגבני|tomato/i,'tomato',50],[/מלפפון|cucumber/i,'cucumber',50]];
  const match=dict.find(d=>d[0].test(label));
  const query=match?match[1]:label;
  if(!amount)amount=match?match[2]:100;
  return {label,amount,unit,query,fallback:'',assumption:m||implicit?'הכמות הומרה לגרמים לפי המידה שכתבת':'הכמות לא צוינה; הונחה מנה משוערת'};
}

function lookupBarcode(barcode) {
  const code = String(barcode || '').replace(/\D/g, '');
  if (code.length < 8) throw new Error('ברקוד לא תקין');
  const saved=getMyFoods_().find(x=>x.sourceId===code);
  if (saved) return saved;
  const url = 'https://world.openfoodfacts.org/api/v2/product/' + encodeURIComponent(code) + '.json?fields=product_name,product_name_he,brands,nutriments,serving_quantity,serving_quantity_unit';
  const response = UrlFetchApp.fetch(url, {muteHttpExceptions:true, headers:{'User-Agent':'IlayNutritionApp/0.1'}});
  if (response.getResponseCode() !== 200) throw new Error('המוצר לא נמצא');
  const body = JSON.parse(response.getContentText());
  if (!body.product) throw new Error('המוצר לא נמצא');
  const p = body.product;
  const n = p.nutriments || {};
  return {
    name:(function(){const base=String(p.product_name_he || p.product_name || ('מוצר ' + code)).trim(),brand=String(p.brands||'').split(',')[0].trim();return brand&&base.indexOf(brand)<0?base+' – '+brand:base;})(),
    brand:p.brands || '', baseQty:100, unit:'גרם',
    units:(Number(p.serving_quantity)>0&&String(p.serving_quantity_unit||'g').toLowerCase()!=='ml')?[['מנה מהאריזה',Math.round(Number(p.serving_quantity)*10)/10,false]]:[],
    calories:Number(n['energy-kcal_100g']) || 0,
    protein:Number(n.proteins_100g) || 0,
    carbs:Number(n.carbohydrates_100g) || 0,
    fat:Number(n.fat_100g) || 0,
    source:'Open Food Facts', sourceId:code
  };
}

function saveSettings(payload) {
  if(payload&&(payload.usda_api_key||payload.clear_usda_key||payload.openai_api_key||payload.clear_openai_key))requireAdmin_();
  const newUsdaKey = payload && String(payload.usda_api_key || '').trim();
  if (newUsdaKey) verifyUsdaKey_(newUsdaKey);
  if(payload&&Object.prototype.hasOwnProperty.call(payload,'checkin_day')){const d=Number(payload.checkin_day);if(!Number.isInteger(d)||d<0||d>6)throw new Error('יום לא תקין');setSetting_('checkin_day',d);}
  if(payload&&Object.prototype.hasOwnProperty.call(payload,'hidden_workout_plans')){const ids=JSON.parse(String(payload.hidden_workout_plans||'[]'));if(!Array.isArray(ids)||ids.length>300||ids.some(x=>typeof x!=='string'||x.length>200))throw new Error('רשימת תוכניות לא תקינה');setSetting_('hidden_workout_plans',JSON.stringify(ids));}
  ['has_watch','shake_hidden','notifications_in_app'].forEach(k=>{if(payload&&Object.prototype.hasOwnProperty.call(payload,k))setSetting_(k,payload[k]==='on'?'on':'off');});
  if(payload&&Object.prototype.hasOwnProperty.call(payload,'meal_hours')){const h=String(payload.meal_hours||'').split(',').map(Number);if(h.length!==3||h.some(x=>!Number.isInteger(x)||x<0||x>23)||!(h[0]<h[1]&&h[1]<h[2]))throw new Error('שעות לא תקינות');setSetting_('meal_hours','h:'+h.join(','));}
  if(payload&&payload.day_cut){const c=payload.day_cut,d=String(c.date||''),amt=Math.round(Number(c.amount)/10)*10,cap=Math.round((Number(getSettings_().calorie_goal)||2200)*0.2/10)*10;
    if(!/^\d{4}-\d{2}-\d{2}$/.test(d)||!(amt>=0&&amt<=cap))throw new Error('אפשר להוריד עד '+cap+' קל׳');
    const m=dayCuts_(),keep=addDays_(d,-14);Object.keys(m).forEach(k=>{if(k<keep)delete m[k]});m[d]=amt;setSetting_('day_cuts',JSON.stringify(m));}
  if(payload&&Object.prototype.hasOwnProperty.call(payload,'oil_profile')){const v=String(payload.oil_profile||'');if(['s','r','g'].indexOf(v)<0)throw new Error('בחירה לא תקינה');setSetting_('oil_profile',v);}
  if(payload&&Object.prototype.hasOwnProperty.call(payload,'chicken_skin')){setSetting_('chicken_skin',payload.chicken_skin==='with'?'with':'without');}
  if(payload&&Object.prototype.hasOwnProperty.call(payload,'display_name')){const name=String(payload.display_name||'').trim();if(!name||name.length>40)throw new Error('כתוב שם עד 40 תווים');setSetting_('display_name',name);}
  const allowed = ['calorie_goal','protein_goal','free_calories_goal','shake_calories','shake_protein','shake_carbs','shake_fat','day_rollover_hour'];
  Object.keys(payload || {}).forEach(key => {
    if (allowed.indexOf(key) >= 0) setSetting_(key, payload[key]);
  });
  if ((newUsdaKey||(payload&&(payload.clear_usda_key||payload.openai_api_key||payload.clear_openai_key)))&&!isAdmin_()) throw new Error('רק מנהל האפליקציה יכול לשנות מפתחות');
  if (newUsdaKey) {
    PropertiesService.getScriptProperties().setProperty('USDA_API_KEY', newUsdaKey);
  }
  if (payload && payload.clear_usda_key) PropertiesService.getScriptProperties().deleteProperty('USDA_API_KEY');
  const aiKey=payload&&String(payload.openai_api_key||'').trim();
  if(aiKey){if(!/^sk-[A-Za-z0-9_-]{10,}$/.test(aiKey))throw new Error('מפתח OpenAI אינו בפורמט צפוי');PropertiesService.getScriptProperties().setProperty('OPENAI_API_KEY',aiKey)}
  if(payload&&payload.clear_openai_key)PropertiesService.getScriptProperties().deleteProperty('OPENAI_API_KEY');
  return getBootstrapData();
}

function saveQuickAction(payload){
  const name=String(payload&&payload.name||'').trim();
  if(!name)throw new Error('יש להזין שם לקיצור הדרך');
  const rows=getQuickActions_();
  const id=String(payload.id||Utilities.getUuid());
  if(payload.id)untrash_('quick',payload.id);
  const item={id,name,calories:round1_(payload.calories),protein:round1_(payload.protein),carbs:round1_(payload.carbs),fat:round1_(payload.fat)};
  const idx=rows.findIndex(x=>x.id===id); if(idx>=0)rows[idx]=item;else rows.push(item);
  PropertiesService.getScriptProperties().setProperty(userKey_('QUICK_ACTIONS'),JSON.stringify(rows.slice(0,12)));
  return getQuickActions_();
}

function deleteQuickAction(id){
  const item=getQuickActions_().find(x=>x.id===String(id));if(item)trash_('quick',id,'קיצור דרך · '+item.name,item);
  const rows=getQuickActions_().filter(x=>x.id!==String(id));
  PropertiesService.getScriptProperties().setProperty(userKey_('QUICK_ACTIONS'),JSON.stringify(rows));
  return rows;
}

function addQuickAction(payload){
  const item=getQuickActions_().find(x=>x.id===String(payload&&payload.id));
  if(!item)throw new Error('קיצור הדרך לא נמצא');
  return saveFood({date:payload.date||getWorkingDate_(),category:'קבוע',sourceType:'quick_custom',name:item.name,amount:1,baseQty:1,unit:'מנה',calories:item.calories,protein:item.protein,carbs:item.carbs,fat:item.fat,source:'קיצור דרך'});
}

function nightlyMaintenance() {
  nightlyForSheet_();
  getUsers_().forEach(u=>{try{CURRENT_USER_={id:u.id,name:u.name,ss:u.ss,admin:false};APP_SPREADSHEET_=null;nightlyForSheet_();}catch(e){}});
  CURRENT_USER_=null;APP_SPREADSHEET_=null;
}

function nightlyForSheet_() {
  const today = getWorkingDate_();
  const d = new Date(today + 'T12:00:00');
  d.setDate(d.getDate() - 1);
  const yesterday = Utilities.formatDate(d, APP.timezone, 'yyyy-MM-dd');
  closeDay(yesterday);
  try{getTrash();}catch(e){}
}

function saveWorkout(payload) {
  if (!payload || !payload.muscleGroup || !payload.exercise) throw new Error('יש לבחור קבוצת שרירים ותרגיל');
  const sets = (payload.sets || []).filter(s => Number(s.reps) > 0);
  if (!sets.length) throw new Error('יש להזין לפחות סט אחד עם חזרות');
  const oldWorkoutId = payload.workoutId || '';
  const workoutId = Utilities.getUuid();
  const date = payload.date || getWorkingDate_();
  const sessionName = String(payload.sessionName || 'אימון').trim();
  const sessionId = String(payload.sessionId || Utilities.getUuid());
  if(payload.sessionId&&!payload.workoutId){
    const existing=sheet_(APP.sheets.sessions).getDataRange().getValues().slice(1).find(r=>String(r[0])===sessionId);
    if(existing&&String(existing[6])!=='active')throw new Error('האימון הזה כבר הסתיים. פתח אימון חדש כדי להוסיף תרגיל');
  }
  if(!oldWorkoutId){
    const sig=Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5,[sessionId,payload.exerciseId||payload.exercise,JSON.stringify(sets.map(s=>[s.weight,s.reps,s.side||'',s.note||'']))].join('|'),Utilities.Charset.UTF_8));
    const cache=CacheService.getScriptCache(),k=userKey_('sw')+':'+sig;
    if(cache.get(k))return getWorkoutData_();
    cache.put(k,'1',60);
  }
  ensureWorkoutSession_(sessionId,date,sessionName);
  const now = new Date();
  const rows = sets.map((s, i) => [
    Utilities.getUuid(), workoutId, date, now, String(payload.muscleGroup), String(payload.exercise),
    i + 1, s.weight === '' || s.weight === null || s.weight === undefined ? '' : Math.max(0, Number(s.weight) || 0), Math.max(1, Number(s.reps) || 1),
    s.rir === '' || s.rir === undefined ? '' : Math.max(0, Number(s.rir) || 0),
    String(payload.notes || ''), false, String(payload.exerciseId || ''), sessionId, sessionName,
    Number.isInteger(Number(payload.planItemIndex)) && payload.planItemIndex !== '' && payload.planItemIndex != null ? Number(payload.planItemIndex) : '',
    String(s.note||''),JSON.stringify(Array.isArray(s.segments)?s.segments:[]),String(s.side||'')
  ]);
  appendRows_(APP.sheets.workouts, rows);
  if (oldWorkoutId) {
    moveWorkoutVideos_(oldWorkoutId,workoutId,date,String(payload.muscleGroup),String(payload.exercise));
    markWorkoutDeleted_(oldWorkoutId);
  }
  return getWorkoutData_();
}

function ensureWorkoutSession_(id,date,name,type){
  const sh=sheet_(APP.sheets.sessions),rows=sh.getDataRange().getValues();
  const index=rows.findIndex((r,i)=>i>0&&String(r[0])===id&&String(r[6])!=='deleted');
  if(index>=1){if(String(rows[index][2])!==name)sh.getRange(index+1,3).setValue(name);return;}
  appendRows_(APP.sheets.sessions,[[id,date,name,new Date(),'','','active',String(type||'')]]);
}

function createWorkoutSession(payload){
  ensureStructure_();
  const date=String(payload&&payload.date||getWorkingDate_()),name=String(payload&&payload.name||'אימון '+date).trim().slice(0,80);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!name)throw new Error('תאריך או שם אימון אינם תקינים');
  const id=Utilities.getUuid();ensureWorkoutSession_(id,date,name,String(payload&&payload.type||''));
  return {id,workout:getWorkoutData_()};
}

function finishWorkoutSession(payload){
  const id=String(payload&&payload.id||''),sh=sheet_(APP.sheets.sessions),rows=sh.getDataRange().getValues();
  const i=rows.findIndex((r,j)=>j>0&&String(r[0])===id&&r[6]!=='deleted');
  if(i<1)throw new Error('האימון לא נמצא');
  const start=rows[i][3] instanceof Date?rows[i][3]:new Date();
  const minutes=payload.minutes===''||payload.minutes==null?Math.max(1,Math.round((Date.now()-start.getTime())/60000)):Number(payload.minutes);
  if(!Number.isFinite(minutes)||minutes<0||minutes>1440)throw new Error('משך האימון אינו תקין');
  sh.getRange(i+1,5,1,3).setValues([[new Date(),minutes,'finished']]);
  return getWorkoutData_();
}

// v0.19: move a whole workout (and all its exercises) to another date.
function changeWorkoutSessionDate(payload){
  const id=String(payload&&payload.id||''),date=String(payload&&payload.date||'');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new Error('תאריך לא תקין');
  const sh=sheet_(APP.sheets.sessions),rows=sh.getDataRange().getValues();
  const i=rows.findIndex((r,j)=>j>0&&String(r[0])===id&&r[6]!=='deleted');
  if(i<1)throw new Error('האימון לא נמצא');
  sh.getRange(i+1,2).setValue(date);
  const workouts=sheet_(APP.sheets.workouts),values=workouts.getDataRange().getValues();
  values.forEach((r,j)=>{if(j>0&&String(r[13])===id)workouts.getRange(j+1,3).setValue(date);});
  const videos=sheet_(APP.sheets.videos),vrows=videos.getDataRange().getValues(),wids=new Set(values.filter((r,j)=>j>0&&String(r[13])===id).map(r=>String(r[1])));
  vrows.forEach((r,j)=>{if(j>0&&wids.has(String(r[1])))videos.getRange(j+1,3).setValue(date);});
  return getWorkoutData_();
}

function renameWorkoutSession(payload){
  const id=String(payload&&payload.id||''),name=String(payload&&payload.name||'').trim().slice(0,80);
  if(!name)throw new Error('יש לתת שם לאימון');
  const sh=sheet_(APP.sheets.sessions),rows=sh.getDataRange().getValues();
  const i=rows.findIndex((r,j)=>j>0&&String(r[0])===id&&r[6]!=='deleted');
  if(i<1)throw new Error('האימון לא נמצא');
  sh.getRange(i+1,3).setValue(name);
  const workouts=sheet_(APP.sheets.workouts),values=workouts.getDataRange().getValues();
  values.forEach((r,j)=>{if(j>0&&String(r[13])===id&&r[11]!==true)workouts.getRange(j+1,15).setValue(name)});
  return getWorkoutData_();
}

function moveExerciseToSession(payload){
  const workoutId=String(payload&&payload.workoutId||''),sessionId=String(payload&&payload.sessionId||'');
  const target=sheet_(APP.sheets.sessions).getDataRange().getValues().slice(1).find(r=>String(r[0])===sessionId&&r[6]!=='deleted');
  if(!target)throw new Error('אימון היעד לא נמצא');
  const sh=sheet_(APP.sheets.workouts),rows=sh.getDataRange().getValues();let found=false;
  rows.forEach((r,i)=>{if(i>0&&String(r[1])===workoutId&&r[11]!==true){sh.getRange(i+1,3).setValue(target[1]);sh.getRange(i+1,14,1,2).setValues([[sessionId,String(target[2])]]);found=true}});
  if(!found)throw new Error('התרגיל לא נמצא');
  const videos=sheet_(APP.sheets.videos),vr=videos.getDataRange().getValues();vr.forEach((r,i)=>{if(i>0&&String(r[1])===workoutId&&r[8]!==true)videos.getRange(i+1,3).setValue(target[1])});
  return getWorkoutData_();
}

function uploadWorkoutVideo(form) {
  const workoutId=String(form&&form.workoutId||'').trim();
  const blob=form&&form.video;
  if(!workoutId||!blob)throw new Error('יש לבחור תרגיל שמור וסרטון');
  const data=sheet_(APP.sheets.workouts).getDataRange().getValues();
  const workout=data.slice(1).find(r=>String(r[1])===workoutId&&r[11]!==true);
  if(!workout)throw new Error('התרגיל לא נמצא ביומן');
  const mime=String(blob.getContentType()||'');
  if(!/^video\//i.test(mime))throw new Error('יש לבחור קובץ וידאו');
  const bytes=blob.getBytes();
  if(!bytes.length||bytes.length>15*1024*1024)throw new Error('הסרטון חייב להיות קצר מ־15MB');
  const folder=workoutVideoFolder_();
  const safeName=String(blob.getName()||'clip').replace(/[^\p{L}\p{N}._-]+/gu,'_').slice(-80);
  const file=folder.createFile(Utilities.newBlob(bytes,mime,formatDateValue_(workout[2])+'_'+safeName));
  try{
    appendRows_(APP.sheets.videos,[[Utilities.getUuid(),workoutId,formatDateValue_(workout[2]),String(workout[4]),String(workout[5]),file.getId(),file.getName(),new Date(),false]]);
  }catch(err){file.setTrashed(true);throw err;}
  return getWorkoutData_();
}

// v0.17: big videos go to Drive through a resumable upload, in pieces of a few MB.
function startVideoUpload(payload){
  const workoutId=String(payload&&payload.workoutId||'').trim(),size=Number(payload&&payload.size)||0;
  const mime=/^video\//i.test(String(payload&&payload.mime||''))?String(payload.mime):'video/mp4';
  if(!workoutId)throw new Error('יש לבחור תרגיל שמור');
  if(!(size>0)||size>500*1024*1024)throw new Error('הסרטון חייב להיות קטן מ-500MB');
  const workout=sheet_(APP.sheets.workouts).getDataRange().getValues().slice(1).find(r=>String(r[1])===workoutId&&r[11]!==true);
  if(!workout)throw new Error('התרגיל לא נמצא ביומן');
  const folder=workoutVideoFolder_();
  const safeName=String(payload.name||'clip').replace(/[^\p{L}\p{N}._-]+/gu,'_').slice(-80);
  const name=formatDateValue_(workout[2])+'_'+safeName;
  const origin=/^https:\/\/[a-z0-9.-]+$/i.test(String(payload.origin||''))?String(payload.origin):'';
  const open=withOrigin=>{
    const headers={Authorization:'Bearer '+ScriptApp.getOAuthToken(),'X-Upload-Content-Type':mime,'X-Upload-Content-Length':String(size)};
    if(withOrigin)headers.Origin=origin;
    return UrlFetchApp.fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name',{
      method:'post',contentType:'application/json; charset=UTF-8',muteHttpExceptions:true,
      payload:JSON.stringify({name,mimeType:mime,parents:[folder.getId()]}),headers});
  };
  let res=null;
  if(origin){try{res=open(true);}catch(e){res=null;}}
  if(!res||res.getResponseCode()!==200)res=open(false);
  const headers=res.getHeaders(),url=headers.Location||headers.location;
  if(res.getResponseCode()!==200||!url)throw new Error('Drive לא פתח העלאה ('+res.getResponseCode()+'). נסה שוב.');
  const ticket=Utilities.getUuid();
  CacheService.getScriptCache().put(userKey_('vid')+'_'+ticket,JSON.stringify({url,workoutId,size,mime}),21600);
  return {ticket,uploadUrl:url};
}

function registerVideo_(info,fileId,ticket){
  const workout=sheet_(APP.sheets.workouts).getDataRange().getValues().slice(1).find(r=>String(r[1])===info.workoutId&&r[11]!==true);
  const file=DriveApp.getFileById(fileId);
  if(!workout){file.setTrashed(true);throw new Error('התרגיל נמחק בזמן ההעלאה');}
  const already=sheet_(APP.sheets.videos).getDataRange().getValues().some((r,i)=>i>0&&String(r[5])===String(fileId));
  if(!already)appendRows_(APP.sheets.videos,[[Utilities.getUuid(),info.workoutId,formatDateValue_(workout[2]),String(workout[4]),String(workout[5]),fileId,file.getName(),new Date(),false]]);
  CacheService.getScriptCache().remove(userKey_('vid')+'_'+ticket);
  return {workout:getWorkoutData_()};
}

// v0.18: after a direct upload from the device, confirm with Drive that the file arrived and attach it.
function checkVideoUpload(ticket){
  const raw=CacheService.getScriptCache().get(userKey_('vid')+'_'+String(ticket||''));
  if(!raw)throw new Error('ההעלאה פגה. נסה להעלות שוב.');
  const info=JSON.parse(raw);
  const res=UrlFetchApp.fetch(info.url,{method:'put',muteHttpExceptions:true,headers:{'Content-Range':'bytes */'+info.size}});
  const code=res.getResponseCode();
  if(code===200||code===201)return registerVideo_(info,JSON.parse(res.getContentText()).id,ticket);
  if(code===308){const range=(res.getHeaders().Range||res.getHeaders().range||'');const m=String(range).match(/bytes=0-(\d+)/);return {received:m?Number(m[1])+1:0};}
  throw new Error('ההעלאה לא הושלמה ('+code+')');
}

function uploadVideoChunk(payload){
  const raw=CacheService.getScriptCache().get(userKey_('vid')+'_'+String(payload&&payload.ticket||''));
  if(!raw)throw new Error('ההעלאה פגה. נסה להעלות שוב.');
  const info=JSON.parse(raw),start=Number(payload.start)||0,bytes=Utilities.base64Decode(String(payload.data||''));
  if(!bytes.length)throw new Error('חלק ריק בסרטון');
  const end=start+bytes.length-1;
  const res=UrlFetchApp.fetch(info.url,{method:'put',payload:bytes,contentType:info.mime,muteHttpExceptions:true,headers:{'Content-Range':'bytes '+start+'-'+end+'/'+info.size}});
  const code=res.getResponseCode();
  if(code===308)return {received:end+1};
  if(code!==200&&code!==201)throw new Error('ההעלאה נכשלה ('+code+')');
  return registerVideo_(info,JSON.parse(res.getContentText()).id,payload.ticket);
}

function deleteWorkoutVideo(videoId) {
  const sh=sheet_(APP.sheets.videos),rows=sh.getDataRange().getValues();
  const idx=rows.findIndex((r,i)=>i>0&&String(r[0])===String(videoId)&&r[8]!==true);
  if(idx<1)throw new Error('הסרטון לא נמצא');
  sh.getRange(idx+1,9).setValue(true);
  try{DriveApp.getFileById(String(rows[idx][5])).setTrashed(true)}catch(e){}
  trash_('video',videoId,'סרטון · '+String(rows[idx][4]||''));
  return getWorkoutData_();
}

function workoutVideoFolder_(){
  const props=PropertiesService.getScriptProperties();
  const id=props.getProperty('WORKOUT_VIDEO_FOLDER_ID');
  if(id){try{return DriveApp.getFolderById(id)}catch(e){}}
  const folder=DriveApp.createFolder('המעקב של עילאי - סרטוני אימון');
  props.setProperty('WORKOUT_VIDEO_FOLDER_ID',folder.getId());
  return folder;
}

function moveWorkoutVideos_(oldId,newId,date,group,exercise){
  const sh=sheet_(APP.sheets.videos),rows=sh.getDataRange().getValues();
  rows.forEach((r,i)=>{if(i>0&&String(r[1])===String(oldId)&&r[8]!==true)sh.getRange(i+1,2,1,4).setValues([[newId,date,group,exercise]])});
}

function trashWorkoutVideos_(workoutIds){
  const ids=new Set(workoutIds.map(String)),sh=sheet_(APP.sheets.videos),rows=sh.getDataRange().getValues();
  rows.forEach((r,i)=>{if(i>0&&ids.has(String(r[1]))&&r[8]!==true){sh.getRange(i+1,9).setValue(true);try{DriveApp.getFileById(String(r[5])).setTrashed(true)}catch(e){}}});
}

function saveExercise(payload) {
  if (!payload || !payload.muscleGroup || !String(payload.name || '').trim()) throw new Error('יש להזין קבוצת שרירים ושם תרגיל');
  const sh = sheet_(APP.sheets.exercises);
  allowCustomExerciseGroups_(sh);
  const values = sh.getDataRange().getValues();
  const exists = values.some((r,i)=>i>0 && normalize_(r[1])===normalize_(payload.muscleGroup) && normalize_(r[2])===normalize_(payload.name));
  if (!exists) appendRows_(APP.sheets.exercises,[[Utilities.getUuid(),String(payload.muscleGroup),String(payload.name).trim(),true,activeRowCount_(sh)+1,String(payload.notes||''),String(payload.equipment||guessEquipment_(payload.name))]]);
  return getWorkoutData_();
}

function updateExercise(payload){
  const id=String(payload&&payload.id||''),name=String(payload&&payload.name||'').trim();
  if(!id||!name)throw new Error('חסרים פרטי התרגיל');
  const sh=sheet_(APP.sheets.exercises),values=sh.getDataRange().getValues();
  const idx=values.findIndex((r,i)=>i>0&&String(r[0])===id);if(idx<1)throw new Error('התרגיל לא נמצא');
  sh.getRange(idx+1,3).setValue(name);return getWorkoutData_();
}

function deleteExercise(id){
  const sh=sheet_(APP.sheets.exercises),values=sh.getDataRange().getValues();
  const idx=values.findIndex((r,i)=>i>0&&String(r[0])===String(id));if(idx<1)throw new Error('התרגיל לא נמצא');
  sh.getRange(idx+1,4).setValue(false);trash_('exercise',id,'תרגיל ברשימה · '+String(values[idx][2]));return getWorkoutData_();
}

function saveWorkoutPlan(payload) {
  ensureStructure_();
  const name=String(payload&&payload.name||'').trim();
  const items=payload&&payload.items;
  if(!name||name.length>80)throw new Error('יש לתת לתוכנית שם של עד 80 תווים');
  if(!Array.isArray(items)||!items.length||items.length>20)throw new Error('בחר בין תרגיל אחד ל־20 תרגילים');
  const catalog=getExerciseCatalog_();
  const normalized=items.map(x=>{
    const group=String(x.group||'').trim(),id=String(x.exerciseId||'');
    const exercise=(catalog[group]||[]).find(e=>e.id===id);
    if(!exercise)throw new Error('אחד התרגילים הוסר מהרשימה. בחר אותו מחדש לפני שמירת התוכנית');
    const sets=Number(x.sets),reps=x.reps===''||x.reps==null?'':Number(x.reps);
    if(!Number.isInteger(sets)||sets<1||sets>10||reps!==''&&(!Number.isInteger(reps)||reps<1||reps>50))throw new Error('מספר סטים או חזרות לא תקין');
    const item={group,exerciseId:id,name:exercise.name,sets,reps};
    if(x.planContext){const c=x.planContext;if(!['home','gym'].includes(c.place)||!['free','machines'].includes(c.mode))throw new Error('מקום או ציוד לא תקינים');item.planContext={place:c.place,mode:c.mode};}
    if(x.durationMinutes!=null){const minutes=Number(x.durationMinutes);if(group!=='אירובי'||!(minutes>=1&&minutes<=120))throw new Error('משך אירובי לא תקין');item.durationMinutes=minutes;}
    if(x.notes)item.notes=String(x.notes).slice(0,700);
    if(x.timing){const t=x.timing;if(!(Number(t.set)>0&&Number(t.set)<=10&&Number(t.rest)>=0&&Number(t.rest)<=10&&Number(t.warmup)>=0&&Number(t.warmup)<=30&&[30,40,50].includes(Number(t.target))))throw new Error('זמני תוכנית לא תקינים');item.timing={set:Number(t.set),rest:Number(t.rest),warmup:Number(t.warmup),target:Number(t.target)};}
    return item;
  });
  const sh=sheet_(APP.sheets.plans),rows=sh.getDataRange().getValues();
  const id=String(payload.id||Utilities.getUuid());
  const old=rows.findIndex((r,i)=>i>0&&String(r[0])===id&&r[3]!==false);
  if(payload.id&&old<1)throw new Error('התוכנית לעריכה לא נמצאה');
  if(rows.some((r,i)=>i>0&&i!==old&&r[3]!==false&&normalize_(r[1])===normalize_(name)))throw new Error('כבר קיימת תוכנית בשם הזה');
  const values=[id,name,JSON.stringify(normalized),true,new Date(),String(payload.category||'כללי').trim().slice(0,40)];
  if(old>0)sh.getRange(old+1,1,1,6).setValues([values]);
  else appendRows_(APP.sheets.plans,[values]);
  return getWorkoutData_();
}

function deleteWorkoutPlan(id) {
  const sh=sheet_(APP.sheets.plans),rows=sh.getDataRange().getValues();
  const idx=rows.findIndex((r,i)=>i>0&&String(r[0])===String(id)&&r[3]!==false);
  if(idx<1)throw new Error('התוכנית לא נמצאה');
  sh.getRange(idx+1,4).setValue(false);
  trash_('plan',id,'תוכנית · '+String(rows[idx][1]));
  return getWorkoutData_();
}

function restoreWorkoutPlan(id){
  untrash_('plan',id);
  const sh=sheet_(APP.sheets.plans),rows=sh.getDataRange().getValues();
  const idx=rows.findIndex((r,i)=>i>0&&String(r[0])===String(id)&&r[3]===false);
  if(idx<1)throw new Error('התוכנית לא נמצאה');
  sh.getRange(idx+1,4).setValue(true);
  return getWorkoutData_();
}

function restoreWorkoutVideo(videoId){
  untrash_('video',videoId);
  const sh=sheet_(APP.sheets.videos),rows=sh.getDataRange().getValues();
  const idx=rows.findIndex((r,i)=>i>0&&String(r[0])===String(videoId)&&r[8]===true);
  if(idx<1)throw new Error('הסרטון לא נמצא');
  sh.getRange(idx+1,9).setValue(false);
  try{DriveApp.getFileById(String(rows[idx][5])).setTrashed(false)}catch(e){}
  return getWorkoutData_();
}

function deleteWorkoutSessions(ids){
  (ids||[]).forEach(id=>{try{deleteWorkoutSession_(id);}catch(e){}});
  return getWorkoutData_();
}

function restoreWorkoutSessions(list){
  (list||[]).forEach(x=>{try{restoreWorkoutSession_(x);}catch(e){}});
  return getWorkoutData_();
}

function getWorkoutPlans_(catalog) {
  const rows=sheet_(APP.sheets.plans).getDataRange().getValues();
  return rows.slice(1).filter(r=>r[0]&&r[3]!==false).map(r=>{
    let items=[];
    try{items=JSON.parse(String(r[2]||'[]'))}catch(err){}
    if(!Array.isArray(items))items=[];
    return {id:String(r[0]),name:String(r[1]),category:String(r[5]||'כללי'),trainingPlace:items[0]?.planContext?.place||'',trainingMode:items[0]?.planContext?.mode||'',items:items.map(x=>{
      const current=(catalog[x.group]||[]).find(e=>e.id===x.exerciseId);
      return {group:x.group,exerciseId:x.exerciseId,name:current?current.name:x.name,sets:x.sets,reps:x.reps,timing:x.timing,durationMinutes:x.durationMinutes,notes:x.notes,equipment:current?.equipment,sourceUrl:current?.sourceUrl,removed:!current};
    })};
  });
}

function deleteWorkout(workoutId) {
  markWorkoutDeleted_(workoutId);
  try{const r=sheet_(APP.sheets.workouts).getDataRange().getValues().find((x,i)=>i>0&&String(x[1])===String(workoutId));trash_('workout',workoutId,'תרגיל · '+(r?String(r[5])+' · '+formatDateValue_(r[2]):''));}catch(e){}
  trashWorkoutVideos_([workoutId]);
  return getWorkoutData_();
}

function markWorkoutDeleted_(workoutId) {
  const sh = sheet_(APP.sheets.workouts);
  const values = sh.getDataRange().getValues();
  let changed = false;
  for (let i=1;i<values.length;i++) {
    if (String(values[i][1])===String(workoutId) && values[i][11]!==true) { sh.getRange(i+1,12).setValue(true); changed=true; }
  }
  if (!changed) throw new Error('האימון לא נמצא');
}

// v0.16: undo for a deleted exercise, including its videos.
function restoreWorkout(workoutId) {
  untrash_('workout',workoutId);
  const sh = sheet_(APP.sheets.workouts), values = sh.getDataRange().getValues();
  let changed = false;
  for (let i=1;i<values.length;i++) if (String(values[i][1])===String(workoutId) && values[i][11]===true) { sh.getRange(i+1,12).setValue(false); changed=true; }
  if (!changed) throw new Error('האימון לא נמצא');
  restoreWorkoutVideos_([workoutId]);
  return getWorkoutData_();
}

function restoreWorkoutVideos_(workoutIds){
  const ids=new Set(workoutIds.map(String)),sh=sheet_(APP.sheets.videos),rows=sh.getDataRange().getValues();
  rows.forEach((r,i)=>{if(i>0&&ids.has(String(r[1]))&&r[8]===true){sh.getRange(i+1,9).setValue(false);try{DriveApp.getFileById(String(r[5])).setTrashed(false)}catch(e){}}});
}

function restoreWorkoutSession(payload) {
  restoreWorkoutSession_(payload);
  return getWorkoutData_();
}

function restoreWorkoutSession_(payload) {
  untrash_('session',String(payload&&payload.id||''));
  const sessionId=String(payload&&payload.id||''),workoutIds=(payload&&payload.workoutIds||[]).map(String);
  const sessions=sheet_(APP.sheets.sessions),sr=sessions.getDataRange().getValues();
  const own=sr.findIndex((r,i)=>i>0&&String(r[0])===sessionId&&String(r[6])==='deleted');
  if(own>0)sessions.getRange(own+1,7).setValue(sr[own][4]?'finished':'active');
  const ids=new Set(workoutIds),sh=sheet_(APP.sheets.workouts),values=sh.getDataRange().getValues();
  for(let i=1;i<values.length;i++)if(ids.has(String(values[i][1]))&&String(values[i][13])===sessionId&&values[i][11]===true)sh.getRange(i+1,12).setValue(false);
  restoreWorkoutVideos_(workoutIds);
}

// v0.16: a workout that was finished by mistake can be opened again.
function reopenWorkoutSession(payload){
  const id=String(payload&&payload.id||''),sh=sheet_(APP.sheets.sessions),rows=sh.getDataRange().getValues();
  const i=rows.findIndex((r,j)=>j>0&&String(r[0])===id&&String(r[6])!=='deleted');
  if(i<1)throw new Error('האימון לא נמצא');
  sh.getRange(i+1,5,1,3).setValues([['','','active']]);
  return getWorkoutData_();
}

function deleteWorkoutSession(sessionId) {
  deleteWorkoutSession_(sessionId);
  return getWorkoutData_();
}

function deleteWorkoutSession_(sessionId) {
  const sh=sheet_(APP.sheets.workouts),values=sh.getDataRange().getValues(); let changed=false;
  const workoutIds=[];
  for(let i=1;i<values.length;i++)if(String(values[i][13])===String(sessionId)&&values[i][11]!==true){sh.getRange(i+1,12).setValue(true);workoutIds.push(values[i][1]);changed=true;}
  const sessions=sheet_(APP.sheets.sessions),sr=sessions.getDataRange().getValues();
  const ownSession=sr.findIndex((r,i)=>i>0&&String(r[0])===String(sessionId)&&r[6]!=='deleted');
  if(!changed&&ownSession<1)throw new Error('האימון לא נמצא');
  trash_('session',sessionId,'אימון · '+(ownSession>0?String(sr[ownSession][2])+' · '+formatDateValue_(sr[ownSession][1]):''),{workoutIds:workoutIds.map(String)});
  trashWorkoutVideos_(workoutIds);
  if(ownSession>0)sessions.getRange(ownSession+1,7).setValue('deleted');
}

function getExerciseProgress(exercise) {
  const target = normalize_(exercise);
  const values = sheet_(APP.sheets.workouts).getDataRange().getValues();
  const byDate = {};
  values.slice(1).forEach(r=>{
    if (!r[0] || r[11]===true || normalize_(r[5])!==target) return;
    const date=formatDateValue_(r[2]);
    if(!byDate[date])byDate[date]={date,maxWeight:0,maxReps:0,volume:0,sets:0,e1rm:0};
    const weight=Number(r[7])||0,reps=Number(r[8])||0;
    byDate[date].maxWeight=Math.max(byDate[date].maxWeight,weight);
    byDate[date].maxReps=Math.max(byDate[date].maxReps,reps);
    if(weight>0&&reps>0)byDate[date].e1rm=Math.max(byDate[date].e1rm,round1_(weight*(1+Math.min(reps,12)/30)));
    byDate[date].volume=round1_(byDate[date].volume+weight*reps);
    byDate[date].sets++;
  });
  getWorkoutVideos_().forEach(v=>{if(normalize_(v.exercise)===target&&byDate[v.date]){if(!byDate[v.date].videos)byDate[v.date].videos=[];byDate[v.date].videos.push(v)}});
  return Object.values(byDate).sort((a,b)=>a.date.localeCompare(b.date)).slice(-40);
}

function getWorkoutVideos_(){
  return sheet_(APP.sheets.videos).getDataRange().getValues().slice(1).filter(r=>r[0]&&r[8]!==true).map(r=>({id:String(r[0]),workoutId:String(r[1]),date:formatDateValue_(r[2]),muscleGroup:String(r[3]),exercise:String(r[4]),url:'https://drive.google.com/file/d/'+encodeURIComponent(String(r[5]))+'/view',previewUrl:'https://drive.google.com/file/d/'+encodeURIComponent(String(r[5]))+'/preview',name:String(r[6]||'סרטון'),createdAt:String(r[7]||'')}));
}

function getWorkoutData_() {
  const exercises = getExerciseCatalog_();
  const plans = getWorkoutPlans_(exercises);
  const videos=getWorkoutVideos_(),videosByWorkout={};
  videos.forEach(v=>(videosByWorkout[v.workoutId]||(videosByWorkout[v.workoutId]=[])).push(v));
  const values = sheet_(APP.sheets.workouts).getDataRange().getValues();
  const groups = {};
  values.slice(1).forEach(r=>{
    if(!r[0] || r[11]===true)return;
    const id=String(r[1]);
    if(!groups[id])groups[id]={id,date:formatDateValue_(r[2]),createdAt:String(r[3]||''),muscleGroup:String(r[4]),exercise:String(r[5]),notes:String(r[10]||''),exerciseId:String(r[12]||''),sessionId:String(r[13]||formatDateValue_(r[2])+'|אימון'),sessionName:String(r[14]||'אימון'),planItemIndex:r[15]===''?'':Number(r[15]),sets:[],videos:videosByWorkout[id]||[]};
    let segments=[];try{segments=JSON.parse(String(r[17]||'[]'))}catch(e){}
    groups[id].sets.push({set:Number(r[6])||0,weight:r[7]===''?null:Number(r[7])||0,reps:Number(r[8])||0,rir:r[9]===''?'':Number(r[9]),note:String(r[16]||''),segments:Array.isArray(segments)?segments:[],side:String(r[18]||'')});
  });
  const history=Object.values(groups).sort((a,b)=>String(b.date).localeCompare(String(a.date)) || new Date(b.createdAt)-new Date(a.createdAt));
  const sessions={};
  history.forEach(x=>{if(!sessions[x.sessionId])sessions[x.sessionId]={id:x.sessionId,date:x.date,name:x.sessionName,items:[]};sessions[x.sessionId].items.push(x);});
  sheet_(APP.sheets.sessions).getDataRange().getValues().slice(1).forEach(r=>{if(!r[0]||String(r[6])==='deleted')return;const id=String(r[0]);if(!sessions[id])sessions[id]={id,date:formatDateValue_(r[1]),name:String(r[2]),items:[]};sessions[id].name=String(r[2]||sessions[id].name);sessions[id].type=String(r[7]||(/^משיכה/.test(sessions[id].name)?'משיכה':/^דחיפה/.test(sessions[id].name)?'דחיפה':''));sessions[id].startedAt=String(r[3]||'');sessions[id].durationMinutes=r[5]===''?'':Number(r[5]);sessions[id].status=String(r[6]||'active');});
  return {exercises,plans,history,sessions:Object.values(sessions).sort((a,b)=>b.date.localeCompare(a.date)),removedExercises:getRemovedExercises_()};
}

function getRemovedExercises_(){
  const active=new Set();
  const values=sheet_(APP.sheets.exercises).getDataRange().getValues().slice(1).filter(r=>r[0]);
  values.forEach(r=>{if(r[3]!==false)active.add(normalize_(r[1])+'|'+normalize_(r[2]));});
  return values.filter(r=>r[3]===false&&!active.has(normalize_(r[1])+'|'+normalize_(r[2]))).map(r=>({id:String(r[0]),group:String(r[1]),name:String(r[2])}));
}

function restoreExercise(id){
  untrash_('exercise',id);
  const sh=sheet_(APP.sheets.exercises),values=sh.getDataRange().getValues();
  const idx=values.findIndex((r,i)=>i>0&&String(r[0])===String(id));if(idx<1)throw new Error('התרגיל לא נמצא');
  sh.getRange(idx+1,4).setValue(true);return getWorkoutData_();
}

function getExerciseCatalog_() {
  const out={};
  const values=sheet_(APP.sheets.exercises).getDataRange().getValues(),specs=new Map(builtinExerciseSpecs_().map(x=>[normalize_(x.group)+'|'+normalize_(x.name),x]));
  values.slice(1).filter(r=>r[0]&&r[3]!==false).sort((a,b)=>(Number(a[4])||0)-(Number(b[4])||0)).forEach(r=>{
    const group=String(r[1]); if(!out[group])out[group]=[];
    let meta=specs.get(normalize_(r[1])+'|'+normalize_(r[2]))||{};const raw=String(r[5]||'');if(raw.startsWith('FITPRO_EXERCISE:'))try{meta=JSON.parse(raw.slice(16))}catch(_){}
    out[group].push({id:String(r[0]),name:String(r[2]),notes:raw&&!raw.startsWith('FITPRO_EXERCISE:')?raw:meta.instructions||raw,equipment:String(r[6]||guessEquipment_(r[2])),requires:meta.requires||[],sourceUrl:meta.source||''});
  });
  return out;
}

// v0.23: one read per sheet while building the day answer (the same sheets were read 2-4 times before).
let READ_MEMO_=null;
function readValues_(name){
  if(READ_MEMO_){if(!READ_MEMO_[name])READ_MEMO_[name]=sheet_(name).getDataRange().getValues();return READ_MEMO_[name];}
  return sheet_(name).getDataRange().getValues();
}
function withReadMemo_(fn){const outer=READ_MEMO_;if(!outer)READ_MEMO_={};try{return fn();}finally{if(!outer)READ_MEMO_=null;}}

function getDayData_(date) {
  return withReadMemo_(()=>{
    const entries=getEntriesForDate_(date),settings=getSettings_();
    return {date,entries,totals:calculateTotalsFromEntries_(entries,settings,date),history:getHistory_(60),recentFoods:getRecentFoods_(10),myFoods:getMyFoods_()};
  });
}

function getMealOptions_(includeHidden) {
  const values = sheet_(APP.sheets.meals).getDataRange().getValues();
  const out = {'בוקר':[], 'צהריים':[], 'ערב':[]};
  const groups = {};
  const hidden=new Set(getHiddenMealKeys_());
  for (let i = 1; i < values.length; i++) {
    const r = values[i];
    const category = String(r[0] || '').trim();
    const option = String(r[1] || '').trim();
    if (!out[category] || !option || !r[3] || r[12]===false) continue;
    const mealId=String(r[13]||''),key=mealId||category+'|'+option;
    if (!groups[key]) groups[key] = {id:key,key,category,option,isCustom:!!mealId,title:String(r[10]||''),hidden:hidden.has(key),ingredients:[]};
    const estimated = estimateMacros_(String(r[3]), Number(r[4]) || 0, String(r[5] || ''), Number(r[6]) || 0, Number(r[7]) || 0);
    groups[key].ingredients.push({
      name:String(r[3]), amount:Number(r[4]) || 0, unit:String(r[5] || 'גרם'),
      calories:Number(r[6]) || 0, protein:Number(r[7]) || 0,
      carbs:r[8] === '' || r[8] === undefined ? estimated.carbs : Number(r[8]) || 0,
      fat:r[9] === '' || r[9] === undefined ? estimated.fat : Number(r[9]) || 0
    });
  }
  Object.keys(groups).forEach(key => {
    const meal = groups[key];
    meal.calories = round1_(meal.ingredients.reduce((s,x)=>s+x.calories,0));
    meal.protein = round1_(meal.ingredients.reduce((s,x)=>s+x.protein,0));
    meal.carbs = round1_(meal.ingredients.reduce((s,x)=>s+x.carbs,0));
    meal.fat = round1_(meal.ingredients.reduce((s,x)=>s+x.fat,0));
    if(!meal.title)meal.title = meal.ingredients.slice(0,3).map(x=>x.name).join(' + ');
    if(includeHidden||!meal.hidden)out[meal.category].push(meal);
  });
  Object.keys(out).forEach(k => out[k].sort((a,b)=>(a.isCustom?1:0)-(b.isCustom?1:0)||(Number(a.option)||999)-(Number(b.option)||999)||a.title.localeCompare(b.title,'he')));
  return out;
}

function hideMeal(payload){
  const key=String(payload&&payload.key||'');if(!key)throw new Error('הארוחה לא נמצאה');
  const hidden=getHiddenMealKeys_();if(hidden.indexOf(key)<0){hidden.push(key);trash_('builtin',key,'ארוחה · '+key.replace('|',' '));}
  PropertiesService.getScriptProperties().setProperty(userKey_('HIDDEN_MEALS'),JSON.stringify(hidden));
  return {meals:getMealOptions_(),hiddenMeals:getHiddenMealSummaries_()};
}

function restoreMeal(key){
  untrash_('builtin',key);
  const hidden=getHiddenMealKeys_().filter(x=>x!==String(key));
  PropertiesService.getScriptProperties().setProperty(userKey_('HIDDEN_MEALS'),JSON.stringify(hidden));
  return {meals:getMealOptions_(),hiddenMeals:getHiddenMealSummaries_()};
}

function getHiddenMealKeys_(){
  try{return JSON.parse(PropertiesService.getScriptProperties().getProperty(userKey_('HIDDEN_MEALS'))||'[]');}catch(e){return[];}
}

function getHiddenMealSummaries_(){
  return Object.values(getMealOptions_(true)).flat().filter(x=>x.hidden).map(hiddenMealSummary_);
}

function hiddenMealSummary_(x){return {key:x.key,category:x.category,title:x.isCustom?x.title:'אופציה '+x.option+' — '+x.title};}

function getEntriesForDate_(date) {
  const values = readValues_(APP.sheets.entries);
  return values.slice(1).filter(r => r[0] && formatDateValue_(r[1]) === date && r[14] !== true).map(r => ({
    id:String(r[0]), date:formatDateValue_(r[1]), createdAt:String(r[2]||''), category:String(r[3]), sourceType:String(r[4]),
    mealOption:String(r[5] || ''), name:String(r[6]), amount:Number(r[7]) || 0, unit:String(r[8]),
    calories:Number(r[9]) || 0, protein:Number(r[10]) || 0, carbs:Number(r[11]) || 0,
    fat:Number(r[12]) || 0, source:String(r[13] || ''), notes:String(r[15] || ''), groupId:String(r[16] || '')
  }));
}

function calculateTotals_(date) {
  const entries = getEntriesForDate_(date);
  const settings = getSettings_();
  return calculateTotalsFromEntries_(entries,settings,date);
}


// 2.7.0: day-to-day shift of the goal.
// No event this week: what was not eaten yesterday moves to today (up to 300).
// Yesterday over the goal: the user chose how much to take off today (saved in day_cuts, up to 20% of the goal).
// Never below the daily minimum of bankContext_.
function dayCuts_(settings){try{const m=JSON.parse(String((settings||getSettings_()).day_cuts||'{}'));return m&&typeof m==='object'?m:{}}catch(_){return {}}}
function dayShift_(date,settings,goalBefore){
  const s=settings||getSettings_(),today=getWorkingDateFromSettings_(s),out={total:0,plus:0,cut:0};
  if(date>today)return out;
  const base=Number(s.calorie_goal)||2200,ctx=bankContext_(s);
  const y=addDays_(date,-1),events=listBankEvents_(s);
  const eventSoon=events.some(e=>e.date>=y&&e.date<=addDays_(date,6));
  if(!eventSoon){
    const ye=getEntriesForDate_(y),eaten=ye.reduce((n,x)=>n+(Number(x.calories)||0),0);
    const goalY=base+bankAdjust_(y,events,s).delta;
    const under=goalY-eaten;
    if(eaten>=goalY*0.5&&under>=50)out.plus=Math.min(300,Math.round(under/10)*10);
  }
  const cut=Number(dayCuts_(s)[date])||0;
  if(cut>0)out.cut=Math.min(cut,Math.round(base*0.2/10)*10);
  let total=out.plus-out.cut;
  const floor=ctx.noDeficit?Math.max(goalBefore,ctx.minDay):ctx.minDay;
  if(goalBefore+total<floor)total=Math.min(0,floor-goalBefore);
  out.total=total;return out;
}
function calculateTotalsFromEntries_(entries,settings,date){
  const total = key => round1_(entries.reduce((s,x)=>s+(Number(x[key])||0),0));
  const calories = total('calories');
  const protein = total('protein');
  const baseGoal = Number(settings.calorie_goal || 2200);
  // v0.31: the calorie bank moves the goal of specific days; protein never changes.
  const bank = date ? bankAdjust_(date,null,settings) : {delta:0,items:[]};
  const shift = date ? dayShift_(date,settings,baseGoal+bank.delta) : {total:0,plus:0,cut:0};
  const calorieGoal = Math.round(baseGoal + bank.delta + shift.total);
  const proteinGoal = Number(settings.protein_goal || 130);
  const freeGoal = Number(settings.free_calories_goal || 250);
  const freeUsed = round1_(entries.filter(x=>x.sourceType==='free'||x.category==='חופשי').reduce((s,x)=>s+(Number(x.calories)||0),0));
  return {calories, protein, carbs:total('carbs'), fat:total('fat'),
    remaining:round1_(calorieGoal-calories), proteinRemaining:round1_(proteinGoal-protein),
    freeUsed, freeRemaining:round1_(freeGoal-freeUsed), calorieGoal, proteinGoal, freeGoal, baseGoal, bank, shift};
}

function getHistory_(days) {
  const sh = sheet_(APP.sheets.summary);
  const values = readValues_(APP.sheets.summary);
  // v0.27.1: one row per date (older versions could leave duplicates of the same day)
  const byDate={};
  values.slice(1).filter(r=>r[0]).forEach(r=>{
    const x={date:formatDateValue_(r[0]), calories:Number(r[1])||0, protein:Number(r[2])||0,
      carbs:Number(r[3])||0, fat:Number(r[4])||0, weight:r[5] === '' ? '' : Number(r[5]),
      bodyFat:r[6] === '' ? '' : Number(r[6]), note:String(r[7]||''), status:String(r[9]||'')};
    const old=byDate[x.date];
    if(!old){byDate[x.date]=x;return;}
    byDate[x.date]={...old,...x,calories:Math.max(old.calories,x.calories),protein:Math.max(old.protein,x.protein),carbs:Math.max(old.carbs,x.carbs),fat:Math.max(old.fat,x.fat),weight:x.weight!==''?x.weight:old.weight,bodyFat:x.bodyFat!==''?x.bodyFat:old.bodyFat,note:x.note||old.note};
  });
  const rows=Object.values(byDate).sort((a,b)=>b.date.localeCompare(a.date));
  return days===0?rows:rows.slice(0,days||30);
}

function touchDay_(date) {
  const old = getSummaryRow_(date);
  const totals = calculateTotals_(date);
  upsertSummary_({date,calories:totals.calories,protein:totals.protein,carbs:totals.carbs,fat:totals.fat,
    weight:old?old.weight:'',bodyFat:old?old.bodyFat:'',note:old?old.note:'',status:old&&old.status==='נסגר'?'נסגר':'פתוח'}, false);
}

function upsertSummary_(item, preserveMetrics) {
  const sh = sheet_(APP.sheets.summary);
  const values = sh.getDataRange().getValues();
  const idx = values.findIndex((r,i)=>i>0 && formatDateValue_(r[0])===item.date);
  let weight=item.weight, bodyFat=item.bodyFat, note=item.note;
  if (preserveMetrics && idx>0) {
    weight = item.weight === undefined ? values[idx][5] : item.weight;
    bodyFat = item.bodyFat === undefined ? values[idx][6] : item.bodyFat;
    note = item.note === undefined ? values[idx][7] : item.note;
  }
  const row=[item.date,item.calories,item.protein,item.carbs,item.fat,weight,bodyFat,note,new Date(),item.status||'פתוח'];
  if (idx>0) sh.getRange(idx+1,1,1,row.length).setValues([row]); else appendRows_(APP.sheets.summary,[row]);
  if (idx>0) for (let i=values.length-1;i>idx;i--) if (formatDateValue_(values[i][0])===item.date) sh.deleteRow(i+1);
}

function getSummaryRow_(date) {
  return getHistory_(1000).find(x=>x.date===date) || null;
}

function searchLocalFoods_(q) {
  const needle = normalize_(q);
  const results=[];
  const seen=new Set();
  const custom=sheet_(APP.sheets.foods).getDataRange().getValues().slice(1);
  custom.forEach(r=>{
    if (!r[1] || r[13] === false || /USDA/i.test(String(r[10]||''))) return;
    const hay=normalize_(String(r[1])+' '+String(r[2]||''));
    if (hay.indexOf(needle)<0) return;
    const item={name:String(r[1]),state:String(r[3]||''),baseQty:Number(r[4])||100,unit:String(r[5]||'גרם'),calories:Number(r[6])||0,protein:Number(r[7])||0,carbs:Number(r[8])||0,fat:Number(r[9])||0,source:String(r[10]||'המזונות שלי'),sourceId:String(r[11]||'')};
    if(item.calories>0 || item.protein>0 || item.carbs>0 || item.fat>0){results.push(item); seen.add(normalize_(item.name));}
  });
  const mealRows=sheet_(APP.sheets.meals).getDataRange().getValues().slice(1);
  mealRows.forEach(r=>{
    const name=String(r[3]||'');
    if (!name || r[12]===false || normalize_(name).indexOf(needle)<0 || seen.has(normalize_(name))) return;
    const estimated=estimateMacros_(name,Number(r[4])||0,String(r[5]||''),Number(r[6])||0,Number(r[7])||0);
    const item={name,baseQty:Number(r[4])||1,unit:String(r[5]||'גרם'),calories:Number(r[6])||0,protein:Number(r[7])||0,
      carbs:r[8]===''||r[8]===undefined?estimated.carbs:Number(r[8])||0,
      fat:r[9]===''||r[9]===undefined?estimated.fat:Number(r[9])||0,source:'מאגר הארוחות'};
    if(item.calories>0 || item.protein>0 || item.carbs>0 || item.fat>0){results.push(item);seen.add(normalize_(name));}
  });
  return results;
}

function searchUsda_(query, apiKey) {
  const translated=translateFoodQuery_(query);
  const cache=CacheService.getScriptCache();
  const cacheKey='usda:'+APP.version+':'+Utilities.base64EncodeWebSafe(translated).slice(0,80);
  const cached=cache.get(cacheKey);
  if (cached) return JSON.parse(cached);
  const url='https://api.nal.usda.gov/fdc/v1/foods/search?api_key='+encodeURIComponent(apiKey);
  const payload={query:translated,pageSize:50,dataType:['Foundation','SR Legacy','Survey (FNDDS)']};
  const response=UrlFetchApp.fetch(url,{method:'post',contentType:'application/json',payload:JSON.stringify(payload),muteHttpExceptions:true});
  if (response.getResponseCode()!==200) throw new Error('חיפוש USDA נכשל (קוד ' + response.getResponseCode() + ')');
  const foods=(JSON.parse(response.getContentText()).foods||[]).map(f=>{
    const nutrients=f.foodNutrients||[];
    const nutrient=(ids,name,unit)=>{
      const n=nutrients.find(x=>(ids.includes(Number(x.nutrientId))||String(x.nutrientName||'').toLowerCase()===name) && (!unit||String(x.unitName||'').toUpperCase()===unit));
      return n ? Number(n.value)||0 : 0;
    };
    const protein=nutrient([1003],'protein'),carbs=nutrient([1005],'carbohydrate, by difference'),fat=nutrient([1004],'total lipid (fat)');
    // Foundation Foods uses 2047/2048 instead of the older 1008 energy field.
    const calories=nutrient([1008],'energy','KCAL')||nutrient([2048],'metabolizable energy (atwater specific factor)','KCAL')||nutrient([2047],'metabolizable energy (atwater general factor)','KCAL');
    const estimated=!calories&&(protein>0||carbs>0||fat>0);
    return {name:f.description,englishName:f.description,state:foodStateLabel_(f.description),baseQty:100,unit:'גרם',calories:calories||Math.round(4*protein+4*carbs+9*fat),protein,carbs,fat,source:estimated?'USDA — קלוריות מחושבות בקירוב':'USDA FoodData Central',sourceId:String(f.fdcId),dataType:String(f.dataType||'')};
  }).filter(x=>x.calories>0 || x.protein>0 || x.carbs>0 || x.fat>0);
  foods.sort((a,b)=>foodMatchScore_(b.name,translated)-foodMatchScore_(a.name,translated));
  cache.put(cacheKey,JSON.stringify(foods),21600);
  return foods;
}

function foodMatchScore_(description,query){
  const d=String(description||'').toLowerCase(),q=String(query||'').toLowerCase();
  const words=q.match(/[a-z]+/g)||[];
  let score=words.reduce((sum,w)=>sum+(d.includes(w)?8:-15),0);
  if(d.startsWith(words[0]||'\u0000'))score+=12;
  if(/baby\s?food|infant|dinner|strained|toddler|powder|dried|dehydrated|supplement/.test(d)&&!/(baby|infant|powder|dried)/.test(q))score-=90;
  if(/apple|apples/.test(d)&&/chicken/.test(q)&&!/apple/.test(q))score-=35;
  return score;
}

function cacheFood_(p) {
  const sh=sheet_(APP.sheets.foods),values=sh.getDataRange().getValues();
  const name=String(p.name||'').trim();if(!name)return;
  const normalized=normalize_(name);
  const baseQty=Number(p.baseQty)||100;
  const macros=['calories','protein','carbs','fat'].map(k=>Number(p[k])||0);
  // Replacing a saved food updates future choices; past journal rows remain intact.
  // v0.16: a product with a barcode is identified by the barcode, so two different bars never overwrite each other.
  const barcode=/^\d{8,14}$/.test(String(p.sourceId||'').trim())?String(p.sourceId).trim():'';
  const unitsJson=Array.isArray(p.units)&&p.units.length?JSON.stringify(p.units.filter(u=>Array.isArray(u)&&u[0]&&Number(u[1])>0).slice(0,12).map(u=>[String(u[0]),Number(u[1]),u[2]?1:0])):'';
  for(let i=1;i<values.length;i++){
    const r=values[i];if(r[13]===false||!/המזונות שלי/.test(String(r[10])))continue;
    const rowCode=String(r[11]||'').trim();
    const sameItem=barcode?rowCode===barcode:(normalize_(r[1])===normalized&&!/^\d{8,14}$/.test(rowCode));
    if(!sameItem)continue;
    if(String(r[1])===name&&Number(r[4])===baseQty&&String(r[5])===String(p.sourceBaseUnit||p.unit||'גרם')&&
      macros.every((v,j)=>round1_(v)===round1_(r[6+j]))){
      if(unitsJson&&String(r[15]||'')!==unitsJson)sh.getRange(i+1,16).setValue(unitsJson);
      return;
    }
    sh.getRange(i+1,14).setValue(false);
  }
  appendRows_(APP.sheets.foods,[[Utilities.getUuid(),name,p.aliases||p.brand||'',p.state||'',baseQty,p.sourceBaseUnit||p.unit||'גרם',
    ...macros,'המזונות שלי',p.sourceId||'',true,true,new Date(),unitsJson]]);
}

// ---------- v0.16: מאגר צמרת (Israeli national nutrition database) ----------
const TZ_FILES={foods:'moh_mitzrachim.csv',weights:'moh_yehidot_mida_lemitzrachim.csv',units:'moh_yehidot_mida.csv'};

function findDriveFile_(name){
  // Drive can convert an uploaded CSV to a Google Sheet and drop the ".csv", so both names are accepted.
  let best=null;
  [name,name.replace(/\.csv$/i,'')].forEach(n=>{
    const it=DriveApp.getFilesByName(n);
    while(it.hasNext()){const f=it.next();if(f.isTrashed())continue;if(!best||f.getLastUpdated()>best.getLastUpdated())best=f;}
  });
  return best;
}

function readCsvFile_(file){
  if(String(file.getMimeType&&file.getMimeType()||'')==='application/vnd.google-apps.spreadsheet')
    return SpreadsheetApp.openById(file.getId()).getSheets()[0].getDataRange().getDisplayValues();
  let text=file.getBlob().getDataAsString('UTF-8');
  if(text.charCodeAt(0)===0xFEFF)text=text.slice(1);
  return parseCsvLenient_(text);
}

// The Ministry files contain Hebrew abbreviations with a bare quote inside unquoted fields (תפו"א),
// so a quote only opens a quoted field when it is the first character of the field.
function parseCsvLenient_(text){
  const rows=[],n=text.length;let row=[],i=0;
  while(i<n){
    let field='';
    if(text[i]==='"'){
      i++;
      while(i<n){
        const ch=text[i];
        if(ch==='"'){
          if(text[i+1]==='"'){field+='"';i+=2;continue;}
          const next=text[i+1];
          if(next===undefined||next===','||next==='\r'||next==='\n'){i++;break;}
          field+='"';i++;continue;
        }
        field+=ch;i++;
      }
    }else{
      while(i<n&&text[i]!==','&&text[i]!=='\r'&&text[i]!=='\n'){field+=text[i];i++;}
    }
    row.push(field);
    if(i<n&&text[i]===','){i++;if(i>=n)row.push('');continue;}
    if(i<n&&text[i]==='\r')i++;
    if(i<n&&text[i]==='\n')i++;
    rows.push(row);row=[];
  }
  if(row.length)rows.push(row);
  return rows;
}

function importTzameret(){
  requireAdmin_();
  const files={};
  Object.keys(TZ_FILES).forEach(k=>{files[k]=findDriveFile_(TZ_FILES[k]);if(!files[k])throw new Error('לא נמצא ב-Google Drive הקובץ '+TZ_FILES[k]+'. העלה את שלושת קבצי צמרת ל-Drive ונסה שוב.');});
  const units={};
  readCsvFile_(files.units).slice(1).forEach(r=>{const code=String(r[0]||'').trim();if(code)units[code]=String(r[1]||'').replace(/\s+/g,' ').trim();});
  const weights={};
  readCsvFile_(files.weights).slice(1).forEach(r=>{
    const code=String(r[0]||'').trim(),unit=units[String(r[1]||'').trim()],grams=Number(r[2]);
    if(!code||!unit||!(grams>0)||unit==='גרמים'||unit==='קילוגרם')return;
    (weights[code]||(weights[code]={}))[unit]=Math.round(grams*10)/10;
  });
  const rows=readCsvFile_(files.foods),head=rows[0].map(x=>String(x).trim());
  const col=n=>{const i=head.indexOf(n);if(i<0)throw new Error('בקובץ המזונות חסרה העמודה '+n);return i;};
  const c={code:col('Code'),name:col('shmmitzrach'),kcal:col('food_energy'),protein:col('protein'),carbs:col('carbohydrates'),fat:col('total_fat')};
  const num=v=>{const n=Number(v);return isFinite(n)&&n>0?Math.round(n*10)/10:0;};
  const unitList=[],unitIndex={},foods=[];
  rows.slice(1).forEach(r=>{
    const code=String(r[c.code]||'').trim(),name=String(r[c.name]||'').replace(/\s+/g,' ').trim();
    if(!code||!name)return;
    const w=weights[code]||{},packed=[];
    Object.keys(w).forEach(u=>{if(!(u in unitIndex)){unitIndex[u]=unitList.length;unitList.push(u);}packed.push(unitIndex[u],w[u]);});
    foods.push([Number(code),name,num(r[c.kcal]),num(r[c.protein]),num(r[c.carbs]),num(r[c.fat]),packed]);
  });
  if(foods.length<1000)throw new Error('הקובץ נראה חלקי — נמצאו רק '+foods.length+' מזונות');
  const version='tz-'+Utilities.formatDate(new Date(),APP.timezone,'yyyyMMddHHmmss');
  const data=JSON.stringify({v:version,units:unitList,foods});
  const props=PropertiesService.getScriptProperties(),oldId=props.getProperty('TZAMERET_FILE_ID');
  let file=null;
  if(oldId){try{file=DriveApp.getFileById(oldId);if(file.isTrashed())file=null;else file.setContent(data);}catch(e){file=null;}}
  if(!file){file=DriveApp.createFile('tzameret_app_data.json',data,'application/json');props.setProperty('TZAMERET_FILE_ID',file.getId());}
  props.setProperty('TZAMERET_VERSION',version);props.setProperty('TZAMERET_COUNT',String(foods.length));
  return getTzameretStatus_();
}

function getTzameretStatus_(){
  const props=PropertiesService.getScriptProperties();
  return {version:props.getProperty('TZAMERET_VERSION')||'',count:Number(props.getProperty('TZAMERET_COUNT'))||0};
}

function getTzameretData(knownVersion){
  const props=PropertiesService.getScriptProperties(),id=props.getProperty('TZAMERET_FILE_ID'),version=props.getProperty('TZAMERET_VERSION')||'';
  if(!id||!version)return {missing:true};
  if(knownVersion&&String(knownVersion)===version)return {version,unchanged:true};
  return {version,json:DriveApp.getFileById(id).getBlob().getDataAsString('UTF-8')};
}

function getMyFoods_(){
  return readValues_(APP.sheets.foods).slice(1)
    .filter(r=>r[1]&&r[13]!==false&&/המזונות שלי/.test(String(r[10]||'')))
    .map(r=>({name:String(r[1]),brand:String(r[2]||''),baseQty:Number(r[4])||100,unit:String(r[5]||'גרם'),calories:Number(r[6])||0,protein:Number(r[7])||0,carbs:Number(r[8])||0,fat:Number(r[9])||0,source:'המזונות שלי',sourceId:String(r[11]||''),units:parseUnitsJson_(r[15])}))
    .filter(x=>x.calories>0||x.protein>0||x.carbs>0||x.fat>0);
}

function parseUnitsJson_(v){try{const a=JSON.parse(String(v||''));return Array.isArray(a)?a.filter(u=>Array.isArray(u)&&u[0]&&Number(u[1])>0).map(u=>[String(u[0]),Number(u[1]),!!u[2]]):[];}catch(e){return [];}}

// v0.18: moving between days loads only that day's food, not the whole app.
function getDayView(date){
  const d=/^\d{4}-\d{2}-\d{2}$/.test(String(date||''))?String(date):getWorkingDate_();
  return getDayData_(d);
}

function getRecentFoods_(limit) {
  /* "recent foods" remember what was eaten even if the entry was later deleted from the day */
  const rows=readValues_(APP.sheets.entries).slice(1).filter(r=>r[0]).reverse().map(r=>({name:String(r[6]),amount:Number(r[7])||0,unit:String(r[8]),calories:Number(r[9])||0,protein:Number(r[10])||0,carbs:Number(r[11])||0,fat:Number(r[12])||0,source:String(r[13]||''),sourceType:String(r[4]||''),baseQty:Number(r[7])||1})).filter(x=>x.sourceType!=='meal');
  const seen=new Set(); const out=[];
  rows.forEach(x=>{const k=normalize_(x.name); if(!seen.has(k)){seen.add(k);out.push(x);}});
  return out.slice(0,limit||12);
}

function getHistoryEntries_() {
  const values=readValues_(APP.sheets.entries);
  return values.slice(1).filter(r=>r[0]&&r[14]!==true).reverse().map(r=>({name:String(r[6]),amount:Number(r[7])||0,unit:String(r[8]),calories:Number(r[9])||0,protein:Number(r[10])||0,carbs:Number(r[11])||0,fat:Number(r[12])||0,source:String(r[13]||''),sourceType:String(r[4]||''),baseQty:Number(r[7])||1}));
}

function getSettings_() {
  const rows=readValues_(APP.sheets.settings);
  const out={}; rows.slice(1).forEach(r=>{if(r[0])out[String(r[0])]=r[1];});
  out.has_usda_key=!!PropertiesService.getScriptProperties().getProperty('USDA_API_KEY');
  out.has_openai_key=!!PropertiesService.getScriptProperties().getProperty('OPENAI_API_KEY');
  return out;
}

function getQuickActions_(){
  try{
    const rows=JSON.parse(PropertiesService.getScriptProperties().getProperty(userKey_('QUICK_ACTIONS'))||'[]');
    return Array.isArray(rows)?rows:[];
  }catch(e){return[];}
}

function setSetting_(key,value) {
  const sh=sheet_(APP.sheets.settings); const values=sh.getDataRange().getValues();
  const idx=values.findIndex((r,i)=>i>0&&String(r[0])===key);
  if(idx>0){sh.getRange(idx+1,2).setValue(value);sh.getRange(idx+1,4).setValue(new Date());}
  else appendRows_(APP.sheets.settings,[[key,value,'',new Date()]]);
}

function seedDefaults_() {
  const defaults=[
    ['calorie_goal',2200,'יעד קלוריות יומי'],['protein_goal',130,'יעד חלבון יומי'],
    ['free_calories_goal',250,'מסגרת קלוריות חופשיות בתוך היעד'],
    ['shake_calories',140,'קלוריות בשייק'],['shake_protein',25,'חלבון בשייק'],
    ['shake_carbs',3,'פחמימות בשייק'],['shake_fat',2,'שומן בשייק'],
    ['day_rollover_hour',1,'שעת מעבר יום'],['timezone','Asia/Jerusalem','אזור זמן']
  ];
  const before=getSettings_();
  defaults.forEach(x=>{if(before[x[0]]===undefined||before[x[0]]==='')setSetting_(x[0],x[1],x[2]);});
  // Never override a goal the user set manually when upgrading.
  if(String(before.app_version||'')!==APP.version)setSetting_('app_version',APP.version,'גרסת האפליקציה');
  const props=PropertiesService.getScriptProperties();
  if(props.getProperty(userKey_('SEEDED_EXERCISES_VERSION'))!==APP.version){seedExercises_();props.setProperty(userKey_('SEEDED_EXERCISES_VERSION'),APP.version);}
}

function guessEquipment_(name){const n=String(name);if(/מתח|מקבילים/.test(n))return 'מתקנים';if(/שכיבות סמיכה|ללא ציוד|משקל גוף|פלאנק|כפיפות בטן|הרמת רגליים|הליכה|צעידה|ריצה קלה/.test(n))return 'משקל גוף';if(/מכונה|כבל|פולי|לחיצת רגליים|פשיטת ברך|כפיפת ברך/.test(n))return 'מכונה';if(/משקול|במוט|עם מוט/.test(n))return 'משקולות חופשיות';return /פרפר/.test(n)?'מכונה':'משקולות חופשיות';}
function estimatedUnitGrams_(name,unit){
  const n=normalize_(name);
  if(unit==='פרוסה')return /לחם|bread|טוסט/.test(n)?30:/עוגה|cake/.test(n)?90:25;
  if(unit==='פחית')return 330;
  if(unit==='יחידה'){
    if(/ביצ|egg/.test(n))return 50;
    if(/תפוח|apple/.test(n))return 180;
    if(/בננ|banana/.test(n))return 120;
    if(/תפוז|orange/.test(n))return 130;
    if(/מעדן|יוגורט/.test(n))return 150;
    if(/סופגני|donut/.test(n))return 85;
    if(/לחמני|bun/.test(n))return 75;
    if(/פית|pita/.test(n))return 80;
    if(/טורטי|tortilla/.test(n))return 45;
    if(/פריכי|rice cake/.test(n))return 9;
    return 100;
  }
  return 100;
}
function builtinExerciseSpecs_(){return [{"group":"חזה","name":"שכיבות סמיכה","equipment":"משקל גוף","requires":["none"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/chest/"},{"group":"חזה","name":"שכיבות סמיכה על הברכיים","equipment":"משקל גוף","requires":["none"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/chest/"},{"group":"חזה","name":"שכיבות סמיכה לקיר","equipment":"משקל גוף","requires":["none"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/chest/"},{"group":"חזה","name":"שכיבות סמיכה רחבות ללא ציוד","equipment":"משקל גוף","requires":["none"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/chest/"},{"group":"גב","name":"בירד דוג ללא ציוד","equipment":"משקל גוף","requires":["none"],"instructions":"לגב ללא ציוד: דגש על ייצוב ושרירי הגב והשכמות; אינו תחליף מלא לחתירה עם התנגדות.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/back/"},{"group":"גב","name":"סופרמן ללא ציוד","equipment":"משקל גוף","requires":["none"],"instructions":"לגב ללא ציוד: דגש על ייצוב ושרירי הגב והשכמות; אינו תחליף מלא לחתירה עם התנגדות.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/back/"},{"group":"גב","name":"הרמת ידיים W בשכיבה ללא ציוד","equipment":"משקל גוף","requires":["none"],"instructions":"לגב ללא ציוד: דגש על ייצוב ושרירי הגב והשכמות; אינו תחליף מלא לחתירה עם התנגדות.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/back/"},{"group":"גב","name":"הרמת ידיים Y בשכיבה ללא ציוד","equipment":"משקל גוף","requires":["none"],"instructions":"לגב ללא ציוד: דגש על ייצוב ושרירי הגב והשכמות; אינו תחליף מלא לחתירה עם התנגדות.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/back/"},{"group":"כתפיים","name":"לחיצת כתפיים פייק ללא ציוד","equipment":"משקל גוף","requires":["none"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/shoulders/"},{"group":"כתפיים","name":"נגיעות כתף בפלאנק ללא ציוד","equipment":"משקל גוף","requires":["none"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/shoulders/"},{"group":"כתפיים","name":"הרמת ידיים T בשכיבה ללא ציוד","equipment":"משקל גוף","requires":["none"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/shoulders/"},{"group":"יד אחורית","name":"שכיבות סמיכה צרות ללא ציוד","equipment":"משקל גוף","requires":["none"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/arms/triceps/"},{"group":"יד אחורית","name":"שכיבות סמיכה צרות על הברכיים ללא ציוד","equipment":"משקל גוף","requires":["none"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/arms/triceps/"},{"group":"יד אחורית","name":"פשיטת מרפקים לקיר ללא ציוד","equipment":"משקל גוף","requires":["none"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/arms/triceps/"},{"group":"רגליים","name":"סקוואט ללא ציוד","equipment":"משקל גוף","requires":["none"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/legs-thighs/"},{"group":"רגליים","name":"מכרעים לאחור ללא ציוד","equipment":"משקל גוף","requires":["none"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/legs-thighs/"},{"group":"רגליים","name":"גשר ישבן ללא ציוד","equipment":"משקל גוף","requires":["none"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/legs-thighs/"},{"group":"רגליים","name":"תאומים ללא ציוד","equipment":"משקל גוף","requires":["none"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/legs-thighs/"},{"group":"בטן","name":"כפיפות בטן","equipment":"משקל גוף","requires":["none"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/abs/"},{"group":"בטן","name":"פלאנק","equipment":"משקל גוף","requires":["none"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/abs/"},{"group":"בטן","name":"הרמת רגליים","equipment":"משקל גוף","requires":["none"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/abs/"},{"group":"בטן","name":"דד באג ללא ציוד","equipment":"משקל גוף","requires":["none"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/abs/"},{"group":"יד קדמית","name":"כפיפת מרפקים בהתנגדות היד השנייה ללא ציוד","equipment":"משקל גוף","requires":["none"],"instructions":"התנגדות עצמית: היד השנייה מתנגדת בעדינות לתנועה. זו חלופה ללא ציוד, עם אפשרות מוגבלת למדידת עומס.","source":"https://criticalbody.com/isometric-bicep-exercises/"},{"group":"יד קדמית","name":"כפיפת מרפקים בפטיש בהתנגדות היד השנייה ללא ציוד","equipment":"משקל גוף","requires":["none"],"instructions":"התנגדות עצמית: היד השנייה מתנגדת בעדינות לתנועה. זו חלופה ללא ציוד, עם אפשרות מוגבלת למדידת עומס.","source":"https://criticalbody.com/isometric-bicep-exercises/"},{"group":"יד קדמית","name":"כפיפת מרפקים איזומטרית ללא ציוד","equipment":"משקל גוף","requires":["none"],"instructions":"התנגדות עצמית: החזקה קצרה במרפק כפוף כנגד היד השנייה; חזרה אחת היא החזקה של כ־15 שניות. לא חלופה שוות ערך לעומס מדוד.","source":"https://leedscommunityhealthcare.nhs.uk/our-services-a-z/musculoskeletal-msk/elbow-problems/known-diagnosed-elbow-problems/elbow-osteoarthritis/"},{"group":"חזה","name":"לחיצת חזה במשקולות על הרצפה","equipment":"משקולות חופשיות","requires":["dumbbells"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/chest/"},{"group":"חזה","name":"לחיצת חזה באחיזה צרה במשקולות על הרצפה","equipment":"משקולות חופשיות","requires":["dumbbells"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/chest/"},{"group":"חזה","name":"לחיצת חזה מתחלפת במשקולות על הרצפה","equipment":"משקולות חופשיות","requires":["dumbbells"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/chest/"},{"group":"גב","name":"חתירה עם משקולת","equipment":"משקולות חופשיות","requires":["dumbbells"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/back/"},{"group":"גב","name":"חתירה בשתי משקולות","equipment":"משקולות חופשיות","requires":["dumbbells"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/back/"},{"group":"גב","name":"חתירה באחיזה ניטרלית במשקולות","equipment":"משקולות חופשיות","requires":["dumbbells"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/back/"},{"group":"כתפיים","name":"לחיצת כתפיים במשקולות","equipment":"משקולות חופשיות","requires":["dumbbells"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/shoulders/"},{"group":"כתפיים","name":"הרחקת כתפיים לצדדים","equipment":"משקולות חופשיות","requires":["dumbbells"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/shoulders/"},{"group":"כתפיים","name":"הרמה קדמית במשקולות","equipment":"משקולות חופשיות","requires":["dumbbells"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/shoulders/"},{"group":"כתפיים","name":"פרפר הפוך במשקולות","equipment":"משקולות חופשיות","requires":["dumbbells"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/shoulders/"},{"group":"יד קדמית","name":"כפיפת מרפקים במשקולות","equipment":"משקולות חופשיות","requires":["dumbbells"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/arms/biceps/"},{"group":"יד קדמית","name":"פטישים","equipment":"משקולות חופשיות","requires":["dumbbells"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/arms/biceps/"},{"group":"יד קדמית","name":"כפיפת מרפקים בישיבה במשקולות","equipment":"משקולות חופשיות","requires":["dumbbells"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/arms/biceps/"},{"group":"יד קדמית","name":"כפיפת מרפקים מתחלפת במשקולות","equipment":"משקולות חופשיות","requires":["dumbbells"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/arms/biceps/"},{"group":"יד אחורית","name":"פשיטת מרפקים במשקולת בהטיית גו","equipment":"משקולות חופשיות","requires":["dumbbells"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/arms/triceps/"},{"group":"יד אחורית","name":"פשיטה מעל הראש במשקולת","equipment":"משקולות חופשיות","requires":["dumbbells"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/arms/triceps/"},{"group":"יד אחורית","name":"לחיצה צרפתית במשקולות על הרצפה","equipment":"משקולות חופשיות","requires":["dumbbells"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/arms/triceps/"},{"group":"רגליים","name":"סקוואט גביע במשקולת","equipment":"משקולות חופשיות","requires":["dumbbells"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/legs-thighs/"},{"group":"רגליים","name":"דדליפט רומני במשקולות","equipment":"משקולות חופשיות","requires":["dumbbells"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/legs-thighs/"},{"group":"רגליים","name":"מכרעים במשקולות","equipment":"משקולות חופשיות","requires":["dumbbells"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/legs-thighs/"},{"group":"רגליים","name":"תאומים במשקולות","equipment":"משקולות חופשיות","requires":["dumbbells"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/legs-thighs/"},{"group":"חזה","name":"לחיצת חזה במשקולות","equipment":"משקולות חופשיות","requires":["dumbbells","bench"],"instructions":"נדרש ספסל אימון יציב בנוסף למשקולות.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/chest/"},{"group":"חזה","name":"לחיצת חזה בשיפוע עם משקולות","equipment":"משקולות חופשיות","requires":["dumbbells","bench"],"instructions":"נדרש ספסל אימון יציב בנוסף למשקולות.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/chest/"},{"group":"חזה","name":"פרפר במשקולות","equipment":"משקולות חופשיות","requires":["dumbbells","bench"],"instructions":"נדרש ספסל אימון יציב בנוסף למשקולות.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/chest/"},{"group":"גב","name":"חתירה במשקולות עם תמיכת חזה","equipment":"משקולות חופשיות","requires":["dumbbells","bench"],"instructions":"נדרש ספסל אימון יציב בנוסף למשקולות.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/back/"},{"group":"רגליים","name":"בולגרי במשקולות","equipment":"משקולות חופשיות","requires":["dumbbells","bench"],"instructions":"נדרש ספסל אימון יציב בנוסף למשקולות.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/legs-thighs/"},{"group":"חזה","name":"לחיצת חזה במוט","equipment":"משקולות חופשיות","requires":["barbell","bench"],"instructions":"יש להשתמש בציוד הנדרש המסומן; מוט אינו נכלל בבחירת משקולות יד בלבד.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/chest/"},{"group":"גב","name":"חתירה במוט","equipment":"משקולות חופשיות","requires":["barbell"],"instructions":"יש להשתמש בציוד הנדרש המסומן; מוט אינו נכלל בבחירת משקולות יד בלבד.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/back/"},{"group":"יד קדמית","name":"כפיפת מרפקים במוט","equipment":"משקולות חופשיות","requires":["barbell"],"instructions":"יש להשתמש בציוד הנדרש המסומן; מוט אינו נכלל בבחירת משקולות יד בלבד.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/arms/biceps/"},{"group":"יד אחורית","name":"לחיצה צרפתית במוט","equipment":"משקולות חופשיות","requires":["barbell","bench"],"instructions":"יש להשתמש בציוד הנדרש המסומן; מוט אינו נכלל בבחירת משקולות יד בלבד.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/arms/triceps/"},{"group":"רגליים","name":"דדליפט רומני במוט","equipment":"משקולות חופשיות","requires":["barbell"],"instructions":"יש להשתמש בציוד הנדרש המסומן; מוט אינו נכלל בבחירת משקולות יד בלבד.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/legs-thighs/"},{"group":"רגליים","name":"היפ טראסט במוט","equipment":"משקולות חופשיות","requires":["barbell","bench"],"instructions":"יש להשתמש בציוד הנדרש המסומן; מוט אינו נכלל בבחירת משקולות יד בלבד.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/legs-thighs/"},{"group":"חזה","name":"לחיצת חזה במכונה","equipment":"מכונה","requires":["machine"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/chest/"},{"group":"חזה","name":"פרפר בכבלים","equipment":"מכונה","requires":["machine"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/chest/"},{"group":"חזה","name":"פרפר במכונה","equipment":"מכונה","requires":["machine"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/chest/"},{"group":"גב","name":"פולי עליון","equipment":"מכונה","requires":["machine"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/back/"},{"group":"גב","name":"חתירה במכונה","equipment":"מכונה","requires":["machine"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/back/"},{"group":"גב","name":"פולאובר בכבל","equipment":"מכונה","requires":["machine"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/back/"},{"group":"כתפיים","name":"לחיצת כתפיים במכונה","equipment":"מכונה","requires":["machine"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/shoulders/"},{"group":"כתפיים","name":"כתף אחורית במכונה","equipment":"מכונה","requires":["machine"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/shoulders/"},{"group":"כתפיים","name":"הרחקה בכבל","equipment":"מכונה","requires":["machine"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/shoulders/"},{"group":"יד קדמית","name":"כפיפה בכבל","equipment":"מכונה","requires":["machine"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/arms/biceps/"},{"group":"יד קדמית","name":"כפיפת מרפקים במכונה","equipment":"מכונה","requires":["machine"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/arms/biceps/"},{"group":"יד קדמית","name":"כפיפת מרפקים בכבל באחיזה ניטרלית","equipment":"מכונה","requires":["machine"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/arms/biceps/"},{"group":"יד אחורית","name":"פשיטת מרפקים בכבל","equipment":"מכונה","requires":["machine"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/arms/triceps/"},{"group":"יד אחורית","name":"פשיטה מעל הראש בכבל","equipment":"מכונה","requires":["machine"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/arms/triceps/"},{"group":"יד אחורית","name":"פשיטת מרפקים במכונה","equipment":"מכונה","requires":["machine"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/arms/triceps/"},{"group":"רגליים","name":"לחיצת רגליים","equipment":"מכונה","requires":["machine"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/legs-thighs/"},{"group":"רגליים","name":"כפיפת ברך","equipment":"מכונה","requires":["machine"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/legs-thighs/"},{"group":"רגליים","name":"פשיטת ברך","equipment":"מכונה","requires":["machine"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/legs-thighs/"},{"group":"רגליים","name":"תאומים במכונה","equipment":"מכונה","requires":["machine"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/legs-thighs/"},{"group":"בטן","name":"קרנץ׳ בכבל","equipment":"מכונה","requires":["machine"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/abs/"},{"group":"בטן","name":"כפיפות בטן במכונה","equipment":"מכונה","requires":["machine"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/abs/"},{"group":"בטן","name":"סיבוב גו בכבל","equipment":"מכונה","requires":["machine"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/abs/"},{"group":"גב","name":"מתח","equipment":"מתקנים","requires":["pullup"],"instructions":"זהו תרגיל משקל גוף עם מתקן ייעודי. אינו נכלל במסלול ללא ציוד.","source":"https://www.acefitness.org/resources/everyone/exercise-library/equipment/pull-up-bar/"},{"group":"גב","name":"מתח באחיזה ניטרלית","equipment":"מתקנים","requires":["pullup"],"instructions":"זהו תרגיל משקל גוף עם מתקן ייעודי. אינו נכלל במסלול ללא ציוד.","source":"https://www.acefitness.org/resources/everyone/exercise-library/equipment/pull-up-bar/"},{"group":"יד קדמית","name":"מתח באחיזה הפוכה","equipment":"מתקנים","requires":["pullup"],"instructions":"זהו תרגיל משקל גוף עם מתקן ייעודי. אינו נכלל במסלול ללא ציוד.","source":"https://www.acefitness.org/resources/everyone/exercise-library/equipment/pull-up-bar/"},{"group":"יד קדמית","name":"מתח באחיזה הפוכה צרה","equipment":"מתקנים","requires":["pullup"],"instructions":"זהו תרגיל משקל גוף עם מתקן ייעודי. אינו נכלל במסלול ללא ציוד.","source":"https://www.acefitness.org/resources/everyone/exercise-library/equipment/pull-up-bar/"},{"group":"יד קדמית","name":"מתח באחיזה הפוכה עם תמיכת רגליים","equipment":"מתקנים","requires":["pullup"],"instructions":"זהו תרגיל משקל גוף עם מתקן ייעודי. אינו נכלל במסלול ללא ציוד.","source":"https://www.acefitness.org/resources/everyone/exercise-library/equipment/pull-up-bar/"},{"group":"חזה","name":"מקבילים לחזה","equipment":"מתקנים","requires":["parallel"],"instructions":"זהו תרגיל משקל גוף עם מתקן ייעודי. אינו נכלל במסלול ללא ציוד.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/chest/"},{"group":"יד אחורית","name":"מקבילים ליד אחורית","equipment":"מתקנים","requires":["parallel"],"instructions":"זהו תרגיל משקל גוף עם מתקן ייעודי. אינו נכלל במסלול ללא ציוד.","source":"https://www.acefitness.org/resources/everyone/exercise-library/body-part/arms/triceps/"},{"group":"אירובי","name":"הליכה בקצב נוח","equipment":"משקל גוף","requires":["none"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/"},{"group":"אירובי","name":"צעידה במקום ללא ציוד","equipment":"משקל גוף","requires":["none"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/"},{"group":"אירובי","name":"הליכה לסירוגין","equipment":"משקל גוף","requires":["none"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/"},{"group":"אירובי","name":"ריצה קלה","equipment":"משקל גוף","requires":["none"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/"},{"group":"אירובי","name":"אופני כושר במכונה","equipment":"מכונה","requires":["machine"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/"},{"group":"אירובי","name":"אליפטיקל במכונה","equipment":"מכונה","requires":["machine"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/"},{"group":"אירובי","name":"הליכון במכונה","equipment":"מכונה","requires":["machine"],"instructions":"בצע בתנועה נשלטת ובטווח נוח.","source":"https://www.acefitness.org/resources/everyone/exercise-library/"}];}
function seedExerciseDetails_(){
  const sh=sheet_(APP.sheets.exercises),values=sh.getDataRange().getValues(),byKey=new Map(values.slice(1).filter(r=>r[0]).map(r=>[normalize_(r[1])+'|'+normalize_(r[2]),{r,index:values.indexOf(r)-1}])),updates=values.slice(1).map(r=>[r[5]||'',r[6]||'']),added=[];let changed=false;
  builtinExerciseSpecs_().forEach(x=>{const key=normalize_(x.group)+'|'+normalize_(x.name),found=byKey.get(key),note='FITPRO_EXERCISE:'+JSON.stringify({requires:x.requires,instructions:x.instructions,source:x.source});
    if(found){if(found.r[6]!==x.equipment){updates[found.index][1]=x.equipment;changed=true}if((!found.r[5]||String(found.r[5]).startsWith('FITPRO_EXERCISE:'))&&found.r[5]!==note){updates[found.index][0]=note;changed=true}}
    else added.push([Utilities.getUuid(),x.group,x.name,true,values.length+added.length,note,x.equipment]);
  });if(changed&&updates.length)sh.getRange(2,6,updates.length,2).setValues(updates);appendRows_(APP.sheets.exercises,added);
}

function seedExercises_() {
  const sh=sheet_(APP.sheets.exercises);
  allowCustomExerciseGroups_(sh);
  const existing=new Set(sh.getDataRange().getValues().slice(1).filter(r=>r[0]).map(r=>normalize_(r[1])+'|'+normalize_(r[2])));
  const groups={
    'חזה':['שכיבות סמיכה בשיפוע ללא ציוד','שכיבות סמיכה רחבות ללא ציוד','לחיצת חזה במשקולות','פרפר במשקולות','לחיצת חזה במוט','לחיצת חזה בשיפוע עם משקולות','פרפר בכבלים','מקבילים לחזה','שכיבות סמיכה'],
    'גב':['הרמת ידיים W בשכיבה ללא ציוד','הרמת ידיים Y בשכיבה ללא ציוד','חתירת מרפקים בשכיבה ללא ציוד','חתירה בשתי משקולות','מתח','פולי עליון','חתירה במכונה','חתירה עם משקולת','פולאובר בכבל'],
    'כתפיים':['לחיצת כתפיים פייק בשיפוע ללא ציוד','נגיעות כתף בפלאנק ללא ציוד','הרמת ידיים T בשכיבה ללא ציוד','פרפר הפוך במשקולות','לחיצת כתפיים','הרחקת כתפיים לצדדים','כתף אחורית במכונה','הרחקה בכבל'],
    'יד קדמית':['כפיפת מרפקים בהתנגדות היד השנייה ללא ציוד','כפיפת מרפקים איזומטרית ללא ציוד','כפיפת מרפקים בפטיש בהתנגדות היד השנייה ללא ציוד','כפיפת מרפקים בישיבה במשקולות','כפיפת מרפקים במוט','כפיפת מרפקים במשקולות','פטישים','כפיפה בכבל'],
    'יד אחורית':['שכיבות סמיכה צרות בשיפוע ללא ציוד','פשיטת מרפקים לקיר ללא ציוד','שכיבות סמיכה צרות על הברכיים ללא ציוד','פשיטת מרפקים במשקולת בהטיית גו','פשיטת מרפקים בכבל','פשיטה מעל הראש','לחיצה צרפתית','מקבילים ליד אחורית'],
    'רגליים':['סקוואט ללא ציוד','מכרעים לאחור ללא ציוד','גשר ישבן ללא ציוד','תאומים ללא ציוד','סקוואט גביע במשקולת','סקוואט','לחיצת רגליים','בולגרי','כפיפת ברך','פשיטת ברך','דדליפט רומני','תאומים','היפ טראסט','מכרעים'],
    'אירובי':['הליכה בקצב נוח','צעידה במקום ללא ציוד','הליכה לסירוגין','אופני כושר במכונה','אליפטיקל במכונה','ריצה קלה'],
    'בטן':['כפיפות בטן','פלאנק','קרנץ׳ בכבל','הרמת רגליים']
  };
  let order=1,rows=[];
  Object.keys(groups).forEach(g=>groups[g].forEach(name=>{if(!existing.has(normalize_(g)+'|'+normalize_(name)))rows.push([Utilities.getUuid(),g,name,true,order,'',guessEquipment_(name)]);order++;}));
  appendRows_(APP.sheets.exercises,rows);
  seedExerciseDetails_();
}

// Existing installations can have a strict dropdown in App_Exercises!B:B.
// Keep the dropdown and other validation settings, but allow newly named groups
// (including abs) through. Recheck on each exercise insert because setupApp can
// already have cached ensureStructure_ after a partial run.
function allowCustomExerciseGroups_(sh) {
  const height=sh.getMaxRows()-1;
  if(height<1)return;
  const range=sh.getRange(2,2,height,1);
  const rules=range.getDataValidations();
  let changed=false;
  for(let i=0;i<rules.length;i++){
    const rule=rules[i][0];
    if(rule && !rule.getAllowInvalid()){
      rules[i][0]=rule.copy().setAllowInvalid(true).build();
      changed=true;
    }
  }
  if(changed)range.setDataValidations(rules);
}

function backfillMealMacros_() {
  const sh=sheet_(APP.sheets.meals),values=sh.getDataRange().getValues();
  if(values.length<2)return;
  values.slice(1).forEach((r,i)=>{
    if(!r[0]||!r[3]||((r[8]!==''&&r[8]!==undefined)&&(r[9]!==''&&r[9]!==undefined)))return;
    const e=estimateMacros_(String(r[3]),Number(r[4])||0,String(r[5]||''),Number(r[6])||0,Number(r[7])||0);
    sh.getRange(i+2,9,1,2).setValues([[r[8]===''||r[8]===undefined?e.carbs:r[8],r[9]===''||r[9]===undefined?e.fat:r[9]]]);
  });
}

function estimateMacros_(name,amount,unit,calories,protein) {
  const n=normalize_(name); let fat=0;
  if(/שמן/.test(n))fat=amount;
  else if(/טחינה/.test(n))fat=amount*.54;
  else if(/אבוקדו/.test(n))fat=amount*.15;
  else if(/שקדים|חמאת בוטנים/.test(n))fat=amount*.5;
  else if(/מיונז/.test(n))fat=amount*.12;
  else if(/סלמון/.test(n))fat=amount*.13;
  else if(/בקר|קציצות|שניצל/.test(n))fat=amount*.1;
  else if(/חזה עוף|טונה/.test(n))fat=amount*.035;
  else if(/חלבוני ביצה/.test(n))fat=0;
  else if(/ביצ/.test(n)&&unit==='יחידה')fat=amount*5;
  else if(/גבינה|קוטג|סימפוניה|בולגרית/.test(n))fat=amount*.05;
  else if(/סקיר/.test(n))fat=amount*.002;
  else if(/חלב/.test(n))fat=amount*.01;
  else if(/זיתים/.test(n))fat=amount*.11;
  else if(/שיבולת/.test(n))fat=amount*.07;
  fat=Math.min(fat,Math.max(0,calories/9));
  return {fat:round1_(fat),carbs:round1_(Math.max(0,(calories-4*(Number(protein)||0)-9*fat)/4))};
}

function activeRowCount_(sh){return sh.getRange(2,1,Math.max(1,sh.getMaxRows()-1),1).getValues().filter(r=>r[0]).length;}

const STRUCTURE_VERSION='s33';
function ensureStructure_() {
  // v0.33.8: the sheet check is slow, so it is remembered permanently and runs again only when the sheet layout changes,
  // not on every app update and not every 6 hours as before (that was what made the first load time out).
  const cache=CacheService.getScriptCache(),props=PropertiesService.getScriptProperties();
  const structKey='structure:'+STRUCTURE_VERSION+':'+(CURRENT_USER_&&CURRENT_USER_.ss||APP.spreadsheetId);
  if(cache.get(structKey))return;
  if(props.getProperty(structKey)){cache.put(structKey,'1',21600);return;}
  const ss=spreadsheet_();
  const specs={
    App_Entries:APP.entryHeaders,
    App_DailySummary:['date','calories','protein','carbs','fat','weight_kg','body_fat_pct','note','updated_at','status'],
    App_Foods:['food_id','name_he','aliases','state','base_qty','unit','calories','protein','carbs','fat','source','source_id','user_override','active','updated_at','units_json'],
    App_Settings:['key','value','description','updated_at'],
    App_Workouts:['set_id','workout_id','date','created_at','muscle_group','exercise','set_number','weight_kg','reps','rir','notes','deleted','exercise_id','session_id','session_name','plan_item_index','set_note','segments_json','side'],
    App_Exercises:['exercise_id','muscle_group','exercise_name','active','display_order','notes','equipment'],
    App_WorkoutVideos:['video_id','workout_id','date','muscle_group','exercise','drive_file_id','file_name','created_at','deleted'],
    App_WorkoutPlans:['plan_id','name','items_json','active','updated_at','category'],
    App_WorkoutSessions:['session_id','date','name','started_at','ended_at','duration_minutes','status','type'],
    App_BodyMeasurements:['date','waist_navel_cm','arm_cm','chest_cm','thigh_cm','bloating_0_3','note','updated_at'],
    App_Health:['date','sleep_h','resting_hr','hrv_ms','body_battery','source','updated_at'],
    App_Events:['event_id','date','type','size','extra_kcal','method','plan_json','status','created_at','note'],
    'מאגר מרכיבים':['קטגוריה','אופציה','סדר','מרכיב','כמות מקורית','יחידה','קלוריות מקור','חלבון מקור','פחמימות מקור','שומן מקור','שם ארוחה','מקור','פעיל','meal_id']
  };
  Object.keys(specs).forEach(name=>{
    let sh=ss.getSheetByName(name); if(!sh) sh=ss.insertSheet(name);
    if(sh.getMaxColumns()<specs[name].length) sh.insertColumnsAfter(sh.getMaxColumns(),specs[name].length-sh.getMaxColumns());
    sh.getRange(1,1,1,specs[name].length).setValues([specs[name]]); sh.hideSheet(); sh.setFrozenRows(1);
  });
  cache.put(structKey,'1',21600);props.setProperty(structKey,'1');
}

function installDailyTrigger_() {
  ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='nightlyMaintenance').forEach(t=>ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('nightlyMaintenance').timeBased().atHour(1).nearMinute(5).everyDays(1).inTimezone(APP.timezone).create();
}

function getWorkingDate_() {
  return getWorkingDateFromSettings_(getSettings_());
}

function getWorkingDateFromSettings_(settings) {
  const now=new Date(); const hour=Number(Utilities.formatDate(now,APP.timezone,'H'));
  const rollover=Number((settings||{}).day_rollover_hour||1);
  const shifted=hour<rollover?new Date(now.getTime()-86400000):now;
  return Utilities.formatDate(shifted,APP.timezone,'yyyy-MM-dd');
}

function translateFoodQuery_(q) {
  const map={'פירה':'potatoes mashed','ביצה קשה':'egg whole cooked hard-boiled','ביצים קשות':'egg whole cooked hard-boiled','תפוחי אדמה':'potatoes','קולה זירו':'coca cola zero','קולה':'cola','שוקולד':'chocolate','פאד תאי':'pad thai','פד תאי':'pad thai','קישוא':'zucchini','אורז':'rice','חזה עוף לפני בישול':'chicken breast raw','חזה עוף נא':'chicken breast raw','פילה בקר':'beef tenderloin lean','חזה עוף':'chicken breast','עוף':'chicken','תפוח אדמה':'potato','פסטה':'pasta','נודלס':'noodles','ביצה':'egg whole','ביצים':'egg whole','חלבון ביצה':'egg white','אבוקדו':'avocado','עגבניה':'tomato','מלפפון':'cucumber','תפוח':'apple','בננה':'banana','בטטה':'sweet potato','טונה':'tuna','סלמון':'salmon','דג':'fish','שמן זית':'olive oil','טחינה':'sesame butter tahini','קינואה':'quinoa','קוסקוס':'couscous','בורקס גבינה':'cheese pastry','יוגורט':'yogurt','סקיר':'skyr','מבושלת':'cooked','מבושל':'cooked','יבשה':'dry uncooked','יבש':'dry uncooked','לא מבושלת':'uncooked','לא מבושל':'uncooked','נא':'raw','נאה':'raw','אפוי':'baked','אפויה':'baked','צלוי':'grilled','צלויה':'grilled','מטוגן':'fried','מטוגנת':'fried','על המחבת':'pan cooked','מעושן':'smoked','מעושנת':'smoked','משומר':'canned','משומרת':'canned','מאודה':'steamed'};

  Object.assign(map, {
    'סטייק אנטריקוט':'beef rib eye steak','אנטריקוט':'beef rib eye steak',
    'שזיף מיובש':'plums dried prunes','שזיפים מיובשים':'plums dried prunes',
    'שזיף':'plums raw','שזיפים':'plums raw','מנגו':'mangos','מנגו קפוא':'mangos frozen',
    'ריבת בצל':'onion jam','ריבה':'jam','בצל':'onions','בצל ירוק':'onions spring',
    'עדשים אדומות':'lentils','עדשים':'lentils','שעועית לבנה':'beans white','שעועית אדומה':'beans kidney',
    'שעועית ירוקה':'beans snap green','אפונה':'peas green','גרגרי חומוס':'chickpeas',
    'שיבולת שועל':'oats','שיבולת שועל יבשה':'oats uncooked','בורגול':'bulgur','כוסמת':'buckwheat',
    'אורז מלא':'rice brown','אורז לבן':'rice white','לחם מלא':'bread whole wheat','לחם לבן':'bread white',
    'שקדים':'almonds','אגוזי מלך':'walnuts','קשיו':'cashews','בוטנים':'peanuts',
    'חמאת בוטנים':'peanut butter','חמאה':'butter','סוכר':'sugars granulated','דבש':'honey',
    'תותים':'strawberries','אוכמניות':'blueberries','ענבים':'grapes','אבטיח':'watermelon',
    'מלון':'melons cantaloupe','אגס':'pears','אפרסק':'peaches','אננס':'pineapple','קיווי':'kiwifruit',
    'תמר':'dates','תמרים':'dates','צימוקים':'raisins','משמש מיובש':'apricots dried',
    'ברוקולי':'broccoli','כרובית':'cauliflower','גזר':'carrots','פלפל אדום':'peppers sweet red',
    'חסה':'lettuce','כרוב':'cabbage','פטריות':'mushrooms','תרד':'spinach','חציל':'eggplant',
    'עגבנייה':'tomatoes','עגבניות':'tomatoes','מלפפונים':'cucumbers','תירס':'corn sweet',
    'גבינת קוטג':'cheese cottage','קוטג':'cheese cottage','גבינת מוצרלה':'cheese mozzarella',
    'גבינת פטה':'cheese feta','גבינה צהובה':'cheese gouda','חלב':'milk',
    'חלב סויה':'soymilk','חלב שקדים':'almond milk','חלב שיבולת שועל':'oat milk',
    'הודו':'turkey','חזה הודו':'turkey breast','בשר בקר':'beef','בקר טחון':'beef ground',
    'סרדינים':'sardines','טופו':'tofu','קפוא':'frozen','קפואה':'frozen','קפואים':'frozen',
    'מיובש':'dried','מיובשת':'dried','מיובשים':'dried','מאודים':'steamed','מאודות':'steamed',
    'קלוי':'roasted','קלויה':'roasted','ללא מלח':'without salt','ללא סוכר':'unsweetened'
  });
  // One pass, whole words: never translate a substring inside another Hebrew word.
  const text=String(q||'').trim().replace(/[׳']/g,'');
  const keys=Object.keys(map).sort((a,b)=>b.length-a.length);
  const words=text.split(/\s+/);let translated=[];
  for(let i=0;i<words.length;){
    const key=keys.find(k=>words.slice(i,i+k.split(' ').length).join(' ')===k);
    if(key){translated.push(map[key]);i+=key.split(' ').length;}else{translated.push(words[i++]);}
  }
  let out=translated.join(' ');
  if(/[\u0590-\u05ff]/.test(out)){try{out=LanguageApp.translate(out,'he','en');}catch(e){}}
  return out;
}

function parseFoodQuery_(query){
  const original=String(query||'').trim();
  let raw=original.replace(/^(?:כמה\s+(?:קלוריות\s+)?(?:יש\s+ב|יש\s+|זה\s+)|מה\s+הערכים\s+של\s+)/,'').trim();
  raw=raw.replace(/[?؟]$/,'').replace(/חצי\s+(קילו|קילוגרם|כוס|יחידה)/g,'0.5 $1').replace(/רבע\s+(קילו|קילוגרם|יחידה)/g,'0.25 $1');
  let amount=100,unit='גרם',explicitQuantity=false;
  const m=raw.match(/(?:^|\s)(\d+(?:[.,]\d+)?)\s*(קילוגרם|קילו|ק["״]?ג|מיליליטר|מ["״]?ל|גרמים|גרם|גר׳|גר|ג|יחידות|יחידה|פרוסות|פרוסה|מנות|מנה|פחיות|פחית)(?=\s|$)/i);
  if(m){amount=Number(m[1].replace(',','.'));unit=m[2];explicitQuantity=true;
    if(/קילו|ק["״]?ג/.test(unit)){amount*=1000;unit='גרם';}
    else if(/מיליליטר|מ["״]?ל/.test(unit))unit='מ״ל';else if(/יחיד/.test(unit))unit='יחידה';
    else if(/פרוס/.test(unit))unit='פרוסה';else if(/פחי/.test(unit))unit='פחית';else if(/מנ/.test(unit))unit='מנה';else unit='גרם';
    raw=raw.replace(m[0],' ').trim();
  }
  if(!m){const count=raw.match(/^(\d+(?:[.,]\d+)?)\s+(.*)$/);if(count&&/^(ביצים|ביצה|בננות|בננה|תפוחים|תפוח|פיתות|פיתה)(?:\s|$)/.test(count[2])){amount=Number(count[1].replace(',','.'));unit='יחידה';raw=count[2];explicitQuantity=true;}}
  const states=['לפני בישול','לא מבושלת','לא מבושל','על המחבת','מבושלת','מבושל','יבשה','יבש','נאה','נא','אפויה','אפוי','צלויה','צלוי','מטוגנת','מטוגן','מעושנת','מעושן','משומרת','משומר','מאודה','קפואים','קפואה','קפוא','מיובשים','מיובשת','מיובש'];
  const state=states.find(x=>(' '+raw+' ').includes(' '+x+' '))||'';
  let name=(state?(' '+raw+' ').replace(' '+state+' ',' '):raw).replace(/\s+/g,' ').trim();
  const aliases={'תפוחים':'תפוח','בננות':'בננה','ביצים':'ביצה'};name=aliases[name]||name;
  // Keep dried plums as a semantic identity, not a generic plum plus an arbitrary preparation.
  if((name==='שזיף'||name==='שזיפים')&&/^מיובש/.test(state))return {raw:original,name:'שזיף מיובש',state:'',amount,unit,explicitQuantity};
  return {raw:original,name:name||raw,state,amount,unit,explicitQuantity};
}

// Transparent recipe assumptions, computed from database ingredient records.
// Exact recipe names only: variants with exclusions/extra ingredients never silently use a template.
function knownRecipeEstimate_(parsed){
  const recipes={
    'ריבת בצל':{yieldGrams:200,ingredients:[['onions raw',200],['sugars granulated',50],['oil olive',10]],note:'בצל 200 גרם, סוכר 50 גרם ושמן זית 10 גרם; משקל סופי משוער 200 גרם'},
    'פירה':{yieldGrams:570,ingredients:[['potatoes boiled without skin',500],['milk whole',50],['butter',20]],note:'תפוחי אדמה מבושלים 500 גרם, חלב מלא 50 גרם וחמאה 20 גרם; משקל סופי 570 גרם'},
    'פסטה ברוטב עגבניות':{yieldGrams:340,ingredients:[['pasta cooked',200],['tomato sauce',120],['oil olive',10]],note:'פסטה מבושלת 200 גרם, רוטב עגבניות 120 גרם ושמן זית 10 גרם; משקל סופי משוער 340 גרם'},
    'סלט ירקות':{yieldGrams:410,ingredients:[['tomatoes raw',200],['cucumber raw',200],['oil olive',10]],note:'עגבנייה 200 גרם, מלפפון 200 גרם ושמן זית 10 גרם; משקל סופי 410 גרם'}
  };
  const recipe=recipes[parsed.name];if(!recipe||parsed.state)return null;
  const cache=CacheService.getScriptCache(),key='recipe:'+APP.version+':'+parsed.name;
  const hit=cache.get(key);if(hit)return JSON.parse(hit);
  const out={name:parsed.name+' — אומדן מתכון',hebrewName:parsed.name+' — אומדן מתכון',baseQty:100,unit:'גרם',calories:0,protein:0,carbs:0,fat:0,source:'אומדן מתכון מרכיבי USDA',sourceId:'recipe:'+parsed.name,state:'מוכן',assumption:recipe.note+'; זהו מתכון לדוגמה, יש להתאים למתכון שלך',ingredientSources:[]};
  for(const pair of recipe.ingredients){
    const chosen=rankFoodCandidates_(searchFoods(pair[0]),'general',pair[0])[0];
    if(!chosen)return null;
    ['calories','protein','carbs','fat'].forEach(k=>out[k]+=Number(chosen[k]||0)*pair[1]/Number(chosen.baseQty||100)*100/recipe.yieldGrams);
    out.ingredientSources.push({name:chosen.englishName||chosen.name,sourceId:chosen.sourceId,grams:pair[1]});
  }
  ['calories','protein','carbs','fat'].forEach(k=>out[k]=round1_(out[k]));
  out.englishName=out.ingredientSources.map(x=>x.name).join(' + ');
  cache.put(key,JSON.stringify(out),21600);return out;
}

function foodStateLabel_(name){
  const s=String(name||'').toLowerCase();
  if(/frozen/.test(s))return'קפוא';
  if(/dried|dehydrated/.test(s))return'מיובש';
  if(/uncooked|dry/.test(s))return'יבש / לא מבושל';
  if(/raw/.test(s))return'נא';
  if(/fried/.test(s))return'מטוגן';
  if(/baked|roasted|dry heat/.test(s))return'אפוי / צלוי';
  if(/grilled/.test(s))return'צלוי';
  if(/boiled|cooked/.test(s))return'מבושל';
  if(/steamed/.test(s))return'מאודה';
  if(/smoked/.test(s))return'מעושן';
  if(/canned/.test(s))return'משומר';
  return'';
}

function appendRows_(sheetName,rows){
  if(!rows.length)return;
  const lock=LockService.getScriptLock(); lock.waitLock(20000);
  try{
    const sh=sheet_(sheetName),max=sh.getMaxRows();
    const ids=max>1?sh.getRange(2,1,max-1,1).getValues():[];
    let run=0,start=max+1;
    for(let i=0;i<ids.length;i++){
      if(ids[i][0]===''||ids[i][0]===null){run++;if(run===rows.length){start=i-rows.length+3;break;}}
      else run=0;
    }
    const needed=start+rows.length-1-sh.getMaxRows();
    if(needed>0)sh.insertRowsAfter(sh.getMaxRows(),needed);
    if(sh.getMaxColumns()<rows[0].length)sh.insertColumnsAfter(sh.getMaxColumns(),rows[0].length-sh.getMaxColumns());
    sh.getRange(start,1,rows.length,rows[0].length).setValues(rows);
  }finally{lock.releaseLock();}
}
function spreadsheet_(){return APP_SPREADSHEET_||(APP_SPREADSHEET_=SpreadsheetApp.openById(CURRENT_USER_&&CURRENT_USER_.ss||APP.spreadsheetId));}
function sheet_(name){const sh=spreadsheet_().getSheetByName(name);if(!sh)throw new Error('הלשונית '+name+' אינה קיימת');return sh;}
function formatDateValue_(value){if(!value)return'';if(Object.prototype.toString.call(value)==='[object Date]')return Utilities.formatDate(value,APP.timezone,'yyyy-MM-dd');return String(value).slice(0,10);}
function normalize_(s){return String(s||'').toLowerCase().replace(/[\u0591-\u05C7]/g,'').replace(/[^a-z0-9\u0590-\u05ff]+/g,' ').trim();}
function round1_(n){return Math.round((Number(n)||0)*10)/10;}
function nullableNumber_(v){return v===''||v===null||v===undefined?'':Number(v);}

// v0.31: calorie bank for planned and late events ("free day"), plus the "+" menu settings.
const BANK_SIZES={small:400,medium:700,large:1000};
const BANK_TYPES={restaurant:'מסעדה',family:'ארוחה משפחתית',friends:'יציאה עם חברים',other:'אירוע'};
const PLUS_MENU_IDS=['treat','event','calendar','mealPhoto','food','weight','workout','whatToEat','checkin','shortcuts'];
function bankContext_(settings){
  const s=settings||getSettings_();let profile={};try{profile=JSON.parse(s.profile_json||'{}')}catch(_){}
  const goal=Number(s.calorie_goal)||2200,protein=Number(s.protein_goal)||130;
  const weight=Number(profile.weight)||75,male=profile.sex==='m';
  const fatMin=Math.round(weight*0.6),minDay=Math.max(male?1500:1200,Math.round(protein*4+fatMin*9+320));
  const noDeficit=Number(profile.age)<18||profile.medical===true;
  const maxCut=noDeficit?0:Math.max(0,Math.min(Math.round(goal*0.10/10)*10,goal-minDay));
  return {goal,protein,fatMin,minDay,maxCut,noDeficit};
}
// v0.32: an event far ahead is saved without a plan ("pending"). Its reminder opens on the Sunday of its week,
// or on the Thursday before when the event is on Sunday–Tuesday, and the plan is built then with the goal of that time.
function bankRemindDate_(date){const dow=new Date(date+'T12:00:00Z').getUTCDay(),sunday=addDays_(date,-dow);return dow<=2?addDays_(sunday,-3):sunday;}
function listBankEvents_(settings){
  let values=[];try{values=readValues_('App_Events');}catch(_){return [];}
  const s=settings||getSettings_(),today=getWorkingDateFromSettings_(s);let ctx=null;
  return values.slice(1).filter(r=>r[0]&&String(r[7])==='active').map(r=>{let plan={};try{plan=JSON.parse(String(r[6]||'{}'))}catch(_){}
    const date=formatDateValue_(r[1]);
    const e={id:String(r[0]),date,type:String(r[2]),label:BANK_TYPES[String(r[2])]||'אירוע',size:String(r[3]),extra:Number(r[4])||0,method:String(r[5]),plan,note:String(r[9]||''),remind:bankRemindDate_(date)};
    // No method was chosen in time: on the day itself the event is handled "on the day".
    if(plan.mode==='pending'&&date<=today){ctx=ctx||bankContext_(s);e.plan=bankPlan({goal:ctx.goal,protein:ctx.protein,maxCut:0,noDeficit:true,today:date,date,extra:e.extra,method:'day'});e.plan.auto=true;}
    return e;
  }).sort((a,b)=>a.date.localeCompare(b.date));
}
function bankAdjust_(date,events,settings){
  let delta=0;const items=[],list=events||listBankEvents_(settings),isEventDay=list.some(e=>e.date===date);
  list.forEach(e=>{const v=Number(e.plan&&e.plan.adj&&e.plan.adj[date])||0;if(v<0&&isEventDay)return;if(v){delta+=v;items.push({id:e.id,label:e.label,eventDate:e.date,amount:v});}});
  return {delta,items};
}
function getBankState_(settings){
  const s=settings||getSettings_(),today=getWorkingDateFromSettings_(s),from=addDays_(today,-62);
  return {today,ctx:bankContext_(s),events:listBankEvents_(s).filter(e=>e.date>=from)};
}
function bankResponse_(viewDate){
  const date=/^\d{4}-\d{2}-\d{2}$/.test(String(viewDate||''))?String(viewDate):getWorkingDate_();
  return {bank:getBankState_(),day:getDayData_(date)};
}
function computeBankPlan_(ctx,today,date,extra,method,others){
  const used={};others.forEach(e=>Object.keys((e.plan&&e.plan.adj)||{}).forEach(d=>{const v=Number(e.plan.adj[d])||0;if(v<0)used[d]=(used[d]||0)+v;}));
  return bankPlan({goal:ctx.goal,protein:ctx.protein,maxCut:ctx.maxCut,noDeficit:ctx.noDeficit,today,date,extra,method,used,skip:others.map(e=>e.date)});
}
function findBankEventRow_(id){
  const sh=sheet_('App_Events'),rows=sh.getDataRange().getValues(),i=rows.findIndex((r,j)=>j>0&&String(r[0])===String(id)&&String(r[7])==='active');
  if(i<1)throw new Error('האירוע לא נמצא');return {sh,row:i+1};
}
function saveBankEvent(payload){
  ensureStructure_();
  const p=payload||{},date=String(p.date||''),id=String(p.id||'');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))throw new Error('בחר תאריך לאירוע');
  const settings=getSettings_(),today=getWorkingDateFromSettings_(settings);
  if(date<addDays_(today,-14)||date>addDays_(today,183))throw new Error('אפשר לרשום אירוע עד שבועיים אחורה או חצי שנה קדימה');
  const type=BANK_TYPES[p.type]?p.type:'other',size=BANK_SIZES[p.size]?p.size:'medium';
  const method=['spread','day','half'].includes(p.method)?p.method:'half';
  const others=listBankEvents_(settings).filter(e=>e.id!==id);
  if(others.some(e=>e.date===date))throw new Error('כבר יש אירוע בתאריך הזה');
  const plan=date>today&&bankRemindDate_(date)>today?{mode:'pending',method:'later',adj:{}}:computeBankPlan_(bankContext_(settings),today,date,BANK_SIZES[size],method,others);
  const stored=plan.mode==='pending'?'later':plan.method,note=String(p.note||'').trim().slice(0,120);
  let savedId=id;
  if(id){const f=findBankEventRow_(id);f.sh.getRange(f.row,2,1,9).setValues([[date,type,size,BANK_SIZES[size],stored,JSON.stringify(plan),'active',new Date(),note]]);}
  else{savedId=Utilities.getUuid();sheet_('App_Events').appendRow([savedId,date,type,size,BANK_SIZES[size],stored,JSON.stringify(plan),'active',new Date(),note]);}
  const weekStart=addDays_(today,-new Date(today+'T12:00:00Z').getUTCDay());
  if(date>=weekStart&&date<=addDays_(weekStart,6))setSetting_('bank_week_asked','w:'+weekStart);
  const out=bankResponse_(p.viewDate);out.savedId=savedId;out.plan=plan;return out;
}
function chooseBankMethod(payload){
  ensureStructure_();
  const p=payload||{},settings=getSettings_(),today=getWorkingDateFromSettings_(settings);
  const all=listBankEvents_(settings),e=all.find(x=>x.id===String(p.id||''));if(!e)throw new Error('האירוע לא נמצא');
  if(e.date<today)throw new Error('האירוע כבר עבר');
  const method=['spread','day','half'].includes(p.method)?p.method:'half';
  const plan=computeBankPlan_(bankContext_(settings),today,e.date,e.extra,method,all.filter(x=>x.id!==e.id));
  const f=findBankEventRow_(e.id);f.sh.getRange(f.row,6,1,2).setValues([[plan.method,JSON.stringify(plan)]]);
  const out=bankResponse_(p.viewDate);out.plan=plan;return out;
}
function setBankEventStatus_(id,status){
  ensureStructure_();
  const sh=sheet_('App_Events'),rows=sh.getDataRange().getValues(),i=rows.findIndex((r,j)=>j>0&&String(r[0])===String(id));
  if(i<1)throw new Error('האירוע לא נמצא');
  sh.getRange(i+1,8).setValue(status);
}
function deleteBankEvent(payload){const p=payload||{};setBankEventStatus_(p.id,'deleted');return bankResponse_(p.viewDate);}
function restoreBankEvent(payload){const p=payload||{};setBankEventStatus_(p.id,'active');return bankResponse_(p.viewDate);}
function setBankWeekAnswer(weekStart){
  const w=String(weekStart||'');if(!/^\d{4}-\d{2}-\d{2}$/.test(w))throw new Error('שבוע לא תקין');
  setSetting_('bank_week_asked','w:'+w);return {settings:getSettings_()};
}
function savePlusMenu(list){
  const seen=new Set(),clean=(Array.isArray(list)?list:[]).map(x=>({id:String(x&&x.id||''),on:!!(x&&x.on)})).filter(x=>PLUS_MENU_IDS.includes(x.id)&&!seen.has(x.id)&&seen.add(x.id));
  PLUS_MENU_IDS.forEach(id=>{if(!seen.has(id))clean.push({id,on:false});});
  setSetting_('plus_menu',JSON.stringify(clean));return {settings:getSettings_()};
}
function bankPlan(p){
  /* Pure calculation shared by server and app: keep the two copies identical. */
  var r10=function(n){return Math.round(n/10)*10;};
  var addD=function(d,n){var x=new Date(d+'T12:00:00Z');x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10);};
  var goal=Number(p.goal)||2200,protein=Number(p.protein)||130,maxCut=Math.max(0,Number(p.maxCut)||0),extra=Math.max(0,Number(p.extra)||0);
  var used=p.used||{},skip=p.skip||[],out={mode:'future',method:p.method||'half',days:[],banked:0,onDay:0,overflow:0,adj:{},preBudget:0,eventMeal:0,proteinBefore:Math.round(protein*0.7),dayGoal:goal,forced:''};
  if(p.date<p.today){out.mode='past';out.method='none';return out;}
  if(p.date===p.today){out.mode='today';if(out.method!=='day')out.forced='today';out.method='day';}
  else if(p.noDeficit&&out.method!=='day'){out.forced='safety';out.method='day';}
  var spreadPart=out.method==='spread'?extra:out.method==='half'?r10(extra/2):0;
  if(spreadPart>0){
    var list=[];for(var d=addD(p.date,-6);d<p.date;d=addD(d,1)){if(d>=p.today&&skip.indexOf(d)<0)list.push({date:d,cap:Math.max(0,maxCut-Math.max(0,-(Number(used[d])||0))),cut:0});}
    var left=spreadPart;
    for(var k=0;k<8&&left>0;k++){var open=list.filter(function(x){return x.cap-x.cut>=10;});if(!open.length)break;var share=Math.max(10,r10(left/open.length));
      open.forEach(function(x){if(left<=0)return;var g=Math.min(share,x.cap-x.cut,left);g=Math.floor(g/10)*10;x.cut+=g;left-=g;});}
    list.forEach(function(x){if(x.cut>0){out.days.push({date:x.date,cut:x.cut});out.adj[x.date]=-x.cut;out.banked+=x.cut;}});
  }
  out.onDay=extra-out.banked;
  out.eventMeal=r10(goal*0.35+extra);
  var minPre=r10(out.proteinBefore*4+300);
  out.preBudget=r10(goal+out.banked-out.eventMeal);
  if(out.preBudget<minPre){out.overflow=minPre-out.preBudget;out.preBudget=minPre;}
  out.adj[p.date]=out.banked+out.overflow;
  out.dayGoal=goal+out.adj[p.date];
  return out;
}

// v0.33: sleep and resting heart rate, sent every morning by an iPhone Shortcut (Apple Health, fed by Garmin Connect). Nothing is typed by hand.
const HEALTH_FIELDS=['sleep_h','resting_hr','hrv_ms','body_battery'];
function healthNum_(v){
  if(v===null||v===undefined||v==='')return '';
  let s=String(v).trim().replace(/\s+/g,'');
  if(/^\d{1,3}(,\d{3})+$/.test(s))s=s.replace(/,/g,'');else s=s.replace(',','.');
  const n=Number(s.replace(/[^\d.\-]/g,''));return Number.isFinite(n)?n:'';
}
function saveHealthData(payload){
  ensureStructure_();
  const p=payload||{},settings=getSettings_(),today=getWorkingDateFromSettings_(settings);
  const date=/^\d{4}-\d{2}-\d{2}$/.test(String(p.date||''))?String(p.date):today;
  if(date>today||date<addDays_(today,-30))throw new Error('אפשר לעדכן רק את 30 הימים האחרונים');
  // Sleep may come as hours, minutes or seconds (Shortcuts sends durations in different units).
  // "sleep" from a Shortcut: up to 24 is hours, up to 1440 minutes, above that seconds.
  let sleep=healthNum_(p.sleep_h);
  if(sleep===''){const raw=healthNum_(p.sleep);if(raw!=='')sleep=raw<=24?raw:raw<=1440?raw/60:raw/3600;}
  const vals={sleep_h:sleep===''?'':Math.round(sleep*100)/100,resting_hr:healthNum_(p.resting_hr),hrv_ms:healthNum_(p.hrv_ms),body_battery:healthNum_(p.body_battery)};
  const ranges={sleep_h:[0,16],resting_hr:[25,140],hrv_ms:[5,250],body_battery:[0,100]};
  HEALTH_FIELDS.forEach(k=>{if(vals[k]!==''&&(vals[k]<ranges[k][0]||vals[k]>ranges[k][1]))vals[k]='';});
  if(HEALTH_FIELDS.every(k=>vals[k]===''))throw new Error('לא התקבל אף נתון תקין');
  const source=String(p.source||'app').slice(0,20);
  const sh=sheet_('App_Health'),rows=sh.getDataRange().getValues(),i=rows.findIndex((r,j)=>j>0&&formatDateValue_(r[0])===date);
  const old=i>0?rows[i]:null,row=[date];
  // A value that is not sent keeps what was already saved, so the Shortcut and manual typing complement each other.
  HEALTH_FIELDS.forEach((k,n)=>row.push(vals[k]!==''?vals[k]:(old?old[n+1]:'')));
  const oldSrc=old?String(old[5]||''):'';row.push(oldSrc&&oldSrc.split('+').indexOf(source)<0?oldSrc+'+'+source:(oldSrc||source),new Date());
  if(i>0)sh.getRange(i+1,1,1,row.length).setValues([row]);else sh.appendRow(row);
  return {ok:true,date,health:getHealth_(21)};
}
function getHealth_(days){
  let values=[];try{values=readValues_('App_Health');}catch(_){return [];}
  const from=addDays_(getWorkingDate_(),-(days||21));
  return values.slice(1).filter(r=>r[0]).map(r=>{const x={date:formatDateValue_(r[0]),source:String(r[5]||'')};HEALTH_FIELDS.forEach((k,n)=>{x[k]=r[n+1]===''?'':Number(r[n+1]);});return x;})
    .filter(x=>x.date>=from).sort((a,b)=>a.date.localeCompare(b.date));
}

// v0.33.9: export for the move to Firebase. The new app pulls every sheet in pages, plus the few settings kept outside the sheets.
function exportSheetInfo(){
  return spreadsheet_().getSheets().map(sh=>({name:sh.getName(),rows:sh.getLastRow(),cols:sh.getLastColumn()}));
}
function exportSheet(p){
  const name=String(p&&p.name||''),offset=Math.max(0,Number(p&&p.offset)||0),limit=Math.min(2000,Math.max(1,Number(p&&p.limit)||1000));
  const sh=spreadsheet_().getSheetByName(name);if(!sh)throw new Error('אין לשונית '+name);
  const last=sh.getLastRow(),cols=sh.getLastColumn();
  if(offset>=last||!cols)return {name,offset,total:last,rows:[]};
  const n=Math.min(limit,last-offset),vals=sh.getRange(offset+1,1,n,cols).getValues();
  return {name,offset,total:last,rows:vals.map(r=>r.map(v=>Object.prototype.toString.call(v)==='[object Date]'?{$d:v.toISOString()}:v))};
}
function exportProps(){
  const sp=PropertiesService.getScriptProperties(),user={};
  ['HIDDEN_MEALS','QUICK_ACTIONS','SEEDED_EXERCISES_VERSION'].forEach(k=>{const v=sp.getProperty(userKey_(k));if(v!==null)user[k]=v;});
  return {user,script:{TZAMERET_VERSION:sp.getProperty('TZAMERET_VERSION')||'',TZAMERET_COUNT:sp.getProperty('TZAMERET_COUNT')||''},
    has:{openai:!!sp.getProperty('OPENAI_API_KEY'),usda:!!sp.getProperty('USDA_API_KEY')}};
}

  CURRENT_USER_={id:__user.id,name:__user.name||'',ss:'local',admin:true};
  return {api:apiFunctions_(),ensure:ensureStructure_};
};
