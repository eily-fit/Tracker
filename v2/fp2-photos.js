/* FitPro 2.8.0 — progress photos:
   - uploads run one after another in the background: choosing another photo while one is uploading puts it in a queue.
   - several photos can be picked at once (each gets the next pose).
   - an open photo can be swiped to the other photos of the same date. */
(function(){
'use strict';
if(typeof uploadProgressPhoto!=='function')return;

const queue=[];let running=false,total=0,done=0;
function prog(t){const p=$('photoProgress');if(!p)return;p.classList.remove('hide');$('photoProgressText').textContent=t}
function nextPose(pose){const o=POSE_CHOICES,i=o.indexOf(pose);return o[Math.min(o.length-1,i+1)]||pose}

uploadProgressPhoto=function(files){
  const list=(files&&files.length!==undefined&&!(files instanceof Blob))?Array.from(files):(files?[files]:[]);
  const inp=$('photoFile');if(inp)inp.value='';
  const imgs=list.filter(f=>String(f.type||'image/').startsWith('image'));
  if(!imgs.length){if(list.length)toast('בחר קובץ תמונה',true);return}
  const date=$('photoDate').value||state.data.date;let pose=state.photoPose||'front';
  imgs.forEach((f,i)=>{if(i)pose=nextPose(pose);queue.push({file:f,date,pose})});
  state.photoPose=nextPose(pose);try{renderPhotoCard()}catch(_){}
  total+=imgs.length;
  if(running)toast(imgs.length>1?`${imgs.length} תמונות נוספו לתור`:'התמונה נוספה לתור. היא תעלה מיד אחרי הקודמת');
  run();
};
async function run(){
  if(running)return;running=true;let ok=0,fail=0;
  while(queue.length){
    const it=queue.shift(),n=done+1,label=total>1?` ${n} מתוך ${total}`:'';
    try{prog(`מכין תמונה${label}…`);const image=await shrinkImage(it.file,1000,0.72),thumb=await shrinkImage(it.file,240,0.6);
      prog(`שולח תמונה${label}…`);state.partProgress=(d,k)=>prog(`שולח תמונה${label}… ${Math.round(d/k*100)}%`);
      await call('saveProgressPhoto',{date:it.date,pose:it.pose,image,thumb});ok++}
    catch(e){fail++;toast(`תמונת ${POSE_LABELS[it.pose]||''} לא נשמרה: ${e.message}`,true)}
    finally{state.partProgress=null;done++}
  }
  running=false;
  if(ok){prog(ok>1?`${ok} תמונות נשמרו ✓`:'נשמר ✓');toast(ok>1?`${ok} תמונות נשמרו`:'התמונה נשמרה')}
  setTimeout(()=>{const p=$('photoProgress');if(p&&!running)p.classList.add('hide')},1500);
  total=0;done=0;
  try{await loadProgressPhotos(true)}catch(_){}
  if(ok&&state.afterPhoto){const f=state.afterPhoto;state.afterPhoto=null;try{f()}catch(_){}}
}
window.fpPhotoQueueSize=()=>queue.length+(running?1:0);

/* several photos at once */
const boot=setInterval(()=>{const inp=$('photoFile');if(!inp)return;clearInterval(boot);inp.multiple=true;inp.setAttribute('onchange','uploadProgressPhoto(this.files)')},500);

/* ---------- swipe between the photos of the same date ---------- */
function group(id){const p=(state.photos||[]).find(x=>x.id===id);if(!p)return [];return (state.photos||[]).filter(x=>x.date===p.date).sort((a,b)=>POSE_CHOICES.indexOf(a.pose)-POSE_CHOICES.indexOf(b.pose))}
function nav(){
  let el=$('fpPhotoNav');const view=$('photoView');if(!view)return;
  const g=group(state.photoOpen),i=g.findIndex(x=>x.id===state.photoOpen),two=view.classList.contains('two');
  if(g.length<2||two){if(el)el.remove();return}
  if(!el){view.insertAdjacentHTML('afterend','<div id="fpPhotoNav" style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin:8px 0"></div>');el=$('fpPhotoNav')}
  el.innerHTML=`<button type="button" class="icon-btn" aria-label="התמונה הקודמת" ${i<=0?'disabled style="opacity:.3"':''} onclick="fpPhotoGo(-1)">›</button>
    <span class="muted" style="font-size:13px">${g.map((x,k)=>`<span style="display:inline-block;width:8px;height:8px;border-radius:50%;margin:0 3px;background:${k===i?'var(--accent,#7FB2FF)':'rgba(127,127,127,.4)'}"></span>`).join('')}<br>${esc(POSE_LABELS[g[i].pose]||'')} · ${i+1} מתוך ${g.length} · אפשר להחליק</span>
    <button type="button" class="icon-btn" aria-label="התמונה הבאה" ${i>=g.length-1?'disabled style="opacity:.3"':''} onclick="fpPhotoGo(1)">‹</button>`;
}
window.fpPhotoGo=function(dir){const g=group(state.photoOpen),i=g.findIndex(x=>x.id===state.photoOpen),n=g[i+dir];if(n)openProgressPhoto(n.id)};
const oOpen=openProgressPhoto;
openProgressPhoto=async function(id){const r=oOpen.apply(this,arguments);nav();try{await r}catch(_){}nav();return r};
if(typeof comparePhoto==='function'){const o=comparePhoto;comparePhoto=async function(){const r=o.apply(this,arguments);nav();try{await r}catch(_){}nav();return r}}
let sx=null,sy=null;
document.addEventListener('touchstart',e=>{const v=$('photoView');if(!v||!v.contains(e.target)||v.classList.contains('two'))return;sx=e.touches[0].clientX;sy=e.touches[0].clientY},{passive:true});
document.addEventListener('touchend',e=>{if(sx===null)return;const dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;sx=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.5)fpPhotoGo(dx<0?1:-1)},{passive:true});
})();
