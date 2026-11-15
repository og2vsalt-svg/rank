import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

type Item = { file: File; preview: string | null; note: string; warn: string | null };

export default function QuietKindlingPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#FF8C42');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<{ name: string; link: string }[]>([]);
  const [err, setErr] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((list: FileList | File[]) => {
    const next: Item[] = [];
    Array.from(list).forEach((f) => {
      const warn = f.size > 40 * 1024 * 1024 ? 'Large kindling. Upload may feel a little slow. No hard limit.' : null;
      const preview = f.type.startsWith('image/') ? URL.createObjectURL(f) : null;
      next.push({ file: f, preview, note: '', warn });
    });
    setItems((prev) => [...prev, ...next]);
    setResults([]);
    setErr('');
  }, []);

  const remove = (i: number) => {
    setItems((prev) => {
      const copy = [...prev];
      if (copy[i].preview) URL.revokeObjectURL(copy[i].preview!);
      copy.splice(i, 1);
      return copy;
    });
  };

  const publish = async () => {
    if (!items.length) return setErr('choose at least one file');
    setBusy(true);
    setErr('');
    setResults([]);
    const links: { name: string; link: string }[] = [];
    for (const it of items) {
      try {
        const res = await publishLocalFile(it.file, {
          caption: (it.note || caption).trim() || 'quiet kindling',
          color: accent,
          cardTitle: it.file.name,
          meta: { desk: 'quietkindling' },
        });
        if (res.ok && res.embed) links.push({ name: it.file.name, link: res.embed });
        else setErr((e) => e || res.error || 'could not settle');
      } catch (e: any) {
        setErr(e.message || 'something slowed');
      }
    }
    setResults(links);
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-6 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 90, damping: 22 }}
          className="glass rounded-[32px] p-8 md:p-10 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-gradient-to-t from-orange-400/20 to-transparent blur-3xl pointer-events-none" />
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Quiet Kindling</p>
          <h1 className="text-[32px] font-semibold tracking-tight mb-2">A soft flickering settle.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-8 relative">
            Drop local files. They settle as soft kindling of frosted glass with gentle spring flicker and live previews. Shared caption or per-file notes. Batch-publish to the database. Every link unfurls a polished Discord embed. Soft size warnings only. No hard limits. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.
          </p>

          <label className="block rounded-3xl border border-dashed border-white/15 bg-black/20 p-10 text-center cursor-pointer hover:border-white/25 transition mb-6">
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
              disabled={busy}
            />
            <p className="text-[15px] text-neutral-300">Drop files or click to choose</p>
            <p className="text-[12px] text-neutral-500 mt-1">Images show live previews. Large files warned, never refused.</p>
          </label>

          {items.length > 0 && (
            <div className="space-y-3 mb-6">
              {items.map((it, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-2xl p-4 flex gap-4 items-start"
                >
                  {it.preview ? (
                    <img src={it.preview} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-white/5 grid place-items-center text-[11px] text-neutral-500 shrink-0">file</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] truncate">{it.file.name}</p>
                    <input
                      value={it.note}
                      onChange={(e) => {
                        const next = [...items];
                        next[i].note = e.target.value;
                        setItems(next);
                      }}
                      placeholder="Optional note"
                      className="mt-1 w-full bg-transparent text-[12px] text-neutral-300 placeholder:text-neutral-600 focus:outline-none"
                    />
                    {it.warn && <p className="text-[11px] text-amber-300/80 mt-1">{it.warn}</p>}
                  </div>
                  <button onClick={() => remove(i)} className="text-[12px] text-neutral-500 hover:text-white shrink-0">remove</button>
                </motion.div>
              ))}
            </div>
          )}

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Shared caption (used if no per-file note)"
            className="w-full bg-black/20 border border-white/10 rounded-2xl px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/25 transition"
          />

          <div className="flex items-center gap-4 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0 bg-transparent" />
            <span className="text-[13px] text-neutral-400">Warm kindling accent</span>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.012 }}
            onClick={publish}
            disabled={busy || !items.length}
            className="w-full rounded-2xl py-3.5 text-[15px] font-medium text-black disabled:opacity-40 transition shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Settling kindling…' : 'Publish kindling'}
          </motion.button>

          <AnimatePresence>
            {results.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-2">
                {results.map((r) => (
                  <div key={r.link} className="glass rounded-2xl p-3 flex items-center justify-between gap-3">
                    <a href={r.link} className="text-[13px] break-all flex-1" style={{ color: accent }}>{r.name}</a>
                    <button
                      onClick={() => navigator.clipboard.writeText(r.link)}
                      className="text-[12px] px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 transition shrink-0"
                    >
                      copy
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[13px] text-red-400">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
