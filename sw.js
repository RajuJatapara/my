const CACHE_NAME = 'tools-hub-cache-v7';
const ASSETS = [
    './',
    './index.html',
    './ad.html',
    './bill.html',
    './calculator.html',
    './calendar.html',
    './catalog.html',
    './cert.html',
    './estimate.html',
    './festival.html',
    './idcard.html',
    './kankotri.html',
    './label.html',
    './letterhead.html',
    './menu.html',
    './parchi.html',
    './qr.html',
    './rateboard.html',
    './resume.html',
    './salary.html',
    './tripsheet.html',
    './vcard.html',
    './wa.html',
    './cashcounter.html',
    './reportcard.html',
    './tuitionreceipt.html',
    './attendance.html',
    './timetable.html',
    './privacy.html',
    './terms.html',
    './about.html',
    './contact.html',
    './assets/i18n.js',
    './assets/config.js',
    './assets/translations.js',
    './manifest.json',
    './assets/img/icon-192.png',
    './assets/img/icon-512.png'
];

// Install Event (Robust caching mechanism using Promise.allSettled)
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return Promise.allSettled(
                ASSETS.map(url => {
                    return fetch(url).then(response => {
                        if (response.ok) {
                            return cache.put(url, response);
                        }
                        throw new Error(`Fetch failed for ${url} with status ${response.status}`);
                    });
                })
            ).then(results => {
                const failures = results.filter(r => r.status === 'rejected');
                if (failures.length > 0) {
                    console.warn('Some PWA assets failed to cache:', failures);
                } else {
                    console.log('All PWA assets cached successfully.');
                }
            });
        }).then(() => self.skipWaiting())
    );
});

// Activate Event
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.map(key => {
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            })
        )).then(() => self.clients.claim())
    );
});

// Fetch Event (Stale-While-Revalidate caching strategy)
self.addEventListener('fetch', event => {
    // Only cache requests from the same origin
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(event.request).then(cachedResponse => {
                const fetchedResponse = fetch(event.request).then(networkResponse => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                }).catch(() => null);

                return cachedResponse || fetchedResponse;
            });
        })
    );
});
