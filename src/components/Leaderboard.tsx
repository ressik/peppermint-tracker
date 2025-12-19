'use client';

import { LeaderboardEntry } from '@/lib/types';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
}

export default function Leaderboard({ entries }: LeaderboardProps) {
  const getMedalClass = (rank: number) => {
    switch (rank) {
      case 1:
        return 'medal-gold';
      case 2:
        return 'medal-silver';
      case 3:
        return 'medal-bronze';
      default:
        return 'text-white/60';
    }
  };

  const getMedalEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  if (entries.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🏆</div>
        <h3 className="text-xl font-semibold text-white/80 mb-2">
          No steals recorded yet!
        </h3>
        <p className="text-white/60">
          Upload a photo to get on the leaderboard!
        </p>
      </div>
    );
  }

  return (
    <div className="card-christmas overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#c41e3a] to-[#8b0000] px-6 py-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span>🏆</span> Peppermint Thief Leaderboard
        </h2>
      </div>

      {/* Table */}
      <div className="divide-y divide-white/10">
        {entries.map((entry) => (
          <div
            key={entry.name}
            className="leaderboard-row flex items-center px-6 py-4"
          >
            {/* Rank */}
            <div className={`w-16 text-2xl font-bold ${getMedalClass(entry.rank)}`}>
              {getMedalEmoji(entry.rank)}
            </div>

            {/* Name */}
            <div className="flex-1">
              <p className="font-semibold text-white text-lg">{entry.name}</p>
            </div>

            {/* Steals Count */}
            <div className="text-right">
              <span className="text-2xl font-bold text-[#ffd700]">{entry.steals}</span>
              <span className="text-white/60 ml-2">
                {entry.steals === 1 ? 'steal' : 'steals'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="bg-white/5 px-6 py-3 text-center">
        <p className="text-sm text-white/40">
          🐧 Who will be the ultimate Peppermint thief this holiday season?
        </p>
      </div>
    </div>
  );
}
