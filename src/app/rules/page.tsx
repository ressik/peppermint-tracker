import Link from 'next/link';

export default function RulesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-white/70 text-sm uppercase tracking-widest mb-3">
          How to Play
        </p>
        <h1 className="text-4xl font-light text-white mb-8">
          Rules
        </h1>
        <Link
          href="/"
          className="px-5 py-2 text-sm font-medium text-white/70 hover:text-white transition-all"
        >
          Gallery
        </Link>
      </div>

      {/* Rules */}
      <div className="card-christmas p-8">
        <ol className="space-y-6 text-white/80">
          <li className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#c41e3a] flex items-center justify-center text-white text-sm font-medium">
              1
            </span>
            <div className="flex-1 pt-1">
              <p>Keep Peppermint outside, fully visible from the street, and easily accessible at all times. If you need extra tools, it's NOT easily accessible!</p>
            </div>
          </li>

          <li className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#c41e3a] flex items-center justify-center text-white text-sm font-medium">
              2
            </span>
            <div className="flex-1 pt-1">
              <p>Peppermint must stay within the Bloomfield Heights Boundaries.</p>
            </div>
          </li>

          <li className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#c41e3a] flex items-center justify-center text-white text-sm font-medium">
              3
            </span>
            <div className="flex-1 pt-1">
              <p className="mb-3">If you&apos;re caught stealing peppermint, return him to his prior spot and wait 12 hours - or until someone else successfully steals, whichever comes first - before another attempt.</p>
              <ul className="space-y-2 ml-4 text-sm text-white/60">
                <li className="flex gap-2">
                  <span className="text-white/40">•</span>
                  <span>&quot;Caught&quot; means that someone stopped you while you were in the act of stealing Peppermint.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-white/40">•</span>
                  <span>To make the rules more fair, you MUST be caught person to person. For example, it doesn't count if they speak through the Ring doorbell, flash porch lights, etc...</span>
                </li>
              </ul>
            </div>
          </li>

          <li className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#c41e3a] flex items-center justify-center text-white text-sm font-medium">
              4
            </span>
            <div className="flex-1 pt-1">
              <p>Respect all property - No damage left behind.</p>
            </div>
          </li>

          <li className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#c41e3a] flex items-center justify-center text-white text-sm font-medium">
              5
            </span>
            <div className="flex-1 pt-1">
              <p>Kids under 14 must heist with an adult.</p>
            </div>
          </li>

          <li className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#c41e3a] flex items-center justify-center text-white text-sm font-medium">
              6
            </span>
            <div className="flex-1 pt-1">
              <p>For the sake of Peppermint's (and your) life and longevity, do not wrap, tie, or secure the cord or Peppermint in any way.</p>
            </div>
          </li>

          <li className="flex gap-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#c41e3a] flex items-center justify-center text-white text-sm font-medium">
              7
            </span>
            <div className="flex-1 pt-1">
              <p>Winner must send Paul and Tiffany photographic proof at noon on January 1st.</p>
            </div>
          </li>
        </ol>
      </div>

      {/* Happy Heisting */}
      <div className="text-center mt-12">
        <p className="text-5xl font-light">
          <span className="text-white">Happy </span>
          <span className="text-[#c41e3a]">Heisting!</span>
        </p>
        <p className="text-white/40 text-sm mt-2">✦ ✦ ✦</p>
      </div>
    </div>
  );
}
