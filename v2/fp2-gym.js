/* FitPro 2.12.0 (sound rebuilt in 2.26, see the audio notes below) — the gym:
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
/* 2.25: a sound for each type: כוח (end of rest), ריצה (a part ends, pace change, lap), אירובי (next phase). Same settings, one per type. */
let TY='s';const SFX=()=>TY==='s'?'':'.'+TY,RK=()=>'fp2.restRec'+SFX();
const cfg=()=>{let c={};try{c=JSON.parse(LS.get('fp2.restSound'+SFX())||LS.get('fp2.restSound')||'{}')||{}}catch(_){}c=Object.assign({kind:'chime',phrase:0,style:'normal',voice:'',vol:1},c);if(c.kind==='beepvoice')c.kind='voice';if(c.kind==='horn')c.kind='chime';return c};
const setCfg=c=>LS.set('fp2.restSound'+SFX(),JSON.stringify(c));

function ctx(){try{if(!state.audioCtx){AS('ambient');const AC=window.AudioContext||window.webkitAudioContext;if(AC)state.audioCtx=new AC()}const c=state.audioCtx;if(c&&c.state!=='running'&&c.state!=='closed'&&c.resume)c.resume().catch(()=>{});return c}catch(_){return null}}
/* 2.26 — the audio, after the sound lab on the iPhone (iOS 18.7, from the home screen, Spotify playing):
   - the app is "ambient" all the time: it mixes with the music and never stops it (a tap, opening the app, moving between screens).
   - every sound is played with Web Audio (never an <audio> element: that one came late and stopped Spotify),
     as "transient": the music goes down for a moment and comes back.
   - your recording plays louder (gain + compressor), also "transient".
   - the voice comes right after a short beep (a voice alone at the end of a rest was not heard).
   - the microphone uses "play-and-record" only while it records, then back to "ambient".
   - a tap only wakes the sound silently (no sound), so the first end of rest is heard without extra taps. */
let recording=0,speaking=false;
const AS=t=>{try{if(navigator.audioSession&&navigator.audioSession.type!==t)navigator.audioSession.type=t}catch(_){}};
let backT=0;
function duck(on,ms){clearTimeout(backT);if(recording)return;if(on){AS('transient');backT=setTimeout(()=>{if(!recording&&!speaking)AS('ambient')},ms||2500)}else AS('ambient')}
function idle(){if(!recording&&!speaking)AS('ambient')}
idle();
if(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia&&!navigator.mediaDevices.__fp){
  const gum=navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  navigator.mediaDevices.getUserMedia=async function(c){
    const audio=!!(c&&c.audio);if(!audio)return gum(c);
    clearTimeout(backT);AS('play-and-record');
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

/* 2.26: a tap wakes the sound, silently (in the lab this never stopped the music) */
function wakeSound(){if(recording)return;const c=ctx();try{if(c&&!c.__fpUnlock){c.__fpUnlock=1;const bf=c.createBuffer(1,1,22050),sr=c.createBufferSource();sr.buffer=bf;sr.connect(c.destination);sr.start(0)}}catch(_){}}
document.addEventListener('touchend',wakeSound,{passive:true});document.addEventListener('click',wakeSound,true);
document.addEventListener('visibilitychange',()=>{try{if(document.visibilityState==='visible'){idle();if(state.audioCtx&&state.audioCtx.state!=='running')state.audioCtx.resume().catch(()=>{})}}catch(_){}});
/* never wait forever for the sound to wake (a resume without a tap can hang): at most 0.4 s, then play anyway */
async function live(){const c=ctx();if(!c)return null;try{if(c.state!=='running')await Promise.race([c.resume(),new Promise(r=>setTimeout(r,400))])}catch(_){}return c}
async function webTones(kind){const c=await live();if(!c)return 0;return playTones(kind,c)||0}
window.fp2SoundInfo=()=>({ctx:state.audioCtx&&state.audioCtx.state,session:navigator.audioSession&&navigator.audioSession.type});
function heVoices(){try{return speechSynthesis.getVoices().filter(v=>/^he|^iw/i.test(v.lang))}catch(_){return []}}
function speak(text){try{if(!('speechSynthesis' in window))return false;const c=cfg(),u=new SpeechSynthesisUtterance(text);u.lang='he-IL';const vs=heVoices(),pick=vs.find(v=>v.name===c.voice)||vs[0];if(pick)u.voice=pick;
  const st=STYLES.find(s=>s[0]===c.style)||STYLES[0];u.rate=st[2];u.pitch=st[3];u.volume=Math.max(0.1,Math.min(1,c.vol));
  speaking=true;const done=()=>{speaking=false;duck(true,500)};u.onend=done;u.onerror=done;setTimeout(()=>{if(speaking)done()},9000);
  speechSynthesis.cancel();speechSynthesis.speak(u);return true}catch(_){speaking=false;return false}}
/* your own recording: kept as a clean WAV (cleanRec below), decoded once and played with Web Audio, louder */
const mineBuf={src:'',buf:null};
async function mineDecoded(c){const data=LS.get(RK());if(!data)return null;if(mineBuf.src===data&&mineBuf.buf)return mineBuf.buf;
  const [h,b64]=data.split(',');const bin=atob(b64||''),u8=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);
  const buf=await new Promise((ok,no)=>{const r=c.decodeAudioData(u8.buffer,ok,no);if(r&&r.then)r.then(ok,no)});mineBuf.src=data;mineBuf.buf=buf;return buf}
async function playMine(){const c=await live();if(!c)return 0;let buf=null;try{buf=await mineDecoded(c)}catch(_){}
  if(!buf)return playTones('beeps',c);
  const s=c.createBufferSource(),g=c.createGain(),comp=c.createDynamicsCompressor();comp.threshold.value=-24;comp.knee.value=12;comp.ratio.value=6;comp.attack.value=0.003;comp.release.value=0.15;
  g.gain.value=2.2*Math.max(0.2,Math.min(1,cfg().vol));s.buffer=buf;s.connect(g);g.connect(comp);comp.connect(c.destination);s.start();return buf.duration}
/* a buffer → a WAV link (used to keep a cleaned recording) */
function wavOf(buf){const d=buf.getChannelData(0),n=d.length,b=new ArrayBuffer(44+n*2),v=new DataView(b),w=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i))};
  w(0,'RIFF');v.setUint32(4,36+n*2,true);w(8,'WAVE');w(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,buf.sampleRate,true);v.setUint32(28,buf.sampleRate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,n*2,true);
  for(let i=0;i<n;i++){const x=Math.max(-1,Math.min(1,d[i]));v.setInt16(44+i*2,x<0?x*0x8000:x*0x7FFF,true)}return URL.createObjectURL(new Blob([b],{type:'audio/wav'}))}
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
setTimeout(async()=>{try{const data=LS.get('fp2.restRec');if(!data||/^data:audio\/(wav|x-wav)/.test(data))return;const ab=await fetch(data).then(r=>r.arrayBuffer());const c=await cleanRec(ab);LS.set('fp2.restRec',c.data);mineBuf.buf=null}catch(_){}},4000);
async function restSound(kindOverride){
  const c=cfg(),kind=kindOverride||c.kind;if(kind==='none')return;
  const phrase=c.phrase==='custom'&&String(c.custom||'').trim()?String(c.custom).trim():(PHRASES[c.phrase]||PHRASES[0]);
  duck(true,6000);
  let len=0;
  if(kind==='voice'){/* a short beep, then the voice (in the lab the voice alone was not heard) */
    const cc=await live();if(cc){const d=out(cc),t=cc.currentTime+0.02,v=Math.max(0.1,Math.min(1,c.vol))*0.7;tone(cc,d,t,880,0.16,'sine',v);tone(cc,d,t+0.18,1320,0.18,'sine',v)}
    setTimeout(()=>{if(!speak(phrase))webTones('beeps')},450);return}
  if(kind==='mine')len=await playMine();else len=await webTones(kind);
  duck(true,Math.round((len||1.5)*1000)+700);
}
window.fpRestSound=(t)=>{if(typeof t!=='string')return restSound();const o=TY;TY=t;try{return restSound()}finally{TY=o}};
window.fpRestSoundFor=t=>window.fpRestSound(t||'s');
/* the end of rest calls beep(): play the chosen sound instead */
if(typeof beep==='function'){beep=function(){window.fpRestSound('s')}}
/* "שמור סט": the rest starts — wake the sound now (silently), keep the screen on */
if(typeof startRestTimer==='function'){const o=startRestTimer;startRestTimer=function(){idle();const r=o.apply(this,arguments);try{wakeSound()}catch(_){}awake();return r}}

/* ---------- keep the screen on during an active workout (rest, run, cardio) ----------
   2.26: a web app is put to sleep when the screen locks, and then no sound comes out (checked in the lab).
   So while a workout is active the screen stays on by itself; after it, the phone behaves as usual. */
let lock=null;
function activeNow(){try{if(state.restEnd&&state.restEnd>Date.now())return true;
  if(document.querySelector('#fpSR,#fpRunScr,#fpRunFloat,#fpCarFloat,#fpSRFloat,#fpTSheet .fpT-timer,#fpTSheet .fpTm'))return true;
  if(window.fpT&&fpT.gpsOn&&fpT.gpsOn())return true;
  const w=document.getElementById('workouts');return !!(w&&w.classList.contains('active')&&state.data&&state.sessionId)}catch(_){return false}}
async function wake(on){try{if(on&&!lock&&navigator.wakeLock&&document.visibilityState==='visible'){lock=await navigator.wakeLock.request('screen');lock.addEventListener('release',()=>{lock=null})}else if(!on&&lock){const l=lock;lock=null;await l.release()}}catch(_){lock=null}}
function awake(){wake(activeNow())}
setInterval(awake,3000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')awake()});
if(typeof showView==='function'){const o=showView;showView=function(id){const r=o.apply(this,arguments);try{awake()}catch(_){}return r}}

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
.fpRS .lbl{font-size:11.5px;color:#6B7682;margin:12px 2px 6px;letter-spacing:.02em}
.fpRS .snd{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.fpRS .snd button{font:inherit;text-align:right;background:#1F262E;border:1px solid var(--line,#2C3640);border-radius:14px;padding:10px;color:var(--muted,#A3ADB8);cursor:pointer;display:flex;flex-direction:column;gap:6px;min-height:64px}
.fpRS .snd button b{color:var(--ink,#F2F5F7);font-size:13.5px;font-weight:700}
.fpRS .snd button.on{border-color:var(--brand,#D7F36B);background:#1C2414;color:var(--brand,#D7F36B)}
.fpRS .snd button.on b{color:var(--brand,#D7F36B)}
.fpRS .snd svg{width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.fpRS .w{display:flex;gap:2px;align-items:center;height:22px}.fpRS .w i{display:block;width:3px;border-radius:2px;background:currentColor}
.fpRS .panel{background:#171C22;border:1px solid var(--line,#2C3640);border-radius:14px;padding:10px 12px;margin-top:8px}
.fpRS .quiet{font:inherit;font-size:13px;border:1px solid var(--line,#2C3640);background:#1F262E;color:var(--muted,#A3ADB8);border-radius:99px;padding:6px 12px;margin-top:10px;cursor:pointer;display:inline-flex;gap:6px;align-items:center}
.fpRS .quiet.on{background:#26301A;color:var(--ink,#F2F5F7);border-color:#4B5A2A}.fpRS .quiet svg{width:16px;height:16px;stroke:currentColor;fill:none;stroke-width:1.8}
.fpRS .recb{display:grid;place-items:center;width:72px;height:72px;border-radius:50%;margin:6px auto;border:3px solid #E5484D;background:none;cursor:pointer}
.fpRS .recb i{display:block;width:26px;height:26px;border-radius:50%;background:#E5484D;transition:border-radius .2s}
.fpRS .recb.on i{border-radius:6px}
.fpRS .rlive{text-align:center;font-variant-numeric:tabular-nums}.fpRS .rlive b{font-size:22px}
.fpRS .rbar{height:8px;background:#2C3640;border-radius:6px;overflow:hidden;margin:8px 0 4px}.fpRS .rbar i{display:block;height:100%;width:0;background:#E5484D;transition:width .2s linear}
</style>`);
function recLive(){const e=Math.min(REC_MAX,(Date.now()-recT0)/1000),t=$('fpRecLiveT'),f=$('fpRecLiveF'),l=$('fpRecLiveL');if(t)t.textContent='0:0'+Math.floor(e);if(f)f.style.width=(e/REC_MAX*100)+'%';if(l)l.textContent='נשארו '+Math.max(0,Math.ceil(REC_MAX-e))+' שנ׳'}
const TYN={s:'צליל סוף מנוחה',r:'צליל בריצה',c:'צליל באירובי'},TYW={s:'',r:'נשמע בסוף כל חלק, בשינוי קצב ובסיבוב.',c:'נשמע במעבר בין שלבים.'};
/* the copy inside Settings → אימונים → כוח / ריצה / אירובי: while it is open, every button works on that type */
window.fpRestOpen=t=>{TY=t||'s';renderSet()};
setInterval(()=>{if(TY!=='s'&&!$('fpRestSet_'+TY))TY='s'},700);
function renderSet(){
  /* 2.26: only inside Settings → אימונים → כוח / ריצה / אירובי (the separate section outside is gone) */
  if(!state.data)return;const box=$('fpRestSet_'+TY);if(!box)return;
  const open=box.open,c=cfg(),vs=heVoices(),hasRec=!!LS.get(RK()),tones=SOUNDS.filter(s=>WAVE[s[0]]);
  let h=`<summary>${TYN[TY]}</summary><div class="settings-body">${TYW[TY]?`<p class="muted" style="margin:0 0 6px;font-size:12.5px">${TYW[TY]}</p>`:''}
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
    <p class="muted" style="font-size:12.5px;margin:12px 0 0">בזמן מנוחה, ריצה ואירובי המסך נשאר דלוק לבד, כי כשהמסך נעול הצליל לא נשמע. מוזיקה ברקע ממשיכה: היא יורדת לרגע בזמן הצליל וחוזרת.</p></div>`;
  box.innerHTML=h;box.open=open;if(rec)recLive();
}
window.fpRestSet=(k,v,quiet)=>{const c=cfg();c[k]=v;setCfg(c);if(!quiet)renderSet()};
window.fpRestPick=k=>{const c=cfg();c.kind=k;setCfg(c);renderSet();if(k!=='none'&&!(k==='mine'&&!LS.get(RK())))restSound()};
window.fpRestTest=()=>{restSound()};
/* 2.17: every step says what failed, and a recorder is made with the first format that works */
window.fpMakeRecorder=function(st,extra){const tries=[];['audio/mp4','audio/aac','audio/webm;codecs=opus','audio/webm','audio/ogg'].forEach(t=>{try{if(window.MediaRecorder&&(!MediaRecorder.isTypeSupported||MediaRecorder.isTypeSupported(t)))tries.push(Object.assign({mimeType:t},extra||{}))}catch(_){}});tries.push(extra||undefined);tries.push(undefined);
  let last=null;for(const o of tries){try{return new MediaRecorder(st,o)}catch(e){last=e}}throw Object.assign(new Error('ההקלטה לא נתמכת בטלפון הזה ('+((last&&last.name)||'')+')'),{fpMsg:'ההקלטה לא נתמכת בטלפון הזה. אפשר לבחור קובץ קול במקום.'})};
/* 2.20: a progress bar while recording (fixed at the bottom, survives re-renders) */
window.fpRecBar={t:0,start(total){this.stop();const t0=Date.now(),mm=x=>Math.floor(x/60)+':'+String(Math.floor(x%60)).padStart(2,'0');
  document.body.insertAdjacentHTML('beforeend',`<div id="fpRecBar" role="status" style="position:fixed;left:12px;right:12px;bottom:calc(84px + env(safe-area-inset-bottom));z-index:2147482000;background:#171C22;border:1px solid #E5484D;border-radius:14px;padding:10px 12px;direction:rtl;color:#F2F5F7;font:600 14px/1.3 -apple-system,system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.45)"><div style="display:flex;justify-content:space-between;gap:8px"><span>מקליט… <span id="fpRecBarL"></span></span><span id="fpRecBarT" dir="ltr">0:00 / ${mm(total)}</span></div><div style="height:8px;background:#2C3640;border-radius:6px;overflow:hidden;margin-top:7px"><i id="fpRecBarF" style="display:block;height:100%;width:0;background:#E5484D;transition:width .2s linear"></i></div></div>`);
  this.t=setInterval(()=>{const e=(Date.now()-t0)/1000,f=$('fpRecBarF'),tx=$('fpRecBarT'),l=$('fpRecBarL');if(!f){clearInterval(this.t);return}f.style.width=Math.min(100,e/total*100)+'%';if(tx)tx.textContent=mm(Math.min(e,total))+' / '+mm(total);if(l)l.textContent='נשארו '+Math.max(0,Math.ceil(total-e))+' שנ׳'},200)},
 stop(){clearInterval(this.t);const b=$('fpRecBar');if(b)b.remove()}};
async function keepRec(blob,from){const key=RK();try{const c=await cleanRec(await blob.arrayBuffer());LS.set(key,c.data);mineBuf.buf=null;toast(from==='file'?'הקול נשמר':'ההקלטה נשמרה ('+(Math.round(c.sec*10)/10)+' שנ׳)')}
  catch(e){if(e&&e.fpMsg){toast(e.fpMsg,true);return}
    /* could not clean it: keep it as it is, if it is small enough */
    if(blob.size>600000){toast(from==='file'?'הקובץ גדול מדי. קובץ של כמה שניות':'ההקלטה ארוכה מדי',true);return}
    const d=await new Promise(ok=>{const fr=new FileReader();fr.onload=()=>ok(fr.result);fr.readAsDataURL(blob)});LS.set(key,d);mineBuf.buf=null;toast('נשמר')}
  renderSet()}
window.fpRestRec=async()=>{
  if(rec){try{rec.stop()}catch(_){}return}
  if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){toast('המיקרופון לא זמין כאן. אפשר לבחור קובץ קול במקום.',true);return}
  if(typeof MediaRecorder==='undefined'){toast('ההקלטה לא נתמכת בטלפון הזה. אפשר לבחור קובץ קול במקום.',true);return}
  let st=null;
  /* 2.23: without the "phone call" processing, it sounds like you and not like a phone line */
  /* 2.23.1: the plain request, like 2.22 (the special settings did not record on iPhone) */
  try{st=await navigator.mediaDevices.getUserMedia({audio:true})}
  catch(e2){rec=null;toast(fpMicMsg(e2)+(e2&&e2.name&&!e2.fpMsg?' ('+e2.name+')':''),true);renderSet();return}
  try{const chunks=[];rec=fpMakeRecorder(st);const mt=rec.mimeType||'';rec.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data)};
    rec.onstop=()=>{clearInterval(recInt);fpRecBar.stop();st.getTracks().forEach(t=>t.stop());const blob=new Blob(chunks,{type:mt||'audio/mp4'});rec=null;
      if(!blob.size){toast('ההקלטה יצאה ריקה. נסה שוב, או בחר קובץ קול.',true);renderSet();return}
      renderSet();keepRec(blob,'rec')};
    rec.start();recT0=Date.now();renderSet();fpRecBar.start(REC_MAX);clearInterval(recInt);recInt=setInterval(recLive,200);setTimeout(()=>{if(rec)try{rec.stop()}catch(_){}},REC_MAX*1000);
  }catch(e){clearInterval(recInt);fpRecBar.stop();try{st.getTracks().forEach(t=>t.stop())}catch(_){}rec=null;toast(e.fpMsg||('ההקלטה לא התחילה: '+(e.name||'')+' '+(e.message||'')),true);renderSet()}
};
window.fpRestFile=function(f){if(!f)return;if(f.size>3000000)return toast('הקובץ גדול מדי. קובץ של כמה שניות',true);keepRec(f,'file')};

try{speechSynthesis.onvoiceschanged=()=>{if($('fpRestSet_'+TY))renderSet()}}catch(_){}
if(typeof renderSettings==='function'){const o=renderSettings;renderSettings=function(){const r=o.apply(this,arguments);try{renderSet()}catch(e){console.error(e)}return r}}
})();
