// for SW lifecycle: register => install => activate;

const cacheName = "v1";

self.addEventListener("install", (e) => {
  console.log("service worker installed");
});

self.addEventListener("activate", (e) => {
  console.log("service worker activated");
  // remove old cache
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      //caches api is from window object
      return Promise.all(
        cacheNames.map((cache) => {
          // cachesNames would be like [v1,v2...]; current stored caches in browser
          if (cache != cacheName) {
            console.log("service worker clearing old cache");
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

//call fetch event

self.addEventListener("fetch", (e) => {
  console.log("service worker fetching");
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        //make copy of response
        const resClone = res.clone();
        //open cache
        caches.open(cacheName).then((cache) => {
          // current cacheName ko browser caches se open kr k usme resClone append kr diya jisse sara requested data caches me save ho jaye
          // add res to cache
          cache.put(e.request, resClone);
        });
        return res;
      })
      .catch(() => caches.match(e.request).then((res) => res))
  );
});
