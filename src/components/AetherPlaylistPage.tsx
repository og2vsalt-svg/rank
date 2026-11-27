import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function AetherPlaylistPage() {
  const { navigate } = useRouter();
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#5E5CE6');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ name: string; id: string; warn?: string; url: string; type: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFiles = useCallback((list: FileList | File[]) => {
    const next = Array.from(list).filter(f => f.type.startsWith('audio/') || f.type.startsWith('video/') || f.type.startsWith('image/'));
    setFiles(prev => [...prev, ...next]);
  }, []);

  const publish = useCallback(async () => {
    if (!files.length) {
      setError('drop some media');
      return;
    }
    setUploading(true);
    setError(null);
    setResults([]);
    setProgress(0);

    const newResults: typeof results = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setProgress(Math.round(((i + 0.3) / files.length) * 100));
      try {
        const pub = await publishLocalFile(file, {
          caption: caption || title || 'from the aether playlist',
          cardTitle: title ? `${title} — ${file.name}` : file.name,
          color: accent,
          meta: { playlist: true, sequence: i },
        });
        if (pub.ok && pub.id) {
          newResults.push({
            name: file.name,
            id: pub.id,
            warn: pub.warn || undefined,
            url: shareUrls(pub.id).embed,
            type: file.type,
          });
        }
      } catch (e: any) {
        setError(e?.message || 'one track stayed quiet');
      }
      setProgress(Math.round(((i + 1) / files.length) * 100));
    }
    setResults(newResults);
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
          <p className="text-[#5E5CE6] text-sm tracking-wide mb-3">aether playlist</p>
          <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight mb-4 leading-[1.02]">a living sequence.</h1>
          <p className="text-neutral-400 text-lg leading-relaxed">Drop audio, video, or images. They settle into a quiet playlist under a shared title and accent. Each becomes its own permanent Discord-ready link. Soft size warnings only — no hard limits, no boosting. Apple-style springs on frosted glass.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-8 space-y-6 mb-8"
        >
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="playlist title" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3.5 text-lg focus:outline-none focus:border-[#5E5CE6]/50 transition" />
          <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="shared caption" className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:border-[#5E5CE6]/50 transition" />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <span className="text-sm text-neutral-400">accent</span>
              <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full border border-white/10 cursor-pointer bg-transparent" />
            </label>
            <button onClick={() => inputRef.current?.click()} className="text-sm text-neutral-400 hover:text-white transition">add media</button>
            <input ref={inputRef} type="file" multiple accept="audio/*,video/*,image/*" className="hidden" onChange={(e) => e.target.files && onFiles(e.target.files)} />
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-sm text-neutral-300 bg-white/[0.02] rounded-xl px-4 py-2">
                  <span className="truncate">{f.name}</span>
                  <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} className="text-xs text-neutral-500 hover:text-white ml-4">remove</button>
                </div>
              ))}
            </div>
          )}

          <motion.button whileTap={{ scale: 0.97 }} onClick={publish} disabled={uploading || !files.length} className="w-full py-3.5 rounded-full bg-[#5E5CE6] text-white text-sm font-medium hover:bg-[#7A78FF] transition disabled:opacity-50">
            {uploading ? `publishing… ${progress}%` : 'publish playlist'}
          </motion.button>
        </motion.div>

        <AnimatePresence>
          {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-sm text-red-400 mb-6">{error}</motion.p>}
          {results.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <p className="text-sm text-neutral-400 text-center">each link ships with a polished Discord embed</p>
              {results.map((r, i) => (
                <motion.div key={r.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="glass rounded-2xl p-5 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.name}</p>
                    {r.warn && <p className="text-xs text-amber-400 mt-1">{r.warn}</p>}
                  </div>
                  <button onClick={() => navigator.clipboard.writeText(r.url)} className="px-4 py-2 rounded-full bg-white/10 text-xs hover:bg-white/15 transition shrink-0">copy</button>
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
