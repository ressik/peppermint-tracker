// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyA5AZ3azcQOijeG1ZdARgTJC5XzeaXaQNg",
  authDomain: "peppermintpals.firebaseapp.com",
  projectId: "peppermintpals",
  storageBucket: "peppermintpals.firebasestorage.app",
  messagingSenderId: "374454297190",
  appId: "1:374454297190:web:2cf706b02b981ea28c83a7",
  measurementId: "G-37NBC8JGRV"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(async (payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'Peppermint Tracker';
  const notificationBody = payload.notification?.body || 'New update!';

  // Create a unique tag based on title and body to prevent exact duplicates
  // but allow different notifications to show
  const tag = 'peppermint-' + hashString(notificationTitle + notificationBody);

  // Check if a notification with this tag is already showing
  const existingNotifications = await self.registration.getNotifications({ tag: tag });

  // If notification already exists, don't show duplicate
  if (existingNotifications.length > 0) {
    console.log('Notification already showing, skipping duplicate');
    return;
  }

  const notificationOptions = {
    body: notificationBody,
    icon: '/icon-192.png',
    badge: '/icon-96.png',
    tag: tag,
    requireInteraction: false,
    renotify: false, // Don't vibrate/sound for duplicate tags
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

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
