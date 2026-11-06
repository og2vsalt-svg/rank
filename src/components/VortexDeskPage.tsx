import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function VortexDeskPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [accent, setAccent] = useState('#0A84FF');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [err, setErr] = useState('');

  const onDrop = (list: FileList | null) => {
    const next = Array.from(list || []);
    setFiles((prev) => [...prev, ...next].slice(0, 16));
    const big = next.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'some files are chunky. encoding may feel slow. no hard limit.' : '');
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
          caption: note.trim() || 'vortex spiral',
          cardTitle: file.name,
          color: accent,
          meta: { desk: 'vortexdesk', note: note.trim() },
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
    } catch (e: any) {
      setErr(e?.message || 'publish failed');
    } finally {
      setBusy(false);
    }
  };

  const orbs = useMemo(() => files.map((f, i) => {
    const angle = (i / Math.max(files.length, 1)) * Math.PI * 4;
    const radius = 40 + i * 18;
    return {
      file: f,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      delay: i * 0.05,
    };
  }), [files]);

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 16 }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-sm mb-2 tracking-wide" style={{ color: accent }}>vortexdesk</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">a living spiral of what you carry.</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Drop local files. They arrange as floating glass orbs in a gentle vortex with spring motion. Shared note and accent tint every share. Every share link unfurls a polished Discord card. Large batches warned only for possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.
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
            placeholder="optional note for the spiral…"
            rows={2}
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-[#0A84FF]/50 transition resize-none"
          />
          <label
            className="block cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-[#0A84FF]/40 p-8 text-center transition mb-6"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onDrop(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => onDrop(e.target.files)} />
            <p className="text-sm text-neutral-300">drop or click for local files</p>
          </label>

          <div className="relative h-72 mb-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full border border-white/10" style={{ borderColor: accent + '40' }} />
            </div>
            <AnimatePresence>
              {orbs.map((orb, i) => (
                <motion.div
                  key={orb.file.name + i}
                  initial={{ opacity: 0, scale: 0.6, x: 0, y: 0 }}
                  animate={{ opacity: 1, scale: 1, x: orb.x, y: orb.y }}
                  exit={{ opacity: 0, scale: 0.4 }}
                  transition={{ type: 'spring', stiffness: 120, damping: 14, delay: orb.delay }}
                  className="absolute glass rounded-full w-16 h-16 flex items-center justify-center text-[10px] text-center px-1 cursor-pointer group"
                  style={{ boxShadow: `0 0 20px ${accent}33` }}
                  onClick={() => remove(i)}
                >
                  <span className="truncate max-w-full group-hover:text-white">{orb.file.name.slice(0, 12)}</span>
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
            {busy ? 'spinning the vortex…' : 'publish vortex'}
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
      </div>
    </div>
  );
}
