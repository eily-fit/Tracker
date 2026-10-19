/* FitPro 2.31.0
   "לשאול מה לאכול" — a food chat (from the small ＋).
   - First a few quick questions with buttons (no cost): where (home / restaurant), food type, calories, budget at a restaurant.
   - Then the chat (Push.gs foodChat → OpenAI): it knows what is left today, the goal, an event, what you ate,
     what you usually eat and what it learned about you. A photo of a menu or of the fridge can be sent.
   - The answer: dishes ranked best → worst (מקום ראשון / שני / שלישי, then the rest), each with "הוסף ליומן".
   - What it learns about you is kept in the account (CHAT_MEM) and shown in Settings: "מה הצ׳אט יודע עליי".
   (the recording, the sounds and the videos are not touched here) */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const prop=k=>{try{return FP2.getProp(k)||''}catch(_){return ''}};
const setProp=(k,v)=>{try{FP2.setProp(k,v)}catch(_){}};
const J=(k,d)=>{try{const v=JSON.parse(prop(k)||'null');return v==null?d:v}catch(_){return d}};
const kc=n=>Math.round(Number(n)||0).toLocaleString('he-IL');
const today=()=>(typeof state!=='undefined'&&(state.todayDate||state.date))||new Date().toISOString().slice(0,10);
window.fpChat=window.fpChat||{};
const ic=(p,s=18)=>`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const IC={cam:'<path d="M4 8h3l2-2.5h6L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',send:'<path d="M20 12H5M11 6l-6 6 6 6"/>',x:'<path d="M6 6l12 12M18 6L6 18"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',brain:'<path d="M9 4a3 3 0 00-3 3v.5A3 3 0 004 10.5a3 3 0 001.5 2.6A3 3 0 008 18h1V4zM15 4a3 3 0 013 3v.5a3 3 0 012 3 3 3 0 01-1.5 2.6A3 3 0 0116 18h-1V4z"/>',
  chat:'<path d="M4 5h16v11H9l-5 4z"/>',new:'<path d="M4 12a8 8 0 1 0 3-6.2M4 4v4h4"/>'};

/* ---------- styles ---------- */
document.head.insertAdjacentHTML('beforeend',`<style id="fp231css">
#fpChat{position:fixed;inset:0;z-index:2147482400;background:var(--bg,#0F1317);display:flex;flex-direction:column;color:var(--ink,#F2F5F7)}
#fpChat .hd{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:calc(env(safe-area-inset-top) + 10px) 14px 10px;border-bottom:1px solid var(--line,#2C3640);background:#13181d}
#fpChat .hd b{font-size:17px}#fpChat .hd button{background:none;border:0;color:var(--muted,#A3ADB8);padding:6px;display:grid;place-items:center;cursor:pointer;font:inherit}
#fpChat .hd .r{display:flex;gap:2px}
#fpChat .left{display:flex;gap:6px;padding:8px 14px 0}#fpChat .left div{flex:1;background:var(--card,#171C22);border:1px solid var(--line,#2C3640);border-radius:12px;padding:5px 8px;text-align:center}
#fpChat .left small{display:block;color:#6B7682;font-size:10.5px}#fpChat .left b{font-size:14px;font-variant-numeric:tabular-nums}
#fpChatBody{flex:1;overflow-y:auto;padding:12px 14px 16px;display:flex;flex-direction:column;gap:8px;-webkit-overflow-scrolling:touch}
.fcB{max-width:84%;border-radius:16px;padding:9px 12px;font-size:14.5px;line-height:1.5;white-space:pre-wrap;word-break:break-word}
.fcB.a{align-self:flex-start;background:#1F262E;border:1px solid var(--line,#2C3640);border-bottom-right-radius:5px}
.fcB.u{align-self:flex-end;background:#222D17;border:1px solid #4B5A2A;border-bottom-left-radius:5px}
.fcB.u img{display:block;max-width:180px;max-height:180px;border-radius:10px;margin-bottom:6px}
.fcB.e{align-self:center;background:#3a1d1f;border:1px solid #6b2a2e;font-size:13px}
.fcQ{display:flex;flex-wrap:wrap;gap:6px;align-self:flex-start;max-width:96%}
.fcQ button{font:inherit;font-size:13.5px;font-weight:700;border:1px solid var(--brand,#D7F36B);color:var(--brand,#D7F36B);background:transparent;border-radius:99px;padding:7px 13px;cursor:pointer}
.fcQ button:disabled{opacity:.35}
.fcL{align-self:flex-start;font-size:12px;color:#8FD18F;background:rgba(110,231,135,.08);border:1px dashed #2F5A3A;border-radius:12px;padding:5px 10px}
.fcD{align-self:stretch;background:var(--card,#171C22);border:1px solid var(--line,#2C3640);border-radius:14px;padding:10px 12px}
.fcD .rk{font-size:11.5px;font-weight:800;color:var(--brand,#D7F36B);margin-bottom:2px}.fcD b{font-size:15px}
.fcD .m{color:#A3ADB8;font-size:12.5px;margin:3px 0 4px;font-variant-numeric:tabular-nums}.fcD .w{font-size:13.5px;line-height:1.45;margin:0 0 7px}
.fcD .ad{font:inherit;font-size:12.5px;font-weight:700;border:1px solid var(--brand,#D7F36B);color:var(--brand,#D7F36B);background:transparent;border-radius:99px;padding:5px 12px;cursor:pointer}
.fcD .ad.done{border-color:#2F5A3A;color:#8FD18F}
.fcD.s{padding:8px 12px;display:flex;align-items:center;gap:8px}.fcD.s .t{flex:1;min-width:0}.fcD.s b{font-size:14px}.fcD.s .m{margin:1px 0 0}
.fcMore{align-self:flex-start;font-size:12.5px;color:#A3ADB8;margin:2px 2px 0}
.fcTy{align-self:flex-start;color:#A3ADB8;font-size:13px;padding:4px 2px}
#fpChat .in{display:flex;gap:8px;align-items:center;padding:8px 12px calc(env(safe-area-inset-bottom) + 10px);border-top:1px solid var(--line,#2C3640);background:#13181d}
#fpChat .in input[type=text]{flex:1;min-width:0;font:inherit;font-size:16px;background:#1F262E;border:1px solid var(--line,#2C3640);border-radius:99px;padding:10px 14px;color:var(--ink,#F2F5F7)}
#fpChat .in .c,#fpChat .in .s{flex:none;width:42px;height:42px;border-radius:50%;display:grid;place-items:center;border:1px solid var(--line,#2C3640);background:#1F262E;color:var(--ink,#F2F5F7);cursor:pointer}
#fpChat .in .s{background:var(--brand,#D7F36B);color:#14190a;border-color:var(--brand,#D7F36B)}
#fpChat .in .s:disabled{opacity:.4}
#fpChat .pv{display:flex;align-items:center;gap:8px;padding:6px 14px 0}#fpChat .pv img{height:54px;border-radius:9px}#fpChat .pv button{font:inherit;font-size:12px;background:none;border:0;color:#FF8A80}
.fcN{align-self:stretch;display:flex;flex-direction:column;gap:7px;background:var(--card,#171C22);border:1px solid var(--line,#2C3640);border-radius:14px;padding:10px}
.fcN input{font:inherit;font-size:16px;background:#1F262E;border:1px solid var(--line,#2C3640);border-radius:10px;padding:9px 11px;color:var(--ink,#F2F5F7)}
.fcN .r{display:flex;gap:6px}.fcN button{font:inherit;font-size:13.5px;font-weight:700;border-radius:99px;padding:7px 15px;cursor:pointer}
.fcN .sv{background:var(--brand,#D7F36B);color:#14190a;border:1px solid var(--brand,#D7F36B)}.fcN .al{background:transparent;color:var(--brand,#D7F36B);border:1px solid var(--brand,#D7F36B)}
.fcAdd{align-self:flex-start;font:inherit;font-size:12.5px;color:#A3ADB8;background:none;border:1px dashed var(--line,#2C3640);border-radius:99px;padding:5px 11px;cursor:pointer}
.fcA{margin-top:4px}.fcBig{width:100%;font:inherit;font-size:14px;font-weight:800;background:var(--brand,#D7F36B);color:#14190a;border:0;border-radius:11px;padding:9px;cursor:pointer}
.fcSm{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}.fcSm button{font:inherit;font-size:12.5px;font-weight:700;background:transparent;color:#A3ADB8;border:1px solid var(--line,#2C3640);border-radius:99px;padding:5px 12px;cursor:pointer}
.fcOk{border:1px solid #2F5A3A;color:#8FD18F;border-radius:11px;padding:8px;text-align:center;font-weight:800;font-size:13.5px}
#fpChatMemS .ml{display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--line,#2C3640);padding:9px 2px;font-size:14px}#fpChatMemS .ml span{flex:1}
#fpChatMemS .ml button{background:none;border:0;color:#FF8A80;font:inherit;font-size:13px;cursor:pointer}
#fpChatMemS .add{display:flex;gap:8px;margin-top:10px}#fpChatMemS .add input{flex:1;min-width:0}
</style>`);

/* ---------- what it knows about you ---------- */
const MEM=()=>{const a=J('CHAT_MEM',[]);return Array.isArray(a)?a.filter(x=>typeof x==='string'&&x.trim()):[]};
const memSave=a=>setProp('CHAT_MEM',JSON.stringify(a.slice(-40)));
function memAdd(lines){const a=MEM(),low=a.map(x=>x.trim().toLowerCase());const added=[];(lines||[]).forEach(l=>{const t=String(l||'').trim().slice(0,80);if(t&&!low.includes(t.toLowerCase())){a.push(t);low.push(t.toLowerCase());added.push(t)}});if(added.length)memSave(a);return added}
/* 2.32: what the questionnaire said counts too (״איך אתה אוכל״ + ״יש משהו שאתה לא אוכל״) */
const NO_L={gluten:'גלוטן',lact:'לקטוז',fish:'דגים',peanut:'בוטנים'};
function onbKnown(){let p={};try{p=(typeof getProfile==='function'&&getProfile())||{}}catch(_){p={}}const o=[];
  if(p.diet==='veg')o.push('צמחוני (בלי בשר ודגים)');else if(p.diet==='vegan')o.push('טבעוני (בלי מוצרים מהחי)');
  (Array.isArray(p.no)?p.no:[]).forEach(k=>{if(NO_L[k])o.push('בלי '+NO_L[k])});return o}
function known(){const a=onbKnown(),low=a.map(x=>x.toLowerCase());MEM().forEach(x=>{if(!low.includes(x.toLowerCase()))a.push(x)});return a}
const eatsAll=()=>prop('CHAT_EATS_ALL')==='1';
fpChat.known=known;
fpChat.memDel=i=>{const a=MEM();a.splice(i,1);memSave(a);memDraw()};
fpChat.memAddUI=id=>{const el=$(id);const v=el?el.value.trim():'';if(!v)return;memAdd([v]);el.value='';memDraw()};
function memHtml(inp){const a=MEM();return (a.length?a.map((x,i)=>`<div class="ml"><span>${esc(x)}</span><button type="button" onclick="fpChat.memDel(${i})">מחק</button></div>`).join(''):'<p class="muted" style="margin:4px 0">עוד אין. כשתכתוב בצ׳אט משהו כמו ״אני לא אוכל פטריות״ או ״אני שומר כשרות״, זה יישמר כאן.</p>')+
  `<div class="add"><input id="${inp}" type="text" maxlength="80" placeholder="להוסיף: למשל ״כשר״, ״אלרגי לבוטנים״"><button type="button" class="btn light" onclick="fpChat.memAddUI('${inp}')">הוסף</button></div>`}
function memDraw(){const s=$('fpChatMemS');if(s){const b=s.querySelector('.memb');if(b)b.innerHTML=memHtml('fpChatMemI')}const set=$('fpChatMemSet');if(set){const b=set.querySelector('.settings-body');if(b)b.innerHTML='<p class="muted" style="margin:0 0 6px">הצ׳אט ״מה לאכול״ זוכר את זה ומתחשב בזה תמיד. אפשר למחוק או להוסיף.</p>'+memHtml('fpChatMemSI')}}
fpChat.mem=()=>{const o=$('fpChatMemS');if(o)o.remove();document.body.insertAdjacentHTML('beforeend',`<div class="overlay" id="fpChatMemS" style="z-index:2147482500" onclick="if(event.target===this)this.remove()"><div class="sheet"><div class="sheet-head"><h3 style="margin:0">מה הצ׳אט יודע עליי</h3><button type="button" class="trash" aria-label="סגור" onclick="document.getElementById('fpChatMemS').remove()">✕</button></div><div class="memb"></div></div></div>`);memDraw()};
/* in Settings → אוכל ויעדים */
function memSetMount(){const sec=$('settings');if(!sec||$('fpChatMemSet'))return;const box=document.createElement('details');box.className='settings-section';box.id='fpChatMemSet';box.innerHTML='<summary>מה הצ׳אט יודע עליי</summary><div class="settings-body"></div>';
  const food=$('fpFolderFood'),body=food&&food.querySelector(':scope > .settings-body');if(body)body.appendChild(box);else{const h=sec.querySelector('h2');if(!h)return;h.insertAdjacentElement('afterend',box)}memDraw()}
setInterval(()=>{try{if($('settings')&&$('settings').classList.contains('active'))memSetMount()}catch(_){}},1500);

/* ---------- the day, for the chat ---------- */
function dayCtx(){const t=(state.data&&state.data.totals)||{};let held=0;try{held=typeof fpEventHeld==='function'?fpEventHeld()||0:0}catch(_){}
  const goal=Math.round((Number(t.calorieGoal)||0)-held),eaten=Math.round(Number(t.calories)||0),pg=Math.round(Number(t.proteinGoal)||0),pe=Math.round(Number(t.protein)||0);
  let c={};try{c=bankCtx()||{}}catch(_){}
  const ev=(()=>{try{const e=(bankEvents()||[]).find(x=>x.date===today());if(!e)return null;let st=false;try{st=!!(typeof fpEventHeld==='function'&&fpEventHeld()===0&&Number(t.shift&&t.shift.toEvent)>0)}catch(_){}return {name:e.label,savedForIt:Math.round((e.real&&e.real.amount)||0),started:st}}catch(_){return null}})();
  const ate=((state.data&&state.data.entries)||[]).filter(e=>e&&e.name).slice(-15).map(e=>`${e.name} (${kc(e.calories)} קל׳)`);
  let often=[];try{const m=JSON.parse(prop('FOOD_LAST')||'{}');often=Object.entries(m).sort((a,b)=>(Number(b[1].t)||0)-(Number(a[1].t)||0)).slice(0,25).map(([k,v])=>String(k).replace(/^n:/,'')+': '+v.a+' '+v.u).filter(x=>!/^\d/.test(x))}catch(_){}
  return {date:today(),caloriesLeftToday:goal-eaten,caloriesGoalToday:goal,eatenToday:eaten,proteinLeft:Math.max(0,pg-pe),proteinGoal:pg,goal:c.goalName||'',event:ev,ateToday:ate,eatsOften:often,knownAboutUser:known().concat(eatsAll()&&!known().length?['אוכל הכל']:[])}}
fpChat.ctx=dayCtx;

/* ---------- the conversation ---------- */
const CK='fp2.chat';
let C=null;/* {msgs:[{role,text,image?,dishes?,options?,learned?,local?}], ch:{place,type,cal,limit,budget}, step, day} */
function load(){try{const x=JSON.parse(localStorage.getItem(CK)||'null');if(x&&x.day===today()&&Array.isArray(x.msgs))return x}catch(_){}return null}
function save(){try{const c=Object.assign({},C,{msgs:C.msgs.map(m=>Object.assign({},m,{image:m.image?'1':undefined,thumb:undefined}))});localStorage.setItem(CK,JSON.stringify(c))}catch(_){}}
const STEPS=[
  {k:'place',q:'היי! איפה אתה אוכל?',o:['בבית','במסעדה']},
  {k:'type',q:'בשרי, חלבי או פרווה?',o:['בשרי','חלבי','פרווה','לא משנה']},
  {k:'cal',q:()=>{const x=dayCtx();return `כמה קלוריות? נשארו לך היום ${kc(Math.max(0,x.caloriesLeftToday))}.`},o:['לפי מה שנשאר','עד מספר שאבחר','מה הכי טוב לי']},
  {k:'budget',q:'ותקציב?',o:['עד 50 ₪','עד 80 ₪','עד 120 ₪','לא משנה'],only:c=>c.place==='במסעדה'}];
function fresh(){C={msgs:[],ch:{},step:0,day:today()};
  /* 2.32 (sketch B): nothing known yet → ask once, free text. Known → no question, only a way to add */
  if(!known().length&&!eatsAll()){C.msgs.push({role:'assistant',text:'לפני שמתחילים: יש משהו שאתה לא אוכל? אפשר לכתוב חופשי.',local:true,noAsk:true});save();draw();return}
  ask()}
function noDone(i,text){const m=C&&C.msgs[i];if(!m||m.used)return;
  if(text==null){m.used='all';setProp('CHAT_EATS_ALL','1');C.msgs.push({role:'user',text:'אוכל הכל',local:true})}
  else{const parts=String(text).split(/[,،;\n]+/).map(x=>x.trim()).filter(Boolean);if(!parts.length)return;m.used='saved';const added=memAdd(parts);C.msgs.push({role:'user',text:String(text).trim(),local:true});if(added.length)C.msgs.push({role:'assistant',text:'',local:true,learned:added})}
  save();ask()}
fpChat.noSave=i=>{const el=$('fpChatNo'+i);const v=el?el.value.trim():'';if(!v){if(el)el.focus();return}noDone(i,v)};
fpChat.noAll=i=>noDone(i,null);
fpChat.addOpen=()=>{const w=$('fpChatAddW');if(w){w.innerHTML=`<div class="fcN"><input id="fpChatAddI" type="text" maxlength="160" placeholder="למשל: בלי טונה, לא חריף"><div class="r"><button type="button" class="sv" onclick="fpChat.addSave()">שמור</button></div></div>`;const i=$('fpChatAddI');if(i)i.focus()}};
fpChat.addSave=()=>{const el=$('fpChatAddI');const v=el?el.value.trim():'';if(!v){if(el)el.focus();return}const added=memAdd(v.split(/[,،;\n]+/).map(x=>x.trim()).filter(Boolean));C.addDone=true;if(added.length)C.msgs.push({role:'assistant',text:'',local:true,learned:added});save();draw()}
function ask(){while(C.step<STEPS.length&&STEPS[C.step].only&&!STEPS[C.step].only(C.ch))C.step++;
  if(C.step>=STEPS.length){afterSteps();return}
  const s=STEPS[C.step];C.msgs.push({role:'assistant',text:typeof s.q==='function'?s.q():s.q,options:s.o,local:true,step:C.step});save();draw()}
function afterSteps(){if(C.ch.place==='במסעדה'){C.msgs.push({role:'assistant',text:'מעולה. צלם את התפריט (כפתור המצלמה למטה) או כתוב מה יש בו, ואמליץ.',local:true});save();draw()}
  else send('מה כדאי לי לאכול עכשיו בבית?')}
function choose(i,o){const m=C.msgs[i];if(!m||m.used)return;m.used=o;
  if(m.local&&m.step!=null){const s=STEPS[m.step];C.msgs.push({role:'user',text:o,local:true});
    if(s.k==='cal'&&o==='עד מספר שאבחר'){C.waitLimit=true;C.msgs.push({role:'assistant',text:'עד כמה קלוריות? כתוב מספר.',local:true});save();draw();const el=$('fpChatIn');if(el){el.inputMode='numeric';el.focus()}return}
    C.ch[s.k]=o;C.step=m.step+1;save();draw();ask();return}
  send(o)}
fpChat.pick=(i,j)=>{const m=C&&C.msgs[i];if(!m||!m.options)return;choose(i,m.options[j])};

/* the conversation as the server gets it: the choices first, then the messages (no local button questions) */
function apiMsgs(){const ch=C.ch,pre=[];const lim=ch.limit?`עד ${ch.limit} קלוריות`:ch.cal||'';
  const sum=[ch.place&&('מקום: '+ch.place),ch.type&&('סוג: '+ch.type),lim&&('קלוריות: '+lim),ch.budget&&('תקציב: '+ch.budget)].filter(Boolean).join(' · ');
  if(sum)pre.push({role:'user',text:'הבחירות שלי: '+sum});
  const rest=C.msgs.filter(m=>!m.local&&!m.err).map(m=>({role:m.role,text:m.role==='assistant'?(m.text+(m.dishes&&m.dishes.length?'\nמנות: '+m.dishes.map(d=>`${d.name} (${d.kcal} קל׳, ${d.protein} ג׳ חלבון${d.price?', '+d.price:''})`).join('; '):'')):m.text,image:m.image&&m.image.length>10?m.image:undefined}));
  rest.forEach((m,i)=>{if(i<rest.length-1)delete m.image});
  return pre.concat(rest).slice(-14)}
let BUSY=false;
async function send(text,image,thumb){if(BUSY)return;text=String(text||'').trim();if(!text&&!image)return;
  if(C.waitLimit&&!image){const n=Math.round(Number(String(text).replace(/[^\d.]/g,'')));if(n>=100&&n<=5000){C.waitLimit=false;C.ch.cal='עד מספר';C.ch.limit=n;C.msgs.push({role:'user',text:text,local:true});const s=STEPS.findIndex(x=>x.k==='cal');C.step=s+1;save();draw();ask();return}
    C.msgs.push({role:'user',text:text,local:true});C.msgs.push({role:'assistant',text:'כתוב מספר בין 100 ל-5,000.',local:true});save();draw();return}
  /* typing in the middle of the questions skips them */
  C.step=STEPS.length;C.msgs.push({role:'user',text:text||'',image:image||undefined,thumb:thumb||undefined});save();BUSY=true;draw();
  try{if(!window.FP2||!FP2.push)throw new Error('אין חיבור לשרת. נסה שוב בעוד רגע');
    const r=await FP2.push('foodChat',{messages:apiMsgs(),ctx:dayCtx()});
    const learned=memAdd(r&&r.learn);
    C.msgs.push({role:'assistant',text:(r&&r.reply)||'',dishes:(r&&r.dishes)||[],options:(r&&r.options)||[],learned});C.used=r&&r.used;C.limit=r&&r.limit}
  catch(e){const msg=String((e&&e.message)||e);C.msgs.push({role:'assistant',err:true,text:/unknown action/.test(msg)?'הצ׳אט עוד לא מוכן בשרת. צריך להעלות את קובץ השרת החדש (Push.gs).':/push-not-configured/.test(msg)?'אין חיבור לשרת של האפליקציה.':msg})}
  finally{BUSY=false;save();draw()}}
fpChat.send=send;

/* ---------- adding a dish to the diary ---------- */
/* 2.32 (sketch B): every dish can go to the day, to "my foods", or both. After a tap the card shows what happened */
const n1c=v=>Math.round((Number(v)||0)*10)/10;
function dishMacros(d){return {calories:Number(d.kcal)||0,protein:Number(d.protein)||0,carbs:Number(d.carbs)||0,fat:Number(d.fat)||0}}
async function dishToDay(d){const cat=(typeof defaultMealSection==='function'&&defaultMealSection())||'צהריים',m=dishMacros(d);
  const day=await call('saveFood',{name:d.name,date:today(),amount:1,unit:'מנה',baseQty:1,calories:m.calories,protein:m.protein,carbs:m.carbs,fat:m.fat,category:cat,source:'הערכה מהצ׳אט',noCache:true});
  try{if(state.date===today()&&day){applyDay(day);renderDay()}}catch(_){}}
function dishToMine(d){const m=dishMacros(d),g=Number(d.grams)||0;
  const it=g>=20?{name:d.name,amount:100,unit:'גרם',calories:n1c(m.calories*100/g),protein:n1c(m.protein*100/g),carbs:n1c(m.carbs*100/g),fat:n1c(m.fat*100/g),units:[['מנה',Math.round(g)]]}
    :{name:d.name,amount:1,unit:'מנה',calories:n1c(m.calories),protein:n1c(m.protein),carbs:n1c(m.carbs),fat:n1c(m.fat),units:[]};
  if(typeof queueSaveMine==='function'){if(!queueSaveMine([it],null))throw new Error('אין ערכים לשמור');return}
  return call('saveMyFoods',[it]).then(r=>{if(Array.isArray(r)&&state.data)state.data.myFoods=r})}
fpChat.act=async(i,j,how)=>{const m=C&&C.msgs[i],d=m&&m.dishes&&m.dishes[j];if(!d||d.busy)return;
  const day=(how==='day'||how==='both')&&!d.added,mine=(how==='mine'||how==='both')&&!d.saved;if(!day&&!mine)return;
  d.busy=true;draw();
  try{if(mine){await dishToMine(d);d.saved=true}if(day){await dishToDay(d);d.added=true}
    toast(d.added&&d.saved&&day&&mine?'נשמר במזונות שלך ונוסף להיום ✓':day?'נוסף להיום ✓':'נשמר במזונות שלך ✓')}
  catch(e){toast(e.message,true)}
  finally{d.busy=false;save();draw()}};
fpChat.add=(i,j)=>fpChat.act(i,j,'day');

/* ---------- drawing ---------- */
const RANK=['מקום ראשון','מקום שני','מקום שלישי'];
function dishBtns(i,d,j){if(d.busy)return '<div class="fcA"><span class="fcOk" style="color:#A3ADB8;border-color:#2C3640">שומר…</span></div>';
  const at=`fpChat.act(${i},${j},`;
  if(!d.added&&!d.saved)return `<div class="fcA"><button type="button" class="fcBig" onclick="${at}'both')">שמור והוסף ליום</button><div class="fcSm"><button type="button" onclick="${at}'day')">רק ליום</button><button type="button" onclick="${at}'mine')">רק לשמור</button></div></div>`;
  const t=d.added&&d.saved?'נשמר ונוסף להיום ✓':d.added?'נוסף להיום ✓':'נשמר במזונות שלך ✓';
  return `<div class="fcA"><div class="fcOk">${t}</div>${d.added&&d.saved?'':`<div class="fcSm">${d.added?`<button type="button" onclick="${at}'mine')">גם לשמור במזונות שלי</button>`:`<button type="button" onclick="${at}'day')">גם להוסיף ליום</button>`}</div>`}</div>`}
function dishHtml(i,d,j){const macro=(Number(d.carbs)||Number(d.fat))?` · ${kc(d.carbs)} פחמ׳ · ${kc(d.fat)} שומן`:'';
  const meta=`${kc(d.kcal)} קל׳ · ${kc(d.protein)} ג׳ חלבון${macro}${d.price?' · '+esc(d.price):''}`,btn=dishBtns(i,d,j);
  if(j<3)return `<div class="fcD"><div class="rk">${C.msgs[i].dishes.length===1?'המנה':RANK[j]}</div><b>${esc(d.name)}</b><div class="m">${meta}</div>${d.why?`<p class="w">${esc(d.why)}</p>`:''}${btn}</div>`;
  return `<div class="fcD"><b style="font-size:14px">${j+1}. ${esc(d.name)}</b><div class="m">${meta}</div>${btn}</div>`}
function draw(){const b=$('fpChatBody');if(!b||!C)return;let h='';
  C.msgs.forEach((m,i)=>{
    if(m.role==='user'){h+=`<div class="fcB u">${m.thumb?`<img src="${m.thumb}" alt="תמונה ששלחת">`:m.image?'<small>[תמונה]</small><br>':''}${esc(m.text||'')}</div>`;return}
    if(m.err){h+=`<div class="fcB e">${esc(m.text)}</div>`;return}
    if(m.text)h+=`<div class="fcB a">${esc(m.text)}</div>`;
    if(m.dishes&&m.dishes.length){h+=m.dishes.map((d,j)=>dishHtml(i,d,j)).join('');if(m.dishes.length>3)h+=''}
    if(m.learned&&m.learned.length)h+=`<div class="fcL">למדתי עליך: ${m.learned.map(esc).join(' · ')}</div>`;
    const last=i===C.msgs.length-1;
    if(m.noAsk&&!m.used)h+=`<div class="fcN"><input id="fpChatNo${i}" type="text" maxlength="160" placeholder="למשל: כשר, בלי טונה, לא חריף" onkeydown="if(event.key==='Enter')fpChat.noSave(${i})"><div class="r"><button type="button" class="sv" onclick="fpChat.noSave(${i})">שמור</button><button type="button" class="al" onclick="fpChat.noAll(${i})">אוכל הכל</button></div></div>`;
    if(m.options&&m.options.length&&(last||m.local)&&!m.used&&!BUSY)h+=`<div class="fcQ">${m.options.map((o,j)=>`<button type="button" onclick="fpChat.pick(${i},${j})">${esc(o)}</button>`).join('')}</div>`;
    if(i===0&&!m.noAsk&&!C.addDone&&known().length&&C.msgs.length<=2&&!BUSY)h+=`<div id="fpChatAddW"><button type="button" class="fcAdd" onclick="fpChat.addOpen()">＋ משהו שאתה לא אוכל</button></div>`;});
  if(BUSY)h+='<div class="fcTy">חושב…</div>';
  if(C.limit&&C.used)h+=`<div class="fcMore">${C.used} מתוך ${C.limit} שאלות היום</div>`;
  b.innerHTML=h;b.scrollTop=b.scrollHeight;const s=$('fpChatSend');if(s)s.disabled=BUSY;
  const x=dayCtx(),l=$('fpChatLeft');if(l)l.innerHTML=`<div><small>נשארו היום</small><b>${kc(Math.max(0,x.caloriesLeftToday))} קל׳</b></div><div><small>חלבון חסר</small><b>${kc(x.proteinLeft)} ג׳</b></div>`}
let PEND=null;
fpChat.photo=async f=>{if(!f)return;try{const data=await shrinkImage(f,1024,0.72);PEND={data,thumb:data};const pv=$('fpChatPv');if(pv)pv.innerHTML=`<img src="${data}" alt="התמונה שנבחרה"><button type="button" onclick="fpChat.noPhoto()">הסר</button>`}catch(e){toast('התמונה לא נפתחה',true)}finally{const i=$('fpChatFile');if(i)i.value=''}};
fpChat.noPhoto=()=>{PEND=null;const pv=$('fpChatPv');if(pv)pv.innerHTML=''};
fpChat.go=()=>{const i=$('fpChatIn');const t=i?i.value:'';if(!t.trim()&&!PEND)return;const p=PEND;PEND=null;if(i){i.value='';i.inputMode='text'}const pv=$('fpChatPv');if(pv)pv.innerHTML='';
  send(t||(p?(C.ch.place==='במסעדה'?'זה התפריט. מה הכי טוב לי?':'זה מה שיש לי. מה להכין?'):''),p&&p.data,p&&p.thumb)};
fpChat.reset=()=>{if(BUSY)return;fresh()};
fpChat.open=()=>{try{closePlusMenu()}catch(_){}const o=$('fpChat');if(o)o.remove();
  document.body.insertAdjacentHTML('beforeend',`<div id="fpChat" role="dialog" aria-modal="true" aria-labelledby="fpChatT">
    <div class="hd"><b id="fpChatT">לשאול מה לאכול</b><span class="r"><button type="button" aria-label="מה הצ׳אט יודע עליי" title="מה הצ׳אט יודע עליי" onclick="fpChat.mem()">${ic(IC.brain,20)}</button><button type="button" aria-label="שיחה חדשה" title="שיחה חדשה" onclick="fpChat.reset()">${ic(IC.new,20)}</button><button type="button" aria-label="סגור" onclick="fpChat.close()">${ic(IC.x,22)}</button></span></div>
    <div class="left" id="fpChatLeft"></div>
    <div id="fpChatBody" aria-live="polite"></div>
    <div class="pv" id="fpChatPv"></div>
    <form class="in" onsubmit="event.preventDefault();fpChat.go()"><label class="c" aria-label="צלם או בחר תמונה">${ic(IC.cam,20)}<input id="fpChatFile" type="file" accept="image/*" style="display:none" onchange="fpChat.photo(this.files&&this.files[0])"></label>
      <input id="fpChatIn" type="text" autocomplete="off" enterkeyhint="send" placeholder="כתוב שאלה או צלם תפריט…" aria-label="ההודעה שלך"><button type="submit" class="s" id="fpChatSend" aria-label="שלח">${ic(IC.send,20)}</button></form></div>`);
  C=load();if(!C)fresh();else draw()};
fpChat.close=()=>{const o=$('fpChat');if(o)o.remove()};

/* ---------- in the small ＋ ---------- */
if(typeof PLUS_ACTIONS!=='undefined'&&!PLUS_ACTIONS.some(a=>a.id==='chat'))PLUS_ACTIONS.unshift({id:'chat',icon:'',label:'לשאול מה לאכול',run:()=>fpChat.open()});
/* first in the menu, also for those who already arranged it */
if(typeof plusMenuList==='function'){const oL=plusMenuList;plusMenuList=function(){const l=oL.apply(this,arguments);let saved=[];try{saved=JSON.parse((state.data&&state.data.settings&&state.data.settings.plus_menu)||'[]')}catch(_){}
  if(!(Array.isArray(saved)&&saved.some(x=>x&&x.id==='chat'))){const i=l.findIndex(x=>x.id==='chat');if(i>0)l.unshift(l.splice(i,1)[0])}return l}}
const oIc=window.fpPlusIc;window.fpPlusIc=id=>id==='chat'?`<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${IC.chat}</svg>`:(oIc?oIc(id):'');
})();
