import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function VelvetHorizonPage() {
  const { navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#AF52DE');
  const [files, setFiles] = useState<File[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [results, setResults] = useState<Array<{ url: string; warn?: string; name: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((list: FileList | null) => {
    if (!list) return;
    setFiles(Array.from(list));
    setResults([]);
    setError(null);
  }, []);

  const publishAll = useCallback(async () => {
    if (files.length === 0 && !title.trim() && !caption.trim()) {
      setError('add a title or drop some files');
      return;
    }
    setPublishing(true);
    setError(null);
    const out: typeof results = [];

    try {
      const targets = files.length > 0 ? files : [new File([`# ${title || 'untitled'}\n\n${caption || ''}`], `${(title || 'note').replace(/[^a-z0-9._-]+/gi, '_') || 'note'}.md`, { type: 'text/markdown' })];

      for (const file of targets) {
        const pub = await publishLocalFile(file, {
          caption: caption || title || 'shared from Velvet Horizon',
          cardTitle: title || file.name,
          color: accent,
        });
        if (pub.ok && pub.id) {
          const urls = shareUrls(pub.id);
          out.push({ url: urls.embed, warn: pub.warn || undefined, name: title || file.name });
        } else {
          out.push({ url: '', name: file.name, warn: pub.error || 'failed' });
        }
      }
      setResults(out.filter(r => r.url));
      if (out.every(r => !r.url)) setError('nothing published');
    } catch (e: any) {
      setError(e?.message || 'something went quiet');
    }
    setPublishing(false);
  }, [files, title, caption, accent]);

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7] font-sans antialiased">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          className="text-center mb-12"
        >
          <p className="text-[#AF52DE] text-sm tracking-wide mb-3">velvet horizon</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight mb-4 leading-[1.02]">a living horizon.</h1>
          <p className="text-neutral-400 text-lg leading-relaxed">Shape a shared title, caption, and accent, then drop one or many local files. They settle with staggered Apple-style springs. Each becomes its own permanent Discord-ready link. Soft size warnings only — no hard limits.</p>
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
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3.5 text-lg focus:outline-none focus:border-[#AF52DE]/50 transition"
          />
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="a quiet caption for the embeds..."
            rows={3}
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-base leading-relaxed focus:outline-none focus:border-[#AF52DE]/50 transition resize-none"
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
              onClick={() => inputRef.current?.click()}
              className="text-sm text-neutral-400 hover:text-white transition px-4 py-2 rounded-full bg-white/5"
            >
              {files.length ? `${files.length} file${files.length > 1 ? 's' : ''}` : 'drop files'}
            </button>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => onDrop(e.target.files)}
            />
            {files.length > 0 && (
              <button onClick={() => setFiles([])} className="text-xs text-neutral-500 hover:text-white">clear</button>
            )}
          </div>

          {files.some(f => f.size > 40 * 1024 * 1024) && (
            <p className="text-xs text-amber-400">large drop. the browser may feel slow while it sends. nothing is blocked.</p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <AnimatePresence>
              {files.map((f, i) => (
                <motion.div
                  key={f.name + i}
                  initial={{ opacity: 0, scale: 0.95, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: i * 0.05, type: 'spring', stiffness: 120, damping: 16 }}
                  className="glass rounded-2xl p-4 text-xs truncate"
                >
                  {f.name}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={publishAll}
            disabled={publishing}
            className="w-full py-3.5 rounded-full bg-[#AF52DE] text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
          >
            {publishing ? 'publishing…' : 'publish velvet horizon'}
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
                  <span className="truncate text-sm">{r.name}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(r.url)}
                    className="text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 transition shrink-0"
                  >
                    copy
                  </button>
                </div>
              ))}
              {results.some(r => r.warn) && <p className="text-xs text-amber-400 text-center">{results.find(r => r.warn)?.warn}</p>}
            </motion.div>
          )}
        </AnimatePresence>

        <button onClick={() => navigate('home')} className="mt-12 text-sm text-neutral-500 hover:text-white transition block mx-auto">← back home</button>
      </div>
    </div>
  );
}
