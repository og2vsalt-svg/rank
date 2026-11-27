import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

type Item = {
  id: string;
  file: File;
  note: string;
  thumb?: string;
  published?: string;
  warn?: string;
};

export default function LumenHorizonPage() {
  const { navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [items, setItems] = useState<Item[]>([]);
  const [publishing, setPublishing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFiles = useCallback((list: FileList | null) => {
    if (!list) return;
    const next: Item[] = [];
    for (const f of Array.from(list)) {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      let thumb: string | undefined;
      if (f.type.startsWith('image/')) thumb = URL.createObjectURL(f);
      next.push({ id, file: f, note: '', thumb });
    }
    setItems((prev) => [...prev, ...next]);
  }, []);

  const updateNote = (id: string, note: string) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, note } : it)));
  };

  const remove = (id: string) => {
    setItems((prev) => {
      const it = prev.find((x) => x.id === id);
      if (it?.thumb) URL.revokeObjectURL(it.thumb);
      return prev.filter((x) => x.id !== id);
    });
  };

  const publishAll = async () => {
    if (!items.length) return;
    setPublishing(true);
    const updated = [...items];
    for (let i = 0; i < updated.length; i++) {
      const it = updated[i];
      if (it.published) continue;
      try {
        const pub = await publishLocalFile(it.file, {
          caption: it.note.trim() || caption.trim() || 'a quiet horizon moment',
          cardTitle: title.trim() || it.file.name,
          color: accent,
          meta: { horizon: true, note: it.note, sequence: i },
        });
        if (pub.ok && pub.id) {
          const urls = shareUrls(pub.id);
          updated[i] = { ...it, published: urls.embed, warn: pub.warn || undefined };
        }
      } catch {
        // soft fail, continue
      }
    }
    setItems(updated);
    setPublishing(false);
  };

  const prettySize = (n: number) => {
    if (n < 1024) return n + ' B';
    if (n < 1048576) return Math.round(n / 1024) + ' KB';
    return (n / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7] font-sans antialiased">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="text-center mb-12"
        >
          <p className="text-[#0A84FF] text-sm tracking-wide mb-3">lumen horizon</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight mb-4 leading-[1.02]">a living horizon.<br />moments that settle.</h1>
          <p className="text-neutral-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Shape a shared title, caption, and accent. Drop local files. They settle into a quiet horizontal field with Apple-style springs. Publish each as its own permanent Discord-ready link. Soft size warnings only — no hard limits, no boosting. Prior desks remain untouched.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[320px_1fr] gap-8">
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 22, delay: 0.05 }}
            className="space-y-5"
          >
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="horizon title"
              className="w-full px-5 py-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-base outline-none focus:border-[#0A84FF]/50 transition"
            />
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="shared caption…"
              rows={4}
              className="w-full px-5 py-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-sm outline-none focus:border-[#0A84FF]/50 transition resize-none"
            />
            <div className="flex items-center gap-3">
              <label className="text-xs text-neutral-500">accent</label>
              <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full border border-white/10 cursor-pointer bg-transparent" />
              <span className="text-xs text-neutral-400">{accent}</span>
            </div>

            <div
              onClick={() => inputRef.current?.click()}
              className="border border-dashed border-white/10 rounded-2xl p-6 text-center cursor-pointer hover:border-white/20 transition bg-white/[0.015]"
            >
              <input
                ref={inputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(e) => onFiles(e.target.files)}
              />
              <p className="text-sm text-neutral-400">drop local files</p>
              <p className="text-xs text-neutral-500 mt-1">soft warnings only · no hard limits</p>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={publishAll}
              disabled={publishing || !items.length}
              className="w-full py-3.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium disabled:opacity-50"
            >
              {publishing ? 'publishing…' : 'publish horizon'}
            </motion.button>
          </motion.div>

          <div className="relative">
            <div className="overflow-x-auto pb-4 -mx-2 px-2">
              <div className="flex gap-4 min-w-max">
                <AnimatePresence>
                  {items.map((it, idx) => (
                    <motion.div
                      key={it.id}
                      initial={{ opacity: 0, y: 24, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.92 }}
                      transition={{ type: 'spring', stiffness: 140, damping: 20, delay: idx * 0.04 }}
                      className="w-64 glass rounded-3xl p-4 flex-shrink-0"
                      style={{ borderTop: `3px solid ${accent}` }}
                    >
                      {it.thumb && (
                        <img src={it.thumb} alt="" className="w-full h-36 object-cover rounded-2xl mb-3" />
                      )}
                      <p className="text-sm font-medium truncate mb-1">{it.file.name}</p>
                      <p className="text-xs text-neutral-500 mb-2">
                        {prettySize(it.file.size)}
                        {it.file.size > 40 * 1024 * 1024 ? ' · large — browser may feel slow' : ''}
                      </p>
                      <input
                        value={it.note}
                        onChange={(e) => updateNote(it.id, e.target.value)}
                        placeholder="quiet note…"
                        className="w-full px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs outline-none mb-3"
                      />
                      {it.published ? (
                        <button
                          onClick={() => navigator.clipboard.writeText(it.published!)}
                          className="w-full py-2 rounded-full bg-white text-black text-xs font-medium"
                        >
                          copy link
                        </button>
                      ) : (
                        <button
                          onClick={() => remove(it.id)}
                          className="w-full py-2 text-xs text-neutral-400 hover:text-white"
                        >
                          remove
                        </button>
                      )}
                      {it.warn && <p className="text-[10px] text-amber-400 mt-2">{it.warn}</p>}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {!items.length && (
                  <div className="w-64 h-48 glass rounded-3xl grid place-items-center text-sm text-neutral-500">
                    moments will settle here
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-neutral-500 mt-4 text-center">every link carries a polished Discord embed. prior features stay intact.</p>
          </div>
        </div>

        <button onClick={() => navigate('home')} className="block mx-auto mt-12 text-sm text-neutral-500 hover:text-white">
          ← back home
        </button>
      </div>
    </div>
  );
}
