const CACHE='fitpro2-2.13.0';
const ASSETS=['./','index.html','server.js','fp2-core.js','fp2.js','fp2-nutrition.js','fp2-improvements.js','fp2-foods.js','fp2-meals.js','fp2-days.js','fp2-goal.js','fp2-photos.js','fp2-requests.js','fp2-fixes.js','fp2-progress.js','fp2-tour.js','fp2-week.js','fp2-gym.js','fp2-recipe.js','fp2-train.js','fp2-intro.js','fp2-anim.js','fp2-exlib.js','manifest.webmanifest','../icon-180.png','../icon-192.png','../icon-512.png'];
const FB='https://www.gstatic.com/firebasejs/';
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>Promise.all(ASSETS.map(async u=>{try{const r=await fetch(new Request(u,{cache:'reload'}));if(r.ok)await c.put(u,r)}catch(_){}}))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('fitpro2-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 const req=e.request,url=new URL(req.url);
 if(req.method!=='GET')return;
 /* Firebase library files never change for a fixed version: keep them so the app opens without internet. */
 if(req.url.startsWith(FB)){e.respondWith(caches.open(CACHE).then(async c=>{const hit=await c.match(req);if(hit)return hit;const res=await fetch(req);if(res&&res.ok)c.put(req,res.clone());return res}));return}
 if(url.origin!==self.location.origin||url.searchParams.has('check'))return;
 /* App files: always try the newest version first (so an update shows on the next open),
    and fall back to the saved copy only when there is no internet or it is very slow. */
 const key=new Request(url.origin+url.pathname);
 e.respondWith(caches.open(CACHE).then(async cache=>{
  const net=fetch(req,{cache:'no-store'}).then(res=>{if(res&&res.ok)cache.put(key,res.clone());return res});
  const slow=new Promise(r=>setTimeout(()=>r(null),4000));
  const res=await Promise.race([net.catch(()=>null),slow]);
  if(res)return res;
  const hit=await cache.match(key);
  return hit||net;
 }));
});

async function bumpBadge(){try{const c=await caches.open('fitpro-badge');const r=await c.match('n');const n=(r?Number(await r.text())||0:0)+1;await c.put('n',new Response(String(n)));if(self.navigator.setAppBadge)await self.navigator.setAppBadge(n)}catch(_){}}
self.addEventListener('message',e=>{if(e.data&&e.data.type==='FITPRO_BADGE'){const n=Number(e.data.n)||0;e.waitUntil((async()=>{try{const c=await caches.open('fitpro-badge');await c.put('n',new Response(String(n)));if(n&&self.navigator.setAppBadge)await self.navigator.setAppBadge(n);else if(self.navigator.clearAppBadge)await self.navigator.clearAppBadge()}catch(_){}})())}});
/* Data-only FCM payloads: exactly one notification, using the existing worker. */
self.addEventListener('push',event=>{
  let payload;try{payload=event.data.json()}catch(_){return}
  const data=payload.data;if(!data||data.kind!=='fitpro-weekly')return;
  /* 2.11.0: a new request → a number on the app icon (home screen), like other apps */
  if(data.tag==='fitpro-request')event.waitUntil(bumpBadge());
  event.waitUntil(self.registration.showNotification(data.title||'FitPro',{
    body:data.body||'יש אירוע השבוע. פתח את האפליקציה לתכנון.',tag:data.tag||'fitpro-weekly',
    data:{url:new URL('./',self.registration.scope).href,week:data.week},icon:'../icon-192.png'
  }));
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();const url=new URL('./',self.registration.scope).href;
  event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(async clients=>{
    const client=clients.find(c=>c.url.startsWith(self.registration.scope));if(client){await client.focus();client.postMessage({type:'FITPRO_OPEN_WEEKLY'});return}return self.clients.openWindow(url);
  }));
});
