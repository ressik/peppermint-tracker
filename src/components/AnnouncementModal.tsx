'use client';

import { useState, useEffect } from 'react';

interface Announcement {
  id: string;
  title?: string;
  message: string;
  buttonText?: string;
}

// Update this configuration to show new announcements
const CURRENT_ANNOUNCEMENT: Announcement = {
  id: 'rules-update-2025-12', // Change this ID to show a new message
  title: 'Important Update',
  message: "As we've been watching the videos, we've decided to add a couple new rules for Peppermint's health. Please review the rules to ensure you're caught up! We want Peppermint to live a long and healthy life so we can do this again next year.",
  buttonText: 'Continue',
};

const STORAGE_KEY = 'peppermint-dismissed-announcements';

export default function AnnouncementModal() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if this announcement has been dismissed
    if (typeof window !== 'undefined') {
      const dismissedAnnouncements = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || '[]'
      ) as string[];

      if (!dismissedAnnouncements.includes(CURRENT_ANNOUNCEMENT.id)) {
        setIsVisible(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      const dismissedAnnouncements = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || '[]'
      ) as string[];

      if (!dismissedAnnouncements.includes(CURRENT_ANNOUNCEMENT.id)) {
        dismissedAnnouncements.push(CURRENT_ANNOUNCEMENT.id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissedAnnouncements));
      }
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4">
      <div className="card-christmas max-w-lg w-full p-6">
        {CURRENT_ANNOUNCEMENT.title && (
          <h2 className="text-2xl font-light text-white mb-4">
            {CURRENT_ANNOUNCEMENT.title}
          </h2>
        )}
        <p className="text-white/90 text-sm leading-relaxed mb-6">
          {CURRENT_ANNOUNCEMENT.message}
        </p>
        <button
          onClick={handleDismiss}
          className="w-full px-6 py-3 text-sm font-medium text-white bg-[#c41e3a] rounded-full hover:bg-[#a31830] transition-all"
        >
          {CURRENT_ANNOUNCEMENT.buttonText || 'Continue'}
        </button>
      </div>
    </div>
  );
}
