import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function LumenMoodboardPage() {
  const { navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [items, setItems] = useState<{ id: string; type: 'note' | 'file'; content: string; file?: File; name: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<{ url: string; name: string; warn?: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const addNote = () => {
    setItems((prev) => [...prev, { id: Date.now().toString(), type: 'note', content: '', name: 'note' }]);
  };

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const newItems = Array.from(files).map((f) => ({
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      type: 'file' as const,
      content: '',
      file: f,
      name: f.name,
    }));
    setItems((prev) => [...prev, ...newItems]);
  };

  const updateNote = (id: string, content: string) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, content } : it)));
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const publish = useCallback(async () => {
    if (items.length === 0 && !title.trim()) {
      setError('add a title or at least one piece');
      return;
    }
    setUploading(true);
    setError(null);
    setResults([]);

    try {
      const published: { url: string; name: string; warn?: string }[] = [];

      // Publish each item as its own share
      for (const item of items) {
        let targetFile: File;
        let cardTitle = title || item.name;
        let itemCaption = caption || item.content || 'from Lumen Moodboard';

        if (item.type === 'file' && item.file) {
          targetFile = item.file;
        } else {
          const text = `# ${cardTitle}\n\n${item.content || ''}`.trim();
          targetFile = new File([text], `${item.name.replace(/[^a-z0-9._-]+/gi, '_') || 'note'}.md`, { type: 'text/markdown' });
        }

        const pub = await publishLocalFile(targetFile, {
          caption: itemCaption,
          cardTitle,
          color: accent,
        });

        if (pub.ok && pub.id) {
          const urls = shareUrls(pub.id);
          published.push({ url: urls.embed, name: cardTitle, warn: pub.warn || undefined });
        }
      }

      // Also publish a master markdown board
      if (title.trim() || caption.trim()) {
        const boardText = `# ${title || 'Lumen Moodboard'}\n\n${caption || ''}\n\n---\n\n${items.map((it) => `- ${it.name}: ${it.type === 'note' ? it.content.slice(0, 80) : 'file'}`).join('\n')}`.trim();
        const boardFile = new File([boardText], `${(title || 'moodboard').replace(/[^a-z0-9._-]+/gi, '_') || 'board'}.md`, { type: 'text/markdown' });
        const boardPub = await publishLocalFile(boardFile, {
          caption: caption || 'moodboard overview',
          cardTitle: title || 'Lumen Moodboard',
          color: accent,
        });
        if (boardPub.ok && boardPub.id) {
          const urls = shareUrls(boardPub.id);
          published.unshift({ url: urls.embed, name: (title || 'board') + ' (overview)', warn: boardPub.warn || undefined });
        }
      }

      setResults(published);
    } catch (e: any) {
      setError(e?.message || 'something went quiet');
    }
    setUploading(false);
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
          <p className="text-[#0A84FF] text-sm tracking-wide mb-3">lumen moodboard</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight mb-4 leading-[1.02]">shape a quiet board.</h1>
          <p className="text-neutral-400 text-lg leading-relaxed">Gather notes and local files under one title, caption, and accent. They settle with staggered Apple-style springs. Each becomes its own permanent Discord-ready link, plus a clean overview. Soft size warnings only — no hard limits, no boosting.</p>
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
            placeholder="board title"
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3.5 text-lg focus:outline-none focus:border-[#0A84FF]/50 transition"
          />
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="a quiet caption for the whole board..."
            rows={3}
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-base leading-relaxed focus:outline-none focus:border-[#0A84FF]/50 transition resize-none"
          />

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <span className="text-sm text-neutral-400">accent</span>
              <input
                type="color"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className="w-10 h-10 rounded-full border border-white/10 cursor-pointer bg-transparent"
              />
            </label>
            <button onClick={addNote} className="text-sm text-neutral-400 hover:text-white transition">add note</button>
            <button onClick={() => fileRef.current?.click()} className="text-sm text-neutral-400 hover:text-white transition">drop files</button>
            <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {items.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 140, damping: 20, delay: i * 0.03 }}
                  className="glass rounded-2xl p-4 flex items-start gap-3"
                >
                  <div className="flex-1">
                    <p className="text-xs text-neutral-500 mb-1">{item.type === 'file' ? item.name : 'note'}</p>
                    {item.type === 'note' ? (
                      <textarea
                        value={item.content}
                        onChange={(e) => updateNote(item.id, e.target.value)}
                        placeholder="a quiet thought..."
                        rows={2}
                        className="w-full bg-transparent text-sm leading-relaxed focus:outline-none resize-none"
                      />
                    ) : (
                      <p className="text-sm text-neutral-300">{item.name} · {(item.file?.size || 0) > 40 * 1024 * 1024 ? 'large — may feel slow' : 'ready'}</p>
                    )}
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-xs text-neutral-500 hover:text-white">remove</button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={publish}
            disabled={uploading || items.length === 0}
            className="w-full py-3.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#3A9DFF] transition disabled:opacity-50"
          >
            {uploading ? 'publishing board…' : 'publish lumen moodboard'}
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
                <div key={i} className="flex items-center justify-between gap-4 py-2 border-b border-white/5 last:border-0">
                  <span className="text-sm truncate">{r.name}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(r.url)}
                    className="px-4 py-1.5 rounded-full bg-white/10 text-xs hover:bg-white/15 transition shrink-0"
                  >
                    copy
                  </button>
                </div>
              ))}
              {results.some((r) => r.warn) && <p className="text-xs text-amber-400 text-center mt-2">some drops are large. the browser may feel slow. nothing is blocked.</p>}
            </motion.div>
          )}
        </AnimatePresence>

        <button onClick={() => navigate('home')} className="mt-12 text-sm text-neutral-500 hover:text-white transition block mx-auto">← back home</button>
      </div>
    </div>
  );
}
