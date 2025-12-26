import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyA5AZ3azcQOijeG1ZdARgTJC5XzeaXaQNg",
  authDomain: "peppermintpals.firebaseapp.com",
  projectId: "peppermintpals",
  storageBucket: "peppermintpals.firebasestorage.app",
  messagingSenderId: "374454297190",
  appId: "1:374454297190:web:2cf706b02b981ea28c83a7",
  measurementId: "G-37NBC8JGRV"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// VAPID key for web push
const VAPID_KEY = 'BCA3h6I0hbLXtT2umTS3ykgT0pLIc_ny6olzp9hEFRsf7S_dNFcctdCiEhRqHnY0wzu6Ksapcs7qrY0K69y7uqk';

// Get FCM token
export const getFCMToken = async (): Promise<string | null> => {
  try {
    // Check if messaging is supported
    const messagingSupported = await isSupported();
    if (!messagingSupported) {
      console.log('Firebase Messaging is not supported in this browser');
      return null;
    }

    // Register service worker first
    let swRegistration;
    if ('serviceWorker' in navigator) {
      try {
        // Check if already registered
        const existingRegistration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');

        if (existingRegistration) {
          console.log('Service Worker already registered:', existingRegistration);
          swRegistration = existingRegistration;
        } else {
          // Register new service worker
          swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
            scope: '/'
          });
          console.log('Service Worker registered:', swRegistration);
        }

        // Wait for service worker to be ready and active
        await navigator.serviceWorker.ready;
        console.log('Service Worker ready');

        // Ensure we have an active service worker
        if (!swRegistration.active && !swRegistration.installing && !swRegistration.waiting) {
          console.error('No active service worker found');
          return null;
        }

        // Wait a bit for service worker to fully activate
        if (swRegistration.installing || swRegistration.waiting) {
          console.log('Waiting for service worker to activate...');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

      } catch (error) {
        console.error('Service Worker registration failed:', error);
        return null;
      }
    } else {
      console.log('Service Worker not supported');
      return null;
    }

    const messaging = getMessaging(app);

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    // Get FCM token with service worker registration
    try {
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swRegistration
      });

      if (!token) {
        console.error('Failed to get FCM token - no token returned');
        return null;
      }

      console.log('FCM Token:', token);
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      // If it's a pushManager error, try unregistering and re-registering
      if (error instanceof Error && error.message.includes('pushManager')) {
        console.log('Push manager error detected. Try unregistering service worker and refreshing page.');
      }
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

// Listen for foreground messages
export const onMessageListener = async (callback: (payload: any) => void): Promise<(() => void) | undefined> => {
  try {
    const messagingSupported = await isSupported();
    if (!messagingSupported) {
      return;
    }

    const messaging = getMessaging(app);
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Message received in foreground:', payload);
      callback(payload);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up message listener:', error);
  }
};

export { app };
