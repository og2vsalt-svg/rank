import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import { useRouter } from './Router';

const PRISM = ['#0A84FF', '#64D2FF', '#AF52DE', '#FF9F0A', '#30D158', '#FF375F'];

export default function PrismLumenPage() {
  const { navigate } = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<{ name: string; link?: string; error?: string }[]>([]);
  const [warn, setWarn] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((list: FileList | File[]) => {
    const arr = Array.from(list);
    if (!arr.length) return;
    setFiles((prev) => [...prev, ...arr]);
    const big = arr.some((f) => f.size > 40_000_000);
    setWarn(big ? 'Large files — the browser may feel slow while sending. Nothing is blocked.' : null);
    if (!title) setTitle(arr[0].name.replace(/\.[^.]+$/, ''));
  }, [title]);

  const publish = async () => {
    if (!files.length || busy) return;
    setBusy(true);
    setResults([]);
    const out: { name: string; link?: string; error?: string }[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const color = PRISM[i % PRISM.length];
      try {
        const res = await publishLocalFile(file, {
          caption: caption.trim() || undefined,
          color,
          cardTitle: title.trim() || file.name,
          meta: { desk: 'prismlumen', index: i },
        });
        if (res.ok && res.id) {
          out.push({ name: file.name, link: shareUrls(res.id).app });
        } else {
          out.push({ name: file.name, error: res.error || 'settled with an issue' });
        }
      } catch (e: any) {
        out.push({ name: file.name, error: e.message });
      }
    }
    setResults(out);
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-28 pb-24 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 24 }}
          className="glass rounded-[40px] p-8 md:p-12 border border-white/10 backdrop-blur-2xl bg-white/5"
        >
          <p className="text-[13px] font-medium tracking-wide text-[#AF52DE] mb-2">Prism Lumen</p>
          <h1 className="text-4xl font-semibold tracking-tight mb-3 text-white">Sequential light.</h1>
          <p className="text-neutral-400 text-[15.5px] leading-relaxed mb-8">
            Drop several local files. Each settles under a shared title and caption with its own prism accent. Permanent Discord-ready links. Soft size warnings only.
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-[#AF52DE]/40'); }}
            onDragLeave={(e) => e.currentTarget.classList.remove('ring-2', 'ring-[#AF52DE]/40')}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove('ring-2', 'ring-[#AF52DE]/40');
              if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className="border-2 border-dashed border-white/15 rounded-3xl p-12 text-center mb-7 cursor-pointer hover:border-white/30 transition bg-black/20"
          >
            <p className="text-neutral-300 text-[15px]">Drop files here</p>
            <p className="text-neutral-500 text-sm mt-1">or click to browse — multiple welcome</p>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
            />
          </div>

          {files.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 space-y-3">
              <AnimatePresence>
                {files.map((f, i) => (
                  <motion.div
                    key={f.name + i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 text-sm text-neutral-300 bg-black/20 rounded-2xl px-4 py-3"
                  >
                    <span className="w-2 h-2 rounded-full" style={{ background: PRISM[i % PRISM.length] }} />
                    <span className="truncate flex-1">{f.name}</span>
                    <span className="text-xs text-neutral-500">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                    <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-neutral-500 hover:text-white text-xs">remove</button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {warn && <p className="text-[13px] text-amber-300/80">{warn}</p>}
            </motion.div>
          )}

          <div className="space-y-4 mb-6">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Shared title"
              className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30 transition"
            />
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Quiet shared caption"
              rows={2}
              className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3.5 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/30 transition resize-none"
            />
          </div>

          <motion.button
            whileTap={{ scale: 0.985 }}
            whileHover={{ scale: 1.005 }}
            onClick={publish}
            disabled={busy || !files.length}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl bg-gradient-to-r from-[#0A84FF] to-[#AF52DE]"
          >
            {busy ? 'Settling prism…' : files.length ? `Settle ${files.length} share${files.length === 1 ? '' : 's'}` : 'Drop files first'}
          </motion.button>

          {results.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-8 space-y-3">
              <p className="text-sm text-neutral-400">Ready</p>
              {results.map((r, i) => (
                <div key={i} className="glass rounded-2xl p-4">
                  <p className="text-sm text-white mb-1">{r.name}</p>
                  {r.link && (
                    <button onClick={() => navigate('share', r.link!.split('/').pop() || '')} className="text-[#64D2FF] text-sm break-all text-left">{r.link}</button>
                  )}
                  {r.error && <p className="text-sm text-red-400">{r.error}</p>}
                </div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
