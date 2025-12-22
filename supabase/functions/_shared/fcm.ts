// Shared FCM utilities for sending notifications using FCM HTTP v1 API

interface FCMMessage {
  token: string;
  webpush?: {
    notification?: {
      title?: string;
      body?: string;
      icon?: string;
    };
    fcm_options?: {
      link?: string;
    };
  };
}

export async function sendFCMNotification(
  token: string,
  title: string,
  body: string,
  link: string = '/'
): Promise<boolean> {
  try {
    const serviceAccount = JSON.parse(Deno.env.get('FIREBASE_SERVICE_ACCOUNT')!);
    const projectId = serviceAccount.project_id;

    // Get OAuth2 access token
    const accessToken = await getAccessToken(serviceAccount);

    // Construct FCM v1 API URL
    const fcmUrl = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

    // Prepare message payload
    // For web push, we send notification data in webpush section only
    // This prevents FCM from auto-displaying notifications on Android
    // and lets the service worker handle all notification display
    const message: FCMMessage = {
      token: token,
      webpush: {
        notification: {
          title: title,
          body: body,
          icon: '/icon-192.png',
        },
        fcm_options: {
          link: link,
        },
      },
    };

    // Send notification
    const response = await fetch(fcmUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`FCM Error for token ${token.substring(0, 20)}...`, error);
      return false;
    }

    console.log(`Notification sent to ${token.substring(0, 20)}...`);
    return true;
  } catch (error) {
    console.error(`Error sending notification:`, error);
    return false;
  }
}

// Get OAuth2 access token from service account
async function getAccessToken(serviceAccount: any): Promise<string> {
  const SCOPES = 'https://www.googleapis.com/auth/firebase.messaging';

  // Create JWT
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600; // Token valid for 1 hour

  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: iat,
    exp: exp,
    scope: SCOPES,
  };

  // Encode header and payload
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  // Sign with private key
  const signature = await signRS256(unsignedToken, serviceAccount.private_key);
  const jwt = `${unsignedToken}.${signature}`;

  // Exchange JWT for access token
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const data = await response.json();
  return data.access_token;
}

// Sign data using RS256
async function signRS256(data: string, privateKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  // Import private key
  const pemHeader = '-----BEGIN PRIVATE KEY-----';
  const pemFooter = '-----END PRIVATE KEY-----';
  const pemContents = privateKey
    .replace(pemHeader, '')
    .replace(pemFooter, '')
    .replace(/\s/g, '');

  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    false,
    ['sign']
  );

  // Sign
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    dataBuffer
  );

  // Encode signature
  return base64UrlEncode(signature);
}

// Base64 URL encode
function base64UrlEncode(data: string | ArrayBuffer): string {
  let base64: string;

  if (typeof data === 'string') {
    base64 = btoa(data);
  } else {
    const bytes = new Uint8Array(data);
    const binary = String.fromCharCode(...bytes);
    base64 = btoa(binary);
  }

  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
