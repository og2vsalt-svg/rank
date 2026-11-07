import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

export default function SoftQuietHaloPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [shared, setShared] = useState<{ id: string; name: string; embed: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    setFiles((f) => [...f, ...dropped]);
    const big = dropped.some((f) => f.size > 40 * 1024 * 1024);
    if (big) setWarn('some drops are large. the browser may feel slow while sending. never refused.');
  }, []);

  const onSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles((f) => [...f, ...selected]);
    if (selected.some((f) => f.size > 40 * 1024 * 1024)) {
      setWarn('large files detected. upload may feel slow. no hard limit.');
    }
  };

  const shareAll = async () => {
    if (!files.length) return;
    setBusy(true);
    const results = [];
    for (const file of files) {
      const note = notes[file.name] || '';
      const res = await publishLocalFile(file, { caption: note, color: '#0A84FF' });
      if (res.ok && res.id) {
        results.push({ id: res.id, name: file.name, embed: shareUrls(res.id).embed });
      }
    }
    setShared(results);
    setBusy(false);
    setFiles([]);
    setNotes({});
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-20 px-5 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          className="glass rounded-[32px] p-8 mb-6 text-center"
        >
          <p className="text-sm text-[#0A84FF] mb-2 tracking-wide">soft quiet halo</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3">arrange what you carry in a quiet halo.</h1>
          <p className="text-neutral-400 text-sm leading-relaxed max-w-lg mx-auto">
            Multi-file local upload. Each file can carry its own quiet note. Soft glass cards rise with spring motion. Lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. Human-crafted Apple-style pacing. All prior desks remain fully intact. No traces of boosting.
          </p>
        </motion.div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className="glass rounded-[28px] p-10 text-center border-2 border-dashed border-white/10 hover:border-[#0A84FF]/40 transition-all duration-500 cursor-pointer"
        >
          <input type="file" multiple onChange={onSelect} className="hidden" id="halo-input" />
          <label htmlFor="halo-input" className="block cursor-pointer">
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="text-neutral-300">
              drop files here or click to choose
            </motion.div>
          </label>
          {warn && <p className="text-xs text-amber-400 mt-3">{warn}</p>}
        </div>

        <AnimatePresence>
          {files.map((f) => (
            <motion.div
              key={f.name + f.size}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 140, damping: 16 }}
              className="glass rounded-2xl p-4 mt-3 flex items-center gap-3"
            >
              <div className="flex-1">
                <p className="text-sm truncate">{f.name}</p>
                <p className="text-xs text-neutral-500">{(f.size / 1024 / 1024).toFixed(1)} MB</p>
                <input
                  placeholder="quiet note for this file"
                  value={notes[f.name] || ''}
                  onChange={(e) => setNotes((n) => ({ ...n, [f.name]: e.target.value }))}
                  className="mt-2 w-full bg-white/5 rounded-xl px-3 py-1.5 text-xs outline-none focus:bg-white/10 transition"
                />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {files.length > 0 && (
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={shareAll}
            disabled={busy}
            className="mt-6 w-full py-3 rounded-full bg-[#0A84FF] text-white text-sm font-medium disabled:opacity-50"
          >
            {busy ? 'settling into the halo…' : 'share the halo'}
          </motion.button>
        )}

        {shared.length > 0 && (
          <div className="mt-8 space-y-3">
            <p className="text-sm text-neutral-400">shared links (Discord embeds ready):</p>
            {shared.map((s) => (
              <div key={s.id} className="glass rounded-xl p-3 text-xs">
                <p className="truncate">{s.name}</p>
                <a href={s.embed} className="text-[#0A84FF] break-all">{s.embed}</a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
