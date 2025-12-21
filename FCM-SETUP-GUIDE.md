# Firebase Cloud Messaging (FCM) Setup Guide

## What I've Implemented

I've set up Firebase Cloud Messaging in your app to provide **reliable push notifications** on both mobile and desktop devices. This is the same technology used by apps like WhatsApp, Facebook, etc.

### What's Been Done:

1. ✅ Installed Firebase SDK
2. ✅ Created Firebase configuration with your credentials
3. ✅ Created Firebase messaging service worker (`/public/firebase-messaging-sw.js`)
4. ✅ Updated gallery page to request FCM tokens
5. ✅ Updated chat page to request FCM tokens
6. ✅ Added foreground message listeners (when app is open)
7. ✅ Added background message handling (when app is closed)

## How FCM Works

### Client Side (What Happens in Your App):

1. **When user visits your site:**
   - App requests notification permission
   - If granted, Firebase generates a unique **FCM token** for that device/browser
   - Token is saved in localStorage (you can see it in browser console)

2. **Foreground notifications (app is open):**
   - Firebase receives the message
   - Your app's `onMessageListener` displays a notification

3. **Background notifications (app is closed/minimized):**
   - Service worker (`firebase-messaging-sw.js`) receives the message
   - Automatically displays notification
   - User can click to open your app

## Testing FCM

### Step 1: Local Testing

1. Run your app locally: `npm run dev`
2. Open http://localhost:3000
3. Accept notification permission when prompted
4. Open browser console (F12)
5. You should see: `FCM token obtained: [long token string]`
6. **Copy this token** - you'll need it for testing

### Step 2: Send a Test Notification from Firebase Console

1. Go to your Firebase Console: https://console.firebase.google.com
2. Click on your project (peppermintpals)
3. In the left sidebar, go to **Engage** → **Messaging**
4. Click **Create your first campaign** (or **New campaign**)
5. Select **Firebase Notification messages**
6. Fill in the form:
   - **Notification title**: "Test Notification"
   - **Notification text**: "This is a test from FCM!"
   - Click **Next**
7. Under **Target**:
   - Select **Send test message**
   - Paste the FCM token you copied earlier
   - Click the **+** button to add it
   - Click **Test**

You should receive a notification! 🎉

### Step 3: Deploy and Test on Mobile

1. Deploy your app to Vercel: `git push`
2. Open your app on your Android device
3. Accept notification permission
4. Check console for FCM token (or send a test message to see it working)
5. Close the app or switch to another app
6. Send a test notification from Firebase Console
7. You should receive the notification even when app is closed!

## Current Limitations

Right now, your app can:
- ✅ Request and receive FCM tokens
- ✅ Show foreground notifications (when app is open)
- ✅ Show background notifications (when app is closed)
- ✅ Handle notification clicks

What it **can't do yet** (requires backend):
- ❌ Automatically send notifications when someone uploads a photo
- ❌ Automatically send notifications when someone sends a chat message

## Next Steps: Automatic Notifications

To send notifications automatically when events happen (new photo, new chat), you need a backend component. Here are your options:

### Option 1: Supabase Edge Functions (Recommended)

Since you're already using Supabase, you can use their Edge Functions to send FCM notifications.

**What you'll need:**
1. Create an Edge Function that triggers on photo/message insert
2. Store user FCM tokens in a Supabase table
3. Use Firebase Admin SDK to send notifications

**Pros:**
- Integrates with your existing Supabase setup
- Serverless (no server to manage)
- Free tier available

**Cons:**
- Requires setting up Edge Functions
- Need to learn Deno (similar to Node.js)

### Option 2: Firebase Cloud Functions

Use Firebase's own serverless functions.

**Pros:**
- Native Firebase integration
- Easy to send FCM notifications
- Free tier available

**Cons:**
- Another service to manage
- Would need to sync data from Supabase to Firebase

### Option 3: Simple Node.js Backend

Create a simple API that Supabase webhooks can call.

**Pros:**
- Full control
- Can host on Vercel or any Node.js host

**Cons:**
- More code to maintain
- Need to set up server

## Storing FCM Tokens

To send automatic notifications, you need to store users' FCM tokens in a database. Here's a suggested schema:

```sql
-- Create FCM tokens table in Supabase
CREATE TABLE IF NOT EXISTS fcm_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT UNIQUE NOT NULL,
  user_identifier TEXT, -- Could be chat username or IP
  device_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS if needed
ALTER TABLE fcm_tokens ENABLE ROW LEVEL SECURITY;

-- Policy to allow anyone to insert/update their own token
CREATE POLICY "Allow token management" ON fcm_tokens
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

Then update your app to save tokens to Supabase:

```typescript
// After getting FCM token
const token = await getFCMToken();
if (token) {
  await supabase.from('fcm_tokens').upsert({
    token: token,
    user_identifier: userName || 'anonymous',
    device_info: navigator.userAgent,
  }, {
    onConflict: 'token'
  });
}
```

## Sending Notifications from Backend

Here's sample code for sending notifications using Firebase Admin SDK:

```javascript
// In your backend (Edge Function, Cloud Function, or API route)
import { initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

// Initialize Firebase Admin (one time)
initializeApp({
  credential: cert({
    projectId: "peppermintpals",
    // You'll need a service account key from Firebase Console
  })
});

// Send notification to specific token
async function sendNotification(fcmToken, title, body) {
  const message = {
    notification: {
      title: title,
      body: body,
    },
    token: fcmToken,
    webpush: {
      notification: {
        icon: '/icon-192.png',
        badge: '/icon-96.png',
      }
    }
  };

  try {
    const response = await getMessaging().send(message);
    console.log('Successfully sent message:', response);
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

// Example: Send notification to all users when new photo uploaded
async function notifyNewPhoto(uploaderName, caption) {
  // Get all FCM tokens from database
  const { data: tokens } = await supabase
    .from('fcm_tokens')
    .select('token');

  // Send to each token
  for (const { token } of tokens) {
    await sendNotification(
      token,
      `New photo from ${uploaderName}!`,
      caption || 'Check out the latest Peppermint sighting!'
    );
  }
}
```

## Troubleshooting

### "Messaging is not supported in this browser"
- Make sure you're on HTTPS (or localhost)
- Some browsers don't support FCM (Safari has limited support)

### No token is generated
- Check browser console for errors
- Make sure notification permission is granted
- Try in Incognito mode to rule out cache issues

### Notifications not showing on mobile
- Make sure app is installed as PWA
- Check that notification permission is granted in Android settings
- Verify FCM token was generated (check console logs)

### Service worker not registering
- Check that `firebase-messaging-sw.js` is in `/public` folder
- Check browser console for service worker errors
- Make sure you're on HTTPS or localhost

## Summary

You now have FCM fully set up! Your app can:
- Request notification permissions
- Generate FCM tokens
- Receive and display notifications (both foreground and background)
- Handle notification clicks

**To test it:**
1. Get your FCM token from browser console
2. Send a test notification from Firebase Console
3. See the notification appear!

**To enable automatic notifications:**
- You'll need to set up a backend (Supabase Edge Functions recommended)
- Store FCM tokens in a database
- Send notifications when events occur

Let me know if you want help setting up the automatic notification backend!
