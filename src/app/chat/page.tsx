'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Message {
  id: string;
  name: string;
  message: string;
  createdAt: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userName, setUserName] = useState('');
  const [hasEnteredName, setHasEnteredName] = useState(false);
  const [inputName, setInputName] = useState('');
  const [messageText, setMessageText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Register service worker and request notification permission
  useEffect(() => {
    if (hasEnteredName && typeof window !== 'undefined') {
      // Register service worker
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('Service Worker registered:', registration);
          })
          .catch((error) => {
            console.log('Service Worker registration failed:', error);
          });
      }

      // Request notification permission
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          setNotificationsEnabled(true);
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
              setNotificationsEnabled(true);
            }
          });
        }
      }
    }
  }, [hasEnteredName]);

  // Fetch initial messages and subscribe to new ones
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
        setMessages(
          data.map((m) => ({
            id: m.id,
            name: m.name,
            message: m.message,
            createdAt: m.created_at,
          }))
        );
      }
      setIsLoading(false);
    };

    fetchMessages();

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
          const newMessage: Message = {
            id: payload.new.id,
            name: payload.new.name,
            message: payload.new.message,
            createdAt: payload.new.created_at,
          };

          console.log('New message received:', newMessage);
          console.log('Current userName:', userName);
          console.log('Notifications enabled:', notificationsEnabled);
          console.log('Notification permission:', Notification.permission);

          setMessages((prev) => [...prev, newMessage]);

          // Show notification for messages from others
          if (newMessage.name !== userName) {
            console.log('Message is from someone else, attempting notification...');

            // Vibrate on mobile
            if ('vibrate' in navigator) {
              navigator.vibrate(200);
            }

            if (typeof window !== 'undefined' && 'Notification' in window) {
              if (Notification.permission === 'granted') {
                console.log('Showing notification');
                try {
                  const notification = new Notification(`New message from ${newMessage.name}`, {
                    body: newMessage.message,
                    icon: '/favicon.ico',
                    badge: '/favicon.ico',
                    tag: 'peppermint-chat',
                    requireInteraction: false,
                    silent: false,
                    vibrate: [200, 100, 200],
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

    return () => {
      supabase.removeChannel(channel);
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
    });

    if (error) {
      console.error('Error sending message:', error);
    } else {
      setMessageText('');
    }
  };

  const handleChangeName = () => {
    setHasEnteredName(false);
    setInputName('');
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
            vibrate: [200, 100, 200],
          });
          console.log('Test notification created:', notification);
          alert('Notification sent! Check if you received it.');
        } catch (error) {
          console.error('Error creating test notification:', error);
          alert('Error creating notification: ' + error.message);
        }
      } else {
        alert('Notification permission not granted. Permission: ' + Notification.permission);
      }
    } else {
      alert('Notifications not supported in this browser');
    }
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
            <button
              onClick={testNotification}
              className="text-xs px-3 py-1 text-white/70 border border-white/20 rounded-full hover:bg-white/10 transition-all"
            >
              Test Notification
            </button>
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
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.name === userName ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    msg.name === userName
                      ? 'bg-[#c41e3a] text-white'
                      : 'bg-white/10 text-white/90'
                  }`}
                >
                  {msg.name !== userName && (
                    <p className="text-xs font-medium mb-1 opacity-80">{msg.name}</p>
                  )}
                  <p className="text-sm break-words">{msg.message}</p>
                  <p className="text-xs opacity-60 mt-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-[#ffd700]"
        />
        <button
          type="submit"
          disabled={!messageText.trim()}
          className="px-6 py-3 text-sm font-medium text-white bg-[#c41e3a] rounded-lg hover:bg-[#a31830] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
}
