import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

type Dropped = { id: string; file: File; preview?: string; warn?: string };

export default function QuietAuroraPage() {
  const [files, setFiles] = useState<Dropped[]>([]);
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#5AC8FA');
  const [busy, setBusy] = useState(false);
  const [links, setLinks] = useState<string[]>([]);
  const [err, setErr] = useState('');

  const onDrop = useCallback((list: FileList | null) => {
    if (!list) return;
    const next: Dropped[] = Array.from(list).map((file) => {
      const warn = file.size > 40 * 1024 * 1024 ? 'Large file. Upload may feel slow. No hard limit.' : undefined;
      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
      return { id: Math.random().toString(36).slice(2), file, preview, warn };
    });
    setFiles((f) => [...f, ...next]);
  }, []);

  const remove = (id: string) => setFiles((f) => f.filter((x) => x.id !== id));

  const publish = async () => {
    if (!files.length) return setErr('drop at least one local file');
    setBusy(true);
    setErr('');
    setLinks([]);
    const made: string[] = [];
    for (const d of files) {
      const res = await publishLocalFile(d.file, {
        caption: caption.trim() || 'from the quiet aurora',
        color: accent,
        cardTitle: d.file.name,
        meta: { desk: 'quietaurora' },
      });
      if (res.ok && res.embed) made.push(res.embed);
      else if (!res.ok) setErr(res.error || 'one file slowed');
    }
    setLinks(made);
    setFiles([]);
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#050506]">
      <Navbar />
      <div className="pt-28 pb-20 px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 22 }}
          className="text-center mb-10"
        >
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>Quiet Aurora</p>
          <h1 className="text-[34px] font-semibold tracking-tight text-white mb-3">Files settle like light.</h1>
          <p className="text-neutral-400 text-[15px] max-w-lg mx-auto leading-relaxed">
            Drop local files. They flow into soft aurora glass cards with gentle spring motion on frosted glass. Shared caption, cool accent. Batch-publish to the database with polished Discord embeds on every link. Soft size warnings only. No hard limits. Human-crafted Apple-style pacing. All prior desks remain fully intact.
          </p>
        </motion.div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); onDrop(e.dataTransfer.files); }}
          className="glass rounded-[32px] p-10 text-center border-dashed border-2 border-white/10 hover:border-white/20 transition-all mb-8"
        >
          <p className="text-neutral-300 mb-4">Drag files here or click to choose</p>
          <label className="inline-block px-6 py-3 rounded-full text-sm font-medium text-white cursor-pointer" style={{ background: accent }}>
            Choose local files
            <input type="file" multiple className="hidden" onChange={(e) => onDrop(e.target.files)} />
          </label>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Shared caption (optional)"
            className="flex-1 bg-black/20 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/20"
          />
          <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-12 h-12 rounded-full cursor-pointer border-0 self-center" />
        </div>

        <AnimatePresence>
          {files.length > 0 && (
            <motion.div layout className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {files.map((d, i) => (
                <motion.div
                  key={d.id}
                  layout
                  initial={{ opacity: 0, scale: 0.92, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 140, damping: 18, delay: i * 0.04 }}
                  className="glass rounded-[24px] p-4 relative overflow-hidden group"
                >
                  {d.preview ? (
                    <img src={d.preview} alt="" className="w-full h-32 object-cover rounded-2xl mb-3" />
                  ) : (
                    <div className="h-32 rounded-2xl mb-3 grid place-items-center text-neutral-500 text-xs" style={{ background: `linear-gradient(135deg, ${accent}22, transparent)` }}>
                      {d.file.name.split('.').pop()?.toUpperCase()}
                    </div>
                  )}
                  <p className="text-sm text-white truncate">{d.file.name}</p>
                  <p className="text-[11px] text-neutral-500">{(d.file.size / 1024 / 1024).toFixed(1)} MB</p>
                  {d.warn && <p className="text-[10px] text-amber-300/80 mt-1">{d.warn}</p>}
                  <button onClick={() => remove(d.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-white text-xs">×</button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={publish}
          disabled={busy || !files.length}
          className="w-full max-w-md mx-auto block rounded-[20px] py-4 text-[15px] font-medium text-white disabled:opacity-40 shadow-xl"
          style={{ background: accent }}
        >
          {busy ? 'Settling into the aurora…' : `Publish ${files.length || ''} to the vault`}
        </motion.button>

        <AnimatePresence>
          {links.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-2 max-w-md mx-auto">
              {links.map((l) => (
                <a key={l} href={l} className="block text-sm break-all" style={{ color: accent }}>{l}</a>
              ))}
            </motion.div>
          )}
          {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mt-4 text-sm text-red-400">{err}</motion.p>}
        </AnimatePresence>
      </div>
    </div>
  );
}
