import { useState, useEffect } from 'react';
import type { Moment } from './data/moments';
import Header from './components/Header';
import Hero from './components/Hero';
import Gallery from './components/Gallery';
import MomentModal from './components/MomentModal';
import UploadModal from './components/UploadModal';

const API_URL = 'https://l4fznwuful.execute-api.us-east-1.amazonaws.com/prod/photos';

function App() {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMoment, setSelectedMoment] = useState<Moment | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [showRejected, setShowRejected] = useState(false);

  function mapMoments(data: any[]): Moment[] {
    return data.map((item: any) => ({
      id:          item.photo_id,
      title:       item.title        ?? 'Untitled Moment',
      player:      item.player       ?? 'Unknown',
      match:       item.game        ?? '',
      competition: item.competition  ?? '',
      year:        Number(item.match_year) || new Date(item.uploaded_at).getFullYear(),
      caption:     item.caption      ?? 'Caption pending...',
      tags:        item.tags         ?? [],
      likes:       Number(item.likes) || 0,
      emoji:       item.emoji        ?? '⚽',
      color:       item.color        ?? 'bg-zinc-900',
      tagColor:    item.tag_color    ?? 'bg-zinc-700 text-zinc-200',
      image_url_800: item.image_url_800,
    }));
  }

  async function fetchMoments() {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data = await res.json();
    return mapMoments(data);
  }

  useEffect(() => {
    fetchMoments()
      .then(setMoments)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function handleUploadSuccess() {
    const knownIds = new Set(moments.map((m) => m.id));
    setPendingCount((n) => n + 1);
    let attempts = 0;
    let photoSeen = false;
    const poll = setInterval(async () => {
      attempts++;
      try {
        const updated = await fetchMoments();
        const newPhoto = updated.find((m) => !knownIds.has(m.id));
        if (newPhoto) photoSeen = true;
        const isProcessed = newPhoto
          ? newPhoto.caption !== 'Caption pending...' && newPhoto.title !== 'Untitled Moment'
          : false;
        if (newPhoto && isProcessed) {
          setMoments(updated);
          setPendingCount((n) => Math.max(0, n - 1));
          clearInterval(poll);
        } else if (!photoSeen && attempts >= 8) {
          setPendingCount((n) => Math.max(0, n - 1));
          setShowRejected(true);
          setTimeout(() => setShowRejected(false), 5000);
          clearInterval(poll);
        } else if (attempts >= 20) {
          setMoments(updated);
          setPendingCount((n) => Math.max(0, n - 1));
          clearInterval(poll);
        }
      } catch {
        setPendingCount((n) => Math.max(0, n - 1));
        clearInterval(poll);
      }
    }, 3000);
  }

  function scrollToGallery() {
    document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />

      <main className="pt-16">
        <Hero onExplore={scrollToGallery} />

        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="flex items-center gap-3 text-white/40">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-bounce [animation-delay:0ms]"></span>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-bounce [animation-delay:150ms]"></span>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-bounce [animation-delay:300ms]"></span>
              <span className="text-sm ml-2">Loading moments...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-24">
            <p className="text-red-400 text-sm">Failed to load moments: {error}</p>
          </div>
        )}

        {!loading && !error && (
          <Gallery
            moments={moments}
            pendingCount={pendingCount}
            onCardClick={setSelectedMoment}
            onUploadClick={() => setShowUpload(true)}
          />
        )}
      </main>

      {selectedMoment && (
        <MomentModal
          moment={selectedMoment}
          onClose={() => setSelectedMoment(null)}
        />
      )}

      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onUploadSuccess={handleUploadSuccess} />
      )}

      {showRejected && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-sm shadow-lg">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          </svg>
          Photo was not uploaded — it didn't pass moderation.
        </div>
      )}
    </div>
  );
}

export default App;