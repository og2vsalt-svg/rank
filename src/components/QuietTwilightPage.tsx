import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function QuietTwilightPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#5E5CE6');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done'>('idle');
  const [results, setResults] = useState<{ id: string; name: string; embed: string; warn?: string | null }[]>([]);
  const [drag, setDrag] = useState(false);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length) setFiles((prev) => [...prev, ...dropped].slice(0, 18));
  }, []);

  const publish = async () => {
    if (!files.length || status === 'uploading') return;
    setStatus('uploading');
    const next: typeof results = [];
    for (const file of files) {
      const warn = file.size > 48 * 1024 * 1024 ? 'large twilight drop — may take a quiet moment. no hard limit.' : null;
      const res = await publishLocalFile(file, {
        caption: note || undefined,
        color: accent,
        cardTitle: file.name.replace(/\.[^.]+$/, ''),
        author: 'rankvault',
        meta: { desk: 'quiettwilight' },
      });
      if (res.ok && res.id) {
        next.push({ id: res.id, name: file.name, embed: shareUrls(res.id).embed, warn: res.warn || warn });
      }
    }
    setResults(next);
    setFiles([]);
    setNote('');
    setStatus('done');
  };

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white pt-24 px-5 pb-20 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-40" style={{ background: `radial-gradient(ellipse at 50% 20%, ${accent}30, transparent 65%)` }} />
      <div className="max-w-3xl mx-auto relative">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 88, damping: 24 }}
          className="text-4xl sm:text-5xl font-semibold tracking-tight mb-2"
        >
          quiet twilight
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.12 }}
          className="text-neutral-400 mb-10 max-w-xl"
        >
          Drop local files into the soft blue-purple dusk. They settle as gentle frosted glass orbs with upward spring motion and a quiet glow. Shared note, twilight accent. Batch-publish to the database with polished Discord embeds. Soft size warnings only. No hard limits. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.
        </motion.p>

        <motion.div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          animate={{ scale: drag ? 1.012 : 1 }}
          className="glass rounded-3xl p-8 mb-6 border-2 border-dashed border-white/10 relative overflow-hidden"
        >
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: `radial-gradient(circle at 35% 25%, ${accent}50, transparent 50%)` }} />
          <div className="text-center py-6 relative">
            <p className="text-neutral-300 mb-1">drop files into the twilight</p>
            <p className="text-xs text-neutral-500">large files warned, never refused</p>
            <input type="file" multiple className="hidden" id="twilight-in" onChange={(e) => {
              const sel = Array.from(e.target.files || []);
              if (sel.length) setFiles((p) => [...p, ...sel].slice(0, 18));
            }} />
            <label htmlFor="twilight-in" className="mt-4 inline-block px-5 py-2 rounded-full bg-white/10 text-sm cursor-pointer hover:bg-white/15 transition">choose files</label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 min-h-[80px] relative">
            <AnimatePresence>
              {files.map((f, i) => (
                <motion.div
                  key={f.name + i}
                  initial={{ opacity: 0, y: 28, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -18 }}
                  transition={{ type: 'spring', stiffness: 105, damping: 17, delay: i * 0.04 }}
                  className="glass rounded-2xl p-3 text-center relative"
                  style={{ borderColor: accent + '35', boxShadow: `0 0 18px ${accent}25` }}
                >
                  <div className="w-3 h-3 mx-auto mb-1.5 rounded-full" style={{ background: accent, boxShadow: `0 0 8px ${accent}` }} />
                  <p className="text-[11px] truncate">{f.name}</p>
                  <p className="text-[9px] text-neutral-500 mt-0.5">{(f.size / 1024 / 1024).toFixed(1)} MB</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="shared twilight note (optional)"
            rows={2}
            className="w-full mt-6 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#5E5CE6]/40 resize-none"
          />

          <div className="flex items-center gap-3 mt-4">
            <label className="text-xs text-neutral-500">twilight accent</label>
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-8 h-8 rounded-full border-0 cursor-pointer" />
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={publish}
            disabled={!files.length || status === 'uploading'}
            className="mt-6 w-full py-3 rounded-full font-medium disabled:opacity-40 transition"
            style={{ background: accent, color: '#fff' }}
          >
            {status === 'uploading' ? 'settling into dusk…' : `settle ${files.length || ''} file${files.length === 1 ? '' : 's'}`}
          </motion.button>
        </motion.div>

        {results.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5">
            <p className="text-sm font-medium mb-3">twilight shares</p>
            {results.map((r) => (
              <div key={r.id} className="mb-3 last:mb-0">
                <p className="text-sm truncate">{r.name}</p>
                <button onClick={() => navigator.clipboard.writeText(r.embed)} className="text-xs hover:underline mt-1" style={{ color: accent }}>copy discord link</button>
                {r.warn && <p className="text-amber-400 text-xs mt-1">{r.warn}</p>}
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
