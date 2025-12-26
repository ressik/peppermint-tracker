// Firebase Cloud Messaging Service Worker
console.log('[Service Worker] Loading firebase-messaging-sw.js');

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase only if not already initialized
if (!firebase.apps.length) {
  console.log('[Service Worker] Initializing Firebase');
  firebase.initializeApp({
    apiKey: "AIzaSyA5AZ3azcQOijeG1ZdARgTJC5XzeaXaQNg",
    authDomain: "peppermintpals.firebaseapp.com",
    projectId: "peppermintpals",
    storageBucket: "peppermintpals.firebasestorage.app",
    messagingSenderId: "374454297190",
    appId: "1:374454297190:web:2cf706b02b981ea28c83a7",
    measurementId: "G-37NBC8JGRV"
  });
} else {
  console.log('[Service Worker] Firebase already initialized');
}

const messaging = firebase.messaging();
console.log('[Service Worker] Firebase messaging instance created');

// Track if we've already shown a notification to prevent duplicates
let lastNotificationTime = 0;
let lastNotificationHash = '';
let handlerRegistered = false;

// Handle background messages
// This is the ONLY place we should show notifications
if (!handlerRegistered) {
  console.log('[Service Worker] Registering onBackgroundMessage handler');
  handlerRegistered = true;

  messaging.onBackgroundMessage((payload) => {
    console.log('[Service Worker] onBackgroundMessage called:', payload);

    // IMPORTANT: If the payload contains a "notification" object, the browser will
    // automatically display it. We should NOT manually show it here, or we'll get duplicates.
    // Only handle data-only messages (no notification object).
    if (payload.notification) {
      console.log('[Service Worker] Notification payload detected - browser will auto-display. Skipping manual display.');
      return Promise.resolve();
    }

    // Handle data-only messages
    const notificationTitle = payload.data?.title || 'Peppermint Tracker';
    const notificationBody = payload.data?.body || 'New update!';

    // Create a hash of the notification to detect duplicates
    const notificationHash = hashString(notificationTitle + notificationBody);
    const currentTime = Date.now();

    // If we just showed this exact notification within the last second, skip it
    if (notificationHash === lastNotificationHash && (currentTime - lastNotificationTime) < 1000) {
      console.log('[Service Worker] Duplicate notification detected, skipping');
      return Promise.resolve();
    }

    lastNotificationHash = notificationHash;
    lastNotificationTime = currentTime;

    const tag = 'peppermint-' + notificationHash;

    const notificationOptions = {
      body: notificationBody,
      icon: '/icon-192.png',
      badge: '/icon-96.png',
      tag: tag,
      requireInteraction: false,
      data: payload.data || {},
      renotify: false,
    };

    console.log('[Service Worker] Showing notification:', notificationTitle, 'with tag:', tag);
    return self.registration.showNotification(notificationTitle, notificationOptions);
  });
} else {
  console.log('[Service Worker] Handler already registered, skipping');
}

// Simple hash function to create unique tags
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
