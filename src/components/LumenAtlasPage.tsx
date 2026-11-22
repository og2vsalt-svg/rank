import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function LumenAtlasPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<(string | null)[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [sharedNote, setSharedNote] = useState('');
  const [accent, setAccent] = useState('#64D2FF');
  const [busy, setBusy] = useState(false);
  const [warns, setWarns] = useState<(string | null)[]>([]);
  const [results, setResults] = useState<{ link?: string; error?: string; name: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectFiles = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    setFiles(arr);
    setResults([]);
    setNotes(arr.map(() => ''));
    const newWarns = arr.map(f => f.size > 40_000_000 ? 'Large file — may feel slower. No hard limits.' : null);
    setWarns(newWarns);
    previews.forEach(p => p && URL.revokeObjectURL(p));
    const newPreviews = arr.map(f => f.type.startsWith('image/') ? URL.createObjectURL(f) : null);
    setPreviews(newPreviews);
  }, [previews]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) selectFiles(e.dataTransfer.files);
  }, [selectFiles]);

  const updateNote = (i: number, v: string) => {
    setNotes(prev => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  };

  const publishAll = async () => {
    if (!files.length || busy) return;
    setBusy(true);
    setResults([]);
    const outs: { link?: string; error?: string; name: string }[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const caption = [sharedNote.trim(), notes[i]?.trim()].filter(Boolean).join(' · ') || file.name;
        const res = await publishLocalFile(file, {
          caption,
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'lumenatlas', shared: sharedNote.trim() || null, itemNote: notes[i]?.trim() || null },
        });
        outs.push({ link: res.embed, error: res.error, name: file.name });
      } catch (e: any) {
        outs.push({ error: e.message, name: file.name });
      }
    }
    setResults(outs);
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
          className="glass rounded-[40px] p-8 md:p-12 relative overflow-hidden"
        >
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full blur-[110px] opacity-25 pointer-events-none" style={{ background: accent }} />
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>LumenAtlas</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">Files settle into a quiet atlas.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Drop several files. They arrange as luminous points with shared caption and per-item notes. Soft glows, live previews, Apple-style springs on frosted glass. Soft size warnings only. Every share link carries a polished Discord embed.
          </p>

          <motion.div
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            whileHover={{ scale: 1.005 }}
            whileTap={{ scale: 0.995 }}
            className="border-2 border-dashed border-white/15 rounded-3xl p-10 text-center mb-7 cursor-pointer hover:border-white/25 transition bg-black/20 relative"
          >
            {files.length === 0 ? (
              <div className="text-neutral-400">
                <p className="text-[15px]">Drop files into the atlas</p>
                <p className="text-sm mt-1 text-neutral-500">or click to choose several</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {files.map((f, i) => (
                  <motion.div
                    key={f.name + i}
                    initial={{ opacity: 0, scale: 0.92, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 140, damping: 15, delay: i * 0.05 }}
                    className="relative rounded-2xl overflow-hidden bg-black/30 p-3 border border-white/5"
                  >
                    {previews[i] ? (
                      <img src={previews[i]!} alt="" className="w-full h-24 object-cover rounded-xl mb-2" />
                    ) : (
                      <div className="h-24 flex items-center justify-center text-neutral-500 text-xs">file</div>
                    )}
                    <p className="text-xs truncate text-neutral-300">{f.name}</p>
                    <p className="text-[10px] text-neutral-500">{(f.size / 1024 / 1024).toFixed(1)} MB</p>
                    {warns[i] && <p className="text-[10px] text-amber-300/70 mt-1">{warns[i]}</p>}
                    <input
                      value={notes[i] || ''}
                      onChange={(e) => updateNote(i, e.target.value)}
                      placeholder="note"
                      className="mt-2 w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[11px] text-white placeholder:text-neutral-600 focus:outline-none"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{ boxShadow: `inset 0 0 18px ${accent}18` }} />
                  </motion.div>
                ))}
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && selectFiles(e.target.files)}
            />
          </motion.div>

          <textarea
            value={sharedNote}
            onChange={(e) => setSharedNote(e.target.value)}
            placeholder="Shared atlas note (optional)"
            rows={3}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition resize-none"
          />

          <div className="flex items-center gap-3 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-500">Accent glow for embeds and atlas</span>
          </div>

          <AnimatePresence>
            {results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2 mb-4"
              >
                {results.map((r, i) => (
                  <div key={i} className="glass rounded-2xl p-3 text-sm">
                    <p className="text-neutral-300 truncate">{r.name}</p>
                    {r.link && <a href={r.link} target="_blank" rel="noreferrer" className="text-blue-400 break-all text-xs">{r.link}</a>}
                    {r.error && <p className="text-red-400 text-xs">{r.error}</p>}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.003 }}
            onClick={publishAll}
            disabled={busy || files.length === 0}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ background: accent }}
          >
            {busy ? 'Charting the atlas…' : files.length ? `Publish ${files.length} point${files.length > 1 ? 's' : ''}` : 'Choose files'}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
