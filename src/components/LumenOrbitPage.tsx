import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function LumenOrbitPage() {
  const { navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<{ url: string; name: string; warn?: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((list: FileList | null) => {
    if (!list) return;
    const next = Array.from(list);
    setFiles((prev) => [...prev, ...next].slice(0, 12));
  }, []);

  const publishAll = useCallback(async () => {
    if (files.length === 0) return;
    setUploading(true);
    const out: typeof results = [];
    for (const file of files) {
      const pub = await publishLocalFile(file, {
        caption: caption || title || 'orbiting share',
        cardTitle: title || file.name,
        color: accent,
      });
      if (pub.ok && pub.id) {
        const urls = shareUrls(pub.id);
        out.push({ url: urls.embed, name: file.name, warn: pub.warn || undefined });
      }
    }
    setResults(out);
    setUploading(false);
    setFiles([]);
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
          <p className="text-[#0A84FF] text-sm tracking-wide mb-3">lumen orbit</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight mb-4 leading-[1.02]">files that circle quietly.</h1>
          <p className="text-neutral-400 text-lg leading-relaxed">Drop local files. They settle into a living orbit with Apple-style springs. Each becomes its own permanent Discord-ready link under a shared title and accent. Soft size warnings only.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-8 space-y-6"
        >
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="shared title" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3.5 text-lg focus:outline-none focus:border-[#0A84FF]/50 transition" />
          <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="a quiet caption" rows={3} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-[#0A84FF]/50 transition resize-none" />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <span className="text-sm text-neutral-400">accent</span>
              <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full border border-white/10 cursor-pointer bg-transparent" />
            </label>
            <button onClick={() => inputRef.current?.click()} className="text-sm text-neutral-400 hover:text-white transition">add files</button>
            <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => onDrop(e.target.files)} />
          </div>

          <div className="relative h-64 flex items-center justify-center">
            <AnimatePresence>
              {files.map((f, i) => {
                const angle = (i / Math.max(files.length, 1)) * Math.PI * 2;
                const r = 90;
                return (
                  <motion.div
                    key={f.name + i}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1, x: Math.cos(angle) * r, y: Math.sin(angle) * r }}
                    exit={{ opacity: 0, scale: 0.4 }}
                    transition={{ type: 'spring', stiffness: 120, damping: 16, delay: i * 0.04 }}
                    className="absolute glass rounded-2xl px-4 py-3 text-xs max-w-[140px] truncate"
                  >
                    {f.name}
                    {f.size > 40 * 1024 * 1024 && <span className="block text-amber-400 text-[10px]">large</span>}
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {files.length === 0 && <p className="text-neutral-500 text-sm">drop or add files to see them orbit</p>}
          </div>

          <motion.button whileTap={{ scale: 0.97 }} onClick={publishAll} disabled={uploading || files.length === 0} className="w-full py-3.5 rounded-full bg-[#0A84FF] text-white text-sm font-medium hover:bg-[#3A9DFF] transition disabled:opacity-50">
            {uploading ? 'publishing orbit…' : 'publish all'}
          </motion.button>
        </motion.div>

        <AnimatePresence>
          {results.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 mt-8 space-y-3">
              {results.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="truncate max-w-[60%]">{r.name}</span>
                  <button onClick={() => navigator.clipboard.writeText(r.url)} className="text-[#0A84FF] hover:underline">copy link</button>
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
