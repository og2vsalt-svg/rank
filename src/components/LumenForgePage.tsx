import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function LumenForgePage() {
  const { navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [items, setItems] = useState<{ id: string; file?: File; note: string; name: string }[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [results, setResults] = useState<{ url: string; warn?: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addNote = () => {
    setItems((prev) => [...prev, { id: Date.now().toString(36), note: '', name: 'note' }]);
  };

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const next = Array.from(files).map((file) => ({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      file,
      note: '',
      name: file.name,
    }));
    setItems((prev) => [...prev, ...next]);
  };

  const updateItem = (id: string, note: string) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, note } : it)));
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const publish = useCallback(async () => {
    if (!items.length && !title.trim() && !caption.trim()) {
      setError('add a note, a file, or a title');
      return;
    }
    setPublishing(true);
    setError(null);
    setResults([]);

    const out: { url: string; warn?: string; name: string }[] = [];

    for (const item of items.length ? items : [{ id: 'solo', note: caption || title, name: title || 'note' }]) {
      try {
        let target: File | undefined = item.file;
        if (!target && (item.note.trim() || title.trim() || caption.trim())) {
          const text = `# ${title || item.name}\n\n${item.note || caption || ''}`.trim();
          target = new File([text], `${(title || item.name || 'note').replace(/[^a-z0-9._-]+/gi, '_') || 'note'}.md`, {
            type: 'text/markdown',
          });
        }
        if (!target) continue;

        const pub = await publishLocalFile(target, {
          caption: item.note || caption || title || 'shared from Lumen Forge',
          cardTitle: title || item.name,
          color: accent,
        });

        if (pub.ok && pub.id) {
          const urls = shareUrls(pub.id);
          out.push({
            url: urls.embed,
            warn: pub.warn || undefined,
            name: title || item.name,
          });
        }
      } catch {
        // continue the forge
      }
    }

    if (out.length) setResults(out);
    else setError('nothing settled');
    setPublishing(false);
  }, [items, title, caption, accent]);

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7] font-sans antialiased">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          className="text-center mb-12"
        >
          <p className="text-[#0A84FF] text-sm tracking-wide mb-3">lumen forge</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight mb-4 leading-[1.02]">shape a quiet forge.</h1>
          <p className="text-neutral-400 text-lg leading-relaxed">
            Gather notes and local files under one title, caption, and accent. Each settles with Apple-style springs and becomes its own permanent Discord-ready link. Soft size warnings only — no hard limits, no boosting. Prior desks remain untouched.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06, type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-3xl p-8 space-y-6"
        >
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="shared title"
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3.5 text-lg focus:outline-none focus:border-[#0A84FF]/50 transition"
          />
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="shared caption…"
            rows={3}
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-base leading-relaxed focus:outline-none focus:border-[#0A84FF]/50 transition resize-none"
          />

          <div className="flex items-center gap-4 flex-wrap">
            <label className="flex items-center gap-3 cursor-pointer">
              <span className="text-sm text-neutral-400">accent</span>
              <input
                type="color"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className="w-10 h-10 rounded-full border border-white/10 cursor-pointer bg-transparent"
              />
            </label>
            <button
              onClick={addNote}
              className="text-sm text-neutral-400 hover:text-white transition"
            >
              add a note
            </button>
            <button
              onClick={() => inputRef.current?.click()}
              className="text-sm text-neutral-400 hover:text-white transition"
            >
              drop files
            </button>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {items.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 120, damping: 18, delay: i * 0.03 }}
                  className="glass rounded-2xl p-4 space-y-2"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-300 truncate">{item.file ? item.file.name : 'note'}</span>
                    <button onClick={() => removeItem(item.id)} className="text-xs text-neutral-500 hover:text-white">remove</button>
                  </div>
                  <textarea
                    value={item.note}
                    onChange={(e) => updateItem(item.id, e.target.value)}
                    placeholder="optional note for this piece…"
                    rows={2}
                    className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#0A84FF]/40 resize-none"
                  />
                  {item.file && item.file.size > 40 * 1024 * 1024 && (
                    <p className="text-xs text-amber-400">large drop. the browser may feel slow while it sends. nothing is blocked.</p>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={publish}
            disabled={publishing}
            className="w-full py-3.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#3A9DFF] transition disabled:opacity-50"
          >
            {publishing ? 'forging…' : 'publish lumen forge'}
          </motion.button>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center text-sm text-red-400 mt-6">{error}</motion.p>
          )}
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-3xl p-8 mt-8 space-y-4"
            >
              <p className="text-sm text-neutral-400 text-center">discord-ready links</p>
              {results.map((r, i) => (
                <div key={i} className="flex items-center justify-between gap-4 text-sm">
                  <span className="truncate">{r.name}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(r.url)}
                    className="px-4 py-1.5 rounded-full bg-white/10 text-xs hover:bg-white/15 transition shrink-0"
                  >
                    copy
                  </button>
                </div>
              ))}
              {results.some((r) => r.warn) && (
                <p className="text-xs text-amber-400 text-center">some large drops may feel slow in the browser. nothing was blocked.</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <button onClick={() => navigate('home')} className="mt-12 text-sm text-neutral-500 hover:text-white transition block mx-auto">← back home</button>
      </div>
    </div>
  );
}
