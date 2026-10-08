/* FitPro 2 — exercise library UI: families with variants, search, and "what muscle works" per variant */
(function(){'use strict';
const STEMS=[
 [/^שכיבות סמיכה/,'שכיבות סמיכה'],[/^לחיצת חזה/,'לחיצת חזה'],[/^פרפר הפוך|^כתף אחורית/,'פרפר הפוך'],[/^פרפר/,'פרפר חזה'],
 [/^מקבילים/,'מקבילים'],[/^חתירה|^חתירת/,'חתירה'],[/^מתח/,'מתח'],[/^פולי עליון/,'פולי עליון'],[/^פולאובר/,'פולאובר בכבל'],
 [/^לחיצת כתפיים/,'לחיצת כתפיים'],[/^הרחקת כתפיים|^הרחקה/,'הרחקת כתפיים לצדדים'],[/^הרמה קדמית/,'הרמה קדמית'],[/^הרמת ידיים/,'הרמות בשכיבה (W/Y/T)'],
 [/^כפיפת מרפקים|^כפיפה|^פטישים/,'כפיפת מרפקים'],[/^פשיטת מרפקים/,'פשיטת מרפקים'],[/^פשיטה מעל הראש/,'פשיטה מעל הראש'],[/^לחיצה צרפתית/,'לחיצה צרפתית'],
 [/^סקוואט/,'סקוואט'],[/^מכרעים/,'מכרעים'],[/^בולגרי/,'בולגרי'],[/^גשר ישבן|^היפ טראסט/,'גשר ישבן / היפ טראסט'],[/^דדליפט רומני/,'דדליפט רומני'],[/^תאומים/,'תאומים'],
 [/^לחיצת רגליים/,'לחיצת רגליים'],[/^כפיפת ברך/,'כפיפת ברך'],[/^פשיטת ברך/,'פשיטת ברך'],
 [/^כפיפות בטן|^קרנץ/,'כפיפות בטן'],[/^פלאנק/,'פלאנק'],[/^הרמת רגליים/,'הרמת רגליים'],[/^דד באג/,'דד באג'],[/^סיבוב גו/,'סיבוב גו'],[/^בירד דוג/,'בירד דוג'],[/^סופרמן/,'סופרמן'],[/^נגיעות כתף/,'נגיעות כתף'],
 [/^הליכה|^צעידה/,'הליכה'],[/^ריצה|^הליכון/,'ריצה / הליכון'],[/^אופני/,'אופני כושר'],[/^אליפטיקל/,'אליפטיקל']
];
const WORKS=[
 [/שכיבות סמיכה רחבות/,'חזה חיצוני וכתפיים קדמיות'],[/שכיבות סמיכה צרות/,'יד אחורית וחזה פנימי'],[/שכיבות סמיכה בשיפוע/,'חזה ויד אחורית, בעומס קל יותר'],
 [/שכיבות סמיכה על הברכיים/,'חזה ויד אחורית, בעומס קל'],[/שכיבות סמיכה לקיר/,'חזה וכתפיים, בעומס קל מאוד'],[/^שכיבות סמיכה/,'חזה אמצעי, יד אחורית וכתף קדמית'],
 [/לחיצת חזה בשיפוע/,'חזה עליון וכתף קדמית'],[/לחיצת חזה באחיזה צרה/,'יד אחורית וחזה פנימי'],[/לחיצת חזה מתחלפת/,'חזה, יד אחורית וליבה (צד אחד בכל פעם)'],
 [/לחיצת חזה.*על הרצפה/,'חזה ויד אחורית, בטווח קצר ועדין לכתפיים'],[/לחיצת חזה במכונה/,'חזה אמצעי'],[/^לחיצת חזה/,'חזה אמצעי, יד אחורית וכתף קדמית'],
 [/פרפר בכבלים/,'חזה, עם מתח קבוע לאורך התנועה'],[/פרפר במכונה/,'חזה פנימי'],[/פרפר הפוך|כתף אחורית/,'כתף אחורית ושכמות'],[/^פרפר/,'חזה (מתיחה וכיווץ), בלי יד אחורית'],
 [/מקבילים ליד אחורית/,'יד אחורית (גוף זקוף)'],[/מקבילים/,'חזה תחתון, יד אחורית וכתף קדמית (גוף נוטה קדימה)'],
 [/פולי עליון/,'גב רחב (לאטים) וביספס'],[/פולאובר/,'גב רחב (לאטים), בידוד'],
 [/חתירת מרפקים/,'אמצע הגב וכתף אחורית'],[/חתירה עם משקולת/,'לאטים וגב אמצעי, צד אחד בכל פעם'],[/תמיכת חזה/,'אמצע הגב והשכמות, בלי עומס על הגב התחתון'],
 [/חתירה באחיזה ניטרלית/,'לאטים תחתון וביספס'],[/חתירה במכונה/,'אמצע הגב, שכמות ולאטים'],[/^חתירה/,'לאטים ואמצע הגב'],
 [/מתח באחיזה הפוכה עם תמיכת רגליים/,'ביספס וגב, בעזרת הרגליים'],[/מתח באחיזה הפוכה צרה/,'ביספס וגב'],[/מתח באחיזה הפוכה/,'ביספס וגב תחתון'],[/מתח באחיזה ניטרלית/,'לאטים וביספס'],[/^מתח/,'גב רחב (לאטים) וזרועות'],
 [/הרמת ידיים W/,'אמצע הגב וכתף אחורית'],[/הרמת ידיים Y/,'גב עליון וטרפז תחתון'],[/הרמת ידיים T/,'כתף אחורית ושכמות'],[/בירד דוג/,'ליבה, גב תחתון וישבן'],[/סופרמן/,'גב תחתון וישבן'],
 [/לחיצת כתפיים פייק/,'כתפיים וטריספס'],[/^לחיצת כתפיים/,'כתף קדמית ואמצעית, וטריספס'],[/הרחקה|הרחקת כתפיים/,'כתף אמצעית'],[/הרמה קדמית/,'כתף קדמית'],[/נגיעות כתף/,'כתפיים וליבה'],
 [/פטישים/,'ביספס ושריר הזרוע החיצוני (ברכיאליס)'],[/איזומטרית/,'ביספס (החזקה)'],[/בהתנגדות/,'ביספס'],[/כפיפת מרפקים בישיבה/,'ביספס, בלי תנופה'],[/מתחלפת/,'ביספס, יד אחרי יד'],[/^כפיפה|כפיפת מרפקים/,'ביספס'],
 [/פשיטת מרפקים לקיר/,'יד אחורית, בעומס קל'],[/פשיטת מרפקים במשקולת בהטיית גו/,'יד אחורית, כיווץ בסוף התנועה'],[/פשיטת מרפקים/,'יד אחורית'],[/פשיטה מעל הראש/,'יד אחורית (ראש ארוך)'],[/לחיצה צרפתית/,'יד אחורית (ראש ארוך)'],
 [/סקוואט גביע/,'ירכיים קדמיות, ישבן וליבה'],[/סקוואט ללא ציוד/,'ירכיים וישבן'],[/^סקוואט/,'ירכיים, ישבן וגב תחתון'],[/בולגרי/,'ירכיים וישבן, ברמת קושי גבוהה'],[/מכרעים/,'ירכיים וישבן, צד אחד בכל פעם'],
 [/היפ טראסט/,'ישבן'],[/גשר ישבן/,'ישבן ורצועת ירך אחורית'],[/דדליפט רומני/,'ירכיים אחוריות וישבן'],[/תאומים/,'שרירי השוק'],[/לחיצת רגליים/,'ירכיים קדמיות וישבן'],[/כפיפת ברך/,'ירכיים אחוריות'],[/פשיטת ברך/,'ירכיים קדמיות'],
 [/סיבוב גו/,'אלכסוניים (שרירי בטן צדדיים)'],[/הרמת רגליים/,'בטן תחתונה'],[/פלאנק|דד באג/,'ליבה ובטן'],[/כפיפות בטן|קרנץ/,'בטן'],
 [/הליכ|צעידה/,'רגליים וקצב לב מתון'],[/ריצה|הליכון|אופני|אליפטיקל/,'רגליים וסיבולת לב-ריאה']
];
const clean=n=>String(n||'').replace(/\s*ללא ציוד\s*$/,'').replace(/^\s*✓\s*/,'').trim();
function stemOf(name){const n=clean(name);for(const [re,t] of STEMS)if(re.test(n))return t;return null}
function worksOf(name){const n=clean(name);for(const [re,t] of WORKS)if(re.test(n))return t;return ''}
function label(name,stem){const n=clean(name);if(!stem)return n;const base=STEMS.find(x=>x[1]===stem);const m=base&&n.match(base[0]);if(m&&m[0]&&n.length>m[0].length){const rest=n.slice(m[0].length).trim();return rest||'רגיל'}return n}
window.FP2Lib={stemOf,worksOf,label,clean};

const esc2=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CSS=`#exPickQ{width:100%;margin:0 0 8px;font:inherit;padding:11px 13px;border-radius:12px;border:1px solid var(--line);background:#1F262E;color:var(--ink)}
.exfam{border:1px solid var(--line);border-radius:14px;margin:7px 0;background:#1B2128;overflow:hidden}
.exfam>button.exfam-h{width:100%;display:flex;align-items:center;justify-content:space-between;gap:8px;background:none;border:0;color:var(--ink);font:inherit;padding:13px;text-align:right;cursor:pointer}
.exfam-h b{font-size:16px}.exfam-h small{color:var(--muted)}.exfam-h .chev{color:var(--brand);transition:transform .15s}.exfam.open .chev{transform:rotate(90deg)}
.exfam-b{display:none;padding:0 8px 8px}.exfam.open .exfam-b{display:block}
.exfam .pick-row{margin:5px 0}.pick-row .wk{display:block;color:#FF8A80;font-size:12.5px;margin-top:3px;font-weight:400}.pick-row .eq{color:var(--muted);font-size:12px;font-weight:400}
.exgroup-t{color:var(--brand);font-weight:700;margin:12px 2px 4px;font-size:13px}`;
function mount(){if(document.getElementById('exlibCss'))return;const st=document.createElement('style');st.id='exlibCss';st.textContent=CSS;document.head.appendChild(st)}
function rowHtml(x,pm,showGroup,fam){
  const w=worksOf(x.name),lab=fam?label(x.name,fam):clean(x.name);
  return `<button type="button" class="pick-row" data-lp="exercise:${esc2(x.id)}" data-lp-title="${esc2(x.name)}" onclick="pickExercise('${esc2(x.id)}')"><b>${x.id===pm.current?'✓ ':''}${esc2(x.name)}</b>${w?`<span class="wk">🔴 ${esc2(w)}</span>`:''}${showGroup?`<span class="eq">${esc2(x.__g||'')}${x.equipment?' · '+esc2(x.equipment):''}</span>`:(pm.all?`<span class="eq">${esc2(x.equipment==='מכונה'?'מכונה':'משקולות חופשיות')}</span>`:'')}</button>`}
function render(){
  mount();const pm=state.pickMode,catalog=state.data.workout.exercises||{};
  const sheet=document.getElementById('exPickSheet'),listEl=document.getElementById('exPickList');if(!pm||!sheet||!listEl)return;
  let q=document.getElementById('exPickQ');
  if(!q){q=document.createElement('input');q.id='exPickQ';q.type='search';q.placeholder='🔎 חפש תרגיל לפי שם או שריר';q.autocomplete='off';q.addEventListener('input',()=>{state.pickQuery=q.value;renderList()});listEl.parentNode.insertBefore(q,listEl)}
  document.getElementById('exPickTitle').textContent='בחר תרגיל · '+pm.group;
  if(state.pickQuery===undefined||state.pickFresh!==pm){q.value='';state.pickQuery='';state.pickFresh=pm}
  renderList();sheet.classList.remove('hide');
}
function renderList(){
  const pm=state.pickMode,catalog=state.data.workout.exercises||{},listEl=document.getElementById('exPickList'),qv=String(state.pickQuery||'').trim();
  if(qv){
    const terms=qv.split(/\s+/).filter(Boolean),hits=[];
    Object.keys(catalog).forEach(g=>(catalog[g]||[]).forEach(x=>{const hay=(x.name+' '+worksOf(x.name)+' '+g+' '+(x.equipment||'')).replace(/\s+/g,' ');if(terms.every(t=>hay.includes(t)))hits.push(Object.assign({},x,{__g:g}))}));
    listEl.innerHTML=hits.length?hits.slice(0,60).map(x=>rowHtml(x,pm,true,null)).join(''):'<div class="empty">לא נמצא תרגיל כזה. אפשר ללחוץ ״＋ תרגיל חדש״ למטה.</div>';return}
  const bucket=typeof equipmentBucket==='function'?equipmentBucket(pm.equipment||state.equipment):null;
  const list=(catalog[pm.group]||[]).filter(x=>bucket===null||equipmentBucket(x.equipment)===bucket);
  if(!list.length){listEl.innerHTML='<div class="empty">אין עדיין תרגילים כאן. לחץ ״＋ תרגיל חדש״.</div>';return}
  const fams=new Map(),order=[];
  list.forEach(x=>{const s=stemOf(x.name)||('#'+x.id);if(!fams.has(s)){fams.set(s,[]);order.push(s)}fams.get(s).push(x)});
  const open=state.pickOpen||(state.pickOpen=new Set());
  listEl.innerHTML=order.map(s=>{const m=fams.get(s);
    if(m.length===1)return rowHtml(m[0],pm,false,s[0]==='#'?null:null);
    const has=m.some(x=>x.id===pm.current),isOpen=open.has(s)||has;
    return `<div class="exfam ${isOpen?'open':''}" data-fam="${esc2(s)}"><button type="button" class="exfam-h" onclick="FP2Lib.toggle(this)"><span><b>${esc2(s)}</b> <small>· ${m.length} וריאציות</small></span><span class="chev">‹</span></button><div class="exfam-b">${m.map(x=>rowHtml(x,pm,false,s)).join('')}</div></div>`}).join('');
}
window.FP2Lib.toggle=function(btn){const f=btn.closest('.exfam');if(!f)return;f.classList.toggle('open');const s=f.dataset.fam,o=state.pickOpen||(state.pickOpen=new Set());f.classList.contains('open')?o.add(s):o.delete(s)};
if(typeof window.renderExercisePicker==='function')window.renderExercisePicker=render;
/* picker opens fresh (clears search) */
const op=window.openExercisePicker;if(typeof op==='function')window.openExercisePicker=function(){state.pickQuery='';state.pickFresh=null;return op.apply(this,arguments)};
const opp=window.openPlanExercisePicker;if(typeof opp==='function')window.openPlanExercisePicker=function(){state.pickQuery='';state.pickFresh=null;return opp.apply(this,arguments)};
/* the selected exercise shows what it works */
const ec=window.exerciseChanged;
if(typeof ec==='function')window.exerciseChanged=function(){const r=ec.apply(this,arguments);try{const g=document.getElementById('exerciseGuide'),nm=document.getElementById('exercisePickName');const w=nm&&worksOf(nm.textContent);if(g&&w&&!g.querySelector('.wk2'))g.insertAdjacentHTML('beforeend','<p class="wk2" style="color:#FF8A80;margin:4px 0 0">🔴 עובד על: '+esc2(w)+'</p>')}catch(e){}return r};
})();
