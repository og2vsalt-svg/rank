import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function HorizonAtelierPage() {
  const { navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<{ url: string; name: string; warn?: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((list: FileList | null) => {
    if (!list) return;
    const next = Array.from(list);
    setFiles((prev) => [...prev, ...next]);
  }, []);

  const publish = useCallback(async () => {
    if (files.length === 0 && !title.trim()) {
      setError('add a title or drop some files');
      return;
    }
    setUploading(true);
    setError(null);
    setResults([]);
    const made: typeof results = [];

    try {
      if (files.length === 0 && title.trim()) {
        const text = `# ${title}\n\n${caption || ''}`.trim();
        const noteFile = new File([text], `${title.replace(/[^a-z0-9._-]+/gi, '_') || 'atelier'}.md`, { type: 'text/markdown' });
        const pub = await publishLocalFile(noteFile, {
          caption: caption || title,
          cardTitle: title,
          color: accent,
        });
        if (pub.ok && pub.id) {
          made.push({ url: shareUrls(pub.id).embed, name: title, warn: pub.warn || undefined });
        }
      }

      for (const file of files) {
        const pub = await publishLocalFile(file, {
          caption: caption || title || 'from Horizon Atelier',
          cardTitle: title || file.name,
          color: accent,
        });
        if (pub.ok && pub.id) {
          made.push({
            url: shareUrls(pub.id).embed,
            name: file.name,
            warn: pub.warn || undefined,
          });
        }
      }
      setResults(made);
      if (made.length === 0) setError('nothing published');
    } catch (e: any) {
      setError(e?.message || 'something quieted');
    }
    setUploading(false);
  }, [files, title, caption, accent]);

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7] font-sans antialiased">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 16 }}
          className="text-center mb-14"
        >
          <p className="text-[#0A84FF] text-sm tracking-wide mb-3">horizon atelier</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight mb-4 leading-[1.02]">shape a quiet horizon.</h1>
          <p className="text-neutral-400 text-lg leading-relaxed">Gather a shared title and caption, then drop local files. They settle with staggered Apple-style springs. Each becomes its own permanent Discord-ready link. Soft size warnings only — no hard limits.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, type: 'spring', stiffness: 100, damping: 20 }}
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
            placeholder="quiet caption that travels with every link..."
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
              onChange={(e) => onDrop(e.target.files)}
            />
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, type: 'spring', stiffness: 120, damping: 18 }}
                  className="flex items-center justify-between text-sm bg-white/[0.03] rounded-2xl px-4 py-3"
                >
                  <span className="truncate">{f.name}</span>
                  <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-xs text-neutral-500 hover:text-white">remove</button>
                </motion.div>
              ))}
              {files.some((f) => f.size > 40 * 1024 * 1024) && (
                <p className="text-xs text-amber-400">large drop among them. the browser may feel slow while it sends. nothing is blocked.</p>
              )}
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={publish}
            disabled={uploading}
            className="w-full py-3.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#3A9DFF] transition disabled:opacity-50"
          >
            {uploading ? 'settling…' : 'publish horizon'}
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
                <div key={i} className="flex items-center justify-between bg-white/[0.03] rounded-2xl px-4 py-3">
                  <div>
                    <p className="text-sm">{r.name}</p>
                    {r.warn && <p className="text-xs text-amber-400">{r.warn}</p>}
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(r.url)}
                    className="px-4 py-1.5 rounded-full bg-white/10 text-xs hover:bg-white/15 transition"
                  >
                    copy
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <button onClick={() => navigate('home')} className="mt-12 text-sm text-neutral-500 hover:text-white transition block mx-auto">← back home</button>
      </div>
    </div>
  );
}
