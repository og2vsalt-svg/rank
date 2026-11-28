import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function QuietStudioPage() {
  const { navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<{ url: string; warn?: string; name: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFiles = (list: FileList | null) => {
    if (!list) return;
    const next = Array.from(list);
    setFiles((prev) => [...prev, ...next]);
  };

  const publish = useCallback(async () => {
    if (!files.length && !title.trim() && !caption.trim()) {
      setError('add a title, caption, or drop files');
      return;
    }
    setUploading(true);
    setError(null);
    setResults([]);
    const out: { url: string; warn?: string; name: string }[] = [];

    try {
      const toShare = files.length ? files : [
        new File([`# ${title || 'untitled'}\n\n${caption || ''}`], `${(title || 'note').replace(/[^a-z0-9._-]+/gi, '_') || 'note'}.md`, { type: 'text/markdown' })
      ];

      for (const file of toShare) {
        const pub = await publishLocalFile(file, {
          caption: caption || title || 'shared from Quiet Studio',
          cardTitle: title || file.name,
          color: accent,
        });
        if (pub.ok && pub.id) {
          const urls = shareUrls(pub.id);
          out.push({
            url: urls.embed,
            warn: pub.warn || undefined,
            name: title || file.name,
          });
        } else {
          setError(pub.error || 'could not publish one of the files');
          break;
        }
      }
      setResults(out);
    } catch (e: any) {
      setError(e?.message || 'something went quiet');
    }
    setUploading(false);
  }, [title, caption, accent, files]);

  const large = files.some((f) => f.size > 40 * 1024 * 1024);

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7] font-sans antialiased">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          className="text-center mb-12"
        >
          <p className="text-[#0A84FF] text-sm tracking-wide mb-3">quiet studio</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight mb-4 leading-[1.02]">shape and share.</h1>
          <p className="text-neutral-400 text-lg leading-relaxed">Set a shared title, caption, and accent, then drop one or many local files. They settle with staggered Apple-style springs. Each becomes its own permanent Discord-ready link. Soft size warnings only — no hard limits, no boosting. Prior desks remain untouched.</p>
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
              onClick={() => inputRef.current?.click()}
              className="text-sm text-neutral-400 hover:text-white transition"
            >
              {files.length ? `${files.length} file${files.length > 1 ? 's' : ''}` : 'drop files'}
            </button>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => onFiles(e.target.files)}
            />
            {files.length > 0 && (
              <button onClick={() => setFiles([])} className="text-xs text-neutral-500 hover:text-white">clear</button>
            )}
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, type: 'spring', stiffness: 200, damping: 22 }}
                  className="text-sm text-neutral-300 flex justify-between"
                >
                  <span className="truncate">{f.name}</span>
                  <span className="text-xs text-neutral-500">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                </motion.div>
              ))}
            </div>
          )}

          {large && (
            <p className="text-xs text-amber-400">large drop. the browser may feel slow while it sends. nothing is blocked.</p>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={publish}
            disabled={uploading}
            className="w-full py-3.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#3A9DFF] transition disabled:opacity-50"
          >
            {uploading ? 'publishing…' : 'publish quiet studio'}
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
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, type: 'spring', stiffness: 180, damping: 20 }}
                  className="flex items-center justify-between gap-3 py-2 border-b border-white/5 last:border-0"
                >
                  <span className="text-sm truncate">{r.name}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(r.url)}
                    className="px-4 py-1.5 rounded-full bg-white/10 text-xs hover:bg-white/15 transition shrink-0"
                  >
                    copy
                  </button>
                </motion.div>
              ))}
              {results.some((r) => r.warn) && (
                <p className="text-xs text-amber-400 text-center">some files were large — browser may have felt slow. nothing was blocked.</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <button onClick={() => navigate('home')} className="mt-12 text-sm text-neutral-500 hover:text-white transition block mx-auto">← back home</button>
      </div>
    </div>
  );
}
