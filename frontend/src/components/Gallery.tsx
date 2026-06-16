import { useRef, useState } from 'react';
import type { Moment } from '../data/moments';
import MomentCard from './MomentCard';

const FILTERS = [
  { label: 'All', key: null },
  { label: 'World Cup', key: 'world cup' },
  { label: 'Champions League', key: 'champions league' },
  { label: 'Premier League', key: 'premier league' },
  { label: 'La Liga', key: 'la liga' },
] as const;

type FilterKey = 'world cup' | 'champions league' | 'premier league' | 'la liga' | null;

interface GalleryProps {
  moments: Moment[];
  pendingCount?: number;
  onCardClick: (moment: Moment) => void;
  onUploadClick: () => void;
}

export default function Gallery({ moments, pendingCount = 0, onCardClick, onUploadClick }: GalleryProps) {
  const ref = useRef<HTMLElement>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>(null);

  const filteredMoments = activeFilter
    ? moments.filter((m) => m.competition.toLowerCase().includes(activeFilter))
    : moments;

  const countLabel = activeFilter
    ? `${filteredMoments.length} of ${moments.length} moments`
    : `${moments.length} iconic moments`;

  return (
    <section ref={ref} id="gallery" className="px-6 pb-24">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-serif text-3xl font-bold text-white mb-1">Gallery</h2>
            <p className="text-white/40 text-sm">{countLabel}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs text-white/30">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              AI-captioned
            </div>
            <button onClick={onUploadClick} className="flex items-center gap-2 px-4 py-2 rounded-md bg-green-500 text-black text-sm font-semibold hover:bg-green-400 transition-colors duration-150">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
              Upload Moment
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-8 overflow-x-auto scrollbar-none whitespace-nowrap">
          {FILTERS.map(({ label, key }) => (
            <button
              key={label}
              onClick={() => setActiveFilter(key)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium border transition-colors duration-150 ${
                activeFilter === key
                  ? 'bg-green-500 border-green-500 text-black'
                  : 'bg-transparent border-white/15 text-white/50 hover:border-white/30 hover:text-white/80'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: pendingCount }).map((_, i) => (
            <MomentCard
              key={`pending-${i}`}
              moment={{ id: '', title: '', player: '', match: '', competition: '', year: 0, caption: '', tags: [], emoji: '', color: '', tagColor: '' }}
              onClick={() => {}}
              loading
            />
          ))}
          {filteredMoments.map((moment) => (
            <MomentCard
              key={moment.id}
              moment={moment}
              onClick={() => onCardClick(moment)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
