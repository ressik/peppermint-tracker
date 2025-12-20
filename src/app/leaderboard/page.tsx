'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LeaderboardEntry } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

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
        <Link
          href="/"
          className="px-5 py-2 text-sm font-medium text-white/70 hover:text-white transition-all"
        >
          Gallery
        </Link>
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
        <div className="space-y-2">
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
      )}
    </div>
  );
}
