import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function SilkStudioPage() {
  const { navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<{ url: string; warn?: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((list: FileList | null) => {
    if (!list) return;
    const next = Array.from(list);
    setFiles((prev) => [...prev, ...next]);
  }, []);

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const publish = useCallback(async () => {
    if (files.length === 0 && !title.trim() && !caption.trim()) {
      setError('add a title, caption, or drop files');
      return;
    }
    setUploading(true);
    setError(null);
    setResults([]);

    const published: { url: string; warn?: string; name: string }[] = [];

    try {
      const toShare = files.length > 0 ? files : [];
      if (toShare.length === 0 && (title.trim() || caption.trim())) {
        const text = `# ${title || 'untitled'}\n\n${caption || ''}`.trim();
        toShare.push(new File([text], `${(title || 'note').replace(/[^a-z0-9._-]+/gi, '_') || 'note'}.md`, { type: 'text/markdown' }));
      }

      for (const file of toShare) {
        const pub = await publishLocalFile(file, {
          caption: caption || title || 'shared from Silk Studio',
          cardTitle: title || file.name,
          color: accent,
        });
        if (pub.ok && pub.id) {
          const urls = shareUrls(pub.id);
          published.push({
            url: urls.embed,
            warn: pub.warn || undefined,
            name: title || file.name,
          });
        } else {
          setError(pub.error || 'could not publish one of the files');
          break;
        }
      }
      setResults(published);
    } catch (e: any) {
      setError(e?.message || 'something went quiet');
    }
    setUploading(false);
  }, [title, caption, accent, files]);

  const hasLarge = files.some((f) => f.size > 40 * 1024 * 1024);

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7] font-sans antialiased">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          className="text-center mb-12"
        >
          <p className="text-[#0A84FF] text-sm tracking-wide mb-3">silk studio</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight mb-4 leading-[1.02]">a quiet studio.</h1>
          <p className="text-neutral-400 text-lg leading-relaxed">Shape a shared title, caption, and accent, then drop local files. They settle with staggered Apple-style springs. Each becomes its own permanent Discord-ready link. Soft size warnings only — no hard limits, no boosting.</p>
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
            placeholder="a quiet caption for the embeds..."
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
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>

          {hasLarge && (
            <p className="text-xs text-amber-400">large drop. the browser may feel slow while it sends. nothing is blocked.</p>
          )}

          <AnimatePresence>
            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                {files.map((f, i) => (
                  <motion.div
                    key={f.name + i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, type: 'spring', stiffness: 120, damping: 16 }}
                    className="flex items-center justify-between bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm"
                  >
                    <span className="truncate">{f.name}</span>
                    <button onClick={() => removeFile(i)} className="text-xs text-neutral-500 hover:text-white ml-4">remove</button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={publish}
            disabled={uploading}
            className="w-full py-3.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#3A9DFF] transition disabled:opacity-50"
          >
            {uploading ? 'publishing…' : 'publish silk studio'}
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
                <div key={i} className="flex items-center justify-between bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3">
                  <span className="truncate text-sm">{r.name}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(r.url)}
                    className="text-xs px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 transition"
                  >
                    copy
                  </button>
                </div>
              ))}
              {results.some((r) => r.warn) && (
                <p className="text-xs text-amber-400 text-center">some files were large. the browser may have felt slow. nothing was blocked.</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <button onClick={() => navigate('home')} className="mt-12 text-sm text-neutral-500 hover:text-white transition block mx-auto">← back home</button>
      </div>
    </div>
  );
}
