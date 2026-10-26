import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import { publishLocalFile, listPublicShares, type CloudMeta } from '../lib/cloudShare';

export default function SoftFileGrovePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [accent, setAccent] = useState('#34C759');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState<string | null>(null);
  const [shares, setShares] = useState<CloudMeta[]>([]);
  const [links, setLinks] = useState<string[]>([]);
  const [err, setErr] = useState('');

  const refresh = useCallback(async () => {
    const list = await listPublicShares(12);
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
    if (!files.length) return setErr('drop at least one file');
    setBusy(true);
    setErr('');
    setLinks([]);
    const newLinks: string[] = [];
    try {
      for (const file of files) {
        const res = await publishLocalFile(file, {
          caption: note.trim() || 'from the soft file grove',
          color: accent,
          cardTitle: file.name,
          meta: { desk: 'softfilegrove' },
        });
        if (res.ok && res.embed) newLinks.push(res.embed);
        else if (!res.ok) setErr(res.error || 'one upload slowed');
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
          <p className="text-[13px] font-medium tracking-wide mb-1" style={{ color: accent }}>Soft File Grove</p>
          <h1 className="text-[32px] font-semibold tracking-tight mb-3 leading-tight">A quiet grove for shared files.</h1>
          <p className="text-neutral-400 text-[15px] leading-relaxed mb-8">
            Drop local files into the grove. They settle as soft cards that gently breathe in your accent color. Each uploads to storage and the public_shares table. Share links carry polished Discord embeds. Soft spring motion, frosted glass. Large files receive only a gentle warning of slowness. Prior desks remain intact. No traces of boosting.
          </p>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="border-2 border-dashed border-white/15 rounded-[24px] p-8 text-center mb-6 bg-black/20 hover:border-white/25 transition"
          >
            <p className="text-neutral-300 text-[15px] mb-2">Drop files here or</p>
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

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional shared note…"
            rows={2}
            className="w-full bg-black/20 border border-white/10 rounded-[18px] px-4 py-3 text-[15px] text-white placeholder:text-neutral-500 mb-5 resize-none focus:outline-none focus:border-white/20 transition"
          />

          <div className="flex items-center gap-4 mb-6">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-10 h-10 rounded-full cursor-pointer border-0 bg-transparent" />
            <span className="text-[13px] text-neutral-400">Accent color</span>
          </div>

          {warn && <p className="text-[13px] text-amber-300/90 mb-4">{warn}</p>}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.015 }}
            onClick={publish}
            disabled={busy || !files.length}
            className="w-full rounded-[20px] py-4 text-[16px] font-medium text-white disabled:opacity-40 transition shadow-lg"
            style={{ background: accent }}
          >
            {busy ? 'Settling into the grove…' : 'Publish to grove'}
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

        <div className="mt-16 grid gap-4 sm:grid-cols-2">
          {shares.map((s, i) => (
            <motion.a
              key={s.id}
              href={`/s/${s.id}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, type: 'spring', stiffness: 90, damping: 16 }}
              whileHover={{ y: -2, scale: 1.01 }}
              className="glass rounded-[24px] p-5 block"
            >
              <div className="h-2 w-12 rounded-full mb-3" style={{ background: s.color || accent }} />
              <p className="text-[15px] font-medium text-neutral-100 truncate">{s.name}</p>
              <p className="text-[12px] text-neutral-500 mt-1">{s.caption || 'quiet share'}</p>
              <p className="text-[11px] text-neutral-600 mt-2">{(s.size / 1024).toFixed(0)} KB</p>
            </motion.a>
          ))}
        </div>
      </div>
    </div>
  );
}
