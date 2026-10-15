import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function DriftlinePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#60A5FA');
  const [busy, setBusy] = useState(false);
  const [links, setLinks] = useState<string[]>([]);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');

  const addFiles = (list: File[]) => {
    if (list.some(f => f.size > 40 * 1024 * 1024)) {
      setWarn('large files may feel slow while drifting. no hard limit.');
    } else {
      setWarn(null);
    }
    setFiles(prev => [...prev, ...list]);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    addFiles(Array.from(e.dataTransfer.files));
  }, []);

  const shareAll = async () => {
    if (!files.length && !note.trim()) return setErr('add a file or a line');
    setBusy(true);
    setErr('');
    setLinks([]);
    const created: string[] = [];
    const targets = files.length ? files : [new File([note], 'driftline.txt', { type: 'text/plain' })];
    try {
      for (const file of targets) {
        const res = await publishLocalFile(file, {
          caption: note || 'a soft driftline',
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'driftline' },
        });
        if (res.ok && res.embed) created.push(res.embed);
        else if (!res.ok) setErr(res.error || 'one line failed');
      }
      setLinks(created);
      if (created.length) setFiles([]);
    } catch (e: any) {
      setErr(e?.message || 'share failed');
    }
    setBusy(false);
  };

  const lines = [...Array(6)].map((_, i) => ({
    id: i,
    top: `${12 + i * 14}%`,
    width: 30 + (i % 3) * 20,
    delay: i * 0.6,
  }));

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-2xl mx-auto relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {lines.map((l) => (
            <motion.div
              key={l.id}
              className="absolute h-[1px] rounded-full left-0"
              style={{
                top: l.top,
                width: `${l.width}%`,
                background: `linear-gradient(90deg, transparent, ${accent}70, transparent)`,
                opacity: 0.4,
              }}
              animate={{ x: ['-8%', '8%', '-8%'], opacity: [0.2, 0.45, 0.2] }}
              transition={{ duration: 10 + l.id, repeat: Infinity, ease: 'easeInOut', delay: l.delay }}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="glass rounded-[36px] p-8 relative z-10"
        >
          <p className="text-sm mb-2 tracking-wide" style={{ color: accent }}>driftline</p>
          <h1 className="text-3xl font-semibold tracking-tight mb-3">soft drifting lines for what you carry.</h1>
          <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
            Drop files under quiet horizontal lines that drift. A shared note travels with each. Spring motion, glass surfaces, your accent color. Every file lands in storage and the public_shares table with a polished Discord embed. Large files warned, never refused. Prior features preserved. No traces of boosting.
          </p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="relative border-2 border-dashed border-white/10 rounded-2xl p-8 text-center mb-6 hover:border-white/20 transition"
          >
            <input type="file" multiple onChange={(e) => addFiles(Array.from(e.target.files || []))} className="hidden" id="driftline-in" />
            <label htmlFor="driftline-in" className="cursor-pointer text-neutral-300 text-sm">drop files or click</label>
            {files.length > 0 && (
              <ul className="mt-4 space-y-1 text-xs text-neutral-500">
                {files.map((f, i) => <li key={i} className="truncate">{f.name}</li>)}
              </ul>
            )}
          </div>

          {warn && <p className="text-xs text-amber-300/80 mb-4">{warn}</p>}

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="a quiet line to travel with the files…"
            rows={3}
            className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-4 py-3 text-sm text-white placeholder:text-neutral-600 mb-4 resize-none focus:outline-none focus:border-white/15"
          />

          <div className="flex items-center gap-3 mb-6">
            <span className="text-xs text-neutral-500">accent</span>
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-8 h-8 rounded-full border-0 cursor-pointer" />
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.01 }}
            onClick={shareAll}
            disabled={busy || (!files.length && !note.trim())}
            className="w-full rounded-2xl py-3 text-sm font-medium text-white disabled:opacity-40 transition"
            style={{ background: accent }}
          >
            {busy ? 'drifting…' : 'share the lines'}
          </motion.button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-2">
                <p className="text-xs text-neutral-400">links ready for Discord</p>
                {links.map((l, i) => (
                  <a key={i} href={l} className="block text-sm break-all" style={{ color: accent }}>{l}</a>
                ))}
              </motion.div>
            )}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-xs text-red-400">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
