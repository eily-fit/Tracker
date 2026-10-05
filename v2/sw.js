const CACHE='fitpro2-2.0.0';
const ASSETS=['./','index.html','server.js','fp2-core.js','fp2.js','manifest.webmanifest','../icon-180.png','../icon-192.png','../icon-512.png'];
const FB='https://www.gstatic.com/firebasejs/';
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS).catch(()=>{})).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('fitpro2-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 const req=e.request,url=new URL(req.url);
 if(req.method!=='GET')return;
 /* Firebase library files never change for a fixed version: keep them so the app opens without internet. */
 if(req.url.startsWith(FB)){e.respondWith(caches.open(CACHE).then(async c=>{const hit=await c.match(req);if(hit)return hit;const res=await fetch(req);if(res&&res.ok)c.put(req,res.clone());return res}));return}
 if(url.origin!==self.location.origin||url.searchParams.has('check'))return;
 const key=new Request(url.origin+url.pathname);
 e.respondWith(caches.open(CACHE).then(async cache=>{
  const hit=await cache.match(key);
  const net=fetch(req).then(res=>{if(res&&res.ok)cache.put(key,res.clone());return res});
  if(!hit)return net;
  const quick=new Promise(r=>setTimeout(()=>r(null),1200));
  const res=await Promise.race([net.catch(()=>null),quick]);
  return res||hit;
 }));
});
