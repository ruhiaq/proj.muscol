// 앱 화면(HTML 등)을 기기에 보관해서 인터넷이 없어도 열리게 합니다.
// /api/ 요청과 다른 사이트(B2, Supabase) 요청은 건드리지 않습니다.
const V = "v1";
const SHELL = ["/", "/manifest.json", "/icon-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET" || u.origin !== location.origin || u.pathname.startsWith("/api/")) return;
  // 온라인이면 항상 최신 파일, 오프라인이면 보관해 둔 파일
  e.respondWith(
    fetch(r)
      .then((res) => {
        const copy = res.clone();
        caches.open(V).then((c) => c.put(r, copy));
        return res;
      })
      .catch(() => caches.match(r).then((m) => m || caches.match("/")))
  );
});
