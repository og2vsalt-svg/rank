import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function QuietTidePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [accent, setAccent] = useState('#5AC8FA');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [err, setErr] = useState('');
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setPhase((p) => p + 0.02), 16);
    return () => clearInterval(id);
  }, []);

  const onDrop = (list: FileList | null) => {
    const next = Array.from(list || []);
    setFiles((prev) => [...prev, ...next].slice(0, 10));
    const big = next.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'some waves are heavy. the browser may pause while it settles. no hard limit.' : '');
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
          caption: note.trim() || 'tidal drop',
          cardTitle: file.name,
          color: accent,
          meta: { desk: 'tide', note: note.trim() },
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
          <p className="text-sm mb-2 tracking-wide" style={{ color: accent }}>tide</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">files wash in on a quiet tide.</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Drop several local files. They settle into a soft tidal wave of frosted glass, rising and falling with a gentle spring. Share links unfurl with polished Discord cards. Large files receive only a soft warning of possible slowness. No hard limits. Prior desks stay fully intact.
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
            placeholder="optional note for the tide…"
            rows={2}
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-[#5AC8FA]/50 transition resize-none"
          />
          <div className="relative h-64 mb-6 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              <path
                d={`M0,${120 + Math.sin(phase) * 18} Q150,${90 + Math.sin(phase + 1) * 22} 300,${130 + Math.sin(phase + 0.5) * 16} T600,${110 + Math.sin(phase + 1.2) * 20} V256 H0 Z`}
                fill={accent + '18'}
                stroke={accent + '40'}
                strokeWidth="1.5"
              />
            </svg>
            <AnimatePresence>
              {files.map((f, i) => {
                const y = 40 + ((i * 28) % 140) + Math.sin(phase + i) * 12;
                const x = 20 + (i * 48) % 280;
                return (
                  <motion.div
                    key={f.name + i}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y, x }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ type: 'spring', stiffness: 70, damping: 12 }}
                    className="absolute px-3 py-1.5 rounded-full glass text-xs max-w-[130px] truncate"
                    style={{ borderColor: accent + '55', top: 0, left: 0 }}
                  >
                    {f.name}
                    <button type="button" onClick={() => remove(i)} className="ml-1 text-neutral-500 hover:text-white">×</button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          <label
            className="block cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-[#5AC8FA]/40 p-6 text-center transition mb-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onDrop(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => onDrop(e.target.files)} />
            <p className="text-sm text-neutral-300">drop or click for local files (up to ten on the tide)</p>
          </label>
          {warn && <p className="text-xs text-amber-300/80 mb-3">{warn}</p>}
          {err && <p className="text-xs text-red-400 mb-3">{err}</p>}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={publish}
            disabled={busy || files.length === 0}
            className="w-full py-3 rounded-full text-white text-sm font-medium disabled:opacity-50 transition"
            style={{ background: accent }}
          >
            {busy ? 'settling…' : 'publish tide'}
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
