import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function QuietQuartzPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [accent, setAccent] = useState('#BF5AF2');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [err, setErr] = useState('');
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setPulse((p) => p + 0.05), 25);
    return () => clearInterval(id);
  }, []);

  const onDrop = (list: FileList | null) => {
    const next = Array.from(list || []);
    setFiles((prev) => [...prev, ...next].slice(0, 8));
    const big = next.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'some files are large. the browser may pause while crystallizing. no hard limit.' : '');
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
          caption: note.trim() || 'quartz drop',
          cardTitle: file.name,
          color: accent,
          meta: { desk: 'quartz', note: note.trim() },
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
          transition={{ type: 'spring', stiffness: 95, damping: 17 }}
          className="glass rounded-[32px] p-8"
        >
          <p className="text-sm mb-2 tracking-wide" style={{ color: accent }}>quartz</p>
          <h1 className="text-3xl font-semibold mb-3 tracking-tight">files crystallize in quiet quartz.</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Drop several local files. They crystallize into a quiet quartz formation of frosted glass with pulsing spring facets. Share links unfurl with polished Discord embeds. Large files receive only a soft warning of possible slowness. No hard limits. All prior desks remain fully intact.
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
            placeholder="optional note for the quartz…"
            rows={2}
            className="w-full mb-4 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm placeholder:text-neutral-500 focus:outline-none focus:border-[#BF5AF2]/50 transition resize-none"
          />
          <div className="relative h-72 mb-6 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
            <AnimatePresence>
              {files.map((f, i) => {
                const scale = 0.8 + Math.sin(pulse + i) * 0.15;
                const y = 50 + (i * 40) % 160;
                const x = 40 + (i * 70) % 250;
                return (
                  <motion.div
                    key={f.name + i}
                    initial={{ opacity: 0, scale: 0.3 }}
                    animate={{ opacity: 1, y, x, scale }}
                    exit={{ opacity: 0, scale: 0.1 }}
                    transition={{ type: 'spring', stiffness: 80, damping: 14 }}
                    className="absolute px-3 py-1.5 rounded-2xl glass text-xs max-w-[130px] truncate"
                    style={{ borderColor: accent + '66', top: 0, left: 0, boxShadow: `0 0 20px ${accent}33` }}
                  >
                    {f.name}
                    <button type="button" onClick={() => remove(i)} className="ml-1 text-neutral-500 hover:text-white">×</button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
          <label
            className="block cursor-pointer rounded-2xl border border-dashed border-white/15 hover:border-[#BF5AF2]/40 p-6 text-center transition mb-4"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onDrop(e.dataTransfer.files); }}
          >
            <input type="file" multiple className="hidden" onChange={(e) => onDrop(e.target.files)} />
            <p className="text-sm text-neutral-300">drop or click for local files (up to eight in the quartz)</p>
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
            {busy ? 'crystallizing…' : 'publish quartz'}
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
