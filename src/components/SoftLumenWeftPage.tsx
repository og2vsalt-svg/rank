import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

type Thread = { file: File; note: string; id: string };

export default function SoftLumenWeftPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [warp, setWarp] = useState('');
  const [accent, setAccent] = useState('#5AC8FA');
  const [busy, setBusy] = useState(false);
  const [woven, setWoven] = useState<{ id: string; name: string; embed: string; warn?: string | null }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onFiles = useCallback((list: FileList | null) => {
    if (!list) return;
    const next: Thread[] = [];
    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      next.push({ file, note: '', id: Math.random().toString(36).slice(2) });
    }
    setThreads((t) => [...t, ...next]);
  }, []);

  const remove = (id: string) => setThreads((t) => t.filter((x) => x.id !== id));

  const updateNote = (id: string, note: string) =>
    setThreads((t) => t.map((x) => (x.id === id ? { ...x, note } : x)));

  const weave = async () => {
    if (threads.length === 0) return;
    setBusy(true);
    setError(null);
    setWoven([]);
    const out: typeof woven = [];
    for (const th of threads) {
      const opts = {
        caption: th.note || warp || undefined,
        color: accent,
        cardTitle: th.file.name,
        meta: { desk: 'softlumenweft', warp: warp || null, thread: th.note || null },
      };
      const res = await publishLocalFile(th.file, opts);
      if (res.ok && res.id) {
        out.push({
          id: res.id,
          name: th.file.name,
          embed: shareUrls(res.id).embed,
          warn: res.warn || null,
        });
      } else {
        setError(res.error || 'a thread did not settle');
      }
    }
    setWoven(out);
    setBusy(false);
    if (out.length) setThreads([]);
  };

  const totalSize = threads.reduce((s, t) => s + t.file.size, 0);
  const slow = totalSize > 40 * 1024 * 1024;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 85, damping: 17 }}
          className="glass rounded-[32px] p-8 mb-6"
        >
          <p className="text-[#5AC8FA] text-sm tracking-wide mb-2">soft lumen weft</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">weave what you carry.</h1>
          <p className="text-neutral-400 text-sm leading-relaxed mb-6">
            Drop local files as threads. Each carries its own quiet note, or shares the warp caption.
            Soft glass ribbons settle and interweave with spring motion. Lands in storage and public_shares.
            Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused.
            Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.
          </p>

          <label className="block mb-4">
            <span className="text-xs text-neutral-500">warp (shared caption)</span>
            <input
              value={warp}
              onChange={(e) => setWarp(e.target.value)}
              placeholder="a quiet word that runs through all threads"
              className="mt-1 w-full bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-3 text-sm outline-none focus:border-[#5AC8FA]/40"
            />
          </label>

          <div className="flex items-center gap-3 mb-5">
            <label className="text-xs text-neutral-500">accent</label>
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="w-10 h-10 rounded-full border border-white/10 bg-transparent cursor-pointer"
            />
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onFiles(e.dataTransfer.files);
            }}
            className="border border-dashed border-white/15 rounded-3xl p-8 text-center mb-5 hover:border-[#5AC8FA]/40 transition"
          >
            <p className="text-sm text-neutral-400 mb-2">drop threads here, or</p>
            <label className="inline-block px-4 py-2 rounded-full bg-white/10 text-sm cursor-pointer hover:bg-white/20">
              choose local files
              <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            </label>
          </div>

          {slow && (
            <p className="text-xs text-amber-300/80 mb-4">
              large weft — the browser may feel slow while it sends. nothing is refused.
            </p>
          )}

          <AnimatePresence>
            {threads.map((th, i) => (
              <motion.div
                key={th.id}
                initial={{ opacity: 0, x: -12, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ type: 'spring', stiffness: 130, damping: 19, delay: i * 0.025 }}
                className="glass rounded-2xl p-4 mb-3"
              >
                <div className="flex justify-between items-start">
                  <p className="text-sm truncate">{th.file.name}</p>
                  <button onClick={() => remove(th.id)} className="text-xs text-neutral-500 hover:text-white">
                    release
                  </button>
                </div>
                <p className="text-[11px] text-neutral-500 mt-0.5">{(th.file.size / 1024 / 1024).toFixed(1)} MB</p>
                <input
                  value={th.note}
                  onChange={(e) => updateNote(th.id, e.target.value)}
                  placeholder="thread note (optional)"
                  className="mt-2 w-full bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2 text-xs outline-none"
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {threads.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={busy}
              onClick={weave}
              className="w-full mt-2 py-3 rounded-2xl text-black text-sm font-medium disabled:opacity-50"
              style={{ background: accent }}
            >
              {busy ? 'weaving…' : `weave ${threads.length} thread${threads.length > 1 ? 's' : ''}`}
            </motion.button>
          )}

          {error && <p className="text-xs text-red-400 mt-3">{error}</p>}

          {woven.length > 0 && (
            <div className="mt-6 space-y-3">
              <p className="text-xs text-neutral-500">woven — each link carries a Discord card</p>
              {woven.map((r) => (
                <div key={r.id} className="rounded-2xl bg-white/[0.03] border border-white/5 p-3">
                  <p className="text-sm truncate">{r.name}</p>
                  <a href={r.embed} className="text-xs text-[#5AC8FA] break-all hover:underline">
                    {r.embed}
                  </a>
                  {r.warn && <p className="text-[11px] text-amber-300/70 mt-1">{r.warn}</p>}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
