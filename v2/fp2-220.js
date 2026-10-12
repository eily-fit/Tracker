/* FitPro 2.20.0 — settings in folders: the everyday things stay on top, the rest sits in two folders.
   Sections are moved (not rebuilt), so everything that looks them up by id keeps working. Runs again whenever new sections appear. */
(function(){
'use strict';
const FOLDERS=[
  {id:'fpFolderAcc',title:'חשבון, התראות ויומן',match:[/השם שלי/,/^[^א-ת]*התראות/,/חיבור יומן/,/צ׳ק-אין שבועי/]},
  {id:'fpFolderTools',title:'גיבוי, בדיקות והגדרות נוספות',match:[/גיבוי וייצוא/,/בדיקת AI/,/הגדרות נוספות/,/צמרת/]}
];
/* the order of what stays on top */
const TOP=[/היעד והאירועים/,/יעדים יומיים/,/איך אתה מבשל/,/היום, חגים ושבת/,/צליל סוף מנוחה/,/מדליות וסיכום שבוע/,/אימונים: כוח/];
document.head.insertAdjacentHTML('beforeend','<style id="fp220css">#settings details.fp-folder>summary{font-weight:800}#settings details.fp-folder>.settings-body>details.settings-section{margin:8px 0}#settings details.fp-folder>.settings-body{padding-top:4px}</style>');
const sumOf=d=>{const s=d.querySelector(':scope > summary');return s?s.textContent.trim():''};
function organize(){
  const root=document.getElementById('settings');if(!root||!document.getElementById('moreSettings'))return; /* the app's own grouping runs first, once */
  const head=root.querySelector(':scope > h2');
  FOLDERS.forEach(F=>{const ex=document.getElementById(F.id);if(ex&&ex.parentElement!==root)root.appendChild(ex);if(!ex){const d=document.createElement('details');d.id=F.id;d.className='settings-section fp-folder';d.innerHTML=`<summary>${F.title}</summary><div class="settings-body"></div>`;root.appendChild(d)}});
  const top=[...root.querySelectorAll(':scope > details.settings-section:not(.fp-folder)')];
  top.forEach(d=>{if(d.classList.contains('admin-only')||FOLDERS.some(F=>d.contains(document.getElementById(F.id))))return;const t=sumOf(d);const F=FOLDERS.find(f=>f.match.some(re=>re.test(t)));if(F)document.getElementById(F.id).querySelector(':scope > .settings-body').appendChild(d)});
  /* keep the folders' inner order fixed */
  FOLDERS.forEach(F=>{const body=document.getElementById(F.id).querySelector(':scope > .settings-body');const kids=[...body.children];
    const rank=d=>{const t=sumOf(d);const i=F.match.findIndex(re=>re.test(t));return i<0?99:i};kids.slice().sort((a,b)=>rank(a)-rank(b)).forEach(k=>body.appendChild(k))});
  /* top: chosen order, then anything else, then the folders, then admin, version and logout */
  let anchor=head;const place=el=>{if(!el)return;if(anchor)anchor.after(el);else root.prepend(el);anchor=el};
  const rest=[...root.querySelectorAll(':scope > details.settings-section:not(.fp-folder):not(.admin-only)')];
  TOP.forEach(re=>{const d=rest.find(x=>re.test(sumOf(x)));if(d)place(d)});
  rest.filter(d=>!TOP.some(re=>re.test(sumOf(d)))).forEach(place);
  FOLDERS.forEach(F=>place(document.getElementById(F.id)));
  root.querySelectorAll(':scope > details.admin-only').forEach(place);
  const tour=document.getElementById('tourRerun');if(tour)place(tour);
  ['appVersionLabel','fpLogout'].forEach(id=>place(document.getElementById(id)));
}

/* ---------- workout builder: the order of the workout at a glance (1, 2, 3…), tap one to jump to it ---------- */
document.head.insertAdjacentHTML('beforeend','<style id="fp220b">.fp-order{background:#1F262E;border:1px solid var(--line,#2C3640);border-radius:14px;padding:8px 10px;margin:0 0 10px}.fp-order b{display:block;font-size:13px;color:var(--muted,#A3ADB8);margin-bottom:4px}.fp-order button{display:flex;align-items:center;gap:8px;width:100%;background:none;border:0;color:inherit;font:inherit;text-align:right;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.05)}.fp-order button:last-child{border:0}.fp-order i{font-style:normal;flex:none;width:24px;height:24px;border-radius:7px;background:var(--brand,#D7F36B);color:#14190a;font-weight:800;display:grid;place-items:center;font-size:13px}.fp-order span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:14px}</style>');
if(typeof renderWorkoutPlanItems==='function'){const o=renderWorkoutPlanItems;renderWorkoutPlanItems=function(){const r=o.apply(this,arguments);
  try{const box=document.getElementById('workoutPlanItems');const rows=[...(box?box.querySelectorAll(':scope > .plan-row'):[])];if(rows.length<2)return r;
    const items=rows.map(row=>({n:Number((row.querySelector('.fp-ord')||{}).textContent)||0,t:((row.querySelector('.fp-pr-name')||{}).textContent||'').trim(),row})).filter(x=>x.n).sort((a,b)=>a.n-b.n);
    const esc2=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
    const div=document.createElement('div');div.className='fp-order';div.innerHTML='<b>סדר האימון</b>'+items.map(x=>`<button type="button" data-n="${x.n}"><i>${x.n}</i><span>${esc2(x.t)}</span></button>`).join('');
    div.onclick=e=>{const b=e.target.closest('button[data-n]');if(!b)return;const it=items.find(x=>String(x.n)===b.dataset.n);if(it)it.row.scrollIntoView({behavior:'smooth',block:'start'})};
    const hint=box.querySelector('.fp-pr-hint');if(hint)hint.after(div);else box.prepend(div);
  }catch(e){console.error(e)}return r}}
/* a section opened from elsewhere in the app (a link, the tour) opens its folder too */
document.addEventListener('toggle',e=>{const d=e.target;if(!d||!d.open||!d.closest)return;const f=d.parentElement&&d.parentElement.closest('details.fp-folder');if(f&&!f.open)f.open=true},true);
window.fpSettingsOrganize=organize;
let sig='';
setInterval(()=>{const root=document.getElementById('settings');if(!root)return;const s=[...root.querySelectorAll(':scope > *')].map(e=>e.id||sumOf(e)||e.tagName).join('|');if(s!==sig){try{organize()}catch(e){console.error(e)}sig=[...root.querySelectorAll(':scope > *')].map(e=>e.id||sumOf(e)||e.tagName).join('|')}},800);
})();
