importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.2/firebase-messaging-compat.js');



async function initFirebaseMessaging() {
  try {
    const resp = await fetch('/api/public-firebase-config');
    if (!resp.ok) throw new Error('Failed to fetch firebase config');
    const body = await resp.json();
    const cfg = body && body.config;
    if (!cfg || !cfg.apiKey) throw new Error('Invalid firebase config');

    firebase.initializeApp(cfg);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage(function(payload) {
      console.log('[firebase-messaging-sw.js] Received background message ', payload);
      const notificationTitle = (payload && payload.notification && payload.notification.title) || 'Duman';
      const notificationOptions = {
        body: (payload && payload.notification && payload.notification.body) || '',
        icon: '/favicon.ico',
        data: (payload && payload.data) || {}
      };
      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  } catch (e) {
    console.error('Firebase SW init failed', e);
  }
}

// Initialize during service worker startup
initFirebaseMessaging();
