import { useRef } from 'react';
import type { Moment } from '../data/moments';
import MomentCard from './MomentCard';

interface GalleryProps {
  moments: Moment[];
  onCardClick: (moment: Moment) => void;
}

export default function Gallery({ moments, onCardClick }: GalleryProps) {
  const ref = useRef<HTMLElement>(null);

  return (
    <section ref={ref} id="gallery" className="px-6 pb-24">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-serif text-3xl font-bold text-white mb-1">Gallery</h2>
            <p className="text-white/40 text-sm">{moments.length} iconic moments</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs text-white/30">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              AI-captioned
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-md bg-green-500 text-black text-sm font-semibold hover:bg-green-400 transition-colors duration-150">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
              Upload Moment
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {moments.map((moment) => (
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
