import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

type CascadeItem = {
  id: string;
  name: string;
  size: number;
  embed: string;
  warn: string | null;
  created: number;
};

export default function QuietCascadePage() {
  const [items, setItems] = useState<CascadeItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [err, setErr] = useState('');

  const onFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files);
    if (!list.length) return;
    setBusy(true);
    setErr('');
    try {
      for (const file of list) {
        const warn = file.size > 25 * 1024 * 1024
          ? 'Large file. The cascade may feel slow while it settles. No hard limit.'
          : null;
        const res = await publishLocalFile(file, {
          caption: 'cascaded from quietcascade',
          cardTitle: file.name,
          meta: { desk: 'quietcascade', kind: 'cascade' },
        });
        if (res.ok && res.id && res.embed) {
          setItems((prev) => [
            {
              id: res.id!,
              name: file.name,
              size: file.size,
              embed: res.embed!,
              warn: res.warn || warn,
              created: Date.now(),
            },
            ...prev,
          ]);
        } else {
          setErr(res.error || 'a file did not settle');
        }
      }
    } catch (e: any) {
      setErr(e.message || 'something slowed');
    }
    setBusy(false);
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDrag(false);
    if (e.dataTransfer.files) onFiles(e.dataTransfer.files);
  };

  return (
    <div className="mesh min-h-screen bg-[#050506]">
      <Navbar />
      <div className="pt-28 pb-32 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          className="text-center mb-10"
        >
          <p className="text-[13px] tracking-widest text-neutral-500 uppercase mb-2">quietcascade</p>
          <h1 className="text-[34px] font-semibold tracking-tight text-white mb-3">Files that settle in a stream.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed max-w-md mx-auto">
            Drop one or many local files. Each becomes its own share in a cascading glass stream. Links unfurl with polished Discord cards. Soft spring motion, frosted glass. Large files receive only a gentle warning of slowness. Prior desks remain intact. No traces of boosting.
          </p>
        </motion.div>

        <motion.div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          animate={{ scale: drag ? 1.015 : 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          className={`glass rounded-[32px] p-10 text-center border-2 border-dashed transition-colors ${drag ? 'border-white/40 bg-white/10' : 'border-white/10'}`}
        >
          <p className="text-neutral-300 text-[15px] mb-4">Drop files here, or</p>
          <label className="inline-block">
            <span className="rounded-full bg-white text-black px-5 py-2.5 text-[14px] font-medium cursor-pointer hover:bg-neutral-100 transition">
              choose local files
            </span>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && onFiles(e.target.files)}
            />
          </label>
          {busy && <p className="mt-4 text-[13px] text-neutral-500">settling…</p>}
          {err && <p className="mt-3 text-[13px] text-red-400">{err}</p>}
        </motion.div>

        <div className="mt-12 space-y-4">
          <AnimatePresence>
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 140, damping: 20, delay: i * 0.04 }}
                className="glass rounded-[24px] p-5 flex items-start gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-medium text-white truncate">{item.name}</p>
                  <p className="text-[12px] text-neutral-500 mt-0.5">
                    {(item.size / 1024 / 1024).toFixed(1)} MB
                    {item.warn && <span className="text-amber-300/80"> · {item.warn}</span>}
                  </p>
                  <a
                    href={item.embed}
                    className="inline-block mt-2 text-[13px] text-[#0A84FF] hover:underline break-all"
                  >
                    {item.embed.replace(location.origin, '')}
                  </a>
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(item.embed)}
                  className="text-[12px] text-neutral-400 hover:text-white px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition"
                >
                  copy
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {items.length === 0 && !busy && (
            <p className="text-center text-neutral-600 text-[13px] mt-8">the stream is quiet. drop something to begin.</p>
          )}
        </div>
      </div>
    </div>
  );
}
