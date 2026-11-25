import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

export default function SilkDeskPage() {
  const { navigate } = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#AF52DE');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<{ link: string; name: string }[]>([]);
  const [warn, setWarn] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    setFiles(prev => [...prev, ...arr]);
    const big = arr.some(f => f.size > 45_000_000);
    setWarn(big ? 'Large file(s) — may take a quiet moment. Soft warning only. Nothing is refused.' : null);
    arr.forEach(f => {
      if (f.type.startsWith('image/')) {
        setPreviews(p => ({ ...p, [f.name + f.size]: URL.createObjectURL(f) }));
      }
    });
    setResults([]);
  }, []);

  const publish = async () => {
    if (!files.length || busy) return;
    setBusy(true);
    setResults([]);
    const created: { link: string; name: string }[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: caption.trim() || undefined,
          color,
          cardTitle: title.trim() || file.name,
          meta: { desk: 'silk' },
        });
        if (res.ok && res.id) {
          created.push({ link: shareUrls(res.id).app, name: file.name });
        }
      }
      setResults(created);
      setFiles([]);
      setPreviews({});
    } catch (e: any) {
      // quiet fail into results if partial
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 85, damping: 20 }}
          className="glass rounded-[40px] p-8 md:p-12 border border-white/10 backdrop-blur-2xl bg-white/5"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#AF52DE] mb-2">Silk Desk</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">Soft silk.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Drop one or many local files into quiet silk. Share a title, caption, and accent. Each becomes a permanent Discord-ready link. Soft size warnings only.
          </p>

          <motion.div
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-[#AF52DE]/40'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-[#AF52DE]/40')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('ring-2', 'ring-[#AF52DE]/40');
              if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            whileHover={{ scale: 1.004 }}
            className="border-2 border-dashed border-white/15 rounded-3xl p-12 text-center mb-7 cursor-pointer hover:border-white/30 transition bg-black/20"
          >
            {files.length === 0 ? (
              <>
                <p className="text-neutral-300 text-[15px]">Drop files here</p>
                <p className="text-neutral-500 text-sm mt-1">or click to browse · multiple welcome</p>
              </>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {files.slice(0, 6).map((f, i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden bg-white/5 grid place-items-center text-[10px] text-neutral-400">
                    {previews[f.name + f.size] ? (
                      <img src={previews[f.name + f.size]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      f.name.slice(0, 8)
                    )}
                  </div>
                ))}
                {files.length > 6 && <div className="aspect-square rounded-xl bg-white/5 grid place-items-center text-xs text-neutral-500">+{files.length - 6}</div>}
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
          </motion.div>

          {files.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 mb-6">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Shared title"
                className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30 transition"
              />
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Quiet caption for the silk"
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
            </motion.div>
          )}

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !files.length}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl bg-[#AF52DE]"
          >
            {busy ? 'Settling silk…' : files.length ? `Settle ${files.length} silk share${files.length > 1 ? 's' : ''}` : 'Drop files first'}
          </motion.button>

          <AnimatePresence>
            {results.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 space-y-2">
                {results.map((r, i) => (
                  <div key={i} className="glass rounded-2xl p-4">
                    <p className="text-sm text-neutral-400 mb-1">{r.name}</p>
                    <button onClick={() => navigate('share', r.link.split('/').pop() || '')} className="text-[#AF52DE] text-sm break-all text-left">{r.link}</button>
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
