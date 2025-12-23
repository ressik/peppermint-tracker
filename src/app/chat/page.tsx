'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Reaction } from '@/lib/types';
import { getFCMToken, onMessageListener } from '@/lib/firebase';

interface Message {
  id: string;
  name: string;
  message: string;
  createdAt: string;
  replyTo?: string | null;
  replyToMessage?: {
    name: string;
    message: string;
  } | null;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userName, setUserName] = useState('');
  const [hasEnteredName, setHasEnteredName] = useState(false);
  const [inputName, setInputName] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const [showReactionDetailsModal, setShowReactionDetailsModal] = useState<{ emoji: string; users: string[] } | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const AVAILABLE_EMOJIS = ['👍', '❤️', '😂', '😭'];

  // Check for saved name in localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem('peppermint-chat-name');
      if (savedName) {
        setUserName(savedName);
        setHasEnteredName(true);
      }
    }
  }, []);

  // Initialize FCM when user enters chat
  useEffect(() => {
    if (hasEnteredName && typeof window !== 'undefined') {
      const initFCM = async () => {
        try {
          const token = await getFCMToken();
          if (token) {
            console.log('FCM token obtained for chat:', token);
            setNotificationsEnabled(true);
            localStorage.setItem('fcm-token', token);

            // Save token to Supabase database
            const { error } = await supabase
              .from('fcm_tokens')
              .upsert({
                token: token,
                user_name: userName,
                device_info: navigator.userAgent,
                updated_at: new Date().toISOString(),
              }, {
                onConflict: 'token',
              });

            if (error) {
              console.error('Error saving FCM token to database:', error);
            } else {
              console.log('FCM token saved to database');
            }
          }
        } catch (error) {
          console.error('Error initializing FCM in chat:', error);
        }
      };

      initFCM();

      // Listen for foreground messages
      onMessageListener((payload) => {
        console.log('[Chat] Foreground message received:', payload);
        console.log('[Chat] Document visible:', document.visibilityState, 'focused:', document.hasFocus());

        // Only show notification if this tab is visible and focused
        // This prevents multiple tabs from showing duplicate notifications
        if (document.visibilityState === 'visible' && document.hasFocus()) {
          if (Notification.permission === 'granted') {
            const title = payload.notification?.title || 'New Chat Message';
            const options = {
              body: payload.notification?.body || 'You have a new message',
              icon: '/icon-192.png',
              badge: '/icon-96.png',
            };
            console.log('[Chat] Showing foreground notification:', title);
            new Notification(title, options);
          }

          // Vibrate
          if ('vibrate' in navigator) {
            navigator.vibrate(200);
          }
        } else {
          console.log('[Chat] Tab not visible/focused, skipping foreground notification (service worker will handle it)');
        }
      });
    }
  }, [hasEnteredName]);

  // Fetch initial messages and reactions, subscribe to new ones
  useEffect(() => {
    if (!hasEnteredName) return;

    const fetchMessages = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        console.error('Error fetching messages:', error);
      } else {
        // Create a map of messages for easy lookup
        const messagesMap = new Map(data.map((m) => [m.id, m]));

        setMessages(
          data.map((m) => ({
            id: m.id,
            name: m.name,
            message: m.message,
            createdAt: m.created_at,
            replyTo: m.reply_to,
            replyToMessage: m.reply_to && messagesMap.get(m.reply_to)
              ? {
                  name: messagesMap.get(m.reply_to).name,
                  message: messagesMap.get(m.reply_to).message,
                }
              : null,
          }))
        );
      }
      setIsLoading(false);
    };

    fetchMessages();
    fetchReactions();

    // Subscribe to new messages
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('New message received:', payload.new);
          console.log('Current userName:', userName);
          console.log('Notifications enabled:', notificationsEnabled);
          console.log('Notification permission:', Notification.permission);

          setMessages((prev) => {
            // Look up the replied-to message if it exists
            const replyToMessage = payload.new.reply_to
              ? prev.find((m) => m.id === payload.new.reply_to)
              : null;

            const newMessage: Message = {
              id: payload.new.id,
              name: payload.new.name,
              message: payload.new.message,
              createdAt: payload.new.created_at,
              replyTo: payload.new.reply_to,
              replyToMessage: replyToMessage
                ? {
                    name: replyToMessage.name,
                    message: replyToMessage.message,
                  }
                : null,
            };

            return [...prev, newMessage];
          });

          // Show notification for messages from others
          if (payload.new.name !== userName) {
            console.log('Message is from someone else, attempting notification...');

            // Vibrate on mobile
            if ('vibrate' in navigator) {
              navigator.vibrate(200);
            }

            if (typeof window !== 'undefined' && 'Notification' in window) {
              if (Notification.permission === 'granted') {
                console.log('Showing notification');
                try {
                  const notification = new Notification(`New message from ${payload.new.name}`, {
                    body: payload.new.message,
                    icon: '/favicon.ico',
                    badge: '/favicon.ico',
                    tag: 'peppermint-chat',
                    requireInteraction: false,
                    silent: false,
                  });
                  console.log('Notification created:', notification);
                } catch (error) {
                  console.error('Error creating notification:', error);
                }
              } else {
                console.log('Notification permission not granted:', Notification.permission);
              }
            } else {
              console.log('Notifications not supported');
            }
          } else {
            console.log('Message is from current user, skipping notification');
          }
        }
      )
      .subscribe();

    // Subscribe to reactions
    const reactionsUnsubscribe = subscribeToReactions();

    return () => {
      supabase.removeChannel(channel);
      reactionsUnsubscribe();
    };
  }, [hasEnteredName, userName]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleEnterChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) return;

    const name = inputName.trim();
    setUserName(name);
    setHasEnteredName(true);

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('peppermint-chat-name', name);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const { error } = await supabase.from('messages').insert({
      name: userName,
      message: messageText.trim(),
      reply_to: replyingTo?.id || null,
    });

    if (error) {
      console.error('Error sending message:', error);
    } else {
      setMessageText('');
      setReplyingTo(null);
    }
  };

  const handleChangeName = () => {
    setHasEnteredName(false);
    setInputName('');
  };

  // Fetch reactions for all messages
  const fetchReactions = async () => {
    const { data, error } = await supabase
      .from('reactions')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching reactions:', error);
    } else {
      setReactions(
        data.map((r) => ({
          id: r.id,
          messageId: r.message_id,
          userName: r.user_name,
          emoji: r.emoji,
          createdAt: r.created_at,
        }))
      );
    }
  };

  // Subscribe to reaction changes
  const subscribeToReactions = () => {
    const channel = supabase
      .channel('reactions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reactions',
        },
        (payload) => {
          const newReaction: Reaction = {
            id: payload.new.id,
            messageId: payload.new.message_id,
            userName: payload.new.user_name,
            emoji: payload.new.emoji,
            createdAt: payload.new.created_at,
          };
          setReactions((prev) => [...prev, newReaction]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'reactions',
        },
        (payload) => {
          setReactions((prev) => prev.filter((r) => r.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  // Handle adding a reaction
  const handleAddReaction = async (messageId: string, emoji: string) => {
    // Check if user already reacted with this emoji
    const existingReaction = reactions.find(
      (r) => r.messageId === messageId && r.userName === userName && r.emoji === emoji
    );

    if (existingReaction) {
      // Remove the reaction
      const { error } = await supabase
        .from('reactions')
        .delete()
        .eq('id', existingReaction.id);

      if (error) {
        console.error('Error removing reaction:', error);
      }
    } else {
      // Add the reaction
      const { error } = await supabase.from('reactions').insert({
        message_id: messageId,
        user_name: userName,
        emoji: emoji,
      });

      if (error) {
        console.error('Error adding reaction:', error);
      }
    }

    setShowReactionPicker(null);
  };

  // Get reactions for a specific message
  const getReactionsForMessage = (messageId: string) => {
    return reactions.filter((r) => r.messageId === messageId);
  };

  // Get reaction summary (grouped by emoji with counts and users)
  const getReactionSummary = (messageId: string) => {
    const messageReactions = getReactionsForMessage(messageId);
    const summary: { [emoji: string]: { count: number; users: string[] } } = {};

    messageReactions.forEach((r) => {
      if (!summary[r.emoji]) {
        summary[r.emoji] = { count: 0, users: [] };
      }
      summary[r.emoji].count++;
      summary[r.emoji].users.push(r.userName);
    });

    return summary;
  };

  const testNotification = () => {
    console.log('Test notification button clicked');

    if ('vibrate' in navigator) {
      navigator.vibrate(200);
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      console.log('Notification permission:', Notification.permission);
      if (Notification.permission === 'granted') {
        try {
          const notification = new Notification('Test Notification', {
            body: 'If you see this, notifications are working!',
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'test',
            requireInteraction: false,
            silent: false,
          });
          console.log('Test notification created:', notification);
          alert('Notification sent! Check if you received it.');
        } catch (error) {
          console.error('Error creating test notification:', error);
          alert('Error creating notification: ' + (error instanceof Error ? error.message : String(error)));
        }
      } else {
        alert('Notification permission not granted. Permission: ' + Notification.permission);
      }
    } else {
      alert('Notifications not supported in this browser');
    }
  };

  const renderMessageWithLinks = (text: string) => {
    // URL regex pattern that matches http(s) URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      // Check if this part is a URL
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white/80 transition-colors"
          >
            {part}
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Name prompt screen
  if (!hasEnteredName) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-light text-white mb-2">Chat Room</h1>
            <p className="text-white/60 text-sm">Enter your name to join the conversation</p>
          </div>

          <form onSubmit={handleEnterChat} className="card-christmas p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-[#ffd700]"
                required
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 text-sm font-medium text-white bg-[#c41e3a] rounded-lg hover:bg-[#a31830] transition-all"
            >
              Enter Chat
            </button>
            <Link
              href="/"
              className="block text-center text-sm text-white/60 hover:text-white transition-all"
            >
              ← Back to Gallery
            </Link>
          </form>
        </div>
      </div>
    );
  }

  // Chat room screen
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-screen flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-light text-white">Chat Room</h1>
          <div className="flex items-center gap-3">
            {userName === 'Tester' && (
              <button
                onClick={testNotification}
                className="text-xs px-3 py-1 text-white/70 border border-white/20 rounded-full hover:bg-white/10 transition-all"
              >
                Test Notification
              </button>
            )}
            <span className="text-sm text-white/60">
              Chatting as <span className="text-white/90 font-medium">{userName}</span>
            </span>
            <button
              onClick={handleChangeName}
              className="text-xs text-white/60 hover:text-white underline"
            >
              Change
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-sm text-white/70 hover:text-white transition-all"
          >
            ← Gallery
          </Link>
          <Link
            href="/map"
            className="text-sm text-white/70 hover:text-white transition-all"
          >
            Timeline
          </Link>
          <Link
            href="/leaderboard"
            className="text-sm text-white/70 hover:text-white transition-all"
          >
            Leaderboard
          </Link>
          <Link
            href="/rules"
            className="text-sm text-white/70 hover:text-white transition-all"
          >
            Rules
          </Link>
        </div>
      </div>

      {/* Messages Area */}
      <div className="card-christmas flex-1 overflow-hidden flex flex-col mb-4">
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {isLoading ? (
            <p className="text-white/40 text-sm text-center">Loading messages...</p>
          ) : messages.length === 0 ? (
            <p className="text-white/40 text-sm text-center">
              No messages yet. Start the conversation!
            </p>
          ) : (
            messages.map((msg, index) => {
              const reactionSummary = getReactionSummary(msg.id);
              const hasReactions = Object.keys(reactionSummary).length > 0;

              // Check if we need to show a date separator
              const currentDate = new Date(msg.createdAt).toLocaleDateString();
              const previousDate = index > 0
                ? new Date(messages[index - 1].createdAt).toLocaleDateString()
                : null;
              const showDateSeparator = index === 0 || currentDate !== previousDate;

              return (
                <React.Fragment key={msg.id}>
                  {/* Date Separator */}
                  {showDateSeparator && (
                    <div className="flex justify-center my-4">
                      <div className="bg-white/10 px-3 py-1 rounded-full">
                        <p className="text-white/60 text-xs font-medium">
                          {new Date(msg.createdAt).toLocaleDateString([], {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  <div
                    className={`flex ${msg.name === userName ? 'justify-end' : 'justify-start'}`}
                  >
                  <div className="flex flex-col max-w-[70%] relative group">
                    <div
                      className={`rounded-lg p-3 pr-10 relative ${
                        msg.name === userName
                          ? 'bg-[#c41e3a] text-white'
                          : 'bg-white/10 text-white/90'
                      }`}
                    >
                      {msg.name !== userName && (
                        <p className="text-xs font-medium mb-1 opacity-80">{msg.name}</p>
                      )}

                      {/* Show replied-to message if exists */}
                      {msg.replyToMessage && (
                        <div className="bg-black/20 rounded px-2 py-1.5 mb-2 border-l-2 border-white/30">
                          <p className="text-xs opacity-70 font-medium">{msg.replyToMessage.name}</p>
                          <p className="text-xs opacity-60 line-clamp-1">{msg.replyToMessage.message}</p>
                        </div>
                      )}

                      <p className="text-sm break-words">{renderMessageWithLinks(msg.message)}</p>
                      <p className="text-xs opacity-60 mt-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>

                      {/* Action Buttons */}
                      <div className="absolute bottom-2 right-2 flex items-center gap-1">
                        {/* Reply Button */}
                        <button
                          onClick={() => setReplyingTo(msg)}
                          className="w-6 h-6 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-xs transition-all"
                          title="Reply"
                        >
                          ↩
                        </button>
                        {/* Add Reaction Button */}
                        <button
                          onClick={() => setShowReactionPicker(showReactionPicker === msg.id ? null : msg.id)}
                          className="w-6 h-6 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-sm transition-all"
                          title="Add reaction"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Reaction Picker */}
                    {showReactionPicker === msg.id && (
                      <div className="absolute top-full right-0 mt-2 flex gap-1 bg-white/20 backdrop-blur-sm rounded-full p-1.5 shadow-lg z-50">
                        {AVAILABLE_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddReaction(msg.id, emoji);
                            }}
                            className="w-10 h-10 hover:bg-white/20 rounded-full flex items-center justify-center text-2xl transition-all hover:scale-110"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Display Reactions */}
                    {hasReactions && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Object.entries(reactionSummary).map(([emoji, { count, users }]) => {
                          const userReacted = users.includes(userName);
                          return (
                            <div
                              key={emoji}
                              className={`inline-flex items-center gap-0.5 rounded-full text-sm transition-all ${
                                userReacted
                                  ? 'bg-[#c41e3a]/80 text-white'
                                  : 'bg-white/10 text-white/80'
                              }`}
                            >
                              <button
                                onClick={() => handleAddReaction(msg.id, emoji)}
                                className="px-2.5 py-1.5 hover:scale-110 transition-all"
                              >
                                <span className="text-base">{emoji}</span>
                              </button>
                              <button
                                onClick={() => setShowReactionDetailsModal({ emoji, users })}
                                className="px-2 py-1.5 hover:bg-white/10 rounded-r-full transition-all"
                                title="See who reacted"
                              >
                                <span className="text-sm">{count}</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  </div>
                </React.Fragment>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="flex flex-col gap-2">
        {/* Reply Preview */}
        {replyingTo && (
          <div className="bg-white/10 rounded-lg p-3 border-l-2 border-[#c41e3a] flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs text-white/70 mb-1">Replying to {replyingTo.name}</p>
              <p className="text-sm text-white/60 line-clamp-1">{replyingTo.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="text-white/60 hover:text-white ml-2"
              title="Cancel reply"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex gap-2">
          <textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder={replyingTo ? `Reply to ${replyingTo.name}...` : "Type a message..."}
            rows={3}
            className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-[#ffd700] resize-none"
          />
          <button
            type="submit"
            disabled={!messageText.trim()}
            className="px-6 py-3 text-sm font-medium text-white bg-[#c41e3a] rounded-lg hover:bg-[#a31830] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>

      {/* Reaction Details Modal */}
      {showReactionDetailsModal && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setShowReactionDetailsModal(null)}
        >
          <div
            className="bg-[#0f7c3a] rounded-2xl p-6 max-w-sm w-full shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <span className="text-2xl">{showReactionDetailsModal.emoji}</span>
                <span>Reactions</span>
              </h3>
              <button
                onClick={() => setShowReactionDetailsModal(null)}
                className="text-white/60 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {showReactionDetailsModal.users.map((user, index) => (
                <div
                  key={index}
                  className="bg-white/10 rounded-lg px-4 py-2 text-white/90"
                >
                  {user}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
