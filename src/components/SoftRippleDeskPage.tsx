import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { publishLocalFile, shareUrls } from '../lib/cloudShare';
import Navbar from './Navbar';
import { useRouter } from './Router';

const ACCENTS = ['#0A84FF', '#30D158', '#FF9F0A', '#BF5AF2', '#64D2FF', '#FF453A'];

export default function SoftRippleDeskPage() {
  const { navigate } = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [uploading, setUploading] = useState(false);
  const [warn, setWarn] = useState('');
  const [results, setResults] = useState<{ id: string; name: string; embed: string }[]>([]);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const addRipple = (e: React.MouseEvent | React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const id = Date.now();
    setRipples((r) => [...r, { id, x, y }]);
    setTimeout(() => setRipples((r) => r.filter((rip) => rip.id !== id)), 1400);
  };

  const onSelect = (list: FileList | null) => {
    const arr = Array.from(list || []);
    if (!arr.length) return;
    const next = [...files, ...arr];
    setFiles(next);
    const total = next.reduce((n, f) => n + f.size, 0);
    setWarn(total > 45 * 1024 * 1024 ? 'Large collection. Encoding and upload may feel slow — no hard limit, just patience.' : '');
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
          <p className="text-[#64D2FF] text-sm font-medium tracking-wide mb-3">soft ripple desk</p>
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05] mb-4">
            drop into quiet water.
          </h1>
          <p className="text-neutral-400 text-lg max-w-2xl mb-10 leading-relaxed">
            Files settle as soft glass orbs on a living surface. Each drop sends gentle ripples. Shared with a note, lands in storage and public_shares. Every link unfurls a polished Discord card. Large drops gently warned about possible slowness, never refused. All prior desks remain fully intact.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <motion.div
              onClick={(e) => { addRipple(e); fileRef.current?.click(); }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); addRipple(e); onSelect(e.dataTransfer.files); }}
              whileHover={{ scale: 1.005 }}
              className="rounded-3xl border border-dashed border-white/15 bg-white/[0.03] backdrop-blur-xl p-16 text-center cursor-pointer hover:border-white/25 transition-all relative overflow-hidden min-h-[280px]"
            >
              <AnimatePresence>
                {ripples.map((r) => (
                  <motion.div
                    key={r.id}
                    initial={{ scale: 0, opacity: 0.6 }}
                    animate={{ scale: 4, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.4, ease: [0.2, 0.8, 0.2, 1] }}
                    className="absolute rounded-full border border-white/30 pointer-events-none"
                    style={{
                      left: `${r.x}%`,
                      top: `${r.y}%`,
                      width: 40,
                      height: 40,
                      marginLeft: -20,
                      marginTop: -20,
                      borderColor: accent,
                    }}
                  />
                ))}
              </AnimatePresence>
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="text-6xl mb-4 opacity-80 relative"
              >
                ∼
              </motion.div>
              <p className="font-medium mb-1 relative">drop files or click to browse</p>
              <p className="text-sm text-neutral-500 relative">any type · any size · no hard limits</p>
              <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => onSelect(e.target.files)} />
            </motion.div>

            {warn && (
              <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-amber-300 text-sm text-center">
                {warn}
              </motion.p>
            )}

            <AnimatePresence>
              {files.length > 0 && (
                <div className="flex flex-wrap gap-3 justify-center">
                  {files.map((f, i) => (
                    <motion.div
                      key={f.name + i}
                      initial={{ opacity: 0, scale: 0.7, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.7 }}
                      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
                      className="relative rounded-2xl bg-white/[0.06] border border-white/10 p-3 w-32 backdrop-blur"
                      style={{ boxShadow: `0 0 24px -8px ${accent}55` }}
                    >
                      <p className="text-[10px] font-medium truncate">{f.name}</p>
                      <p className="text-[9px] text-neutral-500 mt-0.5">{(f.size / 1024 / 1024).toFixed(1)} MB</p>
                      <button onClick={() => remove(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white/20 text-[10px] hover:bg-white/40">×</button>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-neutral-500 mb-1.5 block">surface title</span>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="what this surface is called" className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#64D2FF]/50 transition" />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-wider text-neutral-500 mb-1.5 block">shared note</span>
                <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="a note that travels with the ripples" rows={2} className="w-full bg-white/[0.04] border border-white/10 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#64D2FF]/50 transition resize-none" />
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
              {uploading ? 'settling…' : `create ${files.length} share${files.length === 1 ? '' : 's'}`}
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
                  rankvault · soft ripple
                </div>
                <h3 className="font-semibold text-[15px] leading-snug mb-1">{title || 'untitled surface'}</h3>
                <p className="text-[13px] text-neutral-400 line-clamp-2">{caption || 'files shared from the soft ripple desk'}</p>
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
