/* FitPro 2.22.0 — the workout area, new layout:
   one row on top: כוח / ריצה / אירובי (a colored dot for each) + "שלי" + "יומן";
   a small 7-day strip under it (done = full dot, planned = ring); "מומלץ להיום" first in every tab (can be turned off);
   the journal = a card for every week → tap a week for its timeline → tap a workout to see or edit it, with a small filter;
   Settings → "אימונים: כוח, ריצה, אירובי": the weekly plan (on/off, fixed or new every week, which day to ask) and a page for each type.
   Colors: strength green, run blue, cardio orange. Line icons instead of emoji. */
(function(){
'use strict';
const prop=k=>{try{return FP2.getProp(k)||''}catch(_){return ''}};
const setProp=(k,v)=>{try{FP2.setProp(k,v)}catch(_){}};
const J=(k,d)=>{try{const v=JSON.parse(prop(k)||'null');return v==null?d:v}catch(_){return d}};
const LS={get(k){try{return localStorage.getItem(k)}catch(_){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(_){}}};
const iso=d=>d.toISOString().slice(0,10);
const D=s=>new Date(s+'T12:00:00');
const addDays=(s,n)=>{const d=D(s);d.setDate(d.getDate()+n);return iso(d)};
const today=()=>state.todayDate||state.date||iso(new Date());
const dow=s=>D(s).getDay();
const weekStart=s=>addDays(s,-dow(s));
const daysBetween=(a,b)=>Math.round((D(b)-D(a))/864e5);
const mmss=x=>Math.floor(x/60)+':'+String(Math.round(x%60)).padStart(2,'0');
const sec=s=>{const m=String(s||'').trim().match(/^(\d{1,3})[:.](\d{1,2})$/);return m?(+m[1])*60+(+m[2]):null};
const W=['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳'],DN=['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
const TN={s:'כוח',r:'ריצה',c:'אירובי'},TYPES=['s','r','c'];
const dd=s=>s.slice(8,10).replace(/^0/,'')+'.'+s.slice(5,7).replace(/^0/,'');
const kmTxt=k=>String(Math.round((Number(k)||0)*10)/10);

/* ---------- line icons ---------- */
const P={
  home:'<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
  food:'<path d="M7 3v8M5 3v5a2 2 0 004 0V3M7 11v10"/><path d="M17 3c-2 2-2 6 0 8v10"/>',
  dumb:'<path d="M6 8v8M3 10v4M18 8v8M21 10v4M6 12h12"/>',
  chart:'<path d="M4 19h16"/><path d="M6 15l4-5 4 3 5-7"/>',
  more:'<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
  star:'<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  book:'<path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2z"/><path d="M4 19V5"/>',
  chev:'<path d="M15 6l-6 6 6 6"/>',back:'<path d="M9 6l6 6-6 6"/>',
  filter:'<path d="M4 6h16M7 12h10M10 18h4"/>',
  play:'<path d="M8 5v14l11-7z"/>',plus:'<path d="M12 5v14M5 12h14"/>',
  cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 01-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 010-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 014 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 010 4h-.1a1.7 1.7 0 00-1.5 1z"/>',
  film:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M10 9.5v5l4.5-2.5z"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  cam:'<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',scale:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8.5 10a4 4 0 017 0"/><path d="M12 10l1.2-1.6"/>',
  bolt:'<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>',chat:'<path d="M4 5h16v11H9l-5 4z"/>',gift:'<rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M12 9v11M4 13h16"/><path d="M12 9c-2-4-6-4-6-1.5S10 9 12 9c2 0 6 0 6-1.5S14 5 12 9z"/>',folder:'<path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>'
};
const ic=(n,cls)=>`<svg class="ic${cls?' '+cls:''}" viewBox="0 0 24 24" aria-hidden="true">${P[n]||''}</svg>`;
window.fpIc=ic;
const PLUS_IC={event:'cal',calendar:'cal',mealPhoto:'cam',food:'plus',weight:'scale',workout:'dumb',whatToEat:'food',checkin:'check',shortcuts:'bolt',request:'chat',treat:'gift'};
window.fpPlusIc=id=>PLUS_IC[id]?ic(PLUS_IC[id]):'';
const dot=(t,ring)=>`<i class="fpDot ${t}${ring?' hol':''}" aria-hidden="true"></i>`;
window.fpDot=dot;

document.head.insertAdjacentHTML('beforeend',`<style id="fp222css">
:root{--cS:#D7F36B;--cR:#7CC4FF;--cC:#FFB86B}
.plus-item b svg.ic{color:#D7F36B;width:22px;height:22px}
svg.ic{width:20px;height:20px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;flex:none;display:inline-block;vertical-align:middle}
.fpDot{display:inline-block;width:8px;height:8px;border-radius:50%;flex:none;vertical-align:middle}.fpDot.s{background:var(--cS)}.fpDot.r{background:var(--cR)}.fpDot.c{background:var(--cC)}
.fpDot.hol{background:none!important;border:1.5px solid}.fpDot.hol.s{border-color:var(--cS)}.fpDot.hol.r{border-color:var(--cR)}.fpDot.hol.c{border-color:var(--cC)}
#fp221Tabs,#fp221Week{display:none!important}
#workoutHome .sub-tabs,#workoutLibrary .sub-tabs,#workoutDiary .sub-tabs{display:none!important}
#workoutLibrary>h2,#workoutDiary>h2{display:none}
#fpHdr{display:flex;gap:6px;align-items:center;margin:0 0 18px}
#fpHdr .seg{flex:1;min-width:0;display:flex;background:#1F262E;border:1px solid var(--line,#2C3640);border-radius:13px;padding:3px;gap:2px}
#fpHdr .seg button{flex:1;min-width:0;font:inherit;font-weight:700;font-size:14px;border:0;background:none;color:var(--muted,#A3ADB8);border-radius:10px;padding:8px 2px;display:flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap;cursor:pointer}
#fpHdr .seg button.on{background:var(--brand,#D7F36B);color:#14190a}#fpHdr .seg button.on .fpDot{background:#14190a}
#fpHdr .seg.one .lone{flex:1;display:flex;align-items:center;justify-content:center;gap:7px;font-weight:800;font-size:15px;padding:8px 2px;color:var(--ink,#F2F5F7)}
#fpStrip[hidden]{display:none!important}
.fpWhy{background:rgba(0,0,0,.18);border-radius:10px;padding:7px 10px;font-size:12.5px;color:var(--muted,#A3ADB8);margin:0 0 8px;line-height:1.5}
.fpWhy b{color:var(--ink,#F2F5F7);font-weight:700}
.fpIb{width:42px;height:42px;border-radius:12px;background:#1F262E;border:1px solid var(--line,#2C3640);color:var(--ink,#F2F5F7);display:grid;place-items:center;flex:none;position:relative;cursor:pointer;padding:0}
.fpIb small{position:absolute;bottom:-16px;left:50%;transform:translateX(-50%);font-size:10px;color:var(--muted,#A3ADB8);white-space:nowrap}
.fpIb.on{border-color:var(--brand,#D7F36B);color:var(--brand,#D7F36B)}
#fpStrip{margin:0 0 12px}
#fpStrip .days{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px}
#fpStrip .days button{font:inherit;background:var(--card,#171C22);border:1px solid var(--line,#2C3640);color:inherit;border-radius:11px;padding:5px 0 6px;text-align:center;cursor:pointer;min-width:0}
#fpStrip .days button span{display:block;font-size:11.5px;color:var(--muted,#A3ADB8)}#fpStrip .days button.now{border-color:var(--brand,#D7F36B)}#fpStrip .days button.now span{color:var(--ink,#F2F5F7);font-weight:700}
#fpStrip .days .dts{display:flex;gap:3px;justify-content:center;min-height:10px;margin-top:3px;align-items:center}#fpStrip .days .dts em{font-style:normal;color:#46525F;font-size:11px;line-height:1}
#fpStrip .line{display:flex;justify-content:space-between;gap:8px;font-size:12.5px;color:var(--muted,#A3ADB8);margin:6px 2px 0}
.fpCard{background:var(--card,#171C22);border:1px solid var(--line,#2C3640);border-radius:16px;padding:12px 14px;margin:0 0 12px}
.fpCard h3{margin:0 0 6px;font-size:16.5px}.fpCard .mu{color:var(--muted,#A3ADB8);font-size:13px}
.fpReco{border-color:#3A4A22;background:linear-gradient(160deg,#222D17,#171C22)}
.fpReco .big{font-size:21px;font-weight:800;margin:2px 0 4px;display:flex;align-items:center;gap:8px}
.f21 .sec.reco{border-color:#3A4A22;background:linear-gradient(160deg,#222D17,#171C22)}
#fpPrompt .fpCard{border-color:var(--brand,#D7F36B)}
.mhd{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:8px;margin:0 0 12px}.mhd b{text-align:center;font-size:17px}.mhd .linkish,.mhd button{font:inherit;background:none;border:0;color:var(--muted,#A3ADB8);cursor:pointer;padding:6px 0}
.f21 .tiles,.fpTiles{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:4px 0 8px}
.f21 .tile,.fpTiles .tile{font:inherit;color:inherit;text-align:right;border-radius:14px;padding:12px;min-height:72px;display:flex;flex-direction:column;justify-content:space-between;border:1px solid var(--line,#2C3640);background:#1F262E;cursor:pointer}
.f21 .tile b,.fpTiles .tile b{font-size:15px}.f21 .tile small,.fpTiles .tile small{color:var(--muted,#A3ADB8);font-size:12px}.f21 .tile.on,.fpTiles .tile.on{border-color:var(--brand,#D7F36B);background:#222D17}
.f21 .cards{display:grid;gap:8px;margin:6px 0}.f21 .card2{display:flex;justify-content:space-between;align-items:center;gap:10px;background:#1F262E;border:1px solid var(--line,#2C3640);border-radius:14px;padding:10px 12px}
.f21 .card2 b{display:block;font-size:15px}.f21 .card2 small{display:block;color:var(--muted,#A3ADB8);font-size:12px}.f21 .card2 .acts{display:flex;flex-direction:column;gap:6px;flex:none}.f21 .card2 .acts .btn{padding:8px 14px;min-height:0}
.f21 .gb .here{position:absolute;top:16px;transform:translateX(50%);width:2px;height:12px;background:var(--cR)}.f21 .gb .here span{position:absolute;top:13px;left:50%;transform:translateX(-50%);font-size:10.5px;color:var(--cR);white-space:nowrap;font-weight:700}
.f21 .gb{margin-bottom:22px}
.tprog{height:8px;background:#2C3640;border-radius:6px;overflow:hidden;margin:6px 0}.tprog i{display:block;height:100%;background:var(--brand,#D7F36B);transition:width .4s linear}
.btn.stopb,#fpTSheet .btn.stopb{background:rgba(240,149,149,.16)!important;border:1.5px solid #F09595!important;color:#FFFFFF!important;font-weight:800}
#fpCarFloat{position:fixed;left:12px;right:12px;bottom:calc(76px + env(safe-area-inset-bottom));z-index:60;background:#1F262E;border:1px solid var(--cC);border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,.45);overflow:hidden;direction:rtl}
#fpCarFloat .fl{display:flex;justify-content:space-between;align-items:center;gap:10px;width:100%;background:none;border:0;color:inherit;font:inherit;padding:10px 14px;cursor:pointer;text-align:right}
#fpCarFloat .fl small{display:block;color:var(--muted,#A3ADB8);font-size:12px}#fpCarFloat .t{font-size:22px;font-variant-numeric:tabular-nums}
#fpCarFloat .pr{display:block;height:4px;background:#2C3640}#fpCarFloat .pr i{display:block;height:100%;background:var(--cC)}
.f21 .stp,.fpStp{display:flex;align-items:center;gap:8px}.f21 .stp button,.fpStp button{width:34px;height:34px;border-radius:10px;border:1px solid var(--line,#2C3640);background:#1F262E;color:inherit;font:700 17px inherit;cursor:pointer}.f21 .stp b,.fpStp b{min-width:20px;text-align:center;font-size:16px}
.f21 .linkb,.linkb{font:inherit;background:none;border:0;color:var(--brand,#D7F36B);font-weight:700;cursor:pointer;padding:4px 0}
.f21 .sec.planc{background:linear-gradient(160deg,#1E2A33,#171C22)}
.f21 .md .fpMd{margin-bottom:4px}
/* week editor */
.fpWd{display:grid;grid-template-columns:44px 1fr auto;gap:8px;align-items:center;padding:7px 0;border-bottom:1px solid var(--line,#2C3640)}.fpWd:last-child{border:0}.fpWd>i{font-style:normal;font-weight:700;color:var(--muted,#A3ADB8)}
.fpChips{display:flex;gap:6px;flex-wrap:wrap}.fpChips button{font:inherit;font-size:13px;border:1px solid var(--line,#2C3640);background:#1F262E;color:var(--muted,#A3ADB8);border-radius:99px;padding:5px 11px;cursor:pointer;display:inline-flex;align-items:center;gap:6px}
.fpChips button.on{background:#26301A;color:var(--ink,#F2F5F7);border-color:#4B5A2A}
.fpSeg{display:flex;background:#1F262E;border:1px solid var(--line,#2C3640);border-radius:12px;padding:3px;gap:3px;margin:0 0 10px}.fpSeg button{flex:1;font:inherit;font-size:14px;border:0;background:none;color:var(--muted,#A3ADB8);border-radius:9px;padding:8px 4px;cursor:pointer}.fpSeg button.on{background:#2B3A1B;color:var(--brand,#D7F36B);font-weight:700}
.fpK{font-size:11px;border-radius:99px;padding:2px 8px;white-space:nowrap}.fpK.e{background:rgba(110,231,135,.12);color:#6EE787}.fpK.h{background:rgba(255,138,128,.14);color:#FF8A80}
.fpNote{background:#1F262E;border-radius:12px;padding:8px 10px;font-size:13px;color:var(--muted,#A3ADB8);margin-top:8px;line-height:1.5}
.fpRow{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--line,#2C3640)}.fpRow:last-child{border:0}
.fpRowBtn{display:flex;justify-content:space-between;align-items:center;gap:10px;width:100%;font:inherit;color:inherit;background:none;border:0;border-bottom:1px solid var(--line,#2C3640);padding:12px 2px;text-align:right;cursor:pointer}.fpRowBtn:last-child{border:0}
.fpRowBtn small{display:block;color:var(--muted,#A3ADB8);font-size:12.5px;margin-top:2px}.fpRowBtn .ic{color:var(--muted,#A3ADB8)}
.fpSw{position:relative;width:46px;height:28px;flex:none}.fpSw input{opacity:0;width:100%;height:100%;margin:0;position:absolute;inset:0;cursor:pointer;z-index:1}
.fpSw span{position:absolute;inset:0;border-radius:99px;background:#2C3640;transition:.2s}.fpSw span::after{content:"";position:absolute;top:3px;right:3px;width:22px;height:22px;border-radius:50%;background:#A3ADB8;transition:.2s}
.fpSw input:checked+span{background:#4B5A2A}.fpSw input:checked+span::after{right:21px;background:var(--brand,#D7F36B)}.fpSw input:focus-visible+span{outline:2px solid var(--brand,#D7F36B)}
.fpHint{color:#6B7682;font-size:12px;margin-top:6px}
/* journal */
#fpJ .jhd{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:8px;margin:0 0 10px}#fpJ .jhd b{text-align:center;font-size:17px}#fpJ .jhd button{font:inherit;background:none;border:0;color:var(--muted,#A3ADB8);cursor:pointer;padding:6px 0;display:inline-flex;align-items:center;gap:4px}
#fpJ .jhd button.on{color:var(--brand,#D7F36B)}
#fpJ .jhd button.jback{color:var(--ink,#F2F5F7);background:#1F262E;border:1px solid var(--line,#2C3640);border-radius:10px;padding:6px 10px}
#fpJ .jall{display:flex;width:100%;justify-content:center;align-items:center;gap:7px;font:inherit;font-weight:800;font-size:14.5px;color:var(--brand,#D7F36B);background:#26301A;border:1px solid #4B5A2A;border-radius:13px;padding:11px;margin:0 0 12px;cursor:pointer}
#fpJ .flt{background:var(--card,#171C22);border:1px solid var(--line,#2C3640);border-radius:14px;padding:10px 12px;margin:0 0 10px}
#fpJ .wc{display:block;width:100%;font:inherit;color:inherit;text-align:right;background:var(--card,#171C22);border:1px solid var(--line,#2C3640);border-radius:16px;margin:0 0 10px;overflow:hidden;padding:0;cursor:pointer}
#fpJ .wc .hd{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:#1F262E}#fpJ .wc .hd b{font-size:14.5px;display:block}#fpJ .wc .hd small{color:var(--muted,#A3ADB8);font-size:12px}
#fpJ .wc .bars{display:flex;gap:3px;align-items:flex-end;height:20px}#fpJ .wc .bars i{display:block;width:6px;border-radius:3px;min-height:3px}
#fpJ .wc .ln{display:grid;grid-template-columns:24px 12px 1fr auto;gap:6px;align-items:center;padding:8px 12px;border-top:1px solid var(--line,#2C3640);font-size:13.5px}
#fpJ .wc .ln .dn{color:var(--muted,#A3ADB8);font-weight:700}#fpJ .wc .ln .v{font-weight:800;font-variant-numeric:tabular-nums}#fpJ .wc .ln span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#fpJ .tl{position:relative;padding-inline-start:20px}#fpJ .tl::before{content:"";position:absolute;right:6px;top:6px;bottom:6px;width:2px;background:var(--line,#2C3640)}
#fpJ .dlab{font-size:12px;color:var(--muted,#A3ADB8);margin:10px 0 5px;font-weight:700}
#fpJ .e{position:relative;display:flex;justify-content:space-between;align-items:center;gap:8px;width:100%;font:inherit;color:inherit;text-align:right;background:var(--card,#171C22);border:1px solid var(--line,#2C3640);border-radius:12px;padding:9px 11px;margin:0 0 6px;cursor:pointer}
#fpJ .e::before{content:"";position:absolute;right:-20px;top:14px;width:12px;height:12px;border-radius:50%;border:2px solid var(--bg,#0E1217)}
#fpJ .e.s::before{background:var(--cS)}#fpJ .e.r::before{background:var(--cR)}#fpJ .e.c::before{background:var(--cC)}
#fpJ .e b{font-size:14px}#fpJ .e small{display:block;color:var(--muted,#A3ADB8);font-size:12px}#fpJ .e .n{font-weight:800;font-variant-numeric:tabular-nums;white-space:nowrap}
#fpJ .tag{font-size:11px;border-radius:99px;padding:1px 7px;background:#26301A;color:var(--brand,#D7F36B);margin-inline-start:4px}
#workoutDiary.fpJon>*:not(#fpJ):not(.fpJkeep){display:none!important}
#fpLibHd{margin:0 0 6px}
#workoutPlans .plan-line{background:#1F262E;border:1px solid var(--line,#2C3640);border-radius:14px;padding:12px;margin:0 0 8px}
</style>`);

/* ---------- data ---------- */
const TP=()=>J('TRAIN_PLAN',null)||{};
const runLog=()=>J('RUN_LOG',[]),carLog=()=>J('CARDIO_LOG',[]);
const sessions=()=>((state.data&&state.data.workout&&state.data.workout.sessions)||[]);
const isCardioS=s=>s.type==='אירובי'||/^ריצה$|^אירובי$/.test(s.name||'');
const strSessions=()=>sessions().filter(s=>!isCardioS(s)&&(s.items||[]).length);
const RECO=()=>{const r=J('RECO',null)||{};return {s:r.s!==0,r:r.r!==0,c:r.c!==0}};
/* 2.23: which types are shown (Settings). Hiding deletes nothing; the last one shown stays locked. */
const ON=()=>{const o=J('TYPES_ON',null)||{};const r={s:o.s!==0,r:o.r!==0,c:o.c!==0};if(!r.s&&!r.r&&!r.c)r.s=true;return r};
const VT=()=>{const o=ON();return TYPES.filter(t=>o[t])};
const vis=d=>(d||[]).filter(t=>ON()[t]);
window.fpTypesOn=ON;
/* 2.23: the week strip without a weekly plan only when asked for in Settings */
const stripFree=()=>prop('STRIP_FREE')==='1';
const ciDay=()=>{try{return typeof checkinDay==='function'?checkinDay():5}catch(_){return 5}};
function doneWeek(ws){const we=addDays(ws,6),inW=d=>d&&d>=ws&&d<=we,out=W.map(()=>[]);
  strSessions().forEach(s=>{if(inW(s.date))out[dow(s.date)].push('s')});runLog().forEach(r=>{if(inW(r.d))out[dow(r.d)].push('r')});carLog().forEach(r=>{if(inW(r.d))out[dow(r.d)].push('c')});return out}

/* ---------- the weekly plan: {plan:'fixed'|'weekly'|'none', days, askDay ('ci' or 0–6), weeks:{ws:days}} ---------- */
function autoDays(){try{return fpW._.weekPlan().days}catch(_){return W.map(()=>[])}}
function wpGet(){const w=J('WEEK_PLAN',null)||{};const plan=w.plan||(w.mode==='F'?'none':'fixed');const days=Array.isArray(w.days)&&w.days.length===7?w.days:autoDays();
  return {plan,days:days.map(d=>d.slice()),askDay:w.askDay==null?'ci':w.askDay,weeks:w.weeks||{},auto:!J('WEEK_PLAN',null)}}
function wpSave(w){const o={plan:w.plan,mode:w.plan==='none'?'F':'P',days:w.days,askDay:w.askDay,weeks:w.weeks||{}};const ks=Object.keys(o.weeks).sort();ks.slice(0,Math.max(0,ks.length-8)).forEach(k=>delete o.weeks[k]);setProp('WEEK_PLAN',JSON.stringify(o))}
const askIdx=w=>w.askDay==='ci'?ciDay():Number(w.askDay)||0;
/* which week the next "plan your week" is for: asked on Sunday → this week, later in the week → next week */
function targetWeek(w){const t=today(),ws=weekStart(t),a=askIdx(w);return a===0?ws:dow(t)>=a?addDays(ws,7):null}
/* weekly mode: the days of this week come from weeks[this week] when it was planned */
function syncWeek(){const w=wpGet();if(w.plan!=='weekly')return w;const cur=w.weeks[weekStart(today())];if(cur&&JSON.stringify(cur)!==JSON.stringify(w.days)){w.days=cur;wpSave(w)}return w}
function needsPlan(){const w=wpGet();if(w.plan!=='weekly')return null;const tw=targetWeek(w);if(!tw)return null;return w.weeks[tw]?null:tw}
/* keep the counts in the plans the same as the days */
function syncCounts(days){const n={s:0,r:0,c:0};days.forEach(d=>d.forEach(t=>n[t]++));const t=TP();t.want=Array.isArray(t.want)?t.want:[];
  const map={s:'str',r:'run',c:'car'};TYPES.forEach(k=>{if(n[k]&&!t.want.includes(map[k]))t.want.push(map[k])});
  if(n.s)t.str=n.s;if(n.c){t.car=n.c;t.carGoal=n.c}if(n.r)t.run=n.r;setProp('TRAIN_PLAN',JSON.stringify(t));
  if(n.r){const p=J('RUN_PLAN',null);if(p&&Number(p.runs)!==n.r){p.runs=Math.min(5,n.r);setProp('RUN_PLAN',JSON.stringify(p))}}
  if(n.c&&!J('CARDIO_LVL',null)){const ws=weekStart(today());setProp('CARDIO_LVL',JSON.stringify({lvl:'beg',since:ws}))}}

/* ---------- the week editor (Settings, the strip, the reminder) ---------- */
let ED=null;
function hardMaxes(){let r=0,c=1;try{const p=fpT.plan();r=p&&p.m3?1:0}catch(_){}try{const cw=fpW._.carWeek();c=cw.sessions.filter(x=>x.k==='h').length}catch(_){}return [r,c]}
function daysHtml(days0,fn){const [hr,hc]=hardMaxes(),days=days0.map(vis),L=FPW.label(days,hr,hc),vt=VT();
  return `<div>${days.map((d,i)=>`<div class="fpWd"><i>${W[i]}</i><div class="fpChips">${vt.map(t=>`<button type="button" class="${d.includes(t)?'on':''}" aria-pressed="${d.includes(t)}" onclick="${fn}(${i},'${t}')">${dot(t)}${TN[t]}${t==='s'&&i===L.legs?' · רגליים':''}</button>`).join('')}</div>${!d.length?'<span class="mu" style="font-size:12px">מנוחה</span>':d.some(t=>t!=='s')?(L.hard[i]?'<span class="fpK h">חזק</span>':'<span class="fpK e">קל</span>'):'<span></span>'}</div>`).join('')}</div>
    ${L.warn.length?L.warn.map(w=>`<div class="fpNote">${w}</div>`).join(''):''}<p class="mu" style="margin:8px 0 0;font-size:12.5px">${[L.cnt.s?L.cnt.s+' כוח':'',L.cnt.r?L.cnt.r+' ריצה':'',L.cnt.c?L.cnt.c+' אירובי':''].filter(Boolean).join(' · ')||'עוד לא בחרת'}. רגליים = יום הכוח הראשון. קל או חזק נקבע לפי הכללים.</p>`}
function autoBuild(){const t=TP(),p=J('RUN_PLAN',null),want=Array.isArray(t.want)?t.want:[],o=ON();const S=o.s&&want.includes('str')?Number(t.str)||3:0,R=o.r&&(want.includes('run')||p)?Number((p&&p.runs)||t.run)||2:0,C=o.c&&want.includes('car')?Number(t.car)||2:0;const [hr,hc]=hardMaxes();return FPW.build(S,R,C,hr&&R>=2?1:0,hc)}
/* keep the days of hidden types when the visible ones are rebuilt */
function keepHidden(prev,next){const o=ON();return next.map((d,i)=>d.concat(((prev&&prev[i])||[]).filter(t=>!o[t]&&!d.includes(t))))}
function weekSheet(){const T=fpT._,w=ED;const tw=needsPlan()||targetWeek(w)||weekStart(today());
  let b=`<div class="fpCard"><div class="fpRow" style="padding-top:0"><span><b>תוכנית שבועית</b><br><span class="mu">בוחרים מראש איזה יום מה</span></span><label class="fpSw"><input type="checkbox" ${w.plan!=='none'?'checked':''} onchange="fp222.ed.set('plan',this.checked?'fixed':'none')" aria-label="תוכנית שבועית"><span></span></label></div>`;
  if(w.plan==='none')b+=`<p class="mu" style="margin:6px 0 0">בלי תוכנית. כל יום עושים מה שבא לך, ו״מומלץ להיום״ מציע לפי מה שכבר עשית השבוע.</p></div>
    <div class="fpCard"><div class="fpRow" style="padding:0"><span><b>פס השבוע בכל זאת</b><br><span class="mu">רק מה שעשית בפועל, בלי תכנון</span></span>${sw(stripFree(),"fp222.stripFree(this.checked)",'פס שבוע בלי תוכנית')}</div></div>`;
  else{b+=`<div class="fpSeg" role="group" style="margin-top:8px"><button type="button" class="${w.plan==='fixed'?'on':''}" onclick="fp222.ed.set('plan','fixed')">קבועה</button><button type="button" class="${w.plan==='weekly'?'on':''}" onclick="fp222.ed.set('plan','weekly')">משתנה כל שבוע</button></div>
      <p class="mu" style="margin:0">${w.plan==='fixed'?'אותם ימים כל שבוע.':'כל שבוע בוחרים מחדש. האפליקציה תזכיר לך ביום שתבחר.'}</p></div>`;
    if(w.plan==='weekly')b+=`<div class="fpCard"><h3>באיזה יום לשאול אותך?</h3><div class="fpChips"><button type="button" class="${w.askDay==='ci'?'on':''}" onclick="fp222.ed.set('askDay','ci')">ביום הצ׳ק-אין (${DN[ciDay()]})</button>${W.map((n,i)=>`<button type="button" class="${w.askDay!=='ci'&&Number(w.askDay)===i?'on':''}" onclick="fp222.ed.set('askDay',${i})">${DN[i]}</button>`).join('')}</div>
      <p class="mu" style="margin:8px 0 0">${askIdx(w)===0?'ביום ראשון בוחרים את השבוע הזה.':'ביום '+DN[askIdx(w)]+' בוחרים את השבוע הבא.'}</p></div>`;
    b+=`<div class="fpCard"><h3>${w.plan==='fixed'?'מה עושים בכל יום':'השבוע '+(tw===weekStart(today())?'הזה':'הבא')+' ('+dd(tw)+')'}</h3><p class="mu" style="margin:0 0 6px">לוחצים על מה שעושים באותו יום. אפשר יותר מאחד. בלי כלום = מנוחה.</p>${daysHtml(w.days,'fp222.ed.tog')}
      <button type="button" class="btn light full" style="margin-top:10px" onclick="fp222.ed.auto()">תציע לי (אחר כך אפשר להזיז)</button></div>`}
  b+=`<button type="button" class="btn full" onclick="fp222.ed.save()">שמור</button>`;
  T.sheet('תוכנית שבועית',b)}
const ed={
  open(){const w=wpGet();ED=w;if(w.plan==='weekly'){const tw=needsPlan()||weekStart(today());if(w.weeks[tw])ED.days=w.weeks[tw].map(d=>d.slice())}weekSheet()},
  set(k,v){ED[k]=v;if(k==='plan'&&v!=='none'&&!ED.days.some(d=>vis(d).length))ED.days=keepHidden(ED.days,autoBuild());weekSheet()},
  tog(i,t){if(!ON()[t])return;const a=ED.days[i],j=a.indexOf(t);if(j>=0)a.splice(j,1);else{if(vis(a).length>=3){const k=a.findIndex(x=>ON()[x]);if(k>=0)a.splice(k,1)}a.push(t)}weekSheet()},
  auto(){ED.days=keepHidden(ED.days,autoBuild());weekSheet()},
  save(){const w=ED,ws=weekStart(today());if(w.plan==='weekly'){const tw=needsPlan()||targetWeek(w)||ws;w.weeks=w.weeks||{};const dz=w.days.map(d=>d.slice());w.weeks[tw]=dz;if(!w.weeks[ws])w.weeks[ws]=dz.map(d=>d.slice());w.days=w.weeks[ws].map(d=>d.slice())}
    wpSave(w);if(w.plan!=='none')syncCounts(w.days);ED=null;fpT.close();try{toast('התוכנית עודכנה')}catch(_){}refreshAll()}
};

/* ---------- the top of the workout screen ---------- */
function hdrHtml(){const vt=VT();let t=(window.fpW&&fpW.cur)||'s';if(!vt.includes(t))t=vt[0];const mine=t!=='s'&&fpW.isMine&&fpW.isMine(t);
  return `${vt.length>1?`<div class="seg" role="tablist" aria-label="סוג אימון">${vt.map(k=>`<button type="button" role="tab" aria-selected="${k===t}" class="${k===t?'on':''}" onclick="fp222.tab('${k}')">${dot(k)}${TN[k]}</button>`).join('')}</div>`:`<div class="seg one"><span class="lone">${dot(t)}${TN[t]}</span></div>`}
    <button type="button" class="fpIb${mine?' on':''}" aria-pressed="${!!mine}" onclick="fp222.mine()" aria-label="שלי">${ic('star')}<small>שלי</small></button>
    <button type="button" class="fpIb" onclick="fp222.journal()" aria-label="יומן">${ic('book')}<small>יומן</small></button>`}
const stripOn=()=>wpGet().plan!=='none'||stripFree();
function stripHtml(){const ws=weekStart(today()),done=doneWeek(ws).map(vis),w=syncWeek(),plan=w.plan!=='none',td=dow(today());w.days=w.days.map(vis);
  const cnt=done.reduce((n,d)=>n+d.length,0);let nxt='';if(plan){for(let k=0;k<7;k++){const i=(td+k)%7;if(i<td)continue;const left=w.days[i].filter(t=>!done[i].includes(t));if(left.length&&(k>0||!done[i].length)){nxt=(k===0?'היום':'יום '+W[i])+': '+left.map(t=>TN[t]).join(' + ');break}}}
  return `<div class="days">${W.map((n,i)=>{const dn=done[i],pl=plan?w.days[i].filter(t=>!dn.includes(t)):[];const ds=dn.map(t=>dot(t)).concat(pl.map(t=>dot(t,1))).join('');
    return `<button type="button" class="${i===td?'now':''}" onclick="fp222.day(${i})" aria-label="יום ${DN[i]}${dn.length?', עשית '+dn.map(t=>TN[t]).join(' ו'):''}${pl.length?', מתוכנן '+pl.map(t=>TN[t]).join(' ו'):''}"><span>${n}</span><div class="dts">${ds||'<em>·</em>'}</div></button>`}).join('')}</div>
    <div class="line"><span>השבוע: ${cnt} ${cnt===1?'אימון':'אימונים'}</span><span>${plan?(nxt||'סיימת את השבוע'):'בלי תוכנית שבועית'}</span></div>`}
function promptHtml(){const tw=needsPlan();if(!tw)return '';
  return `<div class="fpCard"><b>הגיע הזמן לתכנן את ${tw===weekStart(today())?'השבוע':'השבוע הבא'}</b><p class="mu" style="margin:4px 0 8px">איזה יום כוח, ריצה או אירובי. דקה אחת.</p><button type="button" class="btn full" onclick="fp222.ed.open()">לתכנן</button></div>`}
/* strength: the category not done for the longest time (push / pull / legs and anything else done lately) */
function catLast(){const cats=['רגליים','משיכה','דחיפה'],last={};const S=strSessions();
  S.forEach(s=>{const n=String(s.type||'')+' '+String(s.name||'');(typeof LIBRARY_CATEGORIES!=='undefined'?LIBRARY_CATEGORIES:cats).forEach(c=>{if(n.includes(c)){if(!last[c]||s.date>last[c])last[c]=s.date;if(!cats.includes(c)&&daysBetween(s.date,today())<=30)cats.push(c)}})});
  return cats.map(c=>[c,last[c]||'']).sort((a,b)=>(a[1]||'0').localeCompare(b[1]||'0'))}
/* 2.23: the recommendation follows the number of strength workouts a week you chose, and says why */
function strReco(){const w=wpGet(),td=dow(today()),ws=weekStart(today()),plan=w.plan!=='none',done=doneWeek(ws),T=TP();
  const N=plan?w.days.filter(d=>d.includes('s')).length:(Number(T.str)||0),D=done.filter(d=>d.includes('s')).length,R=Math.max(0,N-D),L=7-td;
  const yS=td>0?done[td-1].includes('s'):strSessions().some(s=>s.date===addDays(today(),-1));
  const [c,l]=catLast()[0],ago=l?daysBetween(l,today()):-1,cat=ago<0?'עוד לא עשית '+c+'.':ago===0?'':ago===1?c+': פעם אחרונה אתמול.':c+': לא עשית '+ago+' ימים.';
  const wk=N?`השבוע: <b>${D} מתוך ${N}</b>`:'';
  if(done[td].includes('s'))return {k:'done',c,why:wk?wk+'. מחר ממשיכים.':'מחר ממשיכים.'};
  if(!N)return {k:'go',c,why:`לא בחרת כמה אימוני כוח בשבוע, אז ההמלצה לפי מה שלא עשית הכי הרבה זמן. ${cat}`};
  if(!R)return {k:'rest',c,why:`השבוע עשית <b>${D} מתוך ${N}</b>, כל מה שתכננת. היום מנוחה, או אימון נוסף אם בא לך.`};
  if(plan){const left=[];for(let i=td+1;i<7;i++)if(w.days[i].includes('s'))left.push(i);
    if(w.days[td].includes('s'))return {k:'go',c,why:`היום יום כוח בתוכנית. ${wk}. ${cat}`};
    if(R>left.length)return {k:'go',c,why:`${wk}, ונשארו השבוע רק ${left.length} ${left.length===1?'יום כוח':'ימי כוח'} בתוכנית. כדי להגיע ל-${N} כדאי להשלים היום.`};
    return {k:'rest',c,why:`היום לא יום כוח בתוכנית. ${wk}. ${left.length?'האימון הבא: יום '+DN[left[0]]+'.':''}`}}
  /* no plan: spread what is left over the days that are left, one day apart when possible */
  if(R>=L)return {k:'go',c,why:`${wk}. נשארו ${R} אימונים ו-${L} ${L===1?'יום':'ימים'} עד סוף השבוע, אז היום אימון.`};
  if(yS&&R<=Math.ceil((L-1)/2))return {k:'rest',c,why:`אתמול עשית כוח. ${wk}, ונשארו ${R} אימונים ב-${L-1} הימים שאחרי היום. יש מספיק זמן, אז היום אפשר לנוח.`};
  return {k:'go',c,why:`${wk}. נשארו ${R} אימונים ו-${L} ימים${yS?'. אתמול עשית כוח, אבל כדי להספיק כדאי גם היום':''}. ${cat}`}}
function strRecoHtml(){if(!RECO().s||!ON().s)return '';const r=strReco(),c=r.c;
  const why=`<div class="fpWhy">${r.why}</div>`;
  if(r.k==='done')return `<div class="fpCard fpReco"><span class="mu">מומלץ להיום</span><div class="big">${dot('s')}עשית כוח היום</div>${why}</div>`;
  if(r.k==='rest')return `<div class="fpCard fpReco"><span class="mu">מומלץ להיום</span><div class="big">${dot('s')}היום מנוחה מכוח</div>${why}<button type="button" class="btn light full" onclick="fp222.cat('${c}')">בכל זאת: ${c}</button></div>`;
  return `<div class="fpCard fpReco"><span class="mu">מומלץ להיום</span><div class="big">${dot('s')}${c}</div>${why}<button type="button" class="btn full" onclick="fp222.cat('${c}')">לתיקיית ${c}</button></div>`}
function mount(){const home=$('workoutHome');if(!home||!window.fpW)return;
  const vt=VT();if(!vt.includes(fpW.cur))fpW.tab(vt[0]);
  let h=$('fpHdr');if(!h){home.insertAdjacentHTML('afterbegin','<div id="fpHdr" class="fp221keep"></div><div id="fpStrip" class="fp221keep"></div><div id="fpPrompt" class="fp221keep"></div>');h=$('fpHdr')}
  h.innerHTML=hdrHtml();const st=$('fpStrip'),son=stripOn();st.hidden=!son;st.innerHTML=son?stripHtml():'';st.dataset.sig='';$('fpPrompt').innerHTML=promptHtml();
  let r=$('fpReco');if(!r){const a=$('homeActiveWorkout');(a||h).insertAdjacentHTML('afterend','<div id="fpReco"></div>');r=$('fpReco')}
  r.innerHTML=fpW.cur==='s'?strRecoHtml():'';
}
function libHeader(){const lib=$('workoutLibrary');if(!lib)return;let h=$('fpLibHd');if(!h){lib.insertAdjacentHTML('afterbegin','<div id="fpLibHd"></div>');h=$('fpLibHd')}
  h.innerHTML=`<div class="mhd"><button type="button" onclick="showView('workoutHome')">→ חזרה</button><b>האימונים שלי</b><span></span></div>`;
  /* 2.23: search and the plans first; the weekly plan and today's recommendation under the list */
  const wp=$('workoutPlans');let f=$('fpLibFoot');if(!f&&wp){wp.insertAdjacentHTML('afterend','<div id="fpLibFoot" style="margin-top:14px"></div>');f=$('fpLibFoot')}if(f){f.innerHTML='<div id="fpLibDate"></div>'+planRow()+strRecoHtml();const dt=$('libraryStartDate'),fl=dt&&dt.closest('.field');if(fl)$('fpLibDate').appendChild(fl)}}
function planRow(){const S=setSummary();return `<div class="fpCard" style="padding:4px 14px"><button type="button" class="fpRowBtn" onclick="fp222.ed.open()"><span><b>${ic('cal')} התוכנית השבועית</b><small>${S.plan}</small></span>${ic('chev')}</button></div>`}
function refreshAll(){try{mount()}catch(e){console.error(e)}try{if(window.fpW&&fpW.tab)fpW.tab(fpW.cur)}catch(_){}try{refreshPage()}catch(_){}try{if($('workoutDiary')&&$('workoutDiary').classList.contains('active'))jRender()}catch(_){}}

/* a day in the strip */
function daySheet(i){const T=fpT._,ws=weekStart(today()),date=addDays(ws,i),dn=vis(doneWeek(ws)[i]),w=wpGet(),plan=w.plan!=='none',TYPES=VT();
  let b=`<div class="fpCard"><h3>${DN[i]} ${dd(date)}</h3>${dn.length?`<p style="margin:0">עשית: ${dn.map(t=>dot(t)+' '+TN[t]).join(' · ')}</p>`:'<p class="mu" style="margin:0">לא נרשם אימון ביום הזה.</p>'}</div>`;
  if(plan){ED=w;b+=`<div class="fpCard"><h3>מתוכנן</h3><div class="fpChips">${TYPES.map(t=>`<button type="button" class="${w.days[i].includes(t)?'on':''}" onclick="fp222.dayTog(${i},'${t}')">${dot(t)}${TN[t]}</button>`).join('')}</div><p class="mu" style="margin:8px 0 0">${w.plan==='fixed'?'משנה את היום הזה בתוכנית הקבועה.':'משנה רק את השבוע הזה.'}</p></div>
    <button type="button" class="btn light full" onclick="fp222.ed.open()">כל התוכנית השבועית</button>`}
  else b+=`<button type="button" class="btn light full" onclick="fp222.ed.open()">להפעיל תוכנית שבועית</button>`;
  T.sheet('היום בשבוע',b)}

/* =========================================================
   journal
   ========================================================= */
/* 2.23: the filter is a sheet from the bottom: type, then that type's own options (strength: category, run: kind, cardio: machine), and dates */
let JS={week:'',more:8,type:'',sub:'',range:'',from:'',to:''},JF=null;
const SCATS=()=>(typeof LIBRARY_CATEGORIES!=='undefined'?LIBRARY_CATEGORIES:['רגליים','משיכה','דחיפה','גב','חזה','ידיים']);
const sCats=s=>{const n=String(s.type||'')+' '+String(s.name||'');return SCATS().filter(c=>n.includes(c))};
const rKind=r=>{try{return fpW.kindOf(r)}catch(_){return 'easy'}};
const RKN=()=>{try{return fpW.RK}catch(_){return {}}};
function rangeOf(f){const t=today();if(f.range==='m1')return [t.slice(0,8)+'01',''];if(f.range==='m3')return [addDays(t,-91),''];if(f.range==='c')return [f.from||'',f.to||''];return ['','']}
function entries(f){f=f||JS;const out=[],M=(fpT._&&fpT._.MACH)||{},K=RKN();
  strSessions().forEach(s=>out.push({t:'s',d:s.date,id:s.id,k:sCats(s),name:s.name||'אימון',sub:(s.items||[]).length+' תרגילים · '+(s.items||[]).reduce((n,x)=>n+(x.sets||[]).length,0)+' סטים',v:s.durationMinutes?s.durationMinutes+' דק׳':'',min:Number(s.durationMinutes)||0}));
  runLog().forEach((r,i)=>{const k=rKind(r);out.push({t:'r',d:r.d,i,k:[k],name:r.name||(k!=='plan'&&K[k]?'ריצה '+K[k].n:'ריצה'),sub:[r.s?mmss(r.s):'',r.s&&r.km?'קצב '+mmss(r.s/r.km):'',r.ok?'בלי לעצור':'עצרתי'].filter(Boolean).join(' · '),v:r.km?kmTxt(r.km)+' ק״מ':'',km:Number(r.km)||0})});
  carLog().forEach((r,i)=>out.push({t:'c',d:r.d,i,k:[r.k],name:r.name||((M[r.k]||{}).n||'אירובי'),sub:r.hard?'חזק':'קל',v:(r.min||0)+' דק׳',min:Number(r.min)||0}));
  const [a,b]=rangeOf(f);
  return out.filter(e=>e.d&&(!f.type||e.t===f.type)&&(!f.sub||e.k.includes(f.sub))&&(!a||e.d>=a)&&(!b||e.d<=b)).sort((x,y)=>y.d.localeCompare(x.d))}
function weekTitle(ws){const cur=weekStart(today());return ws===cur?'השבוע':ws===addDays(cur,-7)?'שבוע שעבר':dd(ws)+'–'+dd(addDays(ws,6))}
function sumLine(es){const n={s:0,r:0,c:0};let km=0,cm=0;es.forEach(e=>{n[e.t]++;if(e.t==='r')km+=e.km;if(e.t==='c')cm+=e.min});
  return [n.s?n.s+' כוח':'',n.r?n.r+' ריצה'+(km?' ('+kmTxt(km)+' ק״מ)':''):'',n.c?n.c+' אירובי'+(cm?' ('+cm+' דק׳)':''):''].filter(Boolean).join(' · ')}
const nFilters=f=>(f.type?1:0)+(f.sub?1:0)+(f.range?1:0);
/* the options of one type: only what exists in your log, so there are no empty choices */
function subOpts(t){const M=(fpT._&&fpT._.MACH)||{},K=RKN(),seen=new Set();
  if(t==='s'){strSessions().forEach(s=>sCats(s).forEach(c=>seen.add(c)));return SCATS().filter(c=>seen.has(c)).map(c=>[c,c])}
  if(t==='r'){runLog().forEach(r=>seen.add(rKind(r)));return Object.keys(K).filter(k=>seen.has(k)).map(k=>[k,K[k].n])}
  if(t==='c'){carLog().forEach(r=>seen.add(r.k));return Object.keys(M).filter(k=>seen.has(k)).map(k=>[k,M[k].n])}
  return []}
function filterSheet(){const f=JF,n=entries(f).length,subs=f.type?subOpts(f.type):[];
  const SL={s:'קטגוריה',r:'סוג ריצה',c:'מכשיר'};
  fpT._.sheet('סינון',`<div class="fpSeg" role="group" aria-label="סוג">${[['','הכל'],...VT().map(t=>[t,TN[t]])].map(([k,l])=>`<button type="button" class="${f.type===k?'on':''}" onclick="fp222.jf('type','${k}')">${l}</button>`).join('')}</div>
    ${f.type?`<p class="mu" style="margin:4px 0 6px">${SL[f.type]}</p>${subs.length?`<div class="fpChips" style="margin:0 0 12px"><button type="button" class="${!f.sub?'on':''}" onclick="fp222.jf('sub','')">הכל</button>${subs.map(([k,l])=>`<button type="button" class="${f.sub===k?'on':''}" onclick="fp222.jf('sub','${esc(k)}')">${esc(l)}</button>`).join('')}</div>`:'<p class="fpHint" style="margin:0 0 12px">עוד אין אימונים מהסוג הזה.</p>'}`:''}
    <p class="mu" style="margin:4px 0 6px">תאריכים</p><div class="fpChips" style="margin:0 0 8px">${[['','הכל'],['m1','החודש'],['m3','3 חודשים'],['c','בחירה']].map(([k,l])=>`<button type="button" class="${f.range===k?'on':''}" onclick="fp222.jf('range','${k}')">${l}</button>`).join('')}</div>
    ${f.range==='c'?`<div class="row"><div class="field" style="margin:0"><label>מתאריך</label><input type="date" value="${esc(f.from)}" onchange="fp222.jf('from',this.value)"></div><div class="field" style="margin:0"><label>עד תאריך</label><input type="date" value="${esc(f.to)}" onchange="fp222.jf('to',this.value)"></div></div>`:''}
    <button type="button" class="btn full" style="margin-top:12px" onclick="fp222.jf('apply')">${n?'הצג '+n+(n===1?' אימון':' אימונים'):'אין אימונים בסינון הזה'}</button>
    ${nFilters(f)?`<button type="button" class="btn light full" style="margin-top:8px" onclick="fp222.jf('clear')">ניקוי הסינון</button>`:''}`)}
function fltLabel(){const K=RKN(),M=(fpT._&&fpT._.MACH)||{};const p=[];if(JS.type)p.push(TN[JS.type]);if(JS.sub)p.push(JS.type==='r'?(K[JS.sub]||{}).n||JS.sub:JS.type==='c'?(M[JS.sub]||{}).n||JS.sub:JS.sub);if(JS.range)p.push({m1:'החודש',m3:'3 חודשים',c:(JS.from?dd(JS.from):'')+'–'+(JS.to?dd(JS.to):'')}[JS.range]);return p.join(' · ')}
function jRender(){const sec=$('workoutDiary');if(!sec)return;let box=$('fpJ');if(!box){sec.insertAdjacentHTML('afterbegin','<div id="fpJ"></div>');box=$('fpJ')}
  sec.classList.add('fpJon');
  const es=entries(),nf=nFilters(JS),filtered=nf>0;
  const hd=(back,title)=>`<div class="jhd">${back}<b>${title}</b><button type="button" class="${filtered?'on':''}" onclick="fp222.j('flt')">${ic('filter')}סינון${nf?' ('+nf+')':''}</button></div>`
    +(filtered?`<div class="fpChips" style="margin:0 0 10px"><button type="button" class="on" onclick="fp222.j('flt')">${esc(fltLabel())}</button><button type="button" onclick="fp222.j('clear')">ניקוי ✕</button></div>`:'');
  if(JS.week){const ws=JS.week,we=addDays(ws,6),list=es.filter(e=>e.d>=ws&&e.d<=we);let h=hd(`<button type="button" class="jback" onclick="fp222.j('week','')">${ic('back')}חזרה</button>`,weekTitle(ws));
    h+=`<button type="button" class="jall" onclick="fp222.j('week','')">${ic('cal')}כל השבועות</button>`;
    h+=`<p class="mu" style="margin:0 0 6px">${sumLine(list)||'אין אימונים בשבוע הזה.'}</p><div class="tl">`;let last='';
    list.forEach(e=>{if(e.d!==last){last=e.d;const k=daysBetween(e.d,today());h+=`<div class="dlab">${k===0?'היום · ':k===1?'אתמול · ':''}יום ${W[dow(e.d)]} ${dd(e.d)}</div>`}
      h+=`<button type="button" class="e ${e.t}" onclick="fp222.jOpen('${e.t}','${e.t==='s'?e.id:e.i}')"><span><b>${esc(e.name)}</b><small>${esc(e.sub)}</small></span><span class="n">${esc(e.v)}</span></button>`});
    box.innerHTML=h+'</div>';return}
  const by={};es.forEach(e=>{const ws=weekStart(e.d);(by[ws]=by[ws]||[]).push(e)});const ws0=weekStart(today());if(!filtered&&!by[ws0])by[ws0]=[];
  const keys=Object.keys(by).sort().reverse();let h=hd(`<button type="button" class="jback" onclick="showView('workoutHome')">${ic('back')}חזרה</button>`,'יומן אימונים');
  if(!keys.length)h+=`<div class="fpCard"><p class="mu" style="margin:0">${filtered?'אין אימונים שמתאימים לסינון.':'עוד אין אימונים. אחרי האימון הראשון הוא יופיע כאן.'}</p></div>`;
  keys.slice(0,JS.more).forEach(ws=>{const list=by[ws],n={s:0,r:0,c:0};list.forEach(e=>n[e.t]++);const mx=Math.max(1,n.s,n.r,n.c);
    h+=`<button type="button" class="wc" onclick="fp222.j('week','${ws}')"><div class="hd"><span><b>${weekTitle(ws)}</b><small>${sumLine(list)||'עוד אין אימונים'}</small></span><span class="bars" aria-hidden="true">${TYPES.map(t=>`<i style="height:${3+n[t]/mx*17}px;background:var(--c${t.toUpperCase()})"></i>`).join('')}</span></div>
      ${list.slice(0,6).map(e=>`<div class="ln"><span class="dn">${W[dow(e.d)]}</span>${dot(e.t)}<span>${esc(e.name)}${e.sub?' · '+esc(e.sub.split(' · ')[0]):''}</span><span class="v">${esc(e.v)}</span></div>`).join('')}${list.length>6?`<div class="ln"><span></span><span></span><span class="mu">ועוד ${list.length-6}</span><span></span></div>`:''}</button>`});
  if(keys.length>JS.more)h+=`<button type="button" class="btn light full" onclick="fp222.j('more')">עוד שבועות</button>`;
  box.innerHTML=h}
/* open one workout */
function jStrength(id){const T=fpT._,s=sessions().find(x=>x.id===id);if(!s)return;
  const sets=x=>(x.sets||[]).map((v,i)=>`<span class="set-badge"><strong>סט ${Number(v.set)||i+1}</strong> · ${v.weight===null||v.weight===''?'ללא משקל':fmt(v.weight)+' ק״ג'} × ${v.reps}${v.note?' · '+esc(v.note):''}</span>`).join('');
  T.sheet(esc(s.name||'אימון'),`<p class="mu" style="margin:0 0 8px">יום ${W[dow(s.date)]} ${dd(s.date)}${s.durationMinutes?' · '+s.durationMinutes+' דק׳':''}</p>
    ${(s.items||[]).map(x=>`<div class="workout-item"><div class="history-top"><b>${esc(x.exercise)}</b><button type="button" class="btn light mini" onclick="fpT.close();editWorkout('${esc(x.id)}');showView('workouts')">עריכה</button></div><div class="set-badges">${sets(x)}</div>${x.notes?`<div class="muted">${esc(x.notes)}</div>`:''}</div>`).join('')}
    <div class="row" style="margin-top:10px"><button type="button" class="btn light" onclick="fpT.close();renameSession('${esc(id)}')">שינוי שם</button><button type="button" class="btn light" onclick="fpT.close();openSessionDate('${esc(id)}')">שינוי תאריך</button></div>
    <button type="button" class="btn secondary full" style="margin-top:8px" onclick="fpT.close();fpAddExToSession('${esc(id)}')">＋ הוספת תרגיל לאימון</button>
    <button type="button" class="btn light full" style="margin-top:8px;color:#F09595" onclick="fp222.jDelS('${esc(id)}')">מחיקת האימון</button>`)}
let JE=null;
function jRun(i){const T=fpT._,r=runLog()[i];if(!r)return;JE=JE&&JE.t==='r'&&JE.i===i?JE:{t:'r',i,x:Object.assign({},r,{tm:r.s?mmss(r.s):'',sp:(r.sp||[]).map(mmss)})};const x=JE.x,km=Math.floor(Number(String(x.km).replace(',','.'))||0);
  const pva=Array.isArray(r.tg)&&r.tg.length?`<p class="mu" style="margin:0 0 6px">תכנון מול ביצוע</p>${fpT._.pvaHtml(r)}<p class="mu" style="margin:14px 0 6px">עריכה</p>`:'';
  T.sheet(r.tg?esc(r.name||'ריצה'):'עריכת ריצה',pva+`<div class="field"><label>תאריך</label><input type="date" value="${esc(x.d)}" onchange="fp222.je('d',this.value)"></div>
    <div class="row"><div class="field"><label>ק״מ</label><input inputmode="decimal" value="${esc(x.km)}" oninput="fp222.je('km',this.value)" onchange="fp222.je('km',this.value,1)"></div><div class="field"><label>זמן (דק׳:שנ׳)</label><input inputmode="text" value="${esc(x.tm)}" oninput="fp222.je('tm',this.value)"></div></div>
    <div class="fpSeg" role="group"><button type="button" class="${x.ok?'on':''}" onclick="fp222.je('ok',1,1)">בלי לעצור</button><button type="button" class="${x.ok?'':'on'}" onclick="fp222.je('ok',0,1)">עצרתי באמצע</button></div>
    <div class="fpCard"><h3>קצב לכל ק״מ</h3>${km?`<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">${Array.from({length:Math.min(km,42)},(_,k)=>`<label style="font-size:12.5px">ק״מ ${k+1}<input inputmode="text" placeholder="6:00" value="${esc(x.sp[k]||'')}" oninput="fp222.jsp(${k},this.value)"></label>`).join('')}</div>`:'<p class="mu" style="margin:0">כותבים קודם כמה ק״מ.</p>'}</div>
    <button type="button" class="btn full" onclick="fp222.jSave()">שמור</button><button type="button" class="btn light full" style="margin-top:8px;color:#F09595" onclick="fp222.jDel()">מחיקה</button>`)}
function jCar(i){const T=fpT._,M=T.MACH,r=carLog()[i];if(!r)return;JE=JE&&JE.t==='c'&&JE.i===i?JE:{t:'c',i,x:Object.assign({},r)};const x=JE.x;
  T.sheet('עריכת אירובי',`<div class="field"><label>תאריך</label><input type="date" value="${esc(x.d)}" onchange="fp222.je('d',this.value)"></div>
    <div class="field"><label>דקות</label><input inputmode="numeric" value="${esc(x.min)}" oninput="fp222.je('min',this.value)"></div>
    <label class="mu">מכשיר</label><div class="fpChips" style="margin:4px 0 10px">${Object.keys(M).map(k=>`<button type="button" class="${x.k===k?'on':''}" onclick="fp222.je('k','${k}',1)">${M[k].n}</button>`).join('')}</div>
    <div class="fpSeg" role="group"><button type="button" class="${x.hard?'':'on'}" onclick="fp222.je('hard',0,1)">קל</button><button type="button" class="${x.hard?'on':''}" onclick="fp222.je('hard',1,1)">חזק</button></div>
    <button type="button" class="btn full" onclick="fp222.jSave()">שמור</button><button type="button" class="btn light full" style="margin-top:8px;color:#F09595" onclick="fp222.jDel()">מחיקה</button>`)}

/* =========================================================
   Settings → "אימונים: כוח, ריצה, אירובי"
   ========================================================= */
let PAGE='';
function sw(on,fn,label){return `<label class="fpSw"><input type="checkbox" ${on?'checked':''} onchange="${fn}" aria-label="${label}"><span></span></label>`}
function recoRow(t){return `<div class="fpCard"><div class="fpRow" style="padding:0"><span><b>מומלץ להיום</b><br><span class="mu">כרטיס ראשון בלשונית ${TN[t]}</span></span>${sw(RECO()[t],`fp222.reco('${t}',this.checked)`,'מומלץ להיום ב'+TN[t])}</div></div>`}
function pageHtml(t){
  if(t==='s'){const w=wpGet(),T=TP();return recoRow('s')+`<div class="fpCard"><div class="fpRow" style="padding-top:0"><span>אימוני כוח בשבוע</span>${w.plan==='none'?`<span class="fpStp"><button type="button" aria-label="פחות" onclick="fp222.str(-1)">−</button><b>${Number(T.str)||0}</b><button type="button" aria-label="יותר" onclick="fp222.str(1)">+</button></span>`:`<b>${w.days.filter(d=>d.includes('s')).length}</b>`}</div>
      ${w.plan!=='none'?'<p class="mu" style="margin:0">הימים נקבעים בתוכנית השבועית.</p>':''}
      <button type="button" class="fpRowBtn" onclick="fpT.close();openOnboarding(false)"><span>זמן האימון, ניסיון וציוד</span>${ic('chev')}</button></div>`}
  if(t==='r')return recoRow('r')+fpW.runSetHtml();
  if(t==='c')return recoRow('c')+fpW.carSetHtml();
  return ''}
function openPage(t){PAGE=t;fpT._.sheet(TN[t],pageHtml(t))}
function refreshPage(){if(!PAGE)return;const s=$('fpTSheet');if(!s){PAGE='';return}fpT._.sheet(TN[PAGE],pageHtml(PAGE))}
function setSummary(){const w=wpGet(),n={s:0,r:0,c:0};w.days.forEach(d=>d.forEach(t=>n[t]++));const p=(()=>{try{return fpT.plan()}catch(_){return null}})(),c=(()=>{try{return fpW._.clv()}catch(_){return null}})(),T=TP();
  return {plan:w.plan==='none'?'כבויה':(w.plan==='fixed'?'קבועה':'משתנה כל שבוע')+' · '+[n.s?n.s+' כוח':'',n.r?n.r+' ריצה':'',n.c?n.c+' אירובי':''].filter(Boolean).join(', '),
    s:(Number(T.str)||n.s||0)+' בשבוע'+(RECO().s?'':' · בלי המלצה'),r:p?'יעד '+(p.goal===21.1?'חצי מרתון':p.goal+' ק״מ')+' · '+p.runs+' בשבוע':'אין תוכנית',c:c&&(Array.isArray(T.want)&&T.want.includes('car')||Number(T.car)>0)?({beg:'מתחיל',mid:'ממשיך',adv:'4×4'}[c.lvl])+' · '+(Number(T.car)||2)+' בשבוע':'לא פעיל'}}
function renderSet(){const sec=$('settings');if(!sec||!state.data||!window.fpW)return;let box=$('fpTrainSet');
  if(!box){box=document.createElement('details');box.className='settings-section';box.id='fpTrainSet';const a=$('fpMedalSet');if(a)a.insertAdjacentElement('afterend',box);else sec.appendChild(box)}
  const open=box.open,S=setSummary();
  const o=ON(),n=VT().length;
  box.innerHTML=`<summary>אימונים: כוח, ריצה, אירובי</summary><div class="settings-body">
    <p class="mu" style="margin:0 0 4px">מה מופיע באימונים</p>
    ${TYPES.map(t=>`<div class="fpRow" style="padding:8px 0"><span>${dot(t)} ${TN[t]}${o[t]&&n===1?'<br><small class="mu">צריך לפחות סוג אחד</small>':''}</span><label class="fpSw"><input type="checkbox" ${o[t]?'checked':''} ${o[t]&&n===1?'disabled':''} onchange="fp222.typeOn('${t}',this.checked)" aria-label="להציג ${TN[t]}"><span></span></label></div>`).join('')}
    <p class="fpHint" style="margin:0 0 8px">סוג שמכבים נעלם מהמסך. שום דבר לא נמחק, ואפשר להחזיר מתי שרוצים.</p>
    <button type="button" class="fpRowBtn" onclick="fp222.ed.open()"><span><b>תוכנית שבועית</b><small>${S.plan}</small></span>${ic('chev')}</button>
    ${VT().map(t=>`<button type="button" class="fpRowBtn" onclick="fp222.page('${t}')"><span><b>${dot(t)} ${TN[t]}</b><small>${S[t]}</small></span>${ic('chev')}</button>`).join('')}</div>`;box.open=open}

/* =========================================================
   hooks and actions
   ========================================================= */
if(typeof renderWorkoutHome==='function'){const o=renderWorkoutHome;renderWorkoutHome=function(){const r=o.apply(this,arguments);try{mount()}catch(e){console.error(e)}return r}}
if(typeof showView==='function'){const o=showView;showView=function(id){const r=o.apply(this,arguments);try{if(id==='workoutHome')mount();if(id==='workoutLibrary')libHeader();if(id==='workoutDiary')jRender()}catch(e){console.error(e)}return r}}
if(typeof renderWorkoutHistory==='function'){const o=renderWorkoutHistory;renderWorkoutHistory=function(){const r=o.apply(this,arguments);try{if($('workoutDiary')&&$('workoutDiary').classList.contains('active'))jRender()}catch(_){}return r}}
if(typeof renderSettings==='function'){const o=renderSettings;renderSettings=function(){const r=o.apply(this,arguments);try{renderSet()}catch(e){console.error(e)}return r}}
/* the check-in summary: a button to plan the week, when it is time */
if(typeof renderCheckin==='function'){const o=renderCheckin;renderCheckin=function(){const r=o.apply(this,arguments);try{if(state.ci&&state.ci.step===3&&needsPlan()){const b=$('ciBody');if(b&&!$('fpCiPlan'))b.insertAdjacentHTML('beforeend',`<div class="fpCard" id="fpCiPlan" style="margin-top:12px"><b>ועכשיו: התוכנית לשבוע הבא</b><p class="mu" style="margin:4px 0 8px">איזה יום כוח, ריצה או אירובי.</p><button type="button" class="btn full" onclick="fp222.ed.open()">לתכנן</button></div>`)}}catch(_){}return r}}
/* a run or cardio saved / a plan changed elsewhere → refresh */
setInterval(()=>{try{if($('workoutHome')&&$('workoutHome').classList.contains('active')){const s=$('fpStrip');if(s){const on=stripOn();s.hidden=!on;const h=on?stripHtml():'';if(s.dataset.sig!==h){s.innerHTML=h;s.dataset.sig=h}}}}catch(_){}},4000);

window.fp222={
  ed,refreshPage,planChanged:refreshAll,planRow,
  hdr(){const h=$('fpHdr');if(h)h.innerHTML=hdrHtml();const r=$('fpReco');if(r)r.innerHTML=fpW.cur==='s'?strRecoHtml():''},
  tab(t){fpW.tab(t);mount()},
  mine(){const t=fpW.cur;if(t==='s'){showView('workoutLibrary');return}fpW.mine(t);mount()},
  journal(){JS.week='';showView('workoutDiary')},
  day:daySheet,
  dayTog(i,t){const w=ED||wpGet(),a=w.days[i],j=a.indexOf(t);if(j>=0)a.splice(j,1);else a.push(t);if(w.plan==='weekly'){w.weeks=w.weeks||{};w.weeks[weekStart(today())]=w.days.map(d=>d.slice())}wpSave(w);syncCounts(w.days);ED=null;daySheet(i);refreshAll()},
  cat(c){showView('workoutLibrary');try{chooseLibraryCategory(c)}catch(_){}setTimeout(()=>{const g=$('workoutPlans');if(g)g.scrollIntoView({behavior:'smooth',block:'start'})},60)},
  page:openPage,
  typeOn(t,on){const o=J('TYPES_ON',null)||{};const cur=ON();if(!on&&VT().length===1&&cur[t]){try{toast('צריך לפחות סוג אחד')}catch(_){}renderSet();return}
    o[t]=on?1:0;setProp('TYPES_ON',JSON.stringify(o));try{toast(on?TN[t]+' חזר':TN[t]+' הוסתר. שום דבר לא נמחק')}catch(_){}renderSet();refreshAll()},
  stripFree(on){setProp('STRIP_FREE',on?'1':'');refreshAll()},
  reco(t,on){const r=J('RECO',null)||{};r[t]=on?1:0;setProp('RECO',JSON.stringify(r));refreshAll()},
  str(dl){const t=TP();t.str=Math.max(0,Math.min(6,(Number(t.str)||0)+dl));if(t.str&&Array.isArray(t.want)&&!t.want.includes('str'))t.want.push('str');setProp('TRAIN_PLAN',JSON.stringify(t));refreshPage();try{toast('נשמר')}catch(_){}},
  j(k,v){if(k==='flt'){JF=Object.assign({},JS);filterSheet();return}if(k==='more')JS.more+=8;else if(k==='clear'){JS.type='';JS.sub='';JS.range='';JS.from='';JS.to=''}else JS[k]=v;jRender();if(k==='week')window.scrollTo(0,0)},
  jf(k,v){if(!JF)return;if(k==='apply'){['type','sub','range','from','to'].forEach(x=>JS[x]=JF[x]);JF=null;fpT.close();jRender();window.scrollTo(0,0);return}
    if(k==='clear'){JF.type='';JF.sub='';JF.range='';JF.from='';JF.to=''}else{JF[k]=v;if(k==='type')JF.sub='';if(k==='range'&&v!=='c'){JF.from='';JF.to=''}}filterSheet()},
  jOpen(t,id){JE=null;if(t==='s')jStrength(id);else if(t==='r')jRun(Number(id));else jCar(Number(id))},
  je(k,v,re){if(!JE)return;JE.x[k]=v;if(re)(JE.t==='r'?jRun:jCar)(JE.i)},
  jsp(k,v){if(JE)JE.x.sp[k]=v},
  jSave(){if(!JE)return;const key=JE.t==='r'?'RUN_LOG':'CARDIO_LOG',L=J(key,[]),x=JE.x;if(!L[JE.i])return;
    if(JE.t==='r'){const km=Number(String(x.km).replace(',','.'))||0,s=sec(x.tm);const row=Object.assign({},L[JE.i],{d:x.d||L[JE.i].d,km,s:s||null,ok:!!x.ok});const sp=(x.sp||[]).slice(0,Math.floor(km)).map(sec).filter(v=>v!=null);if(sp.length)row.sp=sp;else delete row.sp;L[JE.i]=row}
    else L[JE.i]=Object.assign({},L[JE.i],{d:x.d||L[JE.i].d,min:Math.max(1,Number(x.min)||1),k:x.k,hard:!!x.hard});
    setProp(key,JSON.stringify(L));JE=null;fpT.close();try{toast('נשמר')}catch(_){}try{fp219Week.checkMedals(false)}catch(_){}refreshAll()},
  jDel(){if(!JE||!confirm('למחוק?'))return;const key=JE.t==='r'?'RUN_LOG':'CARDIO_LOG',L=J(key,[]);L.splice(JE.i,1);setProp(key,JSON.stringify(L));JE=null;fpT.close();try{toast('נמחק')}catch(_){}refreshAll()},
  async jDelS(id){fpT.close();try{await removeWorkoutSession(id)}catch(_){}refreshAll()}
};
/* the sheet of 2.19 forgets which settings page was open when closed */
if(window.fpT){const oc=fpT.close;fpT.close=function(){PAGE='';return oc.apply(this,arguments)}}
const boot=setInterval(()=>{if(typeof state!=='undefined'&&state.data&&window.fpW&&window.FPW){clearInterval(boot);try{syncWeek();mount()}catch(_){}try{renderSet()}catch(_){}}},800);
})();
