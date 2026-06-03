import { useState, useEffect } from 'react';
import type { Moment } from './data/moments';
import Header from './components/Header';
import Hero from './components/Hero';
import Gallery from './components/Gallery';
import LoginModal from './components/LoginModal';
import SignUpModal from './components/SignUpModal';
import MomentModal from './components/MomentModal';
import UploadModal from './components/UploadModal';

const API_URL = 'https://l4fznwuful.execute-api.us-east-1.amazonaws.com/prod/photos';

type Modal = 'login' | 'signup' | null;

function App() {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<Modal>(null);
  const [selectedMoment, setSelectedMoment] = useState<Moment | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`API error ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const mapped: Moment[] = data.map((item: any) => ({
          id:          item.photo_id,
          title:       item.title        ?? 'Untitled Moment',
          player:      item.player       ?? 'Unknown',
          match:       item.match        ?? '',
          competition: item.competition  ?? '',
          year:        Number(item.year) || new Date(item.uploaded_at).getFullYear(),
          caption:     item.caption      ?? 'Caption pending...',
          tags:        item.tags         ?? [],
          likes:       Number(item.likes) || 0,
          emoji:       item.emoji        ?? '⚽',
          color:       item.color        ?? 'bg-zinc-900',
          tagColor:    item.tag_color    ?? 'bg-zinc-700 text-zinc-200',
          image_url_300: item.image_url_300,
          image_url_800: item.image_url_800,
        }));
        setMoments(mapped);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function scrollToGallery() {
    document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header
        onLoginClick={() => setActiveModal('login')}
        onSignUpClick={() => setActiveModal('signup')}
      />

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
            onCardClick={setSelectedMoment}
            onUploadClick={() => setShowUpload(true)}
          />
        )}
      </main>

      {activeModal === 'login' && (
        <LoginModal
          onClose={() => setActiveModal(null)}
          onSwitchToSignUp={() => setActiveModal('signup')}
        />
      )}

      {activeModal === 'signup' && (
        <SignUpModal
          onClose={() => setActiveModal(null)}
          onSwitchToLogin={() => setActiveModal('login')}
        />
      )}

      {selectedMoment && (
        <MomentModal
          moment={selectedMoment}
          onClose={() => setSelectedMoment(null)}
        />
      )}

      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} />
      )}
    </div>
  );
}

export default App;