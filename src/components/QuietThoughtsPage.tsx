import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

type Thought = {
  id: string;
  text: string;
  accent: string;
  status: 'idle' | 'publishing' | 'done' | 'error';
  link?: string;
  error?: string;
};

export default function QuietThoughtsPage() {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [draft, setDraft] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);

  const addThought = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    const id = Math.random().toString(36).slice(2, 10);
    setThoughts((p) => [...p, { id, text, accent, status: 'idle' }]);
    setDraft('');
  }, [draft, accent]);

  const publishAll = async () => {
    if (!thoughts.length || busy) return;
    setBusy(true);
    for (const t of thoughts) {
      if (t.status === 'done') continue;
      setThoughts((p) => p.map((i) => i.id === t.id ? { ...i, status: 'publishing' } : i));
      try {
        const blob = new Blob([t.text], { type: 'text/plain' });
        const file = new File([blob], `thought-${t.id}.txt`, { type: 'text/plain' });
        const res = await publishLocalFile(file, {
          caption: t.text.slice(0, 120),
          color: t.accent,
          cardTitle: 'Quiet Thought',
          meta: { desk: 'quietthoughts', accent: t.accent },
        });
        setThoughts((p) => p.map((i) =>
          i.id === t.id
            ? { ...i, status: res.ok ? 'done' : 'error', link: res.embed, error: res.error }
            : i
        ));
      } catch (e: any) {
        setThoughts((p) => p.map((i) => i.id === t.id ? { ...i, status: 'error', error: e.message } : i));
      }
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          className="glass rounded-[36px] p-8 md:p-12"
        >
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>Quiet Thoughts</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">A place for soft words.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Write a quiet thought. Choose an accent. It settles into the database as a shareable note with a polished Discord embed on every link. Soft and human. No file required.
          </p>

          <div className="mb-6">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write something quiet…"
              className="w-full h-32 bg-white/5 border border-white/10 rounded-3xl px-5 py-4 text-[15px] outline-none focus:border-white/30 resize-none placeholder:text-neutral-500"
              style={{ caretColor: accent }}
            />
            <div className="flex items-center gap-3 mt-3">
              <input
                type="color"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className="w-10 h-10 rounded-full border border-white/20 cursor-pointer bg-transparent"
              />
              <button
                onClick={addThought}
                disabled={!draft.trim()}
                className="px-5 py-2.5 rounded-full text-sm font-medium transition disabled:opacity-40"
                style={{ background: accent, color: '#000' }}
              >
                Add thought
              </button>
            </div>
          </div>

          <AnimatePresence>
            {thoughts.map((t) => (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 140, damping: 20 }}
                className="mb-4 p-5 rounded-3xl bg-white/5 border border-white/10"
              >
                <p className="text-[15px] leading-relaxed mb-2" style={{ color: t.accent }}>{t.text}</p>
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>{t.status === 'done' ? 'shared' : t.status === 'publishing' ? 'settling…' : t.status === 'error' ? 'failed' : 'ready'}</span>
                  {t.link && (
                    <a href={t.link} target="_blank" rel="noreferrer" className="underline hover:text-white">
                      open link
                    </a>
                  )}
                </div>
                {t.error && <p className="text-xs text-red-400 mt-1">{t.error}</p>}
              </motion.div>
            ))}
          </AnimatePresence>

          {thoughts.length > 0 && (
            <button
              onClick={publishAll}
              disabled={busy}
              className="mt-6 w-full py-3.5 rounded-full text-sm font-medium transition disabled:opacity-50"
              style={{ background: accent, color: '#000' }}
            >
              {busy ? 'Settling thoughts…' : 'Publish all to the database'}
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
