const CACHE_NAME = 'tools-hub-cache-v9';
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
    './blog.html',
    './blogInterestCalculation.html',
    './blogGstBillingGuide.html',
    './blogVisitingCardDesign.html',
    './blogMandiCropBagWeights.html',
    './blogAttaChakkiMilkBilling.html',
    './blogCoachingFeeAttendanceManagement.html',
    './404.html',
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

// Fetch Event (Stale-While-Revalidate caching strategy with extensionless URL mapping)
self.addEventListener('fetch', event => {
    // Only cache requests from the same origin
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    const urlObj = new URL(event.request.url);
    const path = urlObj.pathname;
    
    // List of static pages to map extensionless requests to .html in cache
    const staticPages = [
        'ad', 'bill', 'calculator', 'calendar', 'catalog', 'cert', 'estimate', 'festival', 
        'idcard', 'kankotri', 'label', 'letterhead', 'menu', 'parchi', 'qr', 'rateboard', 
        'resume', 'salary', 'tripsheet', 'vcard', 'wa', 'cashcounter', 'reportcard', 
        'tuitionreceipt', 'attendance', 'timetable', 'privacy', 'terms', 'about', 'contact', 'blog',
        'blogInterestCalculation', 'blogGstBillingGuide', 'blogVisitingCardDesign',
        'blogMandiCropBagWeights', 'blogAttaChakkiMilkBilling', 'blogCoachingFeeAttendanceManagement'
    ];
    
    const pageName = path.split('/').pop();
    if (staticPages.includes(pageName)) {
        const newUrl = urlObj.origin + path + '.html' + urlObj.search;
        event.respondWith(
            caches.open(CACHE_NAME).then(cache => {
                return cache.match(newUrl).then(cachedResponse => {
                    const fetchedResponse = fetch(event.request).then(networkResponse => {
                        cache.put(newUrl, networkResponse.clone());
                        return networkResponse;
                    }).catch(() => null);
                    return cachedResponse || fetchedResponse;
                });
            })
        );
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