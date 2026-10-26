import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function SoftQuietLedgerPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [accent, setAccent] = useState('#64D2FF');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const [err, setErr] = useState('');

  const refresh = useCallback(async () => {
    const list = await listPublicShares(20);
    setShares(list);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    setFiles((prev) => [...prev, ...dropped]);
    const large = dropped.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(large ? 'Some files are large. Uploads may feel slow. No hard limits.' : null);
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selected]);
    const large = selected.some((f) => f.size > 40 * 1024 * 1024);
    setWarn(large ? 'Some files are large. Uploads may feel slow. No hard limits.' : null);
  };

  const publish = async () => {
    if (!note.trim() && !files.length) return setErr('enter a note or drop a file');
    setBusy(true);
    setErr('');
    setLinks([]);
    const newLinks: string[] = [];
    try {
      if (files.length) {
        for (const file of files) {
          const res = await publishLocalFile(file, {
            caption: note.trim() || 'entered in the soft quiet ledger',
            color: accent,
            cardTitle: file.name,
            meta: { desk: 'softquietledger' },
          });
          if (res.ok && res.embed) newLinks.push(res.embed);
          else if (!res.ok) setErr(res.error || 'one entry slowed');
        }
      } else if (note.trim()) {
        const blob = new Blob([note], { type: 'text/plain' });
        const file = new File([blob], 'ledger-note.txt', { type: 'text/plain' });
        const res = await publishLocalFile(file, {
          caption: note.trim(),
          color: accent,
          cardTitle: 'Ledger Note',
          meta: { desk: 'softquietledger', kind: 'note' },
        });
        if (res.ok && res.embed) newLinks.push(res.embed);
        else if (!res.ok) setErr(res.error || 'note slowed');
      }
      setLinks(newLinks);
      setFiles([]);
      setNote('');
      await refresh();
    } catch (e: any) {
      setErr(e.message || 'something slowed');
    }
    setBusy(false);
  };

  const sorted = useMemo(() => [...shares].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')), [shares]);

  return (
    <div className="mesh min-h-screen bg-[#0b0b0d]">
      <Navbar />
      <div className="pt-32 pb-24 px-6 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 110, damping: 22 }}
          className="glass rounded-[32px] p-8 md:p-10 shadow-2xl"
        >
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Soft Quiet Ledger</p>
          <h1 className="text-[32px] font-semibold tracking-tight mb-3 leading-tight">A still ledger of shared light.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-8">
            Enter notes and optional local files into a chronological ledger. Soft entry cards settle by date in your accent. Files (or note-as-text) upload to storage and public_shares. Share links carry polished Discord embeds. Soft spring motion, frosted glass. Large files receive only a gentle warning of slowness. Prior desks remain intact. No traces of boosting.
          </p>

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ledger entry…"
            rows={4}
            className="w-full bg-black/20 border border-white/10 rounded-[18px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-5 resize-none focus:outline-none focus:border-white/20 transition"
          />

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="border-2 border-dashed border-white/15 rounded-[24px] p-6 text-center mb-6 bg-black/20 hover:border-white/25 transition"
          >
            <p className="text-neutral-300 text-[14px] mb-2">Optional: drop files or</p>
            <label className="inline-block px-5 py-2.5 rounded-full text-[14px] font-medium cursor-pointer" style={{ background: accent, color: '#000' }}>
              Choose files
              <input type="file" multiple className="hidden" onChange={onFile} />
            </label>
            {files.length > 0 && (
              <div className="mt-4 text-left text-[13px] text-neutral-400 space-y-1">
                {files.map((f, i) => <div key={i}>{f.name} ({(f.size / 1024 / 1024).toFixed(1)} MB)</div>)}
              </div>
            )}
          </div>

          <div className="flex items-center gap-4 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0 bg-transparent" />
            <span className="text-[13px] text-neutral-400">Accent color</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/90 mb-4">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.015 }}
            onClick={publish}
            disabled={busy || (!note.trim() && !files.length)}
            className="w-full rounded-[20px] py-4 text-[16px] font-medium text-white disabled:opacity-40 transition shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Entering the ledger…' : 'Enter into ledger'}
          </motion.button>

          <AnimatePresence>
            {links.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-2">
                {links.map((l) => (
                  <a key={l} href={l} className="block text-[13px] break-all" style={{ color: accent }}>{l}</a>
                ))}
              </motion.div>
            )}
            {err && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[13px] text-red-400">{err}</motion.p>}
          </AnimatePresence>
        </motion.div>

        <div className="mt-16 space-y-3">
          {sorted.slice(0, 12).map((s, i) => (
            <motion.a
              key={s.id}
              href={`/s/${s.id}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03, type: 'spring', stiffness: 100, damping: 18 }}
              whileHover={{ x: 2 }}
              className="glass rounded-[20px] p-5 flex items-center gap-4 block"
            >
              <div className="w-1.5 h-10 rounded-full flex-shrink-0" style={{ background: s.color || accent }} />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-medium text-neutral-100 truncate">{s.name}</p>
                <p className="text-[12px] text-neutral-500 mt-0.5 truncate">{s.caption || 'quiet entry'}</p>
              </div>
              <div className="text-right text-[11px] text-neutral-600 flex-shrink-0">
                <div>{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ''}</div>
                <div>{(s.size / 1024).toFixed(0)} KB</div>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </div>
  );
}
