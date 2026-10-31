import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function SoftLumenDawnPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#FF9500');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [results, setResults] = useState<{ name: string; embed: string }[]>([]);

  const onSelect = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list);
    setFiles((prev) => [...prev, ...arr]);
    const total = [...files, ...arr].reduce((n, f) => n + f.size, 0);
    setWarn(total > 45 * 1024 * 1024 ? 'The dawn is bright with large files. Settling may feel slow. No hard limit — only a gentle note.' : null);
  };

  const share = async () => {
    if (!files.length) return setErr('add at least one local file');
    setBusy(true);
    setErr('');
    setResults([]);
    const out: { name: string; embed: string }[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: caption.trim() || title.trim() || 'from the quiet dawn',
          color: accent,
          cardTitle: title.trim() || file.name,
          meta: { desk: 'softlumendawn' },
        });
        if (res.ok && res.embed) out.push({ name: file.name, embed: res.embed });
        else if (!res.ok) setErr(res.error || 'a file could not settle');
      }
      setResults(out);
      setFiles([]);
    } catch (e: any) {
      setErr(e.message || 'the dawn slowed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#0b0b0d] relative overflow-hidden">
      <Navbar />
      {/* soft dawn beams */}
      <div className="pointer-events-none absolute inset-0">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute left-0 right-0 h-48 blur-2xl opacity-25"
            style={{
              background: `linear-gradient(to right, transparent, ${accent}aa, transparent)`,
              bottom: `${i * 20}%`,
            }}
            animate={{
              x: [0, 50, -30, 40, 0],
              opacity: [0.18, 0.32, 0.22, 0.28, 0.18],
            }}
            transition={{
              duration: 11 + i * 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      <div className="relative pt-32 pb-24 px-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 20 }}
          className="glass rounded-[32px] p-8 md:p-10 shadow-2xl border border-white/10"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Soft Lumen Dawn</p>
          <h1 className="text-[32px] font-semibold tracking-tight mb-3 text-white">Files rest at the quiet dawn.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-8">
            Drop one or many local files. Share a title and caption. Soft beams of light rise and breathe in your accent color, like the first glow of day settling across quiet water. Files land in storage and the public_shares table. Every link carries a professional Discord embed. Large files receive only a gentle warning of slowness. All prior desks remain fully intact. No traces of boosting.
          </p>

          <div className="space-y-4 mb-6">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Shared title (optional)"
              className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 focus:outline-none focus:border-white/25 transition"
            />
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Quiet caption for the dawn…"
              rows={3}
              className="w-full bg-black/30 border border-white/10 rounded-2xl px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 resize-none focus:outline-none focus:border-white/25 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border border-white/20" />
            <label
              onClick={() => fileRef.current?.click()}
              className="flex-1 min-w-[200px] cursor-pointer rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-3 text-[14px] text-neutral-300 hover:bg-white/10 hover:border-white/30 transition text-center"
            >
              {files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready` : 'Drop or choose local files'}
            </label>
            <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => onSelect(e.target.files)} />
          </div>

          {files.length > 0 && (
            <ul className="mb-6 space-y-1.5 text-[13px] text-neutral-400 max-h-32 overflow-y-auto">
              {files.map((f, i) => (
                <li key={i} className="truncate flex justify-between">
                  <span>{f.name}</span>
                  <span className="text-neutral-600">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                </li>
              ))}
            </ul>
          )}

          {warn && <p className="text-[12px] text-amber-300/90 mb-4">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.01 }}
            onClick={share}
            disabled={busy || !files.length}
            className="w-full rounded-2xl py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ background: accent }}
          >
            {busy ? 'Settling into the dawn…' : 'Share into the dawn'}
          </motion.button>

          <AnimatePresence>
            {results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6 space-y-2"
              >
                {results.map((r, i) => (
                  <motion.a
                    key={i}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    href={r.embed}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-[13px] break-all hover:underline"
                    style={{ color: accent }}
                  >
                    {r.name} — {r.embed}
                  </motion.a>
                ))}
              </motion.div>
            )}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[12px] text-red-400">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
