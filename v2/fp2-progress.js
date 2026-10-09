/* FitPro 2.10.0 — progress by weeks:
   - "השבוע שלי" at the top of the progress screen: this week / last week / earlier, without picking a day.
     Each week: the photos of that week, average weight and the navel measurement, with the change from the week before.
   - "השוואה": the same pose from two weeks, side by side or "לפני/אחרי" with a slider.
   - "ציר זמן": all the photos of one pose, week after week.
   - the weekly check-in reminder shows only on the chosen day (and the day after, if it wasn't done). */
(function(){
'use strict';
if(typeof renderProcess!=='function')return;
document.head.insertAdjacentHTML('beforeend',`<style>
.fp-wk-tabs{display:flex;gap:6px;overflow-x:auto;padding-bottom:4px;scrollbar-width:none}
.fp-wk-tabs::-webkit-scrollbar{display:none}
.fp-wk-tabs .chip{flex:none}
.fp-wk-photos{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:10px 0}
.fp-wk-ph{aspect-ratio:3/4;border-radius:10px;border:1px solid var(--line,#2a323b);background:#11161b center/cover no-repeat;display:flex;align-items:flex-end;justify-content:center;font-size:11px;color:#fff;padding:3px;cursor:pointer;text-shadow:0 1px 2px #000}
.fp-wk-ph.empty{cursor:default;color:var(--muted,#A3ADB8);text-shadow:none;align-items:center}
.fp-wk-stats{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.fp-wk-stat{border:1px solid var(--line,#2a323b);border-radius:12px;padding:8px 10px}
.fp-wk-stat b{font-size:18px;display:block}
.fp-cmp{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.fp-cmp figure{margin:0}.fp-cmp img{width:100%;border-radius:10px;display:block}
.fp-cmp figcaption{font-size:12px;text-align:center;margin-top:4px;color:var(--muted,#A3ADB8)}
.fp-ba{position:relative;border-radius:12px;overflow:hidden;touch-action:pan-y}
.fp-ba img{width:100%;display:block}
.fp-ba .top{position:absolute;inset:0;overflow:hidden}
.fp-ba .top img{position:absolute;top:0;right:0;width:100%;height:100%;object-fit:cover}
.fp-ba .bar{position:absolute;top:0;bottom:0;width:3px;background:var(--brand,#D7F36B);box-shadow:0 0 6px #000}
.fp-ba .lbl{position:absolute;top:6px;font-size:11px;background:rgba(0,0,0,.55);color:#fff;border-radius:6px;padding:2px 6px}
.fp-tl{display:flex;gap:8px;overflow-x:auto;padding:6px 0}
.fp-tl .fp-wk-ph{flex:none;width:96px}
</style>`);
const POSES=(typeof POSE_CHOICES!=='undefined'?POSE_CHOICES:['front','right','left','back']);
const PL=k=>(typeof POSE_LABELS!=='undefined'&&POSE_LABELS[k])||k;
const addD=(d,n)=>{const x=new Date(d+'T12:00:00Z');x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10)};
const today=()=>state.todayDate||(state.data&&state.data.date)||new Date().toISOString().slice(0,10);
const weekStart=d=>addD(d,-new Date(d+'T12:00:00Z').getUTCDay());
const WK={i:0};

function weekData(i){
  const s=addD(weekStart(today()),-7*i),e=addD(s,6);
  const inW=d=>d>=s&&d<=e;
  const photos=(state.photos||[]).filter(p=>inW(p.date));
  const byPose={};photos.forEach(p=>{if(!byPose[p.pose]||p.date>byPose[p.pose].date)byPose[p.pose]=p});
  const ws=[];(state.data.history||[]).forEach(h=>{if(inW(h.date)&&Number(h.weight)>0)ws.push(Number(h.weight))});
  ((state.data.process&&state.data.process.rows)||[]).forEach(r=>{if(inW(r.date)&&Number(r.weight)>0&&!(state.data.history||[]).some(h=>h.date===r.date&&Number(h.weight)>0))ws.push(Number(r.weight))});
  const waists=((state.data.process&&state.data.process.rows)||[]).filter(r=>inW(r.date)&&Number(r.waist)>0).sort((a,b)=>a.date.localeCompare(b.date));
  return {s,e,byPose,photos,weight:ws.length?Math.round(ws.reduce((a,b)=>a+b,0)/ws.length*10)/10:null,waist:waists.length?Number(waists[waists.length-1].waist):null};
}
function prevValue(i,key){for(let k=i+1;k<i+30;k++){const w=weekData(k);if(w[key]!=null)return w[key]}return null}
const delta=(a,b,u)=>a==null||b==null?'':`<small class="muted">${a-b>0?'+':''}${fmt(Math.round((a-b)*10)/10)} ${u} מהקודם</small>`;
const wkName=i=>i===0?'השבוע':i===1?'שבוע שעבר':i===2?'לפני שבועיים':`לפני ${i} שבועות`;
const dShort=d=>{try{return displayDate(d)}catch(_){return d}};

function renderWeek(){
  const sec=$('process');if(!sec)return;
  let card=$('fpWeekCard');
  if(!card){const a=$('processAssessment');if(!a)return;a.insertAdjacentHTML('beforebegin','<div class="card" id="fpWeekCard"></div>');card=$('fpWeekCard')}
  const i=WK.i,w=weekData(i),pw=prevValue(i,'weight'),pwa=prevValue(i,'waist');
  const tabs=[0,1,2,3].concat(i>3?[i]:[]).map(k=>`<button type="button" class="chip${k===i?' active':''}" onclick="fpWeek(${k})">${wkName(k)}</button>`).join('')+`<button type="button" class="chip" onclick="fpWeek(${Math.max(4,i+1)})">עוד אחורה ›</button>`;
  const ph=POSES.map(k=>{const p=w.byPose[k];return p?`<button type="button" class="fp-wk-ph" style="background-image:url(data:image/jpeg;base64,${p.thumb})" onclick="openProgressPhoto('${esc(p.id)}')">${esc(PL(k))}</button>`:`<div class="fp-wk-ph empty">${esc(PL(k))}<br>—</div>`}).join('');
  card.innerHTML=`<h3 style="margin:0 0 8px">📆 השבוע שלי</h3><div class="fp-wk-tabs">${tabs}</div>
    <p class="muted" style="margin:6px 0 0;font-size:13px">${dShort(w.s)} – ${dShort(w.e)}${!state.photosLoaded?' · טוען תמונות…':''}</p>
    <div class="fp-wk-photos">${ph}</div>
    <div class="fp-wk-stats"><div class="fp-wk-stat"><span class="muted">משקל ממוצע</span><b>${w.weight!=null?fmt(w.weight)+' ק״ג':'—'}</b>${delta(w.weight,pw,'ק״ג')}</div>
      <div class="fp-wk-stat"><span class="muted">היקף טבור</span><b>${w.waist!=null?fmt(w.waist)+' ס״מ':'—'}</b>${delta(w.waist,pwa,'ס״מ')}</div></div>
    <div class="quick-grid" style="margin-top:10px"><button type="button" class="btn" onclick="fpCompare()">↔️ השוואה</button><button type="button" class="btn light" onclick="fpTimeline()">🎞 ציר זמן</button></div>`;
}
window.fpWeek=function(i){WK.i=Math.max(0,i);renderWeek()};
const oProc=renderProcess;
renderProcess=function(){const r=oProc.apply(this,arguments);try{renderWeek()}catch(e){console.error(e)}return r};
if(typeof renderPhotoCard==='function'){const o=renderPhotoCard;renderPhotoCard=function(){const r=o.apply(this,arguments);try{if($('fpWeekCard'))renderWeek()}catch(_){}return r}}
const oShow=showView;
showView=function(v){const r=oShow.apply(this,arguments);if(v==='process'){WK.i=0;try{renderWeek()}catch(_){}try{loadProgressPhotos()}catch(_){}}return r};

/* ---------- compare ---------- */
const C={pose:'front',a:null,b:null,mode:'side',pos:50};
function photosOf(pose){return (state.photos||[]).filter(p=>p.pose===pose).sort((x,y)=>x.date.localeCompare(y.date))}
function infoFor(date){const w=(state.data.history||[]).find(h=>h.date===date&&Number(h.weight)>0),r=((state.data.process&&state.data.process.rows)||[]).filter(x=>x.date<=date&&Number(x.waist)>0).pop();return [w?fmt(w.weight)+' ק״ג':'',r&&r.date>=addD(date,-7)?fmt(r.waist)+' ס״מ טבור':''].filter(Boolean).join(' · ')}
window.fpCompare=function(){
  const list=photosOf(C.pose);
  if(!C.a||!list.some(p=>p.id===C.a))C.a=list[0]&&list[0].id;
  if(!C.b||!list.some(p=>p.id===C.b))C.b=list.length>1?list[list.length-1].id:null;
  renderCompare();
};
async function renderCompare(){
  let el=$('fpCmpSheet');if(!el){document.body.insertAdjacentHTML('beforeend','<div class="overlay" id="fpCmpSheet" onclick="if(event.target===this)this.remove()"><div class="sheet" id="fpCmpBody"></div></div>');el=$('fpCmpSheet')}
  const list=photosOf(C.pose),chip=(on,l,js)=>`<button type="button" class="chip${on?' active':''}" onclick="${js}">${l}</button>`;
  const sel=(k,cur)=>`<select onchange="fpCmpPick('${k}',this.value)" style="width:100%">${list.map(p=>`<option value="${esc(p.id)}" ${p.id===cur?'selected':''}>${esc(dShort(p.date))}</option>`).join('')}</select>`;
  const body=$('fpCmpBody');
  body.innerHTML=`<div class="sheet-head"><h3>↔️ השוואה</h3><button class="trash" onclick="document.getElementById('fpCmpSheet').remove()" aria-label="סגור">✕</button></div>
    <div class="meal-tabs" style="flex-wrap:wrap">${POSES.map(k=>chip(C.pose===k,PL(k),`fpCmpPose('${k}')`)).join('')}</div>
    ${list.length<2?`<p class="muted">צריך לפחות שתי תמונות ${esc(PL(C.pose))} כדי להשוות.</p>`:`
    <div class="row" style="margin-top:8px"><div class="field"><label>לפני</label>${sel('a',C.a)}</div><div class="field"><label>אחרי</label>${sel('b',C.b)}</div></div>
    <div class="meal-tabs">${chip(C.mode==='side','זו לצד זו',"fpCmpMode('side')")}${chip(C.mode==='ba','לפני/אחרי',"fpCmpMode('ba')")}</div>
    <div id="fpCmpView" style="margin-top:10px"><p class="muted">טוען…</p></div>`}`;
  if(list.length<2)return;
  try{
    const [A,B]=await Promise.all([loadFullPhoto(C.a),loadFullPhoto(C.b)]);
    const pa=list.find(p=>p.id===C.a),pb=list.find(p=>p.id===C.b),v=$('fpCmpView');if(!v)return;
    if(C.mode==='side')v.innerHTML=`<div class="fp-cmp"><figure><img src="data:image/jpeg;base64,${A.image}"><figcaption>${esc(dShort(pa.date))}<br>${esc(infoFor(pa.date))}</figcaption></figure><figure><img src="data:image/jpeg;base64,${B.image}"><figcaption>${esc(dShort(pb.date))}<br>${esc(infoFor(pb.date))}</figcaption></figure></div>`;
    else{v.innerHTML=`<div class="fp-ba" id="fpBA"><img src="data:image/jpeg;base64,${A.image}"><div class="top" style="clip-path:inset(0 0 0 ${100-C.pos}%)"><img src="data:image/jpeg;base64,${B.image}"></div><div class="bar" style="left:${100-C.pos}%"></div><span class="lbl" style="left:6px">${esc(dShort(pa.date))}</span><span class="lbl" style="right:6px">${esc(dShort(pb.date))}</span></div>
      <input type="range" min="0" max="100" value="${C.pos}" oninput="fpCmpSlide(this.value)" style="width:100%;margin-top:8px" aria-label="גרור כדי להשוות">
      <p class="muted" style="font-size:12px;margin:4px 0 0">גרור ימינה ושמאלה. ${esc(infoFor(pa.date))} ← → ${esc(infoFor(pb.date))}</p>`;
      const ba=$('fpBA');const move=x=>{const r=ba.getBoundingClientRect();fpCmpSlide(Math.max(0,Math.min(100,100-(x-r.left)/r.width*100)))};
      ba.addEventListener('pointerdown',e=>{move(e.clientX);const mv=ev=>move(ev.clientX),up=()=>{removeEventListener('pointermove',mv);removeEventListener('pointerup',up)};addEventListener('pointermove',mv);addEventListener('pointerup',up)});}
  }catch(e){const v=$('fpCmpView');if(v)v.innerHTML=`<p class="muted">${esc(e.message)}</p>`}
}
window.fpCmpPose=k=>{C.pose=k;C.a=null;C.b=null;fpCompare()};
window.fpCmpPick=(k,id)=>{C[k]=id;renderCompare()};
window.fpCmpMode=m=>{C.mode=m;renderCompare()};
window.fpCmpSlide=v=>{C.pos=Number(v);const ba=$('fpBA');if(!ba)return;ba.querySelector('.top').style.clipPath=`inset(0 0 0 ${100-C.pos}%)`;ba.querySelector('.bar').style.left=(100-C.pos)+'%';const r=document.querySelector('#fpCmpView input[type=range]');if(r&&Number(r.value)!==C.pos)r.value=C.pos};

/* ---------- timeline of one pose ---------- */
const TL={pose:'front'};
window.fpTimeline=function(){
  let el=$('fpTlSheet');if(!el){document.body.insertAdjacentHTML('beforeend','<div class="overlay" id="fpTlSheet" onclick="if(event.target===this)this.remove()"><div class="sheet" id="fpTlBody"></div></div>');el=$('fpTlSheet')}
  const list=photosOf(TL.pose).slice().reverse(),chip=(on,l,js)=>`<button type="button" class="chip${on?' active':''}" onclick="${js}">${l}</button>`;
  $('fpTlBody').innerHTML=`<div class="sheet-head"><h3>🎞 ציר זמן</h3><button class="trash" onclick="document.getElementById('fpTlSheet').remove()" aria-label="סגור">✕</button></div>
    <div class="meal-tabs" style="flex-wrap:wrap">${POSES.map(k=>chip(TL.pose===k,PL(k),`fpTlPose('${k}')`)).join('')}</div>
    ${list.length?`<div class="fp-tl">${list.map(p=>`<button type="button" class="fp-wk-ph" style="background-image:url(data:image/jpeg;base64,${p.thumb})" onclick="document.getElementById('fpTlSheet').remove();openProgressPhoto('${esc(p.id)}')">${esc(dShort(p.date))}</button>`).join('')}</div><p class="muted" style="font-size:12px">מהחדשה לישנה. מחליקים הצידה.</p>`:`<p class="muted">עוד אין תמונות ${esc(PL(TL.pose))}.</p>`}`;
};
window.fpTlPose=k=>{TL.pose=k;fpTimeline()};

/* ---------- weekly check-in: only on its day (and the next day if it was missed) ---------- */
if(typeof renderCheckinDue==='function'){
  renderCheckinDue=function(){
    const el=$('checkinDue');if(!el||!state.data)return;
    const t=today(),day=checkinDay(),dow=new Date(t+'T12:00:00Z').getUTCDay();
    const last=[String(state.data.settings&&state.data.settings.last_checkin||'').replace(/^ci:/,''),(typeof localLastCheckin==='function'?localLastCheckin():'')].sort().pop()||'';
    const yesterday=addD(t,-1);
    const due=state.date===t&&last!==t&&(dow===day||(dow===(day+1)%7&&last<yesterday));
    el.classList.toggle('hide',!due);
    if($('checkinDaySel'))$('checkinDaySel').value=String(day);
    if($('fpCiDaySet'))$('fpCiDaySet').value=String(day);
  };
}
/* the same choice in Settings */
function injectSettings(){
  const s=$('settings');if(!s||$('fpCiDaySet'))return;
  const goals=[...s.querySelectorAll('details.settings-section summary')].find(x=>/יעדים/.test(x.textContent));if(!goals)return;
  const names=['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
  goals.parentElement.insertAdjacentHTML('afterend',`<details class="settings-section"><summary>✅ צ׳ק-אין שבועי</summary><div class="settings-body"><div class="field"><label>באיזה יום?</label><select id="fpCiDaySet" onchange="saveCheckinDay(this.value)">${names.map((n,i)=>`<option value="${i}">${n}</option>`).join('')}</select></div><p class="muted">התזכורת מופיעה רק ביום הזה. אם לא מילאת, היא מופיעה גם למחרת, וזהו.</p></div></details>`);
  try{$('fpCiDaySet').value=String(checkinDay())}catch(_){}
}
if(typeof renderSettings==='function'){const o=renderSettings;renderSettings=function(){const r=o.apply(this,arguments);try{injectSettings()}catch(_){}return r}}
const boot=setInterval(()=>{if(typeof state!=='undefined'&&state.data&&$('settings')){clearInterval(boot);try{injectSettings()}catch(_){}}},1200);
})();
