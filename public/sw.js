// Moffi Push Notification Service Worker
// Uygulama arka plandayken/kapalıyken gelen push mesajlarını dinler

self.addEventListener('push', (event) => {
    console.log('[SW] Push mesajı alındı!', event.data?.text());
    
    if (!event.data) return;

    let payload;
    try {
        payload = event.data.json();
    } catch (e) {
        payload = { title: 'Moffi', body: event.data.text() };
    }

    const title = payload.title || 'Moffi Hatırlatma 🐾';
    const options = {
        body: payload.body || '',
        data: { url: payload.url || '/' },
        tag: payload.tag || 'moffi-reminder',
    };

    console.log('[SW] Bildirim gösteriliyor:', title, options);
    
    event.waitUntil(
        self.registration.showNotification(title, options).then(() => {
            console.log('[SW] Bildirim başarıyla gösterildi.');
        }).catch(err => {
            console.error('[SW] Bildirim gösterme hatası:', err);
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Bildirime tıklandı!');
    event.notification.close();
    const url = event.notification.data?.url || '/';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes(url) && 'focus' in client) return client.focus();
            }
            if (clients.openWindow) return clients.openWindow(url);
        })
    );
});
