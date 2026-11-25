import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function AetherHaloPage() {
  const { navigate } = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<(string | null)[]>([]);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#BF5AF2');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<{ link?: string; error?: string; name: string }[]>([]);
  const [warn, setWarn] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((list: FileList | File[]) => {
    const next = Array.from(list);
    setFiles((prev) => [...prev, ...next]);
    const urls = next.map((f) => (f.type.startsWith('image/') ? URL.createObjectURL(f) : null));
    setPreviews((prev) => [...prev, ...urls]);
    if (next.some((f) => f.size > 40_000_000)) {
      setWarn('Large file(s) — may take a quiet moment. Soft warning only. No hard limits.');
    }
    if (!title && next[0]) setTitle(next[0].name.replace(/\.[^.]+$/, ''));
    setResults([]);
  }, [title]);

  const publishAll = async () => {
    if (!files.length || busy) return;
    setBusy(true);
    setResults([]);
    const out: typeof results = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const res = await publishLocalFile(file, {
          caption: caption.trim() || undefined,
          color,
          cardTitle: title.trim() || file.name,
          meta: { desk: 'aetherhalo', orbit: i },
        });
        if (res.ok && res.id) {
          out.push({ link: shareUrls(res.id).app, name: file.name });
        } else {
          out.push({ error: res.error || 'Could not settle.', name: file.name });
        }
      } catch (e: any) {
        out.push({ error: e.message, name: file.name });
      }
    }
    setResults(out);
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 85, damping: 20 }}
          className="glass rounded-[40px] p-8 md:p-12 border border-white/10 backdrop-blur-2xl bg-white/5"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#BF5AF2] mb-2">Aether Halo</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">Quiet orbit.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Drop several local files. They rise into a soft aether halo under one shared title, caption, and violet accent. Each becomes its own permanent Discord-ready link. Soft size warnings only. Prior desks remain untouched.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-[#BF5AF2]/40'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-[#BF5AF2]/40')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('ring-2', 'ring-[#BF5AF2]/40');
              if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-white/15 rounded-3xl p-12 text-center mb-7 cursor-pointer hover:border-white/30 transition bg-black/20"
          >
            <p className="text-neutral-300 text-[15px]">Drop files into the aether</p>
            <p className="text-neutral-500 text-sm mt-1">or click to browse · multiple welcome</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
          </div>

          {files.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
              <div className="flex flex-wrap gap-4 justify-center mb-6 relative">
                {files.map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0.6, opacity: 0, rotate: -20 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    transition={{ delay: i * 0.06, type: 'spring', stiffness: 180, damping: 18 }}
                    className="relative w-14 h-14 rounded-full overflow-hidden border border-white/15 bg-black/40 shadow-lg"
                    style={{ boxShadow: `0 0 20px ${color}33` }}
                  >
                    {previews[i] ? (
                      <img src={previews[i]!} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full grid place-items-center text-[9px] text-neutral-500 p-1 text-center leading-tight">{f.name.slice(0, 10)}</div>
                    )}
                  </motion.div>
                ))}
              </div>

              <div className="space-y-4">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Shared title"
                  className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30 transition"
                />
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Quiet caption for the orbit"
                  rows={2}
                  className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30 transition resize-none"
                />
                <div className="flex items-center gap-3">
                  <label className="text-sm text-neutral-400">Accent</label>
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-10 rounded-full border border-white/10 bg-transparent cursor-pointer"
                  />
                  <span className="text-xs text-neutral-500">{color}</span>
                </div>
                {warn && <p className="text-[13px] text-amber-300/80">{warn}</p>}
              </div>
            </motion.div>
          )}

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={publishAll}
            disabled={busy || !files.length}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ background: color }}
          >
            {busy ? 'Settling orbit…' : files.length ? `Settle ${files.length} share${files.length > 1 ? 's' : ''}` : 'Drop files first'}
          </motion.button>

          <AnimatePresence>
            {results.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-3">
                {results.map((r, i) => (
                  <div key={i} className="glass rounded-2xl p-4">
                    <p className="text-sm text-neutral-400 mb-1">{r.name}</p>
                    {r.link ? (
                      <button onClick={() => navigate('share', r.link!.split('/').pop() || '')} className="text-sm break-all text-left" style={{ color }}>{r.link}</button>
                    ) : (
                      <p className="text-sm text-red-400">{r.error}</p>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
