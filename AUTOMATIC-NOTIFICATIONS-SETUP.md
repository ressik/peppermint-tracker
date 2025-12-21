# Automatic FCM Notifications Setup Guide (Updated for FCM v1 API)

This guide will help you set up automatic push notifications that are sent when:
- Someone uploads a new photo to the gallery
- Someone sends a message in the chat

**Note:** This guide uses the modern FCM HTTP v1 API (not the deprecated legacy API).

## What I've Already Set Up

✅ Created `fcm_tokens` table to store device tokens
✅ Updated app to save FCM tokens to database when users grant permission
✅ Created Supabase Edge Functions to send notifications using FCM v1 API
✅ Created Edge Function for photo uploads (`notify-photo-upload`)
✅ Created Edge Function for chat messages (`notify-chat-message`)
✅ Created shared FCM utility with OAuth2 support

## What You Need to Do

Follow these steps to complete the setup:

---

## Step 1: Run the FCM Tokens SQL Setup

1. Go to your Supabase project: https://supabase.com/dashboard
2. Click on your project (peppermintpals)
3. Go to **SQL Editor** in the left sidebar
4. Click **New query**
5. Copy the entire contents of `supabase-fcm-tokens-setup.sql`
6. Paste into the query editor
7. Click **Run**

This creates the `fcm_tokens` table where device tokens are stored.

---

## Step 2: Get Your Firebase Service Account Key

The modern FCM API requires a service account JSON file instead of the deprecated server key.

1. Go to Firebase Console: https://console.firebase.google.com
2. Click on your project (peppermintpals)
3. Click the **gear icon** ⚙️ (Project Settings)
4. Go to the **Service accounts** tab
5. Click **Generate new private key**
6. Click **Generate key** in the popup
7. A JSON file will download - **keep this safe!**

The JSON file looks like this:
```json
{
  "type": "service_account",
  "project_id": "peppermintpals",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-...@peppermintpals.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "...",
  "client_x509_cert_url": "..."
}
```

**IMPORTANT:** This file contains your private key - never commit it to git or share it publicly!

---

## Step 3: Install Supabase CLI

Open your terminal and install the Supabase CLI:

**Mac/Linux:**
```bash
brew install supabase/tap/supabase
```

**Or using npm:**
```bash
npm install -g supabase
```

**Verify installation:**
```bash
supabase --version
```

---

## Step 4: Link Your Supabase Project

In your project directory:

```bash
cd /Users/ressik/Projects/peppermint-tracker
supabase login
```

This will open a browser to authenticate. Once logged in:

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

**To find your PROJECT_REF:**
1. Go to your Supabase dashboard
2. Click Settings → General
3. Copy the "Reference ID" (it's a short code like `abcdefghijklm`)

---

## Step 5: Set Environment Variable with Service Account

You need to store the Firebase service account JSON as a Supabase secret.

**Method 1: Using the entire JSON file (Recommended)**

First, minify the JSON (remove all whitespace and newlines):

```bash
cat ~/Downloads/peppermintpals-*.json | tr -d '\n' | tr -d ' '
```

This will output one long line. Copy that output, then:

```bash
supabase secrets set FIREBASE_SERVICE_ACCOUNT='PASTE_THE_MINIFIED_JSON_HERE'
```

**Method 2: Manual minification**

Open the downloaded JSON file, and create one single line with no spaces:
- Remove all newlines
- Remove all extra spaces
- Keep it as one continuous string

Then set it:

```bash
supabase secrets set FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"peppermintpals",...}'
```

**Verify it's set:**
```bash
supabase secrets list
```

You should see `FIREBASE_SERVICE_ACCOUNT` in the list.

---

## Step 6: Deploy Edge Functions

Deploy both Edge Functions to Supabase:

```bash
# Deploy photo notification function
supabase functions deploy notify-photo-upload

# Deploy chat notification function
supabase functions deploy notify-chat-message
```

You should see success messages for both deployments.

**If you get errors**, try deploying with the `--no-verify-jwt` flag:
```bash
supabase functions deploy notify-photo-upload --no-verify-jwt
supabase functions deploy notify-chat-message --no-verify-jwt
```

---

## Step 7: Create Database Triggers (Webhooks)

Now we need to tell Supabase to call these Edge Functions when photos or messages are inserted.

### Method A: Using Supabase Dashboard (Easier)

1. Go to Supabase Dashboard → **Database** → **Webhooks**
2. Click **Create a new hook** or **Enable Webhooks**

**For Photo Uploads:**
3. Fill in:
   - **Name**: `notify-photo-upload-webhook`
   - **Table**: `photos`
   - **Events**: Check only `Insert`
   - **Type**: Select `Supabase Edge Function`
   - **Edge Function**: Select `notify-photo-upload`
4. Click **Create webhook**

**For Chat Messages:**
5. Click **Create a new hook** again
6. Fill in:
   - **Name**: `notify-chat-message-webhook`
   - **Table**: `messages`
   - **Events**: Check only `Insert`
   - **Type**: Select `Supabase Edge Function`
   - **Edge Function**: Select `notify-chat-message`
7. Click **Create webhook**

### Method B: Using SQL (Alternative)

If webhooks UI isn't available, you can create triggers with SQL:

```sql
-- Create function to call Edge Function for photo uploads
CREATE OR REPLACE FUNCTION notify_photo_upload()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
  payload JSON;
BEGIN
  function_url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/notify-photo-upload';

  payload := json_build_object(
    'type', 'INSERT',
    'table', 'photos',
    'record', row_to_json(NEW)
  );

  PERFORM net.http_post(
    url := function_url,
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('request.jwt.claims', true)::json->>'role' || '"}'::jsonb,
    body := payload::jsonb
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER on_photo_insert
  AFTER INSERT ON photos
  FOR EACH ROW
  EXECUTE FUNCTION notify_photo_upload();

-- Similar for chat messages
CREATE OR REPLACE FUNCTION notify_chat_message()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
  payload JSON;
BEGIN
  function_url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/notify-chat-message';

  payload := json_build_object(
    'type', 'INSERT',
    'table', 'messages',
    'record', row_to_json(NEW)
  );

  PERFORM net.http_post(
    url := function_url,
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('request.jwt.claims', true)::json->>'role' || '"}'::jsonb,
    body := payload::jsonb
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_message_insert
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_chat_message();
```

(Replace `YOUR_PROJECT_REF` with your actual Supabase project reference)

---

## Step 8: Test the Setup

### Test Photo Notifications:

1. Make sure your app is deployed
2. Visit your app on your phone
3. Accept notification permission when prompted
4. Check browser console - you should see FCM token saved to database
5. On another device (or desktop), upload a photo to the gallery
6. You should receive a notification on your phone! 🎉

### Test Chat Notifications:

1. Make sure you're logged into chat on your phone
2. On another device, send a chat message
3. You should receive a notification on your phone! 🎉

### Check Edge Function Logs:

1. Go to Supabase Dashboard
2. Click **Edge Functions** in the left sidebar
3. Click on `notify-photo-upload` or `notify-chat-message`
4. Click **Logs** tab
5. You should see logs showing:
   - "New photo uploaded" or "New chat message"
   - "Sent X notifications out of Y tokens"

---

## How It Works

```
User uploads photo
       ↓
Supabase Database (INSERT)
       ↓
Database Webhook triggers Edge Function
       ↓
Edge Function:
  1. Fetches all FCM tokens from fcm_tokens table
  2. Gets OAuth2 access token from service account
  3. Calls FCM v1 API for each token
       ↓
Firebase FCM Server
       ↓
Push Notification to User's Device 📱
```

---

## Troubleshooting

### "Edge function not found"
- Make sure you deployed: `supabase functions deploy notify-photo-upload`
- Check: `supabase functions list`

### "Failed to send notification" or "401 Unauthorized"
- Check your Firebase service account JSON is set correctly
- Verify: `supabase secrets list` shows `FIREBASE_SERVICE_ACCOUNT`
- Make sure the JSON is minified (no newlines/extra spaces)
- Check Edge Function logs for the exact error

### "Private key parse error"
- The private key in your JSON might have escaped newlines (`\n`)
- Make sure they're actual newlines or properly escaped
- Try setting the secret again with the minified JSON

### "No tokens found"
- Visit the app and accept notification permission
- Check `fcm_tokens` table in Supabase: Dashboard → Table Editor → fcm_tokens
- Make sure there are rows with valid tokens

### Notifications not reaching device
- Test the FCM token manually from Firebase Console first
- Check that notification permission is granted on device
- Look at Edge Function logs for errors
- Try sending a test from Firebase Console → Messaging

### Webhook not triggering
- Check Database → Webhooks in Supabase Dashboard
- Make sure webhook is enabled
- Check Edge Function logs to see if it's being called
- Try inserting a test row in SQL Editor to trigger manually

---

## Cost

**Supabase Edge Functions:**
- Free tier: 500K function invocations/month
- Your app uses very few (one per photo/message)

**Firebase Cloud Messaging:**
- Completely free
- Unlimited messages

---

## Security Notes

1. **Service Account**: Never commit the service account JSON to git
   - It's stored as a Supabase secret (encrypted)
   - Only Edge Functions can access it

2. **FCM Tokens**: Stored in public `fcm_tokens` table
   - Tokens are device-specific, not sensitive
   - Can't be used to impersonate users
   - Automatically expire if user uninstalls/revokes permission

3. **Edge Functions**: Run server-side
   - Users can't see your service account
   - OAuth tokens are generated on-demand
   - Tokens expire after 1 hour

---

## Summary

After completing these steps:

1. ✅ FCM tokens are automatically saved to database when users visit your app
2. ✅ When someone uploads a photo → Everyone gets notified
3. ✅ When someone sends a chat → Everyone except sender gets notified
4. ✅ Uses modern FCM v1 API (not deprecated legacy API)
5. ✅ Works reliably on Android, iOS, and desktop
6. ✅ Works even when app is closed

You're all set up for automatic notifications! 🚀
