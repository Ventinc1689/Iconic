export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-green-500 flex items-center justify-center">
            <span className="text-black font-bold text-sm tracking-tight">IC</span>
          </div>
          <span className="font-serif text-xl font-semibold text-white tracking-wide">Iconic</span>
        </div>
      </div>
    </header>
  );
}
