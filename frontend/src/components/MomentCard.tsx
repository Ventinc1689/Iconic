import { useState } from 'react';
import type { Moment } from '../data/moments';

interface MomentCardProps {
  moment: Moment;
  onClick: () => void;
}

export default function MomentCard({ moment, onClick }: MomentCardProps) {
  const [likes, setLikes] = useState(moment.likes);
  const [liked, setLiked] = useState(false);

  function handleLike(e: React.MouseEvent) {
    e.stopPropagation();
    if (liked) {
      setLikes((n) => n - 1);
    } else {
      setLikes((n) => n + 1);
    }
    setLiked((v) => !v);
  }

  return (
    <article
      onClick={onClick}
      className="group cursor-pointer rounded-xl border border-white/10 bg-white/5 hover:border-green-500/40 hover:bg-white/8 transition-all duration-200 overflow-hidden flex flex-col"
    >
      {/* Image container */}
      <div className={`relative h-64 ${moment.color} flex items-center justify-center flex-shrink-0`}>
        {moment.image_url_300 ? (
          <img
            src={moment.image_url_300}
            alt={moment.title}
            className="w-full h-full object-cover object-center"
          />
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

      {/* Body */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-serif text-lg font-semibold text-white group-hover:text-green-400 transition-colors duration-150 leading-tight">
          {moment.title}
        </h3>

        <div className="text-xs text-white/50 leading-snug">
          <span className="font-medium text-white/70">{moment.player}</span>
          <span className="mx-1">·</span>
          {moment.match}
        </div>

        <p className="text-sm text-white/50 leading-relaxed line-clamp-2 flex-1">
          {moment.caption}
        </p>

        {/* Tags + like */}
        <div className="flex items-center justify-between pt-1 mt-auto">
          <div className="flex flex-wrap gap-1.5">
            {moment.tags.map((tag) => (
              <span key={tag} className={`text-xs px-2 py-0.5 rounded-full ${moment.tagColor}`}>
                {tag}
              </span>
            ))}
          </div>

          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-xs transition-colors duration-150 ml-2 flex-shrink-0 ${
              liked ? 'text-green-400' : 'text-white/40 hover:text-white/70'
            }`}
          >
            <svg
              className="w-4 h-4"
              fill={liked ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
              />
            </svg>
            {likes.toLocaleString()}
          </button>
        </div>
      </div>
    </article>
  );
}
