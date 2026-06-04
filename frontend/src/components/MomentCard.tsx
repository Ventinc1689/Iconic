import { useState } from 'react';
import type { Moment } from '../data/moments';

interface MomentCardProps {
  moment: Moment;
  onClick: () => void;
  loading?: boolean;
}

export default function MomentCard({ moment, onClick, loading = false }: MomentCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);

  if (loading) {
    return (
      <article className="rounded-xl border border-white/10 bg-white/5 overflow-hidden flex flex-col">
        {/* image skeleton */}
        <div className="relative h-64 bg-zinc-900 flex-shrink-0 skeleton" />

        {/* body skeleton */}
        <div className="p-4 flex flex-col gap-3 flex-1">
          <div className="skeleton h-5 w-3/4 rounded" />
          <div className="skeleton h-3 w-1/2 rounded" />
          <div className="skeleton h-3 w-full rounded" />
          <div className="skeleton h-3 w-5/6 rounded" />
          <div className="flex gap-2 mt-auto pt-1">
            <div className="skeleton h-5 w-14 rounded-full" />
            <div className="skeleton h-5 w-14 rounded-full" />
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      onClick={onClick}
      className="group cursor-pointer rounded-xl border border-white/10 bg-white/5 hover:border-green-500/40 hover:bg-white/8 transition-all duration-200 overflow-hidden flex flex-col"
    >
      {/* Image container */}
      <div className={`relative h-64 ${moment.color} flex items-center justify-center flex-shrink-0`}>
        {moment.image_url_800 ? (
          <>
            {!imgLoaded && <div className="absolute inset-0 skeleton" />}
            <img
              src={moment.image_url_800}
              alt={moment.title}
              onLoad={() => setImgLoaded(true)}
              className={`w-full h-full object-cover object-center transition-opacity duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            />
          </>
        ) : (
          <span className="text-5xl select-none">{moment.emoji}</span>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <span className="absolute bottom-3 left-3 text-xs font-mono font-bold text-white/70 bg-black/50 px-2 py-0.5 rounded">
          {moment.year}
        </span>
        <span className="absolute top-3 right-3 text-xs text-white/60 bg-black/50 px-2 py-0.5 rounded truncate max-w-[60%]">
          {moment.competition}
        </span>
      </div>

      {/* Body — staggered fade-in */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3
          style={{ animationDelay: '0ms' }}
          className="fade-in font-serif text-lg font-semibold text-white group-hover:text-green-400 transition-colors duration-150 leading-tight"
        >
          {moment.title}
        </h3>

        <div
          style={{ animationDelay: '60ms' }}
          className="fade-in text-xs text-white/50 leading-snug"
        >
          <span className="font-medium text-white/70">{moment.player}</span>
          <span className="mx-1">·</span>
          {moment.match}
        </div>

        <p
          style={{ animationDelay: '120ms' }}
          className="fade-in text-sm text-white/50 leading-relaxed line-clamp-2 flex-1"
        >
          {moment.caption}
        </p>

        {/* Tags */}
        <div
          style={{ animationDelay: '180ms' }}
          className="fade-in flex flex-wrap gap-1.5 pt-1 mt-auto"
        >
          {moment.tags.map((tag) => (
            <span key={tag} className={`text-xs px-2 py-0.5 rounded-full ${moment.tagColor}`}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}
