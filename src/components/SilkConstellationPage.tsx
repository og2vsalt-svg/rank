import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function SilkConstellationPage() {
  const { navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<{ url: string; name: string; warn?: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onDrop = (list: FileList | null) => {
    if (!list) return;
    setFiles((f) => [...f, ...Array.from(list)]);
  };

  const publish = useCallback(async () => {
    if (files.length === 0) {
      setError('drop at least one local file');
      return;
    }
    setUploading(true);
    setError(null);
    setResults([]);

    const out: { url: string; name: string; warn?: string }[] = [];
    for (const file of files) {
      try {
        const pub = await publishLocalFile(file, {
          caption: caption || title || 'from silk constellation',
          cardTitle: title || file.name,
          color: accent,
        });
        if (pub.ok && pub.id) {
          const urls = shareUrls(pub.id);
          out.push({ url: urls.embed, name: file.name, warn: pub.warn || undefined });
        } else {
          out.push({ url: '', name: file.name, warn: pub.error || 'failed' });
        }
      } catch (e: any) {
        out.push({ url: '', name: file.name, warn: e?.message || 'error' });
      }
    }
    setResults(out);
    setUploading(false);
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
          <p className="text-[#0A84FF] text-sm tracking-wide mb-3">silk constellation</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight mb-4 leading-[1.02]">settle into orbit.</h1>
          <p className="text-neutral-400 text-lg leading-relaxed">Drop local files. They settle into a living constellation with staggered Apple-style springs. Each becomes its own permanent Discord-ready link under a shared title and accent. Soft size warnings only — no hard limits.</p>
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
            placeholder="shared constellation title"
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3.5 text-lg focus:outline-none focus:border-[#0A84FF]/50 transition"
          />
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="quiet caption for all"
            rows={3}
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3 text-base focus:outline-none focus:border-[#0A84FF]/50 transition resize-none"
          />

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <span className="text-sm text-neutral-400">accent</span>
              <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full border border-white/10 cursor-pointer bg-transparent" />
            </label>
            <button onClick={() => inputRef.current?.click()} className="text-sm text-neutral-400 hover:text-white transition">
              add files ({files.length})
            </button>
            <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => onDrop(e.target.files)} />
            {files.length > 0 && <button onClick={() => setFiles([])} className="text-xs text-neutral-500 hover:text-white">clear all</button>}
          </div>

          <div className="relative h-64 rounded-3xl bg-white/[0.02] border border-white/5 overflow-hidden">
            <AnimatePresence>
              {files.map((f, i) => {
                const angle = (i / Math.max(files.length, 1)) * Math.PI * 2;
                const r = 90 + (i % 3) * 20;
                const x = 50 + Math.cos(angle) * (r / 3);
                const y = 50 + Math.sin(angle) * (r / 3);
                return (
                  <motion.div
                    key={f.name + i}
                    initial={{ opacity: 0, scale: 0.4, x: '50%', y: '50%' }}
                    animate={{ opacity: 1, scale: 1, left: `${x}%`, top: `${y}%` }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ type: 'spring', stiffness: 80, damping: 16, delay: i * 0.05 }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full bg-white/10 text-xs backdrop-blur-md border border-white/10"
                  >
                    {f.name.slice(0, 16)}
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {files.length === 0 && <div className="absolute inset-0 grid place-items-center text-neutral-500 text-sm">drop files to see them settle</div>}
          </div>

          {files.some((f) => f.size > 40 * 1024 * 1024) && (
            <p className="text-xs text-amber-400">large drop(s). the browser may feel slow while it sends. nothing is blocked.</p>
          )}

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={publish}
            disabled={uploading || files.length === 0}
            className="w-full py-3.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#3A9DFF] transition disabled:opacity-50"
          >
            {uploading ? 'settling…' : 'publish constellation'}
          </motion.button>
        </motion.div>

        <AnimatePresence>
          {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-sm text-red-400 mt-6">{error}</motion.p>}
          {results.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-8 mt-8 space-y-4">
              <p className="text-sm text-neutral-400 text-center">discord-ready links</p>
              {results.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="truncate max-w-[60%]">{r.name}</span>
                  {r.url ? (
                    <button onClick={() => navigator.clipboard.writeText(r.url)} className="text-[#0A84FF] hover:underline">copy</button>
                  ) : (
                    <span className="text-amber-400 text-xs">{r.warn}</span>
                  )}
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
