// Supabase Edge Function to send FCM notifications when new chat message is posted
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sendFCMNotification } from '../_shared/fcm.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  try {
    const { record } = await req.json()

    console.log('New chat message:', record)

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get all FCM tokens from database
    // Filter out the sender's token so they don't get notified of their own message
    const { data: tokens, error: tokensError } = await supabase
      .from('fcm_tokens')
      .select('token, user_name')
      .neq('user_name', record.name) // Don't notify the sender

    if (tokensError) {
      console.error('Error fetching tokens:', tokensError)
      return new Response(JSON.stringify({ error: 'Failed to fetch tokens' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!tokens || tokens.length === 0) {
      console.log('No FCM tokens to notify')
      return new Response(JSON.stringify({ message: 'No tokens to notify' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Prepare notification content
    const senderName = record.name || 'Someone'
    const message = record.message || 'New message'

    // Truncate message if too long
    const messagePreview = message.length > 100
      ? message.substring(0, 100) + '...'
      : message

    const notificationTitle = `${senderName} sent a message`
    const notificationBody = messagePreview

    // Send notification to each token
    const sendPromises = tokens.map(async ({ token }) => {
      return await sendFCMNotification(token, notificationTitle, notificationBody, '/chat')
    })

    const results = await Promise.all(sendPromises)
    const successCount = results.filter(r => r === true).length

    console.log(`Sent ${successCount} notifications out of ${tokens.length} tokens`)

    return new Response(
      JSON.stringify({
        success: true,
        sentCount: successCount,
        totalTokens: tokens.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in notify-chat-message function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})
