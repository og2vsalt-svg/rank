import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function StillharborPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<(string | null)[]>([]);
  const [sharedNote, setSharedNote] = useState('');
  const [accent, setAccent] = useState('#5AC8FA');
  const [busy, setBusy] = useState(false);
  const [warns, setWarns] = useState<(string | null)[]>([]);
  const [results, setResults] = useState<{ link?: string; error?: string; name: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectFiles = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    setFiles(arr);
    setResults([]);
    const newWarns = arr.map(f => f.size > 40_000_000 ? 'Large file — may feel slower. No hard limits.' : null);
    setWarns(newWarns);
    // clean old previews
    previews.forEach(p => p && URL.revokeObjectURL(p));
    const newPreviews = arr.map(f => f.type.startsWith('image/') ? URL.createObjectURL(f) : null);
    setPreviews(newPreviews);
  }, [previews]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) selectFiles(e.dataTransfer.files);
  }, [selectFiles]);

  const publishAll = async () => {
    if (!files.length || busy) return;
    setBusy(true);
    setResults([]);
    const outs: { link?: string; error?: string; name: string }[] = [];
    for (const file of files) {
      try {
        const res = await publishLocalFile(file, {
          caption: sharedNote.trim() || file.name,
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'stillharbor', shared: sharedNote.trim() || null },
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
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 22 }}
          className="glass rounded-[40px] p-8 md:p-12"
        >
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>Stillharbor</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3">Files settle quietly.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Drop several files into a calm harbor. Shared note, soft glows, live previews, Apple-style springs on frosted glass. Soft size warnings only. Every link carries a polished Discord embed.
          </p>

          <motion.div
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            whileHover={{ scale: 1.008 }}
            whileTap={{ scale: 0.992 }}
            className="border-2 border-dashed border-white/15 rounded-3xl p-10 text-center mb-7 cursor-pointer hover:border-white/25 transition bg-black/20"
          >
            {files.length === 0 ? (
              <div className="text-neutral-400">
                <p className="text-[15px]">Drop files here</p>
                <p className="text-sm mt-1 text-neutral-500">or click to choose several</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {files.map((f, i) => (
                  <motion.div
                    key={f.name + i}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 140, damping: 18, delay: i * 0.03 }}
                    className="relative rounded-2xl overflow-hidden bg-black/30 p-3"
                  >
                    {previews[i] ? (
                      <img src={previews[i]!} alt="" className="w-full h-24 object-cover rounded-xl mb-2" />
                    ) : (
                      <div className="h-24 flex items-center justify-center text-neutral-500 text-xs">file</div>
                    )}
                    <p className="text-xs truncate text-neutral-300">{f.name}</p>
                    <p className="text-[10px] text-neutral-500">{(f.size / 1024 / 1024).toFixed(1)} MB</p>
                    {warns[i] && <p className="text-[10px] text-amber-300/70 mt-1">{warns[i]}</p>}
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
            placeholder="Shared note for the harbor (optional)"
            rows={3}
            className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 mb-5 focus:outline-none focus:border-white/30 transition resize-none"
          />

          <div className="flex items-center gap-3 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-500">Accent glow for embeds</span>
          </div>

          <AnimatePresence>
            {results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
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
            whileHover={{ scale: 1.004 }}
            onClick={publishAll}
            disabled={busy || files.length === 0}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ background: accent }}
          >
            {busy ? 'Settling…' : files.length ? `Publish ${files.length} file${files.length > 1 ? 's' : ''}` : 'Choose files'}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
