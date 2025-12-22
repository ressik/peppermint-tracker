# FCM Notification Debugging Checklist

## On Your Device (Phone/Desktop):

### 1. Check Service Worker
Open your app, then:
- Chrome: Menu → More Tools → Developer Tools → Application tab → Service Workers
- Look for `/firebase-messaging-sw.js`
- Is it **Activated and Running**?
- Any errors shown?

### 2. Check Notification Permission
- Chrome: Click the lock icon 🔒 in address bar
- Click "Permissions" or "Site Settings"
- Is "Notifications" set to **Allow**?

### 3. Check Browser Console Logs
Open Console (F12 or Menu → Developer Tools → Console)
Look for these messages:
- ✅ "Service Worker registered"
- ✅ "Service Worker ready"
- ✅ "FCM Token: ..."
- ❌ Any errors in red?

### 4. Test if Service Worker Can Show Notifications
In the browser console, run this test:
```javascript
navigator.serviceWorker.ready.then(function(registration) {
  registration.showNotification('Test', {
    body: 'This is a manual test',
    icon: '/icon-192.png'
  });
});
```
Did a notification appear? If YES → Service worker works. If NO → Service worker issue.

## Common Issues & Fixes:

### Issue: "Service Worker not found" or 404 error
**Problem:** `/firebase-messaging-sw.js` not accessible
**Fix:** Make sure the file is in `/public/firebase-messaging-sw.js`
**Verify:** Visit `https://your-site.com/firebase-messaging-sw.js` directly

### Issue: Service Worker shows "Redundant" or "Error"
**Problem:** Service worker failed to activate
**Fix:**
1. Unregister old service workers: Application tab → Service Workers → Unregister
2. Clear cache: Application tab → Clear storage → Clear site data
3. Reload page

### Issue: Token generated but test notification doesn't arrive
**Problem:** Token might be for wrong project or invalid
**Check:**
1. Does the token start with a long random string? (Good)
2. In Firebase Console, are you testing on the correct project (peppermintpals)?
3. Is the VAPID key the same in both client code and Firebase Console?

### Issue: "FCM Token: undefined" or no token
**Problem:** Token generation failed
**Check console for error messages:**
- "Notification permission denied" → User denied permission
- "Service Worker not supported" → Browser doesn't support SW
- "Firebase Messaging is not supported" → Browser/context issue

### Issue: Works on desktop but not mobile
**Problem:** Mobile Chrome has stricter requirements
**Fix:**
1. Must be HTTPS (not HTTP) - Vercel handles this ✓
2. Must be installed as PWA for background notifications
3. Battery optimization might block notifications
4. Try in incognito mode first

## Quick Test Steps:

### Test 1: Verify Service Worker File Exists
Visit: `https://your-deployed-site.com/firebase-messaging-sw.js`
Should see: JavaScript code (not 404)

### Test 2: Check if Token is Saved to Database
1. Supabase Dashboard → Table Editor → fcm_tokens
2. Find your token
3. Is the `updated_at` recent?

### Test 3: Manual Console Test
In browser console, paste and run:
```javascript
// Get current token
localStorage.getItem('fcm-token')

// Check service worker
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Registered service workers:', registrations);
});

// Check notification permission
console.log('Notification permission:', Notification.permission);
```

### Test 4: Send Test from Console
Still in browser console:
```javascript
// Show notification directly (bypass FCM)
new Notification('Direct Test', {
  body: 'If you see this, notifications work!',
  icon: '/icon-192.png'
});
```
If this doesn't work → Notification permission issue

## What to Share with Me:

To help debug further, please share:
1. **Console logs** when you load the page (screenshot or copy/paste)
2. **Service Worker status** (screenshot of Application → Service Workers tab)
3. **Any error messages** in console (in red)
4. **Result of manual tests** above (which ones worked/failed)
5. **Are you testing on:**
   - [ ] Desktop Chrome
   - [ ] Android Chrome
   - [ ] iOS Safari
   - [ ] Other: ___

## My Suspicion:

Based on "token is set but test doesn't work", likely causes:
1. **Service worker not actually active** (check Application tab)
2. **HTTPS issue** (is your deployed site HTTPS?)
3. **Wrong Firebase project** (double-check in Firebase Console)
4. **Token expired or invalid** (generate new one by clearing cache)
