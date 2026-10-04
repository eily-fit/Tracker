const CACHE='elai-app-0.33.1';
const ASSETS=['./','index.html','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('elai-app-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 const req=e.request,url=new URL(req.url);
 if(req.method!=='GET'||url.origin!==self.location.origin||url.searchParams.has('check'))return;
 /* Query strings (including invitation codes) are never stored in cache keys. */
 const key=new Request(url.origin+url.pathname);
 e.respondWith(caches.open(CACHE).then(async cache=>{
  const hit=await cache.match(key);
  const net=fetch(req).then(res=>{if(res&&res.ok)cache.put(key,res.clone());return res});
  if(!hit)return net;
  /* Fresh copy when the network answers quickly; otherwise open instantly from the saved copy. */
  const quick=new Promise(r=>setTimeout(()=>r(null),1500));
  const res=await Promise.race([net.catch(()=>null),quick]);
  return res||hit;
 }));
});
