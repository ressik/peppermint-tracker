'use client';

import { useState, useEffect } from 'react';
import { getFCMToken } from '@/lib/firebase';

export default function FCMTestPage() {
  const [token, setToken] = useState<string>('');
  const [swStatus, setSWStatus] = useState<string>('Checking...');
  const [notifPermission, setNotifPermission] = useState<string>('');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    // Check notification permission
    const permission = Notification.permission;
    setNotifPermission(permission);
    addLog(`Notification permission: ${permission}`);

    // Check service worker
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        addLog(`Service workers registered: ${registrations.length}`);

        registrations.forEach((reg, i) => {
          addLog(`SW ${i + 1}: ${reg.active?.scriptURL || 'inactive'} - State: ${reg.active?.state || 'none'}`);
        });

        if (registrations.length === 0) {
          setSWStatus('❌ No service workers registered');
        } else {
          const fcmSW = registrations.find(r => r.active?.scriptURL.includes('firebase-messaging-sw.js'));
          if (fcmSW) {
            setSWStatus(`✅ Active (${fcmSW.active?.state})`);
          } else {
            setSWStatus('⚠️ FCM service worker not found');
          }
        }
      } catch (error) {
        setSWStatus('❌ Error checking SW');
        addLog(`Error: ${error}`);
      }
    } else {
      setSWStatus('❌ Not supported');
      addLog('Service workers not supported');
    }

    // Check for existing token
    const existingToken = localStorage.getItem('fcm-token');
    if (existingToken) {
      setToken(existingToken);
      addLog(`Existing token found: ${existingToken.substring(0, 50)}...`);
    }
  };

  const requestToken = async () => {
    addLog('Requesting FCM token...');
    try {
      const newToken = await getFCMToken();
      if (newToken) {
        setToken(newToken);
        addLog(`✅ Token obtained: ${newToken.substring(0, 50)}...`);
      } else {
        addLog('❌ Failed to get token');
      }
    } catch (error) {
      addLog(`❌ Error: ${error}`);
    }
  };

  const testDirectNotification = async () => {
    addLog('Testing direct notification...');

    // First check permission
    addLog(`Current permission: ${Notification.permission}`);

    if (Notification.permission !== 'granted') {
      addLog('⚠️ Permission not granted. Requesting...');
      const permission = await Notification.requestPermission();
      addLog(`Permission result: ${permission}`);

      if (permission !== 'granted') {
        addLog('❌ Permission denied. Cannot show notifications.');
        return;
      }
    }

    try {
      addLog('Creating notification...');
      const notification = new Notification('Direct Test', {
        body: 'If you see this, basic notifications work!',
        icon: '/icon-192.png',
        tag: 'test-direct',
        requireInteraction: false,
      });

      addLog('✅ Notification object created');

      notification.onclick = () => {
        addLog('✅ Notification was clicked!');
      };

      notification.onerror = (error) => {
        addLog(`❌ Notification error: ${error}`);
      };

      notification.onshow = () => {
        addLog('✅ Notification shown!');
      };

      notification.onclose = () => {
        addLog('ℹ️ Notification closed');
      };

    } catch (error) {
      addLog(`❌ Error creating notification: ${error}`);
      if (error instanceof Error) {
        addLog(`Error details: ${error.message}`);
        addLog(`Error stack: ${error.stack}`);
      }
    }
  };

  const testSWNotification = async () => {
    addLog('Testing service worker notification...');

    // Check permission first
    if (Notification.permission !== 'granted') {
      addLog('❌ Notification permission not granted');
      return;
    }

    try {
      addLog('Getting service worker registration...');
      const registration = await navigator.serviceWorker.ready;
      addLog(`✅ Service worker ready: ${registration.active?.scriptURL}`);

      addLog('Calling registration.showNotification...');
      await registration.showNotification('SW Test', {
        body: 'If you see this, service worker notifications work!',
        icon: '/icon-192.png',
        badge: '/icon-96.png',
        tag: 'test-sw',
        requireInteraction: false,
      });

      addLog('✅ SW notification API called successfully');
      addLog('ℹ️ Check your notification area for the notification');

    } catch (error) {
      addLog(`❌ Error: ${error}`);
      if (error instanceof Error) {
        addLog(`Error details: ${error.message}`);
      }
    }
  };

  const checkBrowserSettings = () => {
    addLog('=== Browser & Device Settings ===');

    // Browser
    addLog(`Browser: ${navigator.userAgent}`);

    // HTTPS
    addLog(`Protocol: ${window.location.protocol} ${window.location.protocol === 'https:' ? '✅' : '❌ Must be HTTPS!'}`);

    // Notification API
    addLog(`Notification API: ${'Notification' in window ? '✅ Supported' : '❌ Not supported'}`);

    // Service Worker API
    addLog(`Service Worker API: ${'serviceWorker' in navigator ? '✅ Supported' : '❌ Not supported'}`);

    // Push API
    addLog(`Push API: ${'PushManager' in window ? '✅ Supported' : '❌ Not supported'}`);

    // Document visibility
    addLog(`Page visible: ${document.visibilityState}`);

    // Focus
    addLog(`Page focused: ${document.hasFocus()}`);

    // Check if running as PWA
    const isPWA = window.matchMedia('(display-mode: standalone)').matches;
    addLog(`Running as PWA: ${isPWA ? '✅ Yes' : 'ℹ️ No (running in browser)'}`);

    addLog('=== Notification Permission Details ===');
    addLog(`Permission: ${Notification.permission}`);

    if (Notification.permission === 'granted') {
      addLog('✅ Granted - notifications should work');
    } else if (Notification.permission === 'denied') {
      addLog('❌ DENIED - user blocked notifications');
      addLog('   Fix: Go to site settings and enable notifications');
    } else {
      addLog('⚠️ DEFAULT - user has not been asked yet');
    }
  };

  const unregisterSW = async () => {
    addLog('Unregistering all service workers...');
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        addLog(`Unregistered: ${registration.active?.scriptURL}`);
      }
      setSWStatus('❌ Unregistered');
      addLog('✅ All service workers unregistered. Reload page to re-register.');
    } catch (error) {
      addLog(`❌ Error: ${error}`);
    }
  };

  const fullReset = async () => {
    addLog('Performing full reset...');

    // Clear localStorage
    localStorage.removeItem('fcm-token');
    addLog('Cleared FCM token from localStorage');

    // Unregister service workers
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
      addLog('Unregistered all service workers');
    } catch (error) {
      addLog(`Error unregistering: ${error}`);
    }

    // Clear cache
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        await caches.delete(name);
      }
      addLog('Cleared all caches');
    }

    setToken('');
    setSWStatus('❌ Reset complete');
    addLog('✅ Full reset complete. Reload page to start fresh.');
  };

  const copyToken = () => {
    navigator.clipboard.writeText(token);
    addLog('✅ Token copied to clipboard');
  };

  const testDataOnlyFCM = async () => {
    addLog('=== Testing Data-Only FCM Notification ===');

    if (!token) {
      addLog('❌ No FCM token. Click "Request FCM Token" first.');
      return;
    }

    addLog('Sending data-only test notification via backend...');
    addLog('This should show EXACTLY ONE notification (not duplicates)');

    try {
      // Call the Supabase Edge Function directly
      const response = await fetch(
        'https://hyeutwfvmtekonqfnzpq.supabase.co/functions/v1/test-data-notification',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: token,
            title: '🧪 Data-Only Test',
            body: 'If you see this ONLY ONCE, it works! (Check timestamp)',
            timestamp: new Date().toLocaleTimeString(),
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        addLog('✅ Backend request successful');
        addLog(`Response: ${JSON.stringify(data)}`);
        addLog('🔔 Watch for notification - you should get EXACTLY ONE!');
      } else {
        const error = await response.text();
        addLog(`❌ Backend error: ${error}`);
      }
    } catch (error) {
      addLog(`❌ Error: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-green-900 to-red-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-6">FCM Diagnostic Tool</h1>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <h3 className="text-white/60 text-sm mb-2">Notification Permission</h3>
            <p className="text-white text-lg font-semibold">
              {notifPermission === 'granted' && '✅ Granted'}
              {notifPermission === 'denied' && '❌ Denied'}
              {notifPermission === 'default' && '⚠️ Not asked'}
              {!notifPermission && 'Checking...'}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <h3 className="text-white/60 text-sm mb-2">Service Worker</h3>
            <p className="text-white text-lg font-semibold">{swStatus}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <h3 className="text-white/60 text-sm mb-2">FCM Token</h3>
            <p className="text-white text-lg font-semibold">
              {token ? '✅ Generated' : '❌ None'}
            </p>
          </div>
        </div>

        {/* Token Display */}
        {token && (
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 mb-6">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-white/90 font-semibold">FCM Token:</h3>
              <button
                onClick={copyToken}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
              >
                Copy
              </button>
            </div>
            <p className="text-white/70 text-sm font-mono break-all">{token}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 mb-6">
          <h3 className="text-white text-lg font-semibold mb-4">Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={requestToken}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Request FCM Token
            </button>
            <button
              onClick={testDirectNotification}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Test Direct Notification
            </button>
            <button
              onClick={testSWNotification}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Test SW Notification
            </button>
            <button
              onClick={testDataOnlyFCM}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-semibold border-2 border-indigo-400"
            >
              🧪 Test Data-Only FCM (via Backend)
            </button>
            <button
              onClick={checkBrowserSettings}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
            >
              Check Browser Settings
            </button>
            <button
              onClick={unregisterSW}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Unregister Service Workers
            </button>
            <button
              onClick={fullReset}
              className="px-4 py-2 bg-red-800 text-white rounded hover:bg-red-900"
            >
              Full Reset (Clear Everything)
            </button>
            <button
              onClick={checkStatus}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Refresh Status
            </button>
          </div>
        </div>

        {/* Logs */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
          <h3 className="text-white text-lg font-semibold mb-4">Logs</h3>
          <div className="bg-black/30 rounded p-4 max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-white/40 text-sm">No logs yet...</p>
            ) : (
              logs.map((log, i) => (
                <p key={i} className="text-white/80 text-sm font-mono mb-1">
                  {log}
                </p>
              ))
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20 mt-6">
          <h3 className="text-white text-lg font-semibold mb-4">Testing Instructions</h3>

          <div className="mb-4">
            <h4 className="text-white/90 font-semibold mb-2">✅ Quick Test (Recommended):</h4>
            <ol className="text-white/80 text-sm space-y-2 list-decimal list-inside">
              <li>Click "Request FCM Token" and grant permission when prompted</li>
              <li>Click "🧪 Test Data-Only FCM (via Backend)" - you should get EXACTLY ONE notification</li>
              <li>Check the timestamp on the notification to confirm it's the latest one</li>
              <li>If you get duplicates, check the logs and service worker console</li>
            </ol>
          </div>

          <div className="mb-4">
            <h4 className="text-white/90 font-semibold mb-2">🔧 Advanced Tests:</h4>
            <ol className="text-white/80 text-sm space-y-2 list-decimal list-inside">
              <li>"Test Direct Notification" - Tests browser notification API</li>
              <li>"Test SW Notification" - Tests service worker notification</li>
              <li>"Check Browser Settings" - View detailed browser config</li>
            </ol>
          </div>

          <div className="bg-yellow-900/30 border border-yellow-500/50 rounded p-3">
            <p className="text-yellow-200 text-sm">
              <strong>⚠️ Important:</strong> The data-only test sends real FCM notifications through your backend.
              This is the same format used for real chat/photo notifications, so it's the best way to verify the duplicate fix works!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
