import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function SolsticeDeskPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [accent, setAccent] = useState('#FF9500');
  const [busy, setBusy] = useState(false);
  const [links, setLinks] = useState<string[]>([]);
  const [warns, setWarns] = useState<string[]>([]);
  const [err, setErr] = useState('');

  const onDrop = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list);
    setFiles((f) => [...f, ...arr]);
    const big = arr.filter((f) => f.size > 40 * 1024 * 1024);
    if (big.length) setWarns((w) => [...w, ...big.map((f) => `${f.name} is large — upload may feel slow. No hard limit.`)]);
  };

  const publish = async () => {
    if (!files.length) return setErr('drop at least one local file');
    setBusy(true);
    setErr('');
    setLinks([]);
    try {
      const results: string[] = [];
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: caption.trim() || title.trim() || 'from the solstice desk',
          color: accent,
          cardTitle: title.trim() || file.name,
          meta: { desk: 'solstice', season: 'quiet light' },
        });
        if (res.ok && res.embed) results.push(res.embed);
        else if (!res.ok) setErr(res.error || 'one file slowed');
      }
      setLinks(results);
      setFiles([]);
    } catch (e: any) {
      setErr(e.message || 'something slowed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#0b0b0d]">
      <Navbar />
      <div className="pt-32 pb-24 px-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          className="glass rounded-[32px] p-8 shadow-2xl relative overflow-hidden"
        >
          <motion.div
            className="absolute -top-20 -right-20 w-48 h-48 rounded-full opacity-30 blur-3xl"
            style={{ background: accent }}
            animate={{ scale: [1, 1.08, 1], opacity: [0.2, 0.35, 0.2] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Solstice Desk</p>
          <h1 className="text-[30px] font-semibold tracking-tight mb-3">Files that turn with the light.</h1>
          <p className="text-neutral-400 text-[14px] leading-relaxed mb-6">
            Drop several local files. They settle under one shared title and caption with sequential springs. Each becomes its own permanent Discord-ready link. Soft size warnings only. Apple-style frosted glass. Prior desks remain untouched.
          </p>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Shared title"
            className="w-full bg-black/20 border border-white/10 rounded-[16px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-3 focus:outline-none focus:border-white/20"
          />
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Quiet caption for every share…"
            rows={3}
            className="w-full bg-black/20 border border-white/10 rounded-[16px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-4 resize-none focus:outline-none focus:border-white/20"
          />

          <div className="flex items-center gap-4 mb-5">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0" />
            <label className="flex-1 text-[13px] text-neutral-300 cursor-pointer border border-dashed border-white/15 rounded-[16px] py-4 text-center hover:border-white/30 transition">
              {files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready` : 'Drop or choose local files'}
              <input type="file" multiple className="hidden" onChange={(e) => onDrop(e.target.files)} />
            </label>
          </div>

          {warns.map((w, i) => (
            <p key={i} className="text-[12px] text-amber-300/90 mb-1">{w}</p>
          ))}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            onClick={publish}
            disabled={busy || !files.length}
            className="w-full rounded-[18px] py-3.5 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Turning…' : 'Publish solstice shares'}
          </motion.button>

          <AnimatePresence>
            {links.map((l, i) => (
              <motion.a
                key={l}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 120, damping: 18 }}
                href={l}
                className="block mt-4 text-[13px] break-all"
                style={{ color: accent }}
              >
                {l}
              </motion.a>
            ))}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[12px] text-red-400">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
