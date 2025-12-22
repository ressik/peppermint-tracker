'use client';

import { useEffect, useState } from 'react';

export default function DebugServiceWorker() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    checkServiceWorkers();
  }, []);

  const checkServiceWorkers = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        console.log('All service worker registrations:', regs);
        setRegistrations(regs);
      } else {
        setError('Service workers not supported');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const unregisterAll = async () => {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        await reg.unregister();
        console.log('Unregistered:', reg);
      }
      alert('All service workers unregistered. Refresh the page.');
      setRegistrations([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-white mb-6">Service Worker Debug</h1>

      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-6">
        <button
          onClick={checkServiceWorkers}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded mr-2"
        >
          Refresh
        </button>
        <button
          onClick={unregisterAll}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
        >
          Unregister All
        </button>
      </div>

      <div className="bg-white/10 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Active Registrations ({registrations.length})
        </h2>

        {registrations.length === 0 ? (
          <p className="text-white/60">No service workers registered</p>
        ) : (
          <div className="space-y-4">
            {registrations.map((reg, index) => (
              <div key={index} className="bg-black/30 rounded p-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-white/60">Scope:</div>
                  <div className="text-white font-mono">{reg.scope}</div>

                  <div className="text-white/60">Active:</div>
                  <div className="text-white">
                    {reg.active?.scriptURL || 'None'}
                  </div>

                  <div className="text-white/60">Installing:</div>
                  <div className="text-white">
                    {reg.installing?.scriptURL || 'None'}
                  </div>

                  <div className="text-white/60">Waiting:</div>
                  <div className="text-white">
                    {reg.waiting?.scriptURL || 'None'}
                  </div>

                  <div className="text-white/60">State:</div>
                  <div className="text-white">
                    {reg.active?.state || 'Unknown'}
                  </div>
                </div>

                <button
                  onClick={async () => {
                    await reg.unregister();
                    checkServiceWorkers();
                  }}
                  className="mt-3 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                >
                  Unregister This One
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 bg-yellow-500/20 border border-yellow-500 text-yellow-200 px-4 py-3 rounded">
        <strong>Note:</strong> If you see multiple service workers registered at the same scope,
        that could be causing duplicate notifications. Unregister them all and refresh.
      </div>
    </div>
  );
}
