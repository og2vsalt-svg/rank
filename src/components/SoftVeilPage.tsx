import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function SoftVeilPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#0A84FF');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);

  useEffect(() => {
    const total = files.reduce((s, f) => s + f.size, 0);
    setWarn(total > 80 * 1024 * 1024 ? 'These files are substantial. Uploads may feel slow. No hard limits.' : null);
  }, [files]);

  const onDrop = (list: FileList | null) => {
    if (!list) return;
    const next = Array.from(list);
    setFiles((prev) => [...prev, ...next].slice(0, 12));
  };

  const publish = async () => {
    if (!files.length) return setErr('drop at least one local file');
    setBusy(true);
    setErr('');
    setLinks([]);
    const made: string[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: caption.trim() || title.trim() || 'from the soft veil',
          color: accent,
          cardTitle: title.trim() || file.name,
          meta: { desk: 'softveil' },
        });
        if (res.ok && res.embed) made.push(res.embed);
        else if (!res.ok) setErr(res.error || 'one file slowed');
      }
      setLinks(made);
      setFiles([]);
      setTitle('');
      setCaption('');
    } catch (e: any) {
      setErr(e.message || 'something slowed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#0b0b0d] relative overflow-hidden">
      <Navbar />
      <div className="pt-28 pb-32 px-6 max-w-2xl mx-auto relative">
        {/* soft veil sweep */}
        <motion.div
          className="absolute inset-x-0 top-1/3 h-32 pointer-events-none blur-2xl opacity-20"
          style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)` }}
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 22 }}
          className="glass relative z-10 rounded-[32px] p-10 shadow-2xl border border-white/10"
        >
          <p className="text-[13px] font-medium tracking-[0.08em] mb-2" style={{ color: accent }}>Soft Veil</p>
          <h1 className="text-[32px] font-semibold tracking-tight mb-3 text-white">Under a gentle veil.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-8">
            Drop one or many local files with a shared title, caption, and accent light. A soft light veil sweeps across frosted glass with spring motion. Files land in storage and the public_shares table. Share links unfurl with polished Discord cards. Large files receive only a gentle warning of slowness. Prior desks remain intact. No traces of boosting.
          </p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onDrop(e.dataTransfer.files); }}
            className="border border-dashed border-white/15 rounded-[24px] p-8 text-center mb-6 hover:border-white/25 transition cursor-pointer"
            onClick={() => (document.getElementById('veil-input') as HTMLInputElement)?.click()}
          >
            <input
              id="veil-input"
              type="file"
              multiple
              className="hidden"
              onChange={(e) => onDrop(e.target.files)}
            />
            <p className="text-[15px] text-neutral-300">
              {files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready` : 'Drop files or click to choose'}
            </p>
            {files.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {files.map((f, i) => (
                  <span key={i} className="text-[12px] px-3 py-1 rounded-full bg-white/10 text-neutral-200">
                    {f.name.slice(0, 24)}
                  </span>
                ))}
              </div>
            )}
          </div>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Shared title (optional)"
            className="w-full bg-black/20 border border-white/10 rounded-[16px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-3 focus:outline-none focus:border-white/20"
          />
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="A quiet caption…"
            rows={3}
            className="w-full bg-black/20 border border-white/10 rounded-[16px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-5 resize-none focus:outline-none focus:border-white/20"
          />

          <div className="flex items-center gap-4 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-400">Accent light</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/90 mb-4">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.01 }}
            onClick={publish}
            disabled={busy || !files.length}
            className="w-full rounded-[18px] py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ background: accent }}
          >
            {busy ? 'Settling under the veil…' : 'Share from the veil'}
          </motion.button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 space-y-2"
              >
                {links.map((l) => (
                  <a key={l} href={l} className="block text-[13px] break-all" style={{ color: accent }}>
                    {l}
                  </a>
                ))}
              </motion.div>
            )}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[13px] text-red-400">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
