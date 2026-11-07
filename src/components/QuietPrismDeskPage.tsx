import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import Navbar from './Navbar';
import { useRouter } from './Router';

const ACCENTS = ['#0A84FF', '#30D158', '#FF9F0A', '#BF5AF2', '#64D2FF', '#FF453A'];

export default function QuietPrismDeskPage() {
  const { navigate } = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [uploading, setUploading] = useState(false);
  const [warn, setWarn] = useState('');
  const [results, setResults] = useState<{ id: string; name: string; embed: string }[]>([]);

  const onSelect = (list: FileList | null) => {
    const arr = Array.from(list || []);
    if (!arr.length) return;
    const next = [...files, ...arr];
    setFiles(next);
    const total = next.reduce((n, f) => n + f.size, 0);
    setWarn(total > 50 * 1024 * 1024 ? 'Large collection. Encoding and upload may feel slow — no hard limit, just patience.' : '');
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
        color: accent,
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

  return (
    <div className="mesh min-h-screen text-white">
      <Navbar />
      <div className="pt-28 pb-20 px-5 sm:px-8 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        >
          <p className="text-[#64D2FF] text-sm font-medium tracking-wide mb-3">quiet prism desk</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05] mb-4">
            refract what you carry.
          </h1>
          <p className="text-neutral-400 text-lg max-w-2xl mb-10 leading-relaxed">
            Drop local files into a quiet prism. Soft refractive tiles settle with spring motion. Each lands in the database with a polished Discord embed. Large drops gently warned about possible slowness, never refused. All prior desks remain fully intact.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <motion.div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); onSelect(e.dataTransfer.files); }}
              whileHover={{ scale: 1.005 }}
              className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] backdrop-blur-xl p-12 text-center cursor-pointer hover:border-white/25 transition-all"
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                className="text-6xl mb-4 opacity-80"
              >
                ◇
              </motion.div>
              <p className="font-medium mb-1">drop files or click to browse</p>
              <p className="text-sm text-neutral-500">any type · any size · no hard limits</p>
              <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => onSelect(e.target.files)} />
            </motion.div>

            {warn && (
              <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-amber-300 text-sm text-center">
                {warn}
              </motion.p>
            )}

            <AnimatePresence>
              {files.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {files.map((f, i) => (
                    <motion.div
                      key={f.name + i}
                      initial={{ opacity: 0, scale: 0.92, y: 12 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                      className="rounded-2xl bg-white/[0.04] border border-white/10 p-3 relative group overflow-hidden"
                      style={{ boxShadow: `0 0 40px -20px ${accent}55` }}
                    >
                      <div className="absolute inset-0 opacity-20" style={{ background: `linear-gradient(135deg, ${accent}22, transparent)` }} />
                      <p className="text-xs font-medium truncate pr-6 relative">{f.name}</p>
                      <p className="text-[10px] text-neutral-500 mt-1 relative">{(f.size / 1024 / 1024).toFixed(1)} MB</p>
                      <button onClick={() => remove(i)} className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white/10 text-xs opacity-0 group-hover:opacity-100 transition">×</button>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-neutral-500 mb-1.5 block">prism title</span>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="what this refraction is called" className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#64D2FF]/50 transition" />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-neutral-500 mb-1.5 block">shared caption</span>
                <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="a note that travels with the light" rows={2} className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#64D2FF]/50 transition resize-none" />
              </label>
              <div>
                <span className="text-xs uppercase tracking-wider text-neutral-500 mb-2 block">accent</span>
                <div className="flex gap-2 flex-wrap">
                  {ACCENTS.map((c) => (
                    <button key={c} onClick={() => setAccent(c)} className={`w-8 h-8 rounded-full transition-all ${accent === c ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110' : 'hover:scale-105'}`} style={{ background: c }} />
                  ))}
                </div>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={shareAll}
              disabled={!files.length || uploading}
              className="w-full py-3.5 rounded-full bg-[#0A84FF] text-white font-medium text-sm hover:bg-[#409CFF] transition disabled:opacity-50 disabled:pointer-events-none"
            >
              {uploading ? 'refracting…' : `create ${files.length} share${files.length === 1 ? '' : 's'}`}
            </motion.button>
          </div>

          <div className="lg:col-span-2">
            <p className="text-xs uppercase tracking-wider text-neutral-500 mb-3">discord preview</p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl overflow-hidden border border-white/10 bg-[#1c1c1e] shadow-2xl sticky top-28"
            >
              <div className="h-1.5" style={{ background: accent }} />
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2 text-xs text-neutral-400">
                  <div className="w-5 h-5 rounded-full bg-white/10" />
                  rankvault · quiet prism
                </div>
                <h3 className="font-semibold text-[15px] leading-snug mb-1">{title || 'untitled refraction'}</h3>
                <p className="text-[13px] text-neutral-400 line-clamp-2">{caption || 'files shared from the quiet prism desk'}</p>
                {files.length > 0 && <p className="text-[11px] text-neutral-500 mt-2">{files.length} file{files.length === 1 ? '' : 's'}</p>}
              </div>
            </motion.div>

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
                      <button onClick={() => navigate('s', r.id)} className="mt-1.5 text-[11px] text-[#64D2FF] hover:underline">open →</button>
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
