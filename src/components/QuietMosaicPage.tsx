import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function QuietMosaicPage() {
  const { navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#30D158');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<{ url: string; name: string; warn?: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFiles = (list: FileList | null) => {
    if (!list) return;
    setFiles(Array.from(list));
  };

  const publish = useCallback(async () => {
    if (!files.length) {
      setError('drop a few images first');
      return;
    }
    setUploading(true);
    setError(null);
    setResults([]);
    const out: { url: string; name: string; warn?: string }[] = [];

    for (const file of files) {
      const pub = await publishLocalFile(file, {
        caption: caption || title || 'from a quiet mosaic',
        cardTitle: title || file.name,
        color: accent,
      });
      if (pub.ok && pub.id) {
        out.push({ url: shareUrls(pub.id).embed, name: file.name, warn: pub.warn || undefined });
      }
    }
    setResults(out);
    setUploading(false);
  }, [files, title, caption, accent]);

  return (
    <div className="min-h-screen bg-[#050506] text-[#f5f5f7] font-sans antialiased">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 90, damping: 18 }} className="text-center mb-12">
          <p className="text-[#30D158] text-sm tracking-wide mb-3">quiet mosaic</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight mb-4 leading-[1.02]">weave a quiet mosaic.</h1>
          <p className="text-neutral-400 text-lg leading-relaxed">Drop local images. Each settles into its own permanent Discord-ready share under a shared title and caption. Soft size warnings only. Apple-style springs on frosted glass.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06, type: 'spring', stiffness: 100, damping: 20 }} className="glass rounded-3xl p-8 space-y-6">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="mosaic title" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3.5 text-lg focus:outline-none focus:border-[#30D158]/50 transition" />
          <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="shared caption" rows={3} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-base leading-relaxed focus:outline-none focus:border-[#30D158]/50 transition resize-none" />

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <span className="text-sm text-neutral-400">accent</span>
              <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full border border-white/10 cursor-pointer bg-transparent" />
            </label>
            <button onClick={() => inputRef.current?.click()} className="text-sm text-neutral-400 hover:text-white transition">{files.length ? `${files.length} files` : 'drop images'}</button>
            <input ref={inputRef} type="file" multiple accept="image/*" className="hidden" onChange={(e) => onFiles(e.target.files)} />
            {files.length > 0 && <button onClick={() => setFiles([])} className="text-xs text-neutral-500 hover:text-white">clear</button>}
          </div>

          {files.some(f => f.size > 40 * 1024 * 1024) && (
            <p className="text-xs text-amber-400">one or more large drops. the browser may feel slow. nothing is blocked.</p>
          )}

          <motion.button whileTap={{ scale: 0.97 }} onClick={publish} disabled={uploading || !files.length} className="w-full py-3.5 rounded-full bg-[#30D158] text-black text-sm font-medium hover:bg-[#40E168] transition disabled:opacity-50">
            {uploading ? 'weaving…' : 'publish mosaic'}
          </motion.button>
        </motion.div>

        <AnimatePresence>
          {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-sm text-red-400 mt-6">{error}</motion.p>}
          {results.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-4">
              {results.map((r, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{r.name}</p>
                    {r.warn && <p className="text-xs text-amber-400">{r.warn}</p>}
                  </div>
                  <button onClick={() => navigator.clipboard.writeText(r.url)} className="px-4 py-2 rounded-full bg-white/10 text-xs hover:bg-white/15 transition">copy</button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <button onClick={() => navigate('home')} className="mt-12 text-sm text-neutral-500 hover:text-white transition block mx-auto">← back home</button>
      </div>
    </div>
  );
}
