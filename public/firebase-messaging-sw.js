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
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'Peppermint Tracker';
  const notificationOptions = {
    body: payload.notification?.body || 'New update!',
    icon: '/icon-192.png',
    badge: '/icon-96.png',
    tag: 'peppermint-notification',
    requireInteraction: false,
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
