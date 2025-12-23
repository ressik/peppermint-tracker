'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LeaderboardEntry, TimeHeldEntry } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [timeHeldEntries, setTimeHeldEntries] = useState<TimeHeldEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const formatSeconds = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const fetchLeaderboard = async () => {
    setIsLoading(true);

    // Count steals per uploader from the photos table (only where is_steal is true)
    const { data, error } = await supabase
      .from('photos')
      .select('uploader_name')
      .eq('is_steal', true);

    if (error) {
      console.error('Error fetching leaderboard:', error);
      setIsLoading(false);
      return;
    }

    // Count occurrences of each uploader
    const counts: Record<string, number> = {};
    data.forEach((photo) => {
      const name = photo.uploader_name;
      counts[name] = (counts[name] || 0) + 1;
    });

    // Convert to array and sort by count, then alphabetically for ties
    const sorted = Object.entries(counts)
      .map(([name, steals]) => ({ name, steals }))
      .sort((a, b) => {
        if (b.steals !== a.steals) {
          return b.steals - a.steals;
        }
        return a.name.localeCompare(b.name);
      });

    // Assign ranks with ties getting the same rank
    let currentRank = 1;
    const ranked = sorted.map((entry, index) => {
      if (index > 0 && entry.steals < sorted[index - 1].steals) {
        currentRank = index + 1;
      }
      return {
        rank: currentRank,
        name: entry.name,
        steals: entry.steals,
      };
    });

    setEntries(ranked);

    // Calculate time held for each person
    const { data: stealsData, error: stealsError } = await supabase
      .from('photos')
      .select('uploader_name, created_at')
      .eq('is_steal', true)
      .order('created_at', { ascending: true });

    if (stealsError) {
      console.error('Error fetching steals for time calculation:', stealsError);
      setIsLoading(false);
      return;
    }

    // Calculate time held for each steal period
    const timeByPerson: Record<string, number> = {};

    stealsData.forEach((steal, index) => {
      const stealTime = new Date(steal.created_at).getTime();
      const nextStealTime = index < stealsData.length - 1
        ? new Date(stealsData[index + 1].created_at).getTime()
        : Date.now(); // Current holder gets time until now

      const secondsHeld = Math.floor((nextStealTime - stealTime) / 1000);

      timeByPerson[steal.uploader_name] = (timeByPerson[steal.uploader_name] || 0) + secondsHeld;
    });

    // Convert to array and sort by total time held
    const timeEntries = Object.entries(timeByPerson)
      .map(([name, totalSeconds]) => ({
        name,
        totalSeconds,
        formattedTime: formatSeconds(totalSeconds),
      }))
      .sort((a, b) => b.totalSeconds - a.totalSeconds);

    setTimeHeldEntries(timeEntries);
    setIsLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-white/70 text-sm uppercase tracking-widest mb-3">
          Season Rankings
        </p>
        <h1 className="text-4xl font-light text-white mb-8">
          Leaderboard
        </h1>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="px-5 py-2 text-sm font-medium text-white/70 hover:text-white transition-all"
          >
            Gallery
          </Link>
          <Link
            href="/map"
            className="px-5 py-2 text-sm font-medium text-white/70 hover:text-white transition-all"
          >
            Timeline
          </Link>
          <Link
            href="/rules"
            className="px-5 py-2 text-sm font-medium text-white/70 hover:text-white transition-all"
          >
            Rules
          </Link>
          <Link
            href="/chat"
            className="px-5 py-2 text-sm font-medium text-white/70 hover:text-white transition-all"
          >
            Chat
          </Link>
        </div>
      </div>

      {/* Leaderboard */}
      {isLoading ? (
        <div className="text-center py-20">
          <p className="text-white/60 text-sm">Loading...</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-white/60 text-sm">No steals recorded yet</p>
        </div>
      ) : (
        <>
          <div className="space-y-2 mb-16">
            {entries.map((entry) => (
              <div
                key={entry.name}
                className="flex items-center justify-between px-5 py-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
              >
                <div className="flex items-center gap-4">
                  <span className={`w-6 text-sm ${
                    entry.rank === 1 ? 'text-[#ffd700]' :
                    entry.rank === 2 ? 'text-[#c0c0c0]' :
                    entry.rank === 3 ? 'text-[#cd7f32]' :
                    'text-white/40'
                  }`}>
                    {entry.rank}
                  </span>
                  <span className="text-white/90">{entry.name}</span>
                </div>
                <span className="text-white/70 text-sm">
                  {entry.steals} {entry.steals === 1 ? 'steal' : 'steals'}
                </span>
              </div>
            ))}
          </div>

          {/* Time Held Table */}
          <div className="mt-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-light text-white mb-2">
                Total Time Held
              </h2>
              <p className="text-white/60 text-sm">
                Combined duration each person held the peppermint
              </p>
            </div>

            <div className="space-y-2">
              {timeHeldEntries.map((entry) => (
                <div
                  key={entry.name}
                  className="flex items-center justify-between px-5 py-4 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
                >
                  <span className="text-white/90">{entry.name}</span>
                  <span className="text-white/70 text-sm font-mono">
                    {entry.formattedTime}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
