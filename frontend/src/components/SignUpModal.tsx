import { useState, useEffect } from 'react';

interface SignUpModalProps {
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export default function SignUpModal({ onClose, onSwitchToLogin }: SignUpModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[#111] border border-white/10 rounded-2xl p-8 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
            <span className="text-black font-bold text-xs">IC</span>
          </div>
          <span className="font-serif text-lg font-semibold text-white">Iconic</span>
        </div>

        <h2 className="font-serif text-2xl font-bold text-white mb-1">Join Iconic</h2>
        <p className="text-white/40 text-sm mb-6">Create your free account</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-green-500/60 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-green-500/60 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-white/50 uppercase tracking-wider">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-green-500/60 transition-colors"
            />
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-2.5 rounded-lg bg-green-500 text-black font-semibold text-sm hover:bg-green-400 transition-colors"
          >
            Create Account
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-white/40">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-green-400 hover:text-green-300 transition-colors"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
