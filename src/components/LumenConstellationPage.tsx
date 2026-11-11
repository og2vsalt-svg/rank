import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';

type Item = {
  file: File;
  id: string;
  preview?: string;
  status: 'idle' | 'uploading' | 'done' | 'error';
  embed?: string;
  warn?: string | null;
  error?: string;
};

export default function LumenConstellationPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#0A84FF');

  const onDrop = useCallback((list: FileList | File[]) => {
    const next: Item[] = Array.from(list).map((file) => {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      let preview: string | undefined;
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file);
      }
      return { file, id, preview, status: 'idle' as const };
    });
    setItems((prev) => [...prev, ...next]);
  }, []);

  const shareOne = async (item: Item) => {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: 'uploading' } : i)));
    try {
      const res = await publishLocalFile(item.file, {
        caption: caption || undefined,
        color,
        cardTitle: item.file.name,
        author: 'rankvault',
      });
      if (!res.ok || !res.id) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, status: 'error', error: res.error || 'upload failed' } : i,
          ),
        );
        return;
      }
      const urls = shareUrls(res.id);
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, status: 'done', embed: urls.embed, warn: res.warn || null }
            : i,
        ),
      );
    } catch (e: any) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, status: 'error', error: e?.message || 'error' } : i,
        ),
      );
    }
  };

  const shareAll = async () => {
    for (const item of items.filter((i) => i.status === 'idle' || i.status === 'error')) {
      await shareOne(item);
    }
  };

  const large = useMemo(() => items.some((i) => i.file.size > 40 * 1024 * 1024), [items]);

  return (
    <div className="min-h-screen bg-[#0b0b0d] text-white pt-24 px-5 pb-20">
      <div className="max-w-5xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-4xl sm:text-5xl font-semibold tracking-tight mb-2"
        >
          lumen constellation
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08 }}
          className="text-neutral-400 mb-8 max-w-2xl"
        >
          Drop any number of local files. They settle into a quiet grid. Share each one (or all) straight to the database and receive polished Discord embed links. Soft slow warnings only — never hard limits.
        </motion.p>

        <div
          className="glass rounded-3xl p-10 mb-8 text-center cursor-pointer border border-white/10 hover:border-white/25 transition-all"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files) onDrop(e.dataTransfer.files);
          }}
        >
          <input type="file" onChange={(e) => e.target.files && onDrop(e.target.files)} className="hidden" id="constellation" multiple />
          <label htmlFor="constellation" className="cursor-pointer block">
            <div className="text-neutral-500 text-sm mb-1">drag files here or click to choose</div>
            <div className="text-xs text-neutral-600">images, documents, anything — they become stars in the constellation</div>
          </label>
        </div>

        {large && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-amber-400 text-xs mb-6">
            large files detected. the browser may feel slow while encoding or uploading. no hard limit is enforced.
          </motion.div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="optional shared caption for Discord cards"
            className="flex-1 glass rounded-2xl px-4 py-3 text-sm outline-none"
          />
          <div className="flex items-center gap-3 glass rounded-2xl px-4 py-2">
            <span className="text-xs text-neutral-400">accent</span>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-9 h-9 rounded-full border-0 cursor-pointer" />
          </div>
          {items.length > 0 && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={shareAll}
              className="px-6 py-3 rounded-full bg-[#0A84FF] text-white text-sm font-medium"
            >
              share all
            </motion.button>
          )}
        </div>

        <AnimatePresence>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 120, damping: 18, delay: idx * 0.03 }}
                className="glass rounded-2xl p-4 flex flex-col"
              >
                {item.preview ? (
                  <img src={item.preview} alt="" className="w-full h-32 object-cover rounded-xl mb-3" />
                ) : (
                  <div className="w-full h-32 rounded-xl bg-white/5 grid place-items-center mb-3 text-neutral-500 text-xs">
                    {item.file.name.slice(0, 12)}
                  </div>
                )}
                <p className="text-xs font-medium truncate mb-1">{item.file.name}</p>
                <p className="text-[10px] text-neutral-500 mb-3">{(item.file.size / 1024 / 1024).toFixed(1)} mb</p>

                {item.status === 'idle' || item.status === 'error' ? (
                  <button
                    onClick={() => shareOne(item)}
                    className="mt-auto text-xs py-2 rounded-full bg-white/10 hover:bg-white/15"
                  >
                    {item.status === 'error' ? 'retry' : 'share'}
                  </button>
                ) : item.status === 'uploading' ? (
                  <p className="mt-auto text-xs text-neutral-400 text-center">uploading…</p>
                ) : (
                  <div className="mt-auto space-y-1">
                    <p className="text-[10px] text-emerald-400">shared</p>
                    {item.embed && (
                      <button
                        onClick={() => navigator.clipboard.writeText(item.embed!)}
                        className="text-[10px] text-[#0A84FF] truncate block w-full text-left"
                      >
                        copy embed link
                      </button>
                    )}
                    {item.warn && <p className="text-[10px] text-amber-400">{item.warn}</p>}
                  </div>
                )}
                {item.error && <p className="text-[10px] text-red-400 mt-1">{item.error}</p>}
              </motion.div>
            ))}
          </div>
        </AnimatePresence>

        {items.length === 0 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-neutral-600 text-sm mt-12">
            the constellation is empty. drop files to begin.
          </motion.p>
        )}
      </div>
    </div>
  );
}
