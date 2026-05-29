interface HeroProps {
  onExplore: () => void;
}

export default function Hero({ onExplore }: HeroProps) {
  return (
    <section className="pt-40 pb-24 px-6 text-center">
      <div className="mx-auto max-w-3xl">
        <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full border border-green-500/40 bg-green-500/10 text-green-400 text-xs font-medium tracking-wider uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
          AI-captioned · Community-uploaded
        </div>

        <h1 className="font-serif text-5xl md:text-7xl font-bold leading-tight text-white mb-6">
          Football's most{' '}
          <br className="hidden md:block" />
          defining{' '}
          <span className="text-green-400 italic">seconds.</span>
        </h1>

        <p className="text-white/50 text-lg md:text-xl max-w-xl mx-auto mb-10 leading-relaxed">
          The goals, the saves, the tears. Every moment preserved, captioned by AI,
          and kept alive by the community that lived them.
        </p>

        <button
          onClick={onExplore}
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-md bg-green-500 text-black font-semibold text-base hover:bg-green-400 transition-colors duration-150 shadow-lg shadow-green-500/20"
        >
          Explore Gallery
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>
    </section>
  );
}
