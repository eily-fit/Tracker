/* FitPro 2.13.0 — the intro for a new user: one short screen of basics, then what is special here (✨ רק אצלנו).
   Swipe or "הבא". Shown once after the questionnaire; again from Settings → "🎓 מה יש באפליקציה". */
(function(){
'use strict';
const SL=[
  {basic:true,title:'ככה זה עובד',rows:[['＋','אוכל','כותבים מה אכלת, כמו בוואטסאפ: ״2 ביצים וקוטג׳״.'],['🏋','אימון','בוחרים תרגיל, רושמים משקל וחזרות. יש טיימר מנוחה.'],['📈','התקדמות','משקל, היקף טבור ותמונות. כל שבוע במקום אחד.']],foot:'עד כאן כמו בכל אפליקציה. עכשיו מה שיש רק פה 👈'},
  {title:'אירוע? חוסכים מראש',text:'יש חתונה או מסעדה? שמים ביומן של הטלפון, והאפליקציה מורידה קצת בכל יום לפני. ביום עצמו לוחצים ״התחלתי את האירוע״, והקלוריות נכנסות לעיגול.',art:'event'},
  {title:'היעד מתאזן לבד',text:'לא סיימת אתמול? ההפרש עובר להיום. עברת? היום קצת פחות. 3 ימים ברצף? האפליקציה שואלת מה קרה.',art:'shift'},
  {title:'חגים ושבת',text:'שבוע לפני חג: ״לשמור לך?״. אחרי 3 שבועות האפליקציה יודעת כמה אתה אוכל בשבת. שומר שבת? ממלאים מראש, או שהיא ממלאת לבד.',art:'shabbat'},
  {title:'אוכל כמו שאנחנו אוכלים',text:'״ביצה L״, ״פרוסת לחם״, בלי 20 גרסאות. השמן כבר בתוך המאכל המבושל. מתכון מאתר? מדביקים קישור.',art:'food'},
  {title:'חסר לך משהו? תגיד',text:'בכפתור הפלוס: ״בקשה או רעיון״. כותבים או מקליטים. כשהבקשה מאושרת, מקבלים התראה.',art:'idea',last:true}
];
const css=`#fpIntro{position:fixed;inset:0;z-index:2147482500;background:var(--bg,#0E1217);color:var(--text,#EEF2EA);display:flex;flex-direction:column;padding:calc(env(safe-area-inset-top) + 10px) 0 calc(env(safe-area-inset-bottom) + 14px)}
#fpIntro .top{display:flex;justify-content:space-between;align-items:center;padding:0 18px;min-height:40px}
#fpIntro .skip{background:none;border:0;color:var(--muted,#93A09A);font:inherit;font-size:15px;padding:8px}
#fpIntro .dots{display:flex;gap:6px}#fpIntro .dots i{width:7px;height:7px;border-radius:9px;background:var(--line,#2A333C);transition:width .25s,background .25s}#fpIntro .dots i.on{width:22px;background:var(--brand,#D7F36B)}
#fpIntro .track{flex:1;display:flex;transition:transform .35s cubic-bezier(.2,.8,.2,1);touch-action:pan-y}
#fpIntro .sl{flex:0 0 100%;display:flex;flex-direction:column;justify-content:center;padding:0 24px;box-sizing:border-box;overflow:auto}
#fpIntro .badge{align-self:flex-start;background:var(--brand,#D7F36B);color:#14190a;font-weight:800;font-size:13px;border-radius:99px;padding:5px 12px;margin-bottom:14px}
#fpIntro h2{font-size:28px;line-height:1.2;margin:0 0 12px;text-wrap:balance}
#fpIntro p{font-size:17px;line-height:1.6;margin:0;color:var(--text,#EEF2EA)}
#fpIntro .rows{display:grid;gap:12px;margin-top:6px}#fpIntro .row{display:flex;gap:14px;align-items:flex-start;background:var(--card,#171C22);border:1px solid var(--line,#2A333C);border-radius:16px;padding:14px}
#fpIntro .row .ic{flex:none;width:42px;height:42px;border-radius:12px;background:#222a31;display:grid;place-items:center;font-size:20px}#fpIntro .row b{display:block;font-size:17px;margin-bottom:2px}#fpIntro .row span{color:var(--muted,#93A09A);font-size:15px;line-height:1.45}
#fpIntro .foot{margin-top:18px;color:var(--brand,#D7F36B);font-weight:700;font-size:16px}
#fpIntro .art{height:170px;margin:0 0 22px;border-radius:20px;background:var(--card,#171C22);border:1px solid var(--line,#2A333C);position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;gap:8px;padding:14px;box-sizing:border-box}
#fpIntro .bot{padding:0 24px;display:grid;gap:8px}#fpIntro .go{background:var(--brand,#D7F36B);color:#14190a;border:0;border-radius:16px;font:inherit;font-weight:800;font-size:18px;padding:15px}
/* art */
#fpIntro .day{display:flex;flex-direction:column;align-items:center;gap:6px;font-size:12px;color:var(--muted,#93A09A)}#fpIntro .day .b{width:30px;border-radius:8px;background:#2b343c;position:relative;height:90px;overflow:hidden}#fpIntro .day .b i{position:absolute;left:0;right:0;bottom:0;background:#7FB2FF;border-radius:8px}
#fpIntro .day.ev .b{height:120px}#fpIntro .day.ev .b i{background:var(--brand,#D7F36B)}#fpIntro .day small{font-weight:700;color:var(--text,#EEF2EA);font-size:12px}
#fpIntro .on .day .b i{animation:fpGrow .9s ease both}@keyframes fpGrow{from{transform:translateY(100%)}to{transform:none}}
#fpIntro .chip2{background:#222a31;border-radius:12px;padding:9px 12px;font-size:14px;line-height:1.35}
#fpIntro .col{display:flex;flex-direction:column;gap:8px;align-items:stretch;width:100%}
@media (prefers-reduced-motion:reduce){#fpIntro .track{transition:none}#fpIntro .on .day .b i{animation:none}}`;
function art(k){
  if(k==='event')return `<div class="day"><div class="b"><i style="height:78%"></i></div><small>−240</small>ב׳</div><div class="day"><div class="b"><i style="height:78%"></i></div><small>−240</small>ג׳</div><div class="day"><div class="b"><i style="height:78%"></i></div><small>−240</small>ד׳</div><div class="day"><div class="b"><i style="height:78%"></i></div><small>−240</small>ה׳</div><div class="day ev"><div class="b"><i style="height:100%"></i></div><small>+960</small>🎉 חתונה</div>`;
  if(k==='shift')return `<div class="day"><div class="b"><i style="height:70%;background:#7FB2FF"></i></div><small>2,000</small>אתמול</div><div style="font-size:22px;color:var(--brand,#D7F36B)">←</div><div class="day ev"><div class="b"><i style="height:100%"></i></div><small>2,700</small>היום</div><div class="col" style="width:46%"><div class="chip2">יעד 2,350<br><b style="color:var(--brand,#D7F36B)">+350</b> שלא אכלת אתמול</div></div>`;
  if(k==='shabbat')return `<div class="col"><div class="chip2">🍎 ראש השנה בעוד 5 ימים · <b>לשמור לך?</b></div><div class="chip2">🕯️ שישי בערב: בערך 1,100 · שבת בבוקר: בערך 600</div><div class="chip2">למלא את ארוחות שבת? <b style="color:var(--brand,#D7F36B)">כן, למלא</b></div></div>`;
  if(k==='food')return `<div class="col"><div class="chip2"><b>ביצה L</b> · 60 ג׳ · 86 קל׳</div><div class="chip2"><b>חזה עוף בגריל</b> · כולל 5 ג׳ שמן · <span style="color:var(--brand,#D7F36B)">לשנות</span></div><div class="chip2">🔗 עוגת שוקולד · מנה אחת: <b>410 קל׳</b></div></div>`;
  if(k==='idea')return `<div class="col"><div class="chip2">💡 ״להוסיף קונפטי כששוברים שיא״ · 🎙 0:12</div><div class="chip2">👍 <b>הבקשה שלך אושרה</b><br>״להוסיף קונפטי כששוברים שיא״ נכנסה לטיפול</div></div>`;
  return '';
}
let I=0;
function draw(root){
  root.querySelector('.track').style.transform=`translateX(${I*100}%)`; /* RTL: the next slide comes from the left */
  root.querySelectorAll('.sl').forEach((s,i)=>s.classList.toggle('on',i===I));
  root.querySelectorAll('.dots i').forEach((d,i)=>d.classList.toggle('on',i===I));
  const last=I===SL.length-1;root.querySelector('.go').textContent=last?'יאללה, לרשום ארוחה ראשונה':I===0?'מה מיוחד פה?':'הבא';
  root.querySelector('.skip').style.visibility=last?'hidden':'visible';
}
function close(toAdd){
  const r=document.getElementById('fpIntro');if(r)r.remove();
  try{FP2.setProp('TOUR_DONE','1')}catch(_){}
  try{showView(toAdd?'add':'today');if(toAdd){const q=$('foodQuery');if(q)setTimeout(()=>q.focus(),300)}}catch(_){}
}
window.fpIntro=function(start){
  if(document.getElementById('fpIntro'))return;
  if(!document.getElementById('fpIntroCss'))document.head.insertAdjacentHTML('beforeend',`<style id="fpIntroCss">${css}</style>`);
  I=Math.max(0,Math.min(SL.length-1,Number(start)||0));
  const html=`<div id="fpIntro" role="dialog" aria-label="מה יש באפליקציה" dir="rtl"><div class="top"><div class="dots">${SL.map(()=>'<i></i>').join('')}</div><button type="button" class="skip">דלג</button></div>
    <div class="track">${SL.map(s=>s.basic?`<section class="sl"><h2>${s.title}</h2><div class="rows">${s.rows.map(r=>`<div class="row"><div class="ic">${r[0]}</div><div><b>${r[1]}</b><span>${r[2]}</span></div></div>`).join('')}</div><div class="foot">${s.foot}</div></section>`
      :`<section class="sl"><div class="art">${art(s.art)}</div><div class="badge">✨ רק אצלנו</div><h2>${s.title}</h2><p>${s.text}</p></section>`).join('')}</div>
    <div class="bot"><button type="button" class="go"></button></div></div>`;
  document.body.insertAdjacentHTML('beforeend',html);
  const root=document.getElementById('fpIntro');
  root.querySelector('.go').onclick=()=>{if(I>=SL.length-1)return close(true);I++;draw(root)};
  root.querySelector('.skip').onclick=()=>close(false);
  let x0=null;const tr=root.querySelector('.track');
  tr.addEventListener('touchstart',e=>{x0=e.touches[0].clientX},{passive:true});
  tr.addEventListener('touchend',e=>{if(x0==null)return;const dx=e.changedTouches[0].clientX-x0;x0=null;if(Math.abs(dx)<45)return;if(dx>0&&I<SL.length-1)I++;else if(dx<0&&I>0)I--;draw(root)},{passive:true});
  draw(root);
};
})();
