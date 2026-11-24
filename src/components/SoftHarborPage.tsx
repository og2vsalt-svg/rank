import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

type Item = {
  file: File;
  preview?: string;
  id: string;
  status: 'queued' | 'uploading' | 'done' | 'error';
  progress: number;
  link?: string;
  error?: string;
  note: string;
};

export default function SoftHarborPage() {
  const { navigate } = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [sharedNote, setSharedNote] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    const total = arr.reduce((s, f) => s + f.size, 0);
    setWarn(total > 60_000_000 ? 'Large files may feel slow in the browser. Nothing is blocked.' : null);
    const next: Item[] = arr.map((file) => ({
      file,
      id: Math.random().toString(36).slice(2, 10),
      status: 'queued',
      progress: 0,
      note: '',
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
    }));
    setItems((p) => [...p, ...next]);
  }, []);

  const publish = async () => {
    if (!items.length || busy) return;
    setBusy(true);
    for (const item of items) {
      if (item.status === 'done') continue;
      setItems((p) => p.map((i) => i.id === item.id ? { ...i, status: 'uploading', progress: 12 } : i));
      try {
        const progressTimer = setInterval(() => {
          setItems((p) => p.map((i) => i.id === item.id && i.status === 'uploading' ? { ...i, progress: Math.min(92, i.progress + 8) } : i));
        }, 180);
        const caption = [sharedNote.trim(), item.note.trim()].filter(Boolean).join(' · ') || item.file.name;
        const res = await publishLocalFile(item.file, {
          caption,
          color: accent,
          cardTitle: item.file.name,
          meta: { desk: 'harbor' },
        });
        clearInterval(progressTimer);
        const link = res.ok && res.id ? shareUrls(res.id).app : undefined;
        setItems((p) => p.map((i) =>
          i.id === item.id
            ? { ...i, status: res.ok ? 'done' : 'error', progress: res.ok ? 100 : 0, link, error: res.error }
            : i
        ));
      } catch (e: any) {
        setItems((p) => p.map((i) => i.id === item.id ? { ...i, status: 'error', error: e.message } : i));
      }
    }
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
          className="glass rounded-[36px] p-8 md:p-12 border border-white/5"
        >
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>Harbor</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">A quieter drop.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Multi-file local drops with a shared note and accent. Soft progress, spring motion, frosted glass. Files land in storage and public_shares. Every link carries a polished Discord embed. Large files are only warned. All prior desks remain intact. No traces of boosting.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
            onClick={() => inputRef.current?.click()}
            className="relative rounded-3xl border-2 border-dashed border-white/10 hover:border-white/20 bg-black/20 p-10 text-center cursor-pointer transition-colors mb-6"
          >
            <input ref={inputRef} type="file" multiple hidden onChange={(e) => e.target.files && addFiles(e.target.files)} />
            <p className="text-neutral-300 text-sm">Drop files here or click to choose</p>
            <p className="text-neutral-500 text-xs mt-1">No hard limits — only a soft warning if large</p>
          </div>

          {warn && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-amber-300/80 text-sm mb-4">{warn}</motion.p>
          )}

          <div className="space-y-3 mb-6">
            <input
              value={sharedNote}
              onChange={(e) => setSharedNote(e.target.value)}
              placeholder="Shared note (optional)"
              className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/25"
            />
            <div className="flex items-center gap-3">
              <label className="text-xs text-neutral-500">Accent</label>
              <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-8 rounded-lg bg-transparent border-0 cursor-pointer" />
              <span className="text-xs text-neutral-400">{accent}</span>
            </div>
          </div>

          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 bg-black/30 rounded-2xl p-3 mb-2 border border-white/5"
              >
                {item.preview ? (
                  <img src={item.preview} alt="" className="w-12 h-12 object-cover rounded-xl" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-white/5 grid place-items-center text-xs text-neutral-500">file</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{item.file.name}</p>
                  <p className="text-xs text-neutral-500">{(item.file.size / 1024 / 1024).toFixed(1)} MB</p>
                  {item.status === 'uploading' && (
                    <div className="mt-1 h-1 bg-white/10 rounded-full overflow-hidden">
                      <motion.div className="h-full rounded-full" style={{ background: accent, width: `${item.progress}%` }} />
                    </div>
                  )}
                  {item.status === 'done' && item.link && (
                    <a href={item.link} target="_blank" rel="noreferrer" className="text-xs text-[#0A84FF] hover:underline">open share</a>
                  )}
                  {item.error && <p className="text-xs text-red-400">{item.error}</p>}
                </div>
                <span className="text-xs text-neutral-400 capitalize">{item.status}</span>
              </motion.div>
            ))}
          </AnimatePresence>

          {items.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              disabled={busy}
              onClick={publish}
              className="mt-6 w-full py-3.5 rounded-full text-white text-sm font-medium transition disabled:opacity-50"
              style={{ background: accent }}
            >
              {busy ? 'sending…' : `share ${items.length} file${items.length > 1 ? 's' : ''}`}
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
