// Supabase Edge Function to test data-only FCM notifications
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { sendFCMNotification } from '../_shared/fcm.ts'

serve(async (req) => {
  try {
    const { token, title, body, timestamp } = await req.json()

    if (!token) {
      return new Response(JSON.stringify({ error: 'Token required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log('Sending test notification to:', token.substring(0, 20) + '...')

    const notificationTitle = title || '🧪 Test Notification'
    const notificationBody = body || `Test sent at ${timestamp || new Date().toLocaleTimeString()}`

    const success = await sendFCMNotification(token, notificationTitle, notificationBody, '/fcm-test')

    if (success) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Data-only notification sent successfully!',
          sentAt: new Date().toISOString(),
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    } else {
      return new Response(
        JSON.stringify({ error: 'Failed to send notification' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
  } catch (error) {
    console.error('Error in test-data-notification function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})
