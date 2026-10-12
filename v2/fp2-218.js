/* FitPro 2.18.0 — Settings "בדיקת AI": is the AI server reachable, and how long does it take. */
(function(){
'use strict';
function renderAiCheck(){const sec=$('settings');if(!sec||!state.data)return;let box=$('fpAiCheck');
  if(!box){box=document.createElement('details');box.className='settings-section';box.id='fpAiCheck';const a=$('fpLogout');if(a)a.insertAdjacentElement('beforebegin',box);else sec.appendChild(box)}
  const open=box.open;box.innerHTML=`<summary>בדיקת AI</summary><div class="settings-body"><p class="muted" style="margin:0 0 8px;font-size:13px">ה-AI עובד דרך השרת הישן. אם ״ה-AI חושב…״ לא נגמר, הבדיקה מראה איפה זה נתקע.</p>
    <button type="button" class="btn light full" onclick="fpAiCheck()">בדוק עכשיו</button><div id="fpAiRes" style="margin-top:8px;font-size:14px;line-height:1.6"></div></div>`;box.open=open}
const line=(ok,t)=>`<div>${ok===null?'…':ok?'✓':'✗'} ${t}</div>`;
window.fpAiCheck=async function(){const el=$('fpAiRes');if(!el)return;const rows=[];const show=()=>{el.innerHTML=rows.join('')};
  rows.push(line(null,'מתחבר לשרת…'));show();let t=Date.now();
  try{await call('getApiInfo');rows[0]=line(true,`השרת עונה (${((Date.now()-t)/1000).toFixed(1)} שנ׳)`)}catch(e){rows[0]=line(false,'השרת לא עונה: '+esc(e.message));show();return}
  rows.push(line(null,'שואל את ה-AI על ״תפוח״…'));show();t=Date.now();
  try{const r=await call('estimateFoodWithOpenAI','תפוח','');const s=((Date.now()-t)/1000).toFixed(1);rows[1]=line(true,`ה-AI ענה (${s} שנ׳)${r&&r.fromCache?' · מהזיכרון':''}${Number(s)>25?' · איטי. זה בצד של השרת, לא בטלפון':''}`)}
  catch(e){rows[1]=line(false,'ה-AI לא ענה: '+esc(e.message))}
  show()};
if(typeof renderSettings==='function'){const o=renderSettings;renderSettings=function(){const r=o.apply(this,arguments);try{renderAiCheck()}catch(e){console.error(e)}return r}}
})();
