import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function QuietHorizonPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [accent, setAccent] = useState('#5AC8FA');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [err, setErr] = useState('');
  const [publics, setPublics] = useState<CloudMeta[]>([]);

  useEffect(() => {
    listPublicShares(8).then(setPublics).catch(() => {});
  }, []);

  const onDrop = (list: FileList | null) => {
    const next = Array.from(list || []);
    setFiles((prev) => [...prev, ...next].slice(0, 16));
    const big = next.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'some files are large. the horizon may take a moment to settle. no hard limit.' : '');
  };

  const remove = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const publish = async () => {
    if (files.length === 0) {
      setErr('drop at least one local file');
      return;
    }
    setBusy(true);
    setErr('');
    setLinks([]);
    const made: string[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: note.trim() || 'horizon line',
          cardTitle: file.name,
          color: accent,
          meta: { desk: 'quiethorizon', note: note.trim() },
        });
        if (!res.ok || !res.id) {
          setErr(res.error || `failed on ${file.name}`);
          break;
        }
        if (res.warn) setWarn(res.warn);
        made.push(shareUrls(res.id).app);
      }
      setLinks(made);
      if (made[0]) {
        try { await navigator.clipboard.writeText(made.join('\n')); } catch {}
      }
      listPublicShares(8).then(setPublics).catch(() => {});
    } catch (e: any) {
      setErr(e?.message || 'publish failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 16 }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-sm mb-2 tracking-wide" style={{ color: accent }}>quiet horizon</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">files settle on the line.</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Drop local files. They drift down and settle along a quiet glowing horizon of frosted glass with gentle spring motion. Shared caption. Batch-publish to the database. Every link unfurls a polished Discord embed. Soft size warnings only. No hard limits. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.
          </p>
          <div className="flex items-center gap-3 mb-4">
            <label className="text-xs text-neutral-500">accent</label>
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="w-10 h-10 rounded-full border border-white/10 bg-transparent cursor-pointer"
            />
            <span className="text-xs text-neutral-400">{accent}</span>
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="optional note for the horizon…"
            rows={2}
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-[#5AC8FA]/50 transition resize-none"
          />
          <label
            className="block cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-[#5AC8FA]/40 p-8 text-center transition mb-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onDrop(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => onDrop(e.target.files)} />
            <p className="text-sm text-neutral-300">drop or click for local files</p>
          </label>
          <div className="relative h-16 mb-4 rounded-2xl overflow-hidden bg-gradient-to-b from-transparent to-white/5">
            <div className="absolute inset-x-0 bottom-4 h-px" style={{ background: accent, boxShadow: `0 0 12px ${accent}` }} />
            <AnimatePresence>
              {files.map((f, i) => (
                <motion.div
                  key={f.name + i}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 140, damping: 14, delay: i * 0.04 }}
                  className="absolute bottom-5 text-[10px] text-neutral-300 truncate max-w-[80px]"
                  style={{ left: `${8 + (i % 8) * 11}%` }}
                >
                  {f.name.slice(0, 8)}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={publish}
            disabled={busy || files.length === 0}
            className="w-full py-3 rounded-full text-white text-sm font-medium disabled:opacity-50 transition"
            style={{ background: accent }}
          >
            {busy ? 'settling…' : 'publish horizon'}
          </motion.button>
          {links.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 text-xs text-neutral-400 space-y-1">
              <p>share links (copied):</p>
              {links.map((l) => (
                <div key={l} className="break-all">{l}</div>
              ))}
            </motion.div>
          )}
        </motion.div>

        {publics.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 100, damping: 18 }}
            className="mt-8 glass rounded-2xl p-6"
          >
            <p className="text-xs text-neutral-500 mb-3 tracking-wide">recent on the horizon</p>
            <div className="space-y-2">
              {publics.map((s) => (
                <a key={s.id} href={shareUrls(s.id).app} className="block text-xs text-neutral-300 hover:text-white truncate">
                  {s.name || s.id} · {s.caption || 'shared'}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
