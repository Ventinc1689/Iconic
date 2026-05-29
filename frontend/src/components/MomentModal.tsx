import { useState, useEffect, useRef } from 'react';
import type { Moment } from '../data/moments';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface MomentModalProps {
  moment: Moment;
  onClose: () => void;
}

export default function MomentModal({ moment, onClose }: MomentModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const systemPrompt = `You are an expert football historian and analyst discussing a specific iconic moment.

Moment: ${moment.title}
Player(s): ${moment.player}
Match: ${moment.match}
Year: ${moment.year}
Competition: ${moment.competition}
Caption: ${moment.caption}

Answer questions about this moment with passion and detail. Keep responses concise but insightful — 2-4 sentences unless more detail is explicitly requested.`;

    const apiMessages = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: systemPrompt,
          messages: apiMessages,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error ${response.status}`);
      }

      const data = await response.json();
      const assistantText =
        data.content?.[0]?.type === 'text' ? data.content[0].text : 'No response.';

      setMessages((prev) => [...prev, { role: 'assistant', content: assistantText }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I couldn\'t reach the AI right now. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#0f0f0f] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white/40 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Image area */}
        <div className={`relative h-52 flex-shrink-0 ${moment.color} flex items-center justify-center`}>
          <span className="text-7xl select-none">{moment.emoji}</span>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent" />
          <span className="absolute bottom-3 left-4 text-xs font-mono text-white/60 bg-black/50 px-2 py-0.5 rounded">
            {moment.year}
          </span>
          <span className="absolute top-3 left-4 text-xs text-white/60 bg-black/50 px-2 py-0.5 rounded">
            {moment.competition}
          </span>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Moment info */}
          <div className="px-6 pt-4 pb-4 border-b border-white/10">
            <h2 className="font-serif text-2xl font-bold text-white mb-1">{moment.title}</h2>
            <p className="text-sm text-white/50 mb-4">
              <span className="font-medium text-white/70">{moment.player}</span>
              <span className="mx-1.5">·</span>
              {moment.match}
            </p>

            {/* AI Caption block */}
            <div className="bg-green-500/8 border border-green-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded bg-green-500 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zm-1-5h2v2h-2zm0-8h2v6h-2z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-green-400 uppercase tracking-wider">AI Caption</span>
              </div>
              <p className="text-sm text-white/70 leading-relaxed">{moment.caption}</p>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mt-4">
              {moment.tags.map((tag) => (
                <span key={tag} className={`text-xs px-2.5 py-1 rounded-full ${moment.tagColor}`}>
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Ask AI panel */}
          <div className="px-6 pt-4 pb-6">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
              </svg>
              <span className="text-sm font-medium text-white/70">Ask AI about this moment</span>
            </div>

            {/* Chat messages */}
            {messages.length > 0 && (
              <div className="flex flex-col gap-3 mb-4 max-h-64 overflow-y-auto pr-1">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'text-right'
                        : 'text-left'
                    }`}
                  >
                    <span
                      className={`inline-block px-3.5 py-2 rounded-xl max-w-[85%] text-left ${
                        msg.role === 'user'
                          ? 'bg-green-500 text-black font-medium'
                          : 'bg-white/8 text-white/80 border border-white/10'
                      }`}
                    >
                      {msg.content}
                    </span>
                  </div>
                ))}
                {loading && (
                  <div className="text-left">
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/8 border border-white/10 text-white/40 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-bounce [animation-delay:0ms]"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-bounce [animation-delay:150ms]"></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-bounce [animation-delay:300ms]"></span>
                    </span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}

            {/* Input */}
            <div className="flex gap-2 items-end">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about this moment…"
                rows={1}
                className="flex-1 resize-none bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-green-500/50 transition-colors leading-relaxed"
                style={{ minHeight: '42px', maxHeight: '120px' }}
                onInput={(e) => {
                  const el = e.currentTarget;
                  el.style.height = 'auto';
                  el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="flex-shrink-0 w-10 h-10 rounded-xl bg-green-500 hover:bg-green-400 disabled:opacity-30 disabled:cursor-not-allowed text-black flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                </svg>
              </button>
            </div>
            <p className="mt-2 text-xs text-white/25">Press Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      </div>
    </div>
  );
}
