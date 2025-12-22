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

// Create a broadcast channel to coordinate notifications across contexts (PWA + Browser)
const notificationChannel = new BroadcastChannel('notification-channel');
const pendingNotifications = new Set();

// Listen for notifications from other contexts
notificationChannel.onmessage = (event) => {
  if (event.data.type === 'notification-shown') {
    pendingNotifications.add(event.data.tag);
    // Remove after 1 second to allow fresh notifications with same content later
    setTimeout(() => pendingNotifications.delete(event.data.tag), 1000);
  }
};

// Handle background messages
messaging.onBackgroundMessage(async (payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'Peppermint Tracker';
  const notificationBody = payload.notification?.body || 'New update!';

  // Create a unique tag based on title and body
  const tag = 'peppermint-' + hashString(notificationTitle + notificationBody);

  // Check if another context already showed this notification
  if (pendingNotifications.has(tag)) {
    console.log('Notification already shown by another context, skipping');
    return;
  }

  // Mark this notification as being shown
  pendingNotifications.add(tag);
  notificationChannel.postMessage({ type: 'notification-shown', tag: tag });

  const notificationOptions = {
    body: notificationBody,
    icon: '/icon-192.png',
    badge: '/icon-96.png',
    tag: tag,
    requireInteraction: false,
    data: payload.data || {},
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
