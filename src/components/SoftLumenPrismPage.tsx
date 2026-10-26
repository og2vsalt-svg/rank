import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

type Shared = { id: string; name: string; url: string; embed: string; color: string };

export default function SoftLumenPrismPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#5EEAD4');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [shares, setShares] = useState<Shared[]>([]);

  const onDrop = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list);
    setFiles((prev) => [...prev, ...arr]);
    const big = arr.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'Some files are large. The upload may feel slow. No hard limit — only a gentle warning.' : null);
  };

  const shareAll = async () => {
    if (!files.length) return setErr('drop at least one local file');
    setBusy(true);
    setErr('');
    const next: Shared[] = [];
    for (const file of files) {
      const res = await publishLocalFile(file, {
        caption: note.trim() || 'from the softlumenprism',
        color: accent,
        cardTitle: file.name,
        meta: { desk: 'softlumenprism' },
      });
      if (res.ok && res.embed && res.id) {
        next.push({ id: res.id, name: file.name, url: res.url || '', embed: res.embed, color: accent });
      } else {
        setErr(res.error || 'one file slowed');
      }
    }
    setShares((prev) => [...next, ...prev]);
    setFiles([]);
    setNote('');
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#0b0b0d]">
      <Navbar />
      <div className="pt-32 pb-24 px-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          className="glass rounded-[32px] p-8 sm:p-10 shadow-2xl"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>softlumenprism</p>
          <h1 className="text-[32px] font-semibold tracking-tight mb-3">A quiet prism of shared light.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-8">
            Drop multiple local files. They settle into a refracting prism in your accent color, like light finding facets in still glass. Each uploads to storage and the public_shares table. Share links carry polished Discord embeds. Soft spring motion, frosted glass. Large files receive only a gentle warning of slowness. Prior desks remain intact. No traces of boosting.
          </p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onDrop(e.dataTransfer.files); }}
            className="border-2 border-dashed border-white/15 rounded-[24px] p-10 text-center mb-6 hover:border-white/25 transition cursor-pointer"
            onClick={() => document.getElementById('prism-input')?.click()}
          >
            <p className="text-neutral-300 text-[15px]">Drop files here or click to choose</p>
            <p className="text-neutral-500 text-[12px] mt-1">multiple allowed · local only</p>
            <input id="prism-input" type="file" multiple className="hidden" onChange={(e) => onDrop(e.target.files)} />
          </div>

          {files.length > 0 && (
            <div className="mb-5 space-y-1 text-[13px] text-neutral-300">
              {files.map((f, i) => <div key={i} className="truncate">{f.name}</div>)}
            </div>
          )}

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Shared note for all (optional)"
            rows={2}
            className="w-full bg-black/20 border border-white/10 rounded-[18px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-4 resize-none focus:outline-none focus:border-white/20 transition"
          />

          <div className="flex items-center gap-4 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-400">accent color</span>
          </div>

          {warn && <p className="text-[12px] text-amber-300/90 mb-4">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.015 }}
            onClick={shareAll}
            disabled={busy || !files.length}
            className="w-full rounded-[20px] py-4 text-[15px] font-medium text-black disabled:opacity-40 transition shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Settling into the prism…' : 'Share into the prism'}
          </motion.button>

          {err && <p className="mt-4 text-[12px] text-red-400">{err}</p>}
        </motion.div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <AnimatePresence>
            {shares.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, scale: 0.94, rotate: -1 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 120, damping: 16, delay: i * 0.04 }}
                className="glass rounded-[22px] p-5 relative overflow-hidden"
              >
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: `linear-gradient(135deg, ${s.color}, transparent 60%)` }} />
                <p className="text-[14px] font-medium truncate relative z-10">{s.name}</p>
                <a href={s.embed} className="block mt-3 text-[12px] break-all relative z-10" style={{ color: s.color }}>{s.embed}</a>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
