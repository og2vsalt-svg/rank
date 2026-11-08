import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

type FoldItem = {
  id: string;
  file: File;
  note: string;
};

export default function SoftQuietFoldPage() {
  const [items, setItems] = useState<FoldItem[]>([]);
  const [sharedNote, setSharedNote] = useState('');
  const [accent, setAccent] = useState('#5AC8FA');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [links, setLinks] = useState<string[]>([]);
  const [err, setErr] = useState('');

  function onFiles(files: FileList | null) {
    if (!files) return;
    const next: FoldItem[] = [];
    let large = false;
    for (const f of Array.from(files)) {
      if (f.size > 40 * 1024 * 1024) large = true;
      next.push({
        id: crypto.randomUUID(),
        file: f,
        note: '',
      });
    }
    setItems((prev) => [...prev, ...next]);
    setWarn(large ? 'Some files are large. Uploads may feel slow. No hard limit.' : null);
  }

  function updateNote(id: string, note: string) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, note } : it)));
  }

  function remove(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  async function publishAll() {
    if (!items.length) return;
    setBusy(true);
    setErr('');
    setLinks([]);
    const created: string[] = [];
    try {
      for (const it of items) {
        const caption = [sharedNote, it.note].filter(Boolean).join(' · ') || undefined;
        const res = await publishLocalFile(it.file, {
          caption,
          color: accent,
          cardTitle: 'Quiet Fold',
        });
        if (res.ok && res.embed) created.push(res.embed);
      }
      setLinks(created);
      setItems([]);
      setSharedNote('');
    } catch (e: any) {
      setErr(e?.message || 'Could not settle the fold.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen mesh">
      <Navbar />
      <div className="max-w-2xl mx-auto px-5 pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[28px] p-7 sm:p-9"
        >
          <p className="text-[#5AC8FA] text-[13px] font-medium tracking-wide mb-2">quiet fold</p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight mb-3">
            fold what you carry
          </h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-6">
            Drop several local files. Each can hold its own quiet note, or share one caption across the fold. Soft glass layers settle with spring motion. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned, never refused.
          </p>

          <label className="block mb-5 cursor-pointer">
            <div className="rounded-[18px] border border-dashed border-white/15 bg-white/[0.03] px-5 py-8 text-center text-neutral-300 hover:bg-white/[0.05] transition">
              Drop or choose local files
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => onFiles(e.target.files)}
              />
            </div>
          </label>

          <textarea
            value={sharedNote}
            onChange={(e) => setSharedNote(e.target.value)}
            placeholder="Optional shared note for the whole fold…"
            className="w-full bg-white/[0.04] border border-white/10 rounded-[16px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 outline-none focus:border-white/25 resize-none mb-5"
            rows={2}
          />

          <div className="flex items-center gap-4 mb-6">
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="w-9 h-9 rounded-full cursor-pointer border-0"
            />
            <span className="text-[13px] text-neutral-400">accent</span>
          </div>

          {warn && <p className="text-[12px] text-amber-300/90 mb-4">{warn}</p>}

          <div className="space-y-3 mb-6">
            <AnimatePresence>
              {items.map((it, i) => (
                <motion.div
                  key={it.id}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 120, damping: 18, delay: i * 0.03 }}
                  className="glass rounded-[18px] p-4 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-[14px] text-white truncate">{it.file.name}</p>
                    <button
                      onClick={() => remove(it.id)}
                      className="text-[12px] text-neutral-500 hover:text-white"
                    >
                      remove
                    </button>
                  </div>
                  <input
                    value={it.note}
                    onChange={(e) => updateNote(it.id, e.target.value)}
                    placeholder="Quiet note for this layer…"
                    className="bg-transparent text-[13px] text-neutral-200 outline-none placeholder:text-neutral-600"
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            onClick={publishAll}
            disabled={busy || !items.length}
            className="w-full rounded-[18px] py-3.5 text-[15px] font-medium text-black disabled:opacity-40 transition shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Folding…' : 'Settle the fold'}
          </motion.button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 space-y-2"
              >
                {links.map((l) => (
                  <a key={l} href={l} className="block text-[13px] break-all" style={{ color: accent }}>
                    {l}
                  </a>
                ))}
              </motion.div>
            )}
            {err && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[12px] text-red-400">
                {err}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
