import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile } from '../lib/cloudShare';

export default function VelvetHorizonPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#BF5AF2');
  const [busy, setBusy] = useState(false);
  const [links, setLinks] = useState<string[]>([]);
  const [warns, setWarns] = useState<string[]>([]);
  const [err, setErr] = useState('');

  const onDrop = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list);
    setFiles(prev => [...prev, ...arr]);
    const big = arr.filter(f => f.size > 40 * 1024 * 1024);
    if (big.length) setWarns(prev => [...prev, ...big.map(f => `${f.name} is large — upload may feel slow. No hard limit.`)]);
  };

  const shareAll = async () => {
    if (!files.length) return setErr('drop at least one local file');
    setBusy(true);
    setErr('');
    setLinks([]);
    try {
      const results = await Promise.all(
        files.map(f =>
          publishLocalFile(f, {
            caption: note.trim() || title.trim() || 'from the velvet horizon',
            color: accent,
            cardTitle: title.trim() || f.name,
            meta: { desk: 'velvethorizon', sharedTitle: title.trim() },
          })
        )
      );
      const ok = results.filter(r => r.ok && r.embed).map(r => r.embed!);
      setLinks(ok);
      if (ok.length < results.length) setErr('some files settled; others slowed');
      setFiles([]);
    } catch (e: any) {
      setErr(e.message || 'something slowed');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#050506]">
      <Navbar />
      <div className="pt-28 pb-32 px-5 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 19 }}
          className="glass rounded-[32px] p-8 md:p-10 shadow-2xl"
        >
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>Velvet Horizon</p>
          <h1 className="text-[32px] font-semibold tracking-tight leading-tight mb-3">A soft line of velvet light.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-8">
            Drop one or many local files. They settle together under a shared title and note, like soft velvet light along the horizon. Each lands in storage and public_shares. Share links unfurl with polished Discord cards. Spring motion, frosted glass, deep navy. Large drops warned, never refused. All prior desks remain fully intact. No traces of boosting.
          </p>

          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Shared title (optional)"
            className="w-full bg-black/20 border border-white/10 rounded-[16px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-3 focus:outline-none focus:border-white/25 transition"
          />
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="A quiet note for the horizon…"
            rows={3}
            className="w-full bg-black/20 border border-white/10 rounded-[16px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-5 resize-none focus:outline-none focus:border-white/25 transition"
          />

          <div className="flex items-center gap-4 mb-6">
            <input type="color" value={accent} onChange={e => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0" />
            <label className="flex-1 text-[14px] text-neutral-300 cursor-pointer border border-dashed border-white/15 rounded-[16px] py-4 px-4 text-center hover:border-white/30 transition">
              {files.length ? `${files.length} file${files.length > 1 ? 's' : ''} ready` : 'Drop or choose local files'}
              <input type="file" multiple className="hidden" onChange={e => onDrop(e.target.files)} />
            </label>
          </div>

          {files.length > 0 && (
            <div className="mb-5 space-y-1.5 text-[13px] text-neutral-400">
              {files.map((f, i) => (
                <div key={i} className="truncate">{f.name} · {(f.size / 1024 / 1024).toFixed(1)} MB</div>
              ))}
            </div>
          )}

          {warns.map((w, i) => <p key={i} className="text-[12px] text-amber-300/90 mb-2">{w}</p>)}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            onClick={shareAll}
            disabled={busy || !files.length}
            className="w-full rounded-[18px] py-4 text-[15px] font-medium text-white disabled:opacity-40 transition shadow-xl"
            style={{ background: accent }}
          >
            {busy ? 'Settling along the horizon…' : 'Share to the horizon'}
          </motion.button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-2">
                {links.map((l, i) => (
                  <a key={i} href={l} className="block text-[13px] break-all" style={{ color: accent }}>{l}</a>
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
