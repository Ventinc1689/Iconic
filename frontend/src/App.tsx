import { useState } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Gallery from './components/Gallery';
import LoginModal from './components/LoginModal';
import SignUpModal from './components/SignUpModal';
import MomentModal from './components/MomentModal';
import { MOMENTS } from './data/moments';
import type { Moment } from './data/moments';

type Modal = 'login' | 'signup' | null;

function App() {
  const [activeModal, setActiveModal] = useState<Modal>(null);
  const [selectedMoment, setSelectedMoment] = useState<Moment | null>(null);

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
        <Gallery
          moments={MOMENTS}
          onCardClick={setSelectedMoment}
        />
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
    </div>
  );
}

export default App;
