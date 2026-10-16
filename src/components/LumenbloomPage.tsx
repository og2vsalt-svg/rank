import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import Navbar from './Navbar';
import { useRouter } from './Router';

const COLORS = ['#0A84FF', '#30D158', '#FF9F0A', '#FF453A', '#BF5AF2', '#64D2FF', '#FF6B9D', '#1D1D1F'];

export default function LumenbloomPage() {
  const { navigate } = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [color, setColor] = useState('#0A84FF');
  const [uploading, setUploading] = useState(false);
  const [warn, setWarn] = useState('');
  const [results, setResults] = useState<{ id: string; name: string; embed: string }[]>([]);
  const [blooms, setBlooms] = useState<{ id: number; x: number; y: number; size: number; delay: number }[]>([]);

  const totalSize = files.reduce((n, f) => n + f.size, 0);

  const onSelect = (list: FileList | null) => {
    const arr = Array.from(list || []);
    if (!arr.length) return;
    setFiles((prev) => [...prev, ...arr].slice(0, 12));
    const newTotal = totalSize + arr.reduce((n, f) => n + f.size, 0);
    setWarn(newTotal > 50 * 1024 * 1024 ? 'Large drop. May feel slow while sending — no hard limit, just a gentle note.' : '');
    setResults([]);
  };

  const remove = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const shareAll = async () => {
    if (!files.length) return;
    setUploading(true);
    const out: { id: string; name: string; embed: string }[] = [];
    for (const file of files) {
      const res = await publishLocalFile(file, {
        caption: caption || title,
        cardTitle: title || file.name,
        color,
      });
      if (res.ok && res.id) {
        out.push({ id: res.id, name: file.name, embed: shareUrls(res.id).embed });
      }
    }
    setResults(out);
    setUploading(false);
  };

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch {}
  };

  const spawnBloom = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now() + Math.random();
    const size = 30 + Math.random() * 80;
    const delay = Math.random() * 0.2;
    setBlooms((prev) => [...prev.slice(-8), { id, x, y, size, delay }]);
    setTimeout(() => setBlooms((prev) => prev.filter((b) => b.id !== id)), 2800);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setBlooms((prev) => prev.filter((b) => Date.now() - b.id < 2500));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mesh min-h-screen text-white">
      <Navbar />
      <div className="pt-28 pb-20 px-5 sm:px-8 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
        >
          <p className="text-[#0A84FF] text-sm font-medium tracking-wide mb-3">lumenbloom</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05] mb-4">
            soft blooming light for what you carry.
          </h1>
          <p className="text-neutral-400 text-lg max-w-2xl mb-10 leading-relaxed">
            Drop files. A shared note travels with them. Gentle expanding blooms of light open and fade with your accent color. Spring motion, glass surfaces. Each file lands in storage and the public_shares table. Large files get a soft warning, never a refusal. All earlier desks stay intact. Professional Discord embeds on every link.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); onSelect(e.dataTransfer.files); }}
              onMouseMove={spawnBloom}
              className="relative rounded-3xl border border-dashed border-white/15 bg-white/[0.03] backdrop-blur-xl p-10 text-center cursor-pointer hover:border-white/25 transition-all active:scale-[0.995] overflow-hidden min-h-[240px]"
            >
              {blooms.map((b) => (
                <motion.span
                  key={b.id}
                  className="absolute pointer-events-none rounded-full"
                  style={{
                    left: b.x - b.size / 2,
                    top: b.y - b.size / 2,
                    width: b.size,
                    height: b.size,
                    background: `radial-gradient(circle, ${color}66 0%, ${color}22 40%, transparent 70%)`,
                    boxShadow: `0 0 30px ${color}33`,
                  }}
                  initial={{ scale: 0.2, opacity: 0.85 }}
                  animate={{ scale: 2.2, opacity: 0 }}
                  transition={{ duration: 2.2, delay: b.delay, ease: [0.22, 1, 0.36, 1] }}
                />
              ))}
              <div className="text-5xl mb-4 opacity-70 relative z-10">✿</div>
              <p className="font-medium mb-1 relative z-10">drop files or click to browse</p>
              <p className="text-sm text-neutral-500 relative z-10">up to 12 · any type · any size</p>
              <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => onSelect(e.target.files)} />
            </div>

            {warn && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-amber-300 text-sm text-center">
                {warn}
              </motion.p>
            )}

            {files.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <AnimatePresence>
                  {files.map((f, i) => (
                    <motion.div
                      key={f.name + i}
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ type: 'spring', stiffness: 140, damping: 16 }}
                      className="rounded-2xl bg-white/[0.04] border border-white/10 p-3 relative group"
                    >
                      <p className="text-xs font-medium truncate pr-6">{f.name}</p>
                      <p className="text-[10px] text-neutral-500 mt-1">{(f.size / 1024 / 1024).toFixed(1)} MB</p>
                      <button onClick={() => remove(i)} className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/10 text-xs opacity-0 group-hover:opacity-100 transition">×</button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}

            <div className="space-y-4">
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-neutral-500 mb-1.5 block">title</span>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="what travels with the files" className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#0A84FF]/50 transition" />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-neutral-500 mb-1.5 block">shared note</span>
                <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="a quiet line that follows every share" rows={2} className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#0A84FF]/50 transition resize-none" />
              </label>
              <div>
                <span className="text-xs uppercase tracking-wider text-neutral-500 mb-2 block">accent</span>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((c) => (
                    <button key={c} onClick={() => setColor(c)} className={`w-8 h-8 rounded-full transition-all ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110' : 'hover:scale-105'}`} style={{ background: c }} />
                  ))}
                </div>
              </div>
            </div>

            <button onClick={shareAll} disabled={!files.length || uploading} className="w-full py-3.5 rounded-full bg-[#0A84FF] text-white font-medium text-sm hover:bg-[#409CFF] active:scale-[0.98] transition disabled:opacity-50 disabled:pointer-events-none">
              {uploading ? 'sending…' : `share ${files.length} file${files.length === 1 ? '' : 's'}`}
            </button>
          </div>

          <div className="lg:col-span-2">
            <p className="text-xs uppercase tracking-wider text-neutral-500 mb-3">discord preview</p>
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#1c1c1e] shadow-2xl sticky top-28">
              <div className="h-1.5" style={{ background: color }} />
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2 text-xs text-neutral-400">
                  <div className="w-5 h-5 rounded-full bg-white/10" />
                  rankvault · lumenbloom
                </div>
                <h3 className="font-semibold text-[15px] leading-snug mb-1">{title || 'untitled lumenbloom'}</h3>
                <p className="text-[13px] text-neutral-400 line-clamp-2">{caption || 'shared from the lumenbloom desk'}</p>
                {files.length > 0 && <p className="text-[11px] text-neutral-500 mt-2">{files.length} file{files.length === 1 ? '' : 's'}</p>}
              </div>
            </div>

            <AnimatePresence>
              {results.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-3">
                  {results.map((r) => (
                    <div key={r.id} className="p-3 rounded-2xl bg-white/[0.04] border border-white/10">
                      <p className="text-xs font-medium truncate mb-2">{r.name}</p>
                      <div className="flex gap-2">
                        <input readOnly value={r.embed} className="flex-1 bg-black/40 rounded-xl px-2 py-1.5 text-[10px] font-mono" />
                        <button onClick={() => copy(r.embed)} className="px-3 py-1.5 rounded-xl bg-white text-black text-xs font-medium hover:bg-neutral-200 active:scale-95">copy</button>
                      </div>
                      <button onClick={() => navigate('s', r.id)} className="mt-1.5 text-[11px] text-[#0A84FF] hover:underline">open →</button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
