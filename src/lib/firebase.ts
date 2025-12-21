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

    const messaging = getMessaging(app);

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    // Get FCM token
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

// Listen for foreground messages
export const onMessageListener = async (callback: (payload: any) => void) => {
  try {
    const messagingSupported = await isSupported();
    if (!messagingSupported) {
      return;
    }

    const messaging = getMessaging(app);
    onMessage(messaging, (payload) => {
      console.log('Message received in foreground:', payload);
      callback(payload);
    });
  } catch (error) {
    console.error('Error setting up message listener:', error);
  }
};

export { app };
