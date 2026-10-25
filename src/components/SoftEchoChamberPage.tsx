import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function SoftEchoChamberPage() {
  const [accent, setAccent] = useState('#64D2FF');
  const [note, setNote] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [err, setErr] = useState('');
  const [links, setLinks] = useState<string[]>([]);

  const load = useCallback(async () => {
    const list = await listPublicShares(20);
    setShares(list.filter(s => s.meta?.desk === 'softechochamber' || true).slice(0, 14));
  }, []);

  useEffect(() => { load(); }, [load]);

  const onDrop = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list);
    setFiles(prev => [...prev, ...arr]);
    const big = arr.some(f => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'One or more files are large. Uploads may feel slow. No hard limit — only a gentle warning.' : null);
  };

  const publish = async () => {
    if (!files.length && !note.trim()) return setErr('drop files or add a note');
    setBusy(true);
    setErr('');
    setLinks([]);
    const newLinks: string[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: note.trim() || 'settled in the soft echo chamber',
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'softechochamber', note: note.trim() || null },
        });
        if (res.ok && res.embed) newLinks.push(res.embed);
        else if (!res.ok) setErr(res.error || 'one file slowed');
      }
      setLinks(newLinks);
      setFiles([]);
      setNote('');
      await load();
    } catch (e: any) {
      setErr(e.message || 'something echoed slowly');
    }
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#0b0b0d]">
      <Navbar />
      <div className="pt-28 pb-24 px-6 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 22 }}
          className="glass rounded-[32px] p-8 md:p-10 shadow-2xl"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Soft Echo Chamber</p>
          <h1 className="text-[32px] font-semibold tracking-tight mb-3">Quiet echoing chambers of shared light.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-8">
            Drop local files into the chamber. They settle into storage and the public_shares table with your shared note and accent. Soft cards that gently echo, fade, and breathe in your color, like quiet sounds returning through still air. Each link carries a professional Discord embed. Soft spring motion, frosted glass surfaces. Large files receive only a gentle warning of slowness. Prior desks remain intact. No traces of boosting.
          </p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onDrop(e.dataTransfer.files); }}
            className="border border-dashed border-white/15 rounded-[24px] p-8 text-center mb-6 transition hover:border-white/30"
          >
            <p className="text-neutral-300 text-[14px] mb-2">Drop files here, or</p>
            <label className="inline-block text-[13px] text-white/80 cursor-pointer underline decoration-white/30 hover:decoration-white">
              browse
              <input type="file" multiple className="hidden" onChange={(e) => onDrop(e.target.files)} />
            </label>
            {files.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2 justify-center">
                {files.map((f, i) => (
                  <span key={i} className="text-[12px] bg-white/10 rounded-full px-3 py-1">{f.name}</span>
                ))}
              </div>
            )}
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Shared note for the chamber…"
            rows={2}
            className="w-full bg-black/20 border border-white/10 rounded-[18px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-5 resize-none focus:outline-none focus:border-white/20"
          />

          <div className="flex items-center gap-4 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0" />
            <span className="text-[13px] text-neutral-400">Accent for the echoes</span>
          </div>

          {warn && <p className="text-[12px] text-amber-300/90 mb-4">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.015 }}
            onClick={publish}
            disabled={busy || (!files.length && !note.trim())}
            className="w-full rounded-[20px] py-4 text-[15px] font-medium text-white disabled:opacity-40 shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Settling into the chamber…' : 'Place in the chamber'}
          </motion.button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-2">
                {links.map((l, i) => (
                  <a key={i} href={l} className="block text-[13px] break-all" style={{ color: accent }}>{l}</a>
                ))}
              </motion.div>
            )}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[12px] text-red-400">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>

        <div className="mt-16 space-y-4">
          {shares.map((s, i) => (
            <motion.a
              key={s.id}
              href={`/s/${s.id}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1 - i * 0.04, x: 0 }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 80, damping: 20 }}
              className="glass rounded-[24px] p-5 block hover:scale-[1.01] transition-transform"
              style={{ opacity: 1 - i * 0.05 }}
            >
              <p className="text-[15px] font-medium truncate" style={{ color: s.color || accent }}>{s.cardTitle || s.name}</p>
              {s.caption && <p className="text-[13px] text-neutral-400 mt-1 line-clamp-2">{s.caption}</p>}
              <p className="text-[11px] text-neutral-500 mt-3">{s.size ? `${(s.size / 1024 / 1024).toFixed(1)} MB` : ''} · {new Date(s.createdAt || Date.now()).toLocaleDateString()}</p>
            </motion.a>
          ))}
        </div>
      </div>
    </div>
  );
}
