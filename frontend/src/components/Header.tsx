interface HeaderProps {
  onLoginClick: () => void;
  onSignUpClick: () => void;
}

export default function Header({ onLoginClick, onSignUpClick }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-green-500 flex items-center justify-center">
            <span className="text-black font-bold text-sm tracking-tight">IC</span>
          </div>
          <span className="font-serif text-xl font-semibold text-white tracking-wide">Iconic</span>
        </div>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {['Home', 'Gallery', 'About'].map((link) => (
            <a
              key={link}
              href="#"
              className="text-sm text-white/60 hover:text-white transition-colors duration-150"
            >
              {link}
            </a>
          ))}
        </nav>

        {/* Auth buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onLoginClick}
            className="text-sm px-4 py-1.5 rounded-md border border-white/30 text-white/80 hover:border-white hover:text-white transition-colors duration-150"
          >
            Login
          </button>
          <button
            onClick={onSignUpClick}
            className="text-sm px-4 py-1.5 rounded-md bg-green-500 text-black font-semibold hover:bg-green-400 transition-colors duration-150"
          >
            Sign Up
          </button>
        </div>
      </div>
    </header>
  );
}
