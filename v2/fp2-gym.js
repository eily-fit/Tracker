/* FitPro 2.12.0 — the gym:
   - end of rest: louder sounds, a voice ("סט חדש!"), your own recording, or quiet. Chosen in Settings.
   - the music only gets quieter for a moment (iPhone "transient" audio session, where supported).
   - the screen stays on during a workout, so the timer keeps running and the sound is heard.
   - a new personal record: confetti. */
(function(){
'use strict';
const LS={get(k){try{return localStorage.getItem(k)}catch(_){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(_){}},del(k){try{localStorage.removeItem(k)}catch(_){}}};
const SOUNDS=[['beeps','📢 3 צפצופים חזקים'],['whistle','😗 שריקה'],['bell','🔔 פעמון'],['horn','📯 צופר'],['voice','🗣 קול'],['beepvoice','📢+🗣 צפצוף וקול'],['mine','🎙 ההקלטה שלי'],['none','🔇 שקט']];
const PHRASES=['סט חדש!','יאללה, סט הבא!','המנוחה נגמרה, לעבודה!','קדימה, עוד סט!'];
const STYLES=[['normal','רגיל',1,1],['radio','רדיו',0.92,0.75],['fast','אנרגטי',1.2,1.15]];
const cfg=()=>{let c={};try{c=JSON.parse(LS.get('fp2.restSound')||'{}')||{}}catch(_){}return Object.assign({kind:'beepvoice',phrase:0,style:'normal',voice:'',vol:1},c)};
const setCfg=c=>LS.set('fp2.restSound',JSON.stringify(c));

function ctx(){try{if(!state.audioCtx){const AC=window.AudioContext||window.webkitAudioContext;if(AC)state.audioCtx=new AC()}const c=state.audioCtx;if(c&&c.state==='suspended'&&c.resume)c.resume();return c}catch(_){return null}}
function duck(on){try{if(navigator.audioSession)navigator.audioSession.type=on?'transient':'auto'}catch(_){}}
function out(c){const comp=c.createDynamicsCompressor();comp.threshold.value=-10;comp.ratio.value=4;comp.connect(c.destination);return comp}
function tone(c,dst,t,f,len,type,vol,f2){const o=c.createOscillator(),g=c.createGain();o.type=type||'square';o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+len);
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+0.02);g.gain.setValueAtTime(vol,t+len*0.7);g.gain.exponentialRampToValueAtTime(0.0001,t+len);o.connect(g);g.connect(dst);o.start(t);o.stop(t+len+0.02)}
function playTones(kind){
  const c=ctx();if(!c)return 0;const d=out(c),t=c.currentTime+0.03,v=Math.max(0.1,Math.min(1,cfg().vol))*0.9;
  if(kind==='beeps'){for(let i=0;i<3;i++)tone(c,d,t+i*0.32,1250,0.2,'square',v);return 1.1}
  if(kind==='whistle'){tone(c,d,t,900,0.28,'sine',v,1900);tone(c,d,t+0.38,900,0.42,'sine',v,2200);return 0.9}
  if(kind==='bell'){[0,0.5].forEach(o=>{tone(c,d,t+o,880,0.9,'sine',v);tone(c,d,t+o,1760,0.6,'sine',v*0.5);tone(c,d,t+o,2640,0.4,'sine',v*0.25)});return 1.5}
  if(kind==='horn'){tone(c,d,t,220,0.35,'sawtooth',v);tone(c,d,t+0.42,220,0.6,'sawtooth',v);return 1.1}
  return 0;
}
function heVoices(){try{return speechSynthesis.getVoices().filter(v=>/^he|^iw/i.test(v.lang))}catch(_){return []}}
function speak(text,quiet){try{if(!('speechSynthesis' in window))return false;const c=cfg(),u=new SpeechSynthesisUtterance(text);u.lang='he-IL';const vs=heVoices(),pick=vs.find(v=>v.name===c.voice)||vs[0];if(pick)u.voice=pick;
  const st=STYLES.find(s=>s[0]===c.style)||STYLES[0];u.rate=st[2];u.pitch=st[3];u.volume=quiet?0:Math.max(0.1,Math.min(1,c.vol));speechSynthesis.cancel();speechSynthesis.speak(u);return true}catch(_){return false}}
async function playMine(){const data=LS.get('fp2.restRec');if(!data)return playTones('beeps');const c=ctx();if(!c)return;
  try{const b=await fetch(data).then(r=>r.arrayBuffer());const buf=await new Promise((ok,no)=>c.decodeAudioData(b,ok,no));const s=c.createBufferSource(),g=c.createGain();g.gain.value=Math.max(0.1,Math.min(1,cfg().vol))*1.6;s.buffer=buf;s.connect(g);g.connect(out(c));s.start()}catch(e){try{const a=new Audio(data);a.play()}catch(_){}}}
function restSound(kindOverride){
  const c=cfg(),kind=kindOverride||c.kind;if(kind==='none')return;
  duck(true);setTimeout(()=>duck(false),3500);
  const phrase=PHRASES[c.phrase]||PHRASES[0];
  if(kind==='voice'){if(!speak(phrase))playTones('beeps');return}
  if(kind==='beepvoice'){const len=playTones('beeps');setTimeout(()=>{if(!speak(phrase))playTones('beeps')},len*1000);return}
  if(kind==='mine'){playMine();return}
  playTones(kind);
}
window.fpRestSound=restSound;
/* the end of rest calls beep(): play the chosen sound instead */
if(typeof beep==='function'){beep=function(){restSound()}}
/* iPhone allows sound and speech later only if they were started once from a tap: do it silently when the rest starts */
if(typeof startRestTimer==='function'){const o=startRestTimer;startRestTimer=function(){const r=o.apply(this,arguments);try{ctx();const k=cfg().kind;if(k==='voice'||k==='beepvoice')speak(' ',true)}catch(_){}wake(true);return r}}

/* ---------- keep the screen on during a workout ---------- */
let lock=null,wantLock=false;
async function wake(on){wantLock=!!on;try{if(on&&!lock&&navigator.wakeLock){lock=await navigator.wakeLock.request('screen');lock.addEventListener('release',()=>{lock=null})}else if(!on&&lock){await lock.release();lock=null}}catch(_){lock=null}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&wantLock)wake(true)});
if(typeof showView==='function'){const o=showView;showView=function(id){const r=o.apply(this,arguments);try{wake(id==='workouts')}catch(_){}return r}}

/* ---------- new record: confetti ---------- */
function confetti(text){
  const old=$('fpPR');if(old)old.remove();
  const reduce=matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  const w=document.createElement('div');w.id='fpPR';w.style.cssText='position:fixed;inset:0;z-index:2147483000;pointer-events:none';
  w.innerHTML=`<canvas style="position:absolute;inset:0;width:100%;height:100%"></canvas><div style="position:absolute;left:16px;right:16px;top:32%;text-align:center;pointer-events:auto" onclick="this.parentNode.remove()"><div style="display:inline-block;background:var(--card,#171C22);border:2px solid var(--brand,#D7F36B);border-radius:20px;padding:16px 22px;box-shadow:0 18px 50px rgba(0,0,0,.55);animation:fpPRpop .45s cubic-bezier(.2,1.6,.4,1)"><div style="font-size:30px;font-weight:800">🏆 שיא חדש!</div><div style="font-size:16px;margin-top:6px">${esc(text)}</div></div></div><style>@keyframes fpPRpop{from{transform:scale(.6);opacity:0}to{transform:none;opacity:1}}</style>`;
  document.body.appendChild(w);setTimeout(()=>{if(w.isConnected)w.remove()},4200);
  try{hapticTick()}catch(_){}
  if(reduce)return;
  const cv=w.querySelector('canvas'),dpr=Math.min(2,devicePixelRatio||1),W=innerWidth,H=innerHeight;cv.width=W*dpr;cv.height=H*dpr;const g=cv.getContext('2d');g.scale(dpr,dpr);
  const cols=['#D7F36B','#FFFFFF','#7FD6FF','#FF8A8A','#FFD166','#B693FF'];
  const P=Array.from({length:160},()=>({x:Math.random()*W,y:-20-Math.random()*H*0.6,vx:(Math.random()-.5)*2.2,vy:2+Math.random()*3.5,r:Math.random()*Math.PI,vr:(Math.random()-.5)*0.3,s:6+Math.random()*7,c:cols[Math.floor(Math.random()*cols.length)]}));
  const t0=performance.now();
  (function f(now){if(!w.isConnected)return;const el=now-t0;g.clearRect(0,0,W,H);g.globalAlpha=el>3000?Math.max(0,1-(el-3000)/900):1;
    P.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.04;p.r+=p.vr;g.save();g.translate(p.x,p.y);g.rotate(p.r);g.fillStyle=p.c;g.fillRect(-p.s/2,-p.s/4,p.s,p.s/2);g.restore()});
    if(el<3900)requestAnimationFrame(f)})(t0);
}
window.fpConfetti=confetti;
if(typeof toast==='function'){const o=toast;toast=function(msg){try{const m=String(msg||'').match(/^🏆 שיא חדש ב(.+)$/);if(m){confetti(m[1]);return}}catch(_){}return o.apply(this,arguments)}}

/* ---------- settings ---------- */
let rec=null;
function renderSet(){
  const sec=$('settings');if(!sec||!state.data)return;let box=$('fpRestSet');
  if(!box){box=document.createElement('details');box.className='settings-section';box.id='fpRestSet';const a=$('fpWeekSet')||$('calendarSettings')||$('notificationSettings');if(a)a.insertAdjacentElement('afterend',box);else{const h=sec.querySelector('h2');if(!h)return;h.insertAdjacentElement('afterend',box)}}
  const open=box.open,c=cfg(),vs=heVoices(),hasRec=!!LS.get('fp2.restRec'),voiceOn=c.kind==='voice'||c.kind==='beepvoice';
  box.innerHTML=`<summary>🔔 צליל סוף מנוחה</summary><div class="settings-body">
    <div class="meal-tabs" style="flex-wrap:wrap">${SOUNDS.map(([k,l])=>`<button type="button" class="chip${c.kind===k?' active':''}" onclick="fpRestSet('kind','${k}')">${l}</button>`).join('')}</div>
    ${voiceOn?`<label style="font-weight:700;display:block;margin-top:12px">מה הקול אומר?</label><div class="meal-tabs" style="flex-wrap:wrap">${PHRASES.map((p,i)=>`<button type="button" class="chip${c.phrase===i?' active':''}" onclick="fpRestSet('phrase',${i})">${p}</button>`).join('')}</div>
      <label style="font-weight:700;display:block;margin-top:12px">סגנון</label><div class="meal-tabs" style="flex-wrap:wrap">${STYLES.map(s=>`<button type="button" class="chip${c.style===s[0]?' active':''}" onclick="fpRestSet('style','${s[0]}')">${s[1]}</button>`).join('')}</div>
      ${vs.length>1?`<label style="font-weight:700;display:block;margin-top:12px">קול</label><div class="meal-tabs" style="flex-wrap:wrap">${vs.map(v=>`<button type="button" class="chip${(c.voice||vs[0].name)===v.name?' active':''}" onclick="fpRestSet('voice',${JSON.stringify(v.name).replace(/"/g,'&quot;')})">${esc(v.name)}</button>`).join('')}</div>`:''}`:''}
    ${c.kind==='mine'?`<div style="margin-top:12px">${hasRec?'<p class="muted" style="margin:0 0 6px">יש הקלטה שמורה.</p>':''}<button type="button" class="btn light full" id="fpRecBtn" onclick="fpRestRec()">${rec?'⏹ עצור':hasRec?'🎙 להקליט מחדש (עד 4 שניות)':'🎙 להקליט (עד 4 שניות)'}</button></div>`:''}
    <label style="font-weight:700;display:block;margin-top:12px">עוצמה</label><input type="range" id="fpRestVol" min="0.2" max="1" step="0.1" value="${c.vol}" oninput="fpRestSet('vol',Number(this.value),true)" style="width:100%">
    <button type="button" class="btn full" style="margin-top:12px" onclick="fpRestTest()">▶ לשמוע</button>
    <p class="muted" style="font-size:12.5px;margin:10px 0 0">במסך האימון המסך נשאר דלוק, כדי שהשעון ימשיך והצליל יישמע. מוזיקה ברקע אמורה להיות שקטה לרגע ולחזור. באייפון אין רטט מאפליקציה מסוג זה, יש רק ״טיק״ קטן.</p>
  </div>`;box.open=open;
}
window.fpRestSet=(k,v,quiet)=>{const c=cfg();c[k]=v;setCfg(c);if(!quiet)renderSet()};
window.fpRestTest=()=>{ctx();restSound()};
window.fpRestRec=async()=>{
  if(rec){try{rec.stop()}catch(_){}return}
  try{const st=await navigator.mediaDevices.getUserMedia({audio:true});const mt=['audio/mp4','audio/webm','audio/ogg'].find(t=>window.MediaRecorder&&MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(t))||'';
    const chunks=[];rec=new MediaRecorder(st,mt?{mimeType:mt}:undefined);rec.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
    rec.onstop=()=>{st.getTracks().forEach(t=>t.stop());const blob=new Blob(chunks,{type:rec.mimeType||mt||'audio/mp4'});rec=null;
      if(blob.size>400000){toast('ההקלטה ארוכה מדי',true);renderSet();return}
      const fr=new FileReader();fr.onload=()=>{LS.set('fp2.restRec',fr.result);toast('ההקלטה נשמרה');renderSet()};fr.readAsDataURL(blob)};
    rec.start();renderSet();setTimeout(()=>{if(rec)try{rec.stop()}catch(_){}},4000);
  }catch(e){rec=null;toast('אין גישה למיקרופון',true);renderSet()}
};
try{speechSynthesis.onvoiceschanged=()=>{if($('fpRestSet'))renderSet()}}catch(_){}
if(typeof renderSettings==='function'){const o=renderSettings;renderSettings=function(){const r=o.apply(this,arguments);try{renderSet()}catch(e){console.error(e)}return r}}
})();
