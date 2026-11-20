import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function ConstellationPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#AF52DE');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [results, setResults] = useState<{ link?: string; error?: string; name: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectFiles = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    if (!arr.length) return;
    setFiles(prev => [...prev, ...arr]);
    setResults([]);
    const big = arr.some(f => f.size > 40_000_000);
    setWarn(big ? 'Some files are large — the constellation may take a moment to form. No hard limits.' : null);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) selectFiles(e.dataTransfer.files);
  }, [selectFiles]);

  const remove = (idx: number) => setFiles(f => f.filter((_, i) => i !== idx));

  const publish = async () => {
    if (!files.length || busy) return;
    setBusy(true);
    setResults([]);
    const out: typeof results = [];
    for (const file of files) {
      try {
        const res = await publishLocalFile(file, {
          caption: note.trim() || file.name,
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'constellation', sharedNote: note.trim() },
        });
        out.push({ link: res.embed, error: res.error, name: file.name });
      } catch (e: any) {
        out.push({ error: e.message, name: file.name });
      }
    }
    setResults(out);
    setBusy(false);
  };

  const radius = 120;
  const count = files.length || 1;

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 22 }}
          className="glass rounded-[40px] p-8 md:p-12 relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 40%, ${accent}44, transparent 70%)` }} />

          <p className="text-[13px] font-medium tracking-wide mb-2 relative" style={{ color: accent }}>Constellation</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 relative">Files in orbit.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8 relative">
            Drop several files. They settle into a soft constellation around a shared note. Each gets its own polished Discord embed. Soft size warnings only. Spring animations on frosted glass.
          </p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className="relative border-2 border-dashed border-white/15 rounded-3xl p-10 text-center mb-7 cursor-pointer hover:border-white/25 transition bg-black/20"
          >
            <div className="relative h-64 flex items-center justify-center">
              {files.map((f, i) => {
                const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                return (
                  <motion.div
                    key={f.name + i}
                    className="absolute w-16 h-16 rounded-2xl glass flex items-center justify-center text-[10px] text-center p-1 overflow-hidden"
                    style={{ x, y, background: accent + '22' }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 180, damping: 20, delay: i * 0.05 }}
                    whileHover={{ scale: 1.08 }}
                  >
                    {f.type.startsWith('image/') ? '🖼️' : '📄'}
                    <button
                      onClick={(e) => { e.stopPropagation(); remove(i); }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-black/60 rounded-full text-[9px]"
                    >×</button>
                  </motion.div>
                );
              })}
              <div className="absolute w-20 h-20 rounded-full glass flex items-center justify-center text-xs text-neutral-400">
                {files.length ? `${files.length}` : 'drop'}
              </div>
            </div>
            <p className="text-sm text-neutral-500 mt-4">Drop files or tap to choose</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && selectFiles(e.target.files)}
            />
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Shared quiet note for the constellation"
            rows={2}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition resize-none"
          />

          <div className="flex items-center gap-3 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-500">Accent glow</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/80 mb-5">{warn}</p>}

          <AnimatePresence>
            {results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2 mb-4"
              >
                {results.map((r, i) => (
                  <div key={i} className="glass rounded-xl p-3 text-sm">
                    <span className="text-neutral-300">{r.name}</span>
                    {r.link && <a href={r.link} target="_blank" rel="noreferrer" className="block text-blue-400 break-all text-xs mt-1">{r.link}</a>}
                    {r.error && <span className="block text-red-400 text-xs mt-1">{r.error}</span>}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !files.length}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl relative"
            style={{ background: accent }}
          >
            {busy ? 'Forming…' : files.length ? `Release ${files.length} file${files.length > 1 ? 's' : ''}` : 'Choose files'}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
