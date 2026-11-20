// Service Worker for Baitul Qur'an Al-Ikhwan Push & Local Device Notifications
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming push events
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: "Baitul Qur'an Al-Ikhwan", body: event.data.text() };
    }
  }

  const title = data.title || "Baitul Qur'an Al-Ikhwan";
  const options = {
    body: data.body || '',
    icon: '/logo.jpeg',
    badge: '/logo.jpeg',
    tag: data.tag || 'bqa-notification',
    renotify: false,
    data: {
      url: data.url || '/dashboard/guru'
    }
  };

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If any client window is actively visible, suppress OS push notification to avoid spam
      const isAnyVisible = clientList.some((c) => c.visibilityState === 'visible');
      if (isAnyVisible) {
        return;
      }
      return self.registration.showNotification(title, options);
    })
  );
});

// Handle incoming notification clicks on Phone / Tablet Lock Screen or Notification Shade
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/dashboard/guru';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a tab is already open, focus it and navigate
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.focus();
          if ('navigate' in client && urlToOpen) {
            client.navigate(urlToOpen);
          }
          return;
        }
      }
      // Otherwise open a new window/tab
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
