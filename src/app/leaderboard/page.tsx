'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LeaderboardEntry } from '@/lib/types';

// Mock data - will be replaced with Supabase
const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, name: 'The Johnsons', steals: 5 },
  { rank: 2, name: 'The Smiths', steals: 4 },
  { rank: 3, name: 'The Garcias', steals: 3 },
  { rank: 4, name: 'The Wilsons', steals: 2 },
  { rank: 5, name: 'The Browns', steals: 2 },
  { rank: 6, name: 'The Patels', steals: 1 },
  { rank: 7, name: 'The Nguyens', steals: 1 },
];

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>(mockLeaderboard);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setTimeout(() => {
      setEntries(mockLeaderboard);
      setIsLoading(false);
    }, 300);
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-white/50 text-sm uppercase tracking-widest mb-3">
          Season Rankings
        </p>
        <h1 className="text-4xl font-light text-white mb-8">
          Leaderboard
        </h1>
        <Link
          href="/"
          className="px-5 py-2 text-sm font-medium text-white/50 hover:text-white/80 transition-all"
        >
          Gallery
        </Link>
      </div>

      {/* Leaderboard */}
      {isLoading ? (
        <div className="text-center py-20">
          <p className="text-white/40 text-sm">Loading...</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-white/40 text-sm">No steals recorded yet</p>
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
              <span className="text-white/50 text-sm">
                {entry.steals} {entry.steals === 1 ? 'steal' : 'steals'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
