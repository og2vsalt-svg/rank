import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function QuietOrchardPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#5AC8FA');
  const [status, setStatus] = useState<'idle' | 'uploading' | 'done'>('idle');
  const [results, setResults] = useState<{ id: string; name: string; embed: string; warn?: string | null }[]>([]);
  const [drag, setDrag] = useState(false);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length) setFiles((prev) => [...prev, ...dropped].slice(0, 16));
  }, []);

  const publish = async () => {
    if (!files.length || status === 'uploading') return;
    setStatus('uploading');
    const next: typeof results = [];
    for (const file of files) {
      const warn = file.size > 40 * 1024 * 1024 ? 'large file — upload may feel slow. no hard limit.' : null;
      const res = await publishLocalFile(file, {
        caption: caption || undefined,
        color,
        cardTitle: file.name.replace(/\.[^.]+$/, ''),
        author: 'rankvault',
      });
      if (res.ok && res.id) {
        next.push({ id: res.id, name: file.name, embed: shareUrls(res.id).embed, warn: res.warn || warn });
      }
    }
    setResults(next);
    setFiles([]);
    setCaption('');
    setStatus('done');
  };

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white pt-24 px-5 pb-20">
      <div className="max-w-3xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-4xl sm:text-5xl font-semibold tracking-tight mb-2"
        >
          quiet orchard
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08 }}
          className="text-neutral-400 mb-10 max-w-xl"
        >
          Drop local files. They grow into soft frosted glass trees with gentle spring motion. Shared caption, cool accent. Batch-publish to the database with polished Discord embeds. Soft size warnings only. No hard limits. All prior desks remain fully intact.
        </motion.p>

        <motion.div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          animate={{ scale: drag ? 1.015 : 1 }}
          className="glass rounded-3xl p-8 mb-6 border-2 border-dashed border-white/10"
        >
          <div className="text-center py-6">
            <p className="text-neutral-300 mb-1">drop files into the orchard</p>
            <p className="text-xs text-neutral-500">large files warned, never refused</p>
            <input type="file" multiple className="hidden" id="orchard-in" onChange={(e) => {
              const sel = Array.from(e.target.files || []);
              if (sel.length) setFiles((p) => [...p, ...sel].slice(0, 16));
            }} />
            <label htmlFor="orchard-in" className="mt-4 inline-block px-5 py-2 rounded-full bg-white/10 text-sm cursor-pointer hover:bg-white/15 transition">choose files</label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 min-h-[80px]">
            <AnimatePresence>
              {files.map((f, i) => (
                <motion.div
                  key={f.name + i}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: 'spring', stiffness: 120, damping: 16, delay: i * 0.04 }}
                  className="glass rounded-2xl p-4 text-center relative overflow-hidden"
                  style={{ borderColor: color + '40' }}
                >
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-white/5 to-transparent" />
                  <div className="w-2 h-8 mx-auto mb-2 rounded-full" style={{ background: color }} />
                  <p className="text-xs truncate">{f.name}</p>
                  <p className="text-[10px] text-neutral-500 mt-1">{(f.size / 1024 / 1024).toFixed(1)} MB</p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="shared caption (optional)"
            className="w-full mt-6 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-sm outline-none focus:border-[#5AC8FA]/40"
          />

          <div className="flex items-center gap-3 mt-4">
            <label className="text-xs text-neutral-500">accent</label>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded-full border-0 cursor-pointer" />
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={publish}
            disabled={!files.length || status === 'uploading'}
            className="mt-6 w-full py-3 rounded-full bg-[#5AC8FA] text-black font-medium disabled:opacity-40 transition"
          >
            {status === 'uploading' ? 'planting…' : `plant ${files.length || ''} file${files.length === 1 ? '' : 's'}`}
          </motion.button>
        </motion.div>

        {results.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-5">
            <p className="text-sm font-medium mb-3">orchard shares</p>
            {results.map((r) => (
              <div key={r.id} className="mb-3 last:mb-0">
                <p className="text-sm truncate">{r.name}</p>
                <button onClick={() => navigator.clipboard.writeText(r.embed)} className="text-xs text-[#5AC8FA] hover:underline mt-1">copy discord link</button>
                {r.warn && <p className="text-amber-400 text-xs mt-1">{r.warn}</p>}
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
