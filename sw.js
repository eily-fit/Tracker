const CACHE='elai-app-0.28.0';
const ASSETS=['./','index.html','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('elai-app-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 const req=e.request,url=new URL(req.url);
 if(req.method!=='GET'||url.origin!==self.location.origin||url.searchParams.has('check'))return;
 // Query strings (including invitation codes) are never stored in cache keys.
 const key=new Request(url.origin+url.pathname);
 e.respondWith(caches.open(CACHE).then(async cache=>{
  try{const res=await fetch(req);if(res.ok){await cache.put(key,res.clone());return res;}const hit=await cache.match(key);return hit||res;}
  catch(err){const hit=await cache.match(key);if(hit)return hit;throw err;}
 }));
});
