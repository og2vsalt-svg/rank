import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function HorizonWeavePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#64D2FF');
  const [busy, setBusy] = useState(false);
  const [links, setLinks] = useState<string[]>([]);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');

  const onFiles = (list: FileList | null) => {
    const arr = Array.from(list || []);
    setFiles(arr);
    const big = arr.some(f => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'Large files along the horizon. Upload may feel slow. No hard limit.' : null);
  };

  const share = async () => {
    if (!files.length) return setErr('choose one or more local files');
    setBusy(true);
    setErr('');
    setLinks([]);
    const results: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await publishLocalFile(file, {
          caption: caption.trim() || 'woven along the horizon',
          color: accent,
          cardTitle: title.trim() || file.name,
          meta: { desk: 'horizonweave', index: i },
        });
        if (res.ok && res.embed) results.push(res.embed);
        else setErr(res.error || 'one weave slowed');
      }
      setLinks(results);
    } catch (e: any) {
      setErr(e.message || 'something slowed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen">
      <Navbar />
      <div className="pt-32 pb-24 px-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 105, damping: 21 }}
          className="glass rounded-[32px] p-8 shadow-2xl"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Horizon Weave</p>
          <h1 className="text-[28px] font-semibold tracking-tight mb-3">Files settle along a quiet light line.</h1>
          <p className="text-neutral-400 text-[14px] leading-relaxed mb-6">
            Drop several local files. Shape a shared title, caption, and cool horizon accent. They weave with staggered Apple-style springs. Each becomes its own permanent Discord-ready link. Soft size warnings only. No hard limits.
          </p>

          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Shared title" className="w-full bg-black/20 border border-white/10 rounded-[16px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-3 focus:outline-none focus:border-white/20" />
          <textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Shared caption…" rows={2} className="w-full bg-black/20 border border-white/10 rounded-[16px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-4 resize-none focus:outline-none focus:border-white/20" />

          <div className="flex items-center gap-4 mb-5">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-9 h-9 rounded-full cursor-pointer border-0" />
            <label className="text-[13px] text-neutral-300 cursor-pointer hover:text-white transition">
              {files.length ? `${files.length} file${files.length > 1 ? 's' : ''}` : 'Choose local files'}
              <input type="file" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
            </label>
          </div>

          {warn && <p className="text-[12px] text-amber-300/90 mb-3">{warn}</p>}

          <motion.button whileTap={{ scale: 0.96 }} whileHover={{ scale: 1.02 }} onClick={share} disabled={busy || !files.length} className="w-full rounded-[18px] py-3.5 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-lg" style={{ background: accent }}>
            {busy ? 'Weaving…' : 'Share the horizon'}
          </motion.button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-2">
                {links.map((link) => (
                  <motion.a key={link} href={link} className="block text-[13px] break-all" style={{ color: accent }}>{link}</motion.a>
                ))}
              </motion.div>
            )}
            {err && <motion.p className="mt-4 text-[12px] text-red-400">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
