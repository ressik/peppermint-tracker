'use client';

import { useState, useEffect } from 'react';

export default function CountdownClock() {
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    const updateCountdown = () => {
      // Get current time
      const now = new Date();

      // Convert current time to Utah time (Mountain Time)
      // Use Intl.DateTimeFormat to get the current time in Mountain timezone
      const utahTimeString = now.toLocaleString('en-US', {
        timeZone: 'America/Denver',
        hour12: false,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      // Parse the Utah time string
      const [datePart, timePart] = utahTimeString.split(', ');
      const [month, day, year] = datePart.split('/');
      const [hours, minutes, seconds] = timePart.split(':');

      // Create a date object for current Utah time
      const utahNow = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes),
        parseInt(seconds)
      );

      // Create target time (12:00 PM today in Utah)
      const target = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        12, // 12 PM
        0,
        0
      );

      // If we've passed noon, set target to tomorrow
      if (utahNow >= target) {
        target.setDate(target.getDate() + 1);
      }

      // Calculate difference
      const diff = target.getTime() - utahNow.getTime();

      if (diff <= 0) {
        setTimeRemaining('00:00:00');
        return;
      }

      // Calculate hours, minutes, seconds
      const totalSeconds = Math.floor(diff / 1000);
      const countdownHours = Math.floor(totalSeconds / 3600);
      const countdownMinutes = Math.floor((totalSeconds % 3600) / 60);
      const countdownSeconds = totalSeconds % 60;

      // Format as HH:MM:SS
      const formatted = `${countdownHours.toString().padStart(2, '0')}:${countdownMinutes.toString().padStart(2, '0')}:${countdownSeconds.toString().padStart(2, '0')}`;
      setTimeRemaining(formatted);
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto mb-12 px-4">
      <div className="bg-gradient-to-br from-[#c41e3a]/20 to-[#c41e3a]/10 border border-[#c41e3a]/30 rounded-2xl p-8 sm:p-12 text-center shadow-2xl">
        <p className="text-white/70 text-sm sm:text-base uppercase tracking-widest mb-4">
          Time Remaining
        </p>
        <div className="font-mono text-6xl sm:text-8xl md:text-9xl font-bold text-white tracking-wider mb-2">
          {timeRemaining || '00:00:00'}
        </div>
        <div className="flex justify-center gap-8 sm:gap-16 text-white/60 text-xs sm:text-sm uppercase tracking-widest mt-6">
          <span>Hours</span>
          <span>Minutes</span>
          <span>Seconds</span>
        </div>
      </div>
    </div>
  );
}
