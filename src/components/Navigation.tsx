'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="relative z-10 border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-lg">🐧</span>
            <span className="text-sm font-medium text-white/80 tracking-wide">
              Peppermint
            </span>
          </Link>

          <div className="flex items-center gap-1">
            <Link
              href="/"
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                pathname === '/'
                  ? 'bg-[#c41e3a] text-white'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              Gallery
            </Link>
            <Link
              href="/map"
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                pathname === '/map'
                  ? 'bg-[#c41e3a] text-white'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              Timeline
            </Link>
            <Link
              href="/leaderboard"
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                pathname === '/leaderboard'
                  ? 'bg-[#c41e3a] text-white'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              Leaderboard
            </Link>
            <Link
              href="/rules"
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                pathname === '/rules'
                  ? 'bg-[#c41e3a] text-white'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              Rules
            </Link>
            <Link
              href="/chat"
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                pathname === '/chat'
                  ? 'bg-[#c41e3a] text-white'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              Chat
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
