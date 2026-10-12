/* FitPro 2.12.0 — the gym:
   - end of rest: louder sounds, a voice ("סט חדש!"), your own recording, or quiet. Chosen in Settings.
   - the music only gets quieter for a moment (iPhone "transient" audio session, where supported).
   - the screen stays on during a workout, so the timer keeps running and the sound is heard.
   - a new personal record: confetti. */
(function(){
'use strict';
const LS={get(k){try{return localStorage.getItem(k)}catch(_){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(_){}},del(k){try{localStorage.removeItem(k)}catch(_){}}};
const SOUNDS=[['chime','פעמונים רכים'],['marimba','מרימבה'],['softbell','צלצול עדין'],['beeps','3 צפצופים חזקים'],['whistle','שריקה'],['bell','פעמון'],['voice','קול'],['mine','ההקלטה שלי'],['none','שקט']];
const PHRASES=['סט חדש!','יאללה, סט הבא!','המנוחה נגמרה, לעבודה!','קדימה, עוד סט!'];
const STYLES=[['normal','רגיל',1,1],['radio','רדיו',0.92,0.75],['fast','אנרגטי',1.2,1.15]];
const cfg=()=>{let c={};try{c=JSON.parse(LS.get('fp2.restSound')||'{}')||{}}catch(_){}c=Object.assign({kind:'chime',phrase:0,style:'normal',voice:'',vol:1},c);if(c.kind==='beepvoice')c.kind='voice';if(c.kind==='horn')c.kind='chime';return c};
const setCfg=c=>LS.set('fp2.restSound',JSON.stringify(c));

function ctx(){try{if(!state.audioCtx){const AC=window.AudioContext||window.webkitAudioContext;if(AC)state.audioCtx=new AC()}const c=state.audioCtx;if(c&&c.state==='suspended'&&c.resume)c.resume();return c}catch(_){return null}}
/* 2.23: the audio session.
   "auto" + an <audio> element = "playback", and iPhone then PAUSES Spotify. So the app is "ambient" (mixes with your music) all the time,
   "transient" only for the moment of the end-of-rest sound (the music goes down a little and comes back),
   and "play-and-record" only while the microphone records. */
let recording=0;
const AS=t=>{try{if(navigator.audioSession&&navigator.audioSession.type!==t)navigator.audioSession.type=t}catch(_){}};
function duck(on){if(!recording)AS(on?'transient':'ambient')}
function idle(){if(!recording)AS('ambient')}
idle();
if(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia&&!navigator.mediaDevices.__fp){
  const gum=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  navigator.mediaDevices.getUserMedia=async function(c){
    const audio=!!(c&&c.audio);if(!audio)return gum(c);
    AS('play-and-record');
    recording++;
    try{const st=await gum(c);st.getTracks().forEach(t=>{const o=t.stop.bind(t);t.stop=function(){o();recording=Math.max(0,recording-1);if(!recording)setTimeout(idle,300)}});return st}
    catch(e){recording=Math.max(0,recording-1);if(!recording)idle();
      const m=e&&e.name==='NotAllowedError'?'אין הרשאה למיקרופון. באייפון: הגדרות ← Safari ← מיקרופון ← לאפשר, ואז לסגור ולפתוח את האפליקציה.':e&&e.name==='NotFoundError'?'לא נמצא מיקרופון':'המיקרופון לא נפתח: '+((e&&e.message)||'');
      const err=new Error(m);err.name=e&&e.name;err.fpMsg=m;throw err}
  };
  navigator.mediaDevices.__fp=true;
}
window.fpMicMsg=e=>(e&&e.fpMsg)||'אין גישה למיקרופון';
function out(c){const comp=c.createDynamicsCompressor();comp.threshold.value=-10;comp.ratio.value=4;comp.connect(c.destination);return comp}
function tone(c,dst,t,f,len,type,vol,f2){const o=c.createOscillator(),g=c.createGain();o.type=type||'square';o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+len);
  g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+0.02);g.gain.setValueAtTime(vol,t+len*0.7);g.gain.exponentialRampToValueAtTime(0.0001,t+len);o.connect(g);g.connect(dst);o.start(t);o.stop(t+len+0.02)}
function playTones(kind,oc){
  const c=oc||ctx();if(!c)return 0;const d=out(c),t=c.currentTime+0.03,v=Math.max(0.1,Math.min(1,cfg().vol))*0.9;
  if(kind==='beeps'){for(let i=0;i<3;i++)tone(c,d,t+i*0.32,1250,0.2,'square',v);return 1.1}
  if(kind==='whistle'){tone(c,d,t,900,0.28,'sine',v,1900);tone(c,d,t+0.38,900,0.42,'sine',v,2200);return 0.9}
  if(kind==='bell'){[0,0.5].forEach(o=>{tone(c,d,t+o,880,0.9,'sine',v);tone(c,d,t+o,1760,0.6,'sine',v*0.5);tone(c,d,t+o,2640,0.4,'sine',v*0.25)});return 1.5}
  if(kind==='horn'){tone(c,d,t,220,0.35,'sawtooth',v);tone(c,d,t+0.42,220,0.6,'sawtooth',v);return 1.1}
  /* 2.18: softer sounds */
  if(kind==='chime'){[[784,0],[988,0.16],[1175,0.32],[1568,0.5]].forEach(([f,o])=>{tone(c,d,t+o,f,1.1,'sine',v*0.8);tone(c,d,t+o,f*2,0.6,'sine',v*0.18)});return 1.7}
  if(kind==='marimba'){[[523,0],[659,0.14],[784,0.28],[1047,0.46]].forEach(([f,o])=>{tone(c,d,t+o,f,0.35,'triangle',v);tone(c,d,t+o,f*4,0.08,'sine',v*0.25)});return 0.9}
  if(kind==='softbell'){[0,0.7].forEach(o=>{tone(c,d,t+o,1046,1.2,'sine',v*0.7);tone(c,d,t+o,1568,0.8,'sine',v*0.22);tone(c,d,t+o,2093,0.5,'sine',v*0.1)});return 1.9}
  return 0;
}

/* 2.22: one <audio> element for every end-of-rest sound (tones rendered to WAV, and your own recording).
   iPhone lets a page start sound later only on an element that once played from a tap, and plays one element at a time,
   so the same element is unlocked on every tap (with a silent clip, not muted) and used for everything.
   After it starts we check that it really plays; if not, the web sound plays instead. */
const IPAD=/iPad/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
function useEl(){return true}
let sndEl=null,elReady=false;const wavs={};
const SILENT='data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=';
function el(){if(!sndEl){sndEl=new Audio();sndEl.preload='auto';try{sndEl.setAttribute('playsinline','')}catch(_){}}return sndEl}
function wavOf(buf){const d=buf.getChannelData(0),n=d.length,b=new ArrayBuffer(44+n*2),v=new DataView(b),w=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i))};
  w(0,'RIFF');v.setUint32(4,36+n*2,true);w(8,'WAVE');w(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,buf.sampleRate,true);v.setUint32(28,buf.sampleRate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,n*2,true);
  for(let i=0;i<n;i++){const x=Math.max(-1,Math.min(1,d[i]));v.setInt16(44+i*2,x<0?x*0x8000:x*0x7FFF,true)}return URL.createObjectURL(new Blob([b],{type:'audio/wav'}))}
async function wavFor(kind){const key=kind+'|'+cfg().vol;if(wavs[key])return wavs[key];const OAC=window.OfflineAudioContext||window.webkitOfflineAudioContext;if(!OAC)return null;
  const sr=44100,oc=new OAC(1,Math.round(sr*2.2),sr);playTones(kind,oc);const buf=await new Promise((ok,no)=>{const r=oc.startRendering();if(r&&r.then)r.then(ok,no);else oc.oncomplete=e=>ok(e.renderedBuffer)});return (wavs[key]=wavOf(buf))}
let busyUntil=0;
/* 2.23: only during a workout (or a running timer). Outside a workout a tap never plays anything, so it never touches your music. */
const inWorkout=()=>{try{return !!((document.getElementById('workouts')||{}).classList&&document.getElementById('workouts').classList.contains('active'))||!!(state.restEnd&&state.restEnd>Date.now())||!!document.getElementById('fpCarFloat')||!!document.querySelector('#fpTSheet .fpT-timer')||!!document.getElementById('fpRestSet')&&document.getElementById('fpRestSet').open}catch(_){return false}};
function unlockEl(){
  if(!inWorkout())return;idle();
  try{const a=el();if(Date.now()>busyUntil&&(a.paused||a.ended)){a.muted=false;a.src=SILENT;const p=a.play();if(p&&p.then)p.then(()=>{elReady=true}).catch(()=>{});else elReady=true}}catch(_){}
  try{const c=ctx();if(c&&!c.__fpUnlock){c.__fpUnlock=1;const b=c.createBuffer(1,1,22050),s=c.createBufferSource();s.buffer=b;s.connect(c.destination);s.start(0)}}catch(_){}
  const k=cfg().kind;if(k!=='voice'&&k!=='mine'&&k!=='none')wavFor(k).catch(()=>{})}
document.addEventListener('touchend',unlockEl,{passive:true});document.addEventListener('click',unlockEl,true);document.addEventListener('keydown',unlockEl,true);
document.addEventListener('visibilitychange',()=>{try{if(document.visibilityState==='visible'&&state.audioCtx&&state.audioCtx.state!=='running')state.audioCtx.resume()}catch(_){}});
/* play a source on the element; if it did not really start within a moment, run the fallback */
function playSrc(src,len,fallback){const a=el();let fell=false;const fb=()=>{if(fell)return;fell=true;busyUntil=0;try{fallback&&fallback()}catch(_){}};
  try{busyUntil=Date.now()+Math.max(1500,(len||2)*1000+800);a.muted=false;a.volume=1;a.src=src;try{a.currentTime=0}catch(_){}const p=a.play();if(p&&p.catch)p.catch(fb);
    setTimeout(()=>{if(!fell&&(a.paused&&!a.ended||a.currentTime===0&&!a.ended))fb()},900)}catch(_){fb()}}
function webTones(kind){try{const c=ctx();if(!c)return;const go=()=>playTones(kind,c);if(c.state==='running')go();else if(c.resume)c.resume().then(go).catch(()=>{})}catch(_){}}
function playEl(kind){const len={beeps:1.1,whistle:.9,bell:1.5,chime:1.7,marimba:.9,softbell:1.9}[kind]||1;
  wavFor(kind).then(u=>{if(!u)return webTones(kind);playSrc(u,len,()=>webTones(kind))}).catch(()=>webTones(kind));return len}
window.fp2SoundInfo=()=>({ipad:IPAD,ctx:state.audioCtx&&state.audioCtx.state,el:elReady});
function heVoices(){try{return speechSynthesis.getVoices().filter(v=>/^he|^iw/i.test(v.lang))}catch(_){return []}}
function speak(text,quiet){try{if(!('speechSynthesis' in window))return false;const c=cfg(),u=new SpeechSynthesisUtterance(text);u.lang='he-IL';const vs=heVoices(),pick=vs.find(v=>v.name===c.voice)||vs[0];if(pick)u.voice=pick;
  const st=STYLES.find(s=>s[0]===c.style)||STYLES[0];u.rate=st[2];u.pitch=st[3];u.volume=quiet?0:Math.max(0.1,Math.min(1,c.vol));speechSynthesis.cancel();speechSynthesis.speak(u);return true}catch(_){return false}}
/* your own recording. 2.23: it is kept as a clean WAV (trimmed silence, even loudness), which every iPhone plays,
   and played from a blob link on the same element as the other sounds. */
let mineUrl='',mineSrc='';
function mineBlob(){const data=LS.get('fp2.restRec');if(!data)return '';if(mineSrc===data&&mineUrl)return mineUrl;
  try{const [h,b64]=data.split(','),type=(h.match(/data:([^;]+)/)||[])[1]||'audio/wav',bin=atob(b64),u8=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);
    if(mineUrl)URL.revokeObjectURL(mineUrl);mineUrl=URL.createObjectURL(new Blob([u8],{type}));mineSrc=data;return mineUrl}catch(_){return data}}
function playMine(){const data=LS.get('fp2.restRec');if(!data)return playEl('beeps');playSrc(mineBlob(),4,playMineWA)}
async function playMineWA(){const data=LS.get('fp2.restRec');if(!data)return webTones('beeps');const c=ctx();if(!c)return;
  try{if(c.state!=='running'&&c.resume)await c.resume()}catch(_){}
  try{const b=await fetch(mineBlob()||data).then(r=>r.arrayBuffer());const buf=await new Promise((ok,no)=>c.decodeAudioData(b,ok,no));const s=c.createBufferSource(),g=c.createGain();g.gain.value=Math.max(0.1,Math.min(1,cfg().vol));s.buffer=buf;s.connect(g);g.connect(out(c));s.start()}catch(e){webTones('beeps')}}
/* clean a recording: decode → mono → cut the silence at the start and the end → low cut (rumble) → even loudness → 22 kHz WAV */
async function cleanRec(arrayBuffer){const AC=window.AudioContext||window.webkitAudioContext,OAC=window.OfflineAudioContext||window.webkitOfflineAudioContext;if(!AC||!OAC)throw new Error('no audio');
  const dc=state.audioCtx||new AC();const src=await new Promise((ok,no)=>{const r=dc.decodeAudioData(arrayBuffer.slice(0),ok,no);if(r&&r.then)r.then(ok,no)});
  const n=src.length,ch=src.numberOfChannels,mono=new Float32Array(n);for(let c=0;c<ch;c++){const d=src.getChannelData(c);for(let i=0;i<n;i++)mono[i]+=d[i]/ch}
  let peak=0;for(let i=0;i<n;i++)peak=Math.max(peak,Math.abs(mono[i]));if(peak<0.003)throw Object.assign(new Error('silent'),{fpMsg:'לא נשמע כלום בהקלטה. נסה שוב, קרוב יותר לטלפון.'});
  const win=Math.round(src.sampleRate*0.01),thr=Math.max(0.015,peak*0.08);let a=0,b=n;
  for(let i=0;i+win<n;i+=win){let m=0;for(let j=i;j<i+win;j++)m=Math.max(m,Math.abs(mono[j]));if(m>=thr){a=i;break}}
  for(let i=n-win;i>0;i-=win){let m=0;for(let j=i;j<i+win;j++)m=Math.max(m,Math.abs(mono[j]));if(m>=thr){b=i+win;break}}
  a=Math.max(0,a-Math.round(src.sampleRate*0.06));b=Math.min(n,b+Math.round(src.sampleRate*0.15));
  const cut=dc.createBuffer(1,Math.max(1,b-a),src.sampleRate);cut.getChannelData(0).set(mono.subarray(a,b));
  const sr=22050,oc=new OAC(1,Math.max(1,Math.ceil(cut.duration*sr)),sr),s=oc.createBufferSource(),hp=oc.createBiquadFilter();hp.type='highpass';hp.frequency.value=90;s.buffer=cut;s.connect(hp);hp.connect(oc.destination);s.start();
  const r=await new Promise((ok,no)=>{const p=oc.startRendering();if(p&&p.then)p.then(ok,no);else oc.oncomplete=e=>ok(e.renderedBuffer)});
  const d=r.getChannelData(0);let pk=0;for(let i=0;i<d.length;i++)pk=Math.max(pk,Math.abs(d[i]));const k=pk?0.9/pk:1;for(let i=0;i<d.length;i++)d[i]*=k;
  const fade=Math.min(d.length,Math.round(sr*0.01));for(let i=0;i<fade;i++){d[i]*=i/fade;d[d.length-1-i]*=i/fade}
  const url=wavOf(r),blob=await fetch(url).then(x=>x.blob());URL.revokeObjectURL(url);
  return {data:await new Promise(ok=>{const fr=new FileReader();fr.onload=()=>ok(fr.result);fr.readAsDataURL(blob)}),sec:r.duration}}
/* an older recording (mp4/webm) is cleaned once, in the background */
setTimeout(async()=>{try{const data=LS.get('fp2.restRec');if(!data||/^data:audio\/(wav|x-wav)/.test(data))return;const ab=await fetch(data).then(r=>r.arrayBuffer());const c=await cleanRec(ab);LS.set('fp2.restRec',c.data);mineUrl='';mineSrc=''}catch(_){}},4000);
function restSound(kindOverride){
  const c=cfg(),kind=kindOverride||c.kind;if(kind==='none')return;
  duck(true);setTimeout(()=>{if(($('workouts')||{}).classList&&$('workouts').classList.contains('active'))duck(false);else idle()},kind==='mine'?6000:3500);
  const phrase=c.phrase==='custom'&&String(c.custom||'').trim()?String(c.custom).trim():(PHRASES[c.phrase]||PHRASES[0]);
  if(kind==='voice'){if(!speak(phrase))playEl('beeps');return}
  if(kind==='beepvoice'){const len=playEl('beeps');setTimeout(()=>{if(!speak(phrase))playEl('beeps')},len*1000);return}
  if(kind==='mine'){playMine();return}
  /* the web sound when it runs (it mixes best with music); otherwise the element */
  const ac=state.audioCtx;if(ac&&ac.state==='running'&&!IPAD)playTones(kind,ac);else playEl(kind);
}
window.fpRestSound=restSound;
/* the end of rest calls beep(): play the chosen sound instead */
if(typeof beep==='function'){beep=function(){restSound()}}
/* iPhone allows sound and speech later only if they were started once from a tap: do it silently when the rest starts */
let primed=false;
if(typeof startRestTimer==='function'){const o=startRestTimer;startRestTimer=function(){duck(false);const r=o.apply(this,arguments);try{ctx();const k=cfg().kind;if(!primed&&(k==='voice'||k==='beepvoice')){primed=true;speak(' ',true)}}catch(_){}wake(true);return r}}

/* ---------- keep the screen on during a workout ---------- */
let lock=null,wantLock=false;
async function wake(on){wantLock=!!on;try{if(on&&!lock&&navigator.wakeLock){lock=await navigator.wakeLock.request('screen');lock.addEventListener('release',()=>{lock=null})}else if(!on&&lock){await lock.release();lock=null}}catch(_){lock=null}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&wantLock)wake(true)});
if(typeof showView==='function'){const o=showView;showView=function(id){const r=o.apply(this,arguments);try{wake(id==='workouts');if(id!=='workouts'&&!state.restEnd)idle()}catch(_){}return r}}

/* ---------- new record: confetti ---------- */
function confetti(text){
  const old=$('fpPR');if(old)old.remove();
  const reduce=matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  const w=document.createElement('div');w.id='fpPR';w.style.cssText='position:fixed;inset:0;z-index:2147483000;pointer-events:none';
  w.innerHTML=`<canvas style="position:absolute;inset:0;width:100%;height:100%"></canvas><div style="position:absolute;left:16px;right:16px;top:32%;text-align:center;pointer-events:auto" onclick="this.parentNode.remove()"><div style="display:inline-block;background:var(--card,#171C22);border:2px solid var(--brand,#D7F36B);border-radius:20px;padding:16px 22px;box-shadow:0 18px 50px rgba(0,0,0,.55);animation:fpPRpop .45s cubic-bezier(.2,1.6,.4,1)"><div style="font-size:30px;font-weight:800">שיא חדש!</div><div style="font-size:16px;margin-top:6px">${esc(text)}</div></div></div><style>@keyframes fpPRpop{from{transform:scale(.6);opacity:0}to{transform:none;opacity:1}}</style>`;
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
if(typeof toast==='function'){const o=toast;toast=function(msg){try{const m=String(msg||'').match(/^[^א-ת]*שיא חדש ב(.+)$/);if(m){confetti(m[1]);return}}catch(_){}return o.apply(this,arguments)}}

/* ---------- settings: 2.23 — a board of sounds (each with its shape), personal sounds apart, volume, and quiet ---------- */
let rec=null,recT0=0,recInt=0;const REC_MAX=4;
const WAVE={chime:[6,14,20,12,18,8,4],marimba:[16,8,16,8,16,4],softbell:[10,12,10,6,4],beeps:[20,3,20,3,20],whistle:[4,9,15,20,14,5],bell:[18,14,10,6,4]};
const waveHtml=k=>`<span class="w" aria-hidden="true">${(WAVE[k]||[]).map(h=>`<i style="height:${h}px"></i>`).join('')}</span>`;
const IC={voice:'<path d="M4 5h16v11H9l-5 4z"/>',mine:'<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0014 0M12 18v3"/>',none:'<path d="M5 9v6h4l5 4V5L9 9z"/><path d="M17 9l4 6M21 9l-4 6"/>'};
const svgI=k=>`<svg viewBox="0 0 24 24" aria-hidden="true">${IC[k]}</svg>`;
document.head.insertAdjacentHTML('beforeend',`<style id="fp223snd">
#fpRestSet .lbl{font-size:11.5px;color:#6B7682;margin:12px 2px 6px;letter-spacing:.02em}
#fpRestSet .snd{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
#fpRestSet .snd button{font:inherit;text-align:right;background:#1F262E;border:1px solid var(--line,#2C3640);border-radius:14px;padding:10px;color:var(--muted,#A3ADB8);cursor:pointer;display:flex;flex-direction:column;gap:6px;min-height:64px}
#fpRestSet .snd button b{color:var(--ink,#F2F5F7);font-size:13.5px;font-weight:700}
#fpRestSet .snd button.on{border-color:var(--brand,#D7F36B);background:#1C2414;color:var(--brand,#D7F36B)}
#fpRestSet .snd button.on b{color:var(--brand,#D7F36B)}
#fpRestSet .snd svg{width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
#fpRestSet .w{display:flex;gap:2px;align-items:center;height:22px}#fpRestSet .w i{display:block;width:3px;border-radius:2px;background:currentColor}
#fpRestSet .panel{background:#171C22;border:1px solid var(--line,#2C3640);border-radius:14px;padding:10px 12px;margin-top:8px}
#fpRestSet .quiet{font:inherit;font-size:13px;border:1px solid var(--line,#2C3640);background:#1F262E;color:var(--muted,#A3ADB8);border-radius:99px;padding:6px 12px;margin-top:10px;cursor:pointer;display:inline-flex;gap:6px;align-items:center}
#fpRestSet .quiet.on{background:#26301A;color:var(--ink,#F2F5F7);border-color:#4B5A2A}#fpRestSet .quiet svg{width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:1.8}
#fpRestSet .recb{display:grid;place-items:center;width:72px;height:72px;border-radius:50%;margin:6px auto;border:3px solid #E5484D;background:none;cursor:pointer}
#fpRestSet .recb i{display:block;width:26px;height:26px;border-radius:50%;background:#E5484D;transition:border-radius .2s}
#fpRestSet .recb.on i{border-radius:6px}
#fpRestSet .rlive{text-align:center;font-variant-numeric:tabular-nums}#fpRestSet .rlive b{font-size:22px}
#fpRestSet .rbar{height:8px;background:#2C3640;border-radius:6px;overflow:hidden;margin:8px 0 4px}#fpRestSet .rbar i{display:block;height:100%;width:0;background:#E5484D;transition:width .2s linear}
</style>`);
function recLive(){const e=Math.min(REC_MAX,(Date.now()-recT0)/1000),t=$('fpRecLiveT'),f=$('fpRecLiveF'),l=$('fpRecLiveL');if(t)t.textContent='0:0'+Math.floor(e);if(f)f.style.width=(e/REC_MAX*100)+'%';if(l)l.textContent='נשארו '+Math.max(0,Math.ceil(REC_MAX-e))+' שנ׳'}
function renderSet(){
  const sec=$('settings');if(!sec||!state.data)return;let box=$('fpRestSet');
  if(!box){box=document.createElement('details');box.className='settings-section';box.id='fpRestSet';const a=$('fpWeekSet')||$('calendarSettings')||$('notificationSettings');if(a)a.insertAdjacentElement('afterend',box);else{const h=sec.querySelector('h2');if(!h)return;h.insertAdjacentElement('afterend',box)}}
  const open=box.open,c=cfg(),vs=heVoices(),hasRec=!!LS.get('fp2.restRec'),tones=SOUNDS.filter(s=>WAVE[s[0]]);
  let h=`<summary>צליל סוף מנוחה</summary><div class="settings-body">
    <div class="lbl">צלילים · לחיצה משמיעה ובוחרת</div>
    <div class="snd">${tones.map(([k,l])=>`<button type="button" class="${c.kind===k?'on':''}" aria-pressed="${c.kind===k}" onclick="fpRestPick('${k}')">${waveHtml(k)}<b>${l}</b></button>`).join('')}</div>
    <div class="lbl">משהו אישי</div>
    <div class="snd"><button type="button" class="${c.kind==='voice'?'on':''}" aria-pressed="${c.kind==='voice'}" onclick="fpRestPick('voice')">${svgI('voice')}<b>קול אומר משפט</b></button><button type="button" class="${c.kind==='mine'?'on':''}" aria-pressed="${c.kind==='mine'}" onclick="fpRestPick('mine')">${svgI('mine')}<b>ההקלטה שלי</b></button></div>`;
  if(c.kind==='voice')h+=`<div class="panel"><div class="lbl" style="margin-top:2px">מה הקול אומר</div><div class="meal-tabs" style="flex-wrap:wrap">${PHRASES.map((p,i)=>`<button type="button" class="chip${c.phrase===i?' active':''}" onclick="fpRestSet('phrase',${i})">${p}</button>`).join('')}<button type="button" class="chip${c.phrase==='custom'?' active':''}" onclick="fpRestSet('phrase','custom')">משפט שלי</button></div>
    ${c.phrase==='custom'?`<div style="display:flex;gap:8px;margin-top:8px"><input id="fpRestCustom" maxlength="60" placeholder="למשל: יאללה, סט אחרון!" value="${esc(c.custom||'')}" style="flex:1" oninput="fpRestSet('custom',this.value,true)"><button type="button" class="btn light" onclick="fpRestTest()" aria-label="לשמוע">▶</button></div>`:''}
    <div class="lbl">סגנון</div><div class="meal-tabs" style="flex-wrap:wrap">${STYLES.map(s=>`<button type="button" class="chip${c.style===s[0]?' active':''}" onclick="fpRestSet('style','${s[0]}')">${s[1]}</button>`).join('')}</div>
    ${vs.length>1?`<div class="lbl">קול</div><div class="meal-tabs" style="flex-wrap:wrap">${vs.map(v=>`<button type="button" class="chip${(c.voice||vs[0].name)===v.name?' active':''}" onclick="fpRestSet('voice',${JSON.stringify(v.name).replace(/"/g,'&quot;')})">${esc(v.name)}</button>`).join('')}</div>`:''}</div>`;
  if(c.kind==='mine')h+=`<div class="panel">${rec?`<div class="rlive"><b id="fpRecLiveT">0:00</b> / 0:0${REC_MAX}<div class="rbar"><i id="fpRecLiveF"></i></div><span class="muted" id="fpRecLiveL">נשארו ${REC_MAX} שנ׳</span></div>`:`<p class="muted" style="margin:0;text-align:center">${hasRec?'יש הקלטה שמורה. אפשר להקליט מחדש.':'עד '+REC_MAX+' שניות. מדברים קרוב לטלפון.'}</p>`}
    <button type="button" class="recb${rec?' on':''}" id="fpRecBtn" onclick="fpRestRec()" aria-label="${rec?'לעצור':'להקליט'}"><i></i></button>
    <p class="muted" style="margin:0 0 8px;text-align:center;font-size:12.5px">${rec?'מקליט… לחיצה עוצרת':'האפליקציה חותכת שקט ומאזנת עוצמה לבד'}</p>
    ${hasRec&&!rec?'<button type="button" class="btn light full" onclick="fpRestTest()">▶ לשמוע את ההקלטה</button>':''}
    <label class="btn light full" style="margin-top:8px;display:block;text-align:center">או לבחור קובץ קול<input type="file" accept="audio/*" style="display:none" onchange="fpRestFile(this.files&&this.files[0])"></label></div>`;
  h+=`<div class="lbl">עוצמה</div><input type="range" id="fpRestVol" min="0.2" max="1" step="0.1" value="${c.vol}" oninput="fpRestSet('vol',Number(this.value),true)" onchange="fpRestTest()" style="width:100%" aria-label="עוצמה">
    <button type="button" class="quiet${c.kind==='none'?' on':''}" onclick="fpRestPick('none')">${svgI('none')}שקט, בלי צליל</button>
    <p class="muted" style="font-size:12.5px;margin:12px 0 0">במסך האימון המסך נשאר דלוק, כדי שהשעון ימשיך והצליל יישמע. מוזיקה ברקע ממשיכה: היא נחלשת לרגע בזמן הצליל וחוזרת.</p></div>`;
  box.innerHTML=h;box.open=open;if(rec)recLive();
}
window.fpRestSet=(k,v,quiet)=>{const c=cfg();c[k]=v;setCfg(c);if(!quiet)renderSet()};
window.fpRestPick=k=>{const c=cfg();c.kind=k;setCfg(c);renderSet();if(k!=='none'&&!(k==='mine'&&!LS.get('fp2.restRec'))){ctx();restSound()}};
window.fpRestTest=()=>{ctx();restSound()};
/* 2.17: every step says what failed, and a recorder is made with the first format that works */
window.fpMakeRecorder=function(st,extra){const tries=[];['audio/mp4','audio/aac','audio/webm;codecs=opus','audio/webm','audio/ogg'].forEach(t=>{try{if(window.MediaRecorder&&(!MediaRecorder.isTypeSupported||MediaRecorder.isTypeSupported(t)))tries.push(Object.assign({mimeType:t},extra||{}))}catch(_){}});tries.push(extra||undefined);tries.push(undefined);
  let last=null;for(const o of tries){try{return new MediaRecorder(st,o)}catch(e){last=e}}throw Object.assign(new Error('ההקלטה לא נתמכת בטלפון הזה ('+((last&&last.name)||'')+')'),{fpMsg:'ההקלטה לא נתמכת בטלפון הזה. אפשר לבחור קובץ קול במקום.'})};
/* 2.20: a progress bar while recording (fixed at the bottom, survives re-renders) */
window.fpRecBar={t:0,start(total){this.stop();const t0=Date.now(),mm=x=>Math.floor(x/60)+':'+String(Math.floor(x%60)).padStart(2,'0');
  document.body.insertAdjacentHTML('beforeend',`<div id="fpRecBar" role="status" style="position:fixed;left:12px;right:12px;bottom:calc(84px + env(safe-area-inset-bottom));z-index:2147482000;background:#171C22;border:1px solid #E5484D;border-radius:14px;padding:10px 12px;direction:rtl;color:#F2F5F7;font:600 14px/1.3 -apple-system,system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.45)"><div style="display:flex;justify-content:space-between;gap:8px"><span>מקליט… <span id="fpRecBarL"></span></span><span id="fpRecBarT" dir="ltr">0:00 / ${mm(total)}</span></div><div style="height:8px;background:#2C3640;border-radius:6px;overflow:hidden;margin-top:7px"><i id="fpRecBarF" style="display:block;height:100%;width:0;background:#E5484D;transition:width .2s linear"></i></div></div>`);
  this.t=setInterval(()=>{const e=(Date.now()-t0)/1000,f=$('fpRecBarF'),tx=$('fpRecBarT'),l=$('fpRecBarL');if(!f){clearInterval(this.t);return}f.style.width=Math.min(100,e/total*100)+'%';if(tx)tx.textContent=mm(Math.min(e,total))+' / '+mm(total);if(l)l.textContent='נשארו '+Math.max(0,Math.ceil(total-e))+' שנ׳'},200)},
 stop(){clearInterval(this.t);const b=$('fpRecBar');if(b)b.remove()}};
async function keepRec(blob,from){try{const c=await cleanRec(await blob.arrayBuffer());LS.set('fp2.restRec',c.data);mineUrl='';mineSrc='';toast(from==='file'?'הקול נשמר':'ההקלטה נשמרה ('+(Math.round(c.sec*10)/10)+' שנ׳)')}
  catch(e){if(e&&e.fpMsg){toast(e.fpMsg,true);return}
    /* could not clean it: keep it as it is, if it is small enough */
    if(blob.size>600000){toast(from==='file'?'הקובץ גדול מדי. קובץ של כמה שניות':'ההקלטה ארוכה מדי',true);return}
    const d=await new Promise(ok=>{const fr=new FileReader();fr.onload=()=>ok(fr.result);fr.readAsDataURL(blob)});LS.set('fp2.restRec',d);mineUrl='';mineSrc='';toast('נשמר')}
  renderSet()}
window.fpRestRec=async()=>{
  if(rec){try{rec.stop()}catch(_){}return}
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){toast('המיקרופון לא זמין כאן. אפשר לבחור קובץ קול במקום.',true);return}
  if(typeof MediaRecorder==='undefined'){toast('ההקלטה לא נתמכת בטלפון הזה. אפשר לבחור קובץ קול במקום.',true);return}
  let st=null;
  /* 2.23: without the "phone call" processing, it sounds like you and not like a phone line */
  try{st=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false,channelCount:1}})}
  catch(e){try{st=await navigator.mediaDevices.getUserMedia({audio:true})}catch(e2){rec=null;toast(fpMicMsg(e2)+(e2&&e2.name&&!e2.fpMsg?' ('+e2.name+')':''),true);renderSet();return}}
  try{const chunks=[];rec=fpMakeRecorder(st,{audioBitsPerSecond:128000});const mt=rec.mimeType||'';rec.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
    rec.onstop=()=>{clearInterval(recInt);fpRecBar.stop();st.getTracks().forEach(t=>t.stop());const blob=new Blob(chunks,{type:mt||'audio/mp4'});rec=null;
      if(!blob.size){toast('ההקלטה יצאה ריקה. נסה שוב, או בחר קובץ קול.',true);renderSet();return}
      renderSet();keepRec(blob,'rec')};
    rec.start();recT0=Date.now();renderSet();fpRecBar.start(REC_MAX);clearInterval(recInt);recInt=setInterval(recLive,200);setTimeout(()=>{if(rec)try{rec.stop()}catch(_){}},REC_MAX*1000);
  }catch(e){clearInterval(recInt);fpRecBar.stop();try{st.getTracks().forEach(t=>t.stop())}catch(_){}rec=null;toast(e.fpMsg||('ההקלטה לא התחילה: '+(e.name||'')+' '+(e.message||'')),true);renderSet()}
};
window.fpRestFile=function(f){if(!f)return;if(f.size>3000000)return toast('הקובץ גדול מדי. קובץ של כמה שניות',true);keepRec(f,'file')};

try{speechSynthesis.onvoiceschanged=()=>{if($('fpRestSet'))renderSet()}}catch(_){}
if(typeof renderSettings==='function'){const o=renderSettings;renderSettings=function(){const r=o.apply(this,arguments);try{renderSet()}catch(e){console.error(e)}return r}}
})();
