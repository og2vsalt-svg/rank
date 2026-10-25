import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function QuietSanctuaryPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const [accent, setAccent] = useState('#5AC8FA');
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [links, setLinks] = useState<string[]>([]);

  useEffect(() => {
    listPublicShares(12).then(setShares);
  }, []);

  const onDrop = (list: FileList | null) => {
    if (!list) return;
    const arr = Array.from(list);
    setFiles(arr);
    const big = arr.some(f => f.size > 40 * 1024 * 1024);
    setWarn(big ? 'Some files are large. Uploads may feel slow. No hard limit — settle when ready.' : null);
  };

  const settle = async () => {
    if (!files.length && !note.trim()) return;
    setBusy(true);
    setLinks([]);
    const newLinks: string[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: note.trim() || 'settled in the sanctuary',
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'quietsanctuary' },
        });
        if (res.ok && res.embed) newLinks.push(res.embed);
      }
      if (note.trim() && !files.length) {
        // note-only falls to whispers if desired, but keep focused on files
      }
      setLinks(newLinks);
      setFiles([]);
      setNote('');
      const updated = await listPublicShares(12);
      setShares(updated);
    } catch {}
    setBusy(false);
  };

  return (
    <div className="mesh min-h-screen bg-[#0b0b0d]">
      <Navbar />
      <div className="pt-28 pb-20 px-6 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 18 }}
          className="glass rounded-[32px] p-8 md:p-10"
        >
          <p className="text-[13px] font-medium tracking-wide mb-2" style={{ color: accent }}>Quiet Sanctuary</p>
          <h1 className="text-[32px] font-semibold tracking-tight mb-3">A still place for what you carry.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-8">
            Soft floating light for files and notes. Drop local files; they settle into storage and the public_shares table. Every link carries a polished Discord embed. Gentle spring motion, frosted glass. Large files warned only of possible slowness. Prior desks remain intact.
          </p>

          <div
            className="border border-dashed border-white/15 rounded-[24px] p-8 text-center mb-6 transition hover:border-white/25"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onDrop(e.dataTransfer.files); }}
          >
            <p className="text-neutral-300 mb-3">Drop files here, or</p>
            <label className="inline-block px-5 py-2.5 rounded-full text-[14px] font-medium cursor-pointer" style={{ background: accent, color: '#000' }}>
              Choose local files
              <input type="file" multiple className="hidden" onChange={(e) => onDrop(e.target.files)} />
            </label>
            {files.length > 0 && (
              <p className="mt-4 text-[13px] text-neutral-400">{files.length} file{files.length > 1 ? 's' : ''} ready</p>
            )}
          </div>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional shared note…"
            rows={3}
            className="w-full bg-black/20 border border-white/10 rounded-[18px] px-4 py-3 text-[15px] mb-4 resize-none focus:outline-none focus:border-white/20"
          />

          <div className="flex items-center gap-4 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer" />
            <span className="text-[13px] text-neutral-400">Accent color</span>
          </div>

          {warn && <p className="text-[12px] text-amber-300/80 mb-4">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.015 }}
            onClick={settle}
            disabled={busy || (!files.length && !note.trim())}
            className="w-full rounded-[18px] py-3.5 text-[15px] font-medium text-black disabled:opacity-40"
            style={{ background: accent }}
          >
            {busy ? 'Settling into sanctuary…' : 'Settle files'}
          </motion.button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-6 space-y-2">
                {links.map((l) => (
                  <a key={l} href={l} className="block text-[13px] break-all" style={{ color: accent }}>{l}</a>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2">
          {shares.map((s, i) => (
            <motion.a
              key={s.id}
              href={`/s/${s.id}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 90, damping: 16 }}
              whileHover={{ y: -4 }}
              className="glass rounded-[22px] p-5 block"
            >
              <p className="text-[15px] font-medium truncate">{s.name || 'shared light'}</p>
              <p className="text-[12px] text-neutral-500 mt-1">{s.caption || 'quiet sanctuary'}</p>
              <p className="text-[11px] text-neutral-600 mt-2">{(s.size / 1024 / 1024).toFixed(1)} MB</p>
            </motion.a>
          ))}
        </div>
      </div>
    </div>
  );
}
