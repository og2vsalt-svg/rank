import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useVault } from './VaultContext';

type Item = {
  file: File;
  note: string;
  preview?: string;
  id: string;
};

export default function QuietLumenDeskPage() {
  const { addFiles } = useVault();
  const [items, setItems] = useState<Item[]>([]);
  const [sharedCaption, setSharedCaption] = useState('');
  const [accent, setAccent] = useState('#5AC8FA');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<{ name: string; embed: string; warn?: string | null }[]>([]);
  const [err, setErr] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const add = useCallback((list: FileList | File[]) => {
    const next: Item[] = Array.from(list).map((file) => {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      let preview: string | undefined;
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file);
      }
      return { file, note: '', preview, id };
    });
    setItems((prev) => [...prev, ...next]);
    setResults([]);
    setErr('');
  }, []);

  const remove = (id: string) => {
    setItems((prev) => {
      const found = prev.find((i) => i.id === id);
      if (found?.preview) URL.revokeObjectURL(found.preview);
      return prev.filter((i) => i.id !== id);
    });
  };

  const updateNote = (id: string, note: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, note } : i)));
  };

  const publish = async () => {
    if (!items.length) return;
    setBusy(true);
    setErr('');
    setResults([]);
    try {
      await addFiles(items.map((i) => i.file), 'lumen');
      const out: typeof results = [];
      for (const item of items) {
        const caption = item.note.trim() || sharedCaption.trim() || undefined;
        const res = await publishLocalFile(item.file, {
          caption,
          color: accent,
          cardTitle: item.file.name,
          author: 'rankvault',
          meta: { desk: 'quietlumendesk' },
        });
        if (res.ok && res.id) {
          const urls = shareUrls(res.id);
          out.push({ name: item.file.name, embed: urls.embed, warn: res.warn || null });
        } else {
          out.push({ name: item.file.name, embed: '', warn: res.error || 'failed' });
        }
      }
      setResults(out);
    } catch (e: any) {
      setErr(e?.message || 'something slowed');
    }
    setBusy(false);
  };

  const large = items.some((i) => i.file.size > 40 * 1024 * 1024);

  return (
    <div className="mesh min-h-screen bg-[#0b0b0d] text-white">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 22 }}
          className="text-center mb-10"
        >
          <p className="text-[#5AC8FA] text-sm font-medium tracking-wide mb-3">quiet lumen desk</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-tight mb-4">
            Light that settles.<br />Files that share.
          </h1>
          <p className="text-neutral-400 text-base leading-relaxed max-w-lg mx-auto">
            A refined lumen for local files. They float as soft glowing orbs of frosted glass with gentle upward spring motion. Live previews, per-file notes or one shared caption, then batch-publish straight to the database. Every link unfurls a polished Discord embed. Large files are only warned. All earlier desks stay exactly as they were.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08, type: 'spring', stiffness: 110, damping: 20 }}
          className="glass rounded-[28px] p-6 sm:p-8 mb-6 cursor-pointer border border-white/10 hover:border-white/20 transition"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files?.length) add(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && add(e.target.files)}
          />
          <div className="text-center text-neutral-500 text-sm">
            {items.length ? `${items.length} file${items.length > 1 ? 's' : ''} settling` : 'drag files here or click to choose'}
          </div>
        </motion.div>

        {large && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-amber-300/90 text-xs mb-4 text-center">
            large drop detected. the browser may feel slow while it encodes or uploads. no hard limit.
          </motion.p>
        )}

        <div className="relative min-h-[120px]">
          <AnimatePresence>
            {items.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 40, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 120, damping: 18 }}
                className="glass rounded-2xl p-4 mb-3 flex gap-4 items-start relative overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{ background: `radial-gradient(circle at 20% 30%, ${accent}33, transparent 60%)` }}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />
                {item.preview ? (
                  <img src={item.preview} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0 relative z-10" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-white/5 grid place-items-center text-xs text-neutral-500 flex-shrink-0 relative z-10">
                    {item.file.name.split('.').pop()?.slice(0, 4) || 'file'}
                  </div>
                )}
                <div className="flex-1 min-w-0 relative z-10">
                  <p className="text-sm font-medium truncate">{item.file.name}</p>
                  <p className="text-[11px] text-neutral-500 mb-2">
                    {(item.file.size / 1024 / 1024).toFixed(2)} MB · {item.file.type || 'unknown'}
                  </p>
                  <input
                    value={item.note}
                    onChange={(e) => updateNote(item.id, e.target.value)}
                    placeholder="optional note for this file"
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-white/20"
                  />
                </div>
                <button onClick={() => remove(item.id)} className="text-neutral-500 hover:text-white text-xs mt-1 relative z-10">
                  remove
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <input
          value={sharedCaption}
          onChange={(e) => setSharedCaption(e.target.value)}
          placeholder="shared caption (used when a file has no own note)"
          className="w-full glass rounded-2xl px-4 py-3 text-sm mb-4 outline-none"
        />

        <div className="flex items-center gap-3 mb-6">
          <label className="text-xs text-neutral-400">accent</label>
          <input
            type="color"
            value={accent}
            onChange={(e) => setAccent(e.target.value)}
            className="w-9 h-9 rounded-full border-0 cursor-pointer"
          />
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.02 }}
          onClick={publish}
          disabled={!items.length || busy}
          className="w-full py-3.5 rounded-full text-black font-medium disabled:opacity-40 transition shadow-lg"
          style={{ background: accent }}
        >
          {busy ? 'settling into the database…' : items.length ? `publish ${items.length} file${items.length > 1 ? 's' : ''}` : 'add files first'}
        </motion.button>

        <AnimatePresence>
          {results.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-3">
              <p className="text-sm font-medium">shared</p>
              {results.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass rounded-2xl p-4"
                >
                  <p className="text-sm font-medium mb-1 truncate">{r.name}</p>
                  {r.embed ? (
                    <>
                      <p className="text-xs text-neutral-400 break-all mb-2">{r.embed}</p>
                      <button
                        onClick={() => navigator.clipboard.writeText(r.embed)}
                        className="text-xs"
                        style={{ color: accent }}
                      >
                        copy discord link
                      </button>
                    </>
                  ) : (
                    <p className="text-xs text-red-400">{r.warn}</p>
                  )}
                  {r.warn && r.embed && <p className="text-amber-300/80 text-xs mt-1">{r.warn}</p>}
                </motion.div>
              ))}
            </motion.div>
          )}
          {err && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-sm text-red-400">
              {err}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
