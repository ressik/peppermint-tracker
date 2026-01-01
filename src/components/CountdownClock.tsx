'use client';

import { useState, useEffect } from 'react';

export default function CountdownClock() {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isComplete, setIsComplete] = useState<boolean>(false);

  useEffect(() => {
    const updateCountdown = () => {
      // Get current time in Mountain Time
      const now = new Date();
      const mtTimeString = now.toLocaleString('en-US', {
        timeZone: 'America/Denver',
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      // Parse the Mountain Time string to create a Date object
      // Format: "MM/DD/YYYY, HH:MM:SS"
      const [datePart, timePart] = mtTimeString.split(', ');
      const [month, day, year] = datePart.split('/').map(Number);
      const [hour, minute, second] = timePart.split(':').map(Number);

      const currentMT = new Date(year, month - 1, day, hour, minute, second);

      // Create target date: December 12, 2026 at midnight Mountain Time
      const targetMT = new Date(2026, 11, 12, 0, 0, 0); // Month is 0-indexed (11 = December)

      // Calculate difference in milliseconds
      const diff = targetMT.getTime() - currentMT.getTime();

      // If countdown is over, hide the timer
      if (diff <= 0) {
        setIsComplete(true);
        return;
      }

      // Convert to days, hours, minutes, seconds
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      // Format with zero-padding
      const formatted = `${String(days).padStart(3, '0')}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      setTimeRemaining(formatted);
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  // Hide the component when countdown is complete
  if (isComplete) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto mb-12 px-4">
      <div className="bg-gradient-to-br from-[#c41e3a]/20 to-[#c41e3a]/10 border border-[#c41e3a]/30 rounded-2xl p-8 sm:p-12 text-center shadow-2xl">
        <p className="text-white/70 text-sm sm:text-base uppercase tracking-widest mb-4">
          Time until Peppermint comes out to play again!
        </p>
        <div className="font-mono text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-wider mb-2">
          {timeRemaining || '000:00:00:00'}
        </div>
        <div className="flex justify-center gap-4 sm:gap-8 text-white/60 text-xs sm:text-sm uppercase tracking-widest mt-4">
          <span>Days</span>
          <span>Hours</span>
          <span>Minutes</span>
          <span>Seconds</span>
        </div>
      </div>
    </div>
  );
}
