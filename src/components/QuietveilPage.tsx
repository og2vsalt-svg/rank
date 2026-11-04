import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function QuietveilPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#5AC8FA');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<{ id?: string; embed?: string; error?: string; warn?: string | null; name: string }[]>([]);
  const [drag, setDrag] = useState(false);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const dropped = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...dropped].slice(0, 12));
  }, []);

  const shareAll = async () => {
    if (!files.length) return;
    setBusy(true);
    const out: typeof results = [];
    for (const file of files) {
      const res = await publishLocalFile(file, {
        caption: note || file.name,
        color: accent,
        cardTitle: file.name,
        meta: { accent, source: 'quietveil', kind: 'veil' },
      });
      out.push({
        name: file.name,
        id: res.id,
        embed: res.id ? shareUrls(res.id).embed : undefined,
        error: res.ok ? undefined : res.error,
        warn: res.warn,
      });
    }
    setResults(out);
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 pb-24 pt-12">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 110, damping: 22 }}>
          <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">quietveil</p>
          <h1 className="mt-2 text-[34px] font-semibold tracking-[-0.04em]">veil what you carry.</h1>
          <p className="mt-3 text-[15.5px] leading-relaxed text-white/65">
            Drop one or many local files behind a soft veil of glass. They enter storage and public_shares. Every share link unfurls a polished Discord card. Large batches warned only for possible slowness. No hard limits. All prior desks remain fully intact. No traces of boosting.
          </p>
        </motion.div>

        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          className={`glass mt-8 rounded-[28px] p-8 text-center transition ${drag ? 'ring-2 ring-white/30' : ''}`}
        >
          <p className="text-[15px] text-white/70">drop files here, or click to choose</p>
          <input
            type="file"
            multiple
            className="mt-4 block w-full text-[13px] file:mr-4 file:rounded-full file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-[13px]"
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
          />
          {files.length > 0 && (
            <ul className="mt-4 space-y-1 text-left text-[13px] text-white/60">
              {files.map((f, i) => (
                <li key={i}>{f.name} · {(f.size / 1024 / 1024).toFixed(1)} MB</li>
              ))}
            </ul>
          )}
        </div>

        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="shared note (optional)"
          className="glass mt-4 w-full rounded-2xl px-4 py-3.5 text-[15px] outline-none"
        />
        <div className="mt-3 flex items-center gap-3">
          <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-11 w-16 cursor-pointer rounded-xl border border-white/10 bg-transparent" />
          <span className="text-[13px] text-white/50">accent for the veil</span>
        </div>

        <motion.button
          whileTap={{ scale: 0.965 }}
          whileHover={{ scale: 1.012 }}
          onClick={shareAll}
          disabled={!files.length || busy}
          className="mt-6 w-full rounded-full px-4 py-3.5 text-[15px] font-medium text-black disabled:opacity-40"
          style={{ background: accent }}
        >
          {busy ? 'veiling…' : 'veil & share'}
        </motion.button>

        <AnimatePresence>
          {results.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-3">
              {results.map((r, i) => (
                <div key={i} className="glass rounded-2xl px-4 py-3 text-[13px]">
                  <p className="font-medium">{r.name}</p>
                  {r.embed ? (
                    <p className="mt-1 break-all text-white/50">{r.embed}</p>
                  ) : (
                    <p className="mt-1 text-red-300">{r.error}</p>
                  )}
                  {r.warn && <p className="mt-1 text-amber-200/80">{r.warn}</p>}
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
